"""
analyze_sprites.py — Analyze body placement and scale across all CEO sprite sheets.

Reads deployed sprites from assets/pixel/sprites/ and characters.json, computes
per-sprite body bounds from the neutral frame (col 0, row 0), and writes:
  - reports/sprite-analysis.json  (per-sprite metrics + aggregate stats)
  - reports/sprite-analysis.md    (readable summary + outlier flags)

No numpy or scipy required — pure PIL + stdlib.

Usage:
  python3 scripts/analyze_sprites.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image


TOOL_DIR = Path(__file__).resolve().parent.parent
SPRITES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "assets" / "pixel" / "sprites"
REPORTS_DIR = TOOL_DIR / "reports"

CELL_WIDTH = 728
CELL_HEIGHT = 720


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _grid_for_tier(tier: str) -> dict:
    if tier == "important":
        return {"cols": 2, "rows": 2}
    return {"cols": 2, "rows": 1}


def _body_bounds(cell: Image.Image, cell_w: int, cell_h: int) -> dict | None:
    """Find bounding box of non-transparent pixels. Returns None if fully transparent.

    Percentages are computed against the actual extracted cell dimensions, not
    the legacy CELL_WIDTH/CELL_HEIGHT constants — deployed sprites can be at
    any 2x downscale of the canonical 728x720 (or variant) sheet, and important
    tier sheets pack 2 rows in the same image height as standard tier's 1 row.
    """
    bbox = cell.getbbox()
    if bbox is None:
        return None
    left, top, right, bottom = bbox
    w = right - left
    h = bottom - top
    cx = left + w / 2
    cy = top + h / 2
    return {
        "left": left,
        "top": top,
        "right": right,
        "bottom": bottom,
        "bodyWidth": w,
        "bodyHeight": h,
        "centerX": round(cx, 1),
        "centerY": round(cy, 1),
        "widthPct": round(w / cell_w * 100, 2),
        "heightPct": round(h / cell_h * 100, 2),
        "topMarginPct": round(top / cell_h * 100, 2),
        "bottomMarginPct": round((cell_h - bottom) / cell_h * 100, 2),
        "leftMarginPct": round(left / cell_w * 100, 2),
        "rightMarginPct": round((cell_w - right) / cell_w * 100, 2),
    }


def _median(values: list[float]) -> float:
    s = sorted(values)
    n = len(s)
    if n == 0:
        return 0.0
    mid = n // 2
    if n % 2 == 0:
        return (s[mid - 1] + s[mid]) / 2
    return s[mid]


def _stddev(values: list[float], mean: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((v - mean) ** 2 for v in values) / (len(values) - 1)
    return math.sqrt(variance)


def _aggregate(metrics: list[dict]) -> dict:
    """Compute aggregate stats across all sprites."""
    keys = ["widthPct", "heightPct", "topMarginPct", "bottomMarginPct",
            "leftMarginPct", "rightMarginPct", "bodyWidth", "bodyHeight"]
    agg = {}
    for key in keys:
        values = [m[key] for m in metrics if key in m]
        if not values:
            continue
        mean = sum(values) / len(values)
        med = _median(values)
        sd = _stddev(values, mean)
        agg[key] = {
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "mean": round(mean, 2),
            "median": round(med, 2),
            "stddev": round(sd, 2),
            "count": len(values),
        }
    return agg


def _recommend_targets(agg: dict) -> dict:
    """Recommend normalization targets based on median values.

    targetBodyHeight/targetFeetY are reported against the canonical CELL_HEIGHT
    for backward compatibility with normalize_sprites.py; the percentages are
    the source of truth and normalize uses them against the input's actual
    cell height (which may be 360, 372, 720, or 744 depending on tier + scale).
    """
    height_pct = agg.get("heightPct", {}).get("median", 86.0)
    bottom_margin_pct = agg.get("bottomMarginPct", {}).get("median", 5.0)
    return {
        "targetHeightPct": height_pct,
        "targetBottomMarginPct": bottom_margin_pct,
        "targetBodyHeight": round(CELL_HEIGHT * height_pct / 100),
        "targetFeetY": round(CELL_HEIGHT * (1 - bottom_margin_pct / 100)),
        "cellWidth": CELL_WIDTH,
        "cellHeight": CELL_HEIGHT,
    }


def _format_md(sprites: list[dict], agg: dict, targets: dict) -> str:
    """Generate readable markdown report."""
    lines = [
        "# Sprite Analysis Report\n",
        f"**Sprites analyzed:** {len(sprites)}",
        f"**Cell size:** {CELL_WIDTH}x{CELL_HEIGHT}\n",
        "## Recommended Targets\n",
        f"- Body height: {targets['targetHeightPct']}% ({targets['targetBodyHeight']}px)",
        f"- Feet Y: {targets['targetFeetY']}px (bottom margin {targets['targetBottomMarginPct']}%)",
        f"- Horizontal center: {CELL_WIDTH // 2}px (50%)\n",
        "## Aggregate Stats\n",
        "| Metric | Min | Max | Mean | Median | StdDev |",
        "|--------|-----|-----|------|--------|--------|",
    ]

    for key in ["heightPct", "widthPct", "topMarginPct", "bottomMarginPct",
                "leftMarginPct", "rightMarginPct"]:
        if key in agg:
            a = agg[key]
            lines.append(
                f"| {key} | {a['min']}% | {a['max']}% | {a['mean']}% | {a['median']}% | {a['stddev']}% |"
            )

    # Outlier detection: >2 sigma from median on heightPct
    height_med = agg.get("heightPct", {}).get("median", 0)
    height_sd = agg.get("heightPct", {}).get("stddev", 0)
    outlier_threshold = 2 * height_sd

    outliers = []
    for sp in sprites:
        hp = sp["bounds"]["heightPct"]
        deviation = abs(hp - height_med)
        if deviation > outlier_threshold and height_sd > 0:
            outliers.append((sp["id"], hp, round(deviation / height_sd, 1)))

    lines.append("")
    lines.append("## Per-Sprite Metrics\n")
    lines.append("| ID | Height% | Width% | TopM% | BotM% | LeftM% | RightM% | Outlier |")
    lines.append("|----|---------|--------|-------|-------|--------|---------|---------|")

    for sp in sorted(sprites, key=lambda x: x["id"]):
        b = sp["bounds"]
        is_outlier = any(o[0] == sp["id"] for o in outliers)
        flag = " **!!**" if is_outlier else ""
        lines.append(
            f"| {sp['id']} | {b['heightPct']} | {b['widthPct']} | "
            f"{b['topMarginPct']} | {b['bottomMarginPct']} | "
            f"{b['leftMarginPct']} | {b['rightMarginPct']} |{flag} |"
        )

    if outliers:
        lines.append("")
        lines.append(f"## Outliers (>{2}σ from median height)\n")
        for oid, hp, sigma in sorted(outliers, key=lambda x: -x[2]):
            lines.append(f"- **{oid}**: height {hp}% ({sigma}σ from median)")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    if not SPRITES_DIR.exists():
        print(f"ERROR: sprites directory not found: {SPRITES_DIR}")
        sys.exit(1)

    characters_list = _load_json(TOOL_DIR / "characters.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    png_files = sorted(SPRITES_DIR.glob("*.png"))
    if not png_files:
        print("No PNG files found in sprites directory.")
        sys.exit(0)

    results = []
    skipped = []

    for png_path in png_files:
        char_id = png_path.stem

        if char_id not in characters_by_id:
            skipped.append(char_id)
            continue

        character = characters_by_id[char_id]
        tier = character.get("tier", "standard")
        grid = _grid_for_tier(tier)

        try:
            img = Image.open(png_path)
        except Exception as e:
            print(f"  ERROR reading {png_path.name}: {e}")
            continue

        img_w, img_h = img.size
        cell_w = img_w // grid["cols"]
        cell_h = img_h // grid["rows"]

        # Extract neutral frame (col 0, row 0)
        neutral = img.crop((0, 0, cell_w, cell_h))
        bounds = _body_bounds(neutral, cell_w, cell_h)

        if bounds is None:
            print(f"  [warn] {char_id}: neutral frame is fully transparent — skipping")
            skipped.append(char_id)
            continue

        entry = {
            "id": char_id,
            "tier": tier,
            "sheetSize": [img_w, img_h],
            "cellSize": [cell_w, cell_h],
            "bounds": bounds,
        }
        results.append(entry)
        print(f"  {char_id}: body {bounds['bodyWidth']}x{bounds['bodyHeight']} "
              f"({bounds['heightPct']}% h, {bounds['widthPct']}% w)")

    if not results:
        print("No sprites analyzed.")
        sys.exit(0)

    metrics = [r["bounds"] for r in results]
    agg = _aggregate(metrics)
    targets = _recommend_targets(agg)

    report = {
        "cellSize": [CELL_WIDTH, CELL_HEIGHT],
        "spritesAnalyzed": len(results),
        "sprites": results,
        "aggregate": agg,
        "recommendedTargets": targets,
    }

    # Write reports
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    json_path = REPORTS_DIR / "sprite-analysis.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(f"\nJSON report: {json_path}")

    md_path = REPORTS_DIR / "sprite-analysis.md"
    md_content = _format_md(results, agg, targets)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"Markdown report: {md_path}")

    print(f"\nAnalyzed {len(results)} sprites, skipped {len(skipped)}")
    print(f"\nRecommended targets:")
    print(f"  Body height: {targets['targetHeightPct']}% ({targets['targetBodyHeight']}px)")
    print(f"  Feet Y: {targets['targetFeetY']}px")
    print(f"  Bottom margin: {targets['targetBottomMarginPct']}%")

    if skipped:
        print(f"\nSkipped (not in characters.json): {skipped}")


if __name__ == "__main__":
    main()
