"""
score_hardcore.py - "hardcore" style for the 1.2 release cut (creator, Oct 15: "a little more
hardcore, more intense"). Same grid as score_drive.py (150 bpm, 12 frames a beat, 48 a bar,
3-beat sting) so Release.tsx's b(bar, beat) still lands; the sound is the change: skank-beat
drums, driven palm-muted power chords, distorted bass, gang shouts on section starts, a
half-time chug under the nudges, a blast beat for the drop. Lead is sparse octave stabs.

  bar  section (video)                         frames
   1   sting + shout: UPDATE 1.2 / NEW FILES        0
   2-3 FILES  (Am G, muted chug)                   36
   4-7 HOUSEHOLD (Am G F G, open chords, shout)   132
   8-9 OWNERS (Dm Em)                             324
  10-11 SCAN (F G, fill into the faces)           420
  12-14 FACES (Am C F|G, wide lead, shout)        516
  15   THE X: shout + crash on beat 3 (step 8)    660
  16-17 NUDGE: half-time chug                     708
  18   count + riser                              804
  19   drop: blast beat, wide lead                852
  20   end hit, tail                              900  (948 = 31.6 s)
"""
from theory import parse_line

NAME = 'fck_bed_hardcore'
BEAT = 12.0 / 30                 # 12 video frames per beat -> 150 bpm
STEP = BEAT / 4.0
BAR = BEAT * 4.0                 # 48 frames

VOICE = {
    'lead': dict(attack=0.001, decay=0.08, sustain=0.5, duty_attack=0.5, vib=14.0),
    'snare': dict(length=0.34, body=0.25, crunch=1.0, crunch_tau=0.14, sizzle=0.85, sizzle_tau=0.10),
}
# track: (gain, pan, sidechain depth, reverb send, drive)
MIX = {
    'lead': (0.17, 0.0, 0.08, 0.06, 0.75), 'harm': (0.08, -0.20, 0.10, 0.08, 0.7),
    'p2': (0.08, -0.30, 0.10, 0.08, 0.6), 'bass': (0.23, 0.0, 0.10, 0.0, 0.4),
    'kick': (0.44, 0.0, 0.0, 0.0, 0), 'snare': (0.25, 0.05, 0.0, 0.10, 0.2),
    'hat': (0.075, 0.25, 0.0, 0.0, 0), 'ohat': (0.08, 0.25, 0.0, 0.0, 0),
    'tom': (0.24, -0.10, 0.0, 0.08, 0), 'riser': (0.06, 0.0, 0.0, 0.0, 0),
    'shout': (0.36, 0.0, 0.0, 0.16, 0.2),
}
# stereo pairs name_l/name_r: (gain, sidechain depth, reverb send, drive)
STEREO = {'gtr': (0.19, 0.12, 0.04, 0.95), 'crash': (0.10, 0.0, 0.0, 0),
          'spark': (0.0, 0.20, 0.25, 0), 'wide': (0.22, 0.10, 0.10, 0.7)}
FX = dict(echo=[(0.10, -0.5), (0.05, 0.5)], p3_echo=0.0, reverb=0.09,
          low_shelf_db=-3.0, low_shelf_hz=150.0, tp=-1.0)


def _bar(ch, drums, gtr, key='C', bass='root8', **kw):
    chords = [(8 * i, c) for i, c in enumerate(ch.split('|'))]
    return dict(ch=chords, key=key, drums=drums, bass=bass, gtr=gtr, **kw)


MUTE, OPEN, CHUG = ('mute8', 1.0), ('open8', 1.0), ('mute8', 1.0)
BARS = {
    1: _bar('Am', 'sting', ('sting', 1.0), bass='sting', beats=3, crash=True),
    2: _bar('Am', 'skankX', MUTE, bass='root8', crash=True), 3: _bar('G', 'skank', MUTE, bass='root8'),
    4: _bar('Am', 'skankX', OPEN, bass='root8', crash=True), 5: _bar('G', 'skank', OPEN, bass='root8'),
    6: _bar('F', 'skank', OPEN, bass='root8'), 7: _bar('G', 'skankfill', OPEN, bass='root8'),
    8: _bar('Dm', 'skankX', OPEN, bass='root8', crash=True), 9: _bar('Em', 'skank', OPEN, bass='root8'),
    10: _bar('F', 'skank', OPEN, bass='root8', crash=True), 11: _bar('G', 'skankfill', OPEN, bass='root8'),
    12: _bar('Am', 'skankX', OPEN, bass='root8', wide=True, crash=True),
    13: _bar('C', 'skank', OPEN, bass='root8', wide=True),
    14: _bar('F|G', 'skankfill', OPEN, bass='root8', wide=True),
    15: _bar('Am', 'xbar', ('count', 1.0), bass='count', crash=True),
    16: _bar('F', 'chug', CHUG, bass='half', crash=True),
    17: _bar('G', 'chug2', CHUG, bass='half'),
    18: _bar('G|G7', 'count', ('count', 1.0), bass='count', riser=True),
    19: _bar('Am', 'blast', OPEN, bass='root8', wide=True, crash=True),
    20: _bar('Am', 'end1', ('hit', 1.0), bass='hit', crash=True),
}

# sparse octave stabs; the guitars carry the bars
LEAD = {
    1: 'A5:0.5 A6:7.5',
    2: 'A5:2 r:2 A5:2 r:2 A5:2 r:2 G5:2 r:2', 3: 'G5:2 r:2 G5:2 r:2 G5:2 r:2 A5:2 r:2',
    4: 'A6:2 r:6 A6:2 r:6', 5: 'G6:2 r:6 G6:2 r:6', 6: 'F6:2 r:6 F6:2 r:6', 7: 'G6:2 r:2 G6:2 r:2 A6:2 r:2 B6:2 r:2',
    8: 'D6:2 r:6 D6:2 r:6', 9: 'E6:2 r:6 E6:2 r:6',
    10: 'F6:2 r:2 F6:2 r:2 F6:2 r:2 F6:2 r:2', 11: 'G6:2 r:2 G6:2 r:2 A6:2 r:2 B6:2 r:2',
    12: 'A5:3 C6:3 E6:6 D6:2 C6:2', 13: 'G5:3 C6:3 E6:6 G6:2 E6:2', 14: 'F5:4 A5:4 G5:4 B5:4',
    15: 'A5:4 r:4 A6:8',
    16: 'r:16', 17: 'r:16',
    18: 'D6:8 E6:8', 19: 'A6:4 G6:4 E6:4 A6:4', 20: 'A6:16',
}
COUNTER = {}
PATTERNS = {}

BASS = {
    'sting': [(0, 8, 'R-12')],
    'root8': [(i * 2, 2, 'R') for i in range(8)],
    'half': [(0, 8, 'R'), (8, 8, 'R')],
    'count': [(0, 2, 'R'), (4, 2, 'R'), (8, 2, 'R'), (12, 2, 'R')],
    'hit': [(0, 30, 'R-12')],
}

DRUMS = {
    'sting':     dict(K='9...........', C='9...........', X='9...........'),
    # skank beat: kick every 8th, snare on the off 8ths, hats riding
    'skank':     dict(K='9.9.9.9.9.9.9.9.', S='..9...9...9...9.', H='8.8.8.8.8.8.8.8.'),
    'skankX':    dict(K='9.9.9.9.9.9.9.9.', S='..9...9...9...9.', H='8.8.8.8.8.8.8.8.', X='9...............'),
    'skankfill': dict(K='9.9.9.9.9.9.9...', S='..9...9...9.6789', H='8.8.8.8.8.8.....', T='............9.8.'),
    'xbar':      dict(K='9...9...9...9...', S='....9.......9...', X='9.......9.......', C='........9.......', H='8.8.8.8.........'),
    'chug':      dict(K='9.....9...9.....', S='....9.......9...', O='7...7...7...7...'),
    'chug2':     dict(K='9.....9...9.....', S='....9.......9.78', O='7...7...7...7...'),
    'count':     dict(K='9...9...9...9...', X='6...7...8...9...', S='............6789'),
    'blast':     dict(K='9.9.9.9.9.9.9.9.', S='.9.9.9.9.9.9.9.9', H='8.8.8.8.8.8.8.8.'),
    'end1':      dict(K='9...............', S='9...............', X='9...............'),
}

# Arrangements: (bar list, output seconds, fade-out seconds)
ARRANGEMENTS = {
    '32s': (list(range(1, 21)), 31.6, 1.2),
}
LOOP_A = list(range(4, 8))

LEAD_NOTES = {b: parse_line(s) for b, s in LEAD.items()}
COUNTER_NOTES = {b: parse_line(s) for b, s in COUNTER.items()}
