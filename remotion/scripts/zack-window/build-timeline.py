#!/usr/bin/env python3
"""
Build the scene/word timeline for the ZackWindow-Short composition.

- Reads each narration WAV in public/zack-window/vo/ (one clip per sentence group)
- Measures the real duration + trims leading/trailing silence (RMS gate)
- Distributes the words of each clip across its voiced span, weighted by
  word length (a syllable proxy), so word-by-word captions land close to
  the narrator without needing a cloud ASR (sandbox has no model access)
- Writes src/zack-window/timeline.json consumed by the composition

Deterministic: same inputs -> same JSON. No numpy; stdlib only.
"""
from __future__ import annotations

import audioop  # stdlib in 3.11 (deprecated in 3.13, fine here)
import json
import re
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]  # remotion/
VO_DIR = ROOT / "public" / "zack-window" / "vo"
OUT = ROOT / "src" / "zack-window" / "timeline.json"

FPS = 30
GAP_SEC = 0.22          # breath between clips
LEAD_IN_SEC = 0.35      # black -> first frame before narration starts
TAIL_SEC = 1.6          # hold on final frame

# Scene script: (clip file, image, camera preset, caption words, overlays)
SCENES = [
    {
        "clip": "c1.wav", "image": "s1.jpg", "camera": "push-to-glass", "grade": "clean-studio",
        "text": "Next time you fly, look closely at your window. There's a tiny hole in it. And it's keeping you alive.",
        "title": "THE TINY HOLE IN PLANE WINDOWS 🤔",
        "emphasis": ["tiny", "hole", "alive."],
    },
    {
        "clip": "c2.wav", "image": "s2.jpg", "camera": "crane-up", "grade": "teal-orange-cinema",
        "text": "At thirty-five thousand feet, the air is so thin you'd pass out in under a minute.",
        "emphasis": ["thirty-five", "thousand", "pass", "out"],
    },
    {
        "clip": "c3.wav", "image": "s3.jpg", "camera": "crash-zoom", "grade": "teal-orange-cinema",
        "text": "So the cabin is pumped full of pressurized air, pushing on every window with over a thousand pounds of force.",
        "emphasis": ["pressurized", "thousand", "pounds"],
        "callout": {"text": "1,000+ lbs", "atWord": "thousand"},
    },
    {
        "clip": "c4.wav", "image": "s4.jpg", "camera": "orbit-360", "grade": "clean-studio",
        "text": "That's why your window isn't glass. It's three layers of acrylic.",
        "emphasis": ["isn't", "glass.", "three", "layers"],
        "callout": {"text": "3 LAYERS", "atWord": "three"},
    },
    {
        "clip": "c5.wav", "image": "s5.jpg", "camera": "dolly-zoom", "grade": "teal-orange-cinema",
        "text": "The outer pane takes almost all of that pressure. The middle pane is the backup.",
        "emphasis": ["outer", "pressure.", "backup."],
    },
    {
        "clip": "c6.wav", "image": "s6.jpg", "camera": "push-to-glass", "grade": "cyber-neon",
        "text": "And that tiny hole, called a bleed hole, lets a little air into the gap, so the outer pane carries the load, not the middle one.",
        "emphasis": ["bleed", "hole,", "load,"],
        "callout": {"text": "“BLEED HOLE”", "atWord": "bleed"},
    },
    {
        "clip": "c7.wav", "image": "s7.jpg", "camera": "handheld-cinema", "grade": "editorial-film",
        "text": "If the outer pane ever cracks, the middle one holds, and the hole lets the pressure change slowly, instead of all at once.",
        "emphasis": ["cracks,", "holds,", "slowly,"],
        "shake": True,
    },
    {
        "clip": "c8.wav", "image": "s8.jpg", "camera": "dolly-zoom", "grade": "teal-orange-cinema",
        "text": "It also stops the window from fogging up. So that tiny hole is the reason you can see the clouds at all.",
        "emphasis": ["fogging", "tiny", "hole", "clouds"],
    },
]


def voiced_span(path: Path) -> tuple[float, float, float]:
    """Return (duration, voiced_start, voiced_end) in seconds using a 20 ms RMS gate."""
    with wave.open(str(path)) as w:
        sr, ch, sw, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
        raw = w.readframes(n)
    if ch > 1:
        raw = audioop.tomono(raw, sw, 0.5, 0.5)
    duration = n / sr
    hop = int(sr * 0.02)
    frame_bytes = hop * sw
    rms = [audioop.rms(raw[i:i + frame_bytes], sw) for i in range(0, len(raw) - frame_bytes, frame_bytes)]
    peak = max(rms) or 1
    gate = peak * 0.06
    voiced = [i for i, v in enumerate(rms) if v > gate]
    if not voiced:
        return duration, 0.0, duration
    start = max(0.0, voiced[0] * 0.02 - 0.04)
    end = min(duration, (voiced[-1] + 1) * 0.02 + 0.06)
    return duration, start, end


def word_weight(word: str) -> float:
    core = re.sub(r"[^A-Za-z0-9'-]", "", word)
    syl = max(1, len(re.findall(r"[aeiouyAEIOUY]+", core)))
    w = 0.55 + 0.45 * syl + 0.02 * len(core)
    if word.endswith((",", ".", "?", "!")):
        w += 0.45  # pause after punctuation
    return w


def main() -> None:
    t = LEAD_IN_SEC
    scenes_out = []
    for idx, s in enumerate(SCENES):
        dur, vs, ve = voiced_span(VO_DIR / s["clip"])
        words = s["text"].split()
        weights = [word_weight(w) for w in words]
        total = sum(weights)
        span = max(0.3, ve - vs)
        cursor = t + vs
        tokens = []
        for w, wt in zip(words, weights):
            length = span * wt / total
            tokens.append({
                "text": w,
                "startSec": round(cursor, 3),
                "endSec": round(cursor + length, 3),
                "emphasis": w in s.get("emphasis", []),
            })
            cursor += length
        scene_start = t
        scene_end = t + dur + GAP_SEC
        callout = None
        if s.get("callout"):
            hit = next((tk for tk in tokens if tk["text"].lower().startswith(s["callout"]["atWord"].lower())), tokens[0])
            callout = {"text": s["callout"]["text"], "startSec": hit["startSec"]}
        scenes_out.append({
            "id": f"scene-{idx + 1}",
            "image": f"zack-window/img/{s['image']}",
            "audio": f"zack-window/vo/{s['clip']}",
            "camera": s["camera"],
            "grade": s["grade"],
            "startSec": round(scene_start, 3),
            "audioStartSec": round(t, 3),
            "endSec": round(scene_end, 3),
            "startFrame": round(scene_start * FPS),
            "endFrame": round(scene_end * FPS),
            "title": s.get("title"),
            "callout": callout,
            "shake": bool(s.get("shake")),
            "tokens": tokens,
        })
        t = scene_end

    total_frames = round((t + TAIL_SEC) * FPS)
    timeline = {
        "fps": FPS,
        "width": 1080,
        "height": 1920,
        "durationInFrames": total_frames,
        "scenes": scenes_out,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(timeline, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(scenes_out)} scenes, {total_frames} frames = {total_frames / FPS:.1f}s")
    for sc in scenes_out:
        print(f"  {sc['id']:8s} {sc['startSec']:6.2f}s -> {sc['endSec']:6.2f}s  {sc['camera']:16s} words={len(sc['tokens'])}")


if __name__ == "__main__":
    main()
