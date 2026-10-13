---
name: cinematic-3d-vfx-cgi
description: "3D Motion Graphics, WebGL/GLSL Shaders, PBR Materials, Volumetric Lighting, Particle Physics, and CGI Compositing for HyperFrames and Remotion. Load whenever building 3D scenes, device showcases (MacBook/iPhone GLB), shader backgrounds, glassmorphism, particle bursts, shatter effects, or sci-fi/cyberpunk HUD VFX."
---

# Cinematic 3D Motion Graphics, VFX & CGI Engineering

## 1. Deterministic 3D & Shader Rules

Whether rendering in **HyperFrames** or **Remotion**, headless Chromium captures frames out of real-time order.
1. **Never use `clock.getDelta()` or `performance.now()`** to advance 3D animations or shaders.
2. **Always compute scene state as a pure function of `t` (seconds) or `frame`**.
3. **Seed all randomness**: Particle positions, debris velocities, starfields, and noise turbulence MUST use a deterministic seeded generator (`mulberry32(seed)`).

## 2. HyperFrames Three.js + GSAP Deterministic Adapter

When using Three.js inside a HyperFrames HTML composition:
- Vendor Three.js locally from `/home/user/AI-VIDEO-EDITOR/toolkit/vendor/three.core.min.js` (or `registry/blocks/cuboid-carousel/assets/three.module.min.js`).
- Drive a `state = { progress: 0, camAngle: 0, explode: 0 }` object via the paused master GSAP timeline `window.__timelines["main"]`, and render the Three.js scene inside a GSAP `onUpdate` callback or deterministic `renderAtTime(t)` hook so seeking to any timestamp `t` immediately updates camera matrices, meshes, shader `uTime` uniforms, and calls `renderer.render(scene, camera)`.

```js
const state = { t: 0, orbit: 0, elevation: 0.4, explode: 0 };
const tl = gsap.timeline({
  paused: true,
  onUpdate: () => renderScene(state)
});
tl.to(state, { t: DURATION, orbit: Math.PI * 1.5, duration: DURATION, ease: "none" }, 0);
tl.to(state, { explode: 1, duration: 1.8, ease: "expo.out" }, 3.2);
window.__timelines["main"] = tl;
renderScene(state);
```

## 3. Remotion 3D & VFX Engine (`remotion/src/engine/`)

In Remotion, import directly from `remotion/src/engine/`:
- `remotion/src/engine/cameraRig.ts`: 3D perspective & Higgsfield DoP camera transforms (`useCameraRig`, `applyCameraPreset`, `project3DPoint`).
- `remotion/src/engine/vfxShaders.tsx`:
  - `<AnamorphicFlare />`: Cinematic horizontal streak lens flare with core bloom and chromatic halo.
  - `<VolumetricGodrays />`: Procedural radial light shafts keyed to frame.
  - `<ParticleField3D />`: True 3D perspective-projected particle & starfield system with depth-of-field bokeh and velocity streaks.
  - `<ShatterDebris3D />`: Deterministic 3D polygon shard explosion with gravity, angular momentum, and specular lighting.
  - `<CyberHUDTracker />`: Sci-fi CGI tracking brackets, telemetry callouts, reticle lock-on, and corner scopes.
  - `<ChromaticAberrationLayer />`: RGB channel split scaled dynamically by camera velocity or impact beats.
  - `<FilmGrainOverlay />`: Frame-seeded organic 35mm cinema grain + vignette.

## 4. Curated 3D & VFX Registry Blocks (`registry/blocks/`)

Before building from scratch in HyperFrames, inspect and adapt these local blocks in `registry/blocks/`:
- **3D & Device Showcases**: `macos-tahoe-liquid-glass`, `ios26-liquid-glass`, `vfx-iphone-device`, `cuboid-carousel`, `frost-sequence-camera-orbit`, `glass-shard-title`, `ui-3d-reveal`, `transitions-3d`, `code-3d-extrude`, `wireframe-portal-title`, `gallery-tunnel`, `orbit-card`, `carousel-orbit-1..5`.
- **GLSL Shaders & Atmospheric VFX**: `aurora`, `cosmic-orb`, `domain-warp-dissolve`, `godrays`, `gravitational-lens`, `liquid-metal`, `obsidian`, `plasma`, `prism`, `ripples`, `swirl-vortex`, `thin-film`, `voronoi`, `water`, `worley-noise`, `vfx-magnetic`.
