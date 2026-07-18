import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VITE_BIN = path.join(PROJECT_ROOT, "node_modules/vite/bin/vite.js");

export const UPDATE_FIXTURES = Object.freeze({
  a: path.join(PROJECT_ROOT, "dist-quest-update-a"),
  b: path.join(PROJECT_ROOT, "dist-quest-update-b")
});

function buildFixture(name, outDir) {
  const result = spawnSync(process.execPath, [VITE_BIN, "build", "--outDir", outDir, "--emptyOutDir"], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      QUEST_RELEASE_PREVIEW: "true",
      QUEST_OFFLINE_BUILD_VARIANT: `quest-update-${name}`
    },
    stdio: "inherit"
  });
  if (result.status !== 0) throw new Error(`Sound Seekers update fixture ${name} failed to build`);
}

export function fixtureBuildRecord(name) {
  return JSON.parse(readFileSync(path.join(UPDATE_FIXTURES[name], "offline-build.json"), "utf8"));
}

export function buildQuestOfflineUpdateFixtures() {
  buildFixture("a", UPDATE_FIXTURES.a);
  buildFixture("b", UPDATE_FIXTURES.b);
  const a = fixtureBuildRecord("a");
  const b = fixtureBuildRecord("b");
  if (!a.buildId || !b.buildId || a.buildId === b.buildId) {
    throw new Error("Sound Seekers update fixtures must produce two distinct build ids");
  }
  return { a, b };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const records = buildQuestOfflineUpdateFixtures();
  console.log(`Sound Seekers update fixtures ready (${records.a.buildId} -> ${records.b.buildId})`);
}
