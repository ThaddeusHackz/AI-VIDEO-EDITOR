import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRigContainer, useCameraRig } from "./engine/cameraRig";
import {
  AnamorphicFlare,
  CyberHUDTracker,
  FilmGrainOverlay,
  ParticleField3D,
  ShatterDebris3D,
  VolumetricGodrays,
} from "./engine/vfxShaders";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * VFX & CGI Multi-Pass Compositor Suite (`VFX-CGI-Compositor`)
 * Demonstrates progressive VFX pass compositing:
 * - Pass 01 (0..55): 3D Camera Matchmove & Wireframe Grid Plate
 * - Pass 02 (55..115): Volumetric Godrays & Deep Particle Simulation
 * - Pass 03 (115..180): Bullet-Time Shatter Physics + Anamorphic Lens Flare
 * - Pass 04 (180..240): Final Graded Master + CGI Telemetry Lock
 */
export const VFXCompositorSuite: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const passIndex =
    frame < 55 ? 1 : frame < 115 ? 2 : frame < 180 ? 3 : 4;
  const passNames = [
    "PASS 01 // CAMERA MATCHMOVE & WIREFRAME PLATE",
    "PASS 02 // VOLUMETRIC LIGHTING & PARTICLE SIM",
    "PASS 03 // BULLET-TIME SHATTER & ANAMORPHIC FLARE",
    "PASS 04 // FINAL GRADED CGI MASTER COMPOSITE",
  ];

  const rig = useCameraRig({
    preset: frame >= 115 && frame < 185 ? "bullet-time" : "orbit-360",
    startFrame: frame >= 115 && frame < 185 ? 115 : 0,
    durationInFrames: frame >= 115 && frame < 185 ? 70 : 240,
    intensity: 0.95,
  });

  const outFade = interpolate(
    frame,
    [durationInFrames - 16, durationInFrames - 1],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#050811", opacity: outFade }}>
      <CameraRigContainer rig={rig}>
        {/* PASS 1: Perspective Horizon Grid & Matchmove Markers */}
        <AbsoluteFill>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#35D9F2" stopOpacity="0.05" />
                <stop offset="50%" stopColor="#35D9F2" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#C5F75A" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Perspective floor radial lines */}
            {Array.from({ length: 17 }).map((_, i) => {
              const norm = (i - 8) / 8;
              return (
                <line
                  key={`rad-${i}`}
                  x1={width * 0.5 + norm * 180}
                  y1={height * 0.54}
                  x2={width * 0.5 + norm * 1350}
                  y2={height}
                  stroke="url(#gridGrad)"
                  strokeWidth={1.4}
                />
              );
            })}

            {/* Perspective horizontal depth lines */}
            {Array.from({ length: 10 }).map((_, i) => {
              const p = Math.pow((i + ((frame * 0.04) % 1)) / 10, 1.75);
              const y = height * 0.54 + p * (height * 0.46);
              return (
                <line
                  key={`hz-${i}`}
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#35D9F2"
                  strokeOpacity={0.12 + p * 0.35}
                  strokeWidth={1.2}
                />
              );
            })}

            {/* Matchmove + tracking crosses */}
            {Array.from({ length: 12 }).map((_, i) => {
              const cx = 260 + ((i % 4) * 460) + Math.sin(frame * 0.03 + i) * 18;
              const cy = 220 + Math.floor(i / 4) * 300;
              return (
                <g key={`mm-${i}`} stroke="#C5F75A" strokeWidth={1.5} opacity={0.7}>
                  <line x1={cx - 8} y1={cy} x2={cx + 8} y2={cy} />
                  <line x1={cx} y1={cy - 8} x2={cx} y2={cy + 8} />
                </g>
              );
            })}
          </svg>
        </AbsoluteFill>

        {/* PASS 2+: Volumetric Godrays & 3D Particle Simulation */}
        {passIndex >= 2 && (
          <>
            <VolumetricGodrays
              originXPercent={50}
              originYPercent={46}
              color="#35D9F2"
              rayCount={18}
              opacity={0.34}
            />
            <ParticleField3D
              count={110}
              seed={777}
              color="#35D9F2"
              secondaryColor="#FFB23F"
              speedZ={8.5 * rig.timeScale}
            />
          </>
        )}

        {/* Central CGI Reactor Core */}
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              width: 250,
              height: 250,
              borderRadius: "50%",
              border: "2px solid rgba(53,217,242,0.8)",
              boxShadow:
                passIndex >= 2
                  ? "0 0 90px rgba(53,217,242,0.55), inset 0 0 50px rgba(197,247,90,0.35)"
                  : "none",
              background:
                passIndex >= 2
                  ? "radial-gradient(circle at 38% 35%, #FFFFFF 0%, #35D9F2 35%, #071324 78%)"
                  : "transparent",
              transform: `rotate(${frame * 1.8}deg) scale(${frame >= 115 ? 1.12 : 1})`,
            }}
          />
        </AbsoluteFill>

        {/* PASS 3+: 3D Crystalline Shatter Debris + Anamorphic Lens Flare */}
        {passIndex >= 3 && (
          <>
            <ShatterDebris3D
              triggerFrame={115}
              shardCount={42}
              timeScale={rig.timeScale}
              accentColor="#35D9F2"
            />
            <AnamorphicFlare
              xPercent={50}
              yPercent={50}
              color="#35D9F2"
              secondaryColor="#FFB23F"
              intensity={1.15}
            />
          </>
        )}

        {/* CGI Object Trackers */}
        <CyberHUDTracker
          xPercent={50}
          yPercent={50}
          label="CGI CORE // RIGID-BODY SIM"
          sublabel={`TIMESCALE ${(rig.timeScale * 100).toFixed(0)}%`}
          color="#35D9F2"
        />
      </CameraRigContainer>

      {/* Top Compositor Breakdown HUD Bar */}
      <div
        style={{
          position: "absolute",
          top: 48,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 26px",
          background: "rgba(7, 11, 18, 0.86)",
          border: "1px solid rgba(53, 217, 242, 0.35)",
          borderRadius: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              fontWeight: 700,
              color: "#C5F75A",
              letterSpacing: "0.18em",
            }}
          >
            {passNames[passIndex - 1]}
          </div>
          <div
            style={{
              fontFamily: "Space Grotesk, Inter, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#F3F7F7",
              marginTop: 4,
            }}
          >
            Multi-Pass VFX & Procedural CGI Pipeline
          </div>
        </div>

        {/* Pass Progress Pills */}
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3, 4].map((p) => {
            const active = p <= passIndex;
            return (
              <div
                key={p}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 13,
                  fontWeight: 700,
                  background: active ? "#35D9F2" : "rgba(255,255,255,0.06)",
                  color: active ? "#050811" : "#9CB0C1",
                }}
              >
                PASS 0{p}
              </div>
            );
          })}
        </div>
      </div>

      <FilmGrainOverlay opacity={passIndex === 4 ? 0.055 : 0.025} />
    </AbsoluteFill>
  );
};
