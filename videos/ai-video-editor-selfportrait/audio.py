"""Deterministic synthesized audio bed (no narration — `skills/motion-graphics`).

"Audio is the clock" (skills/motion-doctrine): every hit below lands on the exact
frame of its cause — seam cuts, the oversized-cursor click, the stat reveals, the
stillness-before-climax freeze. Nothing is placed "shortly after".

Stereo 48 kHz WAV, written with the standard library only.
"""

from __future__ import annotations

import math
import struct
import wave

import numpy as np

SR = 48000
FPS = 30.0


def f2t(frame: float) -> float:
    return frame / FPS


class Bed:
    def __init__(self, duration_s: float):
        self.n = int(duration_s * SR)
        self.left = np.zeros(self.n, dtype=np.float64)
        self.right = np.zeros(self.n, dtype=np.float64)

    def _slice(self, t0: float, t1: float):
        a = max(0, int(t0 * SR))
        b = min(self.n, int(t1 * SR))
        return a, b, np.arange(b - a, dtype=np.float64) / SR

    def add(self, t0: float, t1: float, sig_l: np.ndarray, sig_r: np.ndarray | None = None):
        a, b, _ = self._slice(t0, t1)
        if b <= a:
            return
        n = b - a
        self.left[a:b] += sig_l[:n]
        self.right[a:b] += (sig_r if sig_r is not None else sig_l)[:n]

    def sine(self, t0, t1, freq, amp, attack=0.005, release=0.05, glide_to=None, pan=0.0):
        a, b, t = self._slice(t0, t1)
        if b <= a:
            return
        f1 = freq if glide_to is None else glide_to
        phase = 2 * np.pi * (freq * t + (f1 - freq) * t * t / (2 * max(t[-1], 1e-6)))
        env = np.ones_like(t)
        na, nr = int(attack * SR), int(release * SR)
        if na > 0 and na < len(env):
            env[:na] = np.linspace(0, 1, na)
        if nr > 0 and nr < len(env):
            env[-nr:] *= np.linspace(1, 0, nr)
        sig = np.sin(phase) * env * amp
        g = (pan + 1) / 2
        self.add(t0, t1, sig * math.sqrt(1 - g), sig * math.sqrt(g))

    def noise(self, t0, t1, amp, seed, lowpass=None, highpass=None, pan=0.0, env=None):
        a, b, t = self._slice(t0, t1)
        if b <= a:
            return
        rng = np.random.default_rng(seed)
        x = rng.standard_normal(b - a)
        if lowpass:
            x = _one_pole_low(x, lowpass, SR)
        if highpass:
            x = x - _one_pole_low(x, highpass, SR)
        e = np.ones_like(t) if env is None else env(t)
        sig = x * e * amp
        g = (pan + 1) / 2
        self.add(t0, t1, sig * math.sqrt(1 - g), sig * math.sqrt(g))

    def normalize(self, peak=0.86):
        m = max(np.abs(self.left).max(), np.abs(self.right).max(), 1e-9)
        self.left *= peak / m
        self.right *= peak / m

    def write_wav(self, path: str):
        self.normalize()
        data = np.empty(self.n * 2, dtype=np.float64)
        data[0::2] = self.left
        data[1::2] = self.right
        pcm = np.clip(data * 32767, -32768, 32767).astype("<i2")
        with wave.open(path, "wb") as w:
            w.setnchannels(2)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())


def _one_pole_low(x: np.ndarray, cutoff: float, sr: int) -> np.ndarray:
    """Zero-phase brick-wall low pass (FFT domain) — vectorized, deterministic."""
    if len(x) < 4:
        return x
    spec = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1.0 / sr)
    # 2nd-order Butterworth-shaped rolloff instead of a hard brick
    spec *= 1.0 / (1.0 + (freqs / max(cutoff, 1.0)) ** 4)
    return np.fft.irfft(spec, n=len(x))


def _rise(t):  # 0 -> 1 accelerating riser envelope
    return np.clip(t, 0, 1) ** 2.4


def _hit(t, decay=9.0):  # impact envelope: instant attack, exponential decay
    return np.exp(-t * decay)


def build_bed(path: str) -> str:
    """The bed is cut to ledger.json: hits land on frames 54, 116, 138, 166, 180."""
    bed = Bed(10.0)

    # --- sub drone: the floor everything sits on --------------------------- #
    a, b, t = bed._slice(0.0, 10.0)
    lfo = 0.72 + 0.28 * np.sin(2 * np.pi * 0.13 * t)
    swell = np.interp(t, [0, 0.9, 4.2, 4.6, 6.0, 8.4, 10.0],
                      [0.25, 0.85, 1.0, 1.35, 1.15, 0.95, 0.55])
    drone = (
        np.sin(2 * np.pi * 41.2 * t) * 0.55
        + np.sin(2 * np.pi * 82.4 * t) * 0.20
        + np.sin(2 * np.pi * 123.6 * t + 0.4) * 0.10
    )
    bed.add(0.0, 10.0, drone * lfo * swell * 0.30, drone * lfo * swell * 0.26)

    # --- UI ticks: boot HUD waterfall (frames 5..21) ----------------------- #
    for i in range(5):
        tt = f2t(5 + i * 4)
        bed.sine(tt, tt + 0.05, 2400 + i * 90, 0.075, attack=0.001, release=0.04,
                 pan=-0.35 + i * 0.18)
    # grid scan whoosh (frames 8..46)
    bed.noise(f2t(8), f2t(46), 0.10, 7, lowpass=2400, highpass=500,
              env=lambda t: np.sin(np.pi * np.clip(t / 1.267, 0, 1)) ** 1.5)

    # --- seam 1 (frame 54 = 1.800s): cut-the-curve LEFT -------------------- #
    bed.noise(0.85, f2t(54), 0.30, 11, lowpass=5200, highpass=320, env=lambda t: _rise(t / 0.95))
    bed.sine(f2t(54), f2t(54) + 0.42, 190, 0.55, attack=0.001, release=0.30, glide_to=52)
    bed.noise(f2t(54), f2t(54) + 0.30, 0.34, 12, lowpass=2600, highpass=180,
              env=lambda t: _hit(t, 12.0))
    bed.sine(f2t(54), f2t(54) + 0.9, 1160, 0.10, attack=0.002, release=0.7, pan=-0.5)

    # --- stat count-up ticks (frames 140/145/150) -------------------------- #
    for i, f in enumerate((140, 145, 150)):
        tt = f2t(f)
        bed.sine(tt, tt + 0.07, 1500 + i * 220, 0.10, attack=0.001, release=0.06, pan=0.25)

    # --- cursor click (frame 116 = 3.867s): the cause of the Z push -------- #
    tc = f2t(116)
    bed.noise(tc, tc + 0.045, 0.50, 21, lowpass=7000, highpass=900, env=lambda t: _hit(t, 60.0))
    bed.sine(tc, tc + 0.14, 620, 0.20, attack=0.001, release=0.12, glide_to=300)

    # --- stillness before climax (frames 166-180): duck + freeze wash ------ #
    tf0, tf1 = f2t(166), f2t(180)
    a, b, t = bed._slice(tf0, tf1)
    duck = np.interp(t, [0, 0.08, 0.36, 0.47], [1.0, 0.5, 0.5, 1.0])
    bed.add(tf0, tf1, bed.left[a:b] * (duck - 1.0), bed.right[a:b] * (duck - 1.0))
    bed.noise(tf0, tf1, 0.13, 31, lowpass=900,
              env=lambda t: np.sin(np.pi * np.clip(t / 0.467, 0, 1)))

    # --- seam 2 (frame 138 = 4.600s): zoom-through into the 3D engine ------- #
    bed.noise(3.05, f2t(138), 0.34, 41, lowpass=6800, highpass=240, env=lambda t: _rise(t / 1.55))
    bed.sine(f2t(138), f2t(138) + 0.85, 128, 0.62, attack=0.001, release=0.70, glide_to=38)
    bed.noise(f2t(138), f2t(138) + 0.55, 0.30, 42, lowpass=3400, highpass=140,
              env=lambda t: _hit(t, 7.0))
    bed.sine(f2t(138), f2t(138) + 1.6, 1760, 0.055, attack=0.02, release=1.3, pan=0.45)

    # --- flare sweep (frames 168-180) shimmering into seam 3 --------------- #
    bed.noise(f2t(168), f2t(180), 0.16, 55, lowpass=9000, highpass=1800,
              env=lambda t: _rise(t / 0.4))
    bed.sine(f2t(168), f2t(180), 2600, 0.035, attack=0.12, release=0.2, glide_to=3400, pan=0.3)

    # --- seam 3 (frame 180 = 6.000s): cut-the-curve LEFT into the lockup --- #
    bed.noise(5.25, f2t(180), 0.26, 51, lowpass=5600, highpass=300, env=lambda t: _rise(t / 0.75))
    bed.sine(f2t(180), f2t(180) + 0.36, 165, 0.45, attack=0.001, release=0.26, glide_to=48)
    bed.noise(f2t(180), f2t(180) + 0.26, 0.26, 52, lowpass=2800, highpass=200,
              env=lambda t: _hit(t, 14.0))

    # --- lockup: geodesic dock thud + outro shimmer ------------------------ #
    td = f2t(198)
    bed.sine(td, td + 0.3, 96, 0.30, attack=0.002, release=0.25, glide_to=44)
    for i, (freq, pan) in enumerate(((880, -0.5), (1320, 0.1), (1760, 0.55))):
        t0 = f2t(214 + i * 6)
        bed.sine(t0, t0 + 1.5, freq, 0.045, attack=0.10, release=1.2, pan=pan)
    bed.noise(9.25, 10.0, 0.10, 61, lowpass=1400, env=lambda t: np.linspace(1, 0, max(1, len(t))))

    bed.write_wav(path)
    return path


if __name__ == "__main__":
    import sys

    out = sys.argv[1] if len(sys.argv) > 1 else "bed.wav"
    build_bed(out)
    print("wrote", out)
