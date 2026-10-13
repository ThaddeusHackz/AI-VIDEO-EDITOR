---
name: rea-video-reverse-engineer
description: "Reverse-engineer any reference video, motion-graphics reel, website animation, WebGL shader, or desktop/mobile app effect using morluto/rea (`rea/`) + FFmpeg optical/scene analysis, and reconstruct it in HyperFrames or Remotion."
---

# REA Video & Animation Reverse-Engineering Workflow

When a user provides a reference video, YouTube/Higgsfield/Apple/Linear showcase, live website URL, or application binary and says *"make a video with this exact motion/VFX"*:

## 1. Deconstruct Reference Video Files (FFmpeg Scene & Frame Probe)

1. **Detect exact scene cuts and transition timestamps**:
   ```bash
   ffprobe -v error -show_frames -of compact=p=0 -f lavfi "movie=reference.mp4,select=gt(scene\,0.25)" | grep -o "pkt_pts_time=[0-9.]*"
   ```
2. **Extract high-cadence frame strip around a transition seam** (to measure velocity curve, blur radius, and Z-scale direction):
   ```bash
   ffmpeg -y -ss 00:00:02.00 -t 1.0 -i reference.mp4 -vf "fps=30,scale=640:-1,tile=6x5" seam-analysis.png
   ```
3. **Translate into a Vector Ledger (`ledger.json`)**:
   Record every cut timestamp, outgoing vector (`x`, `y`, `z` + scale sign), incoming vector, carrier element, and blur peak.

## 2. Reverse-Engineer Live Web Animations, Shaders & Apps with REA (`rea/`)

Use the integrated `rea/` (`github.com/morluto/rea`) toolkit and `skills/reverse-engineer-anything/SKILL.md` to inspect:
- **Websites & WebGL Shaders**: Extract GLSL vertex/fragment shaders, uniform timelines, GSAP/Framer Motion easing curves, and SVG paths from live pages or bundles.
- **Desktop / Electron / Mobile Apps**: Use REA's static JS/WASM/native analyzers (`rea/src/javascript`, `rea/src/wasm`, `rea/src/browser`) to recover exact UI layouts, animation springs, and design tokens.
- **Port to Deterministic Code**: Convert extracted animations into either a seek-safe HyperFrames `window.__timelines["main"]` composition or a pure-frame Remotion `<Composition />`.
