#!/usr/bin/env bash
# Renders the explainer cuts with Remotion's Chrome Headless Shell (downloaded once into
# node_modules/.remotion by `npx remotion browser ensure`; ~95 MB from Google's builds).
#
# Do NOT point this at the installed Google Chrome (--browser-executable). Chrome 132+
# dropped the old headless mode, so Remotion ends up screenshotting a GPU-rasterized page
# and a few frames per render come back tiled, blank or half-painted
# (remotion-dev/remotion#11428; the fix in 4.0.527 is Lambda-only). The shell rasterizes
# in software and renders clean, and faster. Every output is checked frame by frame by
# scripts/framecheck.py; a flagged frame fails the script.
#
#   scripts/render.sh            → 60, 30, 15
#   scripts/render.sh wide       → 60 wide + the smaller -review.mp4 for phones
#   scripts/render.sh preview    → half-scale 60 + contact sheet
#   scripts/render.sh 60|30|15
#   scripts/render.sh shorts     → one per tab: fck-short-{map,track,scan,card}-9x16.mp4
#   scripts/render.sh check      → re-run the frame check on the existing renders
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/link-assets.sh
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/video/renders}
mkdir -p "$OUT"
# bt709 = standard limited-range tags; the default writes full-range yuvj420p, which some players mishandle
common=(--chrome-mode headless-shell --codec h264 --crf 18 --color-space bt709 --log warn)

render() { # <compId> <outfile> [extra args]
  local id=$1 out=$2; shift 2
  npx remotion render src/index.ts "$id" "$out" "${common[@]}" "$@"
  printf '%s\t%s s\n' "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")"
  python3 scripts/framecheck.py "$out"
}
review() { # phone-sized copy of the wide (the full crf-18 file is over the 30 MB share limit)
  ffmpeg -v error -y -i "$OUT/fck-explainer-60-16x9.mp4" -c:v libx264 -crf 23 -preset medium -movflags +faststart -c:a copy "$OUT/fck-explainer-60-16x9-review.mp4"
  ls -la "$OUT/fck-explainer-60-16x9-review.mp4"
}

what=${1:-all}
[ "$what" = check ] || npx remotion browser ensure --log error
case $what in
  preview)
    render Master60 "$OUT/preview-60-half.mp4" --scale 0.5
    ffmpeg -v error -y -i "$OUT/preview-60-half.mp4" -vf "fps=1/3,scale=180:-1,tile=10x2:padding=4:color=0x070B12" -frames:v 1 -q:v 3 "$OUT/preview-60-sheet.jpg"
    echo "$OUT/preview-60-sheet.jpg";;
  60)   render Master60 "$OUT/fck-explainer-60-9x16.mp4";;
  30)   render Cut30    "$OUT/fck-explainer-30-9x16.mp4";;
  15)   render Cut15    "$OUT/fck-explainer-15-9x16.mp4";;
  wide) render Wide60   "$OUT/fck-explainer-60-16x9.mp4"; review;;
  shorts)
    render ShortMap   "$OUT/fck-short-map-9x16.mp4"
    render ShortTrack "$OUT/fck-short-track-9x16.mp4"
    render ShortScan  "$OUT/fck-short-scan-9x16.mp4"
    render ShortCard  "$OUT/fck-short-card-9x16.mp4";;
  all)
    render Master60 "$OUT/fck-explainer-60-9x16.mp4"
    render Cut30    "$OUT/fck-explainer-30-9x16.mp4"
    render Cut15    "$OUT/fck-explainer-15-9x16.mp4";;
  card) render ShortCard "$OUT/fck-short-card-9x16.mp4";;
  check)
    python3 scripts/framecheck.py "$OUT"/fck-explainer-*.mp4 "$OUT"/fck-short-*.mp4;;
  *) echo "usage: $0 [all|wide|shorts|preview|60|30|15|card|check]" >&2; exit 1;;
esac
