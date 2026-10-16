// render-film.cjs — render a frame range of the DAVID film and stream it into ffmpeg.
//
//   node tools/render-film.cjs <startFrame> <endFrame> <outFile> [scale] [quality] [batch]
//
// Rendering runs in headless Chromium (ANGLE/SwiftShader software WebGL). Two engineering
// constraints shape this file:
//   1. under software GL every synchronous read is a full pipeline flush (~600 ms), while the
//      raster itself is far cheaper, so frames are rendered in batches with no reads and read
//      back once the batch has drained;
//   2. serialising megabyte frames through DevTools base64 is the real bottleneck at 1080p+, so
//      each finished batch is POSTed as raw binary to a loopback endpoint on the harness server,
//      which pipes it straight into ffmpeg's stdin. No base64, no disk churn.
const path = require('node:path'), { spawn } = require('node:child_process');
const { launch } = require('./harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const FF = process.env.FFMPEG || '/home/user/.cache/ffmpeg';
const START = parseInt(process.argv[2], 10);
const END = parseInt(process.argv[3], 10);
const OUT = process.argv[4];
const SCALE = process.argv[5] || '0.3334';
const QUALITY = process.argv[6] || '0.6';
const BATCH = parseInt(process.argv[7] || '0', 10);
const FPS = 60;
let H = null;

(async () => {
  const sink = { ff: null, bytes: 0 };             // ffmpeg is started once the frame size is known

  H = await launch({
    root: ROOT, windowWidth: 1280, windowHeight: 720, protocolTimeout: 0,
    onPost: {
      path: '/__frames',
      handler: (req, res) => {
        if (!req.socket.setMaxListeners) { /* node >= 12 always has it */ }
        req.socket.setMaxListeners(0);
        const ff = sink.ff;
        if (!ff || !ff.stdin.writable) { req.resume(); res.writeHead(409); res.end('not-ready'); return; }
        req.on('data', chunk => { sink.bytes += chunk.length; if (!ff.stdin.write(chunk)) req.pause(); });
        ff.stdin.on('drain', () => req.resume());
        req.on('end', () => { res.writeHead(200, { 'content-type': 'text/plain' }); res.end('ok'); });
        req.on('error', () => { try { res.writeHead(500); res.end('err'); } catch {} });
      },
    },
  });

  await H.page.goto(H.url(`/tools/render.html?scale=${SCALE}&quality=${QUALITY}`), { waitUntil: 'load', timeout: 240000 });
  await H.page.waitForFunction('window.__status === "ready" || String(window.__status).startsWith("error")', { timeout: 900000, polling: 500 });
  const st = await H.page.evaluate('window.__status');
  if (st !== 'ready') throw new Error('film init failed: ' + st);
  const [w, h] = await H.page.evaluate('window.__leanSize()');

  sink.ff = spawn(FF, [
    '-y', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-r', String(FPS), '-i', 'pipe:0',
    '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p',
    '-x264-params', 'keyint=120:min-keyint=120:scenecut=0', '-movflags', '+faststart',
    OUT,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const px = w * h;
  const batchSize = BATCH || (px > 2880 * 1620 ? 2 : px > 1920 * 1080 ? 3 : px > 960 * 540 ? 6 : 10);
  console.log(`frames ${START}..${END} at ${w}x${h}, batch ${batchSize} -> ${OUT}`);

  const t0 = Date.now();
  const total = END - START;
  let done = 0;
  await H.page.evaluate((s) => { window.__film.warmTo(s, 2); }, START);

  for (let f = START; f < END; f += batchSize) {
    const n = Math.min(batchSize, END - f);
    // 1) render the batch: no reads, so the CPU is never blocked on the software rasteriser
    await H.page.evaluate(([first, count]) => {
      const film = window.__film;
      for (let i = 0; i < count; i++) { film.setFrame(first + i); film.renderLean(); }
    }, [f, n]);
    // 2) read once the batch has drained, flip to top-down, POST the raw bytes to ffmpeg
    await H.page.evaluate(async ([count]) => {
      const film = window.__film, rt = film.gradeRT, w = rt.width, h = rt.height;
      const stride = w * h * 4;
      const raw = new Uint8Array(stride * count);
      for (let i = 0; i < count; i++) {
        film.renderer.readRenderTargetPixels(rt, 0, 0, w, h, raw.subarray(i * stride, (i + 1) * stride));
      }
      const out = new Uint8Array(raw.length);
      const rowBytes = w * 4;
      for (let i = 0; i < count; i++) {
        const base = i * stride;
        for (let y = 0; y < h; y++) {
          out.set(raw.subarray(base + (h - 1 - y) * rowBytes, base + (h - y) * rowBytes), base + y * rowBytes);
        }
      }
      const resp = await fetch('/__frames', { method: 'POST', body: new Blob([out], { type: 'application/octet-stream' }) });
      if (!resp.ok) throw new Error('sink ' + resp.status);
    }, [n]);
    done += n;
    if (done % Math.max(batchSize * 8, 60) < batchSize || done === total) {
      const el = (Date.now() - t0) / 1000, rate = done / el;
      console.log(`  ${done}/${total} frames  ${rate.toFixed(2)} fps  elapsed ${(el / 60).toFixed(1)} min  eta ${((total - done) / Math.max(rate, 1e-6) / 60).toFixed(1)} min  piped ${(sink.bytes / 1048576).toFixed(1)} MB`);
    }
  }
  sink.ff.stdin.end();
  await new Promise(res => sink.ff.on('close', res));
  console.log(`done ${OUT} in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  await H.close();
  process.exit(0);
})().catch(async e => {
  console.error('FAIL', e.message);
  if (H && H.logs.length) console.error(H.logs.slice(0, 25).join('\n'));
  process.exit(1);
});
