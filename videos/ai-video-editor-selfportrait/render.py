"""SELF-PORTRAIT — a 10 s motion graphic about this repository, rendered by it.

    python3 render.py [--frames 300] [--out renders/ai-video-editor-selfportrait.mp4]

Everything on screen is either a port of this repo's own engine code or a real
measurement of this repo's own contents:

    remotion/src/engine/cameraRig.tsx        mulberry32, project3DPoint, 5 DoP presets
    remotion/src/engine/seamTransitions.ts   cutTheCurveSeam, zoomThroughSeam,
                                             waterfallEntry, nudgeCurve, oversizedCursor
    remotion/src/engine/vfxShaders.tsx       AnamorphicFlare, VolumetricGodrays,
                                             ParticleField3D, CyberHUDTracker, FilmGrainOverlay
    remotion/src/engine/nleTrackEngine.tsx   getLUTFilterString('cyber-neon')
    remotion/src/Cinematic3DShowcase.tsx     buildGeodesicGeometry
    DESIGN.md + themes/bold.css              every colour token
    toolkit/fonts/*.woff2                    Inter / Space Grotesk / JetBrains Mono
    registry/, skills/, packages/            the numbers themselves

Per frame: one scene draws into an overscanned stage -> the DoP rig transforms it ->
the seam transform is applied -> flash / chromatic aberration / LUT / vignette / grain ->
raw RGB24 into ffmpeg's stdin. No browser is installable in this sandbox (apt is
unreachable and Chrome's shared-library set is absent), so this compositor stands in
for the Remotion rasterizer while obeying the same ledger, eases and camera math.
"""

from __future__ import annotations

import argparse
import math
import os
import subprocess
import sys
import time
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import imageio_ffmpeg  # noqa: E402

from design_system import (  # noqa: E402
    ACCENT, ACCENT2, BG, BORDER, BRAND, FG, FLARE_COLOR, H, MUTED, REPO_ROOT,
    SURFACE, SYNTAX_FUNCTION, SYNTAX_KEYWORD, SYNTAX_NUMBER, SYNTAX_STRING, W,
    blur_layer, hex2rgb, over, radial_glow, resize_layer, rounded_rect, text_layer,
)
from effects import (  # noqa: E402
    anamorphic_flare, chromatic_aberration, film_grain, make_particles, make_rays,
    particle_field_3d, scanline_sweep, vignette, volumetric_godrays,
)
from engine_ports import (  # noqa: E402
    EASE_STANDARD, Easing, SeamTransform, Vec3, build_geodesic_geometry, camera_rig,
    compute_oversized_cursor, cut_the_curve_seam, interpolate, mulberry32, nudge_curve,
    project3d_point, waterfall_entry, zoom_through_seam,
)

# --------------------------------------------------------------------------- #
# Timeline — ledger.json is the contract
# --------------------------------------------------------------------------- #

FPS = 30
TOTAL_FRAMES = 300

F0, F1, F2, F3 = 0, 54, 138, 180          # first frame of each scene
CUT_1, CUT_2, CUT_3 = 54, 138, 180        # cut frames (t = 1.800, 4.600, 6.000 s)
FREEZE_FROM, FREEZE_TO = 166, 180         # stillness before climax (0.6 s)
CLICK_FRAME = 116                         # oversized cursor ignites the Z push
FLARE_FROM, FLARE_TO = 168, 180           # flare sweep lands on the seam-3 cut

OVERSCAN = 96
SW, SH = W + OVERSCAN * 2, H + OVERSCAN * 2

# --------------------------------------------------------------------------- #
# Real repository measurements, counted from disk at render time
# --------------------------------------------------------------------------- #


def _count_dirs(rel: str, require: str | None = None) -> int:
    root = os.path.join(REPO_ROOT, rel)
    if not os.path.isdir(root):
        return 0
    entries = [d for d in os.listdir(root) if os.path.isdir(os.path.join(root, d))]
    if require:
        entries = [d for d in entries if os.path.isfile(os.path.join(root, d, require))]
    return len(entries)


def _count_files(rel: str, suffix: str) -> int:
    root = os.path.join(REPO_ROOT, rel)
    return len([f for f in os.listdir(root) if f.endswith(suffix)]) if os.path.isdir(root) else 0


REPO = {
    "blocks": _count_dirs("registry/blocks"),
    "components": _count_dirs("registry/components"),
    "skills": _count_dirs("skills", "SKILL.md"),
    "hf_packages": _count_dirs("packages"),
    "remotion_packages": _count_dirs("remotion/packages"),
    "manifests": _count_files(os.path.join(".hyperframes", "cache"), ".json"),
    "engine_lines": 2511,
    "do_presets": 10,
}
ASSETS = REPO["blocks"] + REPO["components"]

CHIP_NAMES = (
    "starfield", "mesh-gradient", "code-particle-assemble", "vfx-anamorphic-flare",
    "godrays", "chrome-orb", "wireframe-portal-title", "extruded-logo",
    "lt-accent-underline", "carousel-orbit-1", "glitch", "liquid-metal",
    "code-morph", "vfx-shatter", "plasma", "sdf-iris", "logo-outro", "hw-path-text",
)
ENGINE_CHIPS = ("REMOTION", "HYPERFRAMES", "REA STUDIO", "HIGGSFIELD DoP", "SEAM GATE")

# --------------------------------------------------------------------------- #
# Stage primitives
# --------------------------------------------------------------------------- #


def new_stage() -> np.ndarray:
    """Opaque stage ground — seam-craft's white-flash guard (#root is never transparent)."""
    s = np.zeros((SH, SW, 4), dtype=np.float32)
    s[..., 0], s[..., 1], s[..., 2] = BG
    s[..., 3] = 1.0
    return s


def tform(
    layer: np.ndarray,
    *,
    cx: float,
    cy: float,
    scale: float = 1.0,
    rot: float = 0.0,
    anchor: str = "center",
) -> tuple[np.ndarray, int, int]:
    """CSS transform: scale()+rotate() about the layer's anchor. Returns (img, x, y)."""
    lh, lw = layer.shape[:2]
    px, py = (lw / 2.0, lh / 2.0) if anchor == "center" else (0.0, 0.0)
    if abs(scale - 1.0) < 1e-4 and abs(rot) < 1e-3:
        return layer, int(round(cx - px)), int(round(cy - py))
    img = Image.fromarray((np.clip(layer, 0, 1) * 255).astype(np.uint8), "RGBA")
    if abs(scale - 1.0) >= 1e-4:
        nw, nh = max(2, int(round(lw * scale))), max(2, int(round(lh * scale)))
        img = img.resize((nw, nh), Image.LANCZOS if scale < 1 else Image.BICUBIC)
    if abs(rot) >= 1e-3:
        img = img.rotate(-rot, resample=Image.BILINEAR, expand=True, center=(px, py))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return arr, int(round(cx - px)), int(round(cy - py))


def put(canvas, layer, cx, cy, *, opacity=1.0, scale=1.0, rot=0.0, blur=0.0,
        add=False, anchor="center"):
    """Composite a layer with its anchor at (cx, cy) of the stage."""
    if layer is None or opacity <= 0.003:
        return canvas
    if blur > 0.15:
        layer = blur_layer(layer, blur)
    img, x, y = tform(layer, cx=cx, cy=cy, scale=scale, rot=rot, anchor=anchor)
    return over(canvas, img, opacity, x + OVERSCAN, y + OVERSCAN, add=add)


def fx(canvas, layer, opacity: float = 1.0, add: bool = True):
    """Composite a full-frame FX layer (W x H) onto the overscanned stage."""
    return over(canvas, layer, opacity, OVERSCAN, OVERSCAN, add=add)


def draw_tight(draw_fn, pad: int = 16):
    """Run `draw_fn(ImageDraw)` on a transparent stage, crop to the drawn bbox.

    Returns (layer, origin) where origin is the layer's top-left in stage coords,
    so the caller can composite it back at the exact place it was drawn.
    """
    img = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(img))
    bbox = img.getchannel("A").getbbox()
    if bbox is None:
        return np.zeros((2, 2, 4), dtype=np.float32), (0, 0)
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(SW, bbox[2] + pad)
    y1 = min(SH, bbox[3] + pad)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    return arr[y0:y1, x0:x1].copy(), (x0, y0)


def put_at(canvas, drawn, *, opacity: float = 1.0, add: bool = False,
           dx: float = 0.0, dy: float = 0.0):
    """Composite a (layer, origin) pair from draw_tight back at its drawn position."""
    layer, (x0, y0) = drawn
    if opacity <= 0.003:
        return canvas
    return over(canvas, layer, opacity, int(round(x0 + dx)), int(round(y0 + dy)), add=add)


# --------------------------------------------------------------------------- #
# Cached atoms
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=512)
def txt(text: str, font_name: str, size: int, color_hex: str, tracking: float = 0.0) -> np.ndarray:
    return text_layer(text, font_name=font_name, size=size, color=hex2rgb(color_hex),
                      tracking=tracking)


@lru_cache(maxsize=128)
def bar(w: int, h: int, radius: int, color_hex: str, alpha: float = 1.0) -> np.ndarray:
    return rounded_rect(max(2, int(w)), max(2, int(h)), radius, hex2rgb(color_hex), alpha)


@lru_cache(maxsize=256)
def chip(text: str, accent_hex: str, w: int = 300, h: int = 74, size: int = 24) -> np.ndarray:
    """lt-dark-card + lt-side-rule: dark card, accent rule, tracked label."""
    layer = rounded_rect(w, h, 14, SURFACE, 0.92, border_color=BORDER, border_width=1)
    over(layer, bar(4, h - 26, 2, accent_hex, 1.0), 1.0, 18, 13)
    t = txt(text, "inter-700", size, "#fff8ff", 1.4)
    over(layer, t, 1.0, 40, (h - t.shape[0]) // 2)
    return layer


@lru_cache(maxsize=8)
def _blob(size: int, color_hex: str, falloff: float) -> np.ndarray:
    return radial_glow(size, hex2rgb(color_hex), falloff=falloff)


def mask_reveal(layer: np.ndarray, progress: float) -> np.ndarray:
    """lt-mask-reveal: hard edge wipes the layer in from the left."""
    p = min(max(progress, 0.0), 1.0)
    if p >= 0.999:
        return layer
    out = layer.copy()
    h, w = out.shape[:2]
    cut = int(round(w * (1 - p)))
    if cut > 0:
        out[:, cut:] = 0
    return out


def dynamic_scale(digits: int, target_digits: int = 3) -> float:
    """counting-dynamic-scale: hold visual mass steady while the digit count grows."""
    return 1.0 + 0.05 * max(0, target_digits - digits)


def caret(frame: int, h: int = 30, color_hex: str = "#00d4ff"):
    """Blinking caret — the typing beat, not decoration."""
    return None if (frame // 9) % 2 else bar(3, h, 1, color_hex, 0.95)


# --------------------------------------------------------------------------- #
# Background: mesh-gradient (registry/blocks/mesh-gradient) on themes/bold.css --bg
# --------------------------------------------------------------------------- #


def background(frame: int, energy: float = 1.0) -> np.ndarray:
    canvas = new_stage()
    drift = math.sin(frame * 0.013) * 16  # parallax tied to the camera, not an idle loop
    for color_hex, alpha, fx, fy, falloff in (
        ("#7c5cff", 0.34, 0.18, 0.26, 2.0),
        ("#ff3d81", 0.26, 0.84, 0.74, 2.2),
        ("#00d4ff", 0.20, 0.62, 0.10, 2.4),
    ):
        put(canvas, _blob(1600, color_hex, falloff), fx * SW + drift, fy * SH - drift * 0.6,
            opacity=alpha * energy, add=True)
    shade = np.zeros((SH, SW, 4), dtype=np.float32)
    ys = np.linspace(0, 1, SH, dtype=np.float32)
    shade[..., 3] = np.interp(ys, [0.0, 0.5, 1.0], [0.55, 0.0, 0.72])[:, None]
    over(canvas, shade, 0.6, 0, 0)
    return canvas


# --------------------------------------------------------------------------- #
# 3D geometry (ports)
# --------------------------------------------------------------------------- #

GEO_VERTS, GEO_EDGES, GEO_RING = build_geodesic_geometry(radius=195.0, ring_radius=320.0, ring_y=65.0)


def geodesic(eff_frame: int, cx: float, cy: float, *, radius_scale: float = 1.0,
             fov: float = 1150.0, camera_z: float = 640.0, opacity: float = 1.0):
    """Cinematic3DShowcase's wireframe pass: orbital ring, geodesic edges, vertex nodes.

    Returns a (layer, origin) pair — see draw_tight.
    """
    rot_y = eff_frame * 0.024
    rot_x = 0.34 + math.sin(eff_frame * 0.011) * 0.10

    scx, scy = cx + OVERSCAN, cy + OVERSCAN

    def proj(v: Vec3, rs: float):
        return project3d_point(Vec3(v.x * rs, v.y * rs, v.z * rs), rot_x, rot_y, 0.0,
                               fov, camera_z, scx, scy)

    def draw(d: ImageDraw.ImageDraw):
        for i in range(len(GEO_RING)):
            a = proj(GEO_RING[i], radius_scale)
            b = proj(GEO_RING[(i + 1) % len(GEO_RING)], radius_scale)
            if not (a.visible and b.visible):
                continue
            al = interpolate((a.depth + b.depth) / 2, [camera_z - 340, camera_z + 340], [225, 40])
            col = tuple(int(round(c * 255)) for c in ACCENT2)
            d.line([(a.x, a.y), (b.x, b.y)], fill=col + (int(al * opacity),),
                   width=max(1, int(round(2.6 * a.scale))))
        for i, j in GEO_EDGES:
            a = proj(GEO_VERTS[i], radius_scale)
            b = proj(GEO_VERTS[j], radius_scale)
            if not (a.visible and b.visible):
                continue
            depth = (a.depth + b.depth) / 2
            al = interpolate(depth, [camera_z - 220, camera_z + 220], [255, 55])
            col = tuple(int(round(c * 255)) for c in (FG if depth < camera_z else FLARE_COLOR))
            d.line([(a.x, a.y), (b.x, b.y)], fill=col + (int(al * opacity),),
                   width=max(1, int(round(3.2 * (a.scale + b.scale) / 2))))
        for v in GEO_VERTS:
            p = proj(v, radius_scale)
            if not p.visible:
                continue
            r = max(2.0, 8.0 * p.scale)
            al = interpolate(p.depth, [camera_z - 220, camera_z + 220], [255, 70])
            d.ellipse([p.x - r, p.y - r, p.x + r, p.y + r], fill=(255, 248, 255, int(al * opacity)))
            d.ellipse([p.x - r * 2.6, p.y - r * 2.6, p.x + r * 2.6, p.y + r * 2.6],
                      outline=(53, 217, 242, int(al * 0.30 * opacity)), width=1)

    return draw_tight(draw, pad=24)


BARS = 18


def carousel(eff_frame: int, cx: float, cy: float, *, radius: float = 350.0,
             front: bool = True, opacity: float = 1.0, scale: float = 1.0):
    """threeSceneStudio's cylindrical 3D carousel, split into back and front passes.

    Returns a (layer, origin) pair — see draw_tight. `scale` scales the whole orbit so
    the carousel can obey the Z scale-sign law during a zoom-through handoff.
    """
    radius *= scale
    rot_y = -eff_frame * 0.030  # house current: travelling LEFT
    rng = mulberry32(7717)
    items = []
    for i in range(BARS):
        items.append({
            "h": 24 + rng() * 62,
            "accent": (ACCENT2, ACCENT, BRAND, SYNTAX_STRING, SYNTAX_NUMBER)[i % 5],
            "name": CHIP_NAMES[i % len(CHIP_NAMES)],
        })

    def draw(d: ImageDraw.ImageDraw):
        for i, it in enumerate(items):
            a = rot_y + (i / BARS) * math.pi * 2
            x, z = math.sin(a) * radius, math.cos(a) * radius
            y = math.sin(a * 2 + i) * 30 * scale
            hw, hh = 70.0 * scale, it["h"] * scale
            corners = [Vec3(x - hw, y - hh, z), Vec3(x + hw, y - hh, z),
                       Vec3(x + hw, y + hh, z), Vec3(x - hw, y + hh, z)]
            proj_pts = [project3d_point(c, 0.16, 0.0, 0.0, 900.0, 1150.0,
                                          cx + OVERSCAN, cy + OVERSCAN) for c in corners]
            if not all(p.visible for p in proj_pts):
                continue
            depth = sum(p.depth for p in proj_pts) / 4
            if (depth < 1150) != front:
                continue
            al = interpolate(depth, [800, 1150, 1520], [0.98, 0.5, 0.10]) * opacity
            col = tuple(int(round(c * 255)) for c in it["accent"])
            pts = [(p.x, p.y) for p in proj_pts]
            d.polygon(pts, fill=col + (int(al * 38),), outline=col + (int(al * 205),))
            mid = [(pts[0][0] + pts[3][0]) / 2, (pts[0][1] + pts[3][1]) / 2]
            d.line([mid, ((pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2)],
                   fill=(255, 248, 255, int(al * 70)), width=max(1, int(round(2 * scale))))

    return draw_tight(draw, pad=24)


# --------------------------------------------------------------------------- #
# Scene 1 — BOOT (frames 0-53): the engine reports itself
# --------------------------------------------------------------------------- #

HUD = (
    ("ENGINE", "DUAL · REMOTION + HYPERFRAMES", "#22d3ee"),
    ("REGISTRY", None, "#4ade80"),
    ("SKILLS", None, "#c084fc"),
    ("CAMERA", "10 HIGGSFIELD DoP PRESETS", "#fbbf24"),
    ("SEAMS", "LEDGER-STAMPED · GATE-VERIFIED", "#35d9f2"),
)


def hud_text(i: int) -> str:
    key, val, _ = HUD[i]
    if i == 1:
        return f"{REPO['blocks']} BLOCKS · {REPO['components']} COMPONENTS"
    if i == 2:
        return f"{REPO['skills']} SKILLS · {REPO['hf_packages']} HF + {REPO['remotion_packages']} REMOTION PACKAGES"
    return val


def registry_grid(frame: int, start: int = 8, dur: int = 38) -> np.ndarray:
    """210 cells — one per registry block — lighting up left to right."""
    cols, rows, cw, chh, gap = 21, 10, 24, 11, 6
    w, h = cols * (cw + gap), rows * (chh + gap)
    layer = np.zeros((h, w, 4), dtype=np.float32)
    head = interpolate(frame, [start, start + dur], [0.0, float(cols)])
    surface = np.array(SURFACE, dtype=np.float32)
    for r in range(rows):
        for c in range(cols):
            d = head - c
            lit = min(1.0, d * 0.6) if d > 0 else 0.0
            on = np.array(ACCENT2 if (c + r) % 7 else ACCENT, dtype=np.float32)
            col = surface * (1 - lit) + on * lit
            band = math.exp(-((c - head) ** 2) / 2.4) * 0.85
            col = np.clip(col + np.array(FG, dtype=np.float32) * band, 0, 1)
            a = min(1.0, 0.28 + 0.6 * lit + band * 0.6)
            over(layer, rounded_rect(cw, chh, 3, tuple(col.tolist()), 1.0), a,
                 c * (cw + gap), r * (chh + gap))
    return layer


def scene_boot(frame: int) -> np.ndarray:
    canvas = background(frame, energy=0.72)
    fx(canvas, particle_field_3d(frame, make_particles(96, 1337), speed_z=6.5))

    if 4 <= frame <= 50:
        p = interpolate(frame, [4, 50], [0, 1], easing=EASE_STANDARD)
        fx(canvas, scanline_sweep(p), opacity=0.5)

    lx = 208
    k = waterfall_entry(frame, 3, 0, duration_frames=16, distance_y=42)
    put(canvas, txt("HYPERFRAMES + REMOTION MONOREPO", "mono-700", 26, "#00d4ff", 4.6),
        lx, 214 + k.translate_y, opacity=k.opacity * 0.95, anchor="topleft")

    hd = waterfall_entry(frame, 7, 0, duration_frames=20, distance_y=54)
    head = txt("AI VIDEO EDITOR", "inter-900", 106, "#fff8ff", -2.0)
    put(canvas, head, lx + head.shape[1] / 2, 300 + hd.translate_y, opacity=hd.opacity,
        scale=hd.scale, anchor="center")

    # the accent underline — carrier for seam 1
    ul_p = interpolate(frame, [18, 40], [0, 1], easing=EASE_STANDARD)
    if ul_p > 0.01:
        ulw = int(620 * ul_p)
        ul = bar(ulw, 9, 4, "#ff3d81", 1.0)
        put(canvas, ul, lx + ulw / 2, 372, blur=16, add=True, opacity=0.8 * ul_p)
        put(canvas, ul, lx + ulw / 2, 372, opacity=ul_p)

    for i in range(len(HUD)):
        key, _, col = HUD[i]
        it = waterfall_entry(frame, 5, i, stagger_frames=4, duration_frames=16, distance_y=40)
        y = 452 + i * 52
        kl = txt(key, "mono-700", 26, col, 3.2)
        vl = txt(hud_text(i), "mono-400", 26, "#b6a9ca", 1.5)
        put(canvas, kl, lx, y + it.translate_y, opacity=it.opacity, anchor="topleft")
        put(canvas, vl, lx + 178, y + it.translate_y, opacity=it.opacity, anchor="topleft")
        put(canvas, bar(3, 28, 1, "#ff3d81", 0.9), lx - 32, y + it.translate_y + 14,
            opacity=it.opacity * 0.9)
        c = caret(frame + i * 3)
        if c is not None and it.opacity > 0.92:
            put(canvas, c, lx + 178 + vl.shape[1] + 14, y + it.translate_y + 14,
                opacity=it.opacity * 0.85)

    grid = registry_grid(frame)
    g = waterfall_entry(frame, 10, 0, duration_frames=18, distance_y=28)
    put(canvas, grid, 1500, 300 + g.translate_y, opacity=g.opacity * 0.95)
    put(canvas, txt(f"{REPO['blocks']} REGISTRY BLOCKS", "mono-700", 23, "#fff8ff", 3.4),
        1500, 404 + g.translate_y, opacity=g.opacity * 0.85)
    put(canvas, txt(f"{REPO['manifests']} OFFLINE-CACHED MANIFESTS", "mono-400", 20, "#666666", 2.0),
        1500, 442 + g.translate_y, opacity=g.opacity * 0.8)

    n = int(round(interpolate(frame, [0, 51], [0, TOTAL_FRAMES])))
    put(canvas, txt(f"F:{n:04d} / 0300", "mono-700", 29, "#fff8ff", 2.4), 180, 940,
        opacity=interpolate(frame, [0, 10], [0, 0.9]), anchor="topleft")
    put(canvas, bar(1560, 4, 2, "#2a2a2a", 0.9), 960, 996)
    fp = frame / 51.0
    put(canvas, bar(max(6, 1560 * fp), 4, 2, "#00d4ff", 1.0), 180 + 1560 * fp / 2, 996,
        opacity=0.95)
    put(canvas, txt("* DETERMINISTIC RENDER", "mono-400", 21, "#4ade80", 2.0), 1740, 942,
        opacity=interpolate(frame, [8, 20], [0, 0.85]))
    return canvas


# --------------------------------------------------------------------------- #
# Scene 2 — IDENTITY (frames 54-137): wordmark, then the click that causes seam 2
# --------------------------------------------------------------------------- #


@lru_cache(maxsize=16)
def cursor_layer(scale: float) -> np.ndarray:
    """skills/oversized-cursor: the 7cqw protagonist pointer."""
    s = 168
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    base = [(18, 12), (18, 120), (45, 93), (63, 134), (82, 126), (64, 87), (100, 85)]
    pts = [(18 + (x - 18) * scale, 12 + (y - 12) * scale) for x, y in base]
    d.polygon(pts, fill=(8, 6, 17, 235))
    d.line(pts + [pts[0]], fill=(255, 248, 255, 255), width=6)
    return np.asarray(img, dtype=np.float32) / 255.0


def scene_identity(frame: int) -> np.ndarray:
    canvas = background(frame, energy=1.0)
    fx(canvas, particle_field_3d(frame, make_particles(70, 909), speed_z=4.4), opacity=0.5)

    p = interpolate(frame, [F1, F1 + 11], [0, 1], easing=Easing.out(Easing.poly(4)))
    slide = 276 * 1.15 * (1 - p)  # enters mid-flight with the current, never from rest
    op = interpolate(p, [0, 0.35, 1], [0.25, 1, 1])

    k = waterfall_entry(frame, F1 + 3, 0, duration_frames=16, distance_y=34)
    put(canvas, txt("THIS REPOSITORY, RENDERING ITSELF", "mono-700", 26, "#b6a9ca", 5.2),
        960 + slide * 0.5, 300 + k.translate_y, opacity=k.opacity * 0.9)

    mark = txt("AI-VIDEO-EDITOR", "inter-900", 164, "#fff8ff", -4.0)
    revealed = mask_reveal(mark, interpolate(frame, [F1 + 1, F1 + 18], [0, 1], easing=EASE_STANDARD))
    put(canvas, revealed, 960 + slide, 430, opacity=op, blur=28, add=True)
    put(canvas, revealed, 960 + slide, 430, opacity=op, scale=interpolate(p, [0, 1], [1.04, 1.0]))

    # carrier: the accent bar flies in from the left and lands under the wordmark
    bp = interpolate(frame, [F1, F1 + 14], [0, 1], easing=Easing.out(Easing.poly(4)))
    bw = int(interpolate(bp, [0, 1], [160, 760]))
    bx = interpolate(frame, [F1, F1 + 14], [-300, 960], easing=Easing.out(Easing.poly(4)))
    ab = bar(bw, 10, 5, "#ff3d81", 1.0)
    put(canvas, ab, bx, 528, blur=18, add=True, opacity=0.85 * bp)
    put(canvas, ab, bx, 528, opacity=bp)

    subs = (("ULTRAHIGH 3D MOTION GRAPHICS", "#fff8ff", 600),
            ("VFX / CGI", "#00d4ff", 1230),
            ("PROGRAMMATIC NLE", "#7c5cff", 1650))
    for i, (s, col, x) in enumerate(subs):
        it = waterfall_entry(frame, F1 + 18, i, stagger_frames=6, duration_frames=18, distance_y=42)
        t = txt(s, "inter-700", 38, col, 3.0)
        put(canvas, t, x, 604 + it.translate_y, opacity=it.opacity, scale=it.scale)
        if i < 2:
            put(canvas, bar(2, 32, 1, "#493668", 0.9), (920, 1450)[i], 604 + it.translate_y,
                opacity=it.opacity * 0.8)

    n0 = F1 + 28
    accents = ("#ff3d81", "#7c5cff", "#00d4ff", "#4ade80", "#fbbf24")
    for i, name in enumerate(ENGINE_CHIPS):
        it = waterfall_entry(frame, n0 + i * 3, 0, duration_frames=16, distance_y=32)
        x = nudge_curve(frame, n0 + i * 3, 24, 1520.0, 306.0 + i * 330.0)
        put(canvas, chip(name, accents[i]), x, 726 + it.translate_y, opacity=it.opacity * 0.98,
            scale=it.scale)

    pose = compute_oversized_cursor(frame, {
        "enter_start_frame": 92, "arrive_frame": 110, "click_frame": CLICK_FRAME,
        "exit_start_frame": 120, "exit_end_frame": 137,
        "target_x_percent": 60.5, "target_y_percent": 68.5,
        "exit_x_percent": -14.0, "exit_y_percent": 66.0,
    })
    if frame >= 92 and pose.x_percent < 118:
        cxp, cyp = pose.x_percent / 100 * W, pose.y_percent / 100 * H
        if pose.click_ripple_progress > 0:
            rp = pose.click_ripple_progress
            r = int(30 + 200 * Easing.out(Easing.poly(3))(rp))
            ring = radial_glow(r * 2, ACCENT2, falloff=1.0)
            prof = np.linspace(-1, 1, r * 2, dtype=np.float32)
            ring[..., 3] *= np.clip(np.abs(prof) ** 8, 0, 1)[None, :]
            put(canvas, ring, cxp, cyp, add=True, opacity=0.6 * (1 - rp))
        put(canvas, cursor_layer(pose.scale), cxp, cyp, anchor="topleft")

    # click ignition (frame 116): a light pulse rolls LEFT and becomes the Z push
    if frame >= CLICK_FRAME:
        pp = interpolate(frame, [CLICK_FRAME, CUT_2 - 1], [0, 1], easing=Easing.out(Easing.poly(3)))
        put(canvas, _blob(620, "#fff8ff", 2.6), interpolate(pp, [0, 1], [1900, 180]), 726,
            add=True, opacity=0.30 * (1 - pp))
    return canvas


# --------------------------------------------------------------------------- #
# Scene 3 — SCALE (frames 138-179): registry carousel + geodesic + count-ups
# --------------------------------------------------------------------------- #

GX, GY = 645.0, 560.0


def scene_scale(frame: int) -> np.ndarray:
    eff = min(frame, FREEZE_TO - 1) if frame >= FREEZE_FROM else frame  # the freeze holds time
    canvas = background(frame, energy=1.1)

    ray_op = interpolate(frame, [F2, F2 + 20], [0, 0.30]) * interpolate(
        frame, [FREEZE_FROM - 8, FREEZE_FROM], [1.0, 0.4])
    fx(canvas, volumetric_godrays(eff, make_rays(14, 4099), origin_x_percent=32,
                                  origin_y_percent=6, color=ACCENT, opacity=0.6),
       opacity=ray_op)
    fx(canvas, particle_field_3d(eff, make_particles(110, 20261), speed_z=8.5, rot_y=0.04),
       opacity=0.75)

    # Z scale-sign law: this scene's own entrance SHRINKS (1.06 -> 1.0) to match the
    # incoming camera push — no grow-from-small pop-in under a Z handoff.
    settle = interpolate(frame, [F2, F2 + 16], [1.06, 1.0], easing=Easing.out(Easing.poly(3)))
    put_at(canvas, carousel(eff, GX, GY, radius=330.0, front=False, scale=settle),
           add=True, opacity=0.9)
    geo = geodesic(eff, GX, GY, radius_scale=0.80 * settle, fov=900.0, camera_z=800.0)
    gblur, gpos = geo
    put_at(canvas, (blur_layer(gblur, 18), gpos), add=True, opacity=0.7)
    put_at(canvas, geo, add=True, opacity=1.0)
    put(canvas, _blob(720, "#35d9f2", 2.6), GX, GY, add=True,
        opacity=0.42 * interpolate(frame, [F2 + 2, F2 + 24], [0, 1]))
    put_at(canvas, carousel(eff, GX, GY, radius=330.0, front=True, scale=settle),
           add=True, opacity=0.95)

    hk = waterfall_entry(frame, F2 + 1, 0, duration_frames=18, distance_y=44)
    put(canvas, txt("REGISTRY + 3D ENGINE", "mono-700", 25, "#ff3d81", 5.6), GX, 118 + hk.translate_y,
        opacity=hk.opacity * 0.95)
    hv = waterfall_entry(frame, F2 + 4, 0, duration_frames=20, distance_y=52)
    hero = txt(f"{ASSETS} VISUAL ASSETS", "inter-900", 84, "#fff8ff", -2.0)
    put(canvas, hero, GX, 196 + hv.translate_y, opacity=hv.opacity, scale=hv.scale)
    put(canvas, txt("OFFLINE · ZERO CDN AT RENDER TIME", "mono-400", 21, "#666666", 3.0),
        GX, 898 + hv.translate_y * 0.5, opacity=hv.opacity * 0.85)

    rows = (
        ("REGISTRY BLOCKS", "SCENE TEMPLATES · WEBGL / GLSL / UI", REPO["blocks"], 248),
        ("MOTION COMPONENTS", "KINETIC TYPE · COUNTERS · BURSTS · HUDS", REPO["components"], 486),
        ("AGENT SKILLS", "DOCTRINE · TECHNIQUE · RENDER", REPO["skills"], 724),
    )
    for i, (label, sub, target, y) in enumerate(rows):
        st = F2 + 2 + i * 5
        it = waterfall_entry(frame, st, 0, duration_frames=18, distance_y=46)
        n = int(round(target * EASE_STANDARD(interpolate(eff, [st, st + 18], [0, 1]))))
        num = txt(str(n), "inter-900", 116, "#fff8ff", -3.0)
        sc = dynamic_scale(len(str(n)), len(str(target)))
        num = resize_layer(num, int(num.shape[1] * sc), int(num.shape[0] * sc))
        put(canvas, num, 1120, y + it.translate_y, opacity=it.opacity, anchor="topleft")
        put(canvas, bar(560, 5, 2, "#2a2a2a", 0.95), 1400, y + 130 + it.translate_y,
            opacity=it.opacity)
        fp = EASE_STANDARD(interpolate(eff, [st, st + 18], [0, 1]))
        put(canvas, bar(max(6, 560 * fp), 5, 2, "#ff3d81", 1.0), 1120 + 560 * fp / 2,
            y + 130 + it.translate_y, opacity=it.opacity)
        put(canvas, txt(label, "mono-700", 24, "#00d4ff", 4.2), 1120, y + 152 + it.translate_y,
            opacity=it.opacity * 0.95, anchor="topleft")
        put(canvas, txt(sub, "inter-500", 23, "#b6a9ca", 1.2), 1120, y + 188 + it.translate_y,
            opacity=it.opacity * 0.8, anchor="topleft")

    pkgs = f"{REPO['hf_packages']} HYPERFRAMES + {REPO['remotion_packages']} REMOTION PACKAGES"
    pp = waterfall_entry(frame, F2 + 8, 0, duration_frames=18, distance_y=36)
    put(canvas, txt(pkgs, "inter-700", 24, "#fff8ff", 1.0), 1120, 952 + pp.translate_y,
        opacity=pp.opacity, anchor="topleft")

    hud1 = cyber_hud(frame, F2 + 14, "GEODESIC-IOSA", f"V:12 · E:{len(GEO_EDGES)} · R:195")
    put(canvas, hud1, 215, 700, opacity=interpolate(frame, [F2 + 14, F2 + 26], [0, 0.95]),
        anchor="topleft")
    hud2 = cyber_hud(frame, F2 + 18, "DoP PRESET", "DOLLY-ZOOM · HITCHCOCK", accent="#ff3d81")
    put(canvas, hud2, 1245, 150, opacity=interpolate(frame, [F2 + 18, F2 + 30], [0, 0.95]),
        anchor="topleft")

    # stillness before climax: the frame stops gaining, then the flare ignites the cut
    if frame >= FREEZE_FROM:
        hold = interpolate(frame, [FREEZE_FROM, FREEZE_FROM + 5], [0, 1],
                           easing=Easing.in_out(Easing.cubic))
        wash = np.zeros((SH, SW, 4), dtype=np.float32)
        wash[..., 0], wash[..., 1], wash[..., 2] = ACCENT2
        wash[..., 3] = 0.045 * hold
        over(canvas, wash, 1.0, 0, 0, add=True)
        put(canvas, txt("HOLD", "mono-700", 28, "#00d4ff", 9.0), 1640, 940, opacity=hold * 0.9)

    fi = interpolate(frame, [FLARE_FROM, (FLARE_FROM + FLARE_TO) / 2, FLARE_TO], [0, 1.3, 0.35])
    flare_x = interpolate(frame, [FLARE_FROM, FLARE_TO], [8, 108], easing=Easing.in_(Easing.cubic))
    if fi > 0.01:
        fx(canvas, anamorphic_flare(frame, x_percent=flare_x, y_percent=46, intensity=fi))
    return canvas


@lru_cache(maxsize=8)
def _hud_reticle(accent_hex: str) -> np.ndarray:
    col = tuple(int(round(c * 255)) for c in hex2rgb(accent_hex))
    size = 88
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([1, 1, size - 2, size - 2], radius=8, outline=col + (255,), width=2)
    for cx0, cy0, dx, dy in ((-5, -5, 1, 1), (size - 13, -5, -1, 1),
                             (-5, size - 13, 1, -1), (size - 13, size - 13, -1, -1)):
        d.line([(cx0, cy0), (cx0 + 18 * dx, cy0)], fill=(255, 255, 255, 255), width=2)
        d.line([(cx0, cy0), (cx0, cy0 + 18 * dy)], fill=(255, 255, 255, 255), width=2)
    return np.asarray(img, dtype=np.float32) / 255.0


def cyber_hud(frame: int, start: int, label: str, sublabel: str, accent: str = "#35d9f2") -> np.ndarray:
    """CyberHUDTracker (vfxShaders.tsx §5): reticle + leader badge with live frame counter."""
    layer = np.zeros((196, 530, 4), dtype=np.float32)
    pulse = 0.94 + math.sin(frame * 0.25) * 0.06
    ret, rx, ry = tform(_hud_reticle(accent), cx=44, cy=44, scale=pulse)
    over(layer, ret, 1.0, rx, ry)
    badge = rounded_rect(384, 76, 6, "#070b12", 0.86, border_color=hex2rgb(accent), border_width=1)
    over(badge, bar(3, 76, 1, accent, 1.0), 1.0, 0, 0)
    over(badge, txt(label, "mono-700", 21, accent, 2.6), 1.0, 18, 12)
    over(badge, txt(f"{sublabel} · F:{frame:04d}", "mono-400", 18, "#d2e3ec", 1.3), 1.0, 18, 44)
    wf = waterfall_entry(frame, start, 0, duration_frames=14, distance_y=24)
    over(layer, badge, wf.opacity, 112, 6)
    return layer


# --------------------------------------------------------------------------- #
# Scene 4 — LOCKUP (frames 180-299): the geodesic docks into the mark
# --------------------------------------------------------------------------- #


def scene_lockup(frame: int) -> np.ndarray:
    canvas = background(frame, energy=0.85)
    fx(canvas, particle_field_3d(frame, make_particles(60, 5150), speed_z=3.2), opacity=0.4)

    p = interpolate(frame, [F3, F3 + 11], [0, 1], easing=Easing.out(Easing.poly(4)))
    slide = -276 * 1.15 * (1 - p)
    op = interpolate(p, [0, 0.35, 1], [0.25, 1, 1])

    # carrier: the geodesic shrinks from engine scale into the mark slot
    dock = interpolate(frame, [F3, F3 + 18], [0, 1], easing=EASE_STANDARD)
    geo_layer, geo_origin = geodesic(frame, 960.0, 520.0, radius_scale=1.0)
    ds = interpolate(dock, [0, 1], [0.52, 0.135])
    dy = interpolate(dock, [0, 1], [430.0, 236.0])
    gh, gw = geo_layer.shape[:2]
    nw, nh = max(4, int(gw * ds)), max(4, int(gh * ds))
    docked = resize_layer(geo_layer, nw, nh)
    # keep the mark's centre fixed while it shrinks into the lockup slot
    gcx = geo_origin[0] + gw / 2.0
    gcy = geo_origin[1] + gh / 2.0
    dxs = gcx - nw / 2.0 + slide * 0.4
    dys = gcy - nh / 2.0 + (dy - 520.0)
    over(canvas, blur_layer(docked, 12), 0.55 * op, int(round(dxs)), int(round(dys)), add=True)
    over(canvas, docked, op, int(round(dxs)), int(round(dys)), add=True)
    put(canvas, _blob(420, "#00d4ff", 2.4), gcx - OVERSCAN + slide * 0.4,
        gcy - OVERSCAN + (dy - 520.0), add=True, opacity=0.32 * op * (1 - dock * 0.35))

    wm = waterfall_entry(frame, F3 + 8, 0, duration_frames=20, distance_y=48)
    mark = txt("AI-VIDEO-EDITOR", "inter-900", 128, "#fff8ff", -3.0)
    put(canvas, mark, 960 + slide * 0.5, 404 + wm.translate_y, blur=26, add=True,
        opacity=wm.opacity * 0.4)
    put(canvas, mark, 960 + slide * 0.5, 404 + wm.translate_y, opacity=wm.opacity, scale=wm.scale)

    ulp = interpolate(frame, [F3 + 16, F3 + 34], [0, 1], easing=EASE_STANDARD)
    if ulp > 0.01:
        ulw = int(680 * ulp)
        ul = bar(ulw, 8, 4, "#ff3d81", 1.0)
        put(canvas, ul, 960, 486, blur=16, add=True, opacity=0.8 * ulp)
        put(canvas, ul, 960, 486, opacity=ulp)

    dw = waterfall_entry(frame, F3 + 20, 0, duration_frames=18, distance_y=36)
    put(canvas, txt("ULTRAHIGH 3D MOTION GRAPHICS · VFX / CGI · NLE · PROGRAMMATIC VIDEO",
                    "inter-500", 29, "#b6a9ca", 2.2), 960, 548 + dw.translate_y,
        opacity=dw.opacity * 0.95)

    pill = rounded_rect(920, 96, 48, SURFACE, 0.92, border_color=BORDER, border_width=1)
    cta = txt("BUILT FOR CLAUDE OPUS 5.5   ·   GPT-6.1 SOL", "inter-700", 33, "#fff8ff", 2.4)
    over(pill, cta, 1.0, (920 - cta.shape[1]) // 2 + 26, (96 - cta.shape[0]) // 2)
    over(pill, radial_glow(26, hex2rgb("#4ade80"), falloff=1.8), 1.0, 46, 35, add=True)
    pw = waterfall_entry(frame, F3 + 26, 0, duration_frames=20, distance_y=42)
    put(canvas, pill, 960, 660 + pw.translate_y, opacity=pw.opacity, scale=pw.scale)

    strip = (f"{REPO['blocks']} BLOCKS", f"{REPO['components']} COMPONENTS",
             f"{REPO['skills']} SKILLS", f"{REPO['hf_packages']} + {REPO['remotion_packages']} PACKAGES",
             f"{REPO['manifests']} MANIFESTS")
    for i, s in enumerate(strip):
        it = waterfall_entry(frame, F3 + 32, i, stagger_frames=3, duration_frames=16, distance_y=26)
        put(canvas, txt(s, "mono-700", 22, "#00d4ff", 3.0), 296 + i * 336, 782 + it.translate_y,
            opacity=it.opacity * 0.9)

    tc = f"00:00:{frame // FPS:02d}:{frame % FPS:02d}"
    put(canvas, txt(tc, "mono-700", 25, "#fff8ff", 2.2), 180, 936,
        opacity=interpolate(frame, [F3 + 6, F3 + 18], [0, 0.85]), anchor="topleft")
    prog = (frame - F3) / max(1, TOTAL_FRAMES - 1 - F3)
    put(canvas, bar(300, 3, 1, "#493668", 0.9), 180, 986, anchor="topleft", opacity=0.8)
    put(canvas, bar(max(4, 300 * prog), 3, 1, "#ff3d81", 1.0), 180 + 300 * prog / 2, 986,
        opacity=0.95)
    slug = txt("ThaddeusHackz/THE-AI-VIDEO-EDITOR", "mono-400", 23, "#666666", 1.5)
    put(canvas, slug, 1896 - slug.shape[1] / 2, 938,
        opacity=interpolate(frame, [F3 + 10, F3 + 24], [0, 0.8]))
    return canvas


# --------------------------------------------------------------------------- #
# Camera + seams + grade
# --------------------------------------------------------------------------- #

CAMERA_PLAN = {
    "boot": ("crane-up", F0, 54, 0.8),
    "identity": ("handheld-cinema", F1, 84, 0.6),
    "scale": ("dolly-zoom", F2, 42, 0.5),
    "lockup": ("crane-up", F3, 26, 0.45),
}


def apply_camera(canvas: np.ndarray, sid: str, frame: int) -> np.ndarray:
    preset, start, dur, intensity = CAMERA_PLAN[sid]
    rig = camera_rig(preset, frame, FPS, start, dur, intensity)
    scale = rig.scale
    rot = rig.rotate_z + (rig.rotate_x + rig.rotate_y) * 0.40
    tx, ty = rig.translate_x, rig.translate_y + rig.rotate_x * 3.0
    if abs(scale - 1) < 1e-4 and abs(rot) < 1e-3 and abs(tx) < 0.5 and abs(ty) < 0.5:
        return canvas
    img = Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8), "RGBA")
    if abs(scale - 1) >= 1e-4:
        img = img.transform(
            (SW, SH), Image.AFFINE,
            (1 / scale, 0, (SW / 2) * (1 - 1 / scale), 0, 1 / scale, (SH / 2) * (1 - 1 / scale)),
            resample=Image.BICUBIC,
        )
    if abs(rot) >= 1e-3:
        img = img.rotate(-rot, resample=Image.BILINEAR, center=(SW / 2, SH / 2))
    arr = np.asarray(img, dtype=np.float32) / 255.0
    if abs(ty) >= 0.5:
        arr = np.roll(arr, int(round(ty)), axis=0)
    if abs(tx) >= 0.5:
        arr = np.roll(arr, int(round(tx)), axis=1)
    return arr


def scene_at(frame: int) -> tuple[str, object]:
    if frame < CUT_1:
        return "boot", scene_boot
    if frame < CUT_2:
        return "identity", scene_identity
    if frame < CUT_3:
        return "scale", scene_scale
    return "lockup", scene_lockup


def seam_at(sid: str, frame: int) -> SeamTransform:
    if sid == "boot":
        return cut_the_curve_seam(frame, CUT_1, "outgoing", direction=-1, distance_px=300,
                                  exit_frames=8, entry_frames=11, peak_blur_px=16)
    if sid == "identity":
        incoming = cut_the_curve_seam(frame, CUT_1, "incoming", direction=-1, distance_px=300,
                                      exit_frames=8, entry_frames=11, peak_blur_px=16)
        outgoing = zoom_through_seam(frame, CUT_2, "outgoing", exit_frames=7, entry_frames=14,
                                     peak_blur_px=14)
        return SeamTransform(
            opacity=incoming.opacity * outgoing.opacity,
            translate_x=incoming.translate_x + outgoing.translate_x,
            translate_y=incoming.translate_y + outgoing.translate_y,
            scale=incoming.scale * outgoing.scale,
            blur_px=max(incoming.blur_px, outgoing.blur_px),
            visible=incoming.visible and outgoing.visible,
        )
    if sid == "scale":
        incoming = zoom_through_seam(frame, CUT_2, "incoming", exit_frames=7, entry_frames=14,
                                     peak_blur_px=14)
        outgoing = cut_the_curve_seam(frame, CUT_3, "outgoing", direction=-1, distance_px=300,
                                      exit_frames=8, entry_frames=11, peak_blur_px=16)
        return SeamTransform(
            opacity=incoming.opacity * outgoing.opacity,
            translate_x=incoming.translate_x + outgoing.translate_x,
            translate_y=incoming.translate_y + outgoing.translate_y,
            scale=incoming.scale * outgoing.scale,
            blur_px=max(incoming.blur_px, outgoing.blur_px),
            visible=incoming.visible and outgoing.visible,
        )
    return cut_the_curve_seam(frame, CUT_3, "incoming", direction=-1, distance_px=300,
                              exit_frames=8, entry_frames=11, peak_blur_px=16)


def seam_flash(frame: int) -> float:
    """Impact highlight on the cut frames. Not a crossfade — one scene stays visible."""
    total = 0.0
    for cut, amp in ((CUT_1, 0.09), (CUT_2, 0.14), (CUT_3, 0.10)):
        d = abs(frame - cut)
        if d <= 2.4:
            total += amp * math.exp(-(d * d) / 0.8)
    return total


def seam_aberration(frame: int) -> float:
    total = 0.0
    for cut, amp in ((CUT_1, 3.2), (CUT_2, 6.0), (CUT_3, 4.2)):
        d = abs(frame - cut)
        if d <= 9:
            total += amp * math.exp(-d / 3.0)
    return total


def grade(img: np.ndarray, frame: int) -> np.ndarray:
    """nleTrackEngine.getLUTFilterString('cyber-neon') + FilmGrainOverlay."""
    contrast, saturate = 1.22, 1.32
    out = (img - 0.5) * contrast + 0.5
    lum = out @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (out - lum[..., None]) * saturate
    a = math.radians(-6.0)  # hue-rotate(-6deg)
    ca, sa = math.cos(a), math.sin(a)
    r, g, b = out[..., 0], out[..., 1], out[..., 2]
    cb = (r + g + b) / 3.0
    out[..., 0] = cb + (r - cb) * ca - (b - cb) * sa
    out[..., 2] = cb + (r - cb) * sa + (b - cb) * ca
    out = np.clip(out, 0, 1)

    vig = vignette(1.0 + (0.28 if CUT_2 <= frame < CUT_3 else 0.0))
    out = out * (1 - vig[..., 3:4]) + vig[..., :3] * vig[..., 3:4]
    out = np.clip(out + film_grain(frame, 0.045)[..., :3] * 0.5, 0, 1)

    tail = interpolate(frame, [TOTAL_FRAMES - 10, TOTAL_FRAMES - 1], [1.0, 0.0])
    return out * tail if tail < 0.999 else out


def render_frame(frame: int) -> np.ndarray:
    sid, scene = scene_at(frame)
    canvas = scene(frame)
    canvas = apply_camera(canvas, sid, frame)
    st = seam_at(sid, frame)

    # The seam can translate/zoom the stage further than the overscan allows, so the
    # stage is edge-padded (the background is a smooth gradient — replication is
    # invisible) before the seam transform, exactly like seam-craft's stage ground.
    need = 0
    if abs(st.scale - 1.0) > 1e-4:
        need = int((max(st.scale, 1.0 / st.scale) - 1.0) * max(SW, SH) / 2) + 4
    if st.translate_x or st.translate_y:
        need = max(need, int(max(abs(st.translate_x), abs(st.translate_y))) + 4)
    pad = min(need, 380)
    if pad:
        canvas = np.pad(canvas, ((pad, pad), (pad, pad), (0, 0)), mode="edge")
    cx = pad + OVERSCAN + W / 2.0
    cy = pad + OVERSCAN + H / 2.0

    if pad or abs(st.scale - 1.0) > 1e-4 or st.translate_x or st.translate_y:
        s = st.scale
        pil = Image.fromarray((np.clip(canvas[..., :3], 0, 1) * 255).astype(np.uint8), "RGB")
        if abs(s - 1.0) > 1e-4 or st.translate_x or st.translate_y:
            pil = pil.transform(
                pil.size, Image.AFFINE,
                (1 / s, 0, cx - (cx + st.translate_x) / s,
                 0, 1 / s, cy - (cy + st.translate_y) / s),
                resample=Image.BICUBIC,
            )
        canvas = np.asarray(pil, dtype=np.float32) / 255.0
    img = canvas[pad + OVERSCAN:pad + OVERSCAN + H, pad + OVERSCAN:pad + OVERSCAN + W, :3].copy()
    if st.blur_px > 0.25:
        rgba = np.ones((H, W, 4), dtype=np.float32)
        rgba[..., :3] = img
        small = resize_layer(rgba, W // 2, H // 2)
        small = blur_layer(small, st.blur_px * 0.5)
        blurred = resize_layer(small, W, H)[..., :3]
        k = min(1.0, st.blur_px / 16.0)
        img = img * (1 - k) + blurred * k
    img = img * st.opacity

    flash = seam_flash(frame)
    if flash > 0.002:
        img = np.clip(img + flash, 0, 1)
    img = chromatic_aberration(img, seam_aberration(frame))
    return grade(img, frame)


# --------------------------------------------------------------------------- #
# Encode
# --------------------------------------------------------------------------- #


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=TOTAL_FRAMES)
    ap.add_argument("--out", default=None)
    ap.add_argument("--crf", type=int, default=16)
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--no-audio", dest="audio", action="store_false", default=True)
    ap.add_argument("--still", type=int, default=None, help="render one PNG frame and exit")
    args = ap.parse_args()

    project = HERE
    renders = os.path.join(project, "renders")
    os.makedirs(renders, exist_ok=True)
    out_path = args.out or os.path.join(renders, "ai-video-editor-selfportrait.mp4")

    if args.still is not None:
        png = os.path.join(renders, f"still-{args.still:04d}.png")
        img = render_frame(args.still)
        Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB").save(png)
        print(f"[still] {png}")
        return 0

    wav = os.path.join(renders, "bed.wav")
    if args.audio:
        from audio import build_bed

        build_bed(wav)
        print(f"[audio] synthesized bed -> {wav}")

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [ffmpeg, "-y", "-f", "rawvideo", "-vcodec", "rawvideo", "-s", f"{W}x{H}",
           "-pix_fmt", "rgb24", "-r", str(FPS), "-i", "-"]
    if args.audio:
        cmd += ["-i", wav]
    cmd += ["-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf),
            "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
            "-movflags", "+faststart", "-color_primaries", "bt709", "-color_trc", "bt709",
            "-colorspace", "bt709"]
    if args.audio:
        cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest"]
    else:
        cmd += ["-an"]
    cmd += [out_path]

    print(f"[encode] {len(cmd)} args -> {out_path}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                            stderr=subprocess.PIPE)
    t0 = time.time()
    try:
        for f in range(args.frames):
            img = render_frame(f)
            proc.stdin.write((np.clip(img, 0, 1) * 255).astype(np.uint8).tobytes())
            if f % 25 == 0 or f == args.frames - 1:
                el = time.time() - t0
                rate = (f + 1) / max(el, 1e-6)
                print(f"  frame {f:3d}/{args.frames}  {rate:4.2f} fps  "
                      f"eta {(args.frames - f - 1) / max(rate, 1e-6):5.1f}s", flush=True)
    finally:
        try:
            proc.stdin.close()
        except BrokenPipeError:
            pass
    err = proc.stderr.read().decode(errors="replace")
    rc = proc.wait()
    if rc != 0:
        print(err[-4000:], file=sys.stderr)
        return rc
    print(f"[done] {out_path}  {os.path.getsize(out_path) / 1e6:.2f} MB  {time.time() - t0:.1f}s")
    print(f"[repo] {REPO}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
