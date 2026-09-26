// Renders a LinkedIn motion post (MP4 video + PNG cover) from a JSON scene config.
// Usage: node render.js <config.json> <out-dir>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const FPS = 30;

async function main() {
  const [cfgPath, outDir] = process.argv.slice(2);
  if (!cfgPath || !outDir) throw new Error('usage: node render.js <config.json> <out-dir>');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const framesDir = path.join(outDir, 'frames');
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(__dirname, 'template.html'));
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  const total = await page.evaluate(c => window.setup(c), cfg);

  const n = Math.round(total * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    await page.screenshot({ path: path.join(framesDir, `f${String(i).padStart(5, '0')}.png`) });
  }
  // Cover image: a moment in the first scene where the headline has fully landed.
  await page.evaluate(t => window.render(t), cfg.cover_time ?? 1.2);
  await page.screenshot({ path: path.join(outDir, 'cover.png') });
  await browser.close();

  const ffmpeg = execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
  // Original synthwave backing track; music_seed varies the chords/arpeggio from day to day.
  const wav = path.join(outDir, 'music.wav');
  execFileSync('python3', [path.join(__dirname, 'music.py'), String(total), wav, String(cfg.music_seed ?? 0)]);
  const mp4 = path.join(outDir, 'post.mp4');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.png'), '-i', wav,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-af', 'loudnorm=I=-16:TP=-2:LRA=11', '-ar', '44100', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4]);
  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.rmSync(wav, { force: true });
  console.log(`wrote ${mp4} (${total}s) and ${path.join(outDir, 'cover.png')}`);
}

main().catch(e => { console.error(e); process.exit(1); });
