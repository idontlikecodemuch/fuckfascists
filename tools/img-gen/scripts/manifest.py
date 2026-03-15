"""
manifest.py — Generate sprite sheet metadata JSON from processed output images.

Reads output/processed/ and characters.json, then writes output/manifest.json
with per-character grid layout and frame coordinate data for the app.

Usage:
  python scripts/manifest.py
"""

import json
import sys
from pathlib import Path

from PIL import Image


TOOL_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = TOOL_DIR / "output" / "processed"
MANIFEST_PATH = TOOL_DIR / "output" / "manifest.json"


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _grid_for_tier(tier: str) -> dict:
    """Return grid dimensions for a given tier."""
    if tier == "important":
        return {"cols": 2, "rows": 2}
    else:
        return {"cols": 2, "rows": 1}


def _frames_for_tier(tier: str) -> dict:
    """Return frame coordinate map for a given tier."""
    if tier == "important":
        return {
            "varA_neutral":  {"col": 0, "row": 0},
            "varA_defeated": {"col": 1, "row": 0},
            "varB_neutral":  {"col": 0, "row": 1},
            "varB_defeated": {"col": 1, "row": 1},
        }
    else:
        return {
            "varA_neutral":  {"col": 0, "row": 0},
            "varA_defeated": {"col": 1, "row": 0},
        }


def main() -> None:
    if not PROCESSED_DIR.exists():
        print(f"ERROR: processed directory not found: {PROCESSED_DIR}")
        print("Run generate.py and remove_magenta.py first.")
        sys.exit(1)

    characters_list = _load_json(TOOL_DIR / "characters.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    png_files = sorted(PROCESSED_DIR.glob("*.png"))
    if not png_files:
        print(f"No PNG files found in {PROCESSED_DIR}")
        sys.exit(0)

    sprites = {}
    missing_in_json = []

    for png_path in png_files:
        char_id = png_path.stem

        if char_id not in characters_by_id:
            print(f"  [warn] {char_id}.png has no entry in characters.json — skipping")
            missing_in_json.append(char_id)
            continue

        character = characters_by_id[char_id]
        tier = character.get("tier", "standard")

        try:
            img = Image.open(png_path)
            img_width, img_height = img.size
        except Exception as e:
            print(f"  ERROR reading {png_path.name}: {e}")
            continue

        grid = _grid_for_tier(tier)
        cols = grid["cols"]
        rows = grid["rows"]

        frame_width = img_width // cols
        frame_height = img_height // rows

        sprites[char_id] = {
            "file": png_path.name,
            "tier": tier,
            "grid": grid,
            "frameWidth": frame_width,
            "frameHeight": frame_height,
            "frames": _frames_for_tier(tier),
        }

        print(f"  {char_id}: {img_width}x{img_height} → {cols}x{rows} grid, "
              f"frames {frame_width}x{frame_height}px")

    manifest = {"sprites": sprites}

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nManifest written to output/manifest.json ({len(sprites)} sprite(s))")
    if missing_in_json:
        print(f"Skipped (not in characters.json): {missing_in_json}")


if __name__ == "__main__":
    main()
