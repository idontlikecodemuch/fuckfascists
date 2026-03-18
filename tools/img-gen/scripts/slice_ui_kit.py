#!/usr/bin/env python3
"""
Slice a UI kit sprite sheet into individual elements.

Auto-detects distinct non-transparent connected regions on the sheet,
extracts each as a separate transparent PNG, and saves with sequential
names (element_00.png, element_01.png, ...) ordered top-left to bottom-right.

Usage:
    # Preview mode — detect regions, print bounding boxes, don't write
    python3 scripts/slice_ui_kit.py --input <path.png> --preview

    # Slice mode — extract and save each element
    python3 scripts/slice_ui_kit.py --input <path.png> --output-dir <dir>

    # Optional: min-size filter to skip tiny artifacts
    python3 scripts/slice_ui_kit.py --input <path.png> --output-dir <dir> --min-size 20

Run from the tools/img-gen/ directory.
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Install with: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)


def find_connected_regions(img: Image.Image, alpha_threshold: int = 10, min_size: int = 20):
    """
    Find connected non-transparent regions using flood-fill BFS.

    Returns a list of (x, y, w, h) bounding boxes sorted by position
    (top to bottom, left to right).
    """
    width, height = img.size
    pixels = img.load()
    visited = [[False] * width for _ in range(height)]
    regions = []

    for y in range(height):
        for x in range(width):
            if visited[y][x]:
                continue
            # Check alpha
            a = pixels[x, y][3] if len(pixels[x, y]) == 4 else 255
            if a < alpha_threshold:
                visited[y][x] = True
                continue

            # BFS flood fill from this pixel
            queue = [(x, y)]
            visited[y][x] = True
            min_x, min_y = x, y
            max_x, max_y = x, y
            pixel_count = 0

            while queue:
                cx, cy = queue.pop(0)
                pixel_count += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)

                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < width and 0 <= ny < height and not visited[ny][nx]:
                        na = pixels[nx, ny][3] if len(pixels[nx, ny]) == 4 else 255
                        if na >= alpha_threshold:
                            visited[ny][nx] = True
                            queue.append((nx, ny))
                        else:
                            visited[ny][nx] = True

            w = max_x - min_x + 1
            h = max_y - min_y + 1

            if w >= min_size and h >= min_size:
                regions.append((min_x, min_y, w, h, pixel_count))

    # Sort by Y then X (reading order)
    regions.sort(key=lambda r: (r[1], r[0]))
    return regions


def slice_regions(img: Image.Image, regions: list, output_dir: str, padding: int = 2):
    """Extract each region from the image and save as a separate PNG."""
    os.makedirs(output_dir, exist_ok=True)
    width, height = img.size

    for i, (x, y, w, h, _count) in enumerate(regions):
        # Add padding around the crop (clamped to image bounds)
        x0 = max(0, x - padding)
        y0 = max(0, y - padding)
        x1 = min(width, x + w + padding)
        y1 = min(height, y + h + padding)

        crop = img.crop((x0, y0, x1, y1))
        filename = f"element_{i:02d}.png"
        crop.save(os.path.join(output_dir, filename))
        print(f"  Saved {filename} ({x1 - x0}x{y1 - y0})")


def main():
    parser = argparse.ArgumentParser(description="Slice UI kit sprite sheet into individual elements")
    parser.add_argument("--input", required=True, help="Path to the UI kit PNG")
    parser.add_argument("--output-dir", help="Output directory for sliced elements")
    parser.add_argument("--preview", action="store_true", help="Preview mode — detect and print regions only")
    parser.add_argument("--min-size", type=int, default=20, help="Minimum region dimension in px (default: 20)")
    parser.add_argument("--alpha-threshold", type=int, default=10, help="Alpha threshold for non-transparent (default: 10)")
    parser.add_argument("--padding", type=int, default=2, help="Padding around each extracted element (default: 2)")
    args = parser.parse_args()

    if not args.preview and not args.output_dir:
        parser.error("--output-dir is required when not in --preview mode")

    img = Image.open(args.input).convert("RGBA")
    print(f"Input: {args.input} ({img.size[0]}x{img.size[1]})")

    print(f"Detecting regions (min-size={args.min_size}, alpha-threshold={args.alpha_threshold})...")
    regions = find_connected_regions(img, alpha_threshold=args.alpha_threshold, min_size=args.min_size)
    print(f"Found {len(regions)} regions:\n")

    for i, (x, y, w, h, count) in enumerate(regions):
        print(f"  [{i:02d}] pos=({x}, {y})  size={w}x{h}  pixels={count}")

    if args.preview:
        print(f"\nPreview complete. {len(regions)} elements detected.")
        return

    print(f"\nSlicing to {args.output_dir}...")
    slice_regions(img, regions, args.output_dir, padding=args.padding)
    print(f"Done. {len(regions)} elements saved.")


if __name__ == "__main__":
    main()
