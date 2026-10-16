---
name: higgsfield-forensic-atlas
description: "Complete forensic atlas of Higgsfield (higgsfield.ai) — every model, studio, skill and hidden tool: Genjutsu (Motion Transfer, Object Swap, Restyle), Katana (Claude Motion edit-rebuild skill), Cinema Studio 4.0, 3D Jutsu, Supercomputer, Canvas, Explainer, Gaming, Ads/Marketing Studio, AI Influencer, Soul/Soul ID, MCP + CLI + Skills + API pricing, and the Resolve/Premiere/After Effects/Blender/Photoshop/Figma plugins."
---

# Higgsfield — Forensic Atlas (`higgsfield-forensic-atlas`)

> **Scan date:** 2026-10-16 · **Platform:** higgsfield.ai · **MCP:** `https://mcp.higgsfield.ai/mcp` (OAuth, no API key) · **Positioning:** an AI-native creative suite that sits *on top of* third-party models, not a single model company.
> **The one-sentence thesis of the platform:** Higgsfield is the only mainstream suite whose centre of gravity is **post-production** — motion transfer, edit rebuild, relight, upscale, decompose, 3D scene assembly — rather than text-to-video. That is why it belongs in this repo next to the NLE and the compositor.

---

## 1. The map (everything, including the rarely-listed surface)

```text
HIGGSFIELD
├── EDIT / TRANSFORM
│   ├── Genjutsu ................. Motion Transfer · Object Swap · Restyle  (video in → video out)
│   ├── Katana ................... edit rebuild from ONE reference (Claude skill, "Claude Motion")
│   ├── Relight .................. lighting pass on existing footage
│   ├── Color Palette ............ grading pass / palette transfer
│   ├── Layers ................... image decomposition into usable elements
│   ├── Upscale (FLUX 3) ......... Precise mode + Creative mode; up to 4K/8K claims
│   └── Expand ................... 16:9 ⇄ 9:16 reframing without re-shoot
├── GENERATE (own models)
│   ├── Soul 2 / Soul Standard ... portrait + fashion image family
│   ├── Soul ID .................. train a character ONCE, reuse across images AND video
│   ├── Soul Cinema · Soul HEX ... cinematic / stylised Soul variants
│   ├── Cinema Studio 4.0 ........ cinematic video, camera control, multi-shot, physics motion
│   ├── DOP · Keyframes .......... camera-motion + first/last-frame control (the DoP lineage this repo presets)
│   ├── AI Influencer ............ character studio, 19 menu settings, optional your-own-face
│   ├── Marketing Studio ......... product ad from a URL or an image (UGC / unboxing / tutorial / TV spot)
│   ├── Ads Studio ............... batches of static ads from a catalogue
│   ├── Ad Multiplier ............ variants of a working video ad
│   ├── Ad Reference ............. feed top-performing videos → recreate the format
│   ├── Explainer ................ faceless documentary pipeline (auto-research + narration)
│   ├── Lipsync Studio ........... lip-synced audio in 18 languages (platform-wide)
│   ├── Photodump Studio · Fashion Factory · Mockup Studio · Popcorn
│   └── 3D Jutsu ................. AI-native 3D workspace: objects, layout, lighting, cameras, animation → video
├── ORCHESTRATE
│   ├── Supercomputer ........... agent: plans, picks models, executes, schedules, connects apps
│   ├── Canvas .................. node graph: prompt → image → video → edit; templates; collab
│   ├── Collab .................. realtime team generation
│   ├── Games ................... prompt → playable browser game (art, sound, music, multiplayer)
│   └── Apps .................... Supercomputer builds generative apps on Higgsfield models
├── PIPE INTO AGENTS
│   ├── MCP (Claude + any MCP client), ChatGPT extension with slash commands
│   ├── CLI + Skills (coding agents), Reference Extension
│   └── API + Python SDK (pay-per-generation, 50+ models)
└── PLUGINS (inside the NLE / DCC)
    ├── DaVinci Resolve · Adobe Premiere Pro · Adobe After Effects
    ├── Photoshop · Figma/FigJam · Blender
    └── OpenAI Dots (always-on agents → Higgsfield video/image)
```

---

## 2. Genjutsu — reality manipulation (the NLE-relevant one)

Launched **2026-09-01** (API listings date the models 2026-09-17). Three operations:

| Operation | What it does | Inputs | Output |
|---|---|---|---|
| **Motion Transfer** | Extract motion from a reference clip, rebuild the scene around **your** characters/products/wardrobe | reference video **4–30 s** (product page also cites 1–30 s) + up to **30 reference images** | 480p / 720p / **1080p** |
| **Object Swap** | Replace exactly the element you describe; **everything else stays as filmed** | same | same |
| **Restyle** | Redraw the whole clip in a new style (anime, claymation, comic) **while keeping the original motion** | video | 480p–1080p |

Why this is not "just vid2vid":

- **Camera & cut preservation.** Motion Transfer *decouples cinematography from aesthetics*: your iPhone clip's camera trajectory, timing and framing survive frame-for-frame instead of being hallucinated into a new angle.
- **Surgical isolation.** Object Swap is designed to touch only the targeted element and lock down the original lighting, lens grain and scene physics — i.e. it behaves like **automated tracking + roto + inpainting**, not a re-generation.
- **No prompt required.** 30+ presets do the job when you do not want to write one.

**Correct use in a professional pipeline (per independent editorial review):** it is a **previs and pickup** tool, not a finishing tool. The use that holds up: a client approves blocking in a reference clip → recast it with *their* product and *their* talent's wardrobe **before anyone books a stage**. The use that does not hold up yet: 1080p motion-transfer output cut against 4K principal photography.

API shape (Open Higgsfield):

```ts
import { config, higgsfield } from "@higgsfield/client/v2";
config({ credentials: process.env.HF_CREDENTIALS });

const result = await higgsfield.subscribe("higgsfield/genjutsu/motion-transfer/v1.0", {
  input: {
    prompt: "swap the video's main character to the attached characters and their clothes",
    video_url: "https://example.com/input.mp4",
    image_urls: ["https://example.com/input.jpg"],
    resolution: "720p",
  },
  withPolling: true,
});
```

> **Typo trap from the official docs:** the published playground snippet spells the namespace `higgsfiled/...` (missing the second `g`). Verify the namespace against `tools/list` before shipping a call — a copy-pasted ID from a docs page is not a contract.

---

## 3. Katana — edit rebuild inside Claude (the newest piece)

Released **2026-10-08**. Runs as a **Higgsfield skill in Claude** via MCP, credited as "powered by **Claude Motion**".

| You give Katana | Katana returns |
|---|---|
| A **reference edit** — your own video **or** a preset from the Katana library (3–30 s) | A new video that follows the reference's **shot structure, pacing and overall edit** |
| Up to **5 images of characters, products or clothing** | Your subjects placed in those shots |
| Optional instructions on what to keep or change (Prompt toggle) | A finished short-form edit, **in the chat and in your Higgsfield Assets** |

Preset families: **Aura Farming**, **Motion**, **Clipping**. Community presets can be published from the Katana page (3–30 s motion video, up to **40 images**, prompt that references them with `@`); published presets go live immediately and can be taken down after reports.

Iteration model that matters: corrections apply to **the edit that already exists**, so each revision starts from the previous result, and Higgsfield's own testing reported **only the affected shots were regenerated**. A second version with a different character/product is *one more message in the same conversation*.

**Editorial read:** Katana is not a generator — it **copies the structure of an edit you already like** (cuts, pacing, framing, effects) and fills it with your material. That is a format-transfer tool, the thing a brand actually needs when it says "make ours like the one that worked."

**Legal note Higgsfield itself states:** use a reference edit **you own or have permission to use**. Treat format transfer like any other licensed asset.

Pairing: Genjutsu and Katana share one Claude chat and one **Assets** library — a clip transformed with Genjutsu can become a Katana reference, and a Katana edit can be pushed further without leaving the chat.

---

## 4. Cinema Studio 4.0 — directed generation

Released **2026-09-18** (model listing), built on **Seedance 2.5**.

| Spec | Value |
|---|---|
| Single-generation length | up to **30 seconds** |
| References | up to **50 images** |
| Resolution lanes | 480p – 720p (API listing) with platform-side upscale paths beyond |
| Audio | **native audio** in-generation |
| Directable | character **emotions**, **era**, **editing pace**, camera movement — ~**3 dozen presets** |
| API price | **$0.2057 – $0.4623 / sec** |
| Character consistency | Cinema Studio + **Soul ID / Elements** (@-tagged elements) |

The directable axes are the interesting part for motion graphics: *emotions*, *era*, *editing pace* and camera movement can be dialled, which maps 1:1 onto this repo's `cinema-studio-4-presets` skill and the DoP camera rigs.

---

## 5. Hidden & lesser-documented surface (the reason this scan exists)

Items that do **not** appear on the marketing header but change how you build:

| Hidden thing | What it is | Why it matters |
|---|---|---|
| **Unlimited-generation footnote** | Unlimited models and free generations on paid plans are **only** on higgsfield.ai — **not** via MCP, CLI, Canvas or Supercomputer. Those surfaces always burn metered credits | Budgeting trap: "unlimited Kling" does not follow you into Claude |
| **MCP tool list is auth-gated** | The endpoint answers **401 unauthenticated** and Higgsfield publishes **no tool list**; you must `tools/list` after connecting | Never hard-code tool names from a blog post; enumerate at runtime |
| **MCP clip ceiling** | Through MCP, clips come back **up to ~15 s** | Long-form must be assembled, not requested |
| **Supercomputer brain is selectable** | Pick the LLM: Claude, GPT, Gemini — **Claude Opus 5.5 added 2026-09-23**, **GPT-6.1 Sol added 2026-09-29** (select manually; Supercomputer defaults to "Orchestrator") | The orchestrator model is a production variable, not a fixed box |
| **Parallelism is plan-gated** | Supercomputer runs up to **10 parallel chats on Ultra**, **3 on Plus**, **1 on Starter** | Batch throughput is a plan decision |
| **Free Mode in Supercomputer** | The LLM inside Supercomputer is free for brainstorming/prompting/scripting/planning; credits only on generation | Free pre-production layer |
| **3D Jutsu** | Released **2026-09-04**: prompt or reference → editable 3D scene (objects, layout, lighting, cameras, animation) → video; **edit one object without regenerating the scene** | Previs and set-dressing without a DCC licence |
| **Explainer** | Faceless documentaries: auto-research, narration in any language, **up to 10 minutes in one run** | Long-form narration pipeline |
| **After Effects plugin via MCP + Supercomputer** | The agent works **directly with compositions, layers, keyframes, effects and scripts**, and imports generations straight into the comp | The only bridge of its kind into AE's object model |
| **Blender plugin** | Generation and scene work inside Blender: **Scene Builder, 3D Model, Character Animation, Image and Video, Camera** | Pairs with the Argon Blender-MCP workflow in this repo |
| **Photoshop plugin** | Realtime AI, Mockup Studio, **Layer Decompose**, Angles, Shots, Character Swap, Remove BG, Face Swap, Upscale, Skin Enhancer, AI Stylist + Cinema/Marketing Studio | Layer Decompose is the sleeper: plates become editable layers |
| **Figma/FigJam plugin** | Image gen across models, **Vector Generation (SVG)**, Mockup Studio, Color Grading, Expand, Relight, Angles, Face Swap; FigJam adds **Canvas Nodes** with chain workflows | SVG vectors import directly into motion graphics work |
| **Games** | Prompt → playable browser game: art, sound, music, characters, multiplayer; via Supercomputer or the Claude **Game Studio** skill | Interactive deliverables from the same pipeline |
| **Apps** | Supercomputer builds generative apps that call Higgsfield models itself (no API keys), with auth/DB; templates: Studio, Stepper, Simple App | Ship the promo tool, not just the promo |
| **Ad Reference** | Feed top-performing videos → recreate the format on-platform or via MCP (Claude, Hermes, OpenClaw) | Format transfer outside Claude too |
| **MCP micro-tools (June 2026)** | Kling Motion Control, Click-to-Ad, Remove Background, Upscale to 4K, Expand to 16:9/9:16 | Small, composable post operations |
| **Virality scoring** | Virality prediction before publishing is exposed through the connector | Editorial filter before render spend |
| **Reference Extension** | Listed platform surface alongside Collab/Games | Reference-driven consistency layer |
| **Consent/rights gates** | Model listing requires 18+; platforms run **biometric safety filters** on uploaded portraits and licence refusals are real | See §6 — plan for this, do not fight it |

---

## 6. Consent, likeness and the ethics line (non-negotiable)

Higgsfield and every comparable platform screen uploaded portraits with **biometric safety filters**, and output can be refused. Public threads openly discuss two-stage workarounds (generate a synthetic lookalike as an intermediary, or finish faces in local open-source pipelines).

**This repo's rule, and the rule for any crew using it:**

- Use **your own face**, a **consented** subject, a **licensed** performer, or a **synthetic** character you created.
- Do not upload a public figure, a private individual, or client talent **without a signed release**.
- Do not build pipelines whose purpose is to bypass a platform's identity gate. A blocked generation is a policy signal, not an obstacle to route around.
- Reference edits for Katana must be **owned or licensed** (Higgsfield's own instruction).
- Keep the evidence: releases, licence, and the reference-permission trail, per project.

Everything else in this atlas is technical; this table is the part that survives legal review.

---

## 7. Access routes, pricing and integration with this repo

| Route | How | Cost model |
|---|---|---|
| **MCP** | `claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp` · OAuth sign-in, **no API key** | Metered credits; unlimited plan perks **do not apply** |
| **CLI + Skills** | Higgsfield CLI for coding agents | Metered credits |
| **ChatGPT extension** | Slash commands | Metered credits |
| **API + Python SDK** | 50+ models, pay-per-generation; e.g. Genjutsu **$0.159/s** (50% off), Cinema Studio 4.0 **$0.2057/s**, Seedance 2.5 **$0.144/s**, Kling 3.0 **$0.042/s**, Soul 2 images **$0.0032**, AI Influencer **$0.05/image** | Metered per generation |
| **Plugins** | Resolve / Premiere / AE / Photoshop / Figma / Blender | Same credit balance |
| **Plan floor for editors** | Independent review's verdict: **Plus at $47/mo**; Team when client uploads are involved; nothing below Plus | — |

Repo integration map:

| Higgsfield surface | Use it for | Where it lands here |
|---|---|---|
| Genjutsu Motion Transfer | Previs recast, pickup shots, wardrobe/product swaps | plate → `remotion/` composite → grain/LUT pass |
| Genjutsu Object Swap | Surgical element replacement on locked-off plates | stays as a plate; finish here |
| Katana | Format transfer of a proven edit onto brand assets | new HyperFrames composition, re-stamped seams |
| Cinema Studio 4.0 | Directed hero shots with camera moves | cut against Remotion CG; match grade |
| UpScale (FLUX 3, Precise/Creative) | Deliverable-safe upscales; Precise to match a plate, Creative to "make it look shot" | final mastering step |
| Relight / Color Palette | Lighting + grade passes | feeds `nleTrackEngine.tsx` LUT stage |
| Layers | Decompose plates into elements | parallax, 2.5D moves, element animation |
| AE plugin via MCP | Composition-level automation | pairs with `hyperframes render` deliverables |
| Supercomputer | Batch variants + scheduling | multi-variant A/B reels |

---

## 8. Source ledger

| Source | Date | Used for |
|---|---|---|
| `higgsfield.ai/blog/higgsfield-genjutsu` | 2026-08-31 | Genjutsu definition, Motion Transfer, Object Swap, presets |
| `higgsfield.ai/blog/higgsfield-katana` | 2026-10-12 | Katana mechanics, Genjutsu pairing, community presets |
| `higgsfield.ai/creator-hub/changelog` | 2026-10-15 | Katana presets, references, AI Influencer builder, Genjutsu inputs/outputs |
| `thepostflow.com/ai/higgsfield-ai-review/` | 2026-10-14 | Cinema Studio 4.0 specs, export table, 1080p-vs-4K caveat, Plus $47 verdict |
| `higgsfield.ai/enterprise-help-center/platform/tools-creative-workflow` | 2026-10-06 | Supercomputer/Canvas behaviour, tool-selection matrix |
| `higgsfield.ai/creator-hub/help-center/tools/which-higgsfield-tool-should-i-use` | 2026-09-01 | Tool routing, MCP vs CLI positioning |
| `higgsfield.ai/higgsfield-api` | 2026-09-20 | Model roster, per-second pricing, Genjutsu API |
| `open.higgsfield.ai/models/workflows/genjutsu/playground` | — | SDK snippet, model IDs, prices, resolutions, dates |
| `incrypted.com/en/higgsfield-ai-review/` | 2026-09-30 | 3D Jutsu, Supercomputer memory/skills/connectors, Opus 5.5 addition, unlimited-via-MCP footnote |
| `creatorstoolbox.com/tools/higgsfield/news` | 2026-07-21 | Hidden timeline: AE-in-Supercomputer, Apps, Explainer, Gaming, Photoshop, Figma, MCP micro-tools, Ad Reference |
| `mcp.film/mcps/higgsfield/`, `aituber.app/blog/higgsfield-mcp-video-generation/`, `creetr.com/blog/higgsfield-mcp` | 2026-08 → 2026-09 | MCP endpoint, 401 behaviour, model roster, 15-s clip ceiling, credit footnote |
| `higgsfield.ai/blog/ai-batch-generation-tools-2026` | 2026-07-21 | Parallelism (10/3/1), Canvas model roster |
| `reddit.com/r/generativeAI` Genjutsu threads | 2026-09 | Technical colour (swapping vs mayhem), and the bypass discussion this repo declines |

Deep dives in this bundle:
- [`references/genjutsu.md`](references/genjutsu.md) · [`references/katana.md`](references/katana.md) · [`references/cinema-studio-4.md`](references/cinema-studio-4.md)
- [`references/hidden-tools.md`](references/hidden-tools.md) · [`references/api-mcp-cli-pricing.md`](references/api-mcp-cli-pricing.md)
