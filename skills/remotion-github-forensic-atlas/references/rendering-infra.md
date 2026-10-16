# Remotion rendering infrastructure — from local render to globally distributed

## 1. The five render targets upstream maintains

| Target | Upstream artefact | ★ | Best for |
|---|---|---|---|
| **Local CLI** | `npx remotion render` | — | Authoring, QC stills, small deliverables |
| **AWS Lambda** | `lambda-binaries`, `lambda-ruby-sdk`, `lambda_go_sdk`, `lambda-php-sdk`, `template-react-router` | 7/1/4/7/39 | Massive, bursty, cost-per-second renders |
| **Cloudflare Containers** | `cloudflare-containers-demo` | 24 | Edge-first, globally close to users |
| **Vercel Sandbox** | `template-vercel` | 12 | Teams already on Vercel |
| **Self-hosted HTTP** | `template-render-server` | 14 | Full control, no vendor coupling |

Plus the **browser-side** lane: `webcodecs-benchmark` (★7) compares `@remotion/webcodecs` against FFmpeg.wasm, and `html-in-canvas` (★197) + `canvas-capture` (★2) record real pages at high fidelity.

## 2. Choosing a target (decision table)

| Situation | Choose | Why |
|---|---|---|
| Client needs an API that returns MP4 URLs | Lambda or render-server | Both are "request in → URL out" |
| Compliance requires data to stay in-region | Self-hosted render server | No third-party compute |
| Global users, short clips (<60 s) | Cloudflare Containers | Latency near the user |
| Already on Vercel | Vercel Sandbox | Zero new infra |
| Thousands of variants (personalisation at scale) | Lambda | Concurrency + per-second billing |
| Capture a live web app, not a redesign | `html-in-canvas` / recorder lane | Authentic UI |

## 3. Cost discipline (the part nobody documents)

```text
Cost drivers, in order of impact:
  1. Duration of output (linear)
  2. Resolution (super-linear in practice)
  3. Frame rate (linear)
  4. Bitrate/codec (~linear, cheap relative to the above)
  5. Concurrency, only if you are paying for idle capacity

Cheapest lever nobody pulls: render STILLS for review, render MP4 once for delivery.
Cheapest second lever: composite overlays in the client's NLE instead of rendering full frames
                        (template-overlay pattern) — you ship an alpha ProRes, not a master.
Third lever: capture real UI (html-in-canvas) instead of rebuilding it as JSX geometry.
```

**House rule (already in this repo):** QC with `remotion still` (4-shot protocol), never with full renders. A 4-still round costs seconds; a 1080p60 30-second re-render costs minutes and real CPU.

## 4. FFmpeg and the Rust lane

Upstream now keeps a safe FFmpeg wrapper in-house:

| Repo | ★ | Role |
|---|---|---|
| `rust-ffmpeg` | 6 | Safe FFmpeg wrapper |
| `rust-ffmpeg-sys` | 2 | FFmpeg bindings |
| `rust-ffmpeg-splitter` | 9 | FFmpeg as a binary + Rust bindings, plus a splitter |

Implication for this repo's pipelines: when you need deterministic, memory-safe encoding outside Node (e.g. a long batch of masters), the Rust wrapper is the sanctioned path — do not shell out to ad-hoc ffmpeg one-liners for anything a client depends on. Keep Go/Node wrappers for orchestration only.

## 5. Chrome/Chromium note

`chrome-build-instructions` (★11), plus mirrors of `chromium` (★1) and `FFmpeg` (★0) under the org, exist because **Remotion renders headlessly through Chrome**. Consequences:

- Pin your headless browser version in CI alongside `remotion`;
- The `gpu-scene` repo (★5) exists specifically to test whether a render is genuinely GPU-accelerated;
- Font loading and `document.fonts.ready` matter more than usual — this repo ships `.woff2` files in `toolkit/fonts/` for exactly this reason (offline-first, no CDN race at render time).

## 6. Local → cloud promotion checklist

- [ ] Composition renders deterministically **twice** locally with identical output hash
- [ ] All fonts/assets vendored (`toolkit/`), no network fetches at render time
- [ ] Output specs pinned (codec, pixel format, colour space, fps, bitrate)
- [ ] Render target smoke-tested with a 3-second clip before a real job
- [ ] Failure mode understood: what happens on timeout, OOM, and partial render
- [ ] Cost per deliverable minute measured once and recorded in the project notes
- [ ] Stills-based QC gate wired ahead of the paid render step

## 7. Sources

`api.github.com/orgs/remotion-dev/repos` (2026-10-16) for all star counts and descriptions;
`api.github.com/repos/remotion-dev/remotion/releases` → v4.0.536; `registry.npmjs.org/remotion/latest`.
