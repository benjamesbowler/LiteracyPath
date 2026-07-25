import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("App controller stays below the second decomposition ratchet", () => {
  const appSource = readFileSync(path.join(repoRoot, "src", "App.jsx"), "utf8");
  assert.ok(
    appSource.split(/\r?\n/).length <= 5000,
    "App.jsx exceeded the 5,000-line milestone; extract the new responsibility instead of growing the controller"
  );
});

test("App responsibilities remain behind explicit runtime and rendering boundaries", () => {
  const requiredBoundaries = [
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
