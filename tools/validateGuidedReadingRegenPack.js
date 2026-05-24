#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultPackRoot = "/Users/benjaminbowler/Desktop/Kimi_Agent_LiteracyPath Regen Assets Pack";
const mergedRoot = path.join(os.tmpdir(), "lp-guided-regen-validate");
const packSubdir = "guided-reading-regeneration-pack";
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_regen_import_audit.md");
const outputDataPath = path.join(rootDir, "src", "data", "guidedReadingRegenBooks.js");
const publicRegenRoot = path.join(rootDir, "public", "guided-reading", "regen");
const validLevels = new Set(["A", "B", "C", "D", "E"]);
const validTypes = new Set(["fiction", "nonfiction"]);
const punctuationRegex = /[.!?]["']?$/;
const sentenceStartRegex = /^[A-Z0-9"']/;
const conflictPairs = [
  ["day", ["night", "moon", "stars", "sunset"]],
  ["night", ["day", "sun", "morning"]],
  ["sun", ["moon", "night"]],
  ["cans", ["crayon", "crayons", "map"]],
  ["pans", ["bag", "map", "crayon", "crayons"]]
];

function cleanText(text = "") {
  return String(text || "")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function slugWord(word = "") {
  return String(word)
    .toLowerCase()
    .replace(/[^a-z0-9'-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordAudioPath(word = "") {
  return `/audio/child-mode/words/${slugWord(word)}.mp3`;
}

function tokenizeWords(text = "") {
  return cleanText(text)
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map(word => ({
      text: word,
      audioPath: wordAudioPath(word)
    }));
}

function escapePipes(value = "") {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function copyIfChanged(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination) && hashFile(source) === hashFile(destination)) {
    return "skipped_same";
  }
  fs.copyFileSync(source, destination);
  return fs.existsSync(destination) ? "copied" : "failed";
}

function prepareMergedPack(packRoot = defaultPackRoot) {
  if (!fs.existsSync(packRoot)) {
    throw new Error(`Regeneration pack not found: ${packRoot}`);
  }

  fs.rmSync(mergedRoot, { recursive: true, force: true });
  fs.mkdirSync(mergedRoot, { recursive: true });

  const directPack = path.join(packRoot, packSubdir);
  if (fs.existsSync(directPack)) {
    fs.cpSync(directPack, path.join(mergedRoot, packSubdir), { recursive: true });
  }

  const zips = fs.readdirSync(packRoot)
    .filter(file => file.toLowerCase().endsWith(".zip"))
    .sort()
    .map(file => path.join(packRoot, file));

  zips.forEach(zipPath => {
    execFileSync("unzip", ["-oq", zipPath, "-d", mergedRoot], { stdio: "ignore" });
  });

  return {
    packRoot,
    zips,
    base: path.join(mergedRoot, packSubdir)
  };
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    fs.readdirSync(current, { withFileTypes: true }).forEach(entry => {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else results.push(full);
    });
  }
  return results;
}

function sentenceLooksValid(text = "") {
  const clean = cleanText(text);
  return clean.length > 0 && sentenceStartRegex.test(clean) && punctuationRegex.test(clean);
}

function hasSpacedPunctuation(text = "") {
  return /\s+[.,!?;:]/.test(String(text || ""));
}

function textHasForbiddenString(text = "") {
  const lower = String(text || "").toLowerCase();
  return ["placeholder", "lorem", "undefined", "null", "hhhhh", "test"].find(item => lower.includes(item));
}

function metadataConflicts(page = {}) {
  const text = cleanText(page.text).toLowerCase();
  const metadata = [
    page.image || "",
    page.imageAlt || "",
    page.pageDescription || "",
    page.qaNotes || ""
  ].join(" ").toLowerCase();
  const conflicts = [];

  conflictPairs.forEach(([word, metadataHints]) => {
    if (!new RegExp(`\\b${word}\\b`).test(text)) return;
    const conflict = metadataHints.find(hint => new RegExp(`\\b${hint}\\b`).test(metadata));
    if (conflict) conflicts.push(`text says "${word}" but image metadata suggests "${conflict}"`);
  });

  return conflicts;
}

function validateManifest(packBase) {
  const manifestPath = path.join(packBase, "guided_reading_regeneration_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing guided reading regeneration manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const books = Array.isArray(manifest.books) ? manifest.books : [];
  const seenBookIds = new Set();
  const seenTitles = new Set();
  const approvedBooks = [];
  const rejectedBooks = [];
  const pageFailures = [];
  const pageWarnings = [];
  const referencedFiles = new Set();

  books.forEach(book => {
    const bookIssues = [];
    const bookWarnings = [];
    const normalizedBook = {
      ...book,
      active: true,
      qaStatus: "approved",
      source: "kimi_guided_reading_regen_pack_2026_05_24",
      sourceBookId: book.id,
      pages: []
    };

    if (!book.id) bookIssues.push("missing book id");
    if (seenBookIds.has(book.id)) bookIssues.push(`duplicate book id: ${book.id}`);
    seenBookIds.add(book.id);
    if (!book.title) bookIssues.push("missing title");
    if (book.title && seenTitles.has(book.title.toLowerCase())) bookIssues.push(`duplicate book title: ${book.title}`);
    if (book.title) seenTitles.add(book.title.toLowerCase());
    if (!validTypes.has(book.type)) bookIssues.push(`invalid book type: ${book.type}`);
    if (!validLevels.has(book.level)) bookIssues.push(`invalid level: ${book.level}`);
    if (!Array.isArray(book.pages) || book.pages.length !== 6) bookIssues.push("book must have exactly 6 pages");

    const coverSource = book.coverImage ? path.join(packBase, book.coverImage) : "";
    if (!book.coverImage) bookIssues.push("missing cover image path");
    else {
      referencedFiles.add(path.normalize(coverSource));
      if (!fs.existsSync(coverSource)) bookIssues.push(`missing cover image file: ${book.coverImage}`);
    }

    const seenPages = new Set();
    (book.pages || []).forEach((page, index) => {
      const pageNumber = page.pageNumber ?? index + 1;
      const pageIssues = [];
      const warnings = [];
      const text = cleanText(page.text);
      const pageId = `${book.id}-page-${String(pageNumber).padStart(2, "0")}`;

      if (seenPages.has(pageNumber)) pageIssues.push(`duplicate page number ${pageNumber}`);
      seenPages.add(pageNumber);
      if (pageNumber !== index + 1) pageIssues.push(`non-sequential page number ${pageNumber}; expected ${index + 1}`);
      if (!text) pageIssues.push("missing page text");
      if (text && !sentenceLooksValid(text)) pageIssues.push("sentence lacks capitalization or ending punctuation");
      if (hasSpacedPunctuation(page.text)) pageIssues.push("spaced punctuation");
      const forbidden = textHasForbiddenString(text);
      if (forbidden) pageIssues.push(`forbidden placeholder string: ${forbidden}`);

      const embedded = cleanText(page.embeddedImageText || "");
      if (embedded && embedded !== text) pageIssues.push(`embedded image text conflicts with app text: "${embedded}"`);
      if (embedded && embedded === text) warnings.push("image contains embedded text that matches app text; allowed but not preferred");

      const imageSource = page.image ? path.join(packBase, page.image) : "";
      const audioSource = page.pageAudio ? path.join(packBase, page.pageAudio) : "";
      if (!page.image) pageIssues.push("missing page image path");
      else {
        referencedFiles.add(path.normalize(imageSource));
        if (!fs.existsSync(imageSource)) pageIssues.push(`missing page image file: ${page.image}`);
      }
      if (!page.pageAudio) pageIssues.push("missing page narration path");
      else {
        referencedFiles.add(path.normalize(audioSource));
        if (!fs.existsSync(audioSource)) pageIssues.push(`missing narration file: ${page.pageAudio}`);
      }
      if (cleanText(page.pageAudioText) !== text) pageIssues.push("pageAudioText does not match displayed text exactly");
      if (!page.imageAlt) pageIssues.push("missing imageAlt");
      if (!page.pageDescription) pageIssues.push("missing pageDescription");
      if (!Array.isArray(page.targetWords) || page.targetWords.length === 0) pageIssues.push("missing targetWords");
      if (!Array.isArray(page.decodableFocus)) pageIssues.push("missing decodableFocus array");
      if (!Array.isArray(page.highFrequencyWords)) pageIssues.push("missing highFrequencyWords array");

      const conflicts = metadataConflicts(page);
      if (conflicts.length) pageIssues.push(...conflicts);

      const normalizedPage = {
        ...page,
        pageNumber,
        text,
        image: `/guided-reading/regen/pages/${path.basename(page.image || "")}`,
        pageAudio: `/guided-reading/regen/audio/narration/${path.basename(page.pageAudio || "")}`,
        active: true,
        qaStatus: "approved",
        qaNotes: page.qaNotes || "Validated against regeneration manifest and imported from clean regen pack.",
        words: tokenizeWords(text)
      };

      if (pageIssues.length) {
        pageFailures.push({
          bookId: book.id,
          title: book.title,
          pageNumber,
          pageId,
          text,
          image: page.image || "",
          pageAudio: page.pageAudio || "",
          issues: pageIssues
        });
      }
      if (warnings.length) {
        pageWarnings.push({
          bookId: book.id,
          title: book.title,
          pageNumber,
          pageId,
          text,
          warnings
        });
      }

      normalizedBook.pages.push(normalizedPage);
    });

    const bookPageFailures = pageFailures.filter(item => item.bookId === book.id);
    if (bookIssues.length || bookPageFailures.length) {
      rejectedBooks.push({
        ...book,
        active: false,
        qaStatus: "needs_regeneration",
        regenerationReason: [...bookIssues, ...bookPageFailures.flatMap(item => item.issues)].join("; "),
        issues: bookIssues,
        pageFailures: bookPageFailures
      });
    } else {
      normalizedBook.coverImage = `/guided-reading/regen/covers/${path.basename(book.coverImage)}`;
      approvedBooks.push(normalizedBook);
    }

    if (bookWarnings.length) {
      pageWarnings.push({
        bookId: book.id,
        title: book.title,
        pageNumber: "",
        pageId: book.id,
        text: "",
        warnings: bookWarnings
      });
    }
  });

  const allFiles = listFiles(packBase)
    .filter(file => /\.(png|jpg|jpeg|webp|mp3|wav|m4a)$/i.test(file))
    .map(file => path.normalize(file));
  const orphanAssets = allFiles.filter(file => !referencedFiles.has(file));

  return {
    manifest,
    books,
    approvedBooks,
    rejectedBooks,
    pageFailures,
    pageWarnings,
    orphanAssets
  };
}

function generateReport(context, validation, importSummary = null) {
  const { packRoot, zips, base } = context;
  const { manifest, books, approvedBooks, rejectedBooks, pageFailures, pageWarnings, orphanAssets } = validation;
  const totalPages = books.flatMap(book => book.pages || []).length;
  const approvedPages = approvedBooks.flatMap(book => book.pages || []).length;
  const fileCounts = {
    covers: listFiles(path.join(base, "images", "covers")).filter(file => /\.png$/i.test(file)).length,
    pages: listFiles(path.join(base, "images", "pages")).filter(file => /\.png$/i.test(file)).length,
    narration: listFiles(path.join(base, "audio", "page-narration")).filter(file => /\.mp3$/i.test(file)).length
  };

  const bookRows = books.map(book => {
    const approved = approvedBooks.some(item => item.id === book.id);
    const rejected = rejectedBooks.find(item => item.id === book.id);
    const reason = approved ? "Passed automated strict QA" : rejected?.regenerationReason || "Rejected";
    return `| ${book.id} | ${escapePipes(book.title)} | ${book.level} | ${book.type} | ${approved ? "approved" : "rejected"} | ${escapePipes(reason)} | ${book.id} -> ${book.id} |`;
  });

  const failureRows = pageFailures.length
    ? pageFailures.map(item => `| ${item.bookId} | ${escapePipes(item.title)} | ${item.pageNumber} | ${escapePipes(item.text)} | ${escapePipes(item.issues.join("; "))} | ${escapePipes(item.image)} | ${escapePipes(item.pageAudio)} |`)
    : ["| none | none | none | none | No page-level failures. | none | none |"];

  const warningRows = pageWarnings.length
    ? pageWarnings.map(item => `| ${item.bookId} | ${escapePipes(item.title)} | ${item.pageNumber} | ${escapePipes(item.text)} | ${escapePipes(item.warnings.join("; "))} |`)
    : ["| none | none | none | none | No warnings. |"];

  const importLines = importSummary
    ? [
        `- Data file written: ${path.relative(rootDir, outputDataPath)}`,
        `- Assets copied: ${importSummary.copied}`,
        `- Assets skipped because identical: ${importSummary.skippedSame}`,
        `- Approved active books imported: ${approvedBooks.length}`,
        `- Approved active pages imported: ${approvedPages}`
      ]
    : fs.existsSync(outputDataPath)
      ? [
          "- Import was not requested for this validation run.",
          `- Existing approved runtime data file present: ${path.relative(rootDir, outputDataPath)}`,
          `- Current pack validation still approves ${approvedBooks.length} books / ${approvedPages} pages for activation.`
        ]
      : ["- Import was not requested for this validation run."];

  const report = `# Guided Reading Regeneration Import Audit

Generated: ${new Date().toISOString()}

## Source

- Pack root: ${packRoot}
- Zip parts found: ${zips.length}
${zips.map(zip => `  - ${path.basename(zip)}`).join("\n")}
- Merged validation folder: ${base}

## Manifest Claims

- Pack name: ${manifest.packName || "unknown"}
- Version: ${manifest.version || "unknown"}
- Claimed total books: ${manifest.totalBooks ?? "unknown"}
- Claimed fiction/nonfiction: ${manifest.fictionCount ?? "unknown"} / ${manifest.nonfictionCount ?? "unknown"}
- Claimed levels: ${JSON.stringify(manifest.levels || {})}
- Image policy note: ${escapePipes(manifest.notes || "not provided")}

## Discovered Assets After Zip Merge

- Covers found: ${fileCounts.covers}
- Page images found: ${fileCounts.pages}
- Narration MP3 files found: ${fileCounts.narration}
- Orphan media assets: ${orphanAssets.length}

## QA Result

- Books inspected: ${books.length}
- Pages inspected: ${totalPages}
- Books approved for activation: ${approvedBooks.length}
- Pages approved for activation: ${approvedPages}
- Books rejected/kept inactive: ${rejectedBooks.length}
- Page-level failures: ${pageFailures.length}
- Page-level warnings: ${pageWarnings.length}

## Import Result

${importLines.join("\n")}

## Book Activation Mapping

| Old Book ID | Title | Level | Type | Decision | Reason | Replacement Mapping |
|---|---|---|---|---|---|---|
${bookRows.join("\n")}

## Page-Level Failures

| Book ID | Title | Page | Text | Failure reason | Image | Narration |
|---|---|---:|---|---|---|---|
${failureRows.join("\n")}

## Warnings

| Book ID | Title | Page | Text | Warning |
|---|---|---:|---|---|
${warningRows.join("\n")}

## Embedded Text Policy

Pages with non-empty embeddedImageText are rejected unless the embedded text exactly matches the app text. This pack declares embeddedImageText as empty for approved pages; no OCR is used at runtime.

## Runtime Decision

Only complete books with all six page images, cover image, narration files, exact pageAudioText/app-text match, clean punctuation, sequential page numbers, valid level/type, and no embedded text conflicts are exported into the active Guided Reading runtime file.
`;

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);
}

function importApprovedBooks(context, validation) {
  const copied = [];
  const skippedSame = [];
  const approved = validation.approvedBooks.map(book => {
    const manifestBook = validation.books.find(item => item.id === book.id);
    const coverSource = path.join(context.base, manifestBook.coverImage);
    const coverDest = path.join(publicRegenRoot, "covers", path.basename(manifestBook.coverImage));
    const coverResult = copyIfChanged(coverSource, coverDest);
    (coverResult === "skipped_same" ? skippedSame : copied).push(coverDest);

    book.pages.forEach(page => {
      const manifestPage = manifestBook.pages.find(item => item.pageNumber === page.pageNumber);
      const imageSource = path.join(context.base, manifestPage.image);
      const audioSource = path.join(context.base, manifestPage.pageAudio);
      const imageDest = path.join(publicRegenRoot, "pages", path.basename(manifestPage.image));
      const audioDest = path.join(publicRegenRoot, "audio", "narration", path.basename(manifestPage.pageAudio));
      const imageResult = copyIfChanged(imageSource, imageDest);
      const audioResult = copyIfChanged(audioSource, audioDest);
      (imageResult === "skipped_same" ? skippedSame : copied).push(imageDest);
      (audioResult === "skipped_same" ? skippedSame : copied).push(audioDest);
    });

    return book;
  });

  const file = `// Generated by tools/validateGuidedReadingRegenPack.js --import-approved.
// Source: ${context.packRoot}
// Only books that passed strict regeneration-pack validation are exported here.

export const guidedReadingRegenBooks = ${JSON.stringify(approved, null, 2)};
`;

  fs.writeFileSync(outputDataPath, file);

  return {
    copied: copied.length,
    skippedSame: skippedSame.length
  };
}

function main() {
  const importApproved = process.argv.includes("--import-approved");
  const packArgIndex = process.argv.indexOf("--pack-root");
  const packRoot = packArgIndex >= 0 ? process.argv[packArgIndex + 1] : defaultPackRoot;

  const context = prepareMergedPack(packRoot);
  const validation = validateManifest(context.base);
  let importSummary = null;
  if (importApproved) {
    importSummary = importApprovedBooks(context, validation);
  }
  generateReport(context, validation, importSummary);

  console.log(`Guided Reading regen books inspected: ${validation.books.length}`);
  console.log(`Guided Reading regen books approved: ${validation.approvedBooks.length}`);
  console.log(`Guided Reading regen books rejected: ${validation.rejectedBooks.length}`);
  console.log(`Guided Reading regen page failures: ${validation.pageFailures.length}`);
  console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
  if (importSummary) {
    console.log(`Imported approved Guided Reading assets: ${importSummary.copied} copied, ${importSummary.skippedSame} unchanged`);
    console.log(`Wrote ${path.relative(rootDir, outputDataPath)}`);
  }

  if (validation.approvedBooks.length === 0) {
    console.error("No regenerated Guided Reading books passed validation.");
    process.exit(1);
  }
}

main();
