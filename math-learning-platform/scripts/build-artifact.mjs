// Inlines the `vite build --mode artifact` output into one self-contained
// HTML page (dist-artifact/stepwise-math.html) for hosts that serve a single
// file inside a sandboxed frame. The host supplies <html>/<head>/<body>.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact/assets';
const files = readdirSync(dir);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');
const jsFiles = files.filter((f) => f.endsWith('.js'));
if (jsFiles.length !== 1) throw new Error(`Expected one JS bundle, found: ${jsFiles.join(', ')}`);
// A literal "</script" inside the bundle would end the inline script early.
const js = readFileSync(join(dir, jsFiles[0]), 'utf8').replace(/<\/script/gi, '<\\/script');

const html = `<title>StepWise Math</title>
<meta name="description" content="Math Made Easy — learn mathematics one step at a time, Grades 1–12." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Nunito:wght@400;600;700;800;900&display=swap" />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
writeFileSync('dist-artifact/stepwise-math.html', html);
console.log(`dist-artifact/stepwise-math.html (${(html.length / 1024).toFixed(0)} KB)`);
