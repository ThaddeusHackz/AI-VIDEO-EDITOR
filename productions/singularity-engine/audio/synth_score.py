#!/usr/bin/env python3
"""synth_score.py — procedural score + sound design for The Singularity Engine.

Every sound is synthesized here (numpy/scipy/pedalboard), seeded, and placed on an integer 60 fps frame read from
remotion/src/singularity/timeline.json (cuts, schedules, events) and vo-words.json (word-derived events).
"Data drives both picture and sound": the same frame lists animate the picture in Remotion.

Writes 48 kHz stereo float stems to productions/singularity-engine/audio/build/stems/:
  music.wav    cello ensemble + synth brass swell, ostinato, D-major resolution pad
  pulse.wav    ticking clock pulse (8ths -> 16ths)
  sfx.wav      sub-drop, clangs, breath, hum, slice/snap, UI clicks, glass, whooshes, impacts, arcs, snaps, pulse-out
  ambience.wav riser, rain tail, liquid-metal bed
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import soundfile as sf
from pedalboard import Bitcrush, Distortion, Pedalboard, Reverb
from scipy.signal import butter, fftconvolve, sosfilt, sosfiltfilt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TL = json.loads((ROOT / "remotion/src/singularity/timeline.json").read_text())
WORDS = json.loads((ROOT / "remotion/src/singularity/vo-words.json").read_text())
STEMS = HERE / "build" / "stems"

SR = 48000
FPS = TL["fps"]
DUR = TL["durationInFrames"] / FPS
N = int(DUR * SR)
BEAT = 60.0 / TL["bpm"]  # 0.6 s


def f2s(frame: int) -> float:
    return frame / FPS


def tvec(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR)) / SR


def rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def sos(kind: str, f, order: int = 4):
    return butter(order, f, btype=kind, fs=SR, output="sos")


def lp(x, f, order=4):
    return sosfilt(sos("lowpass", f, order), x)


def hp(x, f, order=4):
    return sosfilt(sos("highpass", f, order), x)


def bp(x, lo, hi, order=3):
    return sosfilt(sos("bandpass", [lo, hi], order), x)


def norm(x):
    return x / (np.max(np.abs(x)) + 1e-12)


def db(v):
    return 10 ** (v / 20)


def mix(*parts):
    """Sum mono signals of different lengths (zero-padded to the longest)."""
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


class Bus:
    def __init__(self) -> None:
        self.buf = np.zeros((2, N))

    def add(self, x: np.ndarray, at: float, gain_db: float = 0.0, pan: float = 0.0) -> None:
        """Mono (n,) or stereo (2,n) signal at `at` seconds; equal-power pan in [-1, 1]."""
        g = db(gain_db)
        if x.ndim == 1:
            th = (pan + 1) * np.pi / 4
            x = np.stack([x * np.cos(th), x * np.sin(th)])
        i0 = int(round(at * SR))
        if i0 >= N:
            return
        if i0 < 0:
            x = x[:, -i0:]
            i0 = 0
        n = min(x.shape[1], N - i0)
        self.buf[:, i0:i0 + n] += g * x[:, :n]

    def add_pan_sweep(self, x: np.ndarray, at: float, gain_db: float, pan_from: float, pan_to: float) -> None:
        p = np.linspace(pan_from, pan_to, len(x))
        th = (p + 1) * np.pi / 4
        self.add(np.stack([x * np.cos(th), x * np.sin(th)]), at, gain_db)


def ir(seconds: float, decay: float, lowpass_hz: float, seed: int) -> np.ndarray:
    t = tvec(seconds)
    r = rng(seed)
    out = []
    for ch in range(2):
        n = r.standard_normal(len(t)) * np.exp(-t / decay)
        n = lp(n, lowpass_hz, 2)
        n[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        out.append(n / np.sqrt(np.sum(n ** 2)))
    return np.stack(out)


def convolve_stereo(x: np.ndarray, h: np.ndarray, wet: float) -> np.ndarray:
    if x.ndim == 1:
        x = np.stack([x, x])
    y = np.stack([fftconvolve(x[c], h[c])[: x.shape[1]] for c in range(2)])
    return (1 - wet) * x + wet * y * 3.0


# ───────────────────────────── instruments ─────────────────────────────


def modal(freqs, decays, amps, seconds, seed, strike_hp=2500.0):
    t = tvec(seconds)
    r = rng(seed)
    y = np.zeros_like(t)
    for f, d, a in zip(freqs, decays, amps):
        y += a * np.sin(2 * np.pi * f * t + r.uniform(0, 2 * np.pi)) * np.exp(-t / d)
    strike = hp(r.standard_normal(len(t)), strike_hp) * np.exp(-t / 0.004) * 0.6
    return y + strike


def clang(f0: float, seed: int, seconds: float = 3.5):
    ratios = np.array([1.0, 2.756, 5.404, 8.933, 13.344, 1.53, 3.92])
    decays = np.array([2.2, 1.4, 0.9, 0.55, 0.35, 1.8, 1.1])
    amps = np.array([1.0, 0.7, 0.45, 0.3, 0.18, 0.4, 0.3])
    return modal(f0 * ratios, decays, amps, seconds, seed)


def sub_hit(f_start: float, f_end: float, tau: float, seconds: float, drive: float = 1.6):
    t = tvec(seconds)
    f = f_end + (f_start - f_end) * np.exp(-t / (tau * 0.5))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(1, t / 0.004) * np.exp(-t / tau)
    return np.tanh(drive * np.sin(ph)) * env / np.tanh(drive)


def noise_burst(seconds: float, tau: float, seed: int, lo=None, hi=None):
    t = tvec(seconds)
    n = rng(seed).standard_normal(len(t)) * np.exp(-t / tau)
    if lo and hi:
        n = bp(n, lo, hi)
    elif lo:
        n = hp(n, lo)
    elif hi:
        n = lp(n, hi)
    return n


def impact(seed: int, big: bool = False):
    s = 2.6 if big else 1.6
    y = 1.0 * sub_hit(70 if big else 62, 32, 0.55 if big else 0.38, s)
    y += 0.55 * norm(noise_burst(s, 0.018, seed, lo=1800))
    y += 0.45 * norm(noise_burst(s, 0.14, seed + 1, lo=120, hi=700))
    if big:
        y += 0.35 * norm(clang(73.4, seed + 2, s)) * np.exp(-tvec(s) / 0.9)
    return norm(y)


def whoosh(seconds: float, seed: int, f_lo=180.0, f_hi=5200.0, rising=True):
    """Filtered-noise whoosh peaking at its end (lands ON the cut)."""
    t = tvec(seconds)
    n = rng(seed).standard_normal(len(t))
    x = t / seconds
    centre = f_lo * (f_hi / f_lo) ** (x if rising else 1 - x)
    out = np.zeros_like(t)
    hop = 512
    for i in range(0, len(t), hop):
        c = centre[min(i + hop // 2, len(t) - 1)]
        seg = n[max(0, i - 2048): i + hop]
        y = bp(seg, max(40, c * 0.6), min(SR / 2 - 100, c * 1.6), 2)
        out[i:i + hop] = y[-hop:][: len(out[i:i + hop])]
    env = x ** 2.2 * (1 - np.exp(-(1 - x + 1e-4) * 60))
    return norm(out * env)


def click(seed: int, pitch: float = 5200.0, body: float = 0.0):
    t = tvec(0.06)
    r = rng(seed)
    blip = np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.0035)
    tick = hp(r.standard_normal(len(t)), 3000) * np.exp(-t / 0.0012) * 0.7
    thump = np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.012) * body
    return norm(blip + tick + thump)


def fold(seed: int):
    t = tvec(0.12)
    paper = bp(rng(seed).standard_normal(len(t)), 1400, 4800) * np.exp(-t / 0.018)
    glass = np.sin(2 * np.pi * 3100 * t) * np.exp(-t / 0.03) * 0.35
    return norm(paper + glass)


def karplus(f0: float, seconds: float, seed: int, damp: float = 0.996):
    n = int(seconds * SR)
    period = int(SR / f0)
    buf = rng(seed).uniform(-1, 1, period)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = damp * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    return out


def saw_voice(freq: float, seconds: float, seed: int, vib_rate=5.2, vib_depth=0.006, detune_cents=0.0):
    t = tvec(seconds)
    r = rng(seed)
    vib = 1 + vib_depth * np.minimum(1, t / 1.2) * np.sin(2 * np.pi * vib_rate * t + r.uniform(0, 6.28))
    f = freq * 2 ** (detune_cents / 1200) * vib
    ph = np.cumsum(f) / SR + r.uniform(0, 1)
    return 2 * (ph % 1.0) - 1


def cello_chord(notes_hz, seconds: float, seed: int, cutoff_curve, attack=0.7, release=0.6):
    t = tvec(seconds)
    y = np.zeros_like(t)
    for k, f in enumerate(notes_hz):
        for d, dc in enumerate((-7.0, 0.0, 6.0)):
            y += saw_voice(f, seconds, seed + 31 * k + d, detune_cents=dc) * (0.9 if d == 1 else 0.6)
    # time-varying lowpass via block processing
    out = np.zeros_like(y)
    hop = 2048
    for i in range(0, len(y), hop):
        c = cutoff_curve(i / SR)
        seg = y[max(0, i - 4096): i + hop]
        out[i:i + hop] = lp(seg, c, 2)[-hop:][: len(out[i:i + hop])]
    bow = bp(rng(seed + 999).standard_normal(len(t)), 900, 3000) * 0.03
    env = np.minimum(1, t / attack) * np.minimum(1, (seconds - t) / release)
    return norm(out + bow) * np.clip(env, 0, 1)


def brass_chord(notes_hz, seconds: float, seed: int, attack=0.45):
    t = tvec(seconds)
    y = np.zeros_like(t)
    for k, f in enumerate(notes_hz):
        saw = saw_voice(f, seconds, seed + 7 * k, vib_depth=0.003)
        sq = np.sign(saw_voice(f * 1.0005, seconds, seed + 7 * k + 3, vib_depth=0.003))
        y += 0.7 * saw + 0.3 * sq
    cut = 300 + 2600 * (1 - np.exp(-t / attack))
    out = np.zeros_like(y)
    hop = 2048
    for i in range(0, len(y), hop):
        seg = y[max(0, i - 4096): i + hop]
        out[i:i + hop] = lp(seg, cut[min(i, len(cut) - 1)], 2)[-hop:][: len(out[i:i + hop])]
    env = np.minimum(1, t / attack) * np.minimum(1, (seconds - t) / 0.35)
    return norm(out) * np.clip(env, 0, 1)


def hz(note: str) -> float:
    names = {"C": -9, "C#": -8, "Db": -8, "D": -7, "D#": -6, "Eb": -6, "E": -5, "F": -4, "F#": -3, "Gb": -3,
             "G": -2, "G#": -1, "Ab": -1, "A": 0, "A#": 1, "Bb": 1, "B": 2}
    name, octave = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[name] + 12 * (octave - 4)) / 12)


# ───────────────────────────── build ─────────────────────────────


def main() -> None:
    STEMS.mkdir(parents=True, exist_ok=True)
    music, pulse, sfx, amb = Bus(), Bus(), Bus(), Bus()
    ev = TL["events"]
    sch = TL["schedules"]
    dv = WORDS["derivedEvents"]
    distant = ir(3.2, 0.9, 3500, 11)
    hall = ir(2.4, 0.55, 6000, 12)

    # ── 0.0–3.3 s : drop ────────────────────────────────────────────
    t = tvec(3.4)
    f = 28 + 52 * np.exp(-t / 0.55)
    drop = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.minimum(1, t / 0.005) * np.exp(-t / 1.25)
    sfx.add(drop + 0.3 * norm(noise_burst(3.4, 0.08, 5, hi=160)), 0.0, -2.0)

    hum_t = tvec(3.9)
    hum = sum(a * np.sin(2 * np.pi * 50 * k * hum_t) for k, a in [(1, 1.0), (2, 0.5), (3, 0.32), (4, 0.18), (6, 0.1)])
    buzz = hp(np.abs(np.sin(2 * np.pi * 100 * hum_t)), 1100) * 0.25
    flick = 1 + 0.9 * np.exp(-((hum_t - 0.45) / 0.12) ** 2)  # surge as the line slices
    hum_env = np.minimum(1, hum_t / 0.6) * np.clip((3.9 - hum_t) / 0.7, 0, 1) * flick
    sfx.add((norm(hum) * 0.8 + buzz) * hum_env, 0.0, -21.0)
    r = rng(77)
    for k in range(26):  # crackle
        tc = r.uniform(0.05, 3.2)
        sfx.add(noise_burst(0.02, 0.0015, 300 + k, lo=2500), tc, -30 + r.uniform(-6, 4), pan=r.uniform(-0.6, 0.6))

    for at, f0, seed, pan in [(f2s(ev["lineSnap"]), 92.5, 21, -0.35), (2.4, 61.7, 22, 0.4)]:
        c = convolve_stereo(lp(clang(f0, seed), 3500), distant, 0.82)
        sfx.add(c, at, -17.0)

    bt = tvec(0.85)
    inhale = rng(41).standard_normal(len(bt))
    inhale = 0.6 * bp(inhale, 380, 900, 2) + 0.4 * bp(inhale, 1200, 2200, 2) + 0.5 * lp(inhale, 160, 2)
    env = np.sin(np.pi * np.clip(bt / 0.85, 0, 1)) ** 1.6
    sfx.add(norm(inhale) * env, 0.92, -19.0)

    # slice + string snap (the line travels L->R between lineSlice and lineSnap)
    s0, s1 = f2s(ev["lineSlice"]), f2s(ev["lineSnap"])
    sl = whoosh(s1 - s0 + 0.04, 61, 1800, 9500)
    chirp_t = tvec(s1 - s0)
    chirp = np.sin(2 * np.pi * np.cumsum(1200 + 2800 * (chirp_t / chirp_t[-1]) ** 2) / SR) * (chirp_t / chirp_t[-1])
    sfx.add_pan_sweep(sl, s0, -8.0, -0.85, 0.85)
    sfx.add_pan_sweep(norm(chirp) * 0.5, s0, -16.0, -0.85, 0.85)
    twang = karplus(55.0, 2.2, 62, 0.9965)
    sfx.add(mix(norm(lp(twang, 2500)), 0.5 * click(63, 2600, 0.6)), s1, -9.0, pan=0.25)

    # ring ignition: crystalline ping + low thoom (under the first word)
    ig = modal([2093, 3389, 5612, 7040], [1.6, 1.1, 0.7, 0.4], [1, 0.6, 0.35, 0.2], 2.4, 71, 6000)
    sfx.add(convolve_stereo(ig, hall, 0.45), f2s(ev["ringIgnite"]), -20.0)
    sfx.add(sub_hit(48, 36, 0.5, 1.6, 1.2), f2s(ev["ringIgnite"]), -11.0)

    # ── 3.3–12.6 s : pulse ──────────────────────────────────────────
    k = 0
    tick_t = 3.3
    while tick_t < 12.59:
        on_beat = abs((tick_t / BEAT) - round(tick_t / BEAT)) < 1e-6
        tt = tvec(0.09)
        ping = np.sin(2 * np.pi * (1250 if on_beat else 1850) * tt) * np.exp(-tt / (0.022 if on_beat else 0.014))
        body = bp(rng(500 + k).standard_normal(len(tt)), 2500, 6000) * np.exp(-tt / 0.002)
        pulse.add(norm(ping + 0.8 * body), tick_t, -15.0 if on_beat else -20.0, pan=0.18 if k % 2 else -0.18)
        tick_t = round(tick_t + (0.15 if tick_t >= 10.79 else 0.3), 4)
        k += 1
    accent = convolve_stereo(modal([1250, 2500, 3760], [0.25, 0.15, 0.08], [1, 0.4, 0.2], 0.6, 88), hall, 0.4)
    pulse.add(accent, f2s(dv["timeAccent"]), -11.0)

    for i, fr in enumerate(sch["codeCompiles"]):
        sfx.add(click(100 + i, 4200 + 300 * i, 0.4), f2s(fr), -15.0, pan=-0.1 + 0.07 * i)
    n_op = len(sch["opusLetterLocks"])
    for i, fr in enumerate(sch["opusLetterLocks"]):
        sfx.add(click(200 + i, 5400 - 120 * i, 0.25), f2s(fr), -17.0, pan=-0.75 + 0.6 * i / (n_op - 1))
    for i, fr in enumerate(sch["origamiFolds"]):
        sfx.add(fold(300 + i), f2s(fr), -16.0, pan=-0.5 + (i % 4) * 0.33)
    for i, fr in enumerate(sch["astraPrismLocks"]):
        p = modal([3520 * (1 + 0.12 * i), 5274 * (1 + 0.12 * i)], [0.4, 0.25], [1, 0.5], 0.8, 400 + i, 7000)
        sfx.add(convolve_stereo(p, hall, 0.35), f2s(fr), -19.0)
    n_as = len(sch["astraLetterLocks"])
    for i, fr in enumerate(sch["astraLetterLocks"]):
        sfx.add(click(450 + i, 6200 + 90 * i, 0.15), f2s(fr), -18.5, pan=0.2 + 0.6 * i / (n_as - 1))

    # glass shatter on the word "glass"
    gs = f2s(dv["glassShatter"])
    r = rng(1313)
    shatter = np.zeros(int(1.8 * SR))
    for j in range(70):
        onset = 0.35 * (r.random() ** 2.2)
        fq = r.uniform(2400, 9800)
        piece = modal([fq, fq * r.uniform(1.4, 2.3)], [r.uniform(0.02, 0.22), r.uniform(0.01, 0.1)],
                      [1, 0.4], 1.0, 2000 + j, 7000)
        i0 = int(onset * SR)
        shatter[i0:i0 + len(piece)] += piece[: len(shatter) - i0] * r.uniform(0.2, 1.0)
    shatter = norm(shatter) + 0.7 * norm(noise_burst(1.8, 0.03, 1314, lo=3000)) + 0.6 * sub_hit(80, 40, 0.18, 1.8)
    sfx.add(convolve_stereo(norm(shatter), hall, 0.3), gs, -6.0)

    # dive whooshes landing on the cuts; whip-pan R->L landing on its cut
    for c in TL["cuts"]:
        at = f2s(c["frame"])
        if c["sfx"] == "dive-whoosh":
            w = whoosh(1.1, 600 + c["frame"], 160, 6200)
            sfx.add(w, at - 1.1, -9.0)
        elif c["sfx"] == "whoosh":
            w = whoosh(0.8, 700, 300, 7000)
            sfx.add_pan_sweep(w, at - 0.8, -8.0, 0.8, -0.8)
        elif c["sfx"] in ("impact", "impact-rise"):
            sfx.add(impact(800 + c["frame"]), at, -4.5)
            sfx.add(whoosh(0.5, 810 + c["frame"]), at - 0.5, -14.0)
        elif c["sfx"] == "impact-shatter":
            sfx.add(convolve_stereo(impact(900, big=True), hall, 0.25), at, -2.5)
            sfx.add(convolve_stereo(norm(shatter), hall, 0.4), at, -10.0)
        elif c["sfx"] == "snap":
            sfx.add(impact(950), at, -9.0)
        elif c["sfx"] == "sub-pulse":
            sfx.add(sub_hit(46, 29, 0.75, 1.85, 1.3), at, -3.0)
            sfx.add(noise_burst(0.3, 0.01, 990, lo=4000), at, -20.0)

    # spatial riser 9.0 -> 13.2 s (ends ON the shatter)
    r0, r1 = 9.0, f2s(ev["shatter"])
    rt = tvec(r1 - r0)
    x = rt / rt[-1]
    nl, nr = rng(1500).standard_normal(len(rt)), rng(1501).standard_normal(len(rt))
    riser = np.zeros((2, len(rt)))
    hop = 1024
    for i in range(0, len(rt), hop):
        c = 300 * (8000 / 300) ** x[min(i, len(x) - 1)]
        for ch, src in enumerate((nl, nr)):
            seg = src[max(0, i - 4096): i + hop]
            riser[ch, i:i + hop] = bp(seg, c * 0.7, min(c * 1.5, 23000), 2)[-hop:][: len(riser[ch, i:i + hop])]
    shep = np.zeros(len(rt))
    for o in range(4):
        fo = 110 * 2 ** (o + 1.0 * x)
        w = np.exp(-((np.log2(fo / 440)) ** 2) / 1.2)
        shep += w * np.sin(2 * np.pi * np.cumsum(fo) / SR)
    renv = x ** 2.6
    riser = norm(riser) * renv + 0.35 * norm(shep) * renv
    amb.add(riser, r0, -9.0)

    # ── 12.6–22.2 s : swell ─────────────────────────────────────────
    bar = 4 * BEAT
    prog = [(12.6, ["D2", "A2", "D3", "F3", "A3"]), (15.0, ["Bb1", "F2", "Bb2", "D3", "F3"]),
            (17.4, ["G1", "D2", "G2", "Bb2", "D3"]), (19.8, ["A1", "E2", "A2", "C#3", "E3"])]
    for i, (t0, notes) in enumerate(prog):
        seconds = bar + 0.5
        cres = lambda tt, t0=t0: 500 + 2600 * np.clip((t0 + tt - 12.6) / 8.0, 0, 1)
        ch = cello_chord([hz(n) for n in notes], seconds, 3000 + 50 * i, cres, attack=0.9 if i == 0 else 0.25)
        music.add(convolve_stereo(ch, hall, 0.35), t0, -9.0 + 1.2 * i)
        if i >= 1:
            br = brass_chord([hz(n) for n in notes[1:4]], seconds, 3500 + 50 * i)
            music.add(convolve_stereo(br, hall, 0.4), t0, -14.0 + 1.5 * i)
    ost_t = 13.2
    while ost_t < 20.39:  # marcato 8th-note ostinato keeps the 100 BPM pulse alive
        idx = int(round((ost_t - 12.6) / bar))
        root = hz(prog[min(idx, 3)][1][0].replace("1", "2") if prog[min(idx, 3)][1][0].endswith("1") else prog[min(idx, 3)][1][0])
        nt = tvec(0.28)
        note = saw_voice(root, 0.28, int(ost_t * 100)) * np.exp(-nt / 0.11) * np.minimum(1, nt / 0.006)
        music.add(lp(note, 900), ost_t, -15.0 if abs(ost_t / BEAT - round(ost_t / BEAT)) < 1e-6 else -19.0)
        ost_t = round(ost_t + 0.3, 4)
    for fr in (ev["split"], ev["glyphDive"], ev["liquefy"]):  # brass stabs on the split / glyph-dive / rise cuts (by name, never by list index)
        stab = brass_chord([hz("D3"), hz("A3"), hz("D4")], 0.9, 3600 + fr, attack=0.05)
        music.add(convolve_stereo(stab, hall, 0.4), f2s(fr), -12.0)

    # electric arcs across the split seam
    a0, a1 = f2s(ev["split"]), f2s(ev["arcsStop"])
    at_ = tvec(a1 - a0 + 0.3)
    buzz = sum(np.sin(2 * np.pi * 120 * k * at_) / k for k in range(1, 18))
    am = np.abs(lp(rng(1700).standard_normal(len(at_)), 30, 2))
    arc_bed = hp(buzz, 300) * (0.3 + 3 * am) * np.clip((a1 + 0.3 - a0 - at_) / 0.3, 0, 1)
    sfx.add(norm(arc_bed), a0, -24.0)
    for i, fr in enumerate(sch["arcStrikes"]):
        zt = tvec(0.25)
        zap = norm(noise_burst(0.25, 0.03, 1800 + i, 1500, 9000)) + 0.6 * np.sign(np.sin(2 * np.pi * 60 * zt)) * np.exp(-zt / 0.05)
        sfx.add(norm(zap), f2s(fr), -12.0 - (i % 3), pan=(-1) ** i * 0.15)

    # Escher re-architect snaps on every beat inside the glyph
    for i, fr in enumerate(sch["escherBeats"]):
        pre = whoosh(0.18, 1900 + i, 900, 6000)
        sfx.add(pre, f2s(fr) - 0.18, -16.0)
        sfx.add(click(1950 + i, 3000 + 400 * i, 0.9), f2s(fr), -9.0)
        tone = modal([hz(["D5", "F5", "A5", "C#6"][i])], [0.5], [1], 0.8, 1960 + i, 8000)
        sfx.add(convolve_stereo(tone, hall, 0.4), f2s(fr), -20.0)

    # liquid-metal bed during the monolith formation
    l0 = f2s(ev["liquefy"])
    lt = tvec(3.0)
    gran = lp(rng(2100).standard_normal(len(lt)), 220, 2) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 1.6 * lt)))
    comb = np.copy(gran)
    d = int(SR / 146.8)
    for i in range(d, len(comb)):
        comb[i] += 0.8 * comb[i - d]
    liquid = norm(gran) * 0.6 + norm(bp(comb, 140, 1800)) * 0.5
    amb.add(liquid * np.minimum(1, lt / 0.2) * np.clip((3.0 - lt) / 1.2, 0, 1), l0, -14.0)

    # ── 22.2–30 s : resolution ──────────────────────────────────────
    res_t0, res_t1 = 22.2, f2s(ev["cutToBlack"])
    pad_notes = ["D2", "A2", "D3", "F#3", "A3", "E4", "D5"]
    pad = cello_chord([hz(n) for n in pad_notes], res_t1 - res_t0 + 0.4, 4000, lambda tt: 1800 - 900 * np.clip(tt / 6, 0, 1),
                      attack=1.2, release=0.25)
    music.add(convolve_stereo(pad, hall, 0.55), res_t0, -12.0)
    shimmer = modal([hz("D6"), hz("A6"), hz("F#6")], [3.0, 2.5, 2.0], [0.6, 0.4, 0.3], 6.0, 4100, 9000)
    music.add(convolve_stereo(shimmer, hall, 0.6), res_t0 + 0.05, -26.0)

    # orbit: a rotating air whoosh, then the stillness suck-out into the snap
    o0, o1 = f2s(ev["orbitStart"]), f2s(ev["snapBack"])
    ot = tvec(o1 - o0)
    orbit = bp(rng(2200).standard_normal(len(ot)), 400, 3000) * (0.4 + 0.6 * np.sin(np.pi * ot / ot[-1]))
    amb.add_pan_sweep(norm(orbit), o0, -19.0, -0.9, 0.9)
    still0 = f2s(ev["stillness"])
    rev = whoosh(o1 - still0, 2300, 200, 9000)
    sfx.add(rev, still0, -11.0)

    for i, fr in enumerate(sch["emblemSnaps"]):
        st = tvec(0.12)
        snap = np.sin(2 * np.pi * np.cumsum(900 * np.exp(-st / 0.012) + 120) / SR) * np.exp(-st / 0.035)
        sfx.add(mix(norm(snap), 0.4 * click(2400 + i, 4000, 0.2)), f2s(fr), -13.0, pan=np.cos(i * 0.9) * 0.7)
    lock = brass_chord([hz("D3"), hz("F#3"), hz("A3"), hz("D4")], 1.4, 2500, attack=0.03)
    music.add(convolve_stereo(lock, hall, 0.5), f2s(sch["emblemLock"]), -10.0)
    sfx.add(sub_hit(58, 36, 0.4, 1.2), f2s(sch["emblemLock"]), -8.0)
    sfx.add(convolve_stereo(click(2600, 2600, 0.8), hall, 0.5), f2s(dv["codeWord"]), -12.0)

    # rain / ambience tail
    rain_t = tvec(DUR - res_t0)
    bed = bp(rng(2700).standard_normal(len(rain_t)), 700, 6500, 2)
    rain = np.stack([bed, bp(rng(2701).standard_normal(len(rain_t)), 700, 6500, 2)]) * 0.3
    r = rng(2702)
    for j in range(int(42 * (DUR - res_t0))):
        tj = r.uniform(0, DUR - res_t0 - 0.05)
        fq = r.uniform(1500, 5200)
        dt = tvec(0.05)
        drop_ = np.sin(2 * np.pi * fq * dt) * np.exp(-dt / r.uniform(0.004, 0.014)) * r.uniform(0.1, 0.8)
        i0 = int(tj * SR)
        ch = 0 if r.random() < 0.5 else 1
        rain[ch, i0:i0 + len(dt)] += drop_[: rain.shape[1] - i0]
    fade = np.clip(rain_t / 1.3, 0, 1) * np.clip((DUR - res_t0 - rain_t) / 1.8, 0, 1)
    rumble = lp(rng(2703).standard_normal(len(rain_t)), 90, 2) * np.exp(-((rain_t - 2.6) / 1.4) ** 2) * 4
    amb.add(norm(rain) * fade + 0.3 * norm(rumble) * fade, res_t0, -21.0)

    # crisp digital pulse-out
    pt = tvec(0.25)
    blip = np.sin(2 * np.pi * 2000 * pt) * np.exp(-pt / 0.04) + 0.4 * np.sin(2 * np.pi * 12000 * pt) * np.exp(-pt / 0.005)
    blip = Pedalboard([Bitcrush(bit_depth=6)])(blip.astype(np.float32), SR).astype(np.float64)
    sfx.add(convolve_stereo(norm(blip), hall, 0.35), f2s(ev["pulseOut"]), -14.0)

    # glue: gentle saturation on music, light reverb on pulse
    music.buf = Pedalboard([Distortion(drive_db=2.0)])(music.buf.astype(np.float32), SR).astype(np.float64)
    pulse.buf = Pedalboard([Reverb(room_size=0.18, wet_level=0.12, dry_level=1.0, width=0.8)])(
        pulse.buf.astype(np.float32), SR).astype(np.float64)

    for name, bus in (("music", music), ("pulse", pulse), ("sfx", sfx), ("ambience", amb)):
        peak = np.max(np.abs(bus.buf))
        sf.write(STEMS / f"{name}.wav", bus.buf.T.astype(np.float32), SR, subtype="FLOAT")
        print(f"{name:9s} peak {20 * np.log10(peak + 1e-12):6.1f} dBFS  -> {STEMS.relative_to(ROOT)}/{name}.wav")


if __name__ == "__main__":
    main()
