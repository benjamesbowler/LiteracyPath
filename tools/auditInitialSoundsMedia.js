import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  INITIAL_SOUND_LETTERS,
  initialSoundWordBank,
  normalizeInitialSoundWord
} from "../src/content/initialSounds/initialSoundWordBank.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const sourceDir = "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath a-z assets 500class";
const sourceZip = path.join(sourceDir, "initial-sounds-media-pack.zip");
const shouldImport = process.argv.includes("--import");

const failures = [];
const warnings = [];
const importedImages = [];
const importedAudio = [];
const rejectedFiles = [];
const manualReview = [];

function pathExists(filePath) {
  return fs.existsSync(filePath);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function zipEntries(zipPath) {
  if (!pathExists(zipPath)) return [];
  return execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

function readZipEntry(zipPath, entry) {
  return execFileSync("unzip", ["-p", zipPath, entry], { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 });
}

function projectFileForUrl(url) {
  return path.join(rootDir, "public", String(url || "").replace(/^\//, ""));
}

function sourceEntryForUrl(url) {
  return `public/${String(url || "").replace(/^\//, "")}`;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

function copyZipEntryIfNeeded(entry, destination, kind, item) {
  const content = readZipEntry(sourceZip, entry);
  ensureDir(destination);

  const alreadyExists = pathExists(destination);
  const existingHash = alreadyExists ? sha256(fs.readFileSync(destination)) : "";
  const incomingHash = sha256(content);

  if (!alreadyExists || existingHash !== incomingHash) {
    fs.writeFileSync(destination, content);
  }

  const row = {
    id: item.id,
    letter: item.letter,
    level: item.level,
    targetWord: item.targetWord,
    sourceEntry: entry,
    destination: path.relative(rootDir, destination),
    status: alreadyExists && existingHash === incomingHash ? "already_present" : "copied"
  };

  if (kind === "image") importedImages.push(row);
  if (kind === "audio") importedAudio.push(row);
}

function audioDurationSeconds(filePath) {
  try {
    const output = execFileSync("afinfo", [filePath], { encoding: "utf8" });
    const match = output.match(/estimated duration:\s*([0-9.]+)/i);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function imageInfo(filePath) {
  try {
    return execFileSync("file", [filePath], { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function analyzeFiles(entries) {
  const files = entries.filter(entry => !entry.endsWith("/"));
  const imageEntries = files.filter(entry => /\.(webp|png|jpe?g)$/i.test(entry));
  const audioEntries = files.filter(entry => /\.(mp3|wav|m4a|aac|ogg)$/i.test(entry));
  const docs = files.filter(entry => /\.(json|md|txt|csv)$/i.test(entry));
  const unsupported = files.filter(entry => !/\.(webp|png|jpe?g|mp3|wav|m4a|aac|ogg|json|md|txt|csv)$/i.test(entry));
  const duplicatePaths = files.filter((entry, index) => files.indexOf(entry) !== index);
  const duplicateBasenames = files
    .map(entry => path.basename(entry).toLowerCase())
    .filter((name, index, list) => list.indexOf(name) !== index);

  return {
    files,
    imageEntries,
    audioEntries,
    docs,
    unsupported,
    duplicatePaths: [...new Set(duplicatePaths)],
    duplicateBasenames: [...new Set(duplicateBasenames)]
  };
}

function levelRows(letter) {
  const rows = [1, 2].map(level => {
    const items = initialSoundWordBank.filter(item => item.letter === letter && item.level === level);
    const imageCount = items.filter(item => fs.existsSync(projectFileForUrl(item.imageUrl))).length;
    const audioCount = items.filter(item => fs.existsSync(projectFileForUrl(item.audioUrl))).length;
    const completeCount = items.filter(item =>
      fs.existsSync(projectFileForUrl(item.imageUrl)) && fs.existsSync(projectFileForUrl(item.audioUrl))
    ).length;

    return { level, expected: items.length, imageCount, audioCount, completeCount };
  });

  return rows;
}

function writeImportedStatus() {
  const imageIds = initialSoundWordBank
    .filter(item => fs.existsSync(projectFileForUrl(item.imageUrl)))
    .map(item => item.id);
  const audioIds = initialSoundWordBank
    .filter(item => fs.existsSync(projectFileForUrl(item.audioUrl)))
    .map(item => item.id);
  const completeIds = initialSoundWordBank
    .filter(item => fs.existsSync(projectFileForUrl(item.imageUrl)) && fs.existsSync(projectFileForUrl(item.audioUrl)))
    .map(item => item.id);

  writeFile(
    path.join(rootDir, "src", "content", "initialSounds", "initialSoundImportedMediaStatus.js"),
    `// Generated by tools/auditInitialSoundsMedia.js. Do not edit by hand.
export const initialSoundImageMediaIds = new Set(${JSON.stringify(imageIds, null, 2)});
export const initialSoundAudioMediaIds = new Set(${JSON.stringify(audioIds, null, 2)});
export const initialSoundCompleteMediaIds = new Set(${JSON.stringify(completeIds, null, 2)});
`
  );
}

function markdownList(items, formatter, limit = 500) {
  if (!items.length) return "- none";
  return items.slice(0, limit).map(formatter).join("\n");
}

const entries = zipEntries(sourceZip);
if (!entries.length) failures.push(`No zip entries found at ${sourceZip}.`);

const analysis = analyzeFiles(entries);
const entrySet = new Set(entries);

const sourceImageMatches = initialSoundWordBank.filter(item => entrySet.has(sourceEntryForUrl(item.imageUrl)));
const sourceAudioMatches = initialSoundWordBank.filter(item => entrySet.has(sourceEntryForUrl(item.audioUrl)));
const sourceCompleteMatches = initialSoundWordBank.filter(item =>
  entrySet.has(sourceEntryForUrl(item.imageUrl)) && entrySet.has(sourceEntryForUrl(item.audioUrl))
);

if (shouldImport) {
  sourceImageMatches.forEach(item => {
    copyZipEntryIfNeeded(sourceEntryForUrl(item.imageUrl), projectFileForUrl(item.imageUrl), "image", item);
  });
  sourceAudioMatches.forEach(item => {
    copyZipEntryIfNeeded(sourceEntryForUrl(item.audioUrl), projectFileForUrl(item.audioUrl), "audio", item);
  });
}

writeImportedStatus();

const missingImageItems = initialSoundWordBank.filter(item => !fs.existsSync(projectFileForUrl(item.imageUrl)));
const missingAudioItems = initialSoundWordBank.filter(item => !fs.existsSync(projectFileForUrl(item.audioUrl)));
const completeItems = initialSoundWordBank.filter(item =>
  fs.existsSync(projectFileForUrl(item.imageUrl)) && fs.existsSync(projectFileForUrl(item.audioUrl))
);

const targetWords = initialSoundWordBank.map(item => `${item.letter}|${item.level}|${normalizeInitialSoundWord(item.targetWord)}`);
const duplicateTargets = targetWords.filter((item, index) => targetWords.indexOf(item) !== index);
const lettersInBank = new Set(initialSoundWordBank.map(item => item.letter));

const extraImageEntries = analysis.imageEntries.filter(entry => {
  const normalized = entry.replace(/^public\//, "/");
  return !initialSoundWordBank.some(item => item.imageUrl === normalized);
});
const extraAudioEntries = analysis.audioEntries.filter(entry => {
  const normalized = entry.replace(/^public\//, "/");
  return !initialSoundWordBank.some(item => item.audioUrl === normalized);
});

analysis.unsupported.forEach(entry => rejectedFiles.push({ entry, reason: "unsupported file type" }));
analysis.imageEntries.filter(entry => !entry.endsWith(".webp")).forEach(entry => {
  rejectedFiles.push({ entry, reason: "image is not expected .webp format" });
});
analysis.audioEntries.filter(entry => !entry.endsWith(".mp3")).forEach(entry => {
  rejectedFiles.push({ entry, reason: "audio is not expected .mp3 format" });
});

completeItems.slice(0, 75).forEach(item => {
  const imagePath = projectFileForUrl(item.imageUrl);
  const audioPath = projectFileForUrl(item.audioUrl);
  const duration = audioDurationSeconds(audioPath);
  if (duration !== null && (duration < 0.15 || duration > 4)) {
    manualReview.push(`${item.letter}/${normalizeInitialSoundWord(item.targetWord)} audio duration ${duration.toFixed(2)}s looks unusual.`);
  }
  const info = imageInfo(imagePath);
  if (!/(WEBP image data|Web\/P image)/i.test(info)) {
    manualReview.push(`${item.letter}/${normalizeInitialSoundWord(item.targetWord)} image metadata is unusual: ${info}`);
  }
});

if (initialSoundWordBank.length < 500) failures.push(`Expected at least 500 Initial Sounds items, found ${initialSoundWordBank.length}.`);
if (initialSoundWordBank.some(item => item.letter === "x")) failures.push("Initial Sounds bank contains X item(s).");
if (duplicateTargets.length) failures.push(`Duplicate target words within same letter/level: ${[...new Set(duplicateTargets)].join(", ")}.`);
INITIAL_SOUND_LETTERS.forEach(letter => {
  if (!lettersInBank.has(letter)) failures.push(`Missing letter ${letter}.`);
  [1, 2].forEach(level => {
    const count = initialSoundWordBank.filter(item => item.letter === letter && item.level === level).length;
    if (count < 10) failures.push(`${letter.toUpperCase()} Level ${level} has fewer than 10 content items.`);
  });
});
if (missingImageItems.length) failures.push(`${missingImageItems.length} active Initial Sounds items are missing images.`);
if (missingAudioItems.length) failures.push(`${missingAudioItems.length} active Initial Sounds items are missing audio.`);

const perLetterRows = INITIAL_SOUND_LETTERS.flatMap(letter => levelRows(letter).map(row =>
  `| ${letter} | ${row.level} | ${row.expected} | ${row.imageCount} | ${row.audioCount} | ${row.completeCount} | ${row.expected - row.completeCount} |`
)).join("\n");

const missingRows = initialSoundWordBank
  .filter(item => missingImageItems.includes(item) || missingAudioItems.includes(item))
  .map(item => {
    const missing = [
      missingImageItems.includes(item) ? "image" : "",
      missingAudioItems.includes(item) ? "audio" : ""
    ].filter(Boolean).join(", ");
    return `| ${item.letter} | ${item.level} | ${item.targetWord} | ${missing} | ${item.imageUrl} | ${item.audioUrl} |`;
  })
  .join("\n");

writeFile(
  path.join(rootDir, "docs", "assets", "initial_sounds_500_asset_import_audit.md"),
  `# Initial Sounds 500 Asset Import Audit

Date: 2026-05-25

## Source

- Source folder: ${sourceDir}
- Source archive: ${sourceZip}
- Import mode used: ${shouldImport ? "yes" : "no"}

## Summary

- Expected content items: ${initialSoundWordBank.length}
- Expected image assets: 500
- Expected audio assets: 500
- Source image files in archive: ${analysis.imageEntries.length}
- Source audio files in archive: ${analysis.audioEntries.length}
- Exact source image matches to word bank: ${sourceImageMatches.length}
- Exact source audio matches to word bank: ${sourceAudioMatches.length}
- Exact source complete image+audio pairs: ${sourceCompleteMatches.length}
- Project imported/present image matches: ${initialSoundWordBank.length - missingImageItems.length}
- Project imported/present audio matches: ${initialSoundWordBank.length - missingAudioItems.length}
- Project complete image+audio pairs: ${completeItems.length}
- Missing images after import: ${missingImageItems.length}
- Missing audio after import: ${missingAudioItems.length}
- X items active: ${initialSoundWordBank.some(item => item.letter === "x") ? "yes" : "no"}
- Duplicate archive paths: ${analysis.duplicatePaths.length}
- Duplicate archive basenames: ${analysis.duplicateBasenames.length}
- Extra image files not in requested word bank: ${extraImageEntries.length}
- Extra audio files not in requested word bank: ${extraAudioEntries.length}
- Rejected/unsupported files: ${rejectedFiles.length}
- Manual review notes: ${manualReview.length}

## Per-Letter Coverage

| Letter | Level | Expected Items | Images Present | Audio Present | Complete Pairs | Missing Complete Pairs |
|---|---:|---:|---:|---:|---:|---:|
${perLetterRows}

## Missing Required Assets

| Letter | Level | Word | Missing | Expected Image | Expected Audio |
|---|---:|---|---|---|---|
${missingRows || "| - | - | none | none | - | - |"}

## Extra Archive Images Not Used

${markdownList(extraImageEntries, entry => `- ${entry}`, 260)}

## Extra Archive Audio Not Used

${markdownList(extraAudioEntries, entry => `- ${entry}`, 260)}

## Duplicate Filenames

${markdownList(analysis.duplicateBasenames, item => `- ${item}`)}

## Rejected Files

${markdownList(rejectedFiles, item => `- ${item.entry}: ${item.reason}`)}

## Manual Review Notes

${markdownList(manualReview, item => `- ${item}`)}

## Status

${failures.length ? `FAIL\n\n${failures.map(item => `- ${item}`).join("\n")}` : "PASS"}
`
);

console.log(`Initial Sounds media source images: ${analysis.imageEntries.length}`);
console.log(`Initial Sounds media source audio: ${analysis.audioEntries.length}`);
console.log(`Exact image matches: ${sourceImageMatches.length}`);
console.log(`Exact audio matches: ${sourceAudioMatches.length}`);
console.log(`Complete imported/present pairs: ${completeItems.length}`);
console.log(`Missing images: ${missingImageItems.length}`);
console.log(`Missing audio: ${missingAudioItems.length}`);
console.log(`Wrote docs/assets/initial_sounds_500_asset_import_audit.md`);
console.log(`Wrote src/content/initialSounds/initialSoundImportedMediaStatus.js`);

if (failures.length) {
  console.error(`Initial Sounds media validation failed: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Initial Sounds media validation passed.");
