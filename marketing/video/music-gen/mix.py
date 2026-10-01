"""
mix.py - mixdown for compose.py: per-track EQ / drive / sidechain duck, dotted-8th
ping-pong echo on the lead, synthetic-IR reverb, zero-phase master EQ, fades.
Levels and effect amounts come from the score module S (S.MIX, S.STEREO, S.FX).
"""
import numpy as np

from render import SR, pan_gains, render_tracks


def hp(f, fc, order):
    return 1.0 / np.sqrt(1.0 + (fc / np.maximum(f, 1e-3)) ** (2 * order))


def lp(f, fc, order):
    return 1.0 / np.sqrt(1.0 + (f / fc) ** (2 * order))


def bell(f, fc, gain_db, width_oct):
    x = np.log2(np.maximum(f, 1.0) / fc) / width_oct
    return 10.0 ** (gain_db / 20.0 * np.exp(-0.5 * x * x))


def low_shelf(f, fc, gain_db):
    return 10.0 ** (gain_db / 20.0 / (1.0 + (np.maximum(f, 1e-3) / fc) ** 2))


def fft_filter(x, response):
    spec = np.fft.rfft(x)
    return np.fft.irfft(spec * response(np.fft.rfftfreq(x.size, 1.0 / SR)), x.size)


TRACK_EQ = {'hat': lambda f: hp(f, 5000, 2), 'ohat': lambda f: hp(f, 4500, 2),
            'crash': lambda f: hp(f, 3500, 2), 'snare': lambda f: hp(f, 150, 1),
            'pad': lambda f: hp(f, 110, 1) * lp(f, 1600, 2),
            'shout': lambda f: hp(f, 350, 2) * lp(f, 3500, 2),
            'gtr': lambda f: hp(f, 90, 2) * lp(f, 7000, 2)}


def master_eq(S):
    def response(f):
        shelf = 10.0 ** (-1.5 / 20.0 / (1.0 + (9000.0 / np.maximum(f, 1.0)) ** 2))
        out = hp(f, 30, 4) * bell(f, 2600, -1.5, 0.8) * shelf * lp(f, 16500, 2)
        if S.FX['low_shelf_db']:
            out = out * low_shelf(f, S.FX['low_shelf_hz'], S.FX['low_shelf_db'])
        return out
    return response


def drive(x, amount):
    """Soft clip with unity small-signal gain (tanh)."""
    return np.tanh(amount * x) / amount if amount else x


def sidechain(n, kicks):
    sc = np.zeros(n)
    t = np.arange(int(0.32 * SR)) / SR
    shape = np.minimum(t / 0.004, 1.0) * np.exp(-np.maximum(t - 0.004, 0.0) / 0.11)
    for tk, v in kicks:
        seg = sc[int(round(tk * SR)):int(round(tk * SR)) + shape.size]
        np.maximum(seg, shape[:seg.size] * v, out=seg)
    return sc


def boxcar(x, w):
    c = np.cumsum(np.concatenate([np.zeros(w), x]))
    return (c[w:] - c[:-w]) / w


def ping_pong(S, send):
    """Dotted-8th echo, alternating L/R, each repeat darker."""
    n, d = send.size, int(round(0.75 * S.BEAT * SR))
    s = fft_filter(send, lambda f: hp(f, 300, 2) * lp(f, 5000, 2))
    out = np.zeros((n, 2))
    for k, (g, pan) in enumerate(S.FX['echo'], 1):
        if k * d >= n:
            break
        tap = boxcar(s[: n - k * d], 2 * k) * g
        l, r = pan_gains(pan)
        out[k * d:, 0] += tap * l
        out[k * d:, 1] += tap * r
    return out


def reverb(send, seed=3):
    rng = np.random.default_rng(seed)
    t = np.arange(int(1.8 * SR)) / SR
    nfft = 1 << int(np.ceil(np.log2(send.size + t.size + 1024)))
    spec = np.fft.rfft(send, nfft)
    out = []
    for _ in range(2):
        ir = np.concatenate([np.zeros(int(0.014 * SR)), rng.standard_normal(t.size) * np.exp(-6.91 * t / 1.25)])
        ir = fft_filter(ir, lambda f: hp(f, 200, 1) * lp(f, 5500, 1))
        ir /= np.sqrt(np.sum(ir ** 2))
        out.append(np.fft.irfft(spec * np.fft.rfft(ir, nfft), nfft)[: send.size])
    return np.stack(out, axis=1)


def mixdown(S, tracks, kicks):
    n = tracks.n
    sc = sidechain(n, kicks)
    out, echo_send, verb_send = np.zeros((n, 2)), np.zeros(n), np.zeros(n)
    get = lambda name: tracks.t.get(name, np.zeros(n))
    for name, (gain, pan, depth, send, amount) in S.MIX.items():
        sig = drive(get(name), amount)
        if name in TRACK_EQ and sig.any():
            sig = fft_filter(sig, TRACK_EQ[name])
        sig = sig * gain * (1.0 - depth * sc)
        l, r = pan_gains(pan)
        out[:, 0] += sig * l
        out[:, 1] += sig * r
        verb_send += sig * send
        if name in ('lead', 'p3'):
            echo_send += sig * (1.0 if name == 'lead' else S.FX['p3_echo'])
    for name, (gain, depth, send, amount) in S.STEREO.items():
        for ch, side in enumerate(('_l', '_r')):
            sig = drive(get(name + side), amount)
            if name in TRACK_EQ and sig.any():
                sig = fft_filter(sig, TRACK_EQ[name])
            sig = sig * gain * (1.0 - depth * sc)
            out[:, ch] += sig
            verb_send += sig * send * 0.5
            if name == 'spark':
                echo_send += sig * 0.5
    out += ping_pong(S, echo_send)
    out += reverb(verb_send) * S.FX['reverb'] * (1.0 - 0.3 * sc)[:, None]
    eq = master_eq(S)
    return np.stack([fft_filter(out[:, c], eq) for c in range(2)], axis=1)


def render(S, arrangement, seconds, fade_s):
    tracks, kicks = render_tracks(S, arrangement, seconds)
    x = mixdown(S, tracks, kicks)[: int(round(seconds * SR))]
    nf = int(fade_s * SR)
    x[-nf:] *= (0.5 + 0.5 * np.cos(np.linspace(0.0, np.pi, nf)))[:, None]
    x[:64] *= np.linspace(0.0, 1.0, 64)[:, None]
    return x
