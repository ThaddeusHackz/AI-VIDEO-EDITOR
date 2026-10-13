import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ScriptureCardProps = {
  reference: string;
  /** Each string is one revealed line of the verse */
  lines: string[];
  translation: string;
  /** Seconds between each line's reveal */
  lineDelaySeconds?: number;
};

/**
 * Animated scripture card — the verse body reveals line by line, timed from
 * `frame`, so it stays in exact sync with any narration mixed underneath.
 * Matches the Servant of Jesus visual language (Cinzel + Cormorant Garamond).
 */
export const ScriptureCard: React.FC<ScriptureCardProps> = ({
  reference,
  lines,
  translation,
  lineDelaySeconds = 1.1,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const unit = Math.min(width, height) / 1080;

  const ease = (delayFrames: number, cfg = { damping: 200 }) =>
    spring({ frame, fps, config: cfg, delay: delayFrames });

  const cardIn = ease(4);
  const ruleIn = ease(16);
  const refIn = ease(22);
  const out = interpolate(
    frame,
    [durationInFrames - 22, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a09" }}>
      {/* backplate texture */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle 900px at 50% 30%, rgba(217,169,76,0.20) 0%, rgba(11,10,9,0) 72%)",
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 120 * unit,
          opacity: out,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1180 * unit,
            padding: `${52 * unit}px ${64 * unit}px ${58 * unit}px`,
            borderRadius: 6 * unit,
            border: `1px solid rgba(217,169,76,0.34)`,
            background: "rgba(10,9,8,0.72)",
            textAlign: "center",
            opacity: cardIn,
            transform: `translateY(${interpolate(cardIn, [0, 1], [30, 0])}px) scale(${interpolate(cardIn, [0, 1], [0.97, 1])})`,
          }}
        >
          {/* top rule */}
          <div
            style={{
              height: 1,
              width: "100%",
              transform: `scaleX(${ruleIn})`,
              background:
                "linear-gradient(90deg, rgba(217,169,76,0) 0%, rgba(217,169,76,0.8) 50%, rgba(217,169,76,0) 100%)",
            }}
          />

          {/* reference */}
          <div
            style={{
              margin: `${26 * unit}px 0 ${30 * unit}px`,
              fontFamily: "Cinzel, Georgia, serif",
              fontWeight: 700,
              fontSize: 30 * unit,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#d9a94c",
              opacity: refIn,
            }}
          >
            {reference}
          </div>

          {/* verse body, line by line */}
          <div>
            {lines.map((line, i) => {
              const s = ease(Math.round(26 + i * lineDelaySeconds * fps));
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: "Cormorant Garamond, Georgia, serif",
                    fontSize: 50 * unit,
                    lineHeight: 1.44,
                    color: "#f7f1e4",
                    opacity: s,
                    transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                  }}
                >
                  {line}
                </div>
              );
            })}
          </div>

          {/* bottom rule + translation */}
          <div
            style={{
              marginTop: 38 * unit,
              height: 1,
              width: "100%",
              transform: `scaleX(${ruleIn})`,
              background:
                "linear-gradient(90deg, rgba(217,169,76,0) 0%, rgba(217,169,76,0.8) 50%, rgba(217,169,76,0) 100%)",
            }}
          />
          <div
            style={{
              marginTop: 18 * unit,
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: 17 * unit,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(247,241,228,0.42)",
              opacity: refIn,
            }}
          >
            King James Version
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
