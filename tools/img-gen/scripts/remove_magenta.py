"""
remove_magenta.py — Chroma key: replace magenta (#FF00FF) with transparency.

Processes all PNGs in output/raw/ and writes transparent PNGs to output/processed/.

Usage:
  python scripts/remove_magenta.py

Keying strategy (handles noisy Gemini outputs):
  - Flood fill from all 4 corners through candidate background pixels.
  - Candidate = within RGB distance 60 of #FF00FF, OR within distance 30 of white.
  - Only border-connected regions are removed — interior highlights are preserved.
  - Alpha binarization: <200 → 0, >=200 → 255. Hard pixel-art edges, no fringe.

Requires: pip3 install numpy pillow scipy
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

try:
    from scipy import ndimage as _ndimage
except ImportError:
    print("ERROR: scipy is required. Run: pip3 install scipy")
    sys.exit(1)

TOOL_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = TOOL_DIR / "output" / "raw"
PROCESSED_DIR = TOOL_DIR / "output" / "processed"


def remove_magenta(img: Image.Image) -> Image.Image:
    """
    Return a copy of img with background keyed out and alpha binarized.

    Flood fills from all 4 corners through pixels within RGB distance 60 of
    #FF00FF or distance 30 of white. Only border-connected background regions
    are removed. Alpha binarization (<200 → 0, >=200 → 255) kills fringe.
    """
    rgba = img.convert("RGBA")
    data = np.array(rgba, dtype=np.uint8)

    r = data[:, :, 0].astype(np.float32)
    g = data[:, :, 1].astype(np.float32)
    b = data[:, :, 2].astype(np.float32)

    dist_magenta = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
    dist_white   = np.sqrt((r - 255) ** 2 + (g - 255) ** 2 + (b - 255) ** 2)

    bg_candidate = (dist_magenta < 60) | (dist_white < 30)

    labeled, _ = _ndimage.label(bg_candidate)

    border_labels = set()
    border_labels.update(labeled[0, :].flat)
    border_labels.update(labeled[-1, :].flat)
    border_labels.update(labeled[:, 0].flat)
    border_labels.update(labeled[:, -1].flat)
    border_labels.discard(0)

    bg_mask = np.isin(labeled, list(border_labels))
    data[:, :, 3][bg_mask] = 0

    alpha = data[:, :, 3]
    data[:, :, 3] = np.where(alpha >= 200, 255, 0).astype(np.uint8)

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
