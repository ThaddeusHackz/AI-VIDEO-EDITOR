# BRIEF — "SELF-PORTRAIT" (10s motion graphic)

**Subject:** this repo, describing itself. An AI video editor rendering its own capability reel.
**Format:** 1920x1080, 30 fps, 300 frames, 10.000 s, H.264 + synthesized audio bed. No narration
(`skills/motion-graphics`: motion is the message, under 10s, unnarrated).

## Doctrine applied (`skills/motion-doctrine`)

| Rule | How this piece obeys it |
| --- | --- |
| Vector ledger first | `ledger.json` written before any frame code; 3 seams, all rows matched |
| The current = LEFT | Seam 1 and seam 3 are cut-the-curve LEFT (neutral "next beat") |
| Reserved vectors spend meaning | Seam 2 (f138) is Z-forward zoom-through = "pushing deeper into the same thought" (into the 3D engine) |
| No crossfades | Zero-overlap cuts; one scene visible per frame |
| Cut mid-motion both sides | Exit `power4.in` / entry `power4.out` (seamTransitions.ts port) |
| Z scale-sign law | Seam 2: outgoing grows 1.00→1.24, incoming grows 0.75→1.00 (same sign) |
| Carriers | The accent underline bar travels from the boot HUD into the wordmark; the geodesic core light flares into the lockup |
| No idle wobble | Every phase owns a route: staged reveals, sequenced UI life (count-ups, typing, scan), camera with intent |
| Stillness before climax | 0.47 s freeze (f166–180) inside `scale`, then the flare ignites seam 3 |
| Transition vocabulary ≤ 3 | 2 techniques (cut-the-curve, zoom-through), 3 seams |
| Forbidden eases | No `bounce.out` / `elastic.out`; overshoot only via `back.out(1.6)` |
| Timing intents | Entries ≤ 800 ms, total stagger ≤ 500 ms, exits ≈ 75 % of entries |

## Scene map (final)

| # | Frames | Scene | Sustained-motion route | DoP preset (`cameraRig.tsx`) |
| --- | --- | --- | --- | --- |
| 1 | 0–53 | `boot` — engine self-report HUD, live counts, 210-cell registry grid lighting up, scan sweep | Sequenced UI life + staged reveals | `crane-up` (0.8) |
| 2 | 54–137 | `identity` — wordmark + mask reveal, accent-bar carrier, engine chips, oversized cursor CLICK at f116 | Staged reveals + cursor-led action | `handheld-cinema` (0.6) |
| 3 | 138–179 | `scale` — geodesic icosahedron + orbital carousel of registry chips + count-ups (210/237/53), FREEZE f166–179, anamorphic flare ignites the cut | Animated sequence + staged reveals + stillness-before-climax | `dolly-zoom` (0.5) |
| 4 | 180–299 | `lockup` — geodesic docks into the mark slot, logo sting, CTA pill, stat strip, timecode, vignette out | Staged reveals | `crane-up` (0.45) |

Seams (ledger.json): f54 cut-the-curve LEFT · f138 zoom-through (Z forward, the click at f116
is its cause) · f180 cut-the-curve LEFT (the flare sweep f168–180 is its cause; the geodesic
is the carrier into the lockup). Stillness before climax: f166–180 = 0.47 s.

## Repo material used

- `DESIGN.md` dark tokens, `themes/bold.css` brand palette (`#ff3d81` / `#7c5cff` / `#00d4ff`), `--ease-standard`
- `toolkit/fonts/*.woff2` — Inter 400/700/900, Space Grotesk 700, JetBrains Mono 400/700 (offline, zero CDN)
- `remotion/src/engine/cameraRig.tsx` — `mulberry32`, `project3DPoint`, 5 of the 10 DoP presets
- `remotion/src/engine/seamTransitions.ts` — `cutTheCurveSeam`, `zoomThroughSeam`, `waterfallEntry`, `nudgeCurve`, `computeOversizedCursor`
- `remotion/src/engine/vfxShaders.tsx` — `AnamorphicFlare`, `VolumetricGodrays`, `ParticleField3D`, `FilmGrainOverlay`
- `remotion/src/engine/nleTrackEngine.tsx` — `getLUTFilterString` grade applied as a numeric LUT
- `remotion/src/Cinematic3DShowcase.tsx` — `buildGeodesicGeometry` (icosahedron + orbital ring)
- `registry/blocks` + `registry/components` + `skills/` + `packages/` + `remotion/packages` — real counts, measured at render time
- `scripts/seam-gate.mjs` ledger schema

## Render path

No browser is installable in this sandbox (apt is unreachable, Chrome's shared-library set is
absent), so the Remotion and HyperFrames CLIs cannot rasterize here. The frames are produced by
`render.py`, a deterministic numpy/Pillow compositor that ports the engine modules above 1:1 and
encodes with the FFmpeg 7.0.2 binary shipped by `imageio-ffmpeg`. Same ledger, same eases, same
camera math, same palette — different rasterizer.
