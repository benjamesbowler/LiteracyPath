import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checkerPath = path.join(repoRoot, "tools", "checkAppDecomposition.mjs");

const BASELINE_SOURCES = Object.freeze({
  "src/App.jsx": `
    import { useAppSessionController } from "./appState/useAppSessionController.js";
    import { AppSurface } from "./appState/appRuntimeSurfaces.jsx";
    import { hydrateRuntimeAssessmentAttempts } from "./appState/appRuntimeServices.js";
    export default function App() {
      const surface = useAppSessionController({ hydrateRuntimeAssessmentAttempts });
      return <AppSurface surface={surface} />;
    }
  `,
  "src/appState/appRuntimeServices.js": `
    import { supabase } from "../supabaseClient.js";
    export function hydrateRuntimeAssessmentAttempts(options) {
      return hydrateAssessmentAttempts({ ...options, supabase });
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
      import("../components/AppSurface.jsx").then(loaded => ({ default: loaded.AppSurface }))
    );
    export function ConfirmActionDialog() { return null; }
    export function ResetStudentProgressDialog() { return null; }
  `,
  "src/components/AppSurface.jsx": `
    import { AuthPage } from "./AuthPage.jsx";
    import { ConfirmActionDialog, ResetStudentProgressDialog } from "../appState/appRuntimeSurfaces.jsx";
    import { shouldShowFooterUtilityActions } from "../appState/appViewHelpers.js";
    import { lazyWithRetry } from "../utils/lazyWithRetry.js";
    const StudentGlassShell = lazyWithRetry(() => import("./StudentGlassShell.jsx"));
    const lazyAppPage = pageName => lazyWithRetry(() =>
      import("./AppPages.jsx").then(pages => ({ default: pages[pageName] }))
    );
    const FirstPage = lazyAppPage("FirstPage");
    const RenamedSecondPage = lazyAppPage("SecondPage");
    export function AppSurface({ surface }) {
      if (surface.auth) return <AuthPage />;
      if (surface.dialog === "confirm") return <ConfirmActionDialog />;
      if (surface.dialog === "reset") return <ResetStudentProgressDialog />;
      if (shouldShowFooterUtilityActions(surface)) {
        return <div className="footer-utility-actions">Footer</div>;
      }
      return <StudentGlassShell><FirstPage /><RenamedSecondPage /></StudentGlassShell>;
    }
  `,
  "src/components/AppPages.jsx": `
    export { AuthPage } from "./AuthPage.jsx";
    export { InnerSecondPage as SecondPage } from "./SecondPage.jsx";
    export function FirstPage() { return <main>First</main>; }
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

test("accepts controller delegation, high-level runtime services, lazy pages, and active composition", () => {
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
      .replace(
        "const surface = useAppSessionController({ hydrateRuntimeAssessmentAttempts });",
        "const surface = {};"
      )
  }, /App\.jsx must call useAppSessionController/);
});

test("rejects App when it imports the raw data client directly", () => {
  assertRejected({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace(
        'import { hydrateRuntimeAssessmentAttempts } from "./appState/appRuntimeServices.js";',
        'import { supabase } from "./supabaseClient.js";'
      )
      .replace("{ hydrateRuntimeAssessmentAttempts }", "{ client: supabase }")
  }, /App\.jsx must not receive a raw data client.*supabaseClient/);
});

test("rejects App when a runtime-service alias re-exports the raw data client", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      export { supabase as runtimeClient } from "../supabaseClient.js";
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when a runtime-service constant aliases the raw data client", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      import { supabase } from "../supabaseClient.js";
      export const runtimeClient = supabase;
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when a runtime service projects the raw client from a namespace", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      import * as clientNamespace from "../supabaseClient.js";
      export const runtimeClient = clientNamespace.supabase;
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replaceAll("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when a runtime service destructures the raw client from a namespace", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      import * as clientNamespace from "../supabaseClient.js";
      const { supabase: runtimeClient } = clientNamespace;
      export { runtimeClient };
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replaceAll("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when an object-property alias carries the raw client", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      import * as clientNamespace from "../supabaseClient.js";
      const clientBag = { current: clientNamespace.supabase };
      export const runtimeClient = clientBag.current;
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replaceAll("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when a nested object aliases the raw-client namespace", () => {
  assertRejected({
    "src/appState/appRuntimeServices.js": `
      import * as clientNamespace from "../supabaseClient.js";
      const clientBag = { namespace: clientNamespace };
      export const runtimeClient = clientBag.namespace.supabase;
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replaceAll("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when a nested facade re-exports a raw-client projection", () => {
  assertRejected({
    "src/appState/rawClientProjection.js": `
      import * as clientNamespace from "../supabaseClient.js";
      export const projectedClient = clientNamespace.supabase;
    `,
    "src/appState/appRuntimeServices.js": `
      export { projectedClient as runtimeClient } from "./rawClientProjection.js";
    `,
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replaceAll("hydrateRuntimeAssessmentAttempts", "runtimeClient")
  }, /App\.jsx must not receive a raw data client through a re-export.*runtimeClient/);
});

test("rejects App when it calls an RPC directly without importing a named client module", () => {
  assertRejected({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace("const surface = useAppSessionController", "window.runtime.rpc(\"unsafe\");\nconst surface = useAppSessionController")
  }, /App\.jsx must not call RPCs directly/);
});

test("rejects the runtime facade when AppSurface is no longer behind lazyWithRetry", () => {
  assertRejected({
    "src/appState/appRuntimeSurfaces.jsx": `
      import { AppSurface } from "../components/AppSurface.jsx";
      export { AppSurface };
      export function ConfirmActionDialog() { return null; }
      export function ResetStudentProgressDialog() { return null; }
    `
  }, /appRuntimeSurfaces\.jsx must keep AppSurface behind lazyWithRetry/);
});

test("accepts an equivalent lazy AppSurface projection without hardcoding the module variable name", () => {
  withFixture({
    "src/appState/appRuntimeSurfaces.jsx": BASELINE_SOURCES["src/appState/appRuntimeSurfaces.jsx"]
      .replace("loaded.AppSurface", 'loaded["AppSurface"]')
  }, fixtureRoot => {
    const result = runChecker(fixtureRoot);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("rejects a lazy runtime facade that projects the wrong AppSurface export", () => {
  assertRejected({
    "src/appState/appRuntimeSurfaces.jsx": BASELINE_SOURCES["src/appState/appRuntimeSurfaces.jsx"]
      .replace("loaded.AppSurface", "loaded.NotTheAppSurface")
  }, /appRuntimeSurfaces\.jsx must project the named AppSurface export/);
});

test("rejects AppSurface when it statically imports AppPages", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace(
        'import { AuthPage } from "./AuthPage.jsx";',
        'import { AuthPage, FirstPage as EagerFirstPage } from "./AppPages.jsx";'
      )
  }, /AppSurface\.jsx must not statically import AppPages/);
});

test("rejects AppSurface when an inline AppPages export bypasses lazyAppPage", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace('const FirstPage = lazyAppPage("FirstPage");', "const FirstPage = () => null;")
  }, /AppSurface\.jsx must lazy-load every non-direct AppPages export.*FirstPage/);
});

test("rejects AppSurface when an aliased AppPages re-export bypasses lazyAppPage", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace('const RenamedSecondPage = lazyAppPage("SecondPage");', "const RenamedSecondPage = () => null;")
  }, /AppSurface\.jsx must lazy-load every non-direct AppPages export.*SecondPage/);
});

test("rejects AppSurface when the documented direct AuthPage binding changes source", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace('from "./AuthPage.jsx"', 'from "./OtherPage.jsx"')
  }, /AppSurface\.jsx direct page AuthPage must come from.*AuthPage/);
});

test("rejects AppPages when it imports App", () => {
  assertRejected({
    "src/components/AppPages.jsx": `
      import App from "../App.jsx";
      ${BASELINE_SOURCES["src/components/AppPages.jsx"]}
    `
  }, /AppPages\.jsx must not import App, AppSurface, or useAppSessionController.*App\.jsx/);
});

test("rejects AppPages when it imports AppSurface", () => {
  assertRejected({
    "src/components/AppPages.jsx": `
      import { AppSurface } from "./AppSurface.jsx";
      ${BASELINE_SOURCES["src/components/AppPages.jsx"]}
    `
  }, /AppPages\.jsx must not import App, AppSurface, or useAppSessionController.*AppSurface/);
});

test("rejects AppPages when it imports the session controller", () => {
  assertRejected({
    "src/components/AppPages.jsx": `
      import { useAppSessionController } from "../appState/useAppSessionController.js";
      ${BASELINE_SOURCES["src/components/AppPages.jsx"]}
    `
  }, /AppPages\.jsx must not import App, AppSurface, or useAppSessionController.*useAppSessionController/);
});

test("rejects AppPages when it renders the application shell", () => {
  assertRejected({
    "src/components/AppPages.jsx": BASELINE_SOURCES["src/components/AppPages.jsx"]
      .replace("<main>First</main>", "<StudentGlassShell><main>First</main></StudentGlassShell>")
  }, /AppPages\.jsx must not compose StudentGlassShell/);
});

test("rejects AppPages when it renders an application dialog", () => {
  assertRejected({
    "src/components/AppPages.jsx": BASELINE_SOURCES["src/components/AppPages.jsx"]
      .replace("<main>First</main>", "<ConfirmActionDialog />")
  }, /AppPages\.jsx must not compose ConfirmActionDialog/);
});

test("rejects AppPages when it renders the application footer utility container", () => {
  assertRejected({
    "src/components/AppPages.jsx": BASELINE_SOURCES["src/components/AppPages.jsx"]
      .replace('<main>First</main>', '<div className="footer-utility-actions">First</div>')
  }, /AppPages\.jsx must not compose footer-utility-actions/);
});

test("rejects AppSurface when the shell binding becomes a dead import", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace("<StudentGlassShell><FirstPage /><RenamedSecondPage /></StudentGlassShell>", "<><FirstPage /><RenamedSecondPage /></>")
  }, /AppSurface\.jsx must actively compose StudentGlassShell/);
});

test("rejects AppSurface when dialog bindings become dead imports", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace("return <ConfirmActionDialog />;", "return <FirstPage />;")
      .replace("return <ResetStudentProgressDialog />;", "return <FirstPage />;")
  }, /AppSurface\.jsx must actively compose.*ConfirmActionDialog.*ResetStudentProgressDialog/);
});

test("rejects AppSurface when footer policy remains but footer composition moves away", () => {
  assertRejected({
    "src/components/AppSurface.jsx": BASELINE_SOURCES["src/components/AppSurface.jsx"]
      .replace('<div className="footer-utility-actions">Footer</div>', "<FirstPage />")
  }, /AppSurface\.jsx must actively compose the footer utility container/);
});

test("rejects the controller when it imports a component directly", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import { FirstPage } from "../components/AppPages.jsx";
      export function useAppSessionController() { return {}; }
    `
  }, /useAppSessionController\.js must not import component modules.*AppPages/);
});

test("rejects the controller when it imports a page through appRuntimeSurfaces", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import { TeacherTodayPage } from "./appRuntimeSurfaces.jsx";
      export function useAppSessionController() { return { TeacherTodayPage }; }
    `
  }, /useAppSessionController\.js must not import component modules.*appRuntimeSurfaces/);
});

test("rejects the controller when a transitive facade reaches appRuntimeSurfaces", () => {
  assertRejected({
    "src/appState/controllerSurfaceFacade.js": `
      export { AppSurface as injectedPage } from "./appRuntimeSurfaces.jsx";
    `,
    "src/appState/useAppSessionController.js": `
      import { injectedPage } from "./controllerSurfaceFacade.js";
      export function useAppSessionController() { return { injectedPage }; }
    `
  }, /useAppSessionController\.js must not import component modules or transitively reach component or runtime-surface code.*controllerSurfaceFacade/);
});

test("rejects the controller when it renders JSX without a component import", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      export function useAppSessionController() { return <InjectedPage />; }
    `
  }, /useAppSessionController\.js must not render components.*InjectedPage/);
});

test("rejects the controller when it renders through createElement without JSX", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import { createElement } from "react";
      export function useAppSessionController() { return createElement(InjectedPage); }
    `
  }, /useAppSessionController\.js must not render components.*InjectedPage/);
});

test("rejects lowercase JSX rendering in the controller", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      export function useAppSessionController() { return <injectedPage />; }
    `
  }, /useAppSessionController\.js must not render components.*injectedPage/);
});

test("rejects a lowercase imported page passed to imported createElement", () => {
  assertRejected({
    "src/appState/injectedPage.js": `
      export const injectedPage = () => null;
    `,
    "src/appState/useAppSessionController.js": `
      import { createElement } from "react";
      import { injectedPage } from "./injectedPage.js";
      export function useAppSessionController() { return createElement(injectedPage); }
    `
  }, /useAppSessionController\.js must not render components.*injectedPage/);
});

test("rejects a lowercase page passed to an aliased createElement import", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import { createElement as renderElement } from "react";
      const injectedPage = () => null;
      export function useAppSessionController() { return renderElement(injectedPage); }
    `
  }, /useAppSessionController\.js must not render components.*injectedPage/);
});

test("rejects a lowercase page rendered through an aliased React namespace", () => {
  assertRejected({
    "src/appState/useAppSessionController.js": `
      import * as UI from "react";
      const injectedPage = () => null;
      export function useAppSessionController() { return UI.createElement(injectedPage); }
    `
  }, /useAppSessionController\.js must not render components.*injectedPage/);
});

test("accepts harmless local createElement and React names without React imports", () => {
  withFixture({
    "src/appState/useAppSessionController.js": `
      const PageRecord = { id: "page-data" };
      const createElement = value => value;
      const React = { createElement: value => value };
      export function useAppSessionController() {
        return { direct: createElement(PageRecord), member: React.createElement(PageRecord) };
      }
    `
  }, fixtureRoot => {
    const result = runChecker(fixtureRoot);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("accepts an aliased useAppSessionController delegation import", () => {
  withFixture({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace(
        "import { useAppSessionController }",
        "import { useAppSessionController as useSessionController }"
      )
      .replace("useAppSessionController({", "useSessionController({")
  }, fixtureRoot => {
    const result = runChecker(fixtureRoot);
    assert.equal(result.status, 0, result.stderr);
  });
});

test("rejects an uncalled controller alias even when a same-named decoy is called", () => {
  assertRejected({
    "src/App.jsx": BASELINE_SOURCES["src/App.jsx"]
      .replace(
        "import { useAppSessionController }",
        "import { useAppSessionController as useSessionController }"
      )
      .replace(
        "export default function App() {",
        "function useAppSessionController() { return {}; }\nexport default function App() {"
      )
  }, /App\.jsx must call useAppSessionController through its imported binding.*useSessionController/);
});
