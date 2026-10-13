---
name: nle-video-editor-pro
description: "Professional Non-Linear Video Editor (NLE) & Post-Production Workflow. Covers multi-track video editing, J/L-cuts, speed ramping, word-level Parakeet/Whisper captioning (Drop/Rail/Embed doctrine), broadcast LUFS audio mixing & voiceover ducking, LUT color grading, and FFmpeg master encoding."
---

# Professional NLE Video Editor & Post-Production Playbook

Use this skill whenever editing real footage, cutting talking-head interviews, mixing multi-track audio, adding word-synced captions, color grading, or assembling a master edit in **HyperFrames** or **Remotion**.

## 1. The NLE Multi-Track Architecture

| Track Index | Role | Engineering Rule |
| --- | --- | --- |
| **Track 0 (A-Roll Plate)** | Primary talking-head or base video clip | Never cut visually without motivation; use J-cuts/L-cuts so audio leads or trails video by `0.15s–0.4s`. |
| **Track 1 (B-Roll / Screen / 3D Cutaways)** | Full-frame or split-screen visual proof | Enter on spoken keyword timestamp; use `cut-the-curve` or `whip-pan` seam, never a slow muddy dissolve. |
| **Track 2 (Scrim & Contrast Grade)** | Footage-independent contrast protection | Dynamic bottom gradient or radial scrim (`rgba(7,11,18,0.68)`) timed with text overlays so typography is 100% legible over bright footage. |
| **Track 3 (Graphic Overlays & Lower-Thirds)** | Lower-thirds, metric cards, callout HUDs | Follow `talking-head-recut` rules: enter on exact transcript word start, exit cleanly before next topic. |
| **Track 4 (Captions Rail & Peak Embeds)** | `captions-overlay` Drop / Rail / Embed | Rail rides bottom ~6-8% on true-centered canvas; scarce `embed` climax words composite behind the subject matte. |
| **Audio Bus** | Voiceover + BGM + Intentional SFX | Normalize VO to `-16 LUFS`; duck BGM by `-12 dB` to `-15 dB` during speech with `0.25s` attack and `0.6s` release; place SFX (`whoosh`, `click`, `riser`, `sub-hit`) on exact visual ignition frames. |

## 2. Word-Level Transcription & Caption Sync

1. Extract audio:
   ```bash
   ffmpeg -y -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav
   ```
2. Transcribe with HyperFrames Parakeet ASR:
   ```bash
   hyperframes transcribe audio.wav -d . --json
   ```
3. Clamp final word timestamp to `ffprobe` container duration so captions never overhang the video tail.

## 3. Color Grading & LUT Pipeline

Available 3D `.cube` LUTs in `skills/media-use/luts/` and CSS/SVG color-matrix grades in `remotion/src/engine/nleTrackEngine.tsx`:
- `teal-orange-cinema`: Warm skin tones + deep cyan shadows (`contrast(1.08) saturate(1.12)`)
- `editorial-film`: Lifted matte blacks + soft highlight roll-off + 35mm grain
- `cyber-neon`: High-contrast obsidian blacks + electric cyan/magenta halation
- `clean-studio`: Neutral broadcast Rec.709 clarity

## 4. FFmpeg Master Delivery & Verification Commands

```bash
# Probe streams, fps, duration, audio codec
ffprobe -v error -show_format -show_streams output.mp4

# Full decode integrity check (must output zero errors)
ffmpeg -v error -i output.mp4 -f null -

# Generate 4x3 QA contact sheet across the full runtime
ffmpeg -y -i output.mp4 -vf "fps=1/2,scale=480:-1,tile=4x3" qa-contact-sheet.png
```
