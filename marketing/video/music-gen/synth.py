"""
synth.py - NES-flavoured synthesis primitives for compose.py (numpy only).

Channel models follow the 2A03 APU as documented on the NESdev wiki:
  * pulse: 8-step duty sequences 12.5 / 25 / 50 % (rendered band-limited with
    PolyBLEP so high notes stay clean instead of aliasing)
  * triangle: 32-step, 4-bit stepped waveform (fixed volume, used for bass)
  * noise: 15-bit LFSR (feedback = bit0 XOR bit1), clocked at the real NTSC
    noise-period rates, CPU clock / period
Nothing here loads external audio; every sample is computed.
"""
import numpy as np

SR = 44100
FRAME = 1.0 / 60.0                      # NES sound-driver tick
CPU_HZ = 1789773.0                      # NTSC 2A03 clock
NOISE_PERIODS = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068]

_PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def pc_of(name):
    return (_PC[name[0]] + name[1:].count('#') - name[1:].count('b')) % 12


def midi(note):
    """'C#5' -> 73 (C4 = 60)."""
    letters = note.rstrip('-0123456789')
    octave = int(note[len(letters):])
    return 12 * (octave + 1) + _PC[letters[0]] + letters[1:].count('#') - letters[1:].count('b')


def hz(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=float) - 69.0) / 12.0)


def noise_rate(period_index):
    return CPU_HZ / NOISE_PERIODS[period_index]


# ---------------------------------------------------------------- oscillators
def _polyblep(t, dt):
    out = np.zeros_like(t)
    m = t < dt
    x = t[m] / dt[m]
    out[m] = x + x - x * x - 1.0
    m = t > 1.0 - dt
    x = (t[m] - 1.0) / dt[m]
    out[m] = x * x + x + x + 1.0
    return out


def pulse(freq, duty):
    """Band-limited pulse, DC removed. freq/duty: arrays (or duty scalar)."""
    freq = np.asarray(freq, dtype=float)
    dt = freq / SR
    phase = (np.cumsum(dt) - dt) % 1.0
    duty = np.broadcast_to(np.asarray(duty, dtype=float), phase.shape)
    y = np.where(phase < duty, 1.0, -1.0)
    y += _polyblep(phase, dt)
    y -= _polyblep((phase - duty) % 1.0, dt)
    return y - (2.0 * duty - 1.0)


_TRI32 = np.concatenate([np.arange(15, -1, -1), np.arange(0, 16)]) / 7.5 - 1.0


def triangle(freq):
    dt = np.asarray(freq, dtype=float) / SR
    phase = (np.cumsum(dt) - dt) % 1.0
    return _TRI32[(phase * 32).astype(np.int64) % 32]


def _lfsr_sequence():
    reg, out = 1, np.empty(32767)
    for i in range(32767):
        b0 = reg & 1
        reg = (reg >> 1) | ((b0 ^ ((reg >> 1) & 1)) << 14)
        out[i] = 1.0 - 2.0 * b0
    return out


_LFSR = _lfsr_sequence()


def noise(n, rate, offset=0):
    rate = np.broadcast_to(np.asarray(rate, dtype=float), (n,))
    pos = offset + np.cumsum(rate / SR)
    return _LFSR[pos.astype(np.int64) % _LFSR.size]


# ---------------------------------------------------------------- envelopes
def envelope(gate_s, attack, decay, sustain, release):
    gate = max(int(gate_s * SR), 1)
    rel = max(int(release * SR), 1)
    t = np.arange(gate) / SR
    e = sustain + (1.0 - sustain) * np.exp(-np.maximum(t - attack, 0.0) / decay)
    if attack > 0:
        e *= np.minimum(t / attack, 1.0)
    return np.concatenate([e, e[-1] * np.linspace(1.0, 0.0, rel)])


def vibrato(n, cents, rate=5.6, delay=0.18, ramp=0.3):
    t = np.arange(n) / SR
    depth = np.clip((t - delay) / ramp, 0.0, 1.0) * cents
    return 2.0 ** (depth * np.sin(2 * np.pi * rate * t) / 1200.0)


# ---------------------------------------------------------------- instruments
def tone(m, gate_s, duty=0.25, duty_attack=0.125, attack=0.004, decay=0.28, sustain=0.72,
         release=0.05, vib=0.0, vib_rate=5.6, detune=0.0):
    """One pulse-channel note. duty_attack = duty of the first ~1.3 frames (NES pluck trick)."""
    env = envelope(gate_s, attack, decay, sustain, release)
    f = np.full(env.size, hz(m) * 2.0 ** (detune / 1200.0))
    if vib:
        f *= vibrato(env.size, vib, vib_rate)
    d = np.full(env.size, duty)
    if duty_attack is not None:
        d[: int(0.022 * SR)] = duty_attack
    return pulse(f, d) * env


def fast_arp(notes, gate_s, tick=2 * FRAME, duty=0.25, attack=0.003, decay=0.3, sustain=0.6,
             release=0.08):
    """Classic NES 'chord': cycle chord tones every tick on one pulse channel."""
    env = envelope(gate_s, attack, decay, sustain, release)
    idx = (np.arange(env.size) / SR / tick).astype(np.int64) % len(notes)
    return pulse(hz(np.asarray(notes))[idx], duty) * env


def tri_note(m, gate_s, slide_from=None):
    gate = max(int(gate_s * SR), 1)
    ramp = int(0.003 * SR)
    n = gate + ramp
    t = np.arange(n) / SR
    pitch = np.full(n, float(m))
    if slide_from is not None:
        pitch = m + (slide_from - m) * np.exp(-t / 0.03)
    e = np.ones(n)
    e[:ramp] = np.linspace(0.0, 1.0, ramp)
    e[-ramp:] = np.linspace(1.0, 0.0, ramp)
    return triangle(hz(pitch)) * e


def kick(v):
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = 46.0 + 125.0 * np.exp(-t / 0.026)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = noise(n, noise_rate(2)) * np.exp(-t / 0.0035) * 0.35
    y = np.tanh(1.8 * (body + click)) / np.tanh(1.8)
    y[-256:] *= np.linspace(1.0, 0.0, 256)
    return y * v


def _faded(y, ms=12.0):
    n = int(ms / 1000.0 * SR)
    y[-n:] *= np.linspace(1.0, 0.0, n)
    return y


def snare(v, off, length=0.3, body=0.5, crunch=0.75, crunch_tau=0.095, sizzle=0.5, sizzle_tau=0.06):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 205.0 * (1.0 + 0.25 * np.exp(-t / 0.02))
    tone_ = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.05) * body
    crunch_ = noise(n, noise_rate(7), off) * np.exp(-t / crunch_tau) * crunch
    sizzle_ = noise(n, noise_rate(3), off + 4099) * np.exp(-t / sizzle_tau) * sizzle
    return _faded(tone_ + crunch_ + sizzle_) * v


def shout(v, off):
    """Gang-shout count hit ('ONE!'): a cluster of buzzy 12.5 % pulses with a falling
    pitch plus LFSR noise. Mixed through a vocal-band filter in the mix stage."""
    n = int(0.26 * SR)
    t = np.arange(n) / SR
    env = np.minimum(t / 0.006, 1.0) * np.exp(-t / 0.09)
    f = 185.0 * (1.0 + 0.35 * np.exp(-t / 0.04))
    buzz = sum(pulse(f * k, 0.125) for k in (0.84, 1.0, 1.19)) / 3.0
    return _faded((0.6 * buzz + noise(n, noise_rate(5), off)) * env) * v


def hat(v, off, open_=False):
    n = int((0.45 if open_ else 0.09) * SR)
    t = np.arange(n) / SR
    return _faded(noise(n, noise_rate(0), off) * np.exp(-t / (0.13 if open_ else 0.018))) * v


def crash(v, off):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    return _faded(noise(n, noise_rate(1), off) * np.exp(-t / 0.55), 60.0) * v


def tom(v, f0, off):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = f0 * (1.0 + 0.6 * np.exp(-t / 0.03))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    return _faded(body + noise(n, noise_rate(9), off) * np.exp(-t / 0.03) * 0.3) * v


def riser(bar_s, step_s, off):
    """Noise sweep over one bar: period index walks 12 -> 2 per 16th (dark -> bright)."""
    n = int(bar_s * SR)
    t = np.arange(n) / SR
    k = np.minimum((t / step_s).astype(np.int64), 15)
    idx = np.round(12 - k * 10 / 15).astype(np.int64)
    rate = CPU_HZ / np.asarray(NOISE_PERIODS, dtype=float)[idx]
    y = noise(n, rate, off) * (0.12 + 0.88 * (t / bar_s) ** 2)
    y[-int(0.008 * SR):] *= np.linspace(1.0, 0.0, int(0.008 * SR))
    return y
