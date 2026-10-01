#!/usr/bin/env bash
# 16:9 "in context" Clark scenes for the wide intro: clips/clark/scene/<id>.mp4
# (H.264 1080p30 with its own audio) + vo/wide/<id>.mp3 (same window, for timing).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
SRC=${SRC:-"/Users/christophershannon/fuckfascists/marketing/video/clark/generated video"}
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/video/clips/clark/scene}
VO=${VO:-/Users/christophershannon/fuckfascists/marketing/video/vo/wide}
mkdir -p "$OUT" "$VO"
n=0
while IFS=$'\t' read -r id file in out grade; do
  [[ -z "$id" || "$id" == \#* ]] && continue
  f="$SRC/$file"; [[ -f "$f" ]] || { echo "missing $f" >&2; continue; }
  fade=$(python3 -c "print(round($out-$in-0.3,3))")
  ffmpeg -nostdin -v error -y -ss "$in" -to "$out" -i "$f" \
    -vf "scale=1920:1080:flags=neighbor,fps=30,format=yuv420p" -c:v libx264 -crf 18 -preset medium \
    -af "afade=t=in:d=0.05,afade=t=out:st=${fade}:d=0.3,loudnorm=I=-18:TP=-1.5" -c:a aac -b:a 192k -movflags +faststart "$OUT/$id.mp4"
  ffmpeg -nostdin -v error -y -ss "$in" -to "$out" -i "$f" -vn -af "afade=t=in:d=0.05,afade=t=out:st=${fade}:d=0.3,loudnorm=I=-18:TP=-1.5" -codec:a libmp3lame -q:a 2 "$VO/$id.mp3"
  rm -rf "$OUT/$id"; mkdir -p "$OUT/$id"
  ffmpeg -nostdin -v error -y -i "$OUT/$id.mp4" -start_number 1 -q:v 2 "$OUT/$id/%04d.jpg"
  frames=$(ls "$OUT/$id"/*.jpg | wc -l | tr -d ' ')
  if [[ -n "${grade:-}" ]]; then  # skin-only grade so live Clark matches the pixel Clark (darker, browner)
    python3 "$HERE/grade-scene.py" "$id" --gains "${grade%@*}" --gamma "${grade#*@}"
  fi
  printf '{"frames": %s, "fps": 30, "source": "%s", "in": %s, "out": %s, "grade": "%s"}\n' "$frames" "$file" "$in" "$out" "${grade:-}" > "$OUT/$id/manifest.json"
  echo "scene $id ← $file ${in}-${out}s → $OUT/$id/ ($frames jpg) ; vo → $VO/$id.mp3"
  n=$((n+1))
done < "$HERE/clark-scene-map.tsv"
echo "$n scene(s) prepared"
