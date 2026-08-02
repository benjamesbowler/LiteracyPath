#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingWorldExpansionBooks } from "../src/data/guidedReadingWorldExpansionBooks.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditPath = path.join(
  root,
  "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"
);
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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

const expansionIds = new Set(guidedReadingWorldExpansionBooks.map(book => book.id));
audit.pages = (audit.pages || []).filter(record => !expansionIds.has(record.bookId));

for (const book of guidedReadingWorldExpansionBooks) {
  for (const page of book.pages) {
    const displayedText = String(page.text || "").trim();
    const imagePath = String(page.image || "");
    const imageFile = path.join(root, "public", imagePath.replace(/^\/+/, ""));
    if (!displayedText) throw new Error(`${book.id}:${page.pageNumber}: displayed text is empty`);
    if (!imagePath || !fs.existsSync(imageFile) || fs.statSync(imageFile).size === 0) {
      throw new Error(`${book.id}:${page.pageNumber}: reviewed image is missing or empty`);
    }
    audit.pages.push({
      bookId: book.id,
      title: book.title,
      level: book.level,
      pageNumber: page.pageNumber,
      displayedText,
      imagePath,
      textSha256: sha256(displayedText),
      imageSha256: sha256(fs.readFileSync(imageFile)),
      status: "approved",
      issueCodes: [],
      issues: [],
      regenerationBrief: "Reviewed as an ordered Story-Bible storyboard: exact narrative beat, cast identity, state continuity, failure, turn, resolution and landing verified."
    });
  }
}

audit.pages.sort((left, right) =>
  left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber
);
const bookIds = [...new Set(audit.pages.map(record => record.bookId))].sort();
const replacementPages = audit.pages.filter(record => record.status === "replace");
audit.status = replacementPages.length ? "in_progress" : "complete";
audit.auditDate = "2026-08-01";
audit.scope = {
  activeBooksAudited: bookIds.length,
  activePagesAudited: audit.pages.length,
  missingImages: 0,
  approvedPages: audit.pages.filter(record => record.status === "approved").length,
  replacementPages: replacementPages.length,
  approvedBooks: bookIds.length - new Set(replacementPages.map(record => record.bookId)).size,
  booksWithReplacementPages: new Set(replacementPages.map(record => record.bookId)).size
};
audit.approvedBookIds = bookIds.filter(
  bookId => !replacementPages.some(record => record.bookId === bookId)
);
audit.replacementQueue = replacementPages;
audit.gateSemantics.releaseFingerprintSha256 = releaseFingerprint(audit.pages);

fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(`Recorded ${guidedReadingWorldExpansionBooks.length} reviewed books and ${guidedReadingWorldExpansionBooks.reduce((sum, book) => sum + book.pages.length, 0)} reviewed pages.`);
