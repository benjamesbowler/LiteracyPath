import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CHILD_BRAND } from "../../src/data/childBrand.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("the child area has one approved endorsed identity", () => {
  assert.deepEqual(CHILD_BRAND, {
    name: "Little Literacy Guides",
    endorsedName: "Little Literacy Guides by literacy.guide",
    logoPath: "/images/pals/little-literacy-guides-logo.webp",
    markPath: "/images/pals/little-literacy-guides-mark.webp"
  });
  assert.equal(Object.isFrozen(CHILD_BRAND), true);
});

test("approved child-brand artwork exists at every canonical path", () => {
  for (const assetPath of [CHILD_BRAND.logoPath, CHILD_BRAND.markPath]) {
    assert.equal(
      existsSync(path.join(repoRoot, "public", assetPath.replace(/^\//, ""))),
      true,
      `missing child-brand asset: ${assetPath}`
    );
  }
});

test("entry, home, and preloading cannot drift back to retired runtime names", () => {
  const runtimeFiles = [
    "src/components/StudentEntryPage.jsx",
    "src/components/StudentHomePage.jsx",
    "src/styles/comic-theme.css",
    "src/styles/home-sage.css",
    "src/styles/lp-tokens.css",
    "src/styles/pal-worlds.css",
    "src/utils/palWorlds.js",
    "src/utils/preloadAssets.js"
  ];
  const retiredNames = [
    /Mivlings/i,
    /Literacy(?:\s|<[^>]+>)*Pals/i,
    /mivlings-logo/i,
    /literacy-pals-logo/i
  ];

  for (const relativePath of runtimeFiles) {
    const source = readFileSync(path.join(repoRoot, relativePath), "utf8");
    for (const retiredName of retiredNames) {
      assert.doesNotMatch(source, retiredName, `${relativePath} contains ${retiredName}`);
    }
  }

  const homeSource = readFileSync(path.join(repoRoot, "src/components/StudentHomePage.jsx"), "utf8");
  assert.match(homeSource, /className="hs-logo" role="img" aria-label=\{CHILD_BRAND\.endorsedName\}/);
});
