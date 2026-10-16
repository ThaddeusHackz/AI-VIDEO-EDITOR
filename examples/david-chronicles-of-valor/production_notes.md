# DAVID: THE CHRONICLES OF VALOR
## Director’s production bible / 180 seconds / 4K landscape / 60 fps

**Working/project title:** DAVID: THE CHRONICLES OF VALOR. **Final onscreen title, following the requested outro:** VALOR: THE CHRONICLES OF DAVID. This is an original cinematic blueprint, not a completed photorealistic film, an Unreal project with finished assets, or an executed Sora/Runway generation.

## 01 — The film’s governing idea

David survives through observation, economy and grounded resolve. The Three each express a different relationship to force: Josheb redirects a formation; Eleazar refuses exhaustion; Shammah makes a patch of ground immovable. David learns their visual grammar and combines it in the storm duel. The final image is not a victory pose pasted onto a landscape. His stance, ragged breath, damaged clothing and dependence on the planted sword preserve the cost of the battle.

Use the named games as high-level craft references—readable close combat, deliberate weapon weight, restrained environmental storytelling—not as sources of copied characters, costume meshes, signature sequences, music or interface graphics. The film has no HUD, loot effects, combo numbers, electric weapon outlines or omnipresent artificial lens flare.

## 02 — History, scripture and deliberate legend

This is a legend-mode adaptation, not documentary reconstruction. The Three’s episodes are compressed into one geographical battle for cinematic unity. The 300-soldier wall is the requested visual scale; do not put an unqualified scriptural kill-count claim in captions. The textual traditions concerning Josheb/Jashobeam and their numbers require separate scholarly review before an educational release.

The leather sword binding, offhand parrying dagger, khopesh-inspired weapon, large two-handed sword, modern martial-arts influences, long subjective airtime, bow-breaking sling shot and ground-pressure shockwave are explicit dramatizations. A khopesh is not simply interchangeable with an ordinary ancient Israelite short sword. Likewise, Pankration, Greco-Roman wrestling, Wushu and judo-inspired screen shapes are references for staged animation—not a claim that this combined system existed in ancient Judea.

David is designed as a young adult with sun-darkened Levantine features, compact athletic proportions, dark textured hair and a short beard. His tunic is practical linen, not shining fantasy royal plate. The film’s final language foreshadows kingship without pretending to resolve the chronology of his entire life. Philistine opponents are differentiated human combatants, not a dehumanized mass. Defeat is conveyed through broken guards, dropped weapons and retreat; no graphic dismemberment or exposed tissue is required.

## 03 — Locked delivery and frame conventions

Target 3840 × 2160, 16:9, 60/1 progressive frames per second, 180.000 seconds. Valid output frames are **0–10799 inclusive**. Frame 10800 is the exclusive endpoint and must never be exported. Timecode is non-drop-frame HH:MM:SS:FF. Audio is 48 kHz: each output frame corresponds to exactly 800 audio samples.

There are 36 editorial shots of 300 output frames each. Each shot has six documented choreography phases, plus separately specified exact contact frames and retiming keys. `frames.jsonl` and `frames.csv` cover every frame individually with its direction, camera, lens, focus, lighting, weather, retiming, hit-stop, cue and typography states. They are exhaustive temporal plans, **not** solved full-body joint animation or provided motion capture. Production-quality bodies, faces, costume simulations and safe staged performances must still be created and reviewed.

No final output can honestly be guaranteed “native PS5” by a prompt. A native-resolution real-time target is an engineering target to profile on licensed development hardware. PC Movie Render Queue imagery can exceed the real-time budget and must be labeled accordingly.

## 04 — Two rendering profiles, not one impossible promise

**Profile A: cinematic PC master.** Unreal Engine 5.5 project, deferred renderer, Lumen GI/reflections with hardware ray tracing where supported, Nanite for suitable static environment geometry, Virtual Shadow Maps, local volumetric fog and authored atmospheric layers. Use physically based skin with subsurface profile shading, eye tearline geometry, groom assets or high-quality cards, correct specular/roughness breakup and deformer/rig-driven expression. Path-traced look-development stills are optional references, not proof of the real-time route. Do not assume that path tracing, Lumen, groom rendering and every cinematic effect can simply be enabled together without compatibility testing.

**Profile B: PS5-class 60 fps planning budget.** Reserve about 2 ms of the 16.67 ms frame for variability and platform overhead; an illustrative GPU allocation is 3.0 ms base geometry/materials, 2.8 ms GI/reflections, 1.8 ms shadows, 1.5 ms characters/grooms, 1.5 ms translucency/volumetrics, 1.3 ms post/reconstruction, 1.0 ms effects, and 1.7 ms slack. These are provisional allocations, not benchmark results. CPU animation/crowd work must fit its own parallel budget; do not simply add CPU and GPU timings as serial costs. Profile real captures before accepting these numbers. Reduce distant crowd cost, hair representation, ray count, fog resolution and particle overdraw before compromising readable hero contact. If 3840 × 2160 internal shading cannot sustain 60 fps, use a documented reconstruction/dynamic-resolution profile and stop calling it native 4K.

4K textures belong on the hero face, visible costume panels and relevant weapon details, not every pebble or soldier. Author texel density and streaming budgets; use lower mips, atlases and instancing at distance. Close-ups may need separately authored displacement and pore normals, but more texture resolution cannot repair poor lighting or facial animation.

## 05 — Character and prop continuity bible

**David / DAVID_A:** compact adult build; dark short beard, charcoal curls, ochre-tan linen, faded indigo hem, dark belt, reinforced leather-faced shield with a distinguishable chipped lower rim. Right hand owns the same curved short sword throughout; its worn grip and edge nick are identity anchors. The sling is carried at the belt with a stone prepared in its fold. Shield moves to its carry loop before the aerial sling sequence. During S18 the sword comes to rest on nearby timber; S20 knocks it loose; S21 catches that newly falling sword. The acquired dagger is an offhand weapon only. S25 shows its disposal into mud before the final single-blade duel. Nothing appears, vanishes or changes hands offscreen without a documented transition.

**Josheb / JOSHEB_A:** taller, open stance, ash-wood spear with dark binding and a visibly heavy butt; narrow terracotta shoulder cloth. **Eleazar / ELEAZAR_A:** lean and exhausted, weathered neutral tunic, leather-bound right-hand sword and shorter offhand parrying blade. **Shammah / SHAMMAH_A:** broad, rooted stance, deep brown wrap, heavy two-handed production sword. Preserve their silhouettes in the distant final ridge composition.

**Captain / CAPTAIN_A:** bronze broad blade, tall crest, slower hip-led swings. **Champion / CHAMPION_A:** heavier but human-proportioned, distinct shoulder pauldron and a single heavy weapon; pre-weakened shoulder fastening established before destruction. Opponents have separate face/costume variations, gait phases and tactical reactions. The 300-person tableau is population planning, not 300 simultaneous hero rigs.

Maintain four costume states: dry/clean enough to read at frame 0; dusty and dented by frame 1800; dust-saturated by frame 6600; progressively wet and muddy through frames 7500–9300. No reset at an edit. Blood is optional and restrained: tiny external marks or a translucent lens-corner fleck, never a graphic injury study. Keep eye and contact regions clear.

## 06 — Geography, axes and lens language

Unreal coordinates use centimeters, Z up. The route advances along +X. Cameras generally remain on the negative-Y side, so +X reads screen right. Key zones: ambush (0–700 cm), Josheb (1400 cm), Eleazar (2600 cm), Shammah (3800 cm), chariot (5000 cm, Y −250 cm), grappling lane (5500–5900 cm), ruin (6300 cm), storm approach (6500 cm), champion lane (7000–7600 cm), ridge (8000–8400 cm). These are scalable blocking anchors; environment artists must solve navigable surfaces and sightlines around them.

Full-frame 36 × 20.25 mm sensor is the framing basis. Eye ECU uses 135 mm with manual close focus. Geography and moving combat use 28–45 mm. Tight duel/details use 50–85 mm. Aperture defaults to f/4 and closes to f/5.6 for critical macro contact where two weapons must remain legible. Do not use razor-thin focus as an excuse to hide incomplete animation. Camera focus distance is computed from camera to target and keyed; no hunting autofocus.

The provided camera path is an analytically sampled blocking rig with a critically damped positional response. Explicit per-frame keys are inserted linearly in Sequencer only because the curves have already been evaluated: this is not a recommendation to linearly tween an entire five-second camera move. The last requested key pose is reached exactly. Roll is restrained; shake is a deterministic decaying angular impulse around marked hits, never random handheld drift over the whole film.

Each handoff has an explicit concealment or match-action rationale. Lens/position/target differences at an edit are intentional where foreground dust, shield, shaft or armor supplies an occluder. This is a **single-take illusion with concealed edits**, not a mathematical claim that all 36 cameras form one uninterrupted physical trajectory. Review the rendered ±12-frame window at each cut. Keep outgoing and incoming screen direction consistent; do not mistake a +X camera translation for guaranteed +X image velocity without checking the actual subject projection.

## 07 — Animation, contact and mass

Use separate channels for output time, action-source time, camera time and simulation time. Retiming slows the action clip; it must not globally freeze the independently moving camera. Rain and near-camera particles may retain output-time motion for legibility, while costume and contact debris follow the character cache’s action clock. Record this distinction explicitly in each cache manifest.

Root motion, feet, hands and weapon grips must be solved together. Feet pin to the actual ground during support; pelvis correction follows limb reach, not stretching. Require contact penetration checks at slow playback and at shutter sample times. Weapon lag originates from joints and inertia, not rubber mesh deformation. A hit-stop is a two- or three-frame **localized animation-pose hold**, not duplicate full video frames: breath, environment and camera may continue.

Ballistic motion is solved in a dedicated physical source clock with gravity 981 cm/s². The authored long airtime is a time-expanded view of a much shorter physical flight; no sinusoidal “floating” trajectory. The manifest’s flight clock and root-height lane describe the ramp jump, while local hops and vaults are animation tasks referenced in the shot direction. Preserve momentum through contact and recovery. Never reset a weapon from full-speed extension to opposite-direction acceleration in one frame.

MetaHuman-grade is a production quality reference, not an included asset. Use a licensed facial rig with calibrated eye rotation, eyelid contact, jaw/cheek/tendon detail and facial capture or authored curves. Breath uses rib/abdomen/shoulder deformation at plausible small amplitude, not whole-character scale. Ragdolls are only a starting solve: approved falls and hero contact are baked, cleaned and manually directed.

All capture involving weapons, falls, vaults or contact requires professional stunt supervision, padding, inert props and camera cheats. This document directs animation, not safe-to-attempt real combat training.

## 08 — Lighting and weather keyframes

The frame manifest contains sampled sun illuminance, temperature, manual exposure target, fog density, rainfall, wind, wetness and ground-response values. These are art-directable starting values in the declared units, not measurements of a completed level. Lux assumes a physically lit, correctly scaled project; material albedo and exposure must be calibrated together.

0–110 seconds: warm, harsh desert key around 95,000–100,000 lux; restrained cool sky fill; dust rather than fantasy ambient mist. 110–125 seconds: progressively reduce key toward 4,000 lux, cool the scene and lower manual EV100 target from about 14.5 toward 10.2. Build first drops before heavy rain. 125–155 seconds: dense rain, wet metal, localized splashes, accumulated mud. Wetness lags rainfall, and puddles persist after rainfall decreases. 155–165 seconds: rain thins; maintain cool shadow atmosphere. 165–175 seconds: warm sun opening increases toward 48,000 lux while fog opens enough to reveal geography. 175–180 seconds: retain the plate’s lighting while compositing the final title and controlled fade.

Two discrete distant lightning events are scheduled at 116 and 123 seconds. Their thunder follows at 118.5 and 125.5 seconds. Avoid repeated full-screen flashes, crushed exposure recovery or high-frequency strobing. These notes are not a formal photosensitivity certification.

The import script keys a directional sun as a usable lighting starting point. Fog, cloud maps, exposure, rain emission, Niagara caches, wetness and terrain deformation require the project’s weather/material rig. Their frame lanes are supplied but are not falsely described as automatically created hero-quality simulations.

## 09 — VFX and materials stack

Ground: use a persistent footprint/deformation mask or geometry/cache strategy selected for the target platform; blend displaced mud, albedo darkening, roughness, water displacement and footprint edge breakup. Do not assume every desired landscape displacement method is supported at the target cost. Dirt takes ballistic launch velocities and gravity; larger chunks lead, dust follows. Key the stylized landing ring separately so it cannot falsely become the physical cause of every enemy’s movement.

Weapons: metal-specific roughness, scratched anisotropy where appropriate, sharpened edge wear and a nonemissive trail derived from shutter/motion vectors. Bronze contacts are comparatively subdued. The bright climax accents are authored cinematic effects, not a claim about ordinary bronze spark behavior. A blade stress effect is a tiny normal/displacement-mask event over existing damage; do not shatter both protagonists’ working weapons before the subsequent choreography needs them.

Armor/wood: pre-fractured shield and pauldron Geometry Collections with authored break frames, stable IDs and deterministic seeds. Bake Chaos caches and clean large fragment trajectories. Niagara dust, splinters, droplets and restrained sparks share those events. Avoid hundreds of near-camera translucent sprites covering the contact silhouette. Rain follows gravity plus wind and has depth-dependent shutter behavior. Lens droplets remain in corners and never turn into a full-screen gore overlay.

Cloth/hair: simulate over correctly timed collision capsules and approved motion, then cache per shot with pre-roll. Use groom collision and wind settings that preserve clumps; avoid noodle-like hair. Wetness increases clumping and changes roughness without turning hair into rigid plastic. Cache preroll and shot handles are outside the 10,800-frame delivery window.

## 10 — Motion graphics and title frame plan

No floating text overlays interrupt combat. A brief, subtle air-distortion trace may visualize the sling trajectory, but it is a world-space effect without arcade glow. Character names can exist in the production slate or optional accessibility edition, not as mandatory action-screen labels.

At frame 10500 (175.000 s), the continuing wide landscape becomes the title plate. Use extruded, restrained Roman-inspired capitals with chiseled bevels, worn patinated bronze, dark recesses and a warm grazing reflection. Create clean type in the engine/compositor: do not ask an image/video model to spell the final lockup. Set the large line to **VALOR** and the smaller line to **THE CHRONICLES OF DAVID**; the combined exact title is **VALOR: THE CHRONICLES OF DAVID**.

Main title resolves from frames 10500–10559; subtitle resolves from 10548–10619. Readable hold extends through frame 10715. Fade plate and title together from frame 10716 to 10787. Frames 10788–10799 are full black. Use the provided opacity/reveal lanes. Keep safe margins at least 8% horizontally and 10% vertically. Grain and atmospheric spill are subtle; no embossed letters assembled from random exploding shards.

## 11 — Sound and score direction

Original score only: low frame drums, restrained struck bronze, bowed texture and a sparse human-scale melodic motif. Do not copy music from the named games. A 120 BPM reference grid organizes the broader edit, but contact cues follow choreography’s exact frames rather than forcing every blow onto a quantized beat. All impact cues map to 48 kHz sample positions at frame × 800.

Act I foregrounds breath, dust and one readable metallic line. Josheb adds wood/shaft rhythm; Eleazar reduces orchestration so strain and blade friction dominate; Shammah introduces lower body and timber resonance. The sling ramp removes high-frequency clutter and emphasizes cord/air passage. The storm introduces wider rain ambience and delayed thunder. Before the climax, thin the music for the intentional comma. At the pauldron break, layer brief metal fracture, water and a controlled low-frequency accent. The outro resolves without triumphant crowd chanting.

Record dedicated stems: score, cloth/gear, body/feet, metal/wood impacts, crowd, weather, breath, and optional dialogue (none required in this cut). Dialogue-free is the default. Aim a web stereo master around −16 LUFS integrated with true peak at or below −1 dBTP, checked on the final mix rather than assumed from sample normalization. Include mono compatibility, headphones, small speakers and a quiet listening pass. Spatial cues follow screen position but do not pan every hit to an extreme.

## 12 — AI video generation translation

`generator_prompts.json` supplies 36 independent five-second shot requests with identity locks, action, lens, atmosphere, start/end anchors and avoidance notes. They are provider-neutral briefs suitable for adaptation to the currently available Sora or Runway interface; they are **not invented proprietary API payloads**. Model names, accessible durations, camera controls, input-reference limits, output resolutions and frame rates vary by product/version/account. Validate those settings before submitting jobs. Gen-3 is treated as the user’s named workflow, not an assurance of current product availability.

Create approved front/side/three-quarter character and prop references first. Use a shared visual bible, repeat identity identifiers, supply a first-frame reference where supported, and use end-frame or reference-video controls only when the chosen service exposes them. Generate separate short shots rather than one 180-second prompt. A repeatable seed alone does not guarantee identity continuity. Review both hands, finger counts, weapon ownership, straps, scale, face, background axes and start/end pose at every handoff.

If the service delivers 24/30 fps or lower resolution, conform on an editorial timeline and disclose interpolation/upscaling. Optical flow may fail on crossing blades, rain and sparks; hand-repair or regenerate those moments rather than advertise them as native 60 fps motion capture. Typography, controlled hit-stops, exact contacts, continuity-critical blade paths and the final retiming pass are best completed in a deterministic engine/compositor. No provider was called for this package.

## 13 — Unreal handoff and what the code does

Enable Python Editor Script Plugin and Sequencer Scripting in UE 5.5. Open a disposable or version-controlled working level. The package’s `unreal_import.py` validates the frame table, creates a new uniquely named Level Sequence, adds 36 Cine Camera Actors, writes the per-frame camera transform/lens/aperture/focus channels, creates camera-cut sections with exclusive end frames, and adds a keyed directional sun. It refuses to overwrite an existing target sequence. Generated actors remain in the current level; save the level manually after review.

`unreal_import.py` is syntax-checked and tested against a narrow API-contract mock in this sandbox, **not executed inside Unreal Engine**. UE Python reflection and plugin availability must be verified in the target installation. The script explicitly checks required APIs and fails with a descriptive error rather than claiming success. It does not download MetaHumans, create licensed hero assets, solve mocap, build the battlefield, generate cinematic-quality cloth or automatically wire a custom weather Blueprint.

`rig_contract.json` is the integration checklist for those missing production assets. `frames.csv` is the numeric handoff for a weather/material controller and rig/animation department. Contact and cached VFX events are in `events.json`. Action-time lanes are supplied for retimed animation sampling; global time dilation is not used because it would unintentionally slow the camera and weather. Render plugins, Control Rig assets, Anim Sequences, deformation rigs, Niagara/Chaos caches and level terrain remain project-specific work.

## 14 — Repository integration, without pretending every component belongs

Use `skills/opus-gpt-director` for the staged production gates; `higgsfield-camera-dop` for camera vocabulary; `motion-doctrine` and `seam-craft` for vector/current and opaque-stage rules; `cinematic-3d-vfx-cgi` for deterministic geometry/VFX; `nle-video-editor-pro` for edit/sound/grade handoff. The existing camera, seam, Three-scene and VFX modules are references for deterministic preview/compositing; they do not become Unreal ray-tracing modules merely by being mentioned. The 2D character IK helper is useful for a timing study, not a replacement for a production human rig.

The provided `review.html` uses the repository’s paused GSAP convention and a simple nonphotoreal shot-plan canvas. It visualizes timeline, camera blocking, weather and current directing instruction. It is explicitly an **animatic planning viewer**, not final character animation. It has no external fetches. Remotion can be used downstream to assemble rendered UE/AI plates, title passes and the audio stems; unrelated device mockups, registry UI blocks, captions and decorative stock shapes are deliberately excluded. REA is relevant only if lawful reference footage is later supplied for analysis.

## 15 — Acceptance gates and rendering checklist

Before rendering: approve all identity sheets, costume/weapon inventory, camera axes, shot handles, stage geography and stun/fall safety plan. At the animation gate: inspect support feet and grips frame-by-frame, verify blade clearance at both full speed and slowed playback, and compare first/last poses across edits. At the simulation gate: validate every cache’s seed, source clock and handles; verify cloth/weapon collision during the speed ramps. At the lighting gate: inspect eyes, armor highlights, wetness accumulation, storm exposure and title contrast.

For Movie Render Queue, begin with a 3840 × 2160, 60 fps image-sequence master and separate audio stems; use 16-bit EXR linear where the production color pipeline supports it, otherwise a clearly documented review format. Start with conservative temporal sampling and sufficient warmup, then test motion-vector correctness on fast weapons, rain and retimed characters. Do not blindly increase temporal samples if it creates ghost weapons or cloth discontinuities. Bake deterministic simulations before final temporal sampling. Maintain approved shot handles outside the final edit.

For final editorial export: exactly 10,800 displayed frames, no duplicated black tail beyond frame 10799, 48 kHz audio of 8,640,000 samples before encoder padding, title spelling verified, full decode scan, frame-count probe, loudness/true-peak measurement and human review of all 35 handoffs. Automated planning tests verify timing and finite channels, not photorealism, collision-free bodies, native PS5 performance or the quality of footage that does not yet exist.
