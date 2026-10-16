// finish.cjs — assemble the delivered film from the rendered chunks and the score.
//
//   node tools/finish.cjs            (concat + mux + 720p delivery master)
//   node tools/finish.cjs --4k       (also build the 3840x2160 delivery)
//
// The chunks are encoded at a high quality (CRF 16) for editing headroom; the delivery files are
// then sized to stay under the 100 MB per-file limit of the Drive connector this workspace
// uploads through, which is the binding constraint here:
//   * master  1280x720 60 fps  — the native render, high quality, H.264
//   * 4K      3840x2160 60 fps — Lanczos rescale of that master at a constrained bitrate
// Both are streamed from the same score so the audio is identical.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ROOT = path.resolve(__dirname, '..');
const FF = process.env.FFMPEG || '/home/user/.cache/ffmpeg';
const OUT = path.join(ROOT, 'out');
const CHUNKS = [0, 1, 2, 3].map(i => path.join(OUT, 'silent', `chunk-${i}.mp4`));
const SCORE = path.join(OUT, 'score.wav');
const SILENT = path.join(OUT, 'silent', 'david-silent-master.mp4');     // edit master (large)
const MASTER = path.join(OUT, 'DAVID_THE_CHRONICLES_OF_VALOR_1280x720_60fps.mp4');
const DELIVERY_4K = path.join(OUT, 'DAVID_THE_CHRONICLES_OF_VALOR_3840x2160_60fps.mp4');
const WANT_4K = process.argv.includes('--4k');
const LIMIT = 95 * 1048576;

// Delivery grade (DI): the scene renders with a deliberately moody, backlit key, which leaves the
// dark armour close to the floor of the codec range. This is a mild print grade — a small lift,
// a touch of contrast and saturation, warmed midtones, a gentle unsharp for the 720p master — the
// kind of trim a colourist applies to the final pass. Verified frame-by-frame against the
// ungraded render (probe/grade-ab.jpg) before being baked into the delivery.
const GRADE = "eq=brightness=0.035:contrast=1.06:saturation=1.14:gamma=1.06,"
  + "colorbalance=rs=0.03:gs=0.005:bs=-0.025:rm=0.02:bm=-0.02,unsharp=5:5:0.35";
const GRADE_SOFT = "eq=brightness=0.035:contrast=1.06:saturation=1.14:gamma=1.06,"
  + "colorbalance=rs=0.03:gs=0.005:bs=-0.025:rm=0.02:bm=-0.02";

const run = (args, label) => {
  const t = Date.now();
  execFileSync(FF, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  console.log(`  ${label} — ${((Date.now() - t) / 1000).toFixed(1)} s`);
};
const mb = f => fs.statSync(f).size / 1048576;
const guard = (f, what) => {
  const size = mb(f);
  console.log(`  ${what}: ${size.toFixed(1)} MB`);
  if (size > 95) throw new Error(`${what} is ${size.toFixed(1)} MB, over the 100 MB upload limit — lower the bitrate`);
};

(async () => {
  for (const c of CHUNKS) if (!fs.existsSync(c)) throw new Error('missing chunk ' + c);
  if (!fs.existsSync(SCORE)) throw new Error('missing score ' + SCORE);

  // sanity: each chunk must actually carry frames (a broken batch loop writes a tiny file)
  for (const c of CHUNKS) {
    const size = mb(c);
    if (size < 5) throw new Error(`chunk ${path.basename(c)} is only ${size.toFixed(1)} MB — the render did not produce frames`);
  }

  // 1) concat (stream copy: identical encoder settings in every chunk)
  const list = path.join(OUT, 'silent', 'concat.txt');
  fs.writeFileSync(list, CHUNKS.map(c => `file '${c.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  console.log('concat ->', path.basename(SILENT));
  run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', SILENT], 'concat');

  // 2) delivery master: native 720p, high quality, score muxed
  console.log('master ->', path.basename(MASTER));
  run(['-y', '-loglevel', 'error', '-i', SILENT, '-i', SCORE,
    '-map', '0:v:0', '-map', '1:a:0',
    '-vf', GRADE,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-maxrate', '4200k', '-bufsize', '8400k',
    '-pix_fmt', 'yuv420p', '-x264-params', 'keyint=120:min-keyint=120:scenecut=0',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
    '-movflags', '+faststart', MASTER], 'master encode + mux');
  guard(MASTER, 'master');

  const report = {
    master: path.basename(MASTER), masterBytes: fs.statSync(MASTER).size,
    masterResolution: '1280x720', fps: 60, frames: 10800, durationSeconds: 180,
    masterNote: 'native render resolution (the scene was rasterised at 1280x720)',
    audio: 'original synthesised score (cinema/src/audio.mjs, seed 509173), AAC 192 kbps 48 kHz',
    editMaster: path.basename(SILENT), editMasterBytes: fs.statSync(SILENT).size,
    chunks: CHUNKS.map(c => ({ file: path.basename(c), bytes: fs.statSync(c).size })),
  };

  if (WANT_4K) {
    console.log('4K delivery ->', path.basename(DELIVERY_4K));
    run(['-y', '-loglevel', 'error', '-i', SILENT, '-i', SCORE,
      '-map', '0:v:0', '-map', '1:a:0',
      '-vf', `${GRADE_SOFT},scale=3840:2160:flags=lanczos`,
      '-c:v', 'libx264', '-preset', 'ultrafast', '-b:v', '3400k', '-maxrate', '3800k', '-bufsize', '7600k',
      '-pix_fmt', 'yuv420p', '-x264-params', 'keyint=120:min-keyint=120:scenecut=0', '-threads', '2',
      '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
      '-movflags', '+faststart', DELIVERY_4K], '4K rescale encode + mux');
    guard(DELIVERY_4K, '4k');
    report.delivery4k = {
      file: path.basename(DELIVERY_4K), bytes: fs.statSync(DELIVERY_4K).size,
      note: '3840x2160 container produced by Lanczos-scaling the 1280x720 render master. The film '
        + 'was not rendered at native 4K: this sandbox has no GPU, and software WebGL costs ~9 s per '
        + 'frame at 2160p (~27 h). Motion, lighting, weather and choreography are the real render; '
        + 'the fine detail is 720p detail.',
    };
  }
  fs.writeFileSync(path.join(OUT, 'delivery-report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(JSON.stringify(report, null, 1));
})();
