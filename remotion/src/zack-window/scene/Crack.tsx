import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { acrylic, type Clip } from "./materials";
import { clamp01, rng, smooth, windowShape } from "./util";
import { T_OUTER, WIN_H, WIN_W } from "./Window";

/*
 * 3D "cracks but holds" outer pane.
 *
 * The slab is pre-fractured into convex cells (a Voronoi diagram of a jittered polar grid of
 * seeds around the impact point, clipped to the window outline → radial + concentric cracks like
 * real spider-web fractures). Every cell is its own prism:
 *   group 0 caps        – same acrylic as the intact pane (cells tile the slab exactly → no seams)
 *   group 1 outer walls – the slab's bright edge material
 *   group 2 inner walls – the crack faces: bright, reflective, with PER-VERTEX alpha that is
 *                         revealed as a front expands from the impact point, so the fracture
 *                         surfaces (which span the slab thickness) grow outwards in 3D.
 * Cells also tilt a fraction of a degree once the front passes them, so the facets catch
 * different reflections – the "shattered but intact" look – without any texture overlay.
 */

type V2 = THREE.Vector2;
const V2 = THREE.Vector2;

const ROT_TO_X: [number, number, number] = [0, Math.PI / 2, 0];

/** Keep the part of a convex polygon closer to seed `a` than to seed `b`. */
const clipBisector = (poly: V2[], a: V2, b: V2): V2[] => {
  const nx = b.x - a.x;
  const ny = b.y - a.y;
  const c = (b.x * b.x + b.y * b.y - a.x * a.x - a.y * a.y) / 2;
  const f = (p: V2) => p.x * nx + p.y * ny - c;
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i];
    const Q = poly[(i + 1) % poly.length];
    const fp = f(P);
    const fq = f(Q);
    if (fp <= 0) out.push(P);
    if ((fp <= 0) !== (fq <= 0)) {
      const t = fp / (fp - fq);
      out.push(new V2(P.x + (Q.x - P.x) * t, P.y + (Q.y - P.y) * t));
    }
  }
  return out;
};

const distToOutline = (p: V2, outline: V2[]) => {
  let best = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const A = outline[i];
    const B = outline[(i + 1) % outline.length];
    const abx = B.x - A.x, aby = B.y - A.y;
    const l2 = abx * abx + aby * aby || 1e-12;
    const t = clamp01(((p.x - A.x) * abx + (p.y - A.y) * aby) / l2);
    const dx = p.x - (A.x + abx * t), dy = p.y - (A.y + aby * t);
    best = Math.min(best, Math.hypot(dx, dy));
  }
  return best;
};

type Cell = {
  geo: THREE.BufferGeometry;
  centroid: V2;
  /** distance of the cell centroid from the impact point */
  dist: number;
  tilt: [number, number];
  lift: number;
  /** per inner-wall vertex: reveal distance (front radius at which it becomes visible) */
  reveal: Float32Array;
  color: THREE.BufferAttribute;
};

const buildCells = (seed: number, thickness: number, impact: V2) => {
  const r = rng(seed);
  const outline = windowShape(WIN_W, WIN_H).getPoints(20);
  if (outline.length > 1 && outline[0].distanceTo(outline[outline.length - 1]) < 1e-9) outline.pop();

  // Seeds: jittered polar grid around the impact. Same angles across the outer rings → the
  // bisectors between angular neighbours line up into continuous radial cracks.
  const seeds: V2[] = [impact.clone()];
  const nRad = 9;
  const base = Array.from({ length: nRad }, (_, i) => (i / nRad) * Math.PI * 2 + (r() - 0.5) * 0.35);
  const rings = [0.028, 0.062, 0.105, 0.16, 0.24];
  rings.forEach((rad, k) => {
    const n = k === 0 ? 6 : nRad;
    for (let i = 0; i < n; i++) {
      const a = k === 0 ? (i / n) * Math.PI * 2 + 0.3 : base[i] + (r() - 0.5) * 0.12;
      const rr = rad * (1 + (r() - 0.5) * 0.28);
      seeds.push(new V2(impact.x + Math.cos(a) * rr, impact.y + Math.sin(a) * rr));
    }
  });

  const cells: Cell[] = [];
  for (let s = 0; s < seeds.length; s++) {
    let poly: V2[] = outline.map((p) => p.clone());
    for (let o = 0; o < seeds.length && poly.length; o++) {
      if (o !== s) poly = clipBisector(poly, seeds[s], seeds[o]);
    }
    if (poly.length < 3) continue;
    // area + centroid
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length];
      const w = P.x * Q.y - Q.x * P.y;
      area += w; cx += (P.x + Q.x) * w; cy += (P.y + Q.y) * w;
    }
    area /= 2;
    if (Math.abs(area) < 1e-7) continue;
    cx /= 6 * area; cy /= 6 * area;
    const centroid = new V2(cx, cy);

    const pos: number[] = [], nrm: number[] = [], col: number[] = [];
    const reveal: number[] = [];
    const push = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
      pos.push(x, y, z); nrm.push(nx, ny, nz); col.push(1, 1, 1, 1);
    };
    // caps (fan)
    const n = poly.length;
    for (let i = 1; i < n - 1; i++) {
      const A = poly[0], B = poly[i], C = poly[i + 1];
      push(A.x, A.y, thickness, 0, 0, 1); push(B.x, B.y, thickness, 0, 0, 1); push(C.x, C.y, thickness, 0, 0, 1);
    }
    for (let i = 1; i < n - 1; i++) {
      const A = poly[0], B = poly[i], C = poly[i + 1];
      push(A.x, A.y, 0, 0, 0, -1); push(C.x, C.y, 0, 0, 0, -1); push(B.x, B.y, 0, 0, 0, -1);
    }
    const capCount = pos.length / 3;
    // walls, outer first then inner
    const wall = (P: V2, Q: V2, inner: boolean) => {
      const dx = Q.x - P.x, dy = Q.y - P.y;
      const l = Math.hypot(dx, dy) || 1;
      const nx = dy / l, ny = -dx / l;
      const T = thickness;
      const tri = (a: [number, number, number], b: [number, number, number], c: [number, number, number]) => {
        push(a[0], a[1], a[2], nx, ny, 0); push(b[0], b[1], b[2], nx, ny, 0); push(c[0], c[1], c[2], nx, ny, 0);
      };
      tri([P.x, P.y, 0], [Q.x, Q.y, 0], [Q.x, Q.y, T]);
      tri([P.x, P.y, 0], [Q.x, Q.y, T], [P.x, P.y, T]);
      if (inner) {
        // concentric cracks (edge roughly perpendicular to the radial direction) open a beat later
        const mx = (P.x + Q.x) / 2 - impact.x, my = (P.y + Q.y) / 2 - impact.y;
        const ml = Math.hypot(mx, my) || 1;
        const radialness = Math.abs((dx * mx + dy * my) / (l * ml));
        const delay = radialness < 0.55 ? 0.05 : 0;
        const dP = P.distanceTo(impact) + delay, dQ = Q.distanceTo(impact) + delay;
        reveal.push(dP, dQ, dQ, dP, dQ, dP);
      }
    };
    const isOuter: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const P = poly[i], Q = poly[(i + 1) % n];
      isOuter.push(distToOutline(P, outline) < 2e-5 && distToOutline(Q, outline) < 2e-5);
    }
    for (let i = 0; i < n; i++) if (isOuter[i]) wall(poly[i], poly[(i + 1) % n], false);
    const outerEnd = pos.length / 3;
    for (let i = 0; i < n; i++) if (!isOuter[i]) wall(poly[i], poly[(i + 1) % n], true);
    const total = pos.length / 3;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
    const color = new THREE.Float32BufferAttribute(col, 4);
    color.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("color", color);
    geo.addGroup(0, capCount, 0);
    geo.addGroup(capCount, outerEnd - capCount, 1);
    geo.addGroup(outerEnd, total - outerEnd, 2);
    // inner-wall alpha starts hidden
    for (let v = outerEnd; v < total; v++) color.setW(v, 0);
    // pivot each prism about its own centroid so the settle-tilt opens hairline gaps, not offsets
    geo.translate(-centroid.x, -centroid.y, 0);
    cells.push({
      geo,
      centroid,
      dist: centroid.distanceTo(impact),
      tilt: [(r() - 0.5) * 0.018, (r() - 0.5) * 0.018],
      lift: (r() - 0.5) * 0.0008,
      reveal: new Float32Array(reveal),
      color,
    });
  }
  const far = Math.max(...outline.map((p) => p.distanceTo(impact)));
  return { cells, far };
};

type Props = {
  /** 0..1 crack propagation */
  progress: number;
  /** local x of the slab's inner face (same as the intact outer pane) */
  x: number;
  bow?: number;
  thick?: number;
  tint?: string;
  opacity?: number;
  side?: THREE.Side;
  clip?: Clip;
  impact?: [number, number];
};

export const CrackedPane: React.FC<Props> = ({
  progress, x, bow = 0, thick = 1, tint = "#eaf7ff", opacity = 0.22, side = THREE.DoubleSide, clip, impact = [-0.035, 0.045],
}) => {
  const thickness = T_OUTER * thick;
  const { cells, far } = useMemo(() => buildCells(21, thickness, new V2(impact[0], impact[1])), [thickness, impact]);
  const mats = useMemo(() => {
    const face = acrylic(clip, tint, opacity, side);
    const edge = acrylic(clip, "#f6fbff", Math.min(1, opacity * 3.2), side);
    edge.roughness = 0.14;
    const crack = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: new THREE.Color("#bfe6ff"),
      emissiveIntensity: 0.15,
      roughness: 0.1,
      metalness: 0.08,
      envMapIntensity: 1.7,
      transparent: true,
      opacity: 0.84,
      vertexColors: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    if (clip && clip.length) {
      crack.clippingPlanes = clip;
    }
    return [face, edge, crack] as THREE.Material[];
  }, [clip, tint, opacity, side]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useLayoutEffect(() => {
    const R = clamp01(progress) * (far + 0.06);
    cells.forEach((c, i) => {
      const m = refs.current[i];
      if (!m) return;
      // reveal the crack faces: alpha ramps over 1.5 cm of front travel
      const base = c.color.count - c.reveal.length;
      for (let v = 0; v < c.reveal.length; v++) {
        c.color.setW(base + v, smooth(R, c.reveal[v] - 0.004, c.reveal[v] + 0.012));
      }
      c.color.needsUpdate = true;
      // settle the facet a hair once the front has passed the cell
      const k = smooth(R, c.dist, c.dist + 0.035);
      m.rotation.set(c.tilt[0] * k, c.tilt[1] * k, 0);
      m.position.set(c.centroid.x, c.centroid.y, c.lift * k);
    });
  }, [progress, cells, far]);

  const s = 1 + bow * 0.01;
  return (
    <group position={[x, 0, 0]} rotation={ROT_TO_X} scale={[1, s, s]}>
      {cells.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          geometry={c.geo}
          material={mats}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
};
