#!/usr/bin/env python3
"""contact_sheet.py — full-runtime contact sheet (every 0.5 s = 30 frames @ 60 fps) with per-frame scores.

  python3 contact_sheet.py --frames <dir> --comp master|vertical [--every 30]
Writes qa/reports/<comp>_contact.jpg (kept < 500 KB to respect the repo's large-file guard).
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", required=True)
    ap.add_argument("--comp", required=True)
    ap.add_argument("--every", type=int, default=30)
    args = ap.parse_args()
    fdir = Path(args.frames)
    scores = {}
    rep = HERE / "reports" / f"{args.comp}_scores.json"
    if rep.exists():
        scores = {p["frame"]: p["total"] for p in json.loads(rep.read_text())["perFrame"]}
    frames = list(range(0, 1800, args.every))
    first = Image.open(fdir / "frame-0000.jpeg")
    portrait = first.height > first.width
    tw, th = (180, 320) if portrait else (256, 144)
    cols = 12 if portrait else 10
    rows = (len(frames) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 14)), (16, 16, 18))
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames):
        p = fdir / f"frame-{f:04d}.jpeg"
        if not p.exists():
            continue
        im = Image.open(p).convert("RGB").resize((tw, th), Image.BILINEAR)
        x, y = (i % cols) * tw, (i // cols) * (th + 14)
        sheet.paste(im, (x, y + 14))
        s = scores.get(f)
        label = f"{f / 60:5.1f}s f{f}" + (f"  {s:.1f}" if s is not None else "")
        d.text((x + 3, y + 1), label, fill=(255, 210, 170) if (s is None or s >= 8) else (255, 90, 90))
    out = HERE / "reports" / f"{args.comp}_contact.jpg"
    q = 82
    while True:
        sheet.save(out, quality=q)
        if out.stat().st_size < 480_000 or q <= 50:
            break
        q -= 6
    print(out, sheet.size, f"{out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
