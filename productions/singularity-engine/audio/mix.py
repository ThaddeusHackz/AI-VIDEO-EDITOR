#!/usr/bin/env python3
"""mix.py — VO-forward trailer mix and master for The Singularity Engine.

Client decision: "Trailer mix, VO-forward". The score ducks 8-10 dB under every phrase. Ducking timing follows the
repo standard (nle-video-editor-pro: 0.25 s attack, 0.6 s release). Master target: -16 LUFS integrated, true peak
<= -1 dBTP (opus-js-animations/references/audio.md). True peak is measured 4x oversampled.

Inputs : remotion/public/singularity/audio/vo.wav, audio/build/stems/{music,pulse,sfx,ambience}.wav
Outputs: remotion/public/singularity/audio/mix_master.wav (48 kHz / 24-bit stereo)
         productions/singularity-engine/audio/build/mix_report.json
         productions/singularity-engine/qa/reports/audio_spectrogram.png (visual QA of the mix)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import Compressor, Pedalboard
from PIL import Image, ImageDraw
from scipy.signal import resample_poly, spectrogram

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
STEMS = HERE / "build" / "stems"
VO = ROOT / "remotion/public/singularity/audio/vo.wav"
OUT = ROOT / "remotion/public/singularity/audio/mix_master.wav"
REPORT = HERE / "build" / "mix_report.json"
SPEC_PNG = HERE.parent / "qa" / "reports" / "audio_spectrogram.jpg"
WORDS = json.loads((ROOT / "remotion/src/singularity/vo-words.json").read_text())
SR = 48000

TARGET_LUFS = -16.0
CEILING_DBTP = -1.0
DUCK_DB = {"music": -9.5, "ambience": -9.0, "pulse": -6.0, "sfx": -3.5}
STEM_LUFS = {"vo": -17.0, "music": -21.0, "pulse": -27.0, "sfx": -20.0, "ambience": -26.5}


def load(path: Path) -> np.ndarray:
    x, sr = sf.read(path, always_2d=True)
    assert sr == SR, f"{path}: {sr}"
    return x.T.astype(np.float64)


def lufs(x: np.ndarray) -> float:
    return pyln.Meter(SR).integrated_loudness(x.T)


def true_peak_db(x: np.ndarray) -> float:
    up = resample_poly(x, 4, 1, axis=1)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def tp_limiter(x: np.ndarray, ceiling_db: float, lookahead_ms: float = 1.5, release_ms: float = 90.0) -> np.ndarray:
    """Brick-wall true-peak limiter: 4x-oversampled peak detection, look-ahead min gain, exponential release.
    (pedalboard's JUCE Limiter adds make-up gain, which fights loudness normalisation, so it is not used.)"""
    from scipy.ndimage import minimum_filter1d

    n = x.shape[1]
    up = np.abs(resample_poly(x, 4, 1, axis=1)).max(axis=0)[: n * 4]
    pk = up.reshape(n, 4).max(axis=1)
    g = np.minimum(1.0, 10 ** (ceiling_db / 20) / (pk + 1e-12))
    look = max(1, int(lookahead_ms * SR / 1000))
    g = minimum_filter1d(g, size=2 * look + 1, mode="nearest")
    r = np.exp(-1 / (release_ms * SR / 1000))
    out = np.empty_like(g)
    y = 1.0
    for i, v in enumerate(g):
        y = v if v < y else r * y + (1 - r) * v
        out[i] = y
    return x * out


def follower(level: np.ndarray, attack_s: float, release_s: float, rate: float) -> np.ndarray:
    a = np.exp(-1 / (attack_s * rate))
    r = np.exp(-1 / (release_s * rate))
    out = np.zeros_like(level)
    y = 0.0
    for i, v in enumerate(level):
        c = a if v > y else r
        y = c * y + (1 - c) * v
        out[i] = y
    return out


def duck_curve(vo: np.ndarray) -> np.ndarray:
    """0..1 speech presence from the VO envelope (1 kHz control rate), smoothed with 0.25 s / 0.6 s."""
    hop = SR // 1000
    mono = vo.mean(axis=0)
    frames = len(mono) // hop
    rms = np.sqrt(np.mean(mono[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-12)
    lvl = 20 * np.log10(rms)
    presence = np.clip((lvl + 50) / 18, 0, 1)
    smooth = follower(presence, 0.25 / 4, 0.6, 1000.0)  # fast-ish attack so the duck is down by the first syllable
    smooth = np.clip(smooth * 1.6, 0, 1)
    return np.repeat(smooth, hop)[: vo.shape[1]]


def spectrogram_png(x: np.ndarray, path: Path) -> None:
    mono = x.mean(axis=0)
    f, t, s = spectrogram(mono, fs=SR, nperseg=2048, noverlap=1536)
    s = 10 * np.log10(s + 1e-12)
    keep = f <= 12000
    s = s[keep][::-1]
    lo, hi = np.percentile(s, 5), np.percentile(s, 99.7)
    img = np.clip((s - lo) / (hi - lo), 0, 1)
    w, h = 1500, 420
    pil = Image.fromarray((img * 255).astype(np.uint8)).resize((w, h))
    rgb = Image.merge("RGB", (pil.point(lambda v: min(255, int(v * 1.1))), pil.point(lambda v: int(v * 0.55)),
                              pil.point(lambda v: int(min(255, v * 0.25 + (255 - v) * 0.12)))))
    canvas = Image.new("RGB", (w, h + 140), (8, 8, 12))
    canvas.paste(rgb, (0, 0))
    d = ImageDraw.Draw(canvas)
    env = np.abs(mono)
    hop = len(env) // w
    for i in range(w):
        a = float(env[i * hop:(i + 1) * hop].max())
        d.line([(i, h + 70 - a * 60), (i, h + 70 + a * 60)], fill=(217, 119, 87))
    for p in WORDS["phrases"]:
        x0 = int(p["start"] / 30 * w)
        x1 = int(p["end"] / 30 * w)
        d.rectangle([x0, h + 128, x1, h + 136], fill=(0, 240, 255))
    for s_ in range(0, 31, 3):
        d.text((int(s_ / 30 * w) + 2, h + 2), f"{s_}s", fill=(245, 242, 235))
    path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(path, quality=86)


def main() -> None:
    stems = {"vo": load(VO)}
    for name in ("music", "pulse", "sfx", "ambience"):
        stems[name] = load(STEMS / f"{name}.wav")
    n = min(s.shape[1] for s in stems.values())
    stems = {k: v[:, :n] for k, v in stems.items()}

    gains = {}
    for k, v in stems.items():
        g = STEM_LUFS[k] - lufs(v)
        gains[k] = g
        stems[k] = v * 10 ** (g / 20)

    presence = duck_curve(stems["vo"])[:n]
    for k, depth in DUCK_DB.items():
        stems[k] = stems[k] * 10 ** (depth * presence / 20)

    mixbus = sum(stems.values())
    mixbus = Pedalboard([Compressor(threshold_db=-14, ratio=2.0, attack_ms=12, release_ms=160)])(
        mixbus.astype(np.float32), SR).astype(np.float64)

    gain_db = TARGET_LUFS - lufs(mixbus)
    out = mixbus
    for _ in range(8):  # loudness gain -> true-peak limit; nudge the gain until both targets hold
        out = tp_limiter(mixbus * 10 ** (gain_db / 20), CEILING_DBTP - 0.2)
        err = TARGET_LUFS - lufs(out)
        if abs(err) < 0.1:
            break
        gain_db += err
    tp = true_peak_db(out)
    if tp > CEILING_DBTP:
        out *= 10 ** ((CEILING_DBTP - 0.05 - tp) / 20)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUT, out.T, SR, subtype="PCM_24")

    # measured ducking: music level inside phrases vs. between them
    def seg_db(x, t0, t1):
        a, b = int(t0 * SR), int(t1 * SR)
        return 20 * np.log10(np.sqrt(np.mean(x[:, a:b] ** 2)) + 1e-12)

    speech = [(p["start"], p["end"]) for p in WORDS["phrases"]]
    duck_depth = float(np.mean([10 * np.log10(np.mean(10 ** (DUCK_DB["music"] * presence[int(a * SR):int(b * SR)] / 10)))
                                for a, b in speech]))
    report = {
        "integratedLUFS": round(lufs(out), 2),
        "truePeakDBTP": round(true_peak_db(out), 2),
        "samplePeakDBFS": round(20 * np.log10(np.max(np.abs(out)) + 1e-12), 2),
        "durationS": round(out.shape[1] / SR, 4),
        "stemGainsDB": {k: round(v, 2) for k, v in gains.items()},
        "meanMusicDuckInsidePhrasesDB": round(duck_depth, 2),
        "voPhraseLevelsDB": {p["id"]: round(seg_db(stems["vo"], p["start"], p["end"]), 1) for p in WORDS["phrases"]},
        "maxShortTermLUFS": round(max(lufs(out[:, i:i + 3 * SR]) for i in range(0, out.shape[1] - 3 * SR, SR // 2)), 2),
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n")
    spectrogram_png(out, SPEC_PNG)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
