import React, { useCallback, useMemo } from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { CameraRigContainer, mulberry32, project3DPoint, useCameraRig } from "../../engine/cameraRig";
import { Canvas2D } from "../components/Canvas2D";
import { FONT } from "../components/Words";
import { FPS, P, phrase, rgba, shot, WORD_EV } from "../data";
import { useLayout } from "../layout";
import { clamp01, ease, springAt, springProgress, SPRINGS } from "../physics/springs";

/**
 * S3 · macro-dive (f216–359). We dive through the line×ring intersection into the microscopic code layer
 * (the HyperFrames "genesis-code" plate, composited with additive screen blending). A frosted glass pane LOCKS the
 * code on "locked behind…" (an etched clock ticks on the audio's 8th-note pulse), then SHATTERS on the measured
 * word "glass" into 3D shards carrying ASCII glyphs and neon vector edges (closed-form drag ballistics).
 */
const S = shot("S3");
const LOCK = phrase("L1b").words[0].startFrame; // "locked"
const SHATTER = WORD_EV.glassShatter;
const TICKS_FROM = 198; // 3.3 s — the clock pulse in the score starts here (8ths = 18 frames)
const ASCII = "{}[]<>/=;:01#*+-~|$%&";

interface Shard {
  pts: Array<[number, number]>;
  cx: number;
  cy: number;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  glyphs: Array<{ ch: string; x: number; y: number }>;
  neon: string;
}

export const S3MacroDive: React.FC = () => {
  const local = useCurrentFrame();
  const frame = local + S.from;
  const L = useLayout();
  const { W, H, u } = L;
  const crash = useCameraRig({ preset: "crash-zoom", startFrame: SHATTER - S.from, durationInFrames: 22, intensity: 0.2 });
  const drift = useCameraRig({ preset: "handheld-cinema", startFrame: 0, durationInFrames: 144, intensity: 3.2 });

  const pane = useMemo(() => {
    const w = L.pick(W * 0.64, W * 0.88);
    const h = L.pick(H * 0.6, H * 0.4);
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  }, [W, H, L]);

  // radial crack pattern → quad shards (rays × rings around the impact point)
  const shards = useMemo<Shard[]>(() => {
    const r = mulberry32(3301);
    const ix = pane.x + pane.w * 0.52;
    const iy = pane.y + pane.h * 0.46;
    const RAYS = 16;
    const rings = [0, 0.12, 0.3, 0.55, 1.05];
    const ang = Array.from({ length: RAYS }, (_, i) => (i / RAYS) * Math.PI * 2 + (r() - 0.5) * 0.3);
    const maxR = Math.hypot(pane.w, pane.h);
    const out: Shard[] = [];
    for (let i = 0; i < RAYS; i++) {
      const a0 = ang[i];
      const a1 = ang[(i + 1) % RAYS] + (i === RAYS - 1 ? Math.PI * 2 : 0);
      for (let k = 0; k < rings.length - 1; k++) {
        const r0 = rings[k] * maxR * (k ? 0.9 + r() * 0.2 : 1);
        const r1 = rings[k + 1] * maxR * (0.9 + r() * 0.2);
        const pts: Array<[number, number]> = [
          [ix + Math.cos(a0) * r0, iy + Math.sin(a0) * r0],
          [ix + Math.cos(a0) * r1, iy + Math.sin(a0) * r1],
          [ix + Math.cos(a1) * r1, iy + Math.sin(a1) * r1],
          [ix + Math.cos(a1) * r0, iy + Math.sin(a1) * r0],
        ].map(([x, y]) => [Math.min(pane.x + pane.w, Math.max(pane.x, x)), Math.min(pane.y + pane.h, Math.max(pane.y, y))] as [number, number]);
        const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
        const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
        const area = Math.abs((pts[2][0] - pts[0][0]) * (pts[3][1] - pts[1][1]) - (pts[3][0] - pts[1][0]) * (pts[2][1] - pts[0][1])) / 2;
        if (area < 30) continue;
        const dirx = cx - ix;
        const diry = cy - iy;
        const d = Math.hypot(dirx, diry) + 1;
        const sp = (600 + r() * 900) * u;
        out.push({
          pts: pts.map(([x, y]) => [x - cx, y - cy]),
          cx,
          cy,
          vx: (dirx / d) * sp,
          vy: (diry / d) * sp - 120 * u,
          vz: (380 + r() * 520) * (1 - k * 0.12),
          rx: (r() - 0.5) * 7,
          ry: (r() - 0.5) * 7,
          glyphs: Array.from({ length: 2 + Math.floor(r() * 5) }, () => ({ ch: ASCII[Math.floor(r() * ASCII.length)], x: (r() - 0.5) * 60 * u, y: (r() - 0.5) * 40 * u })),
          neon: r() < 0.5 ? P.opusEmber : P.astraCyan,
        });
      }
    }
    return out;
  }, [pane, u]);

  const drawTunnel = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      const t = (fr - S.from) / FPS;
      const cx = W / 2;
      const cy = H / 2;
      const phase = (t * 2.1) % 1;
      ctx.globalCompositeOperation = "lighter";
      // the microscopic world around the code: a faint wall of compiled source zooming outward with the dive
      const zoomK = Math.pow(1.6, (t * 1.1) % 1);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(zoomK, zoomK);
      ctx.font = `400 ${Math.round(13 * u)}px "JetBrains Mono"`;
      ctx.textAlign = "left";
      const SRC = ["export const opus = spring({ k: 170, c: 26 });", "uniform vec3 sol; uniform float uTime;", "for (const g of glyphs) g.lock(frame);", "vec3 corona(vec2 p) { return sol * flare(p); }", "ring(r).cross(line(0, W)).emit();", "const t = frame / 60; // 100 BPM"];
      for (let row = -26; row <= 26; row++) {
        const y = row * 21 * u;
        const off = ((row * 137) % 400) * u;
        ctx.fillStyle = row % 2 ? rgba(P.opusEmber, 0.15) : rgba(P.astraIce, 0.12);
        for (let col = -3; col <= 3; col++) ctx.fillText(SRC[(row + 26 + col * 2 + 60) % SRC.length], col * 560 * u - off, y);
      }
      ctx.restore();
      // carrier: the amber line and the cyan corona we dove through, blasting outward past camera
      const carry = Math.exp(-(fr - S.from) / 26);
      const carryRing = Math.exp(-(fr - S.from) / 110);
      if (carry > 0.02) {
        const spread = 1 + (fr - S.from) * 0.09;
        for (const [lw, al] of [[46, 0.12], [16, 0.35], [5, 1]] as Array<[number, number]>) {
          ctx.strokeStyle = rgba(P.opusEmber, al * carry);
          ctx.lineWidth = lw * u * spread;
          ctx.beginPath();
          ctx.moveTo(0, cy);
          ctx.lineTo(W, cy);
          ctx.stroke();
          ctx.strokeStyle = rgba(P.astraCyan, al * carryRing);
          ctx.beginPath();
          ctx.ellipse(cx, cy, 380 * u * spread * Math.sqrt(spread), 160 * u * spread * Math.sqrt(spread), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      for (let k = -2; k < 14; k++) {
        const rr = 30 * u * Math.exp((k + phase) * 0.42);
        if (rr > Math.hypot(W, H)) break;
        const a = clamp01((k + phase + 2) / 4) * 0.95 * Math.exp(-(k + phase) * 0.06);
        ctx.strokeStyle = k % 2 ? rgba(P.astraCyan, a * 0.55) : rgba(P.opusEmber, a * 0.6);
        ctx.lineWidth = Math.max(10, rr * 0.07);
        ctx.setLineDash([]);
        const glowA = a * 0.12;
        ctx.strokeStyle = k % 2 ? rgba(P.astraCyan, glowA) : rgba(P.opusEmber, glowA);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = k % 2 ? rgba(P.astraCyan, a * 0.55) : rgba(P.opusEmber, a * 0.6);
        ctx.lineWidth = Math.max(2, rr * 0.016);
        ctx.setLineDash([rr * 0.08, rr * 0.05]);
        ctx.lineDashOffset = t * 120 * (k % 2 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // falling data rain: microscopic glyph columns in the dark around the code (Opus amber / Astra ice)
      ctx.font = `700 ${Math.round(20 * u)}px "JetBrains Mono"`;
      ctx.textAlign = "center";
      const colsN = Math.round(W / (26 * u));
      const glyphs = "01{}<>/=;:#*+";
      for (let c = 0; c < colsN; c++) {
        const speed = (160 + ((c * 73) % 9) * 40) * u;
        const head = ((c * 197 * u + t * speed) % (H + 400 * u)) - 200 * u;
        for (let k = 0; k < 14; k++) {
          const y = head - k * 22 * u;
          const a = (1 - k / 14) * 0.8 * (Math.abs(c * 26 * u - W / 2) > W * 0.18 ? 1 : 0.3);
          ctx.fillStyle = c % 3 ? rgba(P.opusEmber, a) : rgba(P.astraIce, a);
          ctx.fillText(glyphs[(c * 7 + k + Math.floor(t * 20)) % glyphs.length], c * 26 * u + 13 * u, y);
        }
      }
      const rays = 130;
      for (let i = 0; i < rays; i++) {
        const a = (i / rays) * Math.PI * 2 + t * 0.15;
        const r0 = 120 * u + ((i * 37 + t * 900) % (W * 0.8));
        ctx.strokeStyle = rgba(i % 3 ? P.astraIce : P.opusEmber, 0.38);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * (r0 + 60 * u), cy + Math.sin(a) * (r0 + 60 * u));
        ctx.stroke();
      }
    },
    [W, H, u],
  );

  const drawShards = useCallback(
    (ctx: CanvasRenderingContext2D, f: number) => {
      const fr = f + S.from;
      if (fr < SHATTER - 2) return;
      const ix = pane.x + pane.w * 0.52;
      const iy = pane.y + pane.h * 0.46;
      if (fr < SHATTER) {
        // the crack runs a fraction of a beat before the pane gives way
        const r = mulberry32(3302);
        ctx.strokeStyle = rgba(P.opusCream, 0.9);
        ctx.lineWidth = 1.6 * u;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 + (r() - 0.5) * 0.3;
          const len = (fr - SHATTER + 3) * 0.33 * Math.hypot(pane.w, pane.h) * (0.5 + r() * 0.5);
          ctx.beginPath();
          ctx.moveTo(ix, iy);
          ctx.lineTo(ix + Math.cos(a) * len, iy + Math.sin(a) * len);
          ctx.stroke();
        }
        return;
      }
      const t = (fr - SHATTER) / FPS;
      const k = 2.2; // drag
      const drag = (1 - Math.exp(-k * t)) / k;
      ctx.font = `700 ${Math.round(22 * u)}px "JetBrains Mono"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const s of shards) {
        const pos = { x: s.cx - W / 2 + s.vx * drag, y: s.cy - H / 2 + s.vy * drag + 260 * u * t * t, z: s.vz * drag * 2.4 };
        const proj = project3DPoint(pos, 0, 0, 0, 900, 1000, W / 2, H / 2);
        if (!proj.visible || proj.scale > 4.5) continue;
        const alpha = clamp01(1 - t / 1.05) * clamp01((4.5 - proj.scale) / 1.5);
        if (alpha <= 0.01) continue;
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(s.rx * t);
        ctx.scale(proj.scale * Math.cos(s.ry * t * 0.6), proj.scale);
        ctx.beginPath();
        s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        const g = ctx.createLinearGradient(-60, -60, 60, 60);
        g.addColorStop(0, rgba(P.astraIce, 0.16 * alpha));
        g.addColorStop(0.5, rgba(P.opusCream, 0.05 * alpha));
        g.addColorStop(1, rgba(P.astraIce, 0.12 * alpha));
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = rgba(s.neon, 0.95 * alpha);
        ctx.lineWidth = 1.8 / Math.max(0.5, proj.scale);
        ctx.stroke();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = rgba(s.neon === P.astraCyan ? P.astraIce : P.opusCream, 0.85 * alpha);
        for (const gph of s.glyphs) ctx.fillText(gph.ch, gph.x, gph.y);
        ctx.restore();
        ctx.restore();
      }
      // pure neon vector shards: outline-only splinters streaking past camera
      const r = mulberry32(3303);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 46; i++) {
        const a = r() * Math.PI * 2;
        const sp = (500 + r() * 1400) * u;
        const pos = { x: ix - W / 2 + Math.cos(a) * sp * drag, y: iy - H / 2 + Math.sin(a) * sp * drag, z: (300 + r() * 700) * drag * 2.5 };
        const proj = project3DPoint(pos, 0, 0, 0, 900, 1000, W / 2, H / 2);
        if (!proj.visible) continue;
        const len = (16 + r() * 40) * u * proj.scale;
        const al = clamp01(1 - t / 0.9);
        ctx.strokeStyle = rgba(i % 2 ? P.astraCyan : P.opusEmber, al);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(proj.x, proj.y);
        ctx.lineTo(proj.x + Math.cos(a + 0.4) * len, proj.y + Math.sin(a + 0.4) * len);
        ctx.lineTo(proj.x + Math.cos(a - 0.5) * len * 0.6, proj.y + Math.sin(a - 0.5) * len * 0.6);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    [shards, pane, W, H, u],
  );

  // plate zoom: microscopic at the cut, springs up to fill the frame, keeps pushing
  const plateSize = Math.min(W, H) * L.pick(1.3, 1.08);
  const reveal = springAt(frame, S.from, FPS, SPRINGS.camera, 0.62, 1);
  const push = 1 + 0.22 * ((frame - S.from) / (S.to - S.from));
  const plateScale = reveal * push;
  const lockP = springAt(frame, LOCK - 10, FPS, SPRINGS.panel);
  const paneVisible = frame >= LOCK - 10 && frame < SHATTER;
  const tickIndex = Math.floor((frame - TICKS_FROM) / 18);
  const sinceTick = (frame - TICKS_FROM) % 18;
  const handAngle = (tickIndex + springProgress(sinceTick / FPS, SPRINGS.letter)) * ((2 * Math.PI) / 60) * 5;

  const words = phrase("L1b").words;
  const wf = (i: number) => words[i].startFrame - 2;
  const typed = (txt: string, start: number) => (frame < start ? "" : txt.slice(0, Math.min(txt.length, Math.floor((frame - start) / 1.4) + 1)));
  const glassIn = springProgress(Math.max(0, frame - SHATTER) / FPS, SPRINGS.letter);
  const timeIn = (i: number) => springProgress(Math.max(0, frame - wf(i)) / FPS, SPRINGS.letter);

  return (
    <AbsoluteFill>
      <CameraRigContainer rig={{ ...crash, translateX: crash.translateX + drift.translateX, translateY: crash.translateY + drift.translateY, rotateZ: drift.rotateZ, scale: crash.scale * (1 + 0.16 * clamp01((frame - LOCK) / (SHATTER - LOCK))) }}>
        {/* Tunnel world + carrier glint live INSIDE the rig's stacking context: mix-blend-mode only blends within its
            stacking context, so outside it the plate's opaque black square would paint over them. */}
        <Canvas2D draw={drawTunnel} />
        {/* carrier: the white-hot intersection glint we dived through blooms out and decays */}
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            opacity: Math.exp(-(frame - S.from) / 30),
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, ${rgba(P.opusEmber, 0.55)} 9%, ${rgba(P.astraCyan, 0.22)} 26%, rgba(0,0,0,0) 55%)`,
            mixBlendMode: "screen",
          }}
        />
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: plateSize, height: plateSize, transform: `scale(${plateScale.toFixed(4)})`, mixBlendMode: "screen", filter: paneVisible ? `blur(${(2.2 * lockP).toFixed(2)}px) brightness(1.55)` : "brightness(1.55)" }}>
            <OffthreadVideo src={staticFile("singularity/hf/genesis-code.mp4")} muted style={{ width: "100%", height: "100%" }} />
          </div>
        </AbsoluteFill>
        {paneVisible ? (
          <div
            style={{
              position: "absolute",
              left: pane.x,
              top: pane.y - (1 - lockP) * H * 0.9,
              width: pane.w,
              height: pane.h,
              borderRadius: 18 * u,
              background: `linear-gradient(125deg, ${rgba(P.astraIce, 0.13)} 0%, ${rgba(P.opusCream, 0.04)} 38%, ${rgba(P.astraIce, 0.02)} 62%, ${rgba(P.opusCream, 0.09)} 100%)`,
              border: `${1.5 * u}px solid ${rgba(P.opusCream, 0.35)}`,
              boxShadow: `inset 0 0 ${60 * u}px ${rgba(P.astraIce, 0.08)}, 0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.5)`,
              overflow: "hidden",
            }}
          >
            {/* etched clock: hand jumps on every 8th-note tick of the score */}
            <svg width={pane.w} height={pane.h} style={{ position: "absolute", inset: 0 }}>
              {Array.from({ length: 60 }, (_, i) => {
                const a = (i / 60) * Math.PI * 2;
                const R = Math.min(pane.w, pane.h) * 0.36;
                const len = i % 5 === 0 ? 18 * u : 8 * u;
                return (
                  <line
                    key={i}
                    x1={pane.w / 2 + Math.cos(a) * R}
                    y1={pane.h / 2 + Math.sin(a) * R}
                    x2={pane.w / 2 + Math.cos(a) * (R - len)}
                    y2={pane.h / 2 + Math.sin(a) * (R - len)}
                    stroke={rgba(P.opusCream, i % 5 === 0 ? 0.55 : 0.25)}
                    strokeWidth={1.4 * u}
                  />
                );
              })}
              <line
                x1={pane.w / 2}
                y1={pane.h / 2}
                x2={pane.w / 2 + Math.sin(handAngle) * Math.min(pane.w, pane.h) * 0.33}
                y2={pane.h / 2 - Math.cos(handAngle) * Math.min(pane.w, pane.h) * 0.33}
                stroke={P.opusAmber}
                strokeWidth={3 * u}
                strokeLinecap="round"
              />
              <circle cx={pane.w / 2} cy={pane.h / 2} r={6 * u} fill={P.opusAmber} />
              {/* specular sweep across the glass */}
              <rect x={((frame - LOCK) * 22 * u) % (pane.w * 2) - pane.w * 0.6} y={-pane.h * 0.2} width={pane.w * 0.12} height={pane.h * 1.4} fill={rgba(P.astraIce, 0.08)} transform={`skewX(-18)`} />
            </svg>
            <div style={{ position: "absolute", left: 26 * u, top: 20 * u, fontFamily: FONT.code, fontSize: 24 * u, color: rgba(P.opusCream, 0.85), whiteSpace: "pre", letterSpacing: "0.02em" }}>
              <span style={{ color: P.opusAmber }}>{typed("locked", wf(0))}</span> {typed("behind", wf(1))}
            </div>
            <div style={{ position: "absolute", right: 26 * u, bottom: 18 * u, fontFamily: FONT.code, fontSize: 15 * u, color: rgba(P.astraIce, 0.6), letterSpacing: "0.12em" }}>
              PANE · 0.4 MM · TEMPERED
            </div>
          </div>
        ) : null}
        <Canvas2D draw={drawShards} />
        {/* "glass" — the hero embed stands where the pane was */}
        {frame >= SHATTER ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: H / 2 - 110 * u,
              textAlign: "center",
              fontFamily: FONT.astra,
              fontWeight: 700,
              fontSize: L.pick(210, 190) * u,
              letterSpacing: "-0.04em",
              color: "transparent",
              WebkitTextStroke: `${2.2 * u}px ${P.astraIce}`,
              textShadow: `0 0 ${40 * u}px ${rgba(P.astraCyan, 0.55)}`,
              opacity: clamp01((frame - SHATTER) / 3) * (1 - ease.in4(clamp01((frame - (S.to - 14)) / 14))),
              transform: `scale(${(1.6 - 0.6 * glassIn).toFixed(4)})`,
            }}
          >
            glass
          </div>
        ) : null}
      </CameraRigContainer>
      {/* "…and time." after the shatter, the clock's last tick lands on "time" */}
      <div
        style={{
          position: "absolute",
          right: L.safe + 10 * u,
          bottom: L.pick(H * 0.13, H * 0.2),
          fontFamily: FONT.opus,
          fontStyle: "italic",
          fontSize: 76 * u,
          color: P.opusCream,
          display: "flex",
          gap: 22 * u,
        }}
      >
        {[3, 4].map((i) =>
          frame >= wf(i) ? (
            <span key={i} style={{ opacity: clamp01((frame - wf(i)) / 5), transform: `translateY(${((1 - timeIn(i)) * 30 * u).toFixed(2)}px)`, color: i === 4 ? P.opusAmber : P.opusCream, filter: frame - wf(i) < 8 ? `blur(${(8 - (frame - wf(i))) * 1.1}px)` : undefined }}>
              {words[i].text}
            </span>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};
