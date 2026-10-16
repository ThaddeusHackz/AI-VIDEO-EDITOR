import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mulberry32, project3DPoint } from "../../engine/cameraRig";
import { Canvas2D } from "../components/Canvas2D";
import { FONT, KineticPhrase } from "../components/Words";
import { FPS, P, rgba, SCH, shot } from "../data";
import { useLayout } from "../layout";
import { clamp01, springProgress, SPRINGS } from "../physics/springs";

/**
 * S8 · glyph-dive (f1080–1223). Infinite Z-zoom INSIDE a floating "&" — a true Droste recursion: the world contains
 * the glyph, the glyph's counter contains the world again at 1/Z scale. Zoom period = one scale ratio, so the loop
 * is seamless. The counter mask is found automatically (flood-fill of the rendered glyph). Inside every level:
 *   L1 volumetric data ribbons (amber/cyan helices weaving through depth)
 *   L2 a kinetic code storm whose tokens condense into glowing glass sculptures
 *   L3 an Escher impossible loop (cyclic over/under bars) that re-architects on EVERY beat (SCH.escherBeats)
 */
const S = shot("S8");
const Z = 7; // scale ratio between Droste levels
const PERIOD = 72; // frames per level (2 beats)
const TOKENS = ["spring()", "vec3 sol", "curl(p)", "opus", "astra", "&", "fold()", "emit", "60 fps", "k 170", "weave", "lock()"];

interface GlyphMask {
  canvas: HTMLCanvasElement;
  cx: number; // counter centroid, in mask pixels
  cy: number;
  size: number; // mask canvas size
  font: number; // font px used
  ox: number; // glyph draw origin in mask pixels
  oy: number;
}

function buildMask(): GlyphMask | null {
  if (typeof document === "undefined") return null;
  const size = 900;
  const font = 760;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.font = `italic 700 ${font}px "Cormorant Garamond"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  const ox = size / 2;
  const oy = size / 2 + font * 0.04;
  ctx.fillText("&", ox, oy);
  const img = ctx.getImageData(0, 0, size, size);
  const solid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) solid[i] = img.data[i * 4 + 3] > 100 ? 1 : 0;
  // flood the outside from the border; whatever empty pixels remain are counters
  const label = new Int32Array(size * size);
  const flood = (seed: number, id: number) => {
    const stack = [seed];
    label[seed] = id;
    let count = 0;
    let sx = 0;
    let sy = 0;
    while (stack.length) {
      const p = stack.pop()!;
      count++;
      sx += p % size;
      sy += Math.floor(p / size);
      const x = p % size;
      const nb = [x > 0 ? p - 1 : -1, x < size - 1 ? p + 1 : -1, p - size, p + size];
      for (const q of nb) {
        if (q < 0 || q >= size * size || solid[q] || label[q]) continue;
        label[q] = id;
        stack.push(q);
      }
    }
    return { count, cx: sx / Math.max(1, count), cy: sy / Math.max(1, count) };
  };
  flood(0, 1);
  let best = { id: 0, count: 0, cx: 0, cy: 0 };
  let next = 2;
  for (let i = 0; i < size * size; i++) {
    if (solid[i] || label[i]) continue;
    const r = flood(i, next);
    if (r.count > best.count) best = { id: next, ...r };
    next++;
  }
  const out = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    if (label[i] === best.id) {
      out.data[i * 4] = 255;
      out.data[i * 4 + 1] = 255;
      out.data[i * 4 + 2] = 255;
      out.data[i * 4 + 3] = 255;
    }
  }
  ctx.clearRect(0, 0, size, size);
  ctx.putImageData(out, 0, 0);
  return { canvas: c, cx: best.cx, cy: best.cy, size, font, ox, oy };
}

export const S8GlyphDive: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const L = useLayout();
  const { W, H, u } = L;
  const mask = useMemo(buildMask, []);
  const scratch = useMemo(() => {
    if (typeof document === "undefined") return null;
    const a = document.createElement("canvas");
    a.width = W;
    a.height = H;
    return a;
  }, [W, H]);
  const sculptures = useMemo(() => {
    const r = mulberry32(8801);
    return Array.from({ length: 7 }, (_, i) => ({ a: r() * Math.PI * 2, rad: (180 + r() * 320) * u, z: r(), spin: (r() - 0.5) * 2, beat: i % 4, n: 5 + Math.floor(r() * 3) }));
  }, [u]);

  // the Escher loop: an impossible n-bar polygon, rebuilt on every beat
  const drawEscher = useCallback(
    (ctx: CanvasRenderingContext2D, fr: number, cx: number, cy: number, s: number) => {
      const beats = SCH.escherBeats;
      let idx = 0;
      for (let i = 0; i < beats.length; i++) if (fr >= beats[i]) idx = i;
      const since = (fr - beats[idx]) / FPS;
      const n = [3, 4, 5, 6][idx];
      const snap = springProgress(since, SPRINGS.elastic);
      const R = 205 * u * s;
      const w = 44 * u * s;
      const rot = -Math.PI / 2 + idx * 0.5 + (1 - snap) * 0.8;
      const corners = Array.from({ length: n }, (_, k) => {
        const a = rot + (k / n) * Math.PI * 2;
        return [cx + Math.cos(a) * R * (0.6 + 0.4 * snap), cy + Math.sin(a) * R * (0.6 + 0.4 * snap)];
      });
      const bar = (k: number, part = 1) => {
        const a = corners[k];
        const b = corners[(k + 1) % n];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const ext = w * 1.1;
        const ax = a[0] - (dx / len) * ext;
        const ay = a[1] - (dy / len) * ext;
        const bx = a[0] + dx * part + (part === 1 ? (dx / len) * ext * 0.2 : 0);
        const by = a[1] + dy * part + (part === 1 ? (dy / len) * ext * 0.2 : 0);
        // top face
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + nx * w, by + ny * w);
        ctx.lineTo(ax + nx * w, ay + ny * w);
        ctx.closePath();
        ctx.fillStyle = k % 2 ? rgba(P.astraCyan, 0.85) : rgba(P.opusAmber, 0.9);
        ctx.fill();
        // side face (isometric depth)
        ctx.beginPath();
        ctx.moveTo(ax + nx * w, ay + ny * w);
        ctx.lineTo(bx + nx * w, by + ny * w);
        ctx.lineTo(bx + nx * w * 1.55, by + ny * w * 1.55 + w * 0.35);
        ctx.lineTo(ax + nx * w * 1.55, ay + ny * w * 1.55 + w * 0.35);
        ctx.closePath();
        ctx.fillStyle = k % 2 ? rgba(P.astraDeep, 0.95) : "rgba(60,26,14,0.95)";
        ctx.fill();
        ctx.strokeStyle = rgba(P.opusCream, 0.85);
        ctx.lineWidth = 1.2 * u * s;
        ctx.stroke();
      };
      for (let k = 0; k < n; k++) bar(k);
      bar(0, 0.35); // the first bar passes over the last again: the impossible cycle
    },
    [u],
  );

  const drawWorld = useCallback(
    (ctx: CanvasRenderingContext2D, fr: number, s: number, cx: number, cy: number) => {
      const t = (fr - S.from) / FPS;
      // every Droste level carries its own interior light, so each counter reads as a portal
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.75 * H * s);
      glow.addColorStop(0, rgba(P.opusEmber, 0.16));
      glow.addColorStop(0.45, rgba(P.astraCyan, 0.07));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 0.75 * H * s, cy - 0.75 * H * s, 1.5 * H * s, 1.5 * H * s);
      // L1 · volumetric data ribbons: two helices (Opus amber / Astra cyan) weaving through depth
      for (let hlx = 0; hlx < 2; hlx++) {
        for (const [wMul, al] of [[11, 0.14], [5, 0.3], [2.4, 0.95]] as Array<[number, number]>) {
          ctx.strokeStyle = rgba(hlx ? P.astraCyan : P.opusEmber, al);
          ctx.lineWidth = wMul * u * s;
          ctx.beginPath();
          for (let i = 0; i <= 90; i++) {
            const z = -600 + i * 22;
            const a = z * 0.012 + t * 2.4 + hlx * Math.PI;
            const pr = project3DPoint({ x: Math.cos(a) * 260, y: Math.sin(a) * 160, z }, 0.25, 0.3, 0, 700, 1000, 0, 0);
            const x = cx + pr.x * s * u;
            const y = cy + pr.y * s * u;
            if (i) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      // L2 · code storm → glass sculptures
      ctx.font = `700 ${Math.max(6, 24 * u * s).toFixed(1)}px "JetBrains Mono"`;
      ctx.textAlign = "center";
      const r = mulberry32(8802);
      for (let i = 0; i < 110; i++) {
        const a = r() * Math.PI * 2;
        const d = (((r() + t * (0.35 + r() * 0.3)) % 1) ** 1.6) * 720 * u * s;
        ctx.fillStyle = rgba(i % 3 ? P.opusCream : P.astraIce, 0.38 + 0.62 * (d / (720 * u * s)));
        ctx.fillText(TOKENS[i % TOKENS.length], cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.75);
      }
      for (const sc of sculptures) {
        const born = SCH.escherBeats[sc.beat];
        if (fr < born) continue;
        const p = springProgress((fr - born) / FPS, SPRINGS.letter);
        const x = cx + Math.cos(sc.a + t * 0.2) * sc.rad * s;
        const y = cy + Math.sin(sc.a + t * 0.2) * sc.rad * s * 0.7;
        const rad = 46 * u * s * p * (0.6 + sc.z * 0.6);
        const pts = Array.from({ length: sc.n }, (_, k) => {
          const aa = (k / sc.n) * Math.PI * 2 + t * sc.spin;
          return [x + Math.cos(aa) * rad, y + Math.sin(aa) * rad * 0.8];
        });
        ctx.beginPath();
        pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.closePath();
        const g = ctx.createLinearGradient(x - rad, y - rad, x + rad, y + rad);
        g.addColorStop(0, rgba(P.astraIce, 0.42));
        g.addColorStop(0.5, rgba(P.opusCream, 0.08));
        g.addColorStop(1, rgba(P.astraCyan, 0.3));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = rgba("#FFFFFF", 0.8);
        ctx.lineWidth = 1.2 * u * s;
        ctx.stroke();
        ctx.beginPath();
        pts.forEach(([px, py]) => {
          ctx.moveTo(x, y - rad * 0.2);
          ctx.lineTo(px, py);
        });
        ctx.strokeStyle = rgba(P.astraIce, 0.35);
        ctx.stroke();
      }
      // L3 · the Escher loop
      drawEscher(ctx, fr, cx + 330 * u * s, cy - 150 * u * s, s * 0.9);
      // the glyph itself: an obsidian "&" with a two-titan neon edge
      if (!mask) return;
      const k = (s * L.pick(1.55, 1.25) * H) / mask.font;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(k, k);
      ctx.translate(-mask.cx, -mask.cy);
      ctx.font = `italic 700 ${mask.font}px "Cormorant Garamond"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const g = ctx.createLinearGradient(mask.ox - 300, mask.oy - 400, mask.ox + 300, mask.oy + 400);
      g.addColorStop(0, "#2b303d");
      g.addColorStop(0.42, "#0e1017");
      g.addColorStop(0.55, "#232836");
      g.addColorStop(1, "#2c1f18");
      ctx.fillStyle = g;
      ctx.fillText("&", mask.ox, mask.oy);
      // rim glow without a blur pass: three widening strokes per titan colour
      for (const [lw, al] of [[16, 0.1], [7, 0.28], [2.6, 1]] as Array<[number, number]>) {
        ctx.lineWidth = lw / k;
        ctx.strokeStyle = rgba(P.opusEmber, al);
        ctx.strokeText("&", mask.ox - 2 / k, mask.oy);
        ctx.strokeStyle = rgba(P.astraCyan, al);
        ctx.strokeText("&", mask.ox + 2 / k, mask.oy);
      }
      ctx.restore();
    },
    [drawEscher, mask, sculptures, u, H, L],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const cx = W / 2;
      const cy = H / 2;
      const phase = ((fr - S.from) % PERIOD) / PERIOD;
      const zoom = Math.pow(Z, phase);
      // level 0: full world
      drawWorld(ctx, fr, zoom, cx, cy);
      if (!mask || !scratch) return;
      // levels 1..2: the world again, masked to the counter of the level above it
      for (let lvl = 1; lvl <= 2; lvl++) {
        const s = zoom / Math.pow(Z, lvl);
        const sOuter = zoom / Math.pow(Z, lvl - 1);
        const sc = scratch.getContext("2d")!;
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.globalCompositeOperation = "source-over";
        sc.clearRect(0, 0, W, H);
        sc.fillStyle = P.void;
        sc.fillRect(0, 0, W, H);
        drawWorld(sc, fr, s, cx, cy);
        const k = (sOuter * L.pick(1.55, 1.25) * H) / mask.font;
        sc.globalCompositeOperation = "destination-in";
        sc.setTransform(k, 0, 0, k, cx - mask.cx * k, cy - mask.cy * k);
        sc.drawImage(mask.canvas, 0, 0);
        sc.setTransform(1, 0, 0, 1, 0, 0);
        sc.globalCompositeOperation = "source-over";
        ctx.drawImage(scratch, 0, 0);
      }
      // beat flash on every re-architecture
      for (const b of SCH.escherBeats) {
        const age = fr - b;
        if (age >= 0 && age < 8) {
          ctx.fillStyle = rgba(P.opusCream, 0.07 * (1 - age / 8));
          ctx.fillRect(0, 0, W, H);
        }
      }
    },
    [W, H, drawWorld, mask, scratch, L],
  );

  return (
    <AbsoluteFill>
      <Canvas2D draw={draw} />
      <KineticPhrase
        id="L4b"
        offset={S.from}
        x={L.safe}
        y={H * 0.82}
        width={W - 2 * L.safe}
        align="center"
        base={{ font: FONT.opus, size: 64, italic: true, weight: 500, color: P.opusCream }}
        overrides={{ destroy: { font: FONT.opus, size: 64, italic: true, weight: 600, color: P.opusAmber } }}
        exitAt={1120}
      />
      <KineticPhrase
        id="L4c"
        offset={S.from}
        x={L.safe}
        y={L.pick(H * 0.8, H * 0.78)}
        width={W - 2 * L.safe}
        align="center"
        base={{ font: FONT.opus, size: 70, italic: true, weight: 500, color: P.opusCream }}
        overrides={{ build: { font: FONT.opus, size: 70, italic: true, weight: 600, color: P.astraCyan } }}
        lead={2}
      />
    </AbsoluteFill>
  );
};
