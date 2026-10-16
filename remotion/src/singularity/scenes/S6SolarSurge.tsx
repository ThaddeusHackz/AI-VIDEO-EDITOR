import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CameraRigContainer, mulberry32, project3DPoint, useCameraRig, Vec3 } from "../../engine/cameraRig";
import { CyberHUDTracker } from "../../engine/vfxShaders";
import { createTorusKnotMesh } from "../../engine/threeSceneStudio";
import { Canvas2D } from "../components/Canvas2D";
import { FONT, KineticPhrase } from "../components/Words";
import { FPS, P, rgba, SCH, shot } from "../data";
import { useLayout } from "../layout";
import { makeNoise } from "../physics/noise";
import { clamp01, springProgress, SPRINGS } from "../physics/springs";

/**
 * S6 · solar-surge (f792–971). Astra shatters the sequence: 10,000 nodes. Every particle position is CLOSED-FORM:
 *   burst      r(t) = v/k · (1 − e^{−kt})            (radial blast with analytic drag)
 *   machinery  staggered closed-form springs into a rotating macro-architectural wireframe
 *              (torus-knot core from engine/threeSceneStudio, gyroscope rings, spokes, hex frames, lattice)
 *   topography springs into a live height-field whose contour bands glow (a flowing topographic map)
 * Rendered by additive splatting into one ImageData buffer + a quarter-resolution bloom pass.
 */
const S = shot("S6");
const N = 10000;
const [T_BURST, T_MACHINE, T_TOPO] = SCH.surgePhases;
const SWARM = { mass: 1, stiffness: 95, damping: 12.5 };

interface Particle {
  a: number;
  v: number;
  swirl: number;
  delay: number;
  delay2: number;
  cls: number;
  m: Vec3;
  gu: number;
  gv: number;
}

function machinePoints(count: number, seed: number): Vec3[] {
  const r = mulberry32(seed);
  const pts: Vec3[] = [];
  const knot = createTorusKnotMesh(2, 3, 150, 52, 160);
  const seg = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
  const rotX = (p: Vec3, a: number): Vec3 => ({ x: p.x, y: p.y * Math.cos(a) - p.z * Math.sin(a), z: p.y * Math.sin(a) + p.z * Math.cos(a) });
  const rotZ = (p: Vec3, a: number): Vec3 => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a), z: p.z });
  for (let i = 0; i < count; i++) {
    const k = r();
    if (k < 0.34) {
      const e = knot.edges[Math.floor(r() * knot.edges.length)];
      pts.push(seg(knot.vertices[e[0]], knot.vertices[e[1]], r()));
    } else if (k < 0.6) {
      const ring = Math.floor(r() * 3);
      const R = 300 + ring * 62;
      const a = r() * Math.PI * 2;
      const p = { x: Math.cos(a) * R, y: Math.sin(a) * R, z: 0 };
      pts.push(rotZ(rotX(p, 1.2 + ring * 0.55), ring * 0.9));
    } else if (k < 0.74) {
      const s = Math.floor(r() * 12);
      const a = (s / 12) * Math.PI * 2;
      const rr = 80 + r() * 340;
      pts.push({ x: Math.cos(a) * rr, y: (r() - 0.5) * 6, z: Math.sin(a) * rr });
    } else if (k < 0.88) {
      const side = r() < 0.5 ? -1 : 1;
      const h = Math.floor(r() * 6);
      const a0 = (h / 6) * Math.PI * 2;
      const a1 = ((h + 1) / 6) * Math.PI * 2;
      const t = r();
      const R = 250;
      if (r() < 0.75) pts.push({ x: Math.cos(a0 + (a1 - a0) * t) * R * (1 - 0.13 * Math.sin(Math.PI * t)), y: side * 230, z: Math.sin(a0 + (a1 - a0) * t) * R });
      else pts.push({ x: Math.cos(a0) * R, y: -230 + 460 * t, z: Math.sin(a0) * R });
    } else {
      const a = r() * Math.PI * 2;
      const lvl = Math.floor(r() * 7);
      pts.push({ x: Math.cos(a) * 470, y: -270 + lvl * 90, z: Math.sin(a) * 470 });
    }
  }
  return pts;
}

export const S6SolarSurge: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const L = useLayout();
  const { W, H, u } = L;
  const noise = makeNoise(6601);
  const crash = useCameraRig({ preset: "crash-zoom", startFrame: 0, durationInFrames: 22, intensity: 0.22 });

  const parts = useMemo<Particle[]>(() => {
    const r = mulberry32(6602);
    const machine = machinePoints(N, 6603);
    const cols = 125;
    return Array.from({ length: N }, (_, i) => ({
      a: r() * Math.PI * 2,
      v: (200 + r() ** 0.7 * 1050) * u,
      swirl: (r() - 0.5) * 2,
      delay: r() * 0.16,
      delay2: r() * 0.14,
      cls: r() < 0.62 ? 0 : r() < 0.7 ? 1 : 2,
      m: machine[i],
      gu: (i % cols) / (cols - 1),
      gv: Math.floor(i / cols) / (N / cols - 1),
    }));
  }, [u]);

  const buffers = useMemo(() => {
    if (typeof document === "undefined") return null;
    const small = document.createElement("canvas");
    small.width = Math.round(W / 4);
    small.height = Math.round(H / 4);
    return { img: new ImageData(W, H), small };
  }, [W, H]);

  const ox = L.pick(W * 0.66, W * 0.5);
  const oy = L.pick(H * 0.5, H * 0.56);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      if (!buffers) return;
      const fr = f + S.from;
      const t = (fr - T_BURST) / FPS;
      const data = buffers.img.data;
      data.fill(0);
      const tm = (fr - T_MACHINE) / FPS;
      const tt = (fr - T_TOPO) / FPS;
      const rotY = 0.65 * t;
      const rotX = 0.42 + 0.12 * Math.sin(t * 0.9);
      const scaleM = u * L.pick(1.3, 1.05);
      const k = 1.6;
      const blast = (1 - Math.exp(-k * Math.max(0, t))) / k;
      const COLS: Array<[number, number, number]> = [
        [0, 240, 255],
        [191, 252, 255],
        [255, 154, 92],
      ];
      for (let i = 0; i < N; i++) {
        const p = parts[i];
        // burst
        const swirlA = p.a + p.swirl * 0.9 * blast;
        const r0 = (30 + (p.v / u) * 0.06) * u; // ignition ring: never one stacked pixel
        let x = ox + Math.cos(swirlA) * (r0 + p.v * blast);
        let y = oy + Math.sin(swirlA) * (r0 + p.v * blast) * 0.82;
        let bright = 1.1 - 0.5 * blast;
        // machinery
        const pm = tm > p.delay ? springProgress(tm - p.delay, SWARM) : 0;
        if (pm > 0) {
          const mp = project3DPoint({ x: p.m.x * scaleM, y: p.m.y * scaleM, z: p.m.z * scaleM }, rotX, rotY, 0, 1100 * u, 1500 * u, ox, oy);
          x += (mp.x - x) * pm;
          y += (mp.y - y) * pm;
          bright = bright + (0.55 + 0.6 * clamp01((mp.scale - 0.55) * 1.4) - bright) * Math.min(1, pm);
        }
        // topography
        const pt = tt > p.delay2 ? springProgress(tt - p.delay2, SWARM) : 0;
        if (pt > 0) {
          const gx = (p.gu - 0.5) * 2100 * u;
          const gz = (p.gv - 0.5) * 1300 * u;
          const h = noise.fbm3(p.gu * 3.2, p.gv * 2.4, tt * 0.35 + 3, 3);
          const gy = -h * 430 * u;
          const tp = project3DPoint({ x: gx, y: gy, z: gz }, 0.95, 0.12 * Math.sin(tt * 0.6), 0, 1100 * u, 1500 * u, W * 0.5, oy + 60 * u);
          x += (tp.x - x) * pt;
          y += (tp.y - y) * pt;
          const band = Math.abs(((h * 7 + 10) % 1) - 0.5) * 2;
          const contour = Math.exp(-((1 - band) ** 2) / 0.02);
          const relief = Math.max(0, Math.min(1, 0.5 + h * 1.1));
          bright = bright + (0.12 + 0.5 * relief + 1.9 * contour - bright) * Math.min(1, pt);
        }
        const xi = x | 0;
        const yi = y | 0;
        if (xi < 1 || yi < 1 || xi >= W - 1 || yi >= H - 1) continue;
        const c = COLS[p.cls];
        const a = Math.min(1.8, bright) * 1.25;
        // 2×2 splat (+ a plus-shaped halo for bright nodes), plus a velocity streak while the wave is still radiating
        const streak = pm < 0.5 && t < 1.1 ? Math.round(3 * (1 - blast * 1.2)) : 0;
        for (let sIdx = 0; sIdx <= streak; sIdx++) {
          const sx = (xi - Math.round(Math.cos(swirlA) * sIdx * 3)) | 0;
          const sy = (yi - Math.round(Math.sin(swirlA) * sIdx * 2.5)) | 0;
          if (sx < 1 || sy < 1 || sx >= W - 2 || sy >= H - 2) continue;
          const w = a * (1 - sIdx / (streak + 1));
          const base = (sy * W + sx) * 4;
          for (const o of [0, 4, W * 4, W * 4 + 4]) {
            data[base + o] += c[0] * w;
            data[base + o + 1] += c[1] * w;
            data[base + o + 2] += c[2] * w;
            data[base + o + 3] = 255;
          }
          if (a > 1.0 && sIdx === 0) {
            for (const o of [-4, 8, -W * 4, W * 8]) {
              data[base + o] += c[0] * w * 0.45;
              data[base + o + 1] += c[1] * w * 0.45;
              data[base + o + 2] += c[2] * w * 0.45;
              data[base + o + 3] = 255;
            }
          }
        }
      }
      // ImageData alpha: let the void show through where nothing landed
      ctx.putImageData(buffers.img, 0, 0);
      // bloom: quarter-res blurred copy added back
      const sctx = buffers.small.getContext("2d")!;
      sctx.clearRect(0, 0, buffers.small.width, buffers.small.height);
      sctx.filter = "blur(3px)";
      sctx.drawImage(ctx.canvas, 0, 0, buffers.small.width, buffers.small.height);
      sctx.filter = "none";
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.6;
      ctx.drawImage(buffers.small, 0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      // white-hot ignition core (the frame the impact lands on is the brightest of the film, not the darkest)
      if (t < 0.45) {
        const core = Math.exp(-t / 0.12);
        const cg = ctx.createRadialGradient(ox, oy, 0, ox, oy, (220 + 900 * t) * u);
        cg.addColorStop(0, `rgba(255,255,255,${0.95 * core})`);
        cg.addColorStop(0.18, rgba(P.astraIce, 0.75 * core));
        cg.addColorStop(0.5, rgba(P.astraCyan, 0.35 * core));
        cg.addColorStop(1, rgba(P.astraCyan, 0));
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, W, H);
      }
      // shockwave ring at the burst
      if (t < 0.6) {
        const rr = 1600 * u * (1 - Math.exp(-3.2 * t)) + 90 * u;
        ctx.strokeStyle = rgba(P.astraIce, 0.8 * (1 - t / 0.6));
        ctx.lineWidth = 6 * u * (1 - t / 0.6) + 1;
        ctx.beginPath();
        ctx.ellipse(ox, oy, rr, rr * 0.82, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    [buffers, parts, W, H, u, L, ox, oy, noise],
  );

  const showHud = frame >= T_MACHINE + 10 && frame < T_TOPO;
  const hudA = clamp01((frame - T_MACHINE - 10) / 8) * clamp01((T_TOPO - frame) / 8);

  return (
    <AbsoluteFill>
      <CameraRigContainer rig={crash}>
        <Canvas2D draw={draw} />
      </CameraRigContainer>
      {showHud ? (
        <AbsoluteFill style={{ opacity: hudA }}>
          <CyberHUDTracker xPercent={(ox / W) * 100} yPercent={(oy / H) * 100 - 2} label="ASTRA CORE · TORUS KNOT 2:3" sublabel="10,000 NODES · SOLAR LATTICE" color={P.astraCyan} />
          <CyberHUDTracker xPercent={(ox / W) * 100 + L.pick(14, 22)} yPercent={(oy / H) * 100 + L.pick(24, 14)} label="GYRO RING 03" sublabel="r 424 · TILT 63°" color={P.astraIce} />
        </AbsoluteFill>
      ) : null}
      <KineticPhrase
        id="L3b"
        offset={S.from}
        x={L.safe}
        y={L.pick(H * 0.16, H * 0.1)}
        width={L.pick(W * 0.42, W - 2 * L.safe)}
        base={{ font: FONT.astra, size: 58, weight: 500, color: P.astraIce, mode: "burn" }}
        overrides={{
          solar: { font: FONT.astra, size: L.pick(132, 120), weight: 700, color: P.astraCyan, mode: "burn", breakBefore: true, glow: rgba(P.astraCyan, 0.6), tracking: "-0.04em" },
          logic: { font: FONT.astra, size: L.pick(132, 120), weight: 700, color: P.astraIce, mode: "burn", breakBefore: true, glow: rgba(P.astraCyan, 0.6), tracking: "-0.04em" },
        }}
        exitAt={S.to + 4}
      />
    </AbsoluteFill>
  );
};
