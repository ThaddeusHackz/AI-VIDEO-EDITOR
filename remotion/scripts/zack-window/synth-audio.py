#!/usr/bin/env python3
"""
Procedurally synthesize the sound bed for the ZackWindow-Short composition.
No model, no network, no numpy: a deterministic stdlib DSP pass.

Outputs (public/zack-window/sfx/):
  tension-bed.wav  - low ominous drone (55/110 Hz detuned sines + slow LFO)
                     with a soft sub "heartbeat" pulse, ducked under narration
  whoosh.wav       - 0.35 s filtered-noise sweep used on hard cuts
  impact.wav       - short low thud for the title/callout hits
  riser.wav        - 2.2 s noise riser into the crack scene
"""
from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SR = 44100
OUT = Path(__file__).resolve().parents[2] / "public" / "zack-window" / "sfx"
OUT.mkdir(parents=True, exist_ok=True)
rng = random.Random(7)


def write_wav(name: str, samples: list[float], gain_db: float) -> None:
    gain = 10 ** (gain_db / 20)
    peak = max(1e-9, max(abs(s) for s in samples))
    norm = min(1.0, 0.98 / peak)
    frames = bytearray()
    for s in samples:
        v = max(-1.0, min(1.0, s * norm * gain))
        frames += struct.pack("<h", int(v * 32767))
    with wave.open(str(OUT / name), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(frames))
    print(f"wrote sfx/{name}  {len(samples) / SR:.2f}s")


def one_pole_lowpass(xs: list[float], cutoff_hz: float) -> list[float]:
    a = math.exp(-2 * math.pi * cutoff_hz / SR)
    y = 0.0
    out = []
    for x in xs:
        y = (1 - a) * x + a * y
        out.append(y)
    return out


def tension_bed(seconds: float) -> list[float]:
    n = int(seconds * SR)
    out = []
    phase1 = phase2 = phase3 = 0.0
    for i in range(n):
        t = i / SR
        lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.07 * t)        # 14 s swell
        tremolo = 0.85 + 0.15 * math.sin(2 * math.pi * 0.9 * t)
        phase1 += 2 * math.pi * 55.0 / SR
        phase2 += 2 * math.pi * 110.7 / SR                        # detuned octave -> slow beating
        phase3 += 2 * math.pi * 82.4 / SR                         # minor-ish fifth-below colour
        drone = 0.55 * math.sin(phase1) + 0.28 * math.sin(phase2) + 0.17 * math.sin(phase3)
        # heartbeat: two soft thumps every 1.15 s (lub-dub)
        beat_t = t % 1.15
        hb = 0.0
        for off in (0.0, 0.18):
            d = beat_t - off
            if 0 <= d < 0.16:
                hb += math.sin(2 * math.pi * 48 * d) * math.exp(-d * 28) * (0.9 if off == 0 else 0.6)
        out.append(drone * (0.35 + 0.65 * lfo) * tremolo * 0.6 + hb * 0.5)
    # fade in / out
    fade = int(1.5 * SR)
    for i in range(fade):
        out[i] *= i / fade
        out[-1 - i] *= i / fade
    return one_pole_lowpass(out, 400)


def whoosh() -> list[float]:
    n = int(0.35 * SR)
    noise = [rng.uniform(-1, 1) for _ in range(n)]
    out = []
    for i, x in enumerate(noise):
        p = i / n
        env = math.sin(math.pi * p) ** 1.5
        out.append(x * env)
    # sweep the lowpass from dark to bright by mixing two filtered copies
    dark = one_pole_lowpass(out, 500)
    bright = one_pole_lowpass(out, 4000)
    return [d * (1 - i / n) + b * (i / n) for i, (d, b) in enumerate(zip(dark, bright))]


def impact() -> list[float]:
    n = int(0.6 * SR)
    out = []
    for i in range(n):
        t = i / SR
        f = 120 * math.exp(-t * 9) + 38
        out.append(math.sin(2 * math.pi * f * t) * math.exp(-t * 6) + rng.uniform(-1, 1) * math.exp(-t * 40) * 0.5)
    return one_pole_lowpass(out, 900)


def riser(seconds: float = 2.2) -> list[float]:
    n = int(seconds * SR)
    noise = [rng.uniform(-1, 1) for _ in range(n)]
    out = []
    for i, x in enumerate(noise):
        p = i / n
        out.append(x * (p ** 2.2))
    dark = one_pole_lowpass(out, 300)
    bright = one_pole_lowpass(out, 6000)
    return [d * (1 - (i / n) ** 2) + b * ((i / n) ** 2) for i, (d, b) in enumerate(zip(dark, bright))]


if __name__ == "__main__":
    write_wav("tension-bed.wav", tension_bed(66.0), -9.0)
    write_wav("whoosh.wav", whoosh(), -6.0)
    write_wav("impact.wav", impact(), -3.0)
    write_wav("riser.wav", riser(), -6.0)
