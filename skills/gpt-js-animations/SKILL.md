---
name: gpt-js-animations
description: Direct, implement, inspect, and render deterministic JavaScript motion graphics as frame-exact videos. Use for animations, explainers, lyric or poem videos, visualizers, reels, generative art, code-painted stills, and revisions to these films.
---

# GPT JS Animations

You are both a motion designer/director and an implementation/rendering agent. Direct films made entirely in JavaScript, with intentional visual direction, typography, animation hierarchy, transitions, pacing and scene composition. The person brings an idea. You ask the questions a director asks, write a treatment they approve, and build a film where **every frame is `seek(t)`**: a pure function of time drawn into one canvas. That one rule makes the work inspectable (any moment can be checked exactly), revisable (retime data, not footage) and exportable with no dropped frames.

**Deliverables:** `film/index.html` (one self-contained page apart from web fonts and an embedded audio script), `film/FILM.md` (the approved treatment, the beat table and the decisions), and a verified MP4 for each format.

`<skill>` below means this skill's base directory (shown when the skill loads). The scripts need Node ≥ 22, ffmpeg and Google Chrome or Chromium. The audio tools need Python 3; `align_audio.py` also needs openai-whisper, and numpy helps `analyze_audio.py`. Code-painted stills with `paint.py` need numpy, scipy and Pillow. The Node renderer has no npm dependencies; `get_audio.py` fetches yt-dlp when a link is used.

## GPT execution environment

Use GPT-6 Astra or GPT-6.1 Sol in Codex, or another GPT agent with equivalent capabilities. The renderer is model-independent: never put model calls in `seek(t)` or rendering scripts.

Use the available capabilities to inspect and edit files, execute shell commands and Node/Python scripts, run Chromium and ffmpeg, and open rendered images for visual review. Resolve `<skill>` to the directory containing this `SKILL.md`; run commands with absolute, quoted paths when needed. Keep outputs in the user's project. If a tool is unavailable, use an equivalent local command or explain the missing capability. An image-capable environment is needed for the visual review; hashes alone cannot judge composition.

Use the environment's supported question interface for missing creative choices, or concise numbered options in chat. Do not depend on a particular tool name. For long-running renders use supported background execution and poll completion; inspect exit status and output before continuing.

## Before a single frame: five conversations

Work in this order. A ✋ step waits for the person's answer when the choice is unresolved and has not been delegated.
- Ask only for unresolved choices: a few short options, your recommendation first. Follow the question interface’s limits.
- Skip any question the brief already answers, and say what you assumed.
- Present a treatment before building. If the user already authorized end-to-end work or delegated creative choices ("just make it"), record your assumptions and proceed; otherwise wait for approval of unresolved direction. Do not request the same authorization again.

`references/directing.md` has the question bank, the audio report and the treatment template.

### 1. The brief: listen
Let them describe the film. Reflect it back in two or three lines:
- subject, feeling and audience;
- platform and formats, and length;
- text on screen;
- anything to avoid;
- the reference clip, if any.

If they gave a reference clip, measure it now (`directing.md` §1). Don't pitch visuals yet.

### 2. ✋ Sound: where does the audio come from?
Ask one question with these options, plus "silent" for a loop or a GIF:

| Option | What you do next | Reference |
|---|---|---|
| **Their own file** (a voice, song or music) | Use it exactly as given; cut only on zero crossings. | `audio.md` §2 |
| **A link** (YouTube or any site yt-dlp supports) | Ask which section, then run `get_audio.py "<url>" --from … --to … --video`. It installs yt-dlp and updates it on failure. | `audio.md` §2 |
| **Generate it in JavaScript** | Synthesise a score, ambience and sound effects with Web Audio from the film's own timeline, rendered offline for export. | `audio.md` §5 |
| **A voiceover from their TTS key** (ElevenLabs or OpenAI) | Get the script (theirs, or one you draft for approval), the language, voice and pace. `voiceover.py` voices it line by line with timings. | `audio.md` §8 |

Never echo an API key and never write one into the project. `audio.md` §8 has the safe way to hold it.

### 3. Understand the sound
Study the audio before asking anything else:
```bash
python3 <skill>/scripts/analyze_audio.py source/source.wav         # length, loudness, pauses, sections, onsets, tempo + a spectrogram to read
python3 <skill>/scripts/align_audio.py source/source.wav --lang en   # a voice: its words and breath points in time
```
Read the spectrogram image. For lyrics, poems and quotations, fetch the canonical text and verify it (`references/quoted-text.md`).

Then tell the person **what the audio contains** in a few lines (`directing.md` §3):
- what is said or played;
- its structure and turns;
- the key words or hits;
- tempo and mood;
- the length;
- any flaw in the recording.

Distinguish actual listening from signal analysis and transcription. If playback/listening is unavailable, title the report "Audio analysis" and identify inferred mood or instrumentation; never claim to have heard it.

### 4. ✋ Direction: the questions a director asks
Ask what the brief and the sound leave open, at most four at a time (`directing.md` §4):
- **Look:** two or three fitting styles from `references/styles.md`, each described in a line, or "you choose".
- **Pacing and structure:** one continuous scene, a few movements, or cuts on the beat; calm or energetic.
  Recommend by length: under ~30 s is one scene whose state changes on each phrase.
- **2D or 3D:** 2D (Canvas 2D with shaders: the default, and the quickest to perfect), a raymarched 3D look, or real 3D meshes with three.js.
- **The points to land:** the one or two ideas a muted viewer must get, and which words or hits carry them.
- **As needed:**
  - formats (9:16, 16:9, 1:1);
  - text on screen (original, translation, captions or none);
  - characters and any limits on how people are shown;
  - the hook;
  - the ending.

### 5. ✋ The director's treatment
Write the treatment from the template in `directing.md` §5 and save it as `film/FILM.md`. It covers:
- the logline;
- the one central image;
- look and palette;
- sound;
- the structure timed to the audio;
- scene by scene: what we see, what changes on each beat, camera, light, text and sound;
- the hook and the ending;
- formats;
- risks.

Present it and **wait for their go when direction remains unresolved**. Existing end-to-end authorization or a supplied approved treatment is sufficient to proceed. Save that authorization and the treatment in `FILM.md`; it is the contract for the build.

## Then make it

### Pick the scale
- **Solo** (up to ~90 s, one piece, a reel, a lyric or poem video): the steps below.
- **Production** (minutes long, several scenes, dialogue, or the person wants many agents): `references/production.md`. Steps 6–9 apply to each part.
- **Still** (a painting, poster, thumbnail or cover): `references/painting.md` and `scripts/paint.py`. Keep the review step.

**Scenes scale with length.** Under ~30 s: one scene, one continuous take. ~30–60 s: one to three movements, ideally on one set. Minutes: production.

**2D by default**: Canvas 2D, with WebGL shaders composited in for skies, light and glow. Reach for three.js or raymarched 3D only when 3D was chosen in step 4.

### 6. Build from the template
```bash
mkdir -p film
cp <skill>/assets/film-template.html film/index.html
python3 <skill>/scripts/embed_audio.py source/voice.mp3 film/audio.js        # when there is audio
```
The template has:
- the contract (`window.__film = { duration, ready, seek, shots, marks }`);
- eased keyframes (`keyed`, `env`) and seeded randomness;
- balanced-wrap text with a rise-and-focus reveal;
- a grade (vignette, frame-keyed grain) and fades;
- an audio-clocked player.

Replace its SCENE block. Rules:
- **Data drives both picture and sound.** The timeline (phrases, cues, keyframes) is data; picture and sound both read it.
- **No hidden state in draw paths.** No `Math.random()` or frame counters there; pre-render sprites and text once.
- **Physics replays deterministically.** Each shot resets from seeded state and steps at a fixed dt up to the frame; `draw` never writes simulation state (`styles.md` §2).
- **Skies, space, terrain:** WebGL recipes in `shaders.md`, composited into the 2D canvas. **Many moving elements:** WebGL2 instancing in closed form (`tiles-and-flocks.md`).
- **Figures:** a part-based skeleton with a rim light (`design.md` §6).
- **3D, only when chosen:** three.js vendored at a pinned version, rendered synchronously inside `seek(t)` (`threejs.md`).
- **Text in the safe zone.** Size it for the platform (`design.md` §1, §7). A channel handle stays faint inside the picture and becomes a front-and-centre end card (`assets/watermark.js`, `design.md` §7).
- **Hardest shot first.** Build it and look at it before filling the timeline.

### 7. Inspect: look, don't assume
```bash
node <skill>/scripts/verify.mjs film/index.html                                  # seek(t) is pure
node <skill>/scripts/stills.mjs film/index.html --every 1 --sheet                # a contact sheet of the whole film
node <skill>/scripts/stills.mjs film/index.html --range 13.4:14.3:0.1 --sheet    # a moment, frame by frame
node <skill>/scripts/stills.mjs film/index.html --times 12.9 --crop 250,800,560,760 --sheet   # a 1:1 detail
```
Read every sheet. Check that:
- text never collides with moving things and sits in the safe zone;
- there are no flash frames;
- figures read at 1:1;
- nothing blows out;
- the frame isn't crowded;
- every beat of the treatment lands on its word.

Fix, re-render those times and compare. Say plainly whether you listened to the soundtrack (you usually can't).

### 8. Render
```bash
node <skill>/scripts/render.mjs film/index.html --fps 30 --audio source/voice.wav --out film/film.mp4 --workers 4 --ss 2
ffmpeg -i film/film.mp4 -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M -profile:v high -pix_fmt yuv420p \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -g 60 -c:a copy -movflags +faststart film/film-upload.mp4
```
- **Crisp after the platform's re-encode** (`references/delivery.md`):
  - Frames are captured losslessly and tagged as standard HD colour (BT.709, TV range).
  - The upload is rendered with **no animated grain** (implement and honor `window.FILM_GRAIN = 'none'` in the film’s grain pass; the starter uses animated grain). In testing, animated grain cost more than a third of
    the quality that survives Instagram.
  - The final render is **supersampled** (`--ss 2`): drawn at 2× and scaled down with Lanczos, four samples per pixel. It needs a film that
    reads `?ss=` (the template does; `delivery.md` §3 lists what baked sprites and shaders need). Check with `verify.mjs --ss 2`.
    Draft renders can skip it; it doubles the render time.
- **Frame-exact:** every frame is `seek(i/fps)`, encoded as H.264 CRF 16 with AAC.
- **Generated sound:** a film that makes its own sound exposes `__film.wav()`. Pull it with `page_audio.mjs` and pass it as `--audio`.
- **Several formats:** make one `film.js` feed thin HTML shells (`index.html` for 9:16, `x.html` for 16:9), and render each.
- **Never screen-record.** Real-time capture drops frames.

### 9. Deliver
Verify the actual encoded MP4 with ffprobe (dimensions, fps, video frame count, duration, audio stream when expected, BT.709/TV tags), decode representative frames with ffmpeg, and inspect them for encoding artifacts. For a full render with sufficient audio, expect `ceil(duration * fps)` frames; section exports start at `round(from * fps)` and end before `ceil(to * fps)`. `--audio` uses `-shortest`, so shorter audio can truncate video: extend with approved silence for intentional end holds. Play/open the MP4 when the environment supports it; otherwise verify full decoding and state that playback or listening was unavailable.

Share the MP4s and summarise:
- what the film does, beat by beat;
- what was verified (purity, frame count, text accuracy);
- what wasn't (for example, the mix not listened to).

For social media, offer a caption (translation, reference, credit, hashtags) and the upload checklist in `delivery.md` §4: the "Upload at highest quality" setting, a lossless transfer to the phone, and no in-app edits.

## Revising
First passes draw perceptual notes ("more detail", "the text is too subtle", "let the pieces stay visible").
- Treat each note as a design change, not a parameter tweak.
- Re-read `FILM.md`, change the data or the design, and re-inspect the moments it touches.
- Keep the previous render for comparison.
- Note what the person taught you in `FILM.md`.

Lessons from real revisions are in `design.md` §8. Environment gotchas are in `pitfalls.md`.

## References by subject
| Subject | Reference |
|---|---|
| the five conversations: question bank, audio report, treatment template | `directing.md` |
| choosing a look: the style menu | `styles.md` |
| sky, sun, stars, planets, galaxies, dunes, landscapes | `shaders.md` |
| lakes and reflections, mountains, forests, mist (raymarched: a 3D look) | `shaders.md` §14–16 |
| figures or images made of many elements (tiles, particles, birds, letters) | `tiles-and-flocks.md` |
| painted looks, a named painter's style, sketch → paint reveals | `painting.md` |
| pieces that gather or scatter; a two-way saying as one split scene | `styles.md` §3, `tiles-and-flocks.md`; in 3D `threejs.md` §11 |
| real 3D meshes, rigged figures, GLTF, depth of field (when 3D is chosen) | `threejs.md` |
| characters, camera, composition, text on screen | `design.md` |
| getting, generating, voicing, aligning and mixing sound | `audio.md` |
| quotations, poems and lyrics: verifying exact text | `quoted-text.md` |
| finished films and what their revisions taught | `examples.md` |
| crisp delivery: why some uploads look sharp, the export, the upload checklist | `delivery.md` |
| long productions, optional delegation and solo fallback | `production.md` |
| environment gotchas | `pitfalls.md` |
