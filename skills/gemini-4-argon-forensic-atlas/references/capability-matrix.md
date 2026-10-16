# Gemini 4 Argon — Full Capability Matrix (forensic, verbatim + interpreted)

Scan date **2026-10-16**. Two authoritative surfaces were cross-read: the Gemini API model card and the Google Cloud Gemini Enterprise Agent Platform page. Where they differ, both values are recorded.

## 1. Identity & limits

| Field | API card | Enterprise card | Editor's note |
|---|---|---|---|
| Model code | `gemini-4-argon` | `gemini-4-argon` | Same id on both surfaces |
| Context window | 1,048,576 (unified input + output) | 1,048,576 | Input, thinking **and** output share one budget |
| Max output | 65,536 default synchronous, **up to 1,048,576 with long decode** | 1,048,576 | Long decode is the feature that makes full-project single-pass emits possible |
| Knowledge / release | Announced 2026-09-30, GA 2026-10-13 | — | Gemini 4 generation, first model ("new naming scheme") |
| Price (intro) | $2 / 1M input, $10 / 1M output | — | Long decode can therefore cost real money in one call |

## 2. Modalities

| Direction | Supported | Notes |
|---|---|---|
| Input | **Text, Image, Video, Audio, PDF** | Video is also usable from URL context |
| Output | **Text only** | No image, no audio, no video out |

**Consequence:** any pipeline that needs pixels or sound must call *other* models. Argon's job is to produce the **spec, the code and the critique** — not the frames.

## 3. Capability flags (verbatim, both surfaces)

| Capability | State | Practical meaning |
|---|---|---|
| Agentic video understanding | **Supported (defaults to static)** | Must be requested; then the model scrubs timestamps and inspects high-res frames itself |
| Audio generation | Not supported | Use Gemini 3.8 TTS / Gemini Omni Flash / Lyria 3.5 |
| Image generation | Not supported | Use Nano Banana / Nano Banana Pro / Imagen |
| Live API | Not supported | No realtime voice/video session |
| Caching | Supported — **implicit only**; explicit caching not supported | Prompt-prefix stability still pays, but you cannot pin cache breakpoints |
| Code execution | Supported | Sandboxed Python — good for EDL math, frame math, ffmpeg command synthesis |
| Computer use | Supported (**Preview**) | Browser/desktop driving; useful for web-based NLEs and asset retrieval |
| File search | Supported | Grounding over your own corpora (shot libraries, brand bibles) |
| Function calling | Supported | The mechanism that drives Blender MCP et al. |
| Grounding — Google Search | Supported | Reference research, trend/pacing research |
| Grounding — Google Maps | Supported | Location-accurate plates and establishing shots |
| Structured outputs | Supported | Emit EDL/OTIO/FCPXML/JSON without a parser war |
| Thinking | Supported — **LOW / MEDIUM (default) / HIGH** | `thinking_budget` and `MINIMAL` → **HTTP 400** |
| URL context | Supported | Point at reference pages/footage URLs |
| RAG Engine (Enterprise) | **Not** supported | Bring context in-prompt |
| Tuning | **Not** supported | No fine-tune; use skills + structured prompts |

## 4. Consumption modes

| Mode | Supported | Use |
|---|---|---|
| Batch API | Yes | Overnight bulk EDL extraction across a whole library |
| Flex inference | Yes | Cheap, latency-tolerant render-loop iterations |
| Priority inference | Yes | Deadline cuts — QC pass before delivery |
| Standard sync | Yes | Interactive directing |

## 5. Video handling ceilings (**Enterprise** surface — the stricter of the two)

| Constraint | Value |
|---|---|
| Max video length **with** audio | ≈ **45 minutes** |
| Max video length **without** audio | ≈ **1 hour** |
| Max videos per prompt | **10** |
| Supported MIME types | `video/x-flv`, `video/quicktime`, `video/mpeg`, `video/mpegs`, `video/mpg`, `video/mp4`, `video/webm`, `video/wmv`, `video/3gpp` |

Notes:
- A 90-minute master must be chunked (e.g. 3 × 30 min) and stitched with overlapping handles (2–5 s) so cuts on the seam are not lost.
- Keep audio on the chunk when you need narration/dialogue anchoring, but remember the 45-min ceiling is *lower* than the silent one — silent chunking buys you more headroom for very long plates.
- 10 files/prompt is enough for A/B reels, multi-cam groups, or "compare v1…v10" passes.

## 6. Sampling & thinking behaviour

- `temperature`, `top_p`, `top_k` are **ignored** — tuning them is wasted effort. Control behaviour with thinking level, prompt structure and structured outputs instead.
- Three thinking levels only. Choose by task class:

| Task | Level | Why |
|---|---|---|
| Bulk EDL/caption extraction with a given schema | LOW | Deterministic parsing work |
| QC pass, shot critique, pacing notes | MEDIUM | Default balance |
| Scene design, shader authoring, 3D blueprinting, adversarial critique | HIGH | The only tier that reliably finds *specific* flaws |

## 7. Benchmark table (vendor-published)

| Benchmark | Argon | Notes |
|---|---|---|
| LVBench (long video) | **91.7%** SOTA | The one that matters for footage work |
| DeepSWE v1.1 (long-horizon SWE) | **77.9%** | Ahead of Claude Opus 5.5 (74.2%) and GPT-6 Astra (74.1%) per Google's comparison |
| AutomationBench (47-tool workflows) | **51.3%** #1 | Long tool chains stay coherent |
| CWE-bench v1 | 68% (tie 1st) | Safer generated pipeline code |
| Internal long-context suite (256K→1M) | 84.2% | Whole-repo reasoning |
| xTB molecular prediction | 2.3× faster structures / 1.8× conformers | Proof that "drive the real tool" beats "guess the answer" |
| Data-centre memory optimisation | **300 TiB freed**, 500 TiB–1 PiB projected | Multi-agent telemetry analysis at scale |

## 8. Unsupported / avoid list (one-screen summary)

```text
✗ thinking_budget parameter          -> HTTP 400
✗ thinking_level = MINIMAL           -> HTTP 400
✗ explicit context caching
✗ image generation      (use Nano Banana)
✗ audio generation      (use TTS / Omni Flash / Lyria)
✗ Live API (realtime)
✗ model tuning
✗ RAG Engine (Enterprise)
✗ sampling-parameter tuning (silently ignored, not an error)
```
