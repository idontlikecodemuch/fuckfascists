#!/usr/bin/env bash
# Re-export the storyboard script into the project (the storyboard artifact
# writes marketing/video/script.json; the build reads src/data/script.json).
set -euo pipefail
cd "$(dirname "$0")/.."
cp ../script.json src/data/script.json
echo "synced src/data/script.json from ../script.json"
