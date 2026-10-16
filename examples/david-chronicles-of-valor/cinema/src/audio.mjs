// audio.mjs — original deterministic score and foley for DAVID: THE CHRONICLES OF VALOR.
//
// The cue sheet is derived from the film's own event map (src/shots.js + shots-act3.js), so
// every blade hit, shockwave and thunderclap lands on the frame the picture fires it. No
// sampled or licensed music: everything is synthesised here from oscillators and noise.
//
//   node src/audio.mjs            -> out/score.wav (48 kHz, 16-bit stereo, 180 s)
import { createWriteStream, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SHOTS, FPS, DURATION } from './shots.js';
import './shots-act3.js';
import { mulberry32, clamp } from './util.js';

const TAU = Math.PI * 2;
const SR = 48000;
const SAMPLES = SR * DURATION;              // 8,640,000 per channel
const ROOT = dirname(fileURLToPath(import.meta.url));
export const SCORE_SEED = 509173;

// ---------------------------------------------------------------- synthesis core

export function synthesize() {
  const L = new Float32Array(SAMPLES), R = new Float32Array(SAMPLES);
  const rnd = mulberry32(SCORE_SEED);
  const put = (i, v, pan = 0) => {
    if (i < 0 || i >= SAMPLES) return;
    const l = Math.sqrt((1 - pan) / 2), r = Math.sqrt((1 + pan) / 2);
    L[i] += v * l; R[i] += v * r;
  };

  // --- voices
  const note = (start, dur, midi, amp, kind = 'string', pan = 0) => {
    const begin = Math.round(start * SR), n = Math.round(dur * SR);
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const attack = kind === 'pluck' ? 0.008 : kind === 'horn' ? 0.25 : kind === 'choir' ? 0.9 : 0.7;
    const release = kind === 'pluck' ? 0.18 : 0.9;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const env = clamp(t / attack) * clamp((dur - t) / Math.min(release, dur * 0.5));
      const phase = TAU * f * t + 0.012 * Math.sin(TAU * 4.7 * t) + 0.008 * Math.sin(TAU * 0.9 * t);
      let v;
      if (kind === 'pluck') v = (Math.sin(phase) + 0.34 * Math.sin(phase * 2) + 0.16 * Math.sin(phase * 3)) * Math.exp(-t * 4.2);
      else if (kind === 'horn') v = Math.sin(phase) + 0.28 * Math.sin(phase * 2) + 0.16 * Math.sin(phase * 3) + 0.08 * Math.sin(phase * 4);
      else if (kind === 'choir') v = (Math.sin(phase) + 0.42 * Math.sin(phase * 2 + 0.4) + 0.22 * Math.sin(phase * 3 + 0.9) + 0.1 * Math.sin(phase * 5)) / 1.6;
      else v = (Math.sin(phase) + 0.36 * Math.sin(phase * 2 + 0.03) + 0.18 * Math.sin(phase * 3) + 0.12 * Math.sin(phase * 1.0027)) / 1.4;
      // gentle stereo movement so the pad breathes
      const p = pan + 0.12 * Math.sin(TAU * 0.07 * t + midi);
      put(begin + k, v * amp * env, clamp(p, -1, 1));
    }
  };

  // low drum: taiko-ish body with a filtered noise transient
  const drum = (start, amp, pan = 0, low = true) => {
    const begin = Math.round(start * SR);
    const dur = low ? 0.9 : 0.26;
    const n = Math.round(dur * SR);
    let phase = 0, lp = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      phase += TAU * (low ? 46 + 44 * Math.exp(-t * 20) : 120 + 90 * Math.exp(-t * 34)) / SR;
      lp = 0.82 * lp + 0.18 * (rnd() * 2 - 1);
      const v = Math.sin(phase) * Math.exp(-t * (low ? 4.6 : 16)) + 0.34 * lp * Math.exp(-t * 26);
      put(begin + k, amp * v * clamp(t / 0.002), pan);
    }
  };

  // steel: inharmonic metallic strike (blades, pauldron, shield)
  const metal = (start, amp, pan = 0, bright = 1) => {
    const begin = Math.round(start * SR);
    const n = Math.round(0.95 * SR);
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const v = (Math.sin(TAU * 1439 * t) + 0.55 * Math.sin(TAU * 2393 * t + 0.3) + 0.26 * Math.sin(TAU * (3831 * bright) * t)
        + 0.18 * Math.sin(TAU * 5171 * t)) * Math.exp(-t * 13)
        + (rnd() * 2 - 1) * 0.32 * Math.exp(-t * 70);
      put(begin + k, amp * v * clamp(t / 0.0012), pan);
    }
  };

  const thunder = (start, amp = 0.5) => {
    const begin = Math.round(start * SR);
    const n = Math.round(4.2 * SR);
    let lp = 0, hp = 0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      const raw = (rnd() * 2 - 1);
      lp = 0.991 * lp + 0.009 * raw;              // rumble
      hp = 0.7 * hp + 0.3 * raw;                  // crack
      const env = Math.exp(-t * (t < 0.9 ? 0.7 : 1.5));
      const v = lp * 3.2 * env + hp * 0.22 * Math.exp(-t * 9);
      put(begin + k, amp * v, 0.15 * Math.sin(t * 0.5));
    }
  };

  // continuous beds: wind through the whole film, rain through the storm
  const wind = new Float32Array(SAMPLES), rain = new Float32Array(SAMPLES);
  let lpA = 0, lpB = 0, lpC = 0, lpD = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const t = i / SR;
    const raw = rnd() * 2 - 1;
    lpA = 0.9992 * lpA + 0.0008 * raw;
    lpB = 0.9986 * lpB + 0.0014 * raw;
    lpC = 0.86 * lpC + 0.14 * raw;
    lpD = 0.62 * lpD + 0.38 * raw;
    const gust = 0.55 + 0.45 * Math.sin(TAU * 0.037 * t + 1.2) * Math.sin(TAU * 0.011 * t);
    const windAmt = (0.30 + 0.55 * clamp((t - 95) / 35)) * (t > 168 ? clamp(1 - (t - 168) / 8) : 1);
    wind[i] = (lpA * 6.5 + lpB * 3.0) * gust * windAmt;
    const rainAmt = t > 108 ? clamp((t - 108) / 7) * (t > 165 ? clamp(1 - (t - 165) / 6) : 1) : 0;
    rain[i] = (lpC * 2.2 + lpD * 0.9) * rainAmt * 0.55;
  }
  for (let i = 0; i < SAMPLES; i++) { L[i] += wind[i] * 0.9 + rain[i]; R[i] += wind[i] * 0.9 + rain[i] * 0.92; }

  // ---------------------------------------------------------------- cue sheet
  const impacts = [];
  const metalAt = [], drumAt = [], thunderAt = [];
  for (const s of SHOTS) {
    for (const e of s.events) {
      if (e.type === 'sparks' || e.type === 'shieldShatter' || e.type === 'pauldron' || e.type === 'bowBreak') {
        metalAt.push({ t: e.t, amp: e.type === 'pauldron' ? 0.30 : e.type === 'shieldShatter' ? 0.24 : 0.16, bright: e.type === 'bowBreak' ? 1.25 : 1 });
      } else if (e.type === 'shockwave' || e.type === 'swordPlant') {
        drumAt.push({ t: e.t, amp: e.type === 'shockwave' ? 0.46 : 0.24, low: true });
      } else if (e.type === 'javelin' || e.type === 'bowBreak') {
        drumAt.push({ t: e.t, amp: 0.2, low: false });
      } else if (e.type === 'lightning') {
        thunderAt.push({ t: e.t + 0.8, amp: 0.42 });
      }
    }
  }

  // --- percussion bed: a pulse that builds with the drama
  const pulseFrom = 8, pulseTo = 172;
  for (let t = pulseFrom; t < pulseTo; t += 1.5) {
    const build = clamp((t - 8) / 60) * 0.5 + clamp((t - 100) / 40) * 0.6;
    const amp = 0.06 + build * 0.12;
    drum(t, amp, -0.1 + 0.2 * ((t % 3) / 3), true);
    if (t > 20) drum(t + 0.75, amp * 0.5, 0.2, false);
    if (t > 110) { drum(t + 0.375, amp * 0.42, -0.25, false); drum(t + 1.125, amp * 0.34, 0.25, false); }
  }
  for (const d of drumAt) drum(d.t, d.amp, 0.05 * Math.sin(d.t), d.low);
  for (const m of metalAt) metal(m.t, m.amp, -0.3 + 0.6 * ((m.t * 7) % 1), m.bright);
  for (const th of thunderAt) thunder(th.t, th.amp);

  // --- score: D minor with Dorian colour, resolving to D major for the victory
  const N = { D2: 38, A2: 45, D3: 50, F3: 53, G3: 55, A3: 57, Bb3: 58, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71, C5: 72, D5: 74 };
  const act = (from, to, notes, amp, kind, step) => {
    for (let t = from; t < to; t += step) {
      for (const n of notes) note(t, Math.min(step * 1.6, to - t), n, amp, kind, 0.25 * Math.sin(t * 0.3 + n));
    }
  };
  // Act I-II: sparse drone and low pulse
  for (let t = 0; t < 30; t += 6) note(t, 7, N.D2, 0.10, 'string', -0.2), note(t + 0.2, 7, N.A2, 0.07, 'string', 0.2);
  act(2, 30, [N.D3, N.F3], 0.035, 'string', 4);
  // Josheb, Eleazar, Shammah: rising martial statement, still minor
  for (let t = 30; t < 70; t += 5) { note(t, 5.4, N.D3, 0.075, 'horn', -0.12); note(t, 5.4, N.A3, 0.06, 'horn', 0.12); }
  act(30, 70, [N.F4, N.E4, N.D4], 0.03, 'pluck', 1.5);
  // Chariot and the airborne act: urgent, faster harmonic rhythm
  for (let t = 70; t < 100; t += 2.5) {
    note(t, 2.8, N.D3, 0.08, 'horn', -0.15);
    note(t, 2.8, N.G3, 0.055, 'horn', 0.15);
    note(t + 1.25, 1.4, N.A3, 0.05, 'horn', 0.05);
  }
  act(70, 100, [N.D5, N.C5, N.A4], 0.028, 'pluck', 0.75);
  // The storm: dark sustained cluster with tremolo
  for (let t = 100; t < 155; t += 4) {
    note(t, 4.4, N.D2, 0.13, 'string', -0.25);
    note(t, 4.4, N.Bb3, 0.05, 'string', 0.25);
    note(t + 0.5, 3.4, N.F3, 0.045, 'string', 0.1);
  }
  act(100, 155, [N.D4, N.F4, N.A4], 0.03, 'string', 2);
  // The climax exchange: tighten with 1.25 s harmonic pushes
  for (let t = 125, i = 0; t < 155; t += 1.25, i++) {
    const seq = [N.D3, N.F3, N.A3, N.C4];
    note(t, 1.35, seq[i % 4], 0.07, 'horn', -0.1 + 0.2 * ((i % 3) / 2));
  }
  // Victory: D major (F# replaces F), warm and open
  for (let t = 155; t < 176; t += 6) {
    note(t, 6.6, N.D2, 0.12, 'string', -0.2);
    note(t, 6.6, N.D3, 0.08, 'string', 0.2);
    note(t + 0.3, 6.0, 66 /* F#4 */, 0.05, 'choir', 0.1);       // F#4 = major third
    note(t + 0.6, 5.6, 69 /* A4 */, 0.045, 'choir', -0.1);
    note(t + 1.0, 5.0, 74 /* D5 */, 0.04, 'choir', 0.15);
  }
  // Title: a single decisive metal strike under the chisel, then the tail fades
  metal(175.4, 0.34, 0, 1.2);
  drum(175.4, 0.3, 0, true);
  for (let t = 175.5; t < 179.4; t += 4) note(t, 4.4, N.D2, 0.13, 'string', 0);
  // overall fade-out over the last 1.5 s (the picture fades to black from 178.0)
  for (let i = Math.round(178.0 * SR); i < SAMPLES; i++) {
    const k = clamp((SAMPLES - i) / (1.75 * SR));
    L[i] *= k; R[i] *= k;
  }

  // ---------------------------------------------------------------- master bus
  // soft saturation, DC removal and a gentle limiter
  let dcL = 0, dcR = 0;
  const outL = new Float32Array(SAMPLES), outR = new Float32Array(SAMPLES);
  let lpY = 0, lpX = 0;
  for (let i = 0; i < SAMPLES; i++) {
    dcL = 0.99995 * dcL + 0.00005 * L[i];
    dcR = 0.99995 * dcR + 0.00005 * R[i];
    let l = L[i] - dcL, r = R[i] - dcR;
    // one-pole tilt for air
    lpX = 0.86 * lpX + 0.14 * l;
    l = l * 0.94 + (l - lpX) * 0.10;
    l = Math.tanh(l * 1.12) * 0.92;
    r = Math.tanh(r * 1.12) * 0.92;
    outL[i] = l; outR[i] = r;
  }
  return { L: outL, R: outR };
}

// ---------------------------------------------------------------- wav writer

export function writeWav(file, L, R) {
  const channels = 2, bits = 16;
  const dataBytes = L.length * channels * (bits / 8);
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * channels * (bits / 8), 28);
  buf.writeUInt16LE(channels * (bits / 8), 32);
  buf.writeUInt16LE(bits, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  let o = 44;
  for (let i = 0; i < L.length; i++) {
    const l = Math.max(-1, Math.min(1, L[i])), r = Math.max(-1, Math.min(1, R[i]));
    buf.writeInt16LE(Math.round(l * 32767), o); o += 2;
    buf.writeInt16LE(Math.round(r * 32767), o); o += 2;
  }
  mkdirSync(dirname(file), { recursive: true });
  const s = createWriteStream(file);
  s.write(buf);
  s.end();
  return new Promise(res => s.on('finish', res));
}

export async function main() {
  const t0 = Date.now();
  const { L, R } = synthesize();
  let peak = 0, sum = 0;
  for (let i = 0; i < L.length; i++) {
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    sum += L[i] * L[i] + R[i] * R[i];
  }
  const rms = Math.sqrt(sum / (L.length * 2));
  const db = v => (v <= 0 ? -Infinity : 20 * Math.log10(v));
  const file = join(ROOT, '..', 'out', 'score.wav');
  await writeWav(file, L, R);
  const report = {
    file: 'out/score.wav', sampleRate: SR, channels: 2, bits: 16,
    durationSeconds: DURATION, samplesPerChannel: L.length,
    seed: SCORE_SEED, peak: +peak.toFixed(6), peakDbFS: +db(peak).toFixed(2),
    rms: +rms.toFixed(6), rmsDbFS: +db(rms).toFixed(2),
    metalCues: metalAtCount(), drumCues: drumAtCount(), thunderCues: thunderCount(),
    generatedMs: Date.now() - t0,
  };
  function metalAtCount() { let n = 0; for (const s of SHOTS) for (const e of s.events) if (['sparks', 'shieldShatter', 'pauldron', 'bowBreak'].includes(e.type)) n++; return n; }
  function drumAtCount() { let n = 0; for (const s of SHOTS) for (const e of s.events) if (['shockwave', 'swordPlant', 'javelin'].includes(e.type)) n++; return n; }
  function thunderCount() { let n = 0; for (const s of SHOTS) for (const e of s.events) if (e.type === 'lightning') n++; return n; }
  const { writeFileSync } = await import('node:fs');
  writeFileSync(join(ROOT, '..', 'out', 'audio-report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(JSON.stringify(report));
}

if (process.argv[1] && process.argv[1].endsWith('audio.mjs')) main();
