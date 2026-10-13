


# gpt-js-animations

**Direct and render carefully programmed JavaScript motion graphics with GPT, from a brief to a frame-exact MP4.**

Adapted from [klsoen/opus-js-animations](https://github.com/klsoen/opus-js-animations), originally built for Claude Opus. This fork ports the skill and orchestration to GPT/OpenAI while preserving the rendering architecture, visual effects, design references and review workflow. Original authorship and MIT copyright remain intact.

https://github.com/user-attachments/assets/9461c1af-d1cd-4ce0-8fbc-60a3681f9913

**READ SKILL.MD**

## Supported workflows

Use **GPT-6 Astra** or **GPT-6.1 Sol** in Codex with file editing, shell execution and image inspection. Other GPT agents can read `SKILL.md` and follow the same workflow when equivalent capabilities are available. A text-only chat cannot execute this pipeline or visually review its output by itself. The engine does not call a language model or require an OpenAI key; keys are only needed for optional API voiceovers.

Model availability depends on your account and host. See the [official GPT guide](https://developers.openai.com/api/docs/guides/latest-model) and [skill installation documentation](https://learn.chatgpt.com/docs/build-skills).

## Requirements

| Needed | Purpose |
|---|---|
| Node **≥22** | Native `fetch` and `WebSocket` for DevTools; no npm dependencies or package install |
| Google Chrome or Chromium | Headless frame capture; set `CHROME` to its executable if not found |
| ffmpeg **and ffprobe** on PATH | H.264/AAC encoding, decoding and audio analysis |
| Python 3 | Audio helpers |
| numpy (optional for basic analysis) | Audio contour, onset and tempo analysis |
| numpy, scipy, Pillow | Code-painted stills with `paint.py` |
| openai-whisper + numpy | Optional local speech alignment; model weights downloaded on first use |
| yt-dlp | Optional link downloads; `get_audio.py` installs/updates it when needed |
| ElevenLabs or OpenAI key | Optional text-to-speech |

Verify the core tools:

```sh
node --version
python3 --version
ffmpeg -version
ffprobe -version
export CHROME="/absolute/path/to/chrome"  # only if auto-detection fails
"$CHROME" --version                     # when CHROME is set
```

For optional Python tools, create a virtual environment in your working project:

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install numpy scipy Pillow
# For speech alignment only:
python3 -m pip install openai-whisper
```

## Install the skill

From this cloned fork's root, install a personal Codex skill:

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/gpt-js-animations "$HOME/.agents/skills/"
```

Or install it in the project where you will make films:

```sh
mkdir -p /path/to/video-project/.agents/skills
cp -R skills/gpt-js-animations /path/to/video-project/.agents/skills/
```

Use one installation scope to avoid duplicate skill entries. Restart Codex if discovery has not refreshed. In Codex CLI/IDE, select it with `/skills` or invoke `$gpt-js-animations`. This fork ships a portable skill with `agents/openai.yaml`, rather than a platform-specific plugin marketplace; the old plugin manifests have been removed. The skill's copy of `LICENSE` preserves attribution when installed on its own.

Example request:

> Use $gpt-js-animations to make a 20-second portrait reel from my audio at source/voice.wav. Use layered cut paper, warm gold and indigo, and readable captions. Present the treatment, then build, inspect and revise the frames, and render the final MP4.

For delegated creative direction:

> Use $gpt-js-animations to make a 20-second silent visualizer, 16:9. Choose the visual direction and complete the treatment, implementation, visual revisions and verified final render without waiting for further approval.

Long productions retain shared kits, scene modules, continuity review and audio cue sheets. Optional agent delegation uses the host's available orchestration when authorized; the same tasks can be completed sequentially. Browser rendering workers work in either mode.

## Deterministic pipeline

```text
GPT → treatment + animation code → seek(t) → Chromium → exact frames → ffmpeg → MP4
```

Each film exposes `window.__film = { duration, ready, seek, shots, marks }`. All visible state comes from explicit time and seeded data. Frame `i` is rendered at `seek(i / fps)`; rendering speed cannot drop frames or shift cues. Physics uses fixed-step replay or baked snapshots; the player merely calls the same seek function from its audio clock.

Canvas 2D with composited WebGL shaders is the default. The existing recipes include typography reveals, masks, clipping, transforms, blur, opacity, gradients, parallax, scene transitions, particles, flocks, tiled mosaics, reflections, painting, and optional three.js meshes and raymarched worlds. SVG/DOM artwork can be rasterized into the output canvas; these tools capture that canvas, not the whole browser viewport. Keep the engine model-independent.

Reproducibility assumes the same assets, loaded fonts, viewport/configuration, browser and rendering backend. Pin/vendor external libraries and fonts for offline reproducibility. The purity verifier samples repeated and out-of-order seeks; it is a useful check, not proof for all possible times or hardware.

## Create and inspect a film

From this repository root, a starter smoke test (20 seconds, silent):

```sh
SKILL="$PWD/skills/gpt-js-animations"
mkdir -p film
cp "$SKILL/assets/film-template.html" film/index.html
node "$SKILL/scripts/verify.mjs" film/index.html
node "$SKILL/scripts/verify.mjs" film/index.html --ss 2
node "$SKILL/scripts/stills.mjs" film/index.html --times 1,5,10,15,19 --sheet
node "$SKILL/scripts/stills.mjs" film/index.html --range 5.8:6.3:0.033333 --sheet
node "$SKILL/scripts/stills.mjs" film/index.html --times 5 --crop 100,500,880,400 --sheet
```

For an installed skill, set `SKILL="$HOME/.agents/skills/gpt-js-animations"` instead. Read the complete `SKILL.md` and relevant references. Replace the template's SCENE block and set duration/format to the treatment; the starter's placeholder captions and fade-up are demonstration content. Review contact sheets, transition strips and full-resolution crops with the agent's image viewer. Fix composition, text collisions, pacing, flashes and construction errors; re-render and compare affected times. Hashes cannot replace this step.

The audio routes remain: your file, a link via yt-dlp, procedural Web Audio, or ElevenLabs/OpenAI voiceover. Analyze recorded sound with `analyze_audio.py` and align speech with `align_audio.py`; use `embed_audio.py` for browser playback. Procedural sound exposes `__film.wav()` and is exported with `page_audio.mjs`. Keep picture and audio cues on one data timeline. Say whether the soundtrack was actually listened to.

## Render and verify the final video

```sh
node "$SKILL/scripts/render.mjs" film/index.html --fps 30 --workers 2 --ss 2 --out film/film.mp4
# With recorded/generated audio, add: --audio source/voice.wav
ffprobe -v error -count_frames \
  -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt,color_range,color_space,color_primaries,color_transfer:format=duration \
  -of json film/film.mp4
ffmpeg -v error -i film/film.mp4 -f null -
ffmpeg -v error -i film/film.mp4 -ss 5 -frames:v 1 film/decoded-5.png
```

Inspect the decoded frame and play/open the MP4 if playback is available. A full silent 20 s export at 30 fps has **600 video frames**. Audio muxing uses `-shortest`; a short audio file can truncate the video, so provide sound through the ending or approved silence padding. `--from`/`--to` use the original timeline, including the audio offset. Drafts can omit `--ss 2`; `--fast` uses lossy JPEG capture for previews. Final frames default to lossless PNG, H.264 CRF 16, BT.709/TV color and AAC audio when supplied.

The template preserves the upstream animated grain. For social uploads implement the `FILM_GRAIN` modes described in `references/delivery.md` and select `'none'` before rendering; setting a variable alone does not alter the starter. For a capped upload copy:

```sh
ffmpeg -i film/film.mp4 -c:v libx264 -preset slow -crf 17 -maxrate 20M -bufsize 40M \
  -profile:v high -pix_fmt yuv420p -color_range tv -colorspace bt709 \
  -color_primaries bt709 -color_trc bt709 -g 60 -c:a copy -movflags +faststart film/film-upload.mp4
```

Never substitute screen recording for exact frame export.

## Credentials and migration

Voiceover lookup order: `--key-file`, provider environment variable (`OPENAI_API_KEY` or `ELEVENLABS_API_KEY`), `~/.config/gpt-js-animations/keys.env`, then the legacy `~/.config/opus-js-animations/keys.env` as a **read-only compatibility fallback**. The new location wins when both files contain the requested key. Keep config files private (`chmod 600`); never commit or print keys. New projects use the GPT location.

The skill folder and name are now `gpt-js-animations`; update your installed skill and script paths. The public `__film` contract and rendering CLI are unchanged. Original model names in the worked-example titles and GIF captions are historical attribution, not execution requirements.

## Troubleshooting

- **Node missing / WebSocket undefined:** put Node ≥22 on PATH; an installed version may need your version manager activated.
- **No Chrome found:** set `CHROME` to the executable, including on Windows; a path containing spaces must be quoted. Windows users can also use WSL with its own Linux browser and ffmpeg.
- **Browser never starts:** run that executable headlessly and read its startup errors. Use a host where Chromium can launch under the required permissions. The tools expect a local DevTools endpoint.
- **Film never ready:** check page exceptions, font/asset loading, and `__film.ready`. Vendor fonts for offline work. Bundle three.js modules into an IIFE for `file://` (see `threejs.md`).
- **Purity failure:** remove random draws, mutable frame counters, incremental physics and implicit animation clocks from draw paths. Keep seeded identities and reconstruct state from time.
- **Slow WebGL / memory pressure:** check the reported GPU backend; reduce workers. Metal is selected on macOS. `--no-gpu` is available for diagnosis; software rendering may be much slower.
- **Supersampling rejected:** the film must honor `?ss=2` and allocate exactly twice the canvas dimensions. Check blurs and baked sprite sizes.
- **Sound missing / ending cut short:** embed audio for page playback, pass `--audio` for exports, and check actual durations with ffprobe.

More environment and design failures are documented in `references/pitfalls.md`. See [docs/PORT-VALIDATION.md](docs/PORT-VALIDATION.md) for regression results and limitations of this port.

## Contents and license

`skills/gpt-js-animations/` contains `SKILL.md`, Codex UI metadata, the original 13 design/effects references, all 11 rendering/audio/painting scripts, and both original assets. The original showcase GIFs remain in `docs/`.

MIT © klsoen. See [LICENSE](LICENSE); the original copyright notice is unchanged.
