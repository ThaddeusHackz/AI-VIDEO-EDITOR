---
name: cinema-studio-4-presets
description: "Higgsfield Cinema Studio 4.0 parameter matrix and Viral Presets (Agamemnon, Fallen Angel, Bullet Time, Cyclope, Portal Vortex, Plasma Lightning, Robot Arm, Through Object In/Out, Contre-jour lighting, Anamorphic 2.39:1 lens, Halation Vintage, 35mm/8mm/DV camera bodies)."
---

# Higgsfield Cinema Studio 4.0 & Viral Presets (`cinema-studio-4-presets`)

Separates **subject action**, **camera movement register**, and **optical/lighting treatment** into deterministic, composable parameters in both **Remotion** (`remotion/src/engine/cinemaStudio4.tsx`) and **HyperFrames** (`toolkit/vendor/camera-dop.js` + `toolkit/vendor/vfx-cgi-suite.js`).

---

## 1. Cinema Studio 4.0 Settings Matrix

| Setting | Supported Deterministic Options |
|---|---|
| **Genre** | `General`, `Action`, `Epic`, `Drama`, `Comedy`, `Horror`, `Noir` |
| **Era** | `Auto`, `60s`, `80s`, `90s`, `2000s`, `2020s` |
| **Tempo** | `Auto`, `Chaotic`, `Dynamic`, `Calm`, `Single Shot` |
| **Colour Palette** | `Film Colors`, `Black Gloss`, `Candy Pink`, `Lime Jam`, `Nostalgic Blue`, `Teal & Orange`, `Cyberpunk Neon` |
| **Camera Movement** | `dolly-zoom`, `orbit-360`, `bullet-time`, `robot-arm`, `helicopter-shot`, `through-object-in`, `lazy-susan`, `whip-pan`, `crane-up`, `crane-down`, `push-to-glass`, `fpv-drone`, `rack-focus`, `agamemnon-breakthrough` |
| **Lighting Rig** | `Contre-jour` (Rim Backlight), `Soft Cross`, `Overhead Fall`, `Window`, `Practicals`, `Silhouette` |
| **Camera Body** | `Modern`, `35mm Film` (subtle gate weave + organic grain), `8mm Film` (vintage weave + warm vignette), `DV Camcorder` (interlaced scanlines) |
| **Lens & Aperture** | `Clean Sharp`, `Anamorphic` (2.39:1 letterbox + horizontal cyan flare), `Vintage Anamorphic`, `Warm Vintage`, `Halation Vintage` (`f/1.4`, `f/4`, `f/11`) |

---

## 2. Remotion Usage (`remotion/src/engine/cinemaStudio4.tsx`)

```tsx
import {
  CinemaStudio4Stage,
  PortalVortexCGI,
  PlasmaLightningCGI,
  AgamemnonBreakthrough,
} from "./engine";

export const MyCinemaShot: React.FC = () => (
  <CinemaStudio4Stage
    genre="Epic"
    era="2020s"
    tempo="Dynamic"
    palette="Teal & Orange"
    lighting="Contre-jour"
    cameraBody="35mm Film"
    lens="Anamorphic"
    aperture="f/1.4"
  >
    <PortalVortexCGI xPercent={50} yPercent={50} radius={250} openFrame={6} />
    <PlasmaLightningCGI x1={200} y1={300} x2={1720} y2={780} branches={3} />
    <AgamemnonBreakthrough triggerFrame={45}>
      <HeroCard />
    </AgamemnonBreakthrough>
  </CinemaStudio4Stage>
);
```

---

## 3. HyperFrames Usage (`toolkit/vendor/vfx-cgi-suite.js`)

```html
<script src="vendor/gsap.min.js"></script>
<script src="vendor/camera-dop.js"></script>
<script src="vendor/vfx-cgi-suite.js"></script>
<script>
  const state = { t: 0, portalOpen: 0 };
  const tl = gsap.timeline({
    paused: true,
    onUpdate: () => {
      ctx.clearRect(0, 0, 1920, 1080);
      HFVfxSuite.drawPortalVortex(ctx, { x: 960, y: 540, radius: 240, openProgress: state.portalOpen, time: state.t });
      HFVfxSuite.drawPlasmaLightning(ctx, { x1: 240, y1: 540, x2: 1680, y2: 540, time: state.t });
    }
  });
  tl.to(state, { t: 6, duration: 6, ease: "none" }, 0);
  tl.to(state, { portalOpen: 1, duration: 0.8, ease: "back.out(1.4)" }, 0.2);
  HFCameraDoP.apply(tl, "#stage", { preset: "robot-arm", start: 1.0, duration: 2.5, intensity: 0.9 });
</script>
```
