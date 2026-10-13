import { Easing, interpolate } from "remotion";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export interface SeamTransform {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  blurPx: number;
  visible: boolean;
}

/**
 * 1. CUT THE CURVE (Velocity-matched directional seam from HyperFrames `cut-the-curve`).
 *
 * Scene A accelerates (`power4.in`) over `exitFrames` and cuts at peak velocity.
 * Scene B enters mid-flight (`power4.out`) at matched direction & speed over `entryFrames`.
 * Zero overlap: only one scene is visible on any given frame.
 */
export function cutTheCurveSeam(
  frame: number,
  cutFrame: number,
  role: "outgoing" | "incoming",
  options?: {
    axis?: "x" | "y";
    direction?: -1 | 1; // -1 = left/up (house current), +1 = right/down
    distancePx?: number;
    exitFrames?: number;
    entryFrames?: number;
    peakBlurPx?: number;
  },
): SeamTransform {
  const axis = options?.axis ?? "x";
  const dir = options?.direction ?? -1;
  const dist = options?.distancePx ?? 240;
  const exitFrames = options?.exitFrames ?? 8;
  const entryFrames = options?.entryFrames ?? 11;
  const peakBlur = options?.peakBlurPx ?? 14;

  if (role === "outgoing") {
    if (frame >= cutFrame) {
      return { opacity: 0, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: false };
    }
    const exitStart = cutFrame - exitFrames;
    if (frame <= exitStart) {
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: true };
    }
    const p = interpolate(frame, [exitStart, cutFrame], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.poly(4)),
    });
    const lin = interpolate(frame, [exitStart, cutFrame], [0, 1], clamp);
    const offset = dir * dist * p;
    return {
      opacity: interpolate(lin, [0, 1], [1, 0.22]),
      translateX: axis === "x" ? offset : 0,
      translateY: axis === "y" ? offset : 0,
      scale: 1,
      blurPx: peakBlur * p,
      visible: true,
    };
  } else {
    if (frame < cutFrame) {
      return { opacity: 0, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: false };
    }
    const entryEnd = cutFrame + entryFrames;
    if (frame >= entryEnd) {
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: true };
    }
    const p = interpolate(frame, [cutFrame, entryEnd], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.poly(4)),
    });
    const offset = -dir * dist * 1.15 * (1 - p);
    return {
      opacity: interpolate(p, [0, 0.35, 1], [0.25, 1, 1], clamp),
      translateX: axis === "x" ? offset : 0,
      translateY: axis === "y" ? offset : 0,
      scale: 1,
      blurPx: peakBlur * (1 - p),
      visible: true,
    };
  }
}

/**
 * 2. ZOOM-THROUGH & INVERSE ZOOM-THROUGH (Enforces the Z Scale-Sign Law).
 *
 * - Forward push (`inverse = false`): d(scale)/dt > 0 on BOTH sides
 *   Outgoing grows `1.0 -> 1.24`, Incoming grows `0.75 -> 1.0`.
 * - Backward pull (`inverse = true`): d(scale)/dt < 0 on BOTH sides
 *   Outgoing shrinks `1.0 -> 0.80`, Incoming shrinks `1.26 -> 1.0`.
 */
export function zoomThroughSeam(
  frame: number,
  cutFrame: number,
  role: "outgoing" | "incoming",
  options?: {
    inverse?: boolean;
    exitFrames?: number;
    entryFrames?: number;
    peakBlurPx?: number;
  },
): SeamTransform {
  const inverse = options?.inverse ?? false;
  const exitFrames = options?.exitFrames ?? 7;
  const entryFrames = options?.entryFrames ?? 14;
  const peakBlur = options?.peakBlurPx ?? 12;

  if (role === "outgoing") {
    if (frame >= cutFrame) {
      return { opacity: 0, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: false };
    }
    const exitStart = cutFrame - exitFrames;
    if (frame <= exitStart) {
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: true };
    }
    const p = interpolate(frame, [exitStart, cutFrame], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    });
    const lin = interpolate(frame, [exitStart, cutFrame], [0, 1], clamp);
    const targetScale = inverse ? 0.8 : 1.24;
    return {
      opacity: interpolate(lin, [0, 1], [1, 0.16]),
      translateX: 0,
      translateY: 0,
      scale: interpolate(p, [0, 1], [1, targetScale]),
      blurPx: peakBlur * p,
      visible: true,
    };
  } else {
    if (frame < cutFrame) {
      return { opacity: 0, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: false };
    }
    const entryEnd = cutFrame + entryFrames;
    if (frame >= entryEnd) {
      return { opacity: 1, translateX: 0, translateY: 0, scale: 1, blurPx: 0, visible: true };
    }
    const p = interpolate(frame, [cutFrame, entryEnd], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.exp),
    });
    const startScale = inverse ? 1.26 : 0.75;
    return {
      opacity: interpolate(p, [0, 0.3, 1], [0.16, 1, 1], clamp),
      translateX: 0,
      translateY: 0,
      scale: interpolate(p, [0, 1], [startScale, 1]),
      blurPx: peakBlur * (1 - p),
      visible: true,
    };
  }
}

/**
 * 3. WATERFALL ENTRY (`cut-the-curve` §6 — Staggered arrival cascade).
 */
export function waterfallEntry(
  frame: number,
  startFrame: number,
  index: number,
  options?: {
    staggerFrames?: number;
    durationFrames?: number;
    distanceY?: number;
  },
): { opacity: number; translateY: number; scale: number } {
  const stagger = options?.staggerFrames ?? 4;
  const dur = options?.durationFrames ?? 18;
  const distY = options?.distanceY ?? 54;
  const itemStart = startFrame + index * stagger;

  const p = interpolate(frame, [itemStart, itemStart + dur], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.poly(4)),
  });
  return {
    opacity: interpolate(p, [0, 0.4, 1], [0, 1, 1], clamp),
    translateY: (1 - p) * distY,
    scale: interpolate(p, [0, 1], [0.96, 1]),
  };
}

/**
 * 4. NUDGE CURVE (`cut-the-curve` §7 — 10/65/25 three-phase group slide).
 */
export function nudgeCurve(
  frame: number,
  startFrame: number,
  durationFrames: number,
  fromPx: number,
  toPx: number,
): number {
  if (frame <= startFrame) return fromPx;
  const endFrame = startFrame + durationFrames;
  if (frame >= endFrame) return toPx;

  const p = (frame - startFrame) / durationFrames;
  let curved: number;
  if (p < 0.1) {
    // Phase 1 (10%): gentle wake-up
    const local = p / 0.1;
    curved = 0.08 * (local * local);
  } else if (p < 0.75) {
    // Phase 2 (65%): high-velocity transfer
    const local = (p - 0.1) / 0.65;
    curved = 0.08 + 0.8 * Easing.inOut(Easing.cubic)(local);
  } else {
    // Phase 3 (25%): cushioned settle
    const local = (p - 0.75) / 0.25;
    curved = 0.88 + 0.12 * (1 - Math.pow(1 - local, 3));
  }
  return fromPx + (toPx - fromPx) * curved;
}

/**
 * 5. OVERSIZED CURSOR (`oversized-cursor` skill — 7cqw protagonist pointer).
 * Enters physically from off-screen, lands tip at target, compresses on click (0.84 scale),
 * and ignites the next beat on the exact click frame.
 */
export interface CursorPose {
  xPercent: number;
  yPercent: number;
  scale: number;
  clicking: boolean;
  clickRippleProgress: number;
}

export function computeOversizedCursor(
  frame: number,
  config: {
    enterStartFrame: number;
    arriveFrame: number;
    clickFrame: number;
    exitStartFrame: number;
    exitEndFrame: number;
    targetXPercent: number;
    targetYPercent: number;
    exitXPercent?: number;
    exitYPercent?: number;
  },
): CursorPose {
  const {
    enterStartFrame,
    arriveFrame,
    clickFrame,
    exitStartFrame,
    exitEndFrame,
    targetXPercent,
    targetYPercent,
    exitXPercent = -14,
    exitYPercent = 42,
  } = config;

  // Off-screen resting pose below canvas (116% Y)
  let xPercent = targetXPercent + 12;
  let yPercent = 116;

  if (frame >= enterStartFrame && frame < exitStartFrame) {
    const enterP = interpolate(frame, [enterStartFrame, arriveFrame], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    xPercent = interpolate(enterP, [0, 1], [targetXPercent + 12, targetXPercent]);
    yPercent = interpolate(enterP, [0, 1], [116, targetYPercent]);
  } else if (frame >= exitStartFrame) {
    const exitP = interpolate(frame, [exitStartFrame, exitEndFrame], [0, 1], {
      ...clamp,
      easing: Easing.in(Easing.cubic),
    });
    xPercent = interpolate(exitP, [0, 1], [targetXPercent, exitXPercent]);
    yPercent = interpolate(exitP, [0, 1], [targetYPercent, exitYPercent]);
  }

  // Click compression: 3 frames down to 0.84, 7 frames release to 1.0
  let scale = 1;
  if (frame >= clickFrame && frame <= clickFrame + 10) {
    if (frame <= clickFrame + 3) {
      scale = interpolate(frame, [clickFrame, clickFrame + 3], [1, 0.84], {
        ...clamp,
        easing: Easing.in(Easing.quad),
      });
    } else {
      scale = interpolate(frame, [clickFrame + 3, clickFrame + 10], [0.84, 1], {
        ...clamp,
        easing: Easing.out(Easing.quad),
      });
    }
  }

  const clickRippleProgress =
    frame >= clickFrame && frame <= clickFrame + 18
      ? interpolate(frame, [clickFrame, clickFrame + 18], [0, 1], clamp)
      : 0;

  return {
    xPercent,
    yPercent,
    scale,
    clicking: frame >= clickFrame && frame <= clickFrame + 6,
    clickRippleProgress,
  };
}
