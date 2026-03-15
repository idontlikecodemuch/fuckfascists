"""
compose.py — Stack variant pair images into final sprite sheets.

Each variant image (from generate.py) is a side-by-side neutral+defeated pair.
For standard tier: varA.png is the sprite sheet as-is.
For important tier: varA.png (row 1) and varB.png (row 2) are stacked vertically.

Both rows are normalized to the same width before stacking so the grid is uniform.

Usage:
  python scripts/compose.py --character <id>
  python scripts/compose.py --all

Output: output/raw/{id}.png
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

TOOL_DIR = Path(__file__).resolve().parent.parent
FRAMES_DIR = TOOL_DIR / "output" / "raw" / "frames"
RAW_DIR = TOOL_DIR / "output" / "raw"


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _normalize_width(images: list[Image.Image]) -> list[Image.Image]:
    """Pad all images to the same width (centered, magenta fill) using the max width."""
    max_w = max(img.width for img in images)
    result = []
    for img in images:
        if img.width == max_w:
            result.append(img)
            continue
        padded = Image.new("RGBA", (max_w, img.height), (255, 0, 255, 255))
        x_offset = (max_w - img.width) // 2
        padded.paste(img, (x_offset, 0), mask=img)
        result.append(padded)
    return result


def compose_character(character: dict, force: bool) -> bool:
    char_id = character["id"]
    tier = character.get("tier", "standard")
    output_path = RAW_DIR / f"{char_id}.png"

    if output_path.exists() and not force:
        print(f"{char_id} — exists, skipping (use --force to recompose)")
        return True

    # Determine which variant files are needed
    variant_keys = ["varA"] if tier == "standard" else ["varA", "varB"]
    rows: list[Image.Image] = []
    missing = []

    for vk in variant_keys:
        frame_path = FRAMES_DIR / f"{char_id}_{vk}.png"
        if not frame_path.exists():
            missing.append(f"{char_id}_{vk}.png")
            continue
        rows.append(Image.open(frame_path).convert("RGBA"))

    if missing:
        print(f"{char_id} — ERROR: missing frame files: {missing}. Run generate.py first.")
        return False

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    if len(rows) == 1:
        # Standard tier: single row, save directly
        rows[0].save(output_path, format="PNG")
        w, h = rows[0].size
        print(f"{char_id} — saved {w}×{h}px → output/raw/{char_id}.png")
    else:
        # Important tier: normalize widths then stack vertically
        rows = _normalize_width(rows)
        sheet_w = rows[0].width
        sheet_h = sum(r.height for r in rows)
        sheet = Image.new("RGBA", (sheet_w, sheet_h), (255, 0, 255, 255))
        y = 0
        for row in rows:
            sheet.paste(row, (0, y), mask=row)
            y += row.height
        sheet.save(output_path, format="PNG")
        print(f"{char_id} — stacked {len(rows)} rows → {sheet_w}×{sheet_h}px → output/raw/{char_id}.png")

    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Stack variant pair images into sprite sheets."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--character", metavar="ID", help="Compose one character by id")
    group.add_argument("--all", action="store_true", help="Compose all characters")
    parser.add_argument("--force", action="store_true", help="Recompose even if output exists")
    args = parser.parse_args()

    characters_list = _load_json(TOOL_DIR / "characters.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    if args.all:
        targets = characters_list
    else:
        char_id = args.character
        if char_id not in characters_by_id:
            print(f"ERROR: character '{char_id}' not found in characters.json")
            print(f"Available ids: {', '.join(characters_by_id.keys())}")
            sys.exit(1)
        targets = [characters_by_id[char_id]]

    total = len(targets)
    successes = 0
    failures = []

    for character in targets:
        ok = compose_character(character, force=args.force)
        if ok:
            successes += 1
        else:
            failures.append(character["id"])

    print(f"\nComposed {successes} of {total} characters.", end="")
    if failures:
        print(f" Failures: {failures}")
    else:
        print()


if __name__ == "__main__":
    main()
