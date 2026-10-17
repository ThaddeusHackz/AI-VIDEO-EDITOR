import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { BloomEffect, EffectComposer, EffectPass, FXAAEffect, RenderPass, ToneMappingEffect, ToneMappingMode, VignetteEffect } from "postprocessing";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { AbsoluteFill, getInputProps, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

/** Profiling switches: --props='{"perf":{"noGodrays":true,"noPost":true,"lite":true}}' */
const PERF = ((getInputProps() as { perf?: Record<string, boolean> }).perf ?? {}) as Record<string, boolean>;
import { mulberry32 } from "../../engine/cameraRig";
import { HiggsfieldEffectsMix } from "../../engine/higgsfieldEffectsMix";
import { AnamorphicFlare, VolumetricGodrays } from "../../engine/vfxShaders";
import { drawInfinityWeave } from "../components/Emblem";
import { FONT, KineticPhrase } from "../components/Words";
import { EV, FPS, P, phrase, rgba, shot, WORD_EV } from "../data";
import { useLayout } from "../layout";
import { clamp01, ease, springAt, springProgress, SPRINGS } from "../physics/springs";

/**
 * S9 · monolith (f1224–1583). "The typography and geometry liquefy into a hyper-detailed metallic monolith."
 * Three.js (deterministic, frame-driven): 2,400 converging nodes, a chrome/obsidian monolith rising out of a rippling
 * liquid-metal pool through a clipping plane, edge glows, a mirrored floor reflection, volumetric light cones and dust.
 * Camera: crane-up → dolly-zoom on "Look closer." → 360° orbit → bullet-time stillness comma (dust at 8 % speed).
 */
const S = shot("S9");
const MONO = { w: 1.2, h: 3.1, d: 0.34 };
const RISE = { mass: 2, stiffness: 70, damping: 19 };
const ORBIT0 = EV.orbitStart;
/** The camera starts circling 30 frames before "The canvas is dead." so the dolly's tail hands straight into the orbit. */
const ORBIT_CAM0 = EV.orbitStart - 40;
const STILL = EV.stillness;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function monolithCamera(frame: number, portrait: boolean) {
  const a = ease.inOut3(clamp01((frame - S.from) / 108));
  const b = ease.out4(clamp01((frame - (EV.lookCloser - 14)) / 122));
  // ease-in only: the orbit is still at speed when it reaches the stillness comma, then the comma brakes it
  const c = ease.in4(clamp01((frame - ORBIT_CAM0) / (STILL - ORBIT_CAM0))) * 0.35 + clamp01((frame - ORBIT_CAM0) / (STILL - ORBIT_CAM0)) * 0.65;
  const still = clamp01((frame - STILL) / (S.to - STILL));
  let az = lerp(0.42, 0.16, a);
  let el = lerp(0.03, 0.17, a);
  let dist = lerp(7.6, 6.2, a);
  let target = new THREE.Vector3(0, lerp(1.0, 1.5, a), 0);
  let fov = 34;
  if (frame >= EV.lookCloser - 14) {
    az = lerp(0.16, 0.0, b);
    el = lerp(0.17, 0.06, b);
    dist = lerp(6.2, 2.35, b);
    target = new THREE.Vector3(0, lerp(1.5, 1.92, b), lerp(0, 0.17, b));
    fov = lerp(34, 50, b);
  }
  if (frame >= ORBIT_CAM0) {
    // start from the dolly's exact state at ORBIT_CAM0 so the hand-off has no positional pop
    const b0 = ease.out4(clamp01((ORBIT_CAM0 - (EV.lookCloser - 14)) / 122));
    const k = ease.inOut3(clamp01((frame - ORBIT_CAM0) / 60));
    az = lerp(0.16, 0.0, b0) + c * Math.PI * 2 + 0.04 * still;
    el = lerp(0.17, 0.06, b0) + 0.16 * Math.sin(c * Math.PI) + 0.02 * still;
    dist = lerp(lerp(6.2, 2.35, b0), 5.0, k);
    target = new THREE.Vector3(0, lerp(lerp(1.5, 1.92, b0), 1.5, k), lerp(lerp(0, 0.17, b0), 0, clamp01((frame - ORBIT_CAM0) / 60)));
    fov = lerp(lerp(34, 50, b0), 36, k);
  }
  if (portrait) {
    dist *= 1.5;
    fov += 12;
  }
  const pos = new THREE.Vector3(target.x + dist * Math.sin(az) * Math.cos(el), target.y + dist * Math.sin(el), target.z + dist * Math.cos(az) * Math.cos(el));
  return { pos, target, fov };
}

/** Joint badge (CanvasTexture): seal ring text, infinity weave, title, engraved micro-code for "Look closer." */
function badgeTexture(): THREE.CanvasTexture {
  const S2 = 1024;
  const c = document.createElement("canvas");
  c.width = S2;
  c.height = S2;
  const ctx = c.getContext("2d")!;
  const cx = S2 / 2;
  const cy = S2 / 2;
  ctx.clearRect(0, 0, S2, S2);
  ctx.strokeStyle = P.opusCream;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 470, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = P.opusAmber;
  ctx.beginPath();
  ctx.arc(cx, cy, 420, Math.PI / 2, (3 * Math.PI) / 2);
  ctx.stroke();
  ctx.strokeStyle = P.astraCyan;
  ctx.beginPath();
  ctx.arc(cx, cy, 420, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const len = i % 10 === 0 ? 22 : 9;
    ctx.strokeStyle = rgba(P.opusCream, i % 10 === 0 ? 0.9 : 0.45);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 470, cy + Math.sin(a) * 470);
    ctx.lineTo(cx + Math.cos(a) * (470 - len), cy + Math.sin(a) * (470 - len));
    ctx.stroke();
  }
  const ring = "CLAUDE OPUS 5.5  ·  GPT ASTRA 6.1 SOL  ·  THE SINGULARITY ENGINE  ·  ";
  ctx.font = '700 30px "Space Grotesk"';
  ctx.fillStyle = P.opusCream;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 382, cy + Math.sin(a) * 382);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = i < 15 ? P.opusAmber : i < 37 ? P.astraCyan : P.opusCream;
    ctx.fillText(ring[i], 0, 0);
    ctx.restore();
  }
  // engraved micro-code band (only legible on the "Look closer." push-in)
  ctx.font = '400 13px "JetBrains Mono"';
  ctx.fillStyle = rgba(P.opusCream, 0.5);
  const micro = ["const opus = spring({ k: 170, c: 26 });", "uniform vec3 sol; // astra corona", "ring(r).cross(line(0, W));", "motion = code; // 1800 frames @ 60 fps"];
  for (let i = 0; i < 4; i++) ctx.fillText(micro[i], cx, cy + 165 + i * 18);
  drawInfinityWeave(ctx, cx, cy - 40, 230, 30, 1, 0.8);
  ctx.font = 'italic 600 58px "Cormorant Garamond"';
  ctx.fillStyle = P.opusCream;
  ctx.fillText("The Singularity Engine", cx, cy + 112);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function gradientTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

const hdr = (hex: string, k: number) => new THREE.Color(hex).multiplyScalar(k);

/** Volumetric light shaft: brightness follows the facing ratio (view ray length through the cone) + a vertical fade. */
function shaftMaterial(color: string, intensity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: intensity } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vY = position.y; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uIntensity; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float facing = abs(dot(normalize(vN), normalize(vV))); float fade = smoothstep(-3.5, 1.2, vY) * (1.0 - smoothstep(2.6, 3.5, vY));
        float a = pow(facing, 2.2) * fade * uIntensity; gl_FragColor = vec4(uColor * a, a); }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

const MonolithWorld: React.FC<{ portrait: boolean }> = ({ portrait }) => {
  const frame = useCurrentFrame() + S.from;
  const { gl, scene, camera, size } = useThree();

  const W3 = useMemo(() => {
    const group = new THREE.Group();
    const clipUp = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const clipDown = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    const geo = new RoundedBoxGeometry(MONO.w, MONO.h, MONO.d, 4, 0.045);
    const chrome = new THREE.MeshPhysicalMaterial({ color: "#0d0f15", metalness: 1, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.15, clippingPlanes: [clipUp] });
    const mono = new THREE.Mesh(geo, chrome);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture(), transparent: true, toneMapped: false, clippingPlanes: [clipUp], depthWrite: false });
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), badgeMat);
    badge.position.set(0, 0.36, MONO.d / 2 + 0.004);
    mono.add(badge);
    const dialGeo = new THREE.BufferGeometry();
    const dialPts: number[] = [];
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      const r0 = i % 8 === 0 ? 0.47 : 0.485;
      dialPts.push(Math.cos(a) * r0, Math.sin(a) * r0, 0, Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0);
    }
    dialGeo.setAttribute("position", new THREE.Float32BufferAttribute(dialPts, 3));
    const dial = new THREE.LineSegments(dialGeo, new THREE.LineBasicMaterial({ color: hdr(P.astraIce, 1.6), toneMapped: false, transparent: true, opacity: 0.75, clippingPlanes: [clipUp] }));
    dial.position.set(0, 0.36, MONO.d / 2 + 0.008);
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.505, 0.515, 64, 1, 0, Math.PI * 0.42), new THREE.MeshBasicMaterial({ color: hdr(P.opusEmber, 2.4), toneMapped: false, transparent: true, clippingPlanes: [clipUp], side: THREE.DoubleSide }));
    arc.position.copy(dial.position);
    mono.add(dial, arc);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(MONO.w * 1.002, MONO.h * 1.002, MONO.d * 1.002)), new THREE.LineBasicMaterial({ color: hdr(P.opusEmber, 2.2), toneMapped: false, transparent: true, opacity: 0.7, clippingPlanes: [clipUp] }));
    mono.add(edges);
    const mirrorMat = chrome.clone();
    mirrorMat.clippingPlanes = [clipDown];
    mirrorMat.color = new THREE.Color("#0c0d12");
    const mirror = new THREE.Mesh(geo, mirrorMat);
    const mirrorBadge = new THREE.Mesh(badge.geometry, badgeMat.clone());
    (mirrorBadge.material as THREE.MeshBasicMaterial).clippingPlanes = [clipDown];
    (mirrorBadge.material as THREE.MeshBasicMaterial).opacity = 0.35;
    mirrorBadge.position.copy(badge.position);
    mirror.add(mirrorBadge);
    // Obsidian floor: UNLIT near-black. A lit PBR floor seen at grazing angles mirrors the studio environment
    // (Schlick Fresnel → 1) and reads grey; the brief wants a light-absorbing void. The mirrored monolith shows
    // through its 10 % transparency, and an additive light pool sells the key light hitting the ground.
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: "#020203", transparent: true, opacity: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    const poolLight = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 96),
      new THREE.MeshBasicMaterial({ map: (() => {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 256;
        const g2 = c.getContext("2d")!;
        const rg = g2.createRadialGradient(128, 128, 0, 128, 128, 128);
        rg.addColorStop(0, "rgba(255,190,150,0.55)");
        rg.addColorStop(0.35, "rgba(120,170,190,0.18)");
        rg.addColorStop(1, "rgba(0,0,0,0)");
        g2.fillStyle = rg;
        g2.fillRect(0, 0, 256, 256);
        const tx = new THREE.CanvasTexture(c);
        tx.colorSpace = THREE.SRGBColorSpace;
        return tx;
      })(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    poolLight.rotation.x = -Math.PI / 2;
    poolLight.position.y = 0.001;
    const poolGeo = new THREE.RingGeometry(0.02, 2.7, 160, 40);
    const pool = new THREE.Mesh(poolGeo, new THREE.MeshPhysicalMaterial({ color: "#1d222b", metalness: 1, roughness: 0.16, clearcoat: 0.6, envMapIntensity: 0.7 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.003;
    const poolBase = Float32Array.from((poolGeo.getAttribute("position") as THREE.BufferAttribute).array as Float32Array);
    // converging nodes
    const NODES = 2400;
    const r = mulberry32(9901);
    const start = new Float32Array(NODES * 3);
    const goal = new Float32Array(NODES * 3);
    const delay = new Float32Array(NODES);
    const tint: number[] = [];
    for (let i = 0; i < NODES; i++) {
      const th = r() * Math.PI * 2;
      const ph = Math.acos(2 * r() - 1);
      const R = 5 + r() * 6;
      start[i * 3] = Math.sin(ph) * Math.cos(th) * R;
      start[i * 3 + 1] = 1.5 + Math.cos(ph) * R * 0.6;
      start[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * R;
      goal[i * 3] = (r() - 0.5) * MONO.w;
      goal[i * 3 + 1] = r() * MONO.h;
      goal[i * 3 + 2] = (r() < 0.5 ? -1 : 1) * MONO.d * 0.5;
      delay[i] = r() * 0.55;
      tint.push(r() < 0.5 ? 0 : 1);
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(NODES * 3), 3));
    nodeGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(NODES * 3), 3));
    const nodes = new THREE.Points(nodeGeo, new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    // dust
    const DUST = 2200;
    const dust0 = new Float32Array(DUST * 3);
    const dustV = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      dust0[i * 3] = (r() - 0.5) * 12;
      dust0[i * 3 + 1] = r() * 6;
      dust0[i * 3 + 2] = (r() - 0.5) * 12;
      dustV[i * 3] = (r() - 0.5) * 0.7;
      dustV[i * 3 + 1] = (r() - 0.3) * 0.3;
      dustV[i * 3 + 2] = (r() - 0.5) * 0.7;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(DUST * 3), 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: hdr(P.astraIce, 0.95), size: 0.028, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    // volumetric light cones
    const grad = gradientTexture();
    const cones = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 48, 1, true), shaftMaterial(side < 0 ? P.opusEmber : P.astraCyan, 0.0));
      void grad;
      m.position.set(side * 2.4, 4.4, 0.6);
      m.rotation.z = side * 0.42;
      return m;
    });
    const key = new THREE.DirectionalLight("#ffc29c", 1.7);
    key.position.set(-4, 5, 4);
    const rim = new THREE.DirectionalLight("#00f0ff", 3.2);
    rim.position.set(4, 3, -4);
    const top = new THREE.DirectionalLight("#ffffff", 0.3);
    top.position.set(0, 8, 1);
    group.add(mono, mirror, floor, poolLight, pool, nodes, dust, ...cones, key, rim, top, new THREE.AmbientLight("#1a1f2e", 0.6));
    return { group, mono, mirror, pool, poolGeo, poolBase, nodes, start, goal, delay, tint, NODES, dust, dust0, dustV, DUST, cones, badgeMat, dial, arc };
  }, []);

  const post = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: 0 });
    composer.addPass(new RenderPass(scene, camera));
    // bloom + tone map + vignette merge into ONE full-screen pass; FXAA (a convolution) needs its own
    composer.addPass(new EffectPass(camera, new BloomEffect({ intensity: 1.35, luminanceThreshold: 0.55, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.72, levels: 5, resolutionScale: 0.5 }), new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }), new VignetteEffect({ offset: 0.3, darkness: 0.6 })));
    composer.addPass(new EffectPass(camera, new FXAAEffect()));
    return composer;
  }, [gl, scene, camera]);

  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    gl.setClearColor(new THREE.Color(P.void), 1);
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.add(W3.group);
    return () => {
      scene.remove(W3.group);
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, W3]);
  useLayoutEffect(() => post.setSize(size.width, size.height, false), [post, size.width, size.height]);
  useLayoutEffect(() => () => post.dispose(), [post]);

  useLayoutEffect(() => {
    const t = (frame - S.from) / FPS;
    const rise = springAt(frame, S.from + 8, FPS, RISE);
    const y = -MONO.h + MONO.h * rise; // bottom of the monolith
    W3.mono.position.set(0, y + MONO.h / 2, 0);
    W3.mirror.position.set(0, -(y + MONO.h / 2), 0);
    W3.mirror.scale.set(1, -1, 1);
    (W3.badgeMat as THREE.MeshBasicMaterial).opacity = clamp01((frame - (S.from + 50)) / 30);
    // liquid-metal pool ripples (decaying radial waves launched by the rise)
    const pos = W3.poolGeo.getAttribute("position") as THREE.BufferAttribute;
    const amp = 0.09 * Math.exp(-t * 0.9) + 0.012;
    for (let i = 0; i < pos.count; i++) {
      const x = W3.poolBase[i * 3];
      const yy = W3.poolBase[i * 3 + 1];
      const rr = Math.hypot(x, yy);
      pos.setZ(i, amp * Math.sin(rr * 7 - t * 7.5) * Math.exp(-rr * 0.6) * clamp01(rr * 3));
    }
    pos.needsUpdate = true;
    W3.poolGeo.computeVertexNormals();
    // converging nodes (closed-form springs with per-node delays)
    const np = W3.nodes.geometry.getAttribute("position") as THREE.BufferAttribute;
    const nc = W3.nodes.geometry.getAttribute("color") as THREE.BufferAttribute;
    const amber = new THREE.Color(P.opusEmber).multiplyScalar(2.2);
    const cyan = new THREE.Color(P.astraCyan).multiplyScalar(2.2);
    for (let i = 0; i < W3.NODES; i++) {
      const p = t > W3.delay[i] ? springProgress(t - W3.delay[i], SPRINGS.swarm) : 0;
      np.setXYZ(i, lerp(W3.start[i * 3], W3.goal[i * 3], p), lerp(W3.start[i * 3 + 1], W3.goal[i * 3 + 1] + y, p), lerp(W3.start[i * 3 + 2], W3.goal[i * 3 + 2], p));
      const fade = clamp01((0.9 - p) * 5) * clamp01((t - W3.delay[i]) * 6);
      const col = W3.tint[i] ? cyan : amber;
      nc.setXYZ(i, col.r * fade, col.g * fade, col.b * fade);
    }
    np.needsUpdate = true;
    nc.needsUpdate = true;
    // dust: bullet-time — 8 % speed through the stillness comma
    const tDust = Math.min(frame, STILL) / FPS + (Math.max(0, frame - STILL) / FPS) * 0.08;
    const dp = W3.dust.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < W3.DUST; i++) {
      const x = ((((W3.dust0[i * 3] + W3.dustV[i * 3] * tDust + 6) % 12) + 12) % 12) - 6;
      const yy = (((W3.dust0[i * 3 + 1] + W3.dustV[i * 3 + 1] * tDust) % 6) + 6) % 6;
      const z = ((((W3.dust0[i * 3 + 2] + W3.dustV[i * 3 + 2] * tDust + 6) % 12) + 12) % 12) - 6;
      dp.setXYZ(i, x, yy, z);
    }
    dp.needsUpdate = true;
    W3.dial.rotation.z = -t * 0.9;
    W3.arc.rotation.z = t * 2.4;
    W3.cones.forEach((c, k) => {
      c.rotation.y = tDust * 0.15 * (k ? -1 : 1);
      (c.material as THREE.ShaderMaterial).uniforms.uIntensity.value = 0.16 + 0.12 * clamp01((frame - ORBIT0 + 30) / 40);
    });
    const cam = monolithCamera(frame, portrait);
    const c = camera as THREE.PerspectiveCamera;
    c.position.copy(cam.pos);
    c.lookAt(cam.target);
    c.fov = cam.fov;
    c.near = 0.02;
    c.far = 120;
    c.updateProjectionMatrix();
    c.updateMatrixWorld();
  }, [frame, W3, camera, portrait]);

  useFrame(({ gl: r, scene: sc, camera: cm }) => (PERF.noPost ? r.render(sc, cm) : post.render()), 1);
  return null;
};

export const S9Monolith: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const { width, height } = useVideoConfig();
  const L = useLayout();
  const { u, H } = L;
  const metal = Math.sin(Math.PI * clamp01((frame - S.from) / 80));
  const lookB = ease.inOut3(clamp01((frame - EV.lookCloser) / 108));
  const L5b = phrase("L5b").words;
  const canvasStart = WORD_EV.canvasWord;
  const dissolve = clamp01((frame - (canvasStart + 12)) / 18);
  const flare = Math.exp(-(((frame - 1500) / 10) ** 2));

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: metal > 0.01 ? `contrast(${(1 + 0.25 * metal).toFixed(3)}) saturate(${(1 - 0.35 * metal).toFixed(3)}) brightness(${(1 + 0.08 * metal).toFixed(3)})` : undefined }}>
        <ThreeCanvas width={width} height={height} gl={{ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }} dpr={1} camera={{ fov: 34, near: 0.02, far: 120, position: [0, 1.2, 7.4] }} style={{ position: "absolute", inset: 0 }}>
          <MonolithWorld portrait={L.portrait} />
        </ThreeCanvas>
      </AbsoluteFill>
      {/* Higgsfield "Thunder God" strikes the forming monolith (engine mix, brand palette) */}
      <Sequence from={0} durationInFrames={70} layout="none">
        <HiggsfieldEffectsMix effects={["Thunder God"]} triggerFrame={0} accentColors={[P.astraCyan, P.opusEmber]}>
          <div />
        </HiggsfieldEffectsMix>
      </Sequence>
      {frame >= ORBIT0 - 20 && !PERF.noGodrays ? (
        <AbsoluteFill style={{ opacity: 0.9 * clamp01((frame - ORBIT0 + 20) / 30) }}>
          <VolumetricGodrays originXPercent={50} originYPercent={-6} color={P.astraIce} rayCount={18} opacity={0.16} softEdges />
        </AbsoluteFill>
      ) : null}
      {flare > 0.02 ? (
        <AbsoluteFill style={{ opacity: flare }}>
          <AnamorphicFlare xPercent={50} yPercent={L.pick(26, 30)} color={P.astraCyan} secondaryColor={P.opusEmber} intensity={0.85} />
        </AbsoluteFill>
      ) : null}
      {/* "never witnessed." — continues L4c from the glyph dive */}
      <KineticPhrase
        id="L4c"
        skip={6}
        offset={S.from}
        x={L.safe}
        y={L.pick(H * 0.12, H * 0.08)}
        width={L.pick(width * 0.5, width - 2 * L.safe)}
        base={{ font: FONT.opus, size: L.pick(150, 120), italic: true, weight: 600, color: P.opusCream, glow: rgba(P.opusAmber, 0.45) }}
        overrides={{ witnessed: { font: FONT.opus, size: L.pick(150, 120), italic: true, weight: 600, color: P.astraIce, glow: rgba(P.astraCyan, 0.5), breakBefore: true } }}
        exitAt={EV.lookCloser - 6}
        exitFrames={16}
      />
      {/* "Look closer." — small, and it grows as the camera obeys */}
      {frame >= EV.lookCloser - 4 && frame < ORBIT0 ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: L.pick(H * 0.1, H * 0.12), textAlign: "center", transform: `scale(${(1 + 0.7 * lookB).toFixed(3)})`, opacity: clamp01((frame - EV.lookCloser + 4) / 6) * clamp01((ORBIT0 - frame) / 10) }}>
          <KineticPhrase id="L5a" offset={S.from} x={0} y={0} width={width} align="center" base={{ font: FONT.opus, size: 54, italic: true, weight: 500, color: P.opusCream }} overrides={{ closer: { font: FONT.opus, size: 54, italic: true, weight: 600, color: P.opusAmber } }} />
        </div>
      ) : null}
      {/* "The canvas is dead." — "canvas" disintegrates (Higgsfield Disintegration, brand ash) */}
      {frame >= L5b[0].startFrame - 2 ? (
        <div style={{ position: "absolute", left: L.safe, right: L.pick(undefined, L.safe), top: L.pick(H * 0.68, H * 0.72), display: "flex", gap: 22 * u, alignItems: "baseline", flexWrap: "wrap", width: L.pick(width * 0.6, width - 2 * L.safe) }}>
          {L5b.map((w, i) => {
            const lf = frame - w.startFrame + 2;
            if (lf < 0) return <span key={i} style={{ visibility: "hidden", fontSize: 80 * u }}>{w.text}</span>;
            const sIn = springProgress(lf / FPS, SPRINGS.letter);
            const isCanvas = i === 1;
            const isDead = i === 3;
            return (
              <span
                key={i}
                style={{
                  fontFamily: isDead ? FONT.astra : FONT.opus,
                  fontStyle: isDead ? "normal" : "italic",
                  fontWeight: isDead ? 700 : 500,
                  fontSize: (isDead ? 96 : 80) * u,
                  color: isDead ? P.astraIce : isCanvas ? P.opusCream : rgba(P.opusCream, 0.85),
                  opacity: clamp01(lf / 5),
                  transform: `translateY(${((1 - sIn) * 36 * u).toFixed(2)}px)`,
                  maskImage: isCanvas && dissolve > 0 ? `linear-gradient(90deg, transparent ${(dissolve * 115 - 15).toFixed(1)}%, black ${(dissolve * 115).toFixed(1)}%)` : undefined,
                  WebkitMaskImage: isCanvas && dissolve > 0 ? `linear-gradient(90deg, transparent ${(dissolve * 115 - 15).toFixed(1)}%, black ${(dissolve * 115).toFixed(1)}%)` : undefined,
                  letterSpacing: isDead ? "-0.04em" : "-0.01em",
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ) : null}
      <Sequence from={canvasStart + 12 - S.from} durationInFrames={70} layout="none">
        {/* the engine's ash field spawns mid-frame: shift it onto the word "canvas" */}
        <AbsoluteFill style={{ transform: L.pick("translate(-24%, 24%) scale(0.62)", "translate(-8%, 26%) scale(0.7)") }}>
          <HiggsfieldEffectsMix effects={["Disintegration"]} triggerFrame={0} accentColors={[P.opusCream, P.opusEmber, P.opusCream]}>
            <div />
          </HiggsfieldEffectsMix>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
