import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const packs = [
  {
    id: "kimi_assets5",
    root: "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Assets 5"
  },
  {
    id: "kimi_assets6",
    root: "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Assets 6"
  }
];

const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const supportedExtensions = new Set([...audioExtensions, ...imageExtensions, ".json", ".docx", ".ts"]);

function walkFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }

  return files;
}

function fileHash(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function normalizeKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "");
}

function categoryForCompleteAudio(relativeFile) {
  const parts = relativeFile.split(path.sep);
  if (parts.includes("hfw")) return "hfw";
  if (parts.includes("phrases")) return "phrases";
  return "words";
}

function cleanHumanPublicPath(category, key) {
  return `/audio/child-mode/clean-human/${category}/${key}.mp3`;
}

function projectFile(publicPath) {
  return path.join(rootDir, "public", publicPath);
}

function projectAudioCandidates(key) {
  return [
    `/audio/child-mode/words/${key}.mp3`,
    `/audio/child-mode/hfw/${key}.mp3`,
    `/audio/child-mode/phrases/${key}.mp3`,
    `/audio/child-mode/words/${key}-kimi3.mp3`,
    `/audio/child-mode/words/${key}-kimi4.mp3`,
    `/audio/child-mode/phrases/${key}-kimi3.mp3`
  ].filter(publicPath => fs.existsSync(projectFile(publicPath)));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\n/g, " ").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function writeManifest(entries) {
  const manifestPath = path.join(rootDir, "src", "data", "kimiCleanAudioManifest.js");
  const sortedEntries = entries.sort((a, b) => a.key.localeCompare(b.key) || a.category.localeCompare(b.category));
  const content = `export const kimiCleanAudioAssets = ${JSON.stringify(sortedEntries, null, 2)};\n\n` +
    "export const kimiCleanAudioByKey = Object.fromEntries(\n" +
    "  kimiCleanAudioAssets.map(asset => [asset.key, asset])\n" +
    ");\n\n" +
    "export function getKimiCleanAudio(key) {\n" +
    "  return kimiCleanAudioByKey[String(key || \"\").toLowerCase().trim()] || null;\n" +
    "}\n";
  fs.writeFileSync(manifestPath, content);
  return manifestPath;
}

function main() {
  const discoveredRows = [];
  const duplicateNameRows = [];
  const unsupportedRows = [];
  const importedRows = [];
  const skippedRows = [];
  const reviewRows = [];
  const entries = [];
  const allBasenames = new Map();

  for (const pack of packs) {
    const files = walkFiles(pack.root);
    const audioFiles = files.filter(file => audioExtensions.has(path.extname(file).toLowerCase()));
    const imageFiles = files.filter(file => imageExtensions.has(path.extname(file).toLowerCase()));
    const manifestFiles = files.filter(file => [".json", ".ts"].includes(path.extname(file).toLowerCase()));
    const unsupportedFiles = files.filter(file => !supportedExtensions.has(path.extname(file).toLowerCase()));

    discoveredRows.push([
      pack.id,
      files.length,
      audioFiles.length,
      imageFiles.length,
      manifestFiles.map(file => path.relative(pack.root, file)).join(", ") || "none",
      unsupportedFiles.length
    ]);

    for (const file of files) {
      const basename = path.basename(file).toLowerCase();
      const seen = allBasenames.get(basename) || [];
      seen.push(`${pack.id}:${path.relative(pack.root, file)}`);
      allBasenames.set(basename, seen);
    }

    for (const file of unsupportedFiles) {
      unsupportedRows.push([pack.id, path.relative(pack.root, file), path.extname(file) || "(none)"]);
    }
  }

  for (const [basename, locations] of allBasenames.entries()) {
    if (locations.length > 1) {
      duplicateNameRows.push([basename, locations.length, locations.slice(0, 8).join("; ")]);
    }
  }

  const completeAudioRoot = path.join(packs[1].root, "literacypath-complete-audio", "audio");
  const completeManifestPath = path.join(packs[1].root, "literacypath-complete-audio", "audio-manifest.json");
  const completeManifest = JSON.parse(fs.readFileSync(completeManifestPath, "utf8"));

  for (const item of completeManifest) {
    const sourcePath = path.join(completeAudioRoot, item.audioFile);
    if (!fs.existsSync(sourcePath)) {
      reviewRows.push([item.key, item.audioFile, "manifest entry missing source file"]);
      continue;
    }

    const key = normalizeKey(item.key);
    const category = categoryForCompleteAudio(item.audioFile);
    const publicPath = cleanHumanPublicPath(category, key);
    const destinationPath = projectFile(publicPath);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    const incomingHash = fileHash(sourcePath);
    const existingProjectMatches = projectAudioCandidates(key)
      .map(candidate => ({
        path: candidate,
        hash: fileHash(projectFile(candidate))
      }))
      .filter(candidate => candidate.hash === incomingHash)
      .map(candidate => candidate.path);

    if (fs.existsSync(destinationPath)) {
      const destinationHash = fileHash(destinationPath);
      if (destinationHash === incomingHash) {
        skippedRows.push([key, publicPath, "exact duplicate already imported"]);
      } else {
        fs.copyFileSync(sourcePath, destinationPath);
        importedRows.push([key, publicPath, "updated clean-human file with Pack 6 complete-audio version"]);
      }
    } else {
      fs.copyFileSync(sourcePath, destinationPath);
      importedRows.push([
        key,
        publicPath,
        existingProjectMatches.length
          ? `imported clean-human copy; exact duplicate also exists at ${existingProjectMatches.join(", ")}`
          : "imported clean-human replacement candidate"
      ]);
    }

    entries.push({
      key,
      textSpoken: item.textSpoken || key.replace(/-/g, " "),
      audio: publicPath,
      category,
      source: "kimi_assets6_complete_audio",
      status: "approved",
      voiceStyle: item.voiceStyle || "calm friendly adult teacher voice",
      notes: item.notes || "Pack 6 complete clean audio"
    });
  }

  const manifestPath = writeManifest(entries);

  const docPath = path.join(rootDir, "docs", "assets", "kimi_assets5_6_import_report.md");
  fs.mkdirSync(path.dirname(docPath), { recursive: true });
  const body = [
    "# Kimi Asset Packs 5 + 6 Import Report",
    "",
    "Generated by `node tools/importKimiAudioPacks5And6.js`.",
    "",
    "Pack 6 `literacypath-complete-audio` is treated as the approved clean-human replacement source for Teacher Assessment audio. Existing audio files are preserved; no older file is deleted or overwritten.",
    "",
    "## Discovery",
    "",
    markdownTable(["pack", "total files", "audio files", "image files", "manifest/source files", "unsupported files"], discoveredRows),
    "",
    "## Imported Approved Clean Audio",
    "",
    markdownTable(["key", "imported path", "note"], importedRows),
    "",
    "## Skipped Exact Duplicates",
    "",
    skippedRows.length
      ? markdownTable(["key", "path", "note"], skippedRows)
      : "No previously imported clean-human files were skipped.",
    "",
    "## Duplicate Filenames Across Packs",
    "",
    markdownTable(["filename", "count", "sample locations"], duplicateNameRows.slice(0, 200)),
    "",
    "## Unsupported Files",
    "",
    unsupportedRows.length
      ? markdownTable(["pack", "path", "extension"], unsupportedRows)
      : "No unsupported files found.",
    "",
    "## Review Needed",
    "",
    reviewRows.length
      ? markdownTable(["key", "path", "note"], reviewRows)
      : "No manifest/source mismatches found.",
    "",
    "## Manifest Updated",
    "",
    `- ${path.relative(rootDir, manifestPath)}`
  ].join("\n");
  fs.writeFileSync(docPath, `${body}\n`);

  console.log(`Imported clean audio files: ${importedRows.length}`);
  console.log(`Skipped exact duplicates: ${skippedRows.length}`);
  console.log(`Wrote ${path.relative(rootDir, manifestPath)}`);
  console.log(`Wrote ${path.relative(rootDir, docPath)}`);
}

main();
