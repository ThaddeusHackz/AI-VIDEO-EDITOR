import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CameraRigContainer,
  project3DPoint,
  useCameraRig,
  Vec3,
} from "./engine/cameraRig";
import { waterfallEntry } from "./engine/seamTransitions";
import {
  AnamorphicFlare,
  CyberHUDTracker,
  FilmGrainOverlay,
  ParticleField3D,
  VolumetricGodrays,
} from "./engine/vfxShaders";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * Generates vertices and edges for a 3D geodesic icosahedron + outer orbital ring.
 */
function buildGeodesicGeometry() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: Vec3[] = [
    { x: -1, y: phi, z: 0 },
    { x: 1, y: phi, z: 0 },
    { x: -1, y: -phi, z: 0 },
    { x: 1, y: -phi, z: 0 },
    { x: 0, y: -1, z: phi },
    { x: 0, y: 1, z: phi },
    { x: 0, y: -1, z: -phi },
    { x: 0, y: 1, z: -phi },
    { x: phi, y: 0, z: -1 },
    { x: phi, y: 0, z: 1 },
    { x: -phi, y: 0, z: -1 },
    { x: -phi, y: 0, z: 1 },
  ];
  const radius = 195;
  const vertices: Vec3[] = raw.map((v) => {
    const len = Math.hypot(v.x, v.y, v.z);
    return {
      x: (v.x / len) * radius,
      y: (v.y / len) * radius,
      z: (v.z / len) * radius,
    };
  });

  const edges: [number, number][] = [];
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const d = Math.hypot(
        vertices[i].x - vertices[j].x,
        vertices[i].y - vertices[j].y,
        vertices[i].z - vertices[j].z,
      );
      if (d < radius * 1.18) {
        edges.push([i, j]);
      }
    }
  }

  // Outer orbital ring points
  const ring: Vec3[] = Array.from({ length: 32 }).map((_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return {
      x: Math.cos(a) * 320,
      y: Math.sin(a) * 65,
      z: Math.sin(a) * 320,
    };
  });

  return { vertices, edges, ring };
}

export const Cinematic3DShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps, durationInFrames } = useVideoConfig();

  // Choreographed Higgsfield DoP camera sequence:
  // 0..90: crane-up establish -> 90..175: orbit-360 -> 175..240: dolly-zoom hero
  const activePreset =
    frame < 90 ? "crane-up" : frame < 175 ? "orbit-360" : "dolly-zoom";
  const presetStart = frame < 90 ? 0 : frame < 175 ? 90 : 175;
  const presetDur = frame < 90 ? 90 : frame < 175 ? 85 : 65;

  const rig = useCameraRig({
    preset: activePreset,
    startFrame: presetStart,
    durationInFrames: presetDur,
    intensity: 0.9,
  });

  const geo = useMemo(() => buildGeodesicGeometry(), []);

  // Deterministic 3D rotation angles from frame
  const rotY = frame * 0.024;
  const rotX = 0.32 + Math.sin(frame * 0.018) * 0.22;
  const rotZ = frame * 0.008;

  // Core expansion pulse during climax (frame 150+)
  const explode = spring({
    frame: Math.max(0, frame - 145),
    fps,
    config: { damping: 16, stiffness: 120 },
  });
  const coreScale = 1 + explode * 0.22;

  const centerX = width * 0.62;
  const centerY = height * 0.5;

  const projectedVertices = geo.vertices.map((v) =>
    project3DPoint(
      { x: v.x * coreScale, y: v.y * coreScale, z: v.z * coreScale },
      rotX,
      rotY,
      rotZ,
      920,
      780,
      centerX,
      centerY,
    ),
  );

  const projectedRing = geo.ring.map((v) =>
    project3DPoint(v, -rotX * 0.7, -rotY * 1.3, 0.25, 920, 780, centerX, centerY),
  );

  const w0 = waterfallEntry(frame, 8, 0);
  const w1 = waterfallEntry(frame, 8, 1);
  const w2 = waterfallEntry(frame, 8, 2);
  const w3 = waterfallEntry(frame, 8, 3);

  const masterOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames - 1],
    [1, 0],
    clamp,
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#060A12", opacity: masterOut }}>
      {/* Ambient radial stage lighting */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle 880px at 62% 50%, rgba(53,217,242,0.22) 0%, rgba(66,126,255,0.08) 42%, rgba(6,10,18,0) 75%)",
        }}
      />

      <VolumetricGodrays originXPercent={62} originYPercent={20} color="#35D9F2" opacity={0.22} />

      <CameraRigContainer rig={rig}>
        {/* 3D Depth Particle Field */}
        <ParticleField3D
          count={95}
          seed={2026}
          color="#35D9F2"
          secondaryColor="#C5F75A"
          speedZ={7}
          rotY={rotY * 0.25}
          rotX={rotX * 0.2}
        />

        {/* 3D Geodesic Wireframe + Orbital Ring SVG */}
        <AbsoluteFill>
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Orbital ring segments */}
            {projectedRing.map((pt, i) => {
              const next = projectedRing[(i + 1) % projectedRing.length];
              if (!pt.visible || !next.visible) return null;
              return (
                <line
                  key={`ring-${i}`}
                  x1={pt.x}
                  y1={pt.y}
                  x2={next.x}
                  y2={next.y}
                  stroke="#C5F75A"
                  strokeOpacity={0.42}
                  strokeWidth={2}
                  strokeDasharray={i % 2 === 0 ? "none" : "4 4"}
                />
              );
            })}

            {/* Geodesic edges */}
            {geo.edges.map(([a, b], idx) => {
              const pa = projectedVertices[a];
              const pb = projectedVertices[b];
              if (!pa.visible || !pb.visible) return null;
              const avgDepth = (pa.depth + pb.depth) * 0.5;
              const alpha = interpolate(avgDepth, [550, 980], [0.95, 0.2], clamp);
              return (
                <line
                  key={`edge-${idx}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={idx % 5 === 0 ? "#C5F75A" : "#35D9F2"}
                  strokeOpacity={alpha}
                  strokeWidth={interpolate(avgDepth, [550, 980], [2.6, 1.1], clamp)}
                />
              );
            })}

            {/* Geodesic vertex nodes */}
            {projectedVertices.map((pt, idx) => {
              if (!pt.visible) return null;
              const r = Math.max(3, 6.5 * pt.scale);
              return (
                <g key={`v-${idx}`}>
                  <circle cx={pt.x} cy={pt.y} r={r * 2.1} fill="#35D9F2" opacity={0.22} />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={r}
                    fill={idx % 3 === 0 ? "#C5F75A" : "#FFFFFF"}
                  />
                </g>
              );
            })}
          </svg>
        </AbsoluteFill>

        {/* Optical Anamorphic Lens Flare */}
        <AnamorphicFlare
          xPercent={62}
          yPercent={50}
          color="#35D9F2"
          secondaryColor="#C5F75A"
          intensity={0.85 + explode * 0.35}
        />

        {/* Tracked 3D Vertex Callout HUD */}
        {projectedVertices[0]?.visible && (
          <CyberHUDTracker
            xPercent={(projectedVertices[0].x / width) * 100}
            yPercent={(projectedVertices[0].y / height) * 100}
            label={`DOP // ${activePreset.toUpperCase()}`}
            sublabel={`Z-DEPTH ${Math.round(projectedVertices[0].depth)}MM`}
            color="#C5F75A"
          />
        )}
      </CameraRigContainer>

      {/* Left Editorial Typography Column (Counter-scaled during Dolly-Zoom) */}
      <div
        style={{
          position: "absolute",
          left: 108,
          top: 170,
          width: 760,
          transform: `scale(${rig.subjectCounterScale.toFixed(4)})`,
          transformOrigin: "0% 50%",
        }}
      >
        <div
          style={{
            opacity: w0.opacity,
            transform: `translateY(${w0.translateY}px)`,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#C5F75A",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          CLAUDE OPUS 5.5 · GPT-6.1 SOL · 3D ENGINE
        </div>

        <div
          style={{
            opacity: w1.opacity,
            transform: `translateY(${w1.translateY}px) scale(${w1.scale})`,
            fontFamily: "Space Grotesk, Inter, sans-serif",
            fontSize: 88,
            fontWeight: 700,
            lineHeight: 0.94,
            letterSpacing: "-0.045em",
            color: "#F3F7F7",
          }}
        >
          DETERMINISTIC
          <br />
          <span style={{ color: "#35D9F2" }}>3D MOTION</span>
          <br />
          GRAPHICS.
        </div>

        <div
          style={{
            opacity: w2.opacity,
            transform: `translateY(${w2.translateY}px)`,
            fontFamily: "Inter, sans-serif",
            fontSize: 24,
            lineHeight: 1.5,
            color: "#9CB0C1",
            marginTop: 28,
            maxWidth: 620,
          }}
        >
          Frame-exact 3D projection, Higgsfield DoP camera rigs, volumetric godrays,
          and velocity-matched seams rendered natively in Remotion & HyperFrames.
        </div>

        {/* Live Telemetry Pill Strip */}
        <div
          style={{
            opacity: w3.opacity,
            transform: `translateY(${w3.translateY}px)`,
            marginTop: 38,
            display: "flex",
            gap: 14,
          }}
        >
          {[
            { k: "CAMERA RIG", v: activePreset.toUpperCase(), c: "#35D9F2" },
            { k: "PERSPECTIVE", v: `${Math.round(rig.perspectivePx)}PX`, c: "#C5F75A" },
            { k: "TIMELINE", v: `F:${String(frame).padStart(3, "0")}/240`, c: "#FFB23F" },
          ].map((badge, i) => (
            <div
              key={i}
              style={{
                padding: "12px 18px",
                background: "rgba(11, 20, 34, 0.84)",
                border: `1px solid ${badge.c}55`,
                borderRadius: 10,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              <div style={{ fontSize: 11, color: "#9CB0C1", letterSpacing: "0.14em" }}>
                {badge.k}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: badge.c,
                  marginTop: 4,
                  letterSpacing: "0.08em",
                }}
              >
                {badge.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <FilmGrainOverlay opacity={0.04} />
    </AbsoluteFill>
  );
};
