---
name: opus-gpt-director
description: "MASTER /ultrahigh AUTONOMOUS VIDEO DIRECTOR for Claude Opus 5.5, GPT-6.1 Sol, and coding agents. Load FIRST on any '/ultrahigh' request or complex 3D motion graphics, VFX, CGI, product launch film, or NLE video editing task. Unifies HyperFrames (HTML/CSS/GSAP/Three.js + Motion Doctrine + Seam Gate) and Remotion (React/TSX/Three.js + Pure Frame Functions) with Higgsfield DoP camera grammar and REA reverse-engineering."
---

# Opus 5.5 & GPT-6.1 Sol `/ultrahigh` Autonomous Video Director

This skill turns any AI coding agent into an autonomous **Creative Director, 3D Motion Designer, VFX Technical Director, NLE Video Editor, and Render QA Engineer**.

## 1. Engine Selection Matrix

| Task / Brief | Primary Engine | Why |
| --- | --- | --- |
| Multi-scene product launch film, kinetic typography, HTML/CSS/SVG UI mocks, GSAP timelines, shader transitions, footage overlays | **HyperFrames** (`hyperframes`) | Native DOM/CSS/SVG + seekable GSAP + 448 pre-built registry blocks/components + Seam Gate verifier (`seam-gate.mjs`). |
| Reusable React video templates, parameterized data-driven videos, typed props, multi-aspect-ratio component systems (`16:9` + `9:16` + `1:1`) | **Remotion** (`remotion/`) | Pure functional React (`useCurrentFrame`, `interpolate`, `spring`) + shared `remotion/src/engine/*` 3D/VFX/Camera/NLE library. |
| Real 3D geometry, PBR lighting, GLB models (`macbook.glb`, `iphone.glb`), custom GLSL shaders, particle physics | **HyperFrames + Three.js Adapter** OR **Remotion + Three/Shader Engine** | Use deterministic frame-stepped camera/light/shader evaluation (never wall-clock `requestAnimationFrame`). |
| Reverse-engineering a reference video, website animation, or app effect | **REA (`rea/`) + FFmpeg Scene Probe** | Extract exact easing curves, shader uniforms, DOM structures, and cut timestamps before rebuilding in HyperFrames or Remotion. |

## 2. The 7-Gate `/ultrahigh` Production Protocol

Never jump straight from a vague prompt to a blind full render. Execute these 7 gates in order:

### Gate 0 — Environment & Asset Probe
1. Load the toolchain environment:
   ```bash
   source /home/user/AI-VIDEO-EDITOR/hf-env.sh
   ```
2. Verify `ffmpeg`, `node` (>=22), `hyperframes`, and `remotion`. If starting in a fresh container session, run:
   ```bash
   bash /home/user/AI-VIDEO-EDITOR/setup-toolchain.sh
   ```
3. Probe all input media (`ffprobe`) for resolution, frame rate, duration, and audio streams. Check local fonts in `toolkit/fonts/` and vendor libraries in `toolkit/vendor/` (`gsap.min.js`, `three.core.min.js`, `shaders.iife.js`, `camera-dop.js`, `macbook.glb`, `iphone.glb`).

### Gate 1 — Creative Direction & Beat Map
Write a structured production spec (see `toolkit/VIDEO_BRIEF_TEMPLATE.md`):
- **Logline & Viewer Takeaway**: One sentence on what the viewer remembers.
- **Visual Motif & Carrier**: What object, cursor, line, or shape carries the viewer's eye across cuts?
- **Color & Typography Tokens**: Deep stage ground (`#070B12` or brand canvas — never unstyled white `#fff`), 1 primary accent, 1 secondary accent, display font + body font + mono font from `toolkit/fonts/`.
- **Time-Coded Beat Map**: Every beat has exact start/end seconds (and frames), focal element, supporting stagger, exact quoted copy, camera preset (`dollyZoom`, `crashZoom`, `orbit360`, `cutTheCurve`, etc.), and audio cue.

### Gate 2 — The Vector Ledger & Seam Law (`motion-doctrine`)
Before coding multi-scene transitions, enforce the **Vector Law**:
- **How Scene A exits determines how Scene B enters**: same axis (`x`, `y`, or `z`), same signed direction, matched peak velocity (`power4.in` exit -> `power4.out` or `expo.out` entry), cut mid-motion on both sides.
- **Z-Axis Scale-Sign Rule**:
  - Forward push (`zoom-through`): outgoing scales `1 -> 1.2+` (growing), incoming scales `0.75 -> 1` (growing).
  - Backward pull (`inverse-zoom-through`): outgoing scales `1 -> 0.8` (shrinking), incoming scales `1.25 -> 1` (shrinking).
  - Never mirror Z-signs across a cut!
- **Stage Ground Guard (`seam-craft`)**: Always paint `#root` / `AbsoluteFill` with an opaque dark or brand canvas background so transition opacity dips never flash white.

### Gate 3 — Sustained Performance (Zero Idle Wobble)
- **Ban Idle Wobble**: Never use aimless sine-wave floating/breathing to fill time after an entrance finishes.
- Every post-entrance second must execute one of the 5 **Sustained Motion Routes**:
  1. **Staged Reveals** (information builds progressively on beat)
  2. **Camera With Intent** (Higgsfield DoP camera rig travels from wide establish to macro detail)
  3. **Sequenced UI Life** (live counters tick, code types, charts animate, toggles switch)
  4. **Animated Sequences** (cards file into stacks, 3D models rotate to reveal ports/layers)
  5. **Oversized Cursor Action** (`oversized-cursor`: `7cqw` pointer enters physically from off-screen, tip-targets `transformOrigin: '21% 14%'`, click ignites the next morph/beat same-frame)
- **Stillness Before Climax**: Schedule a `0.3s–0.75s` dramatic comma before the hero reveal or payoff beat.

### Gate 4 — Deterministic Authoring
- **Zero Non-Determinism**: Never use `Date.now()`, `performance.now()`, unseeded `Math.random()`, CSS `transition`, or unmanaged `requestAnimationFrame`.
- Use seeded PRNG (`mulberry32(seed + frame)`) for all particles, stars, film grain, glitch slices, and camera shake.
- Vendor all scripts/fonts locally from `toolkit/` — zero live CDN dependencies at render time.

### Gate 5 — Machine Verification Gate
- **For HyperFrames**:
  ```bash
  hyperframes lint .
  hyperframes check .
  # If using ledger.json:
  node /home/user/AI-VIDEO-EDITOR/skills/motion-doctrine/scripts/seam-gate.mjs verify --ledger ledger.json --project .
  ```
- **For Remotion**:
  ```bash
  cd /home/user/AI-VIDEO-EDITOR/remotion
  npx tsc --noEmit
  npx remotion compositions src/index.ts
  ```

### Gate 6 — Multi-Frame Visual QA
Capture representative stills across hooks, mid-transition seams, climax beats, and end cards:
- **HyperFrames**: `hyperframes snapshot . --at 0.5,2.0,4.5,8.0 -o snaps`
- **Remotion**: `npx remotion still src/index.ts <CompId> out/check.png --frame=90`
Inspect every still for contrast, typography hierarchy, safe-area compliance, and zero layout collisions.

### Gate 7 — Final Render & Full Decode Verification
Render the master MP4 and verify with `ffprobe` and full `ffmpeg -v error -i out.mp4 -f null -` decode check.
