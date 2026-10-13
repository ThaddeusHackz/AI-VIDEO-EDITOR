import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32 } from "./cameraRig";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * HIGGSFIELD CINEMA STUDIO 4.0 PARAMETER MATRIX
 * Mirrors Higgsfield Cinema Studio 4.0 explicit parameter controls:
 * Genre, Era, Tempo, Colour Palette, Lighting Rig, Camera Body, Lens, Aperture, and Viral Presets.
 */
export type CinemaGenre = "General" | "Action" | "Epic" | "Drama" | "Comedy" | "Horror" | "Noir";
export type CinemaEra = "Auto" | "60s" | "80s" | "90s" | "2000s" | "2020s";
export type CinemaTempo = "Auto" | "Chaotic" | "Dynamic" | "Calm" | "Single Shot";
export type CinemaPalette =
  | "Film Colors"
  | "Black Gloss"
  | "Candy Pink"
  | "Lime Jam"
  | "Nostalgic Blue"
  | "Teal & Orange"
  | "Cyberpunk Neon";
export type CinemaLighting =
  | "Auto"
  | "Contre-jour"
  | "Soft Cross"
  | "Overhead Fall"
  | "Window"
  | "Practicals"
  | "Silhouette";
export type CinemaCameraBody = "Modern" | "35mm Film" | "8mm Film" | "DV Camcorder";
export type CinemaLens =
  | "Clean Sharp"
  | "Anamorphic"
  | "Vintage Anamorphic"
  | "Warm Vintage"
  | "Halation Vintage";
export type CinemaAperture = "f/1.4" | "f/4" | "f/11";

const PALETTE_FILTERS: Record<CinemaPalette, string> = {
  "Film Colors": "contrast(1.1) saturate(1.12) sepia(0.06)",
  "Black Gloss": "contrast(1.28) brightness(0.92) saturate(0.88)",
  "Candy Pink": "contrast(1.08) saturate(1.35) hue-rotate(-14deg)",
  "Lime Jam": "contrast(1.15) saturate(1.28) hue-rotate(18deg)",
  "Nostalgic Blue": "contrast(1.12) saturate(0.9) hue-rotate(8deg) brightness(0.96)",
  "Teal & Orange": "contrast(1.16) saturate(1.22)",
  "Cyberpunk Neon": "contrast(1.22) saturate(1.42) brightness(1.03)",
};

const LIGHTING_GRADIENTS: Record<CinemaLighting, string> = {
  Auto: "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), transparent 70%)",
  "Contre-jour":
    "radial-gradient(circle 680px at 50% 48%, rgba(255,200,120,0.28) 0%, rgba(53,217,242,0.12) 45%, rgba(0,0,0,0.82) 100%)",
  "Soft Cross":
    "linear-gradient(115deg, rgba(53,217,242,0.18) 0%, transparent 50%, rgba(255,178,63,0.16) 100%)",
  "Overhead Fall":
    "radial-gradient(ellipse 900px 520px at 50% 8%, rgba(255,255,255,0.24) 0%, rgba(0,0,0,0.85) 85%)",
  Window:
    "linear-gradient(105deg, rgba(255,244,214,0.22) 0%, rgba(255,244,214,0.04) 48%, rgba(0,0,0,0.8) 100%)",
  Practicals:
    "radial-gradient(circle 420px at 24% 38%, rgba(255,150,50,0.25), transparent 70%), radial-gradient(circle 480px at 78% 62%, rgba(53,217,242,0.24), transparent 70%)",
  Silhouette:
    "radial-gradient(circle 600px at 50% 50%, rgba(53,217,242,0.35) 0%, rgba(2,4,9,0.96) 72%)",
};

export const CinemaStudio4Stage: React.FC<{
  genre?: CinemaGenre;
  era?: CinemaEra;
  tempo?: CinemaTempo;
  palette?: CinemaPalette;
  lighting?: CinemaLighting;
  cameraBody?: CinemaCameraBody;
  lens?: CinemaLens;
  aperture?: CinemaAperture;
  children: React.ReactNode;
}> = ({
   palette = "Teal & Orange",
  lighting = "Contre-jour",
  cameraBody = "35mm Film",
  lens = "Anamorphic",
  children,
}) => {
  const frame = useCurrentFrame();
  const isAnamorphic = lens === "Anamorphic" || lens === "Vintage Anamorphic";
  const isHalation = lens === "Halation Vintage" || lens === "Vintage Anamorphic";

  // 8mm / 35mm gate weave
  const weaveX =
    cameraBody === "8mm Film"
      ? Math.sin(frame * 0.9) * 2.4
      : cameraBody === "35mm Film"
        ? Math.sin(frame * 0.4) * 0.6
        : 0;
  const weaveY =
    cameraBody === "8mm Film"
      ? Math.cos(frame * 1.3) * 2.1
      : cameraBody === "35mm Film"
        ? Math.cos(frame * 0.5) * 0.5
        : 0;

  return (
    <AbsoluteFill
      style={{
        filter: PALETTE_FILTERS[palette],
        transform: `translate(${weaveX.toFixed(2)}px, ${weaveY.toFixed(2)}px)`,
      }}
    >
      {children}

      {/* Cinema Studio Lighting Rig Overlay */}
      <AbsoluteFill
        style={{
          background: LIGHTING_GRADIENTS[lighting],
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* Halation Vintage Red-Orange Edge Bloom */}
      {isHalation && (
        <AbsoluteFill
          style={{
            boxShadow: "inset 0 0 140px rgba(255, 72, 36, 0.22)",
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      )}

      {/* DV Camcorder Scanlines & REC HUD */}
      {cameraBody === "DV Camcorder" && (
        <AbsoluteFill
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 4px)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* 2.39:1 Anamorphic Widescreen Letterbox Bars */}
      {isAnamorphic && (
        <>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 92,
              background: "#020408",
              zIndex: 50,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 92,
              background: "#020408",
              zIndex: 50,
            }}
          />
        </>
      )}
    </AbsoluteFill>
  );
};

/**
 * HIGGSFIELD CGI PRESET 1: PORTAL VORTEX FX (Relativistic Ember Ring)
 */
export const PortalVortexCGI: React.FC<{
  xPercent?: number;
  yPercent?: number;
  radius?: number;
  openFrame?: number;
  color?: string;
}> = ({
  xPercent = 50,
  yPercent = 50,
  radius = 230,
  openFrame = 0,
  color = "#FFB23F",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const open = spring({
    frame: Math.max(0, frame - openFrame),
    fps,
    config: { damping: 13, stiffness: 95 },
  });

  if (open <= 0.01) return null;
  const r = radius * open;
  const sparks = Array.from({ length: 48 }).map((_, i) => {
    const rng = mulberry32(900 + i * 31);
    const angle = (i / 48) * Math.PI * 2 + frame * 0.075;
    const spread = (rng() - 0.3) * 44;
    const sx = Math.cos(angle) * (r + spread);
    const sy = Math.sin(angle) * (r + spread);
    // Tangent spark tail
    const tx = sx - Math.sin(angle) * 38;
    const ty = sy + Math.cos(angle) * 38;
    return { sx, sy, tx, ty };
  });

  return (
    <div
      style={{
        position: "absolute",
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: r * 2.8,
        height: r * 2.8,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`-${r * 1.4} -${r * 1.4} ${r * 2.8} ${r * 2.8}`}
      >
        <circle
          cx={0}
          cy={0}
          r={r}
          fill="rgba(5, 10, 22, 0.86)"
          stroke={color}
          strokeWidth={5}
        />
        {sparks.map((sp, idx) => (
          <line
            key={idx}
            x1={sp.sx}
            y1={sp.sy}
            x2={sp.tx}
            y2={sp.ty}
            stroke={idx % 3 === 0 ? "#FFFFFF" : color}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </div>
  );
};

/**
 * HIGGSFIELD CGI PRESET 2: PLASMA LIGHTNING ARC FX (Midpoint-Displacement Arcs)
 */
export const PlasmaLightningCGI: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  branches?: number;
}> = ({ x1, y1, x2, y2, color = "#35D9F2", branches = 3 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const buildBolt = (seedOffset: number, jitterAmp: number) => {
    const rng = mulberry32(frame * 97 + seedOffset);
    const steps = 14;
    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const env = Math.sin(t * Math.PI);
      const px = x1 + (x2 - x1) * t + (rng() - 0.5) * jitterAmp * env;
      const py = y1 + (y2 - y1) * t + (rng() - 0.5) * jitterAmp * env;
      pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: branches }).map((_, b) => {
          const poly = buildBolt(b * 41, 75 + b * 25);
          return (
            <g key={b}>
              <polyline
                points={poly}
                fill="none"
                stroke={color}
                strokeWidth={b === 0 ? 7 : 3.5}
                strokeOpacity={0.35}
              />
              <polyline
                points={poly}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={b === 0 ? 2.5 : 1.2}
                strokeOpacity={0.92}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * HIGGSFIELD VIRAL PRESET: AGAMEMNON (Character / Card Breaks Through Screen)
 */
export const AgamemnonBreakthrough: React.FC<{
  triggerFrame: number;
  children: React.ReactNode;
}> = ({ triggerFrame, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lunge = spring({
    frame: Math.max(0, frame - triggerFrame),
    fps,
    config: { damping: 11, stiffness: 170, mass: 0.8 },
  });

  const scale = interpolate(lunge, [0, 1], [0.82, 1.18]);
  const zPx = interpolate(lunge, [0, 1], [-120, 160]);

  return (
    <AbsoluteFill
      style={{
        perspective: "900px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `translateZ(${zPx.toFixed(1)}px) scale(${scale.toFixed(3)})`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};
