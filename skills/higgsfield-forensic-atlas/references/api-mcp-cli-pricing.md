# Higgsfield — API, MCP, CLI & pricing ledger

*Scan date 2026-10-16. Prices and model versions on this platform move weekly — this file is a ledger, not a contract. Re-read the source pages before quoting a job.*

## 1. Surfaces

| Surface | Endpoint / entry | Auth | Billing |
|---|---|---|---|
| **Web studio** | higgsfield.ai | Account | Credits; unlimited/free perks apply **here only** |
| **MCP** | `https://mcp.higgsfield.ai/mcp` (Streamable HTTP) | **OAuth — no API key** | Metered credits |
| **ChatGPT extension** | slash commands | Account | Metered credits |
| **CLI + Skills** | Higgsfield CLI | Account | Metered credits |
| **API + Python SDK** | `@higgsfield/client/v2` | `HF_CREDENTIALS` | Pay-per-generation |
| **Plugins** | Resolve · Premiere · AE · Photoshop · Figma · Blender | Account | Same credit balance |
| **AI Studio-like open surface** | `open.higgsfield.ai` model pages + playground | Account | Per-second / per-image |

```bash
# MCP install (Claude Code)
claude mcp add --transport http higgsfield https://mcp.higgsfield.ai/mcp
```

**Field behaviour:** the endpoint returns **401 unauthenticated** (proving it is alive and OAuth-gated) and Higgsfield publishes **no static tool list** — always enumerate `tools/list` after connecting.

## 2. Model roster (as published on the API page, 2026-09-20 + MCP roster)

| Model | Type | Capability |
|---|---|---|
| **Seedance 2.5 / 2.0** | Video | up to 30 s from text, image, video **or audio** |
| **Genjutsu** (Motion Transfer / Object Swap / Restyle) | Video edit | swaps characters, locations, styles, keeping motion |
| **Kling 3.0** | Video | multi-shot from text/image, **native audio**, up to 15 s |
| **Cinema Studio 4.0** | Video | up to 30 s, automatic scene direction + references |
| **Wan 3.0 / 3.0 Prime / 2.7** | Video | text/image → video with native audio, adjustable duration up to 30 s |
| **MiniMax H3 / Hailuo 2.3** | Video | cheaper lanes |
| **LTX 2.5 Fast / Pro** | Video | speed/quality split |
| **Grok Imagine 2.0** | Image + edit | precise edits preserving detail |
| **Soul 2 / Soul Standard / Soul Cinema / Soul HEX / Soul ID** | Image | portraits, fashion, character training |
| **AI Influencer** | Image + video | 19-settings character builder, optional your-own-face |
| **Nano Banana Pro · GPT Image 2 · Seedream 5.0 Lite/Flash · Qwen Image 3 · Z-Image Turbo · FLUX** | Image | roster that rotates |
| **Marketing Studio Image** | Image | campaign images up to 4K |
| **Google Omni Flash** | Multimodal | audio/omni work in Argon & Explainer pipelines |
| **Veo / Flux / MiniMax Hailuo** | Video/image | listed in the MCP roster |

> Note (2026-09-05 field check): **Sora is no longer in the MCP roster** — OpenAI is retiring it. Do not plan around it here.

## 3. Published prices (per generation unit)

| Item | Price | Notes |
|---|---|---|
| Seedance 2.5 | **$0.144 /s** (30% off from $0.2057) | Most advanced video model on the platform |
| Genjutsu (Motion Transfer / Object Swap) | **$0.159 /s** (50% off) → up to $0.816 /s | Price scales with resolution/tier |
| Cinema Studio 4.0 | **$0.2057 /s** → $0.4623 /s | 480p–720p, 4–30 s |
| Kling 3.0 | **$0.042 /s** (50% off) | Native audio, ≤15 s |
| Seedance 2.0 | $0.0985 /s (30% off) | |
| Wan 3.0 | listed | native audio, ≤30 s |
| MiniMax Hailuo 2.3 | $0.0117 /s (75% off) | Cheapest video lane |
| Kling 2.5 | $0.021 /s (50% off) | |
| Soul 2 (image) | **$0.0032 / image** | Cheapest image lane |
| Soul Standard | $0.0938 / image | |
| AI Influencer | **$0.05 / image** | |
| Grok Imagine 2.0 | $0.04 / image | |
| Z-Image Turbo | $0.04 / image | |
| Marketing Studio Image | listed | up to 4K |

**Bundle offer:** pick any 4 models → save up to 50%.

## 4. SDK shape

```ts
import { config, higgsfield } from "@higgsfield/client/v2";

config({ credentials: process.env.HF_CREDENTIALS });

const result = await higgsfield.subscribe("higgsfield/genjutsu/motion-transfer/v1.0", {
  input: {
    prompt: "swap the video's main character to the attached characters and their clothes",
    video_url: "https://example.com/input.mp4",
    image_urls: ["https://example.com/input.jpg"],
    resolution: "720p",           // 480p | 720p | 1080p
  },
  withPolling: true,
});

console.log(result);
```

## 5. Cost worked example (editor planning a 30-second deliverable)

```text
Option A — generate the whole spot:
    Cinema Studio 4.0 @720p, 30 s   = 30 × $0.2057            ≈ $6.17

Option B — 8 shots × 4 s = 32 s of directed shot material:
    32 × $0.2057                                              ≈ $6.58
    + 1 Katana rebuild pass (edit structure)                  (chat turns on your plan)
    + 1 Genjutsu pickup (product swap, 4 s @720p)  = 4 × $0.159 ≈ $0.64
    -------------------------------------------------------------
    subtotal                                                  ≈ $7.22
    + upscale to 1080p/4K (FLUX 3 Precise pass)               (platform rate)
    + LUT/grade + mix in-repo (Remotion/NLE)                  $0

Option C — image-heavy B-roll with Soul 2 stills animated in-repo:
    40 stills × $0.0032                                       ≈ $0.13
    + Remotion render (CG camera moves, zero generation cost)  $0
```

**Lesson:** on this platform the cheapest path to a *cinematic* result is often **image generation + deterministic CG camera work in this repo** (Option C) — generation cost scales with seconds, while Remotion/Three.js camera moves are free.

## 6. Ledger hygiene

- Re-check the model page before every quote (names, versions and discounts change weekly).
- Log the **surface** used (web vs MCP vs CLI vs API) — it determines whether plan perks applied.
- Log **resolution tier** — Genjutsu/Cinema Studio prices scale with it.
- Treat "15 s on MCP" as a hard ceiling until proven otherwise on your account.

## 7. Sources

`higgsfield.ai/higgsfield-api` (2026-09-20) · `open.higgsfield.ai/models/workflows/genjutsu/playground` ·
`mcp.film/mcps/higgsfield/` (2026-09-05) · `creetr.com/blog/higgsfield-mcp` (2026-08-12) ·
`aituber.app/blog/higgsfield-mcp-video-generation/` (2026-09-25) · `higgsfield.ai/blog/ai-batch-generation-tools-2026` (2026-07-21) ·
`incrypted.com/en/higgsfield-ai-review/` (2026-09-30).
