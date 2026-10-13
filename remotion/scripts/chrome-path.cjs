// Resolve a Chromium binary that works inside the sandbox (no Google CDN access):
// @sparticuz/chromium ships a brotli-compressed Chromium + its shared libs on npm.
// The lib tarball only auto-extracts on Amazon Linux, so we inflate it ourselves.
// Usage: node scripts/chrome-path.cjs        -> prints executable path
//        node scripts/chrome-path.cjs --ld   -> prints LD_LIBRARY_PATH dir to export
const path = require("node:path");
const os = require("node:os");
const mod = require("@sparticuz/chromium");
const chromium = mod.default ?? mod;
const bin = path.join(path.dirname(require.resolve("@sparticuz/chromium")), "..", "bin");
(async () => {
  const exe = await chromium.executablePath();
  await mod.inflate(path.join(bin, "al2023.tar.br"));
  const libDir = path.join(os.tmpdir(), "al2023", "lib");
  if (process.argv.includes("--ld")) process.stdout.write(libDir + "\n");
  else process.stdout.write(exe + "\n");
})().catch((e) => { console.error(e); process.exit(1); });
