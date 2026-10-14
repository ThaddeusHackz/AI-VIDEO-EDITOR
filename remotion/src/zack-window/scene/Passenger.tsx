import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { perfFlags } from "./materials";
import { staticFile } from "remotion";
import { useThree } from "@react-three/fiber";
import { useGLB } from "./useGLB";
import { aimBone, twoBoneIK, curl, X_AXIS, Y_AXIS, Z_AXIS, clamp01, easeInOut } from "./util";

export type PassengerPose = {
  /** 0 = hands on lap, 1 = right index finger on the bleed hole */
  reach: number;
  /** world-space point the right index finger should touch when reach = 1 */
  touch: THREE.Vector3;
  /** world-space look target */
  look: THREE.Vector3;
  /** frame counter for idle motion */
  frame: number;
  /** 0..1 blink amount is unavailable on this rig; mouthSmile used for a neutral-pleasant face */
  smile?: number;
};

type Props = {
  /** world position of the hips joint when seated */
  hips: [number, number, number];
  /** yaw (radians) of the whole body; Math.PI = facing -z */
  yaw?: number;
  pose: PassengerPose;
};

const FORWARD = new THREE.Vector3(0, 0, -1); // world forward for yaw = PI
const RIGHT = new THREE.Vector3(1, 0, 0);

/**
 * Ready-Player-Me style passenger (three.js example asset) posed procedurally:
 * seated, hands on lap, head/eyes tracking a target, right arm IK to the window.
 */
export const Passenger: React.FC<Props> = ({ hips, yaw = Math.PI, pose }) => {
  const gltf = useGLB(staticFile("zack-window/models/passenger.glb"));
  const root = useRef<THREE.Group>(null);
  const advance = useThree((s) => s.advance);
  const drawnOnce = useRef(false);

  const rig = useMemo(() => {
    if (!gltf) return null;
    const scene = gltf.scene;
    const bones = new Map<string, THREE.Object3D>();
    const rest = new Map<THREE.Object3D, THREE.Quaternion>();
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone || o.type === "Bone") {
        bones.set(o.name, o);
        rest.set(o, o.quaternion.clone());
      }
      if (o.name === "Wolf3D_Headwear" || o.name === "Mesh") o.visible = false; // no cowboy hat
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        let m = mesh.material as THREE.MeshStandardMaterial;
        if (m && m.isMeshStandardMaterial && perfFlags().lambert) {
          // cheap shading path: keep the albedo/normal maps, drop PBR specular
          const l = new THREE.MeshLambertMaterial({ map: m.map ?? undefined, color: m.color, normalMap: m.normalMap ?? undefined, side: m.side, transparent: m.transparent, opacity: m.opacity, alphaTest: m.alphaTest });
          mesh.material = l;
          m = l as unknown as THREE.MeshStandardMaterial;
        }
        if (m && (m.isMeshStandardMaterial || (m as unknown as THREE.MeshLambertMaterial).isMeshLambertMaterial)) {
          m.envMapIntensity = 0.6;
          if (o.name === "Wolf3D_Head" || o.name === "Wolf3D_Body") {
            m.roughness = 0.62;
          }
        }
      }
    });
    const b = (n: string) => bones.get(n)!;
    const headMesh = scene.getObjectByName("Wolf3D_Head") as THREE.Mesh | undefined;
    const morphMeshes = ["Wolf3D_Avatar", "Wolf3D_Head", "Wolf3D_Teeth", "Wolf3D_Beard", "EyeLeft", "EyeRight"]
      .map((n) => scene.getObjectByName(n) as THREE.Mesh | undefined)
      .filter(Boolean) as THREE.Mesh[];
    return { scene, bones, rest, b, headMesh, morphMeshes };
  }, [gltf]);

  useLayoutEffect(() => {
    if (!rig || !root.current) return;
    const { rest, b, morphMeshes } = rig;
    // 1. reset
    rest.forEach((q, bone) => bone.quaternion.copy(q));
    const grp = root.current;
    grp.updateWorldMatrix(true, true);

    const hipsB = b("Hips");
    const spine = b("Spine"), spine1 = b("Spine1"), spine2 = b("Spine2"), neck = b("Neck"), head = b("Head");
    const r = clamp01(pose.reach);
    const rr = easeInOut(r);
    const f = pose.frame;

    // 2. torso: seated upright, breathe, lean a little toward the window while reaching
    spine.rotateX(-0.05 + 0.012 * Math.sin(f * 0.085));
    spine1.rotateZ(0.16 * rr);          // lean to his right (towards the window)
    spine1.rotateY(-0.22 * rr);         // turn torso towards the window
    spine2.rotateX(0.02 + 0.01 * Math.sin(f * 0.085 + 0.4));
    hipsB.rotateX(0.04);
    grp.updateWorldMatrix(true, true);

    // 3. legs: seated, knees forward (world -z), feet on the floor
    const legs: Array<["Left" | "Right", number]> = [["Left", -0.03], ["Right", 0.035]];
    for (const [side, spreadX] of legs) {
      const up = b(`${side}UpLeg`), lo = b(`${side}Leg`), ft = b(`${side}Foot`), toe = b(`${side}ToeBase`);
      const hipW = new THREE.Vector3();
      up.getWorldPosition(hipW);
      const knee = hipW.clone().add(FORWARD.clone().multiplyScalar(0.43)).add(new THREE.Vector3(spreadX, -0.05, 0));
      aimBone(up, lo, knee);
      const kneeW = new THREE.Vector3();
      lo.getWorldPosition(kneeW);
      const ankle = kneeW.clone().add(new THREE.Vector3(spreadX * 0.6, -0.42, -0.06));
      aimBone(lo, ft, ankle);
      const ankleW = new THREE.Vector3();
      ft.getWorldPosition(ankleW);
      aimBone(ft, toe, ankleW.clone().add(new THREE.Vector3(0, -0.07, -0.13)));
    }

    // 4. arms
    const shoulderW = (side: "Left" | "Right") => {
      const v = new THREE.Vector3();
      b(`${side}Arm`).getWorldPosition(v);
      return v;
    };
    const thighTop = (side: "Left" | "Right") => {
      const v = new THREE.Vector3();
      b(`${side}UpLeg`).getWorldPosition(v);
      return v.add(FORWARD.clone().multiplyScalar(0.27)).add(new THREE.Vector3(side === "Left" ? -0.03 : 0.03, 0.09, 0));
    };
    // left: resting on the lap
    {
      const target = thighTop("Left");
      twoBoneIK(b("LeftArm"), b("LeftForeArm"), b("LeftHand"), target, new THREE.Vector3(-0.7, -0.6, 0.5));
      aimBone(b("LeftHand"), b("LeftHandMiddle1"), target.clone().add(new THREE.Vector3(0.02, -0.04, -0.16)));
      for (const fn of ["Index", "Middle", "Ring", "Pinky"]) {
        for (let k = 1; k <= 3; k++) curl(b(`LeftHand${fn}${k}`), rest.get(b(`LeftHand${fn}${k}`))!, 0.35, X_AXIS);
      }
      curl(b("LeftHandThumb2"), rest.get(b("LeftHandThumb2"))!, 0.2, X_AXIS);
    }
    // right: lap → pointing at the hole
    {
      const S = shoulderW("Right");
      const restT = thighTop("Right");
      const toHole = pose.touch.clone().sub(S).normalize();
      const wristReach = pose.touch.clone().sub(toHole.clone().multiplyScalar(0.175)).add(new THREE.Vector3(0, 0.012, 0));
      const target = restT.clone().lerp(wristReach, rr);
      // the elbow drops and swings out a little as the arm comes up
      const pole = new THREE.Vector3(0.75, -0.55 - 0.3 * rr, 0.35);
      twoBoneIK(b("RightArm"), b("RightForeArm"), b("RightHand"), target, pole);
      const handAim = restT.clone().add(new THREE.Vector3(-0.02, -0.04, -0.16)).lerp(pose.touch.clone(), rr);
      aimBone(b("RightHand"), b("RightHandMiddle1"), handAim);
      const pointCurl = 0.35 + 1.0 * rr; // other fingers fold in as he points
      for (const fn of ["Middle", "Ring", "Pinky"]) {
        curl(b(`RightHand${fn}1`), rest.get(b(`RightHand${fn}1`))!, pointCurl, X_AXIS);
        curl(b(`RightHand${fn}2`), rest.get(b(`RightHand${fn}2`))!, pointCurl * 1.15, X_AXIS);
        curl(b(`RightHand${fn}3`), rest.get(b(`RightHand${fn}3`))!, pointCurl * 0.8, X_AXIS);
      }
      curl(b("RightHandIndex1"), rest.get(b("RightHandIndex1"))!, 0.35 * (1 - rr) - 0.08 * rr, X_AXIS);
      curl(b("RightHandIndex2"), rest.get(b("RightHandIndex2"))!, 0.3 * (1 - rr), X_AXIS);
      curl(b("RightHandThumb2"), rest.get(b("RightHandThumb2"))!, 0.25 + 0.3 * rr, X_AXIS);
    }

    // 5. head + eyes: look at the target (yaw/pitch split neck/head), small idle sway
    {
      const P = new THREE.Vector3();
      head.getWorldPosition(P);
      const d = pose.look.clone().sub(P).normalize();
      // into body space (yaw of the group)
      const inv = new THREE.Quaternion().setFromAxisAngle(Y_AXIS, -yaw);
      d.applyQuaternion(inv);
      const yawA = THREE.MathUtils.clamp(Math.atan2(d.x, d.z), -1.1, 1.1);
      const pitchA = THREE.MathUtils.clamp(Math.atan2(d.y, Math.hypot(d.x, d.z)), -0.75, 0.6);
      neck.rotateY(yawA * 0.35);
      neck.rotateX(-pitchA * 0.3); // local +X rotation tips the head forward, so pitch is negated
      head.rotateY(yawA * 0.65 + 0.012 * Math.sin(f * 0.05 + 1.3));
      head.rotateX(-pitchA * 0.7 + 0.008 * Math.sin(f * 0.07));
      head.rotateZ(0.01 * Math.sin(f * 0.04 + 2.0));
      for (const e of ["LeftEye", "RightEye"]) {
        const eye = rig.bones.get(e);
        if (eye) {
          eye.rotateY(yawA * 0.12);
          eye.rotateX(-pitchA * 0.12);
        }
      }
    }

    // 6. face
    for (const m of morphMeshes) {
      const dict = m.morphTargetDictionary;
      const inf = m.morphTargetInfluences;
      if (!dict || !inf) continue;
      const smile = pose.smile ?? 0.12;
      if (dict.mouthSmile !== undefined) inf[dict.mouthSmile] = smile;
      if (dict.mouthOpen !== undefined) inf[dict.mouthOpen] = 0.0;
      if (dict.mouthSmileLeft !== undefined) inf[dict.mouthSmileLeft] = smile * 0.9;
      if (dict.mouthSmileRight !== undefined) inf[dict.mouthSmileRight] = smile * 0.8;
      // blink: a 7-frame close/open every ~108 frames, offset so it never lands on a cut
      const cyc = (f + 37) % 108;
      const blink = cyc < 7 ? Math.sin((cyc / 7) * Math.PI) : 0;
      if (dict.eyeBlinkLeft !== undefined) inf[dict.eyeBlinkLeft] = blink;
      if (dict.eyeBlinkRight !== undefined) inf[dict.eyeBlinkRight] = blink;
      // mild interest while he looks at the hole
      const brow = 0.25 * (pose.reach ?? 0);
      if (dict.browInnerUp !== undefined) inf[dict.browInnerUp] = brow;
      if (dict.browOuterUpLeft !== undefined) inf[dict.browOuterUpLeft] = brow * 0.6;
      if (dict.browOuterUpRight !== undefined) inf[dict.browOuterUpRight] = brow * 0.6;
    }

    grp.updateWorldMatrix(true, true);
    // The render-mode frameloop is "never": force one draw when the model first appears,
    // otherwise the canvas keeps showing the frame captured before the GLB arrived.
    if (!drawnOnce.current) {
      drawnOnce.current = true;
      advance(performance.now());
    }
    void Z_AXIS;
    void RIGHT;
  }, [rig, pose.reach, pose.frame, pose.touch, pose.look, pose.smile, yaw, advance]);

  if (!rig) return null;
  // Hips bone sits 1.019 m above the armature origin in this asset.
  return (
    <group ref={root} position={[hips[0], hips[1] - 1.0192, hips[2]]} rotation={[0, yaw, 0]}>
      <primitive object={rig.scene} />
    </group>
  );
};
