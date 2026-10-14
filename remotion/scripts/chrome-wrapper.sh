#!/usr/bin/env bash
# Chrome launcher for Remotion renders in a bare Linux sandbox (no system Chrome, no GPU).
# - Extracts @sparticuz/chromium on first use (binary -> /tmp/chromium, libs -> /tmp/al2023/lib)
# - Forces software WebGL (ANGLE + SwiftShader) so three.js scenes render headlessly
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ ! -x /tmp/chromium ]; then
  (cd "$HERE/.." && node "$HERE/chrome-path.cjs" >/dev/null)
fi
export LD_LIBRARY_PATH="/tmp/al2023/lib:${LD_LIBRARY_PATH:-}"
export FONTCONFIG_PATH="${FONTCONFIG_PATH:-/tmp/fonts}"
export FONTCONFIG_FILE="${FONTCONFIG_FILE:-/tmp/fonts/fonts.conf}"
exec /tmp/chromium \
  --no-sandbox --no-zygote --disable-dev-shm-usage \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader \
  --ignore-gpu-blocklist --enable-webgl --disable-gpu-sandbox \
  --allow-pre-commit-input --disable-background-timer-throttling \
  "$@"
