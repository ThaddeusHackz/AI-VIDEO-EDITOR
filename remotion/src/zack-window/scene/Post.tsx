import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import {
  BlendFunction,
  BloomEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { cameraAt } from "./direction";
import { perfFlags } from "./materials";

/*
 * Render look: the scene is drawn into a linear HalfFloat buffer (MSAA), then
 *   depth of field  → macro shots get a real lens (his close-ups are shallow),
 *   bloom           → the bright acrylic edges / fracture faces glow a touch,
 *   ACES tone map   → same curve + exposure the materials were tuned under,
 *   void composite  → "the emptiness" (the cyan radial gradient) is laid under the
 *                     premultiplied scene AFTER tone mapping, so its colours are exact,
 *   vignette        → the slight edge darkening of his renders.
 *
 * The composite lives here instead of a CSS backdrop because every blur-type effect
 * needs the background inside the GL frame; a transparent canvas would blur to black.
 */

const VOID_STOPS: Array<[number, string]> = [
  [0.0, "#dff3fd"],
  [0.3, "#b3e0f8"],
  [0.62, "#74c3ee"],
  [1.0, "#3f9fdc"],
];

const voidFrag = /* glsl */ `
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2; uniform vec3 c3;
uniform vec2 centre; uniform vec2 radii; uniform vec3 stops;

vec3 srgbEotf(vec3 c) {
  vec3 lo = c / 12.92;
  vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
  return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.04045))));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 d = (uv - centre) / radii;
  float r = length(d);
  vec3 s;
  if (r < stops.x) s = mix(c0, c1, r / stops.x);
  else if (r < stops.y) s = mix(c1, c2, (r - stops.x) / (stops.y - stops.x));
  else s = mix(c2, c3, clamp((r - stops.y) / (stops.z - stops.y), 0.0, 1.0));
  // a hair of blue noise keeps the 8-bit gradient from banding
  float n = fract(sin(dot(uv * 1000.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  vec3 bg = srgbEotf(clamp(s + n * (1.5 / 255.0), 0.0, 1.0));
  // the scene buffer is premultiplied by coverage (cleared to transparent black)
  outputColor = vec4(bg * (1.0 - inputColor.a) + inputColor.rgb, 1.0);
}
`;

class VoidEffect extends Effect {
  constructor() {
    const srgb = (hex: string) => {
      const c = new THREE.Color();
      c.setStyle(hex, THREE.NoColorSpace); // keep the raw sRGB triplet; the shader converts
      return new THREE.Vector3(c.r, c.g, c.b);
    };
    super("VoidEffect", voidFrag, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ["c0", new THREE.Uniform(srgb(VOID_STOPS[0][1]))],
        ["c1", new THREE.Uniform(srgb(VOID_STOPS[1][1]))],
        ["c2", new THREE.Uniform(srgb(VOID_STOPS[2][1]))],
        ["c3", new THREE.Uniform(srgb(VOID_STOPS[3][1]))],
        ["centre", new THREE.Uniform(new THREE.Vector2(0.5, 0.56))],
        ["radii", new THREE.Uniform(new THREE.Vector2(0.7, 0.55))],
        ["stops", new THREE.Uniform(new THREE.Vector3(VOID_STOPS[1][0], VOID_STOPS[2][0], VOID_STOPS[3][0]))],
      ]),
    });
  }
}

export const Post: React.FC = () => {
  const { gl, scene, camera, size, viewport } = useThree();
  const frame = useCurrentFrame();
  const enabled = perfFlags().post !== false;

  const rig = useMemo(() => {
    if (!enabled) return null;
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: perfFlags().msaa ?? 4 });
    const dof = new DepthOfFieldEffect(camera, { focusDistance: 1, focusRange: 1, bokehScale: 1, resolutionScale: 0.5 });
    const bloom = new BloomEffect({ intensity: 0.22, luminanceThreshold: 0.88, luminanceSmoothing: 0.2, mipmapBlur: true, radius: 0.7, levels: 6 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    const voidFx = new VoidEffect();
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.36 });
    const dofPass = new EffectPass(camera, dof);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(dofPass);
    composer.addPass(new EffectPass(camera, bloom));
    composer.addPass(new EffectPass(camera, tone, voidFx, vignette));
    return { composer, dof, dofPass };
  }, [enabled, gl, scene, camera]);

  useLayoutEffect(() => {
    if (!rig) return;
    // drawing-buffer size = CSS size × dpr; the composer applies the renderer's pixel ratio itself
    rig.composer.setSize(size.width, size.height, false);
  }, [rig, size.width, size.height, viewport.dpr]);

  useLayoutEffect(() => {
    if (!rig) return;
    const c = cameraAt(frame);
    // CameraRig (a sibling rendered before us) has just set near/far/fov for this frame;
    // the CoC pass keeps its own copy of them, so refresh it or the depth linearisation is off.
    (rig.dof.cocMaterial as unknown as { copyCameraSettings: (c: THREE.Camera) => void }).copyCameraSettings(camera); // typings still name it adoptCameraSettings
    rig.dof.cocMaterial.focusDistance = c.pos.distanceTo(c.look) + c.focus.offset;
    rig.dof.cocMaterial.focusRange = c.focus.range;
    rig.dof.bokehScale = c.focus.bokeh;
    // wide shots (bokeh 0) skip the lens passes entirely: they are the heaviest frames and the blur would be invisible
    rig.dofPass.enabled = c.focus.bokeh > 0;
  }, [rig, frame, camera]);

  useLayoutEffect(() => {
    if (!rig) return;
    return () => rig.composer.dispose();
  }, [rig]);

  useFrame((_, delta) => {
    if (rig) rig.composer.render(delta);
  }, rig ? 1 : 0);

  return null;
};
