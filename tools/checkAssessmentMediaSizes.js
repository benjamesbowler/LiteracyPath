import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const SCAN_DIRS = [
  path.join(rootDir, "public/images/assessment"),
  path.join(rootDir, "public/audio/assessment")
];

const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".webm"]);
const ALLOWED_NON_WEBP_EXTENSIONS = new Set([".svg"]);
const ALLOWED_NON_WEBP_FILES = new Set([]);

const IMAGE_LIMIT_BYTES = 200 * 1024;
const AUDIO_LIMIT_BYTES = 300 * 1024;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap(entry => {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return walkFiles(entryPath);
    if (!entry.isFile()) return [];
    return [entryPath];
  });
}

const files = SCAN_DIRS.flatMap(walkFiles)
  .map(filePath => {
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const rel = relativePath(filePath);
    const type = IMAGE_EXTENSIONS.has(ext)
      ? "image"
      : AUDIO_EXTENSIONS.has(ext)
        ? "audio"
        : "other";

    return {
      path: rel,
      ext,
      size: stat.size,
      type
    };
  })
  .filter(file => file.type !== "other");

console.log("Assessment media size audit");
console.log(`Scanned ${files.length} image/audio file(s).`);

if (files.length === 0) {
  console.log("No assessment media files found in public/images/assessment or public/audio/assessment.");
  process.exit(0);
}

console.log("\nTop 50 largest assessment media files:");
files
  .slice()
  .sort((a, b) => b.size - a.size)
  .slice(0, 50)
  .forEach((file, index) => {
    console.log(`${String(index + 1).padStart(2, " ")}. ${formatBytes(file.size).padStart(9, " ")}  ${file.path}`);
  });

const oversizedImages = files.filter(file =>
  file.type === "image" && file.size > IMAGE_LIMIT_BYTES
);

const oversizedAudio = files.filter(file =>
  file.type === "audio" && file.size > AUDIO_LIMIT_BYTES
);

const nonWebpImages = files.filter(file =>
  file.type === "image" &&
  file.ext !== ".webp" &&
  !ALLOWED_NON_WEBP_EXTENSIONS.has(file.ext) &&
  !ALLOWED_NON_WEBP_FILES.has(file.path)
);

function printViolationGroup(title, items, limit = 30) {
  if (items.length === 0) return;
  console.log(`\n${title} (${items.length}):`);
  items
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
    .forEach(file => {
      console.log(`- ${formatBytes(file.size)}  ${file.path}`);
    });

  if (items.length > limit) {
    console.log(`...and ${items.length - limit} more.`);
  }
}

printViolationGroup(`Images over ${formatBytes(IMAGE_LIMIT_BYTES)}`, oversizedImages);
printViolationGroup(`Audio over ${formatBytes(AUDIO_LIMIT_BYTES)}`, oversizedAudio);
printViolationGroup("Non-webp assessment images", nonWebpImages);

const violationCount = oversizedImages.length + oversizedAudio.length + nonWebpImages.length;

if (violationCount > 0) {
  console.error(`\nAssessment media audit failed with ${violationCount} issue(s). Compress/convert these assets or add a deliberate allowlist entry.`);
  process.exit(1);
}

console.log("\nAssessment media audit passed.");
