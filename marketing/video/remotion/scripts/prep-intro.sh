#!/usr/bin/env bash
# Opening-screen footage for the intro's second scene (full-bleed vertical):
#   intro_opening  Welcome → (PRESS START) → Clark's memo ("No Accounts. No Tracking.")
#   intro_welcome  Welcome only (the 30's single intro line)
# Source: captures/R1-R2_onboarding_…mp4 (memo cuts in at 25.0 s). Status bar cropped.
set -euo pipefail
M=${M:-/Users/christophershannon/fuckfascists/marketing/video}
SRC="$M/captures/R1-R2_onboarding_welcome-clark-memo-permissions-launch.mp4"
vf="crop=1206:2478:0:144,scale=1080:-2:flags=lanczos,fps=30,format=yuv420p"
ffmpeg -v error -y -ss 23.9 -to 28.9 -i "$SRC" -an -vf "$vf" -c:v libx264 -crf 18 -preset medium -movflags +faststart "$M/clips/intro_opening.mp4"
ffmpeg -v error -y -ss 18.6 -to 24.6 -i "$SRC" -an -vf "$vf" -c:v libx264 -crf 18 -preset medium -movflags +faststart "$M/clips/intro_welcome.mp4"
for c in intro_opening intro_welcome; do printf '%s\t%s s\n' "$c" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$M/clips/$c.mp4")"; done
