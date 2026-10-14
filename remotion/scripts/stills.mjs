// Render several stills of one composition with a single bundle + browser.
// Usage: node scripts/stills.mjs <CompositionId> <outDir> <scale> <frame> [frame ...]
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const [compId, outDir, scaleArg, ...frameArgs] = process.argv.slice(2);
if (!compId || !outDir || frameArgs.length === 0) {
  console.error("usage: node scripts/stills.mjs <CompositionId> <outDir> <scale> <frame...>");
  process.exit(1);
}
const scale = Number(scaleArg ?? "0.5");
const inputProps = process.env.ZW_PROPS ? JSON.parse(process.env.ZW_PROPS) : {};
const frames = frameArgs.map((f) => Number(f));
const root = path.resolve(process.cwd());
const browserExecutable = path.join(root, "scripts", "chrome-wrapper.sh");
fs.mkdirSync(outDir, { recursive: true });

const t0 = Date.now();
const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts"), publicDir: path.join(root, "public") });
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const browser = await openBrowser("chrome", { browserExecutable, chromiumOptions: { gl: "angle" } });
const composition = await selectComposition({ serveUrl, id: compId, puppeteerInstance: browser, browserExecutable, timeoutInMilliseconds: 180000, inputProps });
for (const frame of frames) {
  const t1 = Date.now();
  const output = path.join(outDir, `f${String(frame).padStart(4, "0")}.jpg`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    scale,
    imageFormat: "jpeg",
    jpegQuality: 86,
    puppeteerInstance: browser,
    browserExecutable,
    timeoutInMilliseconds: 180000,
    chromiumOptions: { gl: "angle" },
    inputProps,
  });
  console.log(`frame ${frame} -> ${output} (${((Date.now() - t1) / 1000).toFixed(1)}s)`);
}
await browser.close({ silent: true });
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
