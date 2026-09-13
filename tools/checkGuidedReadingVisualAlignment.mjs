#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { loadScienceVisualReview } from "./meadowPalsScienceGateLib.mjs";
import { MISSING_SANDWICH_BOOK_ID } from "../src/data/meadowPalsScienceBooks.js";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(
  repositoryRoot,
  "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"
);
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const failures = [];

const helpRequested = process.argv.includes("--help") || process.argv.includes("-h");
if (helpRequested) {
  console.log("Usage: node tools/checkGuidedReadingVisualAlignment.mjs [--level A|B|C | --book BOOK_ID]");
  process.exit(0);
}

const levelFlagIndex = process.argv.indexOf("--level");
const requestedLevel = levelFlagIndex === -1
  ? null
  : String(process.argv[levelFlagIndex + 1] || "").toUpperCase();
if (levelFlagIndex !== -1 && !new Set(["A", "B", "C"]).has(requestedLevel)) {
  throw new Error(`--level must be A, B or C; received ${process.argv[levelFlagIndex + 1] || "missing"}`);
}
const bookFlagIndex = process.argv.indexOf("--book");
const requestedBook = bookFlagIndex === -1 ? null : process.argv[bookFlagIndex + 1];
if (bookFlagIndex !== -1 && (!requestedBook || requestedBook.startsWith("--"))) {
  throw new Error("--book requires a current book ID");
}
if (requestedLevel && requestedBook) throw new Error("Choose either --level or --book");
const scopedRun = Boolean(requestedLevel || requestedBook);

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

function displayedText(page) {
  return Array.isArray(page.text) ? page.text.join(" ").trim() : String(page.text || "").trim();
}

function publicFile(publicPath = "") {
  return path.join(repositoryRoot, "public", String(publicPath).split("?")[0].replace(/^\/+/, ""));
}

const records = new Map();
const scienceReview = loadScienceVisualReview(repositoryRoot);
if (!scopedRun || requestedBook === MISSING_SANDWICH_BOOK_ID) failures.push(...scienceReview.failures);
for (const record of [...(report.pages || []), ...scienceReview.pages]) {
  const key = `${record.bookId}:${record.pageNumber}`;
  if (records.has(key)) failures.push(`${key}: duplicate visual audit record`);
  records.set(key, record);
}

const liveKeys = new Set();
let pageCount = 0;
let approvedCount = 0;
let replacementCount = 0;

const allBooks = getRuntimeGuidedReadingBooks();
const books = allBooks.filter(book => (!requestedLevel || book.level === requestedLevel)
  && (!requestedBook || book.id === requestedBook));
if (requestedBook && books.length !== 1) failures.push(`Unknown active book ${requestedBook}`);

for (const book of books) {
  for (const [index, page] of book.pages.entries()) {
    pageCount += 1;
    const pageNumber = page.pageNumber || index + 1;
    const key = `${book.id}:${pageNumber}`;
    const record = records.get(key);
    liveKeys.add(key);

    if (!record) {
      failures.push(`${key}: missing fail-closed visual audit record`);
      continue;
    }

    const text = displayedText(page);
    const imagePath = page.image || page.imageUrl || page.pageImage || "";
    if (record.displayedText !== text || record.textSha256 !== sha256(text)) {
      failures.push(`${key}: displayed text changed after visual audit`);
    }
    if (record.imagePath !== imagePath) {
      failures.push(`${key}: image path changed after visual audit`);
    }

    const imageFile = publicFile(imagePath);
    if (!imagePath || !fs.existsSync(imageFile) || fs.statSync(imageFile).size === 0) {
      failures.push(`${key}: image is missing or empty`);
    } else if (record.imageSha256 !== sha256(fs.readFileSync(imageFile))) {
      failures.push(`${key}: image bytes changed after visual audit`);
    }

    if (record.status === "approved") approvedCount += 1;
    else if (record.status === "replace") {
      replacementCount += 1;
      failures.push(`${key}: illustration replacement remains open — ${record.issues?.join("; ") || "alignment defect"}`);
    } else {
      failures.push(`${key}: invalid visual decision ${record.status || "missing"}`);
    }
  }
}

for (const [key, record] of records) {
  if (requestedBook) {
    if (record.bookId === requestedBook && !liveKeys.has(key)) failures.push(`${key}: stale visual audit record is not an active runtime page`);
  } else if (requestedLevel) {
    if (record.level === requestedLevel && !liveKeys.has(key)) {
      failures.push(`${key}: stale Level ${requestedLevel} visual audit record is not an active runtime page`);
    }
  } else if (!liveKeys.has(key)) {
    failures.push(`${key}: stale visual audit record is not an active runtime page`);
  }
}

if (report.status !== "complete") failures.push(`visual audit status is ${report.status || "missing"}, not complete`);
if (!scopedRun && report.scope?.activeBooksAudited + 1 !== allBooks.length) {
  failures.push("visual audit book count does not match the runtime catalogue");
}
if (!scopedRun && report.scope?.activePagesAudited + scienceReview.pages.length !== pageCount) {
  failures.push("visual audit page count does not match the runtime catalogue");
}
if (report.gateSemantics?.releaseFingerprintSha256 !== releaseFingerprint(report.pages || [])) {
  failures.push("stored visual release fingerprint does not match the audited page records");
}

console.log(`Guided Reading visual alignment gate${requestedLevel ? ` - Level ${requestedLevel}` : requestedBook ? ` - ${requestedBook}` : ""}`);
console.log(`Pages: ${pageCount}; approved: ${approvedCount}; replacement open: ${replacementCount}; failures: ${failures.length}.`);

if (failures.length) {
  console.error("\nGuided Reading visual alignment gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Every checked Guided Reading page has exact-text, Story-Bible-aligned, hash-locked illustration approval.");
