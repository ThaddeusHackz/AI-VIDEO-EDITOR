#!/usr/bin/env python3
"""Tile stills into one contact sheet: python3 scripts/sheet.py out.jpg a.jpg b.jpg ..."""
import sys
from PIL import Image
out, *files = sys.argv[1:]
ims = [Image.open(f) for f in files]
h = max(i.height for i in ims)
w = sum(i.width for i in ims)
sheet = Image.new("RGB", (w, h), (20, 20, 20))
x = 0
for im in ims:
    sheet.paste(im, (x, 0)); x += im.width
sheet.save(out, quality=88)
print(out, sheet.size)
