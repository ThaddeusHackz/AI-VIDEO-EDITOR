// probe.cjs — render a handful of frames at a reduced scale to check staging, lighting
// and continuity before committing to a full-resolution render.
//   node tools/probe.cjs <framesCsv> [scale] [quality]
const fs = require('node:fs'), path = require('node:path');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const frames = (process.argv[2] || '0,300').split(',').map(Number);
const scale = process.argv[3] || '0.25';
const quality = process.argv[4] || '1';
let HARNESS = null;
(async () => {
  const h = await launch({ root: ROOT });
  HARNESS = h;
  const outDir = path.join(ROOT, 'probe');
  fs.mkdirSync(outDir, { recursive: true });
  try {
    await h.page.goto(h.url(`/tools/render.html?scale=${scale}&quality=${quality}`), { waitUntil: 'load', timeout: 120000 });
    await h.page.waitForFunction('window.__status === "ready" || String(window.__status).startsWith("error")', { timeout: 900000, polling: 500 });
    const st = await h.page.evaluate('window.__status');
    if (st !== 'ready') throw new Error(st);
    console.log('info', JSON.stringify(await h.page.evaluate('window.__info')));
    for (const f of frames) {
      const t0 = Date.now();
      await h.page.evaluate((fr) => { window.__warm(fr, 2); }, f);
      const b64 = await h.page.evaluate('window.__grab(0.9)');
      const file = path.join(outDir, `probe_${String(f).padStart(5, '0')}.jpg`);
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      const stats = await h.page.evaluate('window.__stats()');
      console.log(`frame ${f} (${(f / 60).toFixed(1)}s) ${Date.now() - t0}ms shot=${stats.shot} actors=${Object.keys(stats.actors).join(',')}`);
    }
  } finally { await h.close(); }
})().catch(e => { console.error('FAIL', e.message); if (HARNESS && HARNESS.logs.length) console.error(HARNESS.logs.join('\n')); process.exit(1); });
