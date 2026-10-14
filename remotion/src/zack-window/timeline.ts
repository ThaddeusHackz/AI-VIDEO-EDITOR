/**
 * Timeline for the Zack-D-Films-style short "Why Airplane Windows Have A Tiny Hole".
 *
 * Everything is timed from the narration WAVs in public/zack-window/vo (voice-00).
 * Durations measured with ffprobe; speech on/offsets measured by threshold scan.
 */
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const s = (sec: number) => Math.round(sec * FPS);

export type Beat = {
  id: string;
  file: string;
  /** clip start (frames) */
  from: number;
  /** clip length (frames) */
  duration: number;
  /** speech starts this many frames after clip start */
  lead: number;
  /** speech ends this many frames before clip end */
  tail: number;
  text: string;
  /** caption chunks, shown sequentially across the speech window */
  captions: string[];
};

// Measured: b1 5.67s lead .171 tail .256 | b2 4.34 .168 .226 | b3 10.62 .144 .209
//           b4 4.13 .161 .262 | b5 6.83 .125 .180 | b6 8.19 .109 .172
export const BEATS: Beat[] = [
  {
    id: "b1", file: "b1.wav", from: s(0.1), duration: s(5.67), lead: s(0.17), tail: s(0.26),
    text: "If you've ever sat next to the window on a plane, you might have noticed a tiny hole at the bottom of it.",
    captions: ["If you've ever sat", "next to the window", "on a plane,", "you might have noticed", "a tiny hole", "at the bottom of it."],
  },
  {
    id: "b2", file: "b2.wav", from: s(5.95), duration: s(4.34), lead: s(0.17), tail: s(0.23),
    text: "Most people think it's a defect. But it's actually there to keep you safe.",
    captions: ["Most people think", "it's a defect.", "But it's actually there", "to keep you safe."],
  },
  {
    id: "b3", file: "b3.wav", from: s(10.45), duration: s(10.62), lead: s(0.14), tail: s(0.21),
    text: "You see, the air outside is way too thin to breathe. So the cabin is pumped full of air, which pushes against every window with over a thousand pounds of force.",
    captions: ["You see,", "the air outside", "is way too thin", "to breathe.", "So the cabin is", "pumped full of air,", "which pushes against", "every window", "with over a thousand", "pounds of force."],
  },
  {
    id: "b4", file: "b4.wav", from: s(21.25), duration: s(4.13), lead: s(0.16), tail: s(0.26),
    text: "That's why each window is actually made of three separate panes.",
    captions: ["That's why each window", "is actually made of", "three separate panes."],
  },
  {
    id: "b5", file: "b5.wav", from: s(25.55), duration: s(6.83), lead: s(0.13), tail: s(0.18),
    text: "The outer pane takes all of that pressure. And the middle one is a backup, in case it ever cracks.",
    captions: ["The outer pane", "takes all of that pressure.", "And the middle one", "is a backup,", "in case it ever cracks."],
  },
  {
    id: "b6", file: "b6.wav", from: s(32.55), duration: s(8.19), lead: s(0.11), tail: s(0.17),
    text: "And that tiny hole lets air flow into the gap between them. So the pressure stays on the outer pane, and your window never fogs up.",
    captions: ["And that tiny hole", "lets air flow", "into the gap between them.", "So the pressure stays", "on the outer pane,", "and your window", "never fogs up."],
  },
];

export const TOTAL_FRAMES = s(41.9);

/** Shot boundaries (frames). Camera + scene state are derived from these. */
export const SHOTS = {
  hook: { from: 0, to: s(5.95) },          // interior, finger finds the hole
  holeMacro: { from: s(5.95), to: s(8.1) },  // ECU of the hole
  face: { from: s(8.1), to: s(10.45) },      // passenger close-up, calm
  planeWide: { from: s(10.45), to: s(12.6) },// the whole airliner alone in the void, high up
  exterior: { from: s(12.6), to: s(14.6) },  // outside the plane, looking in at him
  cutaway: { from: s(14.6), to: s(21.25) },  // cross-section, pressure arrows
  exploded: { from: s(21.25), to: s(25.55) },// three panes separate
  crack: { from: s(25.55), to: s(32.55) },   // outer pane loaded, cracks, middle holds
  bleed: { from: s(32.55), to: s(38.2) },    // macro of air through the bleed hole
  outro: { from: s(38.2), to: TOTAL_FRAMES },// back to the passenger, clear window
} as const;

export type ShotId = keyof typeof SHOTS;

export const shotAt = (frame: number): { id: ShotId; local: number; length: number; t: number } => {
  const ids = Object.keys(SHOTS) as ShotId[];
  for (const id of ids) {
    const sh = SHOTS[id];
    if (frame >= sh.from && frame < sh.to) {
      const length = sh.to - sh.from;
      const local = frame - sh.from;
      return { id, local, length, t: local / Math.max(1, length - 1) };
    }
  }
  const last = ids[ids.length - 1];
  const sh = SHOTS[last];
  return { id: last, local: sh.to - sh.from - 1, length: sh.to - sh.from, t: 1 };
};
