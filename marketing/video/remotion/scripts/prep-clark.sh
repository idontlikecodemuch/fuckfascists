#!/usr/bin/env bash
# Keys Veo Clark clips into a PNG frame sequence with alpha (Clark layer) and extracts their
# speech as the line's VO. Driven by scripts/clark-veo-map.tsv:
#   lineId  source-file  key(chroma|color)  color  similarity  blend  crop(w:h:x:y)  in  out  audio_out
# The crop is chosen so the face lands where the static bust's face is
# (bust asset 994x952, face at 500,330); the output is scaled to exactly 994x952.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
SRC=${SRC:-"/Users/christophershannon/fuckfascists/marketing/video/clark/generated video"}
OUT=${OUT:-/Users/christophershannon/fuckfascists/marketing/video/clips/clark}
VO=${VO:-/Users/christophershannon/fuckfascists/marketing/video/vo}
mkdir -p "$OUT" "$VO"
n=0
while IFS=$'\t' read -r id file key color sim blend crop in out aout; do
  [[ -z "$id" || "$id" == \#* ]] && continue
  f="$SRC/$file"
  [[ -f "$f" ]] || { echo "missing $f" >&2; continue; }
  if [[ "$key" == "chroma" ]]; then keyf="chromakey=${color}:${sim}:${blend},despill=type=green"; else keyf="colorkey=${color}:${sim}:${blend}"; fi
  rm -rf "$OUT/$id"; mkdir -p "$OUT/$id"
  ffmpeg -nostdin -v error -y -ss "$in" -to "$out" -i "$f" \
    -vf "${keyf},crop=${crop},scale=994:952:flags=neighbor,fps=30,format=rgba" \
    -start_number 1 "$OUT/$id/%04d.png"
  frames=$(ls "$OUT/$id"/*.png | wc -l | tr -d ' ')
  printf '{"frames": %s, "fps": 30, "source": "%s", "in": %s, "out": %s}\n' "$frames" "$file" "$in" "$out" > "$OUT/$id/manifest.json"
  dur=$(python3 -c "print(round($aout-$in,3))")
  ffmpeg -nostdin -v error -y -ss "$in" -to "$aout" -i "$f" -vn -af "afade=t=in:d=0.05,afade=t=out:st=$(python3 -c "print(round($aout-$in-0.3,3))"):d=0.3,loudnorm=I=-18:TP=-1.5" -codec:a libmp3lame -q:a 2 "$VO/$id.mp3"
  echo "keyed $id ← $file  video ${in}-${out}s → $OUT/$id/ ($frames png) ; vo ${in}-${aout}s → $VO/$id.mp3"
  n=$((n+1))
done < "$HERE/clark-veo-map.tsv"
echo "$n clip(s) prepared"
