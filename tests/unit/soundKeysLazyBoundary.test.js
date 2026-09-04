import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parse } from "@babel/parser";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function mainSource() {
  const revision = process.env.LP_MAIN_ENTRY_REVISION;
  if (revision) {
    return execFileSync("git", ["show", `${revision}:src/main.jsx`], {
      cwd: repoRoot,
      encoding: "utf8"
    });
  }
  return readFileSync(path.join(repoRoot, "src/main.jsx"), "utf8");
}

function walk(node, visit, ancestors = []) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach(item => walk(item, visit, ancestors));
    return;
  }
  if (typeof node.type === "string") visit(node, ancestors);
  const nextAncestors = [...ancestors, node];
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end") continue;
    walk(value, visit, nextAncestors);
  }
}

function isSoundKeysImport(node) {
  return node?.type === "CallExpression"
    && node.callee?.type === "Import"
    && node.arguments?.[0]?.value === "./features/soundkeys/SoundKeysApp.jsx";
}

function isSoundKeysRouteTest(node) {
  return node?.type === "BinaryExpression"
    && node.operator === "==="
    && node.left?.type === "Identifier"
    && node.left.name === "rootPath"
    && node.right?.type === "StringLiteral"
    && node.right.value === "/soundkeys";
}

test("SoundKeys is a route-triggered dynamic entry, not part of the application shell graph", () => {
  const ast = parse(mainSource(), { sourceType: "module", plugins: ["jsx"] });
  const staticSoundKeysImports = [];
  const soundKeysDynamicImports = [];
  const lazySoundKeysDeclarations = [];
  const lazySoundKeysRenderBranches = [];

  walk(ast, (node, ancestors) => {
    if (node.type === "ImportDeclaration" && node.source.value === "./features/soundkeys/SoundKeysApp.jsx") {
      staticSoundKeysImports.push(node);
    }
    if (isSoundKeysImport(node)) soundKeysDynamicImports.push(node);
    if (
      node.type === "VariableDeclarator"
      && node.id?.type === "Identifier"
      && node.id.name === "LazySoundKeysApp"
      && node.init?.type === "CallExpression"
      && node.init.callee?.type === "Identifier"
      && node.init.callee.name === "lazyWithRetry"
      && (() => {
        let importsSoundKeys = false;
        walk(node.init, child => { if (isSoundKeysImport(child)) importsSoundKeys = true; });
        return importsSoundKeys;
      })()
    ) {
      lazySoundKeysDeclarations.push(node);
    }
    if (
      node.type === "JSXOpeningElement"
      && node.name?.type === "JSXIdentifier"
      && node.name.name === "LazySoundKeysApp"
      && ancestors.some(ancestor => ancestor.type === "ConditionalExpression" && isSoundKeysRouteTest(ancestor.test))
    ) {
      lazySoundKeysRenderBranches.push(node);
    }
  });

  assert.equal(staticSoundKeysImports.length, 0, "SoundKeys must not be statically imported by src/main.jsx");
  assert.equal(soundKeysDynamicImports.length, 1, "SoundKeys must have one dynamic import entry");
  assert.equal(lazySoundKeysDeclarations.length, 1, "the dynamic SoundKeys import must use lazyWithRetry");
  assert.equal(lazySoundKeysRenderBranches.length, 1, "LazySoundKeysApp must render only for /soundkeys");
});
