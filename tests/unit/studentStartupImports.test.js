import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { parse } from "@babel/parser";

// Follow real static imports/re-exports. A lazy route is allowed to own its
// content; merely putting a dynamic import beside an eager one is not a split.
function staticSources(entry) {
  const seen = new Set();
  function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);
    const ast = parse(fs.readFileSync(file, "utf8"), {
      sourceType: "module", plugins: ["jsx"]
    });
    for (const node of ast.program.body) {
      if (!["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)
        || !node.source?.value.startsWith(".")) continue;
      const base = path.resolve(path.dirname(file), node.source.value);
      const resolved = [base, `${base}.js`, `${base}.jsx`, path.join(base, "index.js")]
        .find(candidate => /\.(?:js|jsx|mjs)$/u.test(candidate)
          && fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      if (resolved) visit(resolved);
    }
  }
  visit(path.resolve(entry));
  return [...seen].map(file => path.relative(process.cwd(), file));
}

test("reading saved mastery never imports the playback controller or media catalogues", () => {
  const sources = staticSources("src/utils/questMastery.js");
  for (const forbidden of [
    "src/features/soundSeekers/engine/audioControllerAuthority.js",
    "src/data/childAssets.js",
    "src/data/ledaProductionAudio.js"
  ]) assert.ok(!sources.includes(forbidden), `${forbidden} is eager through saved mastery`);
});

test("app startup and child Home defer complete narration and expedition content", () => {
  for (const entry of ["src/App.jsx", "src/components/StudentHomePage.jsx"]) {
    const sources = staticSources(entry);
    for (const forbidden of [
      "src/data/generated/ledaProductionAudio.generated.js",
      "src/data/generated/assessmentLedaGaps.generated.js",
      "src/features/soundSeekers/content/expeditions.js"
    ]) assert.ok(!sources.includes(forbidden), `${entry} eagerly imports ${forbidden}`);
  }
});

test("book classification labels do not import a complete book manuscript", () => {
  const sources = staticSources("src/policy/guidedReadingCatalogPolicy.js");
  assert.ok(!sources.includes("src/data/meadowPalsScienceBooks.js"));
});
