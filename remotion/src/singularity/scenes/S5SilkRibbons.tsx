import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRigContainer, mulberry32, useCameraRig } from "../../engine/cameraRig";
import { Canvas2D } from "../components/Canvas2D";
import { FONT, KineticPhrase } from "../components/Words";
import { EV, FPS, mixHex, P, phrase, rgba, SCH, shot } from "../data";
import { useLayout } from "../layout";
import { makeNoise } from "../physics/noise";
import { arrivalFrames, clamp01, ease, springAt, springLockedAt, SPRINGS } from "../physics/springs";

/**
 * S5 · silk-ribbons (f540–791). Silk woven from vector math: each ribbon is a travelling-wave centreline with a twist
 * field; width = |cos θ| and sheen = cos² θ, so the silk turns edge-on and catches light. Ribbons cascade in on
 * closed-form springs and cast soft shadows on a dark slate floor. From 11.4 s Astra's hard cyan light-prisms lock in
 * (SCH.astraPrismLocks), crystallize the silk they touch, and "GPT Astra 6.1 Sol" crystallizes out of the light.
 */
const S = shot("S5");
const N_RIB = 16;

interface Ribbon {
  baseY: number;
  a1: number;
  f1: number;
  v1: number;
  ph: number;
  a2: number;
  f2: number;
  v2: number;
  w0: number;
  tw: number;
  z: number;
  enter: number;
  warm: number;
}

export const S5SilkRibbons: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { fps } = useVideoConfig();
  const L = useLayout();
  const { W, H, u } = L;
  const noise = makeNoise(5501);
  const fpv = useCameraRig({ preset: "fpv-drone", startFrame: 10, durationInFrames: S.to - S.from - 10, intensity: 0.28 });
  const floorY = L.pick(H * 0.7, H * 0.74);

  const ribbons = useMemo<Ribbon[]>(() => {
    const r = mulberry32(5502);
    return Array.from({ length: N_RIB }, (_, i) => ({
      baseY: H * (0.14 + 0.5 * (i / (N_RIB - 1))) + (r() - 0.5) * 40 * u,
      a1: (40 + r() * 80) * u,
      f1: 0.6 + r() * 1.1,
      v1: 0.18 + r() * 0.3,
      ph: r() * Math.PI * 2,
      a2: (10 + r() * 34) * u,
      f2: 1.6 + r() * 2.2,
      v2: 0.1 + r() * 0.3,
      w0: (16 + r() * 34) * u,
      tw: 0.8 + r() * 1.8,
      z: r(),
      enter: S.from - 18 + i * 2,
      warm: r(),
    }));
  }, [H, u]);

  const prismLocks = SCH.astraPrismLocks;
  const prismX = (k: number) => {
    const p = springLockedAt(frame, prismLocks[k], fps, SPRINGS.panel);
    const target = W * L.pick(0.6 + k * 0.085, 0.55 + k * 0.1);
    return W * 1.25 + (target - W * 1.25) * p;
  };
  const crystalFront = prismLocks.reduce((m, lk, k) => (frame >= lk - arrivalFrames(SPRINGS.panel, fps) ? Math.min(m, prismX(k)) : m), W * 2);

  const ribbonPath = useCallback(
    (rb: Ribbon, f: number) => {
      const t = f / FPS;
      const warp = t + 0.9 * Math.max(0, (f - 700) / FPS) ** 2; // the riser accelerates the weave
      const enterP = springAt(f, rb.enter, FPS, SPRINGS.panel);
      const yOff = -H * 0.55 * (1 - enterP);
      const NS = 84;
      const out: Array<{ x: number; y: number; w: number; sheen: number }> = [];
      for (let i = 0; i <= NS; i++) {
        const s = i / NS;
        const x = -0.15 * W + 1.3 * W * s;
        const y =
          rb.baseY +
          yOff +
          rb.a1 * Math.sin(2 * Math.PI * (rb.f1 * s - rb.v1 * warp) + rb.ph) +
          rb.a2 * Math.sin(2 * Math.PI * (rb.f2 * s + rb.v2 * warp) + rb.ph * 1.7) +
          noise.n2(s * 2.1 + rb.ph, warp * 0.35) * 30 * u;
        const th = rb.ph + 2 * Math.PI * (rb.tw * s - 0.32 * warp) + noise.n2(s * 3 - rb.ph, warp * 0.5) * 1.2;
        const c = Math.cos(th);
        out.push({ x, y, w: rb.w0 * (0.18 + 0.82 * Math.abs(c)), sheen: Math.max(0, c) ** 2 });
      }
      return out;
    },
    [W, H, u, noise],
  );

  const drawRibbons = useCallback(
    (front: boolean) => (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      for (const rb of ribbons) {
        if ((rb.z > 0.62) !== front) continue;
        if (fr < rb.enter) continue;
        const pts = ribbonPath(rb, fr);
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const crystal = clamp01((a.x - crystalFront) / (90 * u));
          const base = mixHex(rb.warm > 0.5 ? P.opusAmber : P.opusEmber, P.opusCream, a.sheen * 0.85);
          const col = crystal > 0 ? mixHex(base.startsWith("rgb") ? P.opusAmber : base, a.sheen > 0.5 ? P.astraIce : P.astraCyan, crystal) : base;
          ctx.fillStyle = col;
          ctx.globalAlpha = (0.38 + 0.6 * a.sheen) * (front ? 0.95 : 0.8);
          ctx.beginPath();
          ctx.moveTo(a.x + (nx * a.w) / 2, a.y + (ny * a.w) / 2);
          ctx.lineTo(b.x + (nx * b.w) / 2, b.y + (ny * b.w) / 2);
          ctx.lineTo(b.x - (nx * b.w) / 2, b.y - (ny * b.w) / 2);
          ctx.lineTo(a.x - (nx * a.w) / 2, a.y - (ny * a.w) / 2);
          ctx.closePath();
          ctx.fill();
          if (crystal > 0.5 && i % 3 === 0) {
            ctx.globalAlpha = 0.9;
            ctx.strokeStyle = P.astraIce;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
    },
    [ribbons, ribbonPath, crystalFront, u],
  );
  const drawBack = useMemo(() => drawRibbons(false), [drawRibbons]);
  const drawFront = useMemo(() => drawRibbons(true), [drawRibbons]);

  const drawFloor = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const g = ctx.createLinearGradient(0, floorY, 0, H);
      g.addColorStop(0, "#1b1e27");
      g.addColorStop(0.35, P.slate);
      g.addColorStop(1, "#07080c");
      ctx.fillStyle = g;
      ctx.fillRect(0, floorY, W, H - floorY);
      const sheen = ctx.createRadialGradient(W * 0.42, floorY + 30 * u, 0, W * 0.42, floorY + 30 * u, W * 0.5);
      sheen.addColorStop(0, rgba(P.opusEmber, 0.16));
      sheen.addColorStop(1, rgba(P.opusEmber, 0));
      ctx.fillStyle = sheen;
      ctx.fillRect(0, floorY, W, H - floorY);
      ctx.strokeStyle = rgba(P.opusCream, 0.06);
      ctx.lineWidth = 1;
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + i * 40 * u, floorY);
        ctx.lineTo(W / 2 + i * 240 * u, H);
        ctx.stroke();
      }
    },
    [W, H, u, floorY],
  );

  // soft cast shadows, drawn at quarter resolution so each blur costs 1/16 of a full-frame pass
  const drawShadows = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      ctx.filter = "blur(3px)";
      for (const rb of ribbons) {
        if (fr < rb.enter) continue;
        const pts = ribbonPath(rb, fr);
        const depth = floorY + (H - floorY) * (0.18 + 0.62 * rb.z);
        ctx.strokeStyle = `rgba(0,0,0,${0.5 + 0.3 * rb.z})`;
        ctx.lineWidth = rb.w0 * 0.7;
        ctx.beginPath();
        pts.forEach((p, i) => {
          const x = p.x + (1 - p.y / H) * 90 * u;
          const y = depth + (p.y - rb.baseY) * 0.12;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        });
        ctx.stroke();
      }
      ctx.filter = "none";
    },
    [H, u, floorY, ribbons, ribbonPath],
  );

  const drawPrisms = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      for (let k = 0; k < prismLocks.length; k++) {
        if (fr < prismLocks[k] - arrivalFrames(SPRINGS.panel, fps)) continue;
        const p = springLockedAt(fr, prismLocks[k], fps, SPRINGS.panel);
        const target = W * L.pick(0.6 + k * 0.085, 0.55 + k * 0.1);
        const x = W * 1.25 + (target - W * 1.25) * p;
        const y = H * L.pick(0.26 + 0.11 * k, 0.3 + 0.08 * k);
        const s = (L.pick(120, 110) - k * 10) * u;
        const rot = (k % 2 ? -0.35 : 0.3) + 0.4 * (1 - p);
        const tri = [0, 1, 2].map((i) => [x + Math.cos(rot + (i * 2 * Math.PI) / 3) * s, y + Math.sin(rot + (i * 2 * Math.PI) / 3) * s]);
        const depth = [24 * u, -18 * u];
        // extruded side faces
        for (let i = 0; i < 3; i++) {
          const a = tri[i];
          const b = tri[(i + 1) % 3];
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          ctx.lineTo(b[0] + depth[0], b[1] + depth[1]);
          ctx.lineTo(a[0] + depth[0], a[1] + depth[1]);
          ctx.closePath();
          ctx.fillStyle = rgba(P.astraCyan, 0.1 + 0.12 * i);
          ctx.fill();
          ctx.strokeStyle = rgba(P.astraIce, 0.7);
          ctx.lineWidth = 1.2 * u;
          ctx.stroke();
        }
        ctx.beginPath();
        tri.forEach(([tx, ty], i) => (i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty)));
        ctx.closePath();
        const g = ctx.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]);
        g.addColorStop(0, rgba(P.astraIce, 0.55));
        g.addColorStop(1, rgba(P.astraCyan, 0.12));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2 * u;
        ctx.stroke();
        // refracted beam: white in, cyan fan out (towards Opus' side)
        const flash = Math.exp(-Math.max(0, fr - prismLocks[k]) / 14);
        ctx.globalCompositeOperation = "lighter";
        for (let b = 0; b < 5; b++) {
          ctx.strokeStyle = rgba(b === 2 ? "#ffffff" : P.astraCyan, (0.18 + 0.5 * flash) * (b === 2 ? 1 : 0.6));
          ctx.lineWidth = (b === 2 ? 2.4 : 1.2) * u;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - W * 0.9, y + (b - 2) * 70 * u + 60 * u);
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }
      // cyan light leak builds with the riser
      const leak = clamp01((fr - EV.astraIntrude) / 100);
      if (leak > 0) {
        const lg = ctx.createRadialGradient(W * 1.05, H * 0.35, 0, W * 1.05, H * 0.35, W * 0.7);
        lg.addColorStop(0, rgba(P.astraCyan, 0.35 * leak));
        lg.addColorStop(1, rgba(P.astraCyan, 0));
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, W, H);
      }
    },
    [W, H, u, L, prismLocks, fps],
  );

  const astra = SCH.astraTitle; // "GPT Astra 6.1 Sol"
  const glyphs = astra.replace(/ /g, "").split("");
  const shake = frame > 760 ? Math.sin(frame * 2.1) * 4 * u * clamp01((frame - 760) / 30) : 0;
  const andWord = phrase("L3a").words[0];

  return (
    <AbsoluteFill style={{ transform: shake ? `translate(${shake.toFixed(2)}px, ${(-shake * 0.6).toFixed(2)}px)` : undefined }}>
      <Canvas2D draw={drawFloor} />
      <Canvas2D draw={drawShadows} scale={0.25} style={{ clipPath: `inset(${((floorY / H) * 100).toFixed(2)}% 0 0 0)` }} />
      <CameraRigContainer rig={fpv}>
        <Canvas2D draw={drawBack} />
        <KineticPhrase
          id="L2b"
          offset={S.from}
          x={L.safe + 8 * u}
          y={L.pick(H * 0.2, H * 0.24)}
          width={L.pick(W * 0.58, W - 2 * L.safe)}
          base={{ font: FONT.code, size: 30, weight: 700, color: P.opusCream, mode: "type", tracking: "0" }}
          overrides={{
            coding: { font: FONT.code, size: 30, weight: 700, color: P.opusAmber, mode: "type", tracking: "0" },
            geometry: { font: FONT.opus, size: L.pick(150, 130), italic: true, weight: 600, color: P.opusCream, breakBefore: true, glow: rgba(P.opusAmber, 0.5) },
            of: { font: FONT.opus, size: L.pick(150, 130), italic: true, weight: 500, color: P.opusAmber },
            thought: { font: FONT.opus, size: L.pick(150, 130), italic: true, weight: 600, color: P.opusCream, breakBefore: L.portrait, glow: rgba(P.opusAmber, 0.5) },
            in: { font: FONT.code, size: 30, weight: 700, color: P.astraCyan, mode: "type", tracking: "0", breakBefore: true },
            real: { font: FONT.code, size: 30, weight: 700, color: P.astraCyan, mode: "type", tracking: "0" },
            time: { font: FONT.code, size: 30, weight: 700, color: P.astraCyan, mode: "type", tracking: "0" },
          }}
          exitAt={EV.astraIntrude + 20}
          exitFrames={16}
        />
        <Canvas2D draw={drawFront} />
        <Canvas2D draw={drawPrisms} />
        {/* "And" … */}
        {frame >= andWord.startFrame - 2 ? (
          <div style={{ position: "absolute", right: L.pick(W * 0.36, W * 0.62), top: L.pick(H * 0.47, H * 0.5), fontFamily: FONT.opus, fontStyle: "italic", fontSize: 72 * u, color: P.opusCream, opacity: clamp01((frame - andWord.startFrame + 2) / 6) }}>
            And
          </div>
        ) : null}
      </CameraRigContainer>
        {/* … "GPT Astra 6.1 Sol" crystallizes out of the prisms */}
        <div style={{ position: "absolute", right: L.safe, top: L.pick(H * 0.5, H * 0.56), textAlign: "right", fontFamily: FONT.astra }}>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 18 * u }}>
            {glyphs.map((ch, i) => {
              const lock = SCH.astraLetterLocks[i];
              const launch = lock - arrivalFrames(SPRINGS.letter, fps);
              if (frame < launch) return null;
              const p = springLockedAt(frame, lock, fps, SPRINGS.letter);
              const flash = frame >= lock && frame < lock + 4;
              const isGPT = i < 3;
              const isNum = i >= 8 && i < 11;
              const size = (isGPT ? 58 : isNum ? 80 : i < 8 ? 170 : 80) * u * L.pick(1, 0.8);
              const gapBefore = i === 3 || i === 8 || i === 11 ? 26 * u : 0;
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    marginLeft: gapBefore,
                    marginRight: -18 * u,
                    fontFamily: isNum ? FONT.code : FONT.astra,
                    fontWeight: isGPT ? 500 : 700,
                    fontSize: size,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: flash ? "#ffffff" : isGPT || isNum ? P.astraCyan : P.astraIce,
                    WebkitTextStroke: p < 0.9 ? `${1.5 * u}px ${P.astraIce}` : undefined,
                    opacity: clamp01((frame - launch) / 3),
                    transform: `translateY(${((1 - p) * -60 * u).toFixed(2)}px) scale(${(0.55 + 0.45 * p).toFixed(3)}) skewX(${((1 - p) * -14).toFixed(2)}deg)`,
                    textShadow: `0 0 ${(size * 0.12).toFixed(1)}px rgba(2,6,10,0.95), 0 0 ${(size * 0.3).toFixed(1)}px rgba(2,6,10,0.7), 0 0 ${(size * 0.16).toFixed(1)}px ${rgba(P.astraCyan, 0.55)}`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>
      {/* riser tension: the frame is pulled toward Astra's light */}
      <AbsoluteFill style={{ pointerEvents: "none", background: `linear-gradient(270deg, ${rgba(P.astraCyan, 0.12 * ease.in4(clamp01((frame - 700) / 92)))} 0%, transparent 60%)` }} />
    </AbsoluteFill>
  );
};
