const string = { type: "string" };
const number = { type: "number" };
const boolean = { type: "boolean" };
const array = (items: object) => ({ type: "array", items });
const nullable = (schema: object) => ({ oneOf: [schema, { type: "null" }] });
const object = (properties: Record<string, object>, optional: string[] = []) => ({
  type: "object",
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  additionalProperties: false,
});
const element = object({
  ref: string,
  tag: string,
  id: string,
  hfId: nullable(string),
  classes: array(string),
  composition: nullable(string),
});
const snippet = object({
  id: string,
  file: string,
  startLine: number,
  endLine: number,
  kind: array(string),
  targets: array(number),
  code: string,
  uniqueInFile: boolean,
});
export const componentOutputSchema = object(
  {
    generation: string,
    sourceVersion: string,
    reused: boolean,
    visualState: object({ time: number, duration: number }, ["time", "duration"]),
    results: array(
      object({
        target: number,
        status: {
          type: "string",
          enum: ["found", "missing", "ambiguous", "stale-ref", "invalid-selector"],
        },
        candidates: array(element),
        candidatesOmitted: number,
        animations: number,
        coTargets: array(element),
        unmappedAnimations: number,
        scopeTruncated: boolean,
      }),
    ),
    snippets: array(snippet),
    omitted: array(object({ id: string, bytes: number })),
    omittedCount: number,
    nextOffset: nullable(number),
    coverage: array(string),
    recordLimitReached: boolean,
    hooked: boolean,
    debugAvailable: boolean,
    elapsedMs: number,
  },
  ["visualState"],
);
const declaredValue = object({
  kind: { type: "string", enum: ["literal", "relative", "expression", "unknown"] },
  value: { oneOf: [number, string, { type: "null" }] },
});
const animationValues = object({
  basis: { type: "string", enum: ["authored-tween"] },
  properties: array(object({ property: string, from: declaredValue, to: declaredValue })),
  ease: declaredValue,
});
export const timelineOutputSchema = object({
  text: string,
  generation: string,
  reused: boolean,
  status: string,
  candidates: array(element),
  events: array(
    object(
      {
        kind: { type: "string", enum: ["animation", "item"] },
        relation: string,
        component: nullable(element),
        targets: array(element),
        properties: array(string),
        values: animationValues,
        start: number,
        end: number,
        sources: array(object({ file: string, line: number })),
      },
      ["values"],
    ),
  ),
  eventCount: number,
  groupCount: number,
  nextOffset: nullable(number),
  warnings: array(string),
});
