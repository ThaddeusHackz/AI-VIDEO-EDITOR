# ============================================================================
#  HyperFrames environment — `source /home/user/hf-env.sh` before working.
#
#  Rebuilt by: bash /home/user/setup-hyperframes.sh
# ============================================================================

# Node 22 (repo requires >=22; the sandbox default is Node 20)
export PATH="/opt/hfnode/bin:$PATH"

# ---------------------------------------------------------------------------
# Caches. Everything here lives under ~/.cache, which is EXCLUDED from
# workspace snapshots — so a 261 MB browser and multi-hundred-MB temp frames
# never count against the 128 MB save budget.
#
# Note: the sandbox's /tmp is a separate 993 MB tmpfs. Pointing temp work at
# ~/.cache instead gives us the roomy system disk AND snapshot exclusion.
# ---------------------------------------------------------------------------
export HYPERFRAMES_EXTRACT_CACHE_DIR="$HOME/.cache/hf-extract"
export TMPDIR="$HOME/.cache/hf-tmp"
export TMP="$HOME/.cache/hf-tmp"
export TEMP="$HOME/.cache/hf-tmp"

# Chrome: leave PUPPETEER_CACHE_DIR unset so it uses the default
# ~/.cache/hyperframes/chrome (also snapshot-excluded).

# Low-memory sandbox (2 cores / 1.9 GB): keep renders serial
export PRODUCER_MAX_WORKERS=1

mkdir -p "$HYPERFRAMES_EXTRACT_CACHE_DIR" "$TMPDIR"
