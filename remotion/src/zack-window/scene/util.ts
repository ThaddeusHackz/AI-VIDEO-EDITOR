import * as THREE from "three";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 3);
/** 0→1 over [a,b] with smoothstep */
export const smooth = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** linear ramp 0→1 over [a,b] */
export const ramp = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));

/** Deterministic PRNG (mulberry32) so every render is identical. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const _q = new THREE.Quaternion();
const _qInv = new THREE.Quaternion();
const _pos = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _m = new THREE.Matrix4();

/**
 * Rotate `bone` so that its bone axis (direction to `child` in bone-local space)
 * points at `targetWorld`. Minimal-twist rotation relative to the rest orientation.
 */
export const aimBone = (bone: THREE.Object3D, child: THREE.Object3D, targetWorld: THREE.Vector3) => {
  const parent = bone.parent;
  if (!parent) return;
  parent.updateWorldMatrix(true, false);
  bone.updateWorldMatrix(false, false);
  // Parent world rotation (inverse) to bring the world direction into parent space.
  parent.matrixWorld.decompose(_pos, _q, _dir);
  _qInv.copy(_q).invert();
  _pos.setFromMatrixPosition(bone.matrixWorld);
  _dir.copy(targetWorld).sub(_pos);
  if (_dir.lengthSq() < 1e-10) return;
  _dir.normalize().applyQuaternion(_qInv).normalize();
  // Current bone-axis direction expressed in parent space (keeps the roll of the rest pose).
  _axis.copy(child.position).normalize().applyQuaternion(bone.quaternion).normalize();
  _delta.setFromUnitVectors(_axis, _dir);
  bone.quaternion.premultiply(_delta);
  bone.updateMatrix();
  bone.updateWorldMatrix(false, true);
};
const _delta = new THREE.Quaternion();

/**
 * Analytic two-bone IK (upper → lower → end). `pole` is a world-space hint for
 * the elbow/knee direction. Lengths are taken from the rest skeleton.
 */
export const twoBoneIK = (
  upper: THREE.Object3D,
  lower: THREE.Object3D,
  end: THREE.Object3D,
  targetWorld: THREE.Vector3,
  pole: THREE.Vector3,
) => {
  upper.updateWorldMatrix(true, false);
  const scale = new THREE.Vector3();
  upper.matrixWorld.decompose(_pos, _q, scale);
  const l1 = lower.position.length() * scale.y;
  const l2 = end.position.length() * scale.y;
  const S = _pos.clone();
  const toT = targetWorld.clone().sub(S);
  const d = THREE.MathUtils.clamp(toT.length(), 1e-4, (l1 + l2) * 0.999);
  const u = toT.clone().normalize();
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const perp = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u)));
  if (perp.lengthSq() < 1e-8) perp.set(0, -1, 0);
  perp.normalize();
  const E = S.clone().add(u.clone().multiplyScalar(a)).add(perp.multiplyScalar(h));
  aimBone(upper, lower, E);
  aimBone(lower, end, targetWorld);
  void _m;
};

/** Rotate a bone around its local X by `rad` relative to a stored rest quaternion. */
export const curl = (bone: THREE.Object3D, rest: THREE.Quaternion, rad: number, axis: THREE.Vector3 = X_AXIS) => {
  bone.quaternion.copy(rest).multiply(_q.setFromAxisAngle(axis, rad));
};
export const X_AXIS = new THREE.Vector3(1, 0, 0);
export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const Z_AXIS = new THREE.Vector3(0, 0, 1);

/** Rounded-rectangle shape centered at origin (w × h, corner radius r). */
export const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

/** Airliner-window outline: a rounded rect with big radii (close to the 737 shape). */
export const windowShape = (w: number, h: number) => roundedRect(w, h, Math.min(w, h) * 0.42);

export const circlePath = (cx: number, cy: number, r: number) => {
  const p = new THREE.Path();
  p.absarc(cx, cy, r, 0, Math.PI * 2, true);
  return p;
};
