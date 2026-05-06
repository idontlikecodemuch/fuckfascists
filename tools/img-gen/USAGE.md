# Image Generation Pipeline — Usage Guide

All scripts live in `tools/img-gen/scripts/`. Run them from the `tools/img-gen/` directory.

## Setup

```bash
cd tools/img-gen
pip3 install -r requirements.txt
```

**Environment variables** (in repo root `.env`):
- `GEMINI_API_KEY` — required for Gemini scripts (`generate.py`, `generate_assets.py`)
- `OPENAI_API_KEY` — required for GPT scripts (`gpt_image.py`)

---

## Pipeline Overview

### Gemini sprite generation flow

```
1. generate.py            Generate raw sprite variant pairs (neutral + defeated) via Gemini
2. compose.py             Stack variant rows into final sprite sheets
3. remove_magenta.py      Chroma-key magenta background → transparent PNG
4. cp processed → hires   Copy output/processed/<id>.png → assets/pixel/sprites-hires/<id>.png
5. normalize_sprites.py   Normalize body height/foot/centering on the hires sheet (--source hires)
6. optimize_sprites.py    2× nearest-neighbor downscale + pngquant → assets/pixel/sprites/
7. manifest.py            Write per-sprite frame metadata to assets/pixel/sprites/manifest.json
8. generate-sprite-assets.mjs  (run from repo root) Regenerate core/sprites/spriteAssets.ts
```

**Single-character regen reference (Citron, Apr 30 2026 — see commit `4e72618`):**
```bash
echo "d" | python3 scripts/generate.py --character jason-citron --force
python3 scripts/compose.py --character jason-citron --force
python3 scripts/remove_magenta.py "output/raw/jason-citron.png" "output/processed/jason-citron.png" --defringe
cp output/processed/jason-citron.png ../../assets/pixel/sprites-hires/jason-citron.png
python3 scripts/normalize_sprites.py --character jason-citron --source hires \
  --target-height-pct 86 --target-bottom-margin-pct 5
python3 scripts/optimize_sprites.py --sprite jason-citron --force
python3 scripts/manifest.py --source deployed --output ../../assets/pixel/sprites/manifest.json
cd ../.. && node scripts/generate-sprite-assets.mjs
```

**Why `--source hires` matters:** before commit `84d701e` the pipeline kept full-res sprites in `assets/pixel/sprites/` and there was no optimize step, so normalize ran directly on the deployed file. After `84d701e`, deployed sprites are 2× downscaled (`728×720` for important tier with cells of `364×360`), and the source-of-truth lives in `assets/pixel/sprites-hires/` (`1456×1440`, `728×720` cells, gitignored). Run normalize on the hires source so the output of optimize already has the right body height, then optimize once.

### Gemini UI asset generation flow

```
1. generate_assets.py   Generate raw UI ornament PNGs via Gemini (magenta background)
2. process_assets.py    4-step keying + crop/slice + scale → app-ready PNGs
3. deploy_assets.py     Copy processed assets → assets/pixel/
```

### GPT image flow

```
1. gpt_image.py --generate    Text prompt (± reference image) → PNG
2. gpt_image.py --process     Edit existing PNG(s) with natural-language instruction
```

The GPT pipeline is independent — use it for one-off generation, background removal, or batch cleanup of existing sprite sheets.

---

## Scripts

### generate.py

Generate pixel-art CEO sprite variant pairs (neutral + defeated states side by side) via the Gemini API. Each character variant produces one API call.

**Requires:** `GEMINI_API_KEY`

| Flag | Description |
|---|---|
| `--character <id>` | Generate one character by id (from `characters.json`) |
| `--all` | Generate all characters |
| `--redo` | Regenerate all variants flagged with `*_redo.png` suffix |
| `--batch` | Generate all pending variants with configurable delay, then auto-compose |
| `--dry-run` | Print prompts without making API calls |
| `--force` | Regenerate even if output frames already exist |

**Output:** `output/raw/frames/{id}_varA.png`, `{id}_varB.png` (important tier only)

**Examples:**
```bash
# Generate a single character
python3 scripts/generate.py --character mark-zuckerberg

# Generate all characters in batch mode with auto-compose
python3 scripts/generate.py --batch

# Preview prompts without API calls
python3 scripts/generate.py --all --dry-run

# Force-regenerate a specific character
python3 scripts/generate.py --character jeff-bezos --force

# Regenerate all variants flagged for redo
python3 scripts/generate.py --redo
```

---

### generate_assets.py

Generate raw UI ornament PNGs (markers, corners, FX, badges) via the Gemini API using prompts from `asset-prompts.json`. Outputs have a `#FF00FF` magenta background — run `process_assets.py` afterward to key and slice them.

**Requires:** `GEMINI_API_KEY`

| Flag | Description |
|---|---|
| `--all` | Generate all assets from `asset-prompts.json` |
| `--asset <id>` | Generate one asset by id |
| `--dry-run` | Print prompts without making API calls |
| `--force` | Regenerate even if raw file already exists |

**Output:** `output/raw/{id}.png`

**Examples:**
```bash
# Generate all UI assets
python3 scripts/generate_assets.py --all

# Generate a single asset
python3 scripts/generate_assets.py --asset marker_flag_default

# Preview prompts only
python3 scripts/generate_assets.py --all --dry-run

# Force-regenerate one asset
python3 scripts/generate_assets.py --asset badge_streak --force
```

---

### compose.py

Stack variant pair images into final sprite sheets. For standard tier characters, the single varA image is used directly. For important tier, varA (row 1) and varB (row 2) are vertically stacked with width normalization.

| Flag | Description |
|---|---|
| `--character <id>` | Compose one character by id |
| `--all` | Compose all characters from `characters.json` |
| `--force` | Recompose even if output already exists |

**Input:** `output/raw/frames/{id}_varA.png`, `{id}_varB.png`
**Output:** `output/raw/{id}.png`

**Examples:**
```bash
# Compose all characters
python3 scripts/compose.py --all

# Compose a single character
python3 scripts/compose.py --character doug-mcmillon

# Force recompose
python3 scripts/compose.py --all --force
```

---

### remove_magenta.py

Chroma-key magenta (`#FF00FF`) backgrounds to transparency on sprite sheets. Processes all PNGs in `output/raw/` and writes results to `output/processed/`. Uses a 3-step pipeline: flood fill from corners, alpha binarization (<200 threshold), and 1px alpha erosion.

| Flag | Description |
|---|---|
| *(none)* | Processes all PNGs in `output/raw/` |

**Input:** `output/raw/*.png`
**Output:** `output/processed/{filename}.png`

**Examples:**
```bash
# Process all raw sprite sheets
python3 scripts/remove_magenta.py
```

---

### process_assets.py

Process raw Gemini UI asset outputs into app-ready transparent PNGs. Applies a 4-step keying pipeline (flood fill, global magenta pass, alpha binarization, 1px erosion), then crops/slices based on the processing type defined in `asset-prompts.json`, and scales to target dimensions.

Processing types: `grid_2x2` (4 quadrants), `split_horizontal` (left/right), `auto_crop`, `crop_center`, `horizontal_band`.

| Flag | Description |
|---|---|
| `--all` | Process all assets from `asset-prompts.json` |
| `--asset <id>` | Process one asset by id |

**Input:** `output/raw/{id}.png`
**Output:** `output/processed/assets/{id}.png` (or `{id}_0.png`...`{id}_3.png`, `{id}_left.png`/`{id}_right.png` depending on type)

**Examples:**
```bash
# Process all assets
python3 scripts/process_assets.py --all

# Process a single asset
python3 scripts/process_assets.py --asset marker_flag_default
```

---

### deploy_assets.py

Copy processed UI assets from `output/processed/assets/` into the app's `assets/pixel/` directory. Idempotent — safe to run repeatedly. Does not delete anything from `assets/pixel/`.

| Flag | Description |
|---|---|
| `--all` | Deploy all assets |
| `--asset <id>` | Deploy one asset by id |

**Input:** `output/processed/assets/*.png`
**Output:** `assets/pixel/{filename}.png`

**Examples:**
```bash
# Deploy all processed assets to the app
python3 scripts/deploy_assets.py --all

# Deploy a single asset
python3 scripts/deploy_assets.py --asset marker_flag_default
```

---

### manifest.py

Generate sprite sheet metadata JSON from a sprite directory. Reads PNG dimensions per sprite, calculates grid layout (2×1 for standard tier, 2×2 for important tier), and outputs frame coordinate maps the app runtime consumes via `core/sprites/spriteAssets.ts`.

`frameWidth` and `frameHeight` are derived per sprite from the PNG, so important-tier sheets that come back at unusual heights (e.g. zhang-yiming at 728×744 with 372-tall cells, when Gemini's varA returned 768 instead of 720) are recorded accurately without manual edits.

| Flag | Description |
|---|---|
| `--source processed|deployed|hires` | Which sprite directory to read from (default: `processed`). For app builds use `deployed`. |
| `--output <path>` | Output manifest path (default: `output/manifest.json`). For app builds pass `../../assets/pixel/sprites/manifest.json`. |

**Examples:**
```bash
# App-build manifest (writes to assets/pixel/sprites/manifest.json)
python3 scripts/manifest.py --source deployed --output ../../assets/pixel/sprites/manifest.json

# Quick check on processed/ before deploy
python3 scripts/manifest.py
```

After regenerating the manifest, regenerate the static `require()` map from the repo root:
```bash
node scripts/generate-sprite-assets.mjs
```

---

### gpt_image.py

General-purpose GPT image pipeline using `gpt-image-1`. Two modes: generate new images from text prompts, or process existing PNGs with natural-language edit instructions.

**Requires:** `OPENAI_API_KEY`

#### Generate mode

| Flag | Description |
|---|---|
| `--prompt "..."` | **(required)** Text prompt for image generation |
| `--output-dir <path>` | Output directory (default: `tools/img-gen/output/`) |
| `--filename <name>` | Output filename (default: auto-generated from prompt) |
| `--reference <path>` | Reference image to pass alongside the prompt (uses edit endpoint) |
| `--size <WxH>` | Output size: `1024x1024` (default), `1024x1536`, `1536x1024`, or `auto` |

**Examples:**
```bash
# Generate from a text prompt
python3 scripts/gpt_image.py --generate --prompt "8-bit pixel art flag marker, retro NES style, transparent background"

# Generate with a custom filename and size
python3 scripts/gpt_image.py --generate --prompt "Pixel art CEO avatar" --filename ceo_avatar.png --size 1024x1024

# Generate with a reference image (uses edit endpoint)
python3 scripts/gpt_image.py --generate --prompt "Same style but with a red hat" --reference output/raw/frames/jeff-bezos_varA.png

# Generate to a specific directory
python3 scripts/gpt_image.py --generate --prompt "Game badge icon" --output-dir output/raw/
```

#### Process mode

| Flag | Description |
|---|---|
| `--input <path/glob>` | **(required)** One or more PNG paths, or a glob pattern |
| `--instruction "..."` | **(required)** Natural-language edit instruction |
| `--output-dir <path>` | Output directory (default: same directory as input) |

Output filenames preserve the original name with a `_gpt` suffix: `mark-zuckerberg_gpt.png`.

On API error, the file is skipped and processing continues to the next file.

**Examples:**
```bash
# Process a single sprite sheet — remove backgrounds
python3 scripts/gpt_image.py --process \
  --input output/raw/mark-zuckerberg.png \
  --instruction "Remove all backgrounds and make them fully transparent. Preserve all character pixel art exactly."

# Batch process all sprite sheets in a directory
python3 scripts/gpt_image.py --process \
  --input "output/raw/*.png" \
  --instruction "Remove magenta background, make fully transparent, preserve pixel art."

# Process with a custom output directory
python3 scripts/gpt_image.py --process \
  --input "output/processed/*.png" \
  --instruction "Sharpen pixel edges and increase contrast" \
  --output-dir output/gpt_cleaned/
```

---

### analyze_sprites.py

Analyze body placement and scale across all deployed CEO sprite sheets. Reads sprites from `assets/pixel/sprites/` and `characters.json`, computes per-sprite body bounds from the neutral frame (col 0, row 0), and writes analysis reports with aggregate stats and outlier detection.

Cell width and height are read from each PNG dynamically (`img_w // grid.cols`, `img_h // grid.rows`), so the report is correct for both pre-optimize hires sheets and post-optimize deployed sheets — important tier sprites are 728×720 with 364×360 cells, standard tier are 728×360 with 364×360 cells.

No API keys required.

| Flag | Description |
|---|---|
| *(none)* | Analyzes all sprites in `assets/pixel/sprites/` |

**Output:**
- `reports/sprite-analysis.json` — per-sprite metrics + aggregate stats (min/max/median/stddev)
- `reports/sprite-analysis.md` — readable summary table, outliers flagged (>2σ from median height)

**Examples:**
```bash
# Analyze all sprites
python3 scripts/analyze_sprites.py
```

---

### normalize_sprites.py

Normalize body placement and scale across CEO sprite sheets. Computes body bounds from the neutral frame, then applies uniform scaling + translation to place all sprites at consistent height, foot position, and horizontal center. The same transform is applied to every frame in the sheet (defeated variants stay in registration with neutral).

Pixel targets are derived per sprite from the actual cell dimensions (`cell_h * pct / 100`), not from a hardcoded canonical 720, so the script normalizes both pre-optimize hires sheets (720-tall cells, occasionally 744 when Gemini returns a 768-tall frame) and post-optimize deployed sheets (360-tall cells) to the same body fill percentage.

Backs up originals to `<source-dir>/originals/` before modifying. Requires `analyze_sprites.py` to have been run first (reads targets from `reports/sprite-analysis.json`), or accepts manual target overrides.

No API keys required.

| Flag | Description |
|---|---|
| `--all` | Normalize all sprites in the source directory |
| `--character <id>` | Normalize one sprite by kebab-case ID |
| `--source hires|deployed` | Read/write `assets/pixel/sprites-hires/` (modern pipeline, before optimize) or `assets/pixel/sprites/` (legacy / post-optimize touch-up). Default: `deployed`. |
| `--validate` | Dry run — report what would change without modifying files |
| `--target-height-pct <float>` | Override target body height as % of cell height |
| `--target-bottom-margin-pct <float>` | Override target bottom margin as % of cell height |

**Input:** `assets/pixel/sprites-hires/*.png` (with `--source hires`) or `assets/pixel/sprites/*.png` (default)
**Backup:** `<source-dir>/originals/` (gitignored)
**Output:** Modified sprites in-place

**Examples:**
```bash
# Modern pipeline — normalize hires before optimize
python3 scripts/normalize_sprites.py --character elon-musk --source hires \
  --target-height-pct 86 --target-bottom-margin-pct 5

# Dry run on deployed sprites
python3 scripts/normalize_sprites.py --all --validate

# Override targets manually (use after a fresh analyze_sprites.py run)
python3 scripts/normalize_sprites.py --all --target-height-pct 86.0 --target-bottom-margin-pct 5.0
```

---

### optimize_sprites.py

2× nearest-neighbor downscale + pngquant palette quantization. Reads full-res sprites from `assets/pixel/sprites-hires/` and writes optimized indexed PNGs to `assets/pixel/sprites/`. Typical reduction: ~91% (a hires important-tier sprite at ~1.5 MB shrinks to ~80 KB).

Nearest-neighbor preserves pixel-art edges exactly because each "pixel block" in the source is already an integer multiple of physical pixels.

Requires `pngquant` on PATH (`brew install pngquant`).

| Flag | Description |
|---|---|
| *(none)* | Optimize all hires sprites that are newer than their deployed counterpart |
| `--sprite <id>` | Optimize one sprite by kebab-case ID |
| `--scale <int>` | Downscale factor (default: 2) |
| `--force` | Re-optimize even if the deployed sprite is up to date |

**Input:** `assets/pixel/sprites-hires/*.png`
**Output:** `assets/pixel/sprites/*.png`

**Examples:**
```bash
# Optimize all sprites that have a newer hires source
python3 scripts/optimize_sprites.py

# Re-optimize a single sprite (run after normalize_sprites.py --source hires)
python3 scripts/optimize_sprites.py --sprite jason-citron --force
```

---

### slice_ui_kit.py

Slice a UI kit sprite sheet into individual elements. Auto-detects distinct non-transparent connected regions on the sheet using flood-fill BFS, extracts each as a separate transparent PNG, and saves with sequential names (`element_00.png`, `element_01.png`, ...) ordered top-to-bottom, left-to-right.

After slicing, rename the output files to semantic names based on visual content (e.g. `frame_card_wide.png`, `btn_start.png`, `btn_circle_search.png`) and copy them to `assets/pixel/ui/`. Update `core/ui/uiAssets.ts` with the new require map.

| Flag | Description |
|---|---|
| `--input <path>` | **(required)** Path to the UI kit PNG |
| `--output-dir <dir>` | Output directory for sliced elements (required unless `--preview`) |
| `--preview` | Preview mode — detect regions and print bounding boxes only, don't write |
| `--min-size <px>` | Minimum region dimension to include (default: 20) |
| `--alpha-threshold <0-255>` | Alpha value above which a pixel is considered non-transparent (default: 10) |
| `--padding <px>` | Padding around each extracted element (default: 2) |

**Input:** Any transparent PNG sprite sheet
**Output:** `{output-dir}/element_00.png`, `element_01.png`, etc.

**Examples:**
```bash
# Preview — detect regions, print bounding boxes, don't write files
python3 scripts/slice_ui_kit.py --input ../../assets/pixel/ui/ui_kit.png --preview

# Slice and save to output directory
python3 scripts/slice_ui_kit.py --input ../../assets/pixel/ui/ui_kit.png --output-dir output/ui_sliced

# Slice with larger minimum size to skip small artifacts
python3 scripts/slice_ui_kit.py --input ../../assets/pixel/ui/ui_kit.png --output-dir output/ui_sliced --min-size 30
```

---

### composite_scorecard.py

Generate a 1080×1920 test composite of the shareable scorecard image. Extracts power bar assets from `Powerbars.png`, loads CEO sprites, and composites the full card layout with text, effects, and frame overlay. Used for design iteration — the visual reference target for the app-side `ScorecardView` image capture.

**Requires:** No API keys. Needs Pillow + NumPy, fonts from `assets/fonts/`, sprites from `assets/pixel/sprites/`, reference assets from `tools/img-gen/reference/`.

**Output:** `output/scorecard/scorecard_test.jpg` + `.png`, plus extracted power bars (`idle.png`, `hot.png`, `fck.png`, `legendary.png`).

See `docs/SCORECARD_IMAGE.md` for the full rendering spec.

**Examples:**
```bash
python3 scripts/composite_scorecard.py
```
