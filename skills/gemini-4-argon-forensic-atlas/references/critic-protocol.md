# The 4-Shot Critic Protocol — render QA that a model cannot fake

Reverse-engineered from Google's own Gemini 4 Argon developer guide (2026-10-13), then adapted to this repo's HyperFrames/Remotion outputs. This is the single highest-ROI artefact in the Argon scan: it converts "looks fine" into a numeric gate.

## 1. The rule

```text
Per round, render EXACTLY four screenshots:
  1) three-quarter overview      — composition, silhouette, staging
  2) close-up                    — material, detail, text rendering, aliasing
  3) low angle                   — proves nothing floats / no ground-plane cheats
  4) wireframe (or shader debug) — proves clean geometry, no coplanar z-fighting

Then:
  critic lists AT LEAST 3 SPECIFIC flaws        (generic praise = invalid round)
  critic scores the scene out of 10
  loop until score >= 9
```

Why these four, specifically:

| Shot | Catches | Missed by |
|---|---|---|
| 3/4 overview | Bad staging, dead space, subject/background collision | Close-up-only reviews |
| Close-up | Texture stretch, font hinting, banding, jaggies, Z-blur | Wide shots |
| Low angle | **Floating geometry**, shadow detachment, fake contact | Every eye-level review |
| Wireframe | Non-manifold meshes, coplanar faces, wasted density | Any shaded render |

The low-angle and wireframe shots exist to make the loop **adversarial by construction**. A critic that only sees beauty shots will approve anything.

## 2. Repo-native implementation

```bash
# Remotion: four gate stills from one composition
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/01-wide.png    --frame=120
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/02-close.png   --frame=138
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/03-low.png     --frame=150
npx remotion still src/index.ts Cinematic3D-Showcase out/qc/04-wire.png    --frame=120 \
  --props='{"debug":"wireframe"}'

# HyperFrames: same idea against the rendered frame grid
hyperframes render -o renders/qc.mp4 -f 30 -q standard
node scripts/seam-gate.mjs verify --ledger examples/ultrahigh-3d-vfx-showreel/ledger.json \
  --project examples/ultrahigh-3d-vfx-showreel
```

Feed the four PNGs back to the model with this exact scaffold:

```text
You are the ADVERSARIAL CRITIC for round {n}.
Images: 01-wide (3/4 overview), 02-close, 03-low (check nothing floats), 04-wire (geometry cleanliness).
Task:
  1. List at least three SPECIFIC flaws. Name the object, the region of frame, and the artefact.
     Generic statements ("lighting could be better") are rejected — return them and re-run.
  2. Rate the scene out of 10.
  3. If the score < 9, output the minimal code/scene diff that raises it, one flaw per diff hunk.
  4. Never approve a round you cannot defend from the four images.
```

## 3. Scoring rubric (house calibration)

| Score | Meaning | Action |
|---|---|---|
| ≤ 4 | Broken staging or floating geometry | Reject, rebuild |
| 5–6 | Recognisable but detail-poor | Continue loop |
| 7–8 | Shippable B-roll | Continue if hero shot; accept if cutaway |
| **9–10** | Hero-shot grade | Pass to seam gate |
| 10 with no flaws listed | **Invalid round — the critic failed** | Discard, re-run with HIGH thinking |

> A round that reports 10/10 **and** zero flaws is a failed round, not a perfect scene. Enforce this explicitly; it is the cheapest way to catch a critic that is pattern-matching instead of inspecting.

## 4. Composing with the repo's existing gates

```text
Argon critic gate  →  seam gate  →  lint gate  →  render
   (taste/aesthetics)   (numeric)    (static)
```

- The **critic gate** is subjective and aesthetic: composition, material truth, "does it read".
- The **seam gate** (`scripts/seam-gate.mjs`) is numeric: velocity-matched seams, 0 fail/warn.
- The **lint gate** (`hyperframes lint`) is static: 0 errors / 0 warnings.

Never let one substitute for another. A scene can score 9 and still fail a seam; a seam can pass 100% on an ugly frame.

## 5. Failure modes to expect (and the counter-move)

| Failure | Symptom | Counter-move |
|---|---|---|
| Sycophantic critic | Always 9–10, no specifics | Require ≥3 named flaws + region-of-frame coordinates; discard all-perfect rounds |
| Blind critic | Cannot see the artefact at all | Raise thinking to HIGH; supply the reference image *in the same prompt* as the render |
| Round thrash | Score oscillates 7↔8 forever | Freeze one axis per round (lighting OR geometry OR camera), never all three |
| Cost spiral | 1,000 rounds on a 10-second shot (as in Google's Pixel CAD demo) | Set a hard round budget; require each round to name the flaw it fixes |
| Grade drift | Each round re-grades the whole scene | Lock the reference images after round 3 |

## 6. Minimum viable adoption (copy/paste)

```text
ROUND BUDGET: 12 rounds, stop at score >= 9 or budget exhaustion
AXES FROZEN: lighting (after r3), grade (after r3)
ARTEFACTS REQUIRED: 4 stills (wide/close/low/wire) + flaw list + score + diff
REJECT IF: flaws < 3, or score == 10 with zero flaws, or no wireframe reviewed
EXIT ARTEFACT: out/qc/r{last}/ with the 4 stills, the flaw log, and the final render
```
