"""
gpt_image.py — GPT image pipeline for F*ck Fascists pixel art assets.

Two modes:
  --generate  Text prompt → PNG output (optionally with a reference image).
  --process   Existing PNG(s) → cleaned PNG(s) via natural-language edit instruction.

Uses gpt-image-1 throughout. Reads OPENAI_API_KEY from the repo root .env file.

Usage:
  Generate:
    python3 scripts/gpt_image.py --generate --prompt "A pixel art flag marker" --output-dir output/
    python3 scripts/gpt_image.py --generate --prompt "Pixel sprite of CEO" --reference ref.png --size 512x512

  Process single:
    python3 scripts/gpt_image.py --process --input sprite.png --instruction "Remove all backgrounds and make them fully transparent."

  Process batch (glob):
    python3 scripts/gpt_image.py --process --input "output/raw/*.png" --instruction "Remove magenta background, preserve pixel art."
"""

import argparse
import base64
import glob
import io
import os
import sys
from pathlib import Path

from PIL import Image

TOOL_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TOOL_DIR.parent.parent
DEFAULT_OUTPUT_DIR = TOOL_DIR / "output"


def _load_env() -> None:
    """Load .env from the repo root using python-dotenv."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        print("ERROR: python-dotenv is required. Run: pip3 install python-dotenv")
        sys.exit(1)

    env_path = REPO_ROOT / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def _get_client():
    """Return an OpenAI client, exiting with a clear error if the key is missing."""
    try:
        from openai import OpenAI
    except ImportError:
        print("ERROR: openai is required. Run: pip3 install openai")
        sys.exit(1)

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY is not set.")
        print("Add it to the repo root .env file or export it in your environment.")
        sys.exit(1)

    return OpenAI(api_key=api_key)


def _parse_size(size_str: str) -> str:
    """Validate and return a size string like '1024x1024'."""
    valid_sizes = ["1024x1024", "1024x1536", "1536x1024", "auto"]
    if size_str in valid_sizes:
        return size_str
    print(f"ERROR: invalid --size '{size_str}'. Must be one of: {', '.join(valid_sizes)}")
    sys.exit(1)


def _save_b64_png(b64_data: str, output_path: Path) -> None:
    """Decode base64 image data and save as PNG with full alpha channel."""
    image_bytes = base64.b64decode(b64_data)
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path, format="PNG")


# ---------------------------------------------------------------------------
# Generate mode
# ---------------------------------------------------------------------------

def _generate(args) -> None:
    """Text prompt → PNG output. Optionally pass a reference image."""
    client = _get_client()
    output_dir = Path(args.output_dir)
    size = _parse_size(args.size)

    if args.reference:
        # Use the edits endpoint with a reference image alongside the prompt
        ref_path = Path(args.reference)
        if not ref_path.exists():
            print(f"ERROR: reference image not found: {ref_path}")
            sys.exit(1)

        print(f"Generating with reference: {ref_path}")
        print(f"Prompt: {args.prompt}")
        print(f"Size: {size}")

        with open(ref_path, "rb") as img_file:
            result = client.images.edit(
                model="gpt-image-1",
                image=img_file,
                prompt=args.prompt,
                size=size,
            )
    else:
        # Pure text-to-image generation
        print(f"Generating from prompt...")
        print(f"Prompt: {args.prompt}")
        print(f"Size: {size}")

        result = client.images.generate(
            model="gpt-image-1",
            prompt=args.prompt,
            size=size,
            n=1,
        )

    b64_data = result.data[0].b64_json
    if not b64_data:
        print("ERROR: no image data in API response.")
        sys.exit(1)

    # Determine output filename
    if args.filename:
        filename = args.filename
        if not filename.endswith(".png"):
            filename += ".png"
    else:
        # Auto-generate from first few words of prompt
        slug = args.prompt[:40].strip().lower()
        slug = "".join(c if c.isalnum() or c == " " else "" for c in slug)
        slug = slug.strip().replace(" ", "_")
        filename = f"{slug}.png"

    output_path = output_dir / filename
    _save_b64_png(b64_data, output_path)
    print(f"Saved: {output_path}")


# ---------------------------------------------------------------------------
# Process mode
# ---------------------------------------------------------------------------

def _resolve_inputs(input_pattern: str) -> list[Path]:
    """Resolve input path(s) — supports glob patterns and single files."""
    # Try as a glob pattern first
    matches = sorted(glob.glob(input_pattern, recursive=True))
    if matches:
        return [Path(m) for m in matches if Path(m).is_file() and m.lower().endswith(".png")]

    # Try as a single file path
    p = Path(input_pattern)
    if p.exists() and p.is_file():
        return [p]

    print(f"ERROR: no PNG files matched: {input_pattern}")
    sys.exit(1)


def _process_single(client, input_path: Path, instruction: str, output_dir: Path | None) -> bool:
    """Process a single PNG through the GPT edit endpoint. Returns True on success."""
    # Determine output path
    if output_dir is not None:
        out_path = output_dir / f"{input_path.stem}_gpt.png"
    else:
        out_path = input_path.parent / f"{input_path.stem}_gpt.png"

    try:
        with open(input_path, "rb") as img_file:
            result = client.images.edit(
                model="gpt-image-1",
                image=img_file,
                prompt=instruction,
            )

        b64_data = result.data[0].b64_json
        if not b64_data:
            print(f"  ERROR: no image data in response for {input_path.name}")
            return False

        _save_b64_png(b64_data, out_path)
        print(f"  Saved: {out_path}")
        return True

    except Exception as e:
        print(f"  ERROR processing {input_path.name}: {e}")
        return False


def _process(args) -> None:
    """Process existing PNG(s) with a natural-language edit instruction."""
    client = _get_client()
    inputs = _resolve_inputs(args.input)

    output_dir = Path(args.output_dir) if args.output_dir else None

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)

    total = len(inputs)
    successes = 0
    failures = []

    for i, input_path in enumerate(inputs, 1):
        print(f"[{i}/{total}] {input_path.name}")
        ok = _process_single(client, input_path, args.instruction, output_dir)
        if ok:
            successes += 1
        else:
            failures.append(input_path.name)

    print(f"\nProcessed {successes} of {total} file(s).", end="")
    if failures:
        print(f" Failures: {failures}")
    else:
        print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="GPT image pipeline: generate or process PNG assets using gpt-image-1."
    )
    subparsers = parser.add_subparsers(dest="mode", required=True)

    # --generate
    gen_parser = subparsers.add_parser("--generate", help="Text prompt → PNG output")
    gen_parser.add_argument("--prompt", required=True, help="Text prompt for image generation")
    gen_parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Output directory (default: tools/img-gen/output/)")
    gen_parser.add_argument("--filename", help="Output filename (default: auto-generated from prompt)")
    gen_parser.add_argument("--reference", metavar="PATH", help="Reference image to pass alongside the prompt (uses edit endpoint)")
    gen_parser.add_argument("--size", default="1024x1024", help="Output size: 1024x1024, 1024x1536, 1536x1024, or auto (default: 1024x1024)")

    # --process
    proc_parser = subparsers.add_parser("--process", help="Edit existing PNG(s) with a natural-language instruction")
    proc_parser.add_argument("--input", required=True, help="Input PNG path or glob pattern (e.g. 'output/raw/*.png')")
    proc_parser.add_argument("--instruction", required=True, help="Natural-language edit instruction")
    proc_parser.add_argument("--output-dir", default=None, help="Output directory (default: same directory as input, with _gpt suffix)")

    args = parser.parse_args()

    _load_env()

    if args.mode == "--generate":
        _generate(args)
    elif args.mode == "--process":
        _process(args)


if __name__ == "__main__":
    main()
