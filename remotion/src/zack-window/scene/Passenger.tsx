import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getInputProps, staticFile } from "remotion";
import { useThree } from "@react-three/fiber";
import { useFBX } from "./useFBX";
import { aimBone, twoBoneIK, clamp01, easeInOut } from "./util";

export type PassengerPose = {
  /** 0 = hands on lap, 1 = right index finger on the bleed hole */
  reach: number;
  /** world-space point the right index finger should touch when reach = 1 */
  touch: THREE.Vector3;
  /** world-space look target */
  look: THREE.Vector3;
  /** frame counter for idle motion */
  frame: number;
  /** smile amount (ARKit MouthSmile) */
  smile?: number;
};

type Props = {
  /** world position of the pelvis joint when seated */
  hips: [number, number, number];
  /** yaw (radians) of the whole body; Math.PI = facing -z */
  yaw?: number;
  pose: PassengerPose;
};

/*
 * Microsoft Rocketbox "Male_Adult_06" (MIT): a semi-realistic scanned-texture human (wavy brown
 * hair, henley recoloured white, jeans) on a 3ds-Max Biped rig with the full ARKit blendshape set.
 * The FBX ships in centimetres, faces +z, pelvis 0.90 m up, A-pose. Everything is posed
 * procedurally per frame in WORLD space (rotations about world axes), so nothing here depends on
 * the rig's local bone axes.
 */
const MODEL = "zack-window/models/rb/male_adult_06_facial.fbx";
const TEX_DIR = "zack-window/models/rb/";
const TEX_PREFIX = "m011";
const TEXTURES: Record<string, string> = Object.fromEntries(
  ["body_color", "head_color", "body_normal", "head_normal", "body_specular", "head_specular"]
    .map((n) => [`${TEX_PREFIX}_${n}.tga`, staticFile(`${TEX_DIR}${TEX_PREFIX}_${n}.jpg`)])
    .concat([[`${TEX_PREFIX}_opacity_color.tga`, staticFile(`${TEX_DIR}${TEX_PREFIX}_opacity_color.png`)]]),
);
/** maps the FBX does not know about: skin-vs-hair roughness for the head */
const EXTRA_TEXTURES: Record<string, string> = {
  headRough: staticFile(`${TEX_DIR}${TEX_PREFIX}_head_rough.jpg`),
};
const SCALE = 0.01;
const PELVIS_Y = 0.9;

const MORPH = {
  blinkL: "blendShape1.AK_09_EyeBlinkLeft",
  blinkR: "blendShape1.AK_10_EyeBlinkRight",
  smileL: "blendShape1.AK_44_MouthSmileLeft",
  smileR: "blendShape1.AK_45_MouthSmileRight",
  browIn: "blendShape1.AK_03_BrowInnerUp",
  browL: "blendShape1.AK_04_BrowOuterUpLeft",
  browR: "blendShape1.AK_05_BrowOuterUpRight",
  squintL: "blendShape1.AK_19_EyeSquintLeft",
  squintR: "blendShape1.AK_20_EyeSquintRight",
};

const UP = new THREE.Vector3(0, 1, 0);
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _qp = new THREE.Quaternion();
const _r = new THREE.Quaternion();

/** Rotate `bone` about a WORLD axis through its own origin: q' = Qp⁻¹ · R · Qp · q. */
const rotWorld = (bone: THREE.Object3D, axisWorld: THREE.Vector3, angle: number) => {
  if (Math.abs(angle) < 1e-9 || !bone.parent) return;
  bone.parent.updateWorldMatrix(true, false);
  bone.parent.matrixWorld.decompose(_p, _qp, _s);
  _r.setFromAxisAngle(axisWorld, angle);
  const x = _qp.clone().invert().multiply(_r).multiply(_qp);
  bone.quaternion.premultiply(x);
  bone.updateMatrix();
  bone.updateWorldMatrix(false, true);
};

const wpos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

export const Passenger: React.FC<Props> = ({ hips, yaw = Math.PI, pose }) => {
  const fbx = useFBX(staticFile(MODEL), TEXTURES, EXTRA_TEXTURES);
  const root = useRef<THREE.Group>(null);
  const advance = useThree((s) => s.advance);
  const drawnOnce = useRef(false);

  const rig = useMemo(() => {
    if (!fbx) return null;
    // debug toggles: ZW_PROPS='{"dbg":{"noHair":1,"noMorph":1,"noShadow":1}}'
    const dbg = ((getInputProps() as { dbg?: Record<string, unknown> }).dbg ?? {}) as Record<string, unknown>;
    const scene = fbx;
    const bones = new Map<string, THREE.Object3D>();
    const rest = new Map<THREE.Object3D, THREE.Quaternion>();
    let face: THREE.Mesh | null = null;
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) {
        bones.set(o.name, o);
        rest.set(o, o.quaternion.clone());
      }
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = !dbg.noShadow;
        mesh.receiveShadow = !dbg.noShadow;
        mesh.frustumCulled = false;
        // materials: FBXLoader gives Phong; rebuild as PBR with the scanned colour + normal maps
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.MeshPhongMaterial[];
        const rebuilt = mats.map((m) => {
          const isHair = /opacity/i.test(m.name);
          const isHead = /head/i.test(m.name);
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          const headRough = (scene.userData.textures as Record<string, THREE.Texture> | undefined)?.headRough;
          const std = new THREE.MeshStandardMaterial({
            name: m.name,
            map: m.map ?? undefined,
            normalMap: isHair ? undefined : m.normalMap ?? undefined,
            normalScale: new THREE.Vector2(0.7, 0.7),
            // head: skin ≈0.56 / baked hair ≈0.86 via the roughness map (kills the glossy "cap" on the crown)
            roughnessMap: isHead ? headRough : undefined,
            roughness: isHead ? (headRough ? 1 : 0.6) : isHair ? 0.75 : 0.82,
            metalness: 0,
            envMapIntensity: /head/i.test(m.name) ? 0.55 : 0.4,
            // hair / lashes / brows are alpha-cut cards: keep the PNG alpha, drop the (black) alphaMap
            transparent: isHair,
            alphaTest: isHair ? 0.3 : 0,
            alphaToCoverage: isHair,
            depthWrite: true,
            side: isHair ? THREE.DoubleSide : THREE.FrontSide,
          });
          if (isHair && dbg.noHair) std.visible = false;
          if (!isHair && dbg.hideBody) std.visible = false;
          return std;
        });
        mesh.material = rebuilt.length === 1 ? rebuilt[0] : rebuilt;
        // a few hair-card vertices ship with zero-length normals -> NaN lighting -> bloom smears a
        // black rectangle over the frame. Replace them with their triangle's face normal.
        const nrmAttr = mesh.geometry.attributes.normal as THREE.BufferAttribute;
        const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
        const tri = new THREE.Triangle();
        const fn = new THREE.Vector3();
        for (let i = 0; i < nrmAttr.count; i++) {
          if (Math.hypot(nrmAttr.getX(i), nrmAttr.getY(i), nrmAttr.getZ(i)) > 1e-6) continue;
          const t0 = i - (i % 3);
          tri.a.fromBufferAttribute(posAttr, t0);
          tri.b.fromBufferAttribute(posAttr, t0 + 1);
          tri.c.fromBufferAttribute(posAttr, t0 + 2);
          tri.getNormal(fn);
          if (fn.lengthSq() < 1e-12) fn.set(0, 0, 1);
          nrmAttr.setXYZ(i, fn.x, fn.y, fn.z);
        }
        nrmAttr.needsUpdate = true;
        // keep only the morphs we drive (175 targets would cost 175 texture taps per vertex)
        if (mesh.morphTargetDictionary && mesh.geometry.morphAttributes.position && !dbg.noMorph) {
          const dict = mesh.morphTargetDictionary;
          const pos = mesh.geometry.morphAttributes.position;
          const nrm = mesh.geometry.morphAttributes.normal;
          const keep = Object.values(MORPH).map((n) => dict[n]).filter((i) => i !== undefined);
          mesh.geometry.morphAttributes.position = keep.map((i) => pos[i]);
          if (nrm) mesh.geometry.morphAttributes.normal = keep.map((i) => nrm[i]);
          mesh.updateMorphTargets();
          face = mesh;
        }
        // Hair / lash / brow cards: move them to their own SkinnedMesh so they neither cast nor
        // receive shadows (thin self-shadowed cards read as a dark cap over the baked hair).
        const skinned = mesh as THREE.SkinnedMesh;
        const hairIdx = rebuilt.findIndex((m) => /opacity/i.test(m.name));
        if (skinned.isSkinnedMesh && hairIdx >= 0 && rebuilt.length > 1 && !dbg.noHair) {
          const hairMat = rebuilt[hairIdx];
          const hairGeo = mesh.geometry.clone();
          hairGeo.clearGroups();
          for (const g of mesh.geometry.groups) {
            if (g.materialIndex === hairIdx) hairGeo.addGroup(g.start, g.count, 0);
          }
          // (material must be an array, otherwise three ignores the groups and draws everything)
          const hair = new THREE.SkinnedMesh(hairGeo, [hairMat]);
          hair.name = "hair-cards";
          hair.position.copy(mesh.position);
          hair.quaternion.copy(mesh.quaternion);
          hair.scale.copy(mesh.scale);
          hair.bindMode = skinned.bindMode;
          hair.bind(skinned.skeleton, skinned.bindMatrix);
          hair.morphTargetInfluences = skinned.morphTargetInfluences;
          hair.morphTargetDictionary = skinned.morphTargetDictionary;
          hair.castShadow = false;
          hair.receiveShadow = false;
          hair.frustumCulled = false;
          hair.renderOrder = 2;
          hairMat.color.setScalar(1.45); // lift the unlit-looking strands towards the baked hair tone
          mesh.parent?.add(hair);
          // body mesh keeps its geometry; the hair group is skipped because its material is invisible
          const bodyHairMat = hairMat.clone();
          bodyHairMat.visible = false;
          rebuilt[hairIdx] = bodyHairMat;
          mesh.material = rebuilt;
        }
      }
    });
    const b = (n: string) => {
      const bone = bones.get(n);
      if (!bone) throw new Error(`Passenger rig: missing bone ${n}`);
      return bone;
    };
    return { scene, bones, rest, b, face: face as THREE.Mesh | null };
  }, [fbx]);

  useLayoutEffect(() => {
    if (!rig || !root.current) return;
    const { rest, b } = rig;
    rest.forEach((q, bone) => bone.quaternion.copy(q));
    const grp = root.current;
    grp.updateWorldMatrix(true, true);

    // character axes in world space (model: +z forward, +x = his left)
    const fwdW = new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, yaw);
    const leftW = new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, yaw);
    const r = clamp01(pose.reach);
    const rr = easeInOut(r);
    const f = pose.frame;

    const pelvis = b("Bip01_Pelvis");
    const spine = b("Bip01_Spine"), spine1 = b("Bip01_Spine1"), spine2 = b("Bip01_Spine2");
    const neck = b("Bip01_Neck"), head = b("Bip01_Head");

    // 1. torso: seated, slightly reclined, breathing; leans/turns towards the window while reaching
    rotWorld(pelvis, leftW, 0.03);
    rotWorld(spine, leftW, -0.04 + 0.012 * Math.sin(f * 0.085));
    rotWorld(spine1, fwdW, 0.16 * rr);   // tilt to his right (window side)
    rotWorld(spine1, UP, -0.22 * rr);    // turn towards the window
    rotWorld(spine2, leftW, 0.02 + 0.01 * Math.sin(f * 0.085 + 0.4));

    // 2. head + eyes: yaw/pitch split neck/head, small idle sway.
    //    NOTE: in this Biped rig the clavicles hang off Bip01_Neck, so the neck must be posed
    //    BEFORE the arm IK (and only carries a small share of the turn so the shoulders stay put).
    {
      const P = wpos(head);
      const d = pose.look.clone().sub(P).normalize().applyAxisAngle(UP, -yaw); // into model space (+z fwd)
      const yawA = THREE.MathUtils.clamp(Math.atan2(d.x, d.z), -1.1, 1.1);
      const pitchA = THREE.MathUtils.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.75, 0.6);
      const sway = 0.012 * Math.sin(f * 0.05 + 1.3);
      const nod = 0.008 * Math.sin(f * 0.07);
      const lateralAfterYaw = leftW.clone().applyAxisAngle(UP, yawA);
      rotWorld(neck, UP, yawA * 0.18);
      rotWorld(neck, lateralAfterYaw, -pitchA * 0.2);
      rotWorld(head, UP, yawA * 0.82 + sway);
      rotWorld(head, lateralAfterYaw, -(pitchA * 0.8 + nod));
      rotWorld(head, fwdW, 0.01 * Math.sin(f * 0.04 + 2.0));
      for (const e of ["Bip01_LEye", "Bip01_REye"]) {
        const eye = rig.bones.get(e);
        if (!eye) continue;
        rotWorld(eye, UP, yawA * 0.12);
        rotWorld(eye, lateralAfterYaw, -pitchA * 0.12);
      }
    }

    // 3. legs: knees forward (world -fwd is behind him, so knees go along fwdW), feet on the floor
    for (const [side, spreadX] of [["L", -0.03], ["R", 0.035]] as Array<["L" | "R", number]>) {
      const up = b(`Bip01_${side}_Thigh`), lo = b(`Bip01_${side}_Calf`), ft = b(`Bip01_${side}_Foot`), toe = b(`Bip01_${side}_Toe0`);
      const hipW = wpos(up);
      const knee = hipW.clone().addScaledVector(fwdW, 0.43).add(new THREE.Vector3(spreadX, -0.05, 0));
      aimBone(up, lo, knee);
      const ankle = wpos(lo).add(new THREE.Vector3(spreadX * 0.6, -0.42, 0)).addScaledVector(fwdW, 0.06);
      aimBone(lo, ft, ankle);
      aimBone(ft, toe, wpos(ft).add(new THREE.Vector3(0, -0.07, 0)).addScaledVector(fwdW, 0.13));
    }

    // 4. arms
    const thighTop = (side: "L" | "R") =>
      wpos(b(`Bip01_${side}_Thigh`)).addScaledVector(fwdW, 0.27).add(new THREE.Vector3(side === "L" ? -0.03 : 0.03, 0.09, 0));
    const hand = (side: "L" | "R") => ({
      upper: b(`Bip01_${side}_UpperArm`), fore: b(`Bip01_${side}_Forearm`), hand: b(`Bip01_${side}_Hand`),
      thumb: [b(`Bip01_${side}_Finger0`), b(`Bip01_${side}_Finger01`), b(`Bip01_${side}_Finger02`)],
      index: [b(`Bip01_${side}_Finger1`), b(`Bip01_${side}_Finger11`), b(`Bip01_${side}_Finger12`)],
      middle: [b(`Bip01_${side}_Finger2`), b(`Bip01_${side}_Finger21`), b(`Bip01_${side}_Finger22`)],
      ring: [b(`Bip01_${side}_Finger3`), b(`Bip01_${side}_Finger31`), b(`Bip01_${side}_Finger32`)],
      pinky: [b(`Bip01_${side}_Finger4`), b(`Bip01_${side}_Finger41`), b(`Bip01_${side}_Finger42`)],
    });
    /** Palm frame from the posed hand: axis that bends the fingers towards the palm. */
    const curlAxis = (h: ReturnType<typeof hand>) => {
      const H = wpos(h.hand);
      const fdir = wpos(h.middle[0]).sub(H).normalize();
      const lat = wpos(h.index[0]).sub(wpos(h.pinky[0]));
      lat.addScaledVector(fdir, -lat.dot(fdir)).normalize();
      const palm = new THREE.Vector3().crossVectors(fdir, lat).normalize();
      const thumbOff = wpos(h.thumb[0]).sub(H);
      thumbOff.addScaledVector(fdir, -thumbOff.dot(fdir));
      if (palm.dot(thumbOff) < 0) palm.negate(); // the thumb sits on the palm side
      return new THREE.Vector3().crossVectors(fdir, palm).normalize();
    };
    const curlMul = Number((getInputProps() as { dbg?: { curl?: number } }).dbg?.curl ?? 1);
    const curlFinger = (seg: THREE.Object3D[], axis: THREE.Vector3, a0: number, a1: number, a2: number) => {
      rotWorld(seg[0], axis, a0 * curlMul);
      rotWorld(seg[1], axis, a1 * curlMul);
      rotWorld(seg[2], axis, a2 * curlMul);
    };
    // left: resting on the lap
    {
      const h = hand("L");
      const target = thighTop("L");
      twoBoneIK(h.upper, h.fore, h.hand, target, new THREE.Vector3(-0.7, -0.6, 0.5));
      aimBone(h.hand, h.middle[0], target.clone().add(new THREE.Vector3(0.02, -0.04, 0)).addScaledVector(fwdW, 0.16));
      const ax = curlAxis(h);
      for (const fg of [h.index, h.middle, h.ring, h.pinky]) curlFinger(fg, ax, 0.3, 0.4, 0.3);
      curlFinger(h.thumb, ax, 0.1, 0.2, 0.15);
    }
    // right: lap → pointing at the hole
    {
      const h = hand("R");
      const S = wpos(h.upper);
      const restT = thighTop("R");
      // wrist sits in the cabin below/behind the hole so the straight index finger (≈18 cm from the
      // wrist pivot) comes up at the touch point from below - readable from the aisle-side camera
      const wristReach = pose.touch.clone().add(new THREE.Vector3(-0.075, -0.105, 0.115));
      const target = restT.clone().lerp(wristReach, rr);
      // elbow hangs down and slightly back/aisle-wards (never out through the wall at +x)
      const pole = new THREE.Vector3(0.2 - 0.45 * rr, -1, 0.25 * rr);
      twoBoneIK(h.upper, h.fore, h.hand, target, pole);
      const handAim = restT.clone().add(new THREE.Vector3(-0.02, -0.04, 0)).addScaledVector(fwdW, 0.16).lerp(pose.touch.clone(), rr);
      aimBone(h.hand, h.middle[0], handAim);
      const ax = curlAxis(h);
      const c = 0.3 + 0.9 * rr; // other fingers fold in as he points
      for (const fg of [h.middle, h.ring, h.pinky]) curlFinger(fg, ax, c, c * 1.15, c * 0.8);
      curlFinger(h.index, ax, 0.3 * (1 - rr) - 0.05 * rr, 0.35 * (1 - rr), 0.2 * (1 - rr));
      curlFinger(h.thumb, ax, 0.1 + 0.2 * rr, 0.2 + 0.25 * rr, 0.15);
      if ((getInputProps() as { dbg?: { log?: boolean } }).dbg?.log) {
        const fmt = (v: THREE.Vector3) => v.toArray().map((n) => n.toFixed(3)).join(",");
        const tip = wpos(h.index[2]).add(wpos(h.index[2]).sub(wpos(h.index[1])));
        console.warn(
          `[passenger f${f} rr=${rr.toFixed(2)}] S=${fmt(S)} E=${fmt(wpos(h.fore))} W=${fmt(wpos(h.hand))} ` +
            `tip≈${fmt(tip)} target=${fmt(target)} touch=${fmt(pose.touch)} l1=${(h.fore.position.length() * 0.01).toFixed(3)}`,
        );
        // where does the SKIN of the index tip actually end up?
        const sm = rig.face as THREE.SkinnedMesh | null;
        if (sm && sm.isSkinnedMesh) {
          const bi = sm.skeleton.bones.indexOf(h.index[2] as THREE.Bone);
          const si = sm.geometry.attributes.skinIndex, sw = sm.geometry.attributes.skinWeight;
          let best = -1, bw = 0;
          for (let i = 0; i < si.count; i++) {
            for (let k = 0; k < 4; k++) {
              if (si.getComponent(i, k) === bi && sw.getComponent(i, k) > bw) { bw = sw.getComponent(i, k); best = i; }
            }
          }
          if (best >= 0) {
            // manual LBS straight to world space (bindMatrixInverse may be stale on the first frame)
            const v = new THREE.Vector3().fromBufferAttribute(sm.geometry.attributes.position as THREE.BufferAttribute, best).applyMatrix4(sm.bindMatrix);
            const acc = new THREE.Vector3();
            const tmp = new THREE.Vector3();
            const bm = new THREE.Matrix4();
            for (let k = 0; k < 4; k++) {
              const w = sw.getComponent(best, k);
              if (w === 0) continue;
              const idx = si.getComponent(best, k);
              sm.skeleton.bones[idx].updateWorldMatrix(true, false);
              bm.multiplyMatrices(sm.skeleton.bones[idx].matrixWorld, sm.skeleton.boneInverses[idx]);
              acc.addScaledVector(tmp.copy(v).applyMatrix4(bm), w);
            }
            v.copy(acc);
            console.warn(`[passenger] skin vertex ${best} (w=${bw.toFixed(2)} on ${h.index[2].name}) world=${fmt(v)} boneIdx=${bi} bones=${sm.skeleton.bones.length}`);
          } else console.warn(`[passenger] no vertex bound to ${h.index[2].name} (boneIdx ${bi})`);
        }
      }
    }

    // 5. face (ARKit shapes)
    if (rig.face && rig.face.morphTargetDictionary && rig.face.morphTargetInfluences) {
      const dict = rig.face.morphTargetDictionary;
      const inf = rig.face.morphTargetInfluences;
      const set = (key: keyof typeof MORPH, v: number) => {
        const i = dict[MORPH[key]];
        if (i !== undefined) inf[i] = v;
      };
      const smile = pose.smile ?? 0.12;
      set("smileL", smile * 0.9);
      set("smileR", smile * 0.8);
      set("squintL", smile * 0.35);
      set("squintR", smile * 0.35);
      // blink: a 7-frame close/open every ~108 frames, offset so it never lands on a cut
      const cyc = (f + 37) % 108;
      const blink = cyc < 7 ? Math.sin((cyc / 7) * Math.PI) : 0;
      set("blinkL", blink);
      set("blinkR", blink);
      // mild interest while he looks at the hole
      const brow = 0.3 * r;
      set("browIn", brow);
      set("browL", brow * 0.6);
      set("browR", brow * 0.6);
    }

    grp.updateWorldMatrix(true, true);
    // debug markers: ZW_PROPS='{"dbg":{"markers":1}}' -> red = wrist bone, green = index tip bone, blue = touch
    if ((getInputProps() as { dbg?: { markers?: boolean } }).dbg?.markers) {
      const sceneRoot = grp.parent;
      if (sceneRoot) {
        let mk = sceneRoot.getObjectByName("zw-markers") as THREE.Group | undefined;
        if (!mk) {
          mk = new THREE.Group();
          mk.name = "zw-markers";
          for (const c of [0xff0000, 0x00ff00, 0x0000ff]) {
            mk.add(new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: c })));
          }
          sceneRoot.add(mk);
        }
        const h = hand("R");
        mk.children[0].position.copy(wpos(h.hand));
        mk.children[1].position.copy(wpos(h.index[2]));
        mk.children[2].position.copy(pose.touch);
        const fmt = (v: THREE.Vector3) => v.toArray().map((n) => n.toFixed(3)).join(",");
        console.warn(`[markers] wrist=${fmt(wpos(h.hand))} tip=${fmt(wpos(h.index[2]))} touch=${fmt(pose.touch)} grpParent=${sceneRoot.type}/${sceneRoot.name} mkWorld=${fmt(mk.children[0].getWorldPosition(new THREE.Vector3()))}`);
      }
    }
    // The render-mode frameloop is "never": force one draw when the model first appears.
    if (!drawnOnce.current) {
      drawnOnce.current = true;
      advance(performance.now());
    }
  }, [rig, pose.reach, pose.frame, pose.touch, pose.look, pose.smile, yaw, advance]);

  if (!rig) return null;
  return (
    <group ref={root} position={[hips[0], hips[1] - PELVIS_Y, hips[2]]} rotation={[0, yaw, 0]} scale={SCALE}>
      <primitive object={rig.scene} />
    </group>
  );
};
