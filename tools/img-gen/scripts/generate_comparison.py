"""
generate_comparison.py — Head-to-head Gemini vs GPT sprite generation comparison.

Generates the same characters using both Gemini and GPT-image-1.5, then
post-processes Gemini outputs (magenta keying) so both sets are transparent.
Outputs organized for side-by-side visual comparison.

Pipeline per model:
  Gemini:  prompt (magenta bg) → raw frame → remove_magenta → compose sheet
  GPT:     prompt (transparent bg) → raw frame (already transparent) → compose sheet

Output structure:
  output/comparison/
    gemini/frames/     Raw Gemini outputs (magenta bg)
    gemini/keyed/      After remove_magenta (transparent)
    gemini/sheets/     Final composed sheets
    gpt/frames/        Raw GPT outputs (already transparent)
    gpt/sheets/        Final composed sheets

Usage:
  python3 scripts/generate_comparison.py
  python3 scripts/generate_comparison.py --dry-run
  python3 scripts/generate_comparison.py --characters bob-iger,sundar-pichai
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import os
import sys
import time
from pathlib import Path

from PIL import Image

TOOL_DIR = Path(__file__).resolve().parent.parent
COMPARISON_DIR = TOOL_DIR / "output" / "comparison"

DEFAULT_CHARACTERS = [
    "bob-iger",
    "sundar-pichai",
    "larry-fink",
    "david-green",
    "mary-dillon",
]


def _load_env() -> None:
    """Load .env from tool dir, worktree root, and main repo root."""
    # Check tool dir, worktree root, and main repo root (worktrees don't
    # share .env since it's gitignored)
    repo_root = TOOL_DIR.parent.parent
    main_repo = repo_root
    # If we're in a worktree, also check the actual repo root
    git_common = repo_root / ".git"
    if git_common.is_file():
        # .git is a file pointing to the main repo in worktrees
        text = git_common.read_text().strip()
        if text.startswith("gitdir:"):
            git_path = Path(text.split(":", 1)[1].strip())
            # Walk up from .git/worktrees/<name> to the repo root
            main_repo = git_path.resolve().parent.parent.parent

    for env_path in [TOOL_DIR / ".env", repo_root / ".env",
                     main_repo / ".env", main_repo / ".env.local"]:
        if not env_path.exists():
            continue
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


def _load_json(path: Path) -> object:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _variants_for_character(character: dict) -> list[dict]:
    tier = character.get("tier", "standard")
    variants = character.get("variants", {})
    variant_keys = ["A"] if tier == "standard" else ["A", "B"]
    return [
        {"key": f"var{vk}", "variant": vk,
         "outfit": variants.get(vk, {}).get("outfit", "")}
        for vk in variant_keys
    ]


# ---------------------------------------------------------------------------
# Gemini generation
# ---------------------------------------------------------------------------

def _gemini_prompt(character: dict, variant: dict, templates: dict) -> str:
    """Build the standard Gemini prompt with magenta background."""
    name = character["name"]
    likeness = character.get("likeness", "")
    outfit = variant["outfit"]
    parts = [
        templates["style_and_layout"],
        f"Both figures on this canvas are {name}, featuring {likeness}, "
        f"wearing {outfit}. Both figures are the exact same person wearing "
        f"the exact same clothes.",
        templates["state_neutral"],
        templates["state_defeated"],
    ]
    return " ".join(parts)


def _generate_gemini(character: dict, variant: dict, templates: dict,
                     config: dict, ref_images: list, output_dir: Path,
                     dry_run: bool) -> bool:
    """Generate one variant via Gemini. Returns True on success."""
    from google import genai
    from google.genai import types

    char_id = character["id"]
    variant_key = variant["key"]
    output_path = output_dir / f"{char_id}_{variant_key}.png"

    prompt = _gemini_prompt(character, variant, templates)

    if dry_run:
        print(f"    [gemini dry-run] {char_id}/{variant_key}")
        print(f"    Prompt: {prompt[:120]}...")
        return True

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    model_name = config["model"]

    parts = []
    for img in ref_images:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        parts.append(types.Part.from_bytes(
            data=buf.getvalue(), mime_type="image/png"))
    parts.append(types.Part.from_text(text=prompt))

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=[types.Content(role="user", parts=parts)],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE"],
                ),
            )

            # Extract image from response
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data is not None:
                    data = part.inline_data.data
                    image_data = (data if isinstance(data, bytes)
                                  else base64.b64decode(data))
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(image_data)
                    print(f"    [gemini] saved {output_path.name}")
                    return True

            print(f"    [gemini] ERROR: no image in response")
            return False

        except Exception as e:
            if "429" in str(e) and attempt == 0:
                print(f"    [gemini] rate limited, waiting 60s...")
                time.sleep(60)
                continue
            print(f"    [gemini] ERROR: {e}")
            return False

    return False


# ---------------------------------------------------------------------------
# GPT generation
# ---------------------------------------------------------------------------

def _gpt_prompt(character: dict, variant: dict, templates: dict) -> str:
    """Build a GPT-adapted prompt — transparent bg instead of magenta.

    Best practices for GPT pixel art (gpt-image-1.5):
    - Explicit transparent background request in prompt text
    - background="transparent" API parameter handles actual transparency
    - Detailed pixel art style instructions for consistency
    - Same character/state descriptions as Gemini for fair comparison
    """
    name = character["name"]
    likeness = character.get("likeness", "")
    outfit = variant["outfit"]

    # Replace magenta bg instruction with transparent bg.
    # Since we use images.generate (not edit), we can't pass a reference
    # image directly — embed detailed style guidance in the prompt instead.
    style = (
        "Create a retro 8-bit pixel-art sprite sheet. The image must contain "
        "exactly two figures side-by-side on a fully transparent background. "
        "Use a chunky 1:2.5 head-to-body ratio, thick black outlines, and a "
        "strictly limited color palette (4-6 colors per character) with hard "
        "pixel edges — NES/Game Boy era aesthetic. Each figure should be "
        "roughly 85% of the canvas height, standing on the bottom edge. "
        "No background color — the background must be completely transparent. "
        "No anti-aliasing, no gradients, no smoothing — pure pixel art."
    )

    character_desc = (
        f"Both figures on this canvas are {name}, featuring {likeness}, "
        f"wearing {outfit}. Both figures are the exact same person wearing "
        f"the exact same clothes."
    )

    parts = [
        style,
        character_desc,
        templates["state_neutral"],
        templates["state_defeated"],
    ]
    return " ".join(parts)


def _generate_gpt(character: dict, variant: dict, templates: dict,
                   ref_images: list, output_dir: Path,
                   dry_run: bool) -> bool:
    """Generate one variant via GPT-image-1.5 with native transparency.

    When a reference image is available, uses the edit endpoint so GPT can
    see the established sprite style. Otherwise falls back to pure generation.
    """
    char_id = character["id"]
    variant_key = variant["key"]
    output_path = output_dir / f"{char_id}_{variant_key}.png"

    prompt = _gpt_prompt(character, variant, templates)

    if dry_run:
        mode = "edit (with reference)" if ref_images else "generate"
        print(f"    [gpt dry-run] {char_id}/{variant_key} ({mode})")
        print(f"    Prompt: {prompt[:120]}...")
        return True

    try:
        from openai import OpenAI
    except ImportError:
        print("ERROR: openai is required. Run: pip3 install openai")
        return False

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY is not set.")
        return False

    client = OpenAI(api_key=api_key)

    try:
        # GPT best practice: use images.generate with background="transparent"
        # for native transparency. The generate endpoint supports the
        # background param; the edit endpoint does not.
        # Reference image guidance is baked into the prompt text instead.
        result = client.images.generate(
            model="gpt-image-1.5",
            prompt=prompt,
            size="1536x1024",
            background="transparent",
            output_format="png",
            n=1,
        )

        b64_data = result.data[0].b64_json
        if not b64_data:
            print(f"    [gpt] ERROR: no image data in response")
            return False

        image_bytes = base64.b64decode(b64_data)
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, format="PNG")
        print(f"    [gpt] saved {output_path.name}")
        return True

    except Exception as e:
        print(f"    [gpt] ERROR: {e}")
        return False


# ---------------------------------------------------------------------------
# Post-processing
# ---------------------------------------------------------------------------

def _key_gemini_frames(frames_dir: Path, keyed_dir: Path) -> None:
    """Run remove_magenta on Gemini frames to get transparent outputs."""
    import importlib.util as ilu

    spec = ilu.spec_from_file_location(
        "remove_magenta",
        Path(__file__).parent / "remove_magenta.py",
    )
    mod = ilu.module_from_spec(spec)
    spec.loader.exec_module(mod)

    keyed_dir.mkdir(parents=True, exist_ok=True)
    png_files = sorted(frames_dir.glob("*.png"))

    for png_path in png_files:
        output_path = keyed_dir / png_path.name
        print(f"    keying {png_path.name}...")
        try:
            img = Image.open(png_path)
            result = mod.remove_magenta(img, defringe=True)
            result.save(output_path, format="PNG")
        except Exception as e:
            print(f"    ERROR keying {png_path.name}: {e}")


def _compose_sheets(frames_dir: Path, sheets_dir: Path,
                    characters: list[dict]) -> None:
    """Compose variant frames into final sprite sheets."""
    sheets_dir.mkdir(parents=True, exist_ok=True)
    chars_by_id = {c["id"]: c for c in characters}

    for character in characters:
        char_id = character["id"]
        tier = character.get("tier", "standard")
        variants = _variants_for_character(character)

        frames = []
        for variant in variants:
            frame_path = frames_dir / f"{char_id}_{variant['key']}.png"
            if not frame_path.exists():
                print(f"    [compose] missing frame: {frame_path.name}")
                break
            frames.append(Image.open(frame_path).convert("RGBA"))
        else:
            if tier == "standard" and len(frames) == 1:
                # Standard: single frame IS the sheet
                sheet = frames[0]
            elif tier == "important" and len(frames) == 2:
                # Important: stack varA on top of varB
                w = max(f.width for f in frames)
                h = sum(f.height for f in frames)
                sheet = Image.new("RGBA", (w, h), (0, 0, 0, 0))
                y = 0
                for frame in frames:
                    # Center horizontally if widths differ
                    x = (w - frame.width) // 2
                    sheet.paste(frame, (x, y), frame)
                    y += frame.height
            else:
                print(f"    [compose] unexpected frame count for {char_id}")
                continue

            output_path = sheets_dir / f"{char_id}.png"
            sheet.save(output_path, "PNG")
            print(f"    [compose] {output_path.name} "
                  f"({sheet.width}x{sheet.height})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Gemini vs GPT sprite generation comparison."
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Print prompts without making API calls")
    parser.add_argument("--characters", type=str, default=None,
                        help="Comma-separated character IDs (default: 5 test characters)")
    parser.add_argument("--skip-gemini", action="store_true",
                        help="Skip Gemini generation (use existing frames)")
    parser.add_argument("--skip-gpt", action="store_true",
                        help="Skip GPT generation (use existing frames)")
    args = parser.parse_args()

    _load_env()

    # Map alternate key names to canonical names
    if not os.environ.get("GEMINI_API_KEY"):
        alt = os.environ.get("FFascistsimggen")
        if alt:
            os.environ["GEMINI_API_KEY"] = alt

    # Validate API keys
    if not args.dry_run:
        missing = []
        if not args.skip_gemini and not os.environ.get("GEMINI_API_KEY"):
            missing.append("GEMINI_API_KEY")
        if not args.skip_gpt and not os.environ.get("OPENAI_API_KEY"):
            missing.append("OPENAI_API_KEY")
        if missing:
            print(f"ERROR: missing API keys: {', '.join(missing)}")
            print("Add them to .env or export in your environment.")
            sys.exit(1)

    config = _load_json(TOOL_DIR / "config.json")
    characters_list = _load_json(TOOL_DIR / "characters.json")
    templates = _load_json(TOOL_DIR / "templates" / "prompts.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    # Resolve target characters
    if args.characters:
        char_ids = [s.strip() for s in args.characters.split(",")]
    else:
        char_ids = DEFAULT_CHARACTERS

    targets = []
    for cid in char_ids:
        if cid not in characters_by_id:
            print(f"ERROR: character '{cid}' not found in characters.json")
            sys.exit(1)
        targets.append(characters_by_id[cid])

    # Load reference images for style consistency
    ref_images = []
    if not args.dry_run:
        # Use config reference_images if set, otherwise fall back to
        # reference/ref1.png (the established style reference)
        ref_paths = config.get("reference_images", [])
        if not ref_paths:
            default_ref = TOOL_DIR / "reference" / "ref1.png"
            if default_ref.exists():
                ref_paths = [str(default_ref.relative_to(TOOL_DIR))]
        for rel_path in ref_paths:
            full_path = TOOL_DIR / rel_path
            if full_path.exists():
                ref_images.append(Image.open(full_path).convert("RGB"))
                print(f"Reference image loaded: {rel_path}")
        if not ref_images:
            print("WARNING: no reference images found — style may vary")

    # Output directories
    gemini_frames = COMPARISON_DIR / "gemini" / "frames"
    gemini_keyed = COMPARISON_DIR / "gemini" / "keyed"
    gemini_sheets = COMPARISON_DIR / "gemini" / "sheets"
    gpt_frames = COMPARISON_DIR / "gpt" / "frames"
    gpt_sheets = COMPARISON_DIR / "gpt" / "sheets"

    total_variants = sum(len(_variants_for_character(c)) for c in targets)
    print(f"Comparison: {len(targets)} characters, {total_variants} variants")
    print(f"Characters: {', '.join(c['id'] for c in targets)}")
    print(f"Models: Gemini ({config['model']}) vs GPT (gpt-image-1.5)")
    print()

    # --- Phase 1: Generate with both models ---
    batch_delay = config.get("batch_delay_seconds", 5)

    for character in targets:
        char_id = character["id"]
        tier = character.get("tier", "standard")
        variants = _variants_for_character(character)
        print(f"{char_id} ({tier}, {len(variants)} variant(s)):")

        for variant in variants:
            # Gemini
            if not args.skip_gemini:
                _generate_gemini(character, variant, templates, config,
                                 ref_images, gemini_frames, args.dry_run)
                if not args.dry_run:
                    time.sleep(batch_delay)

            # GPT
            if not args.skip_gpt:
                _generate_gpt(character, variant, templates,
                              ref_images, gpt_frames, args.dry_run)
                if not args.dry_run:
                    time.sleep(2)  # Brief pause between GPT calls

        print()

    if args.dry_run:
        print("Dry run complete — no API calls made.")
        return

    # --- Phase 2: Post-process Gemini frames (magenta keying) ---
    if not args.skip_gemini:
        print("--- Keying Gemini frames (remove magenta) ---")
        _key_gemini_frames(gemini_frames, gemini_keyed)
        print()

    # --- Phase 3: Compose final sheets ---
    if not args.skip_gemini:
        print("--- Composing Gemini sheets ---")
        _compose_sheets(gemini_keyed, gemini_sheets, targets)
        print()

    if not args.skip_gpt:
        print("--- Composing GPT sheets ---")
        _compose_sheets(gpt_frames, gpt_sheets, targets)
        print()

    # --- Summary ---
    print("=" * 60)
    print("COMPARISON COMPLETE")
    print(f"  Gemini sheets: {gemini_sheets}/")
    print(f"  GPT sheets:    {gpt_sheets}/")
    print()
    print("Compare side-by-side in Finder or your image viewer.")
    print("Look for: consistency, pixel crispness, transparency quality,")
    print("character likeness, defeated state expressiveness.")


if __name__ == "__main__":
    main()
