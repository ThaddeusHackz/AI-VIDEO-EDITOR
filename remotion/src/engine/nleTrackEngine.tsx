import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type LUTGradePreset =
  | "teal-orange-cinema"
  | "editorial-film"
  | "cyber-neon"
  | "clean-studio";

export function getLUTFilterString(preset: LUTGradePreset): string {
  switch (preset) {
    case "teal-orange-cinema":
      return "contrast(1.12) saturate(1.18) brightness(1.02)";
    case "editorial-film":
      return "contrast(1.04) saturate(0.88) sepia(0.08) brightness(1.03)";
    case "cyber-neon":
      return "contrast(1.22) saturate(1.32) hue-rotate(-6deg)";
    case "clean-studio":
    default:
      return "contrast(1.03) saturate(1.04)";
  }
}

export interface WordCaptionToken {
  text: string;
  startSec: number;
  endSec: number;
  mode?: "drop" | "rail" | "embed";
  emphasis?: boolean;
}

/**
 * CAPTION RAIL & EMBED OVERLAY (`captions-overlay` skill).
 * - `drop` tokens are omitted (filler words).
 * - `rail` tokens render in the bottom verbatim rail (~7% from bottom) with active-word pop.
 * - `embed` tokens render as scarce, giant headline typography behind the subject focal layer!
 */
export const CaptionRailOverlay: React.FC<{
  tokens: WordCaptionToken[];
  accentColor?: string;
  renderLayer: "embed-behind" | "rail-front";
}> = ({ tokens, accentColor = "#C5F75A", renderLayer }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowSec = frame / fps;

  if (renderLayer === "embed-behind") {
    const activeEmbed = tokens.find(
      (t) => t.mode === "embed" && nowSec >= t.startSec - 0.08 && nowSec <= t.endSec + 0.35,
    );
    if (!activeEmbed) return null;
    const localFrame = Math.max(0, (nowSec - activeEmbed.startSec) * fps);
    const pop = spring({
      frame: localFrame,
      fps,
      config: { damping: 16, stiffness: 160, mass: 0.8 },
    });
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: "Space Grotesk, Inter, sans-serif",
            fontWeight: 800,
            fontSize: 210,
            letterSpacing: "-0.055em",
            textTransform: "uppercase",
            color: "rgba(243, 247, 247, 0.14)",
            WebkitTextStroke: `2px ${accentColor}66`,
            transform: `translateY(${interpolate(pop, [0, 1], [48, -24])}px) scale(${interpolate(pop, [0, 1], [0.88, 1.02])})`,
            opacity: pop,
            userSelect: "none",
          }}
        >
          {activeEmbed.text}
        </div>
      </AbsoluteFill>
    );
  }

  // Rail layer: group non-dropped words into 4-word phrases
  const railTokens = tokens.filter((t) => t.mode !== "drop");
  const chunkSize = 5;
  let activeChunk: WordCaptionToken[] = [];
  for (let i = 0; i < railTokens.length; i += chunkSize) {
    const slice = railTokens.slice(i, i + chunkSize);
    const start = slice[0].startSec;
    const end = slice[slice.length - 1].endSec;
    if (nowSec >= start - 0.05 && nowSec <= end + 0.18) {
      activeChunk = slice;
      break;
    }
  }

  if (activeChunk.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "6.5%",
        transform: "translateX(-50%)",
        padding: "12px 26px",
        borderRadius: 999,
        background: "rgba(7, 11, 18, 0.82)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {activeChunk.map((w, idx) => {
        const isCurrent = nowSec >= w.startSec && nowSec <= w.endSec;
        const isHighlight = isCurrent || w.emphasis;
        return (
          <span
            key={idx}
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontWeight: isHighlight ? 700 : 500,
              fontSize: 30,
              letterSpacing: "-0.015em",
              color: isCurrent ? accentColor : w.emphasis ? "#35D9F2" : "#F3F7F7",
              transform: isCurrent ? "scale(1.08)" : "scale(1)",
              display: "inline-block",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/**
 * KINETIC LOWER THIRD — Footage-independent broadcast overlay card.
 */
export const KineticLowerThird: React.FC<{
  startFrame: number;
  endFrame: number;
  kicker: string;
  name: string;
  role: string;
  accentColor?: string;
}> = ({ startFrame, endFrame, kicker, name, role, accentColor = "#35D9F2" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < startFrame || frame > endFrame) return null;

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 20, stiffness: 140 },
  });
  const exit = interpolate(frame, [endFrame - 12, endFrame], [1, 0], clamp);
  const visibility = enter * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: 84,
        bottom: 136,
        opacity: visibility,
        transform: `translateX(${interpolate(enter, [0, 1], [-48, 0])}px)`,
        display: "flex",
        alignItems: "stretch",
        background: "rgba(7, 11, 18, 0.88)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ width: 6, background: accentColor }} />
      <div style={{ padding: "16px 26px" }}>
        <div
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: accentColor,
            textTransform: "uppercase",
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontFamily: "Space Grotesk, Inter, sans-serif",
            fontSize: 30,
            fontWeight: 700,
            color: "#F3F7F7",
            marginTop: 4,
            letterSpacing: "-0.02em",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            color: "#9CB0C1",
            marginTop: 2,
          }}
        >
          {role}
        </div>
      </div>
    </div>
  );
};

/**
 * AUDIO WAVEFORM & VO DUCKING METER — Visualizes multi-track audio bus & sidechain ducking.
 */
export const AudioWaveformBar: React.FC<{
  bars?: number;
  duckingActive?: boolean;
  accentColor?: string;
}> = ({ bars = 32, duckingActive = false, accentColor = "#35D9F2" }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, height: 42 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const wave =
          Math.abs(Math.sin(frame * 0.24 + i * 0.45)) * 0.65 +
          Math.abs(Math.cos(frame * 0.13 - i * 0.2)) * 0.35;
        const heightPct = Math.max(0.15, wave * (duckingActive ? 0.45 : 1.0));
        return (
          <div
            key={i}
            style={{
              width: 4,
              height: `${Math.round(heightPct * 100)}%`,
              borderRadius: 2,
              background: duckingActive ? "#9CB0C1" : accentColor,
              opacity: duckingActive ? 0.65 : 0.95,
            }}
          />
        );
      })}
    </div>
  );
};
