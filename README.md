# AI-VIDEO-EDITOR — UltraHigh 3D Motion Graphics, VFX/CGI, NLE & Programmatic Video Monorepo

[![Engines](https://img.shields.io/badge/engines-Remotion%20%C2%B7%20HyperFrames%20%C2%B7%20REA-5eead4?style=flat-square)](#3-dual-engine-rendering-workflows)
[![Skills](https://img.shields.io/badge/agent%20skills-59-a78bfa?style=flat-square)](skills)
[![Registry](https://img.shields.io/badge/registry-210%20blocks%20%2B%20238%20components-fbbf24?style=flat-square)](registry)
[![Render gallery](https://img.shields.io/badge/render%20gallery-13%20films-f472b6?style=flat-square)](docs/VIDEO-GALLERY.md)
[![Forensics](https://img.shields.io/badge/forensics-4%20atlases%20%2B%20method-38bdf8?style=flat-square)](docs/forensics/README.md)
[![Built for](https://img.shields.io/badge/built%20for-Claude%20Opus%205.5%20%C2%B7%20GPT--6.1%20Sol%20%C2%B7%20Gemini%204%20Argon-0f172a?style=flat-square)](docs/forensics/2026-model-stack.md)
[![License](https://img.shields.io/badge/license-see%20LICENSE-64748b?style=flat-square)](LICENSE)

> **Built for Claude Opus 5.5, GPT-6.1 Sol, Claude Code, Codex, OpenCode & Human Video Engineers**
> Unified deterministic video engineering workspace combining **Google Drive `AI VIDEO EDITOR`**, **`heygen-com/hyperframes`** (all 15 packages + 210 blocks + 237 components), **`remotion`** (React/TypeScript 3D/VFX/DoP/NLE engine + 12 official skills), **`morluto/rea`** (reverse-engineering & visual replication studio), and **Higgsfield DoP / Cinema Studio** camera & VFX choreography.

---

## 1. Repository Architecture at a Glance

```text
AI-VIDEO-EDITOR/
├── bin/
│   └── ai-video                      # Unified CLI (setup, doctor, verify, skills, presets, compositions)
├── setup-toolchain.sh                # Google Drive AI VIDEO EDITOR toolchain installer (preserved)
├── SETUP_STEPS.md                    # Google Drive AI VIDEO EDITOR manual setup guide (preserved)
├── hf-env.sh                         # HyperFrames cache & low-memory sandbox env config (preserved)
├── .hyperframes/cache/               # 448 offline-cached HyperFrames registry manifests
├── toolkit/                          # Offline-first shared assets (zero CDN dependency at render time)
│   ├── fonts/                        # Inter, Space Grotesk, JetBrains Mono, Cinzel, Cormorant Garamond (.woff2)
│   ├── vendor/                       # gsap.min.js, three.core.min.js, shaders.iife.js, camera-dop.js, vfx-cgi-suite.js
│   └── templates/                    # hyperframes-base.html & remotion-base.tsx starter templates
├── remotion/                         # Engine 2: Complete Remotion Studio + 59 Upstream Packages & Templates
│   ├── packages/                     # 59 official remotion-dev/remotion packages (three, effects, svg-3d-engine, light-leaks, transitions, motion-blur, shapes, skia, rive, lottie, template-prompt-to-motion-graphics, etc.)
│   ├── src/
│   │   ├── Root.tsx                  # 10 registered compositions (3D, VFX, Motion Doctrine, NLE, Cinema Studio 4.0, Promo, Cards)
│   │   ├── Cinematic3DShowcase.tsx   # 3D Geodesic Wireframe + Higgsfield DoP Rigs + Godrays + Lens Flare
│   │   ├── VFXCompositorSuite.tsx    # 4-Pass VFX Breakdown + Bullet-Time Shatter + Matchmove HUD
│   │   ├── MotionDoctrineReel.tsx    # Waterfall Entry + 7cqw Cursor + Cut-the-Curve + Climax Stillness
│   │   ├── NLEMasterTimeline.tsx     # Multi-Track NLE + Parakeet Caption Rail/Embed + LUT Color Grade
│   │   ├── HiggsfieldCinemaStudioShowreel.tsx # Cinema Studio 4.0 + 3D Carousel + Sliding Stack + Physics + 2-Bone IK Character
│   │   ├── ThaddeusTechzPromo.tsx    # Channel Promo (16:9 Landscape & 9:16 Shorts with procedural card fallback)
│   │   ├── TitleCard.tsx             # Prop-driven editorial title card (16:9 & 1:1)
│   │   ├── ScriptureCard.tsx         # Minimalist warm editorial card
│   │   └── engine/                   # 7-Module Remotion 3D / VFX / DoP / Seam / NLE / Cinema Studio 4.0 / IK Engine
│   │       ├── cameraRig.tsx         # Seeded PRNG, 3D point projection, 10 Higgsfield DoP camera presets
│   │       ├── seamTransitions.ts    # Cut-the-Curve, Zoom-Through, Waterfall Entry, 10/65/25 Nudge, 7cqw Cursor
│   │       ├── vfxShaders.tsx        # Anamorphic Flare, Volumetric Godrays, 3D Particles, Shatter Debris, Grain
│   │       ├── nleTrackEngine.tsx    # LUT Color Grading, Drop/Rail/Embed Captions, Lower-Thirds, Audio Meter
│   │       ├── threeSceneStudio.tsx  # 3D Cylindrical Carousel, 3D Sliding Stack, 3D Physics Bouncing Sphere, Torus Knot
│   │       ├── cinemaStudio4.tsx     # Higgsfield Cinema Studio 4.0 Stage, Portal Vortex, Plasma Lightning, Agamemnon
│   │       └── characterRig2D.tsx    # Analytic 2-Bone IK Solver (solveTwoBoneIK) + Lip-Sync Viseme Character Rig
├── packages/                         # Complete heygen-com/hyperframes monorepo (15 packages)
│   ├── cli/  core/  engine/  lint/  parsers/  player/  producer/  sdk/
│   ├── shader-transitions/  studio/  studio-server/  inspector/  aws-lambda/  gcp-cloud-run/
├── registry/                         # Complete HyperFrames Registry (447 visual assets)
│   ├── blocks/                       # 210 multi-element scene templates (3D WebGL, GLSL shaders, UI mocks)
│   └── components/                   # 237 atomic motion primitives (kinetic type, counters, bursts, HUDs)
├── rea/                              # Complete morluto/rea reverse-engineering & visual replication studio
├── examples/
│   └── ultrahigh-3d-vfx-showreel/    # Lint-clean, Seam-Stamped HyperFrames 3D + DoP reference project
├── scripts/                          # seam-gate.mjs, seam-stamp.mjs, validate-registry.mjs, gate-probes
├── docs/
│   ├── VIDEO-GALLERY.md              # Render gallery: 13 shipped films with specs + watch links
│   ├── video-gallery.html            # Same gallery as a playable page (Drive preview embeds)
│   └── forensics/                    # 2026 tool & model atlases (Argon · Higgsfield · HeyGen · Remotion)
└── skills/                           # 59 Agent Skills (symlinked into .agents/skills/ & .claude/skills/)
```

---

## 2. Quickstart & Unified CLI (`./bin/ai-video`)

```bash
# 1. Load environment variables (caches in ~/.cache, single-worker producer for sandboxes)
source ./hf-env.sh

# 2. Run one-command health check (Node 22, FFmpeg 7.1, HyperFrames CLI, Remotion, 59 Skills, 447 Registry items)
./bin/ai-video doctor

# 3. Verify TypeScript compilation, HyperFrames lint (0 errors/0 warnings), and Vector Ledger seam stamps
./bin/ai-video verify

# 4. Browse all 59 Agent Skills, 10 Higgsfield DoP camera presets, and 9 Remotion compositions
./bin/ai-video skills
./bin/ai-video presets
./bin/ai-video compositions
```

---

## 3. Dual-Engine Rendering Workflows

### Engine A — Remotion (React / TypeScript / 3D / VFX / NLE)

```bash
cd remotion

# List all 9 compositions
npx remotion compositions src/index.ts

# Render the 4 Flagship 3D / VFX / Motion-Doctrine / NLE Compositions
npx remotion render src/index.ts Cinematic3D-Showcase out/cinematic-3d.mp4
npx remotion render src/index.ts VFX-CGI-Compositor   out/vfx-compositor.mp4
npx remotion render src/index.ts MotionDoctrine-Showreel out/motion-doctrine.mp4
npx remotion render src/index.ts NLE-Master-Editor    out/nle-editor.mp4

# Render fast verification stills at key frames
npx remotion still src/index.ts Cinematic3D-Showcase out/frame-120.png --frame=120
```

### Engine B — HyperFrames (HTML / CSS / GSAP / Three.js / WebGL / Shaders)

```bash
# Lint any HyperFrames composition (static analysis + GSAP tween overlap + asset path checks)
hyperframes lint examples/ultrahigh-3d-vfx-showreel

# Stamp velocity-matched seams from ledger.json into index.html
node scripts/seam-stamp.mjs --ledger examples/ultrahigh-3d-vfx-showreel/ledger.json --write examples/ultrahigh-3d-vfx-showreel/index.html

# Verify every seam numerically against the Seam Gate
node scripts/seam-gate.mjs verify --ledger examples/ultrahigh-3d-vfx-showreel/ledger.json --project examples/ultrahigh-3d-vfx-showreel

# Render deterministic MP4 output
cd examples/ultrahigh-3d-vfx-showreel
hyperframes render -o renders/showreel.mp4 -f 30 -q standard
```

### Engine C — REA (`morluto/rea` Video Reverse-Engineering & Visual Replication)

See [`skills/rea-video-reverse-engineer/SKILL.md`](skills/rea-video-reverse-engineer/SKILL.md) and [`rea/README.md`](rea/README.md) to extract frame grids, optical flow, beat maps, color palettes, and scene cut ledgers from reference videos and replicate them in HyperFrames or Remotion.

---

## 4. Complete 59-Skill Catalog (`skills/`, `.agents/skills/`, `.claude/skills/`)

### Tier 1 — UltraHigh Master Skills (Claude Opus 5.5 / GPT-6.1 Sol / Higgsfield DoP)
| Skill | Purpose |
|---|---|
| `opus-gpt-director` | Master `/ultrahigh` 6-stage autonomous director pipeline, engine selection, and QA gate |
| `cinematic-3d-vfx-cgi` | Deterministic Three.js, `@remotion/three`, GLSL shaders, godrays, 3D particles, and shatter CGI |
| `higgsfield-camera-dop` | 10 Higgsfield DoP camera movement presets (`dolly-zoom`, `bullet-time`, `orbit-360`, `crash-zoom`, etc.) |
| `nle-video-editor-pro` | Multi-track NLE editing, J/L cuts, Parakeet ASR captions (Drop/Rail/Embed), LUT grading, `-16 LUFS` audio |
| `rea-video-reverse-engineer` | Reference video deconstruction (scene cuts, easing curves, color grade) via `rea/` into code |

### Tier 2 — HyperFrames Internal Craft Doctrine (6 Skills)
| Skill | Purpose |
|---|---|
| `motion-doctrine` | Vector Law, Z scale-sign rule, dominant current, Vector Ledger (`ledger.json`), Seam Gate (`seam-gate.mjs`) |
| `cut-the-curve` | 5 velocity-matched seam techniques, 2-phase Waterfall Entry, and 10/65/25 Nudge Curve |
| `seam-craft` | White-flash opaque `#root` guard, overlap ping-pong tracks, and master transition injector |
| `oversized-cursor` | House `7cqw` oversized cursor protagonist, physical off-screen entry, 1:2 tap, same-frame click ignition |
| `captions-overlay` | Three-tier caption system (`Drop`, `Rail`, `Embed` behind-subject) with true vertical center discipline |
| `audit-fix-component` | Registry component/block visual & deterministic seek audit |

### Tier 3 — HyperFrames Production & Genre Skills (21 Skills)
`hyperframes`, `hyperframes-animation`, `hyperframes-audio`, `hyperframes-cli`, `hyperframes-core`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-registry`, `hyperframes-studio`, `motion-graphics`, `product-launch-video`, `faceless-explainer`, `talking-head-recut`, `embedded-captions`, `music-to-video`, `pr-to-video`, `general-video`, `slideshow`, `figma`, `media-use`, `remotion-to-hyperframes`.

### Tier 4 — Official Remotion Skills (12 Skills)
`remotion-best-practices`, `remotion-3d`, `remotion-animations`, `remotion-Synchronize`, `remotion-audio`, `remotion-captions`, `remotion-charts`, `remotion-compositions`, `remotion-fonts`, `remotion-lottie`, `remotion-sfx`, `remotion-transitions`.

### Tier 5 — REA Reverse-Engineering Skills (3 Skills)
`rea-feishu-Bot`, `rea-universal-editor-dom-surgeon`, `rea-webapp-testing`.

### Tier 6 — 2026 Forensic Atlases & Model Doctrine (6 Skills)
| Skill | Purpose |
|---|---|
| `gemini-4-argon-forensic-atlas` | Complete Gemini 4 Argon scan: capability matrix, 1M-token long decode, agentic video understanding, Blender MCP multi-agent loops, the **4-shot critic protocol**, Real2Sim + G1/G2/G3 shoot-annotation hierarchy, every documented limit |
| `higgsfield-forensic-atlas` | Complete Higgsfield scan: **Genjutsu** (Motion Transfer · Object Swap · Restyle), **Katana** (Claude Motion edit rebuild), Cinema Studio 4.0, **3D Jutsu**, Supercomputer, Canvas, Explainer, Gaming, plugins (Resolve/Premiere/AE/Photoshop/Figma/Blender) and the hidden surface (billing footnotes, auth-gated tool lists, 15s MCP ceiling) |
| `heygen-github-forensic-atlas` | Whole `heygen-com` org: hyperframes (65k★, vendored here), the avatar/video skills repo, `heygen-cli`, 8 community skills, **TransVLM** (any-shot-transition detection) and **TAVR** (SIGGRAPH Asia 2026), LiveAvatar |
| `remotion-github-forensic-atlas` | Whole `remotion-dev` org (120+ repos): core **4.0.536**, the 12-skill bundle, **5 agent plugins**, every template (prompt→motion-graphics, tiktok, audiogram, three, skia, overlay), recorder / `html-in-canvas`, Rust FFmpeg, Lambda/Cloudflare/Vercel render stacks |
| `opus-5-5-sol-6-1-director` | Director doctrine for **Claude Opus 5.5** + **GPT-6.1 Sol**: verified specs, effort ladders, 1M-context budgeting, subagent shape for a multi-act reel, cost math per deliverable, verification gates — and the rule that **neither model takes video input** (route footage to Argon) |
| `forensic-scan-protocol` | The reusable method: 27 probes, evidence tiers A–E, hidden-surface hunting, claim-testing loop, publishing anatomy, ethics line |

---

## 5. Universal AI Connection Spec & Viral Metadata

### GitHub Quick-Setup Metadata
- **About Description**:
  ```text
  The Universal AI Video Engine: Autonomous 3D Motion Graphics, VFX/CGI, Higgsfield Cinema DoP & Remotion NLE for Claude Opus, GPT, Gemini & AI Agents. Turn plain text into Hollywood-grade cinema via MCP & CLI.
  ```
- **Topics / Tags**:
  ```text
  ai-video, motion-graphics, vfx, cgi, remotion, video-editing, mcp-server, claude-opus, gpt, cinema-dop, threejs, glsl-shaders, procedural-animation, video-generation, programmatic-video, hyperframes, reverse-engineering, 3d-animation, video-pipeline, autonomous-agents
  ```

### Universal System Prompt (Connect Any AI to This Repo)
Paste this prompt into any AI agent (Claude, GPT, Gemini, Cursor, Codex, Copilot, DeepSeek) so it can autonomously direct and render videos:

```markdown
### SYSTEM PROTOCOL: THE-AI-VIDEO-EDITOR (AIVE) OPERATING ENVIRONMENT

You are equipped with the full capabilities of `THE-AI-VIDEO-EDITOR`, an ultra-high 3D motion graphics, VFX/CGI, and programmatic NLE studio. You do not just hallucinate code; you direct and construct deterministic, frame-accurate cinema.

#### 1. YOUR AVAILABLE ENGINES & SUITES:
- **Engine 1 (Remotion 3D/VFX/NLE)**: Located in `remotion/`. Includes:
  - 10 Higgsfield DoP camera rigs (`cameraRig.tsx` - Orbit, Dolly-Zoom, FPV Fly-through, Steadicam, Vertigo).
  - WebGL & GLSL Shaders (`vfxShaders.tsx` - Volumetric God Rays, Anamorphic Flares, Bullet-Time Shatter, Grain).
  - Multi-track NLE (`nleTrackEngine.tsx` - LUT Color Grading, Parakeet Captions, Lower-Thirds, Split Screens).
  - 3D Stage Studio (`threeSceneStudio.tsx` & `cinemaStudio4.tsx` - Cylindrical carousels, physics spheres, plasma vortex).
  - 2-Bone Analytic IK (`characterRig2D.tsx` - Viseme lip-sync & 2D character rigging).
- **Engine 2 (HyperFrames)**: Located in `packages/` & `registry/` (210 scene blocks, 237 motion components, zero-CDN runtime).
- **Engine 3 (Rea Visual Replication)**: Located in `rea/` for reverse-engineering references and replicating frame-by-frame styles.

#### 2. EXECUTION COMMANDS:
- Check environment: `ai-video doctor` or `node bin/ai-video doctor`
- List compositions: `npm run remotion:compositions`
- Render motion graphics: `npm run remotion:render <CompositionName>`
- Preview real-time studio: `npm run remotion:preview` or `npm run hyperframes:studio`

#### 3. WORKFLOW DOCTRINE:
When asked to create motion graphics, VFX, or edits:
1. Select appropriate composition or block from `remotion/src/` or `registry/blocks/`.
2. Apply camera choreography via `cameraRig.tsx` presets.
3. Apply Hollywood post-processing passes (Godrays, Anamorphic Flares, LUT grade).
4. Run validation and render deterministic MP4/ProRes output.
```

### Model Context Protocol (MCP) Configuration
For Claude Desktop or Cursor IDE:

```json
{
  "mcpServers": {
    "ai-video-editor": {
      "command": "node",
      "args": ["/home/user/THE-AI-VIDEO-EDITOR/bin/ai-video", "mcp"],
      "env": {
        "AIVE_ROOT": "/home/user/THE-AI-VIDEO-EDITOR"
      }
    }
  }
}
```

---

## 6. 🎬 Render Gallery — 13 films produced with this repository

> **Source folder:** Google Drive [`AI VIDEO EDITOR`](https://drive.google.com/drive/folders/1CJmH3jkLbxReS9AqnrVV50l2JNbQTGJ6) · **Spec sheet:** [`docs/VIDEO-GALLERY.md`](docs/VIDEO-GALLERY.md) · **Playable page:** [`docs/video-gallery.html`](docs/video-gallery.html)
> Click any thumbnail to watch the film. Resolutions, durations and sizes below are read from the files themselves.

### 6.1 DAVID — *The Chronicles of Valor* (180-second flagship)

| Watch | Film | Specs | Size |
|---|---|---|---|
| [![DAVID 4K60](https://drive.google.com/thumbnail?id=1tRU0vmaQgyVOfYGiCTrhOfYCHk_S8pFa&sz=w640)](https://drive.google.com/file/d/1tRU0vmaQgyVOfYGiCTrhOfYCHk_S8pFa/view) | **DAVID_The_Chronicles_Of_Valor** — 4K master | **3840×2160 · 60 fps · 3:00** | 82.3 MB |
| [![DAVID 720p](https://drive.google.com/thumbnail?id=1L8dKnmVZUTF60mHOaWEYegVgu9cFFCWn&sz=w640)](https://drive.google.com/file/d/1L8dKnmVZUTF60mHOaWEYegVgu9cFFCWn/view) | **DAVID_The_Chronicles_Of_Valor** — review master | 1280×720 · 60 fps · 3:00 | 67.0 MB |
| [![DAVID contact sheet](https://drive.google.com/thumbnail?id=1-gF2tlx2z03nMqeHlzYWZ8wQHZDxWQQI&sz=w640)](https://drive.google.com/file/d/1-gF2tlx2z03nMqeHlzYWZ8wQHZDxWQQI/view) | **DAVID_contact_sheet_final.jpg** | shot-by-shot contact sheet | 74 KB |

📄 Also in the folder: [`DAVID - 180-Second Cinematic Blueprint.pdf`](https://drive.google.com/file/d/1C2zNGtW5rvLWlTE7y9vwIdNJUrCvMOf4/view) · [`DAVID - Complete Production Package.zip`](https://drive.google.com/file/d/1F50FxLvLRI9zi5hv4c2ZmGKLZW-_nmMN/view)

### 6.2 THADDEUS-TECHZ — *Dark Pursuit* (one sequence, five cuts)

| Watch | Film | Specs | Size |
|---|---|---|---|
| [![Dark Pursuit 4K](https://drive.google.com/thumbnail?id=1e2pSmA0_Nh0XFSmcjq8GPnUlQijwVpuz&sz=w640)](https://drive.google.com/file/d/1e2pSmA0_Nh0XFSmcjq8GPnUlQijwVpuz/view) | **Jason Statham Dark Pursuit** — 4K ultra-bitrate | **3840×2160 · 1:30** | 78.7 MB |
| [![Dark Pursuit 1080](https://drive.google.com/thumbnail?id=1YMjF69kkZcjKJvk21ILm3DNoaFYw-eEG&sz=w640)](https://drive.google.com/file/d/1YMjF69kkZcjKJvk21ILm3DNoaFYw-eEG/view) | **Jasone statham Dark Pursuit** — 1080p master | 1920×1080 · 1:30 | 72.7 MB |
| [![Dark Pursuit 720](https://drive.google.com/thumbnail?id=1RTw38KvO4r9945ko_vCzlfrabIxOf-Y5&sz=w640)](https://drive.google.com/file/d/1RTw38KvO4r9945ko_vCzlfrabIxOf-Y5/view) | **Jason Statham 90s** — full cut | 1280×720 · 1:30 | 9.3 MB |
| [![Dark Pursuit 30s](https://drive.google.com/thumbnail?id=1-vSvhKITM80UWM_Tdfmupo-DfSUUlxwO&sz=w640)](https://drive.google.com/file/d/1-vSvhKITM80UWM_Tdfmupo-DfSUUlxwO/view) | **Dark Pursuit ULTRAHIGH-3D** — 30-second cut | 1920×1080 · 0:30 | 8.4 MB |
| [![Dark Pursuit 24s](https://drive.google.com/thumbnail?id=11FQCpUcCsN3-aZzcQsgFkfhlhQGv_gPq&sz=w640)](https://drive.google.com/file/d/11FQCpUcCsN3-aZzcQsgFkfhlhQGv_gPq/view) | **Dark Pursuit ULTRAHIGH-3D** — 24-second cut | 1920×1080 · 0:24 | 7.8 MB |

### 6.3 *The Shift* — three iterations of a 20-second concept

| Watch | Film | Specs | Size |
|---|---|---|---|
| [![The Shift v2](https://drive.google.com/thumbnail?id=1mzImEnRLI4KIDFL4oqgxz5imJWCgeQfh&sz=w640)](https://drive.google.com/file/d/1mzImEnRLI4KIDFL4oqgxz5imJWCgeQfh/view) | **the-shift ultrahigh-3d v2** | 1920×1080 · 0:20 | 7.9 MB |
| [![The Shift v1](https://drive.google.com/thumbnail?id=1ex6RwxydvlUfJllQvD1Kdw_Nm7xHiqOF&sz=w640)](https://drive.google.com/file/d/1ex6RwxydvlUfJllQvD1Kdw_Nm7xHiqOF/view) | **the-shift ultrahigh-3d v1** | 1920×1080 · 0:20 | 8.7 MB |
| [![The Shift flat](https://drive.google.com/thumbnail?id=1KCWhY4xz8Q0MgBH7SKzEFLalk7HGwlIO&sz=w640)](https://drive.google.com/file/d/1KCWhY4xz8Q0MgBH7SKzEFLalk7HGwlIO/view) | **the-shift** — flat cut (pre-3D pass) | 1920×1080 · 0:20 | 3.4 MB |

### 6.4 Individual films

| Watch | Film | Specs | Size |
|---|---|---|---|
| [![Tri-AI Convergence](https://drive.google.com/thumbnail?id=1EEY_1VgwPEw_VrGU0e-vMEaQjM_QDejz&sz=w640)](https://drive.google.com/file/d/1EEY_1VgwPEw_VrGU0e-vMEaQjM_QDejz/view) | **Tri-AI Convergence** | **3840×2160 · 60 fps · 1:00** | 65.8 MB |
| [![Airplane window short](https://drive.google.com/thumbnail?id=1N6gDIuigJ-HY7-gyW345syQR6XTGB0EJ&sz=w640)](https://drive.google.com/file/d/1N6gDIuigJ-HY7-gyW345syQR6XTGB0EJ/view) | **Why airplane windows have a tiny hole** — Zack-D-Films-style 3D short (v6) | **1080×1920 vertical · 0:42** | 10.1 MB |
| [![Self portrait](https://drive.google.com/thumbnail?id=1BNNF0DziB9rO5WOqXiy3BXhkbEV1HbVE&sz=w640)](https://drive.google.com/file/d/1BNNF0DziB9rO5WOqXiy3BXhkbEV1HbVE/view) | **AI-VIDEO-EDITOR — Self-Portrait** | 1920×1080 · 30 fps · 0:10 | 5.6 MB |

### 6.5 What the gallery demonstrates

| Signal | Evidence |
|---|---|
| **4K60 delivery** | Three 3840×2160 60 fps masters |
| **Vertical-first** | A 1080×1920 explainer short cut for mobile feeds |
| **One concept, many cuts** | *The Shift* ×3 (flat vs 3D pass) · *Dark Pursuit* ×5 (4K/1080p/720p · 24s/30s/90s) |
| **Repeatable, not one-off** | 13 films, consistent naming, spec discipline |
| **Documented** | A 180-second cinematic blueprint + production package ship with the flagship |
| **Economics** | The same 1:30 cut exists at 78.7 MB (4K master) and 9.3 MB (review copy) — masters for delivery, light files for review |

**Render your own and open a PR adding a row** — see [`docs/VIDEO-GALLERY.md`](docs/VIDEO-GALLERY.md) §6 for the naming convention.

---

## 7. 🔬 2026 Forensic Atlases — what the new scans found

Four complete tool/model scans plus the reusable method that produced them ([`docs/forensics/`](docs/forensics/README.md)):

| Atlas | Headline finding |
|---|---|
| **Gemini 4 Argon** (`skills/gemini-4-argon-forensic-atlas/`) | The only frontier model that **ingests video with audio** (≈45 min, 10 files/prompt, LVBench 91.7%) with a **1,048,576-token unified window** and 1M-token *output* via long decode — and **no image or audio generation at all**. Drives Blender headless via MCP under an orchestrator + adversarial critic, clear at **≥9/10 after ≥3 named flaws** using four specific QC shots (wide · close · low-angle · wireframe) |
| **Higgsfield** (`skills/higgsfield-forensic-atlas/`) | The suite's centre of gravity is **post-production**. **Genjutsu** = motion transfer / object swap / restyle (tracking + roto + inpainting as one workflow); **Katana** rebuilds a whole edit's structure from one reference inside Claude; plus hidden surface: unlimited plans **do not apply** on MCP/CLI/Canvas/Supercomputer, the MCP tool list is **401-gated with no public list**, and MCP clips cap at ~15s |
| **heygen-com org** (`skills/heygen-github-forensic-atlas/`) | `hyperframes` is at **65k★** and shipping daily (v0.8.164) — the engine vendored here. **TransVLM** (SIGGRAPH Asia 2026) detects **any shot transition**, a free upgrade to the REA pipeline; **TAVR** generates talking avatars from video reference; four install paths + two transports for the avatar skills |
| **remotion-dev org** (`skills/remotion-github-forensic-atlas/`) | Core at **4.0.536**; **five agent-plugin repos** prove the engine now assumes an agent writes the composition. Sleeper finds: `html-in-canvas` (★197) for authentic UI capture, `template-overlay` (★19) for alpha renders into an NLE, `rust-ffmpeg` for safe deterministic encoding |
| **Opus 5.5 + GPT-6.1 Sol** (`skills/opus-5-5-sol-6-1-director/`) | The model layer, measured: **Opus 5.5** tops the independent Coding Agent Index at **58** ($5.98/run), **GPT-6.1 Sol** delivers near-Astra at **$0.72/run** with a **95% cached-input discount** — but **neither accepts video input**, so footage goes to Argon and only the *code* comes back |
| **The method** (`skills/forensic-scan-protocol/`) | 27 probes, evidence tiers **A–E**, hidden-surface hunting (footnotes, 401s, plan gates, doc typos) and a hard ethics line: no bypass instructions, ever |

### The seven rules distilled from the scans

1. **Route footage to Gemini 4 Argon.** Opus 5.5 and GPT-6.1 Sol cannot watch a cut; contact sheets are the only image bridge.
2. **Never let a model write pixels when it can write a scene.** A Blender/Three.js/Remotion scene is re-editable; a generated clip is not.
3. **Ask for raw gate output, never summaries.** Paste `seam-gate` and `lint` verbatim.
4. **Separate the critic from the writer**, and require ≥3 named flaws — a 10/10 with no flaws is a *failed* round.
5. **Read the footnote before you budget** — unlimited perks, clip ceilings and cache cliffs live below the fold.
6. **Enumerate tools after auth** (`tools/list`), never from a docs page.
7. **Consent and licence first** — reference edits must be owned or licensed, and likeness needs a release.

**Deep dives:** [`gemini-4-argon`](skills/gemini-4-argon-forensic-atlas/SKILL.md) · [`higgsfield`](skills/higgsfield-forensic-atlas/SKILL.md) · [`heygen-com`](skills/heygen-github-forensic-atlas/SKILL.md) · [`remotion-dev`](skills/remotion-github-forensic-atlas/SKILL.md) · [`opus-5-5-sol-6-1-director`](skills/opus-5-5-sol-6-1-director/SKILL.md) · [`forensic-scan-protocol`](skills/forensic-scan-protocol/SKILL.md) · [`2026 model stack`](docs/forensics/2026-model-stack.md)


