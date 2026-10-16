import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { cutAt, P, shot, ShotId } from "../data";
import { useLayout } from "../layout";
import { IDLE, SeamPose, seamPose } from "./seamPose";

export type { SeamPose };

/**
 * Motion-doctrine seams, driven by remotion/src/engine/seamTransitions.ts and the Vector Ledger in timeline.json.
 * Zero overlap: a shot is only mounted inside its own [from, to) window, so exactly one shot is visible per frame;
 * the outgoing side is still accelerating on its last frame and the incoming side is mid-flight on its first.
 * The pure pose math lives in ./seamPose.ts so qa/seam_check.ts can verify every cut numerically.
 */
export function useSeamPose(id: ShotId): SeamPose {
  const local = useCurrentFrame();
  const { u } = useLayout();
  const s = shot(id);
  const frame = local + s.from;
  const entry = cutAt(s.from);
  const exit = cutAt(s.to);
  let pose = IDLE;
  if (entry && frame < s.from + 24) pose = seamPose(entry, frame, "incoming", u);
  if (exit && frame >= s.to - 16) pose = seamPose(exit, frame, "outgoing", u);
  return pose;
}

/** Wraps a shot: applies its entry/exit seam transform and paints the opaque stage ground (seam-craft). */
export const SeamScene: React.FC<{ id: ShotId; children: React.ReactNode }> = ({ id, children }) => {
  const pose = useSeamPose(id);
  return (
    <AbsoluteFill style={{ backgroundColor: P.void, overflow: "hidden", perspective: 1600 }}>
      <AbsoluteFill
        style={{
          opacity: pose.opacity,
          transform: `translate3d(${pose.translateX.toFixed(2)}px, ${pose.translateY.toFixed(2)}px, 0) scale(${pose.scale.toFixed(4)}) rotateY(${pose.rotateY.toFixed(2)}deg)`,
          filter:
            pose.blurPx > 0.2 || pose.brightness !== 1
              ? `${pose.blurPx > 0.2 ? `blur(${pose.blurPx.toFixed(2)}px)` : ""} ${pose.brightness !== 1 ? `brightness(${pose.brightness.toFixed(3)})` : ""}`
              : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
