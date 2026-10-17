---
name: motion-quality-gates
description: Numeric rules and pass/fail checks that stop bad motion, sloppy cuts and broken renders before delivery. Use on every render.
---

# Motion Quality Gates

## Timing
| Element | Duration |
|---|---|
| Micro (icon pop, button) | 150–250 ms |
| Text in / out | 300–500 ms |
| Panel / scene transition | 400–700 ms |
| Camera move (3D) | 1.5–4 s |
| Hold after text lands (readable) | ≥ 0.3 s + 0.06 s per word |

## Easing
- Entrances: ease-out (`cubic-bezier(0.16,1,0.3,1)`) or spring (damping 12–20, mass 0.6–1).
- Exits: ease-in, ~70% of entrance duration.
- Never `linear` except for continuous loops, tickers, rotation.
- Overshoot max 6–10% scale; one bounce, not three.

## Choreography
- Stagger 40–90 ms between siblings; lead with the most important element.
- Max 2 things moving at once in the focal area.
- Motion direction follows reading direction / the edit's momentum.
- Every motion begins and ends on a whole frame; no sub-frame snapping.

## Blocking checks (fail = do not ship)
1. No black or blank frames (scan with `ffmpeg blackdetect`, d=0.04).
2. No frozen frames > 0.5 s unless intentional (`freezedetect`).
3. Audio: no clipping, true-peak ≤ −1 dBTP; no word cut mid-phoneme.
4. Text inside safe area; contrast ≥ 4.5:1; no orphan single word on a caption line.
5. Duration within ±1 frame of brief; fps constant (CFR).
6. Fonts embedded/loaded before frame 0 (`delayRender` / font preload).
7. Deterministic: two renders of the same frame are byte-identical.

## Review loop
Writer ≠ critic. Critic must list ≥3 concrete flaws with timestamps; a score with no flaws is a failed review.
