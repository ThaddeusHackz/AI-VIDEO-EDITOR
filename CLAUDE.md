# CLAUDE.md — Instructions for Claude Opus 5.5 & Claude Code

Read [`AGENTS.md`](AGENTS.md) and [`skills/opus-gpt-director/SKILL.md`](skills/opus-gpt-director/SKILL.md) before authoring or editing any video composition.

## Quick Reference

- **Toolchain Doctor**: `./bin/ai-video doctor`
- **Full Verification**: `./bin/ai-video verify`
- **All 47 Skills**: `.claude/skills/<skill-name>/SKILL.md` (canonical source in `skills/<skill-name>/SKILL.md`)
- **Remotion Engine**: `remotion/src/engine/` (`cameraRig.tsx`, `seamTransitions.ts`, `vfxShaders.tsx`, `nleTrackEngine.tsx`)
- **HyperFrames DoP Camera Engine**: `toolkit/vendor/camera-dop.js`
- **HyperFrames Registry**: `registry/blocks/` (210 blocks) & `registry/components/` (237 components), cached offline in `.hyperframes/cache/`
- **REA Reverse-Engineering Studio**: `rea/` (`skills/rea-video-reverse-engineer/SKILL.md`)
