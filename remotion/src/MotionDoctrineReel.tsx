import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  computeOversizedCursor,
  cutTheCurveSeam,
  nudgeCurve,
  waterfallEntry,
  zoomThroughSeam,
} from "./engine/seamTransitions";
import { AnamorphicFlare, FilmGrainOverlay } from "./engine/vfxShaders";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * MOTION DOCTRINE SHOWREEL (`MotionDoctrine-Showreel`) — 300 frames (10.0s @ 30fps)
 * Demonstrates the HyperFrames + Remotion Unified Motion Doctrine:
 * - Scene 1 (0..105): Waterfall Entry + Oversized Cursor (7cqw) off-screen entry & click ignition
 * - Seam 1 (Frame 105): Cut-the-Curve velocity-matched X-left seam (`power4.in` -> `power4.out`)
 * - Scene 2 (105..205): Sequenced UI Life + Nudge Curve (10/65/25 group slide)
 * - Seam 2 (Frame 205): Zoom-Through Z-forward push (`d(scale)/dt > 0` on both sides)
 * - Scene 3 (205..300): Stillness-before-climax (0.45s dramatic pause) -> Hero Payoff
 */
export const MotionDoctrineReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // Seam 1 at frame 105 (Cut-the-Curve Left)
  const s1Out = cutTheCurveSeam(frame, 105, "outgoing", { axis: "x", direction: -1 });
  const s1In = cutTheCurveSeam(frame, 105, "incoming", { axis: "x", direction: -1 });

  // Seam 2 at frame 205 (Zoom-Through Z-Push)
  const s2Out = zoomThroughSeam(frame, 205, "outgoing", { inverse: false });
  const s2In = zoomThroughSeam(frame, 205, "incoming", { inverse: false });

  // Oversized Cursor in Scene 1: enters at f=18, arrives f=44, clicks at f=52, exits f=85..105
  const cursor = computeOversizedCursor(frame, {
    enterStartFrame: 18,
    arriveFrame: 44,
    clickFrame: 52,
    exitStartFrame: 85,
    exitEndFrame: 105,
    targetXPercent: 64,
    targetYPercent: 56,
    exitXPercent: -12,
    exitYPercent: 52,
  });

  // Click at frame 52 ignites the morph badge in Scene 1!
  const clickIgnited = spring({
    frame: Math.max(0, frame - 52),
    fps,
    config: { damping: 14, stiffness: 150 },
  });

  // Scene 2 Nudge Curve at frame 145 (slides card group left to reveal telemetry panel)
  const groupSlideX = nudgeCurve(frame, 145, 28, 0, -210);

  // Scene 3 Stillness-Before-Climax (frames 219..233 = 0.45s stillness comma, then f=234 climax!)
  const climaxPop = spring({
    frame: Math.max(0, frame - 234),
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.85 },
  });

  const endFade = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames - 1],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#070B12", opacity: endFade }}>
      {/* SCENE 1 (0..105): Waterfall Entry + Oversized Cursor Click Ignition */}
      {s1Out.visible && (
        <AbsoluteFill
          style={{
            opacity: s1Out.opacity,
            transform: `translateX(${s1Out.translateX.toFixed(1)}px)`,
            filter: s1Out.blurPx > 0.2 ? `blur(${s1Out.blurPx.toFixed(1)}px)` : undefined,
          }}
        >
          <div style={{ position: "absolute", left: 120, top: 185, width: 920 }}>
            {[
              { tag: "LAW 01 // WATERFALL ENTRY + OVERSIZED CURSOR", size: 16, color: "#35D9F2" },
              { tag: "Motion Must Perform,", size: 86, color: "#F3F7F7" },
              { tag: "Never Wobble Idly.", size: 86, color: "#C5F75A" },
            ].map((row, idx) => {
              const wf = waterfallEntry(frame, 6, idx, { staggerFrames: 5, distanceY: 58 });
              return (
                <div
                  key={idx}
                  style={{
                    opacity: wf.opacity,
                    transform: `translateY(${wf.translateY.toFixed(1)}px) scale(${wf.scale.toFixed(3)})`,
                    fontFamily:
                      idx === 0
                        ? "JetBrains Mono, monospace"
                        : "Space Grotesk, Inter, sans-serif",
                    fontSize: row.size,
                    fontWeight: 700,
                    letterSpacing: idx === 0 ? "0.2em" : "-0.04em",
                    lineHeight: 1.04,
                    color: row.color,
                    marginBottom: idx === 0 ? 22 : 6,
                  }}
                >
                  {row.tag}
                </div>
              );
            })}
          </div>

          {/* Interactive Trigger Button Ignited by Cursor Click at Frame 52 */}
          <div
            style={{
              position: "absolute",
              left: "64%",
              top: "56%",
              transform: `translate(-50%, -50%) scale(${cursor.clicking ? 0.94 : 1 + clickIgnited * 0.08})`,
              padding: "26px 44px",
              borderRadius: 18,
              background: frame >= 52 ? "#C5F75A" : "rgba(18, 30, 49, 0.92)",
              border: `2px solid ${frame >= 52 ? "#C5F75A" : "#35D9F2"}`,
              boxShadow:
                frame >= 52
                  ? "0 0 70px rgba(197, 247, 90, 0.55)"
                  : "0 20px 50px rgba(0,0,0,0.5)",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 22,
              fontWeight: 700,
              color: frame >= 52 ? "#070B12" : "#F3F7F7",
              letterSpacing: "0.12em",
            }}
          >
            {frame >= 52 ? "⚡ SEAM VECTOR LOCKED" : "IGNITE VECTOR LEDGER"}
          </div>

          {/* Click Ripple Ring */}
          {cursor.clickRippleProgress > 0 && (
            <div
              style={{
                position: "absolute",
                left: "64%",
                top: "56%",
                width: 120 + cursor.clickRippleProgress * 260,
                height: 120 + cursor.clickRippleProgress * 260,
                borderRadius: "50%",
                border: "2px solid #C5F75A",
                opacity: 1 - cursor.clickRippleProgress,
                transform: "translate(-50%, -50%)",
              }}
            />
          )}

          {/* House 7cqw Oversized macOS Cursor */}
          <div
            style={{
              position: "absolute",
              left: `${cursor.xPercent}%`,
              top: `${cursor.yPercent}%`,
              width: width * 0.07,
              height: width * 0.07,
              transformOrigin: "21% 14%",
              transform: `scale(${cursor.scale.toFixed(3)})`,
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.55))",
              pointerEvents: "none",
              zIndex: 30,
            }}
          >
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path
                d="M5 3L19 12L12 13.5L9 20L5 3Z"
                fill="#FFFFFF"
                stroke="#070B12"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 2 (105..205): Cut-the-Curve Arrival + 10/65/25 Nudge Curve + Zoom-Through Exit */}
      {frame >= 105 && frame < 205 && (
        <AbsoluteFill
          style={{
            opacity: frame < 140 ? s1In.opacity : s2Out.opacity,
            transform: `translateX(${s1In.translateX.toFixed(1)}px) scale(${s2Out.scale.toFixed(3)})`,
            filter:
              Math.max(s1In.blurPx, s2Out.blurPx) > 0.2
                ? `blur(${Math.max(s1In.blurPx, s2Out.blurPx).toFixed(1)}px)`
                : undefined,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 32,
              alignItems: "center",
              transform: `translateX(${groupSlideX.toFixed(1)}px)`,
            }}
          >
            <div
              style={{
                width: 680,
                padding: "48px 54px",
                borderRadius: 24,
                background: "rgba(12, 22, 38, 0.92)",
                border: "1px solid rgba(53,217,242,0.4)",
                boxShadow: "0 30px 90px rgba(0,0,0,0.6)",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 15,
                  color: "#35D9F2",
                  letterSpacing: "0.18em",
                }}
              >
                LAW 02 // CUT-THE-CURVE & 10/65/25 NUDGE
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk, Inter, sans-serif",
                  fontSize: 64,
                  fontWeight: 700,
                  color: "#F3F7F7",
                  lineHeight: 1.0,
                  marginTop: 16,
                  letterSpacing: "-0.035em",
                }}
              >
                Cut at Peak Velocity.
              </div>
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 22,
                  color: "#9CB0C1",
                  marginTop: 18,
                  lineHeight: 1.45,
                }}
              >
                Exit on <code style={{ color: "#C5F75A" }}>power4.in</code>, enter mid-flight on{" "}
                <code style={{ color: "#35D9F2" }}>power4.out</code>. Reposition groups using the
                10/65/25 Nudge Curve.
              </div>
            </div>

            {/* Secondary Card Revealed by Nudge Reposition */}
            <div
              style={{
                width: 420,
                padding: "42px 38px",
                borderRadius: 24,
                background: "rgba(197, 247, 90, 0.1)",
                border: "1px solid rgba(197, 247, 90, 0.55)",
                opacity: interpolate(frame, [148, 168], [0, 1], clamp),
                transform: `translateY(${interpolate(frame, [148, 168], [28, 0], clamp)}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                  color: "#C5F75A",
                  letterSpacing: "0.16em",
                }}
              >
                SEAM GATE AUDIT
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk, Inter, sans-serif",
                  fontSize: 52,
                  fontWeight: 700,
                  color: "#F3F7F7",
                  marginTop: 10,
                }}
              >
                0 ERRORS
              </div>
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 14,
                  color: "#9CB0C1",
                  marginTop: 8,
                }}
              >
                d(scale)/dt SIGN MATCHED ✓
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* SCENE 3 (205..300): Zoom-Through Arrival -> Stillness Comma -> Climax Payoff */}
      {s2In.visible && (
        <AbsoluteFill
          style={{
            opacity: s2In.opacity,
            transform: `scale(${s2In.scale.toFixed(3)})`,
            filter: s2In.blurPx > 0.2 ? `blur(${s2In.blurPx.toFixed(1)}px)` : undefined,
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {frame >= 234 && (
            <AnamorphicFlare
              xPercent={50}
              yPercent={50}
              color="#C5F75A"
              secondaryColor="#35D9F2"
              intensity={1.1}
            />
          )}

          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 16,
              color: "#35D9F2",
              letterSpacing: "0.24em",
              marginBottom: 20,
            }}
          >
            {frame < 234
              ? "LAW 03 // 0.45S STILLNESS BEFORE CLIMAX..."
              : "LAW 03 // EARNED HERO PAYOFF"}
          </div>

          <div
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontSize: frame >= 234 ? 112 : 76,
              fontWeight: 700,
              color: "#F3F7F7",
              letterSpacing: "-0.045em",
              lineHeight: 0.96,
              transform: `scale(${frame >= 234 ? interpolate(climaxPop, [0, 1], [0.86, 1]) : 1})`,
            }}
          >
            {frame < 234 ? (
              "Hold the Breath."
            ) : (
              <>
                ONE CONTINUOUS
                <br />
                <span style={{ color: "#C5F75A" }}>CAMERA JOURNEY.</span>
              </>
            )}
          </div>
        </AbsoluteFill>
      )}

      <FilmGrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
