import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32 } from "./cameraRig";
import { PlasmaLightningCGI } from "./cinemaStudio4";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type HiggsfieldEffectName =
  | "Set On Fire"
  | "Thunder God"
  | "Turning Metal"
  | "Melting"
  | "Disintegration"
  | "Levitation"
  | "Earth Zoom Out"
  | "Clone Explosion"
  | "Powder Explosion"
  | "Luminous Gaze"
  | "Shadow Smoke"
  | "X-Ray Wireframe"
  | "Northern Lights";

export type HiggsfieldOfficialMix =
  | "Thunder God + Levitation"
  | "Turning Metal + Thunder God"
  | "Building Explosion + Disintegration"
  | "Flying + Set On Fire"
  | "Melting + Turning Metal";

/**
 * Resolves an official Higgsfield 2-effect Mix into its constituent effect layers.
 */
export function resolveHiggsfieldMix(mix: HiggsfieldOfficialMix): HiggsfieldEffectName[] {
  switch (mix) {
    case "Thunder God + Levitation":
      return ["Thunder God", "Levitation"];
    case "Turning Metal + Thunder God":
      return ["Turning Metal", "Thunder God"];
    case "Building Explosion + Disintegration":
      return ["Powder Explosion", "Disintegration"];
    case "Flying + Set On Fire":
      return ["Levitation", "Set On Fire"];
    case "Melting + Turning Metal":
      return ["Melting", "Turning Metal"];
  }
}

/**
 * HIGGSFIELD EFFECTS MIX COMPOSITOR (`<HiggsfieldEffectsMix />`)
 * Stacks up to 3 cinematic VFX effects in a single shot (from Higgsfield Effects & Pack 5).
 */
export const HiggsfieldEffectsMix: React.FC<{
  effects: HiggsfieldEffectName[];
  triggerFrame?: number;
  intensity?: number;
  /** Optional brand palette [primary, secondary, ash] for Thunder God bolts and Disintegration ash. Defaults keep the original cyan/lime/slate look. */
  accentColors?: [string, string, string?];
  children: React.ReactNode;
}> = ({ effects, triggerFrame = 0, intensity = 1, accentColors, children }) => {
  const accentA = accentColors?.[0] ?? "#35D9F2";
  const accentB = accentColors?.[1] ?? "#C5F75A";
  const ash = accentColors?.[2] ?? "#9CB0C1";
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - triggerFrame);
  const active = spring({
    frame: relFrame,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const hasFire = effects.includes("Set On Fire");
  const hasThunder = effects.includes("Thunder God");
  const hasMetal = effects.includes("Turning Metal");
  const hasMelting = effects.includes("Melting");
  const hasDisintegration = effects.includes("Disintegration");
  const hasLevitation = effects.includes("Levitation");
  const hasEarthZoom = effects.includes("Earth Zoom Out");
  const hasCloneExplosion = effects.includes("Clone Explosion");
  const hasPowderExplosion = effects.includes("Powder Explosion");
  const hasNorthernLights = effects.includes("Northern Lights");
  const hasXRay = effects.includes("X-Ray Wireframe");

  // Subject wrapper transforms (Levitation / Earth Zoom Out / Melting)
  const levitateY = hasLevitation
    ? -36 * active + Math.sin(frame * 0.09) * 16 * intensity
    : 0;
  const earthScale = hasEarthZoom
    ? interpolate(relFrame, [0, 75], [1.65, 0.48], clamp)
    : 1;
  const meltSkewY = hasMelting ? Math.sin(relFrame * 0.08) * 6 * active : 0;

  // CSS filter stack for Turning Metal & X-Ray Wireframe
  const filterParts: string[] = [];
  if (hasMetal) {
    filterParts.push(
      `contrast(${(1 + 0.48 * active).toFixed(2)}) saturate(${(1 - 0.65 * active).toFixed(2)}) brightness(${(1 + 0.14 * active).toFixed(2)})`,
    );
  }
  if (hasXRay) {
    filterParts.push(`invert(${(0.88 * active).toFixed(2)}) hue-rotate(180deg) contrast(1.35)`);
  }

  return (
    <AbsoluteFill>
      {/* 1. Northern Lights Aurora Backdrop */}
      {hasNorthernLights && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 1400px 420px at ${50 + Math.sin(frame * 0.04) * 15}% 24%, rgba(53,217,242,0.34) 0%, rgba(197,247,90,0.22) 45%, transparent 80%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 2. Clone Explosion Echoes Behind Subject */}
      {hasCloneExplosion &&
        [-2, -1, 1, 2].map((dir) => {
          const offset = dir * 135 * active * intensity;
          return (
            <AbsoluteFill
              key={dir}
              style={{
                transform: `translateX(${offset.toFixed(1)}px) translateY(${(Math.abs(dir) * -18 * active).toFixed(1)}px) scale(${(1 - Math.abs(dir) * 0.08).toFixed(3)})`,
                opacity: 0.32 * (1 - Math.abs(dir) * 0.2),
                filter: dir < 0 ? "hue-rotate(-35deg)" : "hue-rotate(35deg)",
                pointerEvents: "none",
              }}
            >
              {children}
            </AbsoluteFill>
          );
        })}

      {/* 3. Main Subject Stage with Levitation / Earth Zoom Out / Turning Metal */}
      <AbsoluteFill
        style={{
          transform: `translateY(${levitateY.toFixed(1)}px) scale(${earthScale.toFixed(3)}) skewY(${meltSkewY.toFixed(2)}deg)`,
          filter: filterParts.length ? filterParts.join(" ") : undefined,
        }}
      >
        {children}
      </AbsoluteFill>

      {/* 4. Set On Fire / Flame On Rising Ember Plume */}
      {hasFire && (
        <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: 44 }).map((_, i) => {
              const rng = mulberry32(400 + i * 29);
              const baseX = width * (0.18 + rng() * 0.64);
              const speed = 6 + rng() * 9;
              const y = height - ((relFrame * speed + rng() * height) % (height * 0.78));
              const x = baseX + Math.sin(relFrame * 0.1 + i) * 32;
              const r = (4 + rng() * 14) * (y / height);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={i % 3 === 0 ? "#FFF3B0" : i % 2 === 0 ? "#FF7B29" : "#FF331F"}
                  opacity={0.72 * active}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* 5. Powder Explosion Stadium Color Burst */}
      {hasPowderExplosion && (
        <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: 52 }).map((_, i) => {
              const rng = mulberry32(880 + i * 19);
              const angle = rng() * Math.PI * 2;
              const dist = (80 + rng() * 680) * active;
              const cx = width * 0.5 + Math.cos(angle) * dist;
              const cy = height * 0.5 + Math.sin(angle) * dist;
              const palette = ["#35D9F2", "#C5F75A", "#FF5E7E", "#FFB23F"];
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={(12 + rng() * 34) * (1 - active * 0.35)}
                  fill={palette[i % palette.length]}
                  opacity={0.62 * (1 - active * 0.25)}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* 6. Disintegration Ash Drift Field */}
      {hasDisintegration && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {Array.from({ length: 64 }).map((_, i) => {
              const rng = mulberry32(1500 + i * 23);
              const sx = width * (0.28 + rng() * 0.44) + relFrame * (3.5 + rng() * 6.5);
              const sy = height * (0.25 + rng() * 0.5) - relFrame * (1.8 + rng() * 4.2);
              const sz = 4 + rng() * 10;
              return (
                <rect
                  key={i}
                  x={sx}
                  y={sy}
                  width={sz}
                  height={sz}
                  fill={i % 4 === 0 ? accentB : ash}
                  opacity={interpolate(relFrame, [0, 80], [0.85, 0], clamp)}
                  transform={`rotate(${relFrame * 4 + i * 15} ${sx} ${sy})`}
                />
              );
            })}
          </svg>
        </AbsoluteFill>
      )}

      {/* 7. Thunder God Dual Branching Lightning */}
      {hasThunder && (
        <>
          <PlasmaLightningCGI
            x1={width * 0.5 - 260}
            y1={0}
            x2={width * 0.5 - 40}
            y2={height * 0.62}
            color={accentA}
            branches={3}
          />
          <PlasmaLightningCGI
            x1={width * 0.5 + 260}
            y1={0}
            x2={width * 0.5 + 40}
            y2={height * 0.62}
            color={accentB}
            branches={3}
          />
        </>
      )}
    </AbsoluteFill>
  );
};
