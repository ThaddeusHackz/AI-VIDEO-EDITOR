#!/usr/bin/env python3
"""Rebuild the ZackWindow-Short audio mix exactly as the composition defines it (VO beats,
SFX, pad ramp) and mux it onto an already-rendered video — so sound changes don't need a
55-minute 3D re-render.  Usage:  python3 scripts/zw-remix.py out/zack-window-v2.mp4 out/final.mp4
"""
import re, subprocess, sys, wave
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR, FPS, TOTAL = 48000, 30, 1257
src_mp4, dst_mp4 = sys.argv[1], sys.argv[2]
n = int(TOTAL / FPS * SR)
mix = np.zeros(n)

def load(path):
    w = wave.open(str(path)); r, ch = w.getframerate(), w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768
    if ch > 1: x = x.reshape(-1, ch).mean(axis=1)
    if r != SR:
        x = np.interp(np.arange(int(len(x) * SR / r)) / SR, np.arange(len(x)) / r, x)
    return x

def place(x, start_frame, gain, max_frames=None):
    i0 = int(round(start_frame / FPS * SR))
    if max_frames is not None: x = x[: int(max_frames / FPS * SR)]
    i1 = min(n, i0 + len(x))
    mix[i0:i1] += x[: i1 - i0] * (gain if np.isscalar(gain) else gain[i0:i1])

tl = (ROOT / "src/zack-window/timeline.ts").read_text()
beats = re.findall(r'id:\s*"(b\d)",\s*file:\s*"([^"]+)",\s*from:\s*s\(([\d.]+)\),\s*duration:\s*s\(([\d.]+)\)', tl)
assert len(beats) == 6, beats
for _, f, frm, dur in beats:
    place(load(ROOT / "public/zack-window/vo" / f), round(float(frm) * FPS), 0.95, round(float(dur) * FPS))

comp = (ROOT / "src/zack-window/ZackWindowShort.tsx").read_text()
sfx = re.findall(r'name:\s*"(\w+)",\s*frame:\s*(\d+),\s*frames:\s*(\d+),\s*volume:\s*([\d.]+)', comp)
assert sfx, "no SFX table found"
for name, frame, frames, vol in sfx:
    place(load(ROOT / "public/zack-window/sfx" / f"{name}.wav"), int(frame), float(vol), int(frames))

bed_vol = re.search(r"\[0, 20, TOTAL_FRAMES - 45, TOTAL_FRAMES - 1\], \[0, ([\d.]+), ([\d.]+), 0\]", comp)
hi = float(bed_vol.group(1)) if bed_vol else 0.3
g = np.interp(np.arange(n) / SR * FPS, [0, 20, TOTAL - 45, TOTAL - 1], [0, hi, hi, 0])
place(load(ROOT / "public/zack-window/music/bed.wav"), 0, g)

peak = float(np.max(np.abs(mix)))
if peak > 0.98: mix *= 0.98 / peak
tmp = ROOT / "out/zw-mix.wav"
with wave.open(str(tmp), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
ff = ROOT / "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
subprocess.check_call([str(ff), "-v", "error", "-y", "-i", src_mp4, "-i", str(tmp), "-map", "0:v:0", "-map", "1:a:0",
                       "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-shortest", "-movflags", "+faststart", dst_mp4])
print(f"peak {peak:.3f} → wrote {dst_mp4}")
