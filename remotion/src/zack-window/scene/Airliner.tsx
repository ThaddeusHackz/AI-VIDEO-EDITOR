import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/*
 * A clean narrow-body airliner built from lofts (nose +x, up +y, right wing +z), metres.
 * Only ever seen in the wide "high up in the void" shot, so the detail budget goes to the
 * silhouette: upswept tail, swept tapered wings with winglets, pod engines, window line.
 */

export const PLANE_L = 37.6;
export const PLANE_R = 1.98;

type Section = {
  le: THREE.Vector3;
  /** unit vector leading edge → trailing edge */
  chordDir: THREE.Vector3;
  /** unit vector of the "upper" side */
  thickDir: THREE.Vector3;
  chord: number;
  /** max thickness (absolute) */
  t: number;
  /** lower-surface thickness factor (flat-ish bottom) */
  lower?: number;
};

/** NACA-style half-thickness distribution, normalised to 1 at ~30 % chord. */
const foil = (c: number) => (0.2969 * Math.sqrt(c) - 0.126 * c - 0.3516 * c * c + 0.2843 * c ** 3 - 0.1036 * c ** 4) / 0.1;

/** Loft a closed airfoil loop through the given sections (open tip; DoubleSide material hides it). */
const loft = (sections: Section[], M = 32) => {
  const pos: number[] = [];
  const idx: number[] = [];
  const half = M / 2;
  const loop = (sec: Section, j: number) => {
    const upper = j <= half;
    const k = upper ? j / half : (M - j) / half; // 0 → 1 → 0, cosine spaced
    const c = 0.5 - 0.5 * Math.cos(k * Math.PI);
    const th = 0.5 * sec.t * Math.max(0, foil(Math.min(1, c))) * (upper ? 1 : -(sec.lower ?? 0.7));
    return sec.le.clone().addScaledVector(sec.chordDir, c * sec.chord).addScaledVector(sec.thickDir, th);
  };
  const N = sections.length - 1;
  for (let i = 0; i <= N; i++) {
    for (let j = 0; j <= M; j++) {
      const p = loop(sections[i], j % M);
      pos.push(p.x, p.y, p.z);
      if (i < N && j < M) {
        const a = i * (M + 1) + j;
        const b = a + M + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** Fuselage profile from the nose (s = 0): radius + centreline height. */
export const fuselageProfile = (s: number, L = PLANE_L, R = PLANE_R) => {
  const sn = 5.4;
  const st = 24.0;
  if (s < sn) {
    const u = s / sn;
    const r = R * Math.pow(Math.sin((u * Math.PI) / 2), 0.72);
    return { r, yc: -(R - r) * 0.34 };
  }
  if (s < st) return { r: R, yc: 0 };
  const u = (s - st) / (L - st);
  const r = R * Math.max(0.1, 1 - Math.pow(u, 1.3) * 0.92);
  return { r, yc: (R - r) * 0.9 };
};

const fuselageGeometry = (L = PLANE_L, R = PLANE_R, N = 160, M = 64) => {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const s = L * (i / N);
    const { r, yc } = fuselageProfile(s, L, R);
    for (let j = 0; j <= M; j++) {
      const th = (j / M) * Math.PI * 2;
      pos.push(L / 2 - s, yc + r * Math.cos(th), r * Math.sin(th));
      if (i < N && j < M) {
        const a = i * (M + 1) + j;
        const b = a + M + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const AFT = V(-1, 0, 0);

/** Swept, tapered lifting surface; `side` mirrors in z. */
const wingSections = (o: {
  rootLE: THREE.Vector3; rootChord: number; tipChord: number; span: number; sweepDeg: number; dihedralDeg: number;
  tRoot: number; tTip: number; side: 1 | -1; stations?: number[]; thickDir?: THREE.Vector3;
}): Section[] => {
  const sw = Math.tan((o.sweepDeg * Math.PI) / 180);
  const di = Math.tan((o.dihedralDeg * Math.PI) / 180);
  const st = o.stations ?? [0, 0.1, 0.25, 0.45, 0.65, 0.85, 1];
  return st.map((v) => {
    const chord = o.rootChord + (o.tipChord - o.rootChord) * v;
    return {
      le: o.rootLE.clone().add(V(-o.span * v * sw, o.span * v * di, o.side * o.span * v)),
      chordDir: AFT,
      thickDir: o.thickDir ?? Y,
      chord,
      t: chord * (o.tRoot + (o.tTip - o.tRoot) * v),
      lower: 0.7,
    };
  });
};

const nacelleGeometry = () => {
  // profile (radius, axial) → lathe around y, then rotated so the axis is x
  const pts = [
    [0.62, 0.0], [0.86, 0.02], [1.0, 0.12], [1.08, 0.5], [1.1, 1.6], [1.06, 2.6], [0.92, 3.6], [0.78, 4.3], [0.72, 4.5],
    [0.6, 4.5], [0.62, 4.0], [0.66, 3.4],
  ].map(([r, a]) => new THREE.Vector2(r, a));
  return new THREE.LatheGeometry(pts, 40);
};

const coreGeometry = () => {
  const pts = [[0.0, 0.0], [0.5, 0.0], [0.5, 0.4], [0.36, 0.9], [0.14, 1.25], [0.0, 1.3]].map(([r, a]) => new THREE.Vector2(r, a));
  return new THREE.LatheGeometry(pts, 24);
};

export const Airliner: React.FC<{ roll?: number }> = ({ roll = 0 }) => {
  const g = useMemo(() => {
    const L = PLANE_L;
    const R = PLANE_R;
    const fus = fuselageGeometry();
    const wingL = loft(wingSections({ rootLE: V(4.9, -1.2, 0.6), rootChord: 7.4, tipChord: 1.5, span: 17.0, sweepDeg: 25, dihedralDeg: 5.5, tRoot: 0.13, tTip: 0.09, side: 1 }));
    const wingR = loft(wingSections({ rootLE: V(4.9, -1.2, -0.6), rootChord: 7.4, tipChord: 1.5, span: 17.0, sweepDeg: 25, dihedralDeg: 5.5, tRoot: 0.13, tTip: 0.09, side: -1 }));
    // winglets grow out of the tips, canted 22° outward
    const tipLE = (side: 1 | -1) => V(4.9 - 17.0 * Math.tan(0.4363), -1.2 + 17.0 * Math.tan(0.096), side * 17.0);
    const winglet = (side: 1 | -1) => {
      const base = tipLE(side);
      const up = V(0, Math.cos(0.384), side * Math.sin(0.384)); // 22° cant
      const h = 2.5;
      const n = new THREE.Vector3().crossVectors(X, up).normalize(); // fin normal (⊥ chord and cant)
      const secs: Section[] = [0, 0.5, 1].map((v) => ({
        le: base.clone().addScaledVector(up, h * v).add(V(-h * v * Math.tan(0.7), 0, 0)),
        chordDir: AFT,
        thickDir: n,
        chord: 1.5 - 0.9 * v,
        t: (1.5 - 0.9 * v) * 0.08,
        lower: 1,
      }));
      return loft(secs, 24);
    };
    const finBaseY = fuselageProfile(31).yc + fuselageProfile(31).r - 0.4;
    const finH = 6.6;
    const finSecs: Section[] = [0, 0.25, 0.5, 0.75, 1].map((v) => {
      const chord = 6.6 - 4.6 * v;
      return { le: V(L / 2 - 30.4 - finH * v * Math.tan(0.663), finBaseY + finH * v, 0), chordDir: AFT, thickDir: V(0, 0, 1), chord, t: chord * (0.1 - 0.02 * v), lower: 1 };
    });
    const fin = loft(finSecs, 24);
    // horizontal stabilisers on the tail cone
    const stabS = 33.2;
    const stabY = fuselageProfile(stabS).yc + 0.05;
    const stabL = loft(wingSections({ rootLE: V(L / 2 - stabS, stabY, 0.3), rootChord: 3.9, tipChord: 1.3, span: 6.2, sweepDeg: 32, dihedralDeg: 7, tRoot: 0.1, tTip: 0.08, side: 1 }), 24);
    const stabR = loft(wingSections({ rootLE: V(L / 2 - stabS, stabY, -0.3), rootChord: 3.9, tipChord: 1.3, span: 6.2, sweepDeg: 32, dihedralDeg: 7, tRoot: 0.1, tTip: 0.08, side: -1 }), 24);
    const nacelle = nacelleGeometry();
    const core = coreGeometry();
    const fan = new THREE.CircleGeometry(0.84, 40);
    const spinner = new THREE.ConeGeometry(0.22, 0.5, 20);
    const pylon = new THREE.BoxGeometry(2.6, 1.3, 0.3);
    const tailCone = new THREE.SphereGeometry(fuselageProfile(L).r, 16, 12);
    const win = new THREE.PlaneGeometry(0.28, 0.4);
    const cockpit = new THREE.PlaneGeometry(0.95, 0.5);
    return { fus, wingL, wingR, wingletL: winglet(1), wingletR: winglet(-1), fin, stabL, stabR, nacelle, core, fan, spinner, pylon, tailCone, win, cockpit };
  }, []);

  const m = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({ color: "#f4f6f8", roughness: 0.32, metalness: 0.04, envMapIntensity: 0.9, side: THREE.DoubleSide }),
      belly: new THREE.MeshStandardMaterial({ color: "#dfe3e8", roughness: 0.4, metalness: 0.04, envMapIntensity: 0.8, side: THREE.DoubleSide }),
      nacelle: new THREE.MeshStandardMaterial({ color: "#e3e6ea", roughness: 0.3, metalness: 0.1, envMapIntensity: 1.0, side: THREE.DoubleSide }),
      dark: new THREE.MeshStandardMaterial({ color: "#2a2f37", roughness: 0.5, metalness: 0.3 }),
      glass: new THREE.MeshStandardMaterial({ color: "#16233a", roughness: 0.15, metalness: 0.2, envMapIntensity: 1.2, side: THREE.DoubleSide }),
    }),
    [],
  );

  // cabin windows + cockpit glazing laid on the fuselage surface
  const winRef = useRef<THREE.InstancedMesh>(null);
  const cockpitRef = useRef<THREE.InstancedMesh>(null);
  const WIN_N = 2 * 44;
  useLayoutEffect(() => {
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const place = (mesh: THREE.InstancedMesh, i: number, s: number, thFromTop: number, side: 1 | -1, lift: number) => {
      const { r, yc } = fuselageProfile(s);
      const n = V(0, Math.cos(thFromTop), side * Math.sin(thFromTop));
      const p = V(PLANE_L / 2 - s, yc, 0).addScaledVector(n, r + lift);
      q.setFromUnitVectors(V(0, 0, 1), n);
      mat.compose(p, q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, mat);
    };
    if (winRef.current) {
      let i = 0;
      for (const side of [1, -1] as const) {
        for (let k = 0; k < 44; k++) place(winRef.current, i++, 6.8 + k * 0.53, 1.13, side, 0.012);
      }
      winRef.current.instanceMatrix.needsUpdate = true;
    }
    if (cockpitRef.current) {
      let i = 0;
      for (const side of [1, -1] as const) {
        place(cockpitRef.current, i++, 3.05, 1.0, side, 0.012);
        place(cockpitRef.current, i++, 3.95, 1.2, side, 0.012);
      }
      cockpitRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const engine = (side: 1 | -1) => {
    const z = side * 5.7;
    const xLE = 4.9 - 5.7 * Math.tan(0.4363);
    const yWing = -1.2 + 5.7 * Math.tan(0.096);
    const yAxis = yWing - 1.5;
    return (
      <group key={side} position={[xLE + 2.0, yAxis, z]}>
        {/* lathe axis is +y; turn it to point aft (−x) */}
        <mesh geometry={g.nacelle} material={m.nacelle} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow />
        <mesh geometry={g.fan} material={m.dark} position={[-0.25, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <mesh geometry={g.spinner} material={m.nacelle} position={[-0.05, 0, 0]} rotation={[0, 0, -Math.PI / 2]} />
        <mesh geometry={g.core} material={m.dark} position={[-4.0, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={g.pylon} material={m.body} position={[-1.8, 0.95, 0]} rotation={[0, 0, 0.12]} castShadow />
      </group>
    );
  };

  return (
    <group rotation={[roll, 0, 0]}>
      <mesh geometry={g.fus} material={m.body} castShadow receiveShadow />
      <mesh geometry={g.tailCone} material={m.body} position={[-PLANE_L / 2, fuselageProfile(PLANE_L).yc, 0]} />
      <mesh geometry={g.wingL} material={m.body} castShadow receiveShadow />
      <mesh geometry={g.wingR} material={m.body} castShadow receiveShadow />
      <mesh geometry={g.wingletL} material={m.body} castShadow />
      <mesh geometry={g.wingletR} material={m.body} castShadow />
      <mesh geometry={g.fin} material={m.body} castShadow receiveShadow />
      <mesh geometry={g.stabL} material={m.body} castShadow receiveShadow />
      <mesh geometry={g.stabR} material={m.body} castShadow receiveShadow />
      {engine(1)}
      {engine(-1)}
      <instancedMesh ref={winRef} args={[g.win, m.glass, WIN_N]} />
      <instancedMesh ref={cockpitRef} args={[g.cockpit, m.glass, 4]} />
    </group>
  );
};
