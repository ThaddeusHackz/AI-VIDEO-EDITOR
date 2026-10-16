# AI-VIDEO-EDITOR — UltraHigh 3D Motion Graphics, VFX/CGI, NLE & Programmatic Video Monorepo

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
└── skills/                           # 47 Agent Skills (symlinked into .agents/skills/ & .claude/skills/)
```

---

## 2. Quickstart & Unified CLI (`./bin/ai-video`)

```bash
# 1. Load environment variables (caches in ~/.cache, single-worker producer for sandboxes)
source ./hf-env.sh

# 2. Run one-command health check (Node 22, FFmpeg 7.1, HyperFrames CLI, Remotion, 47 Skills, 447 Registry items)
./bin/ai-video doctor

# 3. Verify TypeScript compilation, HyperFrames lint (0 errors/0 warnings), and Vector Ledger seam stamps
./bin/ai-video verify

# 4. Browse all 47 Agent Skills, 10 Higgsfield DoP camera presets, and 9 Remotion compositions
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

## 4. Complete 47-Skill Catalog (`skills/`, `.agents/skills/`, `.claude/skills/`)

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

