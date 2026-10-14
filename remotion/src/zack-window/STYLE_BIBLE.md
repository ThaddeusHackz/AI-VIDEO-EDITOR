# Zack D. Films format — forensic notes & style bible

These notes drive `ZackWindow-Short` (`src/zack-window/`). They were compiled from the
channel's public production breakdowns, fan-wiki transcripts/trivia, and frame study,
and they are the acceptance checklist for any new short rendered with this pipeline.

## How the real shorts are made (what we're imitating)

| Aspect | Zack D. Films (as documented) | This pipeline |
|---|---|---|
| Tooling | Blender + Cascadeur (physics-assisted character animation), BlenderKit assets, After Effects, EmberGen, Flamenco render farm; ~60-person team, contract 3D generalists make 20–45 s clips | React-Three-Fiber inside Remotion (`@remotion/three`), SwiftShader software GL in a headless Chromium, deterministic per-frame posing/IK |
| World | "The emptiness": a plain light-blue/cyan void with a soft white hot-spot behind the subject; no horizon, no sky, slight vignette | The same radial gradient (`#dff3fd → #b3e0f8 → #74c3ee → #3f9fdc`), now composited inside the GL frame by `scene/Post.tsx` (after tone mapping, so the colours are exact) + a soft vignette |
| Lens | Real camera feel: macro close-ups are shallow (the subject sharp, the rest falls off), medium shots mildly so, wides deep; a little glow on bright edges | `postprocessing` depth of field focused on each shot's look target (`focus` per shot in `direction.ts`: hole/bleed macros range 3–4.5 cm, face 22 cm, section/exploded 50–70 cm, wides off) + low bloom on the acrylic edges |
| Scale shots | Aviation shorts open "outside": the whole aircraft alone in the void, usually from below/ahead, before cutting to the person at the window | `scene/Airliner.tsx` (37.6 m narrow-body: lofted fuselage with upswept tail, swept tapered wings + winglets, pod engines, window line) in its own rig at `PLANE`; `planeWide` shot = slow orbit/push from below-ahead, then a low aft exterior with the fuselage curving up into the void and a push-in to his window |
| Characters | Semi-realistic 3D humans (recurring "Robert" demo man: wavy brown hair, white top, jeans), real objects, nothing cartoon | Microsoft Rocketbox `Male_Adult_06` (MIT; photo-scanned skin, wavy brown hair, henley recoloured white, jeans) — `public/zack-window/models/rb/`, posed per frame with two-bone IK + bone aiming in world space; ARKit blendshapes drive blinks, a slight smile and brow interest. (v2–v6 used a stylised Ready Player Me avatar — the single biggest "doesn't look like Zack" factor, replaced in v7.) |
| Breakage | Real fracture geometry, never a drawn crack texture: the broken object is pre-cut into pieces and the break propagates in 3D | `scene/Crack.tsx`: outer pane = Voronoi prisms of a jittered polar seed grid around the impact (radial + concentric cracks); fracture faces carry per-vertex alpha revealed by a front expanding from the impact (concentric faces a beat later), facets settle by <1° so reflections break up |
| Sets | A "slice" of a real place floating in the void: just the props that identify it (seat row, bin, window), never a full environment; glass slabs read by their bright edges | `scene/Cabin.tsx`: overhead bin + PSU (reading lights, gaspers), dado seam, raised-shade lip, contoured seat with wings + cream headrest cover, lap belt with buckle; outside, an 8.4 m fuselage section (R 3 m, wrapped past the crown and under the belly, lap-joint lines) with a row of 15 windows (dark / shade-down neighbours). From outside, the flat cabin pieces that would poke through the curved skin (wall panel, bin, floor) are hidden (`exteriorView`). Acrylic panes use a denser edge material on ExtrudeGeometry group 1 so slab thickness reads against the void |
| Shots | Macro/ECU, centred 9:16 framing, slow continuous push-ins, ~1 shot per sentence, hard cuts, cutaways/exploded views, literal 3D arrows for forces | `timeline.ts` SHOTS + `direction.ts` camera moves (`drift` easing = never fully stops), cutaway via `gl.localClippingEnabled`, exploded rig in the void, instanced arrows/particles |
| Light | Bright, soft, even; glossy-clean materials, soft contact shadows | Hemisphere + 1 PCF-shadowed key + fills, RoomEnvironment PMREM for reflections, ACES |
| Script | Calm plain second person, "most people think… but…", "You see…", one idea per sentence, 60–110 words, ~2.4–2.6 words/s, PG | 6 beats / 101 words / 39.8 s of VO (`timeline.ts` BEATS) |
| Subtitles | Small unobtrusive white phrase subtitles (present on all but ~18 of his shorts) | Inter 700 ≈50 px, dark stroke, ~69 % down, 2–6-word chunks |
| Sound | Quiet pad under the VO, a handful of literal SFX (taps, whooshes, cracks) | `public/zack-window/music/bed.wav` (generated pad, −20 dBFS RMS, mixed at 0.3) + five synthesized SFX in `public/zack-window/sfx/` (tap 3.3 s, pressure whoosh 14.9 s, crack 30.6 s, air hiss 32.75 s, fog-clear shimmer 38.9 s) |

## Acceptance checklist for a shot

1. Subject is centred or on the 9:16 thirds; nothing important in the top/bottom 15 % (UI overlays).
2. Camera is **inside the room** (interior cameras keep `x ≤ 0.52`; inner wall surface is `x = 0.58`).
3. One continuous slow move per shot; no ease-to-stop mid-shot.
4. Every physical claim is drawn literally (arrows push cabin → window; air flows cabin → hole → gap).
5. Clean, bright, white/blue palette. No dark grading, no grain, no giant stat callouts.
6. Captions match the spoken phrase; never emoji (renderer has no emoji font).

## Audio-only iteration

Sound changes don't need a 3D re-render: `python3 scripts/zw-remix.py out/zack-window-v2.mp4 out/final.mp4`
rebuilds the exact composition mix (VO beats from `timeline.ts`, the `SFX` table and pad ramp from
`ZackWindowShort.tsx`) and muxes it onto the rendered video with the bundled ffmpeg.

## Shot-only iteration

A change inside one shot (e.g. the crack) is re-rendered as a range that starts/ends on hard cuts
(`--frames=814-975 --muted`, ≈8 min) and spliced into the previous full render without re-encoding:
`python3 scripts/zw-splice.py out/zack-window-v4.mp4 out/seg.mp4 814 out/zack-window-v5.mp4`.
Verified on v5: untouched frames byte-identical to v4, clean whole-file decode.

## Render notes

* SwiftShader is pixel-bound (2 vCPU sandbox): matte surfaces are Lambert, PBR only for
  skin/acrylic/arrows; WebGL buffer renders at `dpr 0.75` and is upscaled; 4× MSAA on the composer's
  HalfFloat scene buffer; 1024 PCF shadows. ≈2.8 s/frame bare, ≈3.5–4.3 s/frame with the post stack
  (the lens passes are skipped on wide shots, `bokeh: 0`) → ~80 min for 1257 frames.
* The post stack renders into an off-screen buffer, so three.js applies **no** tone mapping/colour
  encoding to the materials; `ToneMappingEffect(ACES)` + the final pass do it (exposure is read from
  `gl.toneMappingExposure`). The scene buffer is cleared to transparent black = premultiplied by
  coverage, which is what makes the void composite (and every blur before it) edge-correct.
* The DoF circle-of-confusion material caches camera near/far: refresh it every frame
  (`copyCameraSettings`) because `CameraRig` switches near/far per shot (0.006/80 m for macro work,
  1.5/400 m for the airliner — the 80 m plane was being far-plane-clipped and would z-fight otherwise).
* Perf/debug switches via input props: `{"perf":{"aa":false,"shadows":false,"lambert":true,"pbrMatte":true,"dpr":1,"post":false,"msaa":0}}`
  and a camera override `{"cam":{"pos":[x,y,z],"look":[x,y,z],"fov":40}}`.
* `npm install` prunes `--no-save` packages: install saved deps first, then
  `npm i --no-save @types/three@0.170.0 @sparticuz/chromium@153.0.0`.
* R3F in render mode has frameloop `never`: anything that mounts asynchronously (GLB, env map)
  must call `useThree(s => s.advance)(performance.now())` once, or it is never drawn.
* Passenger (Rocketbox FBX, see README): clavicles hang off `Bip01_Neck` → pose head/neck before the
  arm IK; pointing is "wrist in the cabin below/behind the hole + straight index finger", with the elbow
  pole pointing down/aisle-wards so the arm never passes through the wall; hair cards are a separate
  non-shadowing `SkinnedMesh` (material **array** — a single material makes three ignore the groups and
  draw the whole body with the hair texture); a `roughnessMap` separates skin (0.56) from baked hair
  (0.86) so the crown doesn't read as a glossy cap. `{"dbg":{"markers":1}}` shows wrist/tip/touch spheres.
