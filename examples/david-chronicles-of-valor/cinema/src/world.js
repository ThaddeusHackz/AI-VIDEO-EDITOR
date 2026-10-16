// world.js — environment, weather, particles, props, crowds and titles for the DAVID film.
// Everything is driven by (time, seeded rng): no wall clock, no unseeded randomness.
import * as THREE from 'three';
import { mulberry32, noise3, clamp, lerp, smoothstep, DEG } from './util.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ------------------------------------------------------------------ sky + light

export function createSky() {
  const geo = new THREE.SphereGeometry(400, 48, 32);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uSun: { value: new THREE.Vector3(0.4, 0.5, 0.6).normalize() },
      uTop: { value: new THREE.Color(0x2f6bb5) },
      uHorizon: { value: new THREE.Color(0xd9b98a) },
      uGround: { value: new THREE.Color(0x8a7452) },
      uSunColor: { value: new THREE.Color(0xffe6b8) },
      uSunSize: { value: 0.06 },
      uStorm: { value: 0.0 },
      uFlash: { value: 0.0 },
      uTime: { value: 0.0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSun, uTop, uHorizon, uGround, uSunColor;
      uniform float uStorm, uFlash, uTime, uSunSize;
      varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec3 dir = normalize(vDir);
        vec3 sky = mix(uHorizon, uTop, pow(clamp(dir.y,0.0,1.0), 0.5));
        sky = mix(sky, uGround, smoothstep(0.0,-0.18,dir.y));
        // storm deck
        vec2 uv = dir.xz / max(abs(dir.y)+0.22, 0.22);
        float c = vnoise(uv*1.3 + uTime*0.02)*0.68 + vnoise(uv*3.4 - uTime*0.03)*0.32;
        float deck = smoothstep(0.30, 0.88, c) * smoothstep(-0.05, 0.45, dir.y) * uStorm;
        vec3 stormCol = mix(vec3(0.22,0.23,0.27), vec3(0.42,0.43,0.48), c);
        sky = mix(sky, stormCol, deck*0.92);
        // sun / haze core (no transcendentals: dot-product based falloff)
        float d = clamp(dot(dir, normalize(uSun)), -1.0, 1.0);
        float core = smoothstep(0.9985 - uSunSize, 0.9997, d);
        float glow = pow(max(0.0, d), 12.0) * 0.5 + pow(max(0.0, d), 3.0) * 0.18;
        sky += uSunColor * (core * 0.9 + glow * (1.0 - uStorm * 0.85));
        sky += vec3(0.55, 0.60, 0.72) * uFlash;
        gl_FragColor = vec4(sky, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ terrain

// The battlefield height field. This single function is used both to build the terrain
// mesh and to place every actor, so feet always meet the ground exactly.
export function terrainY(x, z) {
  const r = Math.hypot(x, z);
  const flat = 0.30 + 0.70 * smoothstep((r - 16) / 30);       // gentle floor inside the arena
  const ridge = Math.exp(-Math.pow((x - 120) / 70, 2)) * 26 * smoothstep((x - 20) / 60);
  const n1 = (noise3(1337, x * 0.035, 0, z * 0.035) - 0.5) * 3.4 * flat;
  const n2 = (noise3(1344, x * 0.12, 3, z * 0.12) - 0.5) * 0.8 * flat;
  const dip = -0.32 * Math.exp(-Math.pow(r / 55, 2)) * (1 - flat * 0.45);
  const far = 1.1 * smoothstep((r - 90) / 60) * (noise3(1340, x * 0.02, 9, z * 0.02) - 0.4);
  return n1 + n2 + ridge + dip + far;
}

export function terrainSlopeOK(x, z) { return Math.abs(terrainY(x, z)) < 6; }

export function createTerrain({ size = 340, seg = 240 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cDry = new THREE.Color(0x8c7a58), cDust = new THREE.Color(0xa99a76), cMud = new THREE.Color(0x3f3226), cGrass = new THREE.Color(0x66703f), cRock = new THREE.Color(0x6a6459);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = terrainY(x, z);
    pos.setY(i, y);
    const r = Math.hypot(x, z);
    const ridge = Math.exp(-Math.pow((x - 120) / 70, 2)) * 26 * smoothstep((x - 20) / 60);
    const mud = clamp(0.5 + noise3(1355, x * 0.06, 5, z * 0.06) * 1.4, 0, 1);
    const grass = clamp(1.6 - Math.abs(y) * 0.9, 0, 1) * 0.5;
    tmp.copy(cDry).lerp(cDust, clamp(0.5 + noise3(1365, x * 0.1, 1, z * 0.1) * 1.1, 0, 1));
    tmp.lerp(cGrass, grass * 0.6);
    tmp.lerp(cRock, clamp(ridge / 30, 0, 1) * 0.8);
    tmp.lerp(cMud, clamp(mud * 0.55, 0, 0.5));
    // darken the trampled arena so the fight reads against the field
    const arena = Math.exp(-Math.pow(r / 26, 2));
    tmp.multiplyScalar(1 - 0.12 * arena);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, dithering: true });
  mat.envMapIntensity = 0;   // the baked relief is entirely diffuse
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'terrain';
  mesh.userData.baseColors = colors.slice();
  return mesh;
}

export function terrainHeightAt(terrain, x, z) { return terrainY(x, z); }

// ------------------------------------------------------------------ props

// Merge a group's meshes into one geometry per material so the software rasteriser sees
// far fewer state changes. Everything static in the world goes through this.
export function mergeGroupByMaterial(group) {
  const buckets = new Map();
  group.updateMatrixWorld(true);
  group.traverse(o => {
    if (!o.isMesh || Array.isArray(o.material)) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) {
      const n = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    const key = o.material.uuid;
    if (!buckets.has(key)) buckets.set(key, { mat: o.material, geos: [] });
    buckets.get(key).geos.push(g);
  });
  const out = new THREE.Group();
  for (const { mat, geos } of buckets.values()) {
    const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = true;
    out.add(mesh);
  }
  return out;
}

export function createRuin({ seed = 5, columns = 4, spread = 9, wallAt = [spread * 0.62, -spread * 0.62], wallHeight = 2.9 } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry32(seed);
  const stone = new THREE.MeshStandardMaterial({ color: 0x585044, roughness: 0.96, metalness: 0.0, envMapIntensity: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x413b32, roughness: 0.98, metalness: 0.0, envMapIntensity: 0.2 });
  for (let i = 0; i < columns; i++) {
    const h = 2.4 + rnd() * 2.2;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42 + rnd() * 0.12, 0.5 + rnd() * 0.12, h, 14), i % 2 ? stone : dark);
    col.position.set((rnd() - 0.5) * spread, h / 2 - 0.4, (rnd() - 0.5) * spread);
    col.rotation.set((rnd() - 0.5) * 0.06, rnd() * Math.PI, (rnd() - 0.5) * 0.10);
    col.castShadow = col.receiveShadow = true;
    g.add(col);
    if (rnd() > 0.55) { // broken capital
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.4, 1.1), stone);
      cap.position.set(col.position.x + (rnd() - 0.5), h / 2 + 0.1, col.position.z + (rnd() - 0.5));
      cap.rotation.y = rnd() * Math.PI; cap.castShadow = true; g.add(cap);
    }
  }
  for (let i = 0; i < 6; i++) {   // fallen blocks
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.2 + rnd() * 1.6, 0.5 + rnd() * 0.5, 1.0 + rnd() * 1.4), stone);
    b.position.set((rnd() - 0.5) * spread * 1.5, 0.2, (rnd() - 0.5) * spread * 1.5);
    b.rotation.set(rnd() * 0.3, rnd() * Math.PI, rnd() * 0.3);
    b.castShadow = b.receiveShadow = true; g.add(b);
  }
  // a surviving wall to wall-run along (kept modest so it frames rather than dominates)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(6.4, wallHeight, 0.55), stone);
  wall.position.set(wallAt[0], wallHeight * 0.47, wallAt[1]);
  wall.rotation.y = -0.35; wall.castShadow = wall.receiveShadow = true;
  g.add(wall);
  for (let i = 0; i < 3; i++) {   // ashlar courses so the wall reads as masonry
    const seam = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.06, 0.60), dark);
    seam.position.set(wall.position.x, 0.45 + i * (wallHeight * 0.33), wall.position.z);
    seam.rotation.y = -0.35; g.add(seam);
  }
  const merged = mergeGroupByMaterial(g);
  merged.userData.wall = { x: wallAt[0], z: wallAt[1], rotY: -0.35 };
  return merged;
}

export function createChariot() {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.88, envMapIntensity: 0.25 });
  const wood2 = new THREE.MeshStandardMaterial({ color: 0x5a4630, roughness: 0.85, envMapIntensity: 0.25 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x3c3a38, roughness: 0.5, metalness: 0.8 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 2.3), wood);
  body.position.y = 0.95; body.castShadow = body.receiveShadow = true; g.add(body);
  const front = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.16), wood2);
  front.position.set(0, 1.25, 1.1); front.castShadow = true; g.add(front);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 3.4, 10), wood2);
  pole.rotation.x = Math.PI / 2.15; pole.position.set(0, 0.72, 2.4); pole.castShadow = true; g.add(pole);
  for (const s of [-1, 1]) {
    const wheel = new THREE.Group();
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.075, 8, 26), wood2);
    rim.castShadow = true; wheel.add(rim);
    for (let i = 0; i < 8; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.36, 6), wood);
      sp.rotation.z = (i / 8) * Math.PI; sp.castShadow = true; wheel.add(sp);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.22, 12), iron);
    hub.rotation.x = Math.PI / 2; wheel.add(hub);
    wheel.position.set(s * 0.92, 0.74, -0.2);
    g.add(wheel);
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function createRocksMerged({ count = 40, seed = 21, radius = 90, minR = 6, maxS = 1.9 } = {}) {
  const host = new THREE.Group();
  const rnd = mulberry32(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5d5548, roughness: 0.96, envMapIntensity: 0.22 });
  for (let i = 0; i < count; i++) {
    const r = minR + rnd() * radius;
    const a = rnd() * Math.PI * 2;
    const s = 0.3 + rnd() * maxS;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    rock.position.set(Math.cos(a) * r, terrainY(Math.cos(a) * r, Math.sin(a) * r) + s * 0.3, Math.sin(a) * r);
    rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    host.add(rock);
  }
  const merged = mergeGroupByMaterial(host);
  merged.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  return merged;
}

export function createRocks({ count = 40, seed = 21, radius = 90 } = {}) {
  const rnd = mulberry32(seed);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5d5548, roughness: 0.96, envMapIntensity: 0.22 });
  const group = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const r = minR + rnd() * radius;
    const a = rnd() * Math.PI * 2;
    const s = 0.3 + rnd() * maxS;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), mat);
    rock.position.set(Math.cos(a) * r, s * 0.36, Math.sin(a) * r);
    rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    rock.castShadow = rock.receiveShadow = true;
    group.add(rock);
  }
  return group;
}

// lentil field for Shammah's stand: instanced tufts
export function createCropField({ count = 9000, radius = 26, seed = 77, center = new THREE.Vector3(-40, 0, 18) } = {}) {
  const geo = new THREE.PlaneGeometry(0.16, 0.34, 1, 2);
  geo.translate(0, 0.17, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a6d3c, roughness: 0.92, side: THREE.DoubleSide, alphaTest: 0.02, envMapIntensity: 0.2 });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  inst.castShadow = false; inst.receiveShadow = false;
  const rnd = mulberry32(seed);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(rnd()) * radius, a = rnd() * Math.PI * 2;
    p.set(center.x + Math.cos(a) * r, 0.02 + rnd() * 0.05, center.z + Math.sin(a) * r);
    q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.4, rnd() * Math.PI, (rnd() - 0.5) * 0.4));
    s.set(0.7 + rnd() * 0.7, 0.65 + rnd() * 0.9, 1);
    inst.setMatrixAt(i, m.compose(p, q, s));
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  return inst;
}

// planted sword for the outro
export function createPlantedSword(propGltf) {
  const variant = new THREE.Group();
  const obj = propGltf.scene ? propGltf.scene.clone(true) : propGltf.clone(true);
  obj.scale.setScalar(1.05);
  obj.rotation.set(Math.PI * 0.5, 0, 0);
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  variant.add(obj);
  return variant;
}

// ------------------------------------------------------------------ crowd (billboard army)

// Renders a small atlas of the character in several poses/angles, then scatters them as
// instanced billboards: this is how the 300-strong Philistine line is drawn at 4K without
// 300 skinned meshes.
export async function buildCrowdAtlas(renderer, actorFactory, { poses = [], angles = 8, cell = 256 } = {}) {
  const W = cell * angles, H = cell * Math.max(poses.length, 1);
  const rt = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x4a4238, 1.25));
  const key = new THREE.DirectionalLight(0xfff0da, 2.2); key.position.set(3, 6, 4); scene.add(key);
  const actor = actorFactory();
  scene.add(actor.root);
  const cam = new THREE.OrthographicCamera(-0.7, 0.7, 1.98, -0.04, 0.01, 60);
  const prevTarget = renderer.getRenderTarget();
  const oldAutoClear = renderer.autoClear;
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setRenderTarget(rt);              // the atlas must be drawn into its own target
  const mixer = actor.mixer;
  for (let r = 0; r < poses.length; r++) {
    const { clip, t } = poses[r];
    actor.play(clip, { fade: 0, timeScale: 1, from: 0 });
    mixer.setTime(t);
    for (let a = 0; a < angles; a++) {
      actor.root.rotation.y = (a / angles) * Math.PI * 2;
      cam.position.set(0, 1.0, 8); cam.lookAt(0, 1.0, 0);
      cam.left = -0.7; cam.right = 0.7; cam.top = 1.98; cam.bottom = -0.04; cam.updateProjectionMatrix();
      renderer.setViewport(a * cell, H - (r + 1) * cell, cell, cell);
      renderer.setScissor(a * cell, H - (r + 1) * cell, cell, cell);
      renderer.setScissorTest(true);
      renderer.render(scene, cam);
    }
  }
  renderer.setScissorTest(false);
  renderer.setRenderTarget(prevTarget);
  renderer.autoClear = oldAutoClear;
  renderer.setViewport(0, 0, renderer.domElement.width, renderer.domElement.height);
  actor.root.parent && actor.root.parent.remove(actor.root);
  return { texture: rt.texture, cols: angles, rows: poses.length };
}

export function createCrowd(atlas, { count = 300, seed = 909, extent = [90, 44], height = 1.78, tint = 0xb0a89b, spread = [-16, -46] } = {}) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const instanceMatrixData = new Float32Array(count * 16);
  const rnd = mulberry32(seed);
  const uvOff = new Float32Array(count * 2), tintAttr = new Float32Array(count * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const col = Math.floor(rnd() * atlas.cols), row = Math.floor(rnd() * atlas.rows);
    uvOff[i * 2] = col / atlas.cols;
    uvOff[i * 2 + 1] = (atlas.rows - 1 - row) / atlas.rows;
    const x = (rnd() - 0.5) * extent[0];
    const z = spread[0] + (rnd() - 0.5) * extent[1] + (rnd() < 0.35 ? -spread[1] * 0.5 : 0);
    pos.set(x, 0, z);
    q.setFromEuler(new THREE.Euler(0, rnd() * Math.PI * 2, 0));
    const s = height * (0.92 + rnd() * 0.18);
    sc.set(s * 0.7, s, 1);
    crowdMatrix(m, pos, q, sc, i, instanceMatrixData);
    const shade = 0.5 + rnd() * 0.6;
    const c = new THREE.Color(tint).multiplyScalar(shade);
    tintAttr[i * 3] = c.r; tintAttr[i * 3 + 1] = c.g; tintAttr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('aUvOffset', new THREE.InstancedBufferAttribute(uvOff, 2));
  geo.setAttribute('aTint', new THREE.InstancedBufferAttribute(tintAttr, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, alphaTest: 0.32, side: THREE.DoubleSide, depthWrite: true,
    uniforms: {
      uMap: { value: atlas.texture }, uCamPos: { value: new THREE.Vector3() },
      uAtlasCols: { value: atlas.cols }, uAtlasRows: { value: atlas.rows },
      uFogColor: { value: new THREE.Color(0xb7a582) }, uFogDensity: { value: 0.004 },
      uLight: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: /* glsl */`
      attribute vec2 aUvOffset; attribute vec3 aTint;
      uniform vec3 uCamPos; uniform float uAtlasCols, uAtlasRows;
      varying vec2 vUv; varying vec3 vTint; varying float vFog;
      void main(){
        vec4 wc4 = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vec3 wc = wc4.xyz;
        float sx = length(instanceMatrix[0].xyz), sy = length(instanceMatrix[1].xyz);
        vec3 local = vec3(position.x * sx, position.y * sy, 0.0);
        float ang = atan(uCamPos.x - wc.x, uCamPos.z - wc.z);
        mat2 rot = mat2(cos(ang), sin(ang), -sin(ang), cos(ang));
        vec3 bill = vec3(rot * local.xy, 0.0);
        vec4 world = vec4(wc + bill, 1.0);
        gl_Position = projectionMatrix * viewMatrix * world;
        vUv = uv * vec2(1.0 / uAtlasCols, 1.0 / uAtlasRows) + aUvOffset;
        vTint = aTint;
        float d = length(world.xyz - uCamPos);
        vFog = 1.0 - exp(-pow(d * 0.014, 2.0));
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uFogColor; uniform vec3 uLight;
      varying vec2 vUv; varying vec3 vTint; varying float vFog;
      void main(){
        vec4 tex = texture2D(uMap, vUv);
        if (tex.a < 0.32) discard;
        vec3 col = tex.rgb * vTint * uLight;
        col = mix(col, uFogColor, clamp(vFog, 0.0, 0.92));
        gl_FragColor = vec4(col, tex.a);
      }`,
  });
  const inst = new THREE.InstancedMesh(geo, mat, count);
  for (let i = 0; i < count; i++) {
    inst.setMatrixAt(i, new THREE.Matrix4().fromArray(instanceMatrixData, i * 16));
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.frustumCulled = false;
  inst.userData.updateCamera = (camPos) => { mat.uniforms.uCamPos.value.copy(camPos); };
  inst.userData.material = mat;
  inst.userData.hidden = false;
  return inst;
}

function crowdMatrix(out, pos, q, sc, i, store) {
  const m = new THREE.Matrix4().compose(pos, q, sc);
  m.toArray(store, i * 16);
  return m;
}

// ------------------------------------------------------------------ particles

class BurstPool {
  constructor({ count, makeGeometry, material, gravity = -9.8, additive = true }) {
    this.count = count; this.cursor = 0;
    this.t0 = new Float32Array(count).fill(-999);
    this.origin = new Float32Array(count * 3);
    this.vel = new Float32Array(count * 3);
    this.life = new Float32Array(count).fill(1);
    this.size = new Float32Array(count).fill(1);
    this.gravity = gravity;
    const geo = makeGeometry(count);
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1));
    this.points = new THREE.Points(geo, material);
    this.points.frustumCulled = false;
    this.posAttr = geo.attributes.position;
    this.sizeAttr = geo.attributes.aSize;
    this.alphaAttr = geo.attributes.aAlpha;
  }
  spawn(time, x, y, z, vx, vy, vz, life, size) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % this.count;
    this.t0[i] = time; this.origin[i * 3] = x; this.origin[i * 3 + 1] = y; this.origin[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.size[i] = size;
  }
  update(time, opts = {}) {
    const p = this.posAttr.array, s = this.sizeAttr.array, a = this.alphaAttr.array;
    const drag = opts.drag ?? 0.0, g = opts.gravity ?? this.gravity, wind = opts.wind ?? 0;
    for (let i = 0; i < this.count; i++) {
      const age = time - this.t0[i];
      if (age < 0 || age > this.life[i]) { a[i] = 0; s[i] = 0; p[i * 3 + 1] = -999; continue; }
      const k = age / this.life[i];
      const decay = Math.exp(-drag * age);
      const vx = this.vel[i * 3], vy = this.vel[i * 3 + 1], vz = this.vel[i * 3 + 2];
      p[i * 3] = this.origin[i * 3] + vx * age * decay + wind * age * age * 0.5;
      p[i * 3 + 1] = this.origin[i * 3 + 1] + vy * age * decay + 0.5 * g * age * age;
      p[i * 3 + 2] = this.origin[i * 3 + 2] + vz * age * decay;
      a[i] = Math.pow(1 - k, opts.falloff ?? 1.4);
      s[i] = this.size[i] * (opts.grow ? lerp(0.4, 1.6, k) : 1);
    }
    this.posAttr.needsUpdate = true; this.sizeAttr.needsUpdate = true; this.alphaAttr.needsUpdate = true;
  }
}

function spriteMaterial(color, { additive = true, map = null } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) }, uMap: { value: map }, uPixel: { value: 1.0 }, uOpacity: { value: 1.0 },
    },
    vertexShader: /* glsl */`
      attribute float aSize; attribute float aAlpha;
      varying float vAlpha; uniform float uPixel;
      void main(){
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, aSize * uPixel / max(0.001, -mv.z));
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform sampler2D uMap; uniform float uOpacity;
      varying float vAlpha;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        float soft = smoothstep(0.5, 0.06, r);
        vec3 col = uColor;
        gl_FragColor = vec4(col, vAlpha * soft * uOpacity);
        if (gl_FragColor.a < 0.004) discard;
      }`,
  });
}

export function createFx(quality = 1) {
  const fx = {};
  fx.sparks = new BurstPool({
    count: Math.round(900 * quality), material: spriteMaterial(0xffc46b),
    makeGeometry: n => new THREE.BufferGeometry(),
  });
  fx.sparks.update(0, { gravity: -16, wind: 1.5, falloff: 1.9 });
  fx.dust = new BurstPool({
    count: Math.round(900 * quality),
    material: spriteMaterial(0xc3a878, { additive: false }),
    makeGeometry: n => new THREE.BufferGeometry(),
  });
  fx.dust.update(0, { gravity: -1.2, wind: 2.4, drag: 1.1, grow: true, falloff: 1.3 });
  fx.mud = new BurstPool({
    count: Math.round(700 * quality),
    material: spriteMaterial(0x4a3323, { additive: false }),
    makeGeometry: n => new THREE.BufferGeometry(),
  });
  fx.mud.update(0, { gravity: -14, wind: 0.6, falloff: 1.5 });
  fx.blood = new BurstPool({
    count: Math.round(420 * quality),
    material: spriteMaterial(0x7d1512, { additive: false }),
    makeGeometry: n => new THREE.BufferGeometry(),
  });
  fx.blood.update(0, { gravity: -13, wind: 0.4, falloff: 1.2 });
  fx.splash = new BurstPool({
    count: Math.round(800 * quality),
    material: spriteMaterial(0xbfd2dd, { additive: true }),
    makeGeometry: n => new THREE.BufferGeometry(),
  });
  fx.splash.update(0, { gravity: -13, wind: 1.2, falloff: 1.6 });
  fx.all = [fx.sparks, fx.dust, fx.mud, fx.blood, fx.splash];
  fx.group = new THREE.Group();
  for (const k of ['sparks', 'dust', 'mud', 'blood', 'splash']) fx.group.add(fx[k].points);
  return fx;
}

// rain: deterministic column of streaks around the camera
export function createRain(count = 9000, { radius = 34, height = 26, seed = 4711 } = {}) {
  const geo = new THREE.BufferGeometry();
  const rnd = mulberry32(seed);
  const base = new Float32Array(count * 3), speed = new Float32Array(count), len = new Float32Array(count);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * radius;
    base[i * 3] = Math.cos(a) * r; base[i * 3 + 1] = rnd() * height; base[i * 3 + 2] = Math.sin(a) * r;
    speed[i] = 16 + rnd() * 12; len[i] = 0.5 + rnd() * 1.1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: {
      uTime: { value: 0 }, uCentre: { value: new THREE.Vector3() }, uHeight: { value: height },
      uWind: { value: new THREE.Vector3(0.6, 0, 0.2) }, uColor: { value: new THREE.Color(0xbcd0e0) },
      uOpacity: { value: 0.34 }, uPixel: { value: 1 },
    },
    vertexShader: /* glsl */`
      attribute float aSpeed, aLen;
      uniform float uTime, uHeight, uPixel; uniform vec3 uCentre, uWind;
      varying float vFade;
      void main(){
        vec3 p = position;
        float y = mod(p.y - uTime * aSpeed, uHeight);
        p.y = y;
        p.xz += uWind.xz * (uHeight - y) * 0.06;
        p += uCentre;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.5, aLen * uPixel * 14.0 / max(0.001, -mv.z));
        vFade = smoothstep(120.0, 6.0, -mv.z);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform float uOpacity;
      varying float vFade;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float streak = smoothstep(0.5, 0.0, abs(d.x) * 6.0) * smoothstep(0.5, 0.05, abs(d.y));
        gl_FragColor = vec4(uColor, streak * uOpacity * vFade);
        if (gl_FragColor.a < 0.004) discard;
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.material = mat;
  points.userData.base = base;
  return points;
}

// lightning: momentary sky + light flash, driven by absolute time
export function lightningFlash(t, { times = [117.2, 123.4, 138.1, 149.6], decay = 0.42 } = {}) {
  let v = 0;
  for (const tt of times) {
    const dt = t - tt;
    if (dt >= 0 && dt < 1.2) {
      const env = Math.exp(-Math.pow(dt / decay, 2)) * (dt < 0.06 ? 1.0 : 0.72 + 0.28 * Math.sin(dt * 60) ** 2 * Math.exp(-dt * 3));
      v = Math.max(v, env);
    }
  }
  return v;
}

// ------------------------------------------------------------------ title card

export function createTitleTexture({ text = 'VALOR', sub = 'THE CHRONICLES OF DAVID', width = 2048, height = 512 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  // chiselled metal: layered strokes + vertical gradient + noise flecks
  const grad = ctx.createLinearGradient(0, height * 0.18, 0, height * 0.86);
  grad.addColorStop(0.0, '#f7e7bd');
  grad.addColorStop(0.28, '#d9b169');
  grad.addColorStop(0.5, '#8d6a2f');
  grad.addColorStop(0.62, '#f2dcae');
  grad.addColorStop(0.86, '#6d4f22');
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.round(height * 0.52)}px "Cinzel", "Trajan Pro", Georgia, serif`;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.round(height * 0.030);
  ctx.strokeStyle = 'rgba(30,20,8,0.92)';
  ctx.strokeText(text, width / 2, height * 0.44);
  ctx.lineWidth = Math.round(height * 0.016);
  ctx.strokeStyle = 'rgba(255,238,200,0.55)';
  ctx.strokeText(text, width / 2, height * 0.44 - height * 0.012);
  ctx.fillStyle = grad;
  ctx.fillText(text, width / 2, height * 0.44);
  ctx.font = `600 ${Math.round(height * 0.115)}px "Cinzel", Georgia, serif`;
  ctx.lineWidth = Math.round(height * 0.012);
  ctx.strokeStyle = 'rgba(26,18,8,0.9)';
  ctx.strokeText(sub, width / 2, height * 0.79);
  ctx.fillStyle = '#e8cf9b';
  ctx.fillText(sub, width / 2, height * 0.79);
  const rnd = mulberry32(4242);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * width, y = rnd() * height;
    const g = 120 + rnd() * 120;
    ctx.fillStyle = `rgba(${g},${g * 0.85},${g * 0.6},${0.03 + rnd() * 0.05})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { texture: tex, canvas };
}

export function createTitleMesh() {
  const { texture, canvas } = createTitleTexture({});
  const geo = new THREE.PlaneGeometry(16, 4, 1, 1);
  const mat = new THREE.MeshStandardMaterial({
    map: texture, transparent: true, roughness: 0.38, metalness: 0.85,
    emissive: new THREE.Color(0x2a1c08), emissiveIntensity: 1.0, alphaTest: 0.02,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.canvas = canvas;
  return mesh;
}
