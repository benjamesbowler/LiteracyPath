#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = path.join(
  root,
  "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"
);

const levelIndex = process.argv.indexOf("--level");
const level = String(levelIndex === -1 ? "" : process.argv[levelIndex + 1] || "").toUpperCase();
const noteIndex = process.argv.indexOf("--note");
const reviewNote = String(noteIndex === -1 ? "" : process.argv[noteIndex + 1] || "").trim();

if (!new Set(["A", "B", "C"]).has(level) || !reviewNote) {
  throw new Error(
    "Usage: node tools/recordGuidedReadingLevelVisualReview.mjs --level A|B|C --note \"review evidence\""
  );
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function displayedText(page) {
  return Array.isArray(page.text) ? page.text.join(" ").trim() : String(page.text || "").trim();
}

function releaseFingerprint(pages) {
  return sha256(JSON.stringify(pages.map(record => ({
    bookId: record.bookId,
    pageNumber: record.pageNumber,
    textSha256: record.textSha256,
    imagePath: record.imagePath,
    imageSha256: record.imageSha256,
    status: record.status
  }))));
}

function publicFile(publicPath = "") {
  return path.join(root, "public", String(publicPath).split("?")[0].replace(/^\/+/, ""));
}

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const runtimeBooks = getRuntimeGuidedReadingBooks();
const reviewedBooks = runtimeBooks.filter(book => book.level === level);
const reviewedBookIds = new Set(reviewedBooks.map(book => book.id));

if (!reviewedBooks.length) throw new Error(`No active Level ${level} books were found.`);

audit.pages = (audit.pages || []).filter(record => !reviewedBookIds.has(record.bookId));

for (const book of reviewedBooks) {
  for (const [index, page] of book.pages.entries()) {
    const pageNumber = page.pageNumber || index + 1;
    const text = displayedText(page);
    const imagePath = page.image || page.imageUrl || page.pageImage || "";
    const imageFile = publicFile(imagePath);

    if (!text) throw new Error(`${book.id}:${pageNumber}: displayed text is empty`);
    if (!imagePath || !fs.existsSync(imageFile) || fs.statSync(imageFile).size === 0) {
      throw new Error(`${book.id}:${pageNumber}: reviewed image is missing or empty`);
    }

    audit.pages.push({
      bookId: book.id,
      title: book.title,
      level: book.level,
      pageNumber,
      displayedText: text,
      imagePath,
      textSha256: sha256(text),
      imageSha256: sha256(fs.readFileSync(imageFile)),
      status: "approved",
      issueCodes: [],
      issues: [],
      regenerationBrief: reviewNote
    });
  }
}

audit.pages.sort((left, right) =>
  left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber
);

const runtimeBookIds = new Set(runtimeBooks.map(book => book.id));
const staleRecords = audit.pages.filter(record => !runtimeBookIds.has(record.bookId));
if (staleRecords.length) {
  throw new Error(`Visual audit still has ${staleRecords.length} stale runtime-page records.`);
}

const duplicateKeys = new Set();
const seenKeys = new Set();
for (const record of audit.pages) {
  const key = `${record.bookId}:${record.pageNumber}`;
  if (seenKeys.has(key)) duplicateKeys.add(key);
  seenKeys.add(key);
}
if (duplicateKeys.size) {
  throw new Error(`Visual audit contains duplicate keys: ${[...duplicateKeys].join(", ")}`);
}

const replacementPages = audit.pages.filter(record => record.status === "replace");
const auditedBookIds = [...new Set(audit.pages.map(record => record.bookId))].sort();
const booksWithReplacements = new Set(replacementPages.map(record => record.bookId));

audit.auditDate = new Date().toISOString().slice(0, 10);
audit.status = replacementPages.length ? "in_progress" : "complete";
audit.scope = {
  activeBooksAudited: auditedBookIds.length,
  activePagesAudited: audit.pages.length,
  missingImages: 0,
  approvedPages: audit.pages.filter(record => record.status === "approved").length,
  replacementPages: replacementPages.length,
  approvedBooks: auditedBookIds.length - booksWithReplacements.size,
  booksWithReplacementPages: booksWithReplacements.size
};
audit.approvedBookIds = auditedBookIds.filter(bookId => !booksWithReplacements.has(bookId));
audit.replacementQueue = replacementPages;

const methodEntry = `On ${audit.auditDate}, Level ${level} was re-audited against the current runtime text and every reviewed page image was hash-locked after full-book sequence, cover, character-continuity, anatomy, object-count, factual-safety, style and resolution checks.`;
audit.method = Array.isArray(audit.method) ? audit.method : [];
if (!audit.method.includes(methodEntry)) audit.method.push(methodEntry);

audit.gateSemantics = audit.gateSemantics || {};
audit.gateSemantics.releaseFingerprintSha256 = releaseFingerprint(audit.pages);

fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(
  `Recorded Level ${level}: ${reviewedBooks.length} books and ${reviewedBooks.reduce((sum, book) => sum + book.pages.length, 0)} reviewed pages.`
);
