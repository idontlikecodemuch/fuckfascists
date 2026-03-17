"""
remove_magenta.py — Chroma key: replace magenta (#FF00FF) with transparency.

Processes all PNGs in output/raw/ and writes transparent PNGs to output/processed/.

Usage:
  python scripts/remove_magenta.py

Keying strategy (handles noisy Gemini outputs):
  1. Flood fill from all 4 corners through candidate background pixels.
     Candidate = within RGB distance 60 of #FF00FF, OR within distance 30 of white.
     Only border-connected regions are removed — interior highlights are preserved.
  2. Alpha binarization: <200 → 0, >=200 → 255. Hard pixel-art edges, no fringe.
  3. 1px alpha erosion: any opaque pixel with a transparent 4-neighbor becomes
     transparent. Removes the anti-aliased fringe halo that survives keying.

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


def _erode_alpha_1px(data: np.ndarray) -> None:
    """
    1px alpha erosion: make any opaque pixel transparent if at least one of
    its 4 immediate neighbors (up, down, left, right) is transparent.

    This removes exactly one pixel ring from every opaque edge — the
    anti-aliased fringe halo that survives keying + binarization.
    Interior pixels are untouched because all their neighbors are opaque.

    Modifies data in-place.
    """
    alpha = data[:, :, 3]
    opaque = alpha > 0

    # Check each of the 4 cardinal neighbors for transparency.
    # Pixels at the image border treat the out-of-bounds neighbor as transparent.
    has_transparent_above = np.zeros_like(opaque)
    has_transparent_below = np.zeros_like(opaque)
    has_transparent_left  = np.zeros_like(opaque)
    has_transparent_right = np.zeros_like(opaque)

    has_transparent_above[0, :]  = True   # top row — no neighbor above
    has_transparent_above[1:, :] = ~opaque[:-1, :]

    has_transparent_below[-1, :] = True   # bottom row — no neighbor below
    has_transparent_below[:-1, :] = ~opaque[1:, :]

    has_transparent_left[:, 0]  = True    # left column — no neighbor left
    has_transparent_left[:, 1:] = ~opaque[:, :-1]

    has_transparent_right[:, -1] = True   # right column — no neighbor right
    has_transparent_right[:, :-1] = ~opaque[:, 1:]

    edge_mask = opaque & (
        has_transparent_above | has_transparent_below |
        has_transparent_left  | has_transparent_right
    )

    data[:, :, 3][edge_mask] = 0


def remove_magenta(img: Image.Image) -> Image.Image:
    """
    Return a copy of img with background keyed out, alpha binarized, and
    1px fringe eroded.

    1. Flood fill from corners through near-magenta / near-white candidates.
    2. Alpha binarization (<200 → 0, >=200 → 255).
    3. 1px alpha erosion — removes the anti-aliased halo ring.
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

    # Alpha binarization
    alpha = data[:, :, 3]
    data[:, :, 3] = np.where(alpha >= 200, 255, 0).astype(np.uint8)

    # 1px alpha erosion — strip fringe halo
    _erode_alpha_1px(data)

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
