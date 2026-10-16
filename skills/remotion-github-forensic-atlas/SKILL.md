---
name: remotion-github-forensic-atlas
description: "Complete forensic atlas of the remotion-dev GitHub organisation (120+ repos): remotion core (64k★, v4.0.536), the Agent Skills repo (5.2k★, 12 skills), the Claude Code / Codex / Cursor / Kimi agent plugins, every official template that matters for motion graphics and CGI (three, skia, overlay, tiktok captions, audiogram, music-visualization, prompt-to-motion-graphics-saas), plus recorder, canvas-capture, morph-text, animated-captions, gl-transitions, rust-ffmpeg and the Lambda/Cloudflare/Vercel render stacks."
---

# remotion-dev — GitHub Organisation Forensic Atlas (`remotion-github-forensic-atlas`)

> **Scan date:** 2026-10-16 · **Core version:** `remotion` **4.0.536** (released 2026-10-16; this repo pins **4.0.534**)
> **Method:** `api.github.com/orgs/remotion-dev/repos?per_page=100&sort=updated` + per-repo metadata + npm registry read.
> **This repo already vendors 59 Remotion packages** under `remotion/packages/`, 10 registered compositions, and the 7-module engine (`cameraRig`, `vfxShaders`, `nleTrackEngine`, `threeSceneStudio`, `cinemaStudio4`, `characterRig2D`, `seamTransitions`). This atlas maps the *rest* of the org so nothing valuable is missed.

---

## 1. The org at a glance

```text
remotion-dev
├── remotion .............. 64,522★  "🎥 Make videos programmatically with React"  (v4.0.536)
├── skills ................  5,232★  "Agent Skills"  → 12 skills (see §3)
├── github-unwrapped ......  1,329★  the viral year-in-review renderer  (+ 2022: 1,319★)
├── trailer ...............  1,142★  the promo video, made in Remotion
├── template-tiktok .......    288★  TikTok-style captions with Whisper.cpp
├── template-prompt-to-motion-graphics-saas  275★   ← flagship AI template
├── template-audiogram ....    273★  podcast clips
├── template-code-hike ....    220★  code snippet animations
├── html-in-canvas ........    197★
├── template-prompt-to-video  154★  story + images + voiceover from a prompt
├── github-unwrapped-2022 .  1,319★
├── recorder ..............     54★  "Video production for developers"
├── AGENT PLUGINS ....... claude-code-plugin 50★ · codex-plugin 26★ · cursor-plugin 3★ ·
│                          kimi-code-plugin 2★ · agent-plugin 3★  ("Portable Remotion Agent Plugin")
├── template-three ........    113★  +  template-skia 25★ · template-overlay 19★ ·
│                          template-still 48★ · template-render-server 14★ ·
│                          template-next-app-dir(-tailwind) 126★/53★ · template-react-router 39★ ·
│                          template-vercel 12★ · template-electron 4★ · template-empty 2★
├── EFFECTS / MOTION ...... morph-text 16★ · animated-captions 7★ · animated-emoji 13★ ·
│                          typewriter 38★ · text-warping 12★ · timing-functions 7★ ·
│                          video-with-jump-cuts 17★ · motion-blur-example 16★ · light-leak-example 7★ ·
│                          css-animation-play-state 11★ · spring-editor 4★ · jumpcuts 3★
├── 3D / GPU .............. template-three 113★ · three-particles 8★ · 3d-text 10★ ·
│                          glb-example 3★ · remotion-three-gltf-example 7★ · gpu-scene 5★ ·
│                          3d-text · maplibre-example 2★ · mapbox-example 39★
├── TRANSITIONS / SHADER .. gl-transitions 27★ · transitions-video 23★ · anime-example 24★ ·
│                          tone-js-example 11★ · d3-example 20★
├── INFRA / RENDER ........ rust-ffmpeg 6★ · rust-ffmpeg-sys 2★ · rust-ffmpeg-splitter 9★ ·
│                          lambda-binaries 7★ · lambda-ruby-sdk 1★ · lambda_go_sdk 4★ ·
│                          lambda-php-sdk 7★ · cloudflare-containers-demo 24★ ·
│                          webcodecs-benchmark 7★ · chrome-build-instructions 11★
└── OTHER ................. our-recorder 24★ · shorts-customizer 14★ · showcase-uploader 3★ ·
                           apple-wow-tutorial 19★ · brand 88★ · highlighter 1★ · measure-item 2★ ·
                           heart-animation 1★ · athletes-eye 1★ · dvd-logo 1★ · svelte-starter 1★ ·
                           vue-starter 3★ · angular-starter 0★ · react-native-demo 27★ ·
                           autocomplete 1★ · the-dashboard 4★ · contribution-graph-vercel 8★ ·
                           at-remotion 1★ · whats-new-in-remotion 0★ · 4-0-trailer 14★ · trailer-2-0 21★
```

---

## 2. What this tells you about direction

1. **Agent-native is the strategy, not a side feature.** Five plugin repos (`claude-code-plugin`, `codex-plugin`, `cursor-plugin`, `kimi-code-plugin`, `agent-plugin`) plus a 5.2k★ `skills` repo. The engine now assumes an **agent writes the composition**.
2. **"prompt → motion graphics" is an official template.** `template-prompt-to-motion-graphics-saas` ★275 is the closest upstream blueprint to what this repo does by hand.
3. **Capture is a first-class product line.** `recorder` ★54, `canvas-capture` ★2 ("high-fidelity webpage recorder using HTML-in-canvas"), `html-in-canvas` ★197, `our-recorder` ★24 — Remotion is investing in *acquiring* pixels (screen capture, DOM capture) as well as generating them.
4. **Rust/FFmpeg is being absorbed.** `rust-ffmpeg`, `rust-ffmpeg-sys`, `rust-ffmpeg-splitter` — a safe FFmpeg wrapper is being kept in-house, which matters for deterministic encoding pipelines.
5. **Cloud render is templated for every host:** Lambda (+ Ruby/Go/PHP SDKs), Cloudflare Containers, Vercel Sandbox, plain Express render server.

---

## 3. `remotion-dev/skills` — 12 official skills (★5,232)

```text
remotion-best-practices   remotion-captions    remotion-create     remotion-docs
remotion-interactivity    remotion-maps        remotion-markup     remotion-multimedia
remotion-render           remotion-saas        remotion-studio     remotion-upgrade
```

Repo root: `README.md`, `package.json`, `scripts/`, `skills/`, `tsconfig.json` — i.e. skills are **packaged as software** (build scripts + TS config), not loose markdown.

This repo already mirrors all 12 (Tier 4 of the skill catalog) and extends them with the 7-module engine. The forensic value is in the **plugin repos**, which tell you how each host is expected to install and drive them:

| Plugin repo | ★ | Host | Install shape |
|---|---|---|---|
| `claude-code-plugin` | 50 | Claude Code | Remotion Agent Skills for Claude Code |
| `codex-plugin` | 26 | OpenAI Codex | Remotion OpenAI Codex Plugin |
| `cursor-plugin` | 3 | Cursor | Remotion Agent Plugin for Cursor |
| `kimi-code-plugin` | 2 | Kimi Code | Remotion Agent Skills for Kimi Code |
| `agent-plugin` | 3 | Portable | "Portable Remotion Agent Plugin for compatible coding agents" |

**Adoption note:** `agent-plugin` is the portable one — if you support a new agent host, that is the integration surface to target first.

---

## 4. Highest-value upstream repos to mine next

| Repo | ★ | What to take | Where it lands here |
|---|---|---|---|
| `template-prompt-to-motion-graphics-saas` | 275 | Prompt→mograph SaaS architecture (the official one) | Blueprint for `bin/ai-video` agent flows |
| `template-tiktok` | 288 | Whisper.cpp caption pipeline | `embedded-captions` / `captions-overlay` upgrades |
| `template-audiogram` | 273 | Podcast clip generation | `music-to-video` / audio-reactive work |
| `template-code-hike` | 220 | Code-snippet animation (the "Code Hike" look) | Dev-tool promo cuts |
| `html-in-canvas` + `canvas-capture` + `recorder` | 197 / 2 / 54 | High-fidelity capture of **real** pages/UI | Product demos where the UI must be authentic |
| `morph-text` | 16 | Text morphing between strings | Kinetic type beats |
| `animated-captions` | 7 | Caption style pack | Caption tiers |
| `text-warping` | 12 | `warpPath()` API demo | Warped title designs |
| `typewriter` | 38 | Typewriter effect | Terminal/code beats |
| `video-with-jump-cuts` | 17 | Cutting a portion without re-mounting the video | NLE-style edits without remount flicker |
| `light-leak-example` | 7 | Light-leak overlays | Editorial flash/leak transitions |
| `motion-blur-example` | 16 | Motion blur implementation | `MotionDoctrineReel` blur passes |
| `gl-transitions` | 27 | GLSL transition library | Shader transitions (pairs with `@remotion/shader-transitions`) |
| `three-particles` / `3d-text` / `glb-example` / `remotion-three-gltf-example` / `gpu-scene` | 8 / 10 / 3 / 7 / 5 | 3D particle systems, extruded text, glTF loading, GPU scene testing | `cinematic-3d-vfx-cgi`, `threeSceneStudio.tsx` |
| `timing-functions` | 7 | Source for easing-curve education | Easing discipline in the Doctrine |
| `apple-wow-tutorial` | 19 | Recreation of a landmark Apple animation | Reference-grade kinetic craft |
| `lambda-ruby-sdk` / `lambda_go_sdk` / `lambda-php-sdk` / `lambda-binaries` | 1 / 4 / 7 / 7 | Render on AWS Lambda from other languages | Client delivery surfaces |
| `cloudflare-containers-demo` | 24 | Render on Cloudflare Containers | Serverless render target |
| `webcodecs-benchmark` | 7 | WebCodecs vs FFmpeg.wasm speed | Browser-side render decisions |
| `rust-ffmpeg*` | 6 / 2 / 9 | Safe FFmpeg wrapper + splitter | Deterministic encode tooling in Rust services |
| `github-unwrapped` (+2022) | 1,329 / 1,319 | The most-starred template of the org: data→video at scale | Data-driven campaign videos |
| `brand` | 88 | Logo/brand elements made in Remotion | Asset pipeline hygiene |
| `trailer` / `trailer-2-0` / `4-0-trailer` | 1,142 / 21 / 14 | How Remotion markets itself, in Remotion | Launch-video craft reference |

---

## 5. Version discipline (this repo pins 4.0.534, upstream is 4.0.536)

| Rule | Why |
|---|---|
| Pin **exact** `remotion` + `@remotion/*` versions together | All `@remotion/*` packages must match the core version |
| Bump only after `npx remotion compositions src/index.ts` lists all 10 comps | Catches breaking API changes immediately |
| Re-run the 4-shot QC stills after any bump | Cheap visual regression gate |
| Never mix `^` ranges on `@remotion/cli` vs core | The CLI validates versions and will refuse to render |
| Keep `three` + `@react-three/fiber` + `postprocessing` versions in the same bump train | R3F v9 requires React 19 |

```bash
cd remotion
npx remotion upgrade                      # when you decide to move
npx remotion compositions src/index.ts    # must list 10 compositions
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/wide.png --frame=120
```

---

## 6. Source ledger

`api.github.com/orgs/remotion-dev/repos?per_page=100&sort=updated` (2026-10-16) ·
`api.github.com/repos/remotion-dev/remotion/releases` → **v4.0.536, 2026-10-16T08:10Z** ·
`registry.npmjs.org/remotion/latest` → **4.0.536** · `remotion-dev/skills` root enumeration → 12 skills ·
local `remotion/package.json` → pins `4.0.534`, React 19.2.0, `/@react-three/fiber ^9.3.0`, `three ^0.170.0`, `zod 4.5.4`.

Deep dives: [`references/org-atlas.md`](references/org-atlas.md) · [`references/skills-plugins-templates.md`](references/skills-plugins-templates.md) · [`references/rendering-infra.md`](references/rendering-infra.md)
