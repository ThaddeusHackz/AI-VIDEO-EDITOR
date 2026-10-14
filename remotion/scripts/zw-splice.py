#!/usr/bin/env python3
"""Splice a partially re-rendered frame range into an existing full render WITHOUT re-encoding.

    python3 scripts/zw-splice.py out/base.mp4 out/segment.mp4 <firstFrame> out/final.mp4

`segment.mp4` must be a Remotion render of `--frames=<firstFrame>-<lastFrame>` with the SAME encoder
settings as the base (crf / jpeg-quality / fps / size). The base must have keyframes exactly at
<firstFrame> and at <lastFrame>+1 (or end there) – Remotion/x264 puts scene-cut keyframes on every hard
cut, so pick a range that starts and ends on shot boundaries (`ffprobe -show_entries packet=pts_time,flags`
lists them). The base's audio track is copied through untouched.
"""
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.path.join(HERE, "..", "node_modules", "@remotion", "compositor-linux-x64-gnu")
FFMPEG, FFPROBE = os.path.join(FF, "ffmpeg"), os.path.join(FF, "ffprobe")


def run(args, **kw):
    return subprocess.run(args, check=True, capture_output=True, text=True, **kw)


def frame_count(path):
    out = run([FFPROBE, "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries", "stream=nb_read_packets,r_frame_rate", "-of", "flat", path]).stdout
    vals = dict(line.split("=", 1) for line in out.splitlines() if "=" in line)
    n = int(vals["streams.stream.0.nb_read_packets"].strip('"'))
    num, den = vals["streams.stream.0.r_frame_rate"].strip('"').split("/")
    return n, float(num) / float(den)


def keyframes(path, fps):
    out = run([FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time,flags", "-of", "csv=p=0", path]).stdout
    ks = set()
    for line in out.splitlines():
        parts = line.split(",")
        if len(parts) >= 2 and "K" in parts[1]:
            ks.add(int(round(float(parts[0]) * fps)))
    return ks


def main():
    if len(sys.argv) != 5:
        print(__doc__)
        sys.exit(1)
    base, seg, first, final = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
    n_base, fps = frame_count(base)
    n_seg, fps_seg = frame_count(seg)
    assert abs(fps - fps_seg) < 1e-6, f"fps mismatch {fps} vs {fps_seg}"
    last = first + n_seg - 1
    after = last + 1
    ks = keyframes(base, fps)
    assert first == 0 or first in ks, f"base has no keyframe at frame {first}; keyframes: {sorted(ks)}"
    assert after >= n_base or after in ks, f"base has no keyframe at frame {after}; keyframes: {sorted(ks)}"

    with tempfile.TemporaryDirectory(dir=os.path.dirname(os.path.abspath(final)) or ".") as tmp:
        parts = []
        if first > 0:
            a = os.path.join(tmp, "A.mp4")
            run([FFMPEG, "-v", "error", "-y", "-i", base, "-map", "0:v:0", "-frames:v", str(first), "-c", "copy", "-an", a])
            assert frame_count(a)[0] == first
            parts.append(a)
        parts.append(os.path.abspath(seg))
        if after < n_base:
            c = os.path.join(tmp, "C.mp4")
            run([FFMPEG, "-v", "error", "-y", "-ss", f"{after / fps:.6f}", "-i", base, "-map", "0:v:0", "-c", "copy", "-an", c])
            assert frame_count(c)[0] == n_base - after, f"tail has {frame_count(c)[0]} frames, expected {n_base - after}"
            parts.append(c)
        lst = os.path.join(tmp, "list.txt")
        with open(lst, "w") as f:
            for p in parts:
                f.write(f"file '{p}'\n")
        run([FFMPEG, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", base, "-map", "0:v:0", "-map", "1:a:0?", "-c", "copy", "-movflags", "+faststart", final])
    n_final, _ = frame_count(final)
    assert n_final == n_base, f"final has {n_final} frames, base {n_base}"
    print(f"{final}: {n_final} frames @ {fps:g} fps — frames {first}-{last} replaced, rest copied losslessly")


if __name__ == "__main__":
    main()
