import * as THREE from "three";
import { getInputProps } from "remotion";

export type PerfFlags = { aa?: boolean; shadows?: boolean; lambert?: boolean; pbrMatte?: boolean; dpr?: number };
export const perfFlags = (): PerfFlags => ((getInputProps() as { perf?: PerfFlags }).perf ?? {});

/** Cheap matte material (Lambert) or PBR depending on perf flags. */
export const matte = (opts: { color: string; roughness?: number; envMapIntensity?: number; side?: THREE.Side }, clip?: Clip) => {
  // SwiftShader is pixel-bound: large matte areas (wall, seats) use Lambert unless perf.pbrMatte is set.
  const f = perfFlags();
  const mat = f.pbrMatte
    ? new THREE.MeshStandardMaterial({
        color: opts.color,
        roughness: opts.roughness ?? 0.6,
        metalness: 0,
        envMapIntensity: opts.envMapIntensity ?? 0.5,
        side: opts.side ?? THREE.FrontSide,
      })
    : new THREE.MeshLambertMaterial({ color: opts.color, side: opts.side ?? THREE.FrontSide });
  return withClip(mat, clip);
};

/**
 * Material palette for the "clean 3D" look: slightly glossy plastics, soft fabric,
 * clear acrylic. Everything reacts to the RoomEnvironment env-map for studio gloss.
 */
export type Clip = THREE.Plane[] | undefined;

const withClip = <T extends THREE.Material>(m: T, clip: Clip): T => {
  if (clip && clip.length) {
    m.clippingPlanes = clip;
    m.clipShadows = true;
  }
  return m;
};

export const acrylic = (clip?: Clip, tint = "#eef8ff", opacity = 0.13, side: THREE.Side = THREE.FrontSide) =>
  withClip(
    new THREE.MeshStandardMaterial({
      color: tint,
      transparent: true,
      opacity,
      roughness: 0.06,
      metalness: 0.05,
      envMapIntensity: 1.5,
      side,
      depthWrite: false,
    }),
    clip,
  );

export const plasticWhite = (clip?: Clip) =>
  matte({ color: "#f1f2f4", roughness: 0.38, envMapIntensity: 0.7, side: THREE.DoubleSide }, clip);

export const wallBeige = (clip?: Clip) =>
  matte({ color: "#e9ebee", roughness: 0.6, envMapIntensity: 0.5, side: THREE.DoubleSide }, clip);

export const frameDark = (clip?: Clip) =>
  withClip(
    new THREE.MeshStandardMaterial({
      color: "#8d939c",
      roughness: 0.45,
      metalness: 0.3,
      envMapIntensity: 0.9,
      side: THREE.DoubleSide,
    }),
    clip,
  );

export const insulation = (clip?: Clip) =>
  withClip(
    new THREE.MeshStandardMaterial({
      color: "#d9dde3",
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    clip,
  );

/** Airliner livery: glossy white paint over the aluminium skin. */
export const aluminum = (clip?: Clip) =>
  withClip(
    new THREE.MeshStandardMaterial({
      color: "#f3f5f7",
      roughness: 0.22,
      metalness: 0.1,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide,
    }),
    clip,
  );

export const fabricBlue = () =>
  new THREE.MeshStandardMaterial({ color: "#27416e", roughness: 0.92, metalness: 0 });
export const fabricDark = () =>
  new THREE.MeshStandardMaterial({ color: "#1b2a46", roughness: 0.95, metalness: 0 });
export const plasticGrey = () => matte({ color: "#9aa0a8", roughness: 0.4 });

export const arrowRed = () =>
  new THREE.MeshStandardMaterial({ color: "#e8392f", roughness: 0.28, metalness: 0.05, envMapIntensity: 1.2 });

export const arrowBlue = () =>
  new THREE.MeshStandardMaterial({ color: "#2f8fe8", roughness: 0.28, metalness: 0.05, envMapIntensity: 1.2 });

export const airParticle = () =>
  new THREE.MeshStandardMaterial({
    color: "#f4fdff",
    emissive: "#8fe3ff",
    emissiveIntensity: 0.7,
    roughness: 0.3,
    transparent: true,
    opacity: 0.95,
  });
