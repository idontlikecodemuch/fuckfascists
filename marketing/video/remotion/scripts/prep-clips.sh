#!/usr/bin/env bash
# Pre-trims every capture segment the explainer uses into marketing/video/clips/.
# Output: H.264, 30 fps, yuv420p, faststart, no audio. Status bar (top 5.5%) is
# always cropped; phone clips also drop the bottom 12.5% (tab bar w/ DEV tab),
# "phonedev" clips drop the bottom 23% (DEV TOOLS panel under the scorecard
# preview), "full" clips keep everything below the status bar for full-bleed.
# See clips/CLIPS.md for the table this script produces.
set -euo pipefail
SRC=${SRC:-/Users/christophershannon/fuckfascists/marketing/video/captures}
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/video/clips}
mkdir -p "$OUT"
R3=$SRC/R3_map_tap-pin-card-avoid.mp4
R12=$SRC/R1-R2_onboarding_welcome-clark-memo-permissions-launch.mp4
R5C=$SRC/R5c_track_backtaps-then-today-defeat.mp4
R6=$SRC/R6_scan_phone.mp4
R8=$SRC/R8_scorecard_preview-generate-reveal-moneyrain-share.mp4

filt() { # <mode>
  case $1 in
    phone)    echo "crop=1206:2150:0:144,scale=1080:-2:flags=lanczos";;
    phonedev) echo "crop=1206:1880:0:144,scale=1080:-2:flags=lanczos";;
    full)     echo "crop=1206:2478:0:144,scale=1080:-2";;
    *) echo "bad mode $1" >&2; exit 1;;
  esac
}

# mk <out> <mode> <speed> <src> <start> <dur> [<src> <start> <dur> ...]
mk() {
  local out=$1 mode=$2 speed=$3; shift 3
  local f; f=$(filt "$mode")
  local inputs=() fc="" n=0
  while [ $# -gt 0 ]; do
    inputs+=(-ss "$2" -t "$3" -i "$1")
    fc+="[$n:v]$f,setpts=(PTS-STARTPTS)/$speed,fps=30[v$n];"
    n=$((n+1)); shift 3
  done
  local cat=""; local i; for ((i=0;i<n;i++)); do cat+="[v$i]"; done
  fc+="${cat}concat=n=$n:v=1:a=0[v]"
  ffmpeg -nostdin -v error -y "${inputs[@]}" -filter_complex "$fc" -map "[v]" -an \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart "$OUT/$out.mp4"
  printf '%s\t%s\n' "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$out.mp4")"
}

# still <out.png> <mode> <src> <t>
still() {
  local f; f=$(filt "$2")
  ffmpeg -nostdin -v error -y -ss "$4" -i "$3" -frames:v 1 -vf "$f" "$OUT/$1"
  echo "$1"
}

# ---- shared ----------------------------------------------------------------
mk hook_card_rain      full  1   "$R8" 95.4 2.2 &
still map_still.png      phone    "$R3" 45.0 &
still preview_still.png  phonedev "$R8" 93.9 &
# ---- 60 --------------------------------------------------------------------
mk 60_03_map_pins      phone 1   "$R3" 44.9 2.8 &
mk 60_04_map_card      phone 1   "$R3" 47.5 4.6 &
mk 60_05_map_avoid     phone 1   "$R3" 74.8 3.3 &
wait
mk 60_06_track_grid    phone 1   "$R12" 139.6 1.7  "$R12" 141.3 3.4 &
mk 60_07_track_week    phone 1   "$R5C" 5.1 1.5    "$R5C" 19.6 1.5  "$R5C" 26.1 1.7 &
mk 60_08_track_defeat  phone 1   "$R5C" 33.2 3.0 &
mk 60_09_scan_camera   phone 1   "$R6" 13.4 1.3    "$R6" 15.6 2.0 &
mk 60_10_scan_card     phone 1   "$R6" 17.5 1.8    "$R6" 21.5 1.7 &
mk 60_11_scorecard_preview phonedev 1 "$R8" 88.0 4.0 &
wait
mk 60_12_drop          full  1   "$R8" 94.0 4.6 &
mk 60_13_share         full  1   "$R8" 124.0 0.7   "$R8" 127.2 1.7 &
# ---- 30 --------------------------------------------------------------------
mk 30_03_map           phone 1   "$R3" 46.4 2.4    "$R3" 74.9 3.3 &
mk 30_04_track         phone 1   "$R12" 140.5 1.8  "$R5C" 5.1 1.1   "$R5C" 33.3 2.0 &
mk 30_05_scan          phone 1   "$R6" 16.2 1.3    "$R6" 17.5 2.8 &
mk 30_06_drop          full  1   "$R8" 94.1 3.2    "$R8" 124.0 0.7  "$R8" 127.3 1.3 &
wait
# ---- 15 --------------------------------------------------------------------
mk 15_02_tap           phone 1   "$R3" 74.6 3.3 &
mk 15_03_trackscan     phone 1   "$R5C" 33.4 1.5   "$R6" 17.5 1.7 &
mk 15_04_drop          full  1   "$R8" 94.1 3.3    "$R8" 124.0 0.7  "$R8" 127.3 0.7 &
wait
echo ALL_CLIPS_DONE
