#!/usr/bin/env python3
"""
Scorecard composite — LEGACY (pre-2026-04-30 design).

Preserved unchanged for reference / regression diffing only. The current
test pipeline lives in `composite_scorecard.py` and matches the Claude
Design "polished main" mockup. Do not extend this file — touch the new
one instead.

Sentence structure (legacy): "I FCKd [grid] 15× this week"
  - "I FCKd" top-left bookend
  - Count grid: person rows in a bordered panel zone
  - "15× this week" bottom-right bookend
  - Power bar: original amber/gold, no recolor
"""

import math
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
MAIN_REPO = Path("/Users/christophershannon/fuckfascists")
REF_DIR = MAIN_REPO / "tools" / "img-gen" / "reference"
OUT_DIR = REPO_ROOT / "tools" / "img-gen" / "output" / "scorecard"
FONT_DIR = MAIN_REPO / "assets" / "fonts"
SPRITE_DIR = MAIN_REPO / "assets" / "pixel" / "sprites"

# design/tokens.ts
GOLD = "#FFC93C"            # rewardYellow
WHITE = "#DCE7F6"           # textPrimary
MUTED = "#A8B4C8"           # textSecondary
BLUE = "#2878C8"            # focusAccent
HIGHLIGHT_BLUE = "#5FAEFF"  # highlightBlue
GLOW_CYAN = "#7AF2FF"       # glowCyan
PANEL_OUTER = "#0A0B0C"     # panelOuter
PANEL_BORDER = "#2A2D30"    # panelBorder
DIM = "#667788"             # (candidate token)

W, H = 1080, 1920
VH, VW = H / 100, W / 100
CONTENT_TOP = 80
CONTENT_BOTTOM = 1835
CONTENT_RIGHT = 1000
BAR_GAP_TOP = 479
BAR_GAP_BOT = 1465
BAR_GAP_CENTER_Y = (BAR_GAP_TOP + BAR_GAP_BOT) // 2
BAR_SLOT_X_CENTER = 38


def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def extract_power_bars():
    img = Image.open(REF_DIR / "Powerbars.png")
    arr = np.array(img)
    h, w = arr.shape[:2]
    alpha_row = arr[h // 2, :, 3]
    bars_x, in_bar, start = [], False, 0
    for x in range(w):
        if alpha_row[x] > 10 and not in_bar:
            start, in_bar = x, True
        elif alpha_row[x] <= 10 and in_bar:
            bars_x.append((start, x)); in_bar = False
    if in_bar: bars_x.append((start, w))
    names = ["idle", "hot", "fck", "legendary"]
    results = []
    for i, (xs, xe) in enumerate(bars_x):
        x0, x1 = max(0, xs - 30), min(w, xe + 30)
        ca = arr[:, x0:x1, 3]
        rows = np.any(ca > 5, axis=1)
        y0 = np.where(rows)[0][0] if rows.any() else 0
        y1 = np.where(rows)[0][-1] + 1 if rows.any() else h
        bar = img.crop((x0, y0, x1, y1))
        bar.save(str(OUT_DIR / f"{names[i]}.png"))
        results.append(bar)
    return results


def extract_sprite(name, variant="defeated"):
    sheet = Image.open(SPRITE_DIR / f"{name}.png")
    sw, sh = sheet.size
    fw = sw // 2
    fh = sh // 2 if sh > fw * 1.5 else sh
    offsets = {"neutral": (0, 0), "defeated": (fw, 0)}
    if sh > fw * 1.5:
        offsets.update({"alt_neutral": (0, fh), "alt_defeated": (fw, fh)})
    ox, oy = offsets.get(variant, (fw, 0))
    f = sheet.crop((ox, oy, ox + fw, oy + fh))
    bb = f.getbbox()
    return f.crop(bb) if bb else f


def draw_star(d, cx, cy, sz, fill):
    coords = []
    for i in range(8):
        angle = math.pi / 4 * i - math.pi / 2
        r = sz if i % 2 == 0 else sz * 0.3
        coords.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    d.polygon(coords, fill=fill)


def draw_beam(canvas, x0, x1, y, mode="blue", thickness=1.0):
    beam = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(beam)
    half_h = int(14 * thickness)
    fade = int((x1 - x0) * 0.25)
    for off in range(-half_h, half_h + 1):
        vt = abs(off) / half_h
        for x in range(x0, x1):
            if x < x0 + fade: ht = ((x - x0) / fade) ** 1.3
            elif x > x1 - fade: ht = ((x1 - x) / fade) ** 1.3
            else: ht = 1.0
            inten = ht * (1.0 - vt ** 0.6)
            if mode == "gold":
                if vt < 0.15: r,g,b = 255,int(240+15*inten),int(180+75*inten); a = int(255*inten)
                elif vt < 0.4: r,g,b = 255,201,60; a = int(220*inten*(1-vt*0.3))
                elif vt < 0.7: r,g,b = 200,150,30; a = int(140*inten*(1-vt*0.4))
                else: r,g,b = 150,100,20; a = int(60*inten*(1-vt*0.6))
            else:
                if vt < 0.15: r,g,b = 255,255,255; a = int(255*inten)
                elif vt < 0.35: r,g,b = 180,248,255; a = int(255*inten*(1-vt*0.2))
                elif vt < 0.6: r,g,b = 122,242,255; a = int(200*inten*(1-vt*0.25))
                elif vt < 0.8: r,g,b = 95,174,255; a = int(150*inten*(1-vt*0.3))
                else: r,g,b = 40,120,200; a = int(80*inten*(1-vt*0.4))
            if a > 2: d.point((x, y+off), fill=(r,g,b,min(255,a)))
    beam = beam.filter(ImageFilter.GaussianBlur(radius=3))
    return Image.alpha_composite(canvas, beam)


def txt_glow(canvas, x, y, text, f, color, gc, radius=8):
    g = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).text((x, y), text, fill=gc, font=f)
    g = g.filter(ImageFilter.GaussianBlur(radius=radius))
    canvas = Image.alpha_composite(canvas, g)
    ImageDraw.Draw(canvas).text((x, y), text, fill=color, font=f)
    return canvas


def center_txt(draw, y, text, f, fill, cx):
    bb = draw.textbbox((0, 0), text, font=f)
    tw = bb[2] - bb[0]; x = cx - tw // 2
    draw.text((x, y), text, fill=fill, font=f)
    return tw, x


def center_glow(canvas, y, text, f, fill, cx, gc, r=10):
    bb = ImageDraw.Draw(canvas).textbbox((0, 0), text, font=f)
    tw = bb[2] - bb[0]; x = cx - tw // 2
    canvas = txt_glow(canvas, x, y, text, f, fill, gc, r)
    return canvas, tw, x


def draw_panel_zone(canvas, x0, y0, x1, y1):
    """Draw a count grid panel: cyan wash bg + inset blue glow border.

    Matches GameArena panel styling: panelOuter bg, focusAccent inset shadow.
    """
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(panel)

    # Background: panelOuter at ~0.5 opacity (dark, lets starfield peek)
    d.rectangle([x0, y0, x1, y1], fill=(10, 16, 28, 130))

    # Cyan wash overlay: focusAccent at 0.05 opacity
    d.rectangle([x0, y0, x1, y1], fill=(40, 120, 200, 13))

    # Border: panelBorder
    d.rectangle([x0, y0, x1, y1], outline=(42, 45, 48, 180), width=2)

    # Inset glow: draw bright lines inside edges, then blur
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    inset = 4
    # Top inner glow
    gd.line([(x0+inset, y0+inset), (x1-inset, y0+inset)], fill=(40, 120, 200, 50), width=3)
    # Bottom inner glow
    gd.line([(x0+inset, y1-inset), (x1-inset, y1-inset)], fill=(40, 120, 200, 50), width=3)
    # Left inner glow
    gd.line([(x0+inset, y0+inset), (x0+inset, y1-inset)], fill=(40, 120, 200, 30), width=3)
    # Right inner glow
    gd.line([(x1-inset, y0+inset), (x1-inset, y1-inset)], fill=(40, 120, 200, 30), width=3)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=8))

    canvas = Image.alpha_composite(canvas, panel)
    canvas = Image.alpha_composite(canvas, glow)
    return canvas


def add_bar_glow(canvas, bx, by, bw, bh):
    """Subtle amber glow — whisper, not a wash."""
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    gcx = bx + bw // 2
    half = bw // 3
    for seg in range(50):
        sy = by + int(bh * seg / 50)
        sh = bh // 50 + 1
        vt = seg / 50
        if vt < 0.15:
            color = (255, 220, 100, 50)
        elif vt < 0.5:
            color = (255, 201, 60, 35)
        else:
            color = (200, 150, 40, 20)
        d.rectangle([gcx - half, sy, gcx + half, sy + sh], fill=color)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=12))
    return Image.alpha_composite(canvas, glow)


def build_composite():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    BRAG_SZ = 56
    F_BRAND = font("Bungee-Regular.ttf", 60)
    F_SUB = font("IBMPlexSans-SemiBold.ttf", 26)
    F_DATE = font("IBMPlexSans-Medium.ttf", 22)
    F_BRAG_CAPS = font("Bungee-Regular.ttf", BRAG_SZ)
    F_BRAG_LC = font("IBMPlexSans-SemiBold.ttf", BRAG_SZ)
    F_NUM = font("Bungee-Regular.ttf", BRAG_SZ)
    F_WEEK = font("Bungee-Regular.ttf", BRAG_SZ)
    F_NAME = font("IBMPlexSans-SemiBold.ttf", 40)
    F_DETAIL = font("IBMPlexSans-Medium.ttf", 24)  # collapsed company + platforms
    F_COUNT = font("Bungee-Regular.ttf", 80)
    F_MORE = font("Bungee-Regular.ttf", 32)
    F_TAG = font("IBMPlexSans-SemiBold.ttf", 28)
    F_URL = font("Bungee-Regular.ttf", 44)         # bigger CTA
    F_ATTR = font("IBMPlexSans-SemiBold.ttf", 20)

    print("Extracting power bars...")
    bars = extract_power_bars()
    fck_bar = bars[2]  # FCK tier — original amber/gold, no recolor

    print("Preparing layers...")
    starbg = Image.open(REF_DIR / "starbg.png").convert("RGBA").resize((W, H), Image.LANCZOS)
    frame = Image.open(REF_DIR / "frame2_sized.png").convert("RGBA")

    print("Loading sprites...")
    SPH = 200  # ~15-20% smaller than 240
    sprites = {}
    for label, fn in [("ZUCKERBERG", "mark-zuckerberg"),
                      ("BEZOS", "jeff-bezos"), ("JOYNER", "david-joyner")]:
        sp = extract_sprite(fn, "defeated")
        sc = SPH / sp.height
        sp = sp.resize((int(sp.width * sc), SPH), Image.LANCZOS)
        sprites[label] = sp

    print("Compositing...")
    canvas = starbg.copy()

    # ═══ POWER BAR — original amber/gold, no recolor, with subtle glow ═══
    bgh = BAR_GAP_BOT - BAR_GAP_TOP
    # Force wider while filling gap
    bh = bgh
    bw = 130
    bar_scaled = fck_bar.resize((bw, bh), Image.LANCZOS)
    bx = BAR_SLOT_X_CENTER - bw // 2
    by = BAR_GAP_TOP
    canvas = add_bar_glow(canvas, bx, by, bw, bh)
    canvas.paste(bar_scaled, (bx, by), bar_scaled)
    canvas = Image.alpha_composite(canvas, frame)

    # --- Layout zones ---
    cl, cr = 100, CONTENT_RIGHT
    cx = cl + (cr - cl) // 2
    sprite_left = cl + int(2 * VW)
    text_after_sprite = int(8 * VW)
    count_right = W - int(W * 0.15)

    y = CONTENT_TOP + 12

    # ═══ BRAND — framing ═══
    canvas, _, _ = center_glow(canvas, y, "FCK FASCISTS", F_BRAND, GOLD, cx,
                                (255, 201, 60, 60), r=10)
    y += 68

    draw = ImageDraw.Draw(canvas)
    center_txt(draw, y, "SCORECARD", F_SUB, MUTED, cx)
    y += 34

    dt = "APR 4 \u2014 APR 10"
    dtw, _ = center_txt(draw, y, dt, F_DATE, DIM, cx)
    by2 = y + 12
    canvas = draw_beam(canvas, cx-dtw//2-14-80, cx-dtw//2-14, by2, thickness=0.6)
    canvas = draw_beam(canvas, cx+dtw//2+14, cx+dtw//2+14+80, by2, thickness=0.6)
    y += 48

    # ═══ "I FCKd" — left-aligned bookend ═══
    draw = ImageDraw.Draw(canvas)
    # "I FCK" in Bungee + "d" in Plex (lowercase)
    bb1 = draw.textbbox((0, 0), "I FCK", font=F_BRAG_CAPS)
    w_caps = bb1[2] - bb1[0]
    h_caps = bb1[3] - bb1[1]
    bb_d = draw.textbbox((0, 0), "d", font=F_BRAG_LC)
    w_d = bb_d[2] - bb_d[0]
    h_d = bb_d[3] - bb_d[1]

    brag_x = cl
    draw.text((brag_x, y), "I FCK", fill=WHITE, font=F_BRAG_CAPS)
    d_y_offset = (h_caps - h_d) + 2
    draw.text((brag_x + w_caps, y + d_y_offset), "d", fill=WHITE, font=F_BRAG_LC)
    y += 72

    # ═══ COUNT GRID ZONE — panel with inset glow ═══
    grid_top = y
    grid_pad = 16

    rows = [
        {"name": "ZUCKERBERG", "detail": "Meta \u00b7 Instagram \u00b7 Facebook", "ct": "5\u00d7"},
        {"name": "BEZOS", "detail": "Amazon \u00b7 Amazon Prime", "ct": "3\u00d7"},
        {"name": "JOYNER", "detail": "CVS", "ct": "2\u00d7"},
    ]

    row_h = SPH + 16
    total_grid_h = len(rows) * row_h + 50 + grid_pad * 2  # +50 for "+ 4 MORE"
    grid_bottom = grid_top + total_grid_h

    # Draw panel background
    canvas = draw_panel_zone(canvas, cl - 4, grid_top, cr + 4, grid_bottom)

    y = grid_top + grid_pad

    for idx, row in enumerate(rows):
        rcy = y + row_h // 2
        sp = sprites[row["name"]]
        canvas.paste(sp, (sprite_left, rcy - sp.height // 2), sp)
        draw = ImageDraw.Draw(canvas)

        tx = sprite_left + sp.width + text_after_sprite
        # Name + collapsed detail on one line below
        name_y = rcy - 30
        draw.text((tx, name_y), row["name"], fill=WHITE, font=F_NAME)
        draw.text((tx, name_y + 46), row["detail"], fill=MUTED, font=F_DETAIL)

        # Count — GOLD, not red
        cb = draw.textbbox((0, 0), row["ct"], font=F_COUNT)
        cw2, ch2 = cb[2]-cb[0], cb[3]-cb[1]
        draw.text((count_right - cw2, rcy - ch2//2), row["ct"], fill=GOLD, font=F_COUNT)
        y += row_h
        if idx < len(rows) - 1:
            draw.line([(sprite_left, y-2), (cr-20, y-2)], fill=(255,255,255,15), width=1)

    # + 4 MORE inside the panel
    y += 6
    draw.text((sprite_left + 30, y), "+ 4 MORE", fill=MUTED, font=F_MORE)
    y = grid_bottom + 16

    # ═══ "15× this week" — right-aligned bookend ═══
    draw = ImageDraw.Draw(canvas)
    # "15×" gold glow + " THIS WEEK" white — right-aligned
    bb_num = draw.textbbox((0, 0), "15\u00d7", font=F_NUM)
    w_num = bb_num[2] - bb_num[0]
    bb_wk = draw.textbbox((0, 0), " THIS WEEK", font=F_WEEK)
    w_wk = bb_wk[2] - bb_wk[0]
    total_brag_w = w_num + w_wk
    brag2_x = cr - total_brag_w  # right-aligned

    canvas = txt_glow(canvas, brag2_x, y, "15\u00d7", F_NUM, GOLD,
                      (255, 201, 60, 130), radius=18)
    canvas = txt_glow(canvas, brag2_x, y, "15\u00d7", F_NUM, GOLD,
                      (255, 180, 20, 35), radius=40)
    draw = ImageDraw.Draw(canvas)
    draw.text((brag2_x + w_num, y), " THIS WEEK", fill=WHITE, font=F_WEEK)
    y += 72

    # ═══ FOOTER ═══
    fh = 220
    fy = max(y + 8, CONTENT_BOTTOM - fh)
    y = fy

    canvas = draw_beam(canvas, cl+20, cr-20, y, thickness=1.2)
    y += 40

    draw = ImageDraw.Draw(canvas)
    tag = "The fascists won\u2019t f*ck themselves."
    tb = draw.textbbox((0, 0), tag, font=F_TAG)
    tw = tb[2] - tb[0]; tx = cx - tw // 2
    try:
        fe = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 32)
        rock = "\U0001f918"
        eb = draw.textbbox((0, 0), rock, font=fe)
        ew = eb[2] - eb[0]
        draw.text((tx-ew-12, y-1), rock, font=fe, embedded_color=True)
        draw.text((tx+tw+12, y-1), rock, font=fe, embedded_color=True)
    except Exception: pass
    draw.text((tx, y), tag, fill=WHITE, font=F_TAG)
    y += 42

    # CTA — sized up
    canvas, _, ux = center_glow(canvas, y, "FCKFASCISTS.ORG", F_URL, GLOW_CYAN, cx,
                                 (122, 242, 255, 140), r=18)
    canvas = txt_glow(canvas, ux, y, "FCKFASCISTS.ORG", F_URL,
                      GLOW_CYAN, (40, 120, 200, 70), radius=30)
    y += 56
    draw = ImageDraw.Draw(canvas)
    center_txt(draw, y, "DATA: FEC.GOV", F_ATTR, DIM, cx)

    # ═══ FLAIR ═══
    print("Adding flair...")
    random.seed(42)
    sparkle = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sparkle)
    for _ in range(35):
        sx2 = random.randint(100, W-60)
        sy2 = random.randint(CONTENT_TOP+20, CONTENT_BOTTOM-20)
        sz = random.randint(2, 6)
        a = random.randint(60, 180)
        sd.line([(sx2-sz, sy2), (sx2+sz, sy2)], fill=(255,230,140,a))
        sd.line([(sx2, sy2-sz), (sx2, sy2+sz)], fill=(255,230,140,a))
    sparkle = sparkle.filter(ImageFilter.GaussianBlur(radius=1))
    canvas = Image.alpha_composite(canvas, sparkle)

    # Vignette
    vig = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vd = ImageDraw.Draw(vig)
    for i in range(40):
        t = i/40
        if t < 0.6: continue
        a = int(255*0.4*((t-0.6)/0.4)**1.5)
        ix, iy = int(W*(1-t)/2), int(H*(1-t)/2)
        for ew in range(3):
            vd.rectangle([ix-ew, iy-ew, W-ix+ew, H-iy+ew], outline=(0,0,0,a))
    vig = vig.filter(ImageFilter.GaussianBlur(radius=40))
    canvas = Image.alpha_composite(canvas, vig)

    # Scanlines
    sl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sld = ImageDraw.Draw(sl)
    for sy3 in range(0, H, 4):
        sld.line([(0, sy3), (W, sy3)], fill=(0,0,0,14))
    canvas = Image.alpha_composite(canvas, sl)

    # Stars
    draw = ImageDraw.Draw(canvas)
    for sx, sy2, sz in [
        (cl+10, CONTENT_TOP+35, 10), (cr-8, CONTENT_TOP+55, 8),
        (cx+280, 195, 7), (cx-300, 180, 6), (cr-20, 350, 9),
        (cl+15, 480, 7), (cr-12, 850, 6), (cr-25, 1150, 7),
        (cl+8, 1000, 5), (cr-15, 1350, 6), (cl+20, fy-30, 8),
        (cr-10, fy+180, 7), (cx+200, fy+100, 5),
    ]:
        draw_star(draw, sx, sy2, sz, GOLD)
    for sx, sy2, sz in [(cl+70, 750, 4), (cr-80, 1200, 4), (cx+130, 300, 3)]:
        draw_star(draw, sx, sy2, sz, MUTED)
    for c2x, c2y in [(cl-5, CONTENT_TOP+10), (cr+5, CONTENT_TOP+10),
                      (cl-5, CONTENT_BOTTOM-5), (cr+5, CONTENT_BOTTOM-5)]:
        draw_star(draw, c2x, c2y, 5, GOLD)
        draw_star(draw, c2x+12, c2y+8, 3, GOLD)

    canvas.convert("RGB").save(str(OUT_DIR / "scorecard_test.jpg"), "JPEG", quality=95)
    canvas.save(str(OUT_DIR / "scorecard_test.png"))
    print(f"\nDone → {OUT_DIR}/")


if __name__ == "__main__":
    build_composite()
