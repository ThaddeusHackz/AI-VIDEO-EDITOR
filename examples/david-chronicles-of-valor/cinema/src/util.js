// util.js — deterministic helpers for the DAVID cinema renderer.
// Zero wall-clock, zero Math.random: every value is a pure function of the frame index.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// stable per-frame rng: same frame always yields the same stream
export function rngFor(seed, frame) {
  return mulberry32((seed ^ Math.imul(frame + 1, 0x9E3779B1)) >>> 0);
}

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smootherstep = t => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const easeInCubic = t => t * t * t;
export const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInQuart = t => t * t * t * t;

// normalised position inside [a,b] with clamping
export const span = (t, a, b) => clamp((t - a) / Math.max(b - a, 1e-6));

// piecewise smooth curve through keys [{t,v}] (Monotone-ish cubic via hermite with finite diff)
export function curve(keys, t) {
  if (!keys.length) return 0;
  if (t <= keys[0].t) return keys[0].v;
  const n = keys.length;
  if (t >= keys[n - 1].t) return keys[n - 1].v;
  let i = 0;
  while (i < n - 2 && t > keys[i + 1].t) i++;
  const k0 = keys[i], k1 = keys[i + 1];
  const h = Math.max(k1.t - k0.t, 1e-6);
  const u = (t - k0.t) / h;
  const m0 = (i > 0 ? (k1.v - keys[i - 1].v) / Math.max(k1.t - keys[i - 1].t, 1e-6) : (k1.v - k0.v) / h) * h;
  const m1 = (i + 2 < n ? (keys[i + 2].v - k0.v) / Math.max(keys[i + 2].t - k0.t, 1e-6) : (k1.v - k0.v) / h) * h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * k0.v + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * k1.v + (u3 - u2) * m1;
}

// vec3 curve: keys [{t, x,y,z}]
export function curve3(keys, t) {
  return {
    x: curve(keys.map(k => ({ t: k.t, v: k.x })), t),
    y: curve(keys.map(k => ({ t: k.t, v: k.y })), t),
    z: curve(keys.map(k => ({ t: k.t, v: k.z })), t),
  };
}

// sample a keyframe list of vectors with Catmull-Rom-ish smoothing
export function track(keys, t, get = (k, c) => k[c], comps = ['x', 'y', 'z']) {
  const out = {};
  for (const c of comps) out[c] = curve(keys.map(k => ({ t: k.t, v: get(k, c) })), t);
  return out;
}

// deterministic 1D value noise (smooth, tileable-ish) for shake and drift
export function noise1(seed, x) {
  const i = Math.floor(x), f = x - i;
  const r = n => mulberry32((seed ^ Math.imul(n, 2654435761)) >>> 0)();
  const a = r(i), b = r(i + 1);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

export function noise3(seed, x, y, z) {
  const s = (n) => mulberry32((seed ^ Math.imul(n, 40503)) >>> 0)();
  const h = (i, j, k) => s(i * 374761393 + j * 668265263 + k * 2246822519);
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (dx, dy, dz) => h(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

export const DEG = Math.PI / 180;
