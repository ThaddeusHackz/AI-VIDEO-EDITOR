# Validation record — 2026-10-14

## Added resource pack

Scope: `resources/video-editing-evidence/` only. No existing tracked source, docs, configurations, lockfiles, assets, skill links or plugin registrations were edited. No dependency installation, provider upgrade, commit or push was performed.

### Checks actually run

| Check | Result | What it proves |
|---|---|---|
| `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s resources/video-editing-evidence/tests -v` | **23 tests passed** | Compiler contract, retiming, malformed input handling, CLI exit behavior and deterministic mapping |
| Compiler on `examples/talking-head.plan.json` | **Passed** | Synthetic result: 240 frames, exactly 8 seconds at 30 FPS, 7 retained words and 2 recorded omissions |
| Seeded mapping scenarios inside unit tests | **100 scenarios passed** | Contiguous timeline and source-to-output mapping invariants for generated valid cuts |
| JSON parsing of example, shot template and provenance manifest | **Passed** | Well-formed JSON; shot template is intentionally unfilled and not a renderable plan |
| Relative Markdown link resolution | **Passed** | Linked local files exist; no assertion about remote link availability |
| Recompute the 23 local-source hashes in `sources.json` | **Passed** | Provenance entries match inspected repository content |
| Compare pre-work SHA-256 baseline | **9,089 readable tracked file targets unchanged** | Byte preservation for those paths, including resolvable symlink targets |
| Compare all tracked symlink text against Git blobs | **256 symlink targets unchanged** | Original links preserved, including links whose destinations are unavailable |
| `git diff --exit-code HEAD --` | **Passed, no tracked differences** | All 9,213 original tracked paths remain unchanged; new untracked additions are not included in this diff |
| `git status --short` | Only `?? resources/` | Additions isolated under the new resource directory |

The initial readable-file baseline was stored outside the repository, not inserted into the project. The byte-hash count and symlink count overlap; they should not be summed. Original tracked paths comprise 8,957 regular files and 256 symlinks.

### Existing project checks

- `source ./hf-env.sh && ./bin/ai-video doctor` completed. It reported Node/npm available, but FFmpeg, HyperFrames CLI and Remotion dependencies unavailable. Direct PATH discovery also found no ffprobe. Doctor's descriptive green output is not an executed renderer/provider test.
- `source ./hf-env.sh && npm_config_offline=true npm_config_yes=false ./bin/ai-video verify` was attempted and **failed/blocked** at the TypeScript stage with `ENOTCACHED`: no installed compiler, no cached resolution. Offline mode prevented automatic package acquisition. The unified command did **not** reach its HyperFrames or seam steps.
- `node scripts/seam-stamp.mjs --ledger examples/ultrahigh-3d-vfx-showreel/ledger.json` was separately run **without `--write`** and exited 0. It does not establish rendered visual quality.
- `node scripts/ai-video-pipeline.mjs search-registry caption` completed and returned 17 matching component names. Those components were not all rendered or reviewed.

### Explicitly not run / not established

- YouTube search enumeration, video playback, transcript extraction or reference-frame review: **no access** under this session's network restrictions.
- REA runtime/MCP/provider execution, binary decompilation or live browser attachment: **not run**; selected source/documentation review only.
- Remotion TypeScript check, HyperFrames lint/runtime check, full project test suite: **not passed** in this environment.
- Real source-media probe/ASR, rendered captions, audio retiming/mixing, camera tracking, segmentation, CGI passes, export, full decode or full audiovisual review: **not run**.
- Model identity/capability comparison: **unverified**. No benchmark results are asserted.

Unit tests use synthetic timing data and validate the new planner only. They do not imply that the existing video stack is installed, that a renderer adapter exists, that the sample media exists, or that a finished video has been produced.
