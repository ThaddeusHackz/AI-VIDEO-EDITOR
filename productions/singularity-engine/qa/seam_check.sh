#!/usr/bin/env bash
# Bundle qa/seam_check.ts with the esbuild that ships inside Remotion, then run it against the exact seam
# functions the film renders with (remotion/src/singularity/components/seamPose.ts).
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../../.." && pwd)"
REM="$ROOT/remotion"
ESBUILD="$(find "$REM/node_modules" -path "*/esbuild/bin/esbuild" -type f | head -1)"
OUT="$REM/out/seam_check.mjs"
mkdir -p "$REM/out"
"$ESBUILD" "$HERE/seam_check.ts" --bundle --platform=node --format=esm --external:remotion --outfile="$OUT" --log-level=warning
node "$OUT"
