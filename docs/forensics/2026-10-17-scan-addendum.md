# Forensic Scan Addendum — 2026-10-17

Additive to the existing atlases. Evidence tier in brackets (A = official docs, B = official blog/demo, C = third-party test, D = creator video, E = inference).

## Gemini 4 Argon
- GA 2026-10-13 as `gemini-4-argon`; input text, image, video, audio, PDF; **output text only** [A]. It cannot render pixels itself — it writes code that renders.
- Agentic video understanding supported; up to ~1M token context and long-decode output [A].
- Demonstrated: procedural sculpt/rig/animate/PBR-bake via Python + Blender, Three.js + GLSL, shatter physics; a pure-Python ray tracer with its own video tool and audio mixer, voiced with Gemini TTS and Lyria music [B].
- Recommended 3D stack: Vite + Three.js + headless Blender MCP + headless browser screenshot loops; multi-agent visual critique [A].
- Third-party: 15–20 s motion-graphics MP4s in ~6–14 min at ~$0.44–0.80 per project; 1080p can time out [C].
- Use in this repo: footage reviewer, render critic, 3D/CGI code author.

## Higgsfield
- **Katana** (spelt Katana): a Higgsfield skill for Claude via Higgsfield MCP. Input: reference edit (own video or library preset) + up to 5 photos of characters/products/clothing + optional keep/change instructions. Output follows the reference's shot order, lengths and music-cut placement; lands in chat and Assets [B].
- **Genjutsu** (official spelling; "Genjitsu" is a common misspelling): reality manipulation — *Motion Transfer* (keep motion, rebuild cast/location/look) and *Object Swap* (swap characters, outfits, locations, objects while the rest stays as filmed) [B]. Chains with Katana inside the same MCP session.
- Also: Cinema Studio (virtual bodies/lenses, stacked camera moves), DOP, Keyframes, Soul / Soul ID / Soul HEX, Relight, Layers, 250+ VFX presets, camera-controls catalog, lip-sync audio, After Effects & Blender plugins, CLI, JS and Python SDKs, `higgsfield-ai/skills` [B/C].
- Hosts partner models (Seedance 2.x, Kling 3.0, Veo 3.1, Wan, Sora 2, Nano Banana) [B].

## HeyGen / HyperFrames
- Skills router `/hyperframes` plus workflows: `/product-launch-video`, `/faceless-explainer`, `/pr-to-video`, `/talking-head-recut` (lower-thirds, data callouts, kinetic titles, pull-quotes, side panels, PiP) [A].
- Works with Claude Code, Codex, Cursor, Gemini CLI. Recent release added an `audio` timing command (v0.8.160) [A].
- Reference productions: `heygen-com/hyperframes-launches`, `hyperframes-launch-video`.

## Creator workflows (YouTube)
- Opus 5.5 talking-head reel (Joseph | Video Editing): word-level transcript → remove silences and bad takes → 12 animations → captions → 106 SFX, no NLE [D]. Encoded in `skills/master-editor-protocol`.
- Opus 5.5 + Remotion + CapCut: Claude animates graphics, editor composites [D].
- GPT-6 Astra video (the link supplied as the GPT example): researched sources, HeyGen avatar + ElevenLabs voice, edit built in HyperFrames, ~50 min, ~\$60 API-equivalent [D].

## Gaps / not verified
- Search-results pages and full video frames could not be watched frame-by-frame; findings come from titles, descriptions and transcripts.
- No public evidence found of hidden Argon video-generation modes; treat claims otherwise as tier E.
