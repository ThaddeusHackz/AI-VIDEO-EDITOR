---
name: higgsfield-camera-dop
description: "Higgsfield DoP (Director of Photography) Cinema Studio Camera Presets & Hybrid AI-Video VFX Compositing. Provides mathematical camera rigs (Dolly Zoom, Crash Zoom, 360 Orbit, Bullet Time, Whip Pan, Push to Glass, Crane Up, Handheld Cinema, Rack Focus, FPV Roll) for Remotion and HyperFrames."
---

# Higgsfield DoP Camera Engine & Cinema Studio Presets

Inspired by Higgsfield Cinema Studio & DoP (Director of Photography), this skill translates cinematic camera choreography into **deterministic, frame-accurate camera matrices** for both Remotion (`remotion/src/engine/cameraRig.ts`) and HyperFrames (`toolkit/vendor/camera-dop.js`).

## 1. The 10 Signature DoP Camera Presets

| Preset ID | Cinematic Effect | Mechanics (Scale / Perspective / Blur / Rotation) | Best Used For |
| --- | --- | --- | --- |
| `dolly-zoom` | Vertigo / Hitchcock counter-zoom | Foreground stays locked while background perspective compresses (`scale: 1.0 -> 1.45`, counter-scaling subject `1.0 -> 0.78`) | Dramatic realization, hero isolation, tense hooks |
| `crash-zoom` | High-velocity snap zoom into subject | Exponential `expo.inOut` scale `1.0 -> 2.35` in `0.35s` with radial blur peak `14px` and subtle impact shake | Punchline metrics, product feature callouts, beat drops |
| `orbit-360` | 360° low-angle hero orbit | Continuous azimuth rotation `0 -> 2π` with 3-plane parallax offset and dynamic rim-light angle shift | 3D product reveals, character/device hero shots |
| `bullet-time` | Matrix time-freeze + camera arc | Action time-remaps to `0.05x` speed while camera arcs `180°` across suspended depth particles & shards | Climax spectacle beat (use once per film!) |
| `whip-pan` | Peak-velocity directional snap cut | Accelerates `power4.in` to `-22%` X with `blur(18px)` at cut frame, incoming decelerates `power4.out` from `+22%` X | High-energy scene transitions |
| `push-to-glass` | Macro Z-push through screen glass | Scales portal/window `1.0 -> 3.8` with specular glass reflection sweep, emerging inside the next scene | Entering a UI dashboard or 3D world from a device mock |
| `crane-up` | Vertical jib sweep with counter-tilt | Translates Y `+140px -> 0` while tilting `rotateX(14deg -> 0deg)` with foreground occlusion | Grand establishing shots or rising conclusion card |
| `handheld-cinema` | Organic 35mm cinema operator drift | Multi-frequency deterministic sine/simplex micro-sway (`±6px` X/Y, `±0.35deg` roll) | Documentary realism, UGC recuts, editorial overlays |
| `rack-focus` | DSLR depth-of-field focus transfer | Transfers `blur(16px) -> blur(0px)` from foreground plane to background plane (or vice versa) with bokeh bloom | Shifting viewer attention between two layered subjects |
| `fpv-drone` | Banked aerodynamic roll + Z-surge | Forward Z-tunnel travel coupled with banked `rotateZ(-12deg -> +8deg)` S-curve | Fast-paced spatial flythroughs (`gallery-tunnel`) |

## 2. Using DoP Presets in Remotion

```tsx
import { useCameraRig, CameraRigContainer } from "./engine/cameraRig";

// Inside your Remotion component:
const rig = useCameraRig({
  preset: "crash-zoom",
  startFrame: 30,
  durationInFrames: 24,
  intensity: 1.0,
});

return (
  <CameraRigContainer rig={rig}>
    {/* Your scene layers */}
  </CameraRigContainer>
);
```

## 3. Using DoP Presets in HyperFrames (GSAP)

Include `/home/user/AI-VIDEO-EDITOR/toolkit/vendor/camera-dop.js` and invoke:
```js
// Adds a deterministic DoP camera move onto a GSAP timeline
HFCameraDoP.apply(tl, "#scene-camera", {
  preset: "dolly-zoom",
  start: 1.5,
  duration: 2.4,
  intensity: 1.0
});
```
