# heygen-com — full repository atlas

Enumerated **2026-10-16** via `api.github.com/orgs/heygen-com/repos?per_page=100&sort=updated`. Star counts are point-in-time and rounded.

## 1. Flagships

| Repo | ★ | Lang/Stack | Description (as published) | Notes |
|---|---|---|---|---|
| `hyperframes` | 65,021 | TypeScript monorepo | "Write HTML. Render video. Built for agents." | 15 packages; daily releases (v0.8.164 on scan day); **vendored in this repo** |
| `hyperframes-launches` | 604 | — | "Open-source HyperFrames compositions behind HeyGen's product launch videos." | Craft reference for launch cuts |
| `skills` | 488 | Markdown + scripts | "HeyGen AI agent skills — avatar creation and video production via the v3 Video Agent pipeline." | 3 skills; see `skills-pipeline.md` |
| `hyperframes-launch-video` | 264 | — | Launch-video compositions | Composition references |
| `liveavatar-gpt-live-demos` | 243 | — | LiveAvatar + GPT live demos | Realtime avatar demos |
| `hyperframes-community-skills` | 210 | Markdown | "Community-maintained skills for specialized HyperFrames workflows." | 8 skills; created 2026-08-25, pushed 2026-10-14 |
| `heygen-cli` | 153 | Go | "Create AI videos from the terminal." | Static binary; ships its own `SKILL.md`, `.agents/`, `.claude/`, `AGENTS.md` |
| `liveavatar-web-sdk` | 84 | — | LiveAvatar web SDK | Embeddable realtime avatar |
| `website-to-hyperframes-demo` | 72 | — | Website → HyperFrames skill demo | Site-to-motion |
| `liveavatar-sales-agent` | 44 | — | Public-facing sales agent | Product pattern |

## 2. Templates & deployment

| Repo | ★ | Target | Value |
|---|---|---|---|
| `hyperframes-vercel-template` | 21 | Vercel Sandbox | Next.js: preview comps, render MP4 server-side |
| `hyperframes-cloudflare-template` | 20 | Workers + Containers | Browser preview + container render |
| `hyperframes-modal-template` | 3 | Modal | Preview player + serverless MP4 API |
| `stripe-projects-templates` | 1 | HeyGen API + HyperFrames | Monetised app scaffold in one command |
| `n8n-integration-heygen-node` | 7 | n8n | Automation glue |

## 3. Research

| Repo | ★ | Venue | Subject |
|---|---|---|---|
| `TransVLM` | 20 | SIGGRAPH Asia 2026 | "A Vision-Language Framework and Benchmark for Detecting Any Shot Transitions" |
| `TAVR` | 11 | SIGGRAPH Asia 2026 | "Generate Your Talking Avatar from Video Reference" |

## 4. LiveAvatar cluster

`liveavatar-gpt-live-demos` (243) · `liveavatar-web-sdk` (84) · `liveavatar-sales-agent` (44) · `liveavatar-agent-skills` (15) · `live-streamer` (9) · `liveavatar-starter-livekit-agent-python` (3) · `liveavatar-hyperframes-demo` (1)

## 5. Agent integrations

| Repo | ★ | Purpose |
|---|---|---|
| `openclaw-plugin-heygen` | 4 | HeyGen Video Agent provider plugin for OpenClaw (`video_generate` tool) |
| `hyperframes-gemini-agent` | 1 | HyperFrames driven by a Gemini agent |
| `website-to-hyperframes-demo` | 72 | Website → composition skill |
| `skills-legacy` | 0 | Archived v1 skills (moved to `skills`) |

## 6. Low-signal / infra / vendored forks

`auto-model-optim` (6) · `mediadevices` (3, Go MediaDevices API) · `facedetection-devops` (1) · `infra_intern_interview` (0) · `SwiftTweaks` (0) · forks: `ray` (5), `posthog` (0), `posthog-mcp` (0), `mcp-shrimp-task-manager` (0).

## 7. Reading the org like a roadmap

```text
Core engine        hyperframes  ─────────────────────────────►  this repo (Engine 2)
Launch craft       hyperframes-launches · hyperframes-launch-video
Agent skills       skills · hyperframes-community-skills ─────►  formats + avatar lane
Terminal           heygen-cli
Realtime           liveavatar-* · live-streamer
Research           TransVLM (shot transitions) · TAVR (avatar from video)
Deployment         vercel · cloudflare · modal templates
Distribution       openclaw-plugin · gemini-agent · n8n · stripe templates
```

The direction is consistent: **author in HTML, render deterministically, drive everything from an agent, deploy the render anywhere.** This repo occupies exactly the "author + verify" middle, which is why the vendored engine + registry + seam gates are the durable asset.
