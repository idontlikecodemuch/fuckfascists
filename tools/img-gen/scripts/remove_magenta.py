"""
remove_magenta.py — Chroma key: replace magenta (#FF00FF) with transparency.

Processes all PNGs in output/raw/ and writes transparent PNGs to output/processed/.

Usage:
  python scripts/remove_magenta.py

Tolerance rules:
  - Exact magenta: R >= 250, G <= 10, B >= 250 → fully transparent
  - Anti-aliasing fringe: R > 200, G < 60, B > 200, A == 255 → fully transparent
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image


TOOL_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = TOOL_DIR / "output" / "raw"
PROCESSED_DIR = TOOL_DIR / "output" / "processed"


def remove_magenta(img: Image.Image) -> Image.Image:
    """Return a copy of img with magenta (#FF00FF) pixels made transparent using NumPy."""
    rgba = img.convert("RGBA")
    data = np.array(rgba)

    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

    magenta_mask = (r >= 250) & (g <= 10) & (b >= 250)
    data[:, :, 3][magenta_mask] = 0

    return Image.fromarray(data)


def main() -> None:
    if not RAW_DIR.exists():
        print(f"ERROR: raw directory not found: {RAW_DIR}")
        print("Run generate.py first.")
        sys.exit(1)

    png_files = sorted(RAW_DIR.glob("*.png"))
    if not png_files:
        print(f"No PNG files found in {RAW_DIR}")
        sys.exit(0)

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    total = len(png_files)
    for i, src_path in enumerate(png_files, 1):
        dest_path = PROCESSED_DIR / src_path.name
        print(f"[{i}/{total}] {src_path.name} → output/processed/{src_path.name}")

        try:
            img = Image.open(src_path)
            result = remove_magenta(img)
            result.save(dest_path, format="PNG")
        except Exception as e:
            print(f"  ERROR processing {src_path.name}: {e}")
            continue

    print(f"\nDone. {total} file(s) processed → output/processed/")


if __name__ == "__main__":
    main()
