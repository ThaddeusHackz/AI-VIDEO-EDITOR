import React, { useCallback } from "react";
import { AbsoluteFill } from "remotion";
import { Canvas2D } from "../components/Canvas2D";
import { lemniscate } from "../components/Emblem";
import { BEAT, EV, FPS, P, rgba, shot } from "../data";
import { useLayout } from "../layout";

/**
 * S11 · signature (f1692–1799). Snap-cut to black. Only a dual-core signature remains: two cores (Opus amber, Astra
 * cyan) chasing each other around a small lemniscate, their glow following the decaying sub-bass envelope from the
 * 28.2 s snap (τ = 0.75 s, the same constant the score uses), a crisp ring pulse-out at 29.4 s. Every frame still moves.
 */
const S = shot("S11");

export const S11Signature: React.FC = () => {
  const L = useLayout();
  const { W, H, u } = L;
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const tau = (fr - S.from) / FPS;
      const env = 0.6 + 0.4 * Math.exp(-tau / 0.75);
      const cx = W / 2;
      const cy = H / 2;
      const a = 190 * u;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.35 * tau);
      ctx.translate(-cx, -cy);
      ctx.strokeStyle = rgba(P.opusCream, 0.12 + 0.08 * env);
      ctx.lineWidth = 1.8 * u;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const [x, y] = lemniscate((i / 200) * Math.PI * 2, a);
        if (i) ctx.lineTo(cx + x, cy + y);
        else ctx.moveTo(cx + x, cy + y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      // ripples on every beat, decaying with the sub envelope (the signature still keeps time)
      for (let b = 0; b < 7; b++) {
        // half-beat ripples (1692, 1710, … 1800): the decaying sub keeps time to the very last frame
        const beat0 = S.from + b * (BEAT / 2);
        const age = (fr - beat0) / FPS;
        if (age < 0 || age > 0.9) continue;
        const q = age / 0.9;
        ctx.strokeStyle = rgba(b % 2 ? P.astraCyan : P.opusEmber, 0.6 * env * (1 - q));
        ctx.lineWidth = 2.6 * u;
        ctx.beginPath();
        ctx.ellipse(cx, cy, (60 + 420 * q) * u, (32 + 220 * q) * u, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      const omega = 4.4;
      for (const [phase, col] of [[0, P.opusEmber], [Math.PI, P.astraCyan]] as Array<[number, string]>) {
        for (let k = 26; k >= 0; k--) {
          const tt = tau - k * 0.012;
          const [x, y] = lemniscate(omega * tt + phase, a);
          const al = (1 - k / 27) * env;
          const rr = (k === 0 ? 17 : 10) * u * (0.6 + 0.4 * (1 - k / 27));
          ctx.fillStyle = rgba(col, al * (k === 0 ? 1 : 0.5));
          ctx.beginPath();
          ctx.arc(cx + x, cy + y, rr, 0, Math.PI * 2);
          ctx.fill();
        }
        const [hx, hy] = lemniscate(omega * tau + phase, a);
        const g = ctx.createRadialGradient(cx + hx, cy + hy, 0, cx + hx, cy + hy, 130 * u);
        g.addColorStop(0, rgba(col, 0.75 * env));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(cx + hx - 130 * u, cy + hy - 130 * u, 260 * u, 260 * u);
      }
      ctx.restore();
      const since = fr - EV.pulseOut;
      if (since >= 0 && since < 16) {
        const q = since / 16;
        ctx.strokeStyle = `rgba(255,255,255,${0.95 * (1 - q)})`;
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.arc(cx, cy, (20 + 280 * (1 - (1 - q) ** 3)) * u, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - q) ** 2})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 5 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    [W, H, u],
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Canvas2D draw={draw} />
    </AbsoluteFill>
  );
};
