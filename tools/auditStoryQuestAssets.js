import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { storyQuests } from "../src/data/storyQuests.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const reportPath = path.join(repoRoot, "docs/assets/story_quest_asset_audit.md");
const imageRoot = path.join(repoRoot, "public/images/story-quests");
const audioRoot = path.join(repoRoot, "public/audio/story-quests");

const IMAGE_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const AUDIO_EXTENSIONS = new Set([".aac", ".m4a", ".mp3", ".ogg", ".wav", ".webm"]);

function stripQuery(assetPath = "") {
  return String(assetPath || "").split("?")[0].split("#")[0];
}

function normalizePublicPath(assetPath = "") {
  const clean = stripQuery(assetPath).trim();
  if (!clean) return "";
  return clean.startsWith("/") ? clean : `/${clean}`;
}

function publicPathToFsPath(assetPath = "") {
  const clean = normalizePublicPath(assetPath);
  if (!clean) return "";
  return path.join(repoRoot, "public", clean);
}

function fileExists(assetPath = "") {
  const fsPath = publicPathToFsPath(assetPath);
  return Boolean(fsPath && fs.existsSync(fsPath));
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    if (!entry.isFile()) return [];
    return [fullPath];
  });
}

function toPublicPath(fsPath) {
  return `/${path.relative(path.join(repoRoot, "public"), fsPath).split(path.sep).join("/")}`;
}

function listAssetFiles(root, extensions) {
  return walkFiles(root)
    .filter(file => extensions.has(path.extname(file).toLowerCase()))
    .map(toPublicPath)
    .sort();
}

function findAlternateExtensions(assetPath, availableFiles, extensions) {
  const clean = normalizePublicPath(assetPath);
  if (!clean) return [];
  const parsed = path.posix.parse(clean);
  const prefix = path.posix.join(parsed.dir, parsed.name);
  return availableFiles.filter(file => {
    const ext = path.posix.extname(file).toLowerCase();
    return extensions.has(ext) && ext !== parsed.ext.toLowerCase() && file.startsWith(`${prefix}.`);
  });
}

function escapeMarkdown(value = "") {
  return String(value || "")
    .replaceAll("|", "\\|")
    .replace(/\n+/g, " ")
    .trim();
}

function collectAssetReferences(value, refs = new Set()) {
  if (!value) return refs;
  if (typeof value === "string") {
    const clean = normalizePublicPath(value);
    if (clean.startsWith("/images/story-quests/") || clean.startsWith("/audio/story-quests/")) {
      refs.add(clean);
    }
    return refs;
  }
  if (Array.isArray(value)) {
    value.forEach(item => collectAssetReferences(item, refs));
    return refs;
  }
  if (typeof value === "object") {
    Object.values(value).forEach(item => collectAssetReferences(item, refs));
  }
  return refs;
}

function formatStatus(exists) {
  return exists ? "exists" : "missing";
}

function makeQuestRows(quest) {
  return (quest.pages || []).map((page, index) => {
    const imagePath = normalizePublicPath(page.imageUrl || page.imagePath || "");
    const audioPath = normalizePublicPath(page.audioUrl || page.audioPath || "");
    return {
      questId: quest.id,
      questTitle: quest.title,
      questLevel: quest.level || "",
      pageIndex: index + 1,
      pageId: page.id || `page-${index + 1}`,
      imagePath,
      imageExists: fileExists(imagePath),
      audioPath,
      audioExists: fileExists(audioPath)
    };
  });
}

function renderList(items, emptyText = "None found.") {
  if (!items.length) return emptyText;
  return items.map(item => `- ${item}`).join("\n");
}

function renderAudit() {
  const allImageFiles = listAssetFiles(imageRoot, IMAGE_EXTENSIONS);
  const allAudioFiles = listAssetFiles(audioRoot, AUDIO_EXTENSIONS);
  const allAssetFiles = [...allImageFiles, ...allAudioFiles];
  const allReferenced = new Set();
  const pageRows = storyQuests.flatMap(makeQuestRows);

  storyQuests.forEach(quest => collectAssetReferences(quest, allReferenced));
  pageRows.forEach(row => {
    if (row.imagePath) allReferenced.add(row.imagePath);
    if (row.audioPath) allReferenced.add(row.audioPath);
  });

  const referencedImages = [...allReferenced].filter(item => item.startsWith("/images/story-quests/")).sort();
  const referencedAudio = [...allReferenced].filter(item => item.startsWith("/audio/story-quests/")).sort();
  const referencedImageSet = new Set(referencedImages.map(stripQuery));
  const referencedAudioSet = new Set(referencedAudio.map(stripQuery));

  const missingImages = referencedImages.filter(item => !fileExists(item));
  const missingAudio = referencedAudio.filter(item => !fileExists(item));
  const unusedImages = allImageFiles.filter(item => !referencedImageSet.has(item));
  const unusedAudio = allAudioFiles.filter(item => !referencedAudioSet.has(item));

  const extensionMismatches = [];
  [...referencedImages, ...referencedAudio].forEach(assetPath => {
    const clean = normalizePublicPath(assetPath);
    const available = clean.startsWith("/images/")
      ? allImageFiles
      : allAudioFiles;
    const extensions = clean.startsWith("/images/")
      ? IMAGE_EXTENSIONS
      : AUDIO_EXTENSIONS;
    const alternates = findAlternateExtensions(clean, available, extensions);
    if (!fileExists(clean) && alternates.length) {
      extensionMismatches.push(`Referenced ${clean} is missing, but alternate format exists: ${alternates.join(", ")}`);
    } else if (fileExists(clean) && alternates.length) {
      extensionMismatches.push(`Referenced ${clean} exists; alternate format also present: ${alternates.join(", ")}`);
    }
  });

  const knownKimiNeeds = [
    {
      priority: "P1",
      area: "Story Quests images",
      story: "Meadow Pals / Brave Tiny Rescue",
      path: "public/images/story-quests/meadow-pals/brave-tiny-rescue/p05_big_tree.webp",
      reason: "Known unresolved Kimi note: no-watermark archive included p05_big_tree.png, but it still showed a visible source mark and was not wired. Do not convert or wire the marked PNG."
    }
  ];

  const needsKimi = [
    ...missingImages.map(item => ({
      priority: "P0",
      area: "Story Quests images",
      story: pageRows.find(row => row.imagePath === item)?.questTitle || "Unknown",
      path: `public${item}`,
      reason: "Referenced image is missing."
    })),
    ...missingAudio.map(item => ({
      priority: "P0",
      area: "Story Quests audio",
      story: pageRows.find(row => row.audioPath === item)?.questTitle || "Unknown",
      path: `public${item}`,
      reason: "Referenced audio is missing."
    })),
    ...knownKimiNeeds
  ];

  const generatedAt = new Date().toISOString();
  const lines = [];
  lines.push("# Story Quest Asset Audit");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("");
  lines.push("## Summary Counts");
  lines.push("");
  lines.push(`- Total quests: ${storyQuests.length}`);
  lines.push(`- Total page rows: ${pageRows.length}`);
  lines.push(`- Total referenced images: ${referencedImages.length}`);
  lines.push(`- Total referenced audio files: ${referencedAudio.length}`);
  lines.push(`- Missing referenced images: ${missingImages.length}`);
  lines.push(`- Missing referenced audio: ${missingAudio.length}`);
  lines.push(`- Unused image files: ${unusedImages.length}`);
  lines.push(`- Unused audio files: ${unusedAudio.length}`);
  lines.push(`- Extension mismatch candidates: ${extensionMismatches.length}`);
  lines.push("");

  lines.push("## Missing Referenced Images");
  lines.push("");
  lines.push(renderList(missingImages.map(item => `public${item}`)));
  lines.push("");
  lines.push("## Missing Referenced Audio");
  lines.push("");
  lines.push(renderList(missingAudio.map(item => `public${item}`)));
  lines.push("");
  lines.push("## Extension Mismatch Candidates");
  lines.push("");
  lines.push(renderList(extensionMismatches));
  lines.push("");

  lines.push("## Quest Asset References");
  lines.push("");
  storyQuests.forEach(quest => {
    lines.push(`### ${quest.title || quest.id}`);
    lines.push("");
    lines.push(`- Quest id: \`${quest.id}\``);
    lines.push(`- Level: \`${quest.level || ""}\``);
    lines.push("");
    lines.push("| Page | Page id | Image path | Image status | Audio path | Audio status |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    makeQuestRows(quest).forEach(row => {
      lines.push([
        row.pageIndex,
        `\`${escapeMarkdown(row.pageId)}\``,
        row.imagePath ? `\`public${escapeMarkdown(row.imagePath)}\`` : "",
        formatStatus(row.imageExists),
        row.audioPath ? `\`public${escapeMarkdown(row.audioPath)}\`` : "",
        formatStatus(row.audioExists)
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    });
    lines.push("");
  });

  lines.push("## Needs Kimi Replacement");
  lines.push("");
  if (needsKimi.length) {
    lines.push("| Priority | Area | Story/Scope | Target path | Reason |");
    lines.push("| --- | --- | --- | --- | --- |");
    needsKimi.forEach(item => {
      lines.push(`| ${item.priority} | ${escapeMarkdown(item.area)} | ${escapeMarkdown(item.story)} | \`${escapeMarkdown(item.path)}\` | ${escapeMarkdown(item.reason)} |`);
    });
  } else {
    lines.push("No active Kimi replacement needs found by this audit.");
  }
  lines.push("");

  lines.push("## Safe to Delete Candidates");
  lines.push("");
  lines.push("These files are not referenced by current Story Quest data. Do not delete until manually reviewed.");
  lines.push("");
  lines.push("### Unused Image Files");
  lines.push("");
  lines.push(renderList(unusedImages.map(item => `public${item}`)));
  lines.push("");
  lines.push("### Unused Audio Files");
  lines.push("");
  lines.push(renderList(unusedAudio.map(item => `public${item}`)));
  lines.push("");

  lines.push("## Do Not Delete Yet");
  lines.push("");
  lines.push("- Any file listed as unused but belonging to an older source pack, archived quest, or pending media migration.");
  lines.push("- Any alternate-format file listed under extension mismatch candidates until the live path is manually confirmed.");
  lines.push("- `public/images/story-quests/meadow-pals/brave-tiny-rescue/p05_big_tree.webp` remains a tracked Kimi replacement need from the no-watermark cleanup note, even if it is not currently referenced by Story Quest data.");
  lines.push("- The marked `p05_big_tree.png` from the no-watermark archive must not be converted or wired into the app.");
  lines.push("");

  return {
    markdown: lines.join("\n"),
    summary: {
      quests: storyQuests.length,
      pageRows: pageRows.length,
      referencedImages: referencedImages.length,
      referencedAudio: referencedAudio.length,
      missingImages: missingImages.length,
      missingAudio: missingAudio.length,
      unusedImages: unusedImages.length,
      unusedAudio: unusedAudio.length,
      extensionMismatches: extensionMismatches.length
    }
  };
}

const { markdown, summary } = renderAudit();
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, markdown);

console.log("Story Quest asset audit complete.");
console.table(summary);
console.log(`Report written to ${path.relative(repoRoot, reportPath)}`);
