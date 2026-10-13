import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraRigContainer, mulberry32, useCameraRig, type DoPCameraPreset } from "../engine/cameraRig";
import { getLUTFilterString, type LUTGradePreset } from "../engine/nleTrackEngine";
import { FilmGrainOverlay } from "../engine/vfxShaders";
import timeline from "./timeline.json";

/**
 * ZACK-D-FILMS-STYLE SHORT — "The tiny hole in airplane windows"
 *
 * Format study of the viral 3D-explainer Shorts genre:
 *   - one curious fact, hook in <2 s, build tension, one clean payoff
 *   - semi-realistic "Blender look" frames with slow pushes / low-angle drama
 *   - calm ominous narrator over a low tension bed with a soft heartbeat
 *   - word-by-word captions (active word highlighted), hard cuts with whooshes,
 *     a few giant stat callouts, a physical camera jolt on the scare beat
 *
 * Everything is data-driven from timeline.json (built by
 * scripts/zack-window/build-timeline.py from the narration WAVs), so swapping
 * the script, voice or frames never touches this file.
 */

type Token = { text: string; startSec: number; endSec: number; emphasis: boolean };
type Scene = (typeof timeline)["scenes"][number];

const YELLOW = "#FFD60A";
const FONT = "Inter, 'Space Grotesk', system-ui, sans-serif";

/** Per-scene tuning of the repo's Higgsfield DoP rig so it reads well on 2D plates. */
const RIG_INTENSITY: Record<DoPCameraPreset, number> = {
  static: 0,
  "dolly-zoom": 0.32,
  "crash-zoom": 0.26,
  "orbit-360": 0.34,
  "bullet-time": 0.4,
  "whip-pan": 0.3,
  "push-to-glass": 0.11,
  "crane-up": 0.55,
  "handheld-cinema": 1.25,
  "rack-focus": 0.6,
  "fpv-drone": 0.3,
};

/* ------------------------------------------------------------------ */
/* Scene plate: image + DoP camera + cut punch + grade                  */
/* ------------------------------------------------------------------ */

const ScenePlate: React.FC<{ scene: Scene; durationInFrames: number }> = ({ scene, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const preset = scene.camera as DoPCameraPreset;
  const rig = useCameraRig({ preset, durationInFrames, intensity: RIG_INTENSITY[preset] ?? 0.3 });

  // Slow Ken-Burns drift layered under the DoP preset so even "static" beats breathe.
  const drift = interpolate(frame, [0, durationInFrames], [1.0, 1.085], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  // Hard-cut punch: every scene lands 4% tight and settles in ~6 frames.
  const punch = interpolate(frame, [0, 6], [1.04, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // Scare-beat jolt (scene 7): seeded shake that decays, fired when "cracks," is spoken.
  let joltX = 0;
  let joltY = 0;
  let joltRot = 0;
  if (scene.shake) {
    const crack = scene.tokens.find((t) => t.text.startsWith("cracks"));
    const crackFrame = crack ? Math.round((crack.startSec - scene.startSec) * fps) : 10;
    const since = frame - crackFrame;
    if (since >= 0 && since < 22) {
      const rand = mulberry32(1000 + since);
      const decay = Math.exp(-since * 0.17);
      joltX = (rand() - 0.5) * 70 * decay;
      joltY = (rand() - 0.5) * 70 * decay;
      joltRot = (rand() - 0.5) * 3.2 * decay;
    }
  }

  // Base over-scan so rotateX/Y presets never reveal the plate edges.
  const overscan = preset === "orbit-360" || preset === "crane-up" ? 1.14 : 1.06;

  return (
    <AbsoluteFill style={{ backgroundColor: "#06070a", overflow: "hidden" }}>
      <CameraRigContainer rig={rig}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${joltX.toFixed(1)}px, ${joltY.toFixed(1)}px) rotate(${joltRot.toFixed(2)}deg) scale(${(
              overscan * drift * punch
            ).toFixed(4)})`,
            transformOrigin: "50% 45%",
          }}
        >
          <Img
            src={staticFile(scene.image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: getLUTFilterString(scene.grade as LUTGradePreset),
            }}
          />
        </div>
      </CameraRigContainer>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Headline hook (scene 1)                                              */
/* ------------------------------------------------------------------ */

const HookTitle: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13, stiffness: 190, mass: 0.7 } });
  const out = interpolate(frame, [fps * 3.1, fps * 3.6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const words = text.replace(/\s*🤔\s*$/u, "").split(" ");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 190, opacity: out }}>
      <div
        style={{
          transform: `scale(${0.85 + 0.15 * pop}) translateY(${(1 - pop) * -40}px)`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 18px",
          width: 920,
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 88,
          lineHeight: 1.02,
          letterSpacing: -2,
          textTransform: "uppercase",
          color: "white",
          WebkitTextStroke: "16px #000",
          paintOrder: "stroke fill",
          textShadow: "0 10px 30px rgba(0,0,0,0.55)",
          textAlign: "center",
        }}
      >
        {words.map((w, i) => (
          <span key={i} style={{ color: /hole/i.test(w) ? YELLOW : "white" }}>
            {w}
          </span>
        ))}
      </div>
      {/* Thinking-face stand-in: the sandbox renderer has no emoji font, so draw a badge. */}
      <div
        style={{
          marginTop: 26,
          transform: `scale(${pop})`,
          width: 92,
          height: 92,
          borderRadius: 46,
          background: YELLOW,
          border: "8px solid #000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 62,
          color: "#000",
          lineHeight: 1,
        }}
      >
        ?
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Giant stat callouts                                                  */
/* ------------------------------------------------------------------ */

const Callout: React.FC<{ text: string; startFrame: number; holdFrames: number }> = ({ text, startFrame, holdFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0 || local > holdFrames) return null;
  const pop = spring({ frame: local, fps, config: { damping: 11, stiffness: 240, mass: 0.6 } });
  const out = interpolate(local, [holdFrames - 8, holdFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 300, opacity: out }}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * pop}) rotate(${(1 - pop) * -6 - 2}deg)`,
          background: YELLOW,
          color: "#000",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 96,
          letterSpacing: -3,
          padding: "10px 38px 16px",
          border: "10px solid #000",
          boxShadow: "14px 14px 0 #000",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Word-by-word captions                                                */
/* ------------------------------------------------------------------ */

type Chunk = { tokens: Token[]; startSec: number; endSec: number };

/** Group words into 2–3 word caption cards, breaking at punctuation like a human editor would. */
const buildChunks = (tokens: Token[]): Chunk[] => {
  const chunks: Chunk[] = [];
  let cur: Token[] = [];
  const flush = () => {
    if (cur.length) {
      chunks.push({ tokens: cur, startSec: cur[0].startSec, endSec: cur[cur.length - 1].endSec });
      cur = [];
    }
  };
  tokens.forEach((t) => {
    cur.push(t);
    const punct = /[,.!?]$/.test(t.text);
    if (punct || cur.length >= 3) flush();
  });
  flush();
  return chunks;
};

const Captions: React.FC<{ chunks: Chunk[] }> = ({ chunks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = frame / fps;
  const chunk = chunks.find((c) => now >= c.startSec - 0.04 && now < c.endSec + 0.12);
  if (!chunk) return null;
  const local = (now - chunk.startSec) * fps;
  const enter = spring({ frame: Math.max(0, local), fps, config: { damping: 14, stiffness: 320, mass: 0.5 } });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 470 }}>
      <div
        style={{
          transform: `scale(${0.9 + 0.1 * enter})`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 22px",
          width: 960,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.08,
          letterSpacing: -1.5,
          textTransform: "uppercase",
          WebkitTextStroke: "15px #000",
          paintOrder: "stroke fill",
          textShadow: "0 8px 24px rgba(0,0,0,0.6)",
        }}
      >
        {chunk.tokens.map((t, i) => {
          const active = now >= t.startSec - 0.02 && now < t.endSec + 0.02;
          const past = now >= t.endSec + 0.02;
          const hot = active || (past && t.emphasis);
          return (
            <span
              key={i}
              style={{
                color: hot ? YELLOW : "white",
                transform: active ? "scale(1.1)" : "scale(1)",
                display: "inline-block",
                transition: "none",
              }}
            >
              {t.text.replace(/[“”]/g, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Finishing: vignette, red alarm pulse, progress bar, fade out          */
/* ------------------------------------------------------------------ */

const Finishing: React.FC<{ alarmFrom: number; alarmTo: number }> = ({ alarmFrom, alarmTo }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const alarm =
    frame >= alarmFrom && frame <= alarmTo
      ? 0.22 + 0.16 * Math.sin(((frame - alarmFrom) / fps) * Math.PI * 2.4)
      : 0;
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeIn = interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" });
  const progress = frame / durationInFrames;
  return (
    <>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      {alarm > 0 && <AbsoluteFill style={{ background: "#ff2a1a", opacity: alarm, mixBlendMode: "multiply" }} />}
      <FilmGrainOverlay opacity={0.03} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 10, width: `${progress * 100}%`, background: YELLOW }} />
      <AbsoluteFill style={{ background: "#000", opacity: Math.max(fadeIn, fadeOut) }} />
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Composition                                                          */
/* ------------------------------------------------------------------ */

export const ZackWindowShort: React.FC = () => {
  const { fps } = useVideoConfig();
  const scenes = timeline.scenes;
  const allTokens: Token[] = scenes.flatMap((s) => s.tokens);
  const chunks = React.useMemo(() => buildChunks(allTokens), [allTokens.length]);

  const crackScene = scenes.find((s) => s.shake);
  const crackToken = crackScene?.tokens.find((t) => t.text.startsWith("cracks"));
  const crackFrame = crackToken ? Math.round(crackToken.startSec * fps) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Tension bed, under everything, trimmed to the composition. */}
      <Audio src={staticFile("zack-window/sfx/tension-bed.wav")} volume={0.55} />

      {scenes.map((scene, i) => {
        const dur = scene.endFrame - scene.startFrame;
        return (
          <Sequence key={scene.id} from={scene.startFrame} durationInFrames={dur} name={scene.id}>
            <ScenePlate scene={scene} durationInFrames={dur} />
            <Audio src={staticFile(scene.audio)} volume={1} />
            {i > 0 && <Audio src={staticFile("zack-window/sfx/whoosh.wav")} volume={0.45} />}
            {scene.title && <HookTitle text={scene.title} />}
            {scene.title && (
              <Sequence from={2} durationInFrames={20}>
                <Audio src={staticFile("zack-window/sfx/impact.wav")} volume={0.7} />
              </Sequence>
            )}
            {scene.callout && (
              <>
                <Callout
                  text={scene.callout.text}
                  startFrame={Math.round((scene.callout.startSec - scene.startSec) * fps)}
                  holdFrames={Math.round(fps * 2.2)}
                />
                <Sequence from={Math.round((scene.callout.startSec - scene.startSec) * fps)} durationInFrames={20}>
                  <Audio src={staticFile("zack-window/sfx/impact.wav")} volume={0.6} />
                </Sequence>
              </>
            )}
            {/* Riser into the scare beat: last 2.2 s of the scene before the crack. */}
            {scenes[i + 1]?.shake && (
              <Sequence from={Math.max(0, dur - Math.round(fps * 2.2))} durationInFrames={Math.round(fps * 2.2)}>
                <Audio src={staticFile("zack-window/sfx/riser.wav")} volume={0.5} />
              </Sequence>
            )}
            {scene.shake && (
              <Sequence from={Math.max(0, crackFrame - scene.startFrame)} durationInFrames={20}>
                <Audio src={staticFile("zack-window/sfx/impact.wav")} volume={0.9} />
              </Sequence>
            )}
          </Sequence>
        );
      })}

      <Captions chunks={chunks} />
      <Finishing alarmFrom={crackFrame} alarmTo={crackFrame + Math.round(fps * 1.6)} />
    </AbsoluteFill>
  );
};

export const ZACK_WINDOW_META = {
  id: "ZackWindow-Short",
  fps: timeline.fps,
  width: timeline.width,
  height: timeline.height,
  durationInFrames: timeline.durationInFrames,
};
