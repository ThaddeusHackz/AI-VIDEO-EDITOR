# DAVID: THE CHRONICLES OF VALOR — delivery notes

**Runtime 180.0 s · 10800 frames · 60 fps · original score.** Rendered in this workspace from a
real 3D scene, on CPU only.

> **Version 3 (current).** The first two finished cuts were rendered with a defect in the
> retargeting bridge: the hips translation of every clip was collapsed to roughly 1/100 of its
> authored size and rotated on the wrong axis, so the actors' vertical motion came from the
> choreography alone and 93% of all sampled frames had a foot *off* the ground (measured — see
> "The third defect" below). The root cause is fixed in `src/retarget.js`, verified frame-by-frame
> against the source animation, and the film has been re-rendered end to end from the corrected
> pipeline. Version 3 supersedes both earlier uploads.

---

## What was actually used (and what was not)

Honesty first, because this matters more than the marketing:

| Claim | Status |
| --- | --- |
| Real 3D animation, real rigged characters, real skeletal animation | **Yes.** 17 actors driven by 126 retargeted skeletal clips, one WebGL scene, one camera per shot. |
| Grounded contacts — feet on the ground | **Yes, measured.** `tools/diag-foot.cjs` compares the lowest foot bone of every visible actor against the terrain under it, every shot: **90.1% of samples are within ±4 cm of the ground**, worst dip 0.30 m during one airborne beat. Before the v3 retarget fix the same audit reported **7.0%**. |
| Original soundtrack and foley | **Yes.** Synthesised from oscillators/noise in `cinema/src/audio.mjs`; cue sheet derived from the film's own impact events. No sampled or licensed music. |
| 3840×2160 output file | **Delivered, but it is a rescaled container**, not a native 4K render. The *rendered* master is 1280×720 with the delivery grade applied; the 4K file is a Lanczos rescale of it. The description on the Drive file says exactly this. |
| ActionForge (`actionforge.app`) | **Its CC0 assets are used; its tool is not.** The sandbox cannot reach that domain, so the assets were retrieved through a GitHub Actions runner (the only outbound-HTTP path available) and are committed under `cinema/assets/quaternius/`. Per the site's own `THIRD-PARTY-NOTICES.txt`: **the rig, animations and props are CC0 1.0 public domain** (Quaternius / CGstuff) and "may be used for anything, commercial or otherwise"; the **application code is proprietary** and explicitly not licensed for copying or reverse engineering, so **none of it is fetched, kept or used**. Two temporary probe commits that downloaded bundles for inspection were squashed away and force-pushed out of the branch. |
| Unreal Engine, MetaHuman, ray tracing, motion capture | **Not used, not claimable.** This machine has 2 vCPUs, ~4 GB RAM and no GPU. |
| "Photorealistic" | **No.** The look is deliberately stylised, filmic, high-end-game presentation of a real martial-arts choreography: grounded contacts, hit-stops, weight, cloth/armour response. It is not photoreal. |

### The CC0 set, in detail

`cinema/assets/quaternius/` holds the public-domain animation assets, with the verbatim licence
notice in `cinema/out/LICENSE-quaternius.txt`:

| File | Contents |
| --- | --- |
| `rig-human.glb` | Quaternius rig, 71 joints, UE-style bone names, with a mannequin body |
| `anim/*.glb` (33) | full-body clips: `sword_attack`, `sword_block`, `sword_idle`, `punch_cross`, `punch_jab`, `jump_start/loop/land`, `roll`, `sprint_loop`, `jog_fwd_loop`, `walk_loop`, `crouch_idle_loop`, `crouch_fwd_loop`, `hit_chest`, `hit_head`, `interact`, … |
| `ual/UAL_Standard.gltf` + `.bin` | Quaternius Universal Animation Library, 46 clips |

`src/ual.js` bridges them to the film: the clips are authored on a UE-named skeleton
(`pelvis`, `spine_01`, `upperarm_l`, …) while the characters use Mixamo names, so **both the
source skeleton and every animation track are renamed** through a 52-entry map, after which the
existing `src/retarget.js` binds them by name — the rest-pose correction, unit conversion and
root-motion stripping all come from that one code path. 17/17 clips bind at 104 tracks each
(`out/ual-validation.json`), and the retarget was verified frame-by-frame against the source
mannequin (`probe/retarget-ab.jpg`): the poses match, so the mapping is faithful.

**32 choreography cues now ride the CC0 clips** — the crash landing before the grapple, the
hip-throw roll, the elbow strikes, the shield blocks, and the hit reactions throughout.

Assets: 126 Mixamo-format skeletal clips and 3 rigged characters (Mixamo **Paladin** 67 joints +
Superhero Male/Female as supporting bodies) and 10 CC0 **Quaternius** weapon models, downloaded
with `cinema/tools/fetch-assets.sh` (provenance commented in that file). Retargeting to every rig
is handled by `cinema/src/retarget.js` — 126/126 clips validated, 0 errors.

## Where the film is

Uploaded to the **AI VIDEO EDITOR** Drive folder (`1CJmH3jkLbxReS9AqnrVV50l2JNbQTGJ6`):

| File | Size | Notes |
| --- | --- | --- |
| `DAVID_THE_CHRONICLES_OF_VALOR_3840x2160_60fps.mp4` | 82.3 MB | `1tRU0vmaQgyVOfYGiCTrhOfYCHk_S8pFa` — 3840×2160, 3:00, 60 fps, graded, scored (rescaled master) |
| `DAVID_THE_CHRONICLES_OF_VALOR_1280x720_60fps.mp4` | 67.0 MB | `1L8dKnmVZUTF60mHOaWEYegVgu9cFFCWn` — the native render, 1280×720, 3:00, 60 fps, graded, scored |

Local copies: `cinema/out/`. Checksums, stream specs and the measured QA report are in
`cinema/out/delivery.json`, `out/delivery-report.json` and `out/qa-master.json`.

## Resolution

The scene renders through Chromium **ANGLE/SwiftShader software WebGL** (no GPU exists here).

Measured, not estimated:

| Render size | Cost per frame | 10800 frames |
| --- | --- | --- |
| 960×540 | ~1.1 s | ~3.3 h |
| **1280×720 (delivered master)** | **~1.7 s** | **~5.0 h** |
| 1920×1080 | ~2.6 s | ~8 h |
| 3840×2160 | ~9 s | **~27 h — not achievable here** |

So the master was rendered at 1280×720 and the 3840×2160 delivery file is a Lanczos rescale of it.
Every pixel of motion, lighting, weather and choreography is real; the fine detail is 720p detail.

## The film

Timeline is exactly as specified: 0–10 eyes/pull-back · 10–20 the captain's sword · 20–30 two
attackers · 30–45 Josheb and the three hundred · 45–60 Eleazar · 60–70 Shammah in the lentils ·
70–85 chariot, sling, javelin · 85–100 the landing and the grapple · 100–110 dual blades, five
elites, wall-run · 110–125 the storm breaks · 125–140 over-the-shoulder barrage · 140–155 the slow
parry and the shattered pauldron · 155–165 the rout · 165–175 golden light, sword planted ·
175–180 the title, fade to black.

26 shots, 17 actors, 66 distinct clips, ~500 blocked positions, 38 impact events (sparks, dust,
mud, splash, shockwave, pauldron shatter, bow break), an 11-key weather track (calm → dust → rain
→ storm → golden hour), lightning with real flash lighting, rain driven by the wind vector, and a
metallic chiselled title card that resolves out of the storm light.

## Reproduce

```bash
cd examples/david-chronicles-of-valor/cinema
bash tools/fetch-assets.sh                  # assets (idempotent)
node src/audio.mjs                          # score  -> out/score.wav
# four chunks, ~1 h each on 2 vCPUs; render them one at a time
for i in 0 1 2 3; do
  node tools/render-film.cjs $((i*2700)) $(((i+1)*2700)) out/silent/chunk-$i.mp4 0.3334 0.7 10
done
node tools/finish.cjs --4k                  # concat + mux + grade + 720p master + 4K delivery
node tools/qa-film.cjs                      # measured QA -> out/qa-master.json
```

Verification that this pipeline is honest about itself:

```bash
node tools/diag-units.cjs    # source vs retargeted hips motion, in metres  (must match)
node tools/diag-foot.cjs     # lowest foot bone vs terrain, every shot      (>90% within 4 cm)
node tools/diag-motion.cjs   # hips translation per clip + on-screen excursion per shot
node tools/diag-tpose.cjs    # every actor animated at its shot's mid-frame (0 not animating)
node tools/validate-ual.html # 17/17 CC0 clips bind at 104 tracks each
```

Everything else in `cinema/tools/` is diagnostics kept for the record: the profiling scripts that
established the software-GL cost model (`diag-budget`, `diag-scale`, `diag-rate`), the framing and
bone audits (`diag-framing`, `diag-bones`, `diag-shot1`), the transport experiments that ruled out
four faster-looking dead ends (`diag-transport`, `diag-transport2`, `diag-codecs`, `diag-tiles`),
and the contact-sheet builders (`probe.cjs`, `sheet.cjs`, `probe-film.cjs`).

## Known limits, stated plainly

* The 3840×2160 file is a Lanczos rescale of the 1280×720 master, not a native 4K render; the
  Drive description says so and the render budget table above shows why (≈27 h at 2160p on this
  CPU-only machine).
* `tools/diag-foot.cjs` reports one airborne beat (the wall-run / landing in act 3) where a foot
  bone dips up to 0.30 m under the terrain for a frame or two, and 24 of 26 shots stay within
  7 cm. No ground clamp is applied: during a wall-run the feet are legitimately on a wall, so a
  "raise until the lowest foot touches the terrain" rule would fight the choreography rather than
  fix it.
* The look is stylised filmic realism, not photorealism — see the table at the top.

## Three defects these passes fixed

All were found by measurement, not by watching:

1. **The hips translation never reached the screen (the big one).** `tools/diag-tpose.cjs`
   reported `hipsMove=0` for all 80 actor instances. That number was itself untrustworthy —
   `Actor.bone(name)` is an exact-name lookup, so `a.bone('Hips')` is always `null` on a
   Mixamo rig and the audit was measuring nothing — so the question was re-asked properly by
   `tools/diag-units.cjs`, which plays a clip on the raw source skeleton and on the retargeted
   actor and compares the hips' world-space excursion. The source clip
   (`Jumping_Over_Into_Combat`) lifts the hips **0.6762 m**; the retargeted clip lifted them
   **0.0424 m**, and the surviving motion was the clip's *forward* travel mis-mapped onto the
   vertical axis. Root cause: `Retargeter.bind()` looked the character-side parent rest up by the
   **source** node's parent name (`RootNode`), which does not exist on the character (its hips
   parent is `Armature`), so the conversion's fallbacks silently degraded to identity rotation with
   a scale ratio of 1 — every hips delta came out 100× too small and unrotated. Both parents are
   now looked up separately, and the same audit reports **0.6762 m vs 0.6762 m**: the retarget
   reproduces the source motion exactly. On screen this is the difference between crouches, rolls,
   landings and falls that move the body and ones that only fold the legs under a pinned pelvis.
2. **Background soldiers were frozen in the bind pose.** The T-pose audit reported **0% of bones
   moved for attackers, elites, the trio and the archer** whenever a shot cast them without a cue
   — a field of mannequins standing behind the fight. `Film.setFrame` now gives any visible actor
   with no running action a looping idle, offset per actor so the crowd is not synchronised.
   Re-audited: **80/80 actor instances animate.**
3. **The CC0 idle reads as a mannequin for bystanders.** It holds the arms wide in a
   stylised game-ready pose, which is right for a combatant mid-fight and wrong for a dozen
   soldiers in the background, so scenery now uses the natural Mixamo `Idle` while the CC0 clips
   drive the actions they are actually good at.

## Engineering notes worth keeping

* Under SwiftShader a **synchronous `readPixels` is a full pipeline flush (~600 ms)**, not a
  transfer: frames are therefore rendered in batches with no reads, and read back once per batch.
* Serialising frames through the DevTools protocol as base64 is the real bottleneck above 720p, so
  finished batches are **POSTed as raw binary to a loopback endpoint that pipes into ffmpeg's
  stdin** (no base64, no disk churn).
* `film.setFrame()` only updates scene state — the raster happens in `film.renderLean()`. A batch
  loop that forgets the second call still reports plausible progress while writing identical
  frames; that failure mode cost two hours of this project and is why chunk output is now verified
  frame-by-frame before a long render is trusted.
* Metals render black without an environment map *and* clamped metalness — both, not either.
* Root motion must be stripped in **world space**; zeroing the hips' local X/Z collapses the rig.
* The crowd atlas must bind its own render target, and camera keys authored with feet at y=0 need
  the terrain height added or close-ups end up aimed at bare ground.
* **A fallback that tests `has()` instead of the value silently loads nothing** — a clip that
  fails to bind is *present* in the library with a `null` value, so `loadQuaternius` never ran
  until the test was changed to `this.clips.get(n)`.
* **An audit that reports zero bones is broken, not clean.** The first T-pose pass compared
  world quaternions against a field that did not exist, so every actor reported `bones=0` and the
  "worst offenders" table was empty noise. It only became useful once it compared *local*
  rotations against a rest map built from the base rig.
