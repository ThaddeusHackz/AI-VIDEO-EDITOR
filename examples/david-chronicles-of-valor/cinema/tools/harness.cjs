// harness.cjs — shared browser + static-server harness for the DAVID cinema renderer.
//
// The sandbox has no GPU and no system GL stack, so rendering runs through the
// Chromium binary shipped by @sparticuz/chromium with ANGLE/SwiftShader software
// WebGL (Vulkan backend). Chromium on Linux additionally needs NSPR/NSS shared
// libraries; tools/provision-renderer.sh assembles them into
// ~/.cache/chromium-libs (see that script for the exact sources).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const chromiumMod = require('@sparticuz/chromium');
const chromium = chromiumMod.default ?? chromiumMod;

const CACHE = process.env.AI_VIDEO_CACHE || '/home/user/.cache';
const LIBDIRS = [`${CACHE}/chromium-libs/aws`, `${CACHE}/chromium-libs/lib`, '/tmp'].join(':');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.wav': 'audio/wav', '.txt': 'text/plain', '.css': 'text/css',
};

function serve(root, threeDir, onPost) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(req.url.split('?')[0]);
      // streaming sink: lets the page hand finished frames to the caller as raw binary over
      // loopback instead of serialising them through the DevTools protocol
      if (req.method === 'POST' && onPost && p === onPost.path) { onPost.handler(req, res); return; }
      let file;
      if (p.startsWith('/three/')) file = path.join(threeDir, p.slice('/three/'.length));
      else if (p === '/') file = path.join(root, 'tools/render.html');
      else file = path.join(root, p);
      if (!path.resolve(file).startsWith(path.resolve(path.dirname(threeDir)))) {
        if (!path.resolve(file).startsWith(path.resolve(root))) { res.writeHead(403); res.end('forbidden'); return; }
      }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function launch(opts = {}) {
  const root = opts.root;
  const threeDir = path.join(root, 'node_modules/three');
  const server = await serve(root, threeDir, opts.onPost);
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    env: { ...process.env, LD_LIBRARY_PATH: LIBDIRS },
    args: [...chromium.args, '--disable-dev-shm-usage', '--hide-scrollbars', '--mute-audio',
      `--window-size=${opts.windowWidth || 1280},${opts.windowHeight || 720}`],
    headless: 'shell',
    protocolTimeout: opts.protocolTimeout || 0,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: opts.windowWidth || 1280, height: opts.windowHeight || 720, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', m => { const t = m.text(); if (!/GL Driver|deprecat/i.test(t)) logs.push('[page] ' + t.slice(0, 240)); });
  page.on('pageerror', e => logs.push('[pageerror] ' + String(e).slice(0, 400)));
  return {
    browser, page, port, server, logs, root,
    url: p => `http://127.0.0.1:${port}${p}`,
    async close() { try { await browser.close(); } catch {} server.close(); },
  };
}

module.exports = { launch, serve, chromium, LIBDIRS };
