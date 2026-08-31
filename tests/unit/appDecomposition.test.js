import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checkerPath = path.join(repoRoot, "tools", "checkAppDecomposition.mjs");

const BASELINE_SOURCES = Object.freeze({
  "src/App.jsx": `
    import { useAppSessionController } from "./appState/useAppSessionController.js";
    import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";
    export default function App() {
      const surface = useAppSessionController({});
      return <AppSurface surface={surface} />;
    }
  `,
  "src/appState/useAppSessionController.js": `
    import { useState } from "react";
    export function useAppSessionController() {
      const [ready] = useState(true);
      return { ready };
    }
  `,
  "src/appState/appRuntimeSurfaces.jsx": `
    import { lazyWithRetry } from "../utils/lazyWithRetry.js";
    export const AppSurface = lazyWithRetry(() =>
      import("../components/AppSurface.jsx").then(module => ({ default: module.AppSurface }))
    );
  `,
  "src/components/AppSurface.jsx": `
    import { ConfirmActionDialog, ResetStudentProgressDialog } from "../appState/appRuntimeSurfaces.jsx";
    import { shouldShowFooterUtilityActions } from "../appState/appViewHelpers.js";
    import { lazyWithRetry } from "../utils/lazyWithRetry.js";
    const StudentGlassShell = lazyWithRetry(() => import("./StudentGlassShell.jsx"));
    function lazyAppPage(exportName) {
      return lazyWithRetry(() => import("./AppPages.jsx").then(module => ({
        default: module[exportName]
      })));
    }
    const FirstPage = lazyAppPage("FirstPage");
    const SecondPage = lazyAppPage("SecondPage");
    export function AppSurface({ surface }) {
      if (surface.dialog === "confirm") return <ConfirmActionDialog />;
      if (surface.dialog === "reset") return <ResetStudentProgressDialog />;
      if (shouldShowFooterUtilityActions(surface)) return <StudentGlassShell><FirstPage /></StudentGlassShell>;
      return <SecondPage />;
    }
  `,
  "src/components/AppPages.jsx": `
    export function FirstPage() { return <main>First</main>; }
    export function SecondPage() { return <main>Second</main>; }
  `
});

function withFixture(overrides, run) {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), "literacypath-app-decomposition-"));
  try {
    for (const [relativePath, source] of Object.entries({
      ...BASELINE_SOURCES,
      ...overrides
    })) {
      const absolutePath = path.join(fixtureRoot, relativePath);
      mkdirSync(path.dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, source);
    }
    return run(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runChecker(fixtureRoot) {
  return spawnSync(process.execPath, [checkerPath, "--root", fixtureRoot], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function assertRejected(overrides, expectedMessage) {
  withFixture(overrides, fixtureRoot => {
    const result = runChecker(fixtureRoot);
    assert.notEqual(result.status, 0, `controlled bad fixture unexpectedly passed:\n${result.stdout}`);
    assert.match(result.stderr, expectedMessage);
  });
}

test("accepts the intended controller, lazy facade, page, and composition graph", () => {
  withFixture({}, fixtureRoot => {
    const result = runChecker(fixtureRoot);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /App decomposition PASS/);
  });
});

test("rejects App when it bypasses the runtime facade for AppSurface", () => {
  assertRejected({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace("./appState/appRuntimeSurfaces.jsx", "./components/AppSurface.jsx")
  }, /App\.jsx must import AppSurface through.*appRuntimeSurfaces/);
});

test("rejects App when it stops invoking the session controller", () => {
  assertRejected({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace("const surface = useAppSessionController({});", "const surface = {};")
  }, /App\.jsx must call useAppSessionController/);
});

test("rejects App when direct data-client or RPC access returns", () => {
  assertRejected({
    "src/App.jsx": `
      import { useAppSessionController } from "./appState/useAppSessionController.js";
      import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";
      import { supabase } from "./supabaseClient.js";
      export default function App() {
        const surface = useAppSessionController({ client: supabase });
        return <AppSurface surface={surface} />;
      }
    `
  }, /App\.jsx must not import a data client or RPC module directly.*supabaseClient/);
});

test("rejects the runtime facade when AppSurface is no longer behind lazyWithRetry", () => {
  assertRejected({
    "src/appState/appRuntimeSurfaces.jsx": `
      import { AppSurface } from "../components/AppSurface.jsx";
      export { AppSurface };
    `
  }, /appRuntimeSurfaces\.jsx must keep AppSurface behind lazyWithRetry/);
});

test("rejects AppSurface when it statically imports AppPages", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace(
        "import { lazyWithRetry } from \"../utils/lazyWithRetry.js\";",
        "import { lazyWithRetry } from \"../utils/lazyWithRetry.js\";\nimport { FirstPage } from \"./AppPages.jsx\";"
      )
  }, /AppSurface\.jsx must not statically import AppPages/);
});

test("rejects AppSurface when a named AppPages export bypasses lazyAppPage", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace("const SecondPage = lazyAppPage(\"SecondPage\");", "const SecondPage = () => null;")
  }, /AppSurface\.jsx must lazy-load every named AppPages export.*SecondPage/);
});

test("rejects AppPages when it reaches back into App, AppSurface, or the controller", () => {
  assertRejected({
    "src/components/AppPages.jsx": `
      import { useAppSessionController } from "../appState/useAppSessionController.js";
      export function FirstPage() { useAppSessionController({}); return <main>First</main>; }
      export function SecondPage() { return <main>Second</main>; }
    `
  }, /AppPages\.jsx must not import App, AppSurface, or useAppSessionController/);
});

test("rejects AppPages when shell, modal, or footer composition leaves AppSurface", () => {
  assertRejected({
    "src/components/AppPages.jsx": `
      import StudentGlassShell from "./StudentGlassShell.jsx";
      export function FirstPage() { return <StudentGlassShell>First</StudentGlassShell>; }
      export function SecondPage() { return <main>Second</main>; }
    `
  }, /AppPages\.jsx must leave shell, modal, and footer composition in AppSurface.*StudentGlassShell/);
});

test("rejects the controller when it imports or renders a page component", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import { FirstPage } from "../components/AppPages.jsx";
      export function useAppSessionController() { return <FirstPage />; }
    `
  }, /useAppSessionController\.js must not import or render component modules.*AppPages/);
});
