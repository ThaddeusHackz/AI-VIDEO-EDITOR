// assets.js — characters, mocap clips and props for the DAVID cinema renderer.
// Real rigs, real animation: Mixamo characters driven by retargeted Mixamo mocap,
// with Quaternius CC0 weapons attached to hand bones.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { Retargeter, boneMap, stripRootMotionHorizontal } from './retarget.js';

const loader = new GLTFLoader();
const gltfCache = new Map();

export function loadGLTF(url) {
  if (!gltfCache.has(url)) {
    gltfCache.set(url, new Promise((res, rej) => loader.load(url, g => res(g), undefined, e => rej(new Error(url + ': ' + e.message)))));
  }
  return gltfCache.get(url);
}

export const MANNEQUIN = '/assets/chars/paladin.glb';
export const BODY = '/assets/chars/Superhero_Male.glb';

// ---------------------------------------------------------------- clip utilities

// Plant the actor: remove world-horizontal root motion from a bound clip (see retarget.js).
export function stripRootXZ(clip, retargeter, keepY = true) {
  return stripRootMotionHorizontal(clip, retargeter, { keepY });
}

// keep only tracks whose target bone matches a predicate -> used for body-region layering
export function maskClip(clip, keep) {
  const tracks = clip.tracks.filter(t => {
    const dot = t.name.lastIndexOf('.');
    return keep(t.name.slice(0, dot));
  });
  const out = new THREE.AnimationClip(clip.name + '#mask', clip.duration, tracks);
  out.retargetStats = clip.retargetStats;
  out.sourceName = clip.sourceName;
  return out;
}

const UPPER = /^(mixamorigSpine|mixamorigSpine1|mixamorigSpine2|mixamorigNeck|mixamorigHead|mixamorig(Left|Right)Shoulder|mixamorig(Left|Right)Arm|mixamorig(Left|Right)ForeArm|mixamorig(Left|Right)Hand|.*(Thumb|Index|Middle|Ring|Pinky))/;
const LOWER = /^(mixamorigHips|mixamorig(Left|Right)UpLeg|mixamorig(Left|Right)Leg|mixamorig(Left|Right)Foot|mixamorig(Left|Right)ToeBase)/;

export const upperMask = clip => maskClip(clip, n => UPPER.test(n));
export const lowerMask = clip => maskClip(clip, n => LOWER.test(n));

// ---------------------------------------------------------------- library

export class RigLibrary {
  constructor(paths = {}) {
    this.paths = paths;
    this.base = null;         // character gltf
    this.clips = new Map();   // name -> bound AnimationClip
    this.sources = new Map();  // name -> source glb url
    this.restHip = 0;
  }

  async load({ character = MANNEQUIN, clipNames = [], clipUrls = {} } = {}) {
    this.base = await loadGLTF(character);
    this.base.scene.updateMatrixWorld(true);
    this.retargeter = new Retargeter(this.base.scene);
    this.restHip = this.retargeter.charHipY;
    const list = clipNames.length ? clipNames : Object.keys(clipUrls);
    for (const name of list) {
      const url = clipUrls[name] || '/assets/anim/' + name + '.glb';
      try {
        const g = await loadGLTF(url);
        const clip = this.retargeter.bind(g, { label: name });
        this.clips.set(name, stripRootXZ(clip, this.retargeter, true));
        this.sources.set(name, url);
      } catch (e) {
        this.clips.set(name, null);
        this.sources.set(name, 'ERROR: ' + e.message);
      }
    }
    return this;
  }

  // Load clips from the CC0 Quaternius set (assets/quaternius/anim). They are authored on a
  // UE-named skeleton; src/ual.js renames both the skeleton and the tracks to Mixamo names so
  // the standard retargeter binds them. Loaded only when a shot asks for one.
  async loadQuaternius(names = []) {
    // NB: a clip that failed to bind is *present* in this.clips with a null value, so the test
    // must be on the value, not on has() — otherwise the fallback silently loads nothing.
    const wanted = names.filter(n => !this.clips.get(n));
    if (!wanted.length) return this;
    const { loadUALSource } = await import('./ual.js');
    for (const name of wanted) {
      try {
        const src = await loadUALSource(name);
        const clip = this.retargeter.bind(src, { label: name });
        this.clips.set(name, stripRootXZ(clip, this.retargeter, true));
        this.sources.set(name, '/assets/quaternius/anim/' + name + '.glb');
      } catch (e) {
        this.clips.set(name, null);
        this.sources.set(name, 'ERROR: ' + e.message);
      }
    }
    return this;
  }

  clip(name) {
    if (!this.clips.has(name)) return null;
    const c = this.clips.get(name);
    return c ? c.clone() : null;    // per-actor copy (actions are not shared between mixers)
  }

  has(name) { return !!this.clips.get(name); }

  newActor(opts = {}) {
    return new Actor(this, opts);
  }
}

// ---------------------------------------------------------------- actor

let actorSeq = 0;

export class Actor {
  constructor(lib, opts = {}) {
    this.lib = lib;
    this.id = opts.name || ('actor' + (++actorSeq));
    this.root = new THREE.Group();
    this.yaw = opts.yaw ?? 0;
    this.scale = opts.scale ?? 1;
    this.inner = skeletonClone(lib.base.scene);
    this.inner.scale.setScalar(this.scale);
    this.root.add(this.inner);
    this.root.rotation.y = this.yaw;
    if (opts.position) this.root.position.copy(opts.position);

    this.mixer = new THREE.AnimationMixer(this.inner);
    this.actions = new Map();
    this.baseClip = opts.base || 'Idle';
    this.timeScale = 1;
    this._t = 0;

    this.palette = opts.palette || null;
    this.materialVariants = !!opts.palette;
    this.applyPalette(this.palette);
    this.inner.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
        if (o.isSkinnedMesh) o.frustumCulled = false;
      }
    });
    this.bones = new Map();
    this.inner.traverse(o => { if (o.isBone && !this.bones.has(o.name)) this.bones.set(o.name, o); });
    // ensure hand bones are reachable by their canonical names
    this.handR = this.bone('mixamorigRightHand');
    this.handL = this.bone('mixamorigLeftHand');
    this.hips = this.bone('mixamorigHips');
    this.head = this.bone('mixamorigHead');
    this.props = [];
  }

  bone(name) {
    if (this.bones.has(name)) return this.bones.get(name);
    // first match in depth-first order, exactly like PropertyBinding.resolve
    let found = null;
    this.inner.traverse(o => { if (!found && o.name === name) { found = o; } });
    return found;
  }

  applyPalette(p) {
    if (!p) return;
    const tint = new THREE.Color(p.tint ?? 0xffffff);
    const rough = p.roughness, metal = p.metalness, emissive = p.emissive;
    this.inner.traverse(o => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      o.material = mats.map(m => {
        if (!m) return m;
        const c = m.clone();
        if (c.color) c.color = c.color.clone().multiply(tint);
        // hostile source materials: Mixamo exports often carry metalness 1, which reads as
        // black without a matching environment. Clamp into a filmic range unless overridden.
        if (c.metalness !== undefined) c.metalness = Math.min(metal !== undefined ? metal : (c.metalness ?? 0), 0.45);
        if (c.roughness !== undefined) c.roughness = Math.max(rough !== undefined ? rough : (c.roughness ?? 1), 0.5);
        // these source textures are very dark leather/steel; lift them into a filmic range
        if (c.color) c.color = c.color.clone().multiplyScalar(p.albedoGain ?? 2.3);
        c.envMapIntensity = p.envMapIntensity ?? 1.5;
        if (emissive !== undefined && c.emissive) c.emissive = c.emissive.clone().add(new THREE.Color(emissive));
        if (p.skinBoost && /skin|head|body/i.test(m.name || '')) c.color = c.color.clone().multiply(new THREE.Color(p.skinBoost));
        return c;
      });
      if (o.material.length === 1) o.material = o.material[0];
    });
  }

  // -------- animation API
  play(name, { fade = 0.25, timeScale = 1, loop = true, weight = 1, layer = 'base', from = 0 } = {}) {
    const clip = this.lib.clip(name);
    if (!clip) return null;
    clip.name = layer + ':' + name;
    const action = this.mixer.clipAction(clip);
    action.setEffectiveTimeScale(timeScale);
    action.setEffectiveWeight(weight);
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = !loop;
    action.reset();
    // start at a normalised offset of the clip
    action.time = from * clip.duration;
    action.play();
    const prev = this.actions.get(layer);
    if (prev && prev !== action) {
      if (fade > 0) prev.crossFadeTo(action, fade, false);
      else prev.stop();
    }
    this.actions.set(layer, action);
    return action;
  }

  // crossfade into a one-shot beat then return to a loop
  beat(name, opts = {}) {
    const a = this.play(name, { ...opts, loop: opts.loop ?? false, layer: opts.layer || 'base' });
    if (a) this.lastBeat = { name, action: a, t0: this._t };
    return a;
  }

  stopLayer(layer, fade = 0.25) {
    const a = this.actions.get(layer);
    if (!a) return;
    a.fadeOut(fade);
    this.actions.delete(layer);
  }

  setTimeScale(s) { this.timeScale = s; }

  update(dt) {
    this.mixer.update(dt * this.timeScale);
    this._t += dt * this.timeScale;
  }

  // -------- props
  // Collapse a prop's material list into one material: fewer state changes per frame.
  static simplifyMaterials(root) {
    const shared = new THREE.MeshStandardMaterial({ color: 0x8d8578, roughness: 0.45, metalness: 0.55, envMapIntensity: 0.9 });
    root.traverse(o => {
      if (!o.isMesh) return;
      if (Array.isArray(o.material)) o.material = o.material[0] || shared;
      o.material = o.material && o.material.color ? o.material : shared;
    });
    return root;
  }

  attach(prop, hand = 'right', { position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, grip = null } = {}) {
    const bone = hand === 'left' ? this.handL : hand === 'right' ? this.handR : this.bone(hand);
    if (!bone) return null;
    const holder = new THREE.Group();
    holder.position.set(...position);
    holder.rotation.set(...rotation);
    holder.scale.setScalar(scale);
    const obj = prop.scene ? prop.scene.clone(true) : prop.clone(true);
    const mats = new Map();
    obj.traverse(o => {
      if (!o.isMesh) return;
      if (Array.isArray(o.material)) o.material = o.material[0];
      // share one material instance per source material across every prop of this actor
      const key = o.material && o.material.uuid;
      if (key) {
        if (!mats.has(key)) {
          const m = o.material.clone();
          m.roughness = Math.min(m.roughness ?? 0.4, 0.55);
          m.metalness = Math.max(m.metalness ?? 0.5, 0.35);
          m.envMapIntensity = 1.0;
          mats.set(key, m);
        }
        o.material = mats.get(key);
      }
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    });
    holder.add(obj);
    if (grip) holder.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, 0));
    bone.add(holder);
    this.props.push({ holder, obj, prop, hand });
    return holder;
  }

  detachAll() {
    for (const p of this.props) p.holder.parent && p.holder.parent.remove(p.holder);
    this.props.length = 0;
  }

  worldPosition(v = new THREE.Vector3()) { return this.root.getWorldPosition(v); }
}

// convenience: build an `enemy` variant of the same rig with its own palette/size
export async function makeEnemy(lib, opts = {}) { return lib.newActor({ palette: { tint: 0x8b8b8b }, ...opts }); }
