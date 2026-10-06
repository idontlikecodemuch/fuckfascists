#!/usr/bin/env bash
# Copies the repo's own brand art and fonts into public/assets and public/fonts (gitignored).
# Why copies: Remotion's static server won't serve a FILE symlink (directory symlinks like
# public/media are fine), and git-tracked copies were 4.4 MB of duplicates of assets/.
# Idempotent; render.sh and appstore.sh call this first.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(cd ../../.. && pwd)
mkdir -p public/assets public/fonts
put() { [ -f "$ROOT/$1" ] || { echo "missing $ROOT/$1" >&2; exit 1; }; rm -f "$2"; cp "$ROOT/$1" "$2"; }
put assets/pixel/brand/FF_logo.png          public/assets/FF_logo.png
put assets/pixel/brand/icon.png             public/assets/icon.png
put assets/pixel/starbg/star_field_base.png public/assets/star_field_base.png
for i in 0 1 2 3; do put assets/pixel/ui/cash_$i.png public/assets/cash_$i.png; done
for f in Bungee-Regular IBMPlexSans-Regular IBMPlexSans-Medium IBMPlexSans-SemiBold; do put assets/fonts/$f.ttf public/fonts/$f.ttf; done
# Ionicons.ttf is tracked here (it comes from node_modules/@expo/vector-icons at the repo root)
