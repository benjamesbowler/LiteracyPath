import path from "node:path";

const QUEST_ACCEPTANCE_ARTIFACT_DIRECTORY = [".artifacts", "quest-acceptance"];

export function questAcceptanceReportPath(fileName, cwd = process.cwd()) {
  if (!fileName || path.basename(fileName) !== fileName) {
    throw new Error("Quest acceptance report names must be plain file names.");
  }
  return path.resolve(cwd, ...QUEST_ACCEPTANCE_ARTIFACT_DIRECTORY, fileName);
}
