// Extracts the @sparticuz/chromium headless binary (brotli-packed) to /tmp and prints its path.
// Used by scripts/chrome-wrapper.sh so Remotion can render inside sandboxes where Chrome
// cannot be auto-downloaded. Install once: npm i --no-save @sparticuz/chromium@153.0.0
//
// The package only unpacks its bundled shared libraries (nss, nspr, …) when it thinks it is on
// Amazon Linux 2023; we always need them here, so inflate al2023.tar.br explicitly.
const path = require("path");
const fs = require("fs");
const mod = require("@sparticuz/chromium");
const chromium = mod.default && mod.default.executablePath ? mod.default : mod;
const inflate = mod.inflate;
const bin = path.join(path.dirname(require.resolve("@sparticuz/chromium")), "..", "bin");

(async () => {
  const exe = await chromium.executablePath();
  if (!fs.existsSync("/tmp/al2023/lib")) {
    await inflate(path.join(bin, "al2023.tar.br"));
  }
  process.stdout.write(exe);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
