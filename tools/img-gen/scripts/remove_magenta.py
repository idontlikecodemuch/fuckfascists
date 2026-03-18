"""
remove_magenta.py — Remove magenta/pink backgrounds from PNGs.

Strategy:
  1. HSV-based candidate detection — catches magenta variants, pink fringes,
     and near-magenta noise far more accurately than RGB distance.
  2. Border-connected flood fill — only removes background regions reachable
     from the image border. Interior highlights are preserved.
  3. Large interior region removal — also removes large disconnected magenta
     blocks (holes/islands) above a configurable size threshold.
  4. Optional conservative defringe — strips leftover pink edge pixels.

No numpy or scipy required — pure PIL + stdlib.

Usage (batch, default):
  python3 scripts/remove_magenta.py
  python3 scripts/remove_magenta.py --defringe

Usage (single file):
  python3 scripts/remove_magenta.py input.png output.png
  python3 scripts/remove_magenta.py input.png output.png --defringe
"""

from __future__ import annotations

import colorsys
import sys
from collections import deque
from pathlib import Path
from typing import Iterable, List, Sequence, Tuple

from PIL import Image

TOOL_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = TOOL_DIR / "output" / "raw"
PROCESSED_DIR = TOOL_DIR / "output" / "processed"

Coord = Tuple[int, int]


def _is_magenta_like(
    r: int, g: int, b: int,
    hue_min: float = 285.0, hue_max: float = 345.0,
    min_sat: float = 0.35, min_val: float = 0.25,
    min_r_minus_g: int = 26, min_b_minus_g: int = 13,
) -> bool:
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    hue = h * 360.0
    return (
        hue_min <= hue <= hue_max
        and s >= min_sat and v >= min_val
        and (r - g) >= min_r_minus_g
        and (b - g) >= min_b_minus_g
    )


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


def _neighbors8(x: int, y: int, w: int, h: int) -> Iterable[Coord]:
    for ny in range(max(0, y - 1), min(h, y + 2)):
        for nx in range(max(0, x - 1), min(w, x + 2)):
            if nx != x or ny != y:
                yield nx, ny


def _build_candidate(img: Image.Image, **kw) -> List[List[bool]]:
    px = img.load()
    w, h = img.size
    out = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0:
                out[y][x] = _is_magenta_like(r, g, b, **kw)
    return out


def _flood_border(candidate: Sequence[Sequence[bool]]) -> List[List[bool]]:
    h, w = len(candidate), len(candidate[0]) if candidate else 0
    mask = [[False] * w for _ in range(h)]
    q: deque[Coord] = deque()
    for x, y in _border_coords(w, h):
        if candidate[y][x] and not mask[y][x]:
            mask[y][x] = True; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in _neighbors4(x, y, w, h):
            if candidate[ny][nx] and not mask[ny][nx]:
                mask[ny][nx] = True; q.append((nx, ny))
    return mask


def _flood_interior(
    candidate: Sequence[Sequence[bool]],
    border_mask: Sequence[Sequence[bool]],
    min_size: int,
) -> List[List[bool]]:
    h, w = len(candidate), len(candidate[0]) if candidate else 0
    visited = [[False] * w for _ in range(h)]
    remove = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            if not candidate[y][x] or border_mask[y][x] or visited[y][x]:
                continue
            region: List[Coord] = []
            q: deque[Coord] = deque([(x, y)])
            visited[y][x] = True
            while q:
                cx, cy = q.popleft()
                region.append((cx, cy))
                for nx, ny in _neighbors4(cx, cy, w, h):
                    if not visited[ny][nx] and not border_mask[ny][nx] and candidate[ny][nx]:
                        visited[ny][nx] = True; q.append((nx, ny))
            if len(region) >= min_size:
                for rx, ry in region:
                    remove[ry][rx] = True
    return remove


def _apply_mask(img: Image.Image, *masks: Sequence[Sequence[bool]]) -> Image.Image:
    out = img.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            if any(m[y][x] for m in masks):
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
    return out


def _defringe(
    img: Image.Image,
    remove_mask: Sequence[Sequence[bool]],
    hue_min: float = 285.0, hue_max: float = 345.0,
    min_sat: float = 0.25, min_val: float = 0.20,
) -> Image.Image:
    out = img.copy()
    px = out.load()
    w, h = out.size
    to_clear: List[Coord] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if not _is_magenta_like(r, g, b, hue_min=hue_min, hue_max=hue_max,
                                    min_sat=min_sat, min_val=min_val,
                                    min_r_minus_g=10, min_b_minus_g=5):
                continue
            adj_transp = adj_removed = total = 0
            for nx, ny in _neighbors8(x, y, w, h):
                total += 1
                _, _, _, na = px[nx, ny]
                if na == 0: adj_transp += 1
                if remove_mask[ny][nx]: adj_removed += 1
            if adj_transp >= 1 and adj_removed >= max(3, total // 2):
                to_clear.append((x, y))
    for x, y in to_clear:
        r, g, b, _ = px[x, y]
        px[x, y] = (r, g, b, 0)
    return out


def remove_magenta(
    img: Image.Image,
    defringe: bool = False,
    interior_min_size: int = 250,
    hue_min: float = 285.0, hue_max: float = 345.0,
    min_sat: float = 0.35, min_val: float = 0.25,
    min_r_minus_g: int = 26, min_b_minus_g: int = 13,
) -> Image.Image:
    """Return img with magenta background removed and made transparent."""
    rgba = img.convert("RGBA")
    kw = dict(hue_min=hue_min, hue_max=hue_max, min_sat=min_sat, min_val=min_val,
              min_r_minus_g=min_r_minus_g, min_b_minus_g=min_b_minus_g)
    candidate = _build_candidate(rgba, **kw)
    border_mask = _flood_border(candidate)
    interior_mask = _flood_interior(candidate, border_mask, interior_min_size)
    out = _apply_mask(rgba, border_mask, interior_mask)
    if defringe:
        combined = [[border_mask[y][x] or interior_mask[y][x]
                     for x in range(len(border_mask[0]))]
                    for y in range(len(border_mask))]
        out = _defringe(out, combined, hue_min=hue_min, hue_max=hue_max,
                        min_sat=max(0.20, min_sat - 0.10),
                        min_val=max(0.15, min_val - 0.05))
    return out


def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Remove magenta background from PNGs.")
    parser.add_argument("input", nargs="?", type=Path, help="Input PNG (omit for batch mode)")
    parser.add_argument("output", nargs="?", type=Path, help="Output PNG (omit for batch mode)")
    parser.add_argument("--defringe", action="store_true", help="Also strip pink edge fringe")
    parser.add_argument("--interior-min-size", type=int, default=250,
                        help="Min interior magenta region size to remove (default: 250)")
    parser.add_argument("--output-dir", type=Path, default=None,
                        help="Output directory for batch mode (default: output/processed/)")
    parser.add_argument("--hue-min", type=float, default=285.0, help="Hue range min (default: 285)")
    parser.add_argument("--hue-max", type=float, default=345.0, help="Hue range max (default: 345)")
    parser.add_argument("--min-sat", type=float, default=0.35, help="Min saturation (default: 0.35)")
    parser.add_argument("--min-val", type=float, default=0.25, help="Min value (default: 0.25)")
    args = parser.parse_args()

    kw = dict(defringe=args.defringe, interior_min_size=args.interior_min_size,
              hue_min=args.hue_min, hue_max=args.hue_max,
              min_sat=args.min_sat, min_val=args.min_val)

    if args.input:
        if not args.input.exists():
            print(f"ERROR: not found: {args.input}"); sys.exit(1)
        out_dir = (TOOL_DIR / args.output_dir) if args.output_dir else PROCESSED_DIR
        out_path = args.output if args.output else (out_dir / args.input.name)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        result = remove_magenta(Image.open(args.input), **kw)
        result.save(out_path, format="PNG")
        print(f"Saved {out_path}")
        return

    # Batch mode: output/raw/ → output-dir (default: output/processed/)
    out_dir = (TOOL_DIR / args.output_dir) if args.output_dir else PROCESSED_DIR
    if not RAW_DIR.exists():
        print(f"ERROR: {RAW_DIR} not found. Run generate.py first."); sys.exit(1)
    files = sorted(RAW_DIR.glob("*.png"))
    if not files:
        print(f"No PNG files in {RAW_DIR}"); sys.exit(0)
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(files, 1):
        dest = out_dir / src.name
        print(f"[{i}/{len(files)}] {src.name} → {out_dir.name}/{src.name}")
        try:
            result = remove_magenta(Image.open(src), **kw)
            result.save(dest, format="PNG")
        except Exception as e:  # noqa: BLE001
            print(f"  ERROR: {e}")
    print(f"\nDone. {len(files)} file(s) → {out_dir}")


if __name__ == "__main__":
    main()
