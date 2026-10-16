#!/usr/bin/env bash
# =============================================================================================
#  studio_render.sh — the full studio render loop for THE SINGULARITY ENGINE
#
#    audio  →  HyperFrames plate (lint · seam gate · render)  →  Remotion gates (tsc · compositions)
#    →  frame-sequence render  →  per-frame 1–10 scoring  →  (targeted re-render of < 8 ranges)
#    →  FFmpeg assembly  →  ffprobe + full-decode + loudness verification
#
#  Usage:
#    render/studio_render.sh all                 # audio + plate + both formats, end to end
#    render/studio_render.sh audio               # rebuild VO (Batman chain), score, mix
#    render/studio_render.sh plate               # HyperFrames genesis-code plate
#    render/studio_render.sh frames master       # render 1800 frames (or: vertical)  [FRAMES=a-b to limit]
#    render/studio_render.sh score master        # score every frame, write qa/reports/*
#    render/studio_render.sh assemble master     # FFmpeg → renders/output_master_30s.mp4
#    render/studio_render.sh verify master
#
#  Environment: source hf-env.sh is done for you; Chrome = remotion/scripts/chrome-wrapper.sh (@sparticuz).
# =============================================================================================
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
REM="$ROOT/remotion"
# shellcheck disable=SC1091
source "$ROOT/hf-env.sh"
export HYPERFRAMES_BROWSER_PATH="$REM/scripts/chrome-wrapper.sh"
export CHROME_PATH="$REM/scripts/chrome-wrapper.sh"
CHROME="$REM/scripts/chrome-wrapper.sh"
OUTDIR="$HERE/renders"
FRAMES_ROOT="$REM/out/frames"
mkdir -p "$OUTDIR" "$FRAMES_ROOT"

say() { printf "\n\033[1;36m== %s\033[0m\n" "$1"; }
comp_of() { [ "$1" = "vertical" ] && echo "Singularity-Vertical" || echo "Singularity-Master"; }

stage_audio() {
  say "AUDIO · VO (voice-00 → heavy vigilante chain) · score · mix (-16 LUFS / ≤ -1 dBTP)"
  python3 "$HERE/audio/build_vo.py"
  python3 "$HERE/audio/synth_score.py"
  python3 "$HERE/audio/mix.py"
}

stage_plate() {
  say "HYPERFRAMES · genesis-code plate"
  (
    cd "$HERE/hyperframes/genesis-code"
    node "$ROOT/scripts/seam-stamp.mjs" --ledger ledger.json --write index.html
    hyperframes lint .
    node "$ROOT/scripts/seam-gate.mjs" verify --ledger ledger.json --project . --fps 60
    hyperframes render -o renders/genesis-code.mp4 -f 60 -q delivery
  )
  mkdir -p "$REM/public/singularity/hf"
  cp "$HERE/hyperframes/genesis-code/renders/genesis-code.mp4" "$REM/public/singularity/hf/genesis-code.mp4"
}

stage_gates() {
  say "REMOTION GATES · tsc · bundle · compositions"
  (cd "$REM" && npx tsc --noEmit && npx remotion bundle src/index.ts --out-dir out/bundle >/dev/null && npx remotion compositions out/bundle --browser-executable="$CHROME" 2>/dev/null | grep -E "Singularity")
}

stage_frames() {
  local fmt="$1"
  local comp
  comp="$(comp_of "$fmt")"
  local range="${FRAMES:-0-1799}"
  say "FRAMES · $comp · frames $range → $FRAMES_ROOT/$fmt"
  mkdir -p "$FRAMES_ROOT/$fmt"
  (cd "$REM" && npx remotion render out/bundle "$comp" "$FRAMES_ROOT/$fmt" --sequence --frames="$range" \
      --image-format=jpeg --jpeg-quality=95 --image-sequence-pattern="frame-[frame].[ext]" \
      --browser-executable="$CHROME" --gl=angle --concurrency=1 --muted --timeout=240000)
  # Remotion pads [frame] to the width of the requested range: normalise to 4 digits so partial re-renders
  # (FRAMES=a-b) overwrite the right files and FFmpeg's frame-%04d pattern always matches.
  python3 - "$FRAMES_ROOT/$fmt" <<'PY'
import re, sys, os
d = sys.argv[1]
for n in os.listdir(d):
    m = re.fullmatch(r"frame-(\d+)\.(jpe?g)", n)
    if m and len(m.group(1)) != 4:
        os.replace(os.path.join(d, n), os.path.join(d, f"frame-{int(m.group(1)):04d}.{m.group(2)}"))
PY
}

stage_score() {
  local fmt="$1"
  say "SCORE · every frame 1–10 · $fmt"
  python3 "$HERE/qa/score_frames.py" --frames "$FRAMES_ROOT/$fmt" --comp "$fmt"
}

stage_assemble() {
  local fmt="$1"
  local out="$OUTDIR/output_${fmt}_30s.mp4"
  say "ASSEMBLE · FFmpeg · $out"
  # H.264 High, CRF 17 (capped for upload size), BT.709 TV-range tags, 2 s GOP @ 60 fps, AAC 320k 48 kHz.
  ffmpeg -v error -y -framerate 60 -start_number 0 -i "$FRAMES_ROOT/$fmt/frame-%04d.jpeg" \
    -i "$REM/public/singularity/audio/mix_master.wav" \
    -map 0:v:0 -map 1:a:0 -c:v libx264 -preset slow -crf 17 -maxrate 14M -bufsize 28M -profile:v high -pix_fmt yuv420p \
    -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -g 120 \
    -c:a aac -b:a 320k -ar 48000 -frames:v 1800 -movflags +faststart "$out"
  if [ "$fmt" = "master" ]; then cp "$out" "$OUTDIR/output_master_30s.mp4" 2>/dev/null || true; fi
}

stage_verify() {
  local fmt="$1"
  local out="$OUTDIR/output_${fmt}_30s.mp4"
  say "VERIFY · $out"
  ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_read_frames,pix_fmt,color_space,color_transfer,color_primaries -of default=nw=1 "$out"
  ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -show_entries format=duration,size,bit_rate -of default=nw=1 "$out"
  ffmpeg -v error -i "$out" -f null - && echo "full decode: OK (0 errors)"
  ffmpeg -nostats -i "$out" -vn -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
}

case "${1:-all}" in
  audio) stage_audio ;;
  plate) stage_plate ;;
  gates) stage_gates ;;
  frames) stage_frames "${2:-master}" ;;
  score) stage_score "${2:-master}" ;;
  assemble) stage_assemble "${2:-master}" ;;
  verify) stage_verify "${2:-master}" ;;
  all)
    stage_audio
    stage_plate
    stage_gates
    for f in master vertical; do
      stage_frames "$f"
      stage_score "$f"
      stage_assemble "$f"
      stage_verify "$f"
    done
    ;;
  *) echo "usage: $0 {all|audio|plate|gates|frames|score|assemble|verify} [master|vertical]"; exit 1 ;;
esac
