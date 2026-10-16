"""Design system + compositing primitives.

Palette tokens come from this repo, not from taste:
  * themes/bold.css      --bg --fg --muted --surface --border --brand --accent --accent-2
  * DESIGN.md dark mode  --bg #0a0a0a, surface, border, text tokens, syntax accents
Fonts are the offline .woff2 set in toolkit/fonts (zero CDN dependency at render time,
per the repo's own toolkit contract).
"""

from __future__ import annotations

import os
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
)  # videos/<project>/ -> repository root
FONT_DIR = os.path.join(REPO_ROOT, "toolkit", "fonts")

W, H = 1920, 1080


def hex2rgb(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4))  # type: ignore[return-value]


# --- themes/bold.css ------------------------------------------------------- #
BG = hex2rgb("#080611")
FG = hex2rgb("#fff8ff")
MUTED = hex2rgb("#b6a9ca")
SURFACE = hex2rgb("#1b1230")
BORDER = hex2rgb("#493668")
BRAND = hex2rgb("#ff3d81")
ACCENT = hex2rgb("#7c5cff")
ACCENT2 = hex2rgb("#00d4ff")

# --- DESIGN.md dark mode --------------------------------------------------- #
DM_BG = hex2rgb("#0a0a0a")
DM_SURFACE = hex2rgb("#141414")
DM_BORDER = hex2rgb("#2a2a2a")
DM_TEXT = hex2rgb("#e5e5e5")
DM_TEXT_2 = hex2rgb("#a0a0a0")
DM_TEXT_3 = hex2rgb("#666666")
SYNTAX_KEYWORD = hex2rgb("#c084fc")
SYNTAX_FUNCTION = hex2rgb("#22d3ee")
SYNTAX_STRING = hex2rgb("#4ade80")
SYNTAX_NUMBER = hex2rgb("#fbbf24")
SYNTAX_TAG = hex2rgb("#fb923c")
SYNTAX_COMMENT = hex2rgb("#555555")

# --- vfxShaders.tsx defaults ---------------------------------------------- #
FLARE_COLOR = hex2rgb("#35D9F2")
FLARE_SECONDARY = hex2rgb("#FFB23F")

# --- toolkit/fonts --------------------------------------------------------- #
FONTS = {
    "inter-400": "inter-400.woff2",
    "inter-500": "inter-500.woff2",
    "inter-600": "inter-600.woff2",
    "inter-700": "inter-700.woff2",
    "inter-800": "inter-800.woff2",
    "inter-900": "inter-900.woff2",
    "sg-400": "sg-400.woff2",
    "sg-700": "sg-700.woff2",
    "mono-400": "mono-400.woff2",
    "mono-700": "mono-700.woff2",
    "cinzel-700": "cinzel-700.woff2",
}


@lru_cache(maxsize=64)
def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(FONT_DIR, FONTS[name]), size)


# --------------------------------------------------------------------------- #
# Layer algebra: every layer is float32 HxWx4 in [0,1], straight alpha
# --------------------------------------------------------------------------- #


def blank_layer(w: int = W, h: int = H) -> np.ndarray:
    return np.zeros((h, w, 4), dtype=np.float32)


def solid(color, alpha: float = 1.0, w: int = W, h: int = H) -> np.ndarray:
    layer = np.zeros((h, w, 4), dtype=np.float32)
    layer[..., 0] = color[0]
    layer[..., 1] = color[1]
    layer[..., 2] = color[2]
    layer[..., 3] = alpha
    return layer


def over(dst: np.ndarray, src: np.ndarray, opacity: float = 1.0,
         x: int = 0, y: int = 0, add: bool = False) -> np.ndarray:
    """Porter-Duff source-over of `src` onto `dst` at integer offset (src-over, not add)."""
    if opacity <= 0.001:
        return dst
    sh, sw = src.shape[:2]
    dh, dw = dst.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(dw, x + sw), min(dh, y + sh)
    if x1 <= x0 or y1 <= y0:
        return dst
    s = src[y0 - y : y1 - y, x0 - x : x1 - x]
    d = dst[y0:y1, x0:x1]
    sa = s[..., 3:4] * opacity
    if add:
        # screen/additive — used for every `mixBlendMode: "screen"` element in vfxShaders.tsx
        rgb = d[..., :3] + s[..., :3] * sa
        d[..., :3] = np.clip(rgb, 0.0, 1.0)
        d[..., 3:4] = np.clip(d[..., 3:4] + sa, 0.0, 1.0)
        return dst
    out_rgb = s[..., :3] * sa + d[..., :3] * (1 - sa)
    out_a = sa + d[..., 3:4] * (1 - sa)
    dst[y0:y1, x0:x1, :3] = out_rgb
    dst[y0:y1, x0:x1, 3:4] = out_a
    return dst


def transform(
    layer: np.ndarray,
    *,
    cx: float,
    cy: float,
    scale: float = 1.0,
    rot_deg: float = 0.0,
    opacity: float = 1.0,
    blur_px: float = 0.0,
    pivot: tuple[float, float] | None = None,
    out_size: tuple[int, int] = (W, H),
) -> np.ndarray:
    """CSS `transform: translate() scale() rotate()` + `filter: blur()` + `opacity`.

    (cx, cy) is where the layer's pivot lands in the output frame.
    """
    h, w = layer.shape[:2]
    pw, ph = pivot if pivot else (w / 2.0, h / 2.0)
    img = Image.fromarray((np.clip(layer, 0, 1) * 255).astype(np.uint8), "RGBA")
    if blur_px > 0.15:
        img = img.filter(ImageFilter.GaussianBlur(blur_px))
    if opacity < 1.0:
        a = img.getchannel("A").point(lambda v: int(v * opacity))
        img.putalpha(a)
    if abs(scale - 1.0) > 1e-4 or abs(rot_deg) > 1e-3:
        img = img.transform(
            (w, h),
            Image.AFFINE,
            _inverse_matrix(w / 2.0, h / 2.0, pw, ph, scale, rot_deg),
            resample=Image.BICUBIC,
        )
    canvas = Image.new("RGBA", out_size, (0, 0, 0, 0))
    canvas.paste(img, (int(round(cx - pw)), int(round(cy - ph))))
    return np.asarray(canvas, dtype=np.float32) / 255.0


def _inverse_matrix(ox: float, oy: float, px: float, py: float, scale: float, rot_deg: float):
    """AFFINE coefficients mapping output coords -> input coords for scale+rotate about pivot."""
    a = math.cos(math.radians(rot_deg))
    b = math.sin(math.radians(rot_deg))
    # forward: p_out = R*S*(p_in - pivot) + pivot ; we need the inverse
    det = scale * scale
    ix = (a * scale) / det
    iy = (b * scale) / det
    return (
        ix,
        iy,
        px - ix * ox - iy * oy,
        -iy,
        ix,
        py + iy * ox - ix * oy,
    )


import math  # noqa: E402  (used by _inverse_matrix)


# --------------------------------------------------------------------------- #
# Text
# --------------------------------------------------------------------------- #


def measure_text(text: str, fnt: ImageFont.FreeTypeFont, tracking: float = 0.0) -> tuple[int, int]:
    """Advance width (with per-glyph tracking) and line box height."""
    if tracking == 0.0:
        bbox = fnt.getbbox(text)
        return bbox[2] - bbox[0], bbox[3] - bbox[1]
    total = 0.0
    asc, desc = fnt.getmetrics()
    for ch in text:
        total += fnt.getlength(ch) + tracking
    return int(round(total - tracking)), int(asc + desc)


def text_layer(
    text: str,
    *,
    font_name: str = "inter-700",
    size: int = 64,
    color=FG,
    tracking: float = 0.0,
    align: str = "left",
    max_width: int | None = None,
    pad: int = 12,
) -> np.ndarray:
    """Anti-aliased text as a tight RGBA layer. `tracking` = CSS letter-spacing in px."""
    fnt = font(font_name, size)
    tw, th = measure_text(text, fnt, tracking)
    if max_width and tw > max_width:
        # proportional downscale to fit, re-measured
        size = max(8, int(size * max_width / tw))
        fnt = font(font_name, size)
        tw, th = measure_text(text, fnt, tracking)
    ascent, descent = fnt.getmetrics()
    img = Image.new("RGBA", (tw + pad * 2, ascent + descent + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rgb = tuple(int(round(c * 255)) for c in color)
    if tracking == 0.0:
        d.text((pad, pad), text, font=fnt, fill=rgb + (255,))
    else:
        x = float(pad)
        for ch in text:
            d.text((x, pad), ch, font=fnt, fill=rgb + (255,))
            x += fnt.getlength(ch) + tracking
    if align == "center":
        pass
    return np.asarray(img, dtype=np.float32) / 255.0


def tight(layer: np.ndarray, alpha_thresh: float = 0.01) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    """Crop a layer to its alpha bbox; returns (cropped, bbox)."""
    a = layer[..., 3]
    ys, xs = np.where(a > alpha_thresh)
    if len(xs) == 0:
        return layer, (0, 0, layer.shape[1], layer.shape[0])
    box = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    return layer[box[1] : box[3], box[0] : box[2]], box


def radial_glow(
    size: int,
    color,
    *,
    falloff: float = 2.2,
    core: float = 1.0,
    elliptical: tuple[float, float] = (1.0, 1.0),
) -> np.ndarray:
    """Soft radial falloff — the `radial-gradient(...)` primitive used across vfxShaders.tsx."""
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float32)
    c = (size - 1) / 2.0
    dx = (xs - c) / (c * elliptical[0])
    dy = (ys - c) / (c * elliptical[1])
    r = np.sqrt(dx * dx + dy * dy)
    a = np.clip(1.0 - r, 0.0, 1.0) ** falloff * core
    layer = np.zeros((size, size, 4), dtype=np.float32)
    layer[..., 0], layer[..., 1], layer[..., 2] = color[0], color[1], color[2]
    layer[..., 3] = a
    return layer


def h_gradient(w: int, h: int, stops: list[tuple[float, tuple, float]]) -> np.ndarray:
    """Horizontal linear-gradient from (position, color, alpha) stops."""
    xs = np.linspace(0.0, 1.0, w, dtype=np.float32)
    out = np.zeros((h, w, 4), dtype=np.float32)
    for i in range(len(stops) - 1):
        p0, c0, a0 = stops[i]
        p1, c1, a1 = stops[i + 1]
        m = (xs >= p0) & (xs <= p1)
        if not m.any():
            continue
        span = max(1e-6, p1 - p0)
        t = np.clip((xs - p0) / span, 0, 1)
        for ch in range(3):
            out[..., ch][:, m] = c0[ch] + (c1[ch] - c0[ch]) * t[m]
        out[..., 3][:, m] = a0 + (a1 - a0) * t[m]
    return out


def v_gradient(w: int, h: int, stops: list[tuple[float, tuple, float]]) -> np.ndarray:
    return np.rot90(h_gradient(h, w, stops), axes=(1, 0)).copy()


def _to255(color) -> tuple:
    if isinstance(color, str):
        color = hex2rgb(color)
    return tuple(int(round(c * 255)) for c in color)


def rounded_rect(
    w: int, h: int, radius: int, color, alpha: float = 1.0,
    border_color=None, border_width: int = 0,
) -> np.ndarray:
    img = Image.new("RGBA", (max(2, w), max(2, h)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fill = _to255(color) + (int(alpha * 255),)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=fill)
    if border_color and border_width:
        bc = _to255(border_color) + (int(alpha * 255),)
        d.rounded_rectangle(
            [border_width // 2, border_width // 2, w - 1 - border_width // 2, h - 1 - border_width // 2],
            radius=max(0, radius - border_width // 2),
            outline=bc,
            width=border_width,
        )
    return np.asarray(img, dtype=np.float32) / 255.0


def blur_layer(layer: np.ndarray, px: float) -> np.ndarray:
    if px <= 0.15:
        return layer
    img = Image.fromarray((np.clip(layer, 0, 1) * 255).astype(np.uint8), "RGBA")
    img = img.filter(ImageFilter.GaussianBlur(px))
    return np.asarray(img, dtype=np.float32) / 255.0


def resize_layer(layer: np.ndarray, w: int, h: int) -> np.ndarray:
    img = Image.fromarray((np.clip(layer, 0, 1) * 255).astype(np.uint8), "RGBA")
    img = img.resize((max(1, int(w)), max(1, int(h))), Image.LANCZOS)
    return np.asarray(img, dtype=np.float32) / 255.0


def shift_subpixel(layer: np.ndarray, dx: float, dy: float) -> np.ndarray:
    """Bilinear sub-pixel translate — keeps slow camera drift from steppging on the pixel grid."""
    h, w = layer.shape[:2]
    out = np.zeros_like(layer)
    x0, y0 = int(math.floor(dx)), int(math.floor(dy))
    fx, fy = dx - x0, dy - y0
    for oy, wy in ((0, 1 - fy), (1, fy)):
        if wy == 0:
            continue
        for ox, wx in ((0, 1 - fx), (1, fx)):
            if wx == 0:
                continue
            sx, sy = x0 + ox, y0 + oy
            dx0, dy0 = max(0, sx), max(0, sy)
            dx1, dy1 = min(w, sx + w), min(h, sy + h)
            if dx1 <= dx0 or dy1 <= dy0:
                continue
            out[dy0:dy1, dx0:dx1] += layer[dy0 - sy : dy1 - sy, dx0 - sx : dx1 - sx] * (wx * wy)
    return out
