# The 2026 frontier stack, side by side

Snapshot **2026-10-16**. Vendor-published numbers unless marked *(independent)*.

## 1. Head-to-head

| | **Gemini 4 Argon** | **Claude Opus 5.5** | **GPT-6.1 Sol** | GPT-6 Astra | GPT-6 Sol | Claude Fable 5.1 |
|---|---|---|---|---|---|---|
| Vendor | Google | Anthropic | OpenAI | OpenAI | OpenAI | Anthropic |
| Released | 2026-09-30 (GA 10-13) | 2026-09-22 | 2026-09-29 | *scrapped 6.1* | 2026-09-22 | 2026 |
| API id | `gemini-4-argon` | `claude-opus-5-5` | `gpt-6.1-sol` | — | `gpt-6-sol` | — |
| Context | **1,048,576** | 1,000,000 | 1,050,000 | — | 1,050,000 | — |
| Max output | 65,536 sync / **1,048,576 long decode** | 128,000 (300,000 batch beta) | 128,000 | — | 128,000 | — |
| Inputs | text, image, **video, audio**, PDF | text, image | text, image | — | text, image | — |
| Output | **text only** | text | text | — | — | — |
| Reasoning control | thinking low/med/high | **adaptive (always on) + `effort`** | effort low→max (5 levels) | — | — | — |
| Price in/out | $2 / $10 | $4 / $20 | **$2 / $10** | $10 / $50 | $2 / $10 | — |
| Cached input | implicit only | $0.20 | **$0.10 (−95%)** | $1.00 | $0.20 | — |
| Rate cliff | — | — | **>272K in: 2× / 1.5×** | — | — | — |
| Batch discount | supported | 300K-output beta | **50% off (Batch/Flex)** | — | — | — |

## 2. Benchmark comparison

| Benchmark | Argon | Opus 5.5 | Fable 5.1 | Opus 5 | Astra | Sol (6.1) | GPT-5.6 Sol |
|---|---|---|---|---|---|---|---|
| DeepSWE v1.1 | **77.9%** | 74.2% | — | — | 74.1% | 75.2%* | — |
| Terminal-Bench 4.0 | — | **66.4%** | 55.8% | 52.3% | 57.9% | — | 37.3% |
| FrontierCode v1.1 | — | **54.4%** | 50.3% | 48.0% | 53.3% | — | 47.5% |
| CursorBench 4.0 | — | **57.8%** | 51.8% | 46.6% | — | — | 41.7% |
| LVBench (long video) | **91.7%** | — | — | — | — | — | — |
| AutomationBench | **51.3%** | — | — | — | — | 31.7% (medium) | — |
| OSWorld 2.0 | — | — | — | — | within 2.1 pts | +7 pts over Sol | — |
| Terminal-Bench Science 0.1 | — | $23.21/task | — | — | $23.80/task | **$5.47/task** | — |
| Intelligence Index *(indep.)* | — | — | — | — | **53** | 52 | — |
| Coding Agent Index *(indep.)* | — | **58 (tops)** | — | — | — | 2 below Astra | — |
| Factuality errors (low effort) | — | — | — | — | — | **7.7%** (from 11.4%) | — |

\* at **high** effort, vs GPT-6 Sol's 68.8% at **max**.

## 3. Cost of a full coding-index run *(independent, Artificial Analysis)*

| Model | Cost |
|---|---|
| GPT-6.1 Sol | **$0.72** |
| GPT-6 Sol | $1.05 |
| GPT-6 Astra | $3.26 |
| Claude Opus 5.5 | $5.98 |

Interpretation: **Sol is the volume machine, Opus 5.5 is the quality machine, Argon is the only one that can watch the film.**

## 4. What each is for in this repo

| Need | Model | Why |
|---|---|---|
| Understand footage / build an EDL | **Gemini 4 Argon** | Only video+audio ingest; LVBench 91.7% |
| Critique a render adversarially | **Claude Opus 5.5** (high effort) | Self-verification, root-cause-first, creative checks |
| Author the hardest shader/geometry code | **Claude Opus 5.5** | Benchmarks + reported self-check behaviour |
| Iterate 50 turns cheaply | **GPT-6.1 Sol** (medium, cached prefix) | 95% cache discount; $0.26/turn at 90% cache |
| Bulk mechanical refactors | **GPT-6.1 Sol** (low/medium) | 7.7% error rate at low effort; `apply_patch` + hosted shell |
| Long PDF/document work | **GPT-6.1 Sol** or Argon | Sol's GDP.pdf claims; Argon's context |
| Render the deliverable | **This repo** | $0 per re-render, deterministic |
| Realtime presenter | **HeyGen LiveAvatar** | Separate lane |

## 5. Platform lanes behind the models (generation side)

| Lane | Owner | Notes |
|---|---|---|
| Seedance 2.5 / Kling 3.0 / Wan 3.0 / MiniMax / Veo | Higgsfield aggregator | $0.0117–$0.2057 per second of output |
| Cinema Studio 4.0 | Higgsfield | 30 s, 50 refs, native audio, ~3 dozen camera/era/pace presets |
| Genjutsu · Katana | Higgsfield | Motion transfer / object swap / restyle; edit rebuild in Claude |
| 3D Jutsu | Higgsfield | Editable 3D scene → video |
| Nano Banana (Pro) · Imagen | Google | Still generation and reference scaffolding |
| Gemini 3.8 TTS · Gemini Omni Flash · Lyria 3.5 | Google | Voiceover, omni audio, score |
| Blender (headless, via MCP) | Open source | Geometry, sculpt, volumetrics, camera — *editable* output |
| Remotion · HyperFrames | This repo | Deterministic compositing, motion graphics, captions, grade, mix |

## 6. The four rules that follow from the table

1. **Video never goes to Opus or Sol.** Contact sheets are the only bridge.
2. **Quality-critical reasoning goes to Opus 5.5; volume goes to Sol.** The independent index gap is ~2 points; the cost gap is ~8×.
3. **Generation is for plates; code is for everything else.** Re-renders are free, re-generations are not.
4. **Benchmarks are tier-C evidence about your project.** Build the harness (doctrine + gates) and measure your own tasks.

## 7. Sources

See the source ledgers inside each skill bundle:
`skills/gemini-4-argon-forensic-atlas/SKILL.md` §7 · `skills/opus-5-5-sol-6-1-director/SKILL.md` §11 · `skills/higgsfield-forensic-atlas/SKILL.md` §8 · `skills/heygen-github-forensic-atlas/SKILL.md` §9 · `skills/remotion-github-forensic-atlas/SKILL.md` §6.
