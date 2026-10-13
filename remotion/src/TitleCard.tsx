import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TitleCardProps = {
  eyebrow: string;
  /** Use "\n" for deliberate line breaks */
  title: string;
  subtitle: string;
  accent: string;
};

/**
 * A prop-driven animated title card.
 *
 * The whole animation is a pure function of `frame` — no timers, no Date.now().
 * That is what lets Remotion seek to any frame and get identical pixels, which
 * in turn is what makes rendering parallelisable and re-runs reproducible.
 */
export const TitleCard: React.FC<TitleCardProps> = ({
  eyebrow,
  title,
  subtitle,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const unit = Math.min(width, height) / 1080; // scale type with the canvas

  // ── entrance springs ──────────────────────────────────────────────────────
  const ruleSpring = spring({ frame, fps, config: { damping: 200 }, delay: 6 });
  const eyebrowSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 14,
  });
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.9 },
    delay: 20,
  });
  const subtitleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
    delay: 42,
  });

  // ── exit: gentle fade in the final 20 frames ─────────────────────────────
  const exit = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames - 1],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── ambient: slow breathing glow, deterministic from frame ───────────────
  const breathe = Math.sin((frame / fps) * 0.9) * 0.5 + 0.5;
  const glowRadius = interpolate(breathe, [0, 1], [820, 980]);
  const glowAlpha = interpolate(breathe, [0, 1], [0.16, 0.26]);

  const titleLines = title.split("\n");

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0a09", opacity: exit }}>
      {/* warm radial glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle ${glowRadius}px at 50% 44%, rgba(217,169,76,${glowAlpha}) 0%, rgba(11,10,9,0) 70%)`,
        }}
      />

      {/* drifting hairline grid */}
      <AbsoluteFill style={{ opacity: 0.5 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const x = ((i * 160 + frame * 0.35) % (width + 160)) - 160;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: 0,
                width: 1,
                height: "100%",
                background: "rgba(247,241,228,0.045)",
              }}
            />
          );
        })}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 90 * unit,
          textAlign: "center",
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 25 * unit,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: accent,
            opacity: eyebrowSpring,
            transform: `translateY(${interpolate(eyebrowSpring, [0, 1], [14, 0])}px)`,
          }}
        >
          {eyebrow}
        </div>

        {/* accent rule */}
        <div
          style={{
            width: interpolate(ruleSpring, [0, 1], [0, 520 * unit]),
            height: 1,
            marginTop: 30 * unit,
            marginBottom: 34 * unit,
            background: `linear-gradient(90deg, rgba(217,169,76,0) 0%, ${accent} 50%, rgba(217,169,76,0) 100%)`,
          }}
        />

        {/* title */}
        <div
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontWeight: 700,
            fontSize: 104 * unit,
            lineHeight: 1.1,
            letterSpacing: "-0.012em",
            color: "#f7f1e4",
            transform: `translateY(${interpolate(titleSpring, [0, 1], [46, 0])}px) scale(${interpolate(titleSpring, [0, 1], [0.97, 1])})`,
            opacity: titleSpring,
          }}
        >
          {titleLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>

        {/* subtitle */}
        <div
          style={{
            marginTop: 40 * unit,
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 31 * unit,
            letterSpacing: "0.06em",
            color: "rgba(247,241,228,0.72)",
            opacity: subtitleSpring,
            transform: `translateY(${interpolate(subtitleSpring, [0, 1], [18, 0])}px)`,
          }}
        >
          {subtitle}
        </div>
      </AbsoluteFill>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
