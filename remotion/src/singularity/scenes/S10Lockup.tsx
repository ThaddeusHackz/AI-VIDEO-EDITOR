import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32 } from "../../engine/cameraRig";
import { Canvas2D } from "../components/Canvas2D";
import { drawInfinityWeave, lemniscate } from "../components/Emblem";
import { FONT, KineticPhrase } from "../components/Words";
import { BEAT, FPS, P, rgba, SCH, shot } from "../data";
import { useLayout } from "../layout";
import { makeNoise } from "../physics/noise";
import { clamp01, ease, springLockedAt, springProgress, SPRINGS } from "../physics/springs";

/**
 * S10 · lockup (f1584–1691). Arrival (inverse zoom-through). Every stream, ribbon and shard snaps like an elastic band
 * (closed-form, stiff, underdamped — SPRINGS.elastic) onto the infinity-weave path, each LOCKING on its click frame
 * (SCH.emblemSnaps); the emblem locks on SCH.emblemLock with the brass chord. A clean, centred isometric lockup —
 * the line × ring of the opening, resolved. The emblem's glow pulses with the sub on every beat (not idle wobble:
 * it is the beat). "Long live the code." lands in serif + mono.
 */
const S = shot("S10");

export const S10Lockup: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { fps } = useVideoConfig();
  const L = useLayout();
  const { W, H, u } = L;
  const noise = makeNoise(10101);
  const ecx = W / 2;
  const ecy = L.pick(H * 0.43, H * 0.4);
  const A = L.pick(330, 300) * u;
  const band = L.pick(30, 28) * u;

  const streams = useMemo(() => {
    const r = mulberry32(10102);
    return SCH.emblemSnaps.map((lock, i) => ({ lock, t0: (i / 8) * Math.PI * 2 - Math.PI / 2, seed: r() * 100, from: r() * Math.PI * 2 }));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const t = fr / FPS;
      // isometric grid
      ctx.strokeStyle = rgba(P.opusCream, 0.045);
      ctx.lineWidth = 1;
      const step = 64 * u;
      for (let k = -40; k <= 40; k++) {
        ctx.beginPath();
        ctx.moveTo(ecx + k * step - H, ecy - H * 0.577);
        ctx.lineTo(ecx + k * step + H, ecy + H * 0.577);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ecx + k * step + H, ecy - H * 0.577);
        ctx.lineTo(ecx + k * step - H, ecy + H * 0.577);
        ctx.stroke();
      }
      const halo = ctx.createRadialGradient(ecx, ecy, 0, ecx, ecy, A * 2.2);
      halo.addColorStop(0, rgba(P.opusEmber, 0.12));
      halo.addColorStop(0.5, rgba(P.astraCyan, 0.06));
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, H);
      // elastic streams: chaotic curve → its segment of the lemniscate
      let locked = 0;
      for (const s of streams) {
        const p = springLockedAt(fr, s.lock, fps, SPRINGS.elastic);
        if (fr >= s.lock) locked++;
        const seg = Math.PI / 4;
        ctx.strokeStyle = Math.cos(s.t0) > 0 ? rgba(P.astraCyan, 0.95) : rgba(P.opusEmber, 0.95);
        ctx.lineWidth = band * (0.25 + 0.55 * clamp01(p));
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const q = i / 40;
          const [lx, ly] = lemniscate(s.t0 + seg * q, A);
          const wild = 1 - p;
          const ang = s.from + q * 2.2 + noise.n2(s.seed + q * 2, t * 0.8) * 1.4;
          const far = (900 + 500 * q) * u * wild;
          const x = ecx + lx + Math.cos(ang) * far;
          const y = ecy + ly + Math.sin(ang) * far * 0.7;
          if (i) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // the emblem: draws on as the streams lock, LOCKS with the chord
      const lockP = springLockedAt(fr, SCH.emblemLock, fps, SPRINGS.elastic);
      const beatPulse = Math.exp(-((fr % BEAT) / BEAT) / 0.22);
      if (locked > 0) drawInfinityWeave(ctx, ecx, ecy, A * (0.94 + 0.06 * lockP), band, Math.min(1, locked / 8 + 0.02 * locked), 0.3 + 0.7 * beatPulse);
      // after the lock the two titans keep co-authoring the signature: light comets race the weave (amber / cyan)
      if (fr >= SCH.emblemLock) {
        ctx.globalCompositeOperation = "lighter";
        const tt = (fr - SCH.emblemLock) / FPS;
        // electron field orbiting the emblem (two counter-rotating shells)
        for (let e = 0; e < 200; e++) {
          const shell = e % 2;
          const ang = (e / 200) * Math.PI * 2 * 7 + tt * (shell ? -1.6 : 1.2);
          const rx = A * (shell ? 1.55 : 1.32);
          const ry = A * (shell ? 0.62 : 0.5);
          ctx.fillStyle = rgba(shell ? P.astraCyan : P.opusEmber, 0.6);
          ctx.fillRect(ecx + Math.cos(ang) * rx - 2.5 * u, ecy + Math.sin(ang) * ry - 2.5 * u, 5 * u, 5 * u);
        }
        for (const [ph, col] of [[0, P.opusEmber], [Math.PI, P.astraCyan], [2.1, P.opusEmber], [2.1 + Math.PI, P.astraCyan], [4.2, P.opusEmber], [4.2 + Math.PI, P.astraCyan]] as Array<[number, string]>) {
          for (let k = 0; k < 36; k++) {
            const [lx, ly] = lemniscate(tt * 3.9 + ph - k * 0.032, A);
            ctx.fillStyle = rgba(k === 0 ? "#FFFFFF" : col, (1 - k / 36) * (k === 0 ? 1 : 0.75));
            ctx.beginPath();
            ctx.arc(ecx + lx, ecy + ly, (k === 0 ? 16 : 13 * (1 - k / 36) + 2.5) * u, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }
      const since = fr - SCH.emblemLock;
      if (since >= 0 && since < 26) {
        const q = since / 26;
        ctx.strokeStyle = `rgba(255,255,255,${(1 - q) * 0.9})`;
        ctx.lineWidth = 3 * u * (1 - q) + 1;
        ctx.beginPath();
        ctx.ellipse(ecx, ecy, A * (1 + 1.2 * ease.out4(q)), A * 0.55 * (1 + 1.2 * ease.out4(q)), 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [W, H, u, A, band, ecx, ecy, streams, fps, noise],
  );

  const nameIn = springProgress(Math.max(0, frame - SCH.emblemLock + 6) / FPS, SPRINGS.letter);
  const titleIn = springProgress(Math.max(0, frame - SCH.emblemLock - 6) / FPS, SPRINGS.letter);
  const nameSize = L.pick(46, 40) * u;

  return (
    // after the lock: a steady dolly-in (x^1.6, never easing out) that is still travelling when the snap-to-black
    // lands, so the hold is a camera move, not a held frame
    <AbsoluteFill style={{ transform: `scale(${(1 + 0.13 * clamp01((frame - SCH.emblemLock) / (S.to - SCH.emblemLock)) ** 1.6).toFixed(4)})` }}>
      <Canvas2D draw={draw} />
      {/* the two names flank the emblem (left/right in 16:9, stacked in 9:16) */}
      <div
        style={{
          position: "absolute",
          ...(L.portrait ? { left: 0, right: 0, top: ecy - A * 1.05, textAlign: "center" as const } : { right: W - (ecx - A * 1.12), top: ecy - nameSize * 0.75, textAlign: "right" as const }),
          fontFamily: FONT.opus,
          fontSize: nameSize,
          color: P.opusCream,
          opacity: clamp01(nameIn * 1.4),
          transform: `translateX(${(L.portrait ? 0 : (1 - nameIn) * -60 * u).toFixed(1)}px)`,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontStyle: "italic", color: P.opusAmber }}>Claude</span> <span style={{ fontWeight: 600 }}>Opus</span> <span style={{ fontFamily: FONT.code, fontSize: nameSize * 0.62, color: P.opusAmber }}>5.5</span>
      </div>
      <div
        style={{
          position: "absolute",
          ...(L.portrait ? { left: 0, right: 0, top: ecy + A * 0.62, textAlign: "center" as const } : { left: ecx + A * 1.12, top: ecy - nameSize * 0.7, textAlign: "left" as const }),
          fontFamily: FONT.astra,
          fontSize: nameSize * 0.92,
          color: P.astraIce,
          opacity: clamp01(nameIn * 1.4),
          transform: `translateX(${(L.portrait ? 0 : (1 - nameIn) * 60 * u).toFixed(1)}px)`,
          whiteSpace: "nowrap",
          letterSpacing: "-0.01em",
        }}
      >
        <span style={{ color: P.astraCyan, fontWeight: 500 }}>GPT</span> <span style={{ fontWeight: 700 }}>Astra</span> <span style={{ fontFamily: FONT.code, fontSize: nameSize * 0.6, color: P.astraCyan }}>6.1</span> <span style={{ fontWeight: 700 }}>Sol</span>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: ecy + A * L.pick(0.68, 0.98), textAlign: "center", opacity: clamp01(titleIn * 1.3), transform: `translateY(${((1 - titleIn) * 30 * u).toFixed(1)}px)` }}>
        <div style={{ fontFamily: FONT.opus, fontStyle: "italic", fontWeight: 600, fontSize: L.pick(92, 84) * u, color: P.opusCream, letterSpacing: "-0.01em", lineHeight: 1.05, backgroundImage: `linear-gradient(100deg, ${P.opusCream} 0%, ${P.opusCream} ${(((frame - SCH.emblemLock) * 1.4) % 160) - 30}%, #FFFFFF ${(((frame - SCH.emblemLock) * 1.4) % 160) - 22}%, ${P.astraIce} ${(((frame - SCH.emblemLock) * 1.4) % 160) - 16}%, ${P.opusCream} ${(((frame - SCH.emblemLock) * 1.4) % 160) - 8}%, ${P.opusCream} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>The Singularity Engine</div>
        <div style={{ marginTop: 14 * u, fontFamily: FONT.ui, fontWeight: 500, fontSize: 15 * u, letterSpacing: "0.42em", color: rgba(P.opusCream, 0.62) }}>
          <span style={{ color: P.opusAmber }}>OPUS</span> × <span style={{ color: P.astraCyan }}>ASTRA</span> · GENESIS OF HYPER-MOTION
        </div>
      </div>
      <KineticPhrase
        id="L5c"
        offset={S.from}
        x={L.safe}
        y={L.pick(H * 0.08, H * 0.1)}
        width={W - 2 * L.safe}
        align="center"
        base={{ font: FONT.opus, size: 64, italic: true, weight: 500, color: P.opusCream }}
        overrides={{ code: { font: FONT.code, size: 60, weight: 700, color: P.astraCyan, mode: "slam", glow: rgba(P.astraCyan, 0.55) } }}
      />
    </AbsoluteFill>
  );
};
