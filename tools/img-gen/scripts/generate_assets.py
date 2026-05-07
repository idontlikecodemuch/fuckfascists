"""
generate_assets.py — Gemini asset generator for FCK Fascists UI ornaments.

Generates raw PNG assets via the Gemini API using prompts from asset-prompts.json.
Output images have a #FF00FF background — run process_assets.py afterward to key
and slice them into app-ready PNGs.

Usage:
  All:      python3 scripts/generate_assets.py --all
  Single:   python3 scripts/generate_assets.py --asset marker_flag_default
  Dry run:  python3 scripts/generate_assets.py --all --dry-run
  Force:    python3 scripts/generate_assets.py --all --force
"""

import argparse
import base64
import io
import json
import os
import sys
import time
from pathlib import Path

TOOL_DIR = Path(__file__).resolve().parent.parent
RAW_ASSETS_DIR = TOOL_DIR / "output" / "raw"


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


def _generate_asset(
    asset: dict,
    client,
    config: dict,
    ref_images: list,
    dry_run: bool,
    force: bool,
) -> bool:
    asset_id = asset["id"]
    output_path = RAW_ASSETS_DIR / f"{asset_id}.png"

    if output_path.exists() and not force:
        print(f"  {asset_id} — exists, skipping")
        return True

    prompt = asset["prompt"]

    if dry_run:
        print(f"\n--- {asset_id} ---")
        print(prompt)
        return True

    for attempt in range(2):
        try:
            response = _call_api(client, prompt, ref_images, config)
            saved = _save_image_from_response(response, output_path)
            if saved:
                print(f"  {asset_id} — saved")
                return True
            else:
                print(f"  {asset_id} — ERROR: no image in response")
                return False

        except Exception as e:
            error_str = str(e)
            if "400" in error_str and ("thought" in error_str.lower() or "signature" in error_str.lower()):
                print(f"  {asset_id} — ERROR (thought signature, skipping): {e}")
                return False
            if "429" in error_str and attempt == 0:
                print(f"  {asset_id} — rate limited, waiting 60s...")
                time.sleep(60)
                continue
            print(f"  {asset_id} — ERROR: {e}")
            return False

    return False


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate UI ornament assets via Gemini API."
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Generate all assets")
    group.add_argument("--asset", metavar="ID", help="Generate one asset by id")
    parser.add_argument("--dry-run", action="store_true", help="Print prompts without calling API")
    parser.add_argument("--force", action="store_true", help="Regenerate even if raw file exists")
    args = parser.parse_args()

    _load_env()

    if not args.dry_run:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("ERROR: GEMINI_API_KEY is not set. Add it to tools/img-gen/.env or your environment.")
            sys.exit(1)

    config = _load_json(TOOL_DIR / "config.json")
    asset_prompts = _load_json(TOOL_DIR / "asset-prompts.json")
    assets_by_id = {a["id"]: a for a in asset_prompts["assets"]}

    if args.all:
        targets = asset_prompts["assets"]
    else:
        asset_id = args.asset
        if asset_id not in assets_by_id:
            print(f"ERROR: asset '{asset_id}' not found in asset-prompts.json")
            print(f"Available ids: {', '.join(assets_by_id.keys())}")
            sys.exit(1)
        targets = [assets_by_id[asset_id]]

    ref_images = []
    if not args.dry_run:
        configured = config.get("reference_images", [])
        if configured:
            try:
                answer = input("Use reference image(s)? (y/n): ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                answer = "n"
            if answer == "y":
                ref_images = _load_reference_images(config)
                if not ref_images:
                    print("WARNING: no reference images loaded — continuing without")
            else:
                print("Skipping reference images.")
        else:
            print("No reference images configured — proceeding without.")

    client = None
    if not args.dry_run:
        from google import genai
        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

    delay = config.get("batch_delay_seconds", 5)
    total = len(targets)
    successes = 0
    failures = []

    for n, asset in enumerate(targets, 1):
        asset_id = asset["id"]
        print(f"\n{n}/{total} — {asset_id} ({asset.get('asset_name', '')})")
        ok = _generate_asset(
            asset=asset,
            client=client,
            config=config,
            ref_images=ref_images,
            dry_run=args.dry_run,
            force=args.force,
        )
        if ok:
            successes += 1
        else:
            failures.append(asset_id)
        if not args.dry_run and n < total:
            time.sleep(delay)

    if not args.dry_run:
        print(f"\nGenerated {successes} of {total} assets.", end="")
        if failures:
            print(f" Failures: {failures}")
        else:
            print(" No failures.")


if __name__ == "__main__":
    main()
