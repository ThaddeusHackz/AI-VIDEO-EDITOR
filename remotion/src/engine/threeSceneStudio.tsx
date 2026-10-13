import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { project3DPoint, Vec3 } from "./cameraRig";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * Generates a 3D Torus Knot (p, q) vertex + edge mesh for high-craft 3D motion graphics.
 */
export function createTorusKnotMesh(
  p = 2,
  q = 3,
  radius = 165,
  tubeRadius = 56,
  segments = 96,
): { vertices: Vec3[]; edges: [number, number][] } {
  const vertices: Vec3[] = [];
  const edges: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const r = radius + tubeRadius * Math.cos(q * t);
    vertices.push({
      x: r * Math.cos(p * t),
      y: r * Math.sin(p * t),
      z: tubeRadius * Math.sin(q * t) * 2.1,
    });
    edges.push([i, (i + 1) % segments]);
    if (i % 3 === 0) {
      edges.push([i, (i + Math.floor(segments / 3)) % segments]);
    }
  }
  return { vertices, edges };
}

/**
 * 1. 3D CYLINDRICAL ROTATING ICON / CARD CAROUSEL
 * Inspired by the Claude Opus 5.5 / Claude Code + Remotion 3D Cylindrical Carousel workflow.
 * Places N items around a 3D cylinder of radius R, depth-sorts back-to-front, and shades by Z-normal.
 */
export interface CarouselItem {
  id: string;
  label: string;
  sublabel?: string;
  glyph: string;
  accent: string;
}

export const CylindricalIconCarousel3D: React.FC<{
  items: CarouselItem[];
  radius?: number;
  tiltXDeg?: number;
  rotationSpeed?: number;
}> = ({ items, radius = 440, tiltXDeg = -10, rotationSpeed = 0.022 }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const intro = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 110 },
  });

  const activeRadius = radius * interpolate(intro, [0, 1], [0.4, 1], clamp);
  const baseAngle = frame * rotationSpeed;
  const tiltRad = (tiltXDeg * Math.PI) / 180;

  const projectedItems = items
    .map((item, idx) => {
      const theta = baseAngle + (idx / items.length) * Math.PI * 2;
      const x3d = Math.sin(theta) * activeRadius;
      const z3d = Math.cos(theta) * activeRadius;
      const y3d = Math.sin(theta * 2) * 24;

      const proj = project3DPoint(
        { x: x3d, y: y3d, z: z3d },
        tiltRad,
        0,
        0,
        1050,
        920,
        width * 0.5,
        height * 0.52,
      );

      // Facing factor: 1 when closest to camera (z3d = +activeRadius), 0 at back
      const facing = (Math.cos(theta) + 1) * 0.5;
      return {
        item,
        proj,
        facing,
        z3d,
      };
    })
    .sort((a, b) => a.z3d - b.z3d); // Painter's algorithm: back-to-front

  return (
    <AbsoluteFill>
      {projectedItems.map(({ item, proj, facing }) => {
        if (!proj.visible) return null;
        const opacity = interpolate(facing, [0, 0.3, 1], [0.22, 0.55, 1], clamp);
        const blurPx = interpolate(facing, [0, 0.6, 1], [5.5, 1.2, 0], clamp);
        return (
          <div
            key={item.id}
            style={{
              position: "absolute",
              left: proj.x,
              top: proj.y,
              width: 240,
              padding: "22px 24px",
              borderRadius: 20,
              background: "rgba(10, 18, 32, 0.9)",
              border: `1.5px solid ${item.accent}${facing > 0.7 ? "CC" : "44"}`,
              boxShadow:
                facing > 0.75
                  ? `0 24px 60px rgba(0,0,0,0.65), 0 0 36px ${item.accent}44`
                  : "0 12px 30px rgba(0,0,0,0.4)",
              transform: `translate(-50%, -50%) scale(${proj.scale.toFixed(3)})`,
              opacity,
              filter: blurPx > 0.25 ? `blur(${blurPx.toFixed(1)}px)` : undefined,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                color: item.accent,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              {item.glyph}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#F3F7F7",
                fontFamily: "Space Grotesk, sans-serif",
                marginTop: 8,
              }}
            >
              {item.label}
            </div>
            {item.sublabel && (
              <div
                style={{
                  fontSize: 12,
                  color: "#9CB0C1",
                  fontFamily: "JetBrains Mono, monospace",
                  marginTop: 4,
                  letterSpacing: "0.1em",
                }}
              >
                {item.sublabel}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/**
 * 2. SLIDING 3D PHOTO / CARD STACK ANIMATION
 * Inspired by the Claude Code + Remotion Sliding Stack showcase.
 * Cycles cards from the front of the 3D stack to the back with spring peel & rotation.
 */
export const SlidingPhotoStack3D: React.FC<{
  cards: { title: string; tag: string; metric: string; accent: string }[];
  cycleIntervalFrames?: number;
}> = ({ cards, cycleIntervalFrames = 45 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const activeIdx = Math.floor(frame / cycleIntervalFrames) % cards.length;
  const localFrame = frame % cycleIntervalFrames;

  const peelProgress = spring({
    frame: Math.max(0, localFrame - (cycleIntervalFrames - 16)),
    fps,
    config: { damping: 14, stiffness: 140 },
  });

  return (
    <div style={{ position: "relative", width: 520, height: 340 }}>
      {cards.map((card, i) => {
        const offset = (i - activeIdx + cards.length) % cards.length;
        const isPeeling = offset === 0 && peelProgress > 0.01;
        const stackDepth = isPeeling
          ? interpolate(peelProgress, [0, 1], [0, cards.length - 1])
          : Math.max(0, offset - peelProgress);

        const translateY = -stackDepth * 22;
        const translateZ = -stackDepth * 45;
        const scale = 1 - stackDepth * 0.055;
        const peelX = isPeeling
          ? Math.sin(peelProgress * Math.PI) * 280
          : 0;
        const peelRot = isPeeling
          ? Math.sin(peelProgress * Math.PI) * 14
          : (offset % 2 === 0 ? 1 : -1) * offset * 1.4;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              padding: "34px 38px",
              borderRadius: 24,
              background: "linear-gradient(145deg, rgba(14,24,42,0.96), rgba(7,12,22,0.96))",
              border: `1.5px solid ${card.accent}88`,
              boxShadow: "0 28px 70px rgba(0,0,0,0.6)",
              transform: `translate3d(${peelX.toFixed(1)}px, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(${peelRot.toFixed(2)}deg)`,
              zIndex: cards.length - Math.round(stackDepth),
              opacity: interpolate(stackDepth, [0, cards.length], [1, 0.35], clamp),
            }}
          >
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 13,
                fontWeight: 700,
                color: card.accent,
                letterSpacing: "0.18em",
              }}
            >
              {card.tag}
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 42,
                fontWeight: 700,
                color: "#F3F7F7",
                marginTop: 14,
                lineHeight: 1.05,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: 54,
                fontWeight: 700,
                color: card.accent,
                marginTop: 26,
              }}
            >
              {card.metric}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 3. 3D PHYSICS BOUNCING SPHERE WITH SQUASH-AND-STRETCH & FLOOR SHOCKWAVE
 * Inspired by the Claude Opus 5.5 One-Prompt 15s Motion Graphics Showreel.
 */
export const PhysicsBouncingSphere3D: React.FC<{
  bouncePeriodFrames?: number;
  floorY?: number;
  jumpHeight?: number;
  radius?: number;
  color?: string;
}> = ({
  bouncePeriodFrames = 42,
  floorY = 740,
  jumpHeight = 320,
  radius = 68,
  color = "#35D9F2",
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const phase = (frame % bouncePeriodFrames) / bouncePeriodFrames; // 0..1 between bounces
  // Parabolic gravity arc: 4 * phase * (1 - phase) peaks at phase=0.5
  const heightNorm = 4 * phase * (1 - phase);
  const yCenter = floorY - radius - heightNorm * jumpHeight;

  // Squash & stretch near impact (phase < 0.12 or phase > 0.88)
  const distToImpact = Math.min(phase, 1 - phase);
  const impactFactor = interpolate(distToImpact, [0, 0.12], [1, 0], clamp);
  const scaleX = 1 + impactFactor * 0.34;
  const scaleY = 1 - impactFactor * 0.28;

  // Shockwave ring expanding from impact point (phase 0..0.45)
  const rippleP = interpolate(phase, [0, 0.45], [0, 1], clamp);
  const cx = width * 0.5;

  const torus = useMemo(() => createTorusKnotMesh(2, 3, radius * 0.55, radius * 0.2, 48), [radius]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* Floor shadow & shockwave ring */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: floorY,
          width: radius * 2.2 * (1 - heightNorm * 0.55),
          height: radius * 0.45 * (1 - heightNorm * 0.55),
          borderRadius: "50%",
          background: "rgba(0,0,0,0.65)",
          filter: "blur(10px)",
          transform: "translate(-50%, -50%)",
        }}
      />
      {rippleP < 1 && (
        <div
          style={{
            position: "absolute",
            left: cx,
            top: floorY,
            width: radius * 1.6 + rippleP * 380,
            height: (radius * 1.6 + rippleP * 380) * 0.26,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: 1 - rippleP,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* 3D Shaded Sphere + Inner Torus Knot Core */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: yCenter,
          width: radius * 2,
          height: radius * 2,
          borderRadius: "50%",
          background: `radial-gradient(circle at 32% 28%, #FFFFFF 0%, ${color} 38%, #071428 85%)`,
          boxShadow: `0 0 60px ${color}88, inset -12px -16px 28px rgba(0,0,0,0.65)`,
          transform: `translate(-50%, -50%) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width={radius * 2} height={radius * 2} viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}>
          {torus.edges.map(([a, b], i) => {
            const va = torus.vertices[a];
            const vb = torus.vertices[b];
            const ang = frame * 0.06;
            const ax = va.x * Math.cos(ang) - va.z * Math.sin(ang);
            const bx = vb.x * Math.cos(ang) - vb.z * Math.sin(ang);
            return (
              <line
                key={i}
                x1={ax}
                y1={va.y}
                x2={bx}
                y2={vb.y}
                stroke="#FFFFFF"
                strokeOpacity={0.35}
                strokeWidth={1.2}
              />
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
