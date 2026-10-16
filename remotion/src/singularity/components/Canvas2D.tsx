import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * A full-frame 2D canvas redrawn synchronously for every frame (useLayoutEffect runs before Remotion captures).
 * `draw` must be a pure function of (ctx, frame, W, H) — no hidden state, no Math.random, no clocks.
 */
export const Canvas2D: React.FC<{
  draw: (ctx: CanvasRenderingContext2D, frame: number, W: number, H: number) => void;
  style?: React.CSSProperties;
  /** Render at a fraction of the frame size (cheap glow / blur passes). */
  scale?: number;
  blend?: React.CSSProperties["mixBlendMode"];
  opacity?: number;
}> = ({ draw, style, scale = 1, blend, opacity }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, w, h);
    if (scale !== 1) ctx.scale(scale, scale);
    draw(ctx, frame, width, height);
  }, [draw, frame, width, height, w, h, scale]);
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        mixBlendMode: blend,
        opacity,
        ...style,
      }}
    />
  );
};
