# DAVID — withdrawn stylized 3D experiment

**Status: rejected and withdrawn. No replacement film has been rendered.**

This was the initially approved low-poly adaptation, not the Unreal/MetaHuman production described in the adjacent blueprint. It renders actual animated 3D geometry into an MP4, not an animatic dashboard or a sequence of storyboard stills.

- **3840 × 2160**, horizontal, **60 fps**, **180 seconds / 10,800 frames**.
- 36 five-second shots, following the blueprint's five-act chronology.
- Procedural adult-proportioned warriors, articulated IK limbs, individual faces, cloth panels, shields, swords, spear, chariot, ruins, terrain and an instanced 300-soldier formation.
- Seeded dust, rain, sparks, falling fragments, wet ground, lightning and a golden ending.
- An original synthesized stereo score and event-aligned combat/weather foley; no commercial music or speech recordings.
- Exact final wording: **VALOR: THE CHRONICLES OF DAVID**. The last 12 frames are black.

## Honest scope

The user explicitly accepted code-animated, non-photorealistic characters and combat after the available tools and assets were checked. The resulting art direction is faceted, low-poly 3D. This is **not Unreal, MetaHuman, motion capture, ray tracing, a full rigid-body collision simulation or a PS5 benchmark**. The original choreography is adapted into procedural poses and effects; the render does not certify every hand, blade or foot contact as physically solved. The camera arrangement is adapted for these new assets instead of claiming to execute the UE camera importer. Rendering uses native-resolution rasterization, not an upscale from 1080p.

The renderer projects real 3D vertices, clips against the near plane, calculates per-face illumination, depth-sorts polygons and applies atmospheric attenuation. It uses an explicit environment/character compositing boundary to keep large ground polygons from painting over feet. It is a lightweight painter renderer, not a production depth-buffer engine; complex intersecting geometry can still exhibit sorting limitations. No full-frame blur is used to hide geometry or motion.

## Build

From the repository root:

```bash
./bin/ai-video setup
cd examples/david-chronicles-of-valor/film
npm ci
python3 -m venv .venv
.venv/bin/pip install -r requirements-render.txt
npm test
npm run qa
npm run render
npm run verify
cd ../../..
./bin/ai-video verify
```

Node 22 or newer is recommended. `vendor` and `fonts` link to the repository's local toolkit. No CDN, external runtime asset fetch, API key, speech service or browser installation is required.

The renderer uses the full FFmpeg installed by `imageio-ffmpeg`; the repository's minimal compositor binary does not necessarily include rawvideo input. `FFMPEG=/absolute/path/to/full/ffmpeg` overrides this selection. Verification also needs `ffprobe` on PATH (`FFPROBE` can override it).

### Commands

```bash
npm run stills                  # 36 shot-midpoint PNGs at 1920×1080 for review
node render.mjs stills 732 1026 4650 8460 10680
npm run audio                   # regenerate the original 180-second stereo WAV
npm run qa                      # deterministic low-resolution coverage checks
npm run render                  # native 4K master; resumes matching completed chunks
node render.mjs film --draft     # optional 1080p export, not the 4K deliverable
npm run verify                  # final 4K MP4 probe, full decode and delivery checks
```

For a native-4K still, import `renderStill(frame, 3840, 2160)` from `render.mjs`.

Output lives in ignored `out/`:

| File | Purpose |
|---|---|
| `david-chronicles-of-valor-stylized-4k60.mp4` | Final H.264/yuv420p MP4, high profile, level 5.2, 48 kHz stereo AAC |
| `score.wav` | Original 48 kHz / 16-bit stereo score and foley, exactly 8,640,000 sample frames |
| `audio-report.json` | Audio provenance, PCM peak and RMS measurements |
| `qa-report.json` | Source-bound sampled-frame results |
| `contact-sheet.jpg` | 36-shot visual review sheet, not part of the film |
| `delivery-report.json` | Actual frame count, dimensions, duration, decode results, SHA-256 and upload-size checks |
| `chunks-4k/` | Bounded-memory 300-frame intermediate encodes and completion manifests |

The final MP4 is intended for external delivery (Google Drive); large rendered media is not checked into Git. A downloadable Drive copy is the durable delivery artifact, since ignored output/dependency directories may not survive a workspace snapshot.

## Source map

| Source | Responsibility |
|---|---|
| `plan.json` | Frozen export of the adjacent `shots.py` / `pipeline.py` shot, weather and event data |
| `film.mjs` | Cameras, environments, formation, choreography assembly, effects, titles and output clock |
| `actors.mjs` | Character palettes, rig geometry, IK targets, weapons, retimed gravity flight and LOD soldiers |
| `geometry.mjs` | Toolkit Three.js camera math, clipping, primitives, lighting and depth sorting |
| `audio.mjs` | Original modal motif, synthetic strings/horns/plucks/drums, room delays, weather and combat sounds |
| `render.mjs` | Local font registration, still rendering, bounded child workers, H.264 encoding and final mux |
| `fingerprint.mjs` | Rendering-source hash; prevents stale chunk/QA reuse |
| `qa.mjs`, `test.mjs`, `verify.mjs` | Unit, sampled-image and encoded-media checks |

To refresh `plan.json` intentionally after a blueprint change:

```bash
python3 - <<'PY'
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd().parent))
from pipeline import SHOTS, LIGHT_KEYS, events
Path('plan.json').write_text(json.dumps(dict(shots=SHOTS, lightKeys=LIGHT_KEYS, events=events()), indent=2))
PY
```

Then rerun tests and QA. Changed source hashes force affected cached exports to regenerate. The complete score is regenerated before each full export to avoid stale audio.

## Timeline

| Seconds | Procedural sequence |
|---|---|
| 0–10 | David's eye close-up, blink, sweat bead, breathing and pullback |
| 10–20 | Captain exchange, parry and airborne knee |
| 20–30 | Shield/khopesh exchange and turning sweep |
| 30–45 | Josheb, 300-soldier formation, arrow volley and spear work |
| 45–60 | Eleazar, bound sword hand, defensive exchanges and evasive jump |
| 60–70 | Shammah in the lentil field, heavy sword and shield fragments |
| 70–85 | Chariot run, retimed gravity flight, sling, bow breakup and javelin |
| 85–100 | Landing ring, grounded exchanges, throw and dagger acquisition |
| 100–110 | Sword catch, dual weapons, elite opponents and ruin-assisted jump |
| 110–125 | Storm development, rain, wet ground and champion arrival |
| 125–140 | Champion exchanges, defensive crouches and counters |
| 140–155 | Slowed parry, under-guard movement and pauldron fragments |
| 155–165 | Retreating formation, survivors and rising camera |
| 165–175 | Planted sword, golden atmosphere and landscape pullback |
| 175–180 | Final metallic title, subtitle and fade to black |

## Determinism and verification

Everything is evaluated from the requested integer output frame. Particle seeds are fixed; no wall-clock values drive animation. Actor contact holds do not freeze the camera or rain. The airborne height is a gravity parabola on a monotonic expanded source-time clock. Audio contact samples derive directly from `event.frame × 800`.

`npm test` contains 13 tests: timeline/audio arithmetic, shot coverage, event sample alignment, every-frame finite state, reachable two-bone IK, gravity flight, weather, RNG, near-plane clipping, frame bounds, final black, title text and post-landing shield continuity.

`npm run qa` checks 357 low-resolution samples spanning all shot boundaries/midpoints and contact neighborhoods, verifies random-access determinism and creates a contact sheet. These checks are **not** full-resolution every-frame aesthetic inspection or collision certification. Representative stills and the shot sheet are also inspected visually.

`npm run verify` probes and counts all encoded frames, fully decodes both streams, checks the encoded final black, validates all 36 native-4K completion manifests against the current source hash, verifies fast-start atom order, calculates SHA-256, and enforces the connector's 100 MiB upload ceiling.

## Repository capabilities actually used

- Existing David directing plan, sample-exact events and weather keys.
- Local Three.js vector math and Cinzel / Cormorant / Inter / mono font assets.
- Deterministic composition, camera, IK and cinematography conventions from the repo's skills.
- The existing TriAI example's bounded-worker FFmpeg design, adapted for this film.
- Repository toolchain setup and `./bin/ai-video verify`.

The UE importer, unrelated device models, registry UI blocks and unused generators are **not** claimed to have executed. They are intentionally not inserted into an ancient-warrior film merely to inflate the list of tools used.

## Withdrawn delivery

The user rejected this low-poly film. Its Google Drive copy was moved to Trash and the local master and intermediate MP4 chunks were deleted. The production blueprint and renderer source are retained for reference only. Do not present this experiment as an accepted delivery or reuse it as the requested photorealistic replacement. `delivery.json` retains historical verification information and records withdrawal.
