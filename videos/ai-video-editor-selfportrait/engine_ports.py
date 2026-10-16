"""Deterministic ports of this repo's Remotion engine modules.

Every function here is a 1:1 numerical port of TypeScript source that already lives
in the repository, so the render obeys the same motion law whether it is rasterized by
Remotion, HyperFrames, or this compositor:

  * remotion/src/engine/cameraRig.tsx        -> mulberry32, project3d_point, camera_rig
  * remotion/src/engine/seamTransitions.ts   -> cut_the_curve_seam, zoom_through_seam,
                                                waterfall_entry, nudge_curve,
                                                compute_oversized_cursor
  * remotion/src/Cinematic3DShowcase.tsx     -> build_geodesic_geometry
  * remotion/src/engine/nleTrackEngine.tsx   -> LUT_GRADES

Easing names follow Remotion's `Easing` API (poly/cubic/exp/sin/bezier, in/out/in_out).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# --------------------------------------------------------------------------- #
# interpolate + Easing (remotion)
# --------------------------------------------------------------------------- #


def interpolate(
    value: float,
    input_range: tuple[float, float] | list[float],
    output_range: tuple[float, ...] | list[float],
    *,
    clamp: bool = True,
    easing=None,
) -> float:
    """Port of remotion's `interpolate` with extrapolateLeft/Right = 'clamp'."""
    ir = list(input_range)
    orr = list(output_range)
    if len(ir) == 2 and len(orr) > 2:
        raise ValueError("multi-segment interpolation needs matching range lengths")

    if len(ir) == 2:
        x = value
        if clamp:
            x = min(max(x, ir[0]), ir[1]) if ir[0] <= ir[1] else min(max(x, ir[1]), ir[0])
        span = ir[1] - ir[0]
        t = 0.0 if span == 0 else (x - ir[0]) / span
        if easing is not None:
            t = easing(t)
        return orr[0] + (orr[1] - orr[0]) * t

    # piecewise (Remotion interpolates each segment independently, no cross easing)
    for i in range(len(ir) - 1):
        lo, hi = ir[i], ir[i + 1]
        if value <= hi or i == len(ir) - 2:
            x = min(max(value, lo), hi) if clamp else value
            span = hi - lo
            t = 0.0 if span == 0 else (x - lo) / span
            if easing is not None:
                t = easing(t)
            return orr[i] + (orr[i + 1] - orr[i]) * t
    return orr[-1]


def _bezier(x1: float, y1: float, x2: float, y2: float):
    """Cubic bezier easing (same shape as CSS cubic-bezier / Easing.bezier)."""

    def cx(t: float) -> float:
        return 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t**3

    def cy(t: float) -> float:
        return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t**3

    def solve(x: float) -> float:
        lo, hi = 0.0, 1.0
        t = x
        for _ in range(24):
            v = cx(t)
            if abs(v - x) < 1e-6:
                break
            if v < x:
                lo = t
            else:
                hi = t
            t = (lo + hi) * 0.5
        return t

    return lambda x: cy(solve(min(max(x, 0.0), 1.0)))


# themes/bold.css --ease-standard
EASE_STANDARD = _bezier(0.16, 1.0, 0.30, 1.0)
# themes/bold.css --ease-emphasis
EASE_EMPHASIS = _bezier(0.34, 1.56, 0.64, 1.0)


class Easing:
    """Port of remotion's `Easing` namespace (the subset the engine uses)."""

    @staticmethod
    def linear(t: float) -> float:
        return t

    @staticmethod
    def quad(t: float) -> float:
        return t * t

    @staticmethod
    def cubic(t: float) -> float:
        return t**3

    @staticmethod
    def poly(n: float):
        return lambda t: t**n

    @staticmethod
    def exp(t: float) -> float:
        return 0.0 if t == 0 else 2.0 ** (10 * (t - 1))

    @staticmethod
    def sin(t: float) -> float:
        return 1 - math.cos((t * math.pi) / 2)

    @staticmethod
    def back(s: float = 1.70158):
        return lambda t: t * t * ((s + 1) * t - s)

    @staticmethod
    def in_(f):
        return f

    @staticmethod
    def out(f):
        return lambda t: 1 - f(1 - t)

    @staticmethod
    def in_out(f):
        def g(t: float) -> float:
            if t < 0.5:
                return f(t * 2) / 2
            return 1 - f((1 - t) * 2) / 2

        return g

    @staticmethod
    def bezier(x1: float, y1: float, x2: float, y2: float):
        return _bezier(x1, y1, x2, y2)


# --------------------------------------------------------------------------- #
# cameraRig.tsx
# --------------------------------------------------------------------------- #

_U32 = 0xFFFFFFFF


def _imul(a: int, b: int) -> int:
    """Math.imul — 32-bit integer multiplication with wraparound."""
    return ((a & _U32) * (b & _U32)) & _U32


def mulberry32(seed: int):
    state = {"a": seed & _U32}

    def rnd() -> float:
        a = (state["a"] + 0x6D2B79F5) & _U32
        state["a"] = a
        t = _imul(a ^ (a >> 15), 1 | a)
        t = (t + _imul(t ^ (t >> 7), 61 | t)) & _U32
        return ((t ^ (t >> 14)) & _U32) / 4294967296.0

    return rnd


@dataclass
class Vec3:
    x: float
    y: float
    z: float


@dataclass
class ProjectedPoint:
    x: float
    y: float
    scale: float
    depth: float
    visible: bool


def project3d_point(
    pt: Vec3,
    rot_x: float,
    rot_y: float,
    rot_z: float,
    fov: float,
    camera_z: float,
    center_x: float,
    center_y: float,
) -> ProjectedPoint:
    """Port of `project3DPoint` — rotate Y then X then Z, perspective divide."""
    cy, sy = math.cos(rot_y), math.sin(rot_y)
    x1 = pt.x * cy + pt.z * sy
    z1 = -pt.x * sy + pt.z * cy
    y1 = pt.y

    cx, sx = math.cos(rot_x), math.sin(rot_x)
    y2 = y1 * cx - z1 * sx
    z2 = y1 * sx + z1 * cx
    x2 = x1

    cz, sz = math.cos(rot_z), math.sin(rot_z)
    x3 = x2 * cz - y2 * sz
    y3 = x2 * sz + y2 * cz

    depth = camera_z - z2
    if depth <= 10:
        return ProjectedPoint(center_x, center_y, 0.0, depth, False)
    scale = fov / depth
    return ProjectedPoint(center_x + x3 * scale, center_y + y3 * scale, scale, depth, True)


@dataclass
class CameraRigState:
    scale: float = 1.0
    subject_counter_scale: float = 1.0
    translate_x: float = 0.0
    translate_y: float = 0.0
    rotate_x: float = 0.0
    rotate_y: float = 0.0
    rotate_z: float = 0.0
    blur_px: float = 0.0
    perspective_px: float = 1200.0
    time_scale: float = 1.0
    preset: str = "static"


def camera_rig(
    preset: str,
    frame: int,
    fps: int,
    start_frame: int = 0,
    duration_in_frames: int = 1,
    intensity: float = 1.0,
) -> CameraRigState:
    """Port of `useCameraRig` — the Higgsfield DoP presets, frame-exact."""
    base = CameraRigState(preset=preset)
    if frame < start_frame:
        return base
    dur = max(1, duration_in_frames)
    end_frame = start_frame + dur
    progress = interpolate(frame, [start_frame, end_frame], [0, 1])

    if preset == "dolly-zoom":
        eased = Easing.in_out(Easing.sin)(progress)
        return CameraRigState(
            preset=preset,
            scale=1 + 0.42 * intensity * eased,
            subject_counter_scale=1 / (1 + 0.28 * intensity * eased),
            perspective_px=interpolate(eased, [0, 1], [1400, 720]),
        )

    if preset == "crash-zoom":
        snap = min(dur, round(fps * 0.38))
        snap_end = start_frame + snap
        p = interpolate(frame, [start_frame, snap_end], [0, 1], easing=Easing.in_out(Easing.exp))
        blur = interpolate(
            frame,
            [start_frame, start_frame + snap * 0.45, snap_end],
            [0, 11 * intensity, 0],
        )
        decay = 0.0
        if frame > snap_end:
            d = frame - snap_end
            decay = math.exp(-d * 0.22) * math.sin(d * 1.9) * 6 * intensity
        return CameraRigState(
            preset=preset,
            scale=1 + 0.85 * intensity * p,
            translate_x=decay,
            translate_y=-decay * 0.6,
            blur_px=blur,
        )

    if preset == "orbit-360":
        eased = Easing.in_out(Easing.cubic)(progress)
        return CameraRigState(
            preset=preset,
            rotate_y=interpolate(eased, [0, 1], [-18 * intensity, 18 * intensity]),
            rotate_x=interpolate(eased, [0, 0.5, 1], [7 * intensity, 2 * intensity, -4 * intensity]),
            scale=interpolate(eased, [0, 0.5, 1], [0.96, 1.06, 1.0]),
            translate_x=math.sin(eased * math.pi * 2) * 28 * intensity,
        )

    if preset == "bullet-time":
        enter_p = interpolate(progress, [0, 0.2], [0, 1], easing=Easing.out(Easing.exp))
        arc_p = interpolate(progress, [0.2, 0.82], [0, 1])
        exit_p = interpolate(progress, [0.82, 1], [0, 1], easing=Easing.in_(Easing.exp))
        active = enter_p * (1 - exit_p)
        return CameraRigState(
            preset=preset,
            scale=1 + 0.22 * intensity * active,
            rotate_y=interpolate(arc_p, [0, 1], [16 * intensity, -16 * intensity]) * active,
            rotate_z=interpolate(arc_p, [0, 1], [-3.5 * intensity, 2.5 * intensity]) * active,
            time_scale=0.08 if 0.2 <= progress <= 0.82 else 1.0,
        )

    if preset == "whip-pan":
        mid = start_frame + dur * 0.5
        if frame <= mid:
            tx = interpolate(
                frame, [start_frame, mid], [0, -320 * intensity], easing=Easing.in_(Easing.poly(4))
            )
        else:
            tx = interpolate(
                frame, [mid, end_frame], [320 * intensity, 0], easing=Easing.out(Easing.poly(4))
            )
        blur = interpolate(frame, [start_frame, mid, end_frame], [0, 18 * intensity, 0])
        return CameraRigState(preset=preset, translate_x=tx, blur_px=blur)

    if preset == "push-to-glass":
        eased = Easing.in_(Easing.poly(3))(progress)
        return CameraRigState(
            preset=preset,
            scale=1 + 1.85 * intensity * eased,
            blur_px=interpolate(eased, [0, 0.7, 1], [0, 2, 10 * intensity]),
        )

    if preset == "crane-up":
        eased = Easing.out(Easing.cubic)(progress)
        return CameraRigState(
            preset=preset,
            translate_y=interpolate(eased, [0, 1], [115 * intensity, 0]),
            rotate_x=interpolate(eased, [0, 1], [11 * intensity, 0]),
            scale=interpolate(eased, [0, 1], [1.06, 1.0]),
        )

    if preset == "handheld-cinema":
        t = frame / fps
        dx = (math.sin(t * 2.1) * 4.5 + math.cos(t * 5.3) * 1.8) * intensity
        dy = (math.cos(t * 1.7) * 3.8 + math.sin(t * 4.7) * 1.5) * intensity
        rz = math.sin(t * 1.3) * 0.42 * intensity
        return CameraRigState(
            preset=preset, translate_x=dx, translate_y=dy, rotate_z=rz, scale=1.015
        )

    if preset == "rack-focus":
        blur = interpolate(
            progress, [0, 0.35, 1], [14 * intensity, 3 * intensity, 0], easing=Easing.out(Easing.cubic)
        )
        return CameraRigState(
            preset=preset, blur_px=blur, scale=interpolate(progress, [0, 1], [1.04, 1.0])
        )

    if preset == "fpv-drone":
        eased = Easing.in_out(Easing.cubic)(progress)
        bank = math.sin(progress * math.pi * 2) * 9.5 * intensity
        return CameraRigState(
            preset=preset,
            scale=interpolate(eased, [0, 1], [0.88, 1.18]),
            rotate_z=bank,
            rotate_x=interpolate(eased, [0, 0.5, 1], [6 * intensity, -3 * intensity, 2 * intensity]),
            translate_y=math.cos(progress * math.pi * 2) * 18 * intensity,
        )

    return base


# --------------------------------------------------------------------------- #
# seamTransitions.ts
# --------------------------------------------------------------------------- #


@dataclass
class SeamTransform:
    opacity: float
    translate_x: float
    translate_y: float
    scale: float
    blur_px: float
    visible: bool


def cut_the_curve_seam(
    frame: int,
    cut_frame: int,
    role: str,
    *,
    axis: str = "x",
    direction: int = -1,
    distance_px: float = 240.0,
    exit_frames: int = 8,
    entry_frames: int = 11,
    peak_blur_px: float = 14.0,
) -> SeamTransform:
    """Port of `cutTheCurveSeam` — velocity-matched directional seam, zero overlap."""
    if role == "outgoing":
        if frame >= cut_frame:
            return SeamTransform(0.0, 0.0, 0.0, 1.0, 0.0, False)
        exit_start = cut_frame - exit_frames
        if frame <= exit_start:
            return SeamTransform(1.0, 0.0, 0.0, 1.0, 0.0, True)
        p = interpolate(
            frame, [exit_start, cut_frame], [0, 1], easing=Easing.in_(Easing.poly(4))
        )
        lin = interpolate(frame, [exit_start, cut_frame], [0, 1])
        offset = direction * distance_px * p
        return SeamTransform(
            opacity=interpolate(lin, [0, 1], [1, 0.22]),
            translate_x=offset if axis == "x" else 0.0,
            translate_y=offset if axis == "y" else 0.0,
            scale=1.0,
            blur_px=peak_blur_px * p,
            visible=True,
        )

    if frame < cut_frame:
        return SeamTransform(0.0, 0.0, 0.0, 1.0, 0.0, False)
    entry_end = cut_frame + entry_frames
    if frame >= entry_end:
        return SeamTransform(1.0, 0.0, 0.0, 1.0, 0.0, True)
    p = interpolate(frame, [cut_frame, entry_end], [0, 1], easing=Easing.out(Easing.poly(4)))
    offset = -direction * distance_px * 1.15 * (1 - p)
    return SeamTransform(
        opacity=interpolate(p, [0, 0.35, 1], [0.25, 1, 1]),
        translate_x=offset if axis == "x" else 0.0,
        translate_y=offset if axis == "y" else 0.0,
        scale=1.0,
        blur_px=peak_blur_px * (1 - p),
        visible=True,
    )


def zoom_through_seam(
    frame: int,
    cut_frame: int,
    role: str,
    *,
    inverse: bool = False,
    exit_frames: int = 7,
    entry_frames: int = 14,
    peak_blur_px: float = 12.0,
) -> SeamTransform:
    """Port of `zoomThroughSeam` — enforces the Z scale-sign law."""
    if role == "outgoing":
        if frame >= cut_frame:
            return SeamTransform(0.0, 0.0, 0.0, 1.0, 0.0, False)
        exit_start = cut_frame - exit_frames
        if frame <= exit_start:
            return SeamTransform(1.0, 0.0, 0.0, 1.0, 0.0, True)
        p = interpolate(frame, [exit_start, cut_frame], [0, 1], easing=Easing.in_(Easing.cubic))
        lin = interpolate(frame, [exit_start, cut_frame], [0, 1])
        target = 0.8 if inverse else 1.24
        return SeamTransform(
            opacity=interpolate(lin, [0, 1], [1, 0.16]),
            translate_x=0.0,
            translate_y=0.0,
            scale=interpolate(p, [0, 1], [1, target]),
            blur_px=peak_blur_px * p,
            visible=True,
        )

    if frame < cut_frame:
        return SeamTransform(0.0, 0.0, 0.0, 1.0, 0.0, False)
    entry_end = cut_frame + entry_frames
    if frame >= entry_end:
        return SeamTransform(1.0, 0.0, 0.0, 1.0, 0.0, True)
    p = interpolate(frame, [cut_frame, entry_end], [0, 1], easing=Easing.out(Easing.exp))
    start_scale = 1.26 if inverse else 0.75
    return SeamTransform(
        opacity=interpolate(p, [0, 0.3, 1], [0.16, 1, 1]),
        translate_x=0.0,
        translate_y=0.0,
        scale=interpolate(p, [0, 1], [start_scale, 1]),
        blur_px=peak_blur_px * (1 - p),
        visible=True,
    )


@dataclass
class WaterfallItem:
    opacity: float
    translate_y: float
    scale: float


def waterfall_entry(
    frame: int,
    start_frame: int,
    index: int,
    *,
    stagger_frames: int = 4,
    duration_frames: int = 18,
    distance_y: float = 54.0,
) -> WaterfallItem:
    """Port of `waterfallEntry` — staggered arrival cascade (cut-the-curve §6)."""
    item_start = start_frame + index * stagger_frames
    p = interpolate(
        frame,
        [item_start, item_start + duration_frames],
        [0, 1],
        easing=Easing.out(Easing.poly(4)),
    )
    return WaterfallItem(
        opacity=interpolate(p, [0, 0.4, 1], [0, 1, 1]),
        translate_y=(1 - p) * distance_y,
        scale=interpolate(p, [0, 1], [0.96, 1]),
    )


def nudge_curve(
    frame: int, start_frame: int, duration_frames: int, from_px: float, to_px: float
) -> float:
    """Port of `nudgeCurve` — the 10/65/25 three-phase group slide (cut-the-curve §7)."""
    if frame <= start_frame:
        return from_px
    end_frame = start_frame + duration_frames
    if frame >= end_frame:
        return to_px
    p = (frame - start_frame) / duration_frames
    if p < 0.1:
        local = p / 0.1
        curved = 0.08 * (local * local)
    elif p < 0.75:
        local = (p - 0.1) / 0.65
        curved = 0.08 + 0.8 * Easing.in_out(Easing.cubic)(local)
    else:
        local = (p - 0.75) / 0.25
        curved = 0.88 + 0.12 * (1 - (1 - local) ** 3)
    return from_px + (to_px - from_px) * curved


@dataclass
class CursorPose:
    x_percent: float
    y_percent: float
    scale: float
    clicking: bool
    click_ripple_progress: float


def compute_oversized_cursor(frame: int, cfg: dict) -> CursorPose:
    """Port of `computeOversizedCursor` — the 7cqw protagonist pointer."""
    enter_start = cfg["enter_start_frame"]
    arrive = cfg["arrive_frame"]
    click = cfg["click_frame"]
    exit_start = cfg["exit_start_frame"]
    exit_end = cfg["exit_end_frame"]
    tx, ty = cfg["target_x_percent"], cfg["target_y_percent"]
    ex = cfg.get("exit_x_percent", -14.0)
    ey = cfg.get("exit_y_percent", 42.0)

    x_percent, y_percent = tx + 12, 116.0
    if enter_start <= frame < exit_start:
        enter_p = interpolate(
            frame, [enter_start, arrive], [0, 1], easing=Easing.out(Easing.cubic)
        )
        x_percent = interpolate(enter_p, [0, 1], [tx + 12, tx])
        y_percent = interpolate(enter_p, [0, 1], [116, ty])
    elif frame >= exit_start:
        exit_p = interpolate(frame, [exit_start, exit_end], [0, 1], easing=Easing.in_(Easing.cubic))
        x_percent = interpolate(exit_p, [0, 1], [tx, ex])
        y_percent = interpolate(exit_p, [0, 1], [ty, ey])

    scale = 1.0
    if click <= frame <= click + 10:
        if frame <= click + 3:
            scale = interpolate(
                frame, [click, click + 3], [1, 0.84], easing=Easing.in_(Easing.quad)
            )
        else:
            scale = interpolate(
                frame, [click + 3, click + 10], [0.84, 1], easing=Easing.out(Easing.quad)
            )

    ripple = (
        interpolate(frame, [click, click + 18], [0, 1])
        if click <= frame <= click + 18
        else 0.0
    )
    return CursorPose(x_percent, y_percent, scale, click <= frame <= click + 6, ripple)


# --------------------------------------------------------------------------- #
# Cinematic3DShowcase.tsx -> buildGeodesicGeometry
# --------------------------------------------------------------------------- #


def build_geodesic_geometry(radius: float = 195.0, ring_radius: float = 320.0, ring_y: float = 65.0):
    """Port of `buildGeodesicGeometry` — icosahedron vertices/edges + orbital ring."""
    phi = (1 + math.sqrt(5)) / 2
    raw = [
        (-1, phi, 0), (1, phi, 0), (-1, -phi, 0), (1, -phi, 0),
        (0, -1, phi), (0, 1, phi), (0, -1, -phi), (0, 1, -phi),
        (phi, 0, -1), (phi, 0, 1), (-phi, 0, -1), (-phi, 0, 1),
    ]
    vertices = []
    for x, y, z in raw:
        length = math.sqrt(x * x + y * y + z * z)
        vertices.append(Vec3(x / length * radius, y / length * radius, z / length * radius))

    edges = []
    for i in range(len(vertices)):
        for j in range(i + 1, len(vertices)):
            d = math.dist(
                (vertices[i].x, vertices[i].y, vertices[i].z),
                (vertices[j].x, vertices[j].y, vertices[j].z),
            )
            if d < radius * 1.18:
                edges.append((i, j))

    ring = []
    for i in range(32):
        a = (i / 32) * math.pi * 2
        ring.append(
            Vec3(math.cos(a) * ring_radius, math.sin(a) * ring_y, math.sin(a) * ring_radius)
        )
    return vertices, edges, ring


# --------------------------------------------------------------------------- #
# nleTrackEngine.tsx -> getLUTFilterString (applied numerically)
# --------------------------------------------------------------------------- #

LUT_GRADES = {
    "teal-orange-cinema": {"contrast": 1.12, "saturate": 1.18, "brightness": 1.02},
    "editorial-film": {"contrast": 1.04, "saturate": 0.88, "sepia": 0.08, "brightness": 1.03},
    "cyber-neon": {"contrast": 1.22, "saturate": 1.32, "hue_rotate": -6.0},
    "clean-studio": {"contrast": 1.03, "saturate": 1.04},
}


def apply_lut(img, preset: str = "cyber-neon"):
    """Numeric application of `getLUTFilterString(preset)` to an HxWx3 float image."""
    import numpy as np

    g = LUT_GRADES[preset]
    out = img * g.get("brightness", 1.0)
    c = g.get("contrast", 1.0)
    out = (out - 0.5) * c + 0.5
    s = g.get("saturate", 1.0)
    lum = out @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    out = lum[..., None] + (out - lum[..., None]) * s
    if "sepia" in g:
        k = g["sepia"]
        r, gr, b = out[..., 0], out[..., 1], out[..., 2]
        out = out * (1 - k) + k * np.stack(
            [
                0.393 * r + 0.769 * gr + 0.189 * b,
                0.349 * r + 0.686 * gr + 0.168 * b,
                0.272 * r + 0.534 * gr + 0.131 * b,
            ],
            axis=-1,
        )
    return np.clip(out, 0.0, 1.0)
