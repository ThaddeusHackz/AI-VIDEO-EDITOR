import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRigContainer, mulberry32, useCameraRig } from "../../engine/cameraRig";
import { PlasmaLightningCGI } from "../../engine/cinemaStudio4";
import { Canvas2D } from "../components/Canvas2D";
import { FONT, KineticPhrase } from "../components/Words";
import { EV, FPS, P, phrase, rgba, SCH, shot, WORD_EV } from "../data";
import { useLayout } from "../layout";
import { clamp01, ease, impulseAt, springProgress, SPRINGS } from "../physics/springs";

/**
 * S7 · split-collision (f972–1079). Opus code (left / top) locks horns with Astra solar vectors (right / bottom).
 * The seam is SHOVED on every beat (SCH.seamShoves) — each shove is a closed-form impulse response — and electric
 * arcs strike across it on SCH.arcStrikes (engine PlasmaLightningCGI + seeded branching bolts). "Two" / "titans."
 * collide at the seam. At "Not to destroy…" (f1044) the arcs stop and the seam starts to heal.
 */
const S = shot("S7");
const SHOVE = { mass: 1, stiffness: 190, damping: 9 };
const CODE = [
  "const opus = spring({ k: 170, c: 26 });",
  "export function weave(t: number) {",
  "  return ribbons.map((r) => r.twist(t));",
  "}",
  "for (const glyph of title) glyph.lock();",
  "const thought = geometry.of(time);",
  "await compile(scene, { fps: 60 });",
  "motion = code;  // not hand-drawn",
];

export const S7SplitCollision: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { fps } = useVideoConfig();
  const L = useLayout();
  const { W, H, u, portrait } = L;
  const handheld = useCameraRig({ preset: "handheld-cinema", startFrame: 0, durationInFrames: S.to - S.from, intensity: 1.4 });

  const shove = SCH.seamShoves.reduce((acc, f0, i) => acc + impulseAt(frame, f0, fps, SHOVE, (i % 2 ? -1 : 1) * 2.4), 0);
  const heal = clamp01((frame - EV.arcsStop) / 34);
  const span = portrait ? H : W;
  const seam = span / 2 + shove * span * 0.06 * (1 - heal);
  const shake = Math.abs(shove) * 14 * u * (1 - heal);

  const drawOpus = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const t = (fr - S.from) / FPS;
      ctx.fillStyle = "#120b08";
      ctx.fillRect(0, 0, W, H);
      ctx.font = `700 ${Math.round(24 * u)}px "JetBrains Mono"`;
      ctx.textBaseline = "top";
      const colW = 640 * u;
      for (let c = 0; c < 3; c++) {
        const speed = (60 + c * 35) * u;
        for (let row = 0; row < 40; row++) {
          const y = ((row * 40 * u - t * speed * 3) % (40 * 40 * u)) + (row * 40 * u - t * speed * 3 < 0 ? 40 * 40 * u : 0) - 120 * u;
          const line = CODE[(row + c * 3) % CODE.length];
          const hot = (row + Math.floor(fr / 9)) % 11 === 0;
          ctx.fillStyle = hot ? rgba(P.opusCream, 0.95) : rgba(c === 1 ? P.opusAmber : P.opusEmber, 0.28 + 0.1 * c);
          ctx.fillText(line, 40 * u + c * colW - (c === 2 ? 120 * u : 0), y);
        }
      }
      const g = ctx.createRadialGradient(portrait ? W / 2 : W * 0.3, portrait ? H * 0.25 : H / 2, 0, portrait ? W / 2 : W * 0.3, portrait ? H * 0.25 : H / 2, W * 0.6);
      g.addColorStop(0, rgba(P.opusAmber, 0.22));
      g.addColorStop(1, rgba(P.opusAmber, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    [W, H, u, portrait],
  );

  const drawAstra = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const t = (fr - S.from) / FPS;
      ctx.fillStyle = "#04090f";
      ctx.fillRect(0, 0, W, H);
      const sx = portrait ? W / 2 : W * 1.08;
      const sy = portrait ? H * 1.06 : H * 0.5;
      ctx.globalCompositeOperation = "lighter";
      const r = mulberry32(7701);
      for (let i = 0; i < 160; i++) {
        const a = Math.PI + (r() - 0.5) * 2.4 + (portrait ? -Math.PI / 2 : 0);
        const len = (500 + r() * 1300) * u * (0.75 + 0.25 * Math.sin(t * 5 + i));
        const r0 = (120 + r() * 300) * u;
        ctx.strokeStyle = rgba(i % 4 ? P.astraCyan : P.astraIce, 0.12 + 0.3 * r());
        ctx.lineWidth = r() < 0.15 ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0);
        ctx.lineTo(sx + Math.cos(a) * (r0 + len), sy + Math.sin(a) * (r0 + len));
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
      // hard vector grid in perspective
      ctx.strokeStyle = rgba(P.astraCyan, 0.16);
      ctx.lineWidth = 1;
      for (let i = 0; i < 24; i++) {
        const off = ((i * 60 * u + t * 240 * u) % (24 * 60 * u));
        ctx.beginPath();
        if (portrait) {
          ctx.moveTo(0, H * 0.55 + off * 0.4);
          ctx.lineTo(W, H * 0.55 + off * 0.4);
        } else {
          ctx.moveTo(W * 0.5 + off * 0.45, 0);
          ctx.lineTo(W * 0.5 + off * 0.45, H);
        }
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.55);
      g.addColorStop(0, rgba(P.astraCyan, 0.45));
      g.addColorStop(1, rgba(P.astraCyan, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    },
    [W, H, u, portrait],
  );

  const bolts = useMemo(() => SCH.arcStrikes.map((f0, i) => ({ f0, seed: 7800 + i * 31 })), []);
  const drawArcs = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      if (fr >= EV.arcsStop + 8) return;
      ctx.globalCompositeOperation = "lighter";
      // continuous seam glow
      const g = portrait ? ctx.createLinearGradient(0, seam - 60 * u, 0, seam + 60 * u) : ctx.createLinearGradient(seam - 60 * u, 0, seam + 60 * u, 0);
      g.addColorStop(0, rgba(P.opusEmber, 0));
      g.addColorStop(0.45, rgba(P.opusEmber, 0.55));
      g.addColorStop(0.5, "rgba(255,255,255,0.95)");
      g.addColorStop(0.55, rgba(P.astraCyan, 0.55));
      g.addColorStop(1, rgba(P.astraCyan, 0));
      ctx.fillStyle = g;
      if (portrait) ctx.fillRect(0, seam - 60 * u, W, 120 * u);
      else ctx.fillRect(seam - 60 * u, 0, 120 * u, H);
      for (const b of bolts) {
        const age = fr - b.f0;
        if (age < 0 || age > 7) continue;
        const r = mulberry32(b.seed + fr * 7);
        const fade = 1 - age / 7;
        for (let br = 0; br < 3; br++) {
          const along0 = (0.15 + r() * 0.7) * (portrait ? W : H);
          const reach = (160 + r() * 380) * u;
          const pts: Array<[number, number]> = [];
          const steps = 16;
          for (let s = 0; s <= steps; s++) {
            const q = s / steps;
            const across = seam - reach + 2 * reach * q;
            const jitter = (r() - 0.5) * 70 * u * Math.sin(q * Math.PI);
            const along = along0 + (r() - 0.5) * 50 * u + jitter;
            pts.push(portrait ? [along, across] : [across, along]);
          }
          for (const [w, col] of [[9 * u, rgba(br % 2 ? P.astraCyan : P.opusEmber, 0.35 * fade)], [2.2 * u, `rgba(255,255,255,${0.95 * fade})`]] as Array<[number, string]>) {
            ctx.strokeStyle = col;
            ctx.lineWidth = w;
            ctx.beginPath();
            pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = "source-over";
    },
    [bolts, seam, W, H, u, portrait],
  );

  const two = phrase("L4a").words[0];
  const twoIn = springProgress(Math.max(0, frame - two.startFrame + 2) / FPS, SPRINGS.letter);
  const titansIn = springProgress(Math.max(0, frame - WORD_EV.titansWord) / FPS, SPRINGS.letter);
  const bigA = L.pick(300, 250) * u;
  const bigB = L.pick(250, 210) * u;
  const opusClip = portrait ? `inset(0 0 ${(H - seam).toFixed(1)}px 0)` : `inset(0 ${(W - seam).toFixed(1)}px 0 0)`;
  const astraClip = portrait ? `inset(${seam.toFixed(1)}px 0 0 0)` : `inset(0 0 0 ${seam.toFixed(1)}px)`;
  const healA = 1 - 0.35 * ease.inOut3(heal);

  return (
    <AbsoluteFill style={{ transform: `translate(${(shake * Math.sin(frame * 1.7)).toFixed(2)}px, ${(shake * Math.cos(frame * 2.3) * 0.5).toFixed(2)}px)` }}>
      <CameraRigContainer rig={handheld}>
        <AbsoluteFill style={{ clipPath: opusClip, opacity: healA }}>
          <Canvas2D draw={drawOpus} />
          {frame >= two.startFrame - 2 ? (
            <div
              style={{
                position: "absolute",
                ...(portrait ? { left: 0, right: 0, textAlign: "center" as const, top: seam - bigA * 1.12 } : { right: W - seam + 40 * u, top: H / 2 - bigA * 0.62 }),
                fontFamily: FONT.opus,
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: bigA,
                lineHeight: 1,
                color: P.opusCream,
                textShadow: `0 0 ${40 * u}px ${rgba(P.opusAmber, 0.6)}`,
                transform: `translateX(${(portrait ? 0 : (1 - twoIn) * -420 * u).toFixed(1)}px) translateY(${(portrait ? (1 - twoIn) * -300 * u : 0).toFixed(1)}px)`,
              }}
            >
              Two
            </div>
          ) : null}
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: astraClip, opacity: healA }}>
          <Canvas2D draw={drawAstra} />
          {frame >= WORD_EV.titansWord ? (
            <div
              style={{
                position: "absolute",
                ...(portrait ? { left: 0, right: 0, textAlign: "center" as const, top: seam + 30 * u } : { left: seam + 40 * u, top: H / 2 - bigB * 0.55 }),
                fontFamily: FONT.astra,
                fontWeight: 700,
                fontSize: bigB,
                lineHeight: 1,
                letterSpacing: "-0.05em",
                color: P.astraIce,
                textShadow: `0 0 ${40 * u}px ${rgba(P.astraCyan, 0.6)}`,
                transform: `translateX(${(portrait ? 0 : (1 - titansIn) * 420 * u).toFixed(1)}px) translateY(${(portrait ? (1 - titansIn) * 300 * u : 0).toFixed(1)}px)`,
              }}
            >
              titans.
            </div>
          ) : null}
        </AbsoluteFill>
        <Canvas2D draw={drawArcs} />
        {/* carrier for the dive: the halves heal into a growing "&" at the seam — S8 opens inside this very glyph */}
        {heal > 0 ? (
          <div
            style={{
              position: "absolute",
              left: portrait ? 0 : seam - 400 * u,
              top: portrait ? seam - 400 * u : H / 2 - 400 * u,
              width: portrait ? W : 800 * u,
              height: 800 * u,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.opus,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: (260 + 420 * ease.in4(heal)) * u,
              lineHeight: 1,
              color: "#14161f",
              WebkitTextStroke: `${(2.4 * u).toFixed(2)}px ${P.astraCyan}`,
              textShadow: `-${(3 * u).toFixed(1)}px 0 0 ${P.opusEmber}, 0 0 ${(40 * u).toFixed(1)}px ${rgba(P.astraCyan, 0.5)}`,
              opacity: ease.out4(clamp01(heal * 1.6)),
            }}
          >
            &amp;
          </div>
        ) : null}
        {frame < EV.arcsStop ? (
          <PlasmaLightningCGI
            x1={portrait ? 0 : seam}
            y1={portrait ? seam : 0}
            x2={portrait ? W : seam}
            y2={portrait ? seam : H}
            color={frame % 2 ? P.astraCyan : P.opusEmber}
            branches={2}
          />
        ) : null}
        <KineticPhrase
          id="L4b"
          offset={S.from}
          x={L.safe}
          y={portrait ? seam - 40 * u : H * 0.82}
          width={W - 2 * L.safe}
          align="center"
          base={{ font: FONT.opus, size: 64, italic: true, weight: 500, color: P.opusCream }}
          overrides={{ destroy: { font: FONT.opus, size: 64, italic: true, weight: 600, color: P.opusAmber } }}
        />
      </CameraRigContainer>
    </AbsoluteFill>
  );
};
