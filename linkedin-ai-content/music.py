"""Generates an original, royalty-free synthwave backing track (WAV) for the post video.

Usage: python3 music.py <seconds> <out.wav> [seed]
The seed picks the chord progression and arpeggio pattern so each day can sound a little different.
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 118
BEAT = 60 / BPM

# Chord progressions in semitones from A2 (110 Hz); each chord lasts one bar.
PROGRESSIONS = [
    [0, -4, 3, -2],   # Am  F  C  G
    [0, 3, -2, -4],   # Am  C  G  F
    [0, -4, -2, 3],   # Am  F  G  C
]
MINOR = [0, 3, 7]
MAJOR = [0, 4, 7]


def hz(semi, base=110.0):
    return base * 2 ** (semi / 12)


def env(n, attack=0.005, release=0.15):
    t = np.arange(n) / SR
    a = np.clip(t / attack, 0, 1)
    r = np.exp(-t / release)
    return a * r


def saw(f, n):
    t = np.arange(n) / SR
    # Two slightly detuned saws for a wide synth sound.
    return ((t * f) % 1 * 2 - 1 + (t * f * 1.006) % 1 * 2 - 1) / 2


def place(buf, sig, start):
    s = int(start * SR)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[: e - s]


def lowpass(x, alpha):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def track(seconds, seed=0):
    rng = np.random.default_rng(seed)
    prog = PROGRESSIONS[seed % len(PROGRESSIONS)]
    n = int(seconds * SR)
    drums, bass, arp, pad = (np.zeros(n) for _ in range(4))
    bar = BEAT * 4
    pattern = rng.permutation([0, 1, 2, 1, 0, 2, 1, 2])

    beats = int(seconds / BEAT) + 1
    for b in range(beats):
        t0 = b * BEAT
        # Kick on every beat: pitch-swept sine.
        k = int(0.35 * SR)
        tt = np.arange(k) / SR
        kick = np.sin(2 * np.pi * (45 + 90 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 9)
        place(drums, kick * 0.9, t0)
        # Clap/snare on 2 and 4.
        if b % 2 == 1:
            s = int(0.2 * SR)
            snare = rng.standard_normal(s) * env(s, 0.001, 0.06) * 0.35
            place(drums, snare, t0)
        # Off-beat closed hi-hat.
        h = int(0.05 * SR)
        hat = np.diff(rng.standard_normal(h + 1)) * env(h, 0.001, 0.015) * 0.12
        place(drums, hat, t0 + BEAT / 2)

    bars = int(seconds / bar) + 1
    for i in range(bars):
        root = prog[i % len(prog)]
        quality = MINOR if root in (0,) else MAJOR
        tb = i * bar
        # Pulsing eighth-note bass.
        for e in range(8):
            m = int(BEAT / 2 * SR)
            place(bass, saw(hz(root - 12), m) * env(m, 0.003, 0.12) * 0.35, tb + e * BEAT / 2)
        # Sixteenth-note arpeggio over the chord.
        for s16 in range(16):
            note = quality[pattern[s16 % 8] % 3] + root + (12 if s16 % 4 == 3 else 0)
            m = int(BEAT / 4 * SR)
            place(arp, saw(hz(note + 12), m) * env(m, 0.002, 0.07) * 0.16, tb + s16 * BEAT / 4)
        # Soft pad holding the chord for the bar.
        m = int(bar * SR)
        chord = sum(saw(hz(root + q + 12), m) for q in quality) / 3
        swell = np.minimum(np.arange(m) / (0.4 * SR), 1) * np.minimum((m - np.arange(m)) / (0.2 * SR), 1)
        place(pad, chord * swell * 0.12, tb)

    mix = drums + lowpass(bass, 0.12) + lowpass(arp, 0.25) + lowpass(pad, 0.05)
    # Fade in/out and normalise.
    fade = np.ones(n)
    fi, fo = int(0.3 * SR), int(1.2 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    mix *= fade
    mix /= max(1e-9, np.abs(mix).max()) / 0.85
    return mix


def main():
    seconds = float(sys.argv[1])
    out = sys.argv[2]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    audio = (track(seconds, seed) * 32767).astype(np.int16)
    stereo = np.column_stack([audio, audio]).ravel()
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(stereo.tobytes())
    print('wrote', out)


if __name__ == '__main__':
    main()
