"""Ports of remotion/src/engine/vfxShaders.tsx — the optical layer of the film.

  1. AnamorphicFlare   -> anamorphic_flare()      (screen blend)
  2. VolumetricGodrays -> volumetric_godrays()   (screen blend)
  3. ParticleField3D   -> particle_field_3d()    (true perspective projection)
  6. FilmGrainOverlay  -> film_grain() + vignette()

Everything is seeded (mulberry32 / per-frame RNG) so a re-render is bit-identical.
"""

from __future__ import annotations

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from design_system import (
    ACCENT2,
    FG,
    FLARE_COLOR,
    FLARE_SECONDARY,
    H,
    W,
    blur_layer,
    hex2rgb,
    over,
    radial_glow,
    resize_layer,
)
from engine_ports import interpolate, mulberry32, project3d_point, Vec3

PARTICLE_ACCENT = hex2rgb("#C5F75A")  # ParticleField3D secondaryColor default


# --------------------------------------------------------------------------- #
# 3. PARTICLE FIELD 3D
# --------------------------------------------------------------------------- #


def make_particles(count: int = 90, seed: int = 1337):
    rng = mulberry32(seed)
    return [
        {
            "x": (rng() - 0.5) * 1800,
            "y": (rng() - 0.5) * 1100,
            "z_base": rng() * 1200,
            "radius": 1.8 + rng() * 4.2,
            "is_accent": i % 4 == 0,
        }
        for i in range(count)
    ]


_SPLAT_CACHE: dict[tuple[int, tuple], np.ndarray] = {}


def _splat(radius_px: int, color) -> np.ndarray:
    key = (radius_px, color)
    if key not in _SPLAT_CACHE:
        size = max(4, radius_px * 2)
        _SPLAT_CACHE[key] = radial_glow(size, color, falloff=1.6, core=1.0)
    return _SPLAT_CACHE[key]


def particle_field_3d(
    frame: int,
    particles,
    *,
    speed_z: float = 6.5,
    rot_y: float = 0.0,
    rot_x: float = 0.0,
    color=FLARE_COLOR,
    secondary=PARTICLE_ACCENT,
    opacity: float = 1.0,
    half_res: bool = True,
) -> np.ndarray:
    """Perspective-projected 3D particle system with depth-based alpha (bokeh feel)."""
    scale_factor = 0.5 if half_res else 1.0
    cw, ch = int(W * scale_factor), int(H * scale_factor)
    layer = np.zeros((ch, cw, 4), dtype=np.float32)
    cx, cy = W / 2.0, H / 2.0
    for p in particles:
        z_wrapped = (((p["z_base"] - frame * speed_z) % 1200) + 1200) % 1200 - 600
        proj = project3d_point(
            Vec3(p["x"], p["y"], z_wrapped), rot_x, rot_y, 0.0, 800.0, 780.0, cx, cy
        )
        if not proj.visible:
            continue
        r = max(0.8, p["radius"] * proj.scale)
        alpha = interpolate(proj.depth, [180, 500, 1380], [0.95, 0.7, 0.08]) * opacity
        if alpha < 0.01:
            continue
        col = secondary if p["is_accent"] else color
        size = max(3, int(round(r * 2 * scale_factor * 2.4)) | 1)
        splat = _splat(size, col)
        px = int(round(proj.x * scale_factor - size / 2))
        py = int(round(proj.y * scale_factor - size / 2))
        over(layer, splat, alpha, px, py, add=True)
    if half_res:
        layer = resize_layer(layer, W, H)
    return layer


# --------------------------------------------------------------------------- #
# 2. VOLUMETRIC GODRAYS
# --------------------------------------------------------------------------- #


def make_rays(ray_count: int = 16, seed: int = 4099):
    rng = mulberry32(seed)
    return [
        {
            "angle": -65 + (i / max(1, ray_count - 1)) * 130 + (rng() - 0.5) * 6,
            "width": 2.5 + rng() * 5.5,
            "speed": 0.015 + rng() * 0.025,
            "phase": rng() * math.pi * 2,
        }
        for i in range(ray_count)
    ]


_RAY_CACHE: dict[tuple[int, tuple], np.ndarray] = {}


def volumetric_godrays(
    frame: int,
    rays,
    *,
    origin_x_percent: float = 50.0,
    origin_y_percent: float = 24.0,
    color=FLARE_COLOR,
    opacity: float = 0.28,
    half_res: bool = True,
) -> np.ndarray:
    sf = 0.5 if half_res else 1.0
    cw, ch = int(W * sf), int(H * sf)
    layer = np.zeros((ch, cw, 4), dtype=np.float32)
    ox, oy = W * origin_x_percent / 100.0 * sf, H * origin_y_percent / 100.0 * sf
    ray_len = int(1.6 * H * sf)
    for ray in rays:
        wave = 0.65 + 0.35 * math.sin(frame * ray["speed"] + ray["phase"])
        rot = ray["angle"] + math.sin(frame * 0.01 + ray["phase"]) * 2.2
        rw = max(2, int(W * ray["width"] / 100.0 * sf))
        key = (rw, color)
        if key not in _RAY_CACHE:
            g = np.zeros((ray_len, rw, 4), dtype=np.float32)
            ys = np.arange(ray_len, dtype=np.float32) / ray_len
            # linear-gradient(180deg, color88 0%, color22 45%, transparent 90%)
            a = np.interp(ys, [0.0, 0.45, 0.9, 1.0], [0x88 / 255, 0x22 / 255, 0.0, 0.0])
            xs = np.abs(np.arange(rw, dtype=np.float32) / max(1, rw - 1) - 0.5) * 2
            edge = np.clip(1.0 - xs**2, 0, 1)
            g[..., 0], g[..., 1], g[..., 2] = color[0], color[1], color[2]
            g[..., 3] = a[:, None] * edge[None, :]
            _RAY_CACHE[key] = blur_layer(g, 8 * sf)
        g = _RAY_CACHE[key]
        img = Image.fromarray((np.clip(g, 0, 1) * 255).astype(np.uint8), "RGBA")
        img = img.rotate(-rot, resample=Image.BILINEAR, expand=True, center=(img.width / 2, 0))
        rot_arr = np.asarray(img, dtype=np.float32) / 255.0
        over(
            layer,
            rot_arr,
            wave * opacity,
            int(ox - rot_arr.shape[1] / 2),
            int(oy),
            add=True,
        )
    if half_res:
        layer = resize_layer(layer, W, H)
    return layer


# --------------------------------------------------------------------------- #
# 1. ANAMORPHIC LENS FLARE
# --------------------------------------------------------------------------- #


def anamorphic_flare(
    frame: int,
    *,
    x_percent: float = 50.0,
    y_percent: float = 46.0,
    color=FLARE_COLOR,
    secondary=FLARE_SECONDARY,
    intensity: float = 1.0,
) -> np.ndarray:
    """Screen-blended horizontal cinema streak + warm counter-streak + core hotspot."""
    layer = np.zeros((H, W, 4), dtype=np.float32)
    shimmer = 0.92 + math.sin(frame * 0.18) * 0.08
    streak_w = int(W * 0.92 * intensity * shimmer)
    x, y = W * x_percent / 100.0, H * y_percent / 100.0

    if streak_w > 4:
        # main streak: transparent -> color44 -> white -> color44 -> transparent
        stops = [
            (0.00, color, 0.0),
            (0.22, color, 0x44 / 255),
            (0.50, (1.0, 1.0, 1.0), 1.0),
            (0.78, color, 0x44 / 255),
            (1.00, color, 0.0),
        ]
        hgt = max(2, int(round(4 * intensity)))
        g = np.zeros((hgt, streak_w, 4), dtype=np.float32)
        xs = np.linspace(0, 1, streak_w, dtype=np.float32)
        for i in range(len(stops) - 1):
            p0, c0, a0 = stops[i]
            p1, c1, a1 = stops[i + 1]
            m = (xs >= p0) & (xs <= p1)
            if not m.any():
                continue
            t = np.clip((xs - p0) / max(1e-6, p1 - p0), 0, 1)
            for ch in range(3):
                g[..., ch][:, m] = c0[ch] + (c1[ch] - c0[ch]) * t[m]
            g[..., 3][:, m] = a0 + (a1 - a0) * t[m]
        g = blur_layer(g, 28 * intensity * 0.35)
        over(layer, g, min(1.0, 0.85 * intensity), int(x - streak_w / 2), int(y - hgt / 2), add=True)

        # wide bloom around the streak (stands in for boxShadow 0 0 28px 6px color88)
        bloom_w = int(streak_w * 1.0)
        bloom = np.zeros((int(60 * intensity), bloom_w, 4), dtype=np.float32)
        ys = np.linspace(-1, 1, bloom.shape[0], dtype=np.float32)
        prof = np.clip(1 - np.abs(ys), 0, 1) ** 2
        bloom[..., 0], bloom[..., 1], bloom[..., 2] = color[0], color[1], color[2]
        grad = np.zeros(bloom_w, dtype=np.float32)
        grad[:] = np.interp(np.linspace(0, 1, bloom_w), [0, 0.5, 1], [0, 1, 0])
        bloom[..., 3] = prof[:, None] * grad[None, :] * (0x88 / 255)
        bloom = blur_layer(bloom, 12 * intensity)
        over(
            layer,
            bloom,
            min(1.0, 0.7 * intensity),
            int(x - bloom_w / 2),
            int(y - bloom.shape[0] / 2),
            add=True,
        )

        # secondary warm counter-streak at 100 - xPercent
        sw = int(streak_w * 0.52)
        if sw > 4:
            sg = np.zeros((max(2, int(2 * intensity)), sw, 4), dtype=np.float32)
            sxs = np.linspace(0, 1, sw, dtype=np.float32)
            prof2 = np.interp(sxs, [0, 0.5, 1], [0, 0x66 / 255, 0])
            sg[..., 0], sg[..., 1], sg[..., 2] = secondary[0], secondary[1], secondary[2]
            sg[..., 3] = prof2
            sg = blur_layer(sg, 6 * intensity)
            over(
                layer,
                sg,
                0.65 * intensity,
                int(W - x - sw / 2),
                int(H * (y_percent + 2) / 100.0 - sg.shape[0] / 2),
                add=True,
            )

    # core optical hotspot: radial-gradient(ellipse, white 0.72 -> color55 38% -> transparent 72%)
    ew, eh = int(240 * intensity), int(110 * intensity)
    if ew > 6 and eh > 6:
        core = radial_glow(max(ew, eh) * 2, (1.0, 1.0, 1.0), falloff=3.0, core=0.72)
        core = resize_layer(core, ew, eh)
        tinted = np.zeros_like(core)
        halo = radial_glow(max(ew, eh) * 2, color, falloff=2.0, core=0x55 / 255)
        halo = resize_layer(halo, ew * 2, eh * 2)
        over(tinted, halo, 1.0, -ew // 2, -eh // 2, add=True)
        over(tinted, core, 1.0, 0, 0, add=True)
        over(layer, tinted, min(1.0, intensity), int(x - ew / 2), int(y - eh / 2), add=True)
    return layer


# --------------------------------------------------------------------------- #
# 6. FILM GRAIN & CINEMA VIGNETTE
# --------------------------------------------------------------------------- #


def _dot_stamp(step: int, color, alpha: float) -> np.ndarray:
    """One tile of FilmGrainOverlay's `radial-gradient(circle, c 1px, transparent 1.5px)`."""
    key = (step, color, alpha)
    cached = _DOT_CACHE.get(key)
    if cached is not None:
        return cached
    stamp = np.zeros((step, step, 4), dtype=np.float32)
    c = (step - 1) / 2.0
    ys, xs = np.mgrid[0:step, 0:step].astype(np.float32)
    r = np.sqrt((xs - c) ** 2 + (ys - c) ** 2)
    a = np.clip(1.5 - r, 0.0, 1.0) * alpha
    stamp[..., 0], stamp[..., 1], stamp[..., 2] = color[0], color[1], color[2]
    stamp[..., 3] = a
    _DOT_CACHE[key] = stamp
    return stamp


_DOT_CACHE: dict[tuple, np.ndarray] = {}
_TILE_CACHE: dict[tuple[int, int, int], np.ndarray] = {}


def _full_tile(step: int, color, alpha: float) -> np.ndarray:
    """Frame-sized tile of the dot pattern, built once and cached."""
    key = (step, round(color[0] * 255), round(alpha * 100))
    hit = _TILE_CACHE.get(key)
    if hit is not None:
        return hit
    stamp = _dot_stamp(step, color, alpha)
    tiled = np.tile(stamp, (H // step + 1, W // step + 1, 1))[:H, :W]
    _TILE_CACHE[key] = tiled
    return tiled


def film_grain(frame: int, opacity: float = 0.045) -> np.ndarray:
    """Seeded per-frame grain, mirroring FilmGrainOverlay exactly:

      backgroundImage: radial-gradient(white 1px) 18px, radial-gradient(#35D9F2 1px) 29px
      backgroundPosition: 0 0, 9px 13px
      transform: translate3d(((frame*37)%120)-60, ((frame*53)%120)-60, 0)
    """
    ox = ((frame * 37) % 120) - 60
    oy = ((frame * 53) % 120) - 60
    layer = _full_tile(18, (1.0, 1.0, 1.0), 0.75)
    layer = np.roll(np.roll(layer, oy, axis=0), ox, axis=1)
    cyan = _full_tile(29, ACCENT2, 0.5)
    cyan = np.roll(np.roll(cyan, oy + 13, axis=0), ox + 9, axis=1)
    layer = np.maximum(layer, cyan)
    return layer * opacity


def grain_fast(frame: int, opacity: float = 0.045, seed: int = 91337) -> np.ndarray:
    """Photographic monochrome grain at the same opacity default (deterministic per frame)."""
    rng = np.random.default_rng(seed + frame)
    n = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    n = np.clip(n * 0.5 + 0.5, 0, 1)
    layer = np.zeros((H // 2, W // 2, 4), dtype=np.float32)
    layer[..., 0] = layer[..., 1] = layer[..., 2] = n
    layer[..., 3] = 1.0
    layer = resize_layer(layer, W, H)
    return layer * opacity


_VIGNETTE_CACHE: np.ndarray | None = None


def vignette(strength: float = 1.0) -> np.ndarray:
    """radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 48%, rgba(3,6,12,0.68) 100%)."""
    global _VIGNETTE_CACHE
    if _VIGNETTE_CACHE is None:
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        dx = (xs - W / 2) / (W / 2)
        dy = (ys - H / 2) / (H / 2)
        r = np.sqrt(dx * dx + dy * dy) / math.sqrt(2)
        a = np.clip((r - 0.48) / (1.0 - 0.48), 0, 1) ** 1.5
        vig = np.zeros((H, W, 4), dtype=np.float32)
        vig[..., 0], vig[..., 1], vig[..., 2] = 3 / 255, 6 / 255, 12 / 255
        vig[..., 3] = a * 0.68
        _VIGNETTE_CACHE = vig
    out = _VIGNETTE_CACHE.copy()
    out[..., 3] *= strength
    return out


def chromatic_aberration(img: np.ndarray, amount_px: float) -> np.ndarray:
    """Radial RGB split — the `chromatic-radial-split` registry block, done numerically."""
    if abs(amount_px) < 0.05:
        return img
    h, w = img.shape[:2]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    dx = (xs - w / 2) / (w / 2)
    dy = (ys - h / 2) / (h / 2)
    r = np.sqrt(dx * dx + dy * dy)
    shift = (r**2) * amount_px
    out = img.copy()
    for ch, sign in ((0, 1.0), (2, -1.0)):
        sx = np.clip(xs + dx * shift * sign, 0, w - 1.001)
        sy = np.clip(ys + dy * shift * sign, 0, h - 1.001)
        x0 = sx.astype(np.int32)
        y0 = sy.astype(np.int32)
        fx = sx - x0
        fy = sy - y0
        x1 = np.minimum(x0 + 1, w - 1)
        y1 = np.minimum(y0 + 1, h - 1)
        c = img[..., ch]
        val = (
            c[y0, x0] * (1 - fx) * (1 - fy)
            + c[y0, x1] * fx * (1 - fy)
            + c[y1, x0] * (1 - fx) * fy
            + c[y1, x1] * fx * fy
        )
        out[..., ch] = val
    return out


def scanline_sweep(progress: float, color=ACCENT2, thickness: int = 3, glow: int = 90) -> np.ndarray:
    """A single horizontal light bar sweeping the stage (the boot 'scan' performer)."""
    layer = np.zeros((H, W, 4), dtype=np.float32)
    y = int(progress * (H + glow * 2)) - glow
    band = np.zeros((glow * 2 + thickness, W, 4), dtype=np.float32)
    ys = np.arange(band.shape[0], dtype=np.float32)
    core = np.exp(-((ys - glow) ** 2) / (2 * (thickness * 1.6) ** 2))
    tail = np.exp(-np.abs(ys - glow) / (glow * 0.55)) * 0.35
    prof = np.clip(core + tail, 0, 1)
    band[..., 0], band[..., 1], band[..., 2] = color[0], color[1], color[2]
    band[..., 3] = prof[:, None]
    over(layer, band, 1.0, 0, y, add=True)
    return layer
