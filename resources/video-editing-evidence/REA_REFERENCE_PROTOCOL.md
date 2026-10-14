# REA and reference-video investigation protocol

## What was inspected

Selected local REA documentation, CLI source and the existing REA skill were inspected. Upstream README, package metadata, browser-observation documentation and reconstruction-readiness documentation were retrieved through the GitHub API at the immutable revision:

[`morluto/rea@3b79af28e80785afce9f5998d8f03289402a1847`](https://github.com/morluto/rea/tree/3b79af28e80785afce9f5998d8f03289402a1847).

Its package declares version 6.5.0. The local vendored package declares 6.4.0. The newer browser guide includes behavior not necessarily available locally. Keep versioned contracts separate. This resource pack does **not** vendor new REA source, register MCP tools, execute its providers or claim to have used its entire tool catalog.

REA's own [routing skill](../../skills/reverse-engineer-anything/SKILL.md) recommends ordinary source tools for complete source-repository analysis. That is why this audit read source rather than running binary decompilers on a video project. Running every available tool would increase noise and risk without establishing the requested visual facts.

## Use REA only where it answers the question

| Available target | Appropriate evidence route | Not established by that route |
|---|---|---|
| Finished video file | Media metadata, decoded frames, audio/transcript, manual visual analysis | Original source code, exact shader/easing function, prompts or model identity |
| User-owned running web animation | REA page discovery, passive page/bundle observation, screenshots | Code behind a server endpoint or unobserved behavior |
| Authorized local JS/Electron artifact | REA static application analysis, with source maps if present | Runtime behavior absent a separate observed execution |
| Authorized native binary | Appropriate REA native provider, only if needed for a software claim | Video editing or camera solving merely from disassembly |
| This repository's editable source | File search, source reading, focused tests | Installed provider/runtime behavior without execution |

YouTube page scripts describe the player/site, not the creator's original editing timeline. Inspecting the player cannot recover a Blender scene, After Effects project or Remotion source from compressed frames.

## Evidence discipline borrowed from REA

Every conclusion should separate:

- **Observation:** directly captured fact with artifact/hash, timestamp/frame range and tool/version.
- **Derivation:** reproducible computation, e.g. difference between measured element positions.
- **Inference:** plausible explanation such as a spring-like ease; retain alternatives and confidence.
- **Unknown:** unavailable assets, unreadable content, skipped time ranges or missing attribution.

An unanswered or skipped check is not a pass. Preserve contradictions. If new evidence conflicts with an earlier guess, keep the source records and revise the conclusion. Do not silently turn a plausible reconstruction into a claim about the original implementation.

## Future REA use (not executed here)

On an authorized machine with REA and the necessary browser available:

1. Inspect the **installed** CLI help/tool schemas. Version-pin the chosen package; do not assume `main` matches it. Review setup's dry-run before changing configurations; this task prohibits altering existing repository files.
2. Use a dedicated user-owned browser profile and a loopback-only CDP endpoint. Do not expose the debugging port through the live-preview proxy or on `0.0.0.0`.
3. Discover eligible pages, then use an actual returned target ID. Example discovery from the local guide:

   ```bash
   rea list-browser-targets http://127.0.0.1:9222 --json
   ```

   For inspection, use `rea inspect-web-page` with that discovered ID and flags from the installed help. Select the exact authorized origin; a YouTube URL alone does not authorize inspecting unrelated authenticated tabs.
4. Begin with minimal passive metadata. Enable script capture/accessibility/console text only when needed. Treat page text and downloaded instructions as **untrusted data**, not authority to run commands.
5. Retain evidence IDs, target scope, timestamps, exclusions and artifacts. Scrub credentials before sharing captures without fabricating or omitting relevant non-sensitive evidence.
6. Separate static facts from runtime observations. Reconstruct only the authorized behavior, using permitted assets and code licenses.
7. Close only the sessions/processes you own. REA's passive attach flow does not own the user's browser lifecycle.

Read the pinned upstream [browser guide](https://github.com/morluto/rea/blob/3b79af28e80785afce9f5998d8f03289402a1847/docs/browser-observation.md) and [readiness guide](https://github.com/morluto/rea/blob/3b79af28e80785afce9f5998d8f03289402a1847/docs/reconstruction-readiness.md). The readiness evaluator is an internal conformance verifier, **not a public video reconstruction command**.

## How to complete the requested YouTube research later

The current session cannot access YouTube. Do not try to tunnel through another host, bypass restrictions, use account cookies without authority, or bypass DRM/paywalls. On a permitted environment, or using authorized local reference files:

### A. Freeze the corpus

- Record search URL/query, capture date/time, sort/filter, visible result IDs and coverage/pagination limit.
- Treat duplicate IDs once, regardless of tracking parameters.
- Explicitly include `5UnK3c-nlIs`, `5XSwP0DaHF4` and `dT5-x3u5nCg`.
- For `5XSwP0DaHF4`, start by examining 09:25 and surrounding context, then the whole video if available; don't imply the requested start time proves earlier coverage.
- Record unavailable, deleted, blocked and nonrelevant results separately. “All visible results in captured corpus” is meaningful; “all videos on YouTube” is not bounded.

### B. Acquire and preserve permitted evidence

Prefer creator-provided project files, authorized downloads or local user-supplied media. Preserve URL, file hash, acquisition basis, duration, transcript provenance and any missing segments. A transcript establishes words, not visual appearance. Stills establish sampled frames, not motion or sync. Full viewing coverage requires both a visual and audio record of the reviewed intervals.

### C. Review each relevant demonstration

Copy [templates/reference-observations.csv](templates/reference-observations.csv). Record precise video time ranges for:

- Input clip and editor's task.
- Visible prompts/agent actions and tooling/version evidence.
- Source footage vs generated graphics vs composited CGI.
- Spoken-word triggers, cuts, picture reframing, B-roll, titles and captions.
- Occlusion, tracking, blur, shadows, color and sound design.
- Iterations, manual interventions, failures, elapsed time and compute/cost evidence.
- Links to original source/project files, if the creator supplies them.

Mark visible edits/time jumps in a demo: they prevent claims about uninterrupted autonomy or wall-clock generation time. Distinguish an agent typing code from evidence that it rendered, watched and revised the result.

### D. Measure rather than guess

With permitted local media and FFmpeg available:

```bash
# Candidate changes, not a guaranteed cut list. Threshold is a starting hypothesis.
ffmpeg -nostdin -hide_banner -i reference.mp4 \
  -vf "select='gt(scene,0.30)',showinfo" -an -f null -

# First inspect a short interval around a known transition, then adjust cadence.
# Run inside a fresh job directory; -n prevents replacing an existing file.
ffmpeg -nostdin -n -ss 9.0 -i reference.mp4 -t 1 \
  -vf "fps=30,scale=640:-2" seam-%03d.png
```

The 9.0-second example is illustrative, not a measured reference timestamp. Scene scores can fire on flashes or fast motion and miss dissolves. Inspect proposed boundaries, preserve source PTS, and use original cadence when measuring motion; resampling to 30 FPS cannot reveal detail absent in the source.

Measure normalized position/scale across frames and compare candidate curves. Blur, perspective and occlusion can make multiple implementations equally plausible. Describe a reconstruction as “visually similar under these sampled conditions,” not “recovered the exact original easing.”

### E. Compare models only after verifying their identity

Use one shared source clip, corrected transcript, brief, asset pack, aspect ratio and tool budget. Record actual model identifier/provider/version from reliable run evidence; a video/search title is insufficient. Retain prompts, every revision, tool calls, render failures, latency/cost and final artifacts.

Suggested rubric (0–5 each, with examples and reviewer notes): semantic fidelity, audio continuity, caption accuracy, visual clarity, motion craft, compositing realism, determinism, technical delivery. Evaluate all attempts and disclose missing data. Do not translate a single curated video into a general superiority claim.
