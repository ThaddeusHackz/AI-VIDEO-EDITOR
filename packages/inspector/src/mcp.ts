import { createInterface } from "node:readline";
import { componentsTool, timelineTool as timelineDefinition, toolContent } from "./tools";

const url = process.env.HF_INSPECT_URL;
if (!url || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url))
  throw new Error("Set HF_INSPECT_URL to the local HF inspection service URL.");
const tool = { name: "inspect_components", ...componentsTool };
const timelineTool = { name: "inspect_timeline", ...timelineDefinition };
const input = createInterface({ input: process.stdin });
for await (const line of input) {
  let id: string | number | null = null;
  try {
    const message = JSON.parse(line);
    if (message.id == null) continue;
    id = message.id;
    let result: unknown;
    if (message.method === "initialize")
      result = {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "hyperframes-inspector", version: "0.1.0" },
      };
    else if (message.method === "ping") result = {};
    else if (message.method === "tools/list") result = { tools: [tool, timelineTool] };
    else if (
      message.method === "tools/call" &&
      [tool.name, timelineTool.name].includes(message.params?.name)
    ) {
      const response = await fetch(
        `${url}/${message.params.name === timelineTool.name ? "timeline" : "inspect"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.params.arguments),
          signal: AbortSignal.timeout(60_000),
        },
      );
      const body = await response.text();
      result = response.ok
        ? {
            ...toolContent(
              message.params.name === timelineTool.name ? "timeline" : "components",
              JSON.parse(body),
            ),
            isError: false,
          }
        : { content: [{ type: "text", text: body }], isError: true };
    } else {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32601, message: "Method not found" },
        }) + "\n",
      );
      continue;
    }
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }) + "\n");
  } catch (error) {
    process.stdout.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id,
        error: { code: -32603, message: error instanceof Error ? error.message : String(error) },
      }) + "\n",
    );
  }
}
