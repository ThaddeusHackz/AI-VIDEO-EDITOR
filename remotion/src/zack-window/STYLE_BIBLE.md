# Zack D. Films format — forensic notes & style bible

These notes drive `ZackWindow-Short` (`src/zack-window/`). They were compiled from the
channel's public production breakdowns, fan-wiki transcripts/trivia, and frame study,
and they are the acceptance checklist for any new short rendered with this pipeline.

## How the real shorts are made (what we're imitating)

| Aspect | Zack D. Films (as documented) | This pipeline |
|---|---|---|
| Tooling | Blender + Cascadeur (physics-assisted character animation), BlenderKit assets, After Effects, EmberGen, Flamenco render farm; ~60-person team, contract 3D generalists make 20–45 s clips | React-Three-Fiber inside Remotion (`@remotion/three`), SwiftShader software GL in a headless Chromium, deterministic per-frame posing/IK |
| World | "The emptiness": a plain light-blue/cyan void with a soft white hot-spot behind the subject; no horizon, no sky, slight vignette | CSS radial gradient backdrop (`#dff3fd → #b3e0f8 → #74c3ee → #3f9fdc`) behind an alpha WebGL canvas |
| Characters | Semi-realistic 3D humans (recurring "Robert" demo man), real objects, nothing cartoon | Ready Player Me avatar (`public/zack-window/models/passenger.glb`), suit tinted plain dark, posed with two-bone IK + bone aiming |
| Shots | Macro/ECU, centred 9:16 framing, slow continuous push-ins, ~1 shot per sentence, hard cuts, cutaways/exploded views, literal 3D arrows for forces | `timeline.ts` SHOTS + `direction.ts` camera moves (`drift` easing = never fully stops), cutaway via `gl.localClippingEnabled`, exploded rig in the void, instanced arrows/particles |
| Light | Bright, soft, even; glossy-clean materials, soft contact shadows | Hemisphere + 1 PCF-shadowed key + fills, RoomEnvironment PMREM for reflections, ACES |
| Script | Calm plain second person, "most people think… but…", "You see…", one idea per sentence, 60–110 words, ~2.4–2.6 words/s, PG | 6 beats / 101 words / 39.8 s of VO (`timeline.ts` BEATS) |
| Subtitles | Small unobtrusive white phrase subtitles (present on all but ~18 of his shorts) | Inter 700 ≈50 px, dark stroke, ~69 % down, 2–6-word chunks |
| Sound | Quiet pad under the VO, minimal SFX | `public/zack-window/music/bed.wav` (generated pad, −20 dBFS RMS, mixed at 0.3) |

## Acceptance checklist for a shot

1. Subject is centred or on the 9:16 thirds; nothing important in the top/bottom 15 % (UI overlays).
2. Camera is **inside the room** (interior cameras keep `x ≤ 0.52`; inner wall surface is `x = 0.58`).
3. One continuous slow move per shot; no ease-to-stop mid-shot.
4. Every physical claim is drawn literally (arrows push cabin → window; air flows cabin → hole → gap).
5. Clean, bright, white/blue palette. No dark grading, no grain, no giant stat callouts.
6. Captions match the spoken phrase; never emoji (renderer has no emoji font).

## Render notes

* SwiftShader is pixel-bound (2 vCPU sandbox): matte surfaces are Lambert, PBR only for
  skin/acrylic/arrows; WebGL buffer renders at `dpr 0.75` and is upscaled; MSAA on; 1024 PCF shadows.
  ≈2.6 s/frame at 1080×1920 → ~55 min for 1257 frames.
* Perf/debug switches via input props: `{"perf":{"aa":false,"shadows":false,"lambert":true,"pbrMatte":true,"dpr":1}}`
  and a camera override `{"cam":{"pos":[x,y,z],"look":[x,y,z],"fov":40}}`.
* R3F in render mode has frameloop `never`: anything that mounts asynchronously (GLB, env map)
  must call `useThree(s => s.advance)(performance.now())` once, or it is never drawn.
