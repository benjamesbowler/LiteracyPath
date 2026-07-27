import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(repoRoot, "src");
const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const blockedPatterns = [
  /\bdocument\s*\.\s*write\s*\(/g,
  /\bdocument\s*\[\s*["']write["']\s*\]\s*\(/g
];

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return sourceExtensions.has(path.extname(entry.name)) ? [target] : [];
  });
}

const violations = [];
for (const filePath of sourceFiles(sourceRoot)) {
  const source = fs.readFileSync(filePath, "utf8");
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (blockedPatterns.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    })) {
      violations.push(`${path.relative(repoRoot, filePath)}:${index + 1}`);
    }
  });
}

if (violations.length) {
  console.error("Unsafe document stream writes remain:");
  violations.forEach(violation => console.error(`- ${violation}`));
  process.exitCode = 1;
} else {
  console.log("Source guard passed: no document stream writes in src.");
}
