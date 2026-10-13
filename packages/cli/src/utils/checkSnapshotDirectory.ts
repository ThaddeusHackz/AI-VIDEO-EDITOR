import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";

const runDirectories = new Map<string, string>();

export function checkSnapshotDirectory(projectDir: string): string {
  const project = resolve(projectDir);
  let directory = runDirectories.get(project);
  if (!directory) {
    directory = join(project, ".hyperframes", "artifacts", "snapshots", randomUUID());
    runDirectories.set(project, directory);
  }
  return directory;
}
