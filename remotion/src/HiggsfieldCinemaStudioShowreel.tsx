import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  AgamemnonBreakthrough,
  AnimatedCharacterRig,
  CinemaStudio4Stage,
  CylindricalIconCarousel3D,
  PhysicsBouncingSphere3D,
  PlasmaLightningCGI,
  PortalVortexCGI,
  SlidingPhotoStack3D,
} from "./engine";

const CAROUSEL_ITEMS = [
  { id: "hf", label: "HyperFrames", sublabel: "GSAP + THREE.JS", glyph: "HF", accent: "#35D9F2" },
  { id: "rm", label: "Remotion 4.0", sublabel: "REACT + 3D + SHADERS", glyph: "RM", accent: "#C5F75A" },
  { id: "dop", label: "Higgsfield DoP", sublabel: "CINEMA STUDIO 4.0", glyph: "DoP", accent: "#FFB23F" },
  { id: "rea", label: "Morluto REA", sublabel: "REVERSE ENGINEER", glyph: "REA", accent: "#427EFF" },
  { id: "vfx", label: "CGI & Shaders", sublabel: "PORTAL + SHATTER", glyph: "VFX", accent: "#FF5E7E" },
  { id: "nle", label: "NLE Pro Studio", sublabel: "PARAKEET ASR + LUT", glyph: "NLE", accent: "#35D9F2" },
];

const STACK_CARDS = [
  { tag: "ENGINE 01 // CLAUDE OPUS 5.5", title: "3D Cylindrical Carousel", metric: "60 FPS LOCK", accent: "#35D9F2" },
  { tag: "ENGINE 02 // GPT-6.1 SOL", title: "Portal & Plasma CGI", metric: "ZERO RNG", accent: "#C5F75A" },
  { tag: "ENGINE 03 // HIGGSFIELD 4.0", title: "25 DoP Camera Rigs", metric: "ANAMORPHIC", accent: "#FFB23F" },
];

/**
 * HIGGSFIELD CINEMA STUDIO 4.0 + OPUS 5.5 SHOWREEL (`Higgsfield-CinemaStudio-4`)
 * 300 frames (10.0s @ 30fps, 1920x1080):
 * - Act 1 (0..100): 3D Cylindrical Rotating Icon Carousel + Portal Vortex CGI
 * - Act 2 (100..200): Sliding 3D Photo Stack + 3D Physics Bouncing Sphere + Plasma Lightning
 * - Act 3 (200..300): Agamemnon Screen Breakthrough + 2-Bone IK Lip-Synced Character Presenter
 */
export const HiggsfieldCinemaStudioShowreel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <CinemaStudio4Stage
      genre="Epic"
      era="2020s"
      tempo="Dynamic"
      palette="Teal & Orange"
      lighting="Contre-jour"
      cameraBody="35mm Film"
      lens="Anamorphic"
      aperture="f/1.4"
    >
      <AbsoluteFill style={{ backgroundColor: "#050912" }}>
        {/* ACT 1 (0..100): 3D Cylindrical Carousel + Portal Vortex CGI */}
        {frame < 100 && (
          <AbsoluteFill>
            <PortalVortexCGI xPercent={50} yPercent={52} radius={260} openFrame={4} color="#FFB23F" />
            <CylindricalIconCarousel3D items={CAROUSEL_ITEMS} radius={470} rotationSpeed={0.032} />
            <div
              style={{
                position: "absolute",
                top: 118,
                left: 96,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 15,
                color: "#C5F75A",
                letterSpacing: "0.2em",
              }}
            >
              ACT 01 // 3D CYLINDRICAL CAROUSEL + PORTAL VORTEX CGI
            </div>
          </AbsoluteFill>
        )}

        {/* ACT 2 (100..200): Sliding 3D Stack + Physics Bouncing Sphere + Plasma Lightning */}
        {frame >= 100 && frame < 200 && (
          <AbsoluteFill>
            <PlasmaLightningCGI x1={180} y1={240} x2={1740} y2={820} color="#35D9F2" branches={3} />
            <div style={{ position: "absolute", left: 140, top: 290 }}>
              <SlidingPhotoStack3D cards={STACK_CARDS} cycleIntervalFrames={32} />
            </div>
            <div style={{ position: "absolute", left: 320, top: 0, right: 0, bottom: 0 }}>
              <PhysicsBouncingSphere3D bouncePeriodFrames={36} floorY={780} jumpHeight={310} color="#C5F75A" />
            </div>
            <div
              style={{
                position: "absolute",
                top: 118,
                left: 96,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 15,
                color: "#35D9F2",
                letterSpacing: "0.2em",
              }}
            >
              ACT 02 // 3D SLIDING STACK + SQUASH-STRETCH PHYSICS + PLASMA CGI
            </div>
          </AbsoluteFill>
        )}

        {/* ACT 3 (200..300): Agamemnon Breakthrough + 2-Bone IK Lip-Synced Character Rig */}
        {frame >= 200 && (
          <AbsoluteFill>
            <AgamemnonBreakthrough triggerFrame={204}>
              <div
                style={{
                  width: 1120,
                  height: 540,
                  borderRadius: 28,
                  background: "rgba(9, 16, 30, 0.92)",
                  border: "2px solid #C5F75A",
                  boxShadow: "0 40px 110px rgba(0,0,0,0.75)",
                  padding: "48px 58px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ maxWidth: 580 }}>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 14,
                      color: "#C5F75A",
                      letterSpacing: "0.2em",
                    }}
                  >
                    ACT 03 // AGAMEMNON BREAKTHROUGH + 2-BONE IK VISEME RIG
                  </div>
                  <div
                    style={{
                      fontFamily: "Space Grotesk, sans-serif",
                      fontSize: 64,
                      fontWeight: 700,
                      color: "#F3F7F7",
                      lineHeight: 0.98,
                      marginTop: 16,
                    }}
                  >
                    Higgsfield Cinema Studio 4.0 + Character IK.
                  </div>
                </div>
              </div>
            </AgamemnonBreakthrough>
            <AnimatedCharacterRig
              x={1320}
              y={565}
              scale={0.95}
              gesture="wave"
              speechText="All systems ready for Opus and GPT"
              speechStartFrame={206}
              accentColor="#35D9F2"
            />
          </AbsoluteFill>
        )}
      </AbsoluteFill>
    </CinemaStudio4Stage>
  );
};
