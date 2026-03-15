# Reference Images

Place 2-3 reference sprite PNGs here.

These images are loaded by `scripts/generate.py` and `scripts/cache.py` as style
references when prompting the Gemini API. They establish the visual style the model
should match: chunky pixels, 3/4 front-facing view, thick black outlines, magenta
chroma-key background (#FF00FF), limited color palette.

Expected filenames (configurable in `config.json`):
- `ref1.png`
- `ref2.png`
- `ref3.png`

Reference images are committed to the repo. Missing reference files are skipped with
a warning — at least one reference image should be present for best results.
