import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(repoRoot, "src", "App.jsx");
const maxAppLines = 3000;
const requiredBoundaries = [
  "src/appState/assessmentRoundController.js",
  "src/appState/assessmentRuntime.js",
  "src/appState/appRuntimeServices.js",
  "src/appState/appRuntimeSurfaces.jsx",
  "src/appState/useAppSessionController.js",
  "src/components/AppSurface.jsx"
];

const appLines = readFileSync(appPath, "utf8").split(/\r?\n/).length;
const missingBoundaries = requiredBoundaries.filter(relativePath =>
  !existsSync(path.join(repoRoot, relativePath))
);

if (appLines > maxAppLines || missingBoundaries.length > 0) {
  if (appLines > maxAppLines) {
    console.error(`App.jsx has ${appLines} lines; final milestone maximum is ${maxAppLines}.`);
  }
  if (missingBoundaries.length > 0) {
    console.error(`Missing App boundary modules: ${missingBoundaries.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`App decomposition PASS: ${appLines}/${maxAppLines} lines and ${requiredBoundaries.length} boundaries present.`);
}
