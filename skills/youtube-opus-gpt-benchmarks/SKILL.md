---
name: youtube-opus-gpt-benchmarks
description: "Canonical motion graphics benchmarks from Claude Opus 5.5, GPT-6.1 Sol, and Claude Code + Remotion/HyperFrames showcases: 3D Cylindrical Rotating Icon Carousel, 3D Sliding Photo/Card Stack, 3D Physics Bouncing Sphere with Floor Shockwave, UI Highlighter Zoom, and 9:16 Vertical Kinetic Reels."
---

# YouTube Claude Opus 5.5 & GPT-6.1 Sol Motion Graphics Benchmarks (`youtube-opus-gpt-benchmarks`)

Codifies the highest-performing programmatic motion graphics patterns demonstrated in Claude Opus 5.5, GPT-6.1 Sol, and Claude Code + Remotion/HyperFrames showcases.

---

## 1. The 5 Benchmark Archetypes (Pre-Built in `remotion/src/engine/threeSceneStudio.tsx`)

### Archetype 1 — 3D Cylindrical Rotating Icon / Card Carousel (`<CylindricalIconCarousel3D />`)
- Distributes $N$ cards around a 3D cylinder of radius $R$:
  $$x_i = R \sin(\theta_i + \omega f), \quad z_i = R \cos(\theta_i + \omega f)$$
- Sorts cards back-to-front by $z_i$ (Painter's Algorithm) on every frame.
- Modulates depth-of-field blur (`blurPx`) and specular border glow by the facing normal $\frac{\cos(\theta_i + \omega f) + 1}{2}$.

### Archetype 2 — 3D Sliding Photo / Metric Stack (`<SlidingPhotoStack3D />`)
- Stacks cards in 3D depth (`translateY(-depth * 22px) translateZ(-depth * 45px) scale(1 - depth * 0.055)`).
- Every `cycleIntervalFrames`, the front card peels off on a spring arc (`Math.sin(p * Math.PI) * 280px`) and settles at the back of the stack while all remaining cards advance one slot forward.

### Archetype 3 — 3D Physics Bouncing Sphere with Floor Shockwave (`<PhysicsBouncingSphere3D />`)
- Uses exact parabolic gravity arcs (`4 * phase * (1 - phase)`).
- Applies volume-preserving squash-and-stretch (`scaleX = 1 + 0.34 * impact`, `scaleY = 1 - 0.28 * impact`) at the contact frame.
- Emits a perspective-foreshortened floor shockwave ring (`opacity: 1 - rippleP`) synchronized with each bounce impact.

### Archetype 4 — UI / Screenshot Presentation with Dynamic Highlighter & Macro Camera Zoom
- Combines `<CameraRigContainer>` (`crash-zoom` or `push-to-glass` into target UI coordinates) with an animated SVG stroke-dashoffset highlight box and `<CyberHUDTracker />`.

### Archetype 5 — Dual-Aspect Safe-Area Adaptive Layout (16:9 Landscape + 9:16 Vertical Shorts)
- Computes `const isShorts = height > width;` from `useVideoConfig()` and adapts grid columns, typography scale, and safe-area margins so a single component renders both YouTube 16:9 and TikTok/Reels/Shorts 9:16 natively (see `remotion/src/ThaddeusTechzPromo.tsx`).
