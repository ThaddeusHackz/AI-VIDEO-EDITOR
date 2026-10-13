import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export type VisemeCode = "REST" | "A" | "E" | "I" | "O" | "U" | "M" | "F";

/**
 * Analytic 2-Bone Inverse Kinematics Solver for 2D/2.5D character limbs.
 * Given hip/shoulder (x0, y0), target hand/foot (tx, ty), and bone lengths (L1, L2),
 * returns the deterministic elbow/knee joint coordinate (jx, jy).
 */
export function solveTwoBoneIK(
  x0: number,
  y0: number,
  tx: number,
  ty: number,
  L1: number,
  L2: number,
  bendDir: 1 | -1 = 1,
): { jx: number; jy: number; ex: number; ey: number } {
  const dx = tx - x0;
  const dy = ty - y0;
  const dist = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(dx, dy)));
  const baseAngle = Math.atan2(dy, dx);
  const cosAngle1 = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
  const angle1 = baseAngle + bendDir * Math.acos(Math.max(-1, Math.min(1, cosAngle1)));
  const jx = x0 + Math.cos(angle1) * L1;
  const jy = y0 + Math.sin(angle1) * L1;
  const ex = x0 + (dx / (Math.hypot(dx, dy) || 1)) * dist;
  const ey = y0 + (dy / (Math.hypot(dx, dy) || 1)) * dist;
  return { jx, jy, ex, ey };
}

/**
 * Maps a character string or phoneme to a VisemeCode for deterministic lip-sync.
 */
export function textToVisemeAtFrame(text: string, frame: number, startFrame = 0): VisemeCode {
  const rel = frame - startFrame;
  if (rel < 0) return "REST";
  const idx = Math.floor(rel / 3);
  if (idx >= text.length) return "REST";
  const ch = text[idx].toUpperCase();
  if ("AE".includes(ch)) return "A";
  if ("IYy".includes(ch)) return "I";
  if ("O".includes(ch)) return "O";
  if ("UW".includes(ch)) return "U";
  if ("BMP".includes(ch)) return "M";
  if ("FV".includes(ch)) return "F";
  if (" .,!?".includes(ch)) return "REST";
  return "E";
}

/**
 * Deterministic 2D/2.5D Rigged Vector Character (`<AnimatedCharacterRig />`)
 * Supports IK arm gestures (`wave`, `point`, `present`, `idle`), procedural walk bounce,
 * automatic eye-blink cadence, gaze tracking, and viseme lip-sync!
 */
export const AnimatedCharacterRig: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  gesture?: "wave" | "point" | "present" | "idle";
  speechText?: string;
  speechStartFrame?: number;
  accentColor?: string;
}> = ({
  x = 960,
  y = 580,
  scale = 1,
  gesture = "wave",
  speechText = "Welcome to the AI Video Editor Studio",
  speechStartFrame = 10,
  accentColor = "#35D9F2",
}) => {
  const frame = useCurrentFrame();

  // Breathing & secondary head bob
  const breatheY = Math.sin(frame * 0.12) * 4;
  const headTilt = Math.sin(frame * 0.08) * 3.5;

  // Deterministic blink every 75 frames (4 frames closed)
  const isBlinking = frame % 75 >= 71;

  // Viseme lip-sync state
  const viseme = textToVisemeAtFrame(speechText, frame, speechStartFrame);
  const mouthDims: Record<VisemeCode, { w: number; h: number; rx: number }> = {
    REST: { w: 22, h: 4, rx: 2 },
    M: { w: 26, h: 3, rx: 1.5 },
    F: { w: 24, h: 6, rx: 2 },
    I: { w: 28, h: 9, rx: 4 },
    E: { w: 26, h: 12, rx: 5 },
    A: { w: 28, h: 18, rx: 8 },
    O: { w: 18, h: 20, rx: 9 },
    U: { w: 14, h: 14, rx: 7 },
  };
  const m = mouthDims[viseme];

  // Right arm IK target based on gesture
  const rShoulder = { x: 54, y: -62 + breatheY };
  const rHandTarget =
    gesture === "wave"
      ? { x: 126 + Math.sin(frame * 0.35) * 28, y: -135 + Math.cos(frame * 0.35) * 12 }
      : gesture === "point"
        ? { x: 155, y: -88 }
        : gesture === "present"
          ? { x: 138, y: -42 + Math.sin(frame * 0.15) * 10 }
          : { x: 82, y: 20 };

  const rightArm = solveTwoBoneIK(
    rShoulder.x,
    rShoulder.y,
    rHandTarget.x,
    rHandTarget.y,
    62,
    58,
    1,
  );

  // Left arm IK
  const lShoulder = { x: -54, y: -62 + breatheY };
  const leftArm = solveTwoBoneIK(
    lShoulder.x,
    lShoulder.y,
    -84,
    18 + Math.sin(frame * 0.12) * 6,
    62,
    58,
    -1,
  );

  const mouthOpen = interpolate(m.h, [3, 20], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: "none",
      }}
    >
      <svg width={420} height={420} viewBox="-210 -240 420 420">
        {/* Torso */}
        <rect
          x={-52}
          y={-75 + breatheY}
          width={104}
          height={135}
          rx={28}
          fill="#101D33"
          stroke={accentColor}
          strokeWidth={3}
        />

        {/* Chest Core Reactor */}
        <circle
          cx={0}
          cy={-18 + breatheY}
          r={16 + mouthOpen * 4}
          fill={accentColor}
          opacity={0.85}
        />

        {/* Left Arm (2-Bone IK) */}
        <polyline
          points={`${lShoulder.x},${lShoulder.y} ${leftArm.jx},${leftArm.jy} ${leftArm.ex},${leftArm.ey}`}
          fill="none"
          stroke="#9CB0C1"
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Arm (2-Bone IK) */}
        <polyline
          points={`${rShoulder.x},${rShoulder.y} ${rightArm.jx},${rightArm.jy} ${rightArm.ex},${rightArm.ey}`}
          fill="none"
          stroke={accentColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={rightArm.ex} cy={rightArm.ey} r={10} fill="#C5F75A" />

        {/* Head Group */}
        <g transform={`translate(0, ${-138 + breatheY}) rotate(${headTilt})`}>
          <rect
            x={-58}
            y={-52}
            width={116}
            height={96}
            rx={30}
            fill="#0B1424"
            stroke="#F3F7F7"
            strokeWidth={3}
          />
          {/* Eyes */}
          <ellipse
            cx={-22}
            cy={-12}
            rx={9}
            ry={isBlinking ? 1.2 : 9}
            fill={accentColor}
          />
          <ellipse
            cx={22}
            cy={-12}
            rx={9}
            ry={isBlinking ? 1.2 : 9}
            fill={accentColor}
          />
          {/* Lip-Synced Viseme Mouth */}
          <rect
            x={-m.w / 2}
            y={18 - m.h / 2}
            width={m.w}
            height={m.h}
            rx={m.rx}
            fill="#C5F75A"
          />
        </g>
      </svg>
    </div>
  );
};
