/**
 * Closed-form spring physics for The Singularity Engine.
 *
 * Every animated value in the film that "springs" is evaluated ANALYTICALLY from the damped harmonic
 * oscillator  m·x'' + c·x' + k·x = 0  — no numerical stepping, no accumulated state. That makes each frame
 * a pure function of time (Remotion renders frames out of order on parallel workers) and lets us solve
 * for physical facts in closed form — e.g. the exact moment a spring first reaches its target, which is
 * how a letter's flight is launched so that it LOCKS on the frame where the sound design places its click.
 */
import { useCurrentFrame, useVideoConfig } from "remotion";

export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
}

export const SPRINGS = {
  /** Letter / glyph lock: lively overshoot, settles in ~0.45 s. */
  letter: { mass: 0.6, stiffness: 210, damping: 13 },
  /** Heavy architectural panels: slower, less overshoot. */
  panel: { mass: 1.4, stiffness: 160, damping: 22 },
  /** Elastic band snap (lockup): very stiff and underdamped. */
  elastic: { mass: 0.45, stiffness: 520, damping: 11 },
  /** Ring ignition: big radius, soft. */
  ring: { mass: 1, stiffness: 95, damping: 11 },
  /** Camera moves: near-critical, no wobble. */
  camera: { mass: 1, stiffness: 60, damping: 15.2 },
  /** Particle swarm reassembly. */
  swarm: { mass: 1, stiffness: 42, damping: 8.5 },
} satisfies Record<string, SpringConfig>;

export function dampingRatio(c: SpringConfig): number {
  return c.damping / (2 * Math.sqrt(c.stiffness * c.mass));
}

export function naturalFrequency(c: SpringConfig): number {
  return Math.sqrt(c.stiffness / c.mass);
}

/**
 * Displacement x(t) of a damped harmonic oscillator released at x(0)=x0 with velocity v(0)=v0.
 * Exact solution for the under-, critically- and over-damped regimes.
 */
export function oscillator(t: number, x0: number, v0: number, c: SpringConfig): number {
  if (t <= 0) return x0;
  const w0 = naturalFrequency(c);
  const z = dampingRatio(c);
  if (z < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - z * z);
    const B = (v0 + z * w0 * x0) / wd;
    return Math.exp(-z * w0 * t) * (x0 * Math.cos(wd * t) + B * Math.sin(wd * t));
  }
  if (z <= 1 + 1e-6) {
    return (x0 + (v0 + w0 * x0) * t) * Math.exp(-w0 * t);
  }
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  const C1 = (v0 - r2 * x0) / (r1 - r2);
  const C2 = x0 - C1;
  return C1 * Math.exp(r1 * t) + C2 * Math.exp(r2 * t);
}

/** Exact velocity x'(t) (used for velocity-matched seams and motion-blur amounts). */
export function oscillatorVelocity(t: number, x0: number, v0: number, c: SpringConfig): number {
  if (t <= 0) return v0;
  const w0 = naturalFrequency(c);
  const z = dampingRatio(c);
  if (z < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - z * z);
    const B = (v0 + z * w0 * x0) / wd;
    const e = Math.exp(-z * w0 * t);
    const cos = Math.cos(wd * t);
    const sin = Math.sin(wd * t);
    return e * (-z * w0 * (x0 * cos + B * sin) + (-x0 * wd * sin + B * wd * cos));
  }
  if (z <= 1 + 1e-6) {
    const e = Math.exp(-w0 * t);
    return e * ((v0 + w0 * x0) - w0 * (x0 + (v0 + w0 * x0) * t));
  }
  const s = Math.sqrt(z * z - 1);
  const r1 = -w0 * (z - s);
  const r2 = -w0 * (z + s);
  const C1 = (v0 - r2 * x0) / (r1 - r2);
  const C2 = x0 - C1;
  return C1 * r1 * Math.exp(r1 * t) + C2 * r2 * Math.exp(r2 * t);
}

/** Normalised spring progress 0 → 1 (overshoots past 1 when underdamped). */
export function springProgress(t: number, c: SpringConfig, v0 = 0): number {
  return 1 - oscillator(t, 1, -v0, c);
}

/**
 * Closed-form time (s) at which an underdamped spring released from rest FIRST reaches its target.
 * x(t) = e^{-ζω₀t}(cos ω_d t + B sin ω_d t) = 0  →  tan(ω_d t) = −1/B  →  t = (π − atan(1/B)) / ω_d.
 * For critically/over-damped springs the target is only approached; return the 98 % settle time instead.
 */
export function arrivalTime(c: SpringConfig): number {
  const w0 = naturalFrequency(c);
  const z = dampingRatio(c);
  if (z < 1 - 1e-6) {
    const wd = w0 * Math.sqrt(1 - z * z);
    const B = (z * w0) / wd;
    return (Math.PI - Math.atan(1 / B)) / wd;
  }
  return 3.9 / (z * w0);
}

/** Frames between launch and first arrival at 60 fps (or the given fps). */
export function arrivalFrames(c: SpringConfig, fps: number): number {
  return arrivalTime(c) * fps;
}

/**
 * Spring a value from `from` to `to`, launched at `startFrame`. Pure function of the frame.
 */
export function springAt(frame: number, startFrame: number, fps: number, c: SpringConfig, from = 0, to = 1): number {
  const t = (frame - startFrame) / fps;
  if (t <= 0) return from;
  return from + (to - from) * springProgress(t, c);
}

/**
 * Spring that ARRIVES (first reaches its target) exactly on `lockFrame`: the launch frame is solved from
 * the closed-form arrival time. Used for every letter / fold / snap whose click is placed on `lockFrame`.
 */
export function springLockedAt(frame: number, lockFrame: number, fps: number, c: SpringConfig, from = 0, to = 1): number {
  return springAt(frame, lockFrame - arrivalFrames(c, fps), fps, c, from, to);
}

/** Impulse response: a resting system kicked with unit velocity at `startFrame` (e.g. a shove on the beat). */
export function impulseAt(frame: number, startFrame: number, fps: number, c: SpringConfig, velocity = 1): number {
  const t = (frame - startFrame) / fps;
  if (t <= 0) return 0;
  return oscillator(t, 0, velocity, c);
}

/**
 * Plucked string (the opening "real-space spring snap"): a sum of damped standing-wave modes.
 * y(x, t) = Σ aₙ · e^{-ζₙ ωₙ t} · sin(ω_dn t + π/2) · sin(nπx)   for x ∈ [0, 1].
 */
export function pluckedString(x: number, t: number, amplitude: number, baseHz: number, zeta: number, modes = 3): number {
  if (t < 0) return 0;
  let y = 0;
  for (let n = 1; n <= modes; n++) {
    const w = 2 * Math.PI * baseHz * n;
    const z = zeta * (1 + 0.35 * (n - 1));
    const wd = w * Math.sqrt(1 - z * z);
    const a = amplitude / (n * n);
    y += a * Math.exp(-z * w * t) * Math.cos(wd * t) * Math.sin(n * Math.PI * x);
  }
  return y;
}

/** GSAP-compatible spring ease (HyperFrames side uses the same equation): p ∈ [0,1] over `seconds`. */
export function springEase(c: SpringConfig, seconds: number): (p: number) => number {
  return (p: number) => springProgress(p * seconds, c);
}

/** Hook: a closed-form spring evaluated at the current frame. */
export function useClosedFormSpring(startFrame: number, c: SpringConfig, from = 0, to = 1): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return springAt(frame, startFrame, fps, c, from, to);
}

/** Hook: a spring that locks on `lockFrame` (see springLockedAt). */
export function useLockedSpring(lockFrame: number, c: SpringConfig, from = 0, to = 1): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return springLockedAt(frame, lockFrame, fps, c, from, to);
}

/** Clamp helper. */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Smooth window: 0 before a, ramps to 1 by b, holds, ramps back to 0 between c and d. */
export function windowed(f: number, a: number, b: number, c: number, d: number): number {
  if (f <= a || f >= d) return 0;
  if (f < b) return (f - a) / (b - a);
  if (f <= c) return 1;
  return 1 - (f - c) / (d - c);
}

/** Power-curve eases used by the seam doctrine (mirrored power4 in/out). */
export const ease = {
  in4: (p: number) => clamp01(p) ** 4,
  out4: (p: number) => 1 - (1 - clamp01(p)) ** 4,
  inOut3: (p: number) => {
    const q = clamp01(p);
    return q < 0.5 ? 4 * q * q * q : 1 - (-2 * q + 2) ** 3 / 2;
  },
  outExpo: (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(p))),
  inExpo: (p: number) => (p <= 0 ? 0 : Math.pow(2, 10 * clamp01(p) - 10)),
};
