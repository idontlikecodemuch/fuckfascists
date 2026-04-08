#!/usr/bin/env python3
"""
Slice star field background source sheets into individual assets.

Two source sheets:
  1. Galaxies (RGB, dark bg) — detect bright regions, crop, make dark edges transparent.
  2. Rocks (RGBA, grey bg) — key out grey background via border BFS, crop regions.

Also generates a procedural star texture PNG (dense dot field on transparent bg).

Usage:
    python3 scripts/slice-starbg-sources.py

    # Preview mode — detect regions, print bounding boxes, don't write
    python3 scripts/slice-starbg-sources.py --preview

    # Custom max dimension for output assets
    python3 scripts/slice-starbg-sources.py --max-dim 250

Output goes to assets/pixel/starbg/.
"""

from __future__ import annotations

import colorsys
import os
import random
import sys
from collections import deque
from pathlib import Path
from typing import Iterable, List, Tuple

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is required. Install with: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

Coord = Tuple[int, int]

ROOT = Path(__file__).resolve().parent.parent
GALAXY_SRC = ROOT / "assets" / "starbg" / "ChatGPT Image Apr 5, 2026, 05_39_55 PM.png"
ROCK_SRC = ROOT / "assets" / "starbg" / "ChatGPT Image Apr 5, 2026, 05_40_09 PM.png"
OUT_DIR = ROOT / "assets" / "pixel" / "starbg"


# ── Helpers (from remove_magenta.py / slice_ui_kit.py patterns) ──────────────


def _border_coords(w: int, h: int) -> Iterable[Coord]:
    seen: set[Coord] = set()
    for x in range(w):
        for y in (0, h - 1):
            if (x, y) not in seen:
                seen.add((x, y)); yield x, y
    for y in range(h):
        for x in (0, w - 1):
            if (x, y) not in seen:
                seen.add((x, y)); yield x, y


def _neighbors4(x: int, y: int, w: int, h: int) -> Iterable[Coord]:
    if x > 0: yield x - 1, y
    if x + 1 < w: yield x + 1, y
    if y > 0: yield x, y - 1
    if y + 1 < h: yield x, y + 1


def _is_dark(r: int, g: int, b: int, threshold: int = 30) -> bool:
    return max(r, g, b) < threshold


def _is_grey_bg(r: int, g: int, b: int, a: int) -> bool:
    if a < 10:
        return True
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    return s < 0.18 and v > 0.35


def find_bright_regions(img: Image.Image, lum_threshold: int = 40, min_size: int = 80):
    """Find connected bright regions on a dark background."""
    w, h = img.size
    pixels = img.load()
    visited = [[False] * w for _ in range(h)]
    regions = []

    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                continue
            r, g, b = pixels[x, y][:3]
            if max(r, g, b) < lum_threshold:
                visited[y][x] = True
                continue

            queue = deque([(x, y)])
            visited[y][x] = True
            min_x, min_y = x, y
            max_x, max_y = x, y
            count = 0

            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)

                for nx, ny in _neighbors4(cx, cy, w, h):
                    if not visited[ny][nx]:
                        nr, ng, nb = pixels[nx, ny][:3]
                        visited[ny][nx] = True
                        if max(nr, ng, nb) >= lum_threshold:
                            queue.append((nx, ny))

            rw = max_x - min_x + 1
            rh = max_y - min_y + 1
            if rw >= min_size and rh >= min_size:
                regions.append((min_x, min_y, rw, rh, count))

    regions.sort(key=lambda r: (r[1], r[0]))
    return regions


def remove_grey_bg(img: Image.Image) -> Image.Image:
    """Remove grey background via border-connected BFS flood fill."""
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    to_clear: set[Coord] = set()

    queue = deque()
    for bx, by in _border_coords(w, h):
        r, g, b, a = pixels[bx, by]
        if _is_grey_bg(r, g, b, a):
            to_clear.add((bx, by))
            queue.append((bx, by))

    while queue:
        cx, cy = queue.popleft()
        for nx, ny in _neighbors4(cx, cy, w, h):
            if (nx, ny) not in to_clear:
                r, g, b, a = pixels[nx, ny]
                if _is_grey_bg(r, g, b, a):
                    to_clear.add((nx, ny))
                    queue.append((nx, ny))

    for x, y in to_clear:
        pixels[x, y] = (0, 0, 0, 0)

    return img


def find_opaque_regions(img: Image.Image, alpha_threshold: int = 10, min_size: int = 60):
    """Find connected non-transparent regions (same as slice_ui_kit.py)."""
    w, h = img.size
    pixels = img.load()
    visited = [[False] * w for _ in range(h)]
    regions = []

    for y in range(h):
        for x in range(w):
            if visited[y][x]:
                continue
            a = pixels[x, y][3] if len(pixels[x, y]) >= 4 else 255
            if a < alpha_threshold:
                visited[y][x] = True
                continue

            queue = deque([(x, y)])
            visited[y][x] = True
            min_x, min_y = x, y
            max_x, max_y = x, y
            count = 0

            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)

                for nx, ny in _neighbors4(cx, cy, w, h):
                    if not visited[ny][nx]:
                        visited[ny][nx] = True
                        na = pixels[nx, ny][3] if len(pixels[nx, ny]) >= 4 else 255
                        if na >= alpha_threshold:
                            queue.append((nx, ny))

            rw = max_x - min_x + 1
            rh = max_y - min_y + 1
            if rw >= min_size and rh >= min_size:
                regions.append((min_x, min_y, rw, rh, count))

    regions.sort(key=lambda r: (r[1], r[0]))
    return regions


def crop_and_scale(img: Image.Image, regions: list, prefix: str, max_dim: int,
                   padding: int = 8, make_dark_transparent: bool = False):
    """Crop each region, optionally clear dark edges, scale, and save."""
    w, h = img.size
    saved = []

    for i, (rx, ry, rw, rh, _) in enumerate(regions):
        x0 = max(0, rx - padding)
        y0 = max(0, ry - padding)
        x1 = min(w, rx + rw + padding)
        y1 = min(h, ry + rh + padding)

        crop = img.crop((x0, y0, x1, y1)).convert("RGBA")

        if make_dark_transparent:
            px = crop.load()
            cw, ch = crop.size
            for cy in range(ch):
                for cx in range(cw):
                    r, g, b, a = px[cx, cy]
                    if _is_dark(r, g, b, threshold=20):
                        px[cx, cy] = (0, 0, 0, 0)

        # Scale to max_dim preserving aspect ratio
        cw, ch = crop.size
        scale = max_dim / max(cw, ch)
        if scale < 1.0:
            new_w = max(1, int(cw * scale))
            new_h = max(1, int(ch * scale))
            crop = crop.resize((new_w, new_h), Image.LANCZOS)

        name = f"{prefix}_{i + 1:02d}.png"
        path = OUT_DIR / name
        crop.save(path)
        saved.append((name, crop.size))
        print(f"  Saved {name} ({crop.size[0]}x{crop.size[1]})")

    return saved


def generate_star_texture(width: int = 400, height: int = 800, count: int = 120, seed: int = 42):
    """Generate a procedural star field texture PNG."""
    random.seed(seed)
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    colors = [
        ((255, 255, 255), 0.65),    # white
        ((255, 240, 190), 0.17),    # warm yellow
        ((170, 210, 255), 0.18),    # cool blue
    ]

    for _ in range(count):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        size = random.choice([1, 1, 1, 2, 2, 3])
        opacity = random.randint(40, 160)

        roll = random.random()
        cumulative = 0.0
        color = colors[0][0]
        for c, weight in colors:
            cumulative += weight
            if roll < cumulative:
                color = c
                break

        r, g, b = color
        if size == 1:
            draw.point((x, y), fill=(r, g, b, opacity))
        else:
            half = size // 2
            draw.ellipse(
                (x - half, y - half, x + half, y + half),
                fill=(r, g, b, opacity),
            )

    path = OUT_DIR / "star_field_base.png"
    img.save(path)
    print(f"  Saved star_field_base.png ({width}x{height}, {count} stars)")
    return path


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Slice starbg source sheets")
    parser.add_argument("--preview", action="store_true", help="Detect regions only, no output")
    parser.add_argument("--max-dim", type=int, default=200, help="Max output dimension (default: 200)")
    args = parser.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)

    # ── Galaxies ──
    print(f"\n=== Galaxies ===")
    print(f"Source: {GALAXY_SRC}")
    gal_img = Image.open(GALAXY_SRC).convert("RGB")
    gal_regions = find_bright_regions(gal_img, lum_threshold=35, min_size=80)
    print(f"Found {len(gal_regions)} galaxy regions:")
    for i, (x, y, w, h, c) in enumerate(gal_regions):
        print(f"  [{i}] pos=({x},{y}) size={w}x{h} pixels={c}")

    if not args.preview:
        print("Cropping galaxies...")
        crop_and_scale(gal_img, gal_regions, "gal", args.max_dim,
                       padding=12, make_dark_transparent=True)

    # ── Rocks ──
    print(f"\n=== Rocks ===")
    print(f"Source: {ROCK_SRC}")
    rock_img = Image.open(ROCK_SRC).convert("RGBA")
    print("Removing grey background...")
    rock_clean = remove_grey_bg(rock_img)
    rock_regions = find_opaque_regions(rock_clean, alpha_threshold=15, min_size=60)
    print(f"Found {len(rock_regions)} rock regions:")
    for i, (x, y, w, h, c) in enumerate(rock_regions):
        print(f"  [{i}] pos=({x},{y}) size={w}x{h} pixels={c}")

    if not args.preview:
        print("Cropping rocks...")
        crop_and_scale(rock_clean, rock_regions, "rock", max(150, args.max_dim - 50),
                       padding=8)

    # ── Star texture ──
    if not args.preview:
        print(f"\n=== Star Texture ===")
        generate_star_texture()

    print("\nDone.")


if __name__ == "__main__":
    main()
