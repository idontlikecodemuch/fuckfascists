#!/usr/bin/env bash
# Writes src/data/clipDims.json: the real pixel size of every clip in marketing/video/clips.
# The full-bleed layout sizes footage from these (never from an assumed capture size: that
# assumption over-scaled every clip 5% and cropped the app's title bar, Sep 29).
set -euo pipefail
cd "$(dirname "$0")/.."
M=${M:-/Users/christophershannon/fuckfascists/marketing/video}
python3 - "$M/clips" <<'PY'
import json, subprocess, sys, glob, os
out = {}
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.mp4'))):
    w, h = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).decode().strip().strip(',').split(',')[:2]
    out[os.path.splitext(os.path.basename(f))[0]] = {'w': int(w), 'h': int(h)}
json.dump(out, open('src/data/clipDims.json', 'w'), indent=1); open('src/data/clipDims.json', 'a').write('\n')
for k, v in out.items(): print(f"{k}\t{v['w']}x{v['h']}\tat 1080 wide: {round(1080 * v['h'] / v['w'])} tall")
PY
