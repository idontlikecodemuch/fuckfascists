#!/usr/bin/env python3
"""
compose.py - original chiptune music beds for the FCK Fascists explainer video.

Entry point. Pipeline: a style's score module (composition + production settings)
-> render.py (dry tracks built on synth.py's NES-style oscillators) -> mix.py
(duck, drive, echo, reverb, master EQ) -> loudness to -16 LUFS integrated under
the style's true-peak ceiling (measured with ffmpeg loudnorm) -> 16-bit WAV
(TPDF dither) and 320 kbps MP3.

Styles:  hopeful (score.py, 124.14 bpm)   punk (score_punk.py, 138.46 bpm)

Everything is synthesized from numbers: no samples, loops, MIDI or soundfonts.
Requires only numpy + ffmpeg on PATH.

  python3 compose.py                       # hopeful: 64 s WAV+MP3, 30 s and 15 s MP3
  python3 compose.py --style punk          # punk versions of the same set
  python3 compose.py --out-dir DIR --loop-a DIR/loopA.wav   # + seamless 8-bar loop of A1
"""
import argparse
import importlib
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

from mix import render
from render import SR

TARGET_LUFS = -16.0
DEFAULT_OUT = Path('/Users/christophershannon/fuckfascists/marketing/video/music')
STYLES = {'hopeful': 'score', 'punk': 'score_punk'}


def loudness(x):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '2',
                        '-i', 'pipe:0', '-af', f'loudnorm=I={TARGET_LUFS}:TP=-1:print_format=json',
                        '-f', 'null', '-'], input=x.astype('<f4').tobytes(), capture_output=True, check=True)
    err = p.stderr.decode()
    j = json.loads(err[err.rindex('{'):err.rindex('}') + 1])
    return float(j['input_i']), float(j['input_tp']), float(j['input_lra'])


def limit(x, ceiling_db, block=64, release_s=0.08):
    """Look-ahead block limiter (gain never exceeds what any nearby sample needs)."""
    ceil = 10.0 ** (ceiling_db / 20.0)
    peak = np.max(np.abs(x), axis=1)
    nb = -(-peak.size // block)
    padded = np.zeros(nb * block)
    padded[: peak.size] = peak
    need = np.minimum(1.0, ceil / np.maximum(padded.reshape(nb, block).max(axis=1), 1e-12))
    c = need.copy()
    c[1:] = np.minimum(c[1:], need[:-1])
    c[:-1] = np.minimum(c[:-1], need[1:])
    coef, g, cur = 1.0 - np.exp(-block / (release_s * SR)), np.empty(nb), 1.0
    for k in range(nb):
        cur = min(c[k], cur + coef * (1.0 - cur))
        g[k] = cur
    gs = np.interp(np.arange(peak.size), (np.arange(nb) + 0.5) * block, g)
    return np.clip(x * gs[:, None], -ceil, ceil)


def master(x, tp_target, gain=None):
    """Hit -16 LUFS with true peak <= tp_target. Returns (audio, gain, ceiling, (I, TP, LRA))."""
    ceiling = tp_target - 0.4
    if gain is None:
        gain = 10.0 ** ((TARGET_LUFS - loudness(x)[0]) / 20.0)
    for _ in range(8):
        y = limit(x * gain, ceiling)
        i, tp, lra = loudness(y)
        if tp > tp_target - 0.1:
            ceiling -= tp - (tp_target - 0.15)
        elif abs(i - TARGET_LUFS) > 0.1:
            gain *= 10.0 ** ((TARGET_LUFS - i) / 20.0)
        else:
            break
    return y, gain, ceiling, (i, tp, lra)


def to_int16(x, seed=5):
    rng = np.random.default_rng(seed)
    d = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0
    return np.clip(np.round((x + d) * 32767.0), -32768, 32767).astype('<i2')


def write_wav(path, pcm):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def write_mp3(path, pcm, title):
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR),
                    '-ac', '2', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '320k',
                    '-metadata', f'title={title}', '-metadata', 'comment=Original synthesis (compose.py)',
                    str(path)], input=pcm.tobytes(), check=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--style', choices=sorted(STYLES), default='hopeful')
    ap.add_argument('--out-dir', type=Path, default=DEFAULT_OUT)
    ap.add_argument('--loop-a', type=Path, help='also write a seamless 8-bar loop of section A1 (WAV)')
    args = ap.parse_args()
    S = importlib.import_module(STYLES[args.style])
    args.out_dir.mkdir(parents=True, exist_ok=True)
    print(f'{args.style}: {60 / S.BEAT:.3f} bpm | beat {S.BEAT * 30:g} frames | bar {S.BAR:.4f} s '
          f'= {S.BAR * 30:g} frames @ 30 fps')
    full_gain = full_ceiling = None
    for label, (bars, seconds, fade) in S.ARRANGEMENTS.items():
        y, gain, ceiling, (i, tp, lra) = master(render(S, bars, seconds, fade), S.FX['tp'])
        if label == '64s':
            full_gain, full_ceiling = gain, ceiling
        pcm = to_int16(y)
        stem = args.out_dir / f'{S.NAME}_{label}'
        if label == '64s':
            write_wav(stem.with_suffix('.wav'), pcm)
        write_mp3(stem.with_suffix('.mp3'), pcm, f'FCK Fascists bed - {args.style} ({label})')
        print(f'{label}: {y.shape[0] / SR:.3f} s  I={i:.2f} LUFS  TP={tp:.2f} dBTP  LRA={lra:.1f}  '
              f'peak={20 * np.log10(np.abs(y).max()):.2f} dBFS')
    if args.loop_a:
        n8 = int(round(8 * S.BAR * SR))
        x = render(S, S.LOOP_A * 3, 24 * S.BAR, 0.001)[n8:2 * n8]   # middle pass carries the wrapped tails
        write_wav(args.loop_a, to_int16(limit(x * full_gain, full_ceiling)))
        print(f'loop A1: {n8 / SR:.4f} s -> {args.loop_a}')


if __name__ == '__main__':
    main()
