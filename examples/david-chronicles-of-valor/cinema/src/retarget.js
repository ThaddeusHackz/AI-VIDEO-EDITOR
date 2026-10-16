// retarget.js — rebind Mixamo mocap clips (authored on the X-Bot rest skeleton) onto a
// character whose bone rest transforms differ, applying the standard rest-pose correction
//     q_char(t) = (qRestChar * qRestRaw^-1) * q_raw(t)
// and mapping translation deltas through the parent's rest-orientation difference so that
// hips motion keeps its authored direction and scale (cm vs m exports differ by 100x).
//
// Why this is needed: the Mixamo animation GLBs carry the X-Bot skeleton's rest pose. A
// character exported from a different FBX (the Paladin used here) has different local rest
// orientations, so playing the raw clips directly collapses the figure onto the floor.
// Correcting the rest pose first makes every clip bind and keeps the authored motion.
import * as THREE from 'three';

// Map every named node. The X-Bot clip files ship no skinned mesh, so their joints arrive
// as plain Object3Ds rather than Bones — name matching must therefore cover all nodes.
export function boneMap(root) {
  const m = new Map();
  root.traverse(o => { if (o.name) m.set(o.name, o); });
  return m;
}

// world-space rest pose of every named node (call while the hierarchy is at rest)
export function restPose(root) {
  root.updateMatrixWorld(true);
  const m = new Map();
  const wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3();
  root.traverse(o => {
    if (!o.name) return;
    o.matrixWorld.decompose(wp, wq, ws);
    m.set(o.name, { q: wq.clone(), p: wp.clone(), sx: ws.x, sy: ws.y, sz: ws.z });
  });
  return m;
}

export class Retargeter {
  constructor(charRoot, opts = {}) {
    this.char = charRoot;
    this.charNodes = boneMap(charRoot);
    this.charRest = restPose(charRoot);
    const hipsName = [...this.charNodes.keys()].find(n => /Hips$/i.test(n));
    if (!hipsName) throw new Error('retarget: character has no Hips node');
    this.hipsName = hipsName;
    this.charHipY = (this.charRest.get(hipsName) || {}).p ? this.charRest.get(hipsName).p.y : 1;
    this.extraScale = opts.scale ?? 1;
  }

  // bind one clip from a raw Mixamo gltf onto the character
  bind(rawGltf, opts = {}) {
    const rawNodes = boneMap(rawGltf.scene);
    const rawRest = restPose(rawGltf.scene);
    const rawHip = rawRest.get(this.hipsName) || [...rawRest.values()][0];
    const s = (this.charHipY / Math.max(rawHip.p.y, 1e-6)) * this.extraScale;

    const clip = rawGltf.animations[opts.clipIndex ?? 0];
    if (!clip) throw new Error('retarget: source gltf has no animation');
    const stats = { bound: 0, skipped: 0, missing: [] };
    const tracks = [];

    for (const t of clip.tracks) {
      const dot = t.name.lastIndexOf('.');
      const name = t.name.slice(0, dot), prop = t.name.slice(dot + 1);
      const cb = this.charNodes.get(name), rb = rawNodes.get(name);
      if (!cb || !rb) { stats.skipped++; if (stats.missing.length < 8) stats.missing.push(name); continue; }
      const v = t.values.slice();

      if (prop === 'quaternion') {
        const corr = cb.quaternion.clone().multiply(rb.quaternion.clone().invert());
        const q = new THREE.Quaternion(), tmp = new THREE.Quaternion();
        for (let i = 0; i < v.length; i += 4) {
          q.fromArray(v, i);
          tmp.copy(corr).multiply(q).normalize().toArray(v, i);
        }
      } else if (prop === 'position') {
        // World-space delta mapping. The clip's translation values are expressed in the
        // *local* units of the source skeleton (this source authors the hips in metres), while
        // the character's bones are in different units (the character armature carries a 0.01
        // scale, i.e. cm). Convert the delta to world space with the source parent's rest
        // orientation and scale, then back into the character parent's local space.
        //
        // The two parents must be looked up SEPARATELY: the source and the character do not
        // share a hierarchy above the hips (source: RootNode -> Hips, character:
        // Armature -> Hips). Looking the character's parent up by the *source's* parent name
        // returns undefined, and the fallbacks then quietly degrade to identity rotation with a
        // scale ratio of 1 — every hips delta came out 100x too small and unrotated, so the
        // clip's forward travel was what surfaced on the screen's vertical axis. That is the
        // bug tools/diag-units.cjs pins down; do not merge these two lookups again.
        const rawParentName = (rb.parent && rb.parent.name) || null;
        const charParentName = (cb.parent && cb.parent.name) || null;
        const rrP = rawParentName ? rawRest.get(rawParentName) : null;
        const crP = charParentName ? this.charRest.get(charParentName) : null;
        if (charParentName && !crP) { stats.posFrameMissing = (stats.posFrameMissing || 0) + 1; }
        const wqRaw = rrP ? rrP.q : new THREE.Quaternion();
        const wqChar = crP ? crP.q.clone().invert() : new THREE.Quaternion();
        const sRaw = rrP ? (rrP.sy || 1) : 1;
        const sChar = crP ? (crP.sy || 1) : 1;
        const d = new THREE.Vector3();
        for (let i = 0; i < v.length; i += 3) {
          d.set(v[i] - rb.position.x, v[i + 1] - rb.position.y, v[i + 2] - rb.position.z)
            .applyQuaternion(wqRaw)
            .multiplyScalar(sRaw)
            .applyQuaternion(wqChar)
            .divideScalar(sChar);
          v[i] = cb.position.x + d.x; v[i + 1] = cb.position.y + d.y; v[i + 2] = cb.position.z + d.z;
        }
      } else { stats.skipped++; continue; }   // scale tracks are dropped: the character keeps its rest bone scales
      tracks.push(new THREE.KeyframeTrack(name + '.' + prop, Array.from(t.times), v));
      stats.bound++;
    }
    const bound = new THREE.AnimationClip((opts.label ? opts.label + '|' : '') + clip.name.replace(/^.*\|/, ''), clip.duration, tracks);
    bound.retargetStats = stats;
    bound.sourceName = opts.label || clip.name;
    return bound;
  }
}

// Remove the horizontal (world XZ) component of a root/hips translation track while keeping
// vertical motion, so clips stay planted in place and the choreography supplies placement.
// Bone local axes are not world axes (the Mixamo armature is rotated -90 degrees about X and
// carries a 0.01 scale), so the strip has to happen in world space and be converted back.
export function stripRootMotionHorizontal(clip, retargeter, { nodes = null, keepY = true } = {}) {
  const rootNodes = nodes || [...retargeter.charNodes.keys()].filter(n => /Hips$/i.test(n) || /^Root/i.test(n));
  const q = new THREE.Quaternion(), inv = new THREE.Quaternion();
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.');
    if (t.name.slice(dot + 1) !== 'position') continue;
    const name = t.name.slice(0, dot);
    if (!rootNodes.includes(name)) continue;
    const node = retargeter.charNodes.get(name);
    if (!node) continue;
    const pName = (node.parent && node.parent.name) || null;
    const pRest = pName ? retargeter.charRest.get(pName) : null;
    const scale = pRest ? (pRest.sy || 1) : 1;
    q.copy(pRest ? pRest.q : new THREE.Quaternion());
    inv.copy(q).invert();
    const rest = node.position;
    const d = new THREE.Vector3();
    for (let i = 0; i < t.values.length; i += 3) {
      d.set(t.values[i] - rest.x, t.values[i + 1] - rest.y, t.values[i + 2] - rest.z)
        .applyQuaternion(q).multiplyScalar(scale);
      d.x = 0; d.z = 0;
      if (!keepY) d.y = 0;
      d.divideScalar(scale).applyQuaternion(inv);
      t.values[i] = rest.x + d.x; t.values[i + 1] = rest.y + d.y; t.values[i + 2] = rest.z + d.z;
    }
  }
  return clip;
}

export function bindClips(charRoot, rawGltfs, opts = {}) {
  const rt = new Retargeter(charRoot, opts);
  const out = [];
  for (const g of rawGltfs) for (let i = 0; i < g.animations.length; i++)
    out.push(rt.bind(g, { ...opts, clipIndex: i }));
  return out;
}
