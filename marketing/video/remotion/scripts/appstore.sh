#!/usr/bin/env bash
# App Store 1.2 assets from the Sep 21–26 captures (v1.1.0 build 9 code; Track/Scan UI unchanged in 1.2,
# and the store never shipped 1.1):
#   scripts/appstore.sh prep     → frames (7 stills) + the two scorecard phone-crop clips
#   scripts/appstore.sh tiles    → seven 1320×2868 PNG tiles (6.9" iPhone)
#   scripts/appstore.sh preview  → the 886×1920 app preview (H.264, 30 fps, ~19 s)
#   scripts/appstore.sh          → all three
# Same render rule as render.sh: Remotion's Chrome Headless Shell, never local Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."
bash scripts/link-assets.sh
SRC=${SRC:-/Users/christophershannon/fuckfascists/marketing/video/captures}
MEDIA=${MEDIA:-/Users/christophershannon/fuckfascists/marketing/video/appstore}
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/appstore/1.2}
R8=$SRC/R8_scorecard_preview-generate-reveal-moneyrain-share.mp4

frame() { ffmpeg -nostdin -v error -ss "$2" -i "$SRC/$1" -frames:v 1 -y "$MEDIA/frames/$3.png"; }
clip() { # <out> <src> <start> <dur> [...] — phone crop (no status bar, no tab bar), 1080 wide, 30 fps
  local out=$1; shift
  local f="crop=1206:2150:0:144,scale=1080:-2:flags=lanczos" inputs=() fc="" n=0 cat="" i
  while [ $# -gt 0 ]; do
    inputs+=(-ss "$2" -t "$3" -i "$1"); fc+="[$n:v]$f,setpts=(PTS-STARTPTS),fps=30[v$n];"; n=$((n+1)); shift 3
  done
  for ((i=0;i<n;i++)); do cat+="[v$i]"; done
  ffmpeg -nostdin -v error -y "${inputs[@]}" -filter_complex "${fc}${cat}concat=n=$n:v=1:a=0[v]" -map "[v]" -an \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart "$MEDIA/clips/$out.mp4"
  printf '%s\t%s s\n' "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$MEDIA/clips/$out.mp4")"
}

prep() {
  mkdir -p "$MEDIA/frames" "$MEDIA/clips"
  frame R8_scorecard_preview-generate-reveal-moneyrain-share.mp4 96.2 drop        # card up, money rain
  frame R3c_map_nyc_browse-pan-tap.mp4 196.5 map_card                              # McDonald's record
  frame R3c_map_nyc_browse-pan-tap.mp4 221.0 map_avoid                             # AVOIDED stamp + money
  frame R5c_track_backtaps-then-today-defeat.mp4 36.5 track                        # Musk defeated, 12× this week
  frame R1-R2_onboarding_welcome-clark-memo-permissions-launch.mp4 40.0 memo       # HOW TO: FCK memo
  frame R10_info_about-privacy-scroll.mp4 8.0 privacy                              # Info plaque + Built to Last
  # Scan came off a real phone (clock + recording dot): simulator 9:41 strip over the phone take's body
  frame R6_scan_phone.mp4 18.5 scan_raw                                            # Coca-Cola record
  ffmpeg -nostdin -v error -y -i "$MEDIA/frames/privacy.png" -i "$MEDIA/frames/scan_raw.png" \
    -filter_complex "[0:v]crop=1206:162:0:0[top];[1:v]crop=1206:2460:0:162[body];[top][body]vstack" "$MEDIA/frames/scan.png"
  rm "$MEDIA/frames/scan_raw.png"
  clip drop_phone  "$R8" 94.15 4.45                    # loader → gold reveal → card → rain
  clip share_phone "$R8" 124.0 0.7  "$R8" 127.2 2.3    # swipe up → share sheet, holds
}

tiles() {
  mkdir -p "$OUT/screenshots-6.9"
  npx remotion browser ensure --log error
  # composition ids mirror TILES in src/appstore/tiles.ts: Tile-<nn>-<id>
  local n=0 id
  for slug in $(grep -o "^    id: '[a-z-]*'" src/appstore/tiles.ts | sed "s/.*'\(.*\)'/\1/"); do
    n=$((n+1)); id=$(printf 'Tile-%02d-%s' "$n" "$slug")
    npx remotion still src/index.ts "$id" "$OUT/screenshots-6.9/${id#Tile-}.png" --chrome-mode headless-shell --log warn
    printf '%s\t%s\n' "${id#Tile-}.png" "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$OUT/screenshots-6.9/${id#Tile-}.png")"
  done
}

preview() {
  mkdir -p "$OUT"
  npx remotion browser ensure --log error
  local out="$OUT/fck-app-preview-886x1920.mp4"
  npx remotion render src/index.ts AppPreview "$out" --chrome-mode headless-shell --codec h264 --crf 18 --color-space bt709 --log warn
  printf '%s\t%s s\n' "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out")"
  python3 scripts/framecheck.py "$out"
}

case ${1:-all} in
  prep) prep ;;
  tiles) tiles ;;
  preview) preview ;;
  all) prep; tiles; preview ;;
  *) echo "usage: $0 [prep|tiles|preview|all]" >&2; exit 2 ;;
esac
