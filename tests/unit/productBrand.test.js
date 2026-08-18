import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { PRODUCT_NAME } from "../../src/data/teacherBrand.js";
import { webAppManifest } from "../../tools/viteQuestOfflinePlugin.mjs";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const LEGACY_PRODUCT_NAME = /Literacy(?:\s+)?Path/g;

function listTextFiles(directory, { skipDirectory = () => false } = {}) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return skipDirectory(absolute) ? [] : listTextFiles(absolute, { skipDirectory });
    }
    return /\.(?:html|js|jsx|json|md|mjs|svg|txt|webmanifest|xml)$/.test(entry.name)
      ? [absolute]
      : [];
  });
}

function metaContent(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.match(new RegExp(`<meta\\s+name=["']${escapedName}["']\\s+content=["']([^"']+)["']\\s*\\/?\\s*>`))?.[1] || "";
}

test("browser and installed-app metadata use the current product name", () => {
  const html = fs.readFileSync(path.join(repoRoot, "index.html"), "utf8");
  const manifest = webAppManifest();

  assert.equal(PRODUCT_NAME, "Literacy Guide");
  assert.match(html, new RegExp(`<title>${PRODUCT_NAME}</title>`));
  assert.equal(metaContent(html, "application-name"), PRODUCT_NAME);
  assert.equal(metaContent(html, "apple-mobile-web-app-title"), PRODUCT_NAME);
  assert.match(html, new RegExp(`<strong>${PRODUCT_NAME}</strong>`));
  assert.equal(manifest.name, PRODUCT_NAME);
  assert.equal(manifest.short_name, PRODUCT_NAME);
});

test("customer-facing runtime and public files contain no legacy product name", () => {
  const files = [
    path.join(repoRoot, "index.html"),
    path.join(repoRoot, "docs/legal/PRIVACY_POLICY.md"),
    path.join(repoRoot, "tools/viteQuestOfflinePlugin.mjs"),
    path.join(repoRoot, "tools/hfwQuestionImageReviewSource.mjs"),
    ...listTextFiles(path.join(repoRoot, "public"), {
      skipDirectory: absolute => /\/public\/(?:audio|models)(?:\/|$)/.test(absolute)
    }),
    ...listTextFiles(path.join(repoRoot, "src"), {
      skipDirectory: absolute => (
        /\/src\/data\/generated(?:\/|$)/.test(absolute)
        || /\/src\/data\/v3\/banks(?:\/|$)/.test(absolute)
      )
    }),
    path.join(repoRoot, "src/data/generated/hfwQuestionImageReview.generated.js")
  ];

  const findings = files.flatMap(file => {
    const source = fs.readFileSync(file, "utf8");
    const matches = [...source.matchAll(LEGACY_PRODUCT_NAME)];
    return matches.map(match => `${path.relative(repoRoot, file)}:${source.slice(0, match.index).split("\n").length}`);
  });

  assert.deepEqual(findings, [], `Legacy product name found in:\n${findings.join("\n")}`);
});
