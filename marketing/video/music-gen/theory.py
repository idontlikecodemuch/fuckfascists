"""
theory.py - chord / scale / line helpers shared by every score module.
"""
from synth import midi, pc_of

QUALITY = {'': (0, 4, 7), 'm': (0, 3, 7), 'maj7': (0, 4, 7, 11), 'm7': (0, 3, 7, 10),
           '7': (0, 4, 7, 10), 'sus4': (0, 5, 7), 'add9': (0, 4, 7, 14), 'maj9': (0, 4, 7, 11, 14)}
SCALES = {'C': (0, 2, 4, 5, 7, 9, 11), 'D': (2, 4, 6, 7, 9, 11, 1)}


def chord(name):
    body, _, bass = name.partition('/')
    root_name = body[:2] if len(body) > 1 and body[1] in '#b' else body[:1]
    root = pc_of(root_name)
    ivs = QUALITY[body[len(root_name):]]
    third = next((i for i in ivs if i in (3, 4)), 7)
    return {'root': root, 'ivs': ivs, 'pcs': {(root + i) % 12 for i in ivs},
            'bass': pc_of(bass) if bass else root,
            'third': (root + third) % 12, 'fifth': (root + 7) % 12}


def tones_in(ch, lo, hi):
    return [m for m in range(lo, hi + 1) if m % 12 in ch['pcs']]


def arp(mode, pat, lo, hi, duty=0.125, tau=0.09, vel=1.0):
    return {'arp': mode, 'pat': pat, 'lo': lo, 'hi': hi, 'duty': duty, 'tau': tau, 'vel': vel}


def parse_line(text):
    """'E5:3 r:2 G5:3' -> [(step, length, midi)] in 16th-note steps."""
    out, pos = [], 0.0
    for tok in text.split():
        name, length = tok.split(':')
        if name != 'r':
            out.append((pos, float(length), midi(name)))
        pos += float(length)
    assert pos <= 16.0 + 1e-9, text
    return out


def chord_at(bars, bar, step):
    name = bars[bar]['ch'][0][1]
    for s, n in bars[bar]['ch']:
        if step + 1e-9 >= s:
            name = n
    return chord(name)


def harmony_note(m, ch, key):
    """Chord-aware harmony under the lead: nearest chord tone 3-9 semitones below,
    diatonic third below for passing tones."""
    if m % 12 in ch['pcs']:
        cands = [x for x in range(m - 9, m - 2) if x % 12 in ch['pcs']]
        if cands:
            return max(cands)
    lower = [x for x in range(m - 1, m - 6, -1) if x % 12 in SCALES[key]]
    return lower[1] if len(lower) > 1 else m - 3


def bass_pitch(deg, ch, key, next_ch):
    base = 40 + (ch['bass'] - 40) % 12                 # bass note in E2..D#3
    if deg == 'R':
        return base
    if deg == 'R-12':
        return base - 12
    if deg == 'O':
        return base + 12
    if deg in ('5', '3'):
        pc = ch['fifth'] if deg == '5' else ch['third']
        return base + ((pc - base) % 12 or 12)
    if next_ch is None:                                 # 'A' with nothing after
        return base
    target = 40 + (next_ch['bass'] - 40) % 12
    return target - 1 if (target - 1) % 12 in SCALES[key] else target - 2
