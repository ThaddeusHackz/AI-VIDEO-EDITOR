import * as THREE from "three";
import { FPS, SHOTS, shotAt, type ShotId } from "../timeline";
import { HOLE_LOCAL, HOLE_Y, paneLayout } from "./Window";
import { easeInOut, easeOut, lerp, ramp, smooth } from "./util";

/** World layout (metres). */
export const WIN = new THREE.Vector3(0.62, 1.12, -0.35);   // interior window centre
export const WALL_X = WIN.x - 0.04;                          // sidewall inner surface (flat panel)
export const HOLE = WIN.clone().add(HOLE_LOCAL);            // bleed hole (interior assembly)
export const TOUCH = new THREE.Vector3(0.646, HOLE.y, HOLE.z); // fingertip on the inner pane over the hole
export const HIPS: [number, number, number] = [0.30, 0.56, -0.10];
export const SEAT: [number, number, number] = [0.30, 0, -0.19];
export const SEAT2: [number, number, number] = [-0.22, 0, -0.19];
export const HEAD = new THREE.Vector3(0.30, 1.28, -0.15); // approx. head centre when seated
export const CUT = new THREE.Vector3(0, -20, 0);             // cutaway rig origin
export const CUT_THICK = 3;                                  // pane thickness exaggeration in the cutaway
export const CUT_LAYOUT = paneLayout(CUT_THICK, 0, 0);
export const CUT_HOLE_LOCAL = new THREE.Vector3(CUT_LAYOUT.holeX, HOLE_Y, 0);
export const CUT_HOLE = CUT.clone().add(CUT_HOLE_LOCAL);
export const EXP = new THREE.Vector3(0, -40, 0);             // exploded / crack rig origin
export const CRACK_EXPLODE = 0.35;
export const FAR_OUT = new THREE.Vector3(12, 1.6, -3);       // where he looks when gazing outside
export const PLANE = new THREE.Vector3(0, -90, 0);           // wide-shot airliner rig origin

const sec = (f: number) => f / FPS;

/** Lens: focus sits on the look target (+offset, metres); `range` = depth kept sharp; `bokeh` = blur scale. */
export type Focus = { range: number; bokeh: number; offset: number };
export type CamState = { pos: THREE.Vector3; look: THREE.Vector3; fov: number; focus: Focus };
const WIDE: Focus = { range: 1.6, bokeh: 0, offset: 0 }; // bokeh 0 = lens passes off

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const add = (a: THREE.Vector3, x: number, y: number, z: number) => a.clone().add(V(x, y, z));

type Key = { pos: THREE.Vector3; look: THREE.Vector3; fov: number };
type Move = { from: Key; to: Key; ease?: (t: number) => number; focus?: Focus };
const move = (m: Move, t: number): CamState => {
  const e = (m.ease ?? easeInOut)(t);
  return {
    pos: m.from.pos.clone().lerp(m.to.pos, e),
    look: m.from.look.clone().lerp(m.to.look, e),
    fov: lerp(m.from.fov, m.to.fov, e),
    focus: m.focus ?? WIDE,
  };
};
// Gentle, continuous push-ins (never fully easing to a stop mid-shot reads more "animated").
const drift = (t: number) => t * 0.75 + easeInOut(t) * 0.25;

const CAMS: Record<ShotId, Move> = {
  // Profile from the aisle side: man + window in frame, his finger finds the hole; push in on it.
  hook: {
    from: { pos: V(-1.38, 1.42, -0.34), look: V(0.40, 1.06, -0.27), fov: 50 },
    to:   { pos: V(-0.05, 1.09, -0.27), look: V(0.645, 0.975, -0.35), fov: 30 },
    ease: drift,
    focus: WIDE,
  },
  holeMacro: {
    from: { pos: add(HOLE, -0.115, 0.034, 0.024), look: add(HOLE, 0, -0.010, 0), fov: 28 },
    to:   { pos: add(HOLE, -0.085, 0.026, 0.018), look: add(HOLE, 0, -0.008, 0), fov: 26 },
    ease: drift,
    focus: { range: 0.03, bokeh: 2.2, offset: 0 },
  },
  face: {
    // Rocketbox head: eyes ≈ y 1.35, face swings towards +x while he looks at the hole
    from: { pos: V(0.54, 1.33, -0.96), look: add(HEAD, 0.05, 0.03, -0.05), fov: 34 },
    to:   { pos: V(0.54, 1.32, -0.86), look: add(HEAD, 0.05, 0.03, -0.05), fov: 32 },
    ease: drift,
    focus: { range: 0.22, bokeh: 1.6, offset: -0.07 },
  },
  // The airliner alone in the void, seen from below and ahead (we are very high up); slow orbit + push.
  planeWide: {
    from: { pos: add(PLANE, 46, -50.5, 34.5), look: add(PLANE, -2.5, -0.5, 1.6), fov: 46 },
    to:   { pos: add(PLANE, 43.5, -48.5, 36.5), look: add(PLANE, -1.0, -0.5, 1.3), fov: 44 },
    ease: drift,
    focus: WIDE,
  },
  // Outside, low and aft: the fuselage curves up into the void, then a push-in to his window at eye level.
  exterior: {
    from: { pos: V(3.3, 0.25, -1.8), look: V(0.80, 1.08, -0.45), fov: 44 },
    to:   { pos: V(2.15, 1.10, -0.70), look: add(WIN, 0.1, 0, 0), fov: 28 },
    ease: drift,
    focus: WIDE,
  },
  cutaway: {
    from: { pos: add(CUT, -0.70, 0.46, 1.50), look: add(CUT, 0.02, -0.07, 0.0), fov: 30 },
    to:   { pos: add(CUT, -0.50, 0.32, 1.12), look: add(CUT, 0.05, -0.08, 0.0), fov: 28 },
    ease: drift,
    focus: { range: 0.55, bokeh: 1.2, offset: 0 },
  },
  exploded: {
    from: { pos: add(EXP, -0.66, 0.30, 1.42), look: add(EXP, -0.02, 0.0, 0.0), fov: 34 },
    to:   { pos: add(EXP, -0.54, 0.27, 1.28), look: add(EXP, -0.02, 0.0, 0.0), fov: 32 },
    ease: drift,
    focus: { range: 0.7, bokeh: 1.0, offset: 0 },
  },
  crack: {
    from: { pos: add(EXP, 0.80, 0.20, 1.08), look: add(EXP, 0.14, -0.02, 0.0), fov: 30 },
    to:   { pos: add(EXP, 0.68, 0.17, 0.92), look: add(EXP, 0.14, -0.02, 0.0), fov: 28 },
    ease: drift,
    focus: { range: 0.5, bokeh: 1.2, offset: 0 },
  },
  bleed: {
    from: { pos: add(CUT_HOLE, -0.105, 0.046, 0.100), look: add(CUT_HOLE, 0.006, -0.002, 0.0), fov: 30 },
    to:   { pos: add(CUT_HOLE, -0.080, 0.036, 0.078), look: add(CUT_HOLE, 0.006, -0.002, 0.0), fov: 28 },
    ease: drift,
    focus: { range: 0.045, bokeh: 2.2, offset: 0 },
  },
  outro: {
    from: { pos: V(-1.18, 1.38, -0.30), look: V(0.42, 1.07, -0.26), fov: 47 },
    to:   { pos: V(-0.88, 1.31, -0.32), look: V(0.46, 1.07, -0.28), fov: 42 },
    ease: drift,
    focus: WIDE,
  },
};

export const cameraAt = (frame: number): CamState => {
  const sh = shotAt(frame);
  return move(CAMS[sh.id], sh.t);
};

export type SceneState = {
  shot: ShotId;
  interiorVisible: boolean;
  cutawayVisible: boolean;
  explodedVisible: boolean;
  reach: number;
  look: THREE.Vector3;
  arrows: number;
  gapArrows: number;
  explode: number;
  expYaw: number;
  bow: number;
  middleGlow: number;
  crack: number;
  flow: number;
  fogInterior: number;
  smile: number;
  /** middle-pane opacity in the interior rig (raised for the hole macro) */
  middleOpacity: number;
  /** camera is outside the aircraft: hide the flat cabin pieces that poke through the curved skin */
  exteriorView: boolean;
  planeVisible: boolean;
  /** airliner roll (radians) in the wide shot */
  planeRoll: number;
};

export const sceneAt = (frame: number): SceneState => {
  const t = sec(frame);
  const sh = shotAt(frame).id;
  const inInterior = sh === "hook" || sh === "holeMacro" || sh === "face" || sh === "exterior" || sh === "outro";
  const inCut = sh === "cutaway" || sh === "bleed";
  const inExp = sh === "exploded" || sh === "crack";

  // Right arm: comes up during the hook, touches the hole ~3.4 s, lets go before the macro.
  let reach = 0;
  if (t < sec(SHOTS.face.to)) {
    reach = smooth(t, 1.35, 3.45) * (1 - smooth(t, 5.25, 6.05));
  }
  // Gaze: at the hole while pointing; out of the window otherwise.
  let look = FAR_OUT.clone();
  if (sh === "hook" || sh === "holeMacro") look = TOUCH.clone().lerp(FAR_OUT, 1 - smooth(t, 0.9, 1.9));
  if (sh === "face") look = TOUCH.clone().add(V(0, 0.02, 0)).lerp(V(0.9, 1.25, -0.6), smooth(t, 9.2, 10.2));
  if (sh === "exterior") look = FAR_OUT.clone().lerp(V(1.4, 1.25, -0.45), 0.5);
  if (sh === "outro") look = V(1.6, 1.3, -0.45).lerp(FAR_OUT, smooth(t, 39.2, 40.6));

  const arrows = sh === "cutaway" ? smooth(t, sec(SHOTS.cutaway.from) + 0.3, sec(SHOTS.cutaway.from) + 2.8) : 0;
  const gapArrows = sh === "crack" ? smooth(t, 25.8, 27.4) : 0;
  const explode = sh === "exploded" ? easeInOut(ramp(t, 21.6, 23.9)) : sh === "crack" ? CRACK_EXPLODE : 0;
  const expYaw = sh === "exploded" ? -0.75 + Math.sin(t * 0.5) * 0.08 : -0.12;
  const bow = sh === "crack" ? smooth(t, 26.0, 28.0) : 0;
  const middleGlow = sh === "crack" ? smooth(t, 28.8, 29.8) * (1 - smooth(t, 31.0, 32.3)) : 0;
  const crack = sh === "crack" ? easeOut(ramp(t, 30.6, 31.8)) : 0;
  const flow = sh === "bleed" ? smooth(t, 32.75, 33.7) : 0;
  // Interior fog: a thin haze on the gap clears away in the outro ("never fogs up").
  const fogInterior = sh === "outro" ? 0.9 * (1 - smooth(t, 38.9, 40.6)) : 0;
  const smile = sh === "face" ? 0.18 : 0.1;
  const middleOpacity = sh === "holeMacro" ? 0.42 : 0.13;

  return {
    shot: sh,
    interiorVisible: inInterior,
    cutawayVisible: inCut,
    explodedVisible: inExp,
    reach,
    look,
    arrows,
    gapArrows,
    explode,
    expYaw,
    bow,
    middleGlow,
    crack,
    flow,
    fogInterior,
    smile,
    middleOpacity,
    exteriorView: sh === "exterior",
    planeVisible: sh === "planeWide",
    planeRoll: 0.08 + 0.015 * Math.sin(t * 0.9),
  };
};
