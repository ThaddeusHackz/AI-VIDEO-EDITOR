import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32, project3DPoint, Vec3 } from "./cameraRig";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * 1. ANAMORPHIC LENS FLARE — Horizontal cinema lens streak + core bloom + chromatic halo.
 */
export const AnamorphicFlare: React.FC<{
  xPercent?: number;
  yPercent?: number;
  color?: string;
  secondaryColor?: string;
  intensity?: number;
}> = ({
  xPercent = 50,
  yPercent = 46,
  color = "#35D9F2",
  secondaryColor = "#FFB23F",
  intensity = 1.0,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const shimmer = 0.92 + Math.sin(frame * 0.18) * 0.08;
  const streakWidth = width * 0.92 * intensity * shimmer;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {/* Main horizontal anamorphic streak */}
      <div
        style={{
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: streakWidth,
          height: 4 * intensity,
          transform: "translate(-50%, -50%)",
          background: `linear-gradient(90deg, transparent 0%, ${color}44 22%, #ffffff 50%, ${color}44 78%, transparent 100%)`,
          boxShadow: `0 0 ${28 * intensity}px ${6 * intensity}px ${color}88`,
          opacity: Math.min(1, 0.85 * intensity),
        }}
      />
      {/* Secondary warm counter-streak */}
      <div
        style={{
          position: "absolute",
          left: `${100 - xPercent}%`,
          top: `${yPercent + 2}%`,
          width: streakWidth * 0.52,
          height: 2,
          transform: "translate(-50%, -50%)",
          background: `linear-gradient(90deg, transparent 0%, ${secondaryColor}66 50%, transparent 100%)`,
          opacity: 0.65 * intensity,
        }}
      />
      {/* Core optical hotspot */}
      <div
        style={{
          position: "absolute",
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: 240 * intensity,
          height: 110 * intensity,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.72 * intensity}) 0%, ${color}55 38%, transparent 72%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * 2. VOLUMETRIC GODRAYS — Procedural radial light shafts from an origin point.
 */
export const VolumetricGodrays: React.FC<{
  originXPercent?: number;
  originYPercent?: number;
  color?: string;
  rayCount?: number;
  opacity?: number;
}> = ({
  originXPercent = 50,
  originYPercent = 24,
  color = "#35D9F2",
  rayCount = 16,
  opacity = 0.28,
}) => {
  const frame = useCurrentFrame();
  const rays = useMemo(() => {
    const rng = mulberry32(4099);
    return Array.from({ length: rayCount }).map((_, i) => ({
      angle: -65 + (i / Math.max(1, rayCount - 1)) * 130 + (rng() - 0.5) * 6,
      width: 2.5 + rng() * 5.5,
      speed: 0.015 + rng() * 0.025,
      phase: rng() * Math.PI * 2,
    }));
  }, [rayCount]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", opacity }}>
      {rays.map((ray, idx) => {
        const wave = 0.65 + 0.35 * Math.sin(frame * ray.speed + ray.phase);
        const rot = ray.angle + Math.sin(frame * 0.01 + ray.phase) * 2.2;
        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${originXPercent}%`,
              top: `${originYPercent}%`,
              width: `${ray.width}%`,
              height: "160%",
              transformOrigin: "50% 0%",
              transform: `translateX(-50%) rotate(${rot.toFixed(2)}deg)`,
              background: `linear-gradient(180deg, ${color}88 0%, ${color}22 45%, transparent 90%)`,
              opacity: wave,
              filter: "blur(8px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 3. PARTICLE FIELD 3D — True perspective-projected 3D particle system with depth-of-field bokeh.
 */
export const ParticleField3D: React.FC<{
  count?: number;
  seed?: number;
  color?: string;
  secondaryColor?: string;
  speedZ?: number;
  rotY?: number;
  rotX?: number;
}> = ({
  count = 90,
  seed = 1337,
  color = "#35D9F2",
  secondaryColor = "#C5F75A",
  speedZ = 6.5,
  rotY = 0,
  rotX = 0,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: count }).map((_, i) => ({
      x: (rng() - 0.5) * 1800,
      y: (rng() - 0.5) * 1100,
      zBase: rng() * 1200,
      radius: 1.8 + rng() * 4.2,
      isAccent: i % 4 === 0,
    }));
  }, [count, seed]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {particles.map((p, i) => {
          // Wrap Z deterministically inside [-600, 600]
          const zWrapped = ((((p.zBase - frame * speedZ) % 1200) + 1200) % 1200) - 600;
          const proj = project3DPoint(
            { x: p.x, y: p.y, z: zWrapped },
            rotX,
            rotY,
            0,
            800,
            780,
            width / 2,
            height / 2,
          );
          if (!proj.visible) return null;
          const r = Math.max(0.8, p.radius * proj.scale);
          const alpha = interpolate(proj.depth, [180, 500, 1380], [0.95, 0.7, 0.08], clamp);
          return (
            <circle
              key={i}
              cx={proj.x}
              cy={proj.y}
              r={r}
              fill={p.isAccent ? secondaryColor : color}
              opacity={alpha}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * 4. SHATTER DEBRIS 3D — Deterministic 3D crystalline shard burst with specular lighting.
 */
export const ShatterDebris3D: React.FC<{
  triggerFrame: number;
  shardCount?: number;
  timeScale?: number;
  accentColor?: string;
}> = ({
  triggerFrame,
  shardCount = 36,
  timeScale = 1.0,
  accentColor = "#35D9F2",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const shards = useMemo(() => {
    const rng = mulberry32(9001);
    return Array.from({ length: shardCount }).map(() => {
      const theta = rng() * Math.PI * 2;
      const phi = (rng() - 0.5) * Math.PI;
      const speed = 9 + rng() * 22;
      return {
        vx: Math.cos(theta) * Math.cos(phi) * speed,
        vy: Math.sin(phi) * speed - 3,
        vz: Math.sin(theta) * Math.cos(phi) * speed,
        rotSpeedX: (rng() - 0.5) * 0.14,
        rotSpeedY: (rng() - 0.5) * 0.18,
        size: 16 + rng() * 34,
        aspect: 0.5 + rng() * 0.9,
      };
    });
  }, [shardCount]);

  if (frame < triggerFrame) return null;
  const elapsed = (frame - triggerFrame) * timeScale;
  const fadeOut = interpolate(elapsed, [0, 50, 95], [1, 0.9, 0], clamp);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: fadeOut }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {shards.map((s, idx) => {
          const pos: Vec3 = {
            x: s.vx * elapsed,
            y: s.vy * elapsed + 0.16 * elapsed * elapsed,
            z: s.vz * elapsed,
          };
          const proj = project3DPoint(
            pos,
            elapsed * s.rotSpeedX,
            elapsed * s.rotSpeedY,
            0,
            820,
            760,
            width / 2,
            height / 2,
          );
          if (!proj.visible) return null;
          const w = s.size * proj.scale;
          const h = w * s.aspect;
          const angleDeg = ((elapsed * (s.rotSpeedX + s.rotSpeedY) * 180) / Math.PI) % 360;
          const specular = 0.35 + 0.65 * Math.abs(Math.cos(elapsed * s.rotSpeedY));
          return (
            <g
              key={idx}
              transform={`translate(${proj.x.toFixed(1)}, ${proj.y.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}
            >
              <polygon
                points={`${-w * 0.6},${-h * 0.5} ${w * 0.7},${-h * 0.2} ${w * 0.3},${h * 0.65} ${-w * 0.5},${h * 0.4}`}
                fill={idx % 3 === 0 ? accentColor : "#E8F7FA"}
                fillOpacity={0.28 + specular * 0.5}
                stroke="#FFFFFF"
                strokeOpacity={0.75}
                strokeWidth={1.2}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * 5. CYBER HUD TRACKER — CGI motion-tracked callout reticle + telemetry readout.
 */
export const CyberHUDTracker: React.FC<{
  xPercent: number;
  yPercent: number;
  label: string;
  sublabel: string;
  color?: string;
}> = ({ xPercent, yPercent, label, sublabel, color = "#35D9F2" }) => {
  const frame = useCurrentFrame();
  const pulse = 0.94 + Math.sin(frame * 0.25) * 0.06;

  return (
    <div
      style={{
        position: "absolute",
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      {/* Target reticle box */}
      <div
        style={{
          width: 88,
          height: 88,
          border: `1.5px solid ${color}`,
          borderRadius: 8,
          transform: `scale(${pulse.toFixed(3)})`,
          boxShadow: `0 0 20px ${color}44, inset 0 0 12px ${color}22`,
          position: "relative",
        }}
      >
        {/* Corner ticks */}
        <div
          style={{
            position: "absolute",
            inset: -5,
            border: `2px solid #fff`,
            clipPath:
              "polygon(0 0, 18px 0, 18px 18px, 0 18px, 0 100%, 18px 100%, 18px calc(100% - 18px), 0 calc(100% - 18px))",
          }}
        />
      </div>

      {/* Leader line + data badge */}
      <div
        style={{
          position: "absolute",
          left: 98,
          top: -12,
          padding: "8px 14px",
          background: "rgba(7, 11, 18, 0.86)",
          border: `1px solid ${color}88`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 6,
          whiteSpace: "nowrap",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: "0.14em" }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: "#D2E3EC", marginTop: 3, letterSpacing: "0.08em" }}>
          {sublabel} · F:{String(frame).padStart(4, "0")}
        </div>
      </div>
    </div>
  );
};

/**
 * 6. FILM GRAIN & CINEMA VIGNETTE OVERLAY — Seeded by frame so it never flickers on re-render.
 */
export const FilmGrainOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.045 }) => {
  const frame = useCurrentFrame();
  const offsetX = ((frame * 37) % 120) - 60;
  const offsetY = ((frame * 53) % 120) - 60;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: -80,
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
          opacity,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.75) 1px, transparent 1.5px), radial-gradient(circle, rgba(53,217,242,0.5) 1px, transparent 1.5px)",
          backgroundSize: "18px 18px, 29px 29px",
          backgroundPosition: "0 0, 9px 13px",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 48%, rgba(3,6,12,0.68) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
