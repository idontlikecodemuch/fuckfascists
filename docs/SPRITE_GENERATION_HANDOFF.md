# Sprite Generation Handoff

**Date:** April 8, 2026
**Session:** vibrant-mcnulty worktree
**Status:** Batch 1 of 4 complete and deployed. Batches 2-4 ready to run.

---

## What Was Done

### New Tooling Created
All scripts in `tools/img-gen/scripts/`:

1. **`analyze_sprites.py`** — Analyzes body placement/scale across all sprite sheets. Outputs `reports/sprite-analysis.json` + `.md`.
2. **`normalize_sprites.py`** — Normalizes body height/position/centering. Backs up originals to `assets/pixel/sprites/originals/` (gitignored). Uses targets from analysis report.
3. **`generate_comparison.py`** — Gemini vs GPT head-to-head comparison. Result: Gemini wins. Not needed for production runs.

### Sprite Pipeline (Production)
The full pipeline for new sprites is:
```bash
cd tools/img-gen

# 1. Generate raw frames (neutral + defeated pairs)
echo "d" | python3 scripts/generate.py --character <id> --force

# 2. Compose into sprite sheets (stack varA + varB for important tier)
python3 scripts/compose.py --character <id> --force

# 3. Remove magenta background
python3 scripts/remove_magenta.py "output/raw/<id>.png" "output/processed/<id>.png" --defringe

# 4. Deploy to app
cp output/processed/<id>.png ../../assets/pixel/sprites/<id>.png

# 5. Normalize
python3 scripts/normalize_sprites.py --character <id>
```

For batch runs, use `generate.py --batch` which handles steps 1-2 automatically.

### Critical: Reference Image
`config.json` must have `"reference_images": ["reference/ref1.png"]`. Without it, Gemini produces inconsistent styles and portrait orientation. This was the root cause of the first failed batch.

### Critical: API Key
`tools/img-gen/.env` needs `GEMINI_API_KEY=<key>`. The main repo `.env` has it under the name `FFascistsimggen` — the comparison script handles both names, but `generate.py` only reads `GEMINI_API_KEY`.

---

## What's Left — Batches 2-4 (60 more sprites)

All 72 new characters are already in `characters.json`. Only batch 1 (20) has been generated and deployed. Run these three batches:

### Batch 2 (20 characters)
```
david-baszucki david-green david-zaslav demis-hassabis drew-houston dylan-field ed-bastian eric-yuan fidji-simo gabriel-weinberg gail-boudreaux goli-sheikholeslami greg-peters hock-tan jack-dorsey jane-fraser jane-sun jason-citron jennifer-witz jim-farley
```

### Batch 3 (20 characters)
```
katherine-maher ken-griffin lachlan-murdoch larry-fink lisa-su liz-hamren luis-von-ahn lynsi-snyder marc-benioff mary-barra mary-dillon matt-mullenweg matthew-prince melanie-perkins meredith-kopit-levien michael-miebach mike-sievert mike-wirth nicholas-thompson niraj-shah
```

### Batch 4 (20 characters)
```
omar-abbosh patrick-collison patrick-soon-shiong patti-poppe paula-kerger rahul-purini ryan-roslansky safra-catz sal-khan scott-kirby shantanu-narayen shou-zi-chew sridhar-ramaswamy steve-huffman sundar-pichai ted-pick thomas-dohmke tobi-ltke tony-xu vlad-tenev
```

### Per-Batch Steps
```bash
cd tools/img-gen

# Generate (pass each character individually with --force)
for char in <space-separated-ids>; do
  echo "d" | python3 scripts/generate.py --character "$char" --force
done

# Compose
for char in <space-separated-ids>; do
  python3 scripts/compose.py --character "$char" --force
done

# Key
for char in <space-separated-ids>; do
  python3 scripts/remove_magenta.py "output/raw/$char.png" "output/processed/$char.png" --defringe
done

# Deploy
for char in <space-separated-ids>; do
  cp "output/processed/$char.png" "../../assets/pixel/sprites/$char.png"
done

# Normalize all
python3 scripts/normalize_sprites.py --all
```

### After All Batches
1. Regenerate `spriteAssets.ts`:
```bash
# From repo root — generate from what's on disk
python3 -c "
from pathlib import Path
sprites = sorted([p.stem for p in Path('assets/pixel/sprites').glob('*.png')])
lines = [
    '/**', ' * Generated sprite asset require map.',
    ' * Do not edit manually — regenerate via the sprite pipeline.', ' */',
    'import type { ImageSourcePropType } from \"react-native\";', '',
    'export const spriteAssets: Record<string, ImageSourcePropType> = {',
]
for sid in sprites:
    lines.append(f\"  '{sid}': require('../../assets/pixel/sprites/{sid}.png'),\")
lines.extend(['};', '', f'// {len(sprites)} sprites', ''])
Path('core/sprites/spriteAssets.ts').write_text(chr(10).join(lines))
print(f'Generated {len(sprites)} sprites')
"
```
2. Run `npx tsc --noEmit` and `npx jest` to verify.
3. Update PROGRESS.md.
4. Commit and push.

---

## Known Issues

### Wine/burgundy clothing gets stripped by magenta keying
The `remove_magenta.py` hue range (285-345°) overlaps with dark purple/wine clothing. **Fix applied for bill-gates:** restore non-bright-magenta pixels from the raw image using threshold `S>0.95 AND V>0.9` (only true background magenta has both near 1.0).

If another sprite has this issue, run:
```python
# After standard keying, restore wine pixels
from PIL import Image
import colorsys

raw = Image.open("output/raw/<id>.png").convert("RGBA")
keyed = Image.open("output/processed/<id>.png").convert("RGBA")
result = keyed.copy()
w, h = raw.size
for x in range(w):
    for y in range(h):
        rr, rg, rb, ra = raw.getpixel((x, y))
        kr, kg, kb, ka = keyed.getpixel((x, y))
        if ra > 200 and ka < 50:
            oh, os, ov = colorsys.rgb_to_hsv(rr/255, rg/255, rb/255)
            if not (os > 0.95 and ov > 0.9):
                result.putpixel((x, y), (rr, rg, rb, ra))
result.save("output/processed/<id>.png", "PNG")
```

### GPT moderation blocks on "defeated" pose
GPT-image-1.5 blocked bob-iger's sprite due to the "X-eyes, defeated, money bills" description. If GPT is ever used, soften the defeated state wording. Not an issue for Gemini.

### "visible company logo on chest" can confuse Gemini
Generic prompt produced a Facebook logo on charlie-scharf (Wells Fargo CEO). Fix: explicitly name the company in the outfit description. Check generated sprites for wrong logos.

### 341 entities still have no characters.json entry
These were skipped due to insufficient data for physical descriptions. The missing list is at `tools/img-gen/missing-characters.json` (in the main repo root copy). A future GPT pass could generate descriptions for more of them.

---

## Files Changed This Session

### New files
- `tools/img-gen/scripts/analyze_sprites.py`
- `tools/img-gen/scripts/normalize_sprites.py`
- `tools/img-gen/scripts/generate_comparison.py`
- `docs/SPRITE_GENERATION_HANDOFF.md` (this file)
- 20 new sprite PNGs in `assets/pixel/sprites/`

### Modified files
- `tools/img-gen/characters.json` — 72 new character entries + charlie-scharf outfit fix
- `tools/img-gen/config.json` — `reference_images` set to `["reference/ref1.png"]`
- `tools/img-gen/USAGE.md` — docs for analyze + normalize scripts
- `core/sprites/spriteAssets.ts` — regenerated with 127 entries
- `assets/pixel/sprites/` — all 107 existing sprites normalized + 20 new deployed
- `assets/pixel/sprites/bill-gates.png` — wine sweater restored
- `assets/pixel/sprites/charlie-scharf.png` — regenerated (Facebook logo → Wells Fargo)
- `.gitignore` — added originals/, reports/, output/ ignores
- `docs/PROGRESS.md` — session notes
