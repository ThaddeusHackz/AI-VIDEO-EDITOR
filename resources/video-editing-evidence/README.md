# Video-editing evidence & production resource pack

**Prepared 2026-10-14 · additive only · model-agnostic**

This directory supplements the existing project without replacing its files, installing dependencies, updating REA, changing agent registrations, or modifying render code. It provides a bounded source audit, practical production guides, an AI handoff, and a working offline rough-cut/caption-retiming tool.

## Research status — read before making claims

- **YouTube coverage: 0 videos watched, 0 transcripts retrieved, 0 search results enumerated.** YouTube is outside this session's network allowlist. The requested search pages and three video IDs are retained in [sources.json](sources.json), including the second video's **565-second / 09:25** entry point. No video titles, content summaries, effects, or model performance are invented.
- **REA:** selected upstream documentation and package metadata inspected at commit `3b79af28e80785afce9f5998d8f03289402a1847` (package version 6.5.0). The vendored `rea/package.json` declares 6.4.0; it was **not updated**. Neither version's live providers were run.
- **Model names:** “Claude Opus 5.5” and “GPT 6.1 Sol” are the supplied search labels. Their identities, release claims, tool access, and performance in those videos are **not independently verified by this audit**. Existing repository claims are not independent evidence.
- **No universal-generation guarantee:** instructions do not train an AI, supply missing footage, solve arbitrary camera tracks, install renderers, or guarantee production-quality CGI. A capable agent, authorized assets, functioning tools, compute, and review are still needed.
- “Forensic” here means provenance-conscious source/media analysis, **not** an infrastructure security scan or intrusion into YouTube. No probing of YouTube infrastructure was performed.

## Start here

| Resource | Purpose |
|---|---|
| [FINDINGS.md](FINDINGS.md) | Source-backed capability distinctions, gaps and environment limits |
| [TALKING_HEAD_WORKFLOW.md](TALKING_HEAD_WORKFLOW.md) | Real footage → transcript → editorial cut → graphics → sound → delivery |
| [VFX_CGI_WORKFLOW.md](VFX_CGI_WORKFLOW.md) | Choose 2D/2.5D/3D, track and light a shot, render passes, composite and review |
| [REA_REFERENCE_PROTOCOL.md](REA_REFERENCE_PROTOCOL.md) | Appropriate REA use, evidence capture and later video-review procedure |
| [EDIT_PLAN.md](EDIT_PLAN.md) | Exact contract and limitations of the new offline tool |
| [AGENT_HANDOFF.md](AGENT_HANDOFF.md) | Copyable instructions for the next coding/video agent |
| [templates/reference-observations.csv](templates/reference-observations.csv) | Empty reference-review ledger; deliberately contains no fabricated observations |
| [templates/cgi-shot.json](templates/cgi-shot.json) | Unfilled production shot brief with explicit unknowns |
| [sources.json](sources.json) | Requested references, coverage, source hashes and provenance |
| [VALIDATION.md](VALIDATION.md) | Checks actually run, blockers, preservation check |

## Run the added tool (no installation)

From the repository root, with Python 3.10+:

```bash
python3 resources/video-editing-evidence/tools/compile_edit.py \
  resources/video-editing-evidence/examples/talking-head.plan.json

PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover \
  -s resources/video-editing-evidence/tests -v
```

The sample is **synthetic**, not a transcript of any linked video and not linked to real media. It removes two source ranges, emits a contiguous 240-frame / 8-second rough-cut plan, retimes seven retained words, and reports two omitted words. It refuses cuts through words. It renders **nothing** and never opens a media path or makes a network request.

For a real job, copy the example to a new job workspace, populate verified source metadata and word timings, and inspect the compiled JSON. An agent must explicitly implement a renderer adapter; existing Remotion compositions do not consume this format automatically. Keep footage, masks, EXRs and renders out of Git (use the existing ignored `renders/` or external job storage).

## Existing resources to reuse, not duplicate

- [Production playbook](../../toolkit/AI_VIDEO_EDITOR_PLAYBOOK.md) and [brief template](../../toolkit/VIDEO_BRIEF_TEMPLATE.md).
- [Talking-head recut](../../skills/talking-head-recut/SKILL.md), [caption guidance](../../skills/captions-overlay/SKILL.md), [NLE guidance](../../skills/nle-video-editor-pro/SKILL.md).
- [Remotion guidance](../../skills/remotion-best-practices/SKILL.md), [HyperFrames guidance](../../skills/hyperframes/SKILL.md), [3D/VFX guidance](../../skills/cinematic-3d-vfx-cgi/SKILL.md).
- [REA's own routing guidance](../../skills/reverse-engineer-anything/SKILL.md), [browser documentation](../../rea/docs/browser-observation.md).
- Asset search: `node scripts/ai-video-pipeline.mjs search-registry caption` (or `chart`, `device`, `kinetic`). Source inspection is not render verification.

Treat numeric quality targets in these guides as project decisions, not universal laws. A motivated straight cut, a readable static hold, and a natural pause can be better than a whip-pan or perpetual animation. Preserve speaker meaning before optimizing spectacle.
