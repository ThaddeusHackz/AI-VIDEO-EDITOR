#!/usr/bin/env python3
"""score_frames.py — per-frame 1–10 scoring for The Singularity Engine (self-critique loop, FILM.md §7).

Every rendered frame gets four component scores and a weighted total:

  density      edge energy · palette coverage · colourfulness · luminance entropy        (high-octane brief)
  clarity      RMS contrast · Laplacian sharpness · highlight clipping                    (seam frames exempt
                                                                                           from sharpness)
  motion       motion energy vs. the shot's intent · single-frame stutter (jerk) · flash   (60 fps fluidity +
               frames · dead-frame runs                                                    "motion variance")
  typography   per-shot visual review score (typographic hierarchy + composition) from qa/review.json —
               assigned by a human-style look at contact sheets, NOT computed

  total = 0.25·density + 0.25·clarity + 0.30·motion + 0.20·typography   (floored to 2 decimals: 7.995 fails)

Both formats are analysed at the same isotropic 4x downscale (480x270 / 270x480), so a 9:16 score means what a 16:9
score means.

Shot INTENT is declared up front in review.json (e.g. S11 is a near-black signature by design, the 1554–1583
stillness comma is meant to be calm). Intent changes the target a frame is scored against; it never hides a frame.

Usage:
  python3 score_frames.py --frames <dir of frame-NNNN.jpeg> --comp master|vertical [--out reports/]
Outputs:
  reports/<comp>_scores.json   per-frame components + totals, per-shot stats, failing frames (< 8)
  reports/<comp>_scores.md     human summary
  reports/<comp>_lowest.jpg    contact sheet of the 12 lowest-scoring frames (visual re-check)
"""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TL = json.loads((ROOT / "remotion/src/singularity/timeline.json").read_text())
REVIEW = json.loads((HERE / "review.json").read_text())

W_DENSITY, W_CLARITY, W_MOTION, W_TYPO = 0.25, 0.25, 0.30, 0.20


def floor2(x: float) -> float:
    """Floor to 2 decimals (1e-9 absorbs float noise in the weighted sum)."""
    return math.floor(x * 100 + 1e-9) / 100


def load(path: Path) -> np.ndarray:
    im = Image.open(path).convert("RGB")
    # Every format is analysed at the same isotropic 4x downscale (1920x1080 -> 480x270, 1080x1920 -> 270x480), so
    # the per-pixel metrics (edge energy, Laplacian sharpness, motion) mean the same thing in the master and the
    # vertical. Squashing a portrait frame into 480x270 would blur it 7x vertically and 2.25x horizontally.
    size = (480, 270) if im.width >= im.height else (270, 480)
    im = im.resize(size, Image.BILINEAR)
    return np.asarray(im, dtype=np.float32) / 255.0


def luma(rgb: np.ndarray) -> np.ndarray:
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def sobel_mag(y: np.ndarray) -> float:
    gx = np.zeros_like(y)
    gy = np.zeros_like(y)
    gx[:, 1:-1] = y[:, 2:] - y[:, :-2]
    gy[1:-1, :] = y[2:, :] - y[:-2, :]
    return float(np.mean(np.hypot(gx, gy)))


def laplacian_var(y: np.ndarray) -> float:
    lap = -4 * y[1:-1, 1:-1] + y[:-2, 1:-1] + y[2:, 1:-1] + y[1:-1, :-2] + y[1:-1, 2:]
    return float(np.var(lap))


def colourfulness(rgb: np.ndarray) -> float:
    rg = rgb[..., 0] - rgb[..., 1]
    yb = 0.5 * (rgb[..., 0] + rgb[..., 1]) - rgb[..., 2]
    return float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))


def entropy(y: np.ndarray) -> float:
    h, _ = np.histogram(y, bins=64, range=(0, 1))
    p = h / max(1, h.sum())
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum() / 6.0)


def clamp01(v: float) -> float:
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def shot_of(frame: int) -> dict:
    for s in TL["shots"]:
        if s["from"] <= frame < s["to"]:
            return s
    return TL["shots"][-1]


def intent_for(frame: int) -> dict:
    """Per-frame intent: shot defaults overridden by any declared window."""
    s = shot_of(frame)
    it = dict(REVIEW["defaults"])
    it.update(REVIEW["shots"].get(s["id"], {}).get("intent", {}))
    for w in REVIEW.get("windows", []):
        if w["from"] <= frame < w["to"]:
            it.update(w["intent"])
    return it


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", required=True)
    ap.add_argument("--comp", required=True)
    ap.add_argument("--out", default=str(HERE / "reports"))
    args = ap.parse_args()
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    files = sorted(Path(args.frames).glob("*.jp*g")) + sorted(Path(args.frames).glob("*.png"))
    frames = {}
    for f in files:
        m = re.search(r"(\d+)\.(jpe?g|png)$", f.name)
        if m:
            frames[int(m.group(1))] = f
    idx = sorted(frames)
    if not idx:
        raise SystemExit("no frames found")
    cut_frames = {c["frame"] for c in TL["cuts"]}
    near_cut = lambda f: any(abs(f - c) <= 16 for c in cut_frames)

    feats = {}
    small = {}
    for f in idx:
        rgb = load(frames[f])
        y = luma(rgb)
        feats[f] = {
            "edge": sobel_mag(y),
            "coverage": float((y > 0.06).mean()),
            "colour": colourfulness(rgb),
            "entropy": entropy(y),
            "contrast": float(y.std()),
            "sharp": laplacian_var(y),
            "clip": float((y > 0.985).mean()),
            "meanY": float(y.mean()),
        }
        y8 = Image.fromarray((y * 255).astype(np.uint8))
        small[f] = np.asarray(y8.resize((y8.width // 2, y8.height // 2), Image.BILINEAR), dtype=np.float32) / 255.0

    motion = {}
    for i, f in enumerate(idx):
        prev = idx[i - 1] if i > 0 and idx[i - 1] == f - 1 else None
        motion[f] = float(np.mean(np.abs(small[f] - small[prev]))) if prev is not None else None
    med_motion = float(np.median([m for m in motion.values() if m is not None] or [0.01]))

    results = []
    for i, f in enumerate(idx):
        ft = feats[f]
        it = intent_for(f)
        s = shot_of(f)
        # density vs. the shot's declared target
        d_raw = 0.35 * clamp01(ft["edge"] / 0.03) + 0.25 * clamp01(ft["coverage"] / 0.32) + 0.2 * clamp01(ft["colour"] / 0.2) + 0.2 * clamp01(ft["entropy"] / 0.62)
        density = 10 * clamp01(d_raw / it["density"])
        # clarity: contrast + sharpness (seams/rack-focus exempt from sharpness) − blow-out
        # sharpness is scaled by the declared density intent, exactly like the contrast term (a near-black-by-design
        # frame has proportionally less high-frequency content; it is not "soft")
        sharp_n = 1.0 if (near_cut(f) or it.get("blurOk")) else clamp01(ft["sharp"] / (0.0016 * it["density"]))
        clarity = 10 * clamp01(0.55 * clamp01(ft["contrast"] / (0.16 * it["density"])) + 0.45 * sharp_n) - 25 * max(0.0, ft["clip"] - 0.03)
        # motion: energy vs intent, stutter, flashes, dead runs
        m = motion.get(f)
        if m is None:
            m = motion.get(idx[i + 1]) if i + 1 < len(idx) else med_motion
            m = m if m is not None else med_motion
        level = clamp01(m / it["motion"])
        jerk = 0.0
        if 0 < i < len(idx) - 1 and motion.get(idx[i + 1]) is not None and motion.get(f) is not None and motion.get(idx[i - 1]) is not None and not near_cut(f):
            a, b, c = motion[idx[i - 1]], motion[f], motion[idx[i + 1]]
            floor = 0.003
            if min(a, c) > floor and b < 0.25 * min(a, c):
                jerk = 1.0  # a held / duplicated frame between moving neighbours
            elif b > floor and b > 4.0 * max(a, c, floor):
                jerk = 1.0  # a pop / skipped frame
        flash = 0.0
        if 0 < i < len(idx) - 1 and not near_cut(f):
            dy1 = ft["meanY"] - feats[idx[i - 1]]["meanY"]
            dy2 = ft["meanY"] - feats[idx[i + 1]]["meanY"]
            if dy1 > 0.1 and dy2 > 0.1:
                flash = 1.0
        dead = m < 0.0008
        motion_s = 10 * (0.25 + 0.75 * level) * (1 - 0.5 * jerk) - 4 * flash - (4 if dead else 0)
        typo = REVIEW["shots"].get(s["id"], {}).get("typography", 8.0)
        total = W_DENSITY * density + W_CLARITY * clarity + W_MOTION * motion_s + W_TYPO * typo
        results.append({
            "frame": f, "shot": s["id"], "density": round(max(1, min(10, density)), 2), "clarity": round(max(1, min(10, clarity)), 2),
            # the total is FLOORED to 2 decimals: a frame reported as 8.00 really is >= 8 (rounding let 7.995 pass)
            "motion": round(max(1, min(10, motion_s)), 2), "typography": typo, "total": floor2(max(1, min(10, total))),
            "motionEnergy": round(m, 5), "jerk": round(jerk, 3), "flash": bool(flash), "dead": bool(dead),
        })

    failing = [r for r in results if r["total"] < 8.0]
    by_shot = {}
    for r in results:
        by_shot.setdefault(r["shot"], []).append(r["total"])
    stats = {k: {"min": round(min(v), 2), "mean": round(float(np.mean(v)), 2), "frames": len(v), "below8": sum(1 for x in v if x < 8)} for k, v in by_shot.items()}
    report = {
        "comp": args.comp, "frames": len(results), "weights": {"density": W_DENSITY, "clarity": W_CLARITY, "motion": W_MOTION, "typography": W_TYPO},
        "min": round(min(r["total"] for r in results), 2), "mean": round(float(np.mean([r["total"] for r in results])), 2),
        "below8": len(failing), "failingFrames": [r["frame"] for r in failing], "shots": stats, "perFrame": results,
    }
    (out / f"{args.comp}_scores.json").write_text(json.dumps(report, separators=(",", ":")) + "\n")

    # failing ranges (for targeted re-render)
    ranges = []
    for f in report["failingFrames"]:
        if ranges and f <= ranges[-1][1] + 1:
            ranges[-1][1] = f
        else:
            ranges.append([f, f])
    md = [f"# Frame scores — {args.comp}", "", f"- frames scored: **{len(results)}**", f"- mean **{report['mean']}** · min **{report['min']}** · below 8: **{len(failing)}**", "",
          "| shot | frames | mean | min | < 8 |", "|---|---|---|---|---|"]
    for k in sorted(stats, key=lambda x: int(x[1:])):
        v = stats[k]
        md.append(f"| {k} | {v['frames']} | {v['mean']} | {v['min']} | {v['below8']} |")
    md += ["", "Failing ranges: " + (", ".join(f"{a}-{b}" for a, b in ranges) if ranges else "none")]
    (out / f"{args.comp}_scores.md").write_text("\n".join(md) + "\n")

    lowest = sorted(results, key=lambda r: r["total"])[:12]
    tiles = [Image.open(frames[r["frame"]]).convert("RGB").resize((384, 216) if Image.open(frames[r["frame"]]).width > Image.open(frames[r["frame"]]).height else (152, 270)) for r in lowest]
    tw, th = tiles[0].size
    sheet = Image.new("RGB", (tw * 4, (th + 18) * 3), (20, 20, 20))
    dr = ImageDraw.Draw(sheet)
    for k, (r, t) in enumerate(zip(lowest, tiles)):
        x, y = (k % 4) * tw, (k // 4) * (th + 18)
        sheet.paste(t, (x, y + 18))
        dr.text((x + 4, y + 3), f"f{r['frame']} {r['shot']} total {r['total']} (d{r['density']} c{r['clarity']} m{r['motion']})", fill=(255, 220, 180))
    sheet.save(out / f"{args.comp}_lowest.jpg", quality=85)
    print("\n".join(md))


if __name__ == "__main__":
    main()
