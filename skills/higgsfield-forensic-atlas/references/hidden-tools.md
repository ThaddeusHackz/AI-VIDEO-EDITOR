# Higgsfield — hidden & lesser-documented surface

Everything below is real, sourced, and mostly **absent from the marketing header**. This is the part of a forensic scan that actually changes how you build.

## 1. Billing traps

| Trap | Detail | Counter-move |
|---|---|---|
| **Unlimited does not travel** | Unlimited models / free generations on paid plans work **only on higgsfield.ai** — not via MCP, CLI, Canvas or Supercomputer. Those surfaces always deduct metered credits | Estimate metered cost per pipeline run; never assume plan perks apply in Claude |
| **Canvas is free to build, costs to run** | Building a node graph costs nothing; credits fire when a node generates | Prototype graphs cheaply, dry-run before batching |
| **Supercomputer shows running cost** | Each step costs at standard rate and the running cost is displayed as it works | Watch it; long agent runs are not free |
| **MCP clips ≈15 s** | Through the connector, video comes back up to ~15 s | Assemble long-form from MCP clips, or use the platform |
| **Model prices move** | e.g. Seedance 2.5 $0.144/s (30% off), Genjutsu $0.159/s (50% off), Kling 3.0 $0.042/s, Soul 2 $0.0032/image, MiniMax Hailuo 2.3 $0.0117/s | Re-read the model page before quoting |

## 2. Agent surface reality

| Item | Reality |
|---|---|
| **MCP endpoint** | `https://mcp.higgsfield.ai/mcp` — Streamable HTTP, OAuth; answers **401 unauthenticated**; **no published tool list** |
| **Enumerate at runtime** | Ask the agent to list its Higgsfield tools before spending credits; `tools/list` is the contract, blog posts are not |
| **No API key for the connector** | Credentials stay on Higgsfield's side; usage bills against your credits |
| **ChatGPT extension** | Exists, with slash commands — a second agent surface beside Claude |
| **CLI + Skills** | For coding agents; same credit model |
| **Supercomputer brain is selectable** | Claude / GPT / Gemini; **Claude Opus 5.5 added 2026-09-23**, **GPT-6.1 Sol added 2026-09-29**. Note: Supercomputer defaults to "Orchestrator", so select the brain **manually** |
| **Supercomputer parallelism** | Up to **10** parallel chats (Ultra), **3** (Plus), **1** (Starter) |
| **Free Mode** | The LLM inside Supercomputer is free for brainstorming, prompts, scripting, research, planning — credits only when generating |
| **Memory & connectors** | Retains project context across sessions; connects 30+ services incl. **Slack, Google Drive, Notion, Figma**; supports scheduling and skills |
| **OpenAI Dots** | Always-on ChatGPT agents (GPT-6.1 Sol, own cloud computer) can generate video/images on Higgsfield through the Higgsfield plugin |

## 3. Non-obvious tools

| Tool | What it does | Why an editor cares |
|---|---|---|
| **3D Jutsu** (2026-09-04) | Prompt/reference → **editable 3D scene** (objects, layout, lighting, cameras, animation) → video. Edit one object without regenerating the scene | Previs and set-dressing without a DCC licence; pairs with the Blender-MCP workflow |
| **Explainer** (2026-07-02) | Powered by Claude Fable 5 + Gemini Omni Flash. Auto-researches a topic, narrates in any language, renders **up to 10 minutes** in one run. Now its own app with visual interface | Faceless documentary pipeline; the narration layer for long-form |
| **Gaming / Game Studio** | Prompt → playable browser game (art, sound, music, characters, multiplayer). In Supercomputer or via the Claude **Game Studio** skill | Interactive deliverables |
| **Apps** (2026-07-07) | Supercomputer builds generative apps that call Higgsfield models themselves — no API keys, with design, code, DB, sign-in. Templates: **Studio, Stepper, Simple App** | Ship the campaign tool, not just the spot |
| **Ad Reference** (2026-05-08) | Feed your top-performing videos → recreate the format, on-platform or via MCP (Claude, Hermes, OpenClaw) | Format transfer outside Claude |
| **Marketing Studio** | Product URL or image → finished video ad (UGC / unboxing / tutorial / TV spot) with audio + lip sync | Direct-response cutdowns |
| **Ads Studio / Ad Multiplier** | Batches of static ads from a catalogue / variants of a working video ad | Volume testing |
| **Lipsync Studio** | Lip-synced audio in **18 languages** | Localisation |
| **Photodump Studio · Fashion Factory · Mockup Studio · Popcorn** | Niche studios | Look-book and packaging work |
| **Layer Decompose** (in the Photoshop plugin) | Split a plate into usable layers | Parallax, 2.5D moves, element animation |
| **Vector Generation (SVG)** (Figma plugin) | Generate vectors, not just rasters | Imports straight into motion-graphics work |
| **Reference Extension · Collab** | Reference-driven consistency; realtime team generation | Studio workflows |
| **Virality scoring** | Predicts virality before publishing (via the connector) | Editorial filter before render spend |

## 4. Plugin surfaces (inside the tools crews already use)

| Plugin | Capabilities | Killer detail |
|---|---|---|
| **DaVinci Resolve** | Generation + **Upscale** ("up to 4K or 8K with real detail recovery") | Same tool as the web pipeline, inside the grade |
| **Adobe Premiere Pro** | Generation + **Upscale** | Timeline-native |
| **Adobe After Effects** | Generation → straight into the comp; **agent works with compositions, layers, keyframes, effects and scripts** via Supercomputer/MCP; recreate from references (design from an image, animation from a video) | The only bridge of its kind into AE's object model — the highest-leverage integration in this list |
| **Photoshop** | Realtime AI, Mockup Studio, Layer Decompose, Angles, Shots, Character Swap, Remove BG, Face Swap, Upscale, Skin Enhancer, AI Stylist, Cinema/Marketing Studio | Retouching and finishing |
| **Figma / FigJam** | Image gen, Vector Gen (SVG), Mockup Studio, Remove BG, Color Grading, Expand, Relight, Angles, Face Swap; FigJam adds **Canvas Nodes** chain workflows | Design-to-motion handoff |
| **Blender** | Scene Builder, 3D Model, Character Animation, Image and Video, Camera | Pairs with Gemini 4 Argon's Blender-MCP loop |

## 5. Access & install snippets

```bash
# MCP (Claude Code / Desktop)
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp
# then: sign in with a Higgsfield account (OAuth) and ask the agent to list its tools

# API + SDK (pay-per-generation, 50+ models)
# package: @higgsfield/client/v2  ·  credentials via HF_CREDENTIALS
```

## 6. What to verify before you build on any of it

- [ ] `tools/list` named the exact tool you plan to call (do not trust docs IDs)
- [ ] You are on a surface where you accept metered billing (MCP/CLI/Canvas/Supercomputer)
- [ ] Resolution and duration ceilings match your deliverable (e.g. 15 s on MCP)
- [ ] Upscale mode chosen deliberately (**Precise** vs **Creative**)
- [ ] Consent/release on file for every human reference image
- [ ] Reference edits licensed for Katana-style format transfer
