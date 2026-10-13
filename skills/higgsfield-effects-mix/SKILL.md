---
name: higgsfield-effects-mix
description: "Higgsfield Effects & Effects Mix stacker (Thunder God, Set On Fire / Flame On, Turning Metal, Melting, Disintegration, Levitation, Earth Zoom Out, Clone Explosion, Powder Explosion, Northern Lights, X-Ray Wireframe) combined with DoP camera movements."
---

# Higgsfield Effects & Effects Mix Stacker (`higgsfield-effects-mix`)

Implements the **Higgsfield Effects** & **Higgsfield Effects Mix** system (`remotion/src/engine/higgsfieldEffectsMix.tsx`), allowing AI agents to stack 2–4 cinematic VFX presets simultaneously on top of any subject and pair them with Higgsfield DoP camera movements.

---

## 1. Official Higgsfield 2-Effect Mixes (`resolveHiggsfieldMix`)

| Official Mix | Stacked Layers | Best For |
|---|---|---|
| `Thunder God + Levitation` | Dual branching plasma arcs + anti-gravity vertical float | Epic hero reveals, product launches, music drops |
| `Turning Metal + Thunder God` | High-contrast metallic specular grade + electrical arcs | Sci-fi hardware, AI model reveals |
| `Building Explosion + Disintegration` | Stadium color burst + wind-swept ash disintegration | High-impact transitions, dramatic exits |
| `Flying + Set On Fire` | Anti-gravity float + rising ember/flame plume | Action intros, high-energy reels |
| `Melting + Turning Metal` | Liquid skew warp + chrome specular grade | Surreal art transitions |

---

## 2. Single-Effect Catalog (`HiggsfieldEffectName`)

- `Set On Fire` (`Flame On`) — Seeded rising ember/flame particle plume (`mixBlendMode: screen`)
- `Thunder God` — Dual branching midpoint-displacement lightning bolts
- `Turning Metal` — Metallic contrast/desaturation/specular grade
- `Melting` — Liquid phase-skew distortion wave
- `Disintegration` — 64-shard wind-drifting ash particle dissolve
- `Levitation` — Spring elevation + zero-G harmonic suspension
- `Earth Zoom Out` — Macro-to-orbital scale pullback (`1.65 -> 0.48`)
- `Clone Explosion` — 4 chromatic-shifted lateral subject echoes bursting outward
- `Powder Explosion` — 52-particle stadium color burst
- `Northern Lights` — Sweeping cyan/lime aurora borealis sky band
- `X-Ray Wireframe` — Inverted spectral skeletal pass

---

## 3. Remotion Usage (`remotion/src/engine/higgsfieldEffectsMix.tsx`)

```tsx
import { HiggsfieldEffectsMix, resolveHiggsfieldMix } from "./engine";

<HiggsfieldEffectsMix
  effects={[...resolveHiggsfieldMix("Thunder God + Levitation"), "Clone Explosion", "Northern Lights"]}
  triggerFrame={0}
  intensity={1.0}
>
  <HeroSubjectCard />
</HiggsfieldEffectsMix>
```
