import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appPath = path.join(repoRoot, "src", "App.jsx");
const requiredBoundaries = [
  "src/appState/assessmentRoundController.js",
  "src/appState/assessmentRuntime.js",
  "src/appState/appRuntimeServices.js",
  "src/appState/appRuntimeSurfaces.jsx",
  "src/appState/useAppSessionController.js",
  "src/components/AppSurface.jsx"
];
const requiredAppWiring = [
  'import { useAppSessionController } from "./appState/useAppSessionController.js";',
  'import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";',
  "useAppSessionController({",
  "<AppSurface"
];

const appSource = readFileSync(appPath, "utf8");
const missingBoundaries = requiredBoundaries.filter(relativePath =>
  !existsSync(path.join(repoRoot, relativePath))
);
const missingWiring = requiredAppWiring.filter(fragment => !appSource.includes(fragment));

if (missingBoundaries.length > 0 || missingWiring.length > 0) {
  if (missingBoundaries.length > 0) {
    console.error(`Missing App boundary modules: ${missingBoundaries.join(", ")}`);
  }
  if (missingWiring.length > 0) {
    console.error(`Missing App boundary wiring: ${missingWiring.join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`App decomposition PASS: ${requiredBoundaries.length} boundary modules are present and wired into App.jsx.`);
}
