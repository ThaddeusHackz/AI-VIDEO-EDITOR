import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  CameraRigContainer,
  HiggsfieldEffectsMix,
  HiggsfieldOfficialMix,
  resolveHiggsfieldMix,
  useCameraRig,
} from "./engine";

const MIX_SEQUENCE: { mix: HiggsfieldOfficialMix; start: number; end: number; cam: "orbit-360" | "crash-zoom" | "dolly-zoom" }[] = [
  { mix: "Thunder God + Levitation", start: 0, end: 80, cam: "orbit-360" },
  { mix: "Flying + Set On Fire", start: 80, end: 160, cam: "crash-zoom" },
  { mix: "Building Explosion + Disintegration", start: 160, end: 240, cam: "dolly-zoom" },
];

/**
 * HIGGSFIELD EFFECTS MIX LAB (`Higgsfield-EffectsMix-Lab`) — 240 frames (8.0s @ 30fps)
 * Demonstrates stacking multiple cinematic VFX presets + Camera DoP motion in a single shot.
 */
export const HiggsfieldEffectsMixLab: React.FC = () => {
  const frame = useCurrentFrame();

  const currentSlot =
    MIX_SEQUENCE.find((s) => frame >= s.start && frame < s.end) || MIX_SEQUENCE[0];
  const activeEffects = resolveHiggsfieldMix(currentSlot.mix);

  const rig = useCameraRig({
    preset: currentSlot.cam,
    startFrame: currentSlot.start,
    durationInFrames: currentSlot.end - currentSlot.start,
    intensity: 0.85,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#050811" }}>
      <CameraRigContainer rig={rig}>
        <HiggsfieldEffectsMix
          effects={[...activeEffects, "Northern Lights", "Clone Explosion"]}
          triggerFrame={currentSlot.start}
          intensity={1}
        >
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <div
              style={{
                width: 860,
                padding: "48px 56px",
                borderRadius: 28,
                background: "rgba(10, 18, 34, 0.92)",
                border: "2px solid rgba(53, 217, 242, 0.65)",
                boxShadow: "0 36px 96px rgba(0,0,0,0.75)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#C5F75A",
                  letterSpacing: "0.22em",
                }}
              >
                HIGGSFIELD EFFECTS MIX // MULTI-VFX STACKING
              </div>
              <div
                style={{
                  fontFamily: "Space Grotesk, sans-serif",
                  fontSize: 64,
                  fontWeight: 700,
                  color: "#F3F7F7",
                  marginTop: 16,
                  lineHeight: 1.0,
                }}
              >
                {currentSlot.mix}
              </div>
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 16,
                  color: "#35D9F2",
                  marginTop: 22,
                  letterSpacing: "0.14em",
                }}
              >
                CAMERA DOP: {currentSlot.cam.toUpperCase()} + CLONE EXPLOSION + NORTHERN LIGHTS
              </div>
            </div>
          </AbsoluteFill>
        </HiggsfieldEffectsMix>
      </CameraRigContainer>
    </AbsoluteFill>
  );
};
