# Blender MCP Loop — driving a real 3D DCC headless from an agent

The most consequential Argon demo for this repo is not the pagoda *pixels*; it is that **Blender was driven headless from the command line by an orchestrator + adversarial critic pair, producing an editable scene file** rather than a video clip. That is the difference between a render and a recipe.

## 1. The recommended stack (Google AI Studio guide, verbatim row)

```text
For agentic IDEs:
    Vite + Three.js + Headless Blender MCP + headless browser screenshots
```

Interpretation:

| Component | Role | Repo equivalent |
|---|---|---|
| Vite | Fast dev surface for the code-rendered layer | `remotion/` + `npx remotion studio` |
| Three.js | Real-time 3D that ships in the browser | `remotion/src/engine/threeSceneStudio.tsx`, `@remotion/three` |
| **Headless Blender MCP** | Cinematic geometry, sculpt, bake, camera, lighting | *new* previs layer — render out of Blender, finish here |
| Headless browser screenshots | The critic's eyes | `remotion still`, Puppeteer/Chromium screenshots |

## 2. Anatomy of the loop

```text
┌──────────────────────── Antigravity ────────────────────────┐
│ skill.md  = documentation handed to the agent ("custom skills")│
│ /goal     = slash command that states the terminal condition  │
└──────────────┬──────────────────────────────────────────────┘
               ▼
        ORCHESTRATOR (Argon)
               │  splits work across subagents
   ┌───────────┼────────────┬───────────────┐
   ▼           ▼            ▼               ▼
Blueprint   References   Builder        CRITIC (adversarial)
 tool       Nano Banana  Blender(headless)  compares render vs reference
            (4 images)   via MCP/CLI        lists >=3 flaws, scores /10
   └───────────┴────────────┴───────────────┘
               ▲                           │
               └──────  iterate until >=9 ─┘
```

Observed cadences:

| Demo | Rounds | Notes |
|---|---|---|
| Gothic cathedral from a Flow concept | **45** | Geometry compared against the 2D reference each round |
| Pixel CAD exploded-view animation | **~1,000** | Self-check renders; every frame algorithmic (meshes, particles, vectors) |
| Pagoda temple complex | multi-agent loop | Orchestrator + adversarial critic; blueprints → 4 Nano Banana references → build |

## 3. Why "editable scene" beats "generated clip" every time

- **Re-aimable camera.** Client says "push in and make the logo bigger" → edit the scene, re-render. You do not re-roll generation and pray the character still matches.
- **Swappable mesh/material.** Same set, new product, no drift.
- **Bit-depth control.** Render high-bit-depth out of Blender, take it into Resolve/Premiere/FCP as ordinary CG, match the grade to live action. Clean CG is what gives itself away — you now control that variable.
- **Determinism.** Procedural geometry is reproducible; diffusion is not.

## 4. Practical recipe for this repo

```bash
# 1. Concept → reference
#    Generate 1 concept frame (Flow / Nano Banana), then 4 idealized reference images.
# 2. Blueprint
#    Ask Argon for: shot list, camera spec, scale, materials, light plan, render passes.
# 3. Blender headless
blender -b scene.blend -P build_scene.py            # geometry, materials, lights
blender -b scene.blend -o //renders/frame_ -F PNG -f 1   # a QC frame
# 4. Critic round (4 shots: wide / close / low / wireframe)  → see critic-protocol.md
# 5. Finish here
npx remotion render src/index.ts Cinematic3D-Showcase out/cinematic-3d.mp4
```

Handoff contract between Blender and this repo:

```text
EXR/PNG sequence, linear or ACEScg, 16-bit
+ camera move exported as an animation curve (so the Repo's cameraRig can match it)
+ a per-shot manifest: frame range, fps, shutter, focal length, light list
```

## 5. Slash commands & skills (Antigravity specifics)

- **`/goal`** — states the terminal condition for the agent (the thing the critic scores against). If the goal is vague, the loop cannot terminate honestly.
- **Custom skills** — in Antigravity, a "skill" is *documentation handed to the agent*: conventions, tool usage, house rules. This repo's `skills/` folder is the same idea, and Argon responds well to being handed `skills/motion-doctrine/SKILL.md` and this atlas as context.
- **Multi-agent loops** — prompt for them explicitly ("run an orchestrator with builder and adversarial-critic subagents"); a single-agent loop rarely sustains 45+ rounds.

## 6. Cost & control guardrails

| Guardrail | Value |
|---|---|
| Hard round budget | 12 rounds default; 45 for hero environments; document any run >100 |
| One axis per round | Freeze grade/lighting after round 3 |
| Flaw-to-diff mapping | Every round must name the flaw it fixes, one diff hunk per flaw |
| Reference freeze | Lock reference images after round 3 or the look drifts |
| Output contract | Scene file + camera curve + shot manifest, or the round does not count |

## 7. Honest limits

- The published pagoda demo carries **no cost, timing or eval numbers** (independent analysis, 2026-10-15). Determine your own rounds-per-deliverable before quoting.
- Headless Blender through MCP is a *pipeline* commitment: you need Blender on the box, a scene convention, and a render farm or patience.
- Argon cannot generate the audio for the scene. Audio-reactive lighting is *staged by* Argon but the audio itself comes from Omni Flash / TTS / Lyria.
