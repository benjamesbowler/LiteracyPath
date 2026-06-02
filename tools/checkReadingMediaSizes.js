import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const reportPath = path.join(repoRoot, "docs/validation/reading_media_size_audit.md");

const scanRoots = [
  "public/images/story-quests",
  "public/audio/story-quests",
  "public/guided-reading/series"
];

const IMAGE_EXTENSIONS = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif"]);
const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav", ".ogg"]);
const LIVE_RASTER_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const TEMP_FILE_NAMES = new Set([".ds_store", "plan.md"]);
const TEMP_NAME_PATTERNS = [
  /^ref[_-]/i,
  /reference/i,
  /source/i,
  /prompt/i
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function bytesToKb(bytes) {
  return Math.round(bytes / 1024);
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function isStoryQuestImage(file) {
  return relative(file).startsWith("public/images/story-quests/");
}

function isStoryQuestAudio(file) {
  return relative(file).startsWith("public/audio/story-quests/");
}

function isGuidedReadingSeries(file) {
  return relative(file).startsWith("public/guided-reading/series/");
}

function isGuidedReadingImage(file) {
  const ext = path.extname(file).toLowerCase();
  return isGuidedReadingSeries(file) && IMAGE_EXTENSIONS.has(ext);
}

function isGuidedReadingCover(file) {
  return isGuidedReadingImage(file) && path.basename(file).toLowerCase().startsWith("cover.");
}

function isGuidedReadingPageImage(file) {
  return isGuidedReadingImage(file) && path.basename(file).toLowerCase().startsWith("page-");
}

function isAudio(file) {
  return AUDIO_EXTENSIONS.has(path.extname(file).toLowerCase());
}

function isTempOrSourceFile(file) {
  const name = path.basename(file).toLowerCase();
  if (TEMP_FILE_NAMES.has(name)) return true;
  return TEMP_NAME_PATTERNS.some(pattern => pattern.test(path.basename(file)));
}

function markdownTable(rows, columns) {
  if (!rows.length) return "None.\n";
  const header = `| ${columns.join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map(row => `| ${columns.map(column => row[column] ?? "").join(" | ")} |`);
  return [header, divider, ...body].join("\n") + "\n";
}

const files = scanRoots.flatMap(root => walk(path.join(repoRoot, root)));
const findings = [];
const failures = [];

for (const file of files) {
  const rel = relative(file);
  const ext = path.extname(file).toLowerCase();
  const sizeKb = bytesToKb(fs.statSync(file).size);

  if (isStoryQuestImage(file) && ext === ".webp" && sizeKb > 250) {
    findings.push({
      Type: "Story Quest image > 250 KB",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Target 120-220 KB where quality allows."
    });
  }

  if (isGuidedReadingPageImage(file) && sizeKb > 300) {
    findings.push({
      Type: "Guided Reading page image > 300 KB",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Target 150-300 KB where quality allows."
    });
  }

  if (isGuidedReadingCover(file) && sizeKb > 250) {
    findings.push({
      Type: "Guided Reading cover > 250 KB",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Target under 200 KB where quality allows."
    });
  }

  if ((isStoryQuestAudio(file) || isGuidedReadingSeries(file)) && isAudio(file) && sizeKb > 1536) {
    findings.push({
      Type: "Audio > 1.5 MB",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Keep metadata preload; handle audio compression separately."
    });
  }

  if ((isStoryQuestImage(file) || isGuidedReadingImage(file)) && LIVE_RASTER_EXTENSIONS.has(ext)) {
    const finding = {
      Type: "Live non-WebP image",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Convert/remove live PNG/JPG from public image folders."
    };
    findings.push(finding);
    failures.push(finding);
  }

  if ((isStoryQuestImage(file) || isGuidedReadingSeries(file)) && isTempOrSourceFile(file)) {
    const finding = {
      Type: "Temporary/source file in live folder",
      File: rel,
      Size: `${sizeKb} KB`,
      Recommendation: "Remove temp/source/reference files from public live media folders."
    };
    findings.push(finding);
    failures.push(finding);
  }
}

const largest = files
  .map(file => ({
    File: relative(file),
    Size: `${bytesToKb(fs.statSync(file).size)} KB`
  }))
  .sort((a, b) => Number.parseInt(b.Size, 10) - Number.parseInt(a.Size, 10))
  .slice(0, 50);

const byType = findings.reduce((counts, finding) => {
  counts[finding.Type] = (counts[finding.Type] || 0) + 1;
  return counts;
}, {});

const report = [
  "# Reading Media Size Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `- Files scanned: ${files.length}`,
  `- Findings: ${findings.length}`,
  `- Failing live file issues: ${failures.length}`,
  "",
  markdownTable(
    Object.entries(byType).map(([Type, Count]) => ({ Type, Count })),
    ["Type", "Count"]
  ),
  "## Failing Live File Issues",
  "",
  "These fail the check because live image folders should not contain PNG/JPG/temp/source files.",
  "",
  markdownTable(failures, ["Type", "File", "Size", "Recommendation"]),
  "## Oversized / Compression Recommendations",
  "",
  "These are warnings only. Do not automatically recompress in this phase.",
  "",
  markdownTable(findings.filter(finding => !failures.includes(finding)), ["Type", "File", "Size", "Recommendation"]),
  "## Top 50 Largest Files",
  "",
  markdownTable(largest, ["File", "Size"]),
  "## Recommended Targets",
  "",
  "- Story Quest page images: ideally 120-220 KB.",
  "- Guided Reading page images: ideally 150-300 KB.",
  "- Covers: ideally under 200 KB.",
  "- Audio: metadata-preload only in this phase; compression should be handled separately.",
  ""
].join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

console.log("Reading media size audit complete.");
console.table({
  filesScanned: files.length,
  findings: findings.length,
  failingLiveFileIssues: failures.length,
  report: relative(reportPath)
});

if (failures.length) {
  process.exitCode = 1;
}
