# Forensics — the 2026 tool & model atlases

Four complete scans + one reusable method, captured on **2026-10-16**. These documents exist so that a render decision can cite a spec table instead of a vibe.

| Atlas | Skill bundle | Covers | Headline finding |
|---|---|---|---|
| **Gemini 4 Argon** | `skills/gemini-4-argon-forensic-atlas/` | The only frontier model that **ingests video with audio**; Blender MCP loops; critic protocol; Real2Sim | 1M-token unified window, 1M-token *output* via long decode, LVBench 91.7% — and *no* image or audio generation at all |
| **Higgsfield** | `skills/higgsfield-forensic-atlas/` | Genjutsu (Motion Transfer · Object Swap · Restyle), **Katana**, Cinema Studio 4.0, 3D Jutsu, Supercomputer, Canvas, 40+ surfaces | The suite's centre of gravity is **post-production**, not generation — and the MCP surface has a billing footnote that inverts the pitch |
| **heygen-com (GitHub org)** | `skills/heygen-github-forensic-atlas/` | hyperframes (65k★, vendored here), skills repo, heygen-cli, community skills, **TransVLM**, TAVR, LiveAvatar | **TransVLM** (SIGGRAPH Asia 2026) detects *any* shot transition — a free upgrade to the REA pipeline |
| **remotion-dev (GitHub org)** | `skills/remotion-github-forensic-atlas/` | 120+ repos: core 4.0.536, 12 skills, 5 agent plugins, every template, recorder/canvas-capture, Rust FFmpeg | Five agent-plugin repos prove the engine now assumes **an agent writes the composition**; `html-in-canvas` (★197) makes real-UI capture a first-class input |
| **The method** | `skills/forensic-scan-protocol/` | The 27 probes, evidence tiers A–E, hidden-surface hunting, ethics line | Vendor demos without cost/timing/eval are **C-tier** and must never be laundered into fact |

## Model stack (concurrent snapshot)

See [`2026-model-stack.md`](2026-model-stack.md) for the side-by-side of **Claude Opus 5.5 · GPT-6.1 Sol · Gemini 4 Argon · GPT-6 Astra · GPT-6 Sol · Claude Fable 5.1**.

## How the atlases connect to the render engines

```text
                      ┌─────────────────────────────────────────┐
  FOOTAGE  ──────────►│  Gemini 4 Argon   (video+audio in)      │──► EDL / beats / take flags / critique
                      └─────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴───────────────────────┐
  PLATES   ──────────►│  Higgsfield  (Genjutsu · Katana · CS4)  │──► previs, pickups, format transfer
                      └─────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴───────────────────────┐
  CODE     ──────────►│  Opus 5.5 / GPT-6.1 Sol  (text+image in)│──► composition code, patches, plans
                      └─────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴───────────────────────┐
  RENDER   ──────────►│  HyperFrames (Engine B) · Remotion (A)  │──► deterministic MP4 / stills
                      └─────────────────────────────────────────┘
                                        │
                      ┌─────────────────┴───────────────────────┐
  GATES    ──────────►│  4-shot critic · seam-gate · lint · det │──► pass/fail, no opinions
                      └─────────────────────────────────────────┘
```

## Rules distilled from the scans

1. **Route footage to Argon.** Neither Opus 5.5 nor GPT-6.1 Sol accepts video. Contact sheets are the image-input bridge.
2. **Never let a model write pixels when it can write a scene.** Blender MCP / Three.js / Remotion output is re-editable; generated clips are not.
3. **Ask for the raw gate output.** Summaries hide failures.
4. **Separate the critic from the writer**, and require ≥3 named flaws — a 10/10 with no flaws is a failed round.
5. **Check the footnote before you budget.** Unlimited plans, clip ceilings and cache cliffs all live below the fold.
6. **Enumerate tools after auth.** Documented tool names contain typos; `tools/list` does not.
7. **Consent and licence first.** Reference edits must be owned or licensed; likeness needs a release.

## Related files

- [`../VIDEO-GALLERY.md`](../VIDEO-GALLERY.md) — the rendered-video showcase (13 films) with specs and links
- [`../video-gallery.html`](../video-gallery.html) — the same gallery as a playable page
- [`../../skills/README`](../../skills) — the full skill catalog
