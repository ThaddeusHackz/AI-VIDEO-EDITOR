/**
 * Typed access to the film's single source of truth (timeline.json) and the measured VO word timings
 * (vo-words.json, written by productions/singularity-engine/audio/build_vo.py).
 */
import timeline from "./timeline.json";
import voWords from "./vo-words.json";

export const TL = timeline;
export const FPS = timeline.fps;
export const TOTAL = timeline.durationInFrames;
export const BEAT = timeline.beatFrames; // 36 frames
export const P = timeline.palette;
export const EV = timeline.events;
export const SCH = timeline.schedules;
export const WORD_EV = voWords.derivedEvents;

export type ShotId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8" | "S9" | "S10" | "S11";
export interface Shot {
  id: ShotId;
  name: string;
  from: number;
  to: number;
}
export const SHOTS = timeline.shots as Shot[];
export const shot = (id: ShotId): Shot => SHOTS.find((s) => s.id === id)!;

export type SeamKind =
  | "zoom-through"
  | "inverse-zoom-through"
  | "cut-the-curve"
  | "whip-pan"
  | "scale-burst"
  | "rise"
  | "hard-cut-to-black"
  | "match-cut";
export interface Cut {
  frame: number;
  seam: SeamKind;
  axis: "x" | "y" | "z" | "none";
  dir: number;
  sfx: string;
}
export const CUTS = timeline.cuts as Cut[];
export const cutAt = (frame: number): Cut | null => CUTS.find((c) => c.frame === frame) ?? null;

export interface Word {
  text: string;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  syllables: number;
}
export interface Phrase {
  id: string;
  line: number;
  text: string;
  start: number;
  end: number;
  startFrame: number;
  endFrame: number;
  words: Word[];
}
export const PHRASES = voWords.phrases as unknown as Phrase[];
export const phrase = (id: string): Phrase => PHRASES.find((p) => p.id === id)!;

/** Snap a frame to the 100 BPM 16th-note grid (9 frames @ 60 fps). */
export const q16 = (frame: number) => Math.round(frame / 9) * 9;

/** "#RRGGBB" + alpha → rgba() string. */
export function rgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(4)})`;
}

/** Linear mix of two hex colours → rgb() string. */
export function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
