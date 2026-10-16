# Genjutsu — deep dive

*Higgsfield's reality-manipulation layer: transform part of a clip while the rest stays as filmed.*
Launched **2026-09-01** (model listing: **2026-09-17**). Three operations in one family.

## 1. The three operations

| Op | Contract | Presets | Notes |
|---|---|---|---|
| **Motion Transfer** | Reference video's **motion** → your characters / products / clothes | 30+ presets, or a one-line description | "acting, lip sync, camera movement, and VFX" held consistent |
| **Object Swap** | Replace **exactly what you describe**; the rest of the frame untouched | 30+ presets | Locked lighting, lens grain, scene physics |
| **Restyle** | Redraw the entire clip in a new style (anime, claymation, comic) **keeping the original motion** | style presets | Full-frame look change, motion preserved |

## 2. Input / output contract

```text
VIDEO IN       4–30 s   (Higgsfield's API listing also documents 1–30 s)
IMAGES IN      up to 30 reference photos (characters, products, clothing)
PROMPT         optional — presets can do the whole job
OUTPUT         480p / 720p / 1080p
PRICE          $0.159 /s (50% off launch) … $0.816 /s depending on resolution/tier
API ID         higgsfield/genjutsu/motion-transfer/v1.0
               higgsfield/genjutsu/object-swap/v1.0
```

> **Docs typo to guard against:** the published playground snippet uses the namespace `higgsfiled/...` (missing a `g`). Enumerate `tools/list` / the model index at runtime; never paste an ID from a docs page straight into production.

## 3. Why it is technically different from generic vid2vid

| Problem with naive vid2vid | Genjutsu's stated behaviour |
|---|---|
| Ask for a jacket change, get a barrel roll, Victorian London, extra knuckles | **Object Swap** isolates the target and locks the rest |
| Camera drifts, framing is re-hallucinated | **Motion Transfer** preserves camera trajectory, cut timing and framing frame-for-frame |
| Re-generating the whole scene loses the performance | Acting, lip sync and VFX are held consistent with the source |

Functionally: **automated tracking + rotoscoping + inpainting bundled into one workflow**, plus an aesthetic decoupling that lets you keep the cinematography and change the cast.

## 4. Where it belongs in a real pipeline

| Use | Verdict |
|---|---|
| Client approves blocking from a reference clip → recast with **their** product / talent wardrobe **before booking a stage** | ✅ This is the killer app |
| Previs / animatic / pitch packages with real brand assets | ✅ |
| Localisation variants (same performance, different product/person) at volume | ✅ |
| Finishing a hero shot against 4K principal photography from a 1080p output | ❌ Not yet — the resolution and detail gap disqualifies it |
| Anything involving a public figure or non-consented likeness | ⛔ Never (see the atlas §6) |

## 5. Repo recipe

```text
1. Reference clip (owned/licensed), 4–30 s, motion you want to keep
2. Up to 30 reference images of the replacement cast/product/wardrobe
3. Run Motion Transfer at 1080p (720p is the cost/quality knee)
4. Land the plate in the repo:
      - if it stays a plate → grain match + LUT (nleTrackEngine.tsx grade stage)
      - if it composites → cut against Remotion CG, match the grade to live action
5. QC: 4-shot protocol (wide/close/low/wire) + seam gate on any cut built on top
```

## 6. QC checklist before you accept a Genjutsu output

- [ ] Camera trajectory matches the reference (overlay the two motion paths)
- [ ] Hands, teeth, jewellery, logos intact — these are the classic swap artefacts
- [ ] No identity drift across the clip (frame 1 vs frame last)
- [ ] Grain/noise profile uniform (a swapped region often has different noise)
- [ ] Wardrobe/product colour is brand-accurate (sample hexes, do not eyeball)
- [ ] Any remaining 1080p softness is deliberate (upscale with **Precise** mode, not **Creative**, when matching a plate)
- [ ] Consent/release on file for every reference image of a person

## 7. Sources

`higgsfield.ai/blog/higgsfield-genjutsu` (2026-08-31) · `higgsfield.ai/creator-hub/changelog` (2026-10-15) ·
`thepostflow.com/ai/higgsfield-ai-review/` (2026-10-14) · `open.higgsfield.ai/models/workflows/genjutsu/playground` ·
`higgsfield.ai/higgsfield-api` (2026-09-20) · Reddit r/generativeAI Genjutsu threads (2026-09) for the "tracking + roto + inpainting" framing.
