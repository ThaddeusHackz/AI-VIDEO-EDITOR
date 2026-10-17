/**
 * Pure seam math (no React): the pose of the outgoing / incoming shot wrapper at a frame, per the motion-doctrine
 * Vector Ledger in timeline.json. Driven by remotion/src/engine/seamTransitions.ts. Imported by the <SeamScene>
 * wrapper AND by productions/singularity-engine/qa/seam_check.ts, which verifies every cut numerically.
 * Frame counts are the engine's 30 fps defaults doubled for 60 fps.
 */
import { cutTheCurveSeam, SeamTransform, zoomThroughSeam } from "../../engine/seamTransitions";
import type { Cut } from "../data";

export interface SeamPose extends SeamTransform {
  rotateY: number;
  brightness: number;
}

export const IDLE: SeamPose = { opacity: 1, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: true, rotateY: 0, brightness: 1 };

const in4 = (p: number) => Math.min(1, Math.max(0, p)) ** 4;

/**
 * The engine's seams fade the travelling side to 16–25 % at the cut. Over a light-absorbing void that reads as a
 * ~10-frame dip to black at every cut — the opposite of "one continuous camera move". Travel + blur carry the
 * cut (and the Seam Gate verifies direction, sign and zero overlap), so the opacity is floored at 55 %.
 */
const OPACITY_FLOOR = 0.55;

/**
 * Lateral travel is authored for the 16:9 width. `xScale` = W / (1920·u) maps it onto narrower frames, so a whip or a
 * cut-the-curve covers the same SHARE of the picture in 9:16 (×0.5625) instead of exposing > 50 % void on the cut
 * frame. Direction, sign, zero overlap and the speed ratio are scale-invariant (qa/seam_check.ts verifies both).
 */
export function lateralScale(W: number, u: number): number {
  return Math.min(1, W / (1920 * u));
}

export function seamPose(cut: Cut, frame: number, role: "outgoing" | "incoming", u: number, xScale = 1): SeamPose {
  const p = rawSeamPose(cut, frame, role, u, xScale);
  return p.visible ? { ...p, opacity: OPACITY_FLOOR + (1 - OPACITY_FLOOR) * p.opacity } : p;
}

function rawSeamPose(cut: Cut, frame: number, role: "outgoing" | "incoming", u: number, xScale: number): SeamPose {
  const base = { rotateY: 0, brightness: 1 };
  switch (cut.seam) {
    case "zoom-through":
      return { ...zoomThroughSeam(frame, cut.frame, role, { exitFrames: 12, entryFrames: 20, peakBlurPx: 7 }), ...base };
    case "inverse-zoom-through":
      return { ...zoomThroughSeam(frame, cut.frame, role, { inverse: true, exitFrames: 12, entryFrames: 22, peakBlurPx: 7 }), ...base };
    case "cut-the-curve":
      return {
        ...cutTheCurveSeam(frame, cut.frame, role, { axis: "x", direction: -1, distancePx: 260 * u * xScale, exitFrames: 14, entryFrames: 18, peakBlurPx: 6 }),
        ...base,
      };
    case "rise":
      return {
        ...cutTheCurveSeam(frame, cut.frame, role, { axis: "y", direction: -1, distancePx: 300 * u, exitFrames: 14, entryFrames: 18, peakBlurPx: 6 }),
        ...base,
      };
    case "whip-pan": {
      const s = cutTheCurveSeam(frame, cut.frame, role, { axis: "x", direction: -1, distancePx: 560 * u * xScale, exitFrames: 12, entryFrames: 16, peakBlurPx: 14 });
      // orbital whip: yaw follows lateral travel so the pan reads as a camera swinging around the subject
      return { ...s, rotateY: (s.translateX / (560 * u * xScale)) * -16, brightness: 1 };
    }
    case "scale-burst": {
      if (role === "incoming") {
        // the blast arrives at full strength: keep the engine's growing scale + blur (Z sign), floor the opacity
        const z = zoomThroughSeam(frame, cut.frame, role, { exitFrames: 10, entryFrames: 14, peakBlurPx: 9 });
        return { ...z, opacity: Math.max(z.opacity, 0.9), ...base };
      }
      if (frame >= cut.frame) return { ...IDLE, visible: false, opacity: 0 };
      const p = (frame - (cut.frame - 10)) / 10;
      if (p <= 0) return IDLE;
      const e = in4(p);
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1 + 0.6 * e, blurPx: 10 * e, visible: true, rotateY: 0, brightness: 1 + 0.9 * e };
    }
    case "hard-cut-to-black":
    default:
      if (role === "outgoing" && frame >= cut.frame) return { ...IDLE, visible: false, opacity: 0 };
      if (role === "incoming" && frame < cut.frame) return { ...IDLE, visible: false, opacity: 0 };
      return IDLE;
  }
}
