import { componentOutputSchema, timelineOutputSchema } from "./outputSchemas";

export interface InspectionTool {
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema: Record<string, unknown>;
}

const within = {
  type: "string",
  description: "Optional CSS selector restricting target lookup; omit for an unambiguous target.",
};
const target = {
  oneOf: [
    {
      type: "object",
      required: ["selector"],
      additionalProperties: false,
      properties: {
        selector: { type: "string", description: "CSS selector, such as #title or .word." },
        within,
      },
    },
    {
      type: "object",
      required: ["hfId"],
      additionalProperties: false,
      properties: {
        hfId: { type: "string", description: "Existing element data-hf-id value." },
        within,
      },
    },
    {
      type: "object",
      required: ["ref"],
      additionalProperties: false,
      properties: {
        ref: {
          type: "string",
          description:
            "Element ref returned by this inspector session; do not invent it. Rediscover after reload.",
        },
      },
    },
  ],
};
const generation = {
  type: "string",
  description:
    "Generation returned by the previous query. Use for continuation; if stale, query targets again.",
};
const offset = {
  type: "integer",
  minimum: 0,
  description: "Returned nextOffset for continuation; repeat the same query with its generation.",
};

export const componentsTool: InspectionTool = {
  description:
    "HyperFrames-native grep for element-related source. Retrieve related HTML/CSS/GSAP snippets with file paths and line numbers to understand, debug, or edit known elements without whole-file lookup. Batch targets. Shared code may affect other elements; unknown animation origins are explicit.",
  inputSchema: {
    type: "object",
    required: ["targets"],
    additionalProperties: false,
    properties: {
      targets: {
        type: "array",
        maxItems: 20,
        description: "Batch 1–20 targets. Use an empty array only when retrieving snippets by ID.",
        items: target,
      },
      descendants: {
        type: "boolean",
        default: true,
        description: "Include source related to descendant elements.",
      },
      maxBytes: {
        type: "integer",
        minimum: 2048,
        maximum: 256000,
        default: 12000,
        description:
          "Response budget in bytes. Whole snippets may be omitted; use returned continuation data or increase the budget.",
      },
      snippets: {
        type: "array",
        items: { type: "string" },
        description:
          "Snippet IDs returned by a prior query; requires its generation. May use targets: [].",
      },
      generation,
      offset,
      time: {
        type: "number",
        minimum: 0,
        description:
          "Optional exact preview seek in global seconds. Does not filter animations by time; omit for ordinary source lookup.",
      },
    },
  },
  outputSchema: componentOutputSchema,
};

export const timelineTool: InspectionTool = {
  description:
    "HyperFrames-native structured search for animation timing and activity. Use to find animations by time or boundary, including when the target element is unknown. Return scheduled HF entries and observed DOM-target GSAP timing, targets, properties and source locations, not full source blocks. Use at, range or boundary (at most one); omit all for the full schedule. Does not seek. Callbacks and unexecuted animation code are outside coverage.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      component: {
        ...target,
        description:
          "Optional element/component scope including descendants; omit for the full project. Uses the same target format as the components tool.",
      },
      at: {
        type: "number",
        minimum: 0,
        description:
          "Global second: active scheduled intervals use start <= at < end; includes instantaneous actions at that time.",
      },
      range: {
        type: "array",
        items: { type: "number", minimum: 0 },
        minItems: 2,
        maxItems: 2,
        description:
          "Global [start, end) seconds, start < end. Return intersecting scheduled intervals and instantaneous actions inside the range.",
      },
      boundary: {
        type: "number",
        minimum: 0,
        description:
          "Global second: return only actions crossing, starting, ending or instantaneous here. Later stagger members are excluded. Group spans are not simultaneous per-target schedules; match target labels and member intervals before inferring overlap.",
      },
      generation,
      offset,
    },
  },
  outputSchema: timelineOutputSchema,
};

export function toolContent(tool: "components" | "timeline", report: object & { text?: string }) {
  const text = tool === "timeline" && report.text ? report.text : JSON.stringify(report);
  return { content: [{ type: "text" as const, text }], structuredContent: report };
}
