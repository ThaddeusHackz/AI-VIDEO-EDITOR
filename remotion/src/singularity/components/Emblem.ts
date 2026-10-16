/**
 * The dual-emblem: an infinity weave (lemniscate of Bernoulli) in which Opus' amber loop and Astra's cyan loop
 * genuinely WEAVE — each passes over the other at one of the two centre crossings — with an isometric extrusion.
 * Shared by the monolith badge (S9, as a CanvasTexture) and the lockup (S10).
 */
import { P, rgba } from "../data";

export function lemniscate(t: number, a: number): [number, number] {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const d = 1 + s * s;
  return [(a * c) / d, (a * s * c) / d];
}

/** Draw a band along the lemniscate for t ∈ [t0, t1]. */
function band(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, t0: number, t1: number, width: number, fill: string, edge: string, dz: number) {
  const steps = Math.max(8, Math.ceil(((t1 - t0) / (Math.PI * 2)) * 220));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const [x, y] = lemniscate(t0 + ((t1 - t0) * i) / steps, a);
    pts.push([cx + x, cy + y * 1.0]);
  }
  // extrusion (isometric depth, drawn first, offset down-right)
  ctx.lineCap = "butt";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + dz * 0.6, y + dz) : ctx.moveTo(x + dz * 0.6, y + dz)));
  ctx.stroke();
  // dark keyline so the over/under gap reads
  ctx.strokeStyle = edge;
  ctx.lineWidth = width + 6;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  // specular centre line
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = Math.max(1, width * 0.12);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x - width * 0.12, y - width * 0.12) : ctx.moveTo(x - width * 0.12, y - width * 0.12)));
  ctx.stroke();
}

/**
 * @param progress 0..1 draw-on progress of the loops (elastic snap drives it in S10)
 */
export function drawInfinityWeave(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, width: number, progress = 1, glow = 1) {
  const p = Math.max(0, Math.min(1.05, progress));
  const H = Math.PI / 2;
  const edge = P.void;
  const dz = width * 0.45;
  ctx.save();
  if (glow > 0) {
    ctx.shadowColor = rgba(P.opusEmber, 0.6 * glow);
    ctx.shadowBlur = width * 1.6 * glow;
  }
  // right loop (Astra, cyan): t ∈ [−π/2, π/2]
  band(ctx, cx, cy, a, -H, -H + Math.PI * p, width, P.astraCyan, edge, dz);
  ctx.shadowColor = rgba(P.astraCyan, 0.6 * glow);
  // left loop (Opus, amber): t ∈ [π/2, 3π/2]
  band(ctx, cx, cy, a, H, H + Math.PI * p, width, P.opusAmber, edge, dz);
  ctx.restore();
  if (p >= 0.98) {
    // the weave: the lemniscate crosses itself once, at the centre. One strand (amber arm t→3π/2 flowing into the
    // cyan arm t→−π/2) is redrawn last with its keyline, so it passes cleanly OVER the other strand.
    ctx.save();
    band(ctx, cx, cy, a, 3 * H - 0.34, 3 * H + 0.001, width, P.opusAmber, edge, 0);
    band(ctx, cx, cy, a, -H - 0.001, -H + 0.34, width, P.astraCyan, edge, 0);
    ctx.restore();
  }
}
