# AI Video Editor Playbook — Remotion + HyperFrames

**Research snapshot:** 9 October 2026  
**Purpose:** a reusable production standard for future motion-graphics edits in this workspace.

> **What “improve yourself” can mean here:** this playbook makes future work more disciplined and reusable when an assistant reads it. It does not change model weights or permanently retrain an assistant. Claude Opus 5.5 is a coding/agent model in this workflow; Remotion or HyperFrames, the browser, and FFmpeg turn authored code into rendered video. The visual result comes from creative direction, supplied assets, implementation, and repeated review—not from a model secretly drawing an MP4 by itself.

## 1. The working model

Think of an AI video edit as a small production, not a one-shot prompt:

1. **Direct:** define the viewer, message, emotional arc, and one memorable visual idea.
2. **Design:** choose a visual system, map beats to time, lock exact copy, and decide the sound.
3. **Build:** write frame-addressable compositions in the best-fit engine.
4. **Review:** inspect real frames and the complete playback; fix concrete defects.
5. **Deliver:** render, decode-test, verify audio/text/aspect ratios, and package only the requested files.

A “dynamic” video is not one where every object wiggles. Every movement must direct attention, carry continuity, show a meaningful change, or express the brand’s character. If it does none of those, remove it.

## 2. Choose the engine for the job

| Use | Best fit | Why |
|---|---|---|
| Kinetic typography, layered HTML/CSS/SVG, fast scene authoring, overlays on footage, editorial clips | **HyperFrames** | HTML composition plus seekable GSAP; useful for cinematic, scene-based work and edits built around real footage. |
| Reusable React components, data-driven variants, intricate component logic, multiple renders from one template | **Remotion** | React/TypeScript compositions with frame-based animation and reusable props. |
| Real 3D geometry, lighting, and an actual moving camera | **Three.js through HyperFrames’ frame adapter**, or the appropriate Remotion 3D path | CSS perspective can fake depth but is not a lit 3D camera. Use a real 3D runtime when the shot depends on orbiting, occlusion, or lighting. |
| A supplied designed character animation | Preserve the supplied Lottie or source animation when it fits | Rebuilding a finished animation from scratch usually loses fidelity. |

Use **one primary renderer per piece** unless there is a concrete reason to combine them. Both engines in the retained toolchain are capable; using both on every job adds complexity and re-encoding without automatically improving the edit. If combining, define which engine owns each layer and keep one clear master timeline.

The current retained workspace has `/home/user/remotion/`, shared fonts and GSAP in `/home/user/toolkit/`, and HyperFrames user/registry state in `/home/user/.hyperframes/`. Before production, inspect the actual project and current CLI docs; do not assume an old generated project, skill, package, or asset still exists. This runtime may need rehydration with `/home/user/setup-toolchain.sh` and `/home/user/hf-env.sh`.

## 3. Intake before animation

Confirm or inspect these inputs before building:

- **Purpose and viewer:** what should the audience know, feel, or do after watching?
- **Destination:** platform, aspect ratio(s), resolution, frame rate, safe areas, and target duration.
- **Story and CTA:** the single most important claim, proof, and exact call to action.
- **Truth sources:** official product pages, supplied script, approved claims, names, dates, prices, metrics, and spelling. Never invent a testimonial, statistic, product feature, or endorsement.
- **Brand system:** logo, palette, fonts, UI screenshots, photography/footage, preferred references, and explicitly banned looks.
- **Audio:** supplied or generated narration, exact script, preferred voice/delivery, music, SFX, captions, and any licensing limits.
- **Deliverables:** master(s), captions/subtitles, poster/thumbnail, editable project, and source archive—only what is requested.

List and probe the supplied assets. Check that paths really exist; inspect image dimensions and video/audio metadata; listen to the actual audio; and note source/licence constraints. If a file is missing, ask or state the limitation—never quietly replace it with a made-up asset. Keep an asset manifest with path, role, provenance, and whether it is approved for reuse.

Ask a clarification only when a missing decision would materially change the result. Otherwise state a small number of reasonable assumptions and proceed.

## 4. Creative direction that feels authored

### A. Write the concept before the shot list

Create:

- **Logline:** one sentence describing the video’s idea and payoff.
- **Viewer takeaway:** the one thing that must survive a distracted mobile watch.
- **Visual metaphor/motif:** one visual idea that can evolve across beats (a line that becomes a route, waveform, chart, or reveal; a product object that travels through a real space; a repeated shape that changes meaning).
- **Motion identity:** how this brand moves—calm/editorial, precise/mechanical, playful/elastic, urgent/kinetic, etc.
- **Hero moment:** one exaggerated reveal or visual payoff, earned by the story. Keep surrounding beats cleaner so the hero moment has contrast.

### B. Lock a compact design system

Specify a background/material, one primary accent plus at most one supporting accent, a display face and a highly readable text face, and a consistent lighting/texture rule. Use supplied brand assets faithfully. Prefer real product UI and actual logos over invented lookalikes. If organic illustration or photography matters, use an approved image asset; code-drawn primitives are best for deliberate graphic styles, not for pretending to be a photograph.

### C. Beat-map the whole runtime

For every beat, define:

1. **Time range** in seconds and frames.
2. **Focal element** and the viewer’s intended takeaway.
3. **Supporting elements** and when each arrives.
4. **Exact copy** in quotation marks, including line breaks and punctuation.
5. **Motion and camera**: direction, distance, duration, easing, overlap, and the reason for the move.
6. **Transition seam**: what carries the viewer into the next beat (shared shape, camera travel, match cut, sound phrase, or a deliberately chosen cut).
7. **Audio cue** and caption timing, if any.

Check that beat durations add up to the requested runtime. Describe the ending and any final tail explicitly; otherwise unused seconds often become an accidental frozen hold. A short motion graphic should stay short rather than stretching one idea to fill time. A longer product film needs an arc, energy variation, and more than a stack of unrelated title cards.

### D. Use a prompt spec, not “go all out” as the production brief

HyperFrames’ useful prompt skeleton is: **route → duration/resolution → time-coded beats → exact quoted copy → named technique/registry block → explicit negatives**. Inside each beat, describe **element, motion, layout, style, timing**. Name a technique when the default could choose the wrong implementation; a registry block is a starting pattern, so replace any demo copy/UI with approved material.

Example pattern:

```text
Using /hyperframes, create a 24-second 1080x1920 vertical product film at 30fps.
Audience: ...  Goal: ...  CTA: "..."
Look: ...  Motion identity: ...  Persistent motif: ...

0:00–0:03 HOOK — [focal element, action, exact copy, composition, sound cue]
0:03–0:08 PROBLEM — [...]
0:08–0:17 PROOF / FEATURES — [...]
0:17–0:21 HERO REVEAL — [...]
0:21–0:24 CTA / END — [...]

Exact on-screen copy: "...". Do not paraphrase it.
Audio: [voice/delivery or no narration; music level and whether it ducks under VO; specific SFX cues].
Use [named block/runtime] for [specific technique], adapted to the supplied assets.
Negatives: no invented metrics, no fake UI, no generic glitch on every cut, no unlicensed stock,
no network-dependent assets at render time, no dead frozen tail.
Workflow: make a beat map and representative stills first, then build, lint/check, preview,
inspect frames and full playback, make targeted fixes, and render the final master.
```

Treat a one-line “make an incredible showreel” prompt as an **ideation seed**, not a reliable final spec. It grants the agent control over story, pace, palette, copy, and sound; those guesses may be entertaining but wrong for a real brand or factual brief.

## 5. Motion-design rules worth carrying forward

Use these as a toolkit, not a mechanical checklist:

- **Motivated movement:** every move has a job. A route draws in its travel direction; a process assembles; a count ticks; a result lands. Don’t add amplitude to cure a scene whose idea is unclear.
- **Hierarchy and density:** keep one obvious focal element, at least two supporting details when the scene needs richness, and a recurring piece of visual “chrome” or motif where it helps continuity. Compose asymmetrically when appropriate. Do not fill the screen merely to avoid negative space.
- **Overlap:** start secondary actions while the focal move is settling. Stagger supports; do not make every entrance begin and finish on the same frame. A focal element should not wait behind its decorations.
- **Easing with intent:** entrances generally decelerate into place; exits can accelerate away; on-screen travel can ease both ends. Overshoot is for objects with physical mass—not for a factual counter, price, or metric that must never pass its true value.
- **Camera and continuity:** a camera move should reveal or connect something. Use match cuts, a shared prop, persistent graphic chrome, a moving camera through a coherent space, or audio continuity to connect scenes. “No hard cuts” alone does not prevent slideshow pacing.
- **Depth:** use meaningful foreground, middle, and background planes with different parallax rates. One foreground occlusion crossing the focal subject often proves depth better than piling on blur and glow.
- **Energy contrast:** alternate kinetic passages with controlled breaths. A deliberate dwell can let a key message land; during it, the camera may rest while a relevant counter, cursor, light, or texture continues subtly. Don’t confuse a purposeful pause with a dead render hold.
- **One signature spectacle:** reserve the biggest shatter, portal, 3D orbit, particle burst, flash, or sound hit for the beat that earns it. Use a coherent primary transition grammar and a restrained accent, rather than applying every effect to every seam.
- **Reproducible imperfection:** grain, jitter, hand-drawn drift, and particle layouts must be seeded or otherwise derived from the frame. Handmade should not mean different output on every render.
- **Readability:** keep critical copy within platform-safe regions, use real contrast over the actual background, and review at phone size. Don’t sacrifice the product, CTA, captions, or factual labels to decorative motion.

The practical test: finish the sentence **“this moves because…”** for each noticeable movement. If the explanation is only “the frame looked empty,” remove or redesign it.

## 6. Engineering contract

### Remotion

- Treat each composition as a function of a frame. Use `useCurrentFrame()` and `useVideoConfig()`; derive motion with `interpolate()` and `spring()` or another frame-based function.
- Every frame must be reproducible and safe to render out of order and in parallel. Avoid `Date.now()`, `requestAnimationFrame`, timers, state that advances from prior frames, and unseeded randomness. Do not rely on CSS transitions or browser playback time for key motion.
- Use Remotion media/image APIs and explicit asset-loading gates (`delayRender` / `continueRender` where needed). Load fonts before capturing frames. Keep render-time assets local and deterministic.
- Keep scene components modular and timings in frames. Verify duration, composition ID, dimensions, and frame rate from the actual project config—not assumptions.

### HyperFrames

- Let HyperFrames own clip visibility/timing and media playback. Use the documented `data-start`, `data-duration`, and `data-track-index` contract; keep overlapping clips on separate tracks where required.
- For GSAP, create a **paused, finite, seekable timeline** synchronously and register it under the exact composition ID. Use explicit absolute positions / `fromTo` states so seeking any frame produces the same visual state.
- Never rely on wall-clock time, `requestAnimationFrame`, live network fetches, order-dependent mutations, or unseeded `Math.random()` at render time. Preload assets and lock output dimensions, fps, and duration.
- Use the official frame adapter for actual Three.js scenes. CSS 3D is a visual trick, not an interchangeable replacement for real depth, lighting, or camera choreography.
- Do not ship a registry block’s example/demo content by accident. Replace it with approved copy, brand assets, and actual product UI.

### Audio and captions

- If narration is used, the narration is the clock: confirm its final take first, obtain or verify word timings, then align captions and reveals to the spoken cues. A new voice take needs new timings.
- Specify delivery, music mood, and relative level. Keep music beneath the voice; use SFX only at intentional events. Avoid unspecified “add music” prompts that produce a full-volume track.
- Verify the mix by listening to the rendered file—not only by inspecting the timeline. Check clipping, abrupt cuts, silence, and voice intelligibility on ordinary speakers/headphones.

## 7. Production gates: prove it before the full render

### Gate 0 — Environment and project

- Source `/home/user/hf-env.sh` when needed; check Node, HyperFrames, Remotion, Chrome, FFmpeg, and disk space.
- Inspect `package.json`, project entry point, composition IDs, assets, and the currently installed tool versions. Re-read current official docs/skills if an API or CLI changed.
- In Remotion, list compositions and run TypeScript checks before a long render. In HyperFrames, run `lint` and the current CLI’s runtime/check command.

### Gate 1 — Direction

- Save a brief, style guide, asset manifest, script/source notes, and beat map in the active project folder.
- Check facts and quoted copy. Confirm the runtime sums correctly and that the CTA is present.
- Show or inspect key stills before committing to all animation. For a complex piece, test a representative scene and the hardest transition first.

### Gate 2 — Animatic and design

- Assemble a timing-first draft with the real narration/music or clearly marked placeholders.
- Render representative stills at the opening, every major reveal, both sides of important transitions, caption-heavy moments, and the end card.
- Review composition, text size, contrast, crop/safe areas, visual continuity, and whether the hero moment earns its emphasis.
- Build up a complex scene one layer at a time: subject/motion, then camera, then background, then polish. If it misfires, strip back to the simplest working version and add complexity again deliberately.

### Gate 3 — Iteration

- Preview and inspect the rendered frames, not just source code or a clean linter report. Automated checks catch structural/runtime issues; they cannot decide whether the film is compelling.
- Change **one variable per iteration**. Give an absolute target (“headline is 12% wider, keep the crop and camera unchanged”), not a vague “make it pop.” Freeze what already works.
- Watch the complete draft with audio. Notes should name exact timecodes and visible problems.

### Gate 4 — Final QC

- Run the engine’s lint/check or type checks and fix all errors and relevant warnings.
- Render the final MP4 at the requested fps, dimensions, and quality; use high quality only after the draft passes.
- Probe the output with `ffprobe`; verify duration, frame rate, resolution, codecs, audio streams, and expected orientation.
- Decode the entire MP4 with FFmpeg (not only the first frame). Listen to the full audio. Inspect final captions, names/numbers, CTA, logos, and all transitions.
- Review a contact sheet at native size and at phone-view size. For multiple aspect ratios, create and review intentional layout variants—do not assume a landscape crop is a finished vertical edit.
- Recheck final output paths and package only the deliverables requested.

Useful general checks:

```bash
ffprobe -v error -show_streams -show_format -of json final.mp4
ffmpeg -v error -i final.mp4 -f null -
```

## 8. Review scorecard

Rate each 1–10 on the finished video, not on intention:

| Dimension | Review question |
|---|---|
| Hook | Does the first second give the viewer a reason to continue? |
| Story | Can a first-time viewer explain the point and payoff? |
| Originality | Does it have a memorable visual idea rather than a stock template sequence? |
| Hierarchy | Is it always clear what to look at and read next? |
| Motion | Is movement motivated, layered, well-paced, and smooth? |
| Continuity | Do the scenes feel like one designed film rather than separate slides? |
| Readability | Is all essential copy readable on a phone and in safe areas? |
| Fidelity | Are brand elements and factual claims accurate? |
| Sound | Are VO, captions, music, and SFX synchronized and balanced? |
| Delivery | Does the final file match runtime, aspect ratio, codecs, and requested package? |

If any core category is below **8/10**, log the three biggest concrete issues and fix them one at a time before delivery. A perfect lint report is not an 8/10 visual review.

## 9. Reusable director prompt

Copy this into a future video-edit request and fill in the brackets:

```text
Act as my creative director, motion designer, editor, and render-QA engineer.
Use the existing project/toolchain if it fits; first inspect the files and tool versions.
Do not claim model weights have changed. Work autonomously through the production gates below.

OUTCOME
- Goal / audience: [ ... ]
- Destination and aspect ratio(s): [ ... ]
- Runtime / resolution / fps: [ ... ]
- Viewer takeaway: [ ... ]
- CTA (exact): "[ ... ]"
- Factual sources and approved claims: [ ... ]

INPUTS
- Footage / screenshots / logos / fonts: [paths and role]
- Narration: [provided script / create script / no narration]
- Music and SFX: [provided / request / none]
- Missing files or unconfirmed claims: identify these before inventing a substitute.

CREATIVE DIRECTION
- One-sentence concept: [ ... ]
- Visual metaphor / persistent motif: [ ... ]
- Palette, typography, texture, lighting: [ ... ]
- Motion identity and camera grammar: [ ... ]
- One earned spectacle moment: [ ... ]
- Banned looks / hard negatives: [ ... ]

BEAT MAP
[time range] — [focal element + exact copy + motion + camera + supporting cues + transition + audio]
[repeat through the full runtime; describe the ending/tail]

IMPLEMENTATION
- Preferred renderer: [HyperFrames / Remotion / choose best fit]
- Keep all time deterministic and frame-addressable. Preload local assets.
- Use real 3D only when the shot needs real depth, lighting, occlusion, or camera movement.
- Preserve supplied brand/product assets; do not invent facts or demo UI.

REVIEW GATES
1. Check inputs and environment; write the brief, asset manifest, style guide, and beat map.
2. Create representative stills/animatic and inspect before a full-resolution render.
3. Lint/check/type-check, preview, inspect important frames and watch the full draft with sound.
4. Make targeted one-variable corrections; keep what already works fixed.
5. Final render; ffprobe, full decode, audio/caption/CTA/aspect-ratio verification.

DELIVER
[exact requested paths/files; no unrequested folder cleanup or cloud-upload claims]
```

## 10. Primary references

Research basis and implementation references (check current docs before each new build):

- Anthropic, [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5) — model positioning and capabilities.
- HyperFrames: [prompting overview](https://hyperframes.heygen.com/prompting/overview), [one-shot prompt anatomy](https://hyperframes.heygen.com/prompting/anatomy), [motion grammar](https://hyperframes.heygen.com/prompting/motion), [high-fidelity visual specs](https://hyperframes.heygen.com/prompting/visual-specs), [iteration loop](https://hyperframes.heygen.com/prompting/iterating), [deterministic rendering](https://hyperframes.heygen.com/concepts/determinism), [real 3D and runtimes](https://hyperframes.heygen.com/prompting/runtimes-and-3d), [audio and captions](https://hyperframes.heygen.com/prompting/media-and-audio), [example prompts](https://hyperframes.heygen.com/prompting/examples).
- Remotion: [coding-agent workflow](https://www.remotion.dev/docs/ai/coding-agents), [agent skills](https://www.remotion.dev/docs/ai/skills), [frame-based animation](https://www.remotion.dev/docs/use-current-frame), [interpolation](https://www.remotion.dev/docs/interpolate), [spring animation](https://www.remotion.dev/docs/spring), and [render flicker/determinism guidance](https://www.remotion.dev/docs/flickering).

**Important distinction:** official docs establish the framework contracts; creator videos and prompt collections are useful inspiration but are not proof that a particular model or prompt will reproduce the same result on this machine.
