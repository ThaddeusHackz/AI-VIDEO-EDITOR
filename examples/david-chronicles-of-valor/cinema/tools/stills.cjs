// stills.cjs — render pose stills for a list of clips and tile them into one contact sheet.
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const FF = process.env.FFMPEG || '/home/user/.cache/ffmpeg';
const CASES = JSON.parse(process.argv[2] || '[]');
(async () => {
  const h = await launch({ root: ROOT });
  const files = [];
  try {
    await h.page.goto(h.url('/tools/validate.html'), { waitUntil: 'load', timeout: 120000 });
    await h.page.waitForFunction('window.__status === "ready-assets-pending"', { timeout: 120000, polling: 200 });
    let i = 0;
    for (const [clip, t, tag] of CASES) {
      const b64 = await h.page.evaluate((c, tt) => window.__still('/assets/chars/paladin.glb', c ? '/assets/anim/' + c + '.glb' : null, tt),
        clip, t);
      const f = path.join(ROOT, 'probe', `still_${String(i).padStart(2, '0')}_${tag}.jpg`);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, Buffer.from(b64, 'base64'));
      files.push(f); i++;
      console.log('rendered', path.basename(f), fs.statSync(f).size);
    }
    if (files.length > 1) {
      const args = files.flatMap(f => ['-i', f]);
      const cols = Math.min(5, files.length), rows = Math.ceil(files.length / cols);
      execFileSync(FF, ['-y', '-loglevel', 'error', ...args, '-filter_complex',
        `${files.map((_, k) => `[${k}]scale=520:-1[a${k}]`).join(';')};${files.map((_, k) => `[a${k}]`).join('')}xstack=inputs=${files.length}:layout=${files.map((_, k) => `${(k % cols) * 520}_${Math.floor(k / cols) * 660}`).join('|')}[out]`,
        '-map', '[out]', path.join(ROOT, 'probe', 'sheet.jpg')]);
      console.log('sheet', path.join('probe', 'sheet.jpg'), fs.statSync(path.join(ROOT, 'probe', 'sheet.jpg')).size);
    }
  } finally { await h.close(); }
})().catch(e => { console.error('FAIL', e); process.exit(1); });
