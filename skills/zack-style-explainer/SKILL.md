---
name: zack-style-explainer
description: Build a Zack-D-Films-style 3D explainer Short (9:16, 40-60 s) from one curious fact — hook in under 2 s, tension build, one clean payoff — using AI-generated "Blender look" frames, a calm ominous narrator, a procedural tension bed, word-by-word captions, giant stat callouts and the Higgsfield DoP camera rig in Remotion. Trigger on "Zack D Films style", "3D explainer short", "what happens if / why does X" fact videos. Offline-first; no cloud model API needed at render time.
---

# Zack-Style Explainer Short

A format study of the viral 3D-fact Shorts genre (Zack D. Films and its many
clones), implemented as a **data-driven Remotion composition** in this repo:
`remotion/src/zack-window/ZackWindowShort.tsx` (reference build: *"The tiny hole
in airplane windows"*, composition id `ZackWindow-Short`).

> **Front door:** the Remotion engine (`remotion/`). This skill owns the *format
> doctrine* and the *asset pipeline*; the camera, caption, grade and grain
> primitives come from `remotion/src/engine/` (see `higgsfield-camera-dop`,
> `captions-overlay`, `nle-video-editor-pro`).

## 1. The format, decoded (what actually makes it work)

| Beat | Rule | Reference timing |
|---|---|---|
| **Hook** | First sentence states the *object* and the *stakes*. "There's a tiny hole in it. And it's keeping you alive." No intro, no name, no "today we". | 0.0–2.0 s |
| **Headline** | Giant uppercase title at the top, one key word in yellow, drop-in spring, gone by ~3.5 s. | 0.2–3.5 s |
| **Tension** | Each sentence raises the number or the danger: altitude → pressure → force → failure. | 3–45 s |
| **Callouts** | 2–3 giant stat cards max (`1,000+ lbs`, `3 LAYERS`, `"BLEED HOLE"`), each with an impact hit. Scarce = valuable. | on the spoken word |
| **Scare beat** | Exactly one: riser (2.2 s) → hard cut → camera jolt → red alarm pulse. | ~70 % through |
| **Payoff** | Resolve to calm: warm light, slow dolly, the fact restated as a payoff line. Fade to black. Never a CTA. | last 6–8 s |

**Voice:** masculine, calm, slightly ominous, brisk (~2.7 words/s). Same voice on
every episode — the voice *is* the channel identity.
**Sound:** low drone (55/110 Hz detuned sines + 14 s LFO swell) with a soft
heartbeat every 1.15 s; whoosh on every hard cut; impact on headline/callouts.
**Captions:** 2–3 word cards, uppercase Inter 900, white with a 15 px black
stroke, active word yellow and 10 % larger; emphasis words stay yellow after
they are spoken. Sit at ~75 % of frame height (above the Shorts UI zone).
**Camera:** every plate moves. Use the DoP rig at *reduced* intensity for 2D
plates — `push-to-glass` 0.11, `crash-zoom` 0.26, `orbit-360` 0.34,
`crane-up` 0.55, `dolly-zoom` 0.32, `handheld-cinema` 1.25 — on top of a
slow Ken-Burns drift (1.00 → 1.085) and a 4 % cut punch that settles in 6 frames.
**Grade:** `teal-orange-cinema` for drama, `clean-studio` for diagrams,
`editorial-film` + red multiply for the scare beat, `cyber-neon` for macro/tech.
**Finish:** radial vignette, 3 % grain, thin yellow progress bar, 10-frame fade-in,
18-frame fade-out.

## 2. Writing the script (do this before touching any tool)

1. One fact → 8 sentences → 8 plates. Target 140–160 words (≈55 s).
2. Sentence 1 = hook (object + stakes). Sentence 8 = payoff (restate the fact as
   the reason something good happens).
3. Put a concrete number in at least two sentences; those become the callouts.
4. Mark the single scare sentence (`shake: true`) and the words to emphasise.
5. Fact-check every number against a primary source before narrating it.

## 3. Pipeline (sandbox-safe, no cloud model API at render time)

```bash
# 0. assets live under remotion/public/zack-window/{img,vo,sfx}
#    img/s1..s8.png  - one plate per sentence (AI image tool; prompt recipe below)
#    vo/c1..c8.wav   - one TTS clip per sentence (same voice every episode)

cd remotion
python3 scripts/zack-window/build-timeline.py   # WAV durations + RMS silence gate -> word timings -> src/zack-window/timeline.json
python3 scripts/zack-window/synth-audio.py      # deterministic tension bed, whoosh, impact, riser (stdlib DSP, no numpy)
npx tsc --noEmit                                 # type-check
npx remotion still  src/index.ts ZackWindow-Short out/f90.png --frame=90   # eyeball a hook frame
npx remotion render src/index.ts ZackWindow-Short out/zack-window-short.mp4 --crf=20
```

**Word timings without an ASR:** the sandbox cannot reach HuggingFace/OpenAI, so
`build-timeline.py` distributes each clip's words across its *voiced span*
(20 ms RMS gate, 6 % of peak) weighted by a syllable proxy
(`0.55 + 0.45·syllables + 0.02·chars`, +0.45 after punctuation). With one clip per
sentence the drift stays well under one word. If Parakeet/whisper.cpp is
available (`hyperframes transcribe`), swap the token list for real timestamps —
the composition only reads `timeline.json`.

**No Chrome download possible?** Use `@sparticuz/chromium` from npm:
`node scripts/chrome-path.cjs` extracts the binary + shared libs to `/tmp`, and
`scripts/chrome-wrapper.sh` adds the sandbox flags. Then pass
`--browser-executable=$PWD/scripts/chrome-wrapper.sh` to `remotion render`.

## 4. Plate prompt recipe (image model)

> Vertical 9:16 portrait composition. Blender-style semi-realistic 3D render in
> the look of viral YouTube Shorts explainer animations. **[subject + action]**.
> **[lighting: warm cabin / cold rim / red emergency]**, cinematic, shallow depth
> of field, clean slightly stylized 3D characters, no text, no watermark.

- Keep *one* recurring character description across plates ("young man, short
  dark hair, grey hoodie") so the cast feels consistent.
- Diagrams (exploded views, cross-sections) read best on a dark studio background
  with a single warm rim light.
- Never put text in the plate — captions and callouts are rendered live.

## 5. Swapping the episode

Edit `SCENES` in `scripts/zack-window/build-timeline.py` (text, image, camera,
grade, emphasis, callout, shake), drop new `img/` and `vo/` files, re-run the
two scripts, render. `ZackWindowShort.tsx` never needs to change for a new fact;
copy it only when you want a different *format*.

## 6. Quality gate before publishing

- [ ] Hook sentence finishes before 2.5 s; headline gone by 3.6 s
- [ ] ≤ 3 callouts, each on its spoken word, each with an impact
- [ ] Exactly one scare beat; riser starts ≥ 2 s before it
- [ ] No plate shows its edges during `orbit-360` / `crane-up` (over-scan 1.14)
- [ ] Captions never overlap the headline or a callout
- [ ] Narration peaks ≥ 12 dB above the bed; bed never silent
- [ ] Every number in the script is sourced
