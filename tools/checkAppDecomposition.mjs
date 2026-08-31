import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CHECKED_MODULES = Object.freeze({
  app: "src/App.jsx",
  controller: "src/appState/useAppSessionController.js",
  runtimeSurfaces: "src/appState/appRuntimeSurfaces.jsx",
  appPages: "src/components/AppPages.jsx",
  appSurface: "src/components/AppSurface.jsx"
});

function stripComments(source) {
  let result = "";
  let state = "code";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (state === "line-comment") {
      if (char === "\n") {
        result += char;
        state = "code";
      } else {
        result += " ";
      }
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        result += "  ";
        index += 1;
        state = "code";
      } else {
        result += char === "\n" ? "\n" : " ";
      }
      continue;
    }
    if (state === "single-quote" || state === "double-quote" || state === "template") {
      result += char;
      if (char === "\\") {
        result += next || "";
        index += 1;
        continue;
      }
      if (
        (state === "single-quote" && char === "'")
        || (state === "double-quote" && char === '"')
        || (state === "template" && char === "`")
      ) {
        state = "code";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      result += "  ";
      index += 1;
      state = "line-comment";
    } else if (char === "/" && next === "*") {
      result += "  ";
      index += 1;
      state = "block-comment";
    } else {
      result += char;
      if (char === "'") state = "single-quote";
      if (char === '"') state = "double-quote";
      if (char === "`") state = "template";
    }
  }
  return result;
}

function staticImports(source) {
  const imports = [];
  const pattern = /^[ \t]*import[ \t]+(?!\s*\()([\s\S]*?)\s+from\s+(["'])([^"']+)\2\s*;?/gm;
  for (const match of source.matchAll(pattern)) {
    imports.push({ clause: match[1].trim(), specifier: match[3] });
  }
  return imports;
}

function normalizedTarget(importer, specifier) {
  let target;
  if (specifier.startsWith("@/")) {
    target = path.posix.join("src", specifier.slice(2));
  } else if (specifier.startsWith(".")) {
    target = path.posix.normalize(path.posix.join(path.posix.dirname(importer), specifier));
  } else {
    target = specifier;
  }
  return target.replace(/\.(?:jsx?|mjs)$/u, "");
}

function importsTarget(imports, importer, target) {
  return imports.some(entry => normalizedTarget(importer, entry.specifier) === target);
}

function namedComponentExports(source) {
  return new Set(
    [...source.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9_]*)/g)]
      .map(match => match[1])
  );
}

function lazyAppPageMappings(source) {
  const mappings = new Map();
  const pattern = /\b(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=\s*lazyAppPage\(\s*(["'])([A-Z][A-Za-z0-9_]*)\2\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    mappings.set(match[3], match[1]);
  }
  return mappings;
}

function readCheckedSources(repoRoot, errors) {
  const sources = {};
  for (const [key, relativePath] of Object.entries(CHECKED_MODULES)) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`Missing application boundary module: ${relativePath}.`);
      continue;
    }
    sources[key] = stripComments(readFileSync(absolutePath, "utf8"));
  }
  return sources;
}

function checkAppOwnership(sources, errors) {
  const appSource = sources.app;
  if (!appSource) return;
  const imports = staticImports(appSource);
  const controllerImport = imports.find(entry => (
    normalizedTarget(CHECKED_MODULES.app, entry.specifier)
      === "src/appState/useAppSessionController"
  ));
  if (!controllerImport || !/\buseAppSessionController\b/.test(controllerImport.clause)) {
    errors.push("App.jsx must import useAppSessionController from ./appState/useAppSessionController.js.");
  }
  if (!/\buseAppSessionController\s*\(/.test(appSource)) {
    errors.push("App.jsx must call useAppSessionController so session/runtime state remains delegated to the controller.");
  }

  const facadeImport = imports.find(entry => (
    normalizedTarget(CHECKED_MODULES.app, entry.specifier)
      === "src/appState/appRuntimeSurfaces"
  ));
  const bypassesFacade = imports.some(entry => [
    "src/components/AppSurface",
    "src/components/AppPages"
  ].includes(normalizedTarget(CHECKED_MODULES.app, entry.specifier)));
  if (!facadeImport || !/\bAppSurface\b/.test(facadeImport.clause) || bypassesFacade) {
    errors.push("App.jsx must import AppSurface through ./appState/appRuntimeSurfaces.jsx; it must not import AppSurface or AppPages directly.");
  }
  if (!/<AppSurface\b/.test(appSource)) {
    errors.push("App.jsx must render the AppSurface facade after the controller is committed.");
  }

  const directDataImports = imports.filter(entry => {
    const target = normalizedTarget(CHECKED_MODULES.app, entry.specifier);
    return target === "@supabase/supabase-js"
      || /(?:^|\/)supabaseClient$/u.test(target)
      || /(?:^|\/)[^/]*(?:Rpc|RPC)$/u.test(target);
  });
  if (directDataImports.length > 0) {
    errors.push(
      `App.jsx must not import a data client or RPC module directly; use an appState/data owner instead. Offending import(s): ${directDataImports.map(entry => entry.specifier).join(", ")}.`
    );
  }
  if (/\.rpc\s*\(/.test(appSource)) {
    errors.push("App.jsx must not call RPCs directly; move the operation behind its appState/data owner.");
  }
}

function checkRuntimeFacade(sources, errors) {
  const source = sources.runtimeSurfaces;
  if (!source) return;
  const imports = staticImports(source);
  const hasStaticSurfaceImport = importsTarget(
    imports,
    CHECKED_MODULES.runtimeSurfaces,
    "src/components/AppSurface"
  );
  const lazySurfacePattern = /\bexport\s+const\s+AppSurface\s*=\s*lazyWithRetry\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(["'])\.\.\/components\/AppSurface\.jsx\1\s*\)\s*\.then\s*\([\s\S]*?default\s*:\s*module\.AppSurface[\s\S]*?\)\s*\)\s*;/;
  if (hasStaticSurfaceImport || !lazySurfacePattern.test(source)) {
    errors.push("appRuntimeSurfaces.jsx must keep AppSurface behind lazyWithRetry(() => import(\"../components/AppSurface.jsx\")).");
  }
}

function checkAppSurfaceOwnership(sources, errors) {
  const surfaceSource = sources.appSurface;
  const pagesSource = sources.appPages;
  if (!surfaceSource || !pagesSource) return;
  const imports = staticImports(surfaceSource);
  if (importsTarget(imports, CHECKED_MODULES.appSurface, "src/components/AppPages")) {
    errors.push("AppSurface.jsx must not statically import AppPages; named pages must stay behind lazyAppPage.");
  }

  const hasLazyPageFactory = /\bfunction\s+lazyAppPage\s*\(\s*exportName\s*\)[\s\S]*?lazyWithRetry\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(["'])\.\/AppPages\.jsx\1\s*\)[\s\S]*?module\s*\[\s*exportName\s*\]/.test(surfaceSource);
  if (!hasLazyPageFactory) {
    errors.push("AppSurface.jsx must define lazyAppPage with lazyWithRetry and a dynamic AppPages import.");
  }

  const pageExports = namedComponentExports(pagesSource);
  const lazyMappings = lazyAppPageMappings(surfaceSource);
  const missingMappings = [...pageExports].filter(exportName => (
    lazyMappings.get(exportName) !== exportName
  ));
  if (missingMappings.length > 0) {
    errors.push(`AppSurface.jsx must lazy-load every named AppPages export through lazyAppPage. Missing: ${missingMappings.join(", ")}.`);
  }

  const runtimeImport = imports.find(entry => (
    normalizedTarget(CHECKED_MODULES.appSurface, entry.specifier)
      === "src/appState/appRuntimeSurfaces"
  ));
  const viewHelpersImport = imports.find(entry => (
    normalizedTarget(CHECKED_MODULES.appSurface, entry.specifier)
      === "src/appState/appViewHelpers"
  ));
  const ownsDialogs = runtimeImport
    && /\bConfirmActionDialog\b/.test(runtimeImport.clause)
    && /\bResetStudentProgressDialog\b/.test(runtimeImport.clause);
  const ownsFooter = viewHelpersImport
    && /\bshouldShowFooterUtilityActions\b/.test(viewHelpersImport.clause);
  const ownsShell = /lazyWithRetry\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*(["'])\.\/StudentGlassShell\.jsx\1\s*\)\s*\)/.test(surfaceSource);
  if (!ownsDialogs || !ownsFooter || !ownsShell) {
    errors.push("AppSurface.jsx must retain shell, modal, and footer composition ownership (StudentGlassShell, admin dialogs, and footer utility policy).");
  }
}

function checkAppPagesOwnership(sources, errors) {
  const source = sources.appPages;
  if (!source) return;
  const imports = staticImports(source);
  const backwardImports = imports.filter(entry => [
    "src/App",
    "src/components/AppSurface",
    "src/appState/useAppSessionController"
  ].includes(normalizedTarget(CHECKED_MODULES.appPages, entry.specifier)));
  if (backwardImports.length > 0) {
    errors.push(
      `AppPages.jsx must not import App, AppSurface, or useAppSessionController. Offending import(s): ${backwardImports.map(entry => entry.specifier).join(", ")}.`
    );
  }

  const compositionImports = imports.filter(entry => {
    const targetName = path.posix.basename(normalizedTarget(CHECKED_MODULES.appPages, entry.specifier));
    return /(?:Shell|Sidebar|Modal|Dialog|Footer)/u.test(targetName)
      || /\b(?:ConfirmActionDialog|ResetStudentProgressDialog|shouldShowFooterUtilityActions)\b/.test(entry.clause);
  });
  if (compositionImports.length > 0) {
    errors.push(
      `AppPages.jsx must leave shell, modal, and footer composition in AppSurface. Offending import(s): ${compositionImports.map(entry => entry.specifier).join(", ")}.`
    );
  }
}

function checkControllerOwnership(sources, errors) {
  const source = sources.controller;
  if (!source) return;
  const componentImports = staticImports(source).filter(entry => (
    normalizedTarget(CHECKED_MODULES.controller, entry.specifier).startsWith("src/components/")
  ));
  const renderedComponents = [...source.matchAll(/<([A-Z][A-Za-z0-9_.]*)\b/g)]
    .map(match => match[1]);
  if (componentImports.length > 0 || renderedComponents.length > 0) {
    const details = [
      ...componentImports.map(entry => entry.specifier),
      ...renderedComponents.map(name => `<${name}>`)
    ];
    errors.push(
      `useAppSessionController.js must not import or render component modules; it owns session/runtime state only. Offending reference(s): ${details.join(", ")}.`
    );
  }
}

export function checkAppDecomposition(repoRoot) {
  const errors = [];
  const sources = readCheckedSources(repoRoot, errors);
  checkAppOwnership(sources, errors);
  checkRuntimeFacade(sources, errors);
  checkAppSurfaceOwnership(sources, errors);
  checkAppPagesOwnership(sources, errors);
  checkControllerOwnership(sources, errors);
  return {
    ok: errors.length === 0,
    errors,
    checkedModules: Object.values(CHECKED_MODULES)
  };
}

function requestedRoot(argv) {
  const rootFlagIndex = argv.indexOf("--root");
  if (rootFlagIndex === -1) {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  }
  const root = argv[rootFlagIndex + 1];
  if (!root) throw new Error("--root requires a repository root path.");
  return path.resolve(root);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = checkAppDecomposition(requestedRoot(process.argv.slice(2)));
    if (!result.ok) {
      for (const error of result.errors) console.error(`App decomposition ERROR: ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`App decomposition PASS: ${result.checkedModules.length} ownership boundaries verified.`);
    }
  } catch (error) {
    console.error(`App decomposition ERROR: ${error.message}`);
    process.exitCode = 1;
  }
}
