import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32 } from "../../engine/cameraRig";
import { P, phrase, rgba } from "../data";
import { useLayout } from "../layout";
import { clamp01, ease, springProgress, SPRINGS } from "../physics/springs";

/**
 * Cinematic-embed captions (captions-overlay, Cinematic mode): no subtitle rail. Every VO word is designed type that
 * enters on its MEASURED start frame (vo-words.json). One hero embed per beat at most — the per-phrase designs live
 * in the shots that own them.
 */
export type WordMode = "rise" | "type" | "pen" | "burn" | "slam" | "crystal" | "ghost";

export interface WordStyle {
  font?: string;
  size?: number;
  weight?: number;
  italic?: boolean;
  color?: string;
  glow?: string;
  mode?: WordMode;
  tracking?: string;
  breakBefore?: boolean;
  stroke?: string;
}

const FONT = {
  opus: '"Cormorant Garamond", Georgia, serif',
  astra: '"Space Grotesk", Inter, sans-serif',
  code: '"JetBrains Mono", monospace',
  ui: "Inter, sans-serif",
};
export { FONT };

const norm = (w: string) => w.replace(/[.,!?…]/g, "").toLowerCase();

export const KineticPhrase: React.FC<{
  id: string;
  x: number;
  y: number;
  width: number;
  align?: "left" | "right" | "center";
  base: WordStyle;
  overrides?: Record<string, WordStyle>;
  /** Absolute frame where the phrase starts leaving (null = it leaves with its shot). */
  exitAt?: number | null;
  exitFrames?: number;
  /** Absolute frame offset of the enclosing Sequence (shot.from). */
  offset: number;
  lead?: number;
  lineHeight?: number;
  /** Render only words from this index on (a phrase that spans a cut continues in the next shot). */
  skip?: number;
}> = ({ id, x, y, width, align = "left", base, overrides = {}, exitAt = null, exitFrames = 14, offset, lead = 2, lineHeight = 1.04, skip = 0 }) => {
  const frame = useCurrentFrame() + offset;
  const { fps } = useVideoConfig();
  const { u } = useLayout();
  const full = phrase(id);
  const ph = { ...full, words: full.words.slice(skip), startFrame: full.words[Math.min(skip, full.words.length - 1)].startFrame };
  const exitP = exitAt === null ? 0 : clamp01((frame - (exitAt - exitFrames)) / exitFrames);
  if (frame < ph.startFrame - lead - 2 || exitP >= 1) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "baseline",
        justifyContent: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center",
        columnGap: `${0.26}em`,
        rowGap: 0,
        lineHeight,
        fontSize: (base.size ?? 60) * u,
        opacity: 1 - ease.in4(exitP),
        filter: exitP > 0 ? `blur(${(exitP * 10).toFixed(2)}px)` : undefined,
        transform: exitP > 0 ? `translateY(${(-26 * u * ease.in4(exitP)).toFixed(2)}px)` : undefined,
      }}
    >
      {ph.words.map((w, i) => {
        const st: WordStyle = { ...base, ...(overrides[norm(w.text)] ?? {}) };
        const local = frame - (w.startFrame - lead);
        return (
          <React.Fragment key={i}>
            {st.breakBefore ? <div style={{ flexBasis: "100%", height: 0 }} /> : null}
            <AnimatedWord text={w.text} local={local} fps={fps} st={st} u={u} seed={i * 97 + id.length} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const AnimatedWord: React.FC<{ text: string; local: number; fps: number; st: WordStyle; u: number; seed: number }> = ({
  text,
  local,
  fps,
  st,
  u,
  seed,
}) => {
  const mode = st.mode ?? "rise";
  const size = (st.size ?? 60) * u;
  const font = st.font ?? FONT.opus;
  const color = st.color ?? P.opusCream;
  const glow = st.glow;
  const common: React.CSSProperties = {
    display: "inline-block",
    fontFamily: font,
    fontSize: size,
    fontWeight: st.weight ?? 500,
    fontStyle: st.italic ? "italic" : "normal",
    letterSpacing: st.tracking ?? "-0.01em",
    color,
    whiteSpace: "pre",
    textShadow: glow ? `0 0 ${0.35 * size}px ${glow}, 0 0 ${0.08 * size}px ${glow}` : undefined,
    WebkitTextStroke: st.stroke,
  };
  if (local < 0) return <span style={{ ...common, visibility: "hidden" }}>{text}</span>;
  const t = local / fps;

  if (mode === "type") {
    const n = Math.min(text.length, Math.floor(local / 1.6) + 1);
    const typing = n < text.length;
    return (
      <span style={{ ...common, position: "relative" }}>
        <span style={{ visibility: "hidden" }}>{text}</span>
        <span style={{ position: "absolute", left: 0, top: 0 }}>
          {text.slice(0, n)}
          {typing ? <span style={{ display: "inline-block", width: "0.55em", height: "0.95em", marginLeft: "0.05em", verticalAlign: "-0.12em", background: P.opusAmber, opacity: 0.9 }} /> : null}
        </span>
      </span>
    );
  }

  if (mode === "pen") {
    const p = clamp01(local / 26);
    const fill = clamp01((local - 18) / 10);
    const L = 2600;
    return (
      <span style={{ ...common, position: "relative" }}>
        <span style={{ visibility: "hidden" }}>{text}</span>
        <svg style={{ position: "absolute", left: 0, top: -size * 0.32, overflow: "visible" }} width={size * text.length * 0.6} height={size * 1.4}>
          <text
            x={0}
            y={size * 1.0}
            style={{ fontFamily: font, fontSize: size, fontWeight: st.weight ?? 500, fontStyle: st.italic ? "italic" : "normal", letterSpacing: st.tracking ?? "-0.01em" }}
            fill={rgba(color.startsWith("#") ? color : P.opusAmber, fill)}
            stroke={color.startsWith("#") ? color : P.opusAmber}
            strokeWidth={1.6 * u}
            strokeDasharray={L}
            strokeDashoffset={L * (1 - ease.out4(p))}
          >
            {text}
          </text>
        </svg>
      </span>
    );
  }

  if (mode === "burn") {
    const p = clamp01(local / 11);
    const edge = 100 - p * 100;
    return (
      <span
        style={{
          ...common,
          clipPath: `inset(-20% ${edge.toFixed(2)}% -20% -5%)`,
          textShadow: `0 0 ${(0.5 * size * (1 - p) + 0.12 * size).toFixed(1)}px ${rgba(P.opusEmber, 0.9 * (1 - p) + 0.25)}, 0 0 ${0.3 * size}px ${glow ?? rgba(P.astraCyan, 0.35)}`,
          transform: `translateX(${((1 - ease.out4(p)) * -0.15 * size).toFixed(2)}px)`,
        }}
      >
        {text}
      </span>
    );
  }

  if (mode === "slam") {
    const s = springProgress(t, SPRINGS.letter);
    const scale = 1 + 1.3 * (1 - s);
    return (
      <span
        style={{
          ...common,
          opacity: clamp01(local / 3),
          transform: `scale(${scale.toFixed(4)}) rotateX(${((1 - s) * 50).toFixed(2)}deg)`,
          transformOrigin: "50% 60%",
          filter: local < 6 ? `blur(${((6 - local) * 1.4).toFixed(2)}px)` : undefined,
        }}
      >
        {text}
      </span>
    );
  }

  if (mode === "crystal") {
    const rand = mulberry32(seed + 11);
    return (
      <span style={{ ...common }}>
        {text.split("").map((ch, k) => {
          const d = Math.floor(rand() * 9);
          const lp = clamp01((local - d) / 5);
          const flash = lp > 0 && lp < 1 ? 1 : 0;
          return (
            <span
              key={k}
              style={{
                display: "inline-block",
                opacity: lp,
                transform: `translateY(${((1 - ease.out4(lp)) * -0.25 * size).toFixed(2)}px) scale(${(0.6 + 0.4 * ease.out4(lp)).toFixed(3)})`,
                color: flash ? P.astraIce : color,
              }}
            >
              {ch}
            </span>
          );
        })}
      </span>
    );
  }

  if (mode === "ghost") {
    const p = clamp01(local / 14);
    return (
      <span style={{ ...common, color: "transparent", WebkitTextStroke: `${(1.4 * u).toFixed(2)}px ${rgba(P.opusCream, 0.55 * p)}`, opacity: p }}>
        {text}
      </span>
    );
  }

  // rise-and-focus (default): closed-form spring lift + defocus pull
  const s = springProgress(t, SPRINGS.letter);
  return (
    <span
      style={{
        ...common,
        opacity: clamp01(local / 5),
        transform: `translateY(${((1 - s) * 0.42 * size).toFixed(2)}px)`,
        filter: local < 9 ? `blur(${((9 - local) * 1.1).toFixed(2)}px)` : undefined,
      }}
    >
      {text}
    </span>
  );
};
