#!/usr/bin/env python3
"""
Scorecard composite — Claude Design "polished main" rendering at 1080×1920.

Mirrors features/Scorecard/components/ScorecardImage.tsx (and helpers). All
sizes / positions / colors live here AND in the RN component; the Python
output is the visual reference target so design tweaks can iterate without
running the app.

Composition (top → bottom):
  Header   — FF logo + SCORECARD subtitle + beam-flanked date range
  Hero     — "I FCK'D N×" together (gold count w/ glow)
  Panel    — person rows + cyan corner ticks + 2px border + inset glow
  Closing  — THIS WEEK, right-aligned
  Footer   — beam + 🤘 tagline + CTA URL + DATA: FEC.GOV
  Decor    — vignette, scanlines, sparkles, gold frame

Run:
  python3 tools/img-gen/scripts/composite_scorecard.py
Output:
  tools/img-gen/output/scorecard/scorecard_test.png
"""

from __future__ import annotations

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MAIN_REPO = Path("/Users/christophershannon/fuckfascists")
OUT_DIR = REPO_ROOT / "tools" / "img-gen" / "output" / "scorecard"
FONT_DIR = MAIN_REPO / "assets" / "fonts"
SPRITE_DIR = MAIN_REPO / "assets" / "pixel" / "sprites"
SCORECARD_ASSETS = MAIN_REPO / "assets" / "pixel" / "scorecard"
BRAND_DIR = MAIN_REPO / "assets" / "pixel" / "brand"

# ── Design constants (1080×1920) ────────────────────────────────────────────
W, H = 1080, 1920
CONTENT_TOP = 120
CONTENT_LEFT = 140
CONTENT_RIGHT = 140
CONTENT_BOTTOM = 130
INNER_W = W - CONTENT_LEFT - CONTENT_RIGHT  # 800

# Colors (mirrored from design/tokens.ts + scorecard mock)
GOLD = (255, 201, 60, 255)
CREAM = (232, 224, 208, 255)
MUTED = (168, 180, 200, 255)
DIM = (102, 119, 136, 255)
CYAN = (122, 242, 255, 255)
BLUE = (40, 120, 200, 255)
PANEL_BORDER = (42, 45, 48, 255)

# Fonts
BUNGEE = "Bungee-Regular.ttf"
PLEX_MEDIUM = "IBMPlexSans-Medium.ttf"
PLEX_SEMIBOLD = "IBMPlexSans-SemiBold.ttf"

# Power bar geometry (matches config/constants.ts)
BAR_LEFT = 22
BAR_BOTTOM = 520
BAR_WIDTH = 70
BAR_TUBE_HEIGHT = 820
TIER_NATIVE_H = {"idle": 1371, "hot": 1473, "fck": 1576, "legendary": 1580}

# Sample data (matches scorecard/card.jsx defaults — design source of truth)
DEFAULT_PERSONS = [
    ("ZUCKERBERG", "Meta · Instagram · Facebook", 5, "mark-zuckerberg"),
    ("BEZOS",      "Amazon · Amazon Prime",       3, "jeff-bezos"),
    ("JOYNER",     "CVS",                         2, "david-joyner"),
    ("MUSK",       "X · Tesla",                   2, "elon-musk"),
]
DATE_RANGE = "APR 4 — APR 10"
GRAND_TOTAL = 11
POWER_TIER = "legendary"

# 2×1 layout sprites (others are 2×2). Defeated = right half.
SPRITE_2X1 = {"david-joyner"}


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_DIR / name), size)


def text_w(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, ls: float = 0) -> int:
    """Width of text including letterSpacing (PIL ignores letterSpacing)."""
    bbox = draw.textbbox((0, 0), text, font=f)
    base = bbox[2] - bbox[0]
    return base + max(0, len(text) - 1) * int(ls)


def draw_letter_spaced(canvas: Image.Image, xy: tuple[int, int], text: str,
                       f: ImageFont.FreeTypeFont, fill: tuple, ls: float = 0,
                       shadow: tuple | None = None, shadow_off: tuple = (0, 4),
                       glow: tuple | None = None, glow_radius: int = 22):
    """Draw text with optional drop shadow + glow, honouring letterSpacing."""
    draw = ImageDraw.Draw(canvas)
    if glow is not None:
        glow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_layer)
        x = xy[0]
        for ch in text:
            gd.text((x, xy[1]), ch, font=f, fill=glow)
            x += gd.textbbox((0, 0), ch, font=f)[2] + ls
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=glow_radius))
        canvas.alpha_composite(glow_layer)
    if shadow is not None:
        x = xy[0] + shadow_off[0]
        y = xy[1] + shadow_off[1]
        sd = ImageDraw.Draw(canvas)
        for ch in text:
            sd.text((x, y), ch, font=f, fill=shadow)
            x += draw.textbbox((0, 0), ch, font=f)[2] + ls
    x = xy[0]
    for ch in text:
        draw.text((x, xy[1]), ch, font=f, fill=fill)
        x += draw.textbbox((0, 0), ch, font=f)[2] + ls


def render_starfield(canvas: Image.Image) -> None:
    """Layer 1: starfield bg, fill canvas."""
    bg = Image.open(SCORECARD_ASSETS / "starbg.jpg").convert("RGBA")
    canvas.paste(bg.resize((W, H), Image.LANCZOS), (0, 0))


def render_vignette(canvas: Image.Image) -> None:
    """Layer 2: radial dark vignette at edges (transparent center → 55% black corners)."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    cx, cy = W / 2, H / 2
    max_r = math.sqrt(cx * cx + cy * cy)
    px = overlay.load()
    for y in range(H):
        for x in range(W):
            d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
            t = max(0.0, (d / max_r - 0.5) / 0.5)  # 0 in inner half, 1 at corners
            a = int(140 * t)  # ~0.55 max alpha
            if a > 0:
                px[x, y] = (0, 0, 0, a)
    canvas.alpha_composite(overlay)


def render_scanlines(canvas: Image.Image) -> None:
    """Layer 3: subtle 1px-every-4px CRT scanlines."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 46))
    # 60% opacity matches the RN side
    overlay.putalpha(overlay.split()[3].point(lambda a: int(a * 0.6)))
    canvas.alpha_composite(overlay)


def render_power_bar(canvas: Image.Image, tier: str = POWER_TIER) -> None:
    """Layer 4: tier PNG anchored to fixed bottom; height scales with native PNG height."""
    img = Image.open(SCORECARD_ASSETS / f"power_{tier}.png").convert("RGBA")
    nat_h = TIER_NATIVE_H.get(tier, TIER_NATIVE_H["idle"])
    render_h = int(BAR_TUBE_HEIGHT * (nat_h / TIER_NATIVE_H["idle"]))
    bar = img.resize((BAR_WIDTH, render_h), Image.LANCZOS)
    # Soft amber glow underlay
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    glow.paste(bar, (BAR_LEFT, H - BAR_BOTTOM - render_h), bar)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=10))
    canvas.alpha_composite(glow)
    canvas.paste(bar, (BAR_LEFT, H - BAR_BOTTOM - render_h), bar)


def draw_beam(canvas: Image.Image, x_center: int, y: int, width: int) -> None:
    """Horizontal cyan rule with cyan + blue glow."""
    bar = Image.new("RGBA", (width, 4), CYAN[:3] + (217,))  # 0.85 alpha
    glow = Image.new("RGBA", (width + 60, 60), (0, 0, 0, 0))
    glow.paste(bar, (30, 28), bar)
    glow_cyan = glow.filter(ImageFilter.GaussianBlur(radius=14))
    glow_blue = Image.new("RGBA", (width + 60, 60), (0, 0, 0, 0))
    bar_blue = Image.new("RGBA", (width, 4), BLUE[:3] + (102,))  # 0.4 alpha
    glow_blue.paste(bar_blue, (30, 28), bar_blue)
    glow_blue = glow_blue.filter(ImageFilter.GaussianBlur(radius=28))
    base_x = x_center - (width + 60) // 2
    base_y = y - 30
    canvas.alpha_composite(glow_blue, (base_x, base_y))
    canvas.alpha_composite(glow_cyan, (base_x, base_y))
    canvas.alpha_composite(glow, (base_x, base_y))


def render_header(canvas: Image.Image, date_range: str) -> int:
    """Layer 5: logo + SCORECARD subtitle + beam-flanked date range. Returns y-cursor."""
    cursor = CONTENT_TOP
    logo = Image.open(BRAND_DIR / "FF_logo.png").convert("RGBA")
    target_w = 520
    aspect = logo.height / logo.width
    target_h = int(target_w * aspect)
    logo_resized = logo.resize((target_w, target_h), Image.NEAREST)
    # Gold drop-shadow
    shadow = logo_resized.copy()
    shadow.putalpha(shadow.split()[3].point(lambda a: a // 3))
    shadow_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sx = (W - target_w) // 2
    shadow_layer.paste(shadow, (sx, cursor), shadow)
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=20))
    gold_tint = Image.new("RGBA", canvas.size, GOLD[:3] + (0,))
    canvas.alpha_composite(shadow_layer)
    canvas.paste(logo_resized, (sx, cursor), logo_resized)
    cursor += target_h + 6
    # SCORECARD subtitle
    f_sub = font(PLEX_SEMIBOLD, 32)
    sub_text = "SCORECARD"
    sub_w = text_w(ImageDraw.Draw(canvas), sub_text, f_sub, 14)
    draw_letter_spaced(canvas, ((W - sub_w) // 2, cursor - 4), sub_text, f_sub, CREAM, 14)
    cursor += 32 + 4
    # Beam-flanked date row
    f_date = font(PLEX_MEDIUM, 26)
    date_w = text_w(ImageDraw.Draw(canvas), date_range, f_date, 4)
    beam_w = 140
    gap = 20
    total_w = beam_w + gap + date_w + gap + beam_w
    bx = (W - total_w) // 2
    by = cursor + 16
    draw_beam(canvas, bx + beam_w // 2, by, beam_w)
    text_x = bx + beam_w + gap
    draw_letter_spaced(canvas, (text_x, cursor), date_range, f_date, DIM, 4)
    draw_beam(canvas, text_x + date_w + gap + beam_w // 2, by, beam_w)
    cursor += 26 + 30
    _ = gold_tint  # silence unused
    return cursor


def render_headline(canvas: Image.Image, total: int, y: int) -> int:
    """Layer 6: 'I FCK'D N×' together — Bungee 120, gold N× with glow."""
    f_hl = font(BUNGEE, 120)
    f_x = font(PLEX_SEMIBOLD, 84)
    prefix = "I FCK'D"
    count = str(total)
    times = "×"
    draw = ImageDraw.Draw(canvas)
    px = CONTENT_LEFT
    # Drop shadow on white prefix
    draw_letter_spaced(canvas, (px, y), prefix, f_hl, CREAM, 2,
                       shadow=(0, 0, 0, 178), shadow_off=(0, 4))
    px += text_w(draw, prefix, f_hl, 2) + 18
    # Gold count with glow
    draw_letter_spaced(canvas, (px, y), count, f_hl, GOLD,
                       shadow=(0, 0, 0, 153), shadow_off=(0, 4),
                       glow=GOLD[:3] + (179,), glow_radius=22)
    px += draw.textbbox((0, 0), count, font=f_hl)[2]
    # × suffix in Plex SemiBold (smaller)
    draw.text((px, y + 30), times, font=f_x, fill=GOLD)
    return y + 120


def render_panel(canvas: Image.Image, persons, y: int) -> int:
    """Data panel + cyan corner ticks + person rows."""
    pad_top, pad_x, pad_bot = 14, 24, 18
    sprite_h = 180
    row_h = sprite_h + 28  # padding 14×2
    panel_h = pad_top + len(persons) * row_h + pad_bot
    px, py = CONTENT_LEFT, y + 20
    pw, ph = INNER_W, panel_h

    # Panel bg (gradient 0.55 → 0.70)
    panel = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    for row in range(ph):
        t = row / max(1, ph - 1)
        a = int(140 + (179 - 140) * t)  # 0.55 → 0.70
        pd.line([(0, row), (pw, row)], fill=(10, 16, 28, a))
    canvas.alpha_composite(panel, (px, py))

    # Border 2px panelBorder
    pd2 = ImageDraw.Draw(canvas)
    pd2.rectangle([px, py, px + pw - 1, py + ph - 1], outline=PANEL_BORDER, width=2)

    # Inset glow approximation — blue inner shadow
    inner_glow = Image.new("RGBA", (pw + 80, ph + 80), (0, 0, 0, 0))
    igd = ImageDraw.Draw(inner_glow)
    igd.rectangle([40, 40, pw + 40 - 1, ph + 40 - 1], outline=BLUE[:3] + (31,), width=20)
    inner_glow = inner_glow.filter(ImageFilter.GaussianBlur(radius=18))
    canvas.alpha_composite(inner_glow, (px - 40, py - 40))

    # Corner ticks (4 cyan L-brackets, 18×18, 2px borders, 8px glow)
    for edge in ("tl", "tr", "bl", "br"):
        is_top = "t" in edge
        is_left = "l" in edge
        cx = px - 3 if is_left else px + pw + 3 - 18
        cy = py - 3 if is_top else py + ph + 3 - 18
        tick = Image.new("RGBA", (18, 18), (0, 0, 0, 0))
        td = ImageDraw.Draw(tick)
        if is_top:
            td.line([(0, 0), (18, 0)], fill=CYAN, width=2)
        else:
            td.line([(0, 17), (18, 17)], fill=CYAN, width=2)
        if is_left:
            td.line([(0, 0), (0, 18)], fill=CYAN, width=2)
        else:
            td.line([(17, 0), (17, 18)], fill=CYAN, width=2)
        glow = Image.new("RGBA", (38, 38), (0, 0, 0, 0))
        glow.paste(tick, (10, 10), tick)
        glow = glow.filter(ImageFilter.GaussianBlur(radius=8))
        canvas.alpha_composite(glow, (cx - 10, cy - 10))
        canvas.paste(tick, (cx, cy), tick)

    # Person rows
    for i, p in enumerate(persons):
        row_y = py + pad_top + i * row_h
        render_person_row(canvas, px + pad_x, row_y, pw - pad_x * 2, p,
                          is_last=(i == len(persons) - 1))
    return py + ph


def render_person_row(canvas: Image.Image, x: int, y: int, w: int,
                      person: tuple, is_last: bool) -> None:
    name, platforms, count, slug = person
    # Sprite slot 200, sprite 180 centered
    spr = sprite_defeated(slug, 180)
    if spr is not None:
        canvas.paste(spr, (x + (200 - 180) // 2, y), spr)
    # Name + detail column
    name_x = x + 200 + 20
    f_name = font(PLEX_SEMIBOLD, 52)
    f_det = font(PLEX_MEDIUM, 26)
    draw_letter_spaced(canvas, (name_x, y + 30), name, f_name, CREAM, 2,
                       shadow=(0, 0, 0, 204), shadow_off=(0, 2))
    ImageDraw.Draw(canvas).text((name_x, y + 30 + 60), platforms, font=f_det, fill=MUTED)
    # Count right-aligned, gold w/ glow
    f_count = font(BUNGEE, 104)
    f_x = font(PLEX_SEMIBOLD, 68)
    count_str = str(count)
    times = "×"
    draw = ImageDraw.Draw(canvas)
    times_w = draw.textbbox((0, 0), times, font=f_x)[2]
    count_w = draw.textbbox((0, 0), count_str, font=f_count)[2]
    total_w = count_w + times_w + 4
    cx = x + w - 16 - total_w
    draw_letter_spaced(canvas, (cx, y + 18), count_str, f_count, GOLD,
                       shadow=(0, 0, 0, 153), shadow_off=(0, 4),
                       glow=GOLD[:3] + (140,), glow_radius=18)
    draw.text((cx + count_w + 4, y + 50), times, font=f_x, fill=GOLD)
    # Divider when not last
    if not is_last:
        d = ImageDraw.Draw(canvas)
        d.line([(x, y + 200), (x + w, y + 200)], fill=(255, 255, 255, 18), width=1)


def sprite_defeated(slug: str, size: int) -> Image.Image | None:
    """Extract defeated variant from sprite sheet, scaled to 'size' tall."""
    path = SPRITE_DIR / f"{slug}.png"
    if not path.exists():
        return None
    sheet = Image.open(path).convert("RGBA")
    sw, sh = sheet.size
    is_2x1 = slug in SPRITE_2X1 or sw > sh * 1.5
    if is_2x1:
        cell_w, cell_h = sw // 2, sh
        frame = sheet.crop((cell_w, 0, sw, sh))
    else:
        cell_w, cell_h = sw // 2, sh // 2
        frame = sheet.crop((cell_w, 0, sw, cell_h))
    # Scale so the rendered cell height = size; preserve aspect.
    scale = size / cell_h
    new_w = int(cell_w * scale)
    new_h = int(cell_h * scale)
    return frame.resize((new_w, new_h), Image.NEAREST)


def render_this_week(canvas: Image.Image, y: int) -> int:
    f = font(BUNGEE, 64)
    text = "THIS WEEK"
    draw = ImageDraw.Draw(canvas)
    tw = text_w(draw, text, f, 6)
    x = CONTENT_LEFT + INNER_W - tw
    draw_letter_spaced(canvas, (x, y + 20), text, f, CREAM, 6,
                       shadow=(0, 0, 0, 178), shadow_off=(0, 3))
    return y + 20 + 64


def render_footer(canvas: Image.Image) -> None:
    """Layer 8: beam + 🤘 tagline + CTA URL + DATA: FEC.GOV. Bottom-anchored."""
    cursor = H - CONTENT_BOTTOM
    f_attr = font(PLEX_SEMIBOLD, 22)
    f_cta = font(BUNGEE, 58)
    f_tag = font(PLEX_SEMIBOLD, 32)
    draw = ImageDraw.Draw(canvas)
    # Bottom-up
    attr_text = "DATA: FEC.GOV"
    aw = text_w(draw, attr_text, f_attr, 6)
    cursor -= 22 - 4
    draw_letter_spaced(canvas, ((W - aw) // 2, cursor), attr_text, f_attr, DIM, 6)
    cursor -= 16
    # CTA
    cta_text = "FCKFASCISTS.ORG"
    cw = text_w(draw, cta_text, f_cta, 6)
    cursor -= 58 + 4
    draw_letter_spaced(canvas, ((W - cw) // 2, cursor), cta_text, f_cta, CYAN, 6,
                       shadow=(0, 0, 0, 153), shadow_off=(0, 3),
                       glow=CYAN[:3] + (230,), glow_radius=20)
    cursor -= 16
    # Tagline (with horns)
    horns_l, tag, horns_r = "🤘 ", "The fascists won't f*ck themselves.", " 🤘"
    full = horns_l + tag + horns_r
    fw = draw.textbbox((0, 0), full, font=f_tag)[2]
    cursor -= 32 + 8
    tx = (W - fw) // 2
    # Render tagline body in muted, horns in gold (PIL doesn't support inline color).
    draw.text((tx, cursor), horns_l, font=f_tag, fill=GOLD)
    hw_l = draw.textbbox((0, 0), horns_l, font=f_tag)[2]
    draw.text((tx + hw_l, cursor), tag, font=f_tag, fill=MUTED)
    tw = draw.textbbox((0, 0), tag, font=f_tag)[2]
    draw.text((tx + hw_l + tw, cursor), horns_r, font=f_tag, fill=GOLD)
    cursor -= 16
    # Beam divider
    draw_beam(canvas, W // 2, cursor, 520)


def render_sparkles(canvas: Image.Image) -> None:
    """Layer 9: sparkles (gold + cyan) at design positions."""
    sparks = [
        (180, 140, 22, GOLD, 0, 1.0),
        (940, 210, 18, GOLD, 25, 1.0),
        (150, 1700, 20, GOLD, 0, 1.0),
        (960, 1760, 24, GOLD, -15, 1.0),
        (240, 900, 14, GOLD, 0, 0.7),
        (880, 1100, 14, GOLD, 0, 0.7),
        (90, 1500, 18, CYAN, 0, 0.8),
        (1000, 1400, 16, CYAN, 0, 0.7),
    ]
    for x, y, size, color, rot, alpha in sparks:
        draw_sparkle(canvas, x, y, size, color, rot, alpha)


def draw_sparkle(canvas: Image.Image, x: int, y: int, size: int,
                 color: tuple, rot: int, alpha: float) -> None:
    """4-pointed star path with drop-shadow glow."""
    layer = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = cy = size
    pts = [(cx, cy - size), (cx + size // 5, cy), (cx + size, cy),
           (cx + size // 5, cy + size // 5), (cx, cy + size),
           (cx - size // 5, cy + size // 5), (cx - size, cy),
           (cx - size // 5, cy - size // 5)]
    fc = (color[0], color[1], color[2], int(255 * alpha))
    d.polygon(pts, fill=fc)
    if rot != 0:
        layer = layer.rotate(rot, resample=Image.BICUBIC)
    glow = layer.filter(ImageFilter.GaussianBlur(radius=6))
    canvas.alpha_composite(glow, (x - size, y - size))
    canvas.alpha_composite(layer, (x - size, y - size))


def render_frame(canvas: Image.Image) -> None:
    """Layer 10: gold frame ornament — final layer above content."""
    fr = Image.open(SCORECARD_ASSETS / "frame.png").convert("RGBA")
    canvas.alpha_composite(fr.resize((W, H), Image.LANCZOS))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    random.seed(42)
    canvas = Image.new("RGBA", (W, H), (6, 8, 14, 255))
    render_starfield(canvas)
    render_vignette(canvas)
    render_scanlines(canvas)
    render_power_bar(canvas, POWER_TIER)
    y = render_header(canvas, DATE_RANGE)
    y = render_headline(canvas, GRAND_TOTAL, y + 80)
    y = render_panel(canvas, DEFAULT_PERSONS[:3], y + 4)
    render_this_week(canvas, y)
    render_footer(canvas)
    render_sparkles(canvas)
    render_frame(canvas)
    out = OUT_DIR / "scorecard_test.png"
    canvas.convert("RGBA").save(out, "PNG", optimize=True)
    print(f"wrote {out} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
