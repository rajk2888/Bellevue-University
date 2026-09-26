// Builds the "Daily AI Post" artifact page from a post config.
// Usage: node build_page.js <config.json> <out-dir>   (writes <out-dir>/index.html next to post.mp4 + cover.png)
const fs = require('fs');
const path = require('path');

const [cfgPath, outDir] = process.argv.slice(2);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstComment = 'Sources 📚\n' + cfg.sources.map(s => `${s.name}: ${s.url}`).join('\n');
const words = cfg.post.split(/\s+/).filter(Boolean).length;

const html = `<title>${esc(cfg.page_title || 'Daily AI Post')}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
  :root { color-scheme: dark; --bg:#0B1020; --panel:#121935; --line:#26305C; --ink:#EEF2FF; --muted:#9AA6CF;
    --cyan:#00E5FF; --purple:#A855F7; --pink:#FF2E88; }
  body { background:var(--bg); color:var(--ink); font:16px/1.55 'IBM Plex Sans', system-ui, sans-serif; }
  .wrap { max-width:1120px; margin:0 auto; padding-inline:20px; padding-block:28px 60px; display:flex; flex-direction:column; gap:28px; }
  header { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px 20px; border-bottom:1px solid var(--line); padding-bottom:18px; }
  .eyebrow { font:500 12px 'IBM Plex Mono', monospace; letter-spacing:.14em; text-transform:uppercase; color:var(--cyan); }
  h1 { font:900 clamp(28px,4.5vw,44px)/1.08 Montserrat, sans-serif; margin:6px 0 0; text-wrap:balance; }
  .when { font:500 13px 'IBM Plex Mono', monospace; color:var(--muted); }
  .grid { display:grid; grid-template-columns:minmax(0,420px) minmax(0,1fr); gap:28px; align-items:start; }
  @media (max-width:820px) { .grid { grid-template-columns:1fr; } }
  .media { display:flex; flex-direction:column; gap:12px; position:sticky; top:calc(env(safe-area-inset-top,0px) + 16px); }
  @media (max-width:820px) { .media { position:static; } }
  video { width:100%; max-width:100%; aspect-ratio:1080/1350; border-radius:14px; background:#000; border:1px solid var(--line); display:block; }
  .row { display:flex; flex-wrap:wrap; gap:10px; }
  button { font:600 14px 'IBM Plex Sans', sans-serif; color:var(--bg); background:var(--cyan); border:0; border-radius:10px; padding:11px 16px; cursor:pointer; }
  button.ghost { background:transparent; color:var(--ink); border:1px solid var(--line); }
  button:hover { filter:brightness(1.1); } button:focus-visible { outline:3px solid var(--pink); outline-offset:2px; }
  .note { font-size:13px; color:var(--muted); min-height:1.2em; }
  section { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:12px; }
  section h2 { font:700 17px Montserrat, sans-serif; margin:0; display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; }
  .meta { font:500 12px 'IBM Plex Mono', monospace; color:var(--muted); }
  pre { margin:0; white-space:pre-wrap; word-break:break-word; font:15px/1.6 'IBM Plex Sans', sans-serif; color:var(--ink); }
  ol { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:10px; }
  ol li button { margin-left:8px; padding:4px 10px; font-size:12px; }
  .steps { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
  .step { border-left:3px solid var(--purple); padding:4px 0 4px 12px; }
  .step b { font:500 12px 'IBM Plex Mono', monospace; color:var(--purple); display:block; }
  a { color:var(--cyan); }
  .col { display:flex; flex-direction:column; gap:20px; min-width:0; }
  @media (prefers-reduced-motion: reduce) { video { animation:none; } }
</style>
<div class="wrap">
  <header>
    <div><div class="eyebrow">${esc(cfg.eyebrow || "Today's LinkedIn post")}</div><h1>${esc(cfg.topic)}</h1></div>
    <div class="when">${esc(cfg.date)} · publish ${esc(cfg.publish_time || '8:00 AM CT')}</div>
  </header>
  <div class="grid">
    <div class="media">
      <video id="vid" src="post.mp4" poster="cover.png" controls muted loop playsinline autoplay></video>
      <div class="row">
        <button id="dl-video" type="button">Save video (MP4)</button>
        <button id="dl-cover" type="button" class="ghost">Save cover image (PNG)</button>
      </div>
      <div class="note" id="dl-note">1080×1350 · 15 s with original background music (tap the speaker icon to unmute). Upload it with the post on LinkedIn.</div>
    </div>
    <div class="col">
      <section>
        <h2>Post text <button type="button" data-copy="post">Copy post</button></h2>
        <div class="meta">${words} words · hashtags included · no links in the body</div>
        <pre id="post">${esc(cfg.post)}</pre>
      </section>
      <section>
        <h2>Other openings</h2>
        <div class="meta">Swap one in for the first two lines if you like it better.</div>
        <ol>${cfg.hooks.map((h, i) => `<li><span id="hook${i}">${esc(h)}</span><button type="button" class="ghost" data-copy="hook${i}">Copy</button></li>`).join('')}</ol>
      </section>
      <section>
        <h2>First comment <button type="button" data-copy="comment">Copy comment</button></h2>
        <div class="meta">Post this right after publishing. Links go here, not in the post.</div>
        <pre id="comment">${esc(firstComment)}</pre>
      </section>
      <section>
        <h2>At ${esc(cfg.publish_time || '8:00 AM CT')}</h2>
        <div class="steps">
          <div class="step"><b>1 · Post</b>Paste the text, attach the video, publish.</div>
          <div class="step"><b>2 · Comment</b>Add the first comment with the sources.</div>
          <div class="step"><b>3 · Reply</b>Answer every comment in the first 60 minutes.</div>
        </div>
      </section>
    </div>
  </div>
</div>
<script>
  const cfg_slug = ${JSON.stringify(cfg.file_slug || 'linkedin-ai-post')};
  const note = document.getElementById('dl-note');
  document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const el = document.getElementById(b.dataset.copy); const label = b.textContent;
    try { await navigator.clipboard.writeText(el.textContent); b.textContent = 'Copied'; }
    catch { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected, press Ctrl+C'; }
    setTimeout(() => (b.textContent = label), 1800);
  }));
  const saveButtons = [['dl-video', 'post.mp4', (cfg_slug + '.mp4')], ['dl-cover', 'cover.png', (cfg_slug + '-cover.png')]];
  (async () => {
    const downloads = await window.claude?.use?.('downloads');
    if (!downloads) { saveButtons.forEach(([id]) => (document.getElementById(id).hidden = true)); note.textContent = 'To save the video, open this page in the Claude app or on claude.ai.'; return; }
    saveButtons.forEach(([id, src, name]) => document.getElementById(id).addEventListener('click', async () => {
      try { const blob = await (await fetch(src)).blob(); await downloads.save({ filename: name, data: blob }); note.textContent = 'Saved ' + name + '.'; }
      catch (e) { note.textContent = e && e.code === 'declined' ? 'Save cancelled.' : 'Could not save the file here. Try again from claude.ai in a browser.'; }
    }));
  })();
</script>
`;
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('wrote', path.join(outDir, 'index.html'));
