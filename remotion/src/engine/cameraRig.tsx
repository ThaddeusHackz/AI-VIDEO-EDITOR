import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type DoPCameraPreset =
  | "static"
  | "dolly-zoom"
  | "crash-zoom"
  | "orbit-360"
  | "bullet-time"
  | "whip-pan"
  | "push-to-glass"
  | "crane-up"
  | "handheld-cinema"
  | "rack-focus"
  | "fpv-drone";

export interface CameraRigState {
  scale: number;
  subjectCounterScale: number;
  translateX: number;
  translateY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  blurPx: number;
  perspectivePx: number;
  timeScale: number;
  preset: DoPCameraPreset;
}

export interface UseCameraRigOptions {
  preset: DoPCameraPreset;
  startFrame?: number;
  durationInFrames?: number;
  intensity?: number;
  seed?: number;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/**
 * Deterministic 32-bit PRNG (Mulberry32) so any procedural noise, shake,
 * or particle field renders identically regardless of worker order.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  depth: number;
  visible: boolean;
}

/**
 * Rotate a 3D point around X, Y, Z axes (in radians) and project onto 2D canvas.
 */
export function project3DPoint(
  pt: Vec3,
  rotX: number,
  rotY: number,
  rotZ: number,
  fov: number,
  cameraZ: number,
  centerX: number,
  centerY: number,
): ProjectedPoint {
  // Rotate around Y
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = pt.x * cosY + pt.z * sinY;
  const z1 = -pt.x * sinY + pt.z * cosY;
  const y1 = pt.y;

  // Rotate around X
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;
  const x2 = x1;

  // Rotate around Z
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);
  const x3 = x2 * cosZ - y2 * sinZ;
  const y3 = x2 * sinZ + y2 * cosZ;
  const z3 = z2;

  const depth = cameraZ - z3;
  if (depth <= 10) {
    return { x: centerX, y: centerY, scale: 0, depth, visible: false };
  }
  const scale = fov / depth;
  return {
    x: centerX + x3 * scale,
    y: centerY + y3 * scale,
    scale,
    depth,
    visible: true,
  };
}

/**
 * Higgsfield DoP (Director of Photography) Cinema Studio Camera Rig hook.
 * Computes deterministic frame-exact camera transforms.
 */
export function useCameraRig({
  preset,
  startFrame = 0,
  durationInFrames,
  intensity = 1.0,
}: UseCameraRigOptions): CameraRigState {
  const frame = useCurrentFrame();
  const { durationInFrames: compDuration, fps } = useVideoConfig();
  const dur = Math.max(1, durationInFrames ?? compDuration - startFrame);
  const endFrame = startFrame + dur;

  const base: CameraRigState = {
    scale: 1,
    subjectCounterScale: 1,
    translateX: 0,
    translateY: 0,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    blurPx: 0,
    perspectivePx: 1200,
    timeScale: 1,
    preset,
  };

  if (frame < startFrame) return base;

  const progress = interpolate(frame, [startFrame, endFrame], [0, 1], clamp);

  switch (preset) {
    case "dolly-zoom": {
      // Hitchcock / Vertigo counter-zoom: background compresses while foreground counter-scales
      const eased = Easing.inOut(Easing.sin)(progress);
      const bgScale = 1 + 0.42 * intensity * eased;
      const fgScale = 1 / (1 + 0.28 * intensity * eased);
      return {
        ...base,
        scale: bgScale,
        subjectCounterScale: fgScale,
        perspectivePx: interpolate(eased, [0, 1], [1400, 720]),
      };
    }

    case "crash-zoom": {
      const snapDuration = Math.min(dur, Math.round(fps * 0.38));
      const snapEnd = startFrame + snapDuration;
      const p = interpolate(frame, [startFrame, snapEnd], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.exp),
      });
      const blur = interpolate(
        frame,
        [startFrame, startFrame + snapDuration * 0.45, snapEnd],
        [0, 11 * intensity, 0],
        clamp,
      );
      const impactDecay =
        frame > snapEnd
          ? Math.exp(-(frame - snapEnd) * 0.22) * Math.sin((frame - snapEnd) * 1.9) * 6 * intensity
          : 0;
      return {
        ...base,
        scale: 1 + 0.85 * intensity * p,
        translateX: impactDecay,
        translateY: -impactDecay * 0.6,
        blurPx: blur,
      };
    }

    case "orbit-360": {
      const eased = Easing.inOut(Easing.cubic)(progress);
      return {
        ...base,
        rotateY: interpolate(eased, [0, 1], [-18 * intensity, 18 * intensity]),
        rotateX: interpolate(eased, [0, 0.5, 1], [7 * intensity, 2 * intensity, -4 * intensity]),
        scale: interpolate(eased, [0, 0.5, 1], [0.96, 1.06, 1.0]),
        translateX: Math.sin(eased * Math.PI * 2) * 28 * intensity,
      };
    }

    case "bullet-time": {
      const enterP = interpolate(progress, [0, 0.2], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.exp),
      });
      const arcP = interpolate(progress, [0.2, 0.82], [0, 1], clamp);
      const exitP = interpolate(progress, [0.82, 1], [0, 1], {
        ...clamp,
        easing: Easing.in(Easing.exp),
      });
      const activeArc = enterP * (1 - exitP);
      return {
        ...base,
        scale: 1 + 0.22 * intensity * activeArc,
        rotateY: interpolate(arcP, [0, 1], [16 * intensity, -16 * intensity]) * activeArc,
        rotateZ: interpolate(arcP, [0, 1], [-3.5 * intensity, 2.5 * intensity]) * activeArc,
        timeScale: progress >= 0.2 && progress <= 0.82 ? 0.08 : 1.0,
      };
    }

    case "whip-pan": {
      const mid = startFrame + dur * 0.5;
      const isFirstHalf = frame <= mid;
      const tx = isFirstHalf
        ? interpolate(frame, [startFrame, mid], [0, -320 * intensity], {
            ...clamp,
            easing: Easing.in(Easing.poly(4)),
          })
        : interpolate(frame, [mid, endFrame], [320 * intensity, 0], {
            ...clamp,
            easing: Easing.out(Easing.poly(4)),
          });
      const blur = interpolate(
        frame,
        [startFrame, mid, endFrame],
        [0, 18 * intensity, 0],
        clamp,
      );
      return {
        ...base,
        translateX: tx,
        blurPx: blur,
      };
    }

    case "push-to-glass": {
      const eased = Easing.in(Easing.poly(3))(progress);
      return {
        ...base,
        scale: 1 + 1.85 * intensity * eased,
        blurPx: interpolate(eased, [0, 0.7, 1], [0, 2, 10 * intensity], clamp),
      };
    }

    case "crane-up": {
      const eased = Easing.out(Easing.cubic)(progress);
      return {
        ...base,
        translateY: interpolate(eased, [0, 1], [115 * intensity, 0]),
        rotateX: interpolate(eased, [0, 1], [11 * intensity, 0]),
        scale: interpolate(eased, [0, 1], [1.06, 1.0]),
      };
    }

    case "handheld-cinema": {
      const t = frame / fps;
      const dx = (Math.sin(t * 2.1) * 4.5 + Math.cos(t * 5.3) * 1.8) * intensity;
      const dy = (Math.cos(t * 1.7) * 3.8 + Math.sin(t * 4.7) * 1.5) * intensity;
      const rz = Math.sin(t * 1.3) * 0.42 * intensity;
      return {
        ...base,
        translateX: dx,
        translateY: dy,
        rotateZ: rz,
        scale: 1.015,
      };
    }

    case "rack-focus": {
      const blur = interpolate(
        progress,
        [0, 0.35, 1],
        [14 * intensity, 3 * intensity, 0],
        { ...clamp, easing: Easing.out(Easing.cubic) },
      );
      return {
        ...base,
        blurPx: blur,
        scale: interpolate(progress, [0, 1], [1.04, 1.0], clamp),
      };
    }

    case "fpv-drone": {
      const eased = Easing.inOut(Easing.cubic)(progress);
      const bank = Math.sin(progress * Math.PI * 2) * 9.5 * intensity;
      return {
        ...base,
        scale: interpolate(eased, [0, 1], [0.88, 1.18]),
        rotateZ: bank,
        rotateX: interpolate(eased, [0, 0.5, 1], [6 * intensity, -3 * intensity, 2 * intensity]),
        translateY: Math.cos(progress * Math.PI * 2) * 18 * intensity,
      };
    }

    default:
      return base;
  }
}

export const CameraRigContainer: React.FC<{
  rig: CameraRigState;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ rig, children, style }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        perspective: `${rig.perspectivePx}px`,
        transformStyle: "preserve-3d",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "50% 50%",
          transform: `translate3d(${rig.translateX.toFixed(2)}px, ${rig.translateY.toFixed(2)}px, 0px) scale(${rig.scale.toFixed(4)}) rotateX(${rig.rotateX.toFixed(2)}deg) rotateY(${rig.rotateY.toFixed(2)}deg) rotateZ(${rig.rotateZ.toFixed(2)}deg)`,
          filter: rig.blurPx > 0.15 ? `blur(${rig.blurPx.toFixed(2)}px)` : undefined,
          willChange: "transform, filter",
        }}
      >
        {children}
      </div>
    </div>
  );
};
