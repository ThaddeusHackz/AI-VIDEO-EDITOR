import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  matte,
  acrylic, aluminum, frameDark, insulation, plasticWhite, wallBeige, type Clip,
} from "./materials";
import { circlePath, roundedRect, windowShape, lerp, rng, clamp01 } from "./util";

/**
 * Airliner window assembly, local frame: origin = window centre, +x = outboard
 * (towards the sky), +y up, +z along the fuselage. Real-world metres.
 *
 * Inner "scratch" pane ─ gap ─ middle (fail-safe) pane WITH THE BLEED HOLE ─ 7 mm gap ─ outer (load) pane.
 */
export const WIN_W = 0.30; // middle/outer pane width
export const WIN_H = 0.41;
export const INNER_W = 0.26;
export const INNER_H = 0.37;
export const X_INNER = 0.030;
export const X_MIDDLE = 0.090; // centre of middle pane (8 mm thick)
export const T_MIDDLE = 0.008;
export const X_OUTER = 0.106; // centre of outer pane (10 mm thick)
export const T_OUTER = 0.010;
export const X_SKIN = 0.12;
export const HOLE_Y = -0.15; // bleed hole, bottom centre of the middle pane
export const HOLE_R = 0.0045; // exaggerated for legibility (real ≈ 1 mm)

/** Local position of the bleed hole centre. */
export const HOLE_LOCAL = new THREE.Vector3(X_MIDDLE, HOLE_Y, 0);

// Extrude along local +z, then rotate the mesh so depth runs along +x.
const ROT_TO_X: [number, number, number] = [0, Math.PI / 2, 0];

const extrude = (shape: THREE.Shape, depth: number, bevel = 0) =>
  new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 28,
  });

const ring = (ow: number, oh: number, orad: number, iw: number, ih: number) => {
  const s = roundedRect(ow, oh, orad);
  const inner = windowShape(iw, ih);
  const path = new THREE.Path();
  const pts = inner.getPoints(48);
  path.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i].x, pts[i].y);
  path.closePath();
  s.holes.push(path);
  return s;
};

type PanesProps = {
  /** 0 = stacked in place, 1 = fully exploded along +x */
  explode?: number;
  /** thickness/gap exaggeration for cutaways (1 = true scale) */
  thick?: number;
  side?: THREE.Side;
  /** override the middle pane's opacity (macro shots make the hole legible) */
  middleOpacity?: number;
  /** draw a thin dark rim around the bleed hole so it reads on camera */
  holeRim?: boolean;
  /** outer pane outward bulge 0..1 (few mm, for "takes all the pressure") */
  bow?: number;
  clip?: Clip;
  tint?: string;
  opacity?: number;
  /** highlight the middle pane (0..1) – used when "the middle one is a backup" */
  middleGlow?: number;
};

/** x-positions of the pane slabs for a given exaggeration factor (start x of each slab). */
export const paneLayout = (thick = 1, explode = 0, bow = 0) => {
  const tm = T_MIDDLE * thick;
  const to = T_OUTER * thick;
  const gap = 0.007 * thick;
  const xm = X_MIDDLE - T_MIDDLE / 2; // middle pane keeps its inner face
  const xo = xm + tm + gap + explode * 0.16 + bow * 0.004 * thick;
  const xi = X_INNER - 0.0015 - explode * 0.16;
  return { xi, xm, xo, tm, to, gap, holeX: xm + tm / 2, gapX: xm + tm + gap / 2 };
};

export const Panes: React.FC<PanesProps> = ({
  explode = 0, bow = 0, clip, tint, opacity, middleGlow = 0, thick = 1, side, middleOpacity, holeRim = true,
}) => {
  const geo = useMemo(() => {
    const inner = extrude(windowShape(INNER_W, INNER_H), 0.003, 0.0006);
    const midShape = windowShape(WIN_W, WIN_H);
    midShape.holes.push(circlePath(0, HOLE_Y, HOLE_R));
    const middle = extrude(midShape, T_MIDDLE * thick, 0.0008);
    const outer = extrude(windowShape(WIN_W, WIN_H), T_OUTER * thick, 0.001);
    const rim = new THREE.TorusGeometry(HOLE_R + 0.0003, 0.00055, 8, 40);
    const rimFar = new THREE.TorusGeometry(HOLE_R + 0.0002, 0.00035, 8, 40);
    const bore = new THREE.CylinderGeometry(HOLE_R + 0.00015, HOLE_R + 0.00015, T_MIDDLE * thick, 40, 1, true);
    bore.rotateX(Math.PI / 2);
    return { inner, middle, outer, rim, rimFar, bore };
  }, [thick]);
  const mats = useMemo(() => {
    const a = acrylic(clip, tint, opacity, side);
    const m = acrylic(clip, tint, middleOpacity ?? opacity, side);
    const o = acrylic(clip, tint, opacity, side);
    const rim = matte({ color: "#59616b" }, clip);
    const rimFar = matte({ color: "#a3abb4" }, clip);
    const bore = matte({ color: "#b9c3cc", side: THREE.DoubleSide }, clip);
    bore.transparent = true;
    bore.opacity = 0.75;
    return { a, m, o, rim, rimFar, bore };
  }, [clip, tint, opacity, side, middleOpacity]);

  useLayoutEffect(() => {
    const g = clamp01(middleGlow);
    mats.m.emissive = new THREE.Color("#58c8ff");
    mats.m.emissiveIntensity = g * 0.55;
    mats.m.opacity = (middleOpacity ?? opacity ?? 0.13) + g * 0.35;
  }, [middleGlow, mats, opacity, middleOpacity]);

  const { xi, xm, xo, tm } = paneLayout(thick, explode, bow);
  return (
    <group>
      <mesh geometry={geo.inner} material={mats.a} position={[xi, 0, 0]} rotation={ROT_TO_X} castShadow receiveShadow />
      <group position={[xm, 0, 0]} rotation={ROT_TO_X}>
        <mesh geometry={geo.middle} material={mats.m} castShadow receiveShadow />
        {holeRim && (
          <>
            <mesh geometry={geo.rim} material={mats.rim} position={[0, HOLE_Y, 0]} />
            <mesh geometry={geo.rimFar} material={mats.rimFar} position={[0, HOLE_Y, tm]} />
            <mesh geometry={geo.bore} material={mats.bore} position={[0, HOLE_Y, tm / 2]} />
          </>
        )}
      </group>
      <mesh
        geometry={geo.outer}
        material={mats.o}
        position={[xo, 0, 0]}
        rotation={ROT_TO_X}
        scale={[1, 1 + bow * 0.01, 1 + bow * 0.01]}
        castShadow
        receiveShadow
      />
    </group>
  );
};

type AssemblyProps = PanesProps & {
  /** multiplies the structural frame depth (cutaways with exaggerated panes) */
  frameDepth?: number;
  /** render interior trim + reveal */
  interior?: boolean;
  /** render exterior aluminium skin */
  exterior?: boolean;
  /** render the insulation/structure block (for cutaways) */
  structure?: boolean;
  children?: React.ReactNode;
};

/** Full wall section around the window. */
export const WindowAssembly: React.FC<AssemblyProps> = ({
  interior = true, exterior = true, structure = true, clip, children, frameDepth = 1, ...panes
}) => {
  const geo = useMemo(() => {
    // Interior trim panel 2.0 (z) × 2.4 (y) with the window cut-out, slightly curved inwards at the top.
    const wall = roundedRect(2.0, 2.4, 0.02);
    const cut = windowShape(0.30, 0.42);
    const cutPath = new THREE.Path();
    const pts = cut.getPoints(48);
    cutPath.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) cutPath.lineTo(pts[i].x, pts[i].y);
    cutPath.closePath();
    wall.holes.push(cutPath);
    // Flat panel: an untessellated extrude cannot be curved by shifting vertices without
    // tilting the whole face (which put interior cameras inside the wall).
    const wallGeo = extrude(wall, 0.03);

    const reveal = extrude(ring(0.40, 0.52, 0.18, INNER_W, INNER_H), 0.045, 0.004);
    const frame = extrude(ring(0.37, 0.48, 0.17, 0.285, 0.395), 0.036 * frameDepth, 0.0015);
    const struct = extrude(ring(0.62, 0.74, 0.2, 0.37, 0.48), 0.118);
    const skinShape = roundedRect(2.0, 2.4, 0.02);
    const skinCut = windowShape(0.315, 0.425);
    const sp = new THREE.Path();
    const spts = skinCut.getPoints(48);
    sp.moveTo(spts[0].x, spts[0].y);
    for (let i = 1; i < spts.length; i++) sp.lineTo(spts[i].x, spts[i].y);
    sp.closePath();
    skinShape.holes.push(sp);
    const skin = extrude(skinShape, 0.004);
    return { wallGeo, reveal, frame, struct, skin };
  }, [frameDepth]);

  const mats = useMemo(
    () => ({
      wall: wallBeige(clip),
      reveal: plasticWhite(clip),
      frame: frameDark(clip),
      struct: insulation(clip),
      skin: aluminum(clip),
    }),
    [clip],
  );

  return (
    <group>
      {interior && (
        <>
          <mesh geometry={geo.wallGeo} material={mats.wall} position={[-0.04, 0, 0]} rotation={ROT_TO_X} receiveShadow castShadow />
          <mesh geometry={geo.reveal} material={mats.reveal} position={[-0.012, 0, 0]} rotation={ROT_TO_X} receiveShadow castShadow />
        </>
      )}
      {structure && (
        <mesh geometry={geo.struct} material={mats.struct} position={[0.0, 0, 0]} rotation={ROT_TO_X} receiveShadow />
      )}
      <mesh geometry={geo.frame} material={mats.frame} position={[0.080, 0, 0]} rotation={ROT_TO_X} receiveShadow castShadow />
      <Panes clip={clip} {...panes} />
      {exterior && (
        <mesh geometry={geo.skin} material={mats.skin} position={[X_SKIN, 0, 0]} rotation={ROT_TO_X} receiveShadow castShadow />
      )}
      {children}
    </group>
  );
};

/* ───────────────────────── Overlays: fog + crack (canvas textures) ───────────────────────── */

const makeCanvas = (size: number) => {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
};

/** Frost/fog sheet that sits in the gap; opacity is animated by the parent. */
export const FogSheet: React.FC<{ amount: number; x?: number }> = ({ amount, x = X_MIDDLE + 0.007 }) => {
  const tex = useMemo(() => {
    const c = makeCanvas(512);
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);
    // soft frost: heavier at the edges, speckled
    const g = ctx.createRadialGradient(256, 256, 60, 256, 256, 300);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.6, "rgba(255,255,255,0.72)");
    g.addColorStop(1, "rgba(255,255,255,0.97)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const r = rng(7);
    for (let i = 0; i < 2600; i++) {
      const px = r() * 512;
      const py = r() * 512;
      const d = Math.hypot(px - 256, py - 256) / 256;
      ctx.fillStyle = `rgba(255,255,255,${(0.08 + 0.5 * d) * r()})`;
      ctx.beginPath();
      ctx.arc(px, py, 1 + r() * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const geo = useMemo(() => new THREE.ShapeGeometry(windowShape(WIN_W - 0.01, WIN_H - 0.01), 32), []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, roughness: 1, depthWrite: false, side: THREE.DoubleSide }),
    [tex],
  );
  useLayoutEffect(() => {
    mat.opacity = clamp01(amount) * 0.92;
  }, [amount, mat]);
  // ShapeGeometry lies in XY; rotate so it faces ±x
  return <mesh geometry={geo} material={mat} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} />;
};

type Seg = { pts: { x: number; y: number }[]; delay: number; w: number };

/** Builds a deterministic crack network radiating from an impact point. */
const buildCracks = (seed: number): Seg[] => {
  const r = rng(seed);
  const segs: Seg[] = [];
  const cx = 0.36, cy = 0.58; // impact point (uv)
  const main = 7;
  for (let i = 0; i < main; i++) {
    const ang = (i / main) * Math.PI * 2 + (r() - 0.5) * 0.6;
    const pts = [{ x: cx, y: cy }];
    let x = cx, y = cy, a = ang;
    const steps = 9 + Math.floor(r() * 6);
    for (let k = 0; k < steps; k++) {
      a += (r() - 0.5) * 0.7;
      const len = 0.03 + r() * 0.05;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      pts.push({ x, y });
      if (x < 0.02 || x > 0.98 || y < 0.02 || y > 0.98) break;
    }
    segs.push({ pts, delay: 0, w: 2.6 });
    // branches
    const nb = 1 + Math.floor(r() * 3);
    for (let b = 0; b < nb; b++) {
      const at = 2 + Math.floor(r() * Math.max(1, pts.length - 3));
      const p0 = pts[Math.min(at, pts.length - 1)];
      const bp = [{ x: p0.x, y: p0.y }];
      let bx = p0.x, by = p0.y, ba = ang + (r() < 0.5 ? 1 : -1) * (0.6 + r() * 0.8);
      const bs = 3 + Math.floor(r() * 5);
      for (let k = 0; k < bs; k++) {
        ba += (r() - 0.5) * 0.8;
        const len = 0.02 + r() * 0.035;
        bx += Math.cos(ba) * len;
        by += Math.sin(ba) * len;
        bp.push({ x: bx, y: by });
      }
      segs.push({ pts: bp, delay: 0.25 + r() * 0.35, w: 1.4 });
    }
  }
  return segs;
};

/** Crack overlay drawn on a canvas; `progress` 0..1 reveals it. Placed on the outer pane's outer face. */
export const CrackSheet: React.FC<{ progress: number; x?: number }> = ({ progress, x = X_OUTER + T_OUTER / 2 + 0.0004 }) => {
  const size = 1024;
  const canvas = useMemo(() => makeCanvas(size), []);
  const segs = useMemo(() => buildCracks(21), []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const geo = useMemo(() => new THREE.ShapeGeometry(windowShape(WIN_W, WIN_H), 32), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [tex],
  );
  const last = useRef(-1);
  useLayoutEffect(() => {
    const p = clamp01(progress);
    if (p === last.current) return;
    last.current = p;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const draw = (sg: Seg, frac: number, width: number, style: string) => {
      if (frac <= 0) return;
      const n = sg.pts.length - 1;
      const total = frac * n;
      const full = Math.floor(total);
      const part = total - full;
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(sg.pts[0].x * size, sg.pts[0].y * size);
      for (let i = 1; i <= Math.min(full, n); i++) ctx.lineTo(sg.pts[i].x * size, sg.pts[i].y * size);
      if (full < n) {
        const a = sg.pts[full], b = sg.pts[full + 1];
        ctx.lineTo(lerp(a.x, b.x, part) * size, lerp(a.y, b.y, part) * size);
      }
      ctx.stroke();
    };
    for (const sg of segs) {
      const f = clamp01((p - sg.delay) / (1 - sg.delay));
      // halo, then bright core, then a thin dark edge for contrast on bright backgrounds
      const w = Math.max(3.4, sg.w * 1.4);
      draw(sg, f, w * 4.0, "rgba(255,255,255,0.25)");
      draw(sg, f, w * 1.9, "rgba(40,60,85,0.7)");
      draw(sg, f, w, "rgba(255,255,255,1)");
    }
    mat.opacity = p > 0 ? 1 : 0;
    tex.needsUpdate = true;
  }, [progress, canvas, segs, tex, mat]);
  return <mesh geometry={geo} material={mat} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]} />;
};
