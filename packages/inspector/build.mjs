// Builds the inspector for Node and for the page. Bun runs the TypeScript sources directly (package.json "bun").
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { build } from "esbuild";

const at = (path) => new URL(path, import.meta.url).pathname;
const { dependencies } = JSON.parse(readFileSync(at("./package.json"), "utf8"));
// Declared dependencies stay imports; the workspace's own sources (core, parsers) are bundled in.
const external = Object.keys(dependencies).filter((name) => !name.startsWith("@hyperframes/"));
// Bundled CommonJS dependencies call require(); an ES module has none until the banner defines it.
const banner = {
  js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
};
const node = { bundle: true, platform: "node", format: "esm", target: "node22", external, banner };

await Promise.all([
  build({ ...node, entryPoints: [at("./src/live.ts")], outfile: at("./dist/live.js") }),
  build({ ...node, entryPoints: [at("./src/service.ts")], outfile: at("./dist/service.js") }),
  build({ ...node, entryPoints: [at("./src/server.ts")], outfile: at("./dist/server.js") }),
  build({ ...node, entryPoints: [at("./src/mcp.ts")], outfile: at("./dist/mcp.js") }),
  build({
    entryPoints: [at("./src/liveRuntime.ts")],
    outfile: at("./dist/inspection.js"),
    bundle: true,
    platform: "browser",
    format: "iife",
  }),
]);
// Declarations keep the packages/ layout under dist/types, so their relative imports still resolve once packed.
rmSync(at("./dist/types"), { recursive: true, force: true });
const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
execFileSync(process.execPath, [tsc, "-p", at("./tsconfig.types.json")], { stdio: "inherit" });
// tsc emits declarations for TypeScript only; the element map's JavaScript ships its own.
copyFileSync(at("./src/elementMap.d.ts"), at("./dist/types/inspector/src/elementMap.d.ts"));
addDeclarationExtensions(at("./dist/types"));

// NodeNext consumers reject extensionless relative imports, and tsc keeps the source's bundler-style ones.
function addDeclarationExtensions(dir) {
  for (const entry of readdirSync(dir, { recursive: true })) {
    const file = join(dir, entry);
    if (!file.endsWith(".d.ts")) continue;
    const source = readFileSync(file, "utf8");
    const rewritten = source.replace(
      /((?:from|import\()\s*["'])(\.{1,2}\/[^"']*)(["'])/g,
      (whole, open, specifier, close) => {
        const target = resolveDeclaration(dirname(file), specifier);
        return target ? open + target + close : whole;
      },
    );
    if (rewritten !== source) writeFileSync(file, rewritten);
  }
}

function resolveDeclaration(from, specifier) {
  if (/\.[cm]?js$/.test(specifier)) return undefined;
  if (existsSync(join(from, `${specifier}.d.ts`))) return `${specifier}.js`;
  if (existsSync(join(from, specifier, "index.d.ts"))) return `${specifier}/index.js`;
  throw new Error(`No declaration for ${specifier} imported from ${from}`);
}
