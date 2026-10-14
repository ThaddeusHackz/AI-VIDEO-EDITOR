import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { getInputProps, useCurrentFrame } from "remotion";
import { shotAt } from "../timeline";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FogSheet, Panes, WindowAssembly, paneLayout } from "./Window";
import { CrackedPane } from "./Crack";
import { perfFlags } from "./materials";
import { AirFlow, Arrow, PressureField, Seat } from "./Props";
import { Fuselage, OverheadBin, SeatBelt, WallTrim } from "./Cabin";
import { Passenger } from "./Passenger";
import { Post } from "./Post";
import { Airliner } from "./Airliner";
import {
  CRACK_EXPLODE, CUT, CUT_HOLE_LOCAL, CUT_LAYOUT, CUT_THICK, EXP, HIPS, PLANE, SEAT, SEAT2, TOUCH, WALL_X, WIN, cameraAt, sceneAt,
} from "./direction";

/** Studio-ish environment reflections + renderer flags (shadows, clipping, tone mapping). */
const Setup: React.FC = () => {
  const { gl, scene, advance } = useThree();
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
    gl.shadowMap.enabled = perfFlags().shadows !== false;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping; // applied by the post stack (ToneMappingEffect reads the exposure)
    gl.toneMappingExposure = 1.08;
    gl.setClearColor(0x000000, 0); // premultiplied-by-coverage scene buffer; the void is composited in post
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.85;
    advance(performance.now());
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, advance]);
  return null;
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  useLayoutEffect(() => {
    let c = cameraAt(frame);
    // Debug override: --props='{"cam":{"pos":[x,y,z],"look":[x,y,z],"fov":40}}'
    const dbg = (getInputProps() as { cam?: { pos: number[]; look: number[]; fov?: number } }).cam;
    if (dbg) {
      c = { ...c, pos: new THREE.Vector3(...(dbg.pos as [number, number, number])), look: new THREE.Vector3(...(dbg.look as [number, number, number])), fov: dbg.fov ?? c.fov };
    }
    const cam = camera as THREE.PerspectiveCamera;
    cam.position.copy(c.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(c.look);
    cam.fov = c.fov;
    // macro work needs a tiny near plane; the 80 m airliner needs the opposite (and the depth precision)
    const wide = shotAt(frame).id === "planeWide";
    cam.near = wide ? 1.5 : 0.006;
    cam.far = wide ? 400 : 80;
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
  }, [frame, camera]);
  return null;
};

const KeyLight: React.FC<{ position: [number, number, number]; target: [number, number, number]; intensity: number; size?: number; color?: string; near?: number; far?: number }> = ({
  position, target, intensity, size = 1.6, color = "#fff7ee", near = 0.2, far = 12,
}) => {
  const light = useRef<THREE.DirectionalLight>(null);
  const tgt = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    tgt.position.set(...target);
    tgt.updateMatrixWorld();
    if (light.current) {
      light.current.target = tgt;
      const cam = light.current.shadow.camera;
      cam.left = -size; cam.right = size; cam.top = size; cam.bottom = -size;
      cam.near = near; cam.far = far;
      cam.updateProjectionMatrix();
    }
  }, [tgt, target, size, near, far]);
  return (
    <>
      <directionalLight
        ref={light}
        position={position}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-radius={3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <primitive object={tgt} />
    </>
  );
};

/* ───────────── Interior world: wall + window + seats + passenger ───────────── */
const Interior: React.FC<{ visible: boolean; reach: number; look: THREE.Vector3; frame: number; fog: number; smile: number; middleOpacity: number; exteriorView: boolean }> = ({
  visible, reach, look, frame, fog, smile, middleOpacity, exteriorView,
}) => {
  const pose = useMemo(() => ({ reach, touch: TOUCH, look, frame, smile }), [reach, look, frame, smile]);
  const lay = paneLayout(1, 0, 0);
  return (
    <group visible={visible}>
      <KeyLight position={[-1.3, 3.4, 0.9]} target={[0.45, 1.0, -0.3]} intensity={1.6} size={1.8} />
      {/* soft daylight spill from the window side (no shadows: the wall would block it) */}
      <directionalLight position={[4, 1.6, -1.2]} intensity={1.1} color="#dcefff" />
      <directionalLight position={[-2, 1.2, -3]} intensity={0.5} color="#ffffff" />
      <group position={WIN.toArray() as [number, number, number]}>
        <WindowAssembly interior wall={!exteriorView} exterior={false} structure shade middleOpacity={middleOpacity} />
        <FogSheet amount={fog} x={lay.gapX} />
      </group>
      {/* outside: window belt with the neighbouring windows + curved skin above/below */}
      <Fuselage win={WIN} />
      {/* cabin slice (flat pieces that would poke through the curved skin from outside): bin + PSU, dado trim, floor */}
      <group visible={!exteriorView}>
        <OverheadBin wallX={WALL_X} z={WIN.z} />
        <WallTrim wallX={WALL_X} z={WIN.z} />
        {/* floor shadow catcher + carpet */}
        <mesh position={[0.1, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[2.4, 2.4]} />
          <meshLambertMaterial color="#5e6b85" />
        </mesh>
      </group>
      <Seat position={SEAT} />
      <Seat position={SEAT2} />
      <Passenger hips={HIPS} pose={pose} />
      <SeatBelt hips={HIPS} />
    </group>
  );
};

/* ───────────── Cutaway rig: the wall sectioned at z = +3 cm, panes 3× thicker for legibility ───────────── */
const Cutaway: React.FC<{ visible: boolean; arrows: number; flow: number; frame: number }> = ({ visible, arrows, flow, frame }) => {
  const clip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 0, -1), CUT.z + 0.03)], []);
  return (
    <group visible={visible} position={CUT.toArray() as [number, number, number]}>
      <KeyLight position={[-1.4, 2.4, 2.4]} target={[0, 0, 0]} intensity={2.3} size={1.3} />
      <directionalLight position={[2.5, 1.0, 1.5]} intensity={0.9} color="#dcefff" />
      <WindowAssembly interior exterior={false} structure clip={clip} thick={CUT_THICK} frameDepth={2.6} opacity={0.2} middleOpacity={0.38} side={THREE.DoubleSide} />
      {/* cabin air pushing on the window */}
      <PressureField drive={arrows} pulse={frame} x={0.0} rows={4} cols={1} spread={[0.0, 0.30]} len={0.19} r={0.014} stagger={0.1} />
      <AirFlow hole={CUT_HOLE_LOCAL} t={frame} amount={flow} count={160} size={0.00045} reach={0.045} cone={0.012} fan={0.02} exitX={CUT_LAYOUT.gap / 2 + CUT_LAYOUT.tm / 2} gapSpread={CUT_LAYOUT.gap * 0.35} />
    </group>
  );
};

/* ───────────── Exploded rig (void): three panes; also hosts the crack beat ───────────── */
const Exploded: React.FC<{ visible: boolean; explode: number; yaw: number; bow: number; middleGlow: number; crack: number; gapArrows: number; frame: number }> = ({
  visible, explode, yaw, bow, middleGlow, crack, gapArrows, frame,
}) => {
  const lay = paneLayout(1, explode, bow);
  const gapTail = lay.xm + lay.tm + 0.006;
  const gapLen = Math.max(0.01, lay.xo - gapTail - 0.004);
  const isCrack = Math.abs(explode - CRACK_EXPLODE) < 1e-6;
  return (
    <group visible={visible} position={EXP.toArray() as [number, number, number]}>
      <KeyLight position={[-1.2, 2.4, 2.2]} target={[0, 0, 0]} intensity={2.0} size={1.0} />
      <directionalLight position={[2.5, 1.0, 1.5]} intensity={0.9} color="#dcefff" />
      <group rotation={[0, yaw, 0]} position={[-0.06 - 0.08 * explode, 0, 0]}>
        <Panes explode={explode} bow={bow} middleGlow={middleGlow} tint="#eaf7ff" opacity={0.22} side={THREE.DoubleSide} outerVisible={!isCrack} />
        {isCrack && <CrackedPane progress={crack} x={lay.xo} bow={bow} tint="#eaf7ff" opacity={0.22} side={THREE.DoubleSide} />}
        <group visible={gapArrows > 0.001}>
          {[-0.13, -0.065, 0.0, 0.065, 0.13].map((y, i) => (
            <Arrow key={i} len={gapLen} r={0.007} position={[gapTail + 0.004 * Math.sin(frame * 0.25 + i), y, 0.0]} scale={gapArrows} />
          ))}
        </group>
      </group>
    </group>
  );
};

/* ───────────── Wide shot: the airliner alone in the void ───────────── */
const PlaneWide: React.FC<{ visible: boolean; roll: number }> = ({ visible, roll }) => (
  <group visible={visible} position={PLANE.toArray() as [number, number, number]}>
    {/* sun high and ahead-right; a soft bounce from below so the belly (which faces us) stays bright */}
    <KeyLight position={[30, 60, -40]} target={[0, 0, 0]} intensity={2.2} size={30} near={20} far={160} />
    <directionalLight position={[20, -40, 30]} intensity={0.4} color="#eaf4ff" />
    <Airliner roll={roll} />
  </group>
);

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const st = useMemo(() => sceneAt(frame), [frame]);
  return (
    <>
      <Setup />
      <CameraRig />
      <Post />
      <hemisphereLight args={["#d9efff", "#ffffff", 1.5]} />
      <Interior visible={st.interiorVisible} reach={st.reach} look={st.look} frame={frame} fog={st.fogInterior} smile={st.smile} middleOpacity={st.middleOpacity} exteriorView={st.exteriorView} />
      <PlaneWide visible={st.planeVisible} roll={st.planeRoll} />
      <Cutaway visible={st.cutawayVisible} arrows={st.arrows} flow={st.flow} frame={frame} />
      <Exploded
        visible={st.explodedVisible}
        explode={st.explode}
        yaw={st.expYaw}
        bow={st.bow}
        middleGlow={st.middleGlow}
        crack={st.crack}
        gapArrows={st.gapArrows}
        frame={frame}
      />
    </>
  );
};
