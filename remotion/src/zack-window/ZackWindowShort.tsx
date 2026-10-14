import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { perfFlags } from "./scene/materials";
import { Scene } from "./scene/Scene";
import { BEATS, TOTAL_FRAMES } from "./timeline";

/**
 * "Why Airplane Windows Have A Tiny Hole" — a Zack-D-Films-format short.
 *
 * Format forensics applied here:
 *  • "The emptiness": a bright light-blue/cyan void with a white hot-spot behind everything.
 *  • Semi-realistic 3D human + clean 3D props, soft studio light, glossy-clean materials.
 *  • Macro close-ups, slow continuous push-ins, cutaways/exploded views, 3D arrows for forces.
 *  • Calm, plain second-person narration; small white subtitles; low tension bed.
 */

const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse 70% 55% at 50% 44%, #dff3fd 0%, #b3e0f8 30%, #74c3ee 62%, #3f9fdc 100%)",
    }}
  />
);

/** Phrase subtitles in the channel's house style: small, white, bold, thin dark edge, lower-centre. */
const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  let text: string | null = null;
  for (const b of BEATS) {
    const start = b.from + b.lead;
    const end = b.from + b.duration - b.tail;
    if (frame < start || frame >= end) continue;
    const total = b.captions.reduce((n, c) => n + c.length + 2, 0);
    let acc = 0;
    for (const c of b.captions) {
      const w = (c.length + 2) / total;
      const s = start + acc * (end - start);
      const e = start + (acc + w) * (end - start);
      if (frame >= s && frame < e) {
        text = c;
        break;
      }
      acc += w;
    }
  }
  if (!text) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 560 }}>
      <div
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.2,
          color: "#ffffff",
          textAlign: "center",
          maxWidth: 900,
          padding: "0 40px",
          letterSpacing: -0.2,
          WebkitTextStroke: "7px rgba(10, 20, 30, 0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 2px 10px rgba(0,0,0,0.25)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const ZackWindowShort: React.FC = () => {
  const { width, height, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [durationInFrames - 18, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#74c3ee" }}>
      <Backdrop />
      <ThreeCanvas
        width={width}
        height={height}
        gl={{ antialias: perfFlags().aa !== false, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
        camera={{ fov: 36, near: 0.01, far: 80, position: [0, 1.2, 2] }}
        dpr={perfFlags().dpr ?? 0.75}
        style={{ position: "absolute", inset: 0 }}
      >
        <Scene />
      </ThreeCanvas>
      <Captions />
      {BEATS.map((b) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.duration} name={`VO ${b.id}`}>
          <Audio src={staticFile(`zack-window/vo/${b.file}`)} volume={0.95} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={TOTAL_FRAMES} name="Music bed">
        <Audio src={staticFile("zack-window/music/bed.wav")} volume={(f) => interpolate(f, [0, 20, TOTAL_FRAMES - 45, TOTAL_FRAMES - 1], [0, 0.3, 0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: fadeOut * 0.9, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
