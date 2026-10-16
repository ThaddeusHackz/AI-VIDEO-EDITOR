# Motion-graphics routing — task → model → effort → files in this repo

The practical bridge between the model layer and the render layer. Every row ends in a **file in this repo** and a **gate that proves it**.

## 1. Composition & camera work

| Task | Model / effort | Repo surface | Gate |
|---|---|---|---|
| Add a new camera preset (e.g. "crane-up") | Opus 5.5 @ high | `remotion/src/engine/cameraRig.tsx` (10 existing DoP presets) | typecheck + still at 3 frames |
| Choreograph a 5-act camera arc | Opus 5.5 @ high (plan) → Sol @ medium (per-act code) | `Root.tsx` + act components | 4-shot QC per act |
| Convert a reference move into numbers | Gemini 4 Argon (footage) → Opus 5.5 (math) | `ledger.json` → seam-stamp | seam gate 0/0 |
| Wireframe/geometry debug pass | Sol @ low (mechanical toggle) | composition prop + `still --props` | critic low-angle + wire frames |

## 2. Shaders, particles & post passes

| Task | Model / effort | Repo surface | Gate |
|---|---|---|---|
| New anamorphic flare / godray variant | Opus 5.5 @ high | `remotion/src/engine/vfxShaders.tsx` | 4-shot QC (close-up weights) |
| Port a GLSL transition | Sol @ medium (mechanical) | `@remotion/shader-transitions` + `gl-transitions` patterns | seam gate + still pair |
| Grain/light-leak/burn layers | Sol @ low | `vfxShaders.tsx`, registry overlays | visual diff vs previous render |
| Motion blur tuning | Opus 5.5 @ medium | `MotionDoctrineReel.tsx` | 4-shot QC (close-up) |

## 3. NLE / edit-engine work

| Task | Model / effort | Repo surface | Gate |
|---|---|---|---|
| LUT grading stage changes | Sol @ medium | `remotion/src/engine/nleTrackEngine.tsx` | still + hex sampling |
| Caption tier behaviour (Drop/Rail/Embed) | Sol @ medium | `captions-overlay` skill + engine | still + safe-area check |
| Audio meter / ducking logic | Opus 5.5 @ high | `nleTrackEngine.tsx` | loudness target −16 LUFS |
| Multi-track sequencing | Opus 5.5 @ high | `NLEMasterTimeline.tsx` | 4-shot QC + seam gate |

## 4. 3D scenes & characters

| Task | Model / effort | Repo surface | Gate |
|---|---|---|---|
| Cylindrical carousel / sliding stack | Sol @ medium | `threeSceneStudio.tsx` | still + geometry wire check |
| Physics sphere / torus knot sim | Opus 5.5 @ high | `threeSceneStudio.tsx` | determinism gate (2 identical renders) |
| 2-bone IK + lip-sync visemes | Opus 5.5 @ high | `characterRig2D.tsx` (`solveTwoBoneIK`) | still at viseme frames |
| Cinema Studio 4.0 stage / plasma / vortex | Opus 5.5 @ high | `cinemaStudio4.tsx` | 4-shot QC |

## 5. HyperFrames / registry work

| Task | Model / effort | Repo surface | Gate |
|---|---|---|---|
| Author a new block or component | Sol @ medium | `registry/blocks`, `registry/components` | `node scripts/validate-registry.mjs` |
| Port a block into a showreel | Sol @ low | `examples/ultrahigh-3d-vfx-showreel/` | `hyperframes lint` 0/0 |
| Seam stamping after a cut change | Sol @ low (tool-only) | `scripts/seam-stamp.mjs` | `seam-gate verify` 0 fail/warn |
| Doctrine compliance review | Opus 5.5 @ high | `skills/motion-doctrine`, `skills/seam-craft` | critic report + raw gate output |

## 6. Cross-cutting: pipeline plumbing

| Task | Model / effort | Surface | Gate |
|---|---|---|---|
| `bin/ai-video` subcommand work | Opus 5.5 @ high | `bin/ai-video` | `./bin/ai-video doctor` |
| Manifest/hash tooling | Sol @ medium | `packages/cli/src/utils/skillsManifest.ts` | `gen:skills-manifest --check` |
| Skill packaging | Sol @ low | `skills/`, `.agents/`, `.claude/` mirrors | `scripts/check-skill-mirror.mjs` |
| Serverless render endpoint | Opus 5.5 @ high | Remotion templates (Vercel/Cloudflare/Modal) | 3-second smoke render |

## 7. The hand-off contract (model → repo)

Every model output that touches this repo must be one of:

```text
1. A DIFF        file paths + hunks (apply_patch on Sol; explicit diff on Opus 5.5)
2. A PLAN        shot list + seam budget + file list (no code until approved)
3A. A LEDGER     JSON consumed by seam-stamp / seam-gate
3B. AN EDL       JSON/OTIO consumed by the authoring step
4. A REPORT      raw gate output pasted verbatim (never a summary)
```

Anything else ("here's the whole file rewritten", "looks good to me") is rejected at review.

## 8. Failure patterns to watch

| Pattern | Symptom | Fix |
|---|---|---|
| Studio-vs-render drift | Timing correct in Studio, wrong in MP4 | Frame-driven only; ban wall-clock animation; determinism gate |
| Cache-prefix churn | Sol costs explode mid-session | Freeze the prefix; keep <272K input |
| Critic collusion | QC always 9–10, no flaws | Separate critic session/model; require ≥3 named flaws |
| Scope creep | Diff touches unrelated files | "Do not modify anything outside the approved plan" |
| Silent non-determinism | Two renders differ | Ban `Math.random()`; require seeded PRNG |
| Over-generation | Re-generating clips instead of re-rendering code | Delete-and-re-render; generation is for plates only |
