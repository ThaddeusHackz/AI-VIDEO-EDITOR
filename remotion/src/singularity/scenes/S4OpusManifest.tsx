import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRigContainer, useCameraRig } from "../../engine/cameraRig";
import { AudioWaveformBar } from "../../engine/nleTrackEngine";
import { Canvas2D } from "../components/Canvas2D";
import { FONT, KineticPhrase } from "../components/Words";
import { FPS, P, rgba, SCH, shot } from "../data";
import { useLayout } from "../layout";
import { makeNoise } from "../physics/noise";
import { arrivalFrames, clamp01, ease, oscillator, springLockedAt, springProgress, SPRINGS } from "../physics/springs";

/**
 * S4 · opus-manifest (f360–539). "Claude Opus 5.5" is launched glyph-by-glyph out of a liquid-amber field of flowing
 * serif letterforms; every glyph flies on a closed-form 3D spring solved so it LOCKS on its scheduled click frame
 * (SCH.opusLetterLocks — the score places a click on each). Glassmorphic origami panels unfold in a CSS-3D
 * coordinate grid; each wing flips from a neo-brutalist word to a live data chart on SCH.origamiFolds.
 */
const S = shot("S4");

let mctx: CanvasRenderingContext2D | null = null;
function measure(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 40;
  if (!mctx) mctx = document.createElement("canvas").getContext("2d");
  mctx!.font = font;
  return mctx!.measureText(text).width;
}

interface Glyph {
  ch: string;
  font: string;
  size: number;
  color: string;
  x: number;
  y: number;
  lock: number;
}

export const S4OpusManifest: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { fps } = useVideoConfig();
  const L = useLayout();
  const { W, H, u } = L;
  const noise = makeNoise(4401);
  const crane = useCameraRig({ preset: "crane-up", startFrame: 0, durationInFrames: S.to - S.from, intensity: 1.0 });

  // title glyph slots (measured with the real fonts so the springs land on the true layout)
  const glyphs = useMemo<Glyph[]>(() => {
    const out: Glyph[] = [];
    const x0 = L.safe + 8 * u;
    const y1 = L.pick(H * 0.2, H * 0.16);
    const s1 = 74 * u;
    const s2 = L.pick(250, 220) * u;
    const s3 = L.pick(96, 84) * u;
    const f1 = `italic 600 ${s1}px "Cormorant Garamond"`;
    const f2 = `600 ${s2}px "Cormorant Garamond"`;
    const f3 = `700 ${s3}px "JetBrains Mono"`;
    let x = x0;
    let k = 0;
    for (const ch of "Claude") {
      out.push({ ch, font: FONT.opus + "|italic|600", size: s1, color: P.opusAmber, x, y: y1, lock: SCH.opusLetterLocks[k++] });
      x += measure(ch, f1);
    }
    x = x0 - 6 * u;
    const y2 = y1 + s1 * 0.25;
    for (const ch of "Opus") {
      out.push({ ch, font: FONT.opus + "|normal|600", size: s2, color: P.opusCream, x, y: y2, lock: SCH.opusLetterLocks[k++] });
      x += measure(ch, f2);
    }
    x += 14 * u;
    for (const ch of "5.5") {
      out.push({ ch, font: FONT.code + "|normal|700", size: s3, color: P.opusAmber, x, y: y2 + s2 * 0.12, lock: SCH.opusLetterLocks[k++] });
      x += measure(ch, f3);
    }
    return out;
  }, [L, H, u]);

  // the liquid-amber typographic sea owns the frame at the cut, then recedes as the title is born out of it
  const recede = ease.inOut3(clamp01((frame - (S.from + 18)) / 60));
  const waveTop = L.pick(H * (0.18 + 0.27 * recede), H * (0.3 + 0.26 * recede));
  const drawWaves = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const t = fr / FPS;
      const cols = L.pick(64, 38);
      const rows = L.pick(Math.round(16 + 10 * (1 - recede)), Math.round(19 + 8 * (1 - recede)));
      const x0 = -40 * u;
      const dx = (L.pick(W * 0.66, W * 1.05) - x0) / cols;
      const dy = (H - waveTop) / rows;
      const src = "opusclaude";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = x0 + i * dx + ((t * 150 * u * (1 + 0.25 * (j % 3)) + j * 13) % dx);
          const crest = Math.sin(i * 0.42 - t * 5.2 + j * 0.55) * 0.6 + noise.n3(i * 0.12, j * 0.2, t * 1.1) * 0.6;
          const y = waveTop + j * dy + crest * 34 * u;
          const c = clamp01(0.5 + crest * 0.6);
          const size = (18 + 28 * c) * u;
          const fade = clamp01((i * dx) / (W * 0.08)) * clamp01((L.pick(W * 0.66, W) - i * dx) / (W * 0.12));
          ctx.font = `italic ${c > 0.6 ? 600 : 400} ${size.toFixed(1)}px "Cormorant Garamond"`;
          ctx.fillStyle = c > 0.72 ? rgba(P.opusCream, fade) : c > 0.45 ? rgba(P.opusEmber, (0.75 + 0.25 * c) * fade) : rgba(P.opusAmber, (0.66 + 0.34 * c) * fade);
          ctx.fillText(src[(i + j * 3) % src.length], x, y);
        }
      }
      // ghosted "Opus" watermark, drifting (embed behind the scene, captions-overlay doctrine)
      ctx.save();
      ctx.font = `italic 700 ${Math.round(L.pick(620, 420) * u)}px "Cormorant Garamond"`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.strokeStyle = rgba(P.opusAmber, 0.13);
      ctx.lineWidth = 1.6 * u;
      ctx.strokeText("Opus", L.pick(W * 0.3, W * 0.05) - t * 60 * u, L.pick(H * 0.62, H * 0.5));
      ctx.restore();
      // spark rings on every glyph lock (the click you hear)
      for (const g of glyphs) {
        const since = fr - g.lock;
        if (since < 0 || since > 14) continue;
        const p = since / 14;
        ctx.strokeStyle = rgba(P.opusEmber, 1 - p);
        ctx.lineWidth = 2 * u;
        ctx.beginPath();
        ctx.arc(g.x + g.size * 0.25, g.y + g.size * 0.55, (10 + 50 * ease.out4(p)) * u, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [W, H, u, L, waveTop, glyphs, noise],
  );

  // origami panels: each has 3 folds (stand-up, left wing, right wing) locked on SCH.origamiFolds
  const panels = [
    { word: "FOLD", chart: "spring" },
    { word: "FORM", chart: "bars" },
    { word: "FLOW", chart: "wave" },
    { word: "FUSE", chart: "metrics" },
  ];
  const foldP = (i: number) => springLockedAt(frame, SCH.origamiFolds[i], fps, SPRINGS.panel);
  const panelW = L.pick(270, 300) * u;
  const panelH = L.pick(205, 230) * u;
  const focusPanels = clamp01((frame - 425) / 20);
  const titleBlur = 2.6 * clamp01((frame - 470) / 30);

  return (
    <AbsoluteFill>
      <CameraRigContainer rig={crane}>
        <Canvas2D draw={drawWaves} />
        {/* CSS-3D coordinate grid + origami panels */}
        <div
          style={{
            position: "absolute",
            left: L.pick(W * 0.37, W * 0.06),
            top: L.pick(H * 0.24, H * 0.34),
            width: L.pick(W * 0.52, W * 0.88),
            height: L.pick(H * 0.62, H * 0.36),
            perspective: 1500 * u,
            filter: focusPanels < 1 ? `blur(${(6 * (1 - focusPanels)).toFixed(2)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${(16 - 4 * ease.inOut3(clamp01((frame - S.from) / 180))).toFixed(2)}deg) rotateY(${(-13 + 7 * ease.inOut3(clamp01((frame - S.from) / 180))).toFixed(2)}deg)` }}>
            <div
              style={{
                position: "absolute",
                left: "-20%",
                top: "62%",
                width: "140%",
                height: "140%",
                transformOrigin: "50% 0%",
                transform: "rotateX(76deg)",
                backgroundImage: `linear-gradient(${rgba(P.opusAmber, 0.22)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(P.opusAmber, 0.22)} 1px, transparent 1px)`,
                backgroundSize: `${60 * u}px ${60 * u}px`,
                maskImage: "radial-gradient(ellipse 60% 55% at 50% 30%, black 30%, transparent 75%)",
              }}
            />
            {["x", "y", "z"].map((ax, i) => (
              <div key={ax} style={{ position: "absolute", left: `${12 + i * 34}%`, top: "64%", fontFamily: FONT.code, fontSize: 14 * u, color: rgba(P.opusCream, 0.5), letterSpacing: "0.1em" }}>
                {ax}: {(oscillator((frame - 432) / FPS, 1, 0, SPRINGS.panel) * 100 + i * 40).toFixed(1)}
              </div>
            ))}
            {panels.map((pn, i) => {
              const base = foldP(i * 3);
              const left = foldP(i * 3 + 1);
              const right = foldP(i * 3 + 2);
              if (frame < SCH.origamiFolds[i * 3] - arrivalFrames(SPRINGS.panel, fps) - 1) return null;
              const col = i % 2;
              const row = Math.floor(i / 2);
              const px = L.pick(0.12 + col * 0.42, 0.06 + col * 0.48);
              const py = L.pick(0.02 + row * 0.34, 0.0 + row * 0.5);
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${px * 100}%`,
                    top: `${py * 100}%`,
                    width: panelW,
                    height: panelH,
                    transformStyle: "preserve-3d",
                    transformOrigin: "50% 100%",
                    transform: `translateZ(${(i * 30 * u).toFixed(1)}px) rotateX(${(90 * (1 - base)).toFixed(2)}deg)`,
                  }}
                >
                  <PanelFace kind={pn.chart} frame={frame} u={u} w={panelW} h={panelH} glass />
                  <Wing side="left" p={left} word={pn.word} chart={pn.chart} frame={frame} u={u} w={panelW * 0.5} h={panelH} />
                  <Wing side="right" p={right} word={pn.word} chart={pn.chart} frame={frame} u={u} w={panelW * 0.5} h={panelH} />
                </div>
              );
            })}
          </div>
        </div>
        {/* the title, assembled out of the waves */}
        <div style={{ position: "absolute", inset: 0, perspective: 1100 * u, filter: titleBlur > 0.1 ? `blur(${titleBlur.toFixed(2)}px)` : undefined }}>
          {glyphs.map((g, i) => {
            const launch = g.lock - arrivalFrames(SPRINGS.letter, fps);
            if (frame < launch) return null;
            const p = springLockedAt(frame, g.lock, fps, SPRINGS.letter);
            const ox = L.pick(W * 0.04, W * 0.05) + i * L.pick(W * 0.04, W * 0.06);
            const oy = waveTop + (60 + (i % 3) * 70) * u;
            const x = ox + (g.x - ox) * p;
            const y = oy + (g.y - oy) * p;
            const [family, style, weight] = g.font.split("|");
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: x,
                  top: y,
                  fontFamily: family,
                  fontStyle: style,
                  fontWeight: Number(weight),
                  fontSize: g.size,
                  lineHeight: 1,
                  color: g.color,
                  opacity: clamp01((frame - launch) / 4),
                  transform: `translateZ(${(-700 * (1 - p)).toFixed(1)}px) rotateX(${(85 * (1 - p)).toFixed(2)}deg) rotateY(${(-40 * (1 - p)).toFixed(2)}deg)`,
                  textShadow: `0 0 ${(g.size * 0.18).toFixed(1)}px ${rgba(P.opusAmber, 0.45)}`,
                }}
              >
                {g.ch}
              </span>
            );
          })}
        </div>
        <KineticPhrase
          id="L2b"
          offset={S.from}
          x={L.safe + 8 * u}
          y={L.pick(H * 0.47, H * 0.53)}
          width={W * 0.5}
          base={{ font: FONT.code, size: 34, weight: 700, color: P.opusCream, mode: "type", tracking: "0" }}
          overrides={{ coding: { font: FONT.code, size: 34, weight: 700, color: P.opusAmber, mode: "type", tracking: "0" } }}
        />
      </CameraRigContainer>
    </AbsoluteFill>
  );
};

const Wing: React.FC<{ side: "left" | "right"; p: number; word: string; chart: string; frame: number; u: number; w: number; h: number }> = ({ side, p, word, chart, frame, u, w, h }) => {
  const angle = (side === "left" ? 180 : -180) * (1 - p);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        width: w,
        height: h,
        [side === "left" ? "right" : "left"]: "100%",
        transformOrigin: side === "left" ? "100% 50%" : "0% 50%",
        transform: `rotateY(${angle.toFixed(2)}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
        <PanelFace kind={side === "left" ? "tokens" : chart === "bars" ? "spring" : "bars"} frame={frame} u={u} w={w} h={h} />
      </div>
      {/* back face: neo-brutalist type that folds into the chart */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: P.opusAmber,
          color: P.void,
          fontFamily: FONT.astra,
          fontWeight: 700,
          fontSize: h * 0.52,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `${2 * u}px solid ${P.void}`,
        }}
      >
        {word}
      </div>
    </div>
  );
};

const PanelFace: React.FC<{ kind: string; frame: number; u: number; w: number; h: number; glass?: boolean }> = ({ kind, frame, u, w, h, glass }) => {
  const t = (frame - 432) / FPS;
  const inner: React.ReactNode = (() => {
    if (kind === "spring") {
      const pts = Array.from({ length: 60 }, (_, i) => {
        const tt = (i / 59) * 1.4;
        const y = oscillator(tt, 1, 0, SPRINGS.letter);
        return `${(10 + (i / 59) * (w - 20)).toFixed(1)},${(h * 0.55 - y * h * 0.32).toFixed(1)}`;
      }).join(" ");
      const cur = clamp01((t % 1.4) / 1.4);
      const cy = h * 0.55 - oscillator(cur * 1.4, 1, 0, SPRINGS.letter) * h * 0.32;
      return (
        <svg width={w} height={h}>
          <line x1={10} y1={h * 0.55} x2={w - 10} y2={h * 0.55} stroke={rgba(P.opusCream, 0.25)} strokeWidth={1} />
          <polyline points={pts} fill="none" stroke={P.opusAmber} strokeWidth={2.4 * u} />
          <circle cx={10 + cur * (w - 20)} cy={cy} r={5 * u} fill={P.opusCream} />
        </svg>
      );
    }
    if (kind === "bars") {
      return (
        <svg width={w} height={h}>
          {Array.from({ length: 10 }, (_, i) => {
            const beat = Math.floor((frame - 432) / 9) + i;
            const target = 0.25 + 0.7 * Math.abs(Math.sin(beat * 1.7 + i));
            const v = target * springProgress(((frame - 432) % 9) / FPS + 0.05, SPRINGS.letter);
            const bw = (w - 30) / 10;
            return <rect key={i} x={15 + i * bw} y={h * 0.86 - v * h * 0.62} width={bw * 0.66} height={v * h * 0.62} fill={i % 3 ? rgba(P.opusAmber, 0.8) : P.opusCream} />;
          })}
        </svg>
      );
    }
    if (kind === "wave") {
      return (
        <div style={{ padding: 14 * u, transform: `scale(${(u * 0.8).toFixed(3)})`, transformOrigin: "0 50%" }}>
          <AudioWaveformBar bars={22} accentColor={P.opusAmber} duckingActive={false} />
        </div>
      );
    }
    if (kind === "tokens") {
      return (
        <div style={{ padding: 12 * u, fontFamily: FONT.code, fontSize: 13 * u, lineHeight: 1.55, color: rgba(P.opusCream, 0.85) }}>
          {["k 170", "c 26", "m 0.60", "fps 60", "beat 36f"].map((s, i) => (
            <div key={i} style={{ color: i === Math.floor(frame / 9) % 5 ? P.opusAmber : undefined }}>
              {s}
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ padding: 14 * u, fontFamily: FONT.astra, color: P.opusCream }}>
        <div style={{ fontSize: 13 * u, letterSpacing: "0.14em", color: rgba(P.opusCream, 0.6) }}>FRAMES</div>
        <div style={{ fontSize: 46 * u, fontWeight: 700, letterSpacing: "-0.03em" }}>{Math.min(1800, Math.max(0, frame)).toString().padStart(4, "0")}</div>
        <div style={{ fontSize: 13 * u, color: P.opusAmber, fontFamily: FONT.code }}>/ 1800 @ 60 fps</div>
      </div>
    );
  })();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: w,
        height: h,
        borderRadius: 10 * u,
        background: glass ? rgba(P.opusCream, 0.07) : rgba(P.astraDeep, 0.72),
        backdropFilter: glass ? "blur(8px) saturate(1.4)" : undefined,
        border: `${1.2 * u}px solid ${rgba(P.opusCream, 0.32)}`,
        boxShadow: `inset 0 ${1 * u}px 0 ${rgba(P.opusCream, 0.25)}`,
        overflow: "hidden",
      }}
    >
      {inner}
    </div>
  );
};
