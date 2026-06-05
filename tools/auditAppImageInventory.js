import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { writeFile } from "./phonicsRuntimeUtils.js";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const publicRoot = path.join(repoRoot, "public");
const outputJsonPath = path.join(repoRoot, "docs", "validation", "app_image_inventory_audit.json");
const outputMdPath = path.join(repoRoot, "docs", "validation", "app_image_inventory_audit.md");
const outputCsvPath = path.join(repoRoot, "docs", "validation", "app_image_inventory.csv");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);
const SCAN_SOURCE_DIRS = ["src", "docs/assets", "docs/imports"];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

function readTextFiles(dir, out = []) {
  const absolute = path.join(repoRoot, dir);
  if (!fs.existsSync(absolute)) return out;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", "contact-sheets"].includes(entry.name)) continue;
    const full = path.join(absolute, entry.name);
    if (entry.isDirectory()) readTextFiles(path.relative(repoRoot, full), out);
    else if (/\.(?:js|jsx|ts|tsx|json|md|css|html)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function publicPath(filePath) {
  return `/${path.relative(publicRoot, filePath).replace(/\\/g, "/")}`;
}

function areaFor(assetPath = "") {
  const lower = assetPath.toLowerCase();
  if (lower.includes("/images/assessment/")) return "assessment";
  if (lower.includes("/media/vocabulary/images/")) return "vocabulary";
  if (lower.includes("/guided-reading/")) return "guided_reading";
  if (lower.includes("/images/story-quests/")) return "story_quest";
  if (lower.includes("/images/generated/")) return "generated";
  return "unknown";
}

function styleExpectedFor(area, assetPath = "") {
  if (area === "assessment" && assetPath.includes("/hfw/")) return "clear K-2 cartoon scene; no text/watermark";
  if (area === "assessment") return "simple clear K-2 assessment art";
  if (area === "vocabulary") return "clear target object/action art";
  if (area === "guided_reading") return "guided reading page/cover style continuity";
  if (area === "story_quest") return "story quest character/style continuity";
  return "app-appropriate K-2 image";
}

function targetWordFor(assetPath = "") {
  const filename = path.basename(assetPath).replace(/\.[a-z0-9]+$/i, "");
  const hfw = filename.match(/hfw_workbook_[^_]+_[^_]+_(.+?)_s\d+/);
  if (hfw) return hfw[1].replace(/_/g, " ");
  return filename
    .replace(/^(?:noun|verb|adjective|preposition|plural|antonym|synonym)[-_]/i, "")
    .replace(/[-_]\d+$/i, "")
    .replace(/[-_]+/g, " ");
}

function skillFor(assetPath = "") {
  const lower = assetPath.toLowerCase();
  const hfw = lower.match(/hfw_(\d+_\d+)/);
  if (hfw) return `hfw_${hfw[1]}`;
  if (lower.includes("rhym")) return "rhyming";
  if (lower.includes("initial")) return "initial_sounds";
  if (lower.includes("final")) return "final_sounds";
  if (lower.includes("cvc")) return "cvc_short_vowels";
  if (lower.includes("preposition")) return "prepositions";
  if (lower.includes("plural")) return "plurals";
  if (lower.includes("antonym") || lower.includes("synonym")) return "antonyms_synonyms";
  if (lower.includes("homophone") || lower.includes("homonym")) return "homophones_homonyms";
  return "";
}

function dimensions(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);
  if (ext === ".png" && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if ([".jpg", ".jpeg"].includes(ext)) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  if (ext === ".webp" && buffer.toString("ascii", 0, 4) === "RIFF") {
    const type = buffer.toString("ascii", 12, 16);
    if (type === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (type === "VP8 " && buffer.length > 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff
      };
    }
    if (type === "VP8L" && buffer.length > 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (ext === ".gif") return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  if (ext === ".svg") {
    const text = buffer.toString("utf8");
    const width = Number(text.match(/\bwidth=["']?(\d+)/i)?.[1] || 0);
    const height = Number(text.match(/\bheight=["']?(\d+)/i)?.[1] || 0);
    return { width, height };
  }
  return { width: 0, height: 0 };
}

function csvEscape(value = "") {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const sourceFiles = readTextFiles("src");
for (const dir of SCAN_SOURCE_DIRS.filter(dir => dir !== "src")) readTextFiles(dir, sourceFiles);
const sourceTexts = sourceFiles.map(file => ({
  file: path.relative(repoRoot, file).replace(/\\/g, "/"),
  text: fs.readFileSync(file, "utf8")
}));

const images = walk(publicRoot).map((filePath, index) => {
  const assetPath = publicPath(filePath);
  const area = areaFor(assetPath);
  const refs = sourceTexts.filter(source => source.text.includes(assetPath)).map(source => source.file);
  const stat = fs.statSync(filePath);
  const { width, height } = dimensions(filePath);
  const hash = crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
  return {
    image_id: `img_${String(index + 1).padStart(6, "0")}`,
    path: assetPath,
    filename: path.basename(filePath),
    extension: path.extname(filePath).toLowerCase().replace(".", ""),
    folder: path.dirname(assetPath),
    area,
    width,
    height,
    file_size_bytes: stat.size,
    sha1: hash,
    used_by_app: refs.length ? "yes" : "unknown",
    referenced_by: refs.slice(0, 12).join("; "),
    target_word: targetWordFor(assetPath),
    skill_id: skillFor(assetPath),
    book_id: assetPath.match(/\/book-\d+/i)?.[0]?.replace("/", "") || "",
    story_id: assetPath.match(/\/story-quests\/([^/]+)/i)?.[1] || "",
    page_id: assetPath.match(/\/page[-_]?(\d+)/i)?.[1] || "",
    current_qa_status: "unreviewed",
    style_expected: styleExpectedFor(area, assetPath),
    replacement_priority: area === "assessment" ? "high" : area === "guided_reading" || area === "story_quest" ? "medium" : "normal",
    notes: ""
  };
});

const columns = [
  "image_id", "path", "filename", "extension", "folder", "area", "width", "height",
  "file_size_bytes", "used_by_app", "referenced_by", "target_word", "skill_id",
  "book_id", "story_id", "page_id", "current_qa_status", "style_expected",
  "replacement_priority", "notes", "sha1"
];

writeFile(outputJsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), totalImages: images.length, images }, null, 2)}\n`);
writeFile(outputCsvPath, [
  columns.join(","),
  ...images.map(row => columns.map(column => csvEscape(row[column])).join(","))
].join("\n"));

const byArea = images.reduce((counts, row) => {
  counts[row.area] = (counts[row.area] || 0) + 1;
  return counts;
}, {});
writeFile(outputMdPath, [
  "# App Image Inventory Audit",
  "",
  `- Total images inventoried: ${images.length}`,
  "",
  "## By Area",
  "",
  "| Area | Images |",
  "| --- | --- |",
  ...Object.entries(byArea).sort().map(([area, count]) => `| ${area} | ${count} |`),
  ""
].join("\n"));

console.log(JSON.stringify({ totalImages: images.length, byArea }, null, 2));
