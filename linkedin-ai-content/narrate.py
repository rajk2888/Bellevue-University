"""Synthesizes the voiceover for scenes that have a "say" line, using a local Piper voice.

Usage: python3 narrate.py <config.json> <out-dir>
Writes <out-dir>/voice_<i>.wav per narrated scene and prints JSON {scene_index: seconds} to stdout.

Voice: Piper "en-us-libritts-high" (LibriTTS dataset, CC BY 4.0). The model is downloaded once from
the Piper GitHub release into ~/.cache/piper-voices. Speaker and pace come from the config's "voice" block.
"""
import json
import os
import subprocess
import sys
import tarfile
import urllib.request
import wave

VOICE = 'en-us-libritts-high'
URL = f'https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-{VOICE}.tar.gz'
CACHE = os.path.expanduser('~/.cache/piper-voices')


def model_path():
    onnx = os.path.join(CACHE, f'{VOICE}.onnx')
    if not os.path.exists(onnx):
        os.makedirs(CACHE, exist_ok=True)
        tgz = os.path.join(CACHE, 'voice.tgz')
        urllib.request.urlretrieve(URL, tgz)
        with tarfile.open(tgz) as t:
            t.extractall(CACHE)
        os.remove(tgz)
    return onnx


def main():
    cfg_path, out_dir = sys.argv[1], sys.argv[2]
    cfg = json.load(open(cfg_path))
    voice = cfg.get('voice', {})
    onnx = model_path()
    lengths = {}
    for i, scene in enumerate(cfg['scenes']):
        text = scene.get('say')
        if not text:
            continue
        out = os.path.join(out_dir, f'voice_{i}.wav')
        subprocess.run(
            [sys.executable, '-m', 'piper', '-m', onnx, '-f', out,
             '--speaker', str(voice.get('speaker', 0)),
             '--length-scale', str(voice.get('pace', 1.0)),
             '--noise-scale', '0.6', '--noise-w', '0.8', '--sentence-silence', '0.25'],
            input=text.encode(), check=True, capture_output=True)
        with wave.open(out) as w:
            lengths[i] = w.getnframes() / w.getframerate()
    print(json.dumps(lengths))


if __name__ == '__main__':
    main()
