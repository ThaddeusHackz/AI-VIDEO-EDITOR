#!/usr/bin/env bash
# Provenance-preserving asset fetch for the DAVID cinema build.
# Only the allow-listed hosts (api.github.com, registry.npmjs.org, pypi.org) are used.
#   - Mixamo mocap clips:  MisterYI/deevid-mixamo-assets      (Mixamo, free for commercial use)
#   - Paladin character:   kicknwing913/holtburg-assets       (Mixamo "Paladin J Nordstrom")
#   - Weapons / props:     trebeljahr/quaternius-showcase     (Quaternius CC0 medieval weapons pack)
#   - Universal rig libs:  Dallolz/moorfall-assets            (Quaternius CC0 UAL1/UAL2 + characters)
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
TOKEN=$(gh auth token)
gh_raw () { # repo, path, outfile
  curl -sS -f -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github.raw" \
    "https://api.github.com/repos/$1/contents/$2" -o "$3"
}
mkdir -p "$DIR/assets/anim" "$DIR/assets/chars" "$DIR/assets/props"
while read -r n; do
  [ -z "$n" ] && continue
  f="$DIR/assets/anim/$n.glb"
  [ -s "$f" ] && continue
  gh_raw MisterYI/deevid-mixamo-assets "anim/$n.glb" "$f" || { echo "MISS $n"; rm -f "$f"; }
done < <(grep -v '^#' "$DIR/assets/clips.txt" | grep -v '^$')
gh_raw kicknwing913/holtburg-assets "character/character_male.glb" "$DIR/assets/chars/paladin.glb" || true
# (the holtburg per-animation GLBs bake the same character into every file; retargeting makes them redundant)
for w in Sword_Golden Claymore Spear Shield_Round Shield_Heater Axe Hammer_Small Scythe Bow_Wooden Arrow; do
  [ -s "$DIR/assets/props/$w.glb" ] || gh_raw trebeljahr/quaternius-showcase "public/glb/medieval_weapons_pack/$w.glb" "$DIR/assets/props/$w.glb" || true
done
[ -s "$DIR/assets/chars/Superhero_Male.glb" ] || gh_raw Dallolz/moorfall-assets "characters/Superhero_Male.glb" "$DIR/assets/chars/Superhero_Male.glb" || true
[ -s "$DIR/assets/chars/Superhero_Female.glb" ] || gh_raw Dallolz/moorfall-assets "characters/Superhero_Female.glb" "$DIR/assets/chars/Superhero_Female.glb" || true
echo "assets: $(ls "$DIR/assets/anim" | wc -l) clips, $(ls "$DIR/assets/chars" | wc -l) characters, $(ls "$DIR/assets/props" | wc -l) props"
