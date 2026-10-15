#!/usr/bin/env bash
# The 1.2.1 CEO sprites and the red "no sprite" X live on the release branch, not on this
# marketing branch, so they are pulled straight out of git (no checkout, no copies in the
# branch) into public/assets/sprites/ (gitignored). Called by link-assets.sh.
#   SPRITE_REF=origin/release/1.2.1 (default) — switch to main once 1.2.1 has merged.
set -euo pipefail
cd "$(dirname "$0")/.."
REF=${SPRITE_REF:-origin/release/1.2.1}
OUT=public/assets/sprites
mkdir -p "$OUT"
git show "$REF:assets/pixel/sprites/manifest.json" > "$OUT/manifest.json"
cp "$OUT/manifest.json" src/data/spriteManifest.json
git show "$REF:assets/pixel/scorecard/no_sprite_x.png" > public/assets/no_sprite_x.png
n=0
for f in $(git ls-tree --full-tree --name-only "$REF" -- assets/pixel/sprites/ | grep '\.png$'); do
  b=$(basename "$f")
  [ -s "$OUT/$b" ] || { git show "$REF:$f" > "$OUT/$b"; n=$((n+1)); }
done
echo "sprites: $(ls "$OUT"/*.png | wc -l | tr -d ' ') sheets ready ($n new) from $REF; X at public/assets/no_sprite_x.png"
