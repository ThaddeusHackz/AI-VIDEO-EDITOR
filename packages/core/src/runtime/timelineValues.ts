export interface DeclaredValue {
  kind: "literal" | "relative" | "expression" | "unknown";
  value: number | string | null;
}
export interface AnimationValues {
  basis: "authored-tween";
  properties: Array<{ property: string; from: DeclaredValue; to: DeclaredValue }>;
  ease: DeclaredValue;
}
const unknown = (): DeclaredValue => ({ kind: "unknown", value: null });
function declared(value: unknown): DeclaredValue {
  if (typeof value === "number" && Number.isFinite(value)) return { kind: "literal", value };
  if (typeof value === "string") {
    const kind = /^[+\-*/]=/.test(value)
      ? "relative"
      : value.includes("random(")
        ? "expression"
        : "literal";
    return { kind, value };
  }
  return unknown();
}
/** Authored endpoints, never sampled values or inferred previous-tween state. */
export function animationValues(
  vars: Record<string, unknown>,
  properties: string[],
): AnimationValues {
  const startAt =
    vars.startAt && typeof vars.startAt === "object"
      ? (vars.startAt as Record<string, unknown>)
      : {};
  return {
    basis: "authored-tween",
    properties: properties.map((property) => ({
      property,
      from: declared(vars.runBackwards ? vars[property] : startAt[property]),
      to: vars.runBackwards ? unknown() : declared(vars[property]),
    })),
    ease: declared(vars.ease),
  };
}
