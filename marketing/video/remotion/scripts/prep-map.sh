#!/usr/bin/env bash
# Map beats re-cut from the NYC browsing capture (R3c): pinch-zoom into Rockefeller
# Center, tap McDonald's, the card, the AVOID stamp. Same output conventions as
# prep-clips.sh (phone crop, 800 px wide, 30 fps, H.264, no audio).
set -euo pipefail
SRC=${SRC:-/Users/christophershannon/fuckfascists/marketing/video/captures}
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/video/clips}
R3C=$SRC/R3c_map_nyc_browse-pan-tap.mp4
f="crop=1206:2150:0:144,scale=1080:-2:flags=lanczos"
mk() { # <out> <src> <start> <dur> [<src> <start> <dur> ...]
  local out=$1; shift
  local inputs=() fc="" n=0
  while [ $# -gt 0 ]; do
    inputs+=(-ss "$2" -t "$3" -i "$1")
    fc+="[$n:v]$f,setpts=(PTS-STARTPTS),fps=30[v$n];"
    n=$((n+1)); shift 3
  done
  local cat=""; local i; for ((i=0;i<n;i++)); do cat+="[v$i]"; done
  fc+="${cat}concat=n=$n:v=1:a=0[v]"
  ffmpeg -nostdin -v error -y "${inputs[@]}" -filter_complex "$fc" -map "[v]" -an \
    -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart "$OUT/$out.mp4"
  printf '%s\t%s s\n' "$out" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$out.mp4")"
}
mk 60_03_map_pins   "$R3C" 157.6 2.8  "$R3C" 192.9 1.2   # pinch-zoom + pins → tap
mk 60_04_map_card   "$R3C" 194.1 3.9                       # McDonald's card rises, holds
mk 60_05_map_avoid  "$R3C" 219.9 2.8                       # AVOID → stamp (+0.85) → dismiss → green pin
mk 30_03_map        "$R3C" 193.0 1.9  "$R3C" 219.9 3.1    # tap → card → AVOID stamp (+2.75)
mk 15_02_tap        "$R3C" 219.3 3.0                       # card up → AVOID stamp (+1.45)
