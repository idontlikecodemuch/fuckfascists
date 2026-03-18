"""
process_assets.py — Process raw Gemini outputs into app-ready PNGs.

Reads asset-prompts.json for processing type and target dimensions.
Applies background keying, alpha binarization, slicing/cropping, and
nearest-neighbor scaling for each asset.

Input:  tools/img-gen/output/raw/{id}.png
Output: tools/img-gen/output/processed/assets/

Processing types (from asset-prompts.json "processing.type"):
  grid_2x2         — slice into 4 quadrants → {id}_0.png … {id}_3.png
  split_horizontal — slice into left/right halves → {id}_left.png, {id}_right.png
  auto_crop        — auto-crop to bounding box of non-transparent pixels → {id}.png
  crop_center      — same as auto_crop → {id}.png
  horizontal_band  — auto-crop top/bottom transparent rows, keep full width → {id}.png

Keying (applied to all types before slicing):
  1. Flood fill from all 4 corners through candidate background pixels.
     Candidate = within RGB distance 60 of #FF00FF, OR within distance 30 of white.
     Only border-connected background regions are removed.
  2. Global magenta pass: any remaining pixel within Euclidean RGB distance 80
     of #FF00FF is keyed out regardless of connectedness. This catches magenta
     trapped inside closed shapes that the flood fill cannot reach.
  3. Alpha binarization: <128 → 0, >=128 → 255. Hard pixel-art edges, no fringe.
  4. 1px alpha erosion: any opaque pixel with a transparent 4-neighbor becomes
     transparent. Removes the anti-aliased fringe halo that survives keying.

Requires: pip3 install numpy pillow

Usage:
  python3 scripts/process_assets.py --all
  python3 scripts/process_assets.py --asset marker_flag_default
"""

import json
import sys
from pathlib import Path

import importlib.util as _ilu

import numpy as np
from PIL import Image

# Load remove_magenta from sibling script — single source of keying logic.
_rm_spec = _ilu.spec_from_file_location("remove_magenta", Path(__file__).parent / "remove_magenta.py")
_rm_mod = _ilu.module_from_spec(_rm_spec)
_rm_spec.loader.exec_module(_rm_mod)
_do_key = _rm_mod.remove_magenta

TOOL_DIR = Path(__file__).resolve().parent.parent
RAW_ASSETS_DIR = TOOL_DIR / "output" / "raw" / "UI Elements"
PROCESSED_ASSETS_DIR = TOOL_DIR / "output" / "new"


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _key_and_threshold(img: Image.Image) -> Image.Image:
    """Delegate to remove_magenta — HSV flood-fill keying with interior removal."""
    return _do_key(img, defringe=True)


def _resize(img: Image.Image, target_size) -> Image.Image:
    """Nearest-neighbor scale to [w, h]. No-op when target_size is None."""
    if not target_size:
        return img
    w, h = target_size[0], target_size[1]
    return img.resize((w, h), Image.NEAREST)


def _auto_crop(img: Image.Image) -> Image.Image:
    """Crop to bounding box of non-transparent pixels."""
    bbox = img.getbbox()
    if bbox is None:
        return img  # fully transparent — return as-is
    return img.crop(bbox)


def _horizontal_band(img: Image.Image) -> Image.Image:
    """
    Auto-crop top and bottom transparent rows; keep full width.
    A row is considered empty when all pixels have alpha=0.
    """
    data = np.array(img)
    alpha = data[:, :, 3]
    row_has_content = alpha.max(axis=1) > 0

    rows = np.where(row_has_content)[0]
    if len(rows) == 0:
        return img  # fully transparent

    top, bottom = int(rows[0]), int(rows[-1]) + 1
    return img.crop((0, top, img.width, bottom))


def _save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG")


def _process_asset(asset: dict) -> bool:
    asset_id = asset["id"]
    raw_path = RAW_ASSETS_DIR / f"{asset_id}.png"

    if not raw_path.exists():
        print(f"  {asset_id} — raw file missing, skipping")
        return False

    processing = asset.get("processing", {})
    proc_type = processing.get("type", "auto_crop")
    target_size = processing.get("target_size")

    try:
        img = Image.open(raw_path)
        keyed = _key_and_threshold(img)
    except Exception as e:
        print(f"  {asset_id} — ERROR loading/keying: {e}")
        return False

    try:
        if proc_type == "grid_2x2":
            w, h = keyed.width, keyed.height
            mid_x, mid_y = w // 2, h // 2
            quadrants = [
                keyed.crop((0,     0,     mid_x, mid_y)),  # 0: top-left
                keyed.crop((mid_x, 0,     w,     mid_y)),  # 1: top-right
                keyed.crop((0,     mid_y, mid_x, h)),      # 2: bottom-left
                keyed.crop((mid_x, mid_y, w,     h)),      # 3: bottom-right
            ]
            for i, quad in enumerate(quadrants):
                out = _resize(quad, target_size)
                _save(out, PROCESSED_ASSETS_DIR / f"{asset_id}_{i}.png")
            print(f"  {asset_id} — grid_2x2 → 4 files")

        elif proc_type == "split_horizontal":
            mid_x = keyed.width // 2
            left = keyed.crop((0, 0, mid_x, keyed.height))
            right = keyed.crop((mid_x, 0, keyed.width, keyed.height))
            _save(_resize(left, target_size),  PROCESSED_ASSETS_DIR / f"{asset_id}_left.png")
            _save(_resize(right, target_size), PROCESSED_ASSETS_DIR / f"{asset_id}_right.png")
            print(f"  {asset_id} — split_horizontal → _left, _right")

        elif proc_type == "horizontal_band":
            cropped = _horizontal_band(keyed)
            out = _resize(cropped, target_size)
            _save(out, PROCESSED_ASSETS_DIR / f"{asset_id}.png")
            print(f"  {asset_id} — horizontal_band → {out.size}")

        elif proc_type in ("auto_crop", "crop_center"):
            cropped = _auto_crop(keyed)
            out = _resize(cropped, target_size)
            _save(out, PROCESSED_ASSETS_DIR / f"{asset_id}.png")
            print(f"  {asset_id} — {proc_type} → {out.size}")

        else:
            print(f"  {asset_id} — unknown processing type '{proc_type}', skipping")
            return False

    except Exception as e:
        print(f"  {asset_id} — ERROR processing: {e}")
        return False

    return True


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(
        description="Process raw Gemini asset outputs into app-ready PNGs."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Process all assets")
    group.add_argument("--asset", metavar="ID", help="Process one asset by id")
    args = parser.parse_args()

    asset_prompts = _load_json(TOOL_DIR / "asset-prompts.json")
    assets_by_id = {a["id"]: a for a in asset_prompts["assets"]}

    if args.all:
        targets = asset_prompts["assets"]
    else:
        asset_id = args.asset
        if asset_id not in assets_by_id:
            print(f"ERROR: asset '{asset_id}' not found in asset-prompts.json")
            print(f"Available ids: {', '.join(assets_by_id.keys())}")
            sys.exit(1)
        targets = [assets_by_id[asset_id]]

    total = len(targets)
    successes = 0
    failures = []

    for n, asset in enumerate(targets, 1):
        print(f"[{n}/{total}] {asset['id']}")
        ok = _process_asset(asset)
        if ok:
            successes += 1
        else:
            failures.append(asset["id"])

    print(f"\nProcessed {successes} of {total} assets → output/processed/assets/", end="")
    if failures:
        print(f"\nSkipped/failed: {failures}")
    else:
        print()


if __name__ == "__main__":
    main()
