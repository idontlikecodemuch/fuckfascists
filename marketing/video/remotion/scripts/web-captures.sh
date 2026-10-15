#!/usr/bin/env bash
# Writes src/data/webCaptures.json (file, pixel size) for the tall web-page screenshots in
# marketing/video/captures/1.2.1/web-<key>.jpg|png, which Release.tsx pans as "scrolling".
set -euo pipefail
cd "$(dirname "$0")/.."
DIR=/Users/christophershannon/fuckfascists/marketing/video/captures/1.2.1
{
  echo '{'
  first=1
  for f in "$DIR"/web-*.jpg "$DIR"/web-*.png; do
    [ -e "$f" ] || continue
    key=$(basename "$f"); key=${key#web-}; key=${key%.*}
    w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/ {print $2}'); h=$(sips -g pixelHeight "$f" | awk '/pixelHeight/ {print $2}')
    [ $first = 1 ] || echo ','
    first=0
    printf '  "%s": { "file": "media/captures/1.2.1/%s", "w": %s, "h": %s }' "$key" "$(basename "$f")" "$w" "$h"
  done
  echo; echo '}'
} > src/data/webCaptures.json
cat src/data/webCaptures.json
