---
name: character-ik-lip-sync
description: "Deterministic 2D/2.5D character animation, analytic 2-bone Inverse Kinematics (solveTwoBoneIK), walk/wave/point/present gesture cycles, squash-and-stretch secondary physics, and phoneme/viseme lip-sync mouth morphing."
---

# 2D/2.5D Character IK & Viseme Lip-Sync (`character-ik-lip-sync`)

Use this skill whenever a prompt calls for animated characters, mascots, explainers with a speaking presenter, limb/joint kinematics, or lip-synced dialogue.

---

## 1. Analytic 2-Bone Inverse Kinematics (`solveTwoBoneIK`)

Never animate multi-segment limbs with disconnected rotations that drift at the elbow or knee. Compute the exact joint position `(jx, jy)` from shoulder/hip `(x0, y0)`, target hand/foot `(tx, ty)`, and bone lengths `(L1, L2)` using the Law of Cosines:

```tsx
import { solveTwoBoneIK, AnimatedCharacterRig } from "./engine";

// Full rigged presenter with IK gestures + viseme lip-sync + blink cadence:
<AnimatedCharacterRig
  x={960}
  y={560}
  scale={1.0}
  gesture="wave" // "wave" | "point" | "present" | "idle"
  speechText="Every frame is deterministically lip-synced."
  speechStartFrame={12}
  accentColor="#35D9F2"
/>
```

---

## 2. Deterministic Viseme Mouth Morphing (`textToVisemeAtFrame`)

Map transcript characters or Parakeet word timestamps to 8 core mouth shapes (`REST`, `A`, `E`, `I`, `O`, `U`, `M`, `F`):
- `M` (`B`, `M`, `P`): Closed wide labial compression (`w: 26, h: 3`)
- `A` (`A`, `E`): Wide open vowel (`w: 28, h: 18`)
- `O` (`O`): Rounded open vowel (`w: 18, h: 20`)
- `U` (`U`, `W`): Tight rounded vowel (`w: 14, h: 14`)
- `F` (`F`, `V`): Dental-labial tuck (`w: 24, h: 6`)

---

## 3. Secondary Motion & Squash-and-Stretch Rules

- **Volume Conservation**: When a character or physics object compresses vertically by `1 - s` (`scaleY = 1 - s`), expand horizontally by `1 + s * 1.15` (`scaleX = 1 + s * 1.15`) so perceived mass stays constant.
- **Blink Cadence**: Blink deterministically every `70–85` frames for `3–4` frames using `frame % 75 >= 71`.
