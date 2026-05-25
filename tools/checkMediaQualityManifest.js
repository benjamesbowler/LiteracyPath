import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const auditPath = path.join(rootDir, "docs", "assets", "image_quality_visual_audit.md");
const rejectedRoot = path.join(rootDir, "public", "media", "_rejected");
const dateStamp = new Date().toISOString().slice(0, 10);

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function markdownTable(headers, rows) {
  if (!rows.length) return "_None._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(value => String(value ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function extractNumber(label, text) {
  const match = text.match(new RegExp(`- ${label}: (\\d+)`));
  return match ? Number(match[1]) : 0;
}

function parseHeuristicRows(text) {
  const section = text.split("## Color-Heuristic Manual Review Warnings")[1]?.split("## Known Semantic Conflict Checks")[0] || "";
  return section
    .split("\n")
    .filter(line => line.startsWith("| ") && !line.includes("---") && !line.includes("word(s)"))
    .map(line => line.split("|").slice(1, -1).map(cell => cell.trim()))
    .filter(cells => cells.length >= 6)
    .map(([word, imagePath, saturatedRatio, brightRatio, hueBuckets, warning]) => ({
      word,
      imagePath,
      saturatedRatio,
      brightRatio,
      hueBuckets,
      warning
    }));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

execFileSync("node", [path.join(rootDir, "tools", "auditImageQuality.js")], {
  cwd: rootDir,
  stdio: "inherit"
});

const audit = fs.readFileSync(auditPath, "utf8");
const likelyRainbow = extractNumber("Likely rainbow/over-stylized active mappings", audit);
const knownStillActive = extractNumber("Known unsuitable assets still active", audit);
const excludedStillActive = extractNumber("Excluded weird/unusual targets still active", audit);
const semanticFailures = extractNumber("Known semantic conflict failures", audit);
const heuristicRows = parseHeuristicRows(audit);
const failures = [];

if (likelyRainbow) failures.push(`${likelyRainbow} active image mappings are likely rainbow/over-stylized.`);
if (knownStillActive) failures.push(`${knownStillActive} known unsuitable image mappings are still active.`);
if (excludedStillActive) failures.push(`${excludedStillActive} excluded weird target words are still active.`);
if (semanticFailures) failures.push(`${semanticFailures} known semantic image conflicts are active.`);

const rejectedRows = walk(rejectedRoot).map(filePath => [
  path.relative(rootDir, filePath),
  fs.statSync(filePath).size,
  filePath.includes("rainbow_or_sparkly") ? "rainbow/sparkly archive" : "pre-replacement archive"
]);

const replacementRows = [
  ["acorn", "Initial Sounds", "/media/initial-sounds/images/a/acorn.webp", "rainbow/sparkly or babyfied prior version", "replaced"],
  ["gum", "Initial Sounds", "/media/initial-sounds/images/g/gum.webp", "face/decorative prior version", "replaced"],
  ["hat", "Initial Sounds", "/media/initial-sounds/images/h/hat.webp", "face/decorative prior version", "replaced"],
  ["jam", "Initial Sounds", "/media/initial-sounds/images/j/jam.webp", "face/decorative prior version", "replaced"],
  ["leg", "Initial Sounds", "/media/initial-sounds/images/l/leg.webp", "face/decorative prior version", "replaced"],
  ["nut", "Initial Sounds", "/media/initial-sounds/images/n/nut.webp", "rainbow/confusable prior version", "replaced"],
  ["sun", "Initial Sounds", "/media/initial-sounds/images/s/sun.webp", "face/sunglasses prior version", "replaced"],
  ["wig", "Initial Sounds", "/media/initial-sounds/images/w/wig.webp", "face/rainbow prior version", "replaced"],
  ["nut", "Shared Short Vowel", "/images/child-mode/short-u/nut.png", "acorn-like prior version", "replaced"]
];

const strictRequestRows = heuristicRows.map(row => [
  row.word,
  "assessment media manual review",
  row.imagePath,
  `Heuristic warning: saturated=${row.saturatedRatio}, bright=${row.brightRatio}, hue buckets=${row.hueBuckets}. ${row.warning}`,
  `Create a clean educational flashcard-style cartoon illustration of a single ${row.word}. Plain pure white background. Centered object only. No shadow. No glow. No aura. No sparkles. No rainbow coloring unless naturally accurate. No face. No eyes. No smile. No arms or legs. No text. No background scene. Natural realistic colors. Simple kindergarten phonics flashcard style. High readability at small size.`
]);

write(path.join(rootDir, "docs", "assets", "media_replacement_log.md"), `# Media Replacement Log

Date: ${dateStamp}

## Replaced Or Restored From Approved Media

${markdownTable(["Target Word", "Skill", "Active Path", "Reason Rejected", "Status"], replacementRows)}

## Current Confirmed Active Bad Media

${failures.length ? failures.map(failure => `- ${failure}`).join("\n") : "_None._"}

## Manual Review Candidates

${markdownTable(["Target Word", "Active Path", "Saturation", "Brightness", "Hue Buckets", "Reason"], heuristicRows.map(row => [
  row.word,
  row.imagePath,
  row.saturatedRatio,
  row.brightRatio,
  row.hueBuckets,
  row.warning
]))}
`);

write(path.join(rootDir, "docs", "assets", "rejected_media_manifest.md"), `# Rejected Media Manifest

Date: ${dateStamp}

Rejected media is preserved for traceability. These files are not used by active student-facing assessment content.

${markdownTable(["Archived File", "Bytes", "Reason"], rejectedRows)}
`);

write(path.join(rootDir, "docs", "assets", "kimi_strict_media_replacement_request.md"), `# Kimi Strict Media Replacement Request

Date: ${dateStamp}

This file is pasteable into Kimi. These are image replacement candidates for media that failed or may fail the strict literacy flashcard standard. Confirmed bad media has already been replaced or blocked; the rows below are remaining manual-review candidates from the color/quality heuristic.

## Global Image Rules

Create a clean educational flashcard-style cartoon illustration of a single object. Plain pure white background. Centered object only. No shadow. No glow. No aura. No sparkles. No rainbow coloring unless naturally accurate. No face. No eyes. No smile. No arms or legs. No text. No background scene. Natural realistic colors. Simple kindergarten phonics flashcard style. High readability at small size.

## Image Replacement Candidates

${markdownTable(["Target Word", "Skill", "Exact Output Path", "Reason", "Prompt"], strictRequestRows)}

## Audio Requests

No audio replacement is requested unless a future audio audit marks a file missing or genuinely broken.
`);

console.log("Media quality manifest check complete.");
console.log(`Manual review image candidates: ${heuristicRows.length}`);
console.log("Wrote docs/assets/media_replacement_log.md");
console.log("Wrote docs/assets/rejected_media_manifest.md");
console.log("Wrote docs/assets/kimi_strict_media_replacement_request.md");

if (failures.length) {
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Media quality manifest check passed.");
