# Bounded audit findings

Date: 2026-10-14. Local starting revision: `1eaac10af1fe3a6f73ad30c7d436d43b73d6794e`.

Evidence labels: **observed** = directly read source/output; **derived** = conclusion from it; **recommended** = production practice proposed here; **unknown** = not established. Source hashes and inspected paths are indexed in [sources.json](sources.json). This is selected-file static review, not a complete security audit or executed rendering benchmark.

## 1. What is and is not established about the reference videos

**Unknown:** all three videos' contents, their titles/authors, whether their demonstrations are continuous or edited, whether they used the named models, their exact prompts, tools, generation budgets, success rates and editing quality. No claim that a named effect occurs in any supplied video is made.

The two search pages are dynamic, personalized discovery surfaces, not fixed playlists. A claim to have reviewed “all videos” requires a captured result set and a coverage report. Neither was obtainable here. There is no basis for ranking the two named models from this session.

The existing [workflow research](../../toolkit/OPUS_5_5_VIDEO_WORKFLOW_RESEARCH.md) and [YouTube benchmark skill](../../skills/youtube-opus-gpt-benchmarks/SKILL.md) contain prior model/demo claims. **Observed:** those statements exist. **Unknown:** their underlying evidence and whether they describe the supplied videos. They remain untouched; do not cite them as newly verified findings.

## 2. How an agent-driven editing workflow can work

**Derived from the local source architecture, not the unavailable videos:** a coding agent can plan an edit and author animation code; Remotion or HyperFrames evaluates the visual timeline; media tools handle decoding/encoding and audio. That is distinct from an LLM intrinsically generating finished video pixels. Tool access, source footage, a transcript/time map, assets, and iterative QA determine the usable result.

For a talking-head edit the critical data flow is:

```text
original media + provenance
  → metadata / timebase + corrected transcript
  → selected source intervals
  → source-to-output time map
  → retimed words, graphic cues and sound cues
  → picture/audio assembly
  → frame inspection + complete listen/watch + export checks
```

Putting attractive overlays on an unchanged clip is useful, but is not the same as removing takes, preserving audio continuity, or constructing J/L cuts.

## 3. Concrete repository observations

| Observed implementation | What it establishes | What it does not establish |
|---|---|---|
| [`scripts/ai-video-pipeline.mjs`](../../scripts/ai-video-pipeline.mjs), `analyzeVideo` calls ffprobe with format/stream flags | Metadata inspection when ffprobe is installed | Scene understanding, actual transcript extraction, semantic editing or a forensic video review |
| [`remotion/src/NLEMasterTimeline.tsx`](../../remotion/src/NLEMasterTimeline.tsx) defines `DEMO_CAPTIONS`, gradient plates and a focal text card | A visual editorial showcase and reusable styling ideas | An actual media ingest/edit/ASR pipeline; no footage or speech audio is loaded by this composition |
| [`getLUTFilterString`](../../remotion/src/engine/nleTrackEngine.tsx) returns CSS contrast/saturation/brightness/sepia/hue filters | A stylized CSS grade | A loaded 3D `.cube` LUT, scene-linear grading or verified HDR/SDR conversion |
| `AudioWaveformBar` in the same module derives bars from sine/cosine of frame/index | Deterministic animated meter graphics | Measured waveform, loudness analysis or sidechain compression of an audio signal |
| [`VFXCompositorSuite.tsx`](../../remotion/src/VFXCompositorSuite.tsx) draws moving crosses and a grid | Procedural VFX-look illustration | Camera solving against a live-action plate; a label saying “matchmove” is not tracking evidence |
| [`skills/rea-video-reverse-engineer/SKILL.md`](../../skills/rea-video-reverse-engineer/SKILL.md) describes frame/cut analysis | Workflow suggestions | Scene-change heuristics are not guaranteed exact cuts; compressed frames cannot reveal exact original easing/shader source |
| [`skills/reverse-engineer-anything/SKILL.md`](../../skills/reverse-engineer-anything/SKILL.md) says to skip REA for ordinary source-repository analysis | The correct route for this checkout is normal source inspection | No need to install every binary provider or run invasive runtime operations |
| Local `rea/package.json` says 6.4.0; pinned upstream package says 6.5.0 | A documented version difference | That upstream tools are installed locally, backward compatible, or verified on this host |

These are **capability boundaries**, not grounds to remove the demos. The additive workflows explain how to progress from demos to real media jobs.

## 4. Environment observations

`source ./hf-env.sh && ./bin/ai-video doctor` reported:

- Node 22.22.3 and npm 10.9.8 available.
- FFmpeg and HyperFrames CLI absent from PATH; ffprobe was also absent in direct discovery.
- Remotion dependencies not installed.
- 53 skill directories, 210 block directories, 237 component directories, 448 cached manifest files and 40 immediate Remotion package directories counted by the doctor.
- Doctor's green labels are not runtime/provider verification. Some of its descriptive counts are hard-coded; do not infer installed capabilities from them.

The unified verification was attempted with npm offline/automatic installs disabled and failed at TypeScript resolution (`ENOTCACHED`). HyperFrames lint and the final seam step were not reached by that command. No package manifest, lockfile, setup script or tool registration was changed to force a pass.

## 5. Highest-value next work (recommendations, not completed features)

1. **Use real source footage:** capture a source manifest, checksum, duration, timebase, rotation, color metadata and stream inventory.
2. **Correct the transcript:** word-level ASR is provisional. Confirm names, numbers, negation and uncertain language by listening.
3. **Implement a media-backed cut adapter:** preserve a separate source/output map; retime captions and graphics after picture changes. The new [plan compiler](EDIT_PLAN.md) supplies a narrow tested contract, not an integrated NLE.
4. **Mix actual signals:** separate dialogue/music/SFX, inspect waveforms, listen, measure final loudness and peaks. Animated bars do not prove audio quality.
5. **Use actual masks/tracks:** text-behind-person requires a temporally stable matte; live-action CGI requires a camera/plane track, lighting and compositing integration.
6. **Render and review:** deterministic seeking, fonts, alpha, timing and decoding all need real tests once dependencies and footage are present.
7. **Run a fair benchmark later:** same authorized footage, brief, assets, budget and QA rubric for each independently identified model; retain all attempts, failure cases and revisions. A best-looking montage is not a controlled comparison.

## 6. Boundaries of this addition

No training/fine-tuning, YouTube download, external media upload, live-browser capture, REA installation, provider execution, CGI render, or finished video occurred. No secret recovery, access-control bypass, or infrastructure vulnerability scan was attempted. Only the new `resources/video-editing-evidence/` directory is added; all original tracked file bytes are checked separately in [VALIDATION.md](VALIDATION.md).
