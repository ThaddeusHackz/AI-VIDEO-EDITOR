# Argon Editing Playbook — six production workflows for video, animation, CGI & VFX

Argon outputs **text only**. Every workflow below is therefore framed as *text → deterministic render in this repo*, never "ask for pixels".

---

## Workflow 1 — Footage → EDL (the one that pays for itself first)

**Input:** one reference or finished cut (≤45 min with audio, ≤60 min silent, ≤10 files/prompt).
**Output:** a machine-readable edit decision list + the rationale.

```text
Watch this footage end to end with agentic scrubbing (not static sampling).
Return ONLY structured output:
{
  "fps": <n>, "duration": <sec>,
  "shots": [{"in": <tc>, "out": <tc>, "desc": "...", "camera": "static|pan|dolly|handheld|...",
             "motion_magnitude": 0-1, "usable": true|false, "reason_if_not": "..."}],
  "beats": [{"tc": <tc>, "type": "cut|speed-ramp|freeze|whoosh|drop", "strength": 0-1}],
  "dead_air": [{"in": <tc>, "out": <tc>}],
  "retakes": [{"in": <tc>, "out": <tc>, "why": "fumble|slate|reset"}],
  "palette": ["#hex", ...], "loudness_notes": "...", "narration_map": [{"tc": ..., "line": "..."}]
}
```

Then: `node scripts/seam-stamp.mjs` (HyperFrames) or author Remotion `<Sequence>` blocks from `shots[]`.
**Why it works:** agentic video understanding is the differentiator — the model *scrubs* to timestamps and inspects individual frames at high resolution, then fuses that with narration/console audio. That is what turns a 45-minute master into sub-second boundaries rather than vibes.

---

## Workflow 2 — Beat → beat replication (REA + Argon)

Pair this repo's REA studio (optical flow, beat maps, palette extraction) with Argon's semantic read.

| Pass | Tool | Output |
|---|---|---|
| Signal | `rea/` | frame grids, optical flow, cut ledger, palette, loudness |
| Semantics | Argon | *why* each cut exists: setup/payoff, match-cut logic, pacing intent |
| Execution | HyperFrames / Remotion | velocity-matched seams, `ledger.json`, seam gate |

The combination is the point: REA measures, Argon explains, this repo reproduces numerically.

---

## Workflow 3 — G1/G2/G3 hierarchy for footage annotation

Borrowed from Argon's robotics hindsight-labelling (see the atlas §3.3). Applied to a scene or an act, one 136-second-equivalent block yields:

```text
G1  Episode Goal        — the one sentence the block exists to deliver
G2  Semantic Subtasks   — 5–7 contiguous segments (≈ scenes / beats)
G3  Atomic Primitives   — 15–20 contact-level moments (≈ shot actions, gesture peaks)
QC  Quality weighting   — automatically down-weight fumbles, resets, retakes,
                          holding "progress" flat so a flubbed take never reads as advancement
```

Editorial translation:

| Robotics concept | Editorial meaning |
|---|---|
| Fumble / unstable grasp | Flubbed take, bad line read, camera bob |
| Retry | Slate / reset / second take |
| QC reweighting holds progress flat | Dead air does not advance the story — cut it |
| Contact-level primitives | Action peaks = your cut points and speed-ramp anchors |

**Deliverable:** a take-selection sheet with `usable: false` flags and reasons — an assembly done by reasoning, not scrubbing.

---

## Workflow 4 — Storyboard → previs → CG plate (Blender MCP)

```text
1. Concept frame            (Flow / Nano Banana) — 1 image
2. 4 idealized references   (Nano Banana) — the critic's ground truth
3. Blueprint                (Argon) — camera, scale, materials, light plan, passes
4. Build                    (Blender headless via MCP) — geometry, textures, volumetrics
5. Critique                 (Argon, 4-shot protocol) until >= 9
6. Finish                   (this repo) — grain, flares, godrays, LUT, captions, mix
```

Measured cadences to budget against: **45 rounds** (cathedral from a 2D concept), **~1,000 rounds** (Pixel CAD exploded view), multi-agent loop (pagoda). Recommendation: 12-round default budget, escalate only for hero environments.

---

## Workflow 5 — Exploded-view & technical motion graphics (the Pixel-CAD pattern)

Argon produced exploded-view animation, lighting, camera choreography and audio from a raw CAD file — with **every frame drawn algorithmically** (3D meshes, particle simulations, vector geometry), refined over ~1,000 self-check loops.

Repo-native version:

| Capability | Where it lives here |
|---|---|
| Parametric explode along a part tree | `remotion/src/engine/threeSceneStudio.tsx` |
| Volumetric godrays + anamorphic flare | `remotion/src/engine/vfxShaders.tsx` |
| Camera choreography (orbit/dolly/crash-zoom) | `remotion/src/engine/cameraRig.tsx` (10 Higgsfield DoP presets) |
| Deterministic seed / PRNG | `cameraRig.tsx` seeded PRNG |
| Vector Ledger + seam compliance | `scripts/seam-gate.mjs`, `ledger.json` |

Use Argon for the **part tree, the timing sheet and the critique**; use this repo for the render.

---

## Workflow 6 — Interactive/animation in vanilla code (Three.js, WebGPU, GLSL)

Google's own framing: Argon prototypes "complex 3D visualizations, high-fidelity games, and interactive animations in **vanilla code that can be rendered directly in the browser**" — with multi-agent loops and custom skills.

Repo recipe:

```bash
# Ask for a single self-contained module: no libraries beyond the stack in this repo
# then verify visually with the 4-shot protocol before integrating
node -e "..."                  # import smoke test
npx remotion still ...         # visual gate
hyperframes lint <dir>         # static gate (0 errors / 0 warnings)
```

Rules: no external CDN at render time (this repo is offline-first — `toolkit/vendor/`), all animation driven by `useCurrentFrame()`, seeds explicit, no `Math.random()` anywhere in shipped compositions.

---

## Cross-cutting: prompt shapes that work

| Goal | Prompt shape |
|---|---|
| Extraction | "Return ONLY structured output" + a literal JSON/OTIO schema in the prompt |
| Design | "Give me the plan first; do not write code until I approve the shot list" |
| Critique | Adversarial scaffold + ≥3 specific flaws + score /10 (see `critic-protocol.md`) |
| Multi-agent | "Use an orchestrator with a builder subagent and an adversarial critic subagent; log rounds" |
| Long decode | "Emit the full composition, its tests, and the QA sheet in one response" |

## Cross-cutting: what never to ask Argon for

```text
✗ pixels (image generation not supported)
✗ audio/music (audio generation not supported)
✗ realtime interaction (Live API not supported)
✗ a fine-tuned house style (tuning not supported)
✗ temperature/top_p tuning (silently ignored)
✗ thinking_budget / MINIMAL (HTTP 400)
```
