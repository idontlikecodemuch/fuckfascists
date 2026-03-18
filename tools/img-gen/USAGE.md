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
1. generate.py          Generate raw sprite variant pairs (neutral + defeated) via Gemini
2. compose.py           Stack variant rows into final sprite sheets
3. remove_magenta.py    Chroma-key magenta background → transparent PNG
4. manifest.py          Generate sprite sheet metadata JSON (frame coordinates)
5. deploy_assets.py     (for UI assets only) Copy processed assets → assets/pixel/
```

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

Generate sprite sheet metadata JSON from processed output images. Reads PNG dimensions, calculates grid layout (2x1 for standard tier, 2x2 for important tier), and outputs frame coordinate maps for the app runtime.

| Flag | Description |
|---|---|
| *(none)* | Reads `output/processed/` and `characters.json`, writes `output/manifest.json` |

**Output:** `output/manifest.json`

**Examples:**
```bash
# Generate the sprite manifest
python3 scripts/manifest.py
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
