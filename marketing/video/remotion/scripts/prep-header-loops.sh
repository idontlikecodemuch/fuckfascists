#!/usr/bin/env bash
# Slow, seamless 15 s clips for the phones in the App Store header loops (creator, Oct 16: "short
# slow video clips for the screenshots in the video"). Each is 450 frames @ 30 fps, 1080×1926 (the
# "phone" crop: status bar and tab bar off), played forward slowed down for 7.5 s, then reversed —
# so frame 450 meets frame 0 and the phones never jump at the loop seam.
set -euo pipefail
SRC=${SRC:-/Users/christophershannon/fuckfascists/marketing/video/captures}
CLIPS=${CLIPS:-/Users/christophershannon/fuckfascists/marketing/video/clips}
R6=$SRC/R6_scan_phone.mp4
enc=(-c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart -an)
# map: the pins clip (zoom + tap, 4.0 s) at 0.53× → 7.5 s, then back
ffmpeg -nostdin -v error -y -i "$CLIPS/60_03_map_pins.mp4" -filter_complex \
  "[0:v]setpts=1.875*PTS,fps=30,trim=end_frame=225,setpts=PTS-STARTPTS,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,trim=end_frame=450,setpts=PTS-STARTPTS[v]" \
  -map "[v]" "${enc[@]}" "$CLIPS/loop_map.mp4"
# scan: the Coke bottle drifting into the guide (R6 15.6–17.25) at 0.22× → 7.5 s, then back
ffmpeg -nostdin -v error -y -ss 15.6 -t 1.65 -i "$R6" -filter_complex \
  "[0:v]crop=1206:2150:0:144,scale=1080:-2:flags=lanczos,setpts=4.545*PTS,fps=30,trim=end_frame=225,setpts=PTS-STARTPTS,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1:a=0,trim=end_frame=450,setpts=PTS-STARTPTS[v]" \
  -map "[v]" "${enc[@]}" "$CLIPS/loop_scan.mp4"
for c in loop_map loop_scan; do printf '%s\t%s frames\t%s\n' "$c" "$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 "$CLIPS/$c.mp4")" "$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "$CLIPS/$c.mp4")"; done
