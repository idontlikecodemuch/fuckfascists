"""
score_drive.py - "drive" style for the 1.2 release cut (kinetic type): faster, four on the
floor, sixteenth hats, A-minor riffs. Same engine as score_punk.py.

150 bpm = exactly 12 video frames per beat, 48 frames per bar @ 30 fps. Bar 1 is a 3-beat
sting (36 frames) so bar b >= 2 starts at frame 36 + 48 * (b - 2) — the grid Release.tsx
uses (`b(bar, beat)`).

  bar  section (video)                         frames
   1   sting: UPDATE 1.2 / NEW FILES                0
   2-3 FILES: 761 count-up                         36
   4-7 HOUSEHOLD: Windex Clorox Hefty Great Value  132
   8-9 OWNERS: Ben & Jerry's -> Magnum            324
  10-11 SCAN: barcode, lock                        420
  12-14 FACES: sprite wall, counter-melody         516
  15   THE X: shout + crash on beat 3 (step 8)     660
  16-17 NUDGE: half-time, chords ring              708
  18   count + riser                               804
  19   drop (wide lead, sparkles)                  852
  20   end hit, tail                               900  (948 = 31.6 s)
"""
from theory import parse_line

NAME = 'fck_bed_drive'
BEAT = 12.0 / 30                 # 12 video frames per beat -> 150 bpm
STEP = BEAT / 4.0
BAR = BEAT * 4.0                 # 48 frames

VOICE = {
    'lead': dict(attack=0.001, decay=0.10, sustain=0.55, duty_attack=0.5, vib=8.0),
    'snare': dict(length=0.4, body=0.3, crunch=0.95, crunch_tau=0.16, sizzle=0.6, sizzle_tau=0.11),
}
# track: (gain, pan, sidechain depth, reverb send, drive)
MIX = {
    'lead': (0.20, 0.0, 0.08, 0.08, 0.45), 'harm': (0.085, -0.20, 0.10, 0.10, 0.45),
    'p2': (0.09, -0.30, 0.10, 0.10, 0.45), 'bass': (0.20, 0.0, 0.16, 0.0, 0),
    'kick': (0.42, 0.0, 0.0, 0.0, 0), 'snare': (0.21, 0.05, 0.0, 0.14, 0),
    'hat': (0.07, 0.25, 0.0, 0.0, 0), 'ohat': (0.06, 0.25, 0.0, 0.0, 0),
    'tom': (0.22, -0.10, 0.0, 0.10, 0), 'riser': (0.05, 0.0, 0.0, 0.0, 0),
    'shout': (0.30, 0.0, 0.0, 0.18, 0),
}
# stereo pairs name_l/name_r: (gain, sidechain depth, reverb send, drive)
STEREO = {'gtr': (0.13, 0.18, 0.06, 0.6), 'crash': (0.09, 0.0, 0.0, 0),
          'spark': (0.07, 0.20, 0.25, 0), 'wide': (0.20, 0.10, 0.15, 0.45)}
FX = dict(echo=[(0.16, -0.5), (0.08, 0.5)], p3_echo=0.0, reverb=0.12,
          low_shelf_db=-4.0, low_shelf_hz=160.0, tp=-1.5)


def _bar(ch, drums, gtr, key='C', bass='root8', **kw):
    chords = [(8 * i, c) for i, c in enumerate(ch.split('|'))]      # 'G|G7' = two half-bar chords
    return dict(ch=chords, key=key, drums=drums, bass=bass, gtr=gtr, **kw)


MUTE, OPEN, FULL = ('mute8', 0.85), ('open8', 0.85), ('open8', 1.0)
BARS = {
    1: _bar('Am', 'sting', ('sting', 1.0), bass='sting', beats=3, crash=True),
    2: _bar('Am', 'drive', MUTE, bass='drive16', crash=True), 3: _bar('F', 'drivefill', MUTE, bass='drive16'),
    4: _bar('C', 'drive', OPEN, bass='drive16', crash=True), 5: _bar('G', 'drive', OPEN, bass='drive16'),
    6: _bar('Am', 'drive', OPEN, bass='drive16'), 7: _bar('F', 'drivefill', OPEN, bass='drive16'),
    8: _bar('Dm', 'driveO', OPEN, bass='drive16', crash=True), 9: _bar('Em', 'turn', OPEN, bass='drive16'),
    10: _bar('F', 'driveO', OPEN, bass='drive16', crash=True), 11: _bar('G', 'turn', OPEN, bass='drive16'),
    12: _bar('Am', 'drive', FULL, bass='drive16', p2='counter', crash=True),
    13: _bar('C', 'drive', FULL, bass='drive16', p2='counter'),
    14: _bar('F|G', 'drivefill', FULL, bass='drive16', p2='counter'),
    15: _bar('Am', 'xbar', ('count', 1.0), bass='count', p2='harm', crash=True),
    16: _bar('F', 'half', ('whole', 0.7), bass='half', p2='harm', crash=True),
    17: _bar('G', 'half2', ('whole', 0.7), bass='half', p2='harm'),
    18: _bar('G|G7', 'count', ('count', 1.0), bass='count', p2='harm', riser=True),
    19: _bar('C', 'drop', FULL, bass='drive16', p2='harm', wide=True, sparkle=12, rain='Cmaj9', crash=True),
    20: _bar('C', 'end1', ('hit', 1.0), bass='hit', p2='harm', crash=True),
}

LEAD = {
    1: 'A5:0.5 E6:7.5',
    2: 'A5:2 C6:2 E6:4 D6:2 C6:2 A5:4', 3: 'F5:2 A5:2 C6:4 D6:2 C6:2 A5:4',
    4: 'E5:2 G5:2 C6:4 B5:2 G5:2 E5:4', 5: 'D5:2 G5:2 B5:4 D6:2 B5:2 G5:4',
    6: 'A5:2 C6:2 E6:4 D6:2 C6:2 A5:4', 7: 'F5:2 A5:2 C6:4 A5:2 C6:2 D6:4',
    8: 'D5:2 F5:2 A5:4 D6:2 A5:2 F5:4', 9: 'E5:2 G5:2 B5:4 E6:2 B5:2 G5:4',
    10: 'F5:2 A5:2 C6:2 F6:2 E6:4 C6:4', 11: 'G5:2 B5:2 D6:2 G6:2 F6:4 D6:4',
    12: 'A5:3 C6:3 E6:6 D6:2 C6:2', 13: 'G5:3 C6:3 E6:6 G6:2 E6:2', 14: 'F5:4 A5:4 G5:4 B5:4',
    15: 'A5:4 r:4 E6:8',
    16: 'C6:16', 17: 'B5:12 D6:4',
    18: 'D6:8 E6:8', 19: 'G6:10 E6:2 C6:4', 20: 'C6:16',
}
COUNTER = {
    12: 'E5:8 D5:4 C5:4', 13: 'E5:2 F5:2 G5:12', 14: 'A5:8 G5:4 F5:4',
}
PATTERNS = {}

BASS = {
    'sting': [(0, 8, 'R-12')],
    'root8': [(i * 2, 2, 'R') for i in range(8)],
    'drive16': [(i, 1, 'R') for i in range(16)],
    'half': [(0, 8, 'R'), (8, 8, 'R')],
    'count': [(0, 2, 'R'), (4, 2, 'R'), (8, 2, 'R'), (12, 2, 'R')],
    'hit': [(0, 30, 'R-12')],
}

DRUMS = {
    'sting':     dict(K='9...........', C='9...........'),
    'drive':     dict(K='9...9...9...9...', S='....9.......9...', H='7464746474647464'),
    'drivefill': dict(K='9...9...9...9...', S='....9.......9.89', H='7464746474647...', T='.............9.8'),
    'driveO':    dict(K='9...9...9...9...', S='....9.......9...', O='7.7.7.7.7.7.7.7.'),
    'turn':      dict(K='9...9...9.9.9.9.', S='....9.......9...', H='7464746474647464'),
    'xbar':      dict(K='9...9...9...9...', S='....9.......9...', X='........9.......', C='........9.......', H='74647464........'),
    'half':      dict(K='9.........7.....', S='........9.......', H='5...5...5...5...'),
    'half2':     dict(K='9.........7.....', S='........9.....78', H='5...5...5...5...'),
    'count':     dict(K='9...9...9...9...', X='6...7...8...9...', S='............6789'),
    'drop':      dict(K='9.....9.9.....9.', S='....9.......9...', O='7.7.7.7.7.7.7.7.'),
    'end1':      dict(K='9...............', S='9...............'),
}

# Arrangements: (bar list, output seconds, fade-out seconds)
ARRANGEMENTS = {
    '32s': (list(range(1, 21)), 31.6, 1.2),
}
LOOP_A = list(range(4, 8))

LEAD_NOTES = {b: parse_line(s) for b, s in LEAD.items()}
COUNTER_NOTES = {b: parse_line(s) for b, s in COUNTER.items()}
