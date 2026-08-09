import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assessmentRoot = path.join(root, "public/images/assessment");
const reportRoot = path.join(root, ".artifacts/audits");
const limitBytes = 200 * 1024;
const qualities = [82, 78, 74, 70, 66, 62];
const maximumEdges = [1024, 896, 768];

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

async function optimise(filePath) {
  const before = fs.statSync(filePath).size;
  if (path.extname(filePath).toLowerCase() !== ".webp" || before <= limitBytes) return null;
  const metadata = await sharp(filePath).metadata();
  let selected = null;

  for (const edge of maximumEdges) {
    for (const quality of qualities) {
      const buffer = await sharp(filePath)
        .rotate()
        .resize({
          width: Math.min(edge, metadata.width || edge),
          height: Math.min(edge, metadata.height || edge),
          fit: "inside",
          withoutEnlargement: true
        })
        .webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true })
        .toBuffer();
      selected = { buffer, edge, quality };
      if (buffer.length <= limitBytes) break;
    }
    if (selected?.buffer.length <= limitBytes) break;
  }

  if (!selected || selected.buffer.length > limitBytes) {
    throw new Error(`Could not reduce ${path.relative(root, filePath)} below 200 KB`);
  }

  const tempPath = `${filePath}.optimising`;
  fs.writeFileSync(tempPath, selected.buffer);
  fs.renameSync(tempPath, filePath);
  return {
    path: path.relative(root, filePath).split(path.sep).join("/"),
    before,
    after: selected.buffer.length,
    quality: selected.quality,
    maximumEdge: selected.edge
  };
}

async function mapLimit(items, limit, task) {
  const results = [];
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const result = await task(items[index]);
      if (result) results.push(result);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const candidates = walk(assessmentRoot)
  .filter(filePath => path.extname(filePath).toLowerCase() === ".webp")
  .filter(filePath => fs.statSync(filePath).size > limitBytes);
const results = await mapLimit(candidates, 6, optimise);
const bytesBefore = results.reduce((sum, item) => sum + item.before, 0);
const bytesAfter = results.reduce((sum, item) => sum + item.after, 0);

fs.mkdirSync(reportRoot, { recursive: true });
fs.writeFileSync(path.join(reportRoot, "assessment-media-optimisation.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  fileCount: results.length,
  bytesBefore,
  bytesAfter,
  savedBytes: bytesBefore - bytesAfter,
  files: results.sort((a, b) => a.path.localeCompare(b.path))
}, null, 2)}\n`);

console.log(`Optimised ${results.length} assessment WebP files from ${(bytesBefore / 1024 / 1024).toFixed(1)} MB to ${(bytesAfter / 1024 / 1024).toFixed(1)} MB.`);
