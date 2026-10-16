/**
 * Dual-aspect layout (youtube-opus-gpt-benchmarks archetype 5): one component tree renders the 16:9 master and
 * the 9:16 companion. `u` is a type/stroke unit (1 at 1080 px on the short side).
 */
import { useVideoConfig } from "remotion";

export interface Layout {
  W: number;
  H: number;
  cx: number;
  cy: number;
  u: number;
  portrait: boolean;
  /** Pick a value per orientation. */
  pick: <T>(landscape: T, portrait: T) => T;
  /** Title-safe inset in px. */
  safe: number;
}

export function useLayout(): Layout {
  const { width: W, height: H } = useVideoConfig();
  const portrait = H > W;
  const u = Math.min(W, H) / 1080;
  return {
    W,
    H,
    cx: W / 2,
    cy: H / 2,
    u,
    portrait,
    pick: (l, p) => (portrait ? p : l),
    safe: Math.round(Math.min(W, H) * 0.06),
  };
}
