#!/usr/bin/env bash
# fetch-quaternius.sh — CC0 animation assets (Quaternius / CGstuff) used by the DAVID film.
#
# These are the files actionforge.app publishes under assets/animation-library/. They are CC0
# public domain (see assets/quaternius/../../out/LICENSE-quaternius.txt for the verbatim notice
# and the licence boundary: the assets are free, the site's application code is not and is not
# used here). Re-running this script is safe and idempotent.
#
# Why a script rather than a plain curl: this sandbox can only reach github.com, so a small
# GitHub Actions job (removed after use) does the fetching and commits the files. If you are
# running somewhere with open network access, BASE below is the only thing you need.
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="https://actionforge.app/assets/animation-library"
CLIPS="a_tpose crouch_fwd_loop crouch_idle_loop dance_loop driving_loop fixing_kneeling hit_chest \
hit_head idle_loop idle_talking_loop idle_torch_loop interact jog_fwd_loop jump_land jump_loop \
jump_start pickup_table punch_cross punch_jab push_loop roll sitting_enter sitting_exit \
sitting_idle_loop sitting_talking_loop sprint_loop swim_fwd_loop swim_idle_loop sword_attack \
sword_block sword_idle walk_formal_loop walk_loop"
mkdir -p assets/quaternius/anim
echo "fetching rig..."
curl -fsSL "$BASE/rig/rig-human.glb" -o assets/quaternius/rig-human.glb
for n in $CLIPS; do
  printf '  %-22s' "$n"
  curl -fsSL "$BASE/animations/$n.glb" -o "assets/quaternius/anim/$n.glb" && echo "ok" || echo "FAILED"
done
echo "done: $(ls assets/quaternius/anim | wc -l) clips, rig $(wc -c < assets/quaternius/rig-human.glb) bytes"
