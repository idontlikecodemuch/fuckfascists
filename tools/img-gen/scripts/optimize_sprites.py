"""
optimize_sprites.py — Downscale + palette-quantize sprites for app deployment.

Reads full-res sprites from assets/pixel/sprites-hires/ and writes optimized
versions to assets/pixel/sprites/. Applies two transforms:

  1. Nearest-neighbor downscale (default: 2x) — pixel-perfect for pixel art,
     since each "pixel" block is already N physical pixels wide.
  2. pngquant palette quantization — reduces 32-bit RGBA to indexed PNG with
     up to 256 colors. Visually lossless on pixel art with limited palettes.

Typical results: 90%+ size reduction, zero visible quality loss.

Usage:
  python3 scripts/optimize_sprites.py              # Optimize all new/changed sprites
  python3 scripts/optimize_sprites.py --force      # Re-optimize all sprites
  python3 scripts/optimize_sprites.py --scale 2    # Downscale factor (default: 2)
  python3 scripts/optimize_sprites.py --sprite foo # Optimize one sprite by ID

After running, regenerate manifest + spriteAssets:
  python3 scripts/manifest.py
  node scripts/generate-sprite-assets.mjs  (from repo root)
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
HIRES_DIR = ROOT / "assets" / "pixel" / "sprites-hires"
OUT_DIR = ROOT / "assets" / "pixel" / "sprites"


def _check_pngquant() -> None:
    if shutil.which("pngquant") is None:
        print("ERROR: pngquant not installed. Install with: brew install pngquant")
        sys.exit(1)


def _optimize_one(src: Path, dst: Path, scale: int) -> tuple[int, int]:
    """Downscale src by 1/scale (nearest-neighbor), then pngquant. Returns (orig_bytes, new_bytes)."""
    orig_bytes = src.stat().st_size

    img = Image.open(src)
    w, h = img.size
    new_size = (w // scale, h // scale)
    resized = img.resize(new_size, Image.NEAREST)

    # Write to a temp path first, then pngquant overwrites with optimized version
    tmp_path = dst.with_suffix(".tmp.png")
    resized.save(tmp_path, optimize=True)

    # pngquant: --quality 70-95 gives near-lossless on pixel art
    subprocess.run(
        ["pngquant", "--quality=70-95", "--speed=1", "--force", "--output", str(dst), str(tmp_path)],
        check=True,
        capture_output=True,
    )
    tmp_path.unlink()

    new_bytes = dst.stat().st_size
    return orig_bytes, new_bytes


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize sprite sheets for app deployment.")
    parser.add_argument("--scale", type=int, default=2, help="Downscale factor (default: 2)")
    parser.add_argument("--force", action="store_true", help="Re-optimize even if output exists and is newer")
    parser.add_argument("--sprite", metavar="ID", help="Optimize one sprite by ID")
    args = parser.parse_args()

    _check_pngquant()

    if not HIRES_DIR.exists():
        print(f"ERROR: {HIRES_DIR} not found. Put full-res sprites there first.")
        sys.exit(1)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.sprite:
        sources = [HIRES_DIR / f"{args.sprite}.png"]
        if not sources[0].exists():
            print(f"ERROR: {sources[0]} not found")
            sys.exit(1)
    else:
        sources = sorted(HIRES_DIR.glob("*.png"))

    total = len(sources)
    total_orig = 0
    total_new = 0
    skipped = 0
    optimized = 0

    for i, src in enumerate(sources, 1):
        dst = OUT_DIR / src.name
        if dst.exists() and not args.force and dst.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue

        orig, new = _optimize_one(src, dst, args.scale)
        total_orig += orig
        total_new += new
        optimized += 1
        pct = (1 - new / orig) * 100
        print(f"[{i}/{total}] {src.name}: {orig // 1024} KB → {new // 1024} KB (-{pct:.0f}%)")

    print()
    print(f"Optimized: {optimized}, Skipped (up-to-date): {skipped}")
    if optimized:
        pct = (1 - total_new / total_orig) * 100
        print(f"Total: {total_orig // 1024 // 1024} MB → {total_new // 1024 // 1024} MB (-{pct:.1f}%)")


if __name__ == "__main__":
    main()
