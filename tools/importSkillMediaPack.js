import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getManagedSkillIds,
  getSkillBankItems,
  managedSkillDefinitions
} from "../src/content/skillMedia/skillAssetRegistry.js";
import { normalizeSkillAssetPath } from "../src/content/skillMedia/skillCoverageUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function getArg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

const skillId = getArg("skill", "all");
const source = getArg("source", "");
const shouldImport = process.argv.includes("--import");
const failures = [];
const warnings = [];

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function isKnownMediaExtension(filePath) {
  return /\.(webp|png|jpe?g|mp3|wav|m4a|aac|ogg)$/i.test(filePath);
}

function basenameKey(filePath) {
  return path.basename(filePath).toLowerCase();
}

if (!source || !fs.existsSync(source)) {
  failures.push(`Source folder not found. Pass --source "/path/to/pack".`);
}

const targetSkills = skillId === "all" ? getManagedSkillIds() : [skillId];
targetSkills.forEach(id => {
  if (!managedSkillDefinitions[id]) failures.push(`Unknown skill "${id}". Known skills: ${getManagedSkillIds().join(", ")}`);
});

const sourceFiles = failures.length ? [] : walk(source).filter(isKnownMediaExtension);
const sourceByBasename = sourceFiles.reduce((map, filePath) => {
  const key = basenameKey(filePath);
  map.set(key, [...(map.get(key) || []), filePath]);
  return map;
}, new Map());

const duplicateSourceNames = [...sourceByBasename.entries()].filter(([, files]) => files.length > 1);
duplicateSourceNames.forEach(([name, files]) => {
  warnings.push(`Duplicate source filename ${name}: ${files.map(file => path.relative(source, file)).join(", ")}`);
});

const items = getSkillBankItems().filter(item => targetSkills.includes(item.skillId) && item.active !== false);
const mediaRequests = items.flatMap(item => [
  ...(item.imageUrl ? [{ item, type: "image", expectedPath: item.imageUrl }] : []),
  ...(item.audioUrl ? [{ item, type: "audio", expectedPath: item.audioUrl }] : [])
]);

const matched = [];
const missing = [];
const conflicts = [];

mediaRequests.forEach(request => {
  const expectedName = basenameKey(request.expectedPath);
  const candidates = sourceByBasename.get(expectedName) || [];
  if (!candidates.length) {
    missing.push(request);
    return;
  }

  const destination = path.join(rootDir, "public", normalizeSkillAssetPath(request.expectedPath));
  const candidate = candidates[0];
  const existingHash = fs.existsSync(destination) ? sha256(destination) : "";
  const incomingHash = sha256(candidate);
  const status = fs.existsSync(destination)
    ? existingHash === incomingHash
      ? "already_present"
      : "conflict_existing_differs"
    : shouldImport
      ? "copied"
      : "matched_dry_run";

  if (status === "conflict_existing_differs") {
    conflicts.push({ ...request, candidate, destination });
  } else if (shouldImport && status === "copied") {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(candidate, destination);
  }

  matched.push({ ...request, candidate, destination, status });
});

const knownExpectedNames = new Set(mediaRequests.map(request => basenameKey(request.expectedPath)));
const unmatchedSourceFiles = sourceFiles.filter(filePath => !knownExpectedNames.has(basenameKey(filePath)));

const matchedRows = matched.map(row =>
  `| ${row.item.skillId} | ${row.item.level || ""} | ${row.item.target || ""} | ${row.item.targetWord || ""} | ${row.type} | ${path.relative(source, row.candidate)} | ${path.relative(rootDir, row.destination)} | ${row.status} |`
).join("\n");
const missingRows = missing.map(row =>
  `| ${row.item.skillId} | ${row.item.level || ""} | ${row.item.target || ""} | ${row.item.targetWord || ""} | ${row.type} | ${row.expectedPath} |`
).join("\n");
const conflictRows = conflicts.map(row =>
  `| ${row.item.skillId} | ${row.item.targetWord || ""} | ${row.type} | ${path.relative(source, row.candidate)} | ${path.relative(rootDir, row.destination)} |`
).join("\n");

write(
  path.join(rootDir, "docs", "assets", "skill_media_pack_import_audit.md"),
  `# Skill Media Pack Import Audit

Date: 2026-05-25

## Summary

- Source: ${source || "(missing)"}
- Skill: ${skillId}
- Mode: ${shouldImport ? "import" : "dry run"}
- Source media files: ${sourceFiles.length}
- Matched expected files: ${matched.length}
- Missing expected files: ${missing.length}
- Existing-path conflicts: ${conflicts.length}
- Unmatched source files: ${unmatchedSourceFiles.length}
- Warnings: ${warnings.length}
- Failures: ${failures.length}

## Matched Files

| Skill | Level | Target | Target Word | Media | Source | Destination | Status |
|---|---:|---|---|---|---|---|---|
${matchedRows || "| - | - | - | - | - | - | - | - |"}

## Missing Expected Files

| Skill | Level | Target | Target Word | Media | Expected Path |
|---|---:|---|---|---|---|
${missingRows || "| - | - | - | - | - | - |"}

## Conflicts

| Skill | Target Word | Media | Source | Existing Destination |
|---|---|---|---|---|
${conflictRows || "| - | - | - | - | - |"}

## Unmatched Source Files

${unmatchedSourceFiles.length ? unmatchedSourceFiles.slice(0, 250).map(filePath => `- ${path.relative(source, filePath)}`).join("\n") : "- none"}

## Warnings

${warnings.length ? warnings.map(warning => `- ${warning}`).join("\n") : "- none"}

## Failures

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "- none"}
`
);

console.log(`Skill media import audit wrote docs/assets/skill_media_pack_import_audit.md`);
console.log(`Matched: ${matched.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Conflicts: ${conflicts.length}`);

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
