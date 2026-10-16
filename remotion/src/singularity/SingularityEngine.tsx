import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { AnamorphicFlare } from "../engine/vfxShaders";
import { Grade } from "./components/Stage";
import { SeamScene } from "./components/Seam";
import { CUTS, P, SHOTS, ShotId } from "./data";
import { S1VoidSlice } from "./scenes/S1VoidSlice";
import { S2SolarRing } from "./scenes/S2SolarRing";
import { S3MacroDive } from "./scenes/S3MacroDive";
import { S4OpusManifest } from "./scenes/S4OpusManifest";
import { S5SilkRibbons } from "./scenes/S5SilkRibbons";
import { S6SolarSurge } from "./scenes/S6SolarSurge";
import { S7SplitCollision } from "./scenes/S7SplitCollision";
import { S8GlyphDive } from "./scenes/S8GlyphDive";
import { S9Monolith } from "./scenes/S9Monolith";
import { S10Lockup } from "./scenes/S10Lockup";
import { S11Signature } from "./scenes/S11Signature";

/**
 * CLAUDE OPUS 5.5 vs. GPT ASTRA 6.1 SOL — THE SINGULARITY ENGINE
 * 30.000 s · 60 fps · 1800 frames. One component tree for the 16:9 master and the 9:16 companion.
 * Shots, cuts, schedules and VO timings come from timeline.json / vo-words.json (the same data drives the sound).
 */
const SCENES: Record<ShotId, React.FC> = {
  S1: S1VoidSlice,
  S2: S2SolarRing,
  S3: S3MacroDive,
  S4: S4OpusManifest,
  S5: S5SilkRibbons,
  S6: S6SolarSurge,
  S7: S7SplitCollision,
  S8: S8GlyphDive,
  S9: S9Monolith,
  S10: S10Lockup,
  S11: S11Signature,
};

/** Cut accent (engine AnamorphicFlare): peaks ON the cut frame with the impact SFX, decays over ~0.2 s. */
const ASTRA_SHOTS = new Set(["S6", "S7", "S8"]);
const CutAccents: React.FC = () => {
  const frame = useCurrentFrame();
  const cut = CUTS.find((c) => c.seam !== "match-cut" && c.seam !== "hard-cut-to-black" && Math.abs(frame - c.frame) <= 12);
  if (!cut) return null;
  const k = Math.exp(-Math.abs(frame - cut.frame) / (frame < cut.frame ? 4.5 : 5));
  const incoming = SHOTS.find((s) => s.from === cut.frame);
  const astra = incoming ? ASTRA_SHOTS.has(incoming.id) : false;
  return (
    <AbsoluteFill style={{ opacity: k, pointerEvents: "none" }}>
      <AnamorphicFlare xPercent={50} yPercent={50} color={astra ? P.astraCyan : P.opusEmber} secondaryColor={astra ? P.opusEmber : P.astraCyan} intensity={1.1} />
    </AbsoluteFill>
  );
};

export const SingularityEngine: React.FC<{ withAudio?: boolean }> = ({ withAudio = true }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: P.void }}>
      <Grade>
        {SHOTS.map((s) => {
          const Scene = SCENES[s.id];
          return (
            <Sequence key={s.id} from={s.from} durationInFrames={s.to - s.from} name={`${s.id} · ${s.name}`}>
              <SeamScene id={s.id}>
                <Scene />
              </SeamScene>
            </Sequence>
          );
        })}
        <CutAccents />
      </Grade>
      {withAudio ? <Audio src={staticFile("singularity/audio/mix_master.wav")} /> : null}
    </AbsoluteFill>
  );
};
