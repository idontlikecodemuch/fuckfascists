"""Free-until-Election-Day 15 s promo bed: the hardcore engine (score_hardcore.py), nine bars.
Sting, hook, the FREE hit, tap / scan / track, the money bar, a riser and the end hit.
"""
from theory import parse_line

NAME = 'fck_bed_free'
BEAT = 12.0 / 30                 # 12 video frames per beat -> 150 bpm
STEP = BEAT / 4.0
BAR = BEAT * 4.0                 # 48 frames

VOICE = {
    'lead': dict(attack=0.001, decay=0.06, sustain=0.45, duty_attack=0.5, vib=16.0),
    'snare': dict(length=0.32, body=0.22, crunch=1.0, crunch_tau=0.13, sizzle=0.9, sizzle_tau=0.09),
}
# track: (gain, pan, sidechain depth, reverb send, drive)
MIX = {
    'lead': (0.13, 0.0, 0.08, 0.05, 0.85), 'harm': (0.07, -0.20, 0.10, 0.06, 0.8),
    'p2': (0.07, -0.30, 0.10, 0.06, 0.7), 'bass': (0.25, 0.0, 0.08, 0.0, 0.6),
    'kick': (0.46, 0.0, 0.0, 0.0, 0.1), 'snare': (0.30, 0.05, 0.0, 0.08, 0.4),
    'hat': (0.085, 0.25, 0.0, 0.0, 0), 'ohat': (0.09, 0.25, 0.0, 0.0, 0),
    'tom': (0.26, -0.10, 0.0, 0.06, 0.1), 'riser': (0.07, 0.0, 0.0, 0.0, 0),
    'shout': (0.40, 0.0, 0.0, 0.14, 0.35),
}
# stereo pairs name_l/name_r: (gain, sidechain depth, reverb send, drive)
STEREO = {'gtr': (0.22, 0.10, 0.03, 1.0), 'crash': (0.11, 0.0, 0.0, 0),
          'spark': (0.0, 0.20, 0.25, 0), 'wide': (0.20, 0.10, 0.08, 0.85)}
FX = dict(echo=[(0.08, -0.5), (0.04, 0.5)], p3_echo=0.0, reverb=0.06,
          low_shelf_db=-2.0, low_shelf_hz=140.0, tp=-1.0)


def _bar(ch, drums, gtr, key='C', bass='root8', **kw):
    chords = [(8 * i, c) for i, c in enumerate(ch.split('|'))]
    return dict(ch=chords, key=key, drums=drums, bass=bass, gtr=gtr, **kw)


MUTE, OPEN = ('mute8', 1.0), ('open8', 1.0)
# (chords, drums, guitar, bass, lead line, extra) in order; bar numbers come from the position
SEQ = [
    ('Am', 'sting', ('sting', 1.0), 'sting', 'A5:0.5 A6:7.5', dict(beats=3, crash=True)),
    ('Am', 'dbeatX', OPEN, 'root16', 'A6:2 r:2 A6:2 r:2 G6:2 r:2 A6:2 r:2', dict(crash=True)),          # hook: logo + line
    ('Am', 'dbeatX', OPEN, 'root16', 'A6:4 r:4 A6:2 r:2 G6:2 r:2', dict(wide=True, crash=True)),        # FREE.
    ('Am', 'skankX', MUTE, 'root16', 'A5:2 r:2 A5:2 r:2 A5:2 r:2 G5:2 r:2', dict(crash=True)),           # tap
    ('G', 'skankfill', MUTE, 'root16', 'G5:2 r:2 G5:2 r:2 G5:2 r:2 A5:2 r:2', {}),                       # scan
    ('F', 'dbeatX', OPEN, 'root16', 'F6:2 r:6 F6:2 r:6', dict(crash=True)),                              # track
    ('Am', 'blast', OPEN, 'root16', 'A6:4 G6:4 E6:4 A6:4', dict(wide=True, crash=True)),                 # see where the money goes
    ('G|G7', 'count', ('count', 1.0), 'count', 'D6:8 E6:8', dict(riser=True)),                           # free through Nov 3 (riser)
    ('Am', 'end1', ('hit', 1.0), 'hit', 'A6:16', dict(crash=True)),                                      # tagline hit
]
BARS = {i + 1: _bar(ch, dr, gtr, bass=bass, **kw) for i, (ch, dr, gtr, bass, _, kw) in enumerate(SEQ)}
LEAD = {i + 1: line for i, (_, _, _, _, line, _) in enumerate(SEQ)}
COUNTER = {}
PATTERNS = {}


BASS = {
    'sting': [(0, 8, 'R-12')],
    'root8': [(i * 2, 2, 'R') for i in range(8)],
    'root16': [(i, 1, 'R') for i in range(16)],
    'half': [(0, 8, 'R'), (8, 8, 'R')],
    'count': [(0, 2, 'R'), (4, 2, 'R'), (8, 2, 'R'), (12, 2, 'R')],
    'hit': [(0, 30, 'R-12')],
}

DRUMS = {
    'sting':     dict(K='9...........', C='9...........', X='9...........'),
    # d-beat: kick 1 and the and-of-2 / 3 and the and-of-4; snare on 2 and 4 plus the pushes
    'dbeat':     dict(K='9...9.9...9.9...', S='..9...9...9...9.', H='8686868686868686'),
    'dbeatX':    dict(K='9...9.9...9.9...', S='..9...9...9...9.', H='8686868686868686', X='9...............'),
    # skank: kick every 8th, snare on the off 8ths
    'skankX':    dict(K='9.9.9.9.9.9.9.9.', S='..9...9...9...9.', H='8686868686868686', X='9.......9.......'),
    'skankfill': dict(K='9.9.9.9.9.9.9...', S='..9...9...9.6789', H='8686868686868...', T='............9.8.'),
    'xbar':      dict(K='9...9...9...9...', S='....9.......9...', X='9.......9.......', C='........9.......', H='86868686........'),
    'chug':      dict(K='9.....9...9.....', S='....9.......9...', O='7...7...7...7...', X='9...............'),
    'chug2':     dict(K='9.....9...9.....', S='....9.......9.78', O='7...7...7...7...'),
    'count':     dict(K='9...9...9...9...', X='6...7...8...9...', S='............6789'),
    'blast':     dict(K='9.9.9.9.9.9.9.9.', S='.9.9.9.9.9.9.9.9', H='8686868686868686'),
    'end1':      dict(K='9...............', S='9...............', X='9...............', C='9...............'),
}

# Arrangements: (bar list, output seconds, fade-out seconds). 3-beat sting + 8 bars = 420 frames = 14.0 s, plus the hit's ring.
ARRANGEMENTS = {
    '15s': (list(range(1, len(SEQ) + 1)), 14.6, 1.0),
}
LOOP_A = list(range(4, 8))

LEAD_NOTES = {b: parse_line(s) for b, s in LEAD.items()}
COUNTER_NOTES = {b: parse_line(s) for b, s in COUNTER.items()}
