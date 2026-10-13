# AGENTS.md — AI Video Engineering Instructions (Claude Opus 5.5 / GPT-6.1 Sol / Codex / OpenCode)

This repository (`/home/user/AI-VIDEO-EDITOR`) is an all-in-one programmatic 3D motion graphics, VFX/CGI, and non-linear video editing studio powered by **HyperFrames**, **Remotion**, **REA (`morluto/rea`)**, and **Higgsfield DoP Camera Choreography**.

## 1. Mandatory Startup Checklist for Every Agent

1. **Load Environment & Run Doctor**:
   ```bash
   source ./hf-env.sh
   ./bin/ai-video doctor
   ```
2. **Select the Right Skill First**:
   All 47 skills live in `skills/<name>/SKILL.md` (and are symlinked in `.agents/skills/` and `.claude/skills/`).
   - **Master Director & `/ultrahigh` Mode**: Read `skills/opus-gpt-director/SKILL.md`
   - **3D Motion Graphics & VFX/CGI**: Read `skills/cinematic-3d-vfx-cgi/SKILL.md` and `skills/remotion-3d/SKILL.md`
   - **Camera Choreography (Dolly Zoom, Orbit, Bullet-Time, Whip-Pan)**: Read `skills/higgsfield-camera-dop/SKILL.md`
   - **Seam Craft & Vector Continuity**: Read `skills/motion-doctrine/SKILL.md`, `skills/cut-the-curve/SKILL.md`, and `skills/seam-craft/SKILL.md`
   - **Oversized Cursor Choreography**: Read `skills/oversized-cursor/SKILL.md`
   - **Video Editing, Recuts & Captions**: Read `skills/nle-video-editor-pro/SKILL.md`, `skills/captions-overlay/SKILL.md`, and `skills/talking-head-recut/SKILL.md`
   - **Reference Video Reverse-Engineering**: Read `skills/rea-video-reverse-engineer/SKILL.md`

## 2. Non-Negotiable Determinism Rules

- **Zero Unseeded Randomness**: Never call `Math.random()` or `Date.now()` in render code. Use `mulberry32(seed)` from `remotion/src/engine/cameraRig.tsx` or deterministic frame formulas.
- **Zero Live-Clock Animations**: In Remotion, every visual property must be a pure function of `useCurrentFrame()`. Never use CSS `transition`, CSS `@keyframes`, or `requestAnimationFrame`. In HyperFrames, attach all motion to `window.__timelines["main"]` (paused GSAP timeline) and render WebGL/Three.js inside the timeline's `onUpdate` callback.
- **Zero External Network Fetches at Render Time**: Load fonts from `toolkit/fonts/*.woff2` and vendor libraries from `toolkit/vendor/` (`gsap.min.js`, `three.core.min.js`, `shaders.iife.js`, `camera-dop.js`).
- **Opaque Stage Ground (`seam-craft`)**: Always set an explicit opaque background on `#root` / `<AbsoluteFill>` so cross-scene transitions never flash white.
- **Vector Law & Seam Gate (`motion-doctrine`)**: Every scene cut must match exit and entry direction (`axis` + `dir`), preserve `d(scale)/dt` sign across Z-cuts, and pass `hyperframes lint` + `node scripts/seam-gate.mjs` (or use `remotion/src/engine/seamTransitions.ts`).

## 3. Verification Before Completion

Always run `./bin/ai-video verify` before finishing any task to confirm:
- `cd remotion && npx tsc --noEmit` passes with 0 errors.
- `hyperframes lint` passes with 0 errors and 0 warnings.
- `node scripts/seam-stamp.mjs` validates the Vector Ledger (`ledger.json`).
