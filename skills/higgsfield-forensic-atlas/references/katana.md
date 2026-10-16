# Katana — deep dive

*Higgsfield's edit-rebuild skill for Claude. Powered by **Claude Motion**. Released **2026-10-08**.*
Katana is **not a generator**: it copies the **structure** of an edit you already like (cuts, pacing, framing, effects) and fills it with your subjects.

## 1. Contract

| You give | Katana returns |
|---|---|
| A **reference edit**: your own video **or** a preset from the Katana library (**3–30 s**) | A new video following the reference's **shot structure, pacing and overall edit** |
| Up to **5 images** of characters / products / clothing | Your subjects placed into those shots |
| Optional change instructions (Prompt toggle) | A finished short-form edit — **in the Claude chat and in Higgsfield Assets** |

Preset families: **Aura Farming** · **Motion** · **Clipping**.
Engine credit on the page: **"Claude Motion"**.
Runs on Higgsfield models, on **the same account and the same credits** as higgsfield.ai.

## 2. Publishing community presets

```text
3–30 s video   → supplies the MOTION
up to 40 images → the reference set
a prompt that mentions the images with @
published presets go live immediately; removable after reports
```

## 3. Iteration semantics (the underrated part)

- Corrections apply to **the edit that already exists** — each revision continues from the previous result rather than restarting.
- A second version with a different character or product is **one more message in the same conversation**.
- Higgsfield's own test: ask Claude to change a shot / swap a photo / adjust a detail → **only the affected shots were regenerated**.

**Consequence for producers:** "colour-variant + localisation + A/B" work becomes chat turns, not re-renders. Budget in *messages*, not *runs*.

## 4. Where Katana fits vs Genjutsu

| | Genjutsu | Katana |
|---|---|---|
| Unit of work | One shot / one clip | A whole **edit** |
| Input | Video + up to 30 images | Reference edit + up to 5 images |
| Operation | Motion transfer, object swap, restyle | Format transfer (structure, pacing, cuts) |
| Output | A transformed clip | A finished short-form edit |
| Same chat / same Assets? | **Yes** — a Genjutsu clip can become a Katana reference, and vice versa | **Yes** |

## 5. Repo recipe — format transfer without losing numbers

```text
1. Reference edit must be owned or licensed (Higgsfield's own instruction).
2. Run Katana in Claude → collect the edit + the shot list you infer from it.
3. Rebuild the same format deterministically in this repo:
       HyperFrames:  node scripts/seam-stamp.mjs --ledger ledger.json --write index.html
                     node scripts/seam-gate.mjs verify --ledger ledger.json --project <dir>
       Remotion:     author <Sequence> blocks per shot; render with npx remotion render
4. Why rebuild instead of shipping the Katana output directly:
       - deterministic re-render at any resolution / fps
       - caption, LUT, mix and loudness control (-16 LUFS house standard)
       - seam compliance enforced numerically
   Ship the Katana edit when speed matters; ship the repo rebuild when the cut must be defensible.
```

## 6. QC checklist

- [ ] Cut count and order match the reference (count them, do not trust the eye)
- [ ] Pacing: per-shot durations within ±2 frames of the reference
- [ ] Framing: subject headroom/sightline preserved (format transfer often shifts these)
- [ ] On-screen text legibility after the rebuild (safe areas for 9:16)
- [ ] Only affected shots changed between revisions — if everything changed, the iteration contract broke
- [ ] Reference permissions recorded
- [ ] Music/audio rights for a rebuilt edit (format transfer does **not** transfer audio rights)

## 7. Sources

`higgsfield.ai/blog/higgsfield-katana` (2026-10-12) · `higgsfield.ai/creator-hub/changelog` (2026-10-15) ·
`thepostflow.com/ai/higgsfield-ai-review/` (2026-10-14) · `higgsfieldkatana.com` (2026-10-14) ·
`x.com/higgsfield` launch coverage (2026-10-08).
