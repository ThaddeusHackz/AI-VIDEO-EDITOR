import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { BloomEffect, ChromaticAberrationEffect, EffectComposer, EffectPass, FXAAEffect, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { mulberry32 } from "../../engine/cameraRig";
import { computeOversizedCursor } from "../../engine/seamTransitions";
import { FONT, KineticPhrase } from "../components/Words";
import { EV, FPS, P, phrase, rgba, shot, WORD_EV } from "../data";
import { useLayout } from "../layout";
import { makeNoise } from "../physics/noise";
import { clamp01, ease, springAt, SPRINGS } from "../physics/springs";

/**
 * S2 · solar-ring (f108–215). True 3D (Three.js via @remotion/three, deterministic: every property is set from the
 * frame in layout effects; R3F's manual `advance` renders once per frame). Astra's cyan corona ring springs open
 * (closed-form) on Opus's amber line and spins AROUND it like a coin on an axle — the two always intersect at
 * (±R, 0, 0). The camera orbits, then dives into the right-hand intersection (seam → S3 zoom-through).
 */
const S = shot("S2");
const RING_R = 2.35;

export function ringRadius(frame: number): number {
  return RING_R * springAt(frame, EV.ringIgnite, FPS, SPRINGS.ring);
}

/**
 * The coin's spin about the line (x axis). In 9:16 it spins the other way, so the ring opens TOWARDS the lens across
 * the shot instead of flipping edge-on mid-shot. Edge-on, the ring is a ~10 px line across a 1920 px tall frame.
 */
export function ringSpin(frame: number, portrait: boolean): number {
  return 1.08 + (portrait ? -0.62 : 0.62) * Math.max(0, (frame - EV.ringIgnite) / FPS);
}

/**
 * Ignition feed: two amber pulses race along Opus's line into the corona's crossing points and reach ±R as the ring
 * opens, so the match-cut's first frames already carry the ignition's energy. Returns |x| and intensity.
 */
export function ignitionFeed(frame: number): { x: number; a: number } {
  const p = clamp01((frame - (EV.ringIgnite - 8)) / 14);
  const x = ringRadius(frame) + (6 - ringRadius(frame)) * (1 - p) ** 1.5;
  const a = clamp01((frame - EV.ringIgnite + 1) / 3) * (1 - clamp01((frame - (EV.ringIgnite + 6)) / 8));
  return { x, a };
}

export function ringCamera(frame: number, portrait: boolean) {
  const t = clamp01((frame - S.from) / (S.to - S.from));
  const orbit = ease.inOut3(clamp01(t / 0.82));
  const dive = ease.in4(clamp01((frame - (S.to - 26)) / 26));
  // match-cut from S1: at the cut the camera is dead-on (az = el = 0) so the 3D line lies exactly where the 2D line
  // was; it swings out to an oblique angle as the ring ignites, then orbits back through to the dive
  const open = ease.out4(clamp01((frame - S.from) / 30));
  const az = -0.42 * open * (1 - orbit) + 0.16 * orbit;
  const el = 0.16 * open * (1 - orbit) + 0.06 * orbit;
  // 9:16 opens at the 16:9 distance and RECOILS (closed-form spring) to its wider framing as the ring springs open:
  // the camera flinches back from the ignition instead of sitting on a thin line in a tall, empty frame
  const recoil = portrait ? springAt(frame, S.from, FPS, SPRINGS.panel) : 1;
  const baseDist = (portrait ? 6.4 + 3.0 * recoil : 6.4) - 1.5 * orbit;
  const R = ringRadius(frame);
  const target = new THREE.Vector3(R * dive, 0, 0);
  const dist = baseDist * (1 - 0.86 * dive);
  const pos = new THREE.Vector3(target.x + dist * Math.sin(az) * Math.cos(el), dist * Math.sin(el), dist * Math.cos(az) * Math.cos(el));
  return { pos, target, fov: portrait ? 50 : 34 };
}

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, outer);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const hdr = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k);

const RingWorld: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  // inside <ThreeCanvas> the frame is shot-local: convert to the film's absolute frame
  const frame = useCurrentFrame() + S.from;
  const { gl, scene, camera, size } = useThree();
  const noise = makeNoise(2201);

  const objs = useMemo(() => {
    const group = new THREE.Group();
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 40, 8), new THREE.MeshBasicMaterial({ color: hdr(P.opusEmber, 5), toneMapped: false }));
    line.rotation.z = Math.PI / 2;
    const lineHalo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 40, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: hdr(P.opusAmber, 1.2), transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    lineHalo.rotation.z = Math.PI / 2;
    const ring = new THREE.Group();
    const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.0085, 10, 360), new THREE.MeshBasicMaterial({ color: hdr(P.astraCyan, 5.5), toneMapped: false }));
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.045, 10, 240),
      new THREE.MeshBasicMaterial({ color: hdr(P.astraCyan, 1.1), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    const RAYS = 220;
    const rayGeo = new THREE.BufferGeometry();
    rayGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(RAYS * 6), 3));
    const rays = new THREE.LineSegments(
      rayGeo,
      new THREE.LineBasicMaterial({ color: hdr(P.astraCyan, 2.2), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,240,255,0.35)", "rgba(0,120,160,0.08)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    ring.add(torus, halo, rays, disc);
    const glint = glowTexture("rgba(255,255,255,1)", "rgba(255,190,140,0.5)");
    const gL = new THREE.Sprite(new THREE.SpriteMaterial({ map: glint, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const gR = gL.clone();
    const feed = glowTexture("rgba(255,244,230,1)", "rgba(217,119,87,0.6)");
    const fL = new THREE.Sprite(new THREE.SpriteMaterial({ map: feed, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    const fR = fL.clone();
    const r = mulberry32(2202);
    const DUST = 1400;
    const dpos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dpos[i * 3] = (r() - 0.5) * 30;
      dpos[i * 3 + 1] = (r() - 0.5) * 18;
      dpos[i * 3 + 2] = (r() - 0.5) * 30 - 4;
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ color: hdr(P.astraIce, 0.9), size: 0.028, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    group.add(line, lineHalo, ring, gL, gR, fL, fR, dust);
    return { group, ring, rays, RAYS, disc, gL, gR, fL, fR, dust };
  }, []);

  const post = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    composer.addPass(new RenderPass(scene, camera));
    // bloom + tone map + vignette in one pass; chromatic aberration + FXAA (convolutions) in a second
    composer.addPass(new EffectPass(camera, new BloomEffect({ intensity: 1.65, luminanceThreshold: 0.22, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.78, levels: 5, resolutionScale: 0.5 }), new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), new VignetteEffect({ offset: 0.32, darkness: 0.55 })));
    composer.addPass(new EffectPass(camera, new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0011, 0.0006), radialModulation: true, modulationOffset: 0.25 })));
    composer.addPass(new EffectPass(camera, new FXAAEffect()));
    return composer;
  }, [gl, scene, camera]);

  useLayoutEffect(() => {
    scene.add(objs.group);
    gl.setClearColor(new THREE.Color(P.void), 1);
    return () => {
      scene.remove(objs.group);
    };
  }, [scene, gl, objs]);
  useLayoutEffect(() => post.setSize(size.width, size.height, false), [post, size.width, size.height]);
  useLayoutEffect(() => () => post.dispose(), [post]);

  useLayoutEffect(() => {
    const t = (frame - EV.ringIgnite) / FPS;
    const R = ringRadius(frame);
    const vis = R > 0.002;
    objs.ring.visible = vis;
    objs.ring.scale.setScalar(Math.max(R, 0.001));
    // spin around the line (x axis): the ring plane always contains the x axis → it always crosses the line
    objs.ring.rotation.set(ringSpin(frame, portrait), 0, 0);
    const pos = objs.rays.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < objs.RAYS; i++) {
      const a = (i / objs.RAYS) * Math.PI * 2;
      const flare = 0.5 + 0.5 * noise.n3(Math.cos(a) * 2.2, Math.sin(a) * 2.2, t * 1.7);
      const len = 1.02 + 0.06 + 0.34 * flare * flare * clamp01(t * 2);
      pos.setXYZ(i * 2, Math.cos(a) * 1.012, Math.sin(a) * 1.012, 0);
      pos.setXYZ(i * 2 + 1, Math.cos(a) * len, Math.sin(a) * len, 0);
    }
    pos.needsUpdate = true;
    (objs.disc.material as THREE.MeshBasicMaterial).opacity = 0.9 * clamp01(t * 3);
    const beat = Math.exp(-(((frame - EV.ringIgnite) % 36) / 10));
    const gs = vis ? 0.55 + 0.35 * beat : 0;
    objs.gL.position.set(-R, 0, 0);
    objs.gR.position.set(R, 0, 0);
    objs.gL.scale.setScalar(gs);
    objs.gR.scale.setScalar(gs * 1.15);
    objs.gL.visible = objs.gR.visible = vis;
    const fd = ignitionFeed(frame);
    objs.fL.position.set(-fd.x, 0, 0);
    objs.fR.position.set(fd.x, 0, 0);
    objs.fL.scale.setScalar(Math.max(0.001, 0.62 * fd.a));
    objs.fR.scale.setScalar(Math.max(0.001, 0.62 * fd.a));
    objs.fL.visible = objs.fR.visible = fd.a > 0.001;
    objs.dust.rotation.y = frame * 0.0012;
    const cam = ringCamera(frame, portrait);
    const c = camera as THREE.PerspectiveCamera;
    c.position.copy(cam.pos);
    c.lookAt(cam.target);
    c.fov = cam.fov;
    c.near = 0.01;
    c.far = 100;
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
  }, [frame, objs, camera, portrait, noise]);

  useFrame(() => post.render(), 1);
  return null;
};

/** Project a world point with the shot's analytic camera (for 2D labels that track 3D geometry). */
function projectFor(frame: number, portrait: boolean, W: number, H: number, p: THREE.Vector3) {
  const cam = ringCamera(frame, portrait);
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.01, 100);
  c.position.copy(cam.pos);
  c.lookAt(cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = p.clone().project(c);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 };
}

let measureCtx: CanvasRenderingContext2D | null = null;
function textWidth(text: string, font: string): number {
  if (typeof document === "undefined") return text.length * 30;
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  measureCtx!.font = font;
  return measureCtx!.measureText(text).width;
}

export const S2SolarRing: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { width, height } = useVideoConfig();
  const L = useLayout();
  const { u } = L;

  const R = ringRadius(frame);
  const spin = ringSpin(frame, L.portrait);
  const top = projectFor(frame, L.portrait, width, height, new THREE.Vector3(R * 0.02, R * Math.sin(spin) * 1.0, R * Math.cos(spin)));
  const leftEnd = projectFor(frame, L.portrait, width, height, new THREE.Vector3(-R - 1.4, 0, 0));
  const labelIn = ease.out4(clamp01((frame - (EV.ringIgnite + 10)) / 18));
  const labelOut = 1 - ease.in4(clamp01((frame - (S.to - 30)) / 18));

  // kinetic phrase L1a, lower-left; the oversized cursor (the manual era's tool) pen-draws "hand-drawn"
  const phX = L.safe + 10 * u;
  const phY = L.pick(height * 0.1, height * 0.1);
  const phW = L.pick(width * 0.62, width - 2 * L.safe);
  const size = 66 * u;
  const font = `italic 500 ${size}px "Cormorant Garamond"`;
  const words = phrase("L1a").words;
  const idx = words.findIndex((w) => w.text.toLowerCase().startsWith("hand"));
  const before = words.slice(0, idx).map((w) => w.text).join(" ") + " ";
  const space = textWidth(" ", font) * 0.26 * 3.6;
  const lineW = textWidth(before, font) + space * 0.2;
  const wrap = lineW + textWidth("hand-drawn...", font) > phW;
  const wordX = phX + (wrap ? 0 : lineW);
  const wordY = phY + (wrap ? size * 1.04 : 0) + size * 0.62;
  const draw = clamp01((frame - WORD_EV.handDrawn) / 26);
  const cursor = computeOversizedCursor(frame, {
    enterStartFrame: WORD_EV.handDrawn - 26,
    arriveFrame: WORD_EV.handDrawn - 2,
    clickFrame: WORD_EV.handDrawn,
    exitStartFrame: S.to - 4,
    exitEndFrame: S.to + 10,
    targetXPercent: (wordX / width) * 100,
    targetYPercent: (wordY / height) * 100,
  });
  const dragX = ease.inOut3(draw) * textWidth("hand-drawn", font);
  const cursorX = (cursor.xPercent / 100) * width + (frame >= WORD_EV.handDrawn ? dragX : 0);
  const cursorY = (cursor.yPercent / 100) * height + (frame >= WORD_EV.handDrawn ? Math.sin(draw * Math.PI * 5) * 10 * u : 0);
  const cw = 0.07 * width; // house 7cqw protagonist cursor

  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} gl={{ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }} dpr={1} camera={{ fov: 34, near: 0.01, far: 100, position: [0, 0.6, 6.4] }} style={{ position: "absolute", inset: 0 }}>
        <RingWorld portrait={L.portrait} />
      </ThreeCanvas>
      {/* 3D-tracked labels: the two titans named in the geometry itself */}
      {!top.behind ? (
        <div style={{ position: "absolute", left: Math.min(width - L.safe - 420 * u, Math.max(L.safe, top.x + 18 * u)), top: Math.min(height - L.safe - 60 * u, Math.max(height * 0.3, top.y - 40 * u)), opacity: labelIn * labelOut, fontFamily: FONT.astra, fontSize: 17 * u, letterSpacing: "0.16em", color: P.astraCyan, whiteSpace: "nowrap" }}>
          <div style={{ width: 46 * u, height: 1, background: rgba(P.astraCyan, 0.7), marginBottom: 8 * u }} />
          GPT Astra 6.1 Sol <span style={{ color: rgba(P.astraIce, 0.55), fontFamily: FONT.code, fontSize: 13 * u }}>· corona r={R.toFixed(2)}</span>
        </div>
      ) : null}
      {!leftEnd.behind ? (
        <div style={{ position: "absolute", left: Math.max(L.safe, Math.min(width * 0.4, leftEnd.x - 120 * u)), top: Math.min(height - L.safe - 50 * u, Math.max(height * 0.3, leftEnd.y + 70 * u)), opacity: labelIn * labelOut, fontFamily: FONT.opus, fontStyle: "italic", fontSize: 34 * u, color: P.opusCream, whiteSpace: "nowrap" }}>
          Claude Opus 5.5 <span style={{ fontFamily: FONT.code, fontStyle: "normal", fontSize: 13 * u, color: rgba(P.opusEmber, 0.8) }}>· vector line</span>
        </div>
      ) : null}
      <KineticPhrase
        id="L1a"
        offset={S.from}
        x={phX}
        y={phY}
        width={phW}
        base={{ font: FONT.opus, size: 66, italic: true, weight: 500, color: P.opusCream }}
        overrides={{ "hand-drawn": { mode: "pen", color: P.opusAmber, size: 66, italic: true, weight: 600 } }}
        exitAt={S.to + 6}
      />
      {frame >= WORD_EV.handDrawn - 26 ? (
        <div
          style={{
            position: "absolute",
            left: cursorX - cw * 0.21,
            top: cursorY - cw * 0.14,
            width: cw,
            height: cw,
            transform: `scale(${cursor.scale.toFixed(3)})`,
            transformOrigin: "21% 14%",
            filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.6))",
          }}
        >
          <svg viewBox="0 0 24 24" width="100%" height="100%">
            <path d="M5 3L19 12L12 13.5L9 20L5 3Z" fill={P.opusCream} stroke={P.void} strokeWidth={1.4} strokeLinejoin="round" />
          </svg>
          {cursor.clickRippleProgress > 0 ? (
            <div
              style={{
                position: "absolute",
                left: "21%",
                top: "14%",
                width: 90 * u * cursor.clickRippleProgress,
                height: 90 * u * cursor.clickRippleProgress,
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                border: `${2 * u}px solid ${rgba(P.opusAmber, 1 - cursor.clickRippleProgress)}`,
              }}
            />
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
