"""
normalize_sprites.py — Normalize body placement and scale across CEO sprite sheets.

Reads sprites from assets/pixel/sprites/, computes body bounds from the neutral
frame (col 0, row 0), and applies uniform scaling + translation so all sprites
have consistent body height and foot position. The same transform is applied to
every frame in the sheet (defeated variants stay in registration with neutral).

Requires analyze_sprites.py to have been run first (reads recommended targets
from reports/sprite-analysis.json), or accepts manual overrides via CLI flags.

No numpy or scipy required — pure PIL + stdlib.

Usage:
  python3 scripts/normalize_sprites.py --all
  python3 scripts/normalize_sprites.py --character elon-musk
  python3 scripts/normalize_sprites.py --all --validate
  python3 scripts/normalize_sprites.py --all --target-height-pct 86.0 --target-bottom-margin-pct 5.0
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

from PIL import Image


TOOL_DIR = Path(__file__).resolve().parent.parent
SPRITES_DIR = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "assets" / "pixel" / "sprites"
)
BACKUP_DIR = SPRITES_DIR / "originals"
REPORTS_DIR = TOOL_DIR / "reports"
ANALYSIS_PATH = REPORTS_DIR / "sprite-analysis.json"

CELL_WIDTH = 728
CELL_HEIGHT = 720

# Sprites within this tolerance of targets are left untouched
TOLERANCE_PCT = 1.0


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _grid_for_tier(tier: str) -> dict:
    if tier == "important":
        return {"cols": 2, "rows": 2}
    return {"cols": 2, "rows": 1}


def _body_bounds(cell: Image.Image) -> tuple[int, int, int, int] | None:
    """Return (left, top, right, bottom) of non-transparent pixels, or None."""
    bbox = cell.getbbox()
    return bbox


def _extract_cell(img: Image.Image, col: int, row: int,
                  cell_w: int, cell_h: int) -> Image.Image:
    """Extract a single cell from the sprite sheet."""
    x0 = col * cell_w
    y0 = row * cell_h
    return img.crop((x0, y0, x0 + cell_w, y0 + cell_h))


def _normalize_cell(cell: Image.Image, scale: float,
                    offset_x: int, offset_y: int) -> Image.Image:
    """Scale and reposition cell content on a fresh transparent canvas."""
    # Get content bounds
    bbox = cell.getbbox()
    if bbox is None:
        return Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))

    # Extract content region
    content = cell.crop(bbox)
    orig_w = bbox[2] - bbox[0]
    orig_h = bbox[3] - bbox[1]

    # Scale content
    new_w = max(1, round(orig_w * scale))
    new_h = max(1, round(orig_h * scale))
    scaled = content.resize((new_w, new_h), Image.NEAREST)

    # Compute paste position: apply offset relative to original position
    paste_x = round(bbox[0] * scale) + offset_x
    paste_y = round(bbox[1] * scale) + offset_y

    # Create fresh canvas and paste
    canvas = Image.new("RGBA", (CELL_WIDTH, CELL_HEIGHT), (0, 0, 0, 0))
    canvas.paste(scaled, (paste_x, paste_y), scaled)
    return canvas


def _compute_transform(bounds: tuple[int, int, int, int],
                       target_height: int, target_feet_y: int
                       ) -> tuple[float, int, int]:
    """Compute scale factor and offsets for normalization.

    Returns (scale, offset_x, offset_y) where offsets are applied after scaling.
    """
    left, top, right, bottom = bounds
    body_w = right - left
    body_h = bottom - top

    if body_h == 0:
        return 1.0, 0, 0

    # Uniform scale to hit target height
    scale = target_height / body_h

    # After scaling, where would the body be?
    scaled_top = round(top * scale)
    scaled_bottom = round(bottom * scale)
    scaled_left = round(left * scale)
    scaled_right = round(right * scale)
    scaled_body_w = scaled_right - scaled_left
    scaled_body_h = scaled_bottom - scaled_top

    # Vertical offset: place feet at target_feet_y
    current_feet_y = scaled_top + scaled_body_h
    offset_y = target_feet_y - current_feet_y

    # Horizontal offset: center body in cell
    current_center_x = scaled_left + scaled_body_w / 2
    target_center_x = CELL_WIDTH / 2
    offset_x = round(target_center_x - current_center_x)

    return scale, offset_x, offset_y


def _is_within_tolerance(bounds: tuple[int, int, int, int],
                         target_height: int, target_feet_y: int) -> bool:
    """Check if sprite is already close enough to targets."""
    body_h = bounds[3] - bounds[1]
    feet_y = bounds[3]

    height_diff_pct = abs(body_h - target_height) / CELL_HEIGHT * 100
    feet_diff_pct = abs(feet_y - target_feet_y) / CELL_HEIGHT * 100

    # Also check horizontal centering
    body_w = bounds[2] - bounds[0]
    center_x = bounds[0] + body_w / 2
    center_diff_pct = abs(center_x - CELL_WIDTH / 2) / CELL_WIDTH * 100

    return (height_diff_pct <= TOLERANCE_PCT and
            feet_diff_pct <= TOLERANCE_PCT and
            center_diff_pct <= TOLERANCE_PCT)


def _load_targets(args: argparse.Namespace) -> tuple[int, int]:
    """Load target values from analysis report or CLI overrides."""
    height_pct = args.target_height_pct
    bottom_margin_pct = args.target_bottom_margin_pct

    if height_pct is None or bottom_margin_pct is None:
        if not ANALYSIS_PATH.exists():
            print("ERROR: No analysis report found. Run analyze_sprites.py first,")
            print("       or provide --target-height-pct and --target-bottom-margin-pct.")
            sys.exit(1)

        report = _load_json(ANALYSIS_PATH)
        targets = report.get("recommendedTargets", {})
        if height_pct is None:
            height_pct = targets.get("targetHeightPct", 86.0)
        if bottom_margin_pct is None:
            bottom_margin_pct = targets.get("targetBottomMarginPct", 5.0)

    target_height = round(CELL_HEIGHT * height_pct / 100)
    target_feet_y = round(CELL_HEIGHT * (1 - bottom_margin_pct / 100))
    return target_height, target_feet_y


def _process_sprite(png_path: Path, tier: str, target_height: int,
                    target_feet_y: int, validate: bool) -> dict:
    """Normalize a single sprite sheet. Returns status dict."""
    grid = _grid_for_tier(tier)
    cols, rows = grid["cols"], grid["rows"]

    img = Image.open(png_path)
    img_w, img_h = img.size
    cell_w = img_w // cols
    cell_h = img_h // rows

    # Get bounds from neutral frame (col 0, row 0)
    neutral = _extract_cell(img, 0, 0, cell_w, cell_h)
    bounds = _body_bounds(neutral)

    if bounds is None:
        return {"id": png_path.stem, "status": "skipped", "reason": "fully transparent"}

    body_h = bounds[3] - bounds[1]

    if _is_within_tolerance(bounds, target_height, target_feet_y):
        return {
            "id": png_path.stem,
            "status": "unchanged",
            "bodyHeight": body_h,
            "heightPct": round(body_h / CELL_HEIGHT * 100, 2),
        }

    scale, offset_x, offset_y = _compute_transform(
        bounds, target_height, target_feet_y
    )

    result = {
        "id": png_path.stem,
        "status": "would_change" if validate else "normalized",
        "bodyHeight": body_h,
        "heightPct": round(body_h / CELL_HEIGHT * 100, 2),
        "scale": round(scale, 4),
        "offsetX": offset_x,
        "offsetY": offset_y,
    }

    if validate:
        return result

    # Back up original before modifying
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    backup_path = BACKUP_DIR / png_path.name
    if not backup_path.exists():
        shutil.copy2(png_path, backup_path)

    # Apply transform to every cell in the sheet
    new_sheet = Image.new("RGBA", (img_w, img_h), (0, 0, 0, 0))

    for r in range(rows):
        for c in range(cols):
            cell = _extract_cell(img, c, r, cell_w, cell_h)
            normalized = _normalize_cell(cell, scale, offset_x, offset_y)
            paste_x = c * cell_w
            paste_y = r * cell_h
            new_sheet.paste(normalized, (paste_x, paste_y))

    new_sheet.save(png_path, "PNG")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Normalize sprite body placement and scale."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true",
                       help="Normalize all sprites in assets/pixel/sprites/")
    group.add_argument("--character", type=str,
                       help="Normalize one sprite by kebab-case ID")
    parser.add_argument("--validate", action="store_true",
                        help="Dry run — report what would change without modifying files")
    parser.add_argument("--target-height-pct", type=float, default=None,
                        help="Target body height as %% of cell height (default: from analysis)")
    parser.add_argument("--target-bottom-margin-pct", type=float, default=None,
                        help="Target bottom margin as %% of cell height (default: from analysis)")
    args = parser.parse_args()

    if not SPRITES_DIR.exists():
        print(f"ERROR: sprites directory not found: {SPRITES_DIR}")
        sys.exit(1)

    characters_list = _load_json(TOOL_DIR / "characters.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    target_height, target_feet_y = _load_targets(args)
    print(f"Targets: body height {target_height}px, feet Y {target_feet_y}px")
    print(f"Tolerance: ±{TOLERANCE_PCT}%")
    if args.validate:
        print("MODE: validate (dry run)\n")
    else:
        print(f"MODE: normalize (originals backed up to {BACKUP_DIR}/)\n")

    # Collect sprites to process
    if args.all:
        png_files = sorted(SPRITES_DIR.glob("*.png"))
    else:
        png_path = SPRITES_DIR / f"{args.character}.png"
        if not png_path.exists():
            print(f"ERROR: sprite not found: {png_path}")
            sys.exit(1)
        png_files = [png_path]

    results = []
    for png_path in png_files:
        char_id = png_path.stem
        if char_id not in characters_by_id:
            continue

        tier = characters_by_id[char_id].get("tier", "standard")
        try:
            result = _process_sprite(
                png_path, tier, target_height, target_feet_y, args.validate
            )
            results.append(result)

            status = result["status"]
            if status == "unchanged":
                print(f"  {char_id}: OK (height {result['heightPct']}%)")
            elif status in ("would_change", "normalized"):
                print(f"  {char_id}: {status} — scale {result['scale']}x, "
                      f"offset ({result['offsetX']}, {result['offsetY']})")
            else:
                print(f"  {char_id}: {status} — {result.get('reason', '')}")
        except Exception as e:
            print(f"  ERROR {char_id}: {e}")
            results.append({"id": char_id, "status": "error", "reason": str(e)})

    # Summary
    unchanged = sum(1 for r in results if r["status"] == "unchanged")
    changed = sum(1 for r in results if r["status"] in ("would_change", "normalized"))
    skipped = sum(1 for r in results if r["status"] == "skipped")
    errors = sum(1 for r in results if r["status"] == "error")

    print(f"\nSummary: {len(results)} sprites processed")
    print(f"  Unchanged: {unchanged}")
    print(f"  {'Would change' if args.validate else 'Normalized'}: {changed}")
    if skipped:
        print(f"  Skipped: {skipped}")
    if errors:
        print(f"  Errors: {errors}")


if __name__ == "__main__":
    main()
