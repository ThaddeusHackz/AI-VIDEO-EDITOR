#!/usr/bin/env python3
"""build_vo.py — 'Heavy vigilante' voiceover chain + syllable-nucleus word alignment.

The Singularity Engine — VO stage.

Inputs
  productions/singularity-engine/audio/vo_raw/L1..L5.wav   voice-00 studio-TTS takes (one per script line)
  remotion/src/singularity/timeline.json                   phrase onsets on the 100 BPM half-beat grid

Outputs
  remotion/public/singularity/audio/vo.wav                 30.000 s, 48 kHz, stereo, 24-bit — the VO stem
  remotion/src/singularity/vo-words.json                   phrase + word timings (seconds and 60 fps frames)
  productions/singularity-engine/audio/build/phrases/*.wav processed phrases (inspection)

Chain per phrase (all deterministic):
  1. Praat PSOLA "Change gender": formants x0.88, pitch median -> ~92-108 Hz (>= -3 st), range x0.62-0.8,
     duration x1.08 (x1.12-1.25 on the final line).                           -> low-frequency formant shift
  2. Clean bus: HPF 55 Hz, proximity low-shelf, chest peak, de-box cut, presence lift, dark top, compression.
  3. Gravel bus: band-passed copy -> 24 dB drive -> low-passed, mixed under.
  4. Fry / rasp bus: copy amplitude-modulated by a jittered ~36 Hz glottal-creak pulse train (seeded).
  5. Chest double: -12 st Rubber Band copy, low-passed at 300 Hz.
  6. Per-line colour: metallic comb (L2), extra fry + sub (L3), extra proximity (L4), long dark tail (L5).
  7. Dark short room, glue compression, limiter.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import parselmouth
import soundfile as sf
from parselmouth.praat import call, run
from pedalboard import (
    Compressor,
    Distortion,
    Gain,
    HighpassFilter,
    HighShelfFilter,
    Limiter,
    LowpassFilter,
    LowShelfFilter,
    PeakFilter,
    Pedalboard,
    PitchShift,
    Reverb,
)
from scipy.signal import butter, resample_poly, sosfiltfilt

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TIMELINE = ROOT / "remotion/src/singularity/timeline.json"
RAW = HERE / "vo_raw"
BUILD = HERE / "build" / "phrases"
OUT_WAV = ROOT / "remotion/public/singularity/audio/vo.wav"
OUT_WORDS = ROOT / "remotion/src/singularity/vo-words.json"

SR = 48000
DURATION_S = 30.0

# Exact syllable counts for the locked script (more reliable than a heuristic for 47 known words).
SYLLABLES = {
    "they": 1, "said": 1, "motion": 2, "was": 1, "hand-drawn": 2, "locked": 1, "behind": 2, "glass": 1,
    "and": 1, "time": 1, "then": 1, "came": 1, "opus": 2, "coding": 2, "the": 1, "geometry": 4, "of": 1,
    "thought": 1, "in": 1, "real": 1, "astra": 2, "burning": 2, "through": 1, "void": 1, "with": 1,
    "solar": 2, "logic": 2, "two": 1, "titans": 2, "not": 1, "to": 1, "destroy": 2, "but": 1, "build": 1,
    "what": 1, "eyes": 1, "have": 1, "never": 2, "witnessed": 2, "look": 1, "closer": 2, "canvas": 2,
    "is": 1, "dead": 1, "long": 1, "live": 1, "code": 1,
}

# Per-colour parameters (timeline.json "fx").
FX = {
    "rasp":      dict(dur=1.08, rng=0.80, fry_db=-13.0, sub_db=-15.0, low_shelf=5.0, room=0.20, wet=0.085, comb=False),
    "metallic":  dict(dur=1.08, rng=0.78, fry_db=-14.0, sub_db=-15.0, low_shelf=5.0, room=0.24, wet=0.095, comb=True),
    "growl":     dict(dur=1.08, rng=0.72, fry_db=-9.5,  sub_db=-11.5, low_shelf=5.5, room=0.22, wet=0.085, comb=False),
    "proximity": dict(dur=1.08, rng=0.75, fry_db=-12.0, sub_db=-12.5, low_shelf=8.0, room=0.18, wet=0.075, comb=False),
    "linger":    dict(dur=1.15, rng=0.62, fry_db=-11.0, sub_db=-12.0, low_shelf=6.5, room=0.46, wet=0.15,  comb=False),
}
# The last phrase lingers longest ("final slow, lingering drop").
DUR_OVERRIDE = {"L5a": 1.12, "L5b": 1.15, "L5c": 1.25}


def db(x: float) -> float:
    return 10 ** (x / 20)


def bandpass(x: np.ndarray, lo: float, hi: float, sr: int = SR, order: int = 4) -> np.ndarray:
    sos = butter(order, [lo, hi], btype="bandpass", fs=sr, output="sos")
    return sosfiltfilt(sos, x)


def lowpass(x: np.ndarray, f: float, sr: int = SR, order: int = 4) -> np.ndarray:
    sos = butter(order, f, btype="lowpass", fs=sr, output="sos")
    return sosfiltfilt(sos, x)


def smooth_noise(n: int, sr: int, cutoff_hz: float, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    w = rng.standard_normal(n)
    y = lowpass(w, cutoff_hz, sr, order=2)
    return y / (np.max(np.abs(y)) + 1e-9)


def speech_segments(snd: parselmouth.Sound, drop_db: float = 28.0, merge_gap: float = 0.12):
    inten = snd.to_intensity(minimum_pitch=75, time_step=0.005)
    t, v = inten.xs(), inten.values[0]
    thr = v.max() - drop_db
    segs, on = [], None
    for i, b in enumerate(v > thr):
        if b and on is None:
            on = t[i]
        if not b and on is not None:
            segs.append([on, t[i]])
            on = None
    if on is not None:
        segs.append([on, t[-1]])
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < merge_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] > 0.05]


def group_into(segs, count):
    """Merge across the smallest gaps until the number of phrases matches the script."""
    segs = [list(s) for s in segs]
    while len(segs) > count:
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        k = int(np.argmin(gaps))
        segs[k] = [segs[k][0], segs[k + 1][1]]
        del segs[k + 1]
    if len(segs) != count:
        raise RuntimeError(f"expected {count} phrases, found {len(segs)}")
    return segs


def median_pitch(snd: parselmouth.Sound) -> float:
    p = snd.to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=400).selected_array["frequency"]
    p = p[p > 0]
    return float(np.median(p)) if len(p) else 110.0


def onset_offset(x: np.ndarray, sr: int, drop_db: float = 30.0):
    hop = int(sr * 0.005)
    frames = len(x) // hop
    rms = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(frames)])
    lvl = 20 * np.log10(rms + 1e-12)
    thr = lvl.max() - drop_db
    idx = np.where(lvl > thr)[0]
    return idx[0] * hop / sr, (idx[-1] + 1) * hop / sr


def fry_layer(x: np.ndarray, sr: int, seed: int, rate: float = 36.0, depth: float = 0.88) -> np.ndarray:
    """Glottal-creak rasp: the voice amplitude-modulated by a jittered, shimmering pulse train."""
    n = len(x)
    jit = smooth_noise(n, sr, 6.0, seed) * 0.22
    shim = smooth_noise(n, sr, 9.0, seed + 1) * 0.3
    phase = 2 * np.pi * np.cumsum(rate * (1 + jit)) / sr
    pulse = (0.5 * (1 + np.cos(phase))) ** 7
    mod = (1 - depth) + depth * pulse * (1 + shim)
    return bandpass(x * mod, 220, 3400, sr)


def comb_metal(x: np.ndarray, sr: int, delay_ms: float = 7.3, fb: float = 0.58) -> np.ndarray:
    d = int(sr * delay_ms / 1000)
    y = np.copy(x)
    for i in range(d, len(y)):
        y[i] += fb * y[i - d]
    return bandpass(y, 650, 5200, sr) * 0.35


def syllable_nuclei(x: np.ndarray, sr: int):
    snd = parselmouth.Sound(x, sampling_frequency=sr)
    inten = snd.to_intensity(minimum_pitch=50, time_step=0.004)
    t, v = inten.xs(), inten.values[0]
    pitch = snd.to_pitch(time_step=0.004, pitch_floor=45, pitch_ceiling=300)
    thr = np.percentile(v, 35)
    peaks = []
    for i in range(2, len(v) - 2):
        if v[i] >= v[i - 1] and v[i] >= v[i + 1] and v[i] > thr:
            peaks.append(i)
    # Keep peaks separated by a >= 2 dB dip (de Jong & Wempe), prefer the louder one.
    kept: list[int] = []
    for i in peaks:
        if not kept:
            kept.append(i)
            continue
        j = kept[-1]
        dip = v[j:i + 1].min()
        if min(v[i], v[j]) - dip >= 2.0:
            kept.append(i)
        elif v[i] > v[j]:
            kept[-1] = i
    voiced = []
    for i in kept:
        f0 = pitch.get_value_at_time(t[i])
        if f0 is not None and not math.isnan(f0) and f0 > 0:
            voiced.append((t[i], v[i]))
    return voiced


def reconcile(nuclei, expected: int, start: float, end: float):
    nuc = list(nuclei)
    while len(nuc) > expected:  # merge the closest pair, keep the louder
        gaps = [nuc[i + 1][0] - nuc[i][0] for i in range(len(nuc) - 1)]
        k = int(np.argmin(gaps))
        keep = nuc[k] if nuc[k][1] >= nuc[k + 1][1] else nuc[k + 1]
        nuc[k:k + 2] = [keep]
    times = [n[0] for n in nuc]
    while len(times) < expected:  # split the widest span
        pts = [start] + times + [end]
        spans = [pts[i + 1] - pts[i] for i in range(len(pts) - 1)]
        k = int(np.argmax(spans))
        times.insert(k, (pts[k] + pts[k + 1]) / 2)
        times.sort()
    return times


def word_timings(text: str, times: list[float], start: float, end: float):
    words = text.replace("...", " ").replace("\u2026", " ").split()
    clean = [w.strip(".,!?").lower() for w in words]
    counts = [SYLLABLES[c] for c in clean]
    out, k = [], 0
    for w, c in zip(words, counts):
        out.append({"text": w, "syl": times[k:k + c], "syllables": c})
        k += c
    for i, w in enumerate(out):
        first, last = w["syl"][0], w["syl"][-1]
        w_start = start if i == 0 else (out[i - 1]["syl"][-1] + first) / 2
        w_end = end if i == len(out) - 1 else (last + out[i + 1]["syl"][0]) / 2
        w["start"], w["end"] = w_start, w_end
    return out


def process_phrase(x44: np.ndarray, entry: dict, line_seed: int):
    fx = FX[entry["fx"]]
    dur = DUR_OVERRIDE.get(entry["id"], fx["dur"])
    snd = parselmouth.Sound(x44, sampling_frequency=44100)
    med = median_pitch(snd)
    target = float(np.clip(92.0, med * 2 ** (-7 / 12), med * 2 ** (-3 / 12)))
    # Praat's PSOLA draws internal random numbers: seed it per phrase so the VO rebuilds bit-identically.
    run(f"random_initializeWithSeedUnsafelyButPredictably ({sum(ord(ch) * 31 ** i for i, ch in enumerate(entry['id'])) % 2147483647})")
    shifted = call(snd, "Change gender", 60, 400, 0.88, target, fx["rng"], dur)
    y44 = shifted.values[0].astype(np.float64)
    dry = resample_poly(y44, 160, 147)  # 44.1 k -> 48 k

    clean_board = Pedalboard([
        HighpassFilter(55),
        LowShelfFilter(cutoff_frequency_hz=140, gain_db=fx["low_shelf"], q=0.7),
        PeakFilter(cutoff_frequency_hz=95, gain_db=2.5, q=0.9),
        PeakFilter(cutoff_frequency_hz=380, gain_db=-2.5, q=1.2),
        PeakFilter(cutoff_frequency_hz=3200, gain_db=2.5, q=0.8),
        HighShelfFilter(cutoff_frequency_hz=8500, gain_db=-3.5, q=0.7),
        Compressor(threshold_db=-26, ratio=4, attack_ms=4, release_ms=140),
        Gain(6),
    ])
    clean = clean_board(dry.astype(np.float32), SR).astype(np.float64)

    gravel = Pedalboard([Distortion(drive_db=24), LowpassFilter(5000)])(
        bandpass(dry, 250, 4500).astype(np.float32), SR).astype(np.float64)
    fry = fry_layer(dry, SR, seed=line_seed)
    sub = Pedalboard([PitchShift(semitones=-12), LowpassFilter(300)])(dry.astype(np.float32), SR).astype(np.float64)

    def norm(v):
        return v / (np.max(np.abs(v)) + 1e-9)

    voice = norm(clean) + db(-13.5) * norm(gravel) + db(fx["fry_db"]) * norm(fry) + db(fx["sub_db"]) * norm(sub)
    if fx["comb"]:
        voice = voice + db(-11) * norm(comb_metal(dry, SR))

    pre = int(0.25 * SR)
    tail = int((2.6 if entry["fx"] == "linger" else 1.2) * SR)
    padded = np.concatenate([np.zeros(pre), voice, np.zeros(tail)])
    room = Reverb(room_size=fx["room"], damping=0.82, wet_level=fx["wet"], dry_level=1.0, width=0.55)
    stereo = np.stack([padded, padded]).astype(np.float32)
    master = Pedalboard([
        room,
        Compressor(threshold_db=-18, ratio=3, attack_ms=8, release_ms=180),
        Limiter(threshold_db=-1.5, release_ms=120),
    ])
    out = master(stereo, SR).astype(np.float64)
    dry_padded = np.concatenate([np.zeros(pre), dry, np.zeros(tail)])
    return out, dry_padded, med, target, dur


def main() -> None:
    tl = json.loads(TIMELINE.read_text())
    fps = tl["fps"]
    BUILD.mkdir(parents=True, exist_ok=True)
    OUT_WAV.parent.mkdir(parents=True, exist_ok=True)
    track = np.zeros((2, int(DURATION_S * SR)))

    # A phrase may come from any take: `seg` indexes the take's phrases, `segCount` says how many the take holds
    # (defaults to the number of timeline entries sharing that file). Alternate takes replace over-emphatic reads.
    per_file: dict[str, int] = {}
    for e in tl["vo"]:
        per_file[e["file"]] = per_file.get(e["file"], 0) + 1
    seg_cache: dict[tuple[str, int], tuple[np.ndarray, list]] = {}

    phrases_out = []
    if True:
        for entry in tl["vo"]:
            file_name = entry["file"]
            count = entry.get("segCount", per_file[file_name])
            key = (file_name, count)
            if key not in seg_cache:
                x44, sr = sf.read(RAW / file_name)
                assert sr == 44100, f"{file_name}: expected 44.1 kHz, got {sr}"
                x44 = x44 if x44.ndim == 1 else x44.mean(axis=1)
                seg_cache[key] = (x44, group_into(speech_segments(parselmouth.Sound(x44, sampling_frequency=sr)), count))
            x44, segs = seg_cache[key]
            sr = 44100
            idx = entry["seg"]
            a, b = segs[idx]
            line_seed = 9100 + entry["line"] * 17
            lo = max(0.0, a - 0.06 if idx == 0 else (segs[idx - 1][1] + a) / 2)
            hi = min(len(x44) / sr, b + 0.18 if idx == len(segs) - 1 else (b + segs[idx + 1][0]) / 2)
            piece = x44[int(lo * sr):int(hi * sr)]
            wet, dry, med, target, dur = process_phrase(piece, entry, line_seed + idx)
            on, off = onset_offset(dry, SR)
            start_sample = int(round(entry["onset"] * SR - on * SR))
            end_sample = start_sample + wet.shape[1]
            if end_sample > track.shape[1]:
                wet = wet[:, : track.shape[1] - start_sample]
                end_sample = track.shape[1]
            track[:, start_sample:end_sample] += wet
            sf.write(BUILD / f"{entry['id']}.wav", wet.T, SR, subtype="PCM_24")

            # word alignment on the pitch-shifted dry phrase (timing-identical to the wet one)
            nuclei = syllable_nuclei(dry, SR)
            words_text = entry["text"].replace("...", " ").split()
            expected = sum(SYLLABLES[w.strip(".,!?").lower()] for w in words_text)
            times = reconcile(nuclei, expected, on, off)
            words = word_timings(entry["text"], times, on, off)
            shift = entry["onset"] - on
            for w in words:
                w["start"] = round(w["start"] + shift, 4)
                w["end"] = round(w["end"] + shift, 4)
                w["startFrame"] = int(round(w["start"] * fps))
                w["endFrame"] = int(round(w["end"] * fps))
                w["syl"] = [round(s + shift, 4) for s in w["syl"]]
            p_start, p_end = entry["onset"], round(off + shift, 4)
            phrases_out.append({
                "id": entry["id"], "line": entry["line"], "text": entry["text"], "fx": entry["fx"],
                "start": p_start, "end": p_end,
                "startFrame": int(round(p_start * fps)), "endFrame": int(round(p_end * fps)),
                "sourceMedianHz": round(med, 1), "targetMedianHz": round(target, 1),
                "semitones": round(12 * math.log2(target / med), 2), "durationFactor": dur,
                "nucleiDetected": len(nuclei), "syllablesExpected": expected,
                "words": words,
            })
            print(f"{entry['id']:>4}  {p_start:6.2f}-{p_end:6.2f}s  f0 {med:5.1f}->{target:5.1f} Hz "
                  f"({12 * math.log2(target / med):+.1f} st)  dur x{dur}  nuclei {len(nuclei)}/{expected}  "
                  + " ".join(f"{w['text']}@{w['start']:.2f}" for w in words))

    phrases_out.sort(key=lambda p: p["start"])
    for a, b in zip(phrases_out, phrases_out[1:]):
        if a["end"] > b["start"]:
            raise RuntimeError(f"phrase overlap: {a['id']} ends {a['end']} > {b['id']} starts {b['start']}")
    peak = np.max(np.abs(track))
    if peak > 0.98:
        track *= 0.98 / peak
    sf.write(OUT_WAV, track.T, SR, subtype="PCM_24")

    # Word-driven picture/sound events, quantized to the 100 BPM 16th-note grid (9 frames @ 60 fps).
    def word_frame(phrase_id: str, word: str) -> int:
        p = next(p for p in phrases_out if p["id"] == phrase_id)
        w = next(w for w in p["words"] if w["text"].strip(".,!?").lower() == word)
        return int(round(w["start"] * fps / 9.0) * 9)

    derived = {
        "handDrawn": word_frame("L1a", "hand-drawn"),
        "glassShatter": word_frame("L1b", "glass"),
        "timeAccent": word_frame("L1b", "time"),
        "opusWord": word_frame("L2a", "opus"),
        "geometryWord": word_frame("L2b", "geometry"),
        "astraWord": word_frame("L3a", "astra"),
        "solarWord": word_frame("L3b", "solar"),
        "titansWord": word_frame("L4a", "titans"),
        "destroyWord": word_frame("L4b", "destroy"),
        "neverWord": word_frame("L4c", "never"),
        "closerWord": word_frame("L5a", "closer"),
        "canvasWord": word_frame("L5b", "canvas"),
        "deadWord": word_frame("L5b", "dead"),
        "codeWord": word_frame("L5c", "code"),
    }
    OUT_WORDS.write_text(json.dumps({"fps": fps, "sampleRate": SR, "derivedEvents": derived,
                                     "phrases": phrases_out}, indent=2) + "\n")
    print("derived events:", derived)
    print(f"\nwrote {OUT_WAV.relative_to(ROOT)} ({track.shape[1] / SR:.3f}s) and {OUT_WORDS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
