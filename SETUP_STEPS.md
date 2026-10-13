# Video toolchain — HyperFrames + Remotion

> **Read this first.** This sandbox only persists files under `/home/user`. apt packages,
> npm globals and `~/.cache` downloads are **wiped between sessions** — so "keeping the
> tools installed" can't survive on its own. The durable equivalent is the setup script:
>
> ```bash
> bash /home/user/setup-toolchain.sh          # rebuilds BOTH engines, ~35s cold
> source /home/user/hf-env.sh                 # then load the env
> ```
>
> | engine | author in | use for | status |
> |---|---|---|---|
> | **HyperFrames** | HTML + CSS + GSAP | cinematic scene-based compositions | ✅ verified |
> | **Remotion** | React / TypeScript | data-driven video, batch renders | ✅ verified |
>
> Shared: `toolkit/fonts/` (14 fonts), `toolkit/vendor/gsap.min.js`, one Chrome binary,
> one ffmpeg. Full detail: `remotion/README.md`, `servant/README.md`, `showreel/README.md`.

---

# HyperFrames — install, run, and edit AI videos

**Status: done and verified in this workspace.** A 42-second AI video was edited
end-to-end (transcript → timed graphic overlays → rendered MP4) to prove the pipeline works.

- **Edited result:** `videos/edit-test/renders/edit-v2.mp4` (42.0s, 1920×1080, H.264 + AAC narration)
- **Smoke test:** `videos/edit-test/renders/smoke.mp4` render (3s, animated title + lower third)

---

## 1. What this repo actually is

`heygen-com/hyperframes` is **not** an AI video *generator*. It's an open-source
**HTML → deterministic MP4 render engine** ("Write HTML. Render video. Built for agents.").
Local rendering is free and doesn't use HeyGen credits.

**So "editing AI videos" with it means:** you bring a video (e.g. a HeyGen avatar clip,
a talking-head recording, a generated scene), and HyperFrames is the **edit + compositing
layer** on top — timed graphic cards, kinetic titles, lower-thirds, data callouts, quotes,
PiP, captions, color grades, recuts. AI-video output goes *in*; a finished, packaged MP4
comes *out*.

The relevant workflow skill is **`talking-head-recut`** — "package an existing
talking-head / interview / podcast video with timed, designed graphic overlay cards synced
to the transcript; the clip plays untouched underneath."

---

## 2. Steps taken (environment)

| # | Step | Command / result |
|---|------|------------------|
| 1 | Clone the repo | `git clone https://github.com/heygen-com/hyperframes.git` |
| 2 | **Node ≥ 22** (sandbox had 20) | Node 22.20.0 → `/opt/hfnode` |
| 3 | **ffmpeg / ffprobe** (missing) | `sudo apt-get install -y ffmpeg` → 7.1.5 |
| 4 | Toolchain (repo uses Bun) | Bun 1.2.22 → `~/.bun/bin` |
| 5 | Install CLI | `npm i -g hyperframes` → **v0.8.137** = same version as this checkout |
| 6 | **Chrome Headless Shell** (required to render) | `hyperframes browser ensure` → 113.9 MB |
| 7 | Chrome's shared libs (Debian 13 is bare) | `sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2` |
| 8 | **ASR engine** (transcription) | `hyperframes models install parakeet` → Parakeet TDT 0.6B v3 (639 MB) |
| 9 | Verify | `hyperframes doctor` → ffmpeg ✓ Chrome ✓ disk ✓ |

### Sandbox constraints found and worked around

- **2 CPUs / 1.9 GB RAM / no swap.** `bun run build` (the full 14-package monorepo build)
  will **not** finish here — it thrashed for 30 min and had to be killed. That's why the
  published CLI (identical version) is used instead of a source build. On a normal machine
  `bun install && bun run build` is the source path.
- **`/tmp` is only ~0.7 GB** and the renderer refuses to run below its free-space guard.
  Fixed by redirecting caches and temp work to the workspace disk — see `hf-env.sh`:
  ```bash
  export HYPERFRAMES_EXTRACT_CACHE_DIR=/home/user/hf-cache/extract
  export PUPPETEER_CACHE_DIR=/home/user/hf-cache/chrome   # keeps Chrome persisted
  export TMPDIR=/home/user/hf-cache/tmp
  ```
- **Low memory warning** is expected; renders succeed but slowly (~2 min for 42s at 1080p).

---

## 3. The editing workflow (what to run)

Always start a session with: `source /home/user/hf-env.sh` (puts Node 22 + bun on PATH and
sets the cache/temp paths).

```bash
# 1. Scaffold a project from the AI video you want to edit
hyperframes init my-edit -v /path/to/ai-video.mp4 --non-interactive

# 2. Probe it (duration / width / height / fps) and extract audio
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate \
  -show_entries format=duration -of json /path/to/ai-video.mp4 > my-edit/metadata.json
ffmpeg -y -i /path/to/ai-video.mp4 -vn -acodec libmp3lame -q:a 2 my-edit/audio.mp3

# 3. Transcribe to WORD-LEVEL timestamps (local, no API key)
hyperframes transcribe my-edit/audio.mp3 -d my-edit --json
#    → my-edit/transcript.json  [{ "text": "...", "start": 1.90, "end": 2.22 }, ...]
#    (clamp the last word's `end` to the real duration — Whisper/Parakeet overshoot)

# 4. Edit index.html: place the video as the base track, then add overlay cards.
#    Each element is a "clip" with data-start / data-duration / data-track-index,
#    animated with GSAP in window.__timelines["main"], synced to transcript timings.

# 5. Lint → preview → render
hyperframes lint                                  # catches real bugs (see below)
hyperframes preview                               # studio in the browser
hyperframes render -o renders/out.mp4 -f 24 -q draft   # or -q looks / delivery
```

### Composition anatomy

```html
<video src="ai-video.mp4" class="clip" playsinline data-has-audio="true"
       data-start="0" data-duration="42" data-track-index="0" ...></video>

<div id="lower-third" class="clip" data-start="20.5" data-duration="4.6"
     data-track-index="2">…</div>          <!-- track 2 = on top -->

<script>
  const tl = gsap.timeline({ paused: true });
  tl.fromTo("#lower-third", { opacity: 0, x: -70 },
            { opacity: 1, x: 0, duration: 0.5 }, 20.5);   // 3rd arg = absolute time
  window.__timelines["main"] = tl;                        // required handshake
  tl.seek(0);
</script>
```

### Two gotchas that cost real time

1. **Never put a CSS `transform` on an element GSAP animates.** The linter caught this in
   my first pass: `transform: translateY(-50%)` centering gets wiped the moment GSAP writes
   a transform, which silently un-centers the card. Fix: `tl.set(el, { yPercent: -50 })`.
2. **Overlay text color must be footage-independent.** White text vanished over the light
   screencast sample. Fix: add a dimming scrim layer (own `clip` + timeline) behind text,
   plus a bottom gradient. Both variants are in the render history (`edit.mp4` = before,
   `edit-v2.mp4` = after) so the difference is visible.

---

## 4. What was produced here

| File | What it is |
|------|-----------|
| `videos/edit-test/renders/edit-v2.mp4` | **The edit** — 42s, 1080p, narration intact, 3 overlay cards keyed to the transcript |
| `videos/edit-test/renders/edit.mp4` | First pass (weaker text contrast over light footage) |
| `videos/edit-test/index.html` | The editable composition — change timings/text here and re-render |
| `videos/edit-test/transcript.json` | 77 word-level timestamps that drive the card timings |
| `videos/edit-test/overlay-check2.png` | 4-frame contact sheet verifying overlay placement |
| `videos/smoke-test/renders/smoke.mp4` | 3s pipeline smoke test (animated title + lower third) |
| `assets/sample-narrated.mp4` | The 42s source clip used (public HyperFrames showcase video) |
| `hf-env.sh` | Environment file — `source` it at the start of every session |

The three overlay cards landed on the beat of the narration:
`One sentence. One link.` (1.6–6.5s) · `You own: Scenes · Media · Timing` (20.5–25.1s)
· `10 seconds. from one sentence` (36.6–42s).

---

## 5. Rebuilding this environment from scratch

The heavy caches (Chrome 261 MB, Parakeet 639 MB, the 1.6 GB `node_modules`) are *not* kept
in the workspace — they'd crowd out the snapshot budget for your actual videos. They rebuild
in well under a minute:

```bash
curl -fsSL -o /tmp/node22.tar.xz https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.xz
sudo mkdir -p /opt/hfnode && sudo tar -xf /tmp/node22.tar.xz -C /opt/hfnode --strip-components=1
export PATH="/opt/hfnode/bin:$PATH"
sudo apt-get install -y ffmpeg libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2
npm i -g hyperframes && hyperframes browser ensure && hyperframes models install parakeet
hyperframes doctor          # expect all ✓ except Docker and the low-memory warning
```

For the **source** install on a machine with ≥8 GB RAM:
`git clone … && bun install && bun run build` (or `bun run dev` for the Studio).

For **agent-driven** creation, the repo ships 21 skills; install the core set with
`npx hyperframes skills update`, then prompt:
*"Using /hyperframes, package this clip: [path] with timed graphic overlays."*

---

## 6. Honest notes

- **The published CLI was used, not a local source build.** The checkout is byte-identical
  in version (0.8.137); the source build is what a 2-core/2 GB box can't finish. On real
  hardware use the source build.
- **Render cost here:** ~3s of video ≈ 10s of render; 42s ≈ 2 min, software GPU, single
  worker. A GPU machine is dramatically faster.
- **Transcription is local and free** (Parakeet/Whisper) — no API key. Optional extras
  (TTS via Kokoro, MusicGen, Docker/cloud rendering) were intentionally skipped as they're
  either memory-prohibitive here or not needed for editing.
- **Editing is deterministic and repeatable** — an edit is just HTML + a timeline. No
  frame-by-frame manual work, and edits are diffable in git.
