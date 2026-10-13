#!/usr/bin/env bash
# ============================================================================
#  setup-toolchain.sh — rebuild the whole programmatic-video toolchain
#
#  Two independent engines are installed:
#    • HyperFrames  — HTML/CSS + GSAP  → frames → MP4   (deterministic seek engine)
#    • Remotion     — React/TSX        → frames → MP4   (bundled browser+ffmpeg)
#
#  WHY THIS SCRIPT EXISTS
#  ----------------------
#  This sandbox only persists files under /home/user. apt packages (/usr/bin),
#  npm globals (/opt) and downloads (~/.cache) are WIPED between sessions. So
#  "keeping the tools installed" cannot survive on its own — the durable
#  equivalent is this script. Run it at the start of a session. ~35 s cold.
#
#  USAGE
#    bash /home/user/setup-toolchain.sh              # both engines
#    bash /home/user/setup-toolchain.sh --with-asr   # + Parakeet transcription
#    bash /home/user/setup-toolchain.sh --hf-only    # HyperFrames only
#    bash /home/user/setup-toolchain.sh --remotion-only
#
#    source /home/user/hf-env.sh                     # then load the env
# ============================================================================
set -u
export DEBIAN_FRONTEND=noninteractive

WITH_ASR=0; DO_HF=1; DO_REM=1
for arg in "$@"; do
  case "$arg" in
    --with-asr)     WITH_ASR=1 ;;
    --hf-only)      DO_REM=0 ;;
    --remotion-only) DO_HF=0 ;;
  esac
done

say() { printf "\n\033[1m== %s\033[0m\n" "$1"; }

# ── 1. system packages ──────────────────────────────────────────────────────
say "system packages (ffmpeg + Chrome shared libraries)"
if command -v ffmpeg >/dev/null 2>&1; then
  echo "   ffmpeg already present"
else
  sudo apt-get update -qq
  sudo apt-get install -y -qq ffmpeg \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libatspi2.0-0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 unzip >/dev/null
  echo "   installed ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
fi

# ── 2. Node 22 ──────────────────────────────────────────────────────────────
# HyperFrames requires >=22; Remotion needs >=16. Node 22 satisfies both.
say "Node.js 22"
if [ -x /opt/hfnode/bin/node ]; then
  echo "   already present: $(/opt/hfnode/bin/node --version)"
else
  cd /tmp
  curl -fsSL -o n22.tar.xz https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.xz
  sudo mkdir -p /opt/hfnode
  sudo tar -xf n22.tar.xz -C /opt/hfnode --strip-components=1
fi
export PATH="/opt/hfnode/bin:$PATH"
echo "   node $(node --version) · npm $(npm --version)"

# ── 3. HyperFrames ──────────────────────────────────────────────────────────
if [ "$DO_HF" = "1" ]; then
  say "HyperFrames CLI"
  if command -v hyperframes >/dev/null 2>&1; then
    echo "   already present: $(hyperframes --version)"
  else
    npm i -g hyperframes --no-fund --no-audit >/dev/null 2>&1
    echo "   installed $(hyperframes --version)"
  fi

  say "Chrome Headless Shell (shared with Remotion)"
  if ls ~/.cache/hyperframes/chrome/chrome-headless-shell/*/chrome-headless-shell-linux64/chrome-headless-shell >/dev/null 2>&1; then
    echo "   already present"
  else
    hyperframes browser ensure 2>&1 | tail -2
  fi

  if [ "$WITH_ASR" = "1" ]; then
    say "Parakeet ASR (word-level transcription for subtitles)"
    hyperframes models install parakeet 2>&1 | tail -2
  fi
fi

# ── 4. Remotion ─────────────────────────────────────────────────────────────
if [ "$DO_REM" = "1" ]; then
  say "Remotion"
  if [ -d /home/user/remotion/node_modules/remotion ]; then
    echo "   dependencies already installed"
  else
    if [ ! -d /home/user/remotion ]; then
      echo "   !! /home/user/remotion not found — create the project first" >&2
    else
      cd /home/user/remotion
      npm install --no-fund --no-audit 2>&1 | tail -3
    fi
  fi
  if [ -f /home/user/remotion/node_modules/.bin/remotion ]; then
    echo "   remotion $(node -p "require('/home/user/remotion/node_modules/remotion/package.json').version" 2>/dev/null)"
    echo "   studio : cd /home/user/remotion && npx remotion studio"
    echo "   render : cd /home/user/remotion && npx remotion render src/index.ts <id> out/<id>.mp4"
  fi
fi

# ── 5. verify ───────────────────────────────────────────────────────────────
say "verification"
if [ "$DO_HF" = "1" ]; then
  echo "── HyperFrames doctor ──"
  hyperframes doctor 2>&1 | grep -E "✓|✗" | head -10
fi
if [ "$DO_REM" = "1" ] && [ -d /home/user/remotion/node_modules ]; then
  echo ""
  echo "── Remotion compositions ──"
  ( cd /home/user/remotion && npx remotion compositions src/index.ts 2>&1 | tail -8 )
fi

cat <<'EOF'

--------------------------------------------------------------------------
Toolchain ready. Load the environment first:

    source /home/user/hf-env.sh

ENGINE 1 — HyperFrames (HTML/CSS + GSAP)
    cd <project> && hyperframes lint
    hyperframes snapshot . --at 2,10,30 -o snaps        # fast stills
    hyperframes render -o renders/out.mp4 -f 30 -q looks --video-bitrate 3M

ENGINE 2 — Remotion (React/TSX)
    cd /home/user/remotion
    npx remotion studio                                  # live preview
    npx remotion compositions src/index.ts               # list targets
    npx remotion render src/index.ts TitleCard out/title.mp4
    npx remotion still  src/index.ts TitleCard out/thumb.png --frame=120

Shared assets: /home/user/toolkit/
    fonts/  → Inter, Cinzel, Cormorant Garamond, JetBrains Mono, Space Grotesk
    vendor/ → gsap.min.js   (vendor locally; never fetch a CDN at render time)
EOF
