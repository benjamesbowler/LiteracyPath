import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { guidedReadingBooks, formatGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import {
  getGuidedReadingBookAudioPath,
  getGuidedReadingBookSyncPath,
  getGuidedReadingPageAudioPath
} from "../src/utils/guidedReading/readAloudPolicy.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "public");
const inventoryPath = path.join(repoRoot, "docs", "guided-reading", "whole_book_audio_coverage_inventory.md");
const kimiRequestPath = path.join(repoRoot, "docs", "assets", "kimi_missing_whole_book_audio_request.md");
const timingVerificationPath = path.join(repoRoot, "docs", "guided-reading", "whole_book_audio_timing_verification_needed.md");

function publicFileExists(publicPath = "") {
  return Boolean(publicPath) && fs.existsSync(path.join(publicRoot, publicPath.replace(/^\//, "")));
}

function publicFilePath(publicPath = "") {
  return path.join(publicRoot, publicPath.replace(/^\//, ""));
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getAudioDurationMs(publicPath = "") {
  if (!publicFileExists(publicPath)) return 0;
  try {
    const output = execFileSync("afinfo", [publicFilePath(publicPath)], { encoding: "utf8" });
    const match = output.match(/estimated duration:\s*([0-9.]+)\s*sec/i);
    return match ? Math.round(Number(match[1]) * 1000) : 0;
  } catch {
    return 0;
  }
}

function pageText(page = {}) {
  return String(page.pageAudioText || page.text || "").trim();
}

function countWords(text = "") {
  return Math.max(1, (String(text).match(/[A-Za-z0-9'-]+/g) || []).length);
}

function buildEstimatedPageTimings(book = {}, durationMs = 0) {
  const pages = book.pages || [];
  if (!pages.length) return [];
  const safeDurationMs = durationMs > 0 ? durationMs : pages.length * 1000;
  const weights = pages.map(page => countWords(pageText(page)));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || pages.length;
  let elapsed = 0;

  return pages.map((page, index) => {
    const startMs = Math.round(elapsed);
    const endMs = index === pages.length - 1
      ? safeDurationMs
      : Math.min(safeDurationMs, Math.max(startMs + 1, Math.round(elapsed + (safeDurationMs * weights[index]) / totalWeight)));
    elapsed = endMs;
    return {
      pageIndex: index,
      pageNumber: Number(page.pageNumber || index + 1),
      startMs,
      endMs,
      text: pageText(page)
    };
  });
}

function normalizeSyncAccuracy(syncData = null) {
  const value = String(syncData?.syncAccuracy || "").toLowerCase();
  return ["explicit", "estimated"].includes(value) ? value : "missing";
}

function readBookSyncData(book = {}) {
  const syncPath = getGuidedReadingBookSyncPath(book);
  const filePath = publicFilePath(syncPath);
  if (!fs.existsSync(filePath)) return null;
  const syncData = readJsonFile(filePath);
  if (syncData?.bookId && syncData.bookId !== book.id) return null;
  if (!Array.isArray(syncData?.pageTimings) || !syncData.pageTimings.length) return null;
  return syncData;
}

function writeEstimatedSyncJson(row) {
  if (!row.wholeBookAudioExists || row.syncAccuracy === "explicit") return row.syncData;

  const syncPath = row.syncPath;
  const filePath = publicFilePath(syncPath);
  const existing = readJsonFile(filePath);
  if (existing?.syncAccuracy === "explicit") return existing;

  const durationMs = getAudioDurationMs(row.wholeBookAudioPath);
  const syncData = {
    bookId: row.id,
    title: row.title,
    audioPath: row.wholeBookAudioPath,
    syncAccuracy: "estimated",
    durationMs,
    pageTimings: buildEstimatedPageTimings(row.book, durationMs)
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(syncData, null, 2)}\n`);
  return syncData;
}

function normalizeSeriesKey(book = {}) {
  if (book.seriesId) return book.seriesId;
  if (String(book.id || "").startsWith("first-facts-level-a")) return "first-facts-level-a";
  if (String(book.id || "").startsWith("first-facts-a")) return "first-facts";
  if (String(book.id || "").startsWith("first-facts-c")) return "first-facts-level-c";
  return String(book.id || "").split("-").slice(0, 2).join("-");
}

function suggestedWholeBookAudioPath(book = {}) {
  const declared = getGuidedReadingBookAudioPath(book);
  if (declared) return declared;

  const firstPageAudio = getGuidedReadingPageAudioPath((book.pages || [])[0] || {});
  if (firstPageAudio.includes("/audio/page-")) {
    return firstPageAudio.replace(/\/audio\/page-\d+\.mp3$/, "/audio/full-book.mp3");
  }
  if (firstPageAudio.includes("/audio/narration/")) {
    return `/guided-reading/audio/narration/${book.id}-full-book.mp3`;
  }

  const firstPageImage = (book.pages || [])[0]?.image || "";
  if (firstPageImage.includes("/page-")) {
    return `${firstPageImage.replace(/\/page-[^/]+$/, "")}/audio/full-book.mp3`;
  }
  return `/guided-reading/audio/whole-books/${book.id}.mp3`;
}

function suggestedSyncPath(book = {}) {
  return getGuidedReadingBookSyncPath(book);
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(row => `| ${row.map(cell => String(cell ?? "").replace(/\n/g, "<br>").replace(/\|/g, "\\|")).join(" | ")} |`)
  ].join("\n");
}

function bookRows() {
  return guidedReadingBooks.map(book => {
    const pages = book.pages || [];
    const wholeBookAudioPath = getGuidedReadingBookAudioPath(book);
    const wholeBookAudioExists = publicFileExists(wholeBookAudioPath);
    const pageImageCount = pages.filter(page => publicFileExists(page.image)).length;
    const pageAudioCount = pages.filter(page => publicFileExists(getGuidedReadingPageAudioPath(page))).length;
    const syncData = readBookSyncData(book);
    const syncAccuracy = normalizeSyncAccuracy(syncData);
    const syncPath = suggestedSyncPath(book);

    return {
      book,
      id: book.id,
      title: book.title,
      type: formatGuidedReadingType(book.type),
      level: book.level,
      series: normalizeSeriesKey(book),
      pageCount: pages.length,
      wholeBookAudioPath,
      wholeBookAudioExists,
      suggestedWholeBookAudioPath: suggestedWholeBookAudioPath(book),
      syncPath,
      syncData,
      syncAccuracy,
      pageImageCount,
      pageAudioCount,
      hasAllPageImages: pageImageCount === pages.length,
      hasAllPageAudio: pageAudioCount === pages.length,
      pages
    };
  });
}

function status(value) {
  return value ? "yes" : "no";
}

function writeInventory(rows) {
  const wholeBookAudioRows = rows.filter(row => row.wholeBookAudioExists);
  const missingWholeBookAudioRows = rows.filter(row => !row.wholeBookAudioExists);
  const explicitTimingRows = rows.filter(row => row.syncAccuracy === "explicit");
  const estimatedTimingRows = rows.filter(row => row.syncAccuracy === "estimated");
  const missingTimingRows = rows.filter(row => row.syncAccuracy === "missing");
  const bySeries = Object.values(Object.groupBy(rows, row => row.series))
    .map(items => {
      const item = items[0];
      return [
        item.series,
        items.length,
        items.filter(row => row.wholeBookAudioExists).length,
        items.filter(row => !row.wholeBookAudioExists).length,
        items.filter(row => row.hasAllPageImages).length,
        items.filter(row => row.hasAllPageAudio).length,
        items.filter(row => row.syncAccuracy === "explicit").length,
        items.filter(row => row.syncAccuracy === "estimated").length,
        items.filter(row => row.syncAccuracy === "missing").length
      ];
    })
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const lines = [
    "# Guided Reading Whole-Book Audio Coverage Inventory",
    "",
    "Generated by `node tools/auditGuidedReadingWholeBookAudio.js` from the active `guidedReadingBooks` registry and files under `public/`.",
    "",
    "## Summary",
    "",
    `- Active guided-reading books audited: ${rows.length}`,
    `- Books with existing whole-book audio: ${wholeBookAudioRows.length}`,
    `- Books missing whole-book audio: ${missingWholeBookAudioRows.length}`,
    `- Books with all page images present: ${rows.filter(row => row.hasAllPageImages).length}`,
    `- Books with all page-level audio present: ${rows.filter(row => row.hasAllPageAudio).length}`,
    `- Books with explicit verified whole-book timing JSON: ${explicitTimingRows.length}`,
    `- Books with estimated whole-book timing JSON: ${estimatedTimingRows.length}`,
    `- Books missing whole-book timing JSON: ${missingTimingRows.length}`,
    "",
    "Note: page-level narration audio and whole-book timing/sync data are different. Estimated timing JSON is generated from full-book MP3 duration and page text length, and must be verified before it is treated as production-perfect sync.",
    "",
    "## Coverage by Series",
    "",
    markdownTable(
      ["Series", "Books", "Whole-book audio", "Missing whole-book audio", "All page images", "All page audio", "Explicit timing", "Estimated timing", "Missing timing"],
      bySeries
    ),
    "",
    "## Book Inventory",
    "",
    markdownTable(
      [
        "ID",
        "Title",
        "Type",
        "Level",
        "Pages",
        "Whole-book audio",
        "Page images",
        "Page audio",
        "Timing",
        "Whole-book audio path / suggested path",
        "Sync JSON path"
      ],
      rows.map(row => [
        row.id,
        row.title,
        row.type,
        row.level,
        row.pageCount,
        status(row.wholeBookAudioExists),
        `${row.pageImageCount}/${row.pageCount}`,
        `${row.pageAudioCount}/${row.pageCount}`,
        row.syncAccuracy,
        row.wholeBookAudioPath || row.suggestedWholeBookAudioPath,
        row.syncPath
      ])
    )
  ];

  fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
  fs.writeFileSync(inventoryPath, `${lines.join("\n")}\n`);
}

function writeKimiRequest(rows) {
  const missingRows = rows.filter(row => !row.wholeBookAudioExists);
  const lines = [
    "# Kimi Request: Missing Guided Reading Whole-Book Audio",
    "",
    "Create only the missing whole-book audio and matching whole-book sync JSON files listed below. Do not create page images, word audio, page-level narration, browser-TTS output, placeholder audio, or audio for books that already have a whole-book MP3.",
    "",
    "Delivery requirements:",
    "- One clean MP3 per book at the exact requested path.",
    "- One JSON sync file per book at the exact requested sync path, if page-boundary timing can be measured from the produced MP3.",
    "- Sync JSON must use the required format: `bookId`, `title`, `audioPath`, `syncAccuracy`, `durationMs`, and `pageTimings` with `pageIndex`, `pageNumber`, `startMs`, `endMs`, and `text`.",
    "- Use `syncAccuracy: \"explicit\"` only when the page boundaries are measured against the final MP3. Use `syncAccuracy: \"estimated\"` if they are approximate and need human verification.",
    "- Natural child-friendly narration in a consistent warm voice.",
    "- Read the page text in page order with a short natural pause between pages.",
    "- Do not read page numbers, filenames, markdown, section labels, or production notes.",
    "- Preserve punctuation, dialogue, names, and British spellings where present.",
    "",
    `Books requested: ${missingRows.length}`,
    ""
  ];

  missingRows.forEach((row, index) => {
    lines.push(
      `## ${index + 1}. ${row.title}`,
      "",
      `- Book ID: ${row.id}`,
      `- Type/level: ${row.type}, Level ${row.level}`,
      `- Pages: ${row.pageCount}`,
      `- Required whole-book MP3 path: \`${row.suggestedWholeBookAudioPath}\``,
      `- Required sync JSON path: \`${row.syncPath}\``,
      "",
      "Page text to narrate:",
      ""
    );
    row.pages.forEach(page => {
      lines.push(`Page ${page.pageNumber || row.pages.indexOf(page) + 1}:`);
      lines.push(String(page.pageAudioText || page.text || "").trim());
      lines.push("");
    });
  });

  fs.mkdirSync(path.dirname(kimiRequestPath), { recursive: true });
  fs.writeFileSync(kimiRequestPath, `${lines.join("\n")}\n`);
}

function writeTimingVerification(rows) {
  const estimatedRows = rows.filter(row => row.syncAccuracy === "estimated");
  const missingRows = rows.filter(row => row.syncAccuracy === "missing");
  const lines = [
    "# Guided Reading Whole-Book Timing Verification Needed",
    "",
    "Generated by `node tools/auditGuidedReadingWholeBookAudio.js`.",
    "",
    "Estimated timing JSON lets Auto-advance avoid purely runtime guesses, but it is not verified against actual page-boundary audio. These books need human or tool-assisted timing review before their sync can be marked `explicit`.",
    "",
    "## Estimated Timing Needs Verification",
    "",
    markdownTable(
      ["ID", "Title", "Type", "Level", "Pages", "Audio path", "Sync JSON path"],
      estimatedRows.map(row => [
        row.id,
        row.title,
        row.type,
        row.level,
        row.pageCount,
        row.wholeBookAudioPath,
        row.syncPath
      ])
    ),
    "",
    "## Missing Audio and Timing",
    "",
    "These books cannot receive meaningful verified timing until their whole-book MP3 exists.",
    "",
    markdownTable(
      ["ID", "Title", "Type", "Level", "Pages", "Requested audio path", "Requested sync JSON path"],
      missingRows.map(row => [
        row.id,
        row.title,
        row.type,
        row.level,
        row.pageCount,
        row.suggestedWholeBookAudioPath,
        row.syncPath
      ])
    )
  ];

  fs.mkdirSync(path.dirname(timingVerificationPath), { recursive: true });
  fs.writeFileSync(timingVerificationPath, `${lines.join("\n")}\n`);
}

let rows = bookRows();
rows.forEach(row => {
  row.syncData = writeEstimatedSyncJson(row);
  row.syncAccuracy = normalizeSyncAccuracy(row.syncData);
});
rows = rows.map(row => {
  const publicRow = { ...row };
  delete publicRow.book;
  return publicRow;
});
writeInventory(rows);
writeKimiRequest(rows);
writeTimingVerification(rows);

console.log(`Audited ${rows.length} active guided-reading books.`);
console.log(`Whole-book audio present: ${rows.filter(row => row.wholeBookAudioExists).length}`);
console.log(`Whole-book audio missing: ${rows.filter(row => !row.wholeBookAudioExists).length}`);
console.log(`All page images present: ${rows.filter(row => row.hasAllPageImages).length}`);
console.log(`Explicit timing present: ${rows.filter(row => row.syncAccuracy === "explicit").length}`);
console.log(`Estimated timing present: ${rows.filter(row => row.syncAccuracy === "estimated").length}`);
console.log(`Missing timing: ${rows.filter(row => row.syncAccuracy === "missing").length}`);
console.log(`Wrote ${path.relative(repoRoot, inventoryPath)}`);
console.log(`Wrote ${path.relative(repoRoot, kimiRequestPath)}`);
console.log(`Wrote ${path.relative(repoRoot, timingVerificationPath)}`);
