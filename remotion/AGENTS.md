# Instructions for coding agents working in this Remotion project

Before changing video code, read:

1. [`README.md`](./README.md) for the local toolchain and project structure.
2. [`../toolkit/AI_VIDEO_EDITOR_PLAYBOOK.md`](../toolkit/AI_VIDEO_EDITOR_PLAYBOOK.md) for the creative-direction, deterministic-animation, and QA standard.

## Working rules

- Inspect the current project, package versions, composition IDs, and asset paths before editing. Do not assume the previous build state or reuse a stale output.
- Prefer one primary renderer per video. For Remotion, use `useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, and/or `spring()`; make every frame deterministic and safe to render out of order. Avoid wall-clock timing, browser-driven CSS animation, timers, and unseeded randomness.
- Ensure assets and fonts are ready before a frame is captured. Use the current Remotion APIs and official docs when version-specific behavior is unclear.
- Before a full render, run project/type checks, list compositions, render representative stills, and inspect them. After rendering, inspect full playback and audio, probe metadata, and decode the entire output.
- Preserve shared toolkit assets and existing project sources unless the user explicitly requests a change. Keep new files inside the project or the user-requested location.
- Do not claim files were uploaded to Google Drive; the user must download and upload manually.
- `/home/user/AI VIDEO EDITS/` was intentionally deleted. Do not recreate that handoff or its deliverables unless the user asks.
