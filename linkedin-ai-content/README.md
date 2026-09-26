# LinkedIn AI content pipeline

Makes the daily LinkedIn AI post: an animated 1080×1350 MP4, a cover PNG, and a page with the post text,
alternative openings and first comment.

## Files

- `template.html` – animated scene template (neon navy style). Scene types: `stomp`, `typewriter`, `cards`, `tiles`, `question`, `outro`.
- `render.js` – renders a post config to `post.mp4` + `cover.png` (Playwright frames → ffmpeg H.264).
- `music.py` – generates an original royalty-free synthwave track (seeded by `music_seed`), mixed in by `render.js`.
- `build_page.js` – writes the artifact page `index.html` from the same config.
- `posts/*.json` – one config per day: `date`, `topic`, `post`, `hooks`, `sources`, `scenes`.

## Daily run

```bash
pip install -q imageio-ffmpeg numpy    # bundled ffmpeg + music synth
OUT=<scratchpad>/out && mkdir -p "$OUT"
node render.js posts/<day>.json "$OUT"   # ~2 min
node build_page.js posts/<day>.json "$OUT"
```

Then republish `$OUT/index.html` with `post.mp4` and `cover.png` as files to the Daily AI Post artifact.
