// ual.js — bridge for the CC0 Quaternius / CGstuff animation set published by actionforge.app.
//
// WHAT THIS IS
// The files in assets/quaternius/ are the CC0 public-domain assets that actionforge.app
// redistributes (see assets/quaternius/LICENCE.txt for the verbatim notice): a UE-named
// mannequin rig with 71 joints, and 33 full-body clips. The application code on that site is
// proprietary and is deliberately NOT used or copied anywhere here.
//
// WHAT THIS DOES
// Those clips are authored on a UE-style skeleton (pelvis, spine_01, upperarm_l, ...) while the
// film's characters use Mixamo bone names. Rather than fork the proven retarget maths, this
// module renames each clip's tracks from UE names to Mixamo names, after which the existing
// src/retarget.js `Retargeter` binds them by name exactly like the Mixamo clips. The rest-pose
// correction, unit conversion and root-motion handling then all come from that one code path.
import * as THREE from 'three';
import { loadGLTF } from './assets.js';

// UE4/UE5 mannequin name -> Mixamo bone name. Covers the full skeleton present in
// assets/quaternius/rig-human.glb (index below is depth-first order in that file).
export const UE_TO_MIXAMO = {
  pelvis: 'mixamorigHips',
  spine_01: 'mixamorigSpine',
  spine_02: 'mixamorigSpine1',
  spine_03: 'mixamorigSpine2',
  neck_01: 'mixamorigNeck',
  Head: 'mixamorigHead',
  clavicle_l: 'mixamorigLeftShoulder',
  upperarm_l: 'mixamorigLeftArm',
  lowerarm_l: 'mixamorigLeftForeArm',
  hand_l: 'mixamorigLeftHand',
  thigh_l: 'mixamorigLeftUpLeg',
  calf_l: 'mixamorigLeftLeg',
  foot_l: 'mixamorigLeftFoot',
  ball_l: 'mixamorigLeftToeBase',
  clavicle_r: 'mixamorigRightShoulder',
  upperarm_r: 'mixamorigRightArm',
  lowerarm_r: 'mixamorigRightForeArm',
  hand_r: 'mixamorigRightHand',
  thigh_r: 'mixamorigRightUpLeg',
  calf_r: 'mixamorigRightLeg',
  foot_r: 'mixamorigRightFoot',
  ball_r: 'mixamorigRightToeBase',
  // fingers (the rig carries three phalanges plus a leaf per digit; leaves are dropped)
  index_01_l: 'mixamorigLeftHandIndex1', index_02_l: 'mixamorigLeftHandIndex2', index_03_l: 'mixamorigLeftHandIndex3',
  middle_01_l: 'mixamorigLeftHandMiddle1', middle_02_l: 'mixamorigLeftHandMiddle2', middle_03_l: 'mixamorigLeftHandMiddle3',
  ring_01_l: 'mixamorigLeftHandRing1', ring_02_l: 'mixamorigLeftHandRing2', ring_03_l: 'mixamorigLeftHandRing3',
  pinky_01_l: 'mixamorigLeftHandPinky1', pinky_02_l: 'mixamorigLeftHandPinky2', pinky_03_l: 'mixamorigLeftHandPinky3',
  thumb_01_l: 'mixamorigLeftHandThumb1', thumb_02_l: 'mixamorigLeftHandThumb2', thumb_03_l: 'mixamorigLeftHandThumb3',
  index_01_r: 'mixamorigRightHandIndex1', index_02_r: 'mixamorigRightHandIndex2', index_03_r: 'mixamorigRightHandIndex3',
  middle_01_r: 'mixamorigRightHandMiddle1', middle_02_r: 'mixamorigRightHandMiddle2', middle_03_r: 'mixamorigRightHandMiddle3',
  ring_01_r: 'mixamorigRightHandRing1', ring_02_r: 'mixamorigRightHandRing2', ring_03_r: 'mixamorigRightHandRing3',
  pinky_01_r: 'mixamorigRightHandPinky1', pinky_02_r: 'mixamorigRightHandPinky2', pinky_03_r: 'mixamorigRightHandPinky3',
  thumb_01_r: 'mixamorigRightHandThumb1', thumb_02_r: 'mixamorigRightHandThumb2', thumb_03_r: 'mixamorigRightHandThumb3',
};

// Clips whose motion is useful for a martial-arts film. The full set is on disk; this is the
// shortlist the choreography draws from.
export const UAL_FIGHT_CLIPS = [
  'sword_attack', 'sword_block', 'sword_idle',
  'punch_cross', 'punch_jab',
  'jump_start', 'jump_loop', 'jump_land',
  'roll', 'sprint_loop', 'jog_fwd_loop', 'walk_loop',
  'crouch_idle_loop', 'crouch_fwd_loop',
  'hit_chest', 'hit_head', 'interact',
];

// Rename a clip's tracks so the existing name-matched retargeter can bind them.
// Returns a new AnimationClip; the source is left untouched.
export function toMixamoNames(clip, alias = UE_TO_MIXAMO) {
  const tracks = [];
  let renamed = 0, dropped = 0;
  for (const t of clip.tracks) {
    const dot = t.name.lastIndexOf('.');
    if (dot < 0) { dropped++; continue; }
    const name = t.name.slice(0, dot), prop = t.name.slice(dot + 1);
    const mapped = alias[name];
    if (!mapped) { dropped++; continue; }        // ik_*, socket_*, leaf joints, root: not needed
    const nt = t.clone();
    nt.name = mapped + '.' + prop;
    tracks.push(nt);
    renamed++;
  }
  const out = new THREE.AnimationClip(clip.name, clip.duration, tracks);
  out.ualStats = { renamed, dropped, source: clip.name };
  return out;
}

// Rename the source skeleton's nodes to the same names. Track names alone are not enough:
// src/retarget.js pairs each clip track with the source node of the *same* name to read its
// rest pose, so the scene and the tracks must agree or nothing binds.
export function renameSkeleton(root, alias = UE_TO_MIXAMO) {
  let renamed = 0;
  root.traverse(o => { if (o.name && alias[o.name]) { o.name = alias[o.name]; renamed++; } });
  return renamed;
}

// Load one clip from assets/quaternius/anim and return a source gltf whose scene and animation
// tracks both use Mixamo names, so the standard retargeter binds it like any other clip.
export async function loadUALSource(name) {
  const gltf = await loadGLTF('/assets/quaternius/anim/' + name + '.glb');
  if (!gltf.animations.length) throw new Error('ual: ' + name + ' has no animation');
  const nodesRenamed = renameSkeleton(gltf.scene);
  const clip = toMixamoNames(gltf.animations[0]);
  clip.name = name;
  clip.ualStats.nodesRenamed = nodesRenamed;
  return { scene: gltf.scene, animations: [clip], name };
}

// Back-compat convenience: just the clip.
export async function loadUALClip(name) {
  const src = await loadUALSource(name);
  return src.animations[0];
}

// Load several clips; missing files are reported rather than thrown so a shortlist can be
// probed against what is actually on disk.
export async function loadUALClips(names) {
  const out = new Map();
  const missing = [];
  for (const n of names) {
    try { out.set(n, await loadUALSource(n)); } catch (e) { missing.push(n); }
  }
  return { clips: out, missing };
}

// The CC0 mannequin as a usable actor body: it has no textures and a flat two-material setup,
// so it is restyled into something that can sit in the film's lighting.
export function styleMannequin(root, { body = 0x4a4f57, joints = 0xb0763a } = {}) {
  root.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
    const src = Array.isArray(o.material) ? o.material : [o.material];
    const styled = src.map(m => {
      const isJoint = /joint/i.test(m.name || '');
      return new THREE.MeshStandardMaterial({
        color: isJoint ? joints : body,
        roughness: isJoint ? 0.45 : 0.62,
        metalness: isJoint ? 0.8 : 0.5,
        envMapIntensity: 1.05,
        side: THREE.DoubleSide,
      });
    });
    o.material = styled.length === 1 ? styled[0] : styled;
  });
  return root;
}
