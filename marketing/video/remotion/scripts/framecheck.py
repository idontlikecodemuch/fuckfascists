#!/usr/bin/env python3
"""Render QA: flags frames Chrome handed Remotion corrupt.

  scripts/framecheck.py <render.mp4> [...]

Catches three defect classes seen in this project's renders:
  tiled    the frame is its own top-left crop repeated (any period, 1/6..2/3 of the frame)
  blank    only the root background colour was painted
  partial  a block of rows was never painted (dark flat-row fraction jumps vs neighbours)
Exit code 1 if anything is flagged. Works at 1/4 scale, ~20 s per minute of video.
"""
import subprocess, sys
import numpy as np

def frames(src):
    w, h = [int(x) for x in subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src]).decode().strip().split(',') if x]
    W, H = w // 4, h // 4
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={W}:{H}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H:
            return
        yield np.frombuffer(b, np.uint8).reshape(H, W).astype(np.int16)

def period_score(f, axis):
    """min self-difference over every candidate shift vs the median: tiles give a deep notch.
    Single-pixel steps (a tile period can be odd); every 3rd line across the other axis."""
    g = f[::3, :] if axis == 1 else f[:, ::3]
    n = g.shape[axis]
    d = []
    for s in range(max(8, n // 6), (2 * n) // 3):
        a = np.take(g, range(0, n - s), axis=axis); b = np.take(g, range(s, n), axis=axis)
        d.append(np.abs(a - b).mean())
    d = np.array(d)
    return float(d.min()), float(np.median(d))

def check(src):
    hits = []
    prev = None; prev_flat = 0.0
    buf = []  # (index, frame, flatfrac, std)
    for i, f in enumerate(frames(src)):
        std = float(f.std())
        flat = float(((f.std(axis=1) < 1.5) & (f.mean(axis=1) < 30)).mean())  # unpainted = flat AND dark (CRT flashes are white)
        buf.append((i, f, flat, std))
        if len(buf) < 3:
            continue
        (i0, f0, fl0, s0), (i1, f1, fl1, s1), (i2, f2, fl2, s2) = buf[-3:]
        # blank: uniform frame between two non-uniform ones
        if s1 < 1.5 and s0 > 1.5 and s2 > 1.5:
            hits.append((i1, 'blank', f'mean={f1.mean():.0f}'))
        # partial: far more unpainted rows than both neighbours
        elif s1 > 1.5 and fl1 - max(fl0, fl2) > 0.25:
            hits.append((i1, 'partial', f'flat rows {fl1:.0%} vs {max(fl0, fl2):.0%}'))
        # tiled: deep notch in the self-difference along both axes
        elif s1 > 4:
            mx, medx = period_score(f1, 1); my, medy = period_score(f1, 0)
            if mx < 0.12 * medx and my < 0.12 * medy and mx < 4 and my < 4:
                hits.append((i1, 'tiled', f'notch x={mx:.1f}/{medx:.1f} y={my:.1f}/{medy:.1f}'))
        buf = buf[-2:]
    return hits

if __name__ == '__main__':
    bad = 0
    for src in sys.argv[1:]:
        hits = check(src)
        print(f'{src}: {len(hits)} flagged')
        for i, kind, why in hits:
            print(f'  frame {i} ({i/30:.2f}s) {kind}: {why}')
        bad += len(hits)
    sys.exit(1 if bad else 0)
