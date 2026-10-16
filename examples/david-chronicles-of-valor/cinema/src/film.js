// film.js — the director. Builds the world from real assets and evaluates the whole film
// as a pure function of the frame index: camera, blocking, mocap cues, weather, FX, titles.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { SHOTS, CAST, PROPS, FPS, DURATION, WIDTH, HEIGHT } from './shots.js';
import './shots-act3.js';
import { RigLibrary, loadGLTF } from './assets.js';
import {
  terrainY,
  createSky, createTerrain, createRuin, createChariot, createRocksMerged, createCropField,
  createPlantedSword, buildCrowdAtlas, createCrowd, createFx, createRain,
  lightningFlash, createTitleMesh, terrainHeightAt,
} from './world.js';
import { curve, curve3, clamp, lerp, smoothstep, mulberry32, noise1, noise3, DEG } from './util.js';

// ---------------------------------------------------------------- weather track

// lux/sun/sky/fog/rain/wet/mud/storm/wind across the film
const WEATHER = [
  { t: 0, sun: [1.00, 0.86, 0.66], sunI: 4.1, top: [0.18, 0.42, 0.71], hor: [0.85, 0.73, 0.54], fog: 0.7, rain: 0, wet: 0.05, mud: 0.15, storm: 0.04, wind: 0.9, exp: 1.05, lum: 1.0 },
  { t: 30, sun: [1.00, 0.88, 0.70], sunI: 4.2, top: [0.20, 0.45, 0.74], hor: [0.88, 0.76, 0.56], fog: 0.75, rain: 0, wet: 0.06, mud: 0.18, storm: 0.05, wind: 1.0, exp: 1.05, lum: 1.0 },
  { t: 70, sun: [1.00, 0.84, 0.64], sunI: 4.0, top: [0.19, 0.43, 0.72], hor: [0.86, 0.72, 0.52], fog: 0.85, rain: 0, wet: 0.08, mud: 0.22, storm: 0.08, wind: 1.2, exp: 1.02, lum: 0.98 },
  { t: 100, sun: [0.98, 0.80, 0.60], sunI: 3.0, top: [0.17, 0.36, 0.62], hor: [0.78, 0.66, 0.50], fog: 1.05, rain: 0, wet: 0.12, mud: 0.30, storm: 0.28, wind: 1.8, exp: 0.98, lum: 0.92 },
  { t: 110, sun: [0.88, 0.76, 0.62], sunI: 2.6, top: [0.14, 0.27, 0.46], hor: [0.66, 0.58, 0.48], fog: 1.5, rain: 0.55, wet: 0.55, mud: 0.62, storm: 0.72, wind: 2.6, exp: 0.97, lum: 0.90 },
  { t: 118, sun: [0.80, 0.72, 0.62], sunI: 2.0, top: [0.12, 0.21, 0.36], hor: [0.55, 0.51, 0.46], fog: 2.0, rain: 1.0, wet: 0.85, mud: 0.85, storm: 0.95, wind: 3.2, exp: 1.02, lum: 1.0 },
  { t: 148, sun: [0.82, 0.74, 0.62], sunI: 2.1, top: [0.13, 0.23, 0.38], hor: [0.58, 0.53, 0.47], fog: 1.9, rain: 0.95, wet: 0.9, mud: 0.9, storm: 0.92, wind: 3.0, exp: 1.03, lum: 1.02 },
  { t: 158, sun: [0.92, 0.74, 0.50], sunI: 2.0, top: [0.16, 0.30, 0.48], hor: [0.72, 0.62, 0.48], fog: 1.6, rain: 0.5, wet: 0.8, mud: 0.86, storm: 0.6, wind: 2.2, exp: 0.95, lum: 0.82 },
  { t: 165, sun: [1.00, 0.80, 0.46], sunI: 3.8, top: [0.18, 0.34, 0.55], hor: [0.92, 0.72, 0.44], fog: 1.2, rain: 0.06, wet: 0.6, mud: 0.7, storm: 0.14, wind: 1.4, exp: 1.06, lum: 1.0 },
  { t: 172, sun: [1.00, 0.78, 0.42], sunI: 3.5, top: [0.19, 0.37, 0.60], hor: [0.96, 0.74, 0.42], fog: 1.0, rain: 0, wet: 0.45, mud: 0.55, storm: 0.08, wind: 1.1, exp: 1.10, lum: 1.05 },
  { t: 180, sun: [1.00, 0.78, 0.42], sunI: 3.4, top: [0.19, 0.37, 0.60], hor: [0.96, 0.74, 0.42], fog: 0.95, rain: 0, wet: 0.4, mud: 0.5, storm: 0.06, wind: 1.0, exp: 1.10, lum: 1.05 },
];

function weatherAt(t) {
  const k = WEATHER.map(w => ({ t: w.t, v: 0 }));
  const pick = (fn) => curve(WEATHER.map(w => ({ t: w.t, v: fn(w) })), t);
  const sun = [pick(w => w.sun[0]), pick(w => w.sun[1]), pick(w => w.sun[2])];
  return {
    sun, sunI: pick(w => w.sunI),
    top: [pick(w => w.top[0]), pick(w => w.top[1]), pick(w => w.top[2])],
    hor: [pick(w => w.hor[0]), pick(w => w.hor[1]), pick(w => w.hor[2])],
    fog: pick(w => w.fog), rain: pick(w => w.rain), wet: pick(w => w.wet), mud: pick(w => w.mud),
    storm: pick(w => w.storm), wind: pick(w => w.wind), exp: pick(w => w.exp), lum: pick(w => w.lum),
  };
}

// winding road for the score: D minor -> D major, Dorian colouring
export const SCORE_KEY = { root: 'D', seed: 509173 };

// ---------------------------------------------------------------- film

export class Film {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.opts = opts;
    this.quality = opts.quality ?? 1;
    this.res = opts.res || [WIDTH, HEIGHT];        // render resolution (probes can drop to 1/2 or 1/4)
    this.time = 0;
    this.frame = 0;
    this.actors = new Map();
    this.lastCueIndexByShot = new Map();
    this.events = [];        // active shake sources
    this.slowmo = { t0: -99, dur: 0, factor: 1 };
    this.titleState = { visible: false, t0: 0, dur: 1 };
    this.fadeState = { active: false, t0: 0, dur: 1.6 };
    this.godRayState = { power: 0, t0: -99 };
    this.projectiles = [];
    this.rings = [];
    this.rainIntensity = 0;
    this.crowdFade = 1;
    this.state = 'new';
  }

  async init() {
    const r = this.renderer;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    this.scene = scene;
    scene.fog = new THREE.FogExp2(0xd7c19a, 0.004);

    // sky
    this.sky = createSky();
    scene.add(this.sky);

    // image-based lighting: metals and armour sample the sky instead of rendering black
    this.pmrem = new THREE.PMREMGenerator(r);
    this.envRT = this.pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = this.envRT.texture;
    scene.environmentIntensity = 0.55;

    // lights
    this.sun = new THREE.DirectionalLight(0xffe0b0, 3.5);
    this.sun.position.set(38, 46, 26);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.opts.shadowMap || 512, this.opts.shadowMap || 512);
    const sc = this.sun.shadow.camera;
    sc.near = 1; sc.far = 120; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.045;
    this.sun.shadow.autoUpdate = false;        // refreshed on alternate frames in setFrame()
    this.sun.shadow.needsUpdate = true;
    scene.add(this.sun);
    scene.add(this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xbfd4ff, 0x6d5a3c, 0.55);
    scene.add(this.hemi);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.10);
    scene.add(this.ambient);
    // warm bounce from the sunlit ground, the classic desert fill
    this.bounce = new THREE.DirectionalLight(0xffcf9a, 1.15);
    this.bounce.position.set(-14, 6, -18);
    scene.add(this.bounce);
    this.bounce.target = this.sun.target;
    this.lightningLight = new THREE.DirectionalLight(0xdfe8ff, 0.0);
    this.lightningLight.position.set(-40, 60, -30);
    scene.add(this.lightningLight);

    // terrain + props
    this.terrain = createTerrain({ size: 300, seg: 52 });
    scene.add(this.terrain);
    // the ruin sits behind and outside the duelling axis: its surviving wall is placed so the
    // wall-run in the dual-blade sequence happens against it
    // kept clear of every camera line: columns plus a low wall only, well off the axis
    this.ruin = createRuin({ seed: 5, columns: 4, spread: 12, wallAt: [5.5, 3.0], wallHeight: 1.7 });
    this.ruin.position.set(-16.5, 0, -14.0);
    this.ruin.visible = true;
    scene.add(this.ruin);
    this.chariot = createChariot();
    this.chariot.position.set(-11.8, 0, 4.6);
    this.chariot.rotation.set(0.14, -0.7, 0.06);
    scene.add(this.chariot);
    scene.add(createRocksMerged({ count: 26, seed: 21, radius: 95, minR: 34, maxS: 0.75 }));
    // the lentil field belongs to Shammah's stand, well off the main duelling axis
    this.crops = createCropField({ count: 1500, radius: 7, seed: 77, center: new THREE.Vector3(-24.0, 0, 13.0) });
    scene.add(this.crops);

    // FX + rain
    this.fx = createFx(this.quality);
    scene.add(this.fx.group);
    this.rain = createRain(Math.round(1300 * this.quality));
    scene.add(this.rain);

    // projectiles (arrows / javelins / the sling stone)
    this.projMat = new THREE.MeshStandardMaterial({ color: 0x6b5a3c, roughness: 0.7 });
    this.arrowGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.85, 6);
    this.arrowGeo.rotateX(Math.PI / 2);
    this.javelinGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.9, 7);
    this.javelinGeo.rotateX(Math.PI / 2);

    // shockwave rings
    this.ringGeo = new THREE.RingGeometry(0.6, 1.0, 48);
    this.ringGeo.rotateX(-Math.PI / 2);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0xd9c6a2, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });

    // god-ray shafts (cheap volumetric impostors)
    this.rays = new THREE.Group();
    const shaftMat = new THREE.MeshBasicMaterial({ color: 0xffe6b0, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const w = 3 + i * 1.4;
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(w, 46), shaftMat.clone());
      shaft.position.set(-14 + i * 5.2, 22, -22 - i * 2.4);
      shaft.rotation.set(-0.55, 0.28 + i * 0.05, 0.22);
      shaft.userData.base = 0.10 + 0.03 * (i % 3);
      this.rays.add(shaft);
    }
    scene.add(this.rays);

    // title
    this.title = createTitleMesh();
    this.title.position.set(-3.0, 2.6, -6.0);
    this.title.scale.setScalar(0.001);
    this.title.visible = false;
    scene.add(this.title);

    // camera + post
    const [RW, RH] = this.res;
    this.camera = new THREE.PerspectiveCamera(42, RW / RH, 0.1, 900);
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(RW, RH, {
      type: THREE.HalfFloatType, samples: this.opts.msaa ? 4 : 0,
    }));
    this.renderPass = new RenderPass(scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(RW, RH), 0.42, 0.62, 0.86);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, uExposure: { value: 1.0 }, uContrast: { value: 1.06 },
        uSaturation: { value: 1.06 }, uVignette: { value: 0.30 }, uGrain: { value: 0.020 },
        uTime: { value: 0 }, uAberration: { value: 0.9 }, uWet: { value: 0.0 },
        uFade: { value: 0.0 }, uLum: { value: 1.0 },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; uniform float uExposure, uContrast, uSaturation, uVignette, uGrain, uTime, uAberration, uWet, uFade, uLum;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453); }
        void main(){
          vec2 uv = vUv;
          vec2 d = uv - 0.5;
          float r2 = dot(d, d);
          vec2 off = d * (0.0012 + 0.004 * uAberration) * r2;
          vec3 col;
          col.r = texture2D(tDiffuse, uv + off).r;
          col.g = texture2D(tDiffuse, uv).g;
          col.b = texture2D(tDiffuse, uv - off).b;
          col *= uExposure * uLum;
          col = (col - 0.5) * uContrast + 0.5;
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(l), col, uSaturation);
          col *= 1.0 - uVignette * smoothstep(0.20, 0.72, r2);
          float g = hash(uv * vec2(1920.0, 1080.0) + uTime * 37.0) - 0.5;
          col += g * uGrain;
          col = mix(col, col * vec3(0.92, 0.95, 1.02), uWet * 0.5);
          col *= 1.0 - uFade;
          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }`,
    });
    this.composer.addPass(this.grade);
    this.fxaa = new ShaderPass(FXAAShader);
    this.fxaa.material.uniforms.resolution.value.set(1 / RW, 1 / RH);
    this.fxaa.enabled = this.opts.fxaa !== false;
    this.composer.addPass(this.fxaa);
    this.composer.addPass(new OutputPass());

    // lean path: one grade pass instead of the multi-target composer chain
    this.leanRT = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.UnsignedByteType, depthBuffer: true, samples: 0 });
    this.gradeRT = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.UnsignedByteType, depthBuffer: false, samples: 0 });
    this.gradeScene = new THREE.Scene();
    this.gradeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.gradeMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.leanRT.texture },
        uTexel: { value: new THREE.Vector2(1 / RW, 1 / RH) },
        uExposure: { value: 1.0 }, uContrast: { value: 1.06 }, uSaturation: { value: 1.06 },
        uVignette: { value: 0.32 }, uGrain: { value: 0.022 }, uTime: { value: 0 },
        uAberration: { value: 1.0 }, uWet: { value: 0 }, uFade: { value: 0 }, uLum: { value: 1 },
        uGlow: { value: 0.55 }, uStorm: { value: 0 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; uniform vec2 uTexel;
        uniform float uExposure, uContrast, uSaturation, uVignette, uGrain, uTime, uAberration, uWet, uFade, uLum, uGlow, uStorm;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(41.0, 289.0))) * 43758.5453); }
        void main(){
          vec2 uv = vUv;
          vec2 d = uv - 0.5;
          float r2 = dot(d, d);
          vec2 off = d * 0.0035 * uAberration * r2;
          vec3 c;
          c.r = texture2D(tDiffuse, uv + off).r;
          c.g = texture2D(tDiffuse, uv).g;
          c.b = texture2D(tDiffuse, uv - off).b;
          // cheap highlight glow (2 diagonal taps at 3 px) — reads hotter than no bloom at a
          // fraction of a full chain's cost under software rasterisation
          vec3 g = texture2D(tDiffuse, uv + vec2(uTexel.x * 3.0, uTexel.y * 3.0)).rgb
                 + texture2D(tDiffuse, uv - vec2(uTexel.x * 3.0, uTexel.y * 3.0)).rgb;
          g *= 0.5;
          float gl = max(max(g.r, g.g), g.b);
          c += g * smoothstep(0.62, 1.0, gl) * uGlow;
          c *= uExposure * uLum;
          c = (c - 0.5) * uContrast + 0.5;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(vec3(l), c, uSaturation);
          c *= 1.0 - uVignette * smoothstep(0.18, 0.75, r2);
          c += (hash(uv * vec2(1920.0, 1080.0) + uTime * 37.0) - 0.5) * uGrain;
          c = mix(c, c * vec3(0.93, 0.96, 1.03), uWet * 0.5);
          c *= 1.0 - uFade;
          gl_FragColor = vec4(max(c, 0.0), 1.0);
        }`,
    });
    this.gradeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.gradeMat));

    // frost: fade quad drawn last in screen space
    this.fadeScene = new THREE.Scene();
    this.fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false });
    this.fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.fadeMat));

    // ---- assets
    const clipNames = [...new Set(SHOTS.flatMap(s => s.cues.map(c => c.clip)))];
    this.lib = new RigLibrary();
    await this.lib.load({ clipNames });
    // second pass: anything not found in the Mixamo set is looked up in the CC0 Quaternius /
    // CGstuff set that ships alongside it (assets/quaternius), which actionforge.app redistributes
    // the CC0 set also supplies the fill-in idles for scenery actors, so it is loaded even when
    // no shot explicitly cues one of its clips
    const wanted = [...new Set([...clipNames, 'idle_loop', 'sword_idle'])];
    const unresolved = wanted.filter(n => !this.lib.clips.get(n));
    if (unresolved.length) await this.lib.loadQuaternius(unresolved);
    const failed = [...this.lib.clips.entries()].filter(([, v]) => !v).map(([k]) => k);
    if (failed.length) throw new Error('clips failed to bind: ' + failed.join(', '));

    const propGltfs = {};
    for (const [name] of new Set([].concat(...Object.values(PROPS)))) {
      try { propGltfs[name] = await loadGLTF('/assets/props/' + name + '.glb'); } catch (e) { propGltfs[name] = null; }
    }
    this.propGltfs = propGltfs;

    for (const [id, def] of Object.entries(CAST)) {
      const actor = this.lib.newActor({ name: id, palette: def.palette, scale: def.scale ?? 1 });
      const props = PROPS[id] || [];
      for (const [pname, hand, popts] of props) {
        const g = propGltfs[pname];
        if (g) actor.attach(g, hand, popts);
      }
      actor.root.visible = false;
      this.scene.add(actor.root);
      this.actors.set(id, actor);
    }

    // crowd: pre-render the pose atlas, then scatter the Philistine line
    const poses = [
      { clip: 'Idle', t: 1.1 },
      { clip: 'Great_Sword_Idle', t: 0.8 },
      { clip: 'Walk_Backward', t: 0.9 },
      { clip: 'Cautious_Backward_Walk', t: 1.2 },
    ];
    this.crowd = await buildCrowdAtlas(this.renderer, () => this.lib.newActor({ palette: { tint: 0x9c9080 }, scale: 1.0 }), poses)
      .then(atlas => { this.crowdAtlas = atlas; const c = createCrowd(atlas, { count: Math.round(300 * Math.min(1, this.quality)), seed: 909 }); this.scene.add(c); return c; });
    this.crowd.visible = false;

    // shadow pass discipline: the crowd billboards and crop field never cast shadows, and the
    // terrain only receives them. This roughly halves the shaded geometry per frame.
    if (this.crowd && this.crowd.isInstancedMesh) this.crowd.castShadow = false;
    this.crops.castShadow = false;
    this.crops.receiveShadow = false;
    this.terrain.castShadow = false;
    this.rain.castShadow = false;
    this.fx.group.children.forEach(p => { p.castShadow = false; });
    this.rays.children.forEach(m => { m.castShadow = false; });

    this.state = 'ready';
    return this;
  }

  // ------------------------------------------------------------- shot logic

  shotAt(t) {
    for (const s of SHOTS) if (t >= s.start && t < s.end) return s;
    return SHOTS[SHOTS.length - 1];
  }

  cameraFor(shot, t) {
    const keys = shot.cam;
    if (!keys.length) return { pos: { x: 0, y: 1.6, z: 4 }, look: { x: 0, y: 1.2, z: 0 }, fov: 42, roll: 0 };
    // The camera keys were authored with the actors' feet at y = 0. The terrain rolls between
    // roughly -3 m and +3 m, so every key is shifted by the ground height under the shot's
    // action: without this an eye-level close-up authored at 1.70 m ends up 0.7 m under the
    // subject's chin and the lens points at bare ground.
    const ground = this.shotGround(shot);
    const pos = curve3(keys.map(k => ({ t: k.t, x: k.pos[0], y: k.pos[1] + ground, z: k.pos[2] })), t);
    const look = curve3(keys.map(k => ({ t: k.t, x: k.look[0], y: k.look[1] + ground, z: k.look[2] })), t);
    const fov = curve(keys.map(k => ({ t: k.t, v: k.fov ?? 42 })), t);
    const roll = curve(keys.map(k => ({ t: k.t, v: (k.roll ?? 0) * DEG })), t);
    return { pos, look, fov, roll };
  }

  // ground height under the shot's action (cached per shot)
  shotGround(shot) {
    if (shot.__ground === undefined) {
      const ids = Object.keys(shot.cast);
      const pick = ids.includes('david') ? shot.cast.david : shot.cast[ids[0]];
      shot.__ground = pick ? terrainY(pick.pos[0], pick.pos[1]) : 0;
    }
    return shot.__ground;
  }

  blockingFor(shot, t) {
    const out = {};
    for (const [id, b] of Object.entries(shot.cast)) {
      let x = b.pos[0], z = b.pos[1], yaw = b.yaw ?? 0;
      if (b.move && b.move.length) {
        x = curve(b.move.map(m => ({ t: m[0], v: m[1][0] })), t);
        z = curve(b.move.map(m => ({ t: m[0], v: m[1][1] })), t);
        yaw = curve(b.move.map(m => ({ t: m[0], v: m[1][2] })), t);
      }
      out[id] = { x, z, yaw };
    }
    return out;
  }

  // Apply every cue between prevT and t (inclusive start, exclusive end at t)
  applyCues(shot, t, prevT) {
    const key = shot.id;
    let idx = this.lastCueIndexByShot.get(key) ?? 0;
    const cues = shot.cues;
    while (idx < cues.length && cues[idx].t <= t) {
      const c = cues[idx++];
      const actor = this.actors.get(c.actor);
      if (actor) {
        if (c.clip && this.lib.has(c.clip)) {
          actor.play(c.clip, {
            fade: c.fade ?? 0.2, timeScale: c.timeScale ?? 1, loop: c.loop ?? true,
            layer: c.layer || 'base', from: c.from ?? 0,
          });
        }
      }
    }
    this.lastCueIndexByShot.set(key, idx);
  }

  applyEvents(t, prevT) {
    for (const shot of SHOTS) {
      for (const e of shot.events) {
        if (e.t <= t && e.t > prevT) this.fireEvent(e, shot);
      }
    }
  }

  fireEvent(e, shot) {
    const [x, y, z] = e.at;
    const rnd = mulberry32((shot.id * 7919 + Math.round(e.t * 100)) >>> 0);
    switch (e.type) {
      case 'sparks': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, up = 0.35 + rnd() * 1.5, sp = (2.5 + rnd() * 7) * (e.power || 1);
          this.fx.sparks.spawn(e.t, x + (rnd() - .5) * .2, y + (rnd() - .5) * .2, z + (rnd() - .5) * .2,
            Math.cos(a) * sp, up * sp * 0.6, Math.sin(a) * sp, 0.35 + rnd() * 0.6, 0.035 + rnd() * 0.05);
        }
        break;
      }
      case 'dust': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, r = e.ring ? 0.4 + rnd() * 1.2 : rnd() * 1.6;
          const sp = (0.6 + rnd() * 2.2) * (e.power || 1);
          this.fx.dust.spawn(e.t, x + Math.cos(a) * r, y + rnd() * 0.4, z + Math.sin(a) * r,
            Math.cos(a) * sp, (0.3 + rnd()) * (e.power || 1) * 0.8, Math.sin(a) * sp,
            1.1 + rnd() * 1.6, 0.5 + rnd() * 1.3);
        }
        break;
      }
      case 'mud': {
        const n = Math.round((e.count || 30) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = (2 + rnd() * 6) * (e.power || 1);
          this.fx.mud.spawn(e.t, x + (rnd() - .5) * 1.2, y + 0.05, z + (rnd() - .5) * 1.2,
            Math.cos(a) * sp * 0.5, (1.6 + rnd() * 4) * (e.power || 1), Math.sin(a) * sp * 0.5,
            0.7 + rnd() * 0.9, 0.10 + rnd() * 0.22);
        }
        break;
      }
      case 'blood': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = 1.5 + rnd() * 4.5;
          this.fx.blood.spawn(e.t, x, y, z, Math.cos(a) * sp, 0.6 + rnd() * 3.2, Math.sin(a) * sp,
            0.5 + rnd() * 0.7, 0.05 + rnd() * 0.09);
        }
        break;
      }
      case 'splash': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = (1.2 + rnd() * 3.4) * (e.power || 1);
          this.fx.splash.spawn(e.t, x + (rnd() - .5) * .9, y + 0.02, z + (rnd() - .5) * .9,
            Math.cos(a) * sp * 0.6, (1.4 + rnd() * 3.6) * (e.power || 1), Math.sin(a) * sp * 0.6,
            0.55 + rnd() * 0.7, 0.06 + rnd() * 0.12);
        }
        break;
      }
      case 'shockwave': {
        const ring = new THREE.Mesh(this.ringGeo, this.ringMat.clone());
        ring.position.set(x, y + 0.06, z);
        ring.scale.setScalar(0.4);
        this.scene.add(ring);
        this.rings.push({ mesh: ring, t0: e.t, life: 1.5, radius: e.radius || 6 });
        break;
      }
      case 'shake': this.events.push({ t: e.t, amp: e.amp ?? 0.5 }); break;
      case 'slowmo': this.slowmo = { t0: e.t, dur: e.dur ?? 2, factor: e.factor ?? 0.35 }; break;
      case 'lightning': this.lightningAt = e.t; break;
      case 'rainStart': this.rainRampStart = e.t; break;
      case 'arrowVolley': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        const [tx, ty, tz] = e.toward;
        for (let i = 0; i < n; i++) {
          const spread = (rnd() - 0.5) * 6;
          const from = new THREE.Vector3(x + spread, y + (rnd() - .5) * 2.5, z + (rnd() - .5) * 2);
          const to = new THREE.Vector3(tx + (rnd() - .5) * 1.5, ty + (rnd() - .2) * 1.2, tz + (rnd() - .5) * 1.5);
          this.spawnProjectile('arrow', from, to, e.t + i * (e.gap || 0.05), 34 + rnd() * 8);
        }
        break;
      }
      case 'javelin': {
        const from = new THREE.Vector3(x, y, z);
        const to = new THREE.Vector3(...e.toward);
        this.spawnProjectile('javelin', from, to, e.t, e.speed || 26);
        break;
      }
      case 'bowBreak': {
        const n = Math.round((e.count || 30) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = 2 + rnd() * 6;
          this.fx.sparks.spawn(e.t, x, y, z, Math.cos(a) * sp, (0.5 + rnd() * 3), Math.sin(a) * sp, 0.6 + rnd() * 0.5, 0.05 + rnd() * 0.06);
        }
        this.events.push({ t: e.t, amp: 0.35 });
        break;
      }
      case 'shieldShatter':
      case 'pauldron': {
        const n = Math.round((e.count || 50) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = 1.5 + rnd() * 6;
          this.fx.sparks.spawn(e.t, x, y, z, Math.cos(a) * sp, (1 + rnd() * 4), Math.sin(a) * sp, 0.7 + rnd() * 0.7, 0.05 + rnd() * 0.08);
        }
        const ring = new THREE.Mesh(this.ringGeo, this.ringMat.clone());
        ring.position.set(x, y, z);
        ring.rotation.set(Math.PI / 2.6, 0, 0);
        this.rings.push({ mesh: ring, t0: e.t, life: 0.8, radius: 2.6 });
        this.scene.add(ring);
        break;
      }
      case 'swordPlant': {
        const n = Math.round((e.count || 24) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = 0.6 + rnd() * 1.6;
          this.fx.dust.spawn(e.t, x + (rnd() - .5) * .4, y + 0.05, z + (rnd() - .5) * .4, Math.cos(a) * sp, 0.4 + rnd(), Math.sin(a) * sp, 1.4 + rnd(), 0.5 + rnd() * 0.8);
        }
        break;
      }
      case 'sweat': break;                        // rendered by the eye-line shot's own spray
      case 'mist': {
        const n = Math.round((e.count || 20) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          this.fx.dust.spawn(e.t, x + (rnd() - .5) * 40, y + rnd() * 3, z + (rnd() - .5) * 20,
            (rnd() - .5) * 0.4, 0.05 + rnd() * 0.2, (rnd() - .5) * 0.4, 6 + rnd() * 6, 4 + rnd() * 6);
        }
        break;
      }
      case 'godRays': this.godRayState = { power: e.power ?? 1, t0: e.t }; break;
      case 'titleIn': this.titleState = { visible: true, t0: e.t, dur: e.dur ?? 1 }; break;
      case 'fadeBlack': this.fadeState = { active: true, t0: e.t, dur: e.dur ?? 1.6 }; break;
      case 'bladeStress':
      case 'rainDroplets': {
        const n = Math.round((e.count || 30) * Math.min(1, this.quality));
        for (let i = 0; i < n; i++) {
          const a = rnd() * Math.PI * 2, sp = 0.4 + rnd() * 1.8;
          this.fx.splash.spawn(e.t + rnd() * (e.dur || 1), x + (rnd() - .5) * .5, y + (rnd() - .5) * .4, z + (rnd() - .5) * .5,
            Math.cos(a) * sp, 0.8 + rnd() * 2.2, Math.sin(a) * sp, 0.35 + rnd() * 0.4, 0.03 + rnd() * 0.05);
        }
        break;
      }
      default: break;
    }
  }

  spawnProjectile(kind, from, to, t0, speed) {
    const geo = kind === 'arrow' ? this.arrowGeo : this.javelinGeo;
    const mesh = new THREE.Mesh(geo, this.projMat);
    const dir = to.clone().sub(from);
    const dist = dir.length();
    const dur = dist / speed;
    const lead = Math.max(0, this.time - t0);
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.projectiles.push({ mesh, from, to, t0, dur, kind, lead });
    if (this.projectiles.length > 400) {
      const old = this.projectiles.shift();
      this.scene.remove(old.mesh);
    }
  }

  updateProjectiles(t) {
    for (const p of this.projectiles) {
      const k = clamp((t - p.t0) / p.dur);
      if (t < p.t0) { p.mesh.visible = false; continue; }
      p.mesh.visible = k < 1;
      const pos = p.from.clone().lerp(p.to, k);
      pos.y += Math.sin(k * Math.PI) * (p.kind === 'arrow' ? 0.55 : 0.35);
      p.mesh.position.copy(pos);
      const next = p.from.clone().lerp(p.to, Math.min(1, k + 0.02));
      next.y += Math.sin(Math.min(1, k + 0.02) * Math.PI) * (p.kind === 'arrow' ? 0.55 : 0.35);
      p.mesh.lookAt(next);
    }
  }

  ringUpdate(t) {
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      const k = (t - r.t0) / r.life;
      if (k >= 1) { this.scene.remove(r.mesh); r.mesh.material.dispose(); this.rings.splice(i, 1); continue; }
      r.mesh.scale.setScalar(lerp(0.35, r.radius, k));
      r.mesh.material.opacity = (1 - k) * 0.55;
    }
  }

  // ------------------------------------------------------------- evaluation

  setFrame(frame) {
    const t = frame / FPS;
    const prevT = this.time;
    this.frame = frame; this.time = t;
    const shot = this.shotAt(t);
    this.shot = shot;

    // actors: hide all, then place the ones this shot uses
    const blocking = this.blockingFor(shot, t);
    for (const [id, actor] of this.actors) {
      const b = blocking[id];
      if (!b) { actor.root.visible = false; continue; }
      actor.root.visible = true;
      const h = terrainHeightAt(this.terrain, b.x, b.z);
      actor.root.position.set(b.x, h, b.z);
      actor.root.rotation.y = b.yaw;
    }

    // cues: apply in order (handles both sequential render and warmed seeks)
    this.applyCues(shot, t, prevT);

    // fill-in idles. A shot can cast an actor as scenery without giving it a cue; without this
    // those actors hold the bind pose and read as mannequins standing in the field. Each one gets
    // a looping idle at a per-actor time offset so the crowd is not synchronised.
    for (const [id, actor] of this.actors) {
      if (!actor.root.visible) continue;
      let running = false;
      for (const a of actor.actions.values()) if (a && a.isRunning() && a.getEffectiveWeight() > 0.01) { running = true; break; }
      if (running) continue;
      const clip = this.idleClipFor(id);
      if (!clip) continue;
      const offset = this.idleOffset(id);
      actor.play(clip, { loop: true, fade: 0, timeScale: 0.92 + 0.16 * ((this.hash(id) % 100) / 100), from: offset });
      // seek the freshly started action to a stable point rather than frame 0
      const act = actor.actions.get('base');
      if (act) act.time = offset * Math.max(act.getClip().duration, 1e-3);
    }
    this.applyEvents(t, prevT);

    // animation update with speed-ramp support
    const dt = t - prevT;
    let ts = 1;
    if (t >= this.slowmo.t0 && t < this.slowmo.t0 + this.slowmo.dur) {
      const k = smoothstep(clamp((t - this.slowmo.t0) / this.slowmo.dur));
      const ramp = 1 - Math.sin(k * Math.PI) * (1 - this.slowmo.factor);
      ts = ramp;
    }
    const step = dt > 0 && dt < 0.5 ? dt : 1 / FPS;
    for (const [, actor] of this.actors) {
      if (!actor.root.visible) continue;
      actor.timeScale = ts;
      actor.update(step);
    }

    // weather
    const w = weatherAt(t);
    this.weather = w;
    const flash = lightningFlash(t, {}) || ((this.lightningAt && t - this.lightningAt < 0.6) ? Math.exp(-Math.pow((t - this.lightningAt) / 0.16, 2)) : 0);
    this.sky.material.uniforms.uTop.value.setRGB(...w.top);
    this.sky.material.uniforms.uHorizon.value.setRGB(...w.hor);
    this.sky.material.uniforms.uStorm.value = w.storm;
    this.sky.material.uniforms.uFlash.value = flash * 0.8;
    this.sky.material.uniforms.uSunColor.value.setRGB(...w.sun);
    this.sky.material.uniforms.uSunSize.value = 0.05;
    this.sky.material.uniforms.uTime.value = t;
    // sun position tracks the golden-hour arc in the final act
    const sunAz = lerp(0.75, 1.75, smoothstep((t - 90) / 90));
    const sunEl = lerp(0.72, 0.34, smoothstep((t - 20) / 150));   // raking light that lowers toward dusk
    const sunDir = new THREE.Vector3(Math.cos(sunEl) * Math.sin(sunAz), Math.sin(sunEl), Math.cos(sunEl) * Math.cos(sunAz)).normalize();
    this.sky.material.uniforms.uSun.value.copy(sunDir);
    this.sun.position.copy(this.sun.target.position).add(sunDir.clone().multiplyScalar(60));
    this.sun.color.setRGB(...w.sun);
    this.sun.intensity = (w.sunI + 1.1) * (1 - 0.42 * w.storm) + flash * 1.6;
    this.scene.environmentIntensity = lerp(0.85, 0.42, w.storm) + flash * 0.2;
    this.lightningLight.intensity = flash * 3.2;
    this.hemi.intensity = lerp(0.68, 0.52, w.storm) + flash * 0.3;
    this.bounce.intensity = lerp(1.15, 0.7, w.storm) + flash * 0.4;
    this.hemi.color.setRGB(...w.top).multiplyScalar(1.3);
    this.ambient.intensity = lerp(0.10, 0.05, w.storm);
    this.scene.fog.color.setRGB(...w.hor).multiplyScalar(lerp(0.9, 0.75, w.storm));
    this.scene.fog.density = 0.0035 * w.fog;
    this.renderer.toneMappingExposure = w.exp;

    // rain intensity ramps in with the weather
    this.rainIntensity = w.rain;
    this.rain.visible = w.rain > 0.02;
    const rm = this.rain.userData.material;
    rm.uniforms.uTime.value = t;
    rm.uniforms.uOpacity.value = 0.30 * w.rain;
    rm.uniforms.uWind.value.set(w.wind * 0.8, 0, w.wind * 0.25);
    // rain follows the action
    const focusActor = this.actors.get(Object.keys(shot.cast)[0] || 'david');
    const focus = focusActor ? focusActor.root.position : new THREE.Vector3();
    rm.uniforms.uCentre.value.set(focus.x, 0, focus.z);

    // wet ground: darken + gloss terrain by mud/wet
    const base = this.terrain.userData.baseColors;
    const colAttr = this.terrain.geometry.attributes.color;
    const wetAmt = clamp(w.wet * 0.55 + w.mud * 0.25, 0, 0.75);
    const mudAmt = clamp(w.mud * 0.5, 0, 0.6);
    if (Math.abs(wetAmt - (this._lastWet ?? -1)) > 0.008) {
      for (let i = 0; i < colAttr.count; i++) {
        const r = base[i * 3], g = base[i * 3 + 1], b = base[i * 3 + 2];
        colAttr.array[i * 3] = lerp(r, r * 0.62 + 0.02, wetAmt) * (1 - mudAmt * 0.35);
        colAttr.array[i * 3 + 1] = lerp(g, g * 0.60 + 0.015, wetAmt) * (1 - mudAmt * 0.45);
        colAttr.array[i * 3 + 2] = lerp(b, b * 0.58 + 0.01, wetAmt) * (1 - mudAmt * 0.5);
      }
      colAttr.needsUpdate = true;
      this._lastWet = wetAmt;
      this.terrain.material.roughness = lerp(0.96, 0.55, wetAmt);
      this.terrain.material.metalness = lerp(0.0, 0.15, wetAmt);
    }

    // particles
    this.fx.sparks.update(t, { gravity: -16, wind: w.wind * 1.5, falloff: 1.9 });
    this.fx.dust.update(t, { gravity: -1.1, wind: w.wind * 2.4, drag: 1.1, grow: true, falloff: 1.25 });
    this.fx.mud.update(t, { gravity: -14, wind: w.wind * 0.6, falloff: 1.5 });
    this.fx.blood.update(t, { gravity: -13, wind: w.wind * 0.4, falloff: 1.2 });
    this.fx.splash.update(t, { gravity: -13, wind: w.wind * 1.2, falloff: 1.6 });
    this.updateProjectiles(t);
    this.ringUpdate(t);

    // refresh the shadow map on even frames only
    this.sun.shadow.needsUpdate = (frame % 2 === 0);

    // camera
    const cam = this.cameraFor(shot, t);
    const shake = this.shakeAt(t);
    const subject = this.subjectsFocus(shot, blocking);
    // auto-framing: blend the authored look point with the live midpoint of the fighters so
    // the action stays inside the frame even where hand-authored keys drift
    const aim = this.aimPoint(shot, blocking, subject);
    const aimW = shot.frame ?? (this.opts.autoFrame ?? 0.72);
    cam.look.x = lerp(cam.look.x, aim.x, aimW);
    cam.look.y = lerp(cam.look.y, aim.y, aimW);
    cam.look.z = lerp(cam.look.z, aim.z, aimW);
    // tighten the frame: every camera pulls in toward what it is looking at, and drops a
    // little, which keeps the action filling the frame across all 26 setups
    const tighten = shot.tighten ?? (this.opts.tighten ?? 0.46);
    let px = cam.pos.x + (cam.look.x - cam.pos.x) * tighten;
    let py = cam.pos.y + (cam.look.y - cam.pos.y) * tighten * 0.75;
    let pz = cam.pos.z + (cam.look.z - cam.pos.z) * tighten;
    // A minimum standoff protects wide setups from ending up inside a prop or a body, but it
    // must never push a deliberately tight shot (an eye ECU, an over-the-shoulder) away from
    // its subject, so the clamp is capped against the authored camera distance.
    const authored = Math.hypot(cam.pos.x - cam.look.x, cam.pos.y - cam.look.y, cam.pos.z - cam.look.z);
    const minD = Math.min(shot.standoff ?? (this.opts.minStandoff ?? 3.2), Math.max(0.25, authored * 0.72));
    const dx = px - cam.look.x, dy = py - cam.look.y, dz = pz - cam.look.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < minD) {
      const k = minD / Math.max(dist, 1e-4);
      px = cam.look.x + dx * k;
      py = cam.look.y + dy * k;
      pz = cam.look.z + dz * k;
    }
    // and keep the lens above the ground and off the props' footprint
    const groundY = terrainY(px, pz) + 0.55;
    if (py < groundY) py = groundY;
    this.camera.position.set(px + shake.x, py + shake.y, pz + shake.z);
    this.camera.up.set(Math.sin(cam.roll), Math.cos(cam.roll), 0);
    this.camera.lookAt(cam.look.x, cam.look.y, cam.look.z);
    if (this.camera.fov !== cam.fov) { this.camera.fov = cam.fov; this.camera.updateProjectionMatrix(); }
    this.sun.target.position.set(subject.x, subject.y, subject.z);
    this.sun.target.updateMatrixWorld();

    // shadow discipline: only the two framed fighters cast into the shadow map
    if (this.opts.focusShadows !== false) {
      const focusIds = new Set(Object.keys(blocking));
      const pair = [];
      const d = blocking.david;
      if (d) { pair.push('david'); }
      if (d) {
        let best = null, bd = Infinity;
        for (const id of focusIds) { if (id === 'david') continue; const b = blocking[id];
          const dd = Math.hypot(b.x - d.x, b.z - d.z); if (dd < bd) { bd = dd; best = id; } }
        if (best) pair.push(best);
      }
      for (const [id, actor] of this.actors) {
        const on = pair.includes(id);
        actor.inner.traverse(o => { if (o.isMesh) o.castShadow = on; });
      }
    }

    // crowd
    this.updateCrowd(shot, t);

    // god rays
    const gr = this.godRayState.power * smoothstep(clamp((t - this.godRayState.t0) / 2.5)) * (1 - clamp((t - 176) / 4));
    this.rays.visible = gr > 0.01;
    for (const shaft of this.rays.children) {
      const flick = 0.75 + 0.25 * noise1(313, t * 0.6 + shaft.position.x);
      shaft.material.opacity = shaft.userData.base * gr * flick;
    }

    // title + fade
    if (this.titleState.visible) {
      const k = smoothstep(clamp((t - this.titleState.t0) / this.titleState.dur));
      this.title.visible = true;
      this.title.scale.setScalar(lerp(0.86, 1.0, k));
      this.title.material.opacity = k;
      this.title.material.transparent = true;
      this.title.material.emissiveIntensity = 0.4 + 2.2 * k + 0.35 * Math.sin(t * 3.1) * k;
      this.title.material.emissive.setRGB(0.42 * k, 0.30 * k, 0.10 * k);
      // face the camera
      this.title.lookAt(this.camera.position);
      this.title.position.set(cam.look.x + 1.2, cam.look.y + 0.15, cam.look.z - 1.2);
    } else this.title.visible = false;

    let fade = 0;
    if (this.fadeState.active) fade = smoothstep(clamp((t - this.fadeState.t0) / this.fadeState.dur));
    this.fadeAmount = fade;

    // grade uniforms (shared by the composer path and the lean path)
    this.gradeTargets = {
      contrast: lerp(1.02, 0.97, w.storm),
      saturation: lerp(1.08, 0.93, w.storm) + (t > 164 ? 0.06 : 0),
      vignette: this.opts.vignette ?? 0.22,
      grain: this.opts.grain ?? 0.022,
      lum: w.lum * (this.opts.lumGain ?? 0.98),
      glow: lerp(0.16, 0.26, w.storm) + (this.titleState.visible ? 0.35 : 0),
    };
    const g = this.grade.material.uniforms;
    g.uTime.value = t;
    g.uExposure.value = 1.0;
    g.uWet.value = clamp(w.wet, 0, 1);
    g.uFade.value = fade;
    g.uLum.value = w.lum;
    g.uContrast.value = lerp(1.07, 0.98, w.storm);
    g.uSaturation.value = lerp(1.08, 0.92, w.storm) + (t > 164 ? 0.06 : 0);
    g.uBloom = null;
    this.bloom.strength = lerp(0.34, 0.52, w.storm) + (t > 164 ? 0.10 : 0) + (this.titleState.visible ? 0.35 : 0);
    this.bloom.radius = 0.6;
    this.bloom.threshold = 0.86;

    // crowd retreat drift in the rout
    return this;
  }

  shakeAt(t) {
    let sx = 0, sy = 0, sz = 0;
    for (const e of this.events) {
      const dt = t - e.t;
      if (dt < 0 || dt > 0.55) continue;
      const env = Math.exp(-dt * 7.5) * e.amp;
      sx += (noise1(101, t * 42) - 0.5) * env * 0.34;
      sy += (noise1(202, t * 39) - 0.5) * env * 0.30;
      sz += (noise1(303, t * 45) - 0.5) * env * 0.18;
    }
    if (this.events.length > 200) this.events = this.events.slice(-120);
    return { x: sx, y: sy, z: sz };
  }

  hash(id) {
    let h = 2166136261;
    for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
    return Math.abs(h);
  }

  // Idle for a scenery actor. The Mixamo Idle is preferred because it is a natural relaxed
  // stance; the CC0 Quaternius idle holds the arms wide in a stylised game-ready pose, which
  // reads as a mannequin when a dozen soldiers stand in the background. Verified by comparing
  // the CC0 clips on the mannequin and on the Paladin (probe/retarget-ab.jpg): the retarget is
  // faithful, so this is a taste call about which pose suits a bystander.
  idleClipFor(id) {
    const candidates = ['Idle', 'idle_loop', 'sword_idle', 'Idle_Talking_Loop'];
    for (const c of candidates) if (this.lib.clips.get(c)) return c;
    return null;
  }

  idleOffset(id) { return (this.hash(id) % 1000) / 1000; }

  // midpoint of the two nearest opposing fighters, at chest height: what the lens should hold
  aimPoint(shot, blocking, subject) {
    const ids = Object.keys(blocking);
    if (!ids.length) return subject.clone();
    const pick = ids.includes('david') ? 'david' : ids[0];
    const a = blocking[pick];
    let best = null, bestD = Infinity;
    for (const id of ids) {
      if (id === pick) continue;
      const b = blocking[id];
      const d = Math.hypot(b.x - a.x, b.z - a.z);
      if (d < bestD) { bestD = d; best = b; }
    }
    const feet = terrainHeightAt(this.terrain, a.x, a.z);
    const y = feet + 1.35;
    if (!best || bestD > 9) return new THREE.Vector3(a.x, y, a.z);
    return new THREE.Vector3((a.x + best.x) * 0.5, y, (a.z + best.z) * 0.5);
  }

  subjectsFocus(shot, blocking) {
    // priority: david, then any active opponent, else the first cast member
    const ids = Object.keys(blocking);
    const pick = ids.includes('david') ? 'david' : ids[0];
    const b = blocking[pick];
    if (!b) return new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3(b.x, 1.0, b.z);
  }

  updateCrowd(shot, t) {
    if (shot.crowd === undefined) return;
    const show = shot.crowd > 0;
    this.crowd.visible = show;
    if (!show) return;
    // the line presses forward during the ambush, breaks and withdraws in the rout
    const advance = -smoothstep(clamp((t - 5) / 60)) * 3.2;
    const rout = -smoothstep(clamp((t - 156) / 9)) * 14.0;
    this.crowd.position.z = advance + rout;
    this.crowd.userData.updateCamera(this.camera.position);
    const m = this.crowd.userData.material;
    m.uniforms.uFogColor.value.copy(this.scene.fog.color);
    const l = this.weather.lum * (1 - 0.35 * this.weather.storm);
    m.uniforms.uLight.value.setScalar(l);
    // fade the line out across the final push-out
    const fade = 1 - smoothstep(clamp((t - 160) / 8));
    m.opacity = fade;
  }

  // fast path used for the film master: scene -> offscreen -> one grade pass.
  renderLean(target = null) {
    const r = this.renderer;
    const g = this.gradeMat.uniforms;
    g.tDiffuse.value = this.leanRT.texture;
    g.uExposure.value = 1.0;
    g.uContrast.value = this.gradeTargets.contrast;
    g.uSaturation.value = this.gradeTargets.saturation;
    g.uVignette.value = this.gradeTargets.vignette;
    g.uGrain.value = this.gradeTargets.grain;
    g.uTime.value = this.time;
    g.uWet.value = clamp(this.weather ? this.weather.wet : 0, 0, 1);
    g.uFade.value = this.fadeAmount || 0;
    g.uLum.value = this.gradeTargets.lum;
    g.uGlow.value = this.gradeTargets.glow;
    g.uStorm.value = this.weather ? this.weather.storm : 0;
    r.autoClear = true;
    r.setRenderTarget(this.leanRT);
    r.clear();
    r.render(this.scene, this.camera);
    r.setRenderTarget(this.gradeRT);
    r.clear();
    r.render(this.gradeScene, this.gradeCam);
    r.setRenderTarget(null);
    if (target) { /* caller reads gradeRT */ }
    return this.gradeRT;
  }

  render() {
    this.renderer.autoClear = false;
    this.composer.render();
    if (this.fadeAmount > 0.001) {
      this.fadeMat.opacity = this.fadeAmount;
      this.renderer.autoClear = true;
      this.renderer.render(this.fadeScene, this.fadeCam);
    }
    this.renderer.autoClear = true;
    return this;
  }

  // warm-start helper for random access (stills/probes)
  warmTo(frame, stepFrames = 2) {
    const t = frame / FPS;
    const shot = this.shotAt(t);
    this.time = shot.start - 1 / FPS;
    this.lastCueIndexByShot.set(shot.id, 0);
    this.slowmo = { t0: -99, dur: 0, factor: 1 };
    this.clearTransient();
    for (let f = Math.floor(shot.start * FPS); f <= frame; f += stepFrames) {
      this.setFrame(f);
    }
    this.setFrame(frame);
    return this;
  }

  clearTransient() {
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    this.projectiles.length = 0;
    for (const r of this.rings) this.scene.remove(r.mesh);
    this.rings.length = 0;
    this.events.length = 0;
    this.titleState = { visible: false, t0: 0, dur: 1 };
    this.fadeState = { active: false, t0: 0, dur: 1.6 };
    this.godRayState = { power: 0, t0: -99 };
    this._lastWet = -1;
    for (const a of this.actors.values()) a.mixer.stopAllAction();
  }

  frameStats() {
    const A = {};
    for (const [id, a] of this.actors) if (a.root.visible) A[id] = { pos: a.root.position.toArray().map(v => +v.toFixed(2)), clip: a.actions.get('base') ? a.actions.get('base').getClip().name : null, t: +a._t.toFixed(2) };
    return { frame: this.frame, time: +this.time.toFixed(3), shot: this.shot.id + ' ' + this.shot.name, cam: this.camera.position.toArray().map(v => +v.toFixed(2)), actors: A, weather: { storm: +this.weather.storm.toFixed(2), rain: +this.weather.rain.toFixed(2) } };
  }
}

export { SHOTS, CAST, PROPS, FPS, DURATION, WIDTH, HEIGHT, weatherAt };
