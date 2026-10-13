import { beginArtifactCapture } from "@hyperframes/studio-server/history";
import { withOwner } from "./historyOwner.js";

export async function captureArtifactRevision(projectDir: string) {
  return withOwner(projectDir, async (owner) => {
    await owner.checkpoint();
    return beginArtifactCapture(projectDir);
  });
}
