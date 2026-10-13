import { Config } from "@remotion/cli/config";

// ── Output defaults ────────────────────────────────────────────────────────
Config.setVideoImageFormat("jpeg"); // faster frame capture; use "png" for alpha
Config.setOverwriteOutput(true);    // don't prompt when overwriting
Config.setCodec("h264");

// ── Sandbox is 2 cores / 1.9 GB — keep rendering serial ────────────────────
Config.setConcurrency(1);

// ── Share the browser HyperFrames already downloaded ───────────────────────
// Both engines need a headless Chromium. Reusing one copy in ~/.cache avoids a
// second ~260 MB download per session, and ~/.cache is excluded from workspace
// snapshots so neither copy counts against the save budget.
import { existsSync, readdirSync } from "fs";
import { join } from "path";

const shellRoot = join(
  process.env.HOME ?? "/home/user",
  ".cache/hyperframes/chrome/chrome-headless-shell",
);

if (existsSync(shellRoot)) {
  for (const dir of readdirSync(shellRoot)) {
    const candidate = join(
      shellRoot,
      dir,
      "chrome-headless-shell-linux64",
      "chrome-headless-shell",
    );
    if (existsSync(candidate)) {
      Config.setBrowserExecutable(candidate);
      break;
    }
  }
}
