# HeyGen research & render infrastructure — how to actually wire it in

## 1. TransVLM — "Detecting Any Shot Transitions" (SIGGRAPH Asia 2026)

**Published description:** *"A Vision-Language Framework and Benchmark for Detecting Any Shot Transitions."*

Why this is the highest-value research artefact in the org for a video-editing repo:

| Classic detectors | Failure mode | TransVLM's premise |
|---|---|---|
| Histogram / pixel-difference | Misses dissolves, wipes, morph cuts | Vision-language framing over *any* transition type |
| Optical flow thresholds | Confuses fast motion with a cut | Semantic + temporal reasoning, with a benchmark |
| Scene-detect heuristics | No labels, no evaluation | Ships a **benchmark** — you can measure your own pipeline |

**Integration plan with REA (this repo):**

```text
1. TransVLM pass  → transition boundaries + TYPE (hard cut, dissolve, wipe, morph, speed ramp)
2. REA pass       → optical flow, beat map, palette, loudness, frame grid   (rea/)
3. Argon pass     → editorial WHY per cut (setup/payoff, match-cut logic)   (skills/gemini-4-argon-forensic-atlas)
4. Merge          → ledger.json  →  node scripts/seam-stamp.mjs  →  node scripts/seam-gate.mjs verify
```

Division of labour: **TransVLM says where and what kind**, **REA says how fast and what colour**, **Argon says why**, **this repo renders it deterministically**.

Minimum viable evaluation: run all three on the reference reels listed in the Drive showcase folder (`docs/VIDEO-GALLERY.md`) and compare cut counts against a human count. If TransVLM's counts are within ±1 per minute of the human count on hard cuts **and** it finds soft transitions the human missed, it earns a slot in the default pipeline.

## 2. TAVR — talking avatar from a video reference (SIGGRAPH Asia 2026)

**Published description:** *"Generate Your Talking Avatar from Video Reference."*

Use when the deliverable needs a **specific performance style** rather than a generic avatar: reference video in → avatar performance out. Distinct from `heygen-avatar` (build a face) and `heygen-video` (generate a talking-head clip).

Pipeline fit: use TAVR-style reference performance for *voice/gesture authenticity*, then land the plate in this repo for grade, captions, lower-thirds and mix — the same discipline as any generated plate.

## 3. LiveAvatar cluster — realtime presenters

| Repo | Role |
|---|---|
| `liveavatar-web-sdk` (★84) | Embeddable realtime avatar in a web app |
| `liveavatar-gpt-live-demos` (★243) | Reference implementations with GPT |
| `liveavatar-sales-agent` (★44) | Full agent product pattern (public-facing) |
| `liveavatar-agent-skills` (★15) | Onboarding guidance for coding agents |
| `liveavatar-starter-livekit-agent-python` (★3) | LiveKit transport starter |
| `live-streamer` (★9) | Streaming/broadcast lane |

**Decision rule:** pre-rendered (`heygen-video`) when quality and control matter; realtime (`LiveAvatar`) when *interaction* is the product (onboarding bot, sales agent, live Q&A).

## 4. Serverless render templates — the deployment layer

| Template | Stack | Preview | Render | Use when |
|---|---|---|---|---|
| `hyperframes-vercel-template` ★21 | Next.js + Vercel Sandbox | Browser | Server-side MP4 | You already deploy on Vercel |
| `hyperframes-cloudflare-template` ★20 | Workers + Containers | Browser | Container MP4 | Edge-first, global latency |
| `hyperframes-modal-template` ★3 | Modal | Player | Serverless MP4 API | Python/GPU-adjacent workloads |
| `stripe-projects-templates` ★1 | HeyGen API + HyperFrames | — | — | Selling the output |

**Architecture this repo should follow:**

```text
AUTHOR LOCAL            VERIFY LOCAL                   RENDER REMOTE
────────────────       ──────────────────────         ─────────────────
skills/ doctrine  →    ./bin/ai-video verify     →     vercel / cloudflare / modal
registry/blocks         hyperframes lint 0/0            returns MP4 over HTTP
remotion/src            seam-gate 0 fail/warn
                        remotion still QC (4 shots)
```

Keep authoring offline-first (`toolkit/vendor/`, `.hyperframes/cache/`), and treat remote rendering as a delivery detail — never let the cloud become the source of truth for the composition.

## 5. Automation & distribution

| Tool | Function |
|---|---|
| `n8n-integration-heygen-node` ★7 | Trigger video generation from n8n workflows |
| `openclaw-plugin-heygen` ★4 | `video_generate` tool for OpenClaw agents |
| `hyperframes-gemini-agent` ★1 | HyperFrames composed/driven by a Gemini agent — pairs directly with the Gemini 4 Argon atlas in this repo |
| `website-to-hyperframes-demo` ★72 | Website → motion composition skill |

## 6. Adoption checklist

- [ ] TransVLM evaluated against a human cut count on 3 reference reels
- [ ] `heygen-com/skills` installed via the path that matches your host, transport auto-detected
- [ ] Avatar lane decided: pre-rendered vs LiveAvatar realtime
- [ ] One serverless render target chosen and smoke-tested end-to-end (author → MP4 URL)
- [ ] Every generated plate lands in this repo for grade/caption/mix — never shipped raw
- [ ] `./bin/ai-video verify` still passes after pulling any upstream HyperFrames release
