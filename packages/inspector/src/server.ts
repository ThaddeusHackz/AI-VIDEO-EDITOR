import { createServer } from "node:http";
import { Inspector } from "./service";
import type { InspectRequest } from "./types";

const project = process.argv[2];
if (!project)
  throw new Error("Usage: server PROJECT [PORT] (bun src/server.ts, or node dist/server.js)");
const inspector = new Inspector(project);
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.headers.origin) {
    res.writeHead(403).end(JSON.stringify({ error: "browser_origin_not_allowed" }));
    return;
  }
  if (req.method === "GET" && req.url === "/info") {
    res.end(
      JSON.stringify({
        project: inspector.project,
        capability: "inspect_components",
        stats: inspector.stats,
      }),
    );
    return;
  }
  if (req.method !== "POST" || !["/inspect", "/timeline", "/element-map"].includes(req.url ?? "")) {
    res.writeHead(404).end();
    return;
  }
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 64_000) throw new Error("request_too_large");
      chunks.push(chunk);
    }
    const request: InspectRequest = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    if (req.url === "/element-map") res.end(JSON.stringify(await inspector.elementMap()));
    else if (req.url === "/timeline") res.end(JSON.stringify(await inspector.timeline(request)));
    else res.end(JSON.stringify(await inspector.inspect(request)));
  } catch (error) {
    res.writeHead(error instanceof Error && error.message === "no-composition" ? 404 : 400).end(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && error.message === "no-composition"
          ? { code: "no-composition" }
          : {}),
      }),
    );
  }
});
server.listen(Number(process.argv[3] ?? 0), "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string")
    console.log(
      JSON.stringify({ url: `http://127.0.0.1:${address.port}`, project: inspector.project }),
    );
});
async function close() {
  server.close();
  await inspector.dispose();
}
process.once("SIGINT", () => {
  void close();
});
process.once("SIGTERM", () => {
  void close();
});
