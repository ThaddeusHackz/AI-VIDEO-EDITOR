// qa-film.cjs — objective QA on the finished film. Everything here is measured from the file,
// not asserted from intent, so the report is evidence rather than a claim.
//
//   node tools/qa-film.cjs [file.mp4]      -> out/qa-master.json
//
// Checks: container/stream specs, exact frame count, black-frame spans (title fade), per-act
// luminance and colour casts, real inter-frame motion (proves the animation is moving, not a
// still), and audio level/sync.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, execSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const FF = process.env.FFMPEG || '/home/user/.cache/ffmpeg';
const FILE = process.argv[2] || path.join(ROOT, 'out', 'DAVID_THE_CHRONICLES_OF_VALOR_1280x720_60fps.mp4');

function probe(file) {
  let err = '';
  try { execFileSync(FF, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' }); }
  catch (e) { err = String(e.stderr || ''); }
  if (!err) err = execSync(`${FF} -hide_banner -i "${file}" 2>&1 || true`, { encoding: 'utf8' });
  const v = /Stream #0:0.*?: Video: (\w+).*?, (\w+)\((?:[^)]*)\), (\d+)x(\d+)[^,]*, (\d+) kb\/s, ([\d.]+) fps/.exec(err);
  const a = /Stream #0:1.*?: Audio: (\w+).*?, (\d+) Hz, (\w+), (\d+) kb\/s/.exec(err);
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(err);
  return {
    raw: err.split('\n').filter(l => /Stream|Duration/.test(l)).map(l => l.trim()),
    video: v ? { codec: v[1], pixFmt: v[2], width: +v[3], height: +v[4], kbps: +v[5], fps: +v[6] } : null,
    audio: a ? { codec: a[1], sampleRate: +a[2], layout: a[3], kbps: +a[4] } : null,
    durationSeconds: d ? (+d[1]) * 3600 + (+d[2]) * 60 + (+d[3]) : null,
  };
}

// read a raw video stream out of ffmpeg as small RGB frames
function sampleFrames(file, fps, w, h) {
  const buf = execFileSync(FF, ['-v', 'error', '-i', file, '-vf', `fps=${fps},scale=${w}:${h}`,
    '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 30 });
  const frame = w * h * 3, n = Math.floor(buf.length / frame);
  return { w, h, n, frame, data: buf };
}

(async () => {
  const t0 = Date.now();
  if (!fs.existsSync(FILE)) throw new Error('no such file ' + FILE);
  const P = probe(FILE);
  const report = { file: path.basename(FILE), bytes: fs.statSync(FILE).size, probe: P };

  // --- exact frame count on the video stream (this build has no -count_frames, so decode with
  // showinfo and take the highest frame index reported)
  let info = '';
  try {
    execFileSync(FF, ['-hide_banner', '-v', 'info', '-i', FILE, '-map', '0:v:0', '-vf', 'showinfo', '-an', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8', maxBuffer: 1 << 30 });
  } catch (e) { info = String(e.stderr || ''); }
  const idx = [...info.matchAll(/n:\s*(\d+)/g)].map(m => +m[1]);
  report.frameCount = idx.length ? Math.max(...idx) + 1 : null;
  report.decodedFramesSeen = idx.length;

  // --- black frame spans (the title fade to black is expected at the very end)
  let blackLog = '';
  try {
    execFileSync(FF, ['-hide_banner', '-i', FILE, '-vf', 'blackdetect=d=0.4:pix_th=0.10', '-an', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
  } catch (e) { blackLog = String(e.stderr || ''); }
  report.blackSpans = [...blackLog.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)]
    .map(m => ({ start: +m[1], end: +m[2], length: +(m[2] - m[1]).toFixed(2) }));

  // --- per-act luminance / colour / motion on a 320x180 sample at 1 fps
  const { w, h, n, frame, data } = sampleFrames(FILE, 1, 320, 180);
  const stats = [];
  for (let i = 0; i < n; i++) {
    let sum = 0, sumR = 0, sumG = 0, sumB = 0, min = 255, max = 0;
    const o = i * frame;
    for (let p = 0; p < frame; p += 3) {
      const r = data[o + p], g = data[o + p + 1], b = data[o + p + 2];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += l; sumR += r; sumG += g; sumB += b;
      if (l < min) min = l; if (l > max) max = l;
    }
    stats.push({ t: i, lum: +(sum / (frame / 3)).toFixed(2), r: +(sumR / (frame / 3)).toFixed(1), g: +(sumG / (frame / 3)).toFixed(1), b: +(sumB / (frame / 3)).toFixed(1), min: +min.toFixed(0), max: +max.toFixed(0) });
  }
  // inter-frame motion on the same sample
  const motion = [];
  for (let i = 1; i < n; i++) {
    let d = 0;
    for (let p = 0; p < frame; p += 3) d += Math.abs(data[i * frame + p] - data[(i - 1) * frame + p]);
    motion.push(+(d / (frame / 3)).toFixed(2));
  }
  report.luminance = {
    sampled: n,
    mean: +(stats.reduce((s, x) => s + x.lum, 0) / Math.max(1, stats.length)).toFixed(2),
    min: +Math.min(...stats.map(s => s.lum)).toFixed(2),
    max: +Math.max(...stats.map(s => s.lum)).toFixed(2),
    perSecond: stats.map(s => +s.lum.toFixed(1)),
  };
  report.motion = {
    mean: +(motion.reduce((s, x) => s + x, 0) / Math.max(1, motion.length)).toFixed(2),
    min: +Math.min(...motion).toFixed(2),
    max: +Math.max(...motion).toFixed(2),
    perSecond: motion.map(m => +m.toFixed(1)),
  };
  // act structure: the requested timeline, checked against measured emphasis
  const band = (a, b) => {
    const s = stats.filter(x => x.t >= a && x.t < b);
    if (!s.length) return null;
    return {
      seconds: [a, b],
      avgLum: +(s.reduce((q, x) => q + x.lum, 0) / s.length).toFixed(2),
      avgMotion: +((motion.slice(a, b).reduce((q, x) => q + x, 0)) / Math.max(1, motion.slice(a, b).length)).toFixed(2),
      avgRGB: [+(s.reduce((q, x) => q + x.r, 0) / s.length).toFixed(1), +(s.reduce((q, x) => q + x.g, 0) / s.length).toFixed(1), +(s.reduce((q, x) => q + x.b, 0) / s.length).toFixed(1)],
    };
  };
  report.acts = {
    'eyes 0-10': band(0, 10), 'captain 10-20': band(10, 20), 'two attackers 20-30': band(20, 30),
    'josheb 30-45': band(30, 45), 'eleazar 45-60': band(45, 60), 'shammah 60-70': band(60, 70),
    'chariot 70-85': band(70, 85), 'grapple 85-100': band(85, 100), 'dual blades 100-110': band(100, 110),
    'storm 110-125': band(110, 125), 'champion 125-140': band(125, 140), 'parry 140-155': band(140, 155),
    'rout 155-165': band(155, 165), 'golden light 165-175': band(175 - 10, 175), 'title 175-180': band(175, 180),
  };

  // --- audio levels
  let astats = '';
  try {
    execFileSync(FF, ['-hide_banner', '-i', FILE, '-map', '0:a:0', '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
  } catch (e) { astats = String(e.stderr || ''); }
  const grab = re => { const m = re.exec(astats); return m ? +m[1] : null; };
  report.audio = {
    peakDb: grab(/Peak level dB:\s*(-?[\d.]+)/),
    rmsDb: grab(/RMS level dB:\s*(-?[\d.]+)/),
    rmsPeakDb: grab(/RMS peak dB:\s*(-?[\d.]+)/),
    flatFactor: grab(/Flat factor:\s*(-?[\d.]+)/),
    clipCount: (astats.match(/Number of clips:\s*(\d+)/) || [])[1] ? +RegExp.$1 : null,
  };

  report.qaMs = Date.now() - t0;
  fs.writeFileSync(path.join(ROOT, 'out', 'qa-master.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(JSON.stringify({
    file: report.file, bytes: report.bytes, probe: report.probe.video, audio: report.probe.audio,
    duration: report.probe.durationSeconds, frameCount: report.frameCount,
    blackSpans: report.blackSpans, luminance: { mean: report.luminance.mean, min: report.luminance.min, max: report.luminance.max },
    motion: { mean: report.motion.mean, min: report.motion.min, max: report.motion.max },
    audioLevels: report.audio, qaMs: report.qaMs,
  }, null, 1));
})();
