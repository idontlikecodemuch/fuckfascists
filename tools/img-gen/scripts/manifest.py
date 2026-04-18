"""
manifest.py — Generate sprite sheet metadata JSON from sprite PNGs.

Reads PNG dimensions from --source directory and characters.json, then writes
manifest.json with per-character grid layout and frame coordinate data for the app.

Usage:
  python scripts/manifest.py                          # Default: read output/processed/
  python scripts/manifest.py --source deployed        # Read assets/pixel/sprites/ (optimized)
  python scripts/manifest.py --source hires           # Read assets/pixel/sprites-hires/ (full-res)
  python scripts/manifest.py --output path/to/manifest.json
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image


TOOL_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TOOL_DIR.parent.parent

SOURCES = {
    "processed": TOOL_DIR / "output" / "processed",
    "deployed":  REPO_ROOT / "assets" / "pixel" / "sprites",
    "hires":     REPO_ROOT / "assets" / "pixel" / "sprites-hires",
}


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
    parser = argparse.ArgumentParser(description="Generate sprite manifest JSON.")
    parser.add_argument("--source", choices=list(SOURCES.keys()), default="processed",
                        help="Which sprite directory to read from (default: processed)")
    parser.add_argument("--output", type=Path, default=None,
                        help="Output manifest path (default: output/manifest.json)")
    args = parser.parse_args()

    source_dir = SOURCES[args.source]
    output_path = args.output or (TOOL_DIR / "output" / "manifest.json")

    if not source_dir.exists():
        print(f"ERROR: source directory not found: {source_dir}")
        sys.exit(1)

    characters_list = _load_json(TOOL_DIR / "characters.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    png_files = sorted(source_dir.glob("*.png"))
    if not png_files:
        print(f"No PNG files found in {source_dir}")
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

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nManifest written to {output_path} ({len(sprites)} sprite(s))")
    if missing_in_json:
        print(f"Skipped (not in characters.json): {missing_in_json}")


if __name__ == "__main__":
    main()
