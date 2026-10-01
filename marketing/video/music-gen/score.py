"""
score.py - "hopeful" style: the composition plus its production settings.

Home key C major, lifting to D major for the drop (via Bb - C - D, i.e. the
bVI - bVII - I "victory" cadence of the new key). One bar = 16 sixteenths.

Bar map (bar n starts at (n - 1) * 1.9333 s = (n - 1) * 58 video frames @ 30 fps):
   1       sting      C, one accent hit
   2-5     intro      Cmaj7 Fmaj7 Am7 Gsus4-G (no lead: room for Clark)
   6-9     A1         C G Am F           (I-V-vi-IV)         8th arps
  10-13    A1'        Am Em Fmaj7 G      (vi-iii-IV-V)       offbeat skank stabs
  14-17    A2         C G/B Am F         second pass + counter-melody
  18       turnaround G-G7 fill + scale run
  19-23    B lift     Fmaj7 G Em7 Am | F-G   (IV-V-iii-vi "royal road"), lead in 3rds
  24       riser      Bb-C (noise sweep, snare roll, rising arp)
  25-27    drop       D A Bm   (new key, fast-arp chords, crash, sparkles)
  28-30    share      G A D    (rising final phrase lands on the tonic in bar 30)
  31-33    tail       D  G/D  D  (plagal shimmer, fade)
Loop-safe blocks: 6-13 (8 bars, ends on V -> I) and 19-22.
"""
from theory import arp, parse_line

NAME = 'fck_bed_hopeful'
BEAT = 14.5 / 30                 # 14.5 video frames per beat -> 124.14 bpm
STEP = BEAT / 4.0
BAR = BEAT * 4.0                 # 58 frames

VOICE = {
    'lead': dict(attack=0.004, decay=0.28, sustain=0.72, duty_attack=0.125, vib=16.0),
    'snare': dict(),             # synth.snare defaults
}
# track: (gain, pan, sidechain depth, reverb send, drive)
MIX = {
    'lead': (0.20, 0.0, 0.10, 0.18, 0), 'harm': (0.10, -0.18, 0.20, 0.25, 0),
    'p2': (0.085, -0.30, 0.30, 0.20, 0), 'p3': (0.055, 0.32, 0.30, 0.30, 0),
    'bass': (0.24, 0.0, 0.20, 0.0, 0), 'kick': (0.44, 0.0, 0.0, 0.0, 0),
    'snare': (0.17, 0.05, 0.0, 0.12, 0), 'hat': (0.05, 0.25, 0.0, 0.0, 0),
    'ohat': (0.055, 0.25, 0.0, 0.0, 0), 'tom': (0.20, -0.10, 0.0, 0.10, 0),
    'riser': (0.06, 0.0, 0.0, 0.0, 0),
}
# stereo pairs name_l/name_r: (gain, sidechain depth, reverb send, drive)
STEREO = {'pad': (0.06, 0.35, 0.35, 0), 'crash': (0.085, 0.0, 0.0, 0), 'spark': (0.07, 0.20, 0.25, 0),
          'wide': (0.20, 0.10, 0.20, 0)}
FX = dict(echo=[(0.34, -0.55), (0.22, 0.55), (0.14, -0.4), (0.08, 0.4)], p3_echo=0.25,
          reverb=0.22, low_shelf_db=0.0, tp=-1.0)

WARM = {'duty': 0.5, 'tau': 0.2}
SPARK = {'duty': 0.125, 'tau': 0.06}

BARS = {
    1:  dict(ch=[(0, 'C')], key='C', drums='sting', bass='sting', p2='sting', p3='sting', pad=0.55),
    2:  dict(bass_vel=0.7, ch=[(0, 'Cmaj7')], key='C', drums='intro1', bass='intro', p2=arp('arp8', 'up', 72, 88, **WARM), pad=0.4),
    3:  dict(bass_vel=0.7, ch=[(0, 'Fmaj7')], key='C', drums='intro1', bass='intro', p2=arp('arp8', 'roll', 72, 88, **WARM), pad=0.4),
    4:  dict(bass_vel=0.7, ch=[(0, 'Am7')], key='C', drums='intro2', bass='intro', p2=arp('arp8', 'wave', 72, 88, **WARM), pad=0.4),
    5:  dict(bass_vel=0.7, ch=[(0, 'Gsus4'), (8, 'G')], key='C', drums='intro3', bass='intro_last', p2=arp('arp8', 'skip', 72, 88, **WARM), pad=0.4),
    6:  dict(ch=[(0, 'C')], key='C', drums='A1', bass='A1', p2=arp('arp8', 'up', 60, 76, vel=1.4)),
    7:  dict(ch=[(0, 'G')], key='C', drums='A1', bass='A1', p2=arp('arp8', 'roll', 60, 76, vel=1.4)),
    8:  dict(ch=[(0, 'Am')], key='C', drums='A1', bass='A1', p2=arp('arp8', 'wave', 60, 76, vel=1.4)),
    9:  dict(ch=[(0, 'F')], key='C', drums='A1v', bass='A1', p2=arp('arp8', 'skip', 60, 76, vel=1.4)),
    10: dict(ch=[(0, 'Am')], key='C', drums='A1b', bass='A1b', p2='skank'),
    11: dict(ch=[(0, 'Em')], key='C', drums='A1b', bass='A1b', p2='skank'),
    12: dict(ch=[(0, 'Fmaj7')], key='C', drums='A1b', bass='A1b', p2='skank'),
    13: dict(ch=[(0, 'G')], key='C', drums='A1bf', bass='A1b', p2='skank'),
    14: dict(ch=[(0, 'C')], key='C', drums='A2', bass='A2', p2='counter', p3=arp('arp8', 'up', 79, 91, vel=0.8)),
    15: dict(ch=[(0, 'G/B')], key='C', drums='A2', bass='A2', p2='counter', p3=arp('arp8', 'roll', 79, 91, vel=0.8)),
    16: dict(ch=[(0, 'Am')], key='C', drums='A2', bass='A2', p2='counter', p3=arp('arp8', 'wave', 79, 91, vel=0.8)),
    17: dict(ch=[(0, 'F')], key='C', drums='A2v', bass='A2', p2='counter', p3=arp('arp8', 'skip', 79, 91, vel=0.8)),
    18: dict(ch=[(0, 'G'), (8, 'G7')], key='C', drums='turn', bass='turn', p2='counter'),
    19: dict(ch=[(0, 'Fmaj7')], key='C', drums='B', bass='B', p2='harm', p3=arp('arp16', 'cascade', 76, 93, vel=0.8, **SPARK), pad=0.45),
    20: dict(ch=[(0, 'G')], key='C', drums='B', bass='B', p2='harm', p3=arp('arp16', 'cascade', 76, 93, vel=0.8, **SPARK), pad=0.45),
    21: dict(ch=[(0, 'Em7')], key='C', drums='B', bass='B', p2='harm', p3=arp('arp16', 'cascade', 76, 93, vel=0.8, **SPARK), pad=0.45),
    22: dict(ch=[(0, 'Am')], key='C', drums='Bv', bass='Bv', p2='harm', p3=arp('arp16', 'cascade', 76, 93, vel=0.8, **SPARK), pad=0.45),
    23: dict(ch=[(0, 'F'), (8, 'G')], key='C', drums='B2', bass='B', p2='harm', p3=arp('arp16', 'cascade', 76, 93, vel=0.9, **SPARK), pad=0.5),
    24: dict(ch=[(0, 'Bb'), (8, 'C')], key='D', drums='riser', bass='riser', p2='harm', p3=arp('arp16', 'rise', 60, 98, **SPARK), pad=0.6, riser=True),
    25: dict(ch=[(0, 'D')], key='D', drums='drop1', bass='drop', p2='harm', p3='chordarp', pad=0.85, sparkle=14, wide=True),
    26: dict(ch=[(0, 'A')], key='D', drums='drop', bass='drop', p2='harm', p3='chordarp', pad=0.85, sparkle=9, wide=True),
    27: dict(ch=[(0, 'Bm')], key='D', drums='dropv', bass='drop', p2='harm', p3='chordarp', pad=0.85, sparkle=6, wide=True),
    28: dict(ch=[(0, 'G')], key='D', drums='share', bass='share', p2='harm', p3=arp('arp8', 'up', 74, 88, vel=0.9), pad=0.6),
    29: dict(ch=[(0, 'A')], key='D', drums='share', bass='share_last', p2='harm', p3=arp('arp8', 'roll', 74, 88, vel=0.9), pad=0.6),
    30: dict(ch=[(0, 'D')], key='D', drums='resolve', bass='resolve', p2='harm', p3=arp('arp4', 'up', 74, 90, **WARM), pad=0.65),
    31: dict(ch=[(0, 'Dadd9')], key='D', drums='tail', bass='tail', bass_vel=0.6, p3=arp('arp8', 'up', 74, 90, vel=0.8, **WARM), pad=0.6),
    32: dict(ch=[(0, 'G/D')], key='D', p3=arp('arp4', 'roll', 74, 90, vel=0.6, **WARM), pad=0.55),
    33: dict(ch=[(0, 'D')], key='D', p3=arp('arp2', 'up', 74, 90, vel=0.45, duty=0.5, tau=0.35), pad=0.5, hold=1.3),
}

# Lead (pulse 1, 25 % duty): "note:length-in-16ths", r = rest.
LEAD = {
    1: 'G5:0.5 C6:7.5', 5: 'r:12 G4:2 C5:2',
    6: 'E5:3 G5:3 C6:6 B5:2 A5:2', 7: 'G5:6 D5:2 r:4 B4:2 D5:2',
    8: 'E5:3 A5:3 C6:6 D6:2 C6:2', 9: 'A5:4 G5:2 F5:2 G5:8',
    10: 'C6:6 B5:2 A5:4 E5:4', 11: 'B5:6 A5:2 G5:4 E5:4',
    12: 'A5:3 C6:3 E6:6 D6:2 C6:2', 13: 'D6:6 C6:2 B5:4 G5:2 D5:2',
    14: 'E5:3 G5:3 C6:4 D6:2 E6:4', 15: 'D6:6 B5:2 G5:4 A5:2 B5:2',
    16: 'C6:3 D6:3 E6:6 D6:2 C6:2', 17: 'C6:4 A5:2 G5:2 A5:8',
    18: 'r:8 D5:2 E5:2 F5:2 G5:2',
    19: 'A5:2 C6:2 E6:10 D6:2', 20: 'D6:6 C6:2 B5:4 G5:4',
    21: 'G5:2 B5:2 D6:10 E6:2', 22: 'E6:6 D6:2 C6:4 A5:2 B5:2',
    23: 'C6:6 A5:2 B5:6 D6:2', 24: 'D6:8 E6:8',
    25: 'F#6:10 E6:2 D6:4', 26: 'E6:6 C#6:2 A5:4 C#6:2 E6:2',
    27: 'F#6:6 E6:2 D6:4 B5:2 C#6:2', 28: 'D6:6 B5:2 G5:8',
    29: 'E5:2 F#5:2 A5:4 B5:4 C#6:4', 30: 'D6:16',
}

# Counter-melody (pulse 2, 50 % duty) for the second pass: moves while the lead holds.
COUNTER = {
    14: 'C5:8 B4:4 G4:4', 15: 'B4:2 C5:2 D5:12', 16: 'E5:8 D5:2 C5:2 B4:2 A4:2',
    17: 'A4:6 C5:2 E5:4 D5:4', 18: 'D5:2 C5:2 B4:2 A4:2 B4:2 C5:2 D5:2 E5:2',
}

PATTERNS = {
    'up': (0, 1, 2, 3, 4, 3, 2, 1), 'roll': (0, 2, 1, 3, 2, 4, 3, 1),
    'wave': (1, 0, 2, 1, 3, 2, 4, 3), 'skip': (0, 2, 4, 2, 1, 3, 5, 3),
    'cascade': (0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6),
}

# Triangle bass: (step, length, degree). R root/bass, O octave, 5 fifth, 3 third,
# A diatonic approach into the next bar's bass note, R-12 low root.
_EIGHTH_OCT = [(i * 2, 2, 'R' if i % 2 == 0 else 'O') for i in range(8)]
BASS = {
    'sting': [(0, 8, 'R-12')],
    'intro': [(0, 6, 'R'), (6, 2, 'R'), (8, 8, '5')],
    'intro_last': [(0, 6, 'R'), (6, 2, 'R'), (8, 4, '5'), (12, 2, 'O'), (14, 2, 'A')],
    'A1': [(0, 2, 'R'), (2, 2, 'R'), (4, 2, 'O'), (6, 2, 'R'), (8, 2, '5'), (10, 2, 'R'), (12, 2, 'O'), (14, 2, 'A')],
    'A1b': [(0, 3, 'R'), (3, 3, 'R'), (6, 2, 'O'), (8, 3, '5'), (11, 3, '5'), (14, 2, 'A')],
    'A2': [(0, 2, 'R'), (2, 2, 'O'), (4, 2, '5'), (6, 2, 'O'), (8, 2, 'R'), (10, 2, '3'), (12, 2, '5'), (14, 2, 'A')],
    'turn': [(0, 2, 'R'), (2, 2, 'O'), (4, 2, 'R'), (6, 2, 'O'), (8, 2, 'R'), (10, 2, '3'), (12, 2, '5'), (14, 2, 'A')],
    'B': _EIGHTH_OCT,
    'Bv': _EIGHTH_OCT[:7] + [(14, 2, 'A')],
    'riser': _EIGHTH_OCT[:4] + [(8 + i, 1, 'R' if i % 2 == 0 else 'O') for i in range(8)],
    'drop': _EIGHTH_OCT[:6] + [(12, 2, '5'), (14, 2, 'A')],
    'share': [(0, 6, 'R'), (6, 2, 'R'), (8, 4, '5'), (12, 4, 'O')],
    'share_last': [(0, 6, 'R'), (6, 2, 'R'), (8, 2, '5'), (10, 2, 'O'), (12, 2, '5'), (14, 2, 'A')],
    'resolve': [(0, 16, 'R-12')], 'tail': [(0, 52, 'R-12')],   # tail: one D2 held through bars 31-33
}

# Drums, one char per 16th, digit = velocity (1-9). K kick, S snare, H closed hat,
# O open hat, C crash, T tom (descending pitch per hit).
DRUMS = {
    'sting':  dict(K='9...............', C='9...............'),
    'intro1': dict(H='..3...3...3...3.'),
    'intro2': dict(K='6.......4.......', H='..4...4...4...4.'),
    'intro3': dict(K='7.....5.7.......', S='............5...', H='..4...4...4.3434'),
    'A1':     dict(K='9.....7.9.......', S='....8.......8...', H='4.6.4.6.4.6.4.6.'),
    'A1v':    dict(K='9.....7.9..7....', S='....8.......8.5.', H='4.6.4.6.4.6.4...', O='..............6.'),
    'A1b':    dict(K='9.....7.9.....6.', S='....8.......8...', H='3252325232523252'),
    'A1bf':   dict(K='9.....7.9.......', S='....8.......5678', H='32523252325.....'),
    'A2':     dict(K='9..6....9.7.....', S='....8.......8...', H='3...3...3...3...', O='..6...6...6...6.'),
    'A2v':    dict(K='9..6....9.......', S='....8.......8.67', H='3...3...3...3...', O='..6...6...6.....'),
    'turn':   dict(K='9.....7.........', S='............7.89', H='4.6.4.6.........', T='........9.8.7...'),
    'B':      dict(K='9...7...9...7...', S='....8.......8...', H='.2.2.2.2.2.2.2.2', O='..6...6...6...6.'),
    'Bv':     dict(K='9...7...9.7.7...', S='....8.......8..6', H='.2.2.2.2.2.2.2.2', O='..6...6...6.....'),
    'B2':     dict(K='9...7...9...8...', S='....8...5.6.7.89', H='.2.2.2.2.2.2.2.2', O='..6...6.........'),
    'riser':  dict(K='9...9...9...9...', S='3344556677889999'),
    'drop1':  dict(K='9...9...9...9...', S='....9.......9...', H='.3.3.3.3.3.3.3.3', O='..7...7...7...7.', C='9...............'),
    'drop':   dict(K='9...9...9...9...', S='....9.......9...', H='.3.3.3.3.3.3.3.3', O='..7...7...7...7.'),
    'dropv':  dict(K='9...9...9...9...', S='....9.......9.78', H='.3.3.3.3.3.3.3.3', O='..7...7...7.....'),
    'share':  dict(K='9.....7.9.......', S='....7.......7...', H='4.5.4.5.4.5.4.5.'),
    'resolve': dict(K='9...............', C='7...............', H='..3...3...3...3.'),
    'tail':   dict(H='..2...2...2...2.'),
}

# Arrangements: (bar list, output seconds, fade-out seconds)
ARRANGEMENTS = {
    '64s': (list(range(1, 34)), 64.0, 1.5),
    '30s': ([1, 4, 5, 6, 7, 8, 9, 19, 20, 24, 25, 26, 27, 29, 30, 31], 30.0, 1.2),
    '15s': ([1, 6, 7, 24, 25, 29, 30, 31], 15.0, 1.2),
}
LOOP_A = list(range(6, 14))


LEAD_NOTES = {b: parse_line(s) for b, s in LEAD.items()}
COUNTER_NOTES = {b: parse_line(s) for b, s in COUNTER.items()}
