---
name: master-editor-protocol
description: Read FIRST for any edit, motion-graphics, VFX or CGI job. One deterministic pipeline that Claude Opus 5.5, GPT-6.1 Sol and Gemini 4 Argon all follow, with role routing, talking-head recut steps and hard QA gates.
---

# Master Editor Protocol

Additive layer on top of the existing skills (`opus-5-5-sol-6-1-director`, `motion-doctrine`, `nle-video-editor-pro`, `gemini-4-argon-forensic-atlas`, `higgsfield-forensic-atlas`). It does not replace them; it sequences them.

## 0. Role routing (who does what)

| Stage | Best model | Why |
|---|---|---|
| Watch footage, log takes, find beats, judge renders | **Gemini 4 Argon** | Native video/audio input with agentic video understanding; returns text only |
| Edit decision list, story, code for Remotion / HyperFrames | **Claude Opus 5.5** | Strongest agentic/coding profile for long multi-file compositions |
| Second-opinion critic, alt cuts, copy, translations | **GPT-6.1 Sol** | Independent critic; never let the writer grade itself |
| Generated pixels (B-roll, swaps, restyles) | **Higgsfield** (Katana, Genjutsu, Cinema Studio) | Only when a scene cannot be built in code |

Rule: **code first, pixels last.** A Remotion/HyperFrames/Three.js/Blender scene stays re-editable; a generated clip does not.

## 1. Intake
1. `ffprobe` every source: fps, resolution, colour space, audio rate. Conform to one timeline fps (30 or 60) before anything else.
2. Record the brief as `brief.json`: platform, aspect (16:9 / 9:16 / 1:1), duration, tone, brand palette, fonts, must-keep lines.

## 2. Talking-head recut (the workflow shown in the reference YouTube edits)
1. **Word-level transcript** (Whisper / `hyperframes` transcribe) with per-word timestamps.
2. **Cut**: remove every silence > 350 ms and every repeated or flubbed take; keep the *last* clean take. Leave 2–4 frame handles so consonants are not clipped.
3. **Punch-ins**: alternate 100% / 112–120% scale on cuts to hide jump cuts; never two identical scales back to back.
4. **Captions**: 1–4 words per page, keyword highlight in accent colour, safe area 10% from edges (15% bottom on 9:16 for platform UI).
5. **Motion graphics on beats**: one animation per idea (stat callout, lower-third, kinetic title, side panel, PiP). Typical viral reel density: ~1 graphic per 3–5 s.
6. **SFX layer**: whoosh on transitions, pop on text-in, riser into reveals. Place on the frame the visual starts, −18 to −24 LUFS relative to voice.
7. **Mix**: voice −14 LUFS integrated (social) / −16 (YouTube), music ducked 10–14 dB under speech, true-peak ≤ −1 dBTP.

## 3. Build
- Remotion: `useCurrentFrame()` + `interpolate`/`spring`, never CSS transitions or `Date.now()`.
- HyperFrames: seekable GSAP timelines registered on `window.__timelines`; run `lint` before preview.
- 3D/CGI: Three.js (R3F in Remotion via `@remotion/three`) or headless Blender; seeded randomness only.

## 4. Gates (must pass, paste raw output)
See `skills/motion-quality-gates/SKILL.md`. Render a contact sheet (1 frame / second) and send it plus the MP4 to Gemini 4 Argon for review; GPT-6.1 Sol names ≥3 flaws; Opus fixes; repeat until zero blocking flaws.

## 5. Deliver
Master + platform cuts, `edl.json`, captions `.srt`, contact sheet, and a one-paragraph changelog.

## Ethics
Reference edits must be owned or licensed; real-person likeness needs consent. No watermark removal, no face-swapping someone without permission.
