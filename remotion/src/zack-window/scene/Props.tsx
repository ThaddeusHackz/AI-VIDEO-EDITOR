import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { airParticle, arrowBlue, arrowRed, fabricBlue, fabricDark, matte, plasticGrey } from "./materials";
import { clamp01, rng } from "./util";

/* ───────────────────────────── Seat ───────────────────────────── */

/** Economy seat facing -z. Origin at floor level under the seat centre. */
export const Seat: React.FC<{ position?: [number, number, number] }> = ({ position = [0, 0, 0] }) => {
  const g = useMemo(
    () => ({
      pan: new RoundedBoxGeometry(0.48, 0.11, 0.48, 4, 0.03),
      back: new RoundedBoxGeometry(0.48, 0.66, 0.12, 4, 0.035),
      bolster: new RoundedBoxGeometry(0.075, 0.50, 0.15, 3, 0.03),
      head: new RoundedBoxGeometry(0.31, 0.19, 0.09, 4, 0.03),
      wing: new RoundedBoxGeometry(0.045, 0.16, 0.085, 3, 0.018),
      cover: new RoundedBoxGeometry(0.24, 0.15, 0.004, 2, 0.002),
      arm: new RoundedBoxGeometry(0.06, 0.05, 0.42, 3, 0.02),
      armPad: new RoundedBoxGeometry(0.052, 0.014, 0.36, 2, 0.005),
      leg: new RoundedBoxGeometry(0.05, 0.42, 0.05, 2, 0.01),
      base: new RoundedBoxGeometry(0.48, 0.05, 0.44, 2, 0.01),
    }),
    [],
  );
  const m = useMemo(
    () => ({ blue: fabricBlue(), dark: fabricDark(), grey: plasticGrey(), cover: matte({ color: "#f3f3f0", roughness: 0.9 }) }),
    [],
  );
  const lean = -0.12;
  return (
    <group position={position}>
      <mesh geometry={g.pan} material={m.blue} position={[0, 0.44, 0]} castShadow receiveShadow />
      <mesh geometry={g.back} material={m.blue} position={[0, 0.80, 0.26]} rotation={[lean, 0, 0]} castShadow receiveShadow />
      {/* side bolsters give the backrest a contoured silhouette */}
      <mesh geometry={g.bolster} material={m.dark} position={[0.205, 0.78, 0.225]} rotation={[lean, 0, 0]} castShadow receiveShadow />
      <mesh geometry={g.bolster} material={m.dark} position={[-0.205, 0.78, 0.225]} rotation={[lean, 0, 0]} castShadow receiveShadow />
      {/* headrest with fold-forward wings and a cream cover */}
      <group position={[0, 1.18, 0.20]} rotation={[lean, 0, 0]}>
        <mesh geometry={g.head} material={m.dark} castShadow receiveShadow />
        <mesh geometry={g.cover} material={m.cover} position={[0, -0.005, -0.047]} />
        <mesh geometry={g.wing} material={m.dark} position={[0.165, 0, -0.02]} rotation={[0, -0.55, 0]} castShadow />
        <mesh geometry={g.wing} material={m.dark} position={[-0.165, 0, -0.02]} rotation={[0, 0.55, 0]} castShadow />
      </group>
      <mesh geometry={g.arm} material={m.grey} position={[0.27, 0.62, 0.05]} castShadow receiveShadow />
      <mesh geometry={g.arm} material={m.grey} position={[-0.27, 0.62, 0.05]} castShadow receiveShadow />
      <mesh geometry={g.armPad} material={m.dark} position={[0.27, 0.652, 0.03]} />
      <mesh geometry={g.armPad} material={m.dark} position={[-0.27, 0.652, 0.03]} />
      <mesh geometry={g.base} material={m.grey} position={[0, 0.36, 0.02]} castShadow receiveShadow />
      <mesh geometry={g.leg} material={m.grey} position={[0.18, 0.18, -0.12]} castShadow />
      <mesh geometry={g.leg} material={m.grey} position={[-0.18, 0.18, -0.12]} castShadow />
      <mesh geometry={g.leg} material={m.grey} position={[0.18, 0.18, 0.16]} castShadow />
      <mesh geometry={g.leg} material={m.grey} position={[-0.18, 0.18, 0.16]} castShadow />
    </group>
  );
};

/* ───────────────────────────── Arrows ───────────────────────────── */

/** Glossy 3D arrow pointing along +x, length `len`, shaft radius `r`. Origin at the tail. */
export const Arrow: React.FC<{
  len: number;
  r: number;
  color?: "red" | "blue";
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  opacity?: number;
}> = ({ len, r, color = "red", position, rotation, scale = 1, opacity = 1 }) => {
  const headLen = Math.min(len * 0.42, r * 4.2);
  const shaftLen = Math.max(0.001, len - headLen);
  const geo = useMemo(
    () => ({
      shaft: new THREE.CylinderGeometry(r, r, 1, 24, 1),
      head: new THREE.ConeGeometry(r * 2.3, 1, 32, 1),
    }),
    [r],
  );
  const mat = useMemo(() => (color === "red" ? arrowRed() : arrowBlue()), [color]);
  useLayoutEffect(() => {
    mat.transparent = opacity < 1;
    mat.opacity = opacity;
  }, [mat, opacity]);
  // cylinder/cone point along +y; rotate -90° around z to point along +x
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo.shaft} material={mat} position={[shaftLen / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, shaftLen, 1]} castShadow />
      <mesh geometry={geo.head} material={mat} position={[shaftLen + headLen / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, headLen, 1]} castShadow />
    </group>
  );
};

/**
 * Field of arrows pushing towards +x against a window-sized area (cabin pressure).
 * `drive` 0..1 scales them in; `pulse` is a frame counter for a gentle push cycle.
 */
export const PressureField: React.FC<{
  drive: number;
  pulse: number;
  x: number;
  rows?: number;
  cols?: number;
  spread?: [number, number];
  len?: number;
  r?: number;
  color?: "red" | "blue";
  stagger?: number;
}> = ({ drive, pulse, x, rows = 4, cols = 3, spread = [0.22, 0.32], len = 0.16, r = 0.012, color = "red", stagger = 0.08 }) => {
  const items: React.ReactNode[] = [];
  let i = 0;
  for (let ry = 0; ry < rows; ry++) {
    for (let cz = 0; cz < cols; cz++) {
      const y = (ry / (rows - 1) - 0.5) * spread[1];
      const z = (cz / Math.max(1, cols - 1) - 0.5) * spread[0];
      const d = clamp01((drive - i * stagger) / (1 - Math.min(0.9, stagger * rows * cols)));
      const s = d * (0.92 + 0.08 * Math.sin(pulse * 0.25 + i * 0.9));
      const push = 0.012 * Math.sin(pulse * 0.25 + i * 0.9);
      if (s > 0.001) {
        items.push(
          <Arrow key={i} len={len} r={r} color={color} position={[x - len + push, y, z]} scale={s} />,
        );
      }
      i++;
    }
  }
  return <group>{items}</group>;
};

/* ───────────────────────────── Air flow through the hole ───────────────────────────── */

type FlowProps = {
  /** hole centre in local coords */
  hole: THREE.Vector3;
  /** frame counter */
  t: number;
  /** 0..1 fade */
  amount: number;
  count?: number;
  /** particle radius */
  size?: number;
  /** how far on the cabin side the stream starts (x distance) */
  reach?: number;
  /** x offset (from the hole centre) where the stream exits into the gap */
  exitX?: number;
  /** half-thickness of the gap the air spreads into */
  gapSpread?: number;
  /** radius of the intake cone on the cabin side */
  cone?: number;
  /** radius of the fan-out inside the gap */
  fan?: number;
};

/** Instanced particles that converge into the bleed hole and spread into the inter-pane gap. */
export const AirFlow: React.FC<FlowProps> = ({
  hole, t, amount, count = 90, size = 0.0011, reach = 0.05, exitX = 0.008, gapSpread = 0.003, cone = 0.03, fan = 0.05,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(size, 10, 8), [size]);
  const mat = useMemo(() => airParticle(), []);
  const seeds = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: count }, () => ({
      phase: r(),
      speed: 0.55 + r() * 0.5,
      a: r() * Math.PI * 2,
      rad: 0.15 + r() * 0.85,
      b: r() * Math.PI * 2,
      rad2: 0.15 + r() * 0.85,
      jitter: (r() - 0.5) * 0.003,
    }));
  }, [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const vis = clamp01(amount);
    for (let i = 0; i < count; i++) {
      const sd = seeds[i];
      const u = (sd.phase + t * 0.0075 * sd.speed) % 1;
      // start: a cone of points on the cabin side of the middle pane
      const sx = hole.x - reach - sd.jitter;
      const sy = hole.y + Math.sin(sd.a) * sd.rad * cone;
      const sz = hole.z + Math.cos(sd.a) * sd.rad * cone;
      // end: inside the thin gap behind the middle pane, fanning out along the pane
      const ex = hole.x + exitX + gapSpread * Math.sin(sd.b * 3);
      const ey = hole.y + Math.sin(sd.b) * sd.rad2 * fan * 1.4;
      const ez = hole.z + Math.cos(sd.b) * sd.rad2 * fan;
      let x: number, y: number, z: number;
      if (u < 0.5) {
        const k = u / 0.5;
        const kk = k * k; // accelerate into the hole
        x = sx + (hole.x - sx) * kk;
        y = sy + (hole.y - sy) * kk;
        z = sz + (hole.z - sz) * kk;
      } else {
        const k = (u - 0.5) / 0.5;
        const kk = 1 - (1 - k) * (1 - k); // decelerate as it spreads
        x = hole.x + (ex - hole.x) * Math.min(1, kk * 2.5);
        y = hole.y + (ey - hole.y) * kk;
        z = hole.z + (ez - hole.z) * kk;
      }
      const fade = vis * (u < 0.1 ? u / 0.1 : u > 0.85 ? (1 - u) / 0.15 : 1);
      dummy.position.set(x, y, z);
      const sc = Math.max(0.0001, fade);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }, [t, amount, count, seeds, hole, reach, exitX, gapSpread, cone, fan, dummy]);

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
};
