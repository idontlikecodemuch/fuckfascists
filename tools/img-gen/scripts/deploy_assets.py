"""
deploy_assets.py — Copy processed assets into the app's assets/pixel/ directory.

Copies from: tools/img-gen/output/processed/assets/
Copies to:   assets/pixel/

Does not delete anything from assets/pixel/. Idempotent — safe to run repeatedly.
Only copies files that exist in processed/assets/.

Usage:
  python3 scripts/deploy_assets.py --all
  python3 scripts/deploy_assets.py --asset marker_flag_default
"""

import argparse
import json
import shutil
import sys
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent.parent
PROCESSED_ASSETS_DIR = TOOL_DIR / "output" / "processed" / "assets"
# Resolve app root: tools/img-gen/ → ../../ → repo root
APP_PIXEL_DIR = TOOL_DIR.parent.parent / "assets" / "pixel"


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _files_for_asset(asset_id: str) -> list[Path]:
    """Return all processed files for this asset id (handles multi-output types)."""
    if not PROCESSED_ASSETS_DIR.exists():
        return []
    return sorted(PROCESSED_ASSETS_DIR.glob(f"{asset_id}*.png"))


def _deploy_asset(asset_id: str) -> int:
    """Copy all processed files for asset_id. Returns number of files copied."""
    files = _files_for_asset(asset_id)
    if not files:
        print(f"  {asset_id} — no processed files found, skipping")
        return 0

    APP_PIXEL_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    for src in files:
        dest = APP_PIXEL_DIR / src.name
        shutil.copy2(src, dest)
        print(f"  {src.name} → assets/pixel/{src.name}")
        copied += 1
    return copied


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Deploy processed assets to assets/pixel/."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Deploy all assets")
    group.add_argument("--asset", metavar="ID", help="Deploy one asset by id")
    args = parser.parse_args()

    asset_prompts = _load_json(TOOL_DIR / "asset-prompts.json")
    assets_by_id = {a["id"]: a for a in asset_prompts["assets"]}

    if args.all:
        targets = [a["id"] for a in asset_prompts["assets"]]
    else:
        asset_id = args.asset
        if asset_id not in assets_by_id:
            print(f"ERROR: asset '{asset_id}' not found in asset-prompts.json")
            print(f"Available ids: {', '.join(assets_by_id.keys())}")
            sys.exit(1)
        targets = [asset_id]

    total_files = 0
    for asset_id in targets:
        total_files += _deploy_asset(asset_id)

    print(f"\nDeployed {total_files} file(s) → assets/pixel/")


if __name__ == "__main__":
    main()
