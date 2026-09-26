"""Mixes the voiceover clips over the music bed, ducking the music while someone is talking.

Usage: python3 mixdown.py <music.wav> <out.wav> <voice.wav>@<start_seconds> ...
"""
import sys
import wave

import numpy as np

SR = 44100


def read(path):
    with wave.open(path) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32767
    if ch == 2:
        a = a.reshape(-1, 2).mean(axis=1)
    if sr != SR:
        a = np.interp(np.arange(int(len(a) * SR / sr)) * sr / SR, np.arange(len(a)), a)
    return a


def main():
    music_path, out = sys.argv[1], sys.argv[2]
    music = read(music_path)
    voice = np.zeros_like(music)
    for spec in sys.argv[3:]:
        path, start = spec.rsplit('@', 1)
        clip = read(path)
        s = int(float(start) * SR)
        e = min(len(voice), s + len(clip))
        if s < e:
            voice[s:e] += clip[: e - s]
    # Duck the music under speech: envelope follower on the voice, smoothed over ~150 ms.
    talking = (np.abs(voice) > 0.01).astype(np.float32)
    k = int(0.15 * SR)
    talking = np.convolve(talking, np.ones(k) / k, mode='same')
    gain = 0.32 - 0.22 * np.clip(talking * 4, 0, 1)
    mix = music * gain + voice * 1.0
    mix /= max(1e-9, np.abs(mix).max()) / 0.9
    pcm = (mix * 32767).astype(np.int16)
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.column_stack([pcm, pcm]).ravel().tobytes())


if __name__ == '__main__':
    main()
