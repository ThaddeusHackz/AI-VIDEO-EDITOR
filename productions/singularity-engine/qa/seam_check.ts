/**
 * seam_check.ts — the Remotion-side Seam Gate for The Singularity Engine.
 *
 * The HyperFrames seam gate (scripts/seam-gate.mjs) verifies HyperFrames projects by sampling the live DOM. The
 * Remotion master composites its shots with remotion/src/singularity/components/seamPose.ts, so this checker runs
 * the SAME pure functions in Node and verifies every cut of the Vector Ledger (timeline.json → cuts) numerically,
 * using the motion-doctrine rules:
 *   ledger        axis + signed direction declared                       (FAIL)
 *   exit-moving   outgoing wrapper still moving on its last frame         (FAIL)
 *   entry-moving  incoming wrapper mid-flight on its first frame          (FAIL)
 *   exit/entry-direction   measured sign == ledger dir (Z = sign of d(scale)/dt) (FAIL)
 *   zero-overlap  exactly one side visible per frame                      (FAIL)
 *   speed-match   |v_entry| / |v_exit| within 0.5 … 2.0                   (WARN)
 * The final snap-to-black (a reserved stillness cut) is reported, not gated.
 *
 * Run: productions/singularity-engine/qa/seam_check.sh
 */
import timeline from "../../../remotion/src/singularity/timeline.json";
import { seamPose } from "../../../remotion/src/singularity/components/seamPose";
import type { Cut } from "../../../remotion/src/singularity/data";

type Row = { id: string; cut: number; seam: string; checks: Array<[string, "PASS" | "FAIL" | "WARN" | "INFO", string]> };

const u = 1;
const rows: Row[] = [];
let fails = 0;
let warns = 0;

const value = (axis: string, p: ReturnType<typeof seamPose>) => (axis === "x" ? p.translateX : axis === "y" ? p.translateY : p.scale);

for (const cut of timeline.cuts as Cut[]) {
  const row: Row = { id: `cut@${cut.frame}`, cut: cut.frame, seam: cut.seam, checks: [] };
  rows.push(row);
  if (cut.seam === "match-cut") {
    const out = seamPose(cut, cut.frame, "outgoing", u);
    const inc = seamPose(cut, cut.frame - 1, "incoming", u);
    row.checks.push(["zero-overlap", !out.visible && !inc.visible ? "PASS" : "FAIL", "one side visible per frame"]);
    row.checks.push(["carrier", "INFO", String((cut as Cut & { carrier?: string }).carrier ?? "")]);
    if (out.visible || inc.visible) fails++;
    continue;
  }
  if (cut.seam === "hard-cut-to-black") {
    const out = seamPose(cut, cut.frame, "outgoing", u);
    const inc = seamPose(cut, cut.frame - 1, "incoming", u);
    row.checks.push(["zero-overlap", !out.visible && !inc.visible ? "PASS" : "FAIL", "one side visible per frame"]);
    row.checks.push(["stillness-cut", "INFO", "reserved snap-to-black (FILM.md §5) — vector rules intentionally not applied"]);
    if (out.visible || inc.visible) fails++;
    continue;
  }
  const f = cut.frame;
  const ledgerOk = ["x", "y", "z"].includes(cut.axis) && (cut.dir === 1 || cut.dir === -1);
  row.checks.push(["ledger", ledgerOk ? "PASS" : "FAIL", `${cut.axis}${cut.dir > 0 ? "+" : "-"}`]);
  const o1 = seamPose(cut, f - 2, "outgoing", u);
  const o2 = seamPose(cut, f - 1, "outgoing", u);
  const oAt = seamPose(cut, f, "outgoing", u);
  const i0 = seamPose(cut, f, "incoming", u);
  const i1 = seamPose(cut, f + 1, "incoming", u);
  const iBefore = seamPose(cut, f - 1, "incoming", u);
  const vExit = value(cut.axis, o2) - value(cut.axis, o1);
  const vEntry = value(cut.axis, i1) - value(cut.axis, i0);
  const eps = cut.axis === "z" ? 1e-4 : 0.05;
  const checks: Array<[string, boolean, string]> = [
    ["exit-moving", Math.abs(vExit) > eps, `v=${vExit.toFixed(4)}/frame`],
    ["entry-moving", Math.abs(vEntry) > eps, `v=${vEntry.toFixed(4)}/frame`],
    ["exit-direction", Math.sign(vExit) === cut.dir, `sign ${Math.sign(vExit)} vs ledger ${cut.dir}`],
    ["entry-direction", Math.sign(vEntry) === cut.dir, `sign ${Math.sign(vEntry)} vs ledger ${cut.dir}`],
    ["zero-overlap", !oAt.visible && !iBefore.visible, "one side visible per frame"],
  ];
  for (const [name, ok, msg] of checks) {
    row.checks.push([name, ok ? "PASS" : "FAIL", msg]);
    if (!ok) fails++;
  }
  if (!ledgerOk) fails++;
  const ratio = Math.abs(vEntry) / Math.max(1e-9, Math.abs(vExit));
  const sm = ratio >= 0.5 && ratio <= 2.0;
  row.checks.push(["speed-match", sm ? "PASS" : "WARN", `ratio ${ratio.toFixed(2)}`]);
  if (!sm) warns++;
}

for (const r of rows) {
  const bad = r.checks.some((c) => c[1] === "FAIL");
  console.log(`\n■ ${r.id}  ${r.seam}  ${bad ? "✗" : "✓"}`);
  for (const [name, status, msg] of r.checks) console.log(`   ${status.padEnd(4)} ${name.padEnd(16)} ${msg}`);
}
console.log(`\nREMOTION SEAM GATE: ${fails ? "FAILED" : "PASSED"} — ${fails} fail, ${warns} warn across ${rows.length} cuts`);
process.exit(fails ? 1 : 0);
