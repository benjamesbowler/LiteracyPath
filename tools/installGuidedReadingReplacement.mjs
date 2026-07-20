#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(repoRoot, "docs", "guided-reading");
const manifestPath = path.join(docsRoot, "guided_reading_visual_replacement_manifest.json");
const installedPath = path.join(docsRoot, "guided_reading_visual_installed.json");
const postInstallAuditPath = path.join(docsRoot, "guided_reading_post_install_visual_findings.json");
const auditBuilderPath = path.join(repoRoot, "tools", "buildGuidedReadingVisualAuditManifest.mjs");

const [bookArg, pageArg, sourceArg] = process.argv.slice(2);
const bookNumber = Number(bookArg);
const pageNumber = Number(pageArg);

if (!Number.isInteger(bookNumber) || !Number.isInteger(pageNumber) || !sourceArg) {
  console.error("Usage: node tools/installGuidedReadingReplacement.mjs <book-number> <page-number> <source-image>");
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
if (!fs.existsSync(sourcePath)) throw new Error(`Replacement source not found: ${sourcePath}`);
if (!fs.existsSync(manifestPath)) execFileSync(process.execPath, [auditBuilderPath], { cwd: repoRoot, stdio: "inherit" });

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const replacement = manifest.replacements.find(entry =>
  entry.bookNumber === bookNumber && entry.pageNumber === pageNumber
);

if (!replacement) throw new Error(`Book ${bookNumber}, page ${pageNumber} is not an approved replacement.`);

const targetPath = path.join(repoRoot, "public", replacement.replacementImagePath.replace(/^\//, ""));
const targetExtension = path.extname(targetPath).toLowerCase();
const temporaryPath = `${targetPath}.installing${targetExtension}`;
const expectedFormat = targetExtension === ".png" ? "png" : targetExtension === ".jpg" || targetExtension === ".jpeg" ? "jpeg" : "webp";

const pipeline = sharp(sourcePath)
  .resize(replacement.outputWidth, replacement.outputHeight, { fit: "cover", position: "attention" });
if (expectedFormat === "png") pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
else if (expectedFormat === "jpeg") pipeline.jpeg({ quality: 92, mozjpeg: true });
else pipeline.webp({ quality: 92, effort: 6 });
await pipeline.toFile(temporaryPath);

const metadata = await sharp(temporaryPath).metadata();
if (metadata.format !== expectedFormat || metadata.width !== replacement.outputWidth || metadata.height !== replacement.outputHeight) {
  fs.unlinkSync(temporaryPath);
  throw new Error(`Generated file failed format or dimension validation for book ${bookNumber}, page ${pageNumber}.`);
}

fs.renameSync(temporaryPath, targetPath);

const installed = fs.existsSync(installedPath)
  ? JSON.parse(fs.readFileSync(installedPath, "utf8"))
  : {};
const currentPages = installed[bookNumber];
if (currentPages !== "all") {
  installed[bookNumber] = [...new Set([...(Array.isArray(currentPages) ? currentPages : []), pageNumber])]
    .sort((left, right) => left - right);
}
const sortedInstalled = Object.fromEntries(
  Object.entries(installed).sort(([left], [right]) => Number(left) - Number(right))
);
fs.writeFileSync(installedPath, `${JSON.stringify(sortedInstalled, null, 2)}\n`);

if (fs.existsSync(postInstallAuditPath)) {
  const postInstallAudit = JSON.parse(fs.readFileSync(postInstallAuditPath, "utf8"));
  const resolved = postInstallAudit.resolved || {};
  resolved[String(bookNumber)] = [...new Set([...(resolved[String(bookNumber)] || []), pageNumber])]
    .sort((left, right) => left - right);
  postInstallAudit.resolved = resolved;
  fs.writeFileSync(postInstallAuditPath, `${JSON.stringify(postInstallAudit, null, 2)}\n`);
}

execFileSync(process.execPath, [auditBuilderPath], { cwd: repoRoot, stdio: "inherit" });
console.log(JSON.stringify({
  installed: { bookNumber, pageNumber },
  targetPath,
  width: metadata.width,
  height: metadata.height,
}, null, 2));
