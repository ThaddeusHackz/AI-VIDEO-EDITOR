import React from "react";
import { Composition } from "remotion";
import { TitleCard } from "./TitleCard";
import { ScriptureCard } from "./ScriptureCard";
import { ThaddeusTechzPromo } from "./ThaddeusTechzPromo";
import { Cinematic3DShowcase } from "./Cinematic3DShowcase";
import { VFXCompositorSuite } from "./VFXCompositorSuite";
import { MotionDoctrineReel } from "./MotionDoctrineReel";
import { NLEMasterTimeline } from "./NLEMasterTimeline";
import { HiggsfieldCinemaStudioShowreel } from "./HiggsfieldCinemaStudioShowreel";
import { HiggsfieldEffectsMixLab } from "./HiggsfieldEffectsMixLab";
import { ZackWindowShort, ZACK_WINDOW_META } from "./zack-window/ZackWindowShort";

/**
 * Every <Composition> here becomes a renderable target:
 *   npx remotion render src/index.ts <id> out/<id>.mp4
 * ...or open the Studio with:  npx remotion studio
 *
 * <Composition> is for fixed-length pieces.
 * Use <Still> instead when you only need a single frame (thumbnails).
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 0. Zack-D-Films-style 3D explainer Short (9:16) — data-driven from zack-window/timeline.json */}
      <Composition
        id={ZACK_WINDOW_META.id}
        component={ZackWindowShort}
        durationInFrames={ZACK_WINDOW_META.durationInFrames}
        fps={ZACK_WINDOW_META.fps}
        width={ZACK_WINDOW_META.width}
        height={ZACK_WINDOW_META.height}
      />

      {/* 1. Cinematic 3D Motion Graphics + Higgsfield DoP Camera Showcase */}
      <Composition
        id="Cinematic3D-Showcase"
        component={Cinematic3DShowcase}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 2. Multi-Pass VFX & CGI Compositor Suite (Bullet-Time Shatter, Godrays, Anamorphic Flare) */}
      <Composition
        id="VFX-CGI-Compositor"
        component={VFXCompositorSuite}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 3. Claude Opus 5.5 & GPT-6.1 Sol /ultrahigh Motion Doctrine Showreel */}
      <Composition
        id="MotionDoctrine-Showreel"
        component={MotionDoctrineReel}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 4. Professional NLE Multi-Track Video Editor & Caption Rail/Embed Pipeline */}
      <Composition
        id="NLE-Master-Editor"
        component={NLEMasterTimeline}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 5. Higgsfield Cinema Studio 4.0 + 3D Carousel + Sliding Stack + Physics + 2-Bone IK Character */}
      <Composition
        id="Higgsfield-CinemaStudio-4"
        component={HiggsfieldCinemaStudioShowreel}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 6. Higgsfield Effects Mix Lab (Multi-VFX Stacker: Thunder God + Levitation + Fire + Disintegration) */}
      <Composition
        id="Higgsfield-EffectsMix-Lab"
        component={HiggsfieldEffectsMixLab}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Generic animated title card — prop-driven, so one composition
          renders many different videos. */}
      <Composition
        id="TitleCard"
        component={TitleCard}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          eyebrow: "AI VIDEO EDITS",
          title: "Programmatic video,\nrendered from React",
          subtitle: "Remotion + ffmpeg \u2014 deterministic, frame-exact",
          accent: "#d9a94c",
        }}
      />

      {/* Square variant, same component, different dimensions. */}
      <Composition
        id="TitleCard-Square"
        component={TitleCard}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          eyebrow: "SQUARE",
          title: "One component.\nAny aspect ratio.",
          subtitle: "9:16, 1:1, 16:9 \u2014 just change the props",
          accent: "#cc785c",
        }}
      />

      {/* Scripture card — preserved Remotion starter composition. */}
      <Composition
        id="ScriptureCard"
        component={ScriptureCard}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          reference: "John 14:6",
          lines: [
            "I am the way, the truth, and the life:",
            "no man cometh unto the Father, but by me.",
          ],
          translation: "KJV",
        }}
      />

      {/* Thaddeus Techz channel promo — same animated system, two safe-area-aware layouts. */}
      <Composition
        id="ThaddeusTechz-Landscape"
        component={ThaddeusTechzPromo}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ThaddeusTechz-Shorts"
        component={ThaddeusTechzPromo}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
