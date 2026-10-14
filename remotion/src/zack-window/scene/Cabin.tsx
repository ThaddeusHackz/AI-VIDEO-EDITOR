import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { aluminum, frameDark, matte } from "./materials";
import { roundedRect, windowShape } from "./util";
import { X_SKIN } from "./Window";

/*
 * Set dressing for the interior rig, all in WORLD coordinates (metres).
 * The sidewall's inner surface is at x = wallX (0.58); the fuselage axis runs along z.
 * Everything here is "cabin slice floating in the void": just enough cues to read
 * "airliner" at a glance (bins + PSU above, dado seam below, seat belt, shade lip).
 */

const ROT_TO_X: [number, number, number] = [0, Math.PI / 2, 0];

/* ───────────────────────── Overhead stowage bin + passenger service unit ───────────────────────── */

export const OverheadBin: React.FC<{
  wallX: number;
  /** z centre of the slice */
  z: number;
  length?: number;
  /** z positions of the seat rows that get a PSU (lights + gaspers) */
  rows?: number[];
  /** x positions of the seats in a row */
  seatsX?: number[];
}> = ({ wallX, z, length = 2.0, rows = [-0.15, -0.94], seatsX = [0.30, -0.22] }) => {
  const g = useMemo(
    () => ({
      bin: new RoundedBoxGeometry(0.95, 0.50, length, 4, 0.07),
      lip: new RoundedBoxGeometry(0.03, 0.022, length - 0.04, 2, 0.008),
      psu: new RoundedBoxGeometry(0.83, 0.045, length - 0.04, 2, 0.01),
      lamp: new THREE.CylinderGeometry(0.013, 0.013, 0.012, 20),
      bezel: new THREE.TorusGeometry(0.016, 0.0035, 8, 28),
      gasper: new THREE.CylinderGeometry(0.009, 0.012, 0.014, 20),
      gasperRing: new THREE.TorusGeometry(0.013, 0.003, 8, 28),
    }),
    [length],
  );
  const m = useMemo(
    () => ({
      bin: matte({ color: "#eceef1", roughness: 0.5 }),
      lip: matte({ color: "#cfd3d9", roughness: 0.4 }),
      psu: matte({ color: "#e4e7eb", roughness: 0.55 }),
      lamp: new THREE.MeshStandardMaterial({ color: "#fff3dc", emissive: "#ffd9a0", emissiveIntensity: 0.9, roughness: 0.4 }),
      bezel: matte({ color: "#6e747c", roughness: 0.4 }),
      gasper: matte({ color: "#9aa0a8", roughness: 0.4 }),
    }),
    [],
  );
  const binX = wallX - 0.475 + 0.03; // back 3 cm buried in the wall → no seam
  const binBottom = 1.58;
  const psuX = wallX - 0.03 - 0.415;
  return (
    <group>
      {/* the bin does not cast: a hard shadow across his face would fight the bright, even look */}
      <mesh geometry={g.bin} material={m.bin} position={[binX, binBottom + 0.25, z]} receiveShadow />
      <mesh geometry={g.lip} material={m.lip} position={[binX - 0.475 + 0.02, binBottom + 0.005, z]} />
      <mesh geometry={g.psu} material={m.psu} position={[psuX, binBottom - 0.018, z]} />
      {rows.map((rz) =>
        seatsX.map((sx) => (
          <group key={`${rz}-${sx}`}>
            <mesh geometry={g.lamp} material={m.lamp} position={[sx, binBottom - 0.045, rz]} />
            <mesh geometry={g.bezel} material={m.bezel} position={[sx, binBottom - 0.041, rz]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh geometry={g.gasper} material={m.gasper} position={[sx - 0.09, binBottom - 0.046, rz]} />
            <mesh geometry={g.gasperRing} material={m.bezel} position={[sx - 0.09, binBottom - 0.041, rz]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        )),
      )}
    </group>
  );
};

/* ───────────────────────── Sidewall trim: dado panel + seam ───────────────────────── */

export const WallTrim: React.FC<{ wallX: number; z: number; length?: number }> = ({ wallX, z, length = 2.0 }) => {
  const g = useMemo(
    () => ({
      seam: new THREE.BoxGeometry(0.006, 0.010, length),
      dado: new THREE.BoxGeometry(0.006, 0.78, length),
    }),
    [length],
  );
  const m = useMemo(() => ({ seam: matte({ color: "#b7bdc5" }), dado: matte({ color: "#e2e5e9" }) }), []);
  return (
    <group>
      <mesh geometry={g.dado} material={m.dado} position={[wallX - 0.001, 0.37, z]} receiveShadow />
      <mesh geometry={g.seam} material={m.seam} position={[wallX - 0.002, 0.76, z]} />
    </group>
  );
};

/* ───────────────────────── Lap belt on the passenger ───────────────────────── */

/** Flat ribbon that follows a Catmull-Rom curve and lies on a body whose local centre is `axisOf(p)`. */
const ribbonGeometry = (ctrl: THREE.Vector3[], width: number, axisOf: (p: THREE.Vector3) => THREE.Vector3, segments = 56) => {
  const curve = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");
  const pts = curve.getPoints(segments);
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const t = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();
  const nn = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const p = pts[i];
    curve.getTangent(i / segments, t).normalize();
    n.copy(p).sub(axisOf(p)).normalize();
    b.crossVectors(n, t).normalize();
    nn.crossVectors(t, b).normalize();
    const l = p.clone().addScaledVector(b, width / 2);
    const r = p.clone().addScaledVector(b, -width / 2);
    pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
    nrm.push(nn.x, nn.y, nn.z, nn.x, nn.y, nn.z);
    uv.push(0, i / segments, 1, i / segments);
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
};

export const SeatBelt: React.FC<{
  /** world position of the hips joint */
  hips: [number, number, number];
  /** optional tweak of the lap top (m above the hips joint) */
  lapRise?: number;
  /** z offset of the belt line in front of the hips joint (negative = forward) */
  lapZ?: number;
}> = ({ hips, lapRise = 0.1, lapZ = -0.235 }) => {
  const [hx, hy, hz] = hips;
  const geo = useMemo(() => {
    const P = (dx: number, dy: number, dz: number) => new THREE.Vector3(hx + dx, hy + dy, hz + dz);
    const ctrl = [
      P(-0.237, -0.085, lapZ + 0.015),
      P(-0.228, -0.01, lapZ + 0.005),
      P(-0.15, lapRise - 0.035, lapZ - 0.012),
      P(0.0, lapRise, lapZ - 0.03),
      P(0.15, lapRise - 0.035, lapZ - 0.012),
      P(0.228, -0.01, lapZ + 0.005),
      P(0.237, -0.085, lapZ + 0.015),
    ];
    const axis = (p: THREE.Vector3) => new THREE.Vector3(hx, hy - 0.06, p.z);
    return ribbonGeometry(ctrl, 0.05, axis);
  }, [hx, hy, hz, lapRise, lapZ]);
  const g = useMemo(
    () => ({
      buckle: new RoundedBoxGeometry(0.072, 0.012, 0.044, 3, 0.004),
      flap: new RoundedBoxGeometry(0.046, 0.004, 0.028, 2, 0.002),
    }),
    [],
  );
  const m = useMemo(
    () => ({
      web: new THREE.MeshStandardMaterial({ color: "#6a7282", roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
      buckle: new THREE.MeshStandardMaterial({ color: "#c9cdd2", roughness: 0.3, metalness: 0.65, envMapIntensity: 1.1 }),
      flap: new THREE.MeshStandardMaterial({ color: "#9ea3aa", roughness: 0.35, metalness: 0.6, envMapIntensity: 1.1 }),
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={geo} material={m.web} castShadow />
      <group position={[hx, hy + lapRise + 0.006, hz + lapZ - 0.03]} rotation={[-0.18, 0, 0]}>
        <mesh geometry={g.buckle} material={m.buckle} castShadow />
        <mesh geometry={g.flap} material={m.flap} position={[0.006, 0.008, 0]} />
      </group>
    </group>
  );
};

/* ───────────────────────── Fuselage exterior: window belt + curved skin + neighbour windows ───────────────────────── */

/** Open cylindrical panel around the fuselage axis (z), angles measured from +x towards +y. */
const arcPanel = (xc: number, yc: number, R: number, a0: number, a1: number, z0: number, z1: number, n = 48) => {
  const pos: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const cx = Math.cos(a);
    const sy = Math.sin(a);
    const x = xc + R * cx;
    const y = yc + R * sy;
    pos.push(x, y, z0, x, y, z1);
    nrm.push(cx, sy, 0, cx, sy, 0);
    if (i < n) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  geo.setIndex(idx);
  return geo;
};

const pathFromShape = (sh: THREE.Shape) => {
  const p = new THREE.Path();
  const pts = sh.getPoints(48);
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i].x, pts[i].y);
  p.closePath();
  return p;
};

/** window offsets along the fuselage (multiples of the pitch), main window = 0 */
const NEIGHBOURS = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7].map((k) => k * 0.53);

export const Fuselage: React.FC<{
  /** world centre of the main window */
  win: THREE.Vector3;
  /** window pitch along the fuselage */
  pitch?: number;
  length?: number;
  radius?: number;
}> = ({ win, pitch = 0.53, length = 8.4, radius = 3.0 }) => {
  const skinX = win.x + X_SKIN;
  const halfBelt = 0.36;
  const g = useMemo(() => {
    const belt = roundedRect(length, halfBelt * 2, 0.002);
    for (const d of NEIGHBOURS) {
      const cut = windowShape(0.315, 0.425);
      const path = new THREE.Path();
      const pts = cut.getPoints(48);
      path.moveTo(pts[0].x - d, pts[0].y);
      for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x - d, pts[i].y);
      path.closePath();
      belt.holes.push(path);
    }
    const beltGeo = new THREE.ExtrudeGeometry(belt, { depth: 0.004, bevelEnabled: false, curveSegments: 28 });
    const th1 = Math.asin(halfBelt / radius);
    const xc = skinX - radius * Math.cos(th1);
    // skin wraps past the crown and well under the belly so low exterior angles see a clean silhouette
    const upper = arcPanel(xc, win.y, radius, th1, th1 + 1.55, win.z - length / 2, win.z + length / 2, 64);
    const lower = arcPanel(xc, win.y, radius, -th1, -th1 - 2.7, win.z - length / 2, win.z + length / 2, 96);
    const seam = new THREE.BoxGeometry(0.004, 0.008, length);
    // lap-joint lines on the curved skin (scale cue in the wide exterior): angle + placement on the cylinder
    const laps = [th1 + 0.42, th1 + 0.86, -th1 - 0.40, -th1 - 0.82, -th1 - 1.3].map((a) => ({
      pos: [xc + (radius + 0.002) * Math.cos(a), win.y + (radius + 0.002) * Math.sin(a), win.z] as [number, number, number],
      rot: [0, 0, a] as [number, number, number],
    }));
    const outer = roundedRect(0.37, 0.48, 0.17);
    outer.holes.push(pathFromShape(windowShape(0.285, 0.395)));
    const frame = new THREE.ExtrudeGeometry(outer, { depth: 0.036, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 28 });
    const pane = new THREE.ExtrudeGeometry(windowShape(0.30, 0.41), { depth: 0.01, bevelEnabled: false, curveSegments: 28 });
    return { beltGeo, upper, lower, seam, frame, pane, laps };
  }, [length, pitch, radius, skinX, win.y, win.z]);
  const m = useMemo(
    () => ({
      skin: aluminum(),
      seam: matte({ color: "#b4bac1" }),
      frame: frameDark(),
      dark: new THREE.MeshStandardMaterial({ color: "#1d3250", roughness: 0.08, metalness: 0.15, envMapIntensity: 1.4, transparent: true, opacity: 0.92 }),
      shaded: new THREE.MeshStandardMaterial({ color: "#dfe5ec", roughness: 0.1, metalness: 0.05, envMapIntensity: 1.3, transparent: true, opacity: 0.94 }),
    }),
    [],
  );
  return (
    <group>
      <mesh geometry={g.beltGeo} material={m.skin} position={[skinX, win.y, win.z]} rotation={ROT_TO_X} receiveShadow />
      <mesh geometry={g.upper} material={m.skin} />
      <mesh geometry={g.lower} material={m.skin} />
      <mesh geometry={g.seam} material={m.seam} position={[skinX + 0.0015, win.y + halfBelt, win.z]} />
      <mesh geometry={g.seam} material={m.seam} position={[skinX + 0.0015, win.y - halfBelt, win.z]} />
      {g.laps.map((l, i) => (
        <mesh key={i} geometry={g.seam} material={m.seam} position={l.pos} rotation={l.rot} />
      ))}
      {/* neighbouring windows: dark (shade up, dim cabin) or with the shade pulled down */}
      {NEIGHBOURS.filter((d) => d !== 0).map((d, i) => (
        <group key={d} position={[win.x, win.y, win.z + d]}>
          <mesh geometry={g.frame} material={m.frame} position={[0.080, 0, 0]} rotation={ROT_TO_X} />
          <mesh geometry={g.pane} material={i % 3 === 0 ? m.dark : m.shaded} position={[0.101, 0, 0]} rotation={ROT_TO_X} />
        </group>
      ))}
    </group>
  );
};
