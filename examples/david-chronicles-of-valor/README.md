# DAVID: The Chronicles of Valor — production package

A complete directing and technical handoff for a **180-second, 3840 × 2160, 60 fps** cinematic.
The final requested onscreen title is **VALOR: THE CHRONICLES OF DAVID**.

**This is the requested animation script/blueprint and camera-rigging code, not a rendered photorealistic film.** No UE executable, licensed hero/MetaHuman assets, mocap, finished environment, PS5 development hardware or AI video-generation service was available or invoked. Unreal API calls were checked with a narrow contract mock, not executed in the editor.

## Deliverables

- `out/DAVID-Production-Blueprint.pdf` — 45-page designed director’s bible and 36 complete shot sheets.
- `out/DAVID-Complete-Production-Package.zip` — PDF, editable Markdown, source code, tests, all data and the local planning viewer.
- `out/frames.csv` / `out/frames.jsonl` — **10,800 individual frame records**, 0–10799 inclusive. Every row includes phase direction, camera transforms, lens, focus, lighting, rain/wetness/mud, clocks, pose hold, cues and title states.
- `out/shots.json` — 36 five-second shots / 216 frame-range choreography phases.
- `out/generator_prompts.json` — 36 paste-ready provider-neutral prompts, identity/continuity locks, first/last-frame anchors and avoidance guidance. These are **not** fictitious Sora or Runway API payloads.
- `out/events.json` — 38 exact-frame events with 48 kHz sample positions.
- `out/lighting_keyframes.json`, `out/continuity_ledger.json` — weather/light and all 35 camera handoffs.
- `unreal_import.py` — UE 5.5-targeted camera/cut/sun Sequencer importer with overwrite protection and run-owned cleanup.
- `rig_contract.json` — explicit production asset, control, simulation and clock requirements.
- `out/validation.json`, `out/pdf-validation.json` — test scope/results and PDF coverage.

The frame records are an exhaustive **temporal/rigging plan**, not joint-by-joint mocap. Their precision must not be misrepresented as already solved character contact, facial simulation or PS5 frame-time performance. Those require the actual production assets and engine.

## Reproduce the package

Python 3.10+ is sufficient for the frame data, validation, ZIP and viewer. PDF typesetting needs the pinned packages:

```bash
cd examples/david-chronicles-of-valor
python3 pipeline.py generate
python3 test_pipeline.py
python3 unreal_import.py --validate-only

python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python build_pdf.py
python3 pipeline.py package
python3 serve.py --port 3001
```

Inside the delivered ZIP, run the same commands from its extracted root; do **not** start with `cd examples/...`. The generator is stdlib-only. PDF typesetting uses system DejaVu when available, with standard PDF font fallbacks. The viewer serves on `0.0.0.0`, uses relative URLs, no external requests and an explicit route allowlist. GSAP is taken from the repo toolkit; the ZIP includes that exact vendor file for standalone use.

In the viewer: scrub any frame, jump to a shot/act, use arrow keys for single frames, Shift+arrow for one second, and Space for play/pause. The map is a clearly labeled **nonphotoreal blocking diagram**, not final animation. It uses the repo’s paused GSAP master-clock convention; all displayed state is addressed by an exact frame.

`out/`, `.venv/` and Python caches are ignored by Git. Regenerate data after changing `shots.py` or `pipeline.py`; rebuild the PDF and ZIP after changing source or documentation. Never reuse a stale package for production.

## Unreal Engine 5.5 handoff

1. Enable **Python Editor Script Plugin** and **Sequencer Scripting**. Prepare a disposable or version-controlled working level with the intended scene scale.
2. Copy/extract the complete package to a readable local path and ensure `out/frames.csv` exists.
3. In UE, use **Tools → Execute Python Script** and select `unreal_import.py` (menu placement may vary with editor configuration).
4. The default target is `/Game/Cinematics/DavidValor/LS_David_Valor_180s_v001`. An existing asset is **never overwritten**. Change the versioned constant or call `import_sequence(..., asset_name='LS_David_Valor_180s_v002')` deliberately for a new take.
5. The importer creates 36 Cine Camera Actors, 36 exclusive-end cut sections, transform/lens/aperture/manual-focus keys, a directional sun and keyed illuminance/temperature. Display rate is 60; tick resolution is 60,000; playback range is `[0,10800)`.
6. Review the sequence and **save the current level manually**. Possessed cameras and sun live in that level. Do not delete them and expect the sequence bindings to keep working.
7. Resolve all null production asset paths in `rig_contract.json`. Connect the remaining weather/material lanes, stage approved animations and cache cloth, hair, destruction and particles with documented clocks. Nothing in the script claims to manufacture missing cinematic assets.
8. Run a short target-engine smoke test first. UE Python reflection/plugin surfaces can differ; descriptive preflight checks and cleanup are included, but the contract mock cannot prove a live import will succeed.

All camera coordinates are centimeters, Z up. +X is the story’s default screen-right direction when viewed from the primary negative-Y camera side. The 135 mm ECU and the close-focus lens limits are set explicitly. Per-frame curve keys use linear interpolation **between sampled output frames**; the actual path is already computed using a normalized closed-form critically damped response and explicit arcs.

### Clock lanes

| Lane | Meaning |
|---|---|
| `time_s` | Absolute output/editorial clock |
| `shot_action_source_s` | Per-shot integrated retimed source clip clock |
| `shot_pose_source_s` | Per-shot retimed pose clock with localized holds |
| `pose_hold` | Whether the contact rig pose is held on this output frame |
| `flight_source_s` | Dedicated physical clock for the ramp jump, expanded into subjective airtime |
| `audio_sample` | Exact 48 kHz sample corresponding to the output frame |

Do not apply the action-speed lane as global engine time dilation: it would also slow the camera and unintended weather layers. The manifest’s breathing amplitude and blocking anchors are **rig inputs/reference values**, not finished full-body animation. The dedicated flight root-height solve uses `g = 981 cm/s²`; it does not create a low-gravity floating character.

## Continuity and adaptation decisions

- The two requested title orderings are preserved as working title versus final onscreen title.
- The Three’s separate legendary episodes are compressed into one cinematic battlefield and identified as adaptation.
- David’s dropped sword rests on nearby timber during grappling and is only knocked into a short fall immediately before he catches it. The weapon is not airborne for twenty seconds.
- His acquired dagger is visibly discarded before the final single-blade duel.
- The khopesh-like sword, large two-handed sword, modern martial-arts influences, volley deflection, sling exaggeration and landing shockwave are identified as stylization, not undocumented historical facts.
- A PC cinematic profile is separated from a **provisional, unbenchmarked** PS5-class 60 fps budget. Native 4K plus all maximum-quality effects is not promised.
- Model video output is not described as guaranteed native 4K/60, mocap-accurate or identity-stable. Provider capabilities must be checked at submission time. Final title lettering is composited separately.

## Validation actually performed

`python3 test_pipeline.py` runs 16 tests covering complete frame/shot/phase coverage, act boundaries, finite channels, monotonic clocks, camera endpoints, optical values, sample-accurate events, final black frames, persistent wetness, gravity-consistent source-time flight, prompt count, repeatable evaluation, a mocked UE camera import and no-overwrite protection.

`build_pdf.py` extracts PDF text after typesetting and verifies all 36 shot sheets plus nonempty pages. Representative cover and shot pages are visually reviewed. This is document/planning QA—not a completed visual-effects render review, collision solve, live UE execution or hardware benchmark.

At repository level, the existing `./bin/ai-video verify` remains applicable. This package draws on the director, camera, seam, cinematic-VFX, character-IK and NLE guidance while preserving the distinction between browser preview tools and Unreal production systems. Unrelated registry blocks, device models and decorative UI are intentionally not forced into the film.

## Withdrawn low-poly experiment

The separate [`film/`](film/README.md) project now implements the user-approved **stylized, code-animated 3D adaptation**: 180 seconds, native 3840×2160 at 60 fps, articulated procedural warriors, cinematic cameras, weather, effects and original synthesized audio. It is not the photorealistic UE production described above. See its README for reproducible rendering, actual verification and explicit limitations. The blueprint and its Unreal handoff remain unchanged.

The user subsequently rejected the low-poly adaptation. Its Drive MP4 was moved to Trash and its local MP4s deleted. The photorealistic replacement has not been rendered.
