import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Widened 2026-09-03: this used to scan only public/images/assessment and
// public/audio/assessment (a path that doesn't exist - production audio
// lives at public/audio/production - so the audio half of this check was a
// silent no-op). It now covers every image bucket and the real audio
// corpus. public/audio/{music,phonemes,ui} are deliberately excluded: that's
// background music and UI cues, a different content class with its own
// size/quality tradeoffs, not TTS speech.
const SCAN_DIRS = [
  path.join(rootDir, "public/images"),
  path.join(rootDir, "public/guided-reading"),
  path.join(rootDir, "public/media"),
  path.join(rootDir, "public/audio/production")
];

const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif", ".svg"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".ogg", ".wav", ".webm"]);
const ALLOWED_NON_WEBP_EXTENSIONS = new Set([".svg"]);

// PNGs with no live reference anywhere - see tools/knownOrphanedMedia.json
// for how this list was built and why it's safe to exclude them here.
const orphanedMediaPath = path.join(rootDir, "tools/knownOrphanedMedia.json");
const ALLOWED_NON_WEBP_FILES = new Set(
  fs.existsSync(orphanedMediaPath)
    ? JSON.parse(fs.readFileSync(orphanedMediaPath, "utf8")).paths
    : []
);

const IMAGE_LIMIT_BYTES = 200 * 1024;
// The 200KB budget was built for public/images/assessment - small,
// per-question thumbnails. It stays a hard (release-blocking) gate there.
// Widening SCAN_DIRS above also pulled in full-bleed illustration content
// (preposition scenes, phonics word art, guided-reading book pages) that
// was never under any size budget and often legitimately needs to be
// larger than a thumbnail. Retroactively forcing thousands of pre-existing,
// still-referenced images under a thumbnail budget is a real optimisation
// project (quality tradeoffs, art-direction review) - not something to
// silently gate the release on. So outside the original assessment scope,
// oversized images are reported as a non-blocking backlog instead.
const IMAGE_SIZE_HARD_GATE_PREFIX = "public/images/assessment/";
// 350KB, not 300KB: the real production audio corpus includes full
// multi-sentence instruction/passage reads up to ~57s at 48kbps mono
// (~336KB) alongside single-word clips a few KB each. 350KB keeps the
// budget meaningful (it's still a ~3x tightening versus the 128kbps CBR
// this corpus shipped at before 2026-09-03) without flagging legitimately
// long, already-optimised content.
const AUDIO_LIMIT_BYTES = 350 * 1024;

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function relativePath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

// This device/mount cannot unlink files, so every PNG converted to WebP by
// the 2026-09-03 conversion pass still physically exists alongside its new
// .webp sibling. Those old PNGs are unreferenced (see
// .audit-tmp/png-ref-rewrite-report.json / tools/knownOrphanedMedia.json's
// sibling methodology) and safe to git-rm later, but they are not a real
// violation today - skip any PNG that already has a non-empty .webp sibling
// so the check reflects the corpus that actually ships, not disk debris
// this account can't clean up.
function hasConvertedWebpSibling(file) {
  if (file.ext !== ".png") return false;
  const webpPath = path.join(rootDir, file.path.replace(/\.png$/i, ".webp"));
  try {
    return fs.statSync(webpPath).size > 0;
  } catch {
    return false;
  }
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

const supersededPngs = files.filter(hasConvertedWebpSibling);
const supersededPaths = new Set(supersededPngs.map(file => file.path));
const activeFiles = files.filter(file => !supersededPaths.has(file.path));

console.log("Media size audit (images/, guided-reading/, media/, audio/production/)");
console.log(`Scanned ${files.length} image/audio file(s) (${supersededPngs.length} superseded, already-converted PNG originals excluded from checks below).`);

if (activeFiles.length === 0) {
  console.log("No media files found in the scanned directories.");
  process.exit(0);
}

console.log("\nTop 50 largest media files:");
activeFiles
  .slice()
  .sort((a, b) => b.size - a.size)
  .slice(0, 50)
  .forEach((file, index) => {
    console.log(`${String(index + 1).padStart(2, " ")}. ${formatBytes(file.size).padStart(9, " ")}  ${file.path}`);
  });

const oversizedImagesAll = activeFiles.filter(file =>
  file.type === "image" && file.size > IMAGE_LIMIT_BYTES
);
const oversizedImages = oversizedImagesAll.filter(file =>
  file.path.startsWith(IMAGE_SIZE_HARD_GATE_PREFIX)
);
const oversizedImagesBacklog = oversizedImagesAll.filter(file =>
  !file.path.startsWith(IMAGE_SIZE_HARD_GATE_PREFIX)
);

const oversizedAudio = activeFiles.filter(file =>
  file.type === "audio" && file.size > AUDIO_LIMIT_BYTES
);

const nonWebpImages = activeFiles.filter(file =>
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

printViolationGroup(`Images over ${formatBytes(IMAGE_LIMIT_BYTES)} (public/images/assessment - hard gate)`, oversizedImages);
printViolationGroup(`Audio over ${formatBytes(AUDIO_LIMIT_BYTES)}`, oversizedAudio);
printViolationGroup("Non-webp images (not on the known-orphaned allowlist)", nonWebpImages);
if (oversizedImagesBacklog.length > 0) {
  console.log(`\nInformational only, not blocking (${oversizedImagesBacklog.length}): pre-existing images over ${formatBytes(IMAGE_LIMIT_BYTES)} outside public/images/assessment. These predate this check's wider scope and need a real compression/art-direction pass, not a blind resize - tracked as a backlog, not a release blocker.`);
  oversizedImagesBacklog
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .forEach(file => {
      console.log(`- ${formatBytes(file.size)}  ${file.path}`);
    });
  if (oversizedImagesBacklog.length > 10) {
    console.log(`...and ${oversizedImagesBacklog.length - 10} more.`);
  }
}

const violationCount = oversizedImages.length + oversizedAudio.length + nonWebpImages.length;

if (violationCount > 0) {
  console.error(`\nMedia size audit failed with ${violationCount} issue(s). Compress/convert these assets or add a deliberate allowlist entry.`);
  process.exit(1);
}

console.log("\nMedia size audit passed.");
