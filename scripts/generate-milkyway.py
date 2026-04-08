#!/usr/bin/env python3
"""
Generate milky way band variations for the star field background.

Creates wispy, luminous diagonal bands on transparent backgrounds using
layered noise, gaussian blur, and the project's blue/cyan/gold color palette.
Each variation has a different curve, density, and star cluster placement.

Usage:
    python3 scripts/generate-milkyway.py
    python3 scripts/generate-milkyway.py --count 5
    python3 scripts/generate-milkyway.py --preview  # show params only

Output: assets/pixel/starbg/milkyway_01.png ... milkyway_NN.png
"""

from __future__ import annotations

import argparse
import math
import os
import random
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter
except ImportError:
    print("Error: Pillow required. pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "pixel" / "starbg"

# ── Color palette (from design/tokens.ts) ─────────────────────────────────────

# Core band colors — deep blue to cyan gradient
BAND_COLORS = [
    (15, 30, 80),      # deep navy core
    (30, 60, 150),     # mid blue
    (47, 99, 255),     # frameBlue
    (95, 174, 255),    # highlightBlue
    (122, 242, 255),   # glowCyan
]

# Star cluster colors
STAR_WHITE = (255, 255, 255)
STAR_WARM = (255, 240, 190)
STAR_CYAN = (170, 210, 255)
STAR_GOLD = (255, 201, 60)     # rewardYellow


def lerp_color(c1: tuple, c2: tuple, t: float) -> tuple:
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


def band_color_at(t: float) -> tuple:
    """Sample the band color gradient at position t (0=edge, 1=center)."""
    t = max(0.0, min(1.0, t))
    n = len(BAND_COLORS) - 1
    idx = t * n
    i = min(int(idx), n - 1)
    frac = idx - i
    return lerp_color(BAND_COLORS[i], BAND_COLORS[i + 1], frac)


# ── Band shape generation ─────────────────────────────────────────────────────

def generate_band_path(width: int, height: int, rng: random.Random, variation: int):
    """Generate a curved path for the milky way band center line.

    Returns list of (x, y) points. Variations go in DIFFERENT directions:
    left-to-right, right-to-left, top-to-bottom, nearly horizontal,
    wide sweeping arcs, tight S-curves, etc.
    """
    curve_type = variation % 8
    num_points = 60

    points = []
    for i in range(num_points):
        t = i / (num_points - 1)

        if curve_type == 0:
            # Wide S-curve, top-left to bottom-right
            x = t * width
            wave = math.sin(t * math.pi * 2) * height * 0.15
            y = t * height * 0.6 + height * 0.2 + wave
        elif curve_type == 1:
            # RIGHT to LEFT diagonal (reversed direction)
            x = (1.0 - t) * width
            wave = math.sin(t * math.pi * 2.5) * height * 0.08
            y = t * height * 0.7 + height * 0.15 + wave
        elif curve_type == 2:
            # Nearly HORIZONTAL band across the middle
            x = t * width
            wave = math.sin(t * math.pi * 3) * height * 0.06
            y = height * 0.45 + wave
        elif curve_type == 3:
            # BOTTOM-LEFT to TOP-RIGHT (ascending)
            x = t * width
            y = (1.0 - t) * height * 0.7 + height * 0.15
            wave = math.sin(t * math.pi * 2) * height * 0.1
            y += wave
        elif curve_type == 4:
            # Wide sweeping ARC — high in center
            x = t * width
            arc = -math.sin(t * math.pi) * height * 0.3
            y = height * 0.55 + arc + math.sin(t * math.pi * 3) * height * 0.04
        elif curve_type == 5:
            # STEEP near-vertical with drift (top to bottom)
            x = width * 0.3 + t * width * 0.4
            y = t * height
            wave = math.sin(t * math.pi * 2) * width * 0.12
            x += wave
        elif curve_type == 6:
            # Tight double S-curve right-to-left
            x = (1.0 - t) * width
            wave = math.sin(t * math.pi * 4) * height * 0.1
            y = t * height * 0.5 + height * 0.25 + wave
        else:
            # Shallow bottom sweep — low and wide
            x = t * width
            base = height * 0.7
            dip = math.sin(t * math.pi) * height * 0.15
            wave = math.sin(t * math.pi * 2.5) * height * 0.05
            y = base - dip + wave

        # Per-point noise for organic feel
        noise_x = rng.gauss(0, width * 0.01)
        noise_y = rng.gauss(0, height * 0.01)
        points.append((x + noise_x, y + noise_y))

    return points


def draw_band_layer(img: Image.Image, points: list, width_px: float,
                    color: tuple, alpha: int, blur_radius: float,
                    rng: random.Random):
    """Draw a single blurred band layer along the path."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Draw thick line segments along the path with varying width
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        t = i / max(1, len(points) - 1)

        # Width varies: thicker in center, thinner at edges
        center_factor = 1.0 - abs(t - 0.5) * 1.6
        center_factor = max(0.2, center_factor)
        w = width_px * center_factor * rng.uniform(0.7, 1.3)

        # Perpendicular offset for width
        dx = x2 - x1
        dy = y2 - y1
        length = math.sqrt(dx * dx + dy * dy) + 0.001
        nx = -dy / length * w / 2
        ny = dx / length * w / 2

        poly = [
            (x1 + nx, y1 + ny),
            (x2 + nx, y2 + ny),
            (x2 - nx, y2 - ny),
            (x1 - nx, y1 - ny),
        ]
        r, g, b = color
        draw.polygon(poly, fill=(r, g, b, alpha))

    if blur_radius > 0:
        layer = layer.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    img.alpha_composite(layer)


def draw_star_clusters(img: Image.Image, points: list, rng: random.Random,
                       density: int = 80):
    """Scatter thousands of tiny bright star dots along and near the band.

    The milky way effect comes from sheer density of tiny bright dots,
    not from large glowing circles. Most stars are single-pixel, very bright.
    """
    draw = ImageDraw.Draw(img)
    w, h = img.size

    for _ in range(density):
        # Pick a random position along the CONTINUOUS band path (not just anchor points)
        t = rng.random() * (len(points) - 1)
        idx = int(t)
        frac = t - idx
        idx2 = min(idx + 1, len(points) - 1)
        # Lerp between adjacent anchor points for smooth distribution
        cx = points[idx][0] + (points[idx2][0] - points[idx][0]) * frac
        cy = points[idx][1] + (points[idx2][1] - points[idx][1]) * frac

        # Distance from band center — wide spread, denser in middle but not tight
        band_spread = rng.gauss(0, 55)
        sx = cx + band_spread + rng.gauss(0, 20)
        sy = cy + band_spread * 0.35 + rng.gauss(0, 20)

        if not (0 <= sx < w and 0 <= sy < h):
            continue

        # Almost all stars are single pixel — these are distant suns
        size = 1 if rng.random() < 0.96 else 2

        # Color: mix of white, blue tints, cyan, warm, gold
        roll = rng.random()
        if roll < 0.38:
            color = STAR_WHITE
        elif roll < 0.55:
            color = (200, 215, 255)   # pale blue
        elif roll < 0.70:
            color = STAR_CYAN
        elif roll < 0.80:
            color = (140, 170, 255)   # deeper blue tint
        elif roll < 0.92:
            color = STAR_WARM
        else:
            color = STAR_GOLD

        # Brightness: wide range — some faint, some blazing. Fade from center.
        center_dist = abs(band_spread) / 90.0
        base_alpha = rng.randint(80, 255)
        alpha = max(35, int(base_alpha * max(0.35, 1.0 - center_dist * 0.35)))

        r, g, b = color

        # ~2% of stars are small cross/diamond shapes (4-pointed, drawn manually)
        if rng.random() < 0.02:
            cx_i, cy_i = int(sx), int(sy)
            arm = rng.choice([1, 2, 2])
            # Draw a 4-pointed star shape with pixel lines
            for d in range(1, arm + 1):
                fade = max(40, alpha - d * 30)
                draw.point((cx_i + d, cy_i), fill=(r, g, b, fade))
                draw.point((cx_i - d, cy_i), fill=(r, g, b, fade))
                draw.point((cx_i, cy_i + d), fill=(r, g, b, fade))
                draw.point((cx_i, cy_i - d), fill=(r, g, b, fade))
            # Bright center
            draw.point((cx_i, cy_i), fill=(r, g, b, min(255, alpha + 40)))
        elif size <= 1:
            draw.point((int(sx), int(sy)), fill=(r, g, b, alpha))
        else:
            draw.ellipse(
                (int(sx), int(sy), int(sx) + 1, int(sy) + 1),
                fill=(r, g, b, alpha),
            )


def draw_bright_knots(img: Image.Image, points: list, rng: random.Random, count: int = 3):
    """Add a few bright concentration knots along the band (denser star regions)."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    for _ in range(count):
        idx = rng.randint(len(points) // 4, 3 * len(points) // 4)
        cx, cy = points[idx]
        cx += rng.gauss(0, 10)
        cy += rng.gauss(0, 10)

        # Subtle glow — just a hint of concentration, stars are the star
        radius = rng.randint(8, 16)
        alpha = rng.randint(20, 45)

        # Inner glow — brighter cyan/blue
        color = lerp_color(BAND_COLORS[3], BAND_COLORS[4], rng.random())
        r, g, b = color
        draw.ellipse(
            (int(cx) - radius, int(cy) - radius, int(cx) + radius, int(cy) + radius),
            fill=(r, g, b, alpha),
        )

        # Tiny bright stars in the knot
        for _ in range(rng.randint(15, 40)):
            sx = cx + rng.gauss(0, radius * 0.6)
            sy = cy + rng.gauss(0, radius * 0.6)
            sa = rng.randint(120, 255)
            draw.point((int(sx), int(sy)), fill=(255, 255, 255, sa))

    layer = layer.filter(ImageFilter.GaussianBlur(radius=6))
    img.alpha_composite(layer)


def generate_milkyway(width: int, height: int, variation: int, seed: int) -> Image.Image:
    """Generate one milky way band variation."""
    rng = random.Random(seed + variation * 7919)
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))

    path = generate_band_path(width, height, rng, variation)

    # Glow layers — whisper-faint, the stars themselves build the brightness
    # Layer 1: Wide atmospheric haze
    draw_band_layer(img, path, width_px=300, color=BAND_COLORS[0],
                    alpha=6, blur_radius=45, rng=rng)

    # Layer 2: Outer glow
    draw_band_layer(img, path, width_px=200, color=BAND_COLORS[0],
                    alpha=8, blur_radius=30, rng=rng)

    # Layer 3: Mid hint
    draw_band_layer(img, path, width_px=120, color=BAND_COLORS[1],
                    alpha=5, blur_radius=18, rng=rng)

    # A couple subtle knots
    draw_bright_knots(img, path, rng, count=rng.randint(1, 3))

    # THE MILKY WAY: massive number of tiny 1px dots — density IS the effect
    base_density = rng.randint(12000, 18000)
    draw_star_clusters(img, path, rng, density=base_density)

    return img


def main():
    parser = argparse.ArgumentParser(description="Generate milky way band variations")
    parser.add_argument("--count", type=int, default=3, help="Number of variations (default: 3)")
    parser.add_argument("--width", type=int, default=800, help="Image width (default: 800)")
    parser.add_argument("--height", type=int, default=1200, help="Image height (default: 1200)")
    parser.add_argument("--seed", type=int, default=42, help="Base random seed (default: 42)")
    parser.add_argument("--preview", action="store_true", help="Print params only")
    args = parser.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"Generating {args.count} milky way variations ({args.width}x{args.height})")
    print(f"  Seed: {args.seed}")
    print(f"  Output: {OUT_DIR}")

    if args.preview:
        for i in range(args.count):
            curve_type = i % 4
            types = ["S-curve", "diagonal wobble", "arch", "steep kink"]
            print(f"  [{i + 1}] curve={types[curve_type]}")
        return

    for i in range(args.count):
        img = generate_milkyway(args.width, args.height, i, args.seed)
        name = f"milkyway_{i + 1:02d}.png"
        path = OUT_DIR / name
        img.save(path)
        print(f"  Saved {name} ({args.width}x{args.height})")

    print("Done.")


if __name__ == "__main__":
    main()
