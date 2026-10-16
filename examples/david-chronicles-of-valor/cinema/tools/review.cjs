// review.cjs — contact sheet of stills pulled from the *finished* film file (not from the live
// renderer), so it documents what was actually delivered.
//
//   node tools/review.cjs [file.mp4] [cols]
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const FF = process.env.FFMPEG || '/home/user/.cache/ffmpeg';
const FILE = process.argv[2] || path.join(ROOT, 'out', 'DAVID_THE_CHRONICLES_OF_VALOR_1280x720_60fps.mp4');
const COLS = parseInt(process.argv[3] || '4', 10);

// one still for every beat in the requested timeline
const TIMES = [
  [3, '00:03 eyes'], [12, '00:12 captain'], [24, '00:24 two attackers'], [36, '00:36 josheb'],
  [52, '00:52 eleazar'], [65, '00:65 shammah'], [78, '00:78 chariot'], [92, '00:92 grapple'],
  [105, '01:45 dual blades'], [118, '01:58 storm'], [132, '02:12 champion'], [147, '02:27 parry'],
  [160, '02:40 rout'], [170, '02:50 golden light'], [177, '02:57 title'],
];

(function main() {
  if (!fs.existsSync(FILE)) throw new Error('no such file ' + FILE);
  const dir = path.join(ROOT, 'probe');
  fs.mkdirSync(dir, { recursive: true });
  const stills = [];
  for (const [t, label] of TIMES) {
    const out = path.join(dir, `rev_${String(t).padStart(3, '0')}.jpg`);
    execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(t), '-i', FILE, '-frames:v', '1',
      '-vf', 'scale=640:-2', '-q:v', '3', out]);
    stills.push(out);
    console.log(String(label).padEnd(18), t + 's ->', path.basename(out), fs.statSync(out).size, 'bytes');
  }
  const tw = 480, th = Math.round(tw * 9 / 16);
  const rows = Math.ceil(stills.length / COLS);
  const sheet = path.join(dir, 'review.jpg');
  execFileSync(FF, ['-y', '-loglevel', 'error', ...stills.flatMap(f => ['-i', f]), '-filter_complex',
    `${stills.map((_, k) => `[${k}]scale=${tw}:${th}[b${k}]`).join(';')};`
    + `${stills.map((_, k) => `[b${k}]`).join('')}xstack=inputs=${stills.length}:`
    + `layout=${stills.map((_, k) => `${(k % COLS) * tw}_${Math.floor(k / COLS) * th}`).join('|')}[out]`,
    '-map', '[out]', sheet]);
  console.log('sheet', sheet, fs.statSync(sheet).size, 'bytes', `${COLS} x ${rows}`);
})();
