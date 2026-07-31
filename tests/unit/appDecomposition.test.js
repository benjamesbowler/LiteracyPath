import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("App controller uses the current session and rendering boundaries", () => {
  const appSource = readFileSync(path.join(repoRoot, "src", "App.jsx"), "utf8");
  assert.match(appSource, /import \{ useAppSessionController \} from "\.\/appState\/useAppSessionController\.js";/);
  assert.match(appSource, /import \{ AppSurface \} from "\.\/appState\/appRuntimeSurfaces\.jsx";/);
  assert.match(appSource, /useAppSessionController\(\{/);
  assert.match(appSource, /<AppSurface\b/);
});

test("App responsibilities remain behind explicit runtime and rendering boundaries", () => {
  const requiredBoundaries = [
    "src/appState/assessmentRoundController.js",
    "src/appState/assessmentRuntime.js",
    "src/appState/appRuntimeServices.js",
    "src/appState/appRuntimeSurfaces.jsx",
    "src/appState/useAppSessionController.js",
    "src/components/AppSurface.jsx"
  ];

  for (const relativePath of requiredBoundaries) {
    assert.equal(existsSync(path.join(repoRoot, relativePath)), true, `${relativePath} is required`);
  }
});
