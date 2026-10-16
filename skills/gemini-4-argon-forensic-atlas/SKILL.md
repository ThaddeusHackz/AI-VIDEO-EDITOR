---
name: gemini-4-argon-forensic-atlas
description: "Complete forensic atlas of Google Gemini 4 Argon (gemini-4-argon) for video editing, animation, CGI/VFX and 3D: full capability matrix, agentic video understanding, 1M-token long decode, Blender MCP multi-agent loops, the 4-screenshot critic protocol, Antigravity skills, Real2Sim/render-QC pipelines, and every documented + lesser-documented limit, wired into Remotion / HyperFrames / REA."
---

# Gemini 4 Argon — Forensic Atlas for Video, Animation, CGI & VFX (`gemini-4-argon-forensic-atlas`)

> **Scan date:** 2026-10-16 · **Model:** `gemini-4-argon` (Gemini 4 generation, first release)
> **Announced:** 2026-09-30 · **GA:** 2026-10-13 (Antigravity, Google AI Ultra) · **Intro pricing:** $2 / 1M input, $10 / 1M output
> **Verdict up front:** Argon is **not a video generator and not an image generator**. It is the strongest *reasoning-and-critique* layer available for a video pipeline: it watches footage for up to ~45 minutes with audio, scrubs it agentically, drives Blender headless over MCP, writes the Three.js/GLSL that renders the shot, and critiques its own renders in a loop until they clear a bar you set.

---

## 1. What Argon is, and what it is *not*

| It is | It is not |
|---|---|
| A 1,048,576-token **unified** (input + thinking + output) context model | A text-to-video model (no Veo output through the API) |
| **Text-output only.** Inputs: text, image, video, audio, PDF | An image generator — *image generation is explicitly `Not supported`* |
| The **orchestrator/critic** of a render loop (Blender MCP, Three.js, WebGPU) | An audio generator — *audio generation `Not supported`* |
| State of the art on **long video understanding** (LVBench **91.7%**) | A Live API / realtime-voice model — *Live API `Not supported`* |
| Capable of **1M-token single-pass output** via *long decode* | A fine-tunable model — *tuning `Not supported`* |

Everything else in a finished video (pixels, audio, music) comes from **sibling** systems Argon orchestrates: **Nano Banana** (stills), **Flow** (concept frames), **Gemini Omni Flash** (audio), **Gemini 3.8 TTS** (voiceover), **Lyria 3.5** (score), **Veo** (generated shots), plus **Blender / Three.js / WebGPU / MuJoCo** for anything that must be *programmable and re-editable*.

---

## 2. Verified capability matrix (API + Enterprise surface)

```text
Model code            gemini-4-argon
Context window        1,048,576 tokens  (unified input + thinking + output)
Max output            65,536 default synchronous · up to 1,048,576 with long decode
Thinking              low / medium (default) / high   — thinking_budget & MINIMAL => HTTP 400
Sampling              temperature, top_p, top_k are IGNORED (do not tune them)
Caching               implicit only — explicit caching NOT supported
Inputs                text · image · video · audio · PDF
Outputs               text only
Tools                 Google Search grounding · Maps grounding · Agent Search ·
                      Parallel Web Search · Exa Web Search · Grounding for Enterprise ·
                      Code execution · Function calling · Computer use (preview) ·
                      File search · URL context
Consumption           Batch API · Flex inference · Priority inference
Agentic video         Supported (defaults to "static" mode)
Video limits          ~45 min with audio · ~60 min without audio · max 10 videos per prompt
Video MIME            video/x-flv, quicktime, mpeg, mpegs, mpg, mp4, webm, wmv, 3gpp
```

### 2.1 The two headline numbers that actually matter for editing

1. **`long decode` up to 1M output tokens** — one trajectory can emit an entire multi-file project (a Remotion composition, a shader library, a full EDL + FCPXML + SRT set) *plus* its tests, without splitting the job across calls. This is what makes "give me the whole showreel as code" viable in a single pass.
2. **Agentic video understanding** — the model *scrubs* across timestamps itself, pulls individual frames at high resolution, and fuses what it sees with **spoken narration or console audio**. Static captioning was the old failure mode; agentic scrubbing is why a 45-minute cut can be indexed into an edit decision list with sub-second timestamps.

### 2.2 Benchmarks Google publishes (treat as vendor numbers)

| Benchmark | Score | What it implies for this repo |
|---|---|---|
| **LVBench** (long video understanding) | **91.7%** SOTA | Frame-accurate QC and cut-detection notes on long renders |
| **DeepSWE v1.1** (long-horizon SWE) | 77.9% | Multi-file composition authoring without mid-task collapse |
| **AutomationBench** (Zapier, 47-tool workflows) | 51.3% #1 | Long tool chains (encode → upload → notify) survive |
| **CWE-bench v1** (vulnerability remediation) | 68% (tie 1st) | Safe defaults in generated pipeline code |
| Internal long-context suite (256K→1M) | 84.2% | Whole-project reasoning at repo scale |

---

## 3. The forensic layer: how Argon actually gets used professionally

The public launch is 90% benchmark chart, 10% demos. Reverse-engineering the demos is where the real mechanics live.

### 3.1 The four-agent shape (Antigravity)

```text
Orchestrator (Argon)
├── Skill document      ← markdown "documentation handed to the agent" = Antigravity skill
├── Blueprint subagent  ← calls a tool to draft architectural/technical blueprints
├── Reference generator ← Nano Banana turns blueprints into 4 idealized reference images
├── Builder subagent    ← drives Blender headless (CLI), sculpts geometry
└── Adversarial critic  ← compares RENDERS vs REFERENCE images, lists ≥3 concrete flaws,
                          scores /10, and blocks the loop until the score clears 9
```

Key deltas versus "prompt → video":
- **Blender is driven headless from the command line**, not by a human in a viewport.
- The loop is **adversarial**: the critic's job is to find faults, not to approve.
- **Work is split across subagents** under one orchestrator, which is why 45–1,000 rounds is affordable.
- Output is a **scene file**, not pixels. You can re-aim the camera, swap the mesh, re-light — then render at any resolution/bit-depth and take it into Resolve/Premiere as ordinary CG.

### 3.2 The pagoda / cathedral / Pixel-CAD evidence

| Demo | Loop length | What it proves for post |
|---|---|---|
| **Japanese pagoda complex** (Blender via Blender MCP) | Multi-agent critique loop | Full environment: buildings, foliage, photoreal architecture, lighting |
| **Gothic cathedral** (from a 2D Flow concept) | **45 rounds** comparing geometry to reference | Concept-frame → editable 3D scene → walkthrough render |
| **Pixel CAD exploded-view animation** | **~1,000 self-check rounds** | Exploded-view motion graphics, lighting, camera choreography + audio, every frame drawn by algorithmic geometry (3D meshes, particle sims, vector geometry) |
| **Desk → miniature racing game** | Multi-agent loop | Blender MCP modeling + collision-check, **Nano Banana** textures, **Gemini Omni Flash** engine audio, **Three.js** physics + custom shaders |
| **Medical anatomy explorer** | — | 3D anatomical layers, clinical metadata, biomechanics triggers — "layer peel" motion graphics |
| **Sunlit library ray-tracer** | — | 100% Python 3D ray-tracing engine + custom video tool + audio mixer; documented with **Gemini 3.8 TTS** VO and **Lyria 3.5** music |

> **Read this like a producer:** the pagoda is *a marketing video without cost, timing, or eval attached* (independent commentary, 2026-10-15). The mechanism is credible and reproducible; the quality claim is not yet independently verified. Budget review time per round.

### 3.3 Real2Sim — the under-reported one that matters for CGI

From the Google Developers Blog (2026-10-13), Argon does **Real2Sim** reconstruction:

- **Robot view → twin:** watches a teleop episode, builds a MuJoCo digital twin, tunes assets/scenes until *sim visuals and contact events* match the recording.
- **Human view → twin:** from egocentric human video it identifies task objects, replaces crude bounding boxes with **compound convex-decomposed meshes** (necessary for concave containers), and retargets hand trajectories onto a **76-DoF bimanual humanoid with 22-DoF five-fingered hands**.
- **Hindsight labeling:** from a 136-second bimanual origami task it produced a time-aligned **4-level hierarchy** — Episode Goal (G1) → 6 Semantic Subtasks (G2) → 17 contact-level Atomic Primitives (G3) → automated **QC reweighting** that holds task progress flat through fumbles and retries.
- **Action improvement:** single RGB photo → calibrated MuJoCo twin → 4,500+ domain-randomized episodes → real-robot success **56% → 75%**, completion **35s → 24s**.

**Why an editor should care:** the G1/G2/G3/QC hierarchy is a *general* shot-annotation grammar. Applied to footage it yields the exact structure an NLE wants: act → scene → beat, with fumbles (retakes, dead air, unusable takes) flagged and down-weighted automatically. See `references/editing-playbook.md` §3.

---

## 4. The critic protocol (steal this, it is the highest-ROI artefact in the scan)

Google's own AI Studio developer guide publishes the stack recommendation and the critic loop. This repo now adopts it as the standard render-QA gate:

```text
Recommended stack for agentic 3D work (verbatim from the guide):
    Vite + Three.js + Headless Blender MCP + headless browser screenshots

Critic protocol (per round):
    render 4 screenshots:
        1) three-quarter overview      2) close-up
        3) low angle — proves nothing floats  4) wireframe — proves clean geometry
    critic must list >= 3 SPECIFIC flaws
    critic must score the scene out of 10
    loop continues until score >= 9
```

Map it onto this repo (HyperFrames + Remotion):

| Critic screenshot | Repo equivalent | Command |
|---|---|---|
| 3/4 overview | `remotion still --frame=<key>` at the wide beat | `npx remotion still src/index.ts Cinematic3D-Showcase out/qc/wide-120.png --frame=120` |
| Close-up | product/detail beat still | `--frame=<detail>` |
| Low angle (nothing floats) | floor-contact beat; check for hover artefacts under subject | `--frame=<grounded>` |
| Wireframe (clean geometry) | toggle wireframe/shader-debug material, re-still | composition prop or debug flag |

Then run `scripts/seam-gate.mjs verify` for numeric seam compliance — the critic score and the seam gate are complementary gates, not substitutes.

---

## 5. Wiring Argon into this repo

Argon is the **director/critic**, not the renderer. Concretely:

```bash
# 0. Environment
export GEMINI_API_KEY=...           # API route
# or run the same prompts inside Antigravity (Google AI Ultra) with skills enabled

# 1. Index a reference or a finished cut into an EDL  (Argon video in -> text out)
#    feed the .mp4 (<=45 min w/ audio, <=60 min silent, <=10 files/prompt)
#    ask for: shot list, per-shot camera/motion, beats, palette, pacing, dead air,
#             retake flags, and a machine-readable EDL + FCPXML + SRT

# 2. Replicate it deterministically in this repo
node scripts/seam-stamp.mjs --ledger <ledger.json> --write <index.html>   # HyperFrames path
npx remotion render src/index.ts <Composition> out/<name>.mp4             # Remotion path

# 3. Critic gate: 4 stills -> >=3 flaws -> score >= 9 -> then seam gate
node scripts/seam-gate.mjs verify --ledger <ledger.json> --project <dir>
```

Rules of engagement:
- **Never let Argon write pixels directly.** It writes *scenes and code*; the repo renders deterministically. That is what keeps output reproducible and re-editable.
- **Static mode vs agentic mode:** agentic video understanding "defaults to static". If you need scrubbing, ask for it explicitly.
- **No sampling knobs.** Temperature/top_p/top_k are ignored — spend your effort on thinking level and context shape instead.
- **Thinking level:** `medium` for QC passes, `high` for scene design / shader authoring, `low` for bulk EDL extraction where you already gave it a schema.

---

## 6. Verified limits, footguns and honesty notes

| Item | Reality |
|---|---|
| `thinking_level="MINIMAL"` / `thinking_budget` | **HTTP 400** — only LOW / MEDIUM / HIGH exist |
| Sampling params | Silently ignored (no error) |
| Explicit context caching | Unsupported (implicit only) — do not build a cache-hit budget around it |
| Image / audio generation, Live API, tuning | Not supported. Route to Nano Banana / Omni Flash / TTS / Lyria |
| RAG Engine (Enterprise) | Not supported |
| Video payload ceilings | ~45 min with audio; ~60 min silent; 10 videos/prompt — chunk longer masters |
| Demo claims | Vendor demos (pagoda, cathedral, Pixel CAD) ship **no cost, timing or eval numbers**. Treat as capability direction, measure yourself per project |
| Antigravity access | AI Ultra subscribers, GA from 2026-10-13; API is the portable route |
| Cost | Intro $2 / $10 per 1M in/out — but long decode can spend 1M output tokens *in one call*. Cap it per task |

### Verification tests to run before trusting any Argon claim
1. **EDL determinism:** same clip twice → same shot boundaries (within tolerance).
2. **Critic honesty:** feed it a deliberately floating object — the low-angle shot must appear in its flaw list.
3. **Geometry proof:** request the wireframe screenshot; if the critic never asks for wireframe, it is pattern-matching, not inspecting.
4. **Round accounting:** log rounds-per-clear; a demo that claims "from scratch" should show a loop count.
5. **Re-editability:** if the output cannot be re-opened and re-aimed (a scene, not a clip), the pipeline failed the CGI test.

---

## 7. Source ledger

| Source | Date | Used for |
|---|---|---|
| `deepmind.google/blog/introducing-gemini-4-argon/` | 2026-10-13 | Pagoda, Blender MCP, ray-tracer, Real2Sim framing |
| `ai.google.dev/gemini-api/docs/models/gemini-4-argon` | 2026-10-13 | Capability matrix, token limits, unsupported list |
| `docs.cloud.google.com/.../models/gemini/4-argon` | 2026-10-15 | Video ceilings, MIME list, thinking/sampling behaviour |
| `developers.googleblog.com/gemini-4-argon-for-robotics/` | 2026-10-13 | Real2Sim, G1/G2/G3/QC hierarchy, 56→75% |
| `aistudio.google.com/learn/gemini-4-argon-developer-guide` | 2026-10-13 | Recommended stack, critic protocol, agentic video understanding |
| `blog.google/.../introducing-gemini-4-argon/` | 2026-10-13 | xTB speedups, shader/shatter game build |
| `9to5google.com/.../gemini-4-argon-announcement/` | 2026-09-30 | Launch framing, bench table vs Opus 5.5 / GPT-6 Astra |
| `traictory.com/news/2026-10-15-gemini-4-argon-blender-pagoda` | 2026-10-15 | Independent critique: no cost/timing/eval published |
| `@sundarpichai` X thread | 2026-10-13 | Pixel CAD exploded view, 1,000 rounds, Mars telemetry deck |

References in this bundle:
- [`references/capability-matrix.md`](references/capability-matrix.md) — every field, verbatim + interpreted
- [`references/critic-protocol.md`](references/critic-protocol.md) — the 4-shot gate, scoring rubric, failure modes
- [`references/blender-mcp-loop.md`](references/blender-mcp-loop.md) — headless Blender, orchestrator/critic agents, slash commands, skills
- [`references/editing-playbook.md`](references/editing-playbook.md) — 6 production workflows from footage → finished, deterministic edit
