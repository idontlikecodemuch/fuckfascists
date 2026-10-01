"""
score_punk.py - "punk" style: same piece as score.py, rebuilt for a band feel.

138.46 bpm = exactly 13 video frames per beat, 52 frames per bar @ 30 fps. The sting
is a 3-beat pickup bar so the grid lands A, B and the drop on the video beats.
Bar b >= 2 starts on beat 3 + 4 * (b - 2), i.e. frame 13 * that.

  bar  section                                start s  frame
   1   sting (3 beats): C5 hit + crash          0.000      0
   2-6 intro: muted C F Am G chugs, 6 = fill    1.300     39
   7   A1  C G Am F        palm-muted 8ths      9.967    299
  11   A1' Am Em F G       open 8ths           16.900    507
  15   A2  C G Am F        + counter-melody    23.833    715
  19   turnaround Dm | G   fills + scale run   30.767    923
  21   B   F G Em Am       open-hat 8ths       34.233   1027
  25   breakdown F | G     half-time, chords ring  41.167  1235
  27   count Bb | C        4 shout+kick hits    44.633   1339
  28   drop D A Bm         key lift, money rain 46.367   1391
  31   share G A D D       tonic lands bar 33 (55.033 s, frame 1651)  51.567  1547
  35   tail: D hit, 36 tom roll, 37 final hit (61.967 s)  58.500  1755
Crash on every section start (bars 1 7 11 15 21 25 28 31 35 37). Loop-safe: bars 7-14.
"""
from theory import parse_line

NAME = 'fck_bed_punk'
BEAT = 13.0 / 30                 # 13 video frames per beat -> 138.46 bpm
STEP = BEAT / 4.0
BAR = BEAT * 4.0                 # 52 frames

VOICE = {
    'lead': dict(attack=0.001, decay=0.12, sustain=0.62, duty_attack=0.5, vib=10.0),
    'snare': dict(length=0.5, body=0.3, crunch=0.95, crunch_tau=0.19, sizzle=0.6, sizzle_tau=0.13),
}
# track: (gain, pan, sidechain depth, reverb send, drive)
MIX = {
    'lead': (0.20, 0.0, 0.05, 0.08, 0.45), 'harm': (0.085, -0.20, 0.10, 0.10, 0.45),
    'p2': (0.08, -0.30, 0.10, 0.10, 0.45), 'bass': (0.18, 0.0, 0.12, 0.0, 0),
    'kick': (0.40, 0.0, 0.0, 0.0, 0), 'snare': (0.21, 0.05, 0.0, 0.14, 0),
    'hat': (0.06, 0.25, 0.0, 0.0, 0), 'ohat': (0.06, 0.25, 0.0, 0.0, 0),
    'tom': (0.22, -0.10, 0.0, 0.10, 0), 'riser': (0.05, 0.0, 0.0, 0.0, 0),
    'shout': (0.28, 0.0, 0.0, 0.18, 0),
}
# stereo pairs name_l/name_r: (gain, sidechain depth, reverb send, drive)
STEREO = {'gtr': (0.13, 0.15, 0.06, 0.6), 'crash': (0.09, 0.0, 0.0, 0),
          'spark': (0.07, 0.20, 0.25, 0), 'wide': (0.20, 0.10, 0.15, 0.45)}
FX = dict(echo=[(0.16, -0.5), (0.08, 0.5)], p3_echo=0.0, reverb=0.14,
          low_shelf_db=-4.5, low_shelf_hz=160.0, tp=-1.5)


def _bar(ch, drums, gtr, key='C', bass='root8', **kw):
    chords = [(8 * i, c) for i, c in enumerate(ch.split('|'))]      # 'G|G7' = two half-bar chords
    return dict(ch=chords, key=key, drums=drums, bass=bass, gtr=gtr, **kw)


OPEN, B_GTR, FULL = ('open8', 0.85), ('open8', 0.9), ('open8', 1.0)
BARS = {
    1: _bar('C', 'sting', ('sting', 1.0), bass='sting', beats=3, crash=True),
    2: _bar('C', 'intro1', ('mute8', 0.6), bass_vel=0.6), 3: _bar('F', 'intro1', ('mute8', 0.6), bass_vel=0.6),
    4: _bar('Am', 'intro2', ('mute8', 0.7), bass_vel=0.7), 5: _bar('G', 'intro2', ('mute8', 0.75), bass_vel=0.7),
    6: _bar('G', 'fill', ('open8', 0.8), bass_vel=0.8),
    7: _bar('C', 'A', ('mute8', 0.85), crash=True), 8: _bar('G', 'A', ('mute8', 0.85)),
    9: _bar('Am', 'A', ('mute8', 0.85)), 10: _bar('F', 'Av', ('mute8', 0.85)),
    11: _bar('Am', 'A', ('open8', 0.8), crash=True), 12: _bar('Em', 'A', ('open8', 0.8)),
    13: _bar('F', 'A', ('open8', 0.8)), 14: _bar('G', 'Afill', ('open8', 0.8)),
    15: _bar('C', 'A2', OPEN, p2='counter', crash=True), 16: _bar('G', 'A2', OPEN, p2='counter'),
    17: _bar('Am', 'A2', OPEN, p2='counter'), 18: _bar('F', 'A2v', OPEN, p2='counter'),
    19: _bar('Dm', 'turn1', OPEN, p2='counter'), 20: _bar('G|G7', 'turn2', ('open8', 0.9), p2='counter'),
    21: _bar('F', 'B', B_GTR, p2='harm', crash=True), 22: _bar('G', 'B', B_GTR, p2='harm'),
    23: _bar('Em', 'B', B_GTR, p2='harm'), 24: _bar('Am', 'Bv', B_GTR, p2='harm'),
    25: _bar('F', 'half', ('whole', 0.7), bass='half', p2='harm', crash=True),
    26: _bar('G', 'half2', ('whole', 0.7), bass='half', p2='harm'),
    27: _bar('Bb|C', 'count', ('count', 1.0), key='D', bass='count', p2='harm', riser=True),
    28: _bar('D', 'drop', FULL, key='D', p2='harm', wide=True, sparkle=14, rain='Dmaj9', crash=True),
    29: _bar('A', 'drop', FULL, key='D', p2='harm', wide=True, sparkle=9, rain='Dmaj9'),
    30: _bar('Bm', 'dropv', FULL, key='D', p2='harm', wide=True, sparkle=6, rain='Dmaj9'),
    31: _bar('G', 'share', ('open8', 0.9), key='D', p2='harm', crash=True),
    32: _bar('A', 'share', ('open8', 0.9), key='D', p2='harm'),
    33: _bar('D', 'share', ('open8', 0.9), key='D', p2='harm'),
    34: _bar('D', 'sharefill', ('open8', 0.95), key='D', p2='harm'),
    35: _bar('D', 'end1', ('hit', 1.0), key='D', bass='hit', p2='harm', crash=True),
    36: _bar('D', 'roll', None, key='D', bass=None),
    37: _bar('D', 'end2', ('hit', 1.0), key='D', bass='hit', p2='harm', crash=True),
}

LEAD = {
    1: 'G5:0.5 C6:7.5', 6: 'r:12 G4:2 C5:2',
    7: 'E5:3 G5:3 C6:6 B5:2 A5:2', 8: 'G5:6 D5:2 r:4 B4:2 D5:2',
    9: 'E5:3 A5:3 C6:6 D6:2 C6:2', 10: 'A5:4 G5:2 F5:2 G5:8',
    11: 'C6:6 B5:2 A5:4 E5:4', 12: 'B5:6 A5:2 G5:4 E5:4',
    13: 'A5:3 C6:3 E6:6 D6:2 C6:2', 14: 'D6:6 C6:2 B5:4 G5:2 D5:2',
    15: 'E5:3 G5:3 C6:4 D6:2 E6:4', 16: 'D6:6 B5:2 G5:4 A5:2 B5:2',
    17: 'C6:3 D6:3 E6:6 D6:2 C6:2', 18: 'C6:4 A5:2 G5:2 A5:8',
    19: 'D6:6 C6:2 A5:4 F5:4', 20: 'r:8 D5:2 E5:2 F5:2 G5:2',
    21: 'A5:2 C6:2 E6:10 D6:2', 22: 'D6:6 C6:2 B5:4 G5:4',
    23: 'G5:2 B5:2 D6:10 E6:2', 24: 'E6:6 D6:2 C6:4 A5:2 B5:2',
    25: 'C6:12 A5:4', 26: 'B5:12 D6:4', 27: 'D6:8 E6:8',
    28: 'F#6:10 E6:2 D6:4', 29: 'E6:6 C#6:2 A5:4 C#6:2 E6:2', 30: 'F#6:6 E6:2 D6:4 B5:2 C#6:2',
    31: 'D6:6 B5:2 G5:8', 32: 'E5:2 F#5:2 A5:4 B5:4 C#6:4', 33: 'D6:16',
    34: 'r:8 F#5:2 A5:2 D6:2 E6:2', 35: 'F#6:16', 37: 'D6:16',
}
COUNTER = {
    15: 'C5:8 B4:4 G4:4', 16: 'B4:2 C5:2 D5:12', 17: 'E5:8 D5:2 C5:2 B4:2 A4:2',
    18: 'A4:6 C5:2 E5:4 D5:4', 19: 'A4:8 F4:4 A4:4', 20: 'D5:2 C5:2 B4:2 A4:2 B4:2 C5:2 D5:2 E5:2',
}
PATTERNS = {}

BASS = {
    'sting': [(0, 8, 'R-12')],
    'root8': [(i * 2, 2, 'R') for i in range(8)],
    'half': [(0, 8, 'R'), (8, 8, 'R')],
    'count': [(0, 2, 'R'), (4, 2, 'R'), (8, 2, 'R'), (12, 2, 'R')],
    'hit': [(0, 30, 'R-12')],
}

DRUMS = {
    'sting':  dict(K='9...........'),
    'intro1': dict(H='3.4.3.4.3.4.3.4.'),
    'intro2': dict(K='7.......6.......', S='....4.......4...', H='4.5.4.5.4.5.4.5.'),
    'fill':   dict(K='9.....7.........', S='........56677889', H='5.5.5.5.........'),
    'A':      dict(K='9.......9.7.....', S='....9.......9...', H='6.6.6.6.6.6.6.6.'),
    'Av':     dict(K='9.......9.7.....', S='....9.......9.89', H='6.6.6.6.6.6.6...'),
    'Afill':  dict(K='9.......9.......', S='....9...........', T='..........9.8.76'),
    'A2':     dict(K='9.....9.9.......', S='....9.......9...', H='7.5.7.5.7.5.7.5.'),
    'A2v':    dict(K='9.....9.9.......', S='....9.......9.99', H='7.5.7.5.7.5.7...'),
    'turn1':  dict(K='9.......9.9.9.9.', S='....9.......9...', H='6.6.6.6.6.6.6.6.'),
    'turn2':  dict(K='9.....7.........', S='....9..........9', T='........9.8.7.6.'),
    'B':      dict(K='9.......9.9.....', S='....9.......9...', O='7.7.7.7.7.7.7.7.'),
    'Bv':     dict(K='9.......9.9.....', S='....9.......9.99', O='7.7.7.7.7.7.7...'),
    'half':   dict(K='9.........7.....', S='........9.......', H='5...5...5...5...'),
    'half2':  dict(K='9.........7.....', S='........9.....78', H='5...5...5...5...'),
    'count':  dict(K='9...9...9...9...', X='6...7...8...9...', S='............6789'),
    'drop':   dict(K='9.....9.9.....9.', S='....9.......9...', O='7.7.7.7.7.7.7.7.'),
    'dropv':  dict(K='9.....9.9.....9.', S='....9.......9.99', O='7.7.7.7.7.7.7...'),
    'share':  dict(K='9.......9.9.....', S='....9.......9...', H='6.6.6.6.6.6.6.6.'),
    'sharefill': dict(K='9.......9.......', S='....9.......9999', H='6.6.6.6.6.6.' + '....'),
    'end1':   dict(K='9...............'),
    'roll':   dict(T='1122334455667789'),
    'end2':   dict(K='9...............', S='9...............'),
}

# Arrangements: (bar list, output seconds, fade-out seconds)
ARRANGEMENTS = {
    '64s': (list(range(1, 38)), 64.0, 1.5),
    '30s': ([1, 4, 6, 7, 8, 9, 10, 21, 22, 25, 26, 27, 28, 29, 30, 32, 33, 37], 30.0, 1.2),
    '15s': ([1, 7, 8, 21, 27, 28, 32, 33, 37], 15.0, 1.2),
}
LOOP_A = list(range(7, 15))

LEAD_NOTES = {b: parse_line(s) for b, s in LEAD.items()}
COUNTER_NOTES = {b: parse_line(s) for b, s in COUNTER.items()}
