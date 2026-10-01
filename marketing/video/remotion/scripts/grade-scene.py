#!/usr/bin/env python3
"""Skin-only colour grade for an 'in context' Clark scene (JPEG sequence).

  scripts/grade-scene.py <sceneId> [--gains R,G,B] [--gamma G] [--preview N]

Pixels whose hue/saturation/value fall in the skin window get per-channel gains and a
gamma (darker/browner, to match the pixel-art Clark); the mask is feathered so edges
don't ring. The office stays as shot. --preview N writes a before/after crop for frame N
to scratch instead of rewriting the sequence. Re-runnable: it grades the current files,
so regenerate the sequence (prep-scene.sh) before re-grading with new numbers.
"""
import argparse, glob, os, sys
import numpy as np
from PIL import Image, ImageFilter

M = '/Users/christophershannon/fuckfascists/marketing/video/clips/clark/scene'
ap = argparse.ArgumentParser()
ap.add_argument('scene'); ap.add_argument('--gains', default='1.08,0.94,0.70'); ap.add_argument('--gamma', type=float, default=0.90)
ap.add_argument('--hue', default='4,38'); ap.add_argument('--sat', default='0.22,0.85'); ap.add_argument('--val', default='0.25,0.97')
ap.add_argument('--preview', type=int, default=0); ap.add_argument('--preview-out', default='')
a = ap.parse_args()
gains = np.array([float(x) for x in a.gains.split(',')]); h0, h1 = [float(x) for x in a.hue.split(',')]
s0, s1 = [float(x) for x in a.sat.split(',')]; v0, v1 = [float(x) for x in a.val.split(',')]

def grade(img: Image.Image) -> tuple[Image.Image, np.ndarray]:
    rgb = np.asarray(img.convert('RGB')).astype(np.float32) / 255.0
    hsv = np.asarray(img.convert('HSV')).astype(np.float32)
    hue = hsv[..., 0] * 360.0 / 255.0; sat = hsv[..., 1] / 255.0; val = hsv[..., 2] / 255.0
    m = ((hue >= h0) & (hue <= h1) & (sat >= s0) & (sat <= s1) & (val >= v0) & (val <= v1)).astype(np.float32)
    m = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
    graded = np.clip(rgb * gains, 0, 1) ** (1.0 / a.gamma) if a.gamma >= 1 else np.clip(rgb * gains, 0, 1) ** (1.0 / a.gamma)
    out = rgb * (1 - m[..., None]) + graded * m[..., None]
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)), m

files = sorted(glob.glob(f'{M}/{a.scene}/*.jpg'))
if not files: sys.exit(f'no frames in {M}/{a.scene}')
if a.preview:
    src = Image.open(files[a.preview - 1]); out, m = grade(src)
    box = (820, 180, 1100, 480)  # face
    before, after = src.crop(box), out.crop(box)
    mask = Image.fromarray((m * 255).astype(np.uint8)).crop(box).convert('RGB')
    sheet = Image.new('RGB', (before.width * 3, before.height)); sheet.paste(before, (0, 0)); sheet.paste(after, (before.width, 0)); sheet.paste(mask, (before.width * 2, 0))
    sheet.save(a.preview_out or f'/tmp/grade-preview-{a.scene}.png'); print('preview written', a.preview_out)
    face = np.asarray(after).reshape(-1, 3)[np.asarray(mask.convert('L')).reshape(-1) > 200]
    print('graded skin mean RGB', face.mean(0).round(1) if len(face) else 'n/a')
else:
    for f in files:
        out, _ = grade(Image.open(f)); out.save(f, quality=94)
    print(f'graded {len(files)} frames in {M}/{a.scene}')
