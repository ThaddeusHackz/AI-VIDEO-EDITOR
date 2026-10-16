# FILM.md — *Claude Opus 5.5 vs. GPT Astra 6.1 Sol: The Singularity Engine*

> *The Genesis of Hyper-Motion.* 30.000 s · 60 fps · 1800 frames · 1920×1080 master + 1080×1920 companion.
> This file is the approved director's treatment and the contract for the build (`opus-gpt-director` Gate 1,
> `opus-js-animations` / `gpt-js-animations` step 5). The machine-readable twin is
> [`remotion/src/singularity/timeline.json`](../../remotion/src/singularity/timeline.json). Picture, sound and the
> HyperFrames plate all read that one file. Change data there, not here.

## 0. Decisions locked with the client (clarifying round)

| Question | Answer | Consequence in the build |
|---|---|---|
| Brief conflict (A: Opus = cyan / B: Opus = amber) | **Merge** | Brief B palette + title, Brief A Act I–IV structure + VO timestamps, Brief B set-pieces woven into the matching acts, everything on a **100 BPM** grid. |
| Graphic density | **High-octane cinematic** | 3–6 simultaneous motion systems per frame, particle counts in the thousands, constant camera travel, bloom/aberration grade. Every frame must pass the motion-variance gate. |
| Captions | **Cinematic embed** | No subtitle rail. Each VO phrase is designed kinetic type inside the shot on its measured word timestamps; at most one hero embed per beat (`captions-overlay`, Cinematic mode). |
| Audio mix | **Trailer mix, VO-forward** | Score ducked 8–10 dB under every phrase (0.25 s attack / 0.6 s release, `nle-video-editor-pro`), sub impacts on exact 60 fps cut frames, master −16 LUFS / ≤ −1 dBTP. |
| Voice treatment | **Heavy vigilante** | voice-00 → Praat PSOLA (pitch shifted to a ≈92 Hz median, formants ×0.88, range ×0.8, ~8 % slower) → gravel saturation + fry/rasp layer + sub-octave chest double → close-mic proximity EQ → dark short room. |
| Deliverables | **16:9 + 9:16, both 60 fps** | One component tree, `isPortrait` adaptive layout (`youtube-opus-gpt-benchmarks` archetype 5). |

## 1. Logline and the one central image

Two intelligence architectures, one warm and organic (**Claude Opus 5.5**, amber) and one crystalline and solar
(**GPT Astra 6.1 Sol**, cosmic cyan), meet in a light-absorbing void. They don't fight. They out-build each other
until they fuse into one emblem.
**Central image:** an amber line and a cyan ring intersecting in 3D. Everything in the film either dives *into* that
intersection or eventually collapses back *onto* it (the infinity-weave lockup is the same intersection, resolved).

**Viewer takeaway:** *motion is now authored as code, and these two engines write it together.*

## 2. Look and tokens

| Token | Value | Use |
|---|---|---|
| Void | `#040407` | Opaque stage ground on every `AbsoluteFill` (`seam-craft` white-flash guard) |
| Opus amber / cream / ember | `#D97757` / `#F5F2EB` / `#FF9A5C` | Organic type, silk ribbons, the line, warm key light |
| Astra cyan / deep / ice | `#00F0FF` / `#0B0F19` / `#BFFCFF` | Prisms, vector rays, 10 k particle lattice, cool rim light |
| Chrome / obsidian / slate | `#C9D1D9` / `#0A0B10` / `#14161D` | Monolith, reflections, the slate floor |

**Typography is a duel, and the brief bans default AI all-caps centre-gradients.**
- Opus speaks in **Cormorant Garamond** (humanist serif, mixed case, italic for voice), always set asymmetrically.
- Astra speaks in **Space Grotesk** (geometric grotesk, mixed case).
- Code is **JetBrains Mono**. UI micro-labels use **Inter**.

All fonts load from `toolkit/fonts` (mirrored in `remotion/public/fonts`), with zero CDN at render time. No gradient-filled
display type anywhere: fills are solid, and light comes from strokes, glows and the scene.

**Grade:** `CinemaStudio4Stage` (Contre-jour lighting, Clean Sharp lens) plus a custom bloom/halation pass. The grain is a
*static* baked texture (no animated grain, per `opus-js-animations/references/delivery.md`). Static dither ≤ 4/255 against
banding on the dark gradients.

## 3. Sound

All synthesized in Python (numpy/scipy/pedalboard/parselmouth) from the same `timeline.json`. Every hit lands on an
integer 60 fps frame.

| Window | Content |
|---|---|
| 0.0–3.3 s | Industrial sub-drop (80→28 Hz), two distant modal metal clangs, a deep resonant breath before the first word, 50 Hz electrical hum + harmonics, the razor *slice* and string *snap*. |
| 3.3–12.6 s | Ticking clock pulse on 8th notes (0.3 s), accented on beats. Crisp digital UI clicks on every letter-lock and origami fold. Glass shatter on the word "glass". Spatial riser 9.0→13.2 s. |
| 12.6–22.2 s | D-minor cello ensemble + synth-brass swell (Dm → B♭ → Gm → A), kinetic whooshes and impacts locked to cut frames 792 / 972 / 1080 / 1224, electric-arc crackle under the split-screen. |
| 22.2–30.0 s | Resolution to D major (Picardy third), quiet rain/ambience tail, the 28.2 s snap-cut sub-pulse decaying to silence, a crisp digital pulse-out at 29.4 s. |

**VO (voice-00 + Batman chain).** Twelve phrases from five takes. Each phrase is placed so its first voiced
sample lands on a half-beat:

| Phrase | Onset | Text | Treatment |
|---|---|---|---|
| L1a / L1b | 1.8 / 4.2 s | "They said motion was hand-drawn…" / "locked behind glass and time." | deep, slow, gravelly rasp |
| L2a / L2b | 6.6 / 8.4 s | "Then came Opus…" / "coding the geometry of thought in real time." | metallic resonance (comb + plate) |
| L3a / L3b | 11.4 / 13.2 s | "And Astra…" / "burning through the void with solar logic." | low growling cadence (more fry) |
| L4a / L4b / L4c | 16.2 / 17.4 / 18.9 s | "Two titans." / "Not to destroy…" / "but to build what eyes have never witnessed." | intense proximity bass |
| L5a / L5b / L5c | 22.2 / 24.0 / 26.7 s | "Look closer." / "The canvas is dead." / "Long live the code." | final slow, lingering drop (longer tail) |

## 4. Beat map (60 fps · 1 beat = 36 f = 0.6 s)

| Frames | Time | Shot | What we see | Camera (DoP) | Sound |
|---|---|---|---|---|---|
| 0–17 | 0.00–0.30 | S1 void-slice | Microscopic glass pane in the dark: scratches catch light, dust motes drift in true 3D | push-to-glass (macro) | hum fade-in, sub-drop starts |
| 18–107 | 0.30–1.80 | S1 | **Amber razor line** slices left→right and *snaps* taut. It is a plucked string: a closed-form damped standing wave | push-to-glass | slice, string snap, clang 1 |
| 108–215 | 1.80–3.60 | S2 solar-ring | **Cyan vector ring** ignites at centre, springs open, tilts in true 3D and intersects the line (Three.js + bloom). Kinetic type: *"They said motion was hand-drawn…"*, with "hand-drawn" literally pen-stroked | true 3D orbit | breath → L1a, clang 2, ticks from 3.3 s |
| 216–359 | 3.60–6.00 | S3 macro-dive | **Zoom-through** into the intersection. **HyperFrames plate:** TS/GLSL code assembles from glyph-pixel particles and compiles into SVG shapes. A glass pane locks the code ("locked behind glass and time."), then **shatters on "glass"** into 3D ASCII + neon vector shards | zoom-through → crash-zoom | dive whoosh, compile clicks, glass shatter, tick accent on "time" |
| 360–539 | 6.00–9.00 | S4 opus-manifest | Cut-the-curve LEFT. **"Claude Opus 5.5"** assembles letter-by-letter out of liquid-amber typographic waves (per-letter closed-form 3D springs). Glassmorphic **origami panels** fold out in a 3D coordinate grid. L2b types as code, with "geometry of thought" as the hero embed | rack-focus + crane-up | impact, L2a, UI clicks on every fold |
| 540–791 | 9.00–13.20 | S5 silk-ribbons | Orbital **whip-pan**. Silk ribbons woven from vector math cascade over a slate floor that receives their shadows. At 11.4 s cyan prisms intrude from the right, and **"GPT Astra 6.1 Sol"** crystallizes out of hard-edged light-prisms | whip-pan + fpv-drone | whoosh, riser, L3a |
| 792–971 | 13.20–16.20 | S6 solar-surge | **Scale-burst.** Astra shatters the sequence: a radiant wave of **10,000 nodes** reorganizes into a macro-architectural machine wireframe (torus-knot core, rings, spokes), then a flowing topographic map. *"burning through the void with solar logic"* burns in | crash-zoom + orbit-360 | impact-shatter, swell begins, whooshes |
| 972–1079 | 16.20–18.00 | S7 split-collision | **Vertical split-screen.** Opus code (left) locks horns with Astra solar vectors (right). The seam shoves on every beat, with electric arcs across it. "Two" / "titans." collide | handheld-cinema + impact shake | impact, arc crackle, L4a/L4b |
| 1080–1223 | 18.00–20.40 | S8 glyph-dive | **Infinite Z-zoom inside a floating "&" glyph** (Droste recursion). Layer 1: volumetric data ribbons. Layer 2: a code storm compiling into glass sculptures. Layer 3: Escher loops re-architecting on every beat. "never witnessed" is the hero embed | push-to-glass (infinite) | dive whoosh, beat snaps, L4c |
| 1224–1583 | 20.40–26.40 | S9 monolith | **Rise.** Type and geometry liquefy into a chrome/obsidian **monolith** bearing the joint badge. Push-in on *"Look closer."* At 24.0 s a **360° orbit** begins, with volumetric light shafts and dust. *"The canvas is dead."* disintegrates. **Stillness comma 1554–1583:** the dust hangs (bullet-time) | crane-up → dolly-zoom → orbit-360 → bullet-time | impact-rise, D-major resolution, rain, L5a/L5b |
| 1584–1691 | 26.40–28.20 | S10 lockup | **Inverse zoom-through (arrival).** Every stream and shard snaps like an elastic band into a centred isometric **infinity-weave dual emblem**. *"Long live the code."* | snap-zoom back | snap, L5c |
| 1692–1799 | 28.20–30.00 | S11 signature | **Snap-cut to black.** Only a dual-core signature remains: two cores (amber + cyan) on a lemniscate whose glow follows the decaying sub-bass. Crisp pulse-out at 29.4 s | static | sub-pulse decay, digital pulse |

## 5. Seams: the Vector Ledger (`motion-doctrine`)

The film's current is **Z-forward**: we keep pushing deeper into one thought. Reserved vectors are spent on meaning:
- LEFT is a neutral "next beat" (cuts 360 and 972, plus the whip-pan at 540).
- Scale-burst means leaving a world (792).
- Upward means elevation: the monolith rises (1224).
- Z-backward means **arrival**: the lockup lands (1584).
- The final snap to black (1692) is the one reserved *stillness* cut.

Implementation: `remotion/src/engine/seamTransitions.ts` (`zoomThroughSeam`, `cutTheCurveSeam`), driven per cut from
`timeline.json`. The ledger is [`ledger.json`](ledger.json). The HyperFrames plate carries its own lint-clean
`ledger.json`, verified by `scripts/seam-gate.mjs`.

## 6. Engines and the repo assets they use

| Layer | Engine | Repo assets |
|---|---|---|
| Master compositor, 2D/2.5D motion systems | **Remotion** `Composition`/`useCurrentFrame`/`useVideoConfig` | `engine/cameraRig` (mulberry32, `project3DPoint`, `useCameraRig`/`CameraRigContainer`), `engine/seamTransitions`, `engine/vfxShaders` (AnamorphicFlare, VolumetricGodrays, ParticleField3D, ShatterDebris3D, CyberHUDTracker), `engine/cinemaStudio4` (CinemaStudio4Stage, PlasmaLightningCGI, PortalVortexCGI), `engine/higgsfieldEffectsMix` (Turning Metal + Thunder God, Disintegration), `engine/nleTrackEngine` (WordCaptionToken, LUT grade, AudioWaveformBar), `engine/threeSceneStudio` (createTorusKnotMesh) |
| True 3D (ring × line, monolith orbit) | **Remotion + `@remotion/three`** + `postprocessing` bloom | the `zack-window` deterministic ThreeCanvas/EffectComposer pattern |
| Code-genesis plate (S3) | **HyperFrames** (HTML + GSAP, `window.__timelines`) | `toolkit/vendor/gsap.min.js`, `camera-dop.js` (HFCameraDoP), `vfx-cgi-suite.js` (HFVfxSuite), `registry/blocks/code-particle-assemble` + `code-typing` (adapted to Canvas2D + closed-form springs), `hyperframes lint` + seam gate |
| Physics | own closed-form module | `remotion/src/singularity/physics/springs.ts`: analytic damped harmonic oscillator (under/critical/over-damped), plucked-string modes, spring easing for GSAP |
| Sound | Python | numpy · scipy · pedalboard · praat-parselmouth · pyloudnorm |
| QA + assembly | Python + FFmpeg | `qa/score_frames.py` (per-frame 1–10 score), contact sheets, `render/studio_render.sh` |

Deliberately unused: `characterRig2D` (no characters in this brief) and REA (there's no reference clip to reverse-engineer).

## 7. QA protocol: the self-critique loop

1. `tsc --noEmit`, `remotion compositions`, `hyperframes lint` (0/0), the HyperFrames seam gate, and the Remotion seam check on `ledger.json`.
2. Stills at every shot boundary ±6 f plus hero beats → contact sheets → visual review (by me) per shot, scored on clarity, typographic hierarchy and motion fluidity.
3. Full 1800-frame image-sequence render → `score_frames.py` scores **every frame 1–10**:
   - density: edge energy, palette coverage, entropy;
   - clarity: RMS contrast, highlight clipping, shadow crush;
   - motion fluidity: inter-frame flow magnitude, variance, dead-frame and flash-frame detection.

   The machine score is combined with the shot's visual review score.
4. Any frame scoring < 8 is fixed at the design level, and its range is re-rendered and re-scored, until every frame is ≥ 8.
5. FFmpeg assembles the image sequence and the −16 LUFS mix into `output_master_30s.mp4` and `output_vertical_30s.mp4`. Settings: H.264 High, CRF 17 capped, yuv420p, BT.709 tags, AAC 320 k. A full-decode check and an ffprobe frame count follow.

## 8. Risks

- **Software WebGL (SwiftShader) on 2 cores.** Three.js is used only in S2 and S9. Bloom runs at half resolution and dpr is 1.
- **No forced aligner offline.** Word timings come from Praat syllable-nucleus detection mapped onto syllable counts, so they're accurate to about ±40 ms.
- **I can't listen to the mix.** Loudness, true peak, ducking depth and the spectrum are verified numerically; I make no claim to have heard it.

## 9. Build log: decisions taken during production

| # | Finding | Decision |
|---|---|---|
| 1 | The voice-00 takes read "Two titans." at 185–270 Hz and "Look closer." at 190–245 Hz. That is real emphasis, not pitch-tracker octave errors. | Recorded calmer alternates (`alt_L4a_1`, `alt_L5a_1`, `alt_L5c_1`) and kept the lowest, cleanest reads. All 12 phrases now sit in a 76–104 Hz median band. |
| 2 | Praat's PSOLA "Change gender" draws internal random numbers, so the VO wasn't reproducible. | Seeded per phrase (`random_initializeWithSeedUnsafelyButPredictably`). The VO now rebuilds **bit-identically**. |
| 3 | pedalboard's JUCE `Limiter` adds make-up gain, which fought loudness normalisation (−11.9 LUFS). | Wrote a 4×-oversampled look-ahead true-peak limiter. The master lands at **−16.0 LUFS / −3.3 dBTP**, so no limiting was needed. |
| 4 | `toolkit/fonts` are Latin-1 subsets (~230 glyphs), so ✓ ∩ φ ζ → ∞ ▌ render as boxes. | All on-screen copy is Latin-1. Symbols (infinity, carets, checks) are drawn as geometry. |
| 5 | The HyperFrames plate's JetBrains Mono 700 was never loaded, because no DOM text used it. | Force-loaded the face, and the glyph targets are built lazily once fonts are ready. Lint 0/0, seam gate PASS. |
| 6 | Inside `<ThreeCanvas>`, `useCurrentFrame()` is shot-local. | The 3D scenes convert to absolute frames before evaluating springs and cameras. |
| 7 | The engine's `VolumetricGodrays` (18 CSS-blurred divs) cost ~1.25 s per frame under software rendering. | Added an opt-in `softEdges` prop to the engine (radial-gradient rays, no filter). Merged the bloom, tone-map and vignette passes. S9 went from 3.75 to 2.5 s per frame. |
| 8 | `HiggsfieldEffectsMix` hard-coded lime bolts and ash. | Added a backward-compatible `accentColors` prop to the engine. Thunder God and Disintegration now use the brand palette. |
| 9 | A lit PBR floor seen at grazing angles mirrors the studio environment (Schlick Fresnel → 1) and reads grey. | Unlit obsidian floor plus an additive light pool. The mirrored monolith reads through it. |
| 10 | Frames 0–29 scored ~3/10: nearly dead frames under the "no dead frames" constraint. | Brief B's macro push *through* the glass: 340 micro-scratches stream past the camera in true 3D. The frame stays pitch-black but alive. |
| 11 | S1→S2 had no ledger row. | Added a **match-cut**: S2's camera opens dead-on, so the 3D line lands exactly on S1's 2D line (the carrier). The Remotion seam gate now covers 10 cuts, with 0 fail and 0 warn. |
| 12 | The terrain phase (0.6 s) was too short to read. | The topography phase now starts at f918 (0.9 s) with stronger relief and wider contour bands. |
