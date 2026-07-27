import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const distributionRoot = path.join(repositoryRoot, "dist");

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(target));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

const files = await walkFiles(distributionRoot);
const publicMaps = files.filter(file => file.endsWith(".map"));
assert.deepEqual(
  publicMaps,
  [],
  `Public dist contains source maps: ${publicMaps.map(file => path.relative(distributionRoot, file)).join(", ")}`
);

const scripts = files.filter(file => file.endsWith(".js"));
for (const script of scripts) {
  assert.doesNotMatch(
    await readFile(script, "utf8"),
    /sourceMappingURL\s*=/,
    `${path.relative(distributionRoot, script)} advertises a public source map.`
  );
}

console.log(
  `Public source-map exposure: PASS (${scripts.length} scripts, 0 maps, 0 map references).`
);
