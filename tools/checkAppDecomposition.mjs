import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "espree";
import { fileURLToPath } from "node:url";

const CHECKED_MODULES = Object.freeze({
  app: "src/App.jsx",
  runtimeServices: "src/appState/appRuntimeServices.js",
  controller: "src/appState/useAppSessionController.js",
  runtimeSurfaces: "src/appState/appRuntimeSurfaces.jsx",
  appPages: "src/components/AppPages.jsx",
  appSurface: "src/components/AppSurface.jsx"
});

const DIRECT_PAGE_EXPORTS = Object.freeze({
  AuthPage: "src/components/AuthPage"
});

function parseModule(source, relativePath) {
  try {
    return parse(source, {
      ecmaFeatures: { jsx: true },
      ecmaVersion: "latest",
      loc: true,
      sourceType: "module"
    });
  } catch (error) {
    throw new Error(`${relativePath} could not be parsed: ${error.message}`, { cause: error });
  }
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (typeof node.type === "string") visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "range", "start", "end"].includes(key)) continue;
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit);
    } else if (value && typeof value === "object") {
      walk(value, visit);
    }
  }
}

function nodeContains(node, predicate) {
  let found = false;
  walk(node, child => {
    if (!found && predicate(child)) found = true;
  });
  return found;
}

function literalString(node) {
  return node?.type === "Literal" && typeof node.value === "string"
    ? node.value
    : null;
}

function propertyName(node) {
  if (!node) return "";
  if (!node.computed && node.property?.type === "Identifier") return node.property.name;
  return literalString(node.property) || "";
}

function staticImports(ast) {
  return ast.body
    .filter(node => node.type === "ImportDeclaration")
    .map(node => ({
      node,
      specifier: node.source.value,
      bindings: node.specifiers.map(specifier => ({
        imported: specifier.type === "ImportDefaultSpecifier"
          ? "default"
          : specifier.type === "ImportNamespaceSpecifier"
            ? "*"
            : specifier.imported.name,
        local: specifier.local.name
      }))
    }));
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

function importBinding(imports, importer, target, importedName) {
  for (const entry of imports) {
    if (normalizedTarget(importer, entry.specifier) !== target) continue;
    const binding = entry.bindings.find(candidate => candidate.imported === importedName);
    if (binding) return binding.local;
  }
  return null;
}

function isCallNamed(node, name) {
  return node?.type === "CallExpression"
    && node.callee.type === "Identifier"
    && node.callee.name === name;
}

function callsNamed(node, name) {
  return nodeContains(node, child => isCallNamed(child, name));
}

function dynamicImportsTarget(node, importer, target) {
  return nodeContains(node, child => (
    child.type === "ImportExpression"
    && typeof child.source?.value === "string"
    && normalizedTarget(importer, child.source.value) === target
  ));
}

function objectPropertyName(node) {
  if (!node || node.type !== "Property") return "";
  if (!node.computed && node.key?.type === "Identifier") return node.key.name;
  return literalString(node.key) || "";
}

function projectsNamedExport(node, exportName) {
  let projectsExport = false;
  walk(node, child => {
    if (
      projectsExport
      || child.type !== "CallExpression"
      || child.callee.type !== "MemberExpression"
      || propertyName(child.callee) !== "then"
    ) return;
    const callback = child.arguments[0];
    if (!["ArrowFunctionExpression", "FunctionExpression"].includes(callback?.type)) return;
    const parameter = callback.params[0];
    let moduleLocal = null;
    let destructuredLocal = null;
    if (parameter?.type === "Identifier") {
      moduleLocal = parameter.name;
    } else if (parameter?.type === "ObjectPattern") {
      const exportProperty = parameter.properties.find(property => (
        objectPropertyName(property) === exportName
      ));
      if (exportProperty?.value?.type === "Identifier") {
        destructuredLocal = exportProperty.value.name;
      }
    }
    walk(callback.body, candidate => {
      if (projectsExport || objectPropertyName(candidate) !== "default") return;
      const value = candidate.value;
      const projectsMember = moduleLocal
        && value?.type === "MemberExpression"
        && value.object?.type === "Identifier"
        && value.object.name === moduleLocal
        && propertyName(value) === exportName;
      const projectsDestructured = destructuredLocal
        && value?.type === "Identifier"
        && value.name === destructuredLocal;
      if (projectsMember || projectsDestructured) projectsExport = true;
    });
  });
  return projectsExport;
}

function jsxName(node) {
  if (!node) return "";
  if (node.type === "JSXIdentifier") return node.name;
  if (node.type === "JSXMemberExpression") {
    return `${jsxName(node.object)}.${jsxName(node.property)}`;
  }
  return "";
}

function createElementLocalNames(imports) {
  const locals = new Set(["createElement"]);
  const reactObjects = new Set(["React"]);
  for (const entry of imports) {
    if (entry.specifier !== "react") continue;
    for (const binding of entry.bindings) {
      if (binding.imported === "createElement") locals.add(binding.local);
      if (["default", "*"].includes(binding.imported)) reactObjects.add(binding.local);
    }
  }
  return { locals, reactObjects };
}

function renderedComponentNames(node, imports = []) {
  const rendered = new Set();
  const { locals: createElementLocals, reactObjects } = createElementLocalNames(imports);
  walk(node, child => {
    if (child.type === "JSXOpeningElement") {
      const name = jsxName(child.name);
      if (/^[A-Z]/u.test(name)) rendered.add(name);
      return;
    }
    if (child.type !== "CallExpression") return;
    const directCreate = child.callee.type === "Identifier"
      && createElementLocals.has(child.callee.name);
    const memberCreate = child.callee.type === "MemberExpression"
      && child.callee.object?.type === "Identifier"
      && reactObjects.has(child.callee.object.name)
      && propertyName(child.callee) === "createElement";
    if (!directCreate && !memberCreate) return;
    const component = child.arguments[0];
    if (component?.type === "Identifier" && /^[A-Z]/u.test(component.name)) {
      rendered.add(component.name);
    } else if (component?.type === "MemberExpression") {
      const name = propertyName(component);
      if (/^[A-Z]/u.test(name)) rendered.add(name);
    }
  });
  return rendered;
}

function jsxClassNames(node) {
  const names = new Set();
  walk(node, child => {
    if (child.type !== "JSXAttribute" || child.name?.name !== "className") return;
    const literal = literalString(child.value)
      || literalString(child.value?.expression);
    for (const className of String(literal || "").split(/\s+/u).filter(Boolean)) {
      names.add(className);
    }
  });
  return names;
}

function exportedBindingNode(ast, name) {
  for (const node of ast.body) {
    if (node.type !== "ExportNamedDeclaration" || !node.declaration) continue;
    const declaration = node.declaration;
    if (["FunctionDeclaration", "ClassDeclaration"].includes(declaration.type)) {
      if (declaration.id?.name === name) return declaration;
      continue;
    }
    if (declaration.type !== "VariableDeclaration") continue;
    const declarator = declaration.declarations.find(candidate => candidate.id?.name === name);
    if (declarator) return declarator.init;
  }
  return null;
}

function namedPageExports(ast) {
  const exports = new Map();
  for (const node of ast.body) {
    if (node.type !== "ExportNamedDeclaration") continue;
    const source = node.source?.value || null;
    const declaration = node.declaration;
    if (declaration) {
      if (["FunctionDeclaration", "ClassDeclaration"].includes(declaration.type)) {
        if (/^[A-Z]/u.test(declaration.id?.name || "")) {
          exports.set(declaration.id.name, { source: null, local: declaration.id.name });
        }
      } else if (declaration.type === "VariableDeclaration") {
        for (const declarator of declaration.declarations) {
          if (/^[A-Z]/u.test(declarator.id?.name || "")) {
            exports.set(declarator.id.name, { source: null, local: declarator.id.name });
          }
        }
      }
    }
    for (const specifier of node.specifiers) {
      const exported = specifier.exported.name;
      if (/^[A-Z]/u.test(exported)) {
        exports.set(exported, { source, local: specifier.local.name });
      }
    }
  }
  return exports;
}

function lazyPageMappings(ast) {
  const mappings = new Map();
  walk(ast, node => {
    if (node.type !== "VariableDeclarator" || node.id?.type !== "Identifier") return;
    if (!isCallNamed(node.init, "lazyAppPage")) return;
    const exportName = literalString(node.init.arguments[0]);
    if (exportName) mappings.set(exportName, node.id.name);
  });
  return mappings;
}

function localModulePath(repoRoot, importer, specifier) {
  const target = normalizedTarget(importer, specifier);
  if (!target.startsWith("src/")) return null;
  if (/\.[A-Za-z0-9]+$/u.test(target) && !/\.(?:jsx?|mjs)$/u.test(target)) return null;
  const candidates = [target, `${target}.js`, `${target}.jsx`, `${target}.mjs`];
  return candidates.find(candidate => (
    /\.(?:jsx?|mjs)$/u.test(candidate)
    && existsSync(path.join(repoRoot, candidate))
  )) || null;
}

function isRawClientTarget(target) {
  return target === "@supabase/supabase-js"
    || /(?:^|\/)supabaseClient$/u.test(target);
}

function rawClientReexports(repoRoot, relativePath, cache) {
  if (cache.has(relativePath)) return cache.get(relativePath);
  const rawExports = new Set();
  cache.set(relativePath, rawExports);
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) return rawExports;
  const ast = parseModule(readFileSync(absolutePath, "utf8"), relativePath);
  const imports = staticImports(ast);
  const rawImportedLocals = new Set();
  for (const entry of imports) {
    const target = normalizedTarget(relativePath, entry.specifier);
    if (isRawClientTarget(target)) {
      for (const binding of entry.bindings) rawImportedLocals.add(binding.local);
      continue;
    }
    const nestedPath = localModulePath(repoRoot, relativePath, entry.specifier);
    if (!nestedPath) continue;
    const nestedRaw = rawClientReexports(repoRoot, nestedPath, cache);
    for (const binding of entry.bindings) {
      if (
        nestedRaw.has("*")
        || nestedRaw.has(binding.imported)
        || (binding.imported === "*" && nestedRaw.size > 0)
      ) rawImportedLocals.add(binding.local);
    }
  }

  let addedAlias = true;
  while (addedAlias) {
    addedAlias = false;
    walk(ast, node => {
      if (
        node.type !== "VariableDeclarator"
        || node.id?.type !== "Identifier"
        || node.init?.type !== "Identifier"
        || !rawImportedLocals.has(node.init.name)
        || rawImportedLocals.has(node.id.name)
      ) return;
      rawImportedLocals.add(node.id.name);
      addedAlias = true;
    });
  }

  const directlyReturnsRawClient = node => {
    if (!node) return false;
    if (
      node.type === "ArrowFunctionExpression"
      && node.body.type === "Identifier"
      && rawImportedLocals.has(node.body.name)
    ) return true;
    return nodeContains(node.body, child => (
      child.type === "ReturnStatement"
      && child.argument?.type === "Identifier"
      && rawImportedLocals.has(child.argument.name)
    ));
  };

  for (const node of ast.body) {
    if (node.type === "ExportAllDeclaration") {
      const target = normalizedTarget(relativePath, node.source.value);
      if (isRawClientTarget(target)) {
        rawExports.add("*");
      } else {
        const nestedPath = localModulePath(repoRoot, relativePath, node.source.value);
        if (nestedPath) {
          for (const name of rawClientReexports(repoRoot, nestedPath, cache)) {
            if (name !== "default") rawExports.add(name);
          }
        }
      }
      continue;
    }
    if (node.type === "ExportDefaultDeclaration") {
      if (
        (node.declaration.type === "Identifier" && rawImportedLocals.has(node.declaration.name))
        || directlyReturnsRawClient(node.declaration)
      ) rawExports.add("default");
      continue;
    }
    if (node.type !== "ExportNamedDeclaration") continue;
    if (node.declaration?.type === "VariableDeclaration") {
      for (const declarator of node.declaration.declarations) {
        if (
          declarator.id?.type === "Identifier"
          && (
            rawImportedLocals.has(declarator.id.name)
            || directlyReturnsRawClient(declarator.init)
          )
        ) rawExports.add(declarator.id.name);
      }
    } else if (
      node.declaration?.type === "FunctionDeclaration"
      && directlyReturnsRawClient(node.declaration)
    ) {
      rawExports.add(node.declaration.id.name);
    }
    if (node.source) {
      const target = normalizedTarget(relativePath, node.source.value);
      const nestedPath = localModulePath(repoRoot, relativePath, node.source.value);
      const nestedRaw = nestedPath
        ? rawClientReexports(repoRoot, nestedPath, cache)
        : new Set();
      for (const specifier of node.specifiers) {
        if (
          isRawClientTarget(target)
          || nestedRaw.has("*")
          || nestedRaw.has(specifier.local.name)
        ) {
          rawExports.add(specifier.exported.name);
        }
      }
    } else {
      for (const specifier of node.specifiers) {
        if (rawImportedLocals.has(specifier.local.name)) {
          rawExports.add(specifier.exported.name);
        }
      }
    }
  }
  return rawExports;
}

function readCheckedModules(repoRoot, errors) {
  const modules = {};
  for (const [key, relativePath] of Object.entries(CHECKED_MODULES)) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`Missing application boundary module: ${relativePath}.`);
      continue;
    }
    try {
      const source = readFileSync(absolutePath, "utf8");
      modules[key] = { ast: parseModule(source, relativePath), relativePath, source };
    } catch (error) {
      errors.push(error.message);
    }
  }
  return modules;
}

function checkAppOwnership(repoRoot, modules, errors) {
  const module = modules.app;
  if (!module) return;
  const { ast, relativePath } = module;
  const imports = staticImports(ast);
  if (!importBinding(
    imports,
    relativePath,
    "src/appState/useAppSessionController",
    "useAppSessionController"
  )) {
    errors.push("App.jsx must import useAppSessionController from ./appState/useAppSessionController.js.");
  }
  if (!callsNamed(ast, "useAppSessionController")) {
    errors.push("App.jsx must call useAppSessionController so session/runtime state remains delegated to the controller.");
  }

  const facadeBinding = importBinding(
    imports,
    relativePath,
    "src/appState/appRuntimeSurfaces",
    "AppSurface"
  );
  const bypassesFacade = imports.some(entry => [
    "src/components/AppSurface",
    "src/components/AppPages"
  ].includes(normalizedTarget(relativePath, entry.specifier)));
  const rendered = renderedComponentNames(ast, imports);
  if (!facadeBinding || bypassesFacade) {
    errors.push("App.jsx must import AppSurface through ./appState/appRuntimeSurfaces.jsx; it must not import AppSurface or AppPages directly.");
  } else if (!rendered.has(facadeBinding)) {
    errors.push("App.jsx must render the AppSurface facade after the controller is committed.");
  }

  const rawReexportCache = new Map();
  for (const entry of imports) {
    const target = normalizedTarget(relativePath, entry.specifier);
    if (isRawClientTarget(target)) {
      errors.push(`App.jsx must not receive a raw data client. Offending import: ${entry.specifier}.`);
      continue;
    }
    const targetPath = localModulePath(repoRoot, relativePath, entry.specifier);
    if (!targetPath) continue;
    const rawExports = rawClientReexports(repoRoot, targetPath, rawReexportCache);
    const taintedBindings = entry.bindings.filter(binding => (
      rawExports.has("*")
      || rawExports.has(binding.imported)
      || (binding.imported === "*" && rawExports.size > 0)
    ));
    if (taintedBindings.length > 0) {
      errors.push(
        `App.jsx must not receive a raw data client through a re-export. Offending binding(s): ${taintedBindings.map(binding => binding.local).join(", ")} from ${entry.specifier}.`
      );
    }
  }

  const hasDirectRpcCall = nodeContains(ast, node => (
    node.type === "CallExpression"
    && node.callee.type === "MemberExpression"
    && propertyName(node.callee) === "rpc"
  ));
  if (hasDirectRpcCall) {
    errors.push("App.jsx must not call RPCs directly; move the operation behind its appState/data owner.");
  }
}

function checkRuntimeFacade(modules, errors) {
  const module = modules.runtimeSurfaces;
  if (!module) return;
  const { ast, relativePath } = module;
  const imports = staticImports(ast);
  const surfaceInitializer = exportedBindingNode(ast, "AppSurface");
  const isLazy = isCallNamed(surfaceInitializer, "lazyWithRetry");
  const importsSurfaceDynamically = surfaceInitializer && dynamicImportsTarget(
    surfaceInitializer,
    relativePath,
    "src/components/AppSurface"
  );
  if (
    importsTarget(imports, relativePath, "src/components/AppSurface")
    || !isLazy
    || !importsSurfaceDynamically
  ) {
    errors.push("appRuntimeSurfaces.jsx must keep AppSurface behind lazyWithRetry with a dynamic ../components/AppSurface.jsx import.");
  } else if (!projectsNamedExport(surfaceInitializer, "AppSurface")) {
    errors.push("appRuntimeSurfaces.jsx must project the named AppSurface export from the lazy-loaded module.");
  }
}

function checkAppSurfaceOwnership(modules, errors) {
  const surfaceModule = modules.appSurface;
  const pagesModule = modules.appPages;
  if (!surfaceModule || !pagesModule) return;
  const { ast, relativePath } = surfaceModule;
  const imports = staticImports(ast);
  if (importsTarget(imports, relativePath, "src/components/AppPages")) {
    errors.push("AppSurface.jsx must not statically import AppPages; named pages must stay behind lazyAppPage.");
  }

  const lazyPageFactory = (() => {
    for (const node of ast.body) {
      if (node.type === "FunctionDeclaration" && node.id?.name === "lazyAppPage") return node;
      if (node.type !== "VariableDeclaration") continue;
      const declarator = node.declarations.find(candidate => candidate.id?.name === "lazyAppPage");
      if (declarator) return declarator.init;
    }
    return null;
  })();
  if (
    !lazyPageFactory
    || !callsNamed(lazyPageFactory, "lazyWithRetry")
    || !dynamicImportsTarget(lazyPageFactory, relativePath, "src/components/AppPages")
  ) {
    errors.push("AppSurface.jsx must define lazyAppPage with lazyWithRetry and a dynamic AppPages import.");
  }

  const surfaceFunction = exportedBindingNode(ast, "AppSurface");
  const rendered = renderedComponentNames(surfaceFunction || ast, imports);
  const pageExports = namedPageExports(pagesModule.ast);
  const lazyMappings = lazyPageMappings(ast);
  const missingLazyPages = [];
  for (const [exportName] of pageExports) {
    if (Object.hasOwn(DIRECT_PAGE_EXPORTS, exportName)) continue;
    const localBinding = lazyMappings.get(exportName);
    if (!localBinding || !rendered.has(localBinding)) missingLazyPages.push(exportName);
  }
  if (missingLazyPages.length > 0) {
    errors.push(`AppSurface.jsx must lazy-load every non-direct AppPages export and render its local binding. Missing: ${missingLazyPages.join(", ")}.`);
  }

  for (const [exportName, expectedTarget] of Object.entries(DIRECT_PAGE_EXPORTS)) {
    const pageExport = pageExports.get(exportName);
    const pageTarget = pageExport?.source
      ? normalizedTarget(pagesModule.relativePath, pageExport.source)
      : null;
    const localBinding = importBinding(imports, relativePath, expectedTarget, exportName);
    if (pageTarget !== expectedTarget || !localBinding || !rendered.has(localBinding)) {
      errors.push(`AppSurface.jsx direct page ${exportName} must come from and render ${expectedTarget}.`);
    }
  }

  const missingDialogs = ["ConfirmActionDialog", "ResetStudentProgressDialog"]
    .filter(name => !rendered.has(name));
  if (!rendered.has("StudentGlassShell")) {
    errors.push("AppSurface.jsx must actively compose StudentGlassShell; a dead import or lazy binding is insufficient.");
  }
  if (missingDialogs.length > 0) {
    errors.push(`AppSurface.jsx must actively compose its dialog owners. Missing: ${missingDialogs.join(", ")}.`);
  }
  const classNames = jsxClassNames(surfaceFunction || ast);
  if (!classNames.has("footer-utility-actions")) {
    errors.push("AppSurface.jsx must actively compose the footer utility container; importing its policy is insufficient.");
  }
  if (!callsNamed(surfaceFunction || ast, "shouldShowFooterUtilityActions")) {
    errors.push("AppSurface.jsx must apply shouldShowFooterUtilityActions when composing footer utilities.");
  }
}

function checkAppPagesOwnership(modules, errors) {
  const module = modules.appPages;
  if (!module) return;
  const { ast, relativePath } = module;
  const imports = staticImports(ast);
  const backwardImports = imports.filter(entry => [
    "src/App",
    "src/components/AppSurface",
    "src/appState/useAppSessionController"
  ].includes(normalizedTarget(relativePath, entry.specifier)));
  if (backwardImports.length > 0) {
    errors.push(
      `AppPages.jsx must not import App, AppSurface, or useAppSessionController. Offending import(s): ${backwardImports.map(entry => entry.specifier).join(", ")}.`
    );
  }

  const rendered = renderedComponentNames(ast, imports);
  for (const owner of ["StudentGlassShell", "ConfirmActionDialog", "ResetStudentProgressDialog"]) {
    if (rendered.has(owner)) errors.push(`AppPages.jsx must not compose ${owner}; that owner belongs to AppSurface.`);
  }
  if (jsxClassNames(ast).has("footer-utility-actions")) {
    errors.push("AppPages.jsx must not compose footer-utility-actions; footer composition belongs to AppSurface.");
  }
  if (callsNamed(ast, "shouldShowFooterUtilityActions")) {
    errors.push("AppPages.jsx must not apply shouldShowFooterUtilityActions; footer composition belongs to AppSurface.");
  }
}

function checkControllerOwnership(modules, errors) {
  const module = modules.controller;
  if (!module) return;
  const { ast, relativePath } = module;
  const imports = staticImports(ast);
  const componentImports = imports.filter(entry => {
    const target = normalizedTarget(relativePath, entry.specifier);
    return target.startsWith("src/components/")
      || target === "src/appState/appRuntimeSurfaces";
  });
  if (componentImports.length > 0) {
    errors.push(
      `useAppSessionController.js must not import component modules or the runtime-surface component facade. Offending import(s): ${componentImports.map(entry => entry.specifier).join(", ")}.`
    );
  }
  const rendered = renderedComponentNames(ast, imports);
  if (rendered.size > 0) {
    errors.push(`useAppSessionController.js must not render components. Offending reference(s): ${[...rendered].join(", ")}.`);
  }
}

export function checkAppDecomposition(repoRoot) {
  const errors = [];
  const modules = readCheckedModules(repoRoot, errors);
  checkAppOwnership(repoRoot, modules, errors);
  checkRuntimeFacade(modules, errors);
  checkAppSurfaceOwnership(modules, errors);
  checkAppPagesOwnership(modules, errors);
  checkControllerOwnership(modules, errors);
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
