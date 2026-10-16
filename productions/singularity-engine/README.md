# The Singularity Engine — *Claude Opus 5.5 vs. GPT Astra 6.1 Sol*

> *The Genesis of Hyper-Motion.* 30.000 s · 60 fps · 1800 frames · 16:9 master + 9:16 companion.
> Hybrid **HyperFrames + Remotion** programmatic film with a synthesized Batman-style voiceover and score.

| Deliverable | Path |
|---|---|
| 16:9 master | `renders/output_master_30s.mp4` |
| 9:16 companion | `renders/output_vertical_30s.mp4` |
| Director's treatment (the build contract) | [`FILM.md`](FILM.md) |
| Single source of truth (beats, cuts, schedules, VO onsets) | [`remotion/src/singularity/timeline.json`](../../remotion/src/singularity/timeline.json) |
| Measured VO word timings + word-driven events | [`remotion/src/singularity/vo-words.json`](../../remotion/src/singularity/vo-words.json) |
| Vector Ledger (seams) | [`ledger.json`](ledger.json) |
| QA reports (per-frame scores, contact sheets, spectrogram) | `qa/reports/` |

`renders/` is git-ignored, following the repo convention. Re-create everything with the studio loop below.

## The studio render loop

```bash
source hf-env.sh                       # repo env (Node, caches, single-worker producer)
productions/singularity-engine/render/studio_render.sh all
```

| Stage | Command | What it does |
|---|---|---|
| audio | `studio_render.sh audio` | `audio/build_vo.py` (voice-00 → Praat PSOLA formant/pitch shift → gravel, fry, chest double, proximity, dark room; syllable-nucleus word alignment) · `audio/synth_score.py` (all stems synthesized from timeline data) · `audio/mix.py` (VO-forward ducking, −16 LUFS, ≤ −1 dBTP) |
| plate | `studio_render.sh plate` | HyperFrames `hyperframes/genesis-code`: `seam-stamp.mjs` → `hyperframes lint` (0/0) → `seam-gate.mjs verify` → `hyperframes render -f 60` |
| gates | `studio_render.sh gates` | `tsc --noEmit` · `remotion bundle` · `remotion compositions` |
| frames | `studio_render.sh frames master` | 1800 JPEG frames (q95) from `Singularity-Master` (or `vertical`). `FRAMES=a-b` re-renders a range in place |
| score | `studio_render.sh score master` | `qa/score_frames.py`: every frame scored 1–10 (density · clarity · motion · typography) and frames < 8 listed |
| assemble | `studio_render.sh assemble master` | FFmpeg: H.264 High, CRF 17 (14 Mb/s cap), yuv420p, BT.709 tags, AAC 320k |
| verify | `studio_render.sh verify master` | ffprobe frame count/fps/colour tags, full decode, EBU R128 loudness of the encoded file |

The Remotion seam gate is separate: `qa/seam_check.sh` numerically verifies every cut in the ledger.

## Toolchain notes for this sandbox

- **Chrome:** comes from npm (`@sparticuz/chromium@153`) through `remotion/scripts/chrome-wrapper.sh`. WebGL runs on SwiftShader, which is the only path here because Google's CDN is unreachable. HyperFrames uses the same browser via `HYPERFRAMES_BROWSER_PATH`, and the seam gate via `CHROME_PATH`.
- **FFmpeg:** the static `imageio-ffmpeg` 7.0 build (libx264, libvpx, rubberband, loudnorm). `ffprobe` comes from Remotion's compositor.
- **Python audio:** `numpy scipy soundfile pedalboard praat-parselmouth pyloudnorm` (PyPI).
- **Fonts:** `toolkit/fonts` are Latin-1 subsets, so on-screen copy avoids ✓ ∩ φ ζ → ∞. Symbols are drawn as geometry instead.

## How each requirement maps to code

| Requirement | Where |
|---|---|
| Closed-form spring physics (no stepping) | `remotion/src/singularity/physics/springs.ts`: analytic DHO, closed-form arrival time, velocity, plucked string, impulse response, spring easing (the same equation drives the HyperFrames plate) |
| Every lock/fold/strike on its sound | `timeline.json → schedules`, read by the shots and by `synth_score.py`. Springs are launched with `springLockedAt()` so they **arrive** on the click frame |
| 100 BPM grid | 1 beat = 36 frames; every cut, phrase onset and schedule sits on a beat, half-beat or 16th |
| Seams (motion-doctrine) | `components/seamPose.ts` (engine `seamTransitions.ts`), verified by `qa/seam_check.sh` |
| Cinematic-embed captions | `components/Words.tsx` + per-shot designs. Each word enters on its measured frame |
| 16:9 + 9:16 from one tree | `layout.ts` (`isPortrait` branches in every shot) |
| HyperFrames + Remotion hybrid | `hyperframes/genesis-code/` → `remotion/public/singularity/hf/genesis-code.mp4`, composited in `scenes/S3MacroDive.tsx` |
