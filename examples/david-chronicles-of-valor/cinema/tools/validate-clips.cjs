// validate-clips.cjs — proves the rest-pose retarget binds every mocap clip cleanly.
const fs = require('node:fs'), path = require('node:path');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const animDir = path.join(ROOT, 'assets/anim');
(async () => {
  const clips = fs.readdirSync(animDir).filter(f => f.endsWith('.glb')).sort();
  const urls = clips.map(f => '/assets/anim/' + f);
  const h = await launch({ root: ROOT });
  try {
    await h.page.goto(h.url('/tools/validate.html'), { waitUntil: 'load', timeout: 120000 });
    await h.page.waitForFunction('window.__status === "ready-assets-pending"', { timeout: 120000, polling: 200 });
    const out = await h.page.evaluate(list => window.__validate(list), urls);
    const rows = out.results;
    const bad = rows.filter(r => r.error || r.verdict === 'NONFINITE' || r.verdict === 'low');
    const skipped = rows.filter(r => (r.skipped || 0) > 0);
    console.log('character rest hip Y:', out.restHipY);
    console.log('clips:', rows.length, '| bound ok:', rows.filter(r => r.verdict === 'ok').length,
      '| low:', rows.filter(r => r.verdict === 'low').length, '| nonfinite:', rows.filter(r => r.verdict === 'NONFINITE').length,
      '| errors:', rows.filter(r => r.error).length);
    console.log('\nflagged:'); for (const r of bad.slice(0, 25)) console.log(' ', JSON.stringify(r));
    console.log('\ntracks dropped on some clips:', skipped.length, skipped.slice(0, 4).map(r => `${r.clip}:${r.skipped}`).join(' '));
    const okRow = rows.find(r => r.clip.includes('Great_Sword_Slash'));
    console.log('\nsample:', JSON.stringify(okRow));
    fs.writeFileSync(path.join(ROOT, 'out', 'clip-validation.json'), JSON.stringify(out, null, 1));
    if (bad.length) { console.error('\nVALIDATION FLAGS PRESENT'); }
    else console.log('\nALL CLIPS BIND CLEANLY');
  } finally { await h.close(); }
})().catch(e => { console.error('FAIL', e); process.exit(1); });
