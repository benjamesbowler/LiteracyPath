import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const sourceRoots = [path.join(root, "src"), path.join(root, "tools")];
const forbiddenFragments = [
  "replacement-2026-06-05",
  "ai-generated-watermark",
  "watermarked-assessment",
  "media/vocabulary/images/verb-dance.webp"
];
const textExtensions = new Set([".js", ".jsx", ".mjs", ".json", ".md", ".css", ".html"]);
const errors = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const filePath of walk(publicRoot)) {
  const relative = path.relative(root, filePath).split(path.sep).join("/");
  if (forbiddenFragments.some(fragment => relative.toLowerCase().includes(fragment))) {
    errors.push(`forbidden public media path: ${relative}`);
  }
}

for (const sourceRoot of sourceRoots) {
  for (const filePath of walk(sourceRoot)) {
    if (!textExtensions.has(path.extname(filePath).toLowerCase())) continue;
    const source = fs.readFileSync(filePath, "utf8").toLowerCase();
    for (const fragment of forbiddenFragments) {
      if (source.includes(fragment) && path.basename(filePath) !== "checkPublicMediaPolicy.mjs") {
        errors.push(`forbidden public media reference in ${path.relative(root, filePath)}: ${fragment}`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Public media policy failed with ${errors.length} problem(s):`);
  errors.slice(0, 50).forEach(error => console.error(`  ${error}`));
  if (errors.length > 50) console.error(`  ...and ${errors.length - 50} more`);
  process.exit(1);
}

console.log("Public media policy OK: no known watermarked batch or forbidden reference is public.");
