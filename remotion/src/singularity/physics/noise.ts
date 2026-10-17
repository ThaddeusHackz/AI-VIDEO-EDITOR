/**
 * Deterministic seeded simplex noise (Stefan Gustavson's public-domain algorithm), permutation shuffled by the
 * engine's mulberry32 PRNG. Pure functions — safe for out-of-order frame rendering.
 */
import { mulberry32 } from "../../engine/cameraRig";

const GRAD3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

export interface Noise {
  n2: (x: number, y: number) => number;
  n3: (x: number, y: number, z: number) => number;
  fbm2: (x: number, y: number, octaves?: number) => number;
  fbm3: (x: number, y: number, z: number, octaves?: number) => number;
}

const cache = new Map<number, Noise>();

export function makeNoise(seed: number): Noise {
  const hit = cache.get(seed);
  if (hit) return hit;
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const n2 = (xin: number, yin: number): number => {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n0 = 0;
    let n1 = 0;
    let nn2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const g = permMod12[ii + perm[jj]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const g = permMod12[ii + i1 + perm[jj + j1]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const g = permMod12[ii + 1 + perm[jj + 1]] * 3;
      t2 *= t2;
      nn2 = t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2);
    }
    return 70 * (n0 + n1 + nn2);
  };

  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const n3 = (xin: number, yin: number, zin: number): number => {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
    } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
    else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
    else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const corner = (tx: number, ty: number, tz: number, gi: number) => {
      let tt = 0.6 - tx * tx - ty * ty - tz * tz;
      if (tt < 0) return 0;
      const g = gi * 3;
      tt *= tt;
      return tt * tt * (GRAD3[g] * tx + GRAD3[g + 1] * ty + GRAD3[g + 2] * tz);
    };
    const g0 = permMod12[ii + perm[jj + perm[kk]]];
    const g1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
    const g2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
    const g3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];
    return 32 * (corner(x0, y0, z0, g0) + corner(x1, y1, z1, g1) + corner(x2, y2, z2, g2) + corner(x3, y3, z3, g3));
  };

  const fbm2 = (x: number, y: number, octaves = 4) => {
    let a = 0.5;
    let f = 1;
    let sum = 0;
    for (let o = 0; o < octaves; o++) {
      sum += a * n2(x * f, y * f);
      f *= 2.03;
      a *= 0.5;
    }
    return sum;
  };
  const fbm3 = (x: number, y: number, z: number, octaves = 4) => {
    let a = 0.5;
    let f = 1;
    let sum = 0;
    for (let o = 0; o < octaves; o++) {
      sum += a * n3(x * f, y * f, z * f);
      f *= 2.03;
      a *= 0.5;
    }
    return sum;
  };
  const noise = { n2, n3, fbm2, fbm3 };
  cache.set(seed, noise);
  return noise;
}
