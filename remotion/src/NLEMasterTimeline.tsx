import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  AudioWaveformBar,
  CaptionRailOverlay,
  getLUTFilterString,
  KineticLowerThird,
  WordCaptionToken,
} from "./engine/nleTrackEngine";
import { cutTheCurveSeam } from "./engine/seamTransitions";
import { FilmGrainOverlay } from "./engine/vfxShaders";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const DEMO_CAPTIONS: WordCaptionToken[] = [
  { text: "Every", startSec: 0.2, endSec: 0.6, mode: "rail" },
  { text: "frame", startSec: 0.6, endSec: 1.0, mode: "rail", emphasis: true },
  { text: "is", startSec: 1.0, endSec: 1.3, mode: "rail" },
  { text: "timed", startSec: 1.3, endSec: 1.8, mode: "rail" },
  { text: "to", startSec: 1.8, endSec: 2.0, mode: "rail" },
  { text: "PRECISION", startSec: 2.0, endSec: 3.1, mode: "embed", emphasis: true },
  { text: "word-level", startSec: 3.1, endSec: 3.7, mode: "rail", emphasis: true },
  { text: "transcripts", startSec: 3.7, endSec: 4.3, mode: "rail" },
  { text: "drive", startSec: 4.3, endSec: 4.7, mode: "rail" },
  { text: "overlays,", startSec: 4.7, endSec: 5.3, mode: "rail" },
  { text: "J-cuts,", startSec: 5.3, endSec: 5.9, mode: "rail", emphasis: true },
  { text: "and", startSec: 5.9, endSec: 6.2, mode: "rail" },
  { text: "CINEMA", startSec: 6.2, endSec: 7.4, mode: "embed", emphasis: true },
  { text: "color", startSec: 6.8, endSec: 7.3, mode: "rail" },
  { text: "grades.", startSec: 7.3, endSec: 7.9, mode: "rail", emphasis: true },
];

/**
 * NLE MASTER TIMELINE EDITOR (`NLE-Master-Editor`) — 240 frames (8.0s @ 30fps)
 * Demonstrates the complete Non-Linear Video Editing & Talking-Head Recut pipeline:
 * - Track 0: Graded A-Roll Plate + B-Roll Cutaway at frame 120 via `cut-the-curve`
 * - Track 1: Behind-Subject Scarce `Embed` Climax Typography (`PRECISION`, `CINEMA`)
 * - Track 2: Foreground Subject / Focal Card + Footage-Independent Contrast Scrim
 * - Track 3: Broadcast `KineticLowerThird` + Multi-Track Timeline Inspector HUD
 * - Track 4: Bottom Verbatim `Rail` Captions + Sidechain Voiceover Ducking Meter
 */
export const NLEMasterTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sec = frame / fps;

  const isBRoll = frame >= 120;
  const aRollSeam = cutTheCurveSeam(frame, 120, "outgoing", { axis: "x", direction: -1 });
  const bRollSeam = cutTheCurveSeam(frame, 120, "incoming", { axis: "x", direction: -1 });

  const outFade = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames - 1],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#070B12",
        filter: getLUTFilterString("teal-orange-cinema"),
        opacity: outFade,
      }}
    >
      {/* TRACK 0: A-Roll / B-Roll Background Plate */}
      {aRollSeam.visible && (
        <AbsoluteFill
          style={{
            opacity: aRollSeam.opacity,
            transform: `translateX(${aRollSeam.translateX.toFixed(1)}px)`,
            background:
              "radial-gradient(circle 950px at 50% 42%, rgba(53,217,242,0.22) 0%, rgba(11,20,34,0.95) 68%, #070B12 100%)",
          }}
        />
      )}
      {bRollSeam.visible && (
        <AbsoluteFill
          style={{
            opacity: bRollSeam.opacity,
            transform: `translateX(${bRollSeam.translateX.toFixed(1)}px)`,
            background:
              "radial-gradient(circle 950px at 50% 42%, rgba(255,178,63,0.22) 0%, rgba(15,24,40,0.95) 68%, #070B12 100%)",
          }}
        />
      )}

      {/* TRACK 1: Behind-Subject Scarce `Embed` Climax Word (`captions-overlay` law) */}
      <CaptionRailOverlay
        tokens={DEMO_CAPTIONS}
        accentColor="#C5F75A"
        renderLayer="embed-behind"
      />

      {/* TRACK 2: Foreground Focal Subject Card (Occludes the Behind-Subject Embed!) */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            width: 820,
            padding: "42px 52px",
            borderRadius: 24,
            background: "rgba(9, 15, 26, 0.88)",
            border: `1.5px solid ${isBRoll ? "#FFB23F88" : "#35D9F288"}`,
            boxShadow: "0 35px 95px rgba(0,0,0,0.68)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: isBRoll ? "#FFB23F" : "#35D9F2",
              }}
            >
              {isBRoll
                ? "TRACK 01 // B-ROLL PROOF CUTAWAY (J-CUT AUDIO)"
                : "TRACK 00 // A-ROLL PRIMARY PLATE (PARAKEET ASR SYNC)"}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                color: "#C5F75A",
              }}
            >
              TC 00:00:0{sec.toFixed(2)}
            </span>
          </div>

          <div
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontSize: 56,
              fontWeight: 700,
              color: "#F3F7F7",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {isBRoll
              ? "LUT Color Grade + Sidechain VO Ducking"
              : "Frame-Exact NLE Compositing & Recut"}
          </div>

          {/* Multi-Track NLE Timeline Visualizer Bars */}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { name: "T4 CAPTIONS RAIL", color: "#C5F75A", left: "4%", width: "92%" },
              { name: "T3 LOWER-THIRDS", color: "#35D9F2", left: "8%", width: "44%" },
              { name: "T1 B-ROLL CUTAWAY", color: "#FFB23F", left: "50%", width: "46%" },
              { name: "T0 A-ROLL MASTER", color: "#427EFF", left: "0%", width: "100%" },
            ].map((tr, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 11,
                  color: "#9CB0C1",
                }}
              >
                <div style={{ width: 145 }}>{tr.name}</div>
                <div
                  style={{
                    flex: 1,
                    height: 14,
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 4,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: tr.left,
                      width: tr.width,
                      top: 2,
                      bottom: 2,
                      background: tr.color,
                      borderRadius: 3,
                      opacity: 0.82,
                    }}
                  />
                  {/* Playhead */}
                  <div
                    style={{
                      position: "absolute",
                      left: `${(frame / durationInFrames) * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background: "#FFFFFF",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>

      {/* TRACK 3: Broadcast Lower-Third Overlay */}
      <KineticLowerThird
        startFrame={14}
        endFrame={114}
        kicker="AI VIDEO EDITOR // NLE ENGINE"
        name="Deterministic Multi-Track Studio"
        role="Parakeet Word-Sync · LUT Color Grade · -16 LUFS Broadcast Mix"
        accentColor="#35D9F2"
      />

      {/* Audio Bus + Sidechain Ducking Meter (Top Right) */}
      <div
        style={{
          position: "absolute",
          top: 44,
          right: 64,
          padding: "12px 20px",
          borderRadius: 12,
          background: "rgba(7,11,18,0.85)",
          border: "1px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ fontFamily: "JetBrains Mono, monospace" }}>
          <div style={{ fontSize: 11, color: "#C5F75A", fontWeight: 700 }}>
            VO BUS -16 LUFS
          </div>
          <div style={{ fontSize: 10, color: "#9CB0C1", marginTop: 2 }}>
            BGM DUCK: -14dB ACTIVE
          </div>
        </div>
        <AudioWaveformBar bars={20} duckingActive={false} accentColor="#35D9F2" />
      </div>

      {/* TRACK 4: Bottom Verbatim Caption Rail (`captions-overlay` law) */}
      <CaptionRailOverlay
        tokens={DEMO_CAPTIONS}
        accentColor="#C5F75A"
        renderLayer="rail-front"
      />

      <FilmGrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
