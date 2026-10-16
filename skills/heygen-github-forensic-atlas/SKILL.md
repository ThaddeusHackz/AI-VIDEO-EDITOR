---
name: heygen-github-forensic-atlas
description: "Full forensic atlas of the heygen-com GitHub organisation: hyperframes (65k★, the HTML→video engine vendored in this repo), the HeyGen agent skills repo (heygen-avatar / heygen-video / heygen-translate and the v3 Video Agent pipeline), heygen-cli (Go), hyperframes-community-skills, cloud/worker templates (Cloudflare, Modal, Vercel), TAVR and TransVLM research, and LiveAvatar."
---

# heygen-com — GitHub Organisation Forensic Atlas (`heygen-github-forensic-atlas`)

> **Scan date:** 2026-10-16 · **Method:** GitHub REST API (`api.github.com`) repo + tree enumeration, release/metadata reads, cross-referenced with per-repo docs.
> **Why this matters to this repo:** `THE-AI-VIDEO-EDITOR` vendors **heygen-com/hyperframes** as Engine 2 (15 packages + 210 blocks + 237 components + 447 registry items). Knowing the rest of the org tells you where the roadmap is going and what else is free to pull in.

---

## 1. Organisation snapshot (sorted by traction)

| Repo | ★ | One line | Relevance to this repo |
|---|---|---|---|
| **hyperframes** | **65,021** | "Write HTML. Render video. Built for agents." | **Engine 2 — vendored here.** 15 packages, registry of blocks/components, studio, lambda/cloud-run targets |
| **hyperframes-launches** | 604 | Open-source compositions behind HeyGen's product launch videos | Reference material for launch-video craft |
| **skills** | 488 | HeyGen AI agent skills — avatar creation & video production via the **v3 Video Agent pipeline** | The avatar/talking-head layer for this repo |
| **hyperframes-launch-video** | 264 | Launch-video compositions | Shot/structure references |
| **liveavatar-gpt-live-demos** | 243 | LiveAvatar + GPT live demos | Realtime avatar demos |
| **hyperframes-community-skills** | 210 | Community skills for specialised HyperFrames workflows | **8 ready skills** — see §4 |
| **heygen-cli** | 153 | Create AI videos from the terminal — official Go CLI | Terminal-native video generation; TTS/translation lanes |
| **liveavatar-web-sdk** | 84 | Web SDK for LiveAvatar | Embeddable realtime avatar |
| **website-to-hyperframes-demo** | 72 | Website → HyperFrames skill demo | Site-to-motion pipeline |
| **liveavatar-sales-agent** | 44 | Public-facing sales agent | Agent + avatar product pattern |
| **hyperframes-vercel-template** | 21 | Next.js template — preview HTML comps, render MP4 on Vercel Sandbox | Serverless render target |
| **hyperframes-cloudflare-template** | 20 | Cloudflare Workers + Containers template | Serverless render target |
| **TransVLM** | 20 | **[SIGGRAPH Asia 2026] A VLM framework + benchmark for detecting *any* shot transition** | **Directly usable: automatic cut detection for REA** |
| **liveavatar-agent-skills** | 15 | Onboard coding agents to LiveAvatar | Agent-facing SDK guidance |
| **TAVR** | 11 | **[SIGGRAPH Asia 2026] Generate Your Talking Avatar from Video Reference** | Talking-avatar research pipeline |
| **live-streamer** | 9 | Live streaming avatar | Broadcast lane |
| **n8n-integration-heygen-node** | 7 | n8n node | Automation |
| **hyperframes-modal-template** | 3 | Deploy rendering to Modal — preview player + serverless MP4 API | Serverless render target |
| **liveavatar-starter-livekit-agent-python** | 3 | LiveAvatar with LiveKit | Realtime agents |
| **openclaw-plugin-heygen** | 4 | HeyGen Video Agent provider plugin for OpenClaw (`video_generate`) | Agent-tool integration |
| **heygen-stack** | 4 | Stack tooling | Misc |
| **hyperframes-gemini-agent** | 1 | HyperFrames driven by a Gemini agent | **Ties the Gemini 4 Argon atlas to HyperFrames** |
| **liveavatar-hyperframes-demo** | 1 | LiveAvatar × HyperFrames | Combined demo |
| **stripe-projects-templates** | 1 | Scaffold an AI video app (HeyGen API + HyperFrames) in one command | Monetisation scaffold |
| **skills-legacy** | 0 | Archived v1 skills | Historical |
| **auto-model-optim / mediadevices / facedetection-devops / infra_intern_interview / SwiftTweaks · forks (ray, posthog, posthog-mcp, mcp-shrimp-task-manager)** | 0–6 | Infra, media-device APIs, interview exercises, vendored forks | Low signal |

---

## 2. `heygen-com/hyperframes` — the engine this repo is built on

- **Tagline:** *Write HTML. Render video. Built for agents.*
- **Latest release observed:** **v0.8.164** (2026-10-16) — the line is actively shipping *daily*.
- **Vendored into this repo as:** `packages/` (cli, core, engine, lint, parsers, player, producer, sdk, shader-transitions, studio, studio-server, inspector, aws-lambda, gcp-cloud-run) + `registry/` (210 blocks, 237→238 components) + `.hyperframes/cache/` (offline registry manifests) + `examples/ultrahigh-3d-vfx-showreel/`.
- **Doctrine shipped with it that this repo extends:** Vector Law, Z-scale-sign rule, dominant current, the Vector Ledger (`ledger.json`), the Seam Gate (`scripts/seam-gate.mjs`), White-flash opaque `#root` guard, 7cqw oversized cursor, caption Drop/Rail/Embed tiers.

**Update discipline:** because upstream ships daily, treat this repo's vendored copy as a **pinned fork**. When pulling upstream, re-run `./bin/ai-video verify` (TypeScript + lint 0/0 + seam stamps) and the registry validator before committing.

---

## 3. `heygen-com/skills` — the avatar/video agent pipeline

**Repo description (verbatim):** *"HeyGen AI agent skills — avatar creation and video production via the v3 Video Agent pipeline."*
Topics: `agent-skills`, `ai-agent`, `avatar-video`, `claude-code`, `heygen`, `openclaw`, `skill`, `video`.
Created 2026-01-22 · latest push observed 2026-07-14 · ★488 · forks 82.

### 3.1 The three skills

| Skill | What it does | Layout |
|---|---|---|
| **`heygen-avatar`** | Create the agent's/user's avatar (identity files → asks only what's missing → builds avatar → picks style) | `SKILL.md`, `references/` |
| **`heygen-video`** | Generate the video (talking-head product), deliver a share link | `SKILL.md`, `references/`, `scripts/` |
| **`heygen-translate`** | Translate/localise video | `SKILL.md`, `references/` |

### 3.2 Install matrix (four supported paths — pick by tooling)

```bash
# A. Cross-agent skill installer (GitHub CLI v2.90+) — agentskills.io compatible
gh skill install heygen-com/skills heygen-avatar
gh skill install heygen-com/skills heygen-video
gh skill install heygen-com/skills heygen-translate

# B. ClawHub
clawhub install heygen-skills

# C. OpenClaw plugin (bundles MCP support)
openclaw plugins install clawhub:@heygen/openclaw-plugin-heygen

# D. Git clone (legacy path)
git clone --single-branch --depth 1 https://github.com/heygen-com/skills.git <install-path>/heygen-skills
```

Copy-paste install for any agent (the repo's own pattern — the spec lives in the repo, not the user's clipboard):

```text
Read https://raw.githubusercontent.com/heygen-com/skills/master/INSTALL_FOR_AGENTS.md and follow it.
Ask me for any API keys you need.
```

### 3.3 Two transports, one priority rule

```text
HEYGEN_API_KEY set  →  CLI path (single static Go binary, no runtime deps)
not set             →  MCP path (OAuth, no API key): https://mcp.heygen.com/mcp/v1/
                       first call triggers an OAuth consent flow in the browser

heygen --version && heygen auth status      # verify
export HEYGEN_API_KEY=<key>                 # app.heygen.com/api → Settings → API
```

**This mirrors the Higgsfield pattern exactly** (see `higgsfield-forensic-atlas`): *API key ⇒ CLI; no key ⇒ MCP.* A well-behaved agent skill auto-detects rather than demanding credentials.

---

## 4. `hyperframes-community-skills` — 8 drop-in workflows

★210 · created 2026-08-25 · actively pushed (2026-10-14).

| Skill | What it produces |
|---|---|
| `camera-3d-captions` | Captions locked to a 3D camera move |
| `day-in-my-life` | Vlog-format narrative structure |
| `duo` | Two-person format (dialogue/talking-head pairing) |
| `p5-paint-animation` | p5.js generative paint animation |
| `prod-by-claude` | House-style "produced by Claude" branding pass |
| `session-story` | Session/recap storytelling |
| `vox-explainer` | Vox-style explainer (the newsroom look) |
| `x-posting-license` | X/Twitter posting + licensing conventions |

**Use:** these are composition *formats*, not render machinery. Pair each with the repo's `motion-doctrine` + `seam-craft` skills so whatever they produce still passes the seam gate.

---

## 5. `heygen-cli` — terminal-native video

★153 · Go · topics include `text-to-speech`, `video-translation`, `avatar`, `cli`, `agents` · pushed **2026-10-16** (same day as this scan).
Layout: `cmd/`, `internal/`, `gen/`, `codegen/`, `docs/`, `scripts/`, `Makefile`, `SKILL.md`, `AGENTS.md`, `.agents/`, `.claude/`, `AGENTS.md`.

Notable: the CLI repo itself ships **`SKILL.md` + `.agents/` + `.claude/`** — i.e. HeyGen ships the agent-facing wrappers *inside* the binary repo. That is the pattern this repo follows with `.agents/skills/` and `.claude/skills/` mirrors.

```bash
curl -fsSL https://static.heygen.ai/cli/install.sh | bash   # macOS / Linux
```

---

## 6. Research repos worth wiring in

### 6.1 TransVLM — shot-transition detection (SIGGRAPH Asia 2026)
*"A Vision-Language Framework and Benchmark for Detecting Any Shot Transitions."*
**Why it is the single most useful research repo in the org for this project:** it is a *benchmark + framework* for detecting **any** shot transition — i.e. cuts, dissolves, wipes, and the hard cases that classic histogram/flow detectors miss. Feed it the reference reels in the Drive showcase folder and it produces the cut ledger that REA's optical-flow pass then refines; the two together give you per-cut timestamps **and** per-cut type.

```text
REA pass      → motion, palette, loudness, frame grids
TransVLM pass → transition TYPE + boundaries (incl. soft transitions)
Argon pass    → the editorial WHY behind each cut  (see gemini-4-argon-forensic-atlas)
Result        → ledger.json → seam-gate → deterministic rebuild
```

### 6.2 TAVR — talking avatar from a video reference (SIGGRAPH Asia 2026)
*"Generate Your Talking Avatar from Video Reference."* The research lineage under HeyGen's avatar product; useful when a deliverable needs a specific presenter's performance style rather than a generic avatar.

### 6.3 LiveAvatar cluster
`liveavatar-web-sdk` (★84), `liveavatar-gpt-live-demos` (★243), `liveavatar-agent-skills` (★15), `live-streamer` (★9), `liveavatar-starter-livekit-agent-python` (★3), `liveavatar-sales-agent` (★44).

**Use case in this repo:** a *realtime* presenter for interactive deliverables (sales agent, onboarding bot, live Q&A), distinct from pre-rendered talking-head video.

---

## 7. Serverless render targets (the deployment layer)

| Template | Stack | What it gives you |
|---|---|---|
| `hyperframes-vercel-template` ★21 | Next.js + Vercel Sandbox | Preview HTML comps in-browser; render MP4 server-side |
| `hyperframes-cloudflare-template` ★20 | Workers + Containers | Preview in browser, MP4 render in a container |
| `hyperframes-modal-template` ★3 | Modal | Preview player + serverless MP4 render API |
| `stripe-projects-templates` ★1 | HeyGen API + HyperFrames | Scaffold a monetised video app in one command |

Pattern for scaling this repo: keep authoring local (deterministic, offline-first via `toolkit/vendor/`), then push **rendering** to one of these when a client needs an API that returns MP4s.

---

## 8. What to adopt, in priority order

1. **TransVLM** → automatic shot-transition ledger feeding REA (highest technical payoff).
2. **`heygen-com/skills`** → the avatar/talking-head lane this repo currently only gestures at, installable in four ways.
3. **`hyperframes-community-skills`** → 8 formats you can ship without writing new doctrine: `vox-explainer` and `camera-3d-captions` first.
4. **A serverless render target** (Vercel/Cloudflare/Modal) → the moment you need an HTTP render endpoint.
5. **`heygen-cli`** → TTS + translation lanes from the terminal, with its own agent wrappers.
6. **LiveAvatar + TAVR** → realtime presenters and reference-driven avatar performance.

## 9. Source ledger

Repos enumerated via `api.github.com/orgs/heygen-com/repos?sort=updated` and per-repo metadata/contents on **2026-10-16**.
Release tags read from `api.github.com/repos/heygen-com/hyperframes/releases` (v0.8.164, 2026-10-16).
Skill install/transport details from `heygen-com/skills` README + `INSTALL_FOR_AGENTS.md` references.
Research repo titles from their GitHub descriptions (SIGGRAPH Asia 2026 credits as published).

Deep dives: [`references/org-atlas.md`](references/org-atlas.md) · [`references/skills-pipeline.md`](references/skills-pipeline.md) · [`references/research-and-infra.md`](references/research-and-infra.md)
