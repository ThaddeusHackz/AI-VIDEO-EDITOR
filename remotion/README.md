# Remotion — React-based programmatic video

Second video engine alongside HyperFrames. Same output (MP4), different authoring model.

| | HyperFrames | **Remotion** |
|---|---|---|
| Author in | HTML + CSS + GSAP | **React / TypeScript (TSX)** |
| Animation is | a paused GSAP timeline | **a pure function of `frame`** |
| Best for | HTML/CSS layouts, cinematic compositions, agent-written scenes | **data-driven video, batch renders, complex component logic** |
| Browser | chrome-headless-shell (shared) | same binary, **shared** |
| Time to render | 15s clip ≈ 2m on this box | 6s clip ≈ **22s** |

Both are installed and both render. Use whichever fits the job — or mix them, since they
share the same font set, the same ffmpeg, and the same Chrome binary.

## Production playbook

For future motion-graphics work, start with [`/home/user/toolkit/AI_VIDEO_EDITOR_PLAYBOOK.md`](../toolkit/AI_VIDEO_EDITOR_PLAYBOOK.md). It documents the creative brief, renderer choice, deterministic animation rules, preview/QA gates, and a reusable director prompt. Use [`VIDEO_BRIEF_TEMPLATE.md`](../toolkit/VIDEO_BRIEF_TEMPLATE.md) to scope a new edit.

---

## Project layout

```
remotion/
├── package.json          pins remotion 4.0.534 + react 19.2
├── remotion.config.ts    codec, concurrency, and the shared-browser wiring
├── tsconfig.json
├── public/fonts/         14 woff2 files (copied from /home/user/toolkit/fonts)
├── src/
│   ├── index.ts          entry — loads fonts, then registers compositions
│   ├── fonts.ts          FontFace loader (see note below)
│   ├── Root.tsx          registers every renderable composition
│   ├── TitleCard.tsx     prop-driven animated title
│   └── ScriptureCard.tsx line-by-line verse reveal
└── out/                  rendered output
```

## `ZackWindow-Short` — 3D explainer short (Zack D. Films format)

`src/zack-window/` is a complete 1080×1920 @ 30 fps, 41.9 s short ("Why airplane windows have a
tiny hole") built as **real 3D animation** with React-Three-Fiber inside Remotion: a posed
passenger, a sectioned cabin wall, exploded panes, force arrows, airflow particles, fog and a crack
sim, a lofted airliner for the wide shot, and a lens/post stack (depth of field, bloom, ACES, vignette),
narrated with pre-rendered VO and small phrase subtitles. The research behind the look and the
shot checklist live in [`src/zack-window/STYLE_BIBLE.md`](src/zack-window/STYLE_BIBLE.md).

```bash
cd remotion
npm install && npm i --no-save @types/three@0.170.0 @sparticuz/chromium@153.0.0   # once per machine
# a few review frames (one bundle, one browser) → out/stills/fNNNN.jpg, then a contact sheet
node scripts/stills.mjs ZackWindow-Short out/stills 0.5 30 200 520 950
python3 scripts/sheet.py out/stills/sheet.jpg out/stills/f0030.jpg out/stills/f0200.jpg
# full render (≈80 min on a 2-vCPU box: SwiftShader software GL + post stack)
npx remotion render src/index.ts ZackWindow-Short out/zack-window-v6.mp4 \
  --browser-executable=$PWD/scripts/chrome-wrapper.sh --concurrency=2 --crf=20 --jpeg-quality=88 --timeout=180000
```

`scripts/chrome-path.cjs` extracts `@sparticuz/chromium` (plus its `al2023` nss/nspr libs, which the
package skips outside Amazon Linux) to `/tmp`, and `scripts/chrome-wrapper.sh` launches it with
SwiftShader WebGL flags. Debug any frame from any angle with
`ZW_PROPS='{"cam":{"pos":[x,y,z],"look":[x,y,z],"fov":45}}' node scripts/stills.mjs ZackWindow-Short out/dbg 0.4 100`.

Audio-only changes (VO, SFX table, bed levels) do not need a re-render:
`python3 scripts/zw-remix.py out/<rendered>.mp4 out/<final>.mp4` rebuilds the mix from
`timeline.ts` + the `SFX` table and remuxes it onto the existing video stream.

Changes confined to one shot do not need a full re-render either: render just that range with
`--frames=A-B --muted` (same crf/quality flags) and splice it in losslessly with
`python3 scripts/zw-splice.py out/<base>.mp4 out/<segment>.mp4 A out/<final>.mp4`. The range must
start and end on hard cuts (x264 puts keyframes there; the script checks and refuses otherwise).

Scene layout: `scene/direction.ts` (world layout, per-shot cameras + lens focus, per-frame scene state),
`scene/Post.tsx` (the look: `postprocessing` composer — MSAA scene buffer → depth of field focused on
each shot's look target → bloom → ACES → the cyan void composited under the premultiplied scene →
vignette; `{"perf":{"post":false}}` bypasses it), `scene/Window.tsx` (wall + three-pane assembly, fog
overlay), `scene/Crack.tsx` (pre-fractured outer pane: Voronoi prisms whose fracture faces are revealed by
an expanding front), `scene/Cabin.tsx` (set dressing: overhead bin + PSU, dado trim, lap belt, curved
fuselage with a row of windows), `scene/Airliner.tsx` (narrow-body airliner lofted from airfoil sections
for the wide "high up in the void" shot), `scene/Props.tsx` (seat, arrows, pressure field, airflow
particles), `scene/Passenger.tsx`
(procedurally posed Ready Player Me avatar — `public/zack-window/models/passenger.glb` is
`avatar_2_m.glb` from the MIT-licensed `carlosfranzreb/ravas` repo; same Wolf3D/Mixamo rig +
52 ARKit blendshapes as any RPM full-body export, so the GLB can be swapped without code changes).

## Compositions available

| id | size | length | purpose |
|---|---|---|---|
| `TitleCard` | 1920×1080 | 6.0 s | prop-driven title card |
| `TitleCard-Square` | 1080×1080 | 6.0 s | same component, different aspect |
| `ScriptureCard` | 1920×1080 | 8.0 s | verse reveal, matches the Servant of Jesus look |

Because `TitleCard` takes props, one component renders unlimited variants — change
`defaultProps` in `Root.tsx`, or override per render:

```bash
npx remotion render src/index.ts TitleCard out/outro.mp4 --props='{"title":"New title\nhere"}'
```

---

## Commands

```bash
source /home/user/hf-env.sh
cd /home/user/remotion

npx remotion studio                          # live preview in the browser
npx remotion compositions src/index.ts       # list every target
npx remotion render src/index.ts TitleCard out/titlecard.mp4
npx remotion still  src/index.ts TitleCard out/thumb.png --frame=120
```

Rendered already (proof it works): `out/titlecard.mp4` (6 s, 1920×1080, 30 fps, 984 KB).

---

## Two things worth knowing

**1. Fonts must load through the FontFace API, not CSS `@font-face`.**
Remotion bundles with webpack, which tries to resolve `url("/fonts/x.woff2")` as a *module
import* and fails the build with `Module not found`. `src/fonts.ts` uses
`staticFile()` + `new FontFace()` instead, wrapped in `delayRender`/`continueRender` so the
renderer never captures a frame before the fonts are ready. Without that guard the first
second of the video silently renders in a fallback serif — which is exactly what happened on
my first attempt here, and why the check frame looked wrong.

**2. Remotion and HyperFrames share one browser.**
`remotion.config.ts` points Remotion at the chrome-headless-shell that HyperFrames already
downloaded in `~/.cache`, so there's no second ~260 MB download. `~/.cache` is excluded from
workspace snapshots, so the browser costs nothing against the save budget.
Verify with: `ls node_modules/.remotion/chrome-headless-shell` → should *not* exist.

---

## Reinstalling

`node_modules/` is excluded from snapshots, so dependencies rebuild from `package.json`:

```bash
bash /home/user/setup-toolchain.sh          # both engines
bash /home/user/setup-toolchain.sh --remotion-only
```
