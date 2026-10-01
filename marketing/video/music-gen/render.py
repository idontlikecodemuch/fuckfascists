"""
render.py - turns an arrangement (list of bar ids from a score module S) into dry tracks.

S supplies BEAT/STEP/BAR, BARS, LEAD_NOTES, COUNTER_NOTES, BASS, DRUMS, PATTERNS and
VOICE. A bar may set beats=3 (pickup bar); bar start times accumulate.
"""
import numpy as np

import synth as sy
from theory import bass_pitch, chord, chord_at, harmony_note, tones_in

SR = sy.SR
# power-chord strum patterns: (steps, gate in steps, decay, sustain, release)
GTR = {'mute8': (range(0, 16, 2), 1.6, 0.08, 0.2, 0.02), 'open8': (range(0, 16, 2), 1.9, 0.35, 0.55, 0.03),
       'whole': ((0,), 16, 0.9, 0.25, 0.3), 'count': ((0, 4, 8, 12), 2.5, 0.2, 0.3, 0.05),
       'sting': ((0,), 12, 0.6, 0.0, 0.2), 'hit': ((0,), 30, 1.1, 0.0, 0.3)}


def pan_gains(p):
    a = (p + 1.0) * np.pi / 4.0
    return np.cos(a), np.sin(a)


class Tracks:
    def __init__(self, seconds):
        self.n = int(seconds * SR)
        self.t = {}

    def add(self, name, start_s, sig, gain=1.0):
        i0 = int(round(start_s * SR))
        if i0 >= self.n:
            return
        sig = sig[: self.n - i0]
        buf = self.t.setdefault(name, np.zeros(self.n))
        buf[i0:i0 + sig.size] += sig * gain

    def add_panned(self, name, start_s, sig, pan, gain=1.0):
        l, r = pan_gains(pan)
        self.add(name + '_l', start_s, sig, gain * l)
        self.add(name + '_r', start_s, sig, gain * r)


def gate_of(S, length):
    return length * S.STEP * (0.82 if length <= 2 else 0.94)


def lead(tr, S, b, t0):
    v = S.VOICE['lead']
    for s, l, m in S.LEAD_NOTES.get(b, []):
        vel = 1.0 if s % 4 == 0 else 0.92
        sig = sy.tone(m, gate_of(S, l), duty_attack=v['duty_attack'], attack=v['attack'], decay=v['decay'],
                      sustain=v['sustain'], vib=v['vib'] if l >= 5 else 0.0)
        tr.add('lead', t0 + s * S.STEP, sig, vel)
        if S.BARS[b].get('wide'):        # drop: detuned 12.5 % doubles, spread L/R
            for det, pan in ((-9.0, -0.6), (9.0, 0.6)):
                sig = sy.tone(m, gate_of(S, l), duty=0.125, duty_attack=None, detune=det,
                              vib=12.0 if l >= 5 else 0.0, vib_rate=5.2)
                tr.add_panned('wide', t0 + s * S.STEP, sig, pan, 0.42 * vel)


def arp_notes(S, b, spec):
    step_len = {'arp16': 1, 'arp8': 2, 'arp4': 4, 'arp2': 8}[spec['arp']]
    out = []
    for k, s in enumerate(range(0, 16, step_len)):
        tones = tones_in(chord_at(S.BARS, b, s), spec['lo'], spec['hi'])
        if spec['pat'] == 'rise':                    # climb evenly through the register
            target = spec['lo'] + (spec['hi'] - spec['lo']) * s / 15.0
            m = min(tones, key=lambda x: abs(x - target))
            vel = 0.55 + 0.45 * s / 15.0
        else:
            seq = S.PATTERNS[spec['pat']]
            idx = seq[k % len(seq)]
            m = tones[idx % len(tones)] + 12 * (idx // len(tones))
            while m > 96:
                m -= 12
            vel = 1.0
        out.append((s, step_len, m, vel))
    return out


def arps(tr, S, name, b, t0, spec):
    hold = S.BARS[b].get('hold', 1.0)
    for s, l, m, vel in arp_notes(S, b, spec):
        sig = sy.tone(m, l * S.STEP * 0.9 * hold, duty=spec['duty'], duty_attack=None, attack=0.002,
                      decay=spec['tau'] * hold, sustain=0.0, release=0.03)
        tr.add(name, t0 + s * S.STEP, sig, spec['vel'] * vel)


def pulse2(tr, S, b, t0):
    mode = S.BARS[b].get('p2')
    if mode is None:
        return
    if mode == 'sting':
        tr.add('p2', t0, sy.tone(76, 8 * S.STEP, duty=0.5, duty_attack=0.25, attack=0.002,
                                 decay=0.45, sustain=0.0, release=0.05), 1.2)
    elif mode == 'counter':
        for s, l, m in S.COUNTER_NOTES[b]:
            sig = sy.tone(m, l * S.STEP * 0.96, duty=0.5, duty_attack=0.25, attack=0.012, decay=0.4,
                          sustain=0.8, release=0.08, vib=9.0 if l >= 6 else 0.0, vib_rate=5.0)
            tr.add('p2', t0 + s * S.STEP, sig, 1.05)
    elif mode == 'skank':                            # offbeat fast-arp chord stabs
        for s in (2, 6, 10, 14):
            tones = sorted(sorted(tones_in(chord_at(S.BARS, b, s), 64, 79), key=lambda x: abs(x - 71))[:3])
            sig = sy.fast_arp(tones, 1.4 * S.STEP, tick=sy.FRAME, attack=0.002, decay=0.07,
                              sustain=0.0, release=0.02)
            tr.add('p2', t0 + s * S.STEP, sig, 1.0)
    elif mode == 'harm':                             # lead harmonised a 3rd-6th below
        key = S.BARS[b]['key']
        for s, l, m in S.LEAD_NOTES.get(b, []):
            h = harmony_note(m, chord_at(S.BARS, b, s), key)
            sig = sy.tone(h, gate_of(S, l), duty=0.5, duty_attack=0.25, attack=0.006, decay=0.3,
                          sustain=0.75, release=0.06, vib=12.0 if l >= 5 else 0.0, vib_rate=5.1)
            tr.add('harm', t0 + s * S.STEP, sig)
    else:
        arps(tr, S, 'p2', b, t0, mode)


def pulse3(tr, S, b, t0):
    mode = S.BARS[b].get('p3')
    if mode is None:
        return
    if mode == 'sting':
        tr.add('p3', t0, sy.fast_arp([84, 88, 91, 96], 12 * S.STEP, attack=0.002, decay=0.45,
                                     sustain=0.0, release=0.05), 1.2)
    elif mode == 'chordarp':
        tones = tones_in(chord_at(S.BARS, b, 0), 74, 86)
        tr.add('p3', t0, sy.fast_arp(tones, S.BAR * 0.98, decay=0.35, sustain=0.55, release=0.1), 1.6)
    else:
        arps(tr, S, 'p3', b, t0, mode)


def guitar(tr, S, b, t0):
    """Power chords (root 25 % + fifth 12.5 % + octave 25 %), double-tracked L/R."""
    if not S.BARS[b].get('gtr'):
        return
    pat, vel = S.BARS[b]['gtr']
    steps, gate, decay, sus, rel = GTR[pat]
    for s in steps:
        ch = chord_at(S.BARS, b, s)
        root = 48 + (ch['root'] - 48) % 12
        acc = 1.0 if s % 8 == 0 else 0.86
        for side, det, delay in (('_l', -5.0, 0.0), ('_r', 5.0, 0.006)):
            sig = sum(sy.tone(m, gate * S.STEP, duty=d, duty_attack=None, attack=0.002, decay=decay,
                              sustain=sus, release=rel, detune=det)
                      for m, d in ((root, 0.25), (root + 7, 0.125), (root + 12, 0.25)))
            tr.add('gtr' + side, t0 + s * S.STEP + delay, sig, vel * acc)


def pad(tr, S, b, t0):
    lvl = S.BARS[b].get('pad', 0.0)
    if not lvl:
        return
    segs = S.BARS[b]['ch'] + [(16, None)]
    hold = S.BARS[b].get('hold', 1.0)
    attack = 0.01 if S.BARS[b].get('p2') == 'sting' else 0.14
    for (s, name), (e, _) in zip(segs[:-1], segs[1:]):
        ch = chord(name)
        root = 55 + (ch['root'] - 55) % 12
        for m in (root + i for i in ch['ivs']):
            for det, side in ((-7.0, '_l'), (7.0, '_r')):
                sig = sy.tone(m, (e - s) * S.STEP * hold, duty=0.5, duty_attack=None, attack=attack,
                              decay=0.8, sustain=0.8, release=0.5, detune=det)
                tr.add('pad' + side, t0 + s * S.STEP, sig, lvl)


def bass(tr, S, b, t0, nxt):
    spec = S.BARS[b]
    if spec.get('bass') is None:
        return
    next_ch = chord(S.BARS[nxt]['ch'][0][1]) if nxt is not None else None
    for s, l, deg in S.BASS[spec['bass']]:
        m = bass_pitch(deg, chord_at(S.BARS, b, s), spec['key'], next_ch)
        slide = m + 12 if spec['bass'] == 'sting' else None
        gate = l * S.STEP * (0.8 if l <= 2 else 0.92) if l < 8 else l * S.STEP   # long notes legato
        tr.add('bass', t0 + s * S.STEP, sy.tri_note(m, gate, slide_from=slide), spec.get('bass_vel', 1.0))


def drums(tr, S, b, t0, kicks):
    spec = S.BARS[b]
    if spec.get('crash'):
        off = (int(t0 * SR) * 7919) % 32767
        tr.add('crash_l', t0, sy.crash(1.0, off))
        tr.add('crash_r', t0, sy.crash(1.0, off + 16001))
    for inst, row in S.DRUMS.get(spec.get('drums'), {}).items():
        assert len(row) == 4 * spec.get('beats', 4), (spec.get('drums'), inst)
        hit = 0
        for s, c in enumerate(row):
            if c == '.':
                continue
            v, t = int(c) / 9.0, t0 + s * S.STEP
            off = (int(t * SR) * 7919) % 32767
            if inst == 'K':
                tr.add('kick', t, sy.kick(v))
                kicks.append((t, v))
            elif inst == 'S':
                tr.add('snare', t, sy.snare(v, off, **S.VOICE['snare']))
            elif inst in 'HO':
                tr.add('hat' if inst == 'H' else 'ohat', t, sy.hat(v, off, open_=inst == 'O'))
            elif inst == 'C':
                tr.add('crash_l', t, sy.crash(v, off))
                tr.add('crash_r', t, sy.crash(v, off + 16001))
            elif inst == 'T':
                tr.add('tom', t, sy.tom(v, 190.0 * 0.86 ** (hit % 4), off))
                hit += 1
            elif inst == 'X':
                tr.add('shout', t, sy.shout(v, off))
    if spec.get('riser'):
        tr.add('riser', t0, sy.riser(S.BAR, S.STEP, 777))


def sparkles(tr, S, b, t0, rng):
    count = S.BARS[b].get('sparkle', 0)
    for s in np.sort(rng.choice(np.arange(0, 16, 0.5), size=count, replace=False)) if count else ():
        rain = S.BARS[b].get('rain')
        tones = tones_in(chord(rain) if rain else chord_at(S.BARS, b, s), 86, 100)
        m = tones[rng.integers(len(tones))]
        sig = sy.tone(m, 0.9 * S.STEP, duty=0.125, duty_attack=None, attack=0.001, decay=0.09,
                      sustain=0.0, release=0.02)
        tr.add_panned('spark', t0 + s * S.STEP, sig, rng.uniform(-0.75, 0.75), rng.uniform(0.4, 0.85))


def bar_seconds(S, b):
    return S.BARS[b].get('beats', 4) * S.BEAT


def render_tracks(S, arrangement, seconds, seed=11):
    total = max(seconds, sum(bar_seconds(S, b) for b in arrangement)) + 3.0
    tr, kicks, beats = Tracks(total), [], 0
    rng = np.random.default_rng(seed)
    for i, b in enumerate(arrangement):
        nxt = arrangement[i + 1] if i + 1 < len(arrangement) else None
        t0 = beats * S.BEAT
        for voice in (lead, pulse2, pulse3, guitar, pad):
            voice(tr, S, b, t0)
        bass(tr, S, b, t0, nxt)
        drums(tr, S, b, t0, kicks)
        sparkles(tr, S, b, t0, rng)
        beats += S.BARS[b].get('beats', 4)
    return tr, kicks
