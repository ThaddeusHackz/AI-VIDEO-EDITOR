import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraRigContainer, mulberry32, project3DPoint, useCameraRig } from "../../engine/cameraRig";
import { AnamorphicFlare, ParticleField3D } from "../../engine/vfxShaders";
import { Canvas2D } from "../components/Canvas2D";
import { FONT } from "../components/Words";
import { EV, FPS, P, rgba } from "../data";
import { useLayout } from "../layout";
import { clamp01, ease } from "../physics/springs";

/**
 * S1 · void-slice (f0–107). Extreme macro on a microscopic glass pane in the dark; Opus's amber razor line slices
 * left→right (f18→f36) and SNAPS taut: a plucked string evaluated in closed form (damped standing-wave modes
 * launched by a velocity impulse, so it starts straight and bulges — no discontinuity at the snap).
 */
const STRING_HZ = 5.2;
const STRING_ZETA = 0.075;

export function stringY(xn: number, t: number, amp: number): number {
  if (t <= 0) return 0;
  let y = 0;
  for (let n = 1; n <= 3; n++) {
    const w = 2 * Math.PI * STRING_HZ * n;
    const z = STRING_ZETA * (1 + 0.45 * (n - 1));
    const wd = w * Math.sqrt(1 - z * z);
    y += (amp / (n * n)) * Math.exp(-z * w * t) * Math.sin(wd * t) * Math.sin(n * Math.PI * xn) * (n === 2 ? -0.6 : 1);
  }
  return y;
}

export const S1VoidSlice: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const { W, H, u } = L;
  const rig = useCameraRig({ preset: "push-to-glass", startFrame: 0, durationInFrames: 108, intensity: 0.16 });
  // micro-debris of the glass pane, in true 3D: we are pushing THROUGH it (Brief B's extreme macro push-in).
  // 9:16: the volume is oriented to the frame (1500 x 2600 world units) and denser, and the dive decelerates less
  // after the snap, because the plucked string spans 1080 px instead of 1920 and carries ~45 % less of the motion.
  const [debrisW, debrisH, debrisN, diveBrake] = L.pick([2600, 1500, 1150, 0.65], [1500, 2600, 1600, 0.4]);
  const debris = useMemo(() => {
    const r = mulberry32(1104);
    return Array.from({ length: debrisN }, (_, i) => ({ x: (r() - 0.5) * debrisW, y: (r() - 0.5) * debrisH, z0: r() * 1400, a: r() * Math.PI, len: 6 + r() * 34, warm: r() < 0.35, glyph: i % 3 === 0 ? "01{}<>/=;#*"[i % 11] : "" }));
  }, [debrisW, debrisH, debrisN]);

  const scratches = useMemo(() => {
    const r = mulberry32(1101);
    return Array.from({ length: 170 }, () => ({
      x: r() * W,
      y: r() * H,
      a: r() * Math.PI,
      len: (18 + r() ** 2 * 300) * u,
      bend: (r() - 0.5) * 0.5,
      w: 0.5 + r() * 1.3,
    }));
  }, [W, H, u]);
  const specks = useMemo(() => {
    const r = mulberry32(1102);
    return Array.from({ length: 260 }, () => ({ x: r() * W, y: r() * H, s: (0.6 + r() * 2.2) * u, a: 0.15 + r() * 0.5 }));
  }, [W, H, u]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const t = f / FPS;
      const cy = H / 2;
      const s0 = EV.lineSlice;
      const s1 = EV.lineSnap;
      // tip position during the slice (accelerating: the line is fired across the void)
      const sliceP = clamp01((f - s0) / (s1 - s0));
      const tipX = f < s0 ? -1 : -30 * u + (W + 60 * u) * Math.pow(sliceP, 1.55);
      const lit = f >= s0 ? clamp01((f - s0) / 10) : 0;
      // specular glint band sweeping the glass (light from nowhere — the void is not empty)
      const band = (-0.6 + ((t * 1.25) % 1.6)) * (W + H);
      ctx.globalCompositeOperation = "lighter";
      for (const s of scratches) {
        const d = Math.abs((s.x + s.y) - band) / (W * 0.18);
        const glint = Math.exp(-d * d) * 0.55;
        const lineGlow = lit * Math.exp(-Math.abs(s.y - cy) / (160 * u)) * (s.x < tipX ? 1 : 0.15) * 0.8;
        const a = 0.075 + glint * 1.3 + lineGlow;
        if (a < 0.02) continue;
        ctx.strokeStyle = lineGlow > glint ? rgba(P.opusEmber, a) : rgba(P.astraIce, a * 0.7);
        ctx.lineWidth = s.w;
        ctx.beginPath();
        const dx = Math.cos(s.a) * s.len;
        const dy = Math.sin(s.a) * s.len;
        ctx.moveTo(s.x - dx / 2, s.y - dy / 2);
        ctx.quadraticCurveTo(s.x + dy * s.bend, s.y - dx * s.bend, s.x + dx / 2, s.y + dy / 2);
        ctx.stroke();
      }
      // opening glint: a specular streak sweeps down the pane in the first 16 frames
      if (f < 16) {
        const gy = H * (0.3 + 0.6 * (f / 16));
        const ga = Math.cos((f / 16) * (Math.PI / 2));
        const gg = ctx.createLinearGradient(0, gy - 60 * u, 0, gy + 60 * u);
        gg.addColorStop(0, rgba(P.astraIce, 0));
        gg.addColorStop(0.5, rgba(P.astraIce, 0.22 * ga));
        gg.addColorStop(1, rgba(P.astraIce, 0));
        ctx.fillStyle = gg;
        ctx.fillRect(0, gy - 60 * u, W, 120 * u);
        ctx.strokeStyle = rgba(P.opusCream, 0.75 * ga);
        ctx.lineWidth = 1.4 * u;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy - 40 * u);
        ctx.stroke();
      }
      // debris streaks rushing past camera (z wraps deterministically). The dive brakes over the second after the
      // slice: v(t) = 900·(1 − brake·ramp), and the distance flown is its closed-form integral. (Writing t·v(t) made
      // the debris stall and drift BACKWARDS mid-brake, then snap forward when the ramp ended at f78.)
      const tr = clamp01(t - s0 / FPS);
      const flown = 900 * (t - diveBrake * (tr * tr * 0.5 + Math.max(0, t - s0 / FPS - 1)));
      for (const d of debris) {
        const z = ((((d.z0 - flown) % 1400) + 1400) % 1400) + 60;
        const a0 = project3DPoint({ x: d.x, y: d.y, z: -z }, 0, 0, 0, 900, 0, W / 2, H / 2);
        const a1 = project3DPoint({ x: d.x, y: d.y, z: -(z + 70) }, 0, 0, 0, 900, 0, W / 2, H / 2);
        if (!a0.visible || !a1.visible) continue;
        const near = clamp01(1 - z / 1400);
        if (d.glyph) {
          ctx.font = `700 ${Math.round((8 + 46 * near * near) * u)}px "JetBrains Mono"`;
          ctx.fillStyle = d.warm ? rgba(P.opusEmber, 0.15 + 0.75 * near) : rgba(P.astraIce, 0.12 + 0.6 * near);
          ctx.fillText(d.glyph, a0.x, a0.y);
          continue;
        }
        ctx.strokeStyle = d.warm ? rgba(P.opusEmber, 0.16 + 0.75 * near * near) : rgba(P.astraIce, 0.12 + 0.6 * near * near);
        ctx.lineWidth = (1 + 3.4 * near) * u;
        ctx.beginPath();
        ctx.moveTo(a0.x, a0.y);
        ctx.lineTo(a1.x + Math.cos(d.a) * d.len * near * u, a1.y + Math.sin(d.a) * d.len * near * u);
        ctx.stroke();
      }
      for (const p of specks) {
        const near = lit * Math.exp(-Math.abs(p.y - cy) / (220 * u));
        ctx.fillStyle = rgba(near > 0.2 ? P.opusCream : P.astraIce, p.a * (0.4 + near));
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      // anticipation: an ember breathes at the left edge where the line will be fired from
      if (f < s0 + 14) {
        const pulse = (0.35 + 0.65 * Math.sin(Math.min(1, f / s0) * Math.PI * 0.5)) * (1 - clamp01((f - s0) / 14));
        const eg = ctx.createRadialGradient(0, cy, 0, 0, cy, 420 * u);
        eg.addColorStop(0, rgba(P.opusEmber, 0.55 * pulse));
        eg.addColorStop(1, rgba(P.opusAmber, 0));
        ctx.fillStyle = eg;
        ctx.fillRect(0, cy - 420 * u, 420 * u, 840 * u);
      }
      if (f < s0) return;
      // amber haze the line throws onto the glass
      const hz = ctx.createLinearGradient(0, cy - 180 * u, 0, cy + 180 * u);
      hz.addColorStop(0, rgba(P.opusAmber, 0));
      hz.addColorStop(0.5, rgba(P.opusAmber, 0.16 * lit));
      hz.addColorStop(1, rgba(P.opusAmber, 0));
      ctx.fillStyle = hz;
      ctx.fillRect(0, cy - 180 * u, Math.max(0, tipX), 360 * u);

      // the line / string
      const N = 220;
      const amp = 62 * u;
      const st = (f - s1) / FPS;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= N; i++) {
        const xn = i / N;
        const x = -30 * u + xn * (W + 60 * u);
        if (f < s1 && x > tipX) break;
        const y = cy + (f >= s1 ? stringY(xn, st, amp) : 0);
        pts.push([x, y]);
      }
      const passes: Array<[number, string]> = [
        [30 * u, rgba(P.opusAmber, 0.07)],
        [12 * u, rgba(P.opusAmber, 0.22)],
        [4 * u, rgba(P.opusEmber, 0.85)],
        [1.6 * u, rgba(P.opusCream, 1)],
      ];
      for (const [lw, col] of passes) {
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      if (f < s1) {
        // tip: hot spark + motion streak
        const g = ctx.createRadialGradient(tipX, cy, 0, tipX, cy, 70 * u);
        g.addColorStop(0, rgba(P.opusCream, 0.95));
        g.addColorStop(0.2, rgba(P.opusEmber, 0.55));
        g.addColorStop(1, rgba(P.opusAmber, 0));
        ctx.fillStyle = g;
        ctx.fillRect(tipX - 70 * u, cy - 70 * u, 140 * u, 140 * u);
      }
    },
    [W, H, u, scratches, specks, debris, diveBrake],
  );

  const flare = frame >= EV.lineSnap ? Math.exp(-(frame - EV.lineSnap) / 9) : 0;
  const typed = (txt: string, start: number, rate = 1.4) => txt.slice(0, Math.max(0, Math.floor((frame - start) / rate)));

  return (
    <AbsoluteFill>
      <CameraRigContainer rig={rig}>
        <ParticleField3D count={110} seed={1103} color={P.astraIce} secondaryColor={P.opusEmber} speedZ={2.2} />
        <Canvas2D draw={draw} />
      </CameraRigContainer>
      {flare > 0.01 ? (
        <AbsoluteFill style={{ opacity: flare }}>
          <AnamorphicFlare xPercent={L.portrait ? 96 : 98} yPercent={50} color={P.opusEmber} secondaryColor={P.astraCyan} intensity={0.9} />
        </AbsoluteFill>
      ) : null}
      {/* code-native slate: the line is authored, not drawn */}
      <div
        style={{
          position: "absolute",
          left: L.safe,
          top: H / 2 - L.pick(64, 96) * u,
          fontFamily: FONT.code,
          fontSize: L.pick(25, 21) * u,
          color: rgba(P.opusCream, 0.85),
          letterSpacing: "0.02em",
          whiteSpace: L.portrait ? "pre-wrap" : "pre",
          maxWidth: W - 2 * L.safe,
        }}
      >
        <span style={{ color: P.opusAmber }}>{typed("opus", EV.lineSlice)}</span>
        {typed(L.portrait ? ".line(0, W)\n  .pluck({ hz: 5.2, damping: 0.075 })" : ".line(0, W).pluck({ hz: 5.2, damping: 0.075 })", EV.lineSlice + 6, 1.0)}
      </div>
      <div
        style={{
          position: "absolute",
          right: L.safe,
          top: H / 2 + 34 * u,
          fontFamily: FONT.code,
          fontSize: 21 * u,
          color: rgba(P.opusEmber, 0.9 * clamp01((frame - EV.lineSnap) / 6)),
          letterSpacing: "0.04em",
        }}
      >
        snap · f{String(EV.lineSnap).padStart(4, "0")} · 5.2 Hz
      </div>
      <div
        style={{
          position: "absolute",
          left: L.safe,
          top: L.safe * 0.7,
          fontFamily: FONT.ui,
          fontSize: 16 * u,
          letterSpacing: "0.32em",
          color: rgba(P.opusCream, 0.42 * ease.out4(clamp01(frame / 30))),
        }}
      >
        ACT I — THE SHADOW AND THE SPARK
      </div>
    </AbsoluteFill>
  );
};
