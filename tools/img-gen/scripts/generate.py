"""
generate.py — Gemini sprite generator for F*ck Fascists pixel art characters.

Makes one API call per variant (outfit), generating neutral + defeated states
side by side on a single canvas. This keeps proportions consistent between states.

Output: output/raw/frames/{id}_varA.png, {id}_varB.png (important tier only)

Run compose.py afterward to stack variant rows into the final sprite sheet.

Usage:
  Single:      python3 scripts/generate.py --character <id>
  All:         python3 scripts/generate.py --all
  Dry run:     python3 scripts/generate.py --all --dry-run
  Force:       python3 scripts/generate.py --character mark-zuckerberg --force
  Redo:        python3 scripts/generate.py --redo
  Batch:       python3 scripts/generate.py --batch
  Batch+force: python3 scripts/generate.py --batch --force

--batch generates all pending variants with a configurable delay between requests
(batch_delay_seconds in config.json, default 5s), then automatically runs compose
for all successfully generated characters. Walk away and come back to finished sheets.
"""

import argparse
import io
import json
import os
import sys
import time
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent.parent
FRAMES_DIR = TOOL_DIR / "output" / "raw" / "frames"


def _load_env() -> None:
    env_path = TOOL_DIR / ".env"
    if not env_path.exists():
        return
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


def _load_reference_images(config: dict) -> list:
    from PIL import Image
    images = []
    for rel_path in config.get("reference_images", []):
        full_path = TOOL_DIR / rel_path
        if not full_path.exists():
            print(f"  [warn] reference image not found, skipping: {rel_path}")
            continue
        images.append(Image.open(full_path).convert("RGB"))
    return images


def _variants_for_character(character: dict) -> list[dict]:
    """
    Return one entry per variant (outfit). Each variant generates one API call
    producing a neutral+defeated pair on a single canvas.
    """
    tier = character.get("tier", "standard")
    variants = character.get("variants", {})
    variant_keys = ["A"] if tier == "standard" else ["A", "B"]
    return [
        {"key": f"var{vk}", "variant": vk, "outfit": variants.get(vk, {}).get("outfit", "")}
        for vk in variant_keys
    ]


def _assemble_prompt(character: dict, variant: dict, templates: dict) -> str:
    name = character["name"]
    likeness = character.get("likeness", "")
    outfit = variant["outfit"]
    parts = [
        templates["style_and_layout"],
        f"Both figures on this canvas are {name}, featuring {likeness}, wearing {outfit}. Both figures are the exact same person wearing the exact same clothes.",
        templates["state_neutral"],
        templates["state_defeated"],
    ]
    return " ".join(parts)


def _call_api(client, prompt: str, ref_images: list, config: dict) -> object:
    from google.genai import types

    model_name = config["model"]
    print(f"  [debug] model: {model_name}, generating image...")

    parts = []
    for img in ref_images:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        parts.append(types.Part.from_bytes(data=buf.getvalue(), mime_type="image/png"))
    parts.append(types.Part.from_text(text=prompt))

    response = client.models.generate_content(
        model=model_name,
        contents=[types.Content(role="user", parts=parts)],
        config=types.GenerateContentConfig(
            response_modalities=["IMAGE"],
        ),
    )
    print(f"  [debug] candidates: {len(response.candidates)}")
    return response


def _save_image_from_response(response, output_path: Path) -> bool:
    import base64

    parts = response.candidates[0].content.parts
    print(f"  [debug] response parts: {len(parts)}")
    for i, part in enumerate(parts):
        if hasattr(part, "inline_data") and part.inline_data is not None:
            data = part.inline_data.data
            print(f"  [debug] part[{i}]: IMAGE {len(data) if data else 0} bytes")
        elif hasattr(part, "text") and part.text:
            print(f"  [debug] part[{i}]: TEXT: {repr(part.text[:80])}")

    for part in response.candidates[0].content.parts:
        if hasattr(part, "inline_data") and part.inline_data is not None:
            data = part.inline_data.data
            image_data = data if isinstance(data, bytes) else base64.b64decode(data)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(image_data)
            return True
    return False


def _generate_variant(
    character: dict,
    variant: dict,
    client,
    config: dict,
    templates: dict,
    ref_images: list,
    dry_run: bool,
    force: bool,
) -> bool:
    char_id = character["id"]
    variant_key = variant["key"]
    output_path = FRAMES_DIR / f"{char_id}_{variant_key}.png"

    if output_path.exists() and not force:
        print(f"  {variant_key} — exists, skipping")
        return True

    prompt = _assemble_prompt(character, variant, templates)

    if dry_run:
        print(f"\n--- {char_id} / {variant_key} ---")
        print(prompt)
        return True

    for attempt in range(2):
        try:
            response = _call_api(client, prompt, ref_images, config)
            saved = _save_image_from_response(response, output_path)
            if saved:
                print(f"  {variant_key} — saved")
                return True
            else:
                print(f"  {variant_key} — ERROR: no image in response")
                return False

        except Exception as e:
            error_str = str(e)
            if "400" in error_str and ("thought" in error_str.lower() or "signature" in error_str.lower()):
                print(f"  {variant_key} — ERROR (thought signature, skipping): {e}")
                return False
            if "429" in error_str and attempt == 0:
                print(f"  {variant_key} — rate limited, waiting 60s...")
                time.sleep(60)
                continue
            print(f"  {variant_key} — ERROR: {e}")
            return False

    return False


def _load_compose() -> object:
    """Load compose_character from compose.py at runtime."""
    import importlib.util as _ilu
    _spec = _ilu.spec_from_file_location("compose", Path(__file__).parent / "compose.py")
    _mod = _ilu.module_from_spec(_spec)
    _spec.loader.exec_module(_mod)
    return _mod.compose_character


def _prompt_batch_or_direct(delay: int) -> bool:
    """
    Ask the user whether to run in batch mode (with delay) or directly.
    Returns True if batch, False if direct.
    """
    try:
        answer = input(f"Batch ({delay}s delay, auto-compose) or direct? (b/d): ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        return False
    return answer == "b"


def _find_redo_targets(characters_by_id: dict) -> list[tuple[dict, dict]]:
    """
    Scan frames dir for *_redo.png files and return (character, variant) pairs to regenerate.
    Filename format: {id}_varA_redo.png or {id}_varB_redo.png
    _flag files are ignored — those are for manual review only.
    """
    targets = []
    for path in sorted(FRAMES_DIR.glob("*_redo.png")):
        # Strip _redo suffix to get the base stem, e.g. brian-roberts_varA
        base = path.stem[: -len("_redo")]  # e.g. "brian-roberts_varA"
        # Split on last underscore to get id and variant key
        last_underscore = base.rfind("_")
        if last_underscore == -1:
            print(f"  [warn] could not parse redo filename: {path.name}, skipping")
            continue
        char_id = base[:last_underscore]
        variant_key = base[last_underscore + 1:]  # e.g. "varA"

        character = characters_by_id.get(char_id)
        if not character:
            print(f"  [warn] {char_id} not found in characters.json, skipping {path.name}")
            continue

        # Build variant dict matching the structure _generate_variant expects
        variant_letter = variant_key.lstrip("var")  # "A" or "B"
        outfit = character.get("variants", {}).get(variant_letter, {}).get("outfit", "")
        variant = {"key": variant_key, "variant": variant_letter, "outfit": outfit}
        targets.append((character, variant))
        print(f"  redo queued: {char_id} / {variant_key}")

    return targets


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate sprite variant pairs (neutral+defeated) via Gemini API."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--character", metavar="ID", help="Generate one character by id")
    group.add_argument("--all", action="store_true", help="Generate all characters")
    group.add_argument("--redo", action="store_true", help="Regenerate all *_redo.png flagged variants")
    group.add_argument("--batch", action="store_true", help="Generate all pending variants with delay, then auto-compose")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling API")
    parser.add_argument("--force", action="store_true", help="Regenerate even if frames exist")
    args = parser.parse_args()

    _load_env()

    if not args.dry_run:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("ERROR: GEMINI_API_KEY is not set. Add it to tools/img-gen/.env or your environment.")
            sys.exit(1)

    config = _load_json(TOOL_DIR / "config.json")
    characters_list = _load_json(TOOL_DIR / "characters.json")
    templates = _load_json(TOOL_DIR / "templates" / "prompts.json")
    characters_by_id = {c["id"]: c for c in characters_list}

    if args.redo:
        print("Scanning for *_redo.png files...")
        redo_pairs = _find_redo_targets(characters_by_id)
        if not redo_pairs:
            print("No _redo files found.")
            sys.exit(0)

        delay = config.get("batch_delay_seconds", 5)
        use_batch = not args.dry_run and _prompt_batch_or_direct(delay)

        ref_images = []
        if not args.dry_run:
            ref_images = _load_reference_images(config)
            if not ref_images:
                print("WARNING: no reference images loaded — output quality may be reduced")

        client = None
        if not args.dry_run:
            from google import genai
            client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        total = len(redo_pairs)
        successes = 0
        failures = []
        composed_char_ids: set[str] = set()
        print()

        for n, (character, variant) in enumerate(redo_pairs, 1):
            char_id = character["id"]
            print(f"\n{char_id} / {variant['key']} (redo):")
            ok = _generate_variant(
                character=character,
                variant=variant,
                client=client,
                config=config,
                templates=templates,
                ref_images=ref_images,
                dry_run=args.dry_run,
                force=True,
            )
            if ok:
                successes += 1
                composed_char_ids.add(char_id)
            else:
                failures.append(f"{char_id}/{variant['key']}")
            if use_batch and n < total:
                time.sleep(delay)

        if not args.dry_run:
            print(f"\nRedone {successes} of {total} variants.", end="")
            if failures:
                print(f" Failures: {failures}")
            else:
                print(" No failures.")
            if use_batch and composed_char_ids:
                compose_character = _load_compose()
                print("\n--- Composing sprite sheets ---")
                for char_id in sorted(composed_char_ids):
                    compose_character(characters_by_id[char_id], force=True)
        return

    if args.batch:
        compose_character = _load_compose()
        delay = config.get("batch_delay_seconds", 5)

        # Build full work list: all characters × variants, skip existing unless --force
        work: list[tuple[dict, dict]] = []
        for character in characters_list:
            for variant in _variants_for_character(character):
                output_path = FRAMES_DIR / f"{character['id']}_{variant['key']}.png"
                if not output_path.exists() or args.force:
                    work.append((character, variant))

        total = len(work)
        if total == 0:
            print("Nothing to generate — all variants exist. Use --force to regenerate.")
            sys.exit(0)

        print(f"Batch: {total} variant(s) to generate, {delay}s delay between requests.")

        ref_images = _load_reference_images(config)
        if not ref_images:
            print("WARNING: no reference images loaded — output quality may be reduced")

        from google import genai
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        successes = 0
        failures = []
        composed_chars: set[str] = set()

        for n, (character, variant) in enumerate(work, 1):
            char_id = character["id"]
            variant_key = variant["key"]
            ok = _generate_variant(
                character=character,
                variant=variant,
                client=client,
                config=config,
                templates=templates,
                ref_images=ref_images,
                dry_run=False,
                force=args.force,
            )
            status = "saved" if ok else "ERROR"
            print(f"{n}/{total} — {char_id}/{variant_key} — {status}")
            if ok:
                successes += 1
                composed_chars.add(char_id)
            else:
                failures.append(f"{char_id}/{variant_key}")

            if n < total:
                time.sleep(delay)

        print(f"\nGenerated {successes} of {total} variants.", end="")
        if failures:
            print(f" Failures: {failures}")
        else:
            print(" No failures.")

        if composed_chars:
            print("\n--- Composing sprite sheets ---")
            for char_id in sorted(composed_chars):
                compose_character(characters_by_id[char_id], force=True)

        return

    if args.all:
        targets = characters_list
    else:
        char_id = args.character
        if char_id not in characters_by_id:
            print(f"ERROR: character '{char_id}' not found in characters.json")
            print(f"Available ids: {', '.join(characters_by_id.keys())}")
            sys.exit(1)
        targets = [characters_by_id[char_id]]

    delay = config.get("batch_delay_seconds", 5)
    use_batch = not args.dry_run and _prompt_batch_or_direct(delay)

    ref_images = []
    if not args.dry_run:
        ref_images = _load_reference_images(config)
        if not ref_images:
            print("WARNING: no reference images loaded — output quality may be reduced")

    client = None
    if not args.dry_run:
        from google import genai
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    # Flatten all work upfront so we can show N/total progress in batch mode
    work: list[tuple[dict, dict]] = [
        (character, variant)
        for character in targets
        for variant in _variants_for_character(character)
    ]
    total = len(work)
    successes = 0
    failures = []
    generated_char_ids: set[str] = set()

    for n, (character, variant) in enumerate(work, 1):
        char_id = character["id"]
        if not use_batch:
            # Original verbose per-character grouping
            if n == 1 or work[n - 2][0]["id"] != char_id:
                char_variants = _variants_for_character(character)
                print(f"\n{char_id} ({len(char_variants)} variant(s)):")

        ok = _generate_variant(
            character=character,
            variant=variant,
            client=client,
            config=config,
            templates=templates,
            ref_images=ref_images,
            dry_run=args.dry_run,
            force=args.force,
        )
        if use_batch:
            status = "saved" if ok else "ERROR"
            print(f"{n}/{total} — {char_id}/{variant['key']} — {status}")
        if ok:
            successes += 1
            generated_char_ids.add(char_id)
        else:
            failures.append(f"{char_id}/{variant['key']}")
        if use_batch and n < total:
            time.sleep(delay)

    if not args.dry_run:
        print(f"\nGenerated {successes} of {total} variants.", end="")
        if failures:
            print(f" Failures: {failures}")
        else:
            print(" No failures.")
        if use_batch and generated_char_ids:
            compose_character = _load_compose()
            print("\n--- Composing sprite sheets ---")
            for char_id in sorted(generated_char_ids):
                compose_character(characters_by_id[char_id], force=True)


if __name__ == "__main__":
    main()
