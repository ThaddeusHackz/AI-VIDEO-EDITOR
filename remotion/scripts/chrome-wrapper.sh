#!/usr/bin/env bash
# Chromium launcher for Remotion inside the sandbox:
#  - binary + shared libs come from @sparticuz/chromium (npm), see scripts/chrome-path.cjs
#  - forces the flags the sandbox needs (no setuid sandbox, no zygote, software GL)
export LD_LIBRARY_PATH="/tmp/al2023/lib:${LD_LIBRARY_PATH:-}"
export FONTCONFIG_PATH="/tmp/fonts"
exec /tmp/chromium --no-sandbox --disable-setuid-sandbox --no-zygote --disable-gpu --disable-dev-shm-usage --use-gl=angle --use-angle=swiftshader --disable-features=AudioServiceOutOfProcess "$@"
