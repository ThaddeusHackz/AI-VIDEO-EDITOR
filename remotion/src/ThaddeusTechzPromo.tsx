import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type CSS = React.CSSProperties;

const C = {
  ink: "#070B12",
  ink2: "#0B1422",
  paper: "#F3F7F7",
  muted: "#9CB0C1",
  cyan: "#35D9F2",
  lime: "#C5F75A",
  amber: "#FFB23F",
  coral: "#FF5B53",
  blue: "#427EFF",
};

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const fadeWindow = (frame: number, start: number, end: number, edge = 12) =>
  interpolate(frame, [start, start + edge, end - edge, end], [0, 1, 1, 0], clamp);

const rise = (frame: number, start: number, distance = 66, duration = 22) =>
  interpolate(frame, [start, start + duration], [distance, 0], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const reveal = (frame: number, start: number, duration = 18) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

const fontStack = "Space Grotesk, Inter, Arial, sans-serif";
const monoStack = "JetBrains Mono, monospace";

const Label: React.FC<{ children: React.ReactNode; color?: string; style?: CSS }> = ({
  children,
  color = C.cyan,
  style,
}) => (
  <div
    style={{
      fontFamily: monoStack,
      fontWeight: 700,
      fontSize: 18,
      lineHeight: 1.2,
      letterSpacing: "0.15em",
      color,
      textTransform: "uppercase",
      ...style,
    }}
  >
    {children}
  </div>
);

const SignalGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 60, color = C.cyan }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path d="M8 24C21 12 43 12 56 24" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M16 33C25 25 39 25 48 33" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <path d="M24 42C28 38 36 38 40 42" stroke={color} strokeWidth="4" strokeLinecap="round" />
    <circle cx="32" cy="51" r="3.5" fill={color} />
  </svg>
);

const ArrowGlyph: React.FC<{ size?: number; color?: string }> = ({ size = 30, color = C.ink }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M6 16H25M17 7L26 16L17 25" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Crosshair: React.FC<{ size?: number }> = ({ size = 58 }) => (
  <svg width={size} height={size} viewBox="0 0 58 58" fill="none" aria-hidden="true">
    <circle cx="29" cy="29" r="18" stroke={C.lime} strokeWidth="1.4" opacity="0.9" />
    <circle cx="29" cy="29" r="4" stroke={C.lime} strokeWidth="1.4" />
    <path d="M29 0V12M29 46V58M0 29H12M46 29H58" stroke={C.lime} strokeWidth="1.4" />
  </svg>
);

const Hud: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const glow = 0.4 + 0.18 * Math.sin(frame / 17);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: portrait ? 58 : 78,
          right: portrait ? 58 : 78,
          top: portrait ? 48 : 42,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: 0.72,
          fontFamily: monoStack,
          fontSize: portrait ? 14 : 13,
          letterSpacing: "0.12em",
          color: "#C4D6DE",
          textTransform: "uppercase",
          zIndex: 30,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 50, background: C.lime, boxShadow: `0 0 18px ${C.lime}`, opacity: glow }} />
          TTZ <span style={{ color: C.cyan }}>//</span> FIELD SIGNAL
        </span>
        <span>GH · 01 / 03</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: portrait ? 58 : 78,
          right: portrait ? 58 : 78,
          bottom: portrait ? 54 : 38,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: 0.46,
          zIndex: 30,
        }}
      >
        <div style={{ width: portrait ? 120 : 168, height: 2, background: "rgba(228,243,247,.15)", overflow: "hidden" }}>
          <div style={{ width: `${Math.max(0, Math.min(100, (frame / 540) * 100))}%`, height: "100%", background: C.cyan, boxShadow: `0 0 14px ${C.cyan}` }} />
        </div>
        <span style={{ fontFamily: monoStack, fontSize: 12, letterSpacing: "0.17em", color: "#D5E4EA" }}>
          SIGNAL · TOOLS · STORIES
        </span>
        <span style={{ marginLeft: "auto", fontFamily: monoStack, fontSize: 12, letterSpacing: "0.12em", color: "#D5E4EA" }}>
          {String(Math.floor(frame / 30)).padStart(2, "0")} / 18
        </span>
      </div>
    </>
  );
};

const Background: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const ringSize = portrait ? 600 : 720;
  const particles = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 83 + frame * (0.2 + (i % 4) * 0.065)) % 100;
    const y = (i * 47 + frame * (0.11 + (i % 5) * 0.038)) % 100;
    const a = 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(frame / 12 + i * 1.7));
    return { x, y, a, size: 2 + (i % 3) };
  });
  const sweep = ((frame % 180) / 180) * 135 - 17;
  return (
    <>
      <AbsoluteFill
        style={{
          backgroundColor: C.ink,
          backgroundImage: `radial-gradient(ellipse at ${portrait ? "50% 39%" : "57% 48%"}, rgba(23,67,91,.36) 0%, rgba(10,22,35,.28) 37%, transparent 68%), radial-gradient(ellipse at ${portrait ? "8% 81%" : "9% 88%"}, rgba(52,217,242,.12) 0%, transparent 38%), linear-gradient(135deg, #06090f 0%, #0a1321 55%, #080d16 100%)`,
        }}
      />
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.42 }}
        aria-hidden="true"
      >
        <defs>
          <pattern id="ttz-grid" width="82" height="82" patternUnits="userSpaceOnUse">
            <path d="M 82 0 L 0 0 0 82" fill="none" stroke="rgba(118,193,215,.10)" strokeWidth="1" />
          </pattern>
          <linearGradient id="ttz-path" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={C.cyan} stopOpacity="0" />
            <stop offset="0.5" stopColor={C.cyan} stopOpacity="0.65" />
            <stop offset="1" stopColor={C.lime} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#ttz-grid)" />
        <path d="M-60 840 C280 640 420 950 760 710 S1260 200 1980 460" fill="none" stroke="url(#ttz-path)" strokeWidth="2" strokeDasharray="5 18" strokeDashoffset={-frame * 1.7} />
        <path d="M-50 260 C260 430 430 160 720 335 S1290 880 1970 650" fill="none" stroke="rgba(255,178,63,.22)" strokeWidth="1.4" strokeDasharray="2 22" strokeDashoffset={frame * 1.2} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: `${sweep}%`,
          top: 0,
          width: portrait ? "18%" : "12%",
          height: "100%",
          transform: "skewX(-18deg)",
          background: "linear-gradient(90deg, transparent, rgba(71,210,232,.035), transparent)",
          pointerEvents: "none",
        }}
      />
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: i % 5 === 0 ? C.lime : C.cyan,
            opacity: p.a,
            boxShadow: `0 0 ${p.size * 5}px ${i % 5 === 0 ? C.lime : C.cyan}`,
          }}
        />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const phase = ((frame + i * 28) % 118) / 118;
        const scale = 0.48 + phase * 1.45;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: portrait ? "50%" : "67%",
              top: portrait ? "44%" : "48%",
              width: ringSize,
              height: ringSize,
              border: `1px solid ${i % 2 === 0 ? "rgba(53,217,242,.23)" : "rgba(197,247,90,.15)"}`,
              borderRadius: "50%",
              transform: `translate(-50%,-50%) scale(${scale})`,
              opacity: (1 - phase) * 0.4,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

const CutFlashes: React.FC<{ frame: number }> = ({ frame }) => {
  const hits = [70, 122, 198, 284, 340];
  return (
    <>
      {hits.map((hit, i) => {
        const d = frame - hit;
        const a = d >= 0 && d <= 7 ? (1 - d / 7) * 0.6 : 0;
        const x = interpolate(frame, [hit - 4, hit + 6], [-30, 115], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: "-15%",
              width: 46,
              height: "130%",
              transform: "skewX(-18deg)",
              background: `linear-gradient(90deg, transparent, rgba(53,217,242,${a}), rgba(197,247,90,${a * 0.62}), transparent)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        );
      })}
    </>
  );
};

const IntroScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 0, 83, 8);
  const k = portrait ? 1 : 1;
  const top = portrait ? "29%" : "30%";
  const left = portrait ? "8%" : "9%";
  const width = portrait ? "84%" : "80%";
  const a = spring({ fps: 30, frame: Math.max(0, frame - 2), config: { damping: 16, mass: 0.65, stiffness: 150 } });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: portrait ? "70%" : "69%", top: portrait ? "37%" : "45%", width: portrait ? 350 : 500, height: portrait ? 350 : 500, borderRadius: "50%", background: `radial-gradient(circle, rgba(53,217,242,.30), rgba(53,217,242,.06) 42%, transparent 71%)`, filter: "blur(4px)", transform: `translate(-50%,-50%) scale(${0.72 + a * 0.42})` }} />
      <div style={{ position: "absolute", left, top, width, transform: `translateY(${rise(frame, 0, 44, 18)}px) scale(${0.94 + 0.06 * a})`, opacity: reveal(frame, 1, 14) }}>
        <Label style={{ marginBottom: 18, color: C.lime }}>Curiosity / powered on</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 112 * k : 120, fontWeight: 700, lineHeight: 0.86, letterSpacing: "-0.075em", color: C.paper, textTransform: "uppercase", textShadow: "0 12px 54px rgba(0,0,0,.38)" }}>
          <span style={{ display: "block" }}>Curiosity</span>
          <span style={{ display: "block", marginTop: 10, color: C.lime, textShadow: `0 0 35px rgba(197,247,90,.22)` }}>isn't a</span>
          <span style={{ display: "block", color: C.paper }}>side quest.</span>
        </div>
        <div style={{ width: portrait ? 172 : 245, height: 5, marginTop: 28, background: `linear-gradient(90deg, ${C.cyan}, ${C.lime}, transparent)`, transformOrigin: "left", transform: `scaleX(${reveal(frame, 25, 20)})`, boxShadow: `0 0 22px rgba(53,217,242,.48)` }} />
      </div>
      <div style={{ position: "absolute", right: portrait ? "8%" : "11%", bottom: portrait ? "19%" : "21%", transform: `rotate(${interpolate(frame, [0, 80], [-8, 3], clamp)}deg)`, opacity: 0.72 }}>
        <SignalGlyph size={portrait ? 72 : 92} color={C.cyan} />
      </div>
      <div style={{ position: "absolute", left: portrait ? "9%" : "10%", bottom: portrait ? "26%" : "24%", fontFamily: monoStack, fontSize: portrait ? 15 : 16, letterSpacing: "0.16em", color: "rgba(216,235,241,.66)", opacity: reveal(frame, 30, 18) }}>
        KEEP LOOKING CLOSER <span style={{ color: C.cyan }}>↗</span>
      </div>
    </div>
  );
};

const ImageCard: React.FC<{
  src: string;
  label: string;
  frame: number;
  start: number;
  portrait: boolean;
  neighborhood?: boolean;
}> = ({ src, label, frame, start, portrait, neighborhood = false }) => {
  const s = spring({ fps: 30, frame: Math.max(0, frame - start), config: { damping: 17, mass: 0.72, stiffness: 115 } });
  const width = portrait ? "84%" : "42%";
  const left = portrait ? "8%" : "53%";
  const top = neighborhood ? (portrait ? "15%" : "17%") : (portrait ? "37%" : "20%" );
  const imageOpacity = reveal(frame, start, 18);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        aspectRatio: "16 / 9",
        borderRadius: portrait ? 24 : 20,
        overflow: "hidden",
        opacity: imageOpacity,
        transform: `perspective(1200px) translateY(${(1 - s) * 50}px) rotateY(${portrait ? 0 : (neighborhood ? 7 : -8)}deg) rotateX(2deg) scale(${0.90 + s * 0.1})`,
        transformOrigin: portrait ? "center center" : (neighborhood ? "left center" : "right center"),
        border: "1px solid rgba(188,238,247,.45)",
        boxShadow: `0 35px 95px rgba(0,0,0,.55), 0 0 35px rgba(53,217,242,.12), inset 0 0 0 1px rgba(255,255,255,.14)`,
        background: C.ink2,
      }}
    >
      {src.startsWith("thaddeus-v3/") ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: neighborhood
              ? `radial-gradient(circle at 65% 35%, rgba(197,247,90,.24), rgba(11,20,34,.96) 70%)`
              : `radial-gradient(circle at 35% 35%, rgba(53,217,242,.28), rgba(11,20,34,.96) 70%)`,
            display: "grid",
            placeItems: "center",
          }}
        >
          <SignalGlyph size={portrait ? 96 : 112} color={neighborhood ? C.lime : C.cyan} />
        </div>
      ) : (
        <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: neighborhood ? "grayscale(.28) contrast(1.12) brightness(1.2)" : "saturate(.9) contrast(1.03)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(4,12,20,.02) 45%, rgba(5,10,17,.76) 100%), linear-gradient(120deg, rgba(53,217,242,.12), transparent 44%, rgba(255,178,63,.08))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "10%", height: 2, opacity: 0.56, background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`, transform: `translateY(${(frame * 5) % 540}px)` }} />
      <div style={{ position: "absolute", left: 22, bottom: 17, right: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Label color={neighborhood ? C.lime : C.amber} style={{ fontSize: portrait ? 13 : 12, letterSpacing: "0.12em" }}>{label}</Label>
        <span style={{ width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", background: C.lime, color: C.ink, fontSize: 16, fontWeight: 700 }}>↗</span>
      </div>
      <div style={{ position: "absolute", top: 14, right: 15, padding: "6px 9px", border: "1px solid rgba(255,255,255,.35)", borderRadius: 3, background: "rgba(3,9,16,.46)", color: "#fff", fontFamily: monoStack, fontSize: 10, letterSpacing: ".13em" }}>TTZ / FIELD CUT</div>
    </div>
  );
};

const WifiScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 73, 140, 10);
  const textY = portrait ? "14%" : "29%";
  const textLeft = portrait ? "8%" : "9%";
  const textWidth = portrait ? "84%" : "40%";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: textLeft, top: textY, width: textWidth, transform: `translateY(${rise(frame, 70, 42, 22)}px)` }}>
        <Label color={C.amber} style={{ marginBottom: 18 }}>01 / Legon field note</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 84 : 98, lineHeight: 0.89, letterSpacing: "-0.075em", fontWeight: 700, color: C.paper, textTransform: "uppercase" }}>
          Follow<br /><span style={{ color: C.cyan }}>the signal.</span>
        </div>
        <div style={{ marginTop: 22, fontFamily: monoStack, fontSize: portrait ? 16 : 15, lineHeight: 1.55, letterSpacing: ".06em", color: "#D1E1E6", maxWidth: 460 }}>
          UNIVERSITY OF GHANA<br />CAMPUS WI-FI · REALITY CHECK
        </div>
      </div>
      <ImageCard src="thaddeus-v3/ug-wifi.jpg" label="UG CAMPUS WI-FI" frame={frame} start={72} portrait={portrait} />
      <div style={{ position: "absolute", left: portrait ? "12%" : "49%", top: portrait ? "69%" : "80%", width: portrait ? "76%" : "45%", height: 1, background: `linear-gradient(90deg, transparent, rgba(53,217,242,.72), transparent)`, opacity: 0.6 }} />
      <div style={{ position: "absolute", right: portrait ? "9%" : "7%", top: portrait ? "30%" : "22%", opacity: 0.7, transform: `rotate(${interpolate(frame, [68, 140], [0, 45], clamp)}deg)` }}><SignalGlyph size={portrait ? 54 : 72} /></div>
    </div>
  );
};

const ToolScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 122, 207, 12);
  const items = [
    { label: "TECH IN THE WILD", num: "01", accent: C.cyan, mark: "⌁" },
    { label: "USEFUL HOW-TOS", num: "02", accent: C.lime, mark: "↗" },
    { label: "TRY IT YOURSELF", num: "03", accent: C.amber, mark: "✳" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: portrait ? "8%" : "9%", top: portrait ? "15%" : "26%", width: portrait ? "84%" : "36%", transform: `translateY(${rise(frame, 124, 45, 18)}px)` }}>
        <Label color={C.lime} style={{ marginBottom: 16 }}>02 / Make it useful</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 77 : 92, fontWeight: 700, lineHeight: 0.91, letterSpacing: "-0.075em", textTransform: "uppercase", color: C.paper }}>
          Unlock<br /><span style={{ color: C.lime }}>the tools.</span>
        </div>
        <div style={{ marginTop: 20, fontFamily: "Inter, Arial, sans-serif", fontSize: portrait ? 21 : 20, lineHeight: 1.4, color: "#B6C6CF", maxWidth: 480 }}>
          Practical tech, explained with a little more curiosity.
        </div>
      </div>
      <div style={{ position: "absolute", left: portrait ? "8%" : "51%", top: portrait ? "48%" : "19%", width: portrait ? "84%" : "41%", height: portrait ? "33%" : "63%", perspective: 1200 }}>
        <div style={{ position: "absolute", inset: "10% 6%", borderRadius: 38, border: "1px solid rgba(53,217,242,.28)", transform: `rotate(${interpolate(frame, [122, 207], [-7, 8], clamp)}deg)`, boxShadow: `0 0 80px rgba(53,217,242,.08), inset 0 0 52px rgba(53,217,242,.035)` }} />
        <div style={{ position: "absolute", left: "48%", top: "48%", width: portrait ? 190 : 222, height: portrait ? 190 : 222, borderRadius: 36, transform: `translate(-50%,-50%) rotate(${interpolate(frame, [122, 207], [13, -8], clamp)}deg)`, background: "linear-gradient(145deg, rgba(22,48,62,.98), rgba(10,20,31,.98))", border: "1px solid rgba(53,217,242,.52)", boxShadow: "0 22px 76px rgba(0,0,0,.50), 0 0 38px rgba(53,217,242,.12)", display: "grid", placeItems: "center" }}>
          <div style={{ width: "58%", height: "70%", borderRadius: 19, border: "2px solid rgba(231,247,247,.82)", position: "relative", display: "grid", placeItems: "center", background: "linear-gradient(160deg,rgba(53,217,242,.12),rgba(197,247,90,.035))" }}>
            <SignalGlyph size={portrait ? 70 : 82} color={C.lime} />
            <div style={{ position: "absolute", bottom: 14, left: 13, right: 13, height: 4, borderRadius: 5, background: "rgba(230,244,245,.35)" }} />
          </div>
        </div>
        {items.map((item, i) => {
          const t = reveal(frame, 128 + i * 8, 17);
          const cardW = portrait ? "43%" : "45%";
          const positions = portrait
            ? [
                { left: "0%", top: "2%", rotate: -7 },
                { right: "0%", top: "4%", rotate: 7 },
                { left: "26%", bottom: "0%", rotate: -4 },
              ]
            : [
                { left: "0%", top: "5%", rotate: -7 },
                { right: "0%", top: "7%", rotate: 6 },
                { left: "22%", bottom: "2%", rotate: -3 },
              ];
          const pos = positions[i];
          return (
            <div
              key={item.num}
              style={{
                position: "absolute",
                width: cardW,
                height: portrait ? 116 : 132,
                ...(pos.left ? { left: pos.left } : {}),
                ...(pos.right ? { right: pos.right } : {}),
                ...(pos.top ? { top: pos.top } : {}),
                ...(pos.bottom ? { bottom: pos.bottom } : {}),
                border: `1px solid ${item.accent}66`,
                borderRadius: 18,
                background: "linear-gradient(140deg, rgba(14,28,42,.96), rgba(8,15,24,.92))",
                boxShadow: `0 19px 55px rgba(0,0,0,.43), 0 0 24px ${item.accent}22`,
                padding: portrait ? "17px 16px" : "18px 20px",
                boxSizing: "border-box",
                transform: `translateY(${(1 - t) * 36}px) rotate(${pos.rotate}deg) scale(${0.94 + t * 0.06})`,
                opacity: t,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Label color={item.accent} style={{ fontSize: portrait ? 11 : 11, letterSpacing: ".12em" }}>{item.num} / SIGNAL KIT</Label>
                <span style={{ color: item.accent, fontFamily: fontStack, fontSize: portrait ? 28 : 34, lineHeight: 0.8 }}>{item.mark}</span>
              </div>
              <div style={{ position: "absolute", bottom: portrait ? 16 : 17, left: portrait ? 16 : 20, right: portrait ? 16 : 20, fontFamily: fontStack, fontWeight: 700, fontSize: portrait ? 18 : 21, letterSpacing: "-.03em", color: C.paper, textTransform: "uppercase" }}>{item.label}</div>
              <div style={{ position: "absolute", right: 16, bottom: 17, width: 5, height: 5, borderRadius: "50%", background: item.accent, boxShadow: `0 0 16px ${item.accent}` }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: portrait ? "8%" : "10%", bottom: portrait ? "12%" : "17%", fontFamily: monoStack, fontSize: 13, letterSpacing: ".18em", color: "rgba(213,229,233,.54)" }}>
        SCAN · LEARN · GO AGAIN
      </div>
    </div>
  );
};

const NeighborhoodScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 198, 293, 12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "8%", top: portrait ? "68%" : "31%", width: portrait ? "84%" : "38%", transform: `translateY(${rise(frame, 201, 45, 20)}px)` }}>
        <Label color={C.lime} style={{ marginBottom: 17 }}>03 / The neighbourhood</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 72 : 82, fontWeight: 700, lineHeight: 0.90, letterSpacing: "-0.075em", textTransform: "uppercase", color: C.paper }}>
          Stories<br />hide in<br /><span style={{ color: C.lime }}>plain sight.</span>
        </div>
        <div style={{ marginTop: 18, fontFamily: monoStack, fontSize: portrait ? 14 : 13, letterSpacing: ".13em", color: "#B0C2CA" }}>LOOK AGAIN. THE MOMENT IS ALREADY HERE.</div>
      </div>
      <ImageCard src="thaddeus-v3/neighbourhood.jpg" label="NEIGHBOURHOOD MOMENT" frame={frame} start={200} portrait={portrait} neighborhood />
      <div style={{ position: "absolute", left: portrait ? "49%" : "76%", top: portrait ? "39%" : "48%", transform: `translate(-50%,-50%) scale(${0.8 + 0.15 * Math.sin(frame / 8)})`, opacity: 0.9 }}><Crosshair size={portrait ? 54 : 72} /></div>
      <div style={{ position: "absolute", left: portrait ? "14%" : "57%", top: portrait ? "15%" : "15%", fontFamily: monoStack, fontSize: 12, letterSpacing: ".18em", color: "rgba(220,236,239,.64)" }}>REC · LOCAL FREQUENCY</div>
    </div>
  );
};

const BrandScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 281, 357, 12);
  const t = spring({ fps: 30, frame: Math.max(0, frame - 282), config: { damping: 14, mass: 0.6, stiffness: 120 } });
  const rotate = interpolate(frame, [282, 344], [9, 0], clamp);
  const left = portrait ? "8%" : "10%";
  const top = portrait ? "34%" : "34%";
  const width = portrait ? "84%" : "80%";
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "50%", top: portrait ? "45%" : "50%", width: portrait ? 740 : 900, height: portrait ? 740 : 900, border: "1px solid rgba(53,217,242,.26)", borderRadius: "50%", transform: `translate(-50%,-50%) rotate(${frame * 0.32}deg) scale(${0.58 + t * 0.46})`, boxShadow: "0 0 100px rgba(53,217,242,.08), inset 0 0 80px rgba(53,217,242,.03)" }}>
        <div style={{ position: "absolute", left: "-6%", top: "48%", width: "112%", height: 1, background: `linear-gradient(90deg, transparent, ${C.cyan}, ${C.lime}, transparent)`, opacity: 0.65 }} />
      </div>
      <div style={{ position: "absolute", left, top, width, textAlign: portrait ? "center" : "left", transform: `perspective(1200px) translateY(${(1 - t) * 58}px) rotateX(${rotate}deg) scale(${0.91 + t * 0.09})`, transformOrigin: "center center" }}>
        <Label color={C.amber} style={{ marginBottom: 16, textAlign: portrait ? "center" : "left" }}>This is</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 113 : 150, fontWeight: 700, letterSpacing: "-0.085em", lineHeight: 0.8, color: C.paper, textTransform: "uppercase", textShadow: "0 13px 55px rgba(0,0,0,.6), 0 0 38px rgba(53,217,242,.15)" }}>
          Thaddeus
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: portrait ? "center" : "flex-start", gap: 18, marginTop: 16 }}>
          <div style={{ height: 5, width: portrait ? 93 : 140, background: C.lime, boxShadow: `0 0 24px ${C.lime}` }} />
          <div style={{ fontFamily: fontStack, fontSize: portrait ? 75 : 94, fontWeight: 700, letterSpacing: "-0.06em", lineHeight: 0.86, color: C.cyan, textTransform: "uppercase", textShadow: `0 0 34px rgba(53,217,242,.26)` }}>Techz</div>
        </div>
      </div>
      <div style={{ position: "absolute", right: portrait ? "12%" : "12%", top: portrait ? "21%" : "22%", fontFamily: monoStack, fontSize: 12, letterSpacing: ".2em", color: "rgba(232,244,242,.56)", transform: `rotate(${Math.sin(frame / 10) * 3}deg)` }}>NO STATIC. JUST SIGNAL.</div>
    </div>
  );
};

const OutroScene: React.FC<{ frame: number; portrait: boolean }> = ({ frame, portrait }) => {
  const alpha = fadeWindow(frame, 340, 540, 16);
  const pulse = 1 + Math.sin(frame / 8) * 0.045;
  const logoW = portrait ? "84%" : "44%";
  const logoLeft = portrait ? "8%" : "8%";
  const logoTop = portrait ? "23%" : "37%";
  const copyLeft = portrait ? "8%" : "55%";
  const copyTop = portrait ? "54%" : "37%";
  const copyWidth = portrait ? "84%" : "38%";
  const ctaReveal = reveal(frame, 380, 22);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: alpha, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: "50%", top: portrait ? "39%" : "50%", width: portrait ? 780 : 1120, height: portrait ? 780 : 1120, transform: `translate(-50%,-50%) scale(${0.78 + 0.04 * Math.sin(frame / 17)})`, borderRadius: "50%", border: "1px solid rgba(53,217,242,.19)", boxShadow: "0 0 120px rgba(53,217,242,.08), inset 0 0 100px rgba(53,217,242,.025)" }} />
      <div style={{ position: "absolute", left: logoLeft, top: logoTop, width: logoW, transform: `scale(${0.96 + (pulse - 1) * 0.6})` }}>
        <div style={{ fontFamily: fontStack, fontWeight: 700, fontSize: portrait ? 86 : 102, letterSpacing: "-0.085em", lineHeight: 0.84, color: C.paper, textTransform: "uppercase", textShadow: "0 12px 60px rgba(0,0,0,.5)" }}>Thaddeus</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 11 }}>
          <div style={{ width: portrait ? 68 : 102, height: 4, background: C.lime, boxShadow: `0 0 18px ${C.lime}` }} />
          <div style={{ fontFamily: fontStack, fontWeight: 700, fontSize: portrait ? 58 : 70, letterSpacing: "-.055em", lineHeight: 0.9, color: C.cyan, textTransform: "uppercase" }}>Techz</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: copyLeft, top: copyTop, width: copyWidth, opacity: reveal(frame, 349, 20), transform: `translateY(${rise(frame, 350, 36, 20)}px)` }}>
        <Label color={C.amber} style={{ marginBottom: 17 }}>Signal received. Your move.</Label>
        <div style={{ fontFamily: fontStack, fontSize: portrait ? 53 : 57, fontWeight: 700, lineHeight: 0.99, letterSpacing: "-.06em", color: C.paper, textTransform: "uppercase" }}>
          Come curious.<br /><span style={{ color: C.lime }}>Leave smarter.</span>
        </div>
        <div style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 12, padding: portrait ? "13px 20px" : "14px 21px", background: C.coral, borderRadius: 6, color: "#fff", fontFamily: fontStack, fontSize: portrait ? 17 : 17, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", boxShadow: `0 0 35px rgba(255,91,83,.32)`, transform: `scale(${1 + (pulse - 1) * 0.55})`, opacity: ctaReveal }}>
          <span style={{ width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderLeft: "12px solid white" }} />
          Join us · Subscribe
        </div>
      </div>
      <div style={{ position: "absolute", right: portrait ? "9%" : "11%", top: portrait ? "20%" : "25%", transform: `rotate(${frame * 0.55}deg)`, opacity: 0.78 }}><SignalGlyph size={portrait ? 54 : 67} color={C.lime} /></div>
    </div>
  );
};

export const ThaddeusTechzPromo: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill style={{ overflow: "hidden", color: C.paper, fontFamily: fontStack, backgroundColor: C.ink }}>
      <Background frame={frame} portrait={portrait} />
      <Hud frame={frame} portrait={portrait} />
      <IntroScene frame={frame} portrait={portrait} />
      <WifiScene frame={frame} portrait={portrait} />
      <ToolScene frame={frame} portrait={portrait} />
      <NeighborhoodScene frame={frame} portrait={portrait} />
      <BrandScene frame={frame} portrait={portrait} />
      <OutroScene frame={frame} portrait={portrait} />
      <CutFlashes frame={frame} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.055, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.11) 0px, rgba(255,255,255,.11) 1px, transparent 1px, transparent 5px)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: portrait ? 22 : 25, border: "1px solid rgba(177,220,229,.10)", borderRadius: 5, pointerEvents: "none", zIndex: 40 }} />
      <div style={{ position: "absolute", top: portrait ? 22 : 25, left: portrait ? 22 : 25, width: portrait ? 56 : 70, height: portrait ? 56 : 70, borderTop: `2px solid ${C.cyan}`, borderLeft: `2px solid ${C.cyan}`, opacity: 0.42, pointerEvents: "none", zIndex: 41 }} />
      <div style={{ position: "absolute", right: portrait ? 22 : 25, bottom: portrait ? 22 : 25, width: portrait ? 56 : 70, height: portrait ? 56 : 70, borderBottom: `2px solid ${C.lime}`, borderRight: `2px solid ${C.lime}`, opacity: 0.42, pointerEvents: "none", zIndex: 41 }} />
    </AbsoluteFill>
  );
};
