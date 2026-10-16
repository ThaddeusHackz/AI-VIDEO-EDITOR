# Cinema Studio 4.0 — deep dive

*Higgsfield's directed-cinematography surface. Model release date **2026-09-18**. Built on **Seedance 2.5**.*

## 1. Spec sheet

| Spec | Value | Source |
|---|---|---|
| Single-generation length | up to **30 s** | model listing / review |
| References per generation | up to **50 images** | review |
| Resolution lanes | **480p – 720p** (API listing) + platform upscale paths | model listing |
| Native audio | **yes** — generated with the video | review |
| Directable axes | character **emotions**, **era**, **editing pace**, camera movement | review |
| Preset count | ~**3 dozen** camera/motion presets | review |
| Character consistency | **Soul ID** / **Elements** (`@tag`) | help centre |
| API price | **$0.2057 – $0.4623 / s** | API page |
| Platform cost | $0.2057/s base | API page |

## 2. The four directable axes, mapped to this repo

| Cinema Studio axis | Repo equivalent | Notes |
|---|---|---|
| **Camera movement** | `remotion/src/engine/cameraRig.tsx` — 10 Higgsfield DoP presets (orbit-360, dolly-zoom, crash-zoom, bullet-time, steadicam, FPV…) | Run the generated shot and the CG shot with the **same nominal move** so they intercut |
| **Editing pace** | `cut-the-curve` / `motion-doctrine` seam doctrine; `ledger.json` velocity matching | Pace is a *number* here, not a vibe |
| **Era** | production design + grade; `nleTrackEngine.tsx` LUT stage | Lock the LUT before generating so era does not fight grade |
| **Emotions** | performance direction; feeds lip-sync and viseme rigs (`characterRig2D.tsx`) | Pair with Lipsync Studio for dialogue shots |

## 3. Use patterns

### 3.1 Hero-shot generator + CG intercut (the workhorse)
```text
Cinema Studio 4.0 → 3–6 s directed shots (camera preset + emotion + era + pace)
Remotion          → CG inserts (titles, product, diagrams, exploded views)
Match: focal length, move direction, shutter feel, grain, LUT
Cut on velocity-matched seams → seam gate passes → no "AI look" discontinuity
```

### 3.2 Character consistency across clips
```text
Soul ID (train once from photos)  →   cast the same face into every Cinema Studio shot
Elements/@tags for Kling-lineage models; Seedance responds to reference role described in the prompt
```

### 3.3 Native audio as a scratch track
Generated clips arrive **with audio**. Treat it as a **scratch bed**, not the master: replace dialogue with Lipsync Studio / TTS, keep the room tone, and master to the house **-16 LUFS** standard in the NLE pass.

## 4. Known constraints

| Constraint | Consequence |
|---|---|
| 480p–720p lanes | Plan an upscale step for 1080p/4K deliverables (FLUX 3 **Precise** to match a plate) |
| 30 s ceiling | Long-form = multiple generations + deterministic assembly, or Supercomputer batch |
| Credits always metered on MCP/CLI/Canvas/Supercomputer | Unlimited plan perks do **not** travel off-site |
| Native audio quality varies | Always A/B against a designed bed before delivery |
| Resolutions/prices move fast | Re-read the model listing before quoting a job |

## 5. QC checklist

- [ ] Move matches the requested preset (compare to `cameraRig` preset curve)
- [ ] No morphing in faces/hands across the 30 s (check at 0, 15, 29 s)
- [ ] Native audio muted or replaced; loudness normalised
- [ ] Grade matched against the LUT used for the rest of the show
- [ ] Upscale mode appropriate (**Precise** for plates, **Creative** only when the shot must "look shot")
- [ ] Character identity consistent across the whole scene set (Soul ID reference)

## 6. Sources

`higgsfield.ai/enterprise-help-center/platform/tools-creative-workflow` (2026-10-06) ·
`thepostflow.com/ai/higgsfield-ai-review/` (2026-10-14) · `higgsfield.ai/higgsfield-api` (2026-09-20) ·
`open.higgsfield.ai/models/workflows/genjutsu/playground` model table (Cinema Studio 4.0 · $0.2057–$0.4623/s · 480p–720p · 4–30 s · 09/18/2026).
