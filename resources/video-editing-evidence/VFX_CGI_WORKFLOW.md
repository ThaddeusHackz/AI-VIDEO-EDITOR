# VFX, motion graphics and CGI: a shot-based production procedure

**Recommended engineering guidance, not verified techniques from the supplied videos.** This expands the existing [3D/VFX skill](../../skills/cinematic-3d-vfx-cgi/SKILL.md) with the distinction between a procedural visual demo and integration into a photographed plate.

## Choose the smallest technique that meets the shot

| Requested result | Suitable approach | Required inputs / common failure |
|---|---|---|
| Titles, charts, UI callouts | Remotion or HyperFrames 2D layers | Correct text/timing; otherwise decorative but inaccurate |
| Layered photo depth / card orbit | 2.5D planes or Three.js geometry | Masks/depth ordering; newly exposed background is missing in a single photo |
| Text behind a speaker | Segmentation or rotoscoped matte + compositor | Per-frame alpha; hair/hand edges and temporal chatter |
| Screen replacement | Planar/corner track, surface composite | Lens distortion, perspective, reflections and foreground occlusion |
| CGI prop in a moving shot | Solved camera + model + lighting + render passes | Tracking footage, scale reference, contact shadows and matching motion blur |
| Smoke/fire/fluid/cloth | Dedicated DCC/simulation tool and cached simulation | Compute, scene scale, collision geometry; not a CSS shader substitute |
| Stylized sci-fi HUD | Authored overlay, optionally anchored to a track | A keyframed crosshair is not an automatically measured track |
| Generative replacement/extension | An explicitly available generation model + compositing | Continuity, rights, changing faces/text, temporal consistency; tool not supplied here |

Blender is an example of an external DCC for modelling, camera solving and rendering; it is **not installed or integrated by this addition**. Existing Three.js/Remotion code can be useful for real-time-style graphics, but do not claim path-traced realism, physically solved dynamics or measured camera calibration from a preset name alone.

## 1. Lock the shot brief

Copy [templates/cgi-shot.json](templates/cgi-shot.json) into a new job. Fill in:

- Shot ID, source hash, project/plate FPS, source range, output range and editorial handles.
- Intended illusion and what remains unchanged in the original performance.
- Dimensions, working/output color spaces, alpha convention, delivery codec.
- Lens and camera data if known; otherwise record uncertainty, not guessed metadata.
- Foreground/background occlusions, interaction/contact points, required tracking and matte work.
- Asset licenses, renderer/version, seed, cache ownership and a proof-render budget.

Do not render the final sequence before proving the difficult frame or movement.

## 2. Plate preparation and tracking

1. Preserve an untouched original and create a working plate. Record any stabilization, reframing, deinterlacing, retiming or lens correction.
2. Choose a **2D point track**, **planar track**, **object track** or **3D camera solve** based on the geometry. A flat screen replacement does not necessarily need a 3D solve.
3. Select stable features distributed through the image; exclude moving people/reflections for camera solves unless treated independently. Low texture, rolling shutter and motion blur can defeat automatic tracking.
4. For camera solving, estimate lens distortion, use real scale/contact constraints where available, inspect residuals and test a proxy cube/grid against the plate. A low average error alone is insufficient; check visible sliding near the contact point.
5. Keep lens-space operations explicit: undistort → render/composite → redistort when appropriate. Match camera, crop and pixel aspect to the plate.
6. If the solve fails, report failure and simplify to a designed overlay, stable planar insert or different shot. Never relabel a hand-animated orbit as a recovered camera.

## 3. Geometry, light and motion

- Establish units/scale. Match ground plane, horizon, perspective and lens before detailed materials.
- Use reference lighting or an authorized HDRI plus measured/estimated key/fill directions. Match shadow softness, exposure, roughness and reflections. Do not invent a captured HDRI.
- Contact shadows, ambient occlusion and interactive light should be motivated and restrained; unsupported floating objects expose the illusion.
- Align virtual shutter/motion blur and depth of field with the plate. Excessive bloom/glow does not conceal tracking errors.
- Choose deterministic trajectories for graphic effects; bake simulations for cloth, particles and destruction. Fixed seed alone does not make an order-dependent physics simulation seek-safe.
- Version simulation caches with scene hash, solver settings and timebase. Sample/bake before out-of-order frame rendering.

## 4. Render passes and color management

A useful job may produce beauty RGBA, shadow/catcher, emission, depth, motion vectors and object/cryptomatte IDs, depending on renderer support. Do not promise a pass the renderer cannot export.

- Render scene-linear intermediates (often EXR) where the workflow requires them. Choose and document the working space; “EXR” alone does not define a color space.
- Keep straight vs premultiplied alpha explicit. Correctly unpremultiply/premultiply around operations to avoid dark/bright fringes.
- Depth is data, not display color. Record units, clipping and convention; do not apply a display transform to it.
- Apply appropriate color-space transforms at ingest/output and a single intended display transform. Avoid double tone mapping. Browser CSS filtering is not a replacement for a managed linear-light pipeline.
- Keep handles and frame numbering consistent across plate, CG, masks and captions. Missing frames must fail a delivery gate, not silently repeat adjacent imagery.

Use a modest proof sequence before final sampling. Higher resolution/samples do not fix wrong camera geometry.

## 5. Composite in motivated order

A typical integration order (adapt to the shot):

```text
plate ingest / lens preparation
  → cleanup or background repair
  → shadow/contact integration
  → CG beauty and interaction light
  → foreground holdouts / subject matte
  → optical matching (defocus, blur, light wrap as justified)
  → grain / plate texture matching
  → lens redistortion and output color transform
  → editorial graphics and accessibility captions as appropriate
```

There is no single universal layer order. Some plate/CG effects must occur in scene-linear space before the display transform; final typography usually should not receive film-grain and lens-distortion treatments unless deliberately designed.

Text-behind-speaker example: untouched background/plate → kinetic word → extracted foreground subject. A separate clean background may be necessary where subject extraction and compositing expose holes. Inspect ears, hair, glasses, fingers, translucent objects and fast motion frame by frame.

## 6. Shot acceptance gates

| Gate | Evidence to retain | Fail condition |
|---|---|---|
| Alignment | Proxy render over plate at beginning/middle/end and motion extremes | Visible contact sliding or perspective mismatch |
| Matte | Alpha and final over light/dark backgrounds | Chatter, cut-off fingers, fringes or background leaks |
| Lighting | Representative final composite and neutral proxy | Detached shadows/reflections or unexplained illumination |
| Temporal | Full-speed and slowed preview | Popping textures, unstable simulation, exposure pumping |
| Seek determinism | Same frames rendered sequentially and in shuffled order | State differs under same pinned environment |
| Color/alpha | Pass metadata and edge checks | Double transform, clipped channels, wrong premultiplication |
| Editorial | Full shot in surrounding cut with audio | Spectacle obscures face, words or intended meaning |
| Delivery | Complete frame inventory and decoded final export | Missing frames, wrong duration/FPS/aspect or invalid codec |

Save before/after and a pass breakdown only when you have actually produced them. Never present planned CGI or synthetic procedural demos as finished real-plate integration.

## Resource and dependency policy

Reuse the local toolkit only after checking asset type, license and availability. Do not blanket-install every REA provider: disassemblers do not perform camera tracking or compositing. External options such as Blender, FFmpeg, ASR, segmentation and generative services need separate version/licensing/compute review. Record those as required or unavailable until verified; do not add large model weights or media caches to this repository.
