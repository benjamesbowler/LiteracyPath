#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reviewedAtIndex = process.argv.indexOf("--reviewed-at");
const reviewedAt = String(reviewedAtIndex === -1 ? "" : process.argv[reviewedAtIndex + 1] || "").trim();
if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/u.test(reviewedAt)) {
  throw new Error("Usage: node tools/recordWillowStreetVisualReview.mjs --reviewed-at YYYY-MM-DDTHH:MM:SSZ");
}

const reviewPath = path.join(root, "docs/guided-reading/willow-street-visual-review.json");
const canonicalPath = path.join(
  root,
  "docs/guided-reading/guided_reading_story_bible_visual_alignment_audit_2026-08-01.json"
);
const sourceManifestPaths = [
  "docs/guided-reading/willow-street-illustrated-media-manifest.json",
  "docs/guided-reading/willow-street-photoreal-media-manifest.json"
];

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

function publicFile(publicPath = "") {
  return path.join(root, "public", String(publicPath).replace(/^\/+/, ""));
}

const manifests = sourceManifestPaths.map(relativePath => ({
  relativePath,
  value: JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"))
}));
const manifestAssets = manifests.flatMap(({ relativePath, value }) =>
  (value.assets || []).map(asset => ({ ...asset, sourceManifest: relativePath }))
);
if (manifestAssets.length !== 180) {
  throw new Error(`Expected 180 reviewed Willow Street assets, found ${manifestAssets.length}.`);
}

const assetByPath = new Map(manifestAssets.map(asset => [asset.path, asset]));
if (assetByPath.size !== manifestAssets.length) throw new Error("Willow Street review contains duplicate asset paths.");

const books = getRuntimeGuidedReadingBooks().filter(book => book.collection === "Willow Street Readers");
if (books.length !== 20) throw new Error(`Expected 20 Willow Street books, found ${books.length}.`);

const reviewAssets = [];
const canonicalPages = [];
for (const book of books) {
  const expectedAssets = [
    { pageNumber: 0, path: book.coverImage, text: book.title, brief: book.coverBrief, page: null },
    ...book.pages.map(page => ({
      pageNumber: page.pageNumber,
      path: page.image,
      text: String(page.text || "").trim(),
      brief: page.imageBrief || page.pageDescription || page.imageAlt,
      page
    }))
  ];

  for (const expected of expectedAssets) {
    const asset = assetByPath.get(expected.path);
    if (!asset) throw new Error(`${book.id}:${expected.pageNumber}: reviewed asset record is missing.`);
    const imageFile = publicFile(expected.path);
    if (!fs.existsSync(imageFile) || fs.statSync(imageFile).size === 0) {
      throw new Error(`${book.id}:${expected.pageNumber}: reviewed image is missing or empty.`);
    }
    const imageSha256 = sha256(fs.readFileSync(imageFile));
    if (asset.bookId !== book.id || asset.pageNumber !== expected.pageNumber) {
      throw new Error(`${book.id}:${expected.pageNumber}: manifest identity does not match runtime.`);
    }
    if (asset.sha256 !== imageSha256 || asset.directReview?.reviewedSha256 !== imageSha256) {
      throw new Error(`${book.id}:${expected.pageNumber}: image changed after original-detail review.`);
    }
    if (asset.textSha256 !== sha256(expected.text) || asset.briefSha256 !== sha256(expected.brief)) {
      throw new Error(`${book.id}:${expected.pageNumber}: text or visual brief changed after review.`);
    }
    if (asset.directReview?.state !== "approved-original-detail") {
      throw new Error(`${book.id}:${expected.pageNumber}: original-detail approval is missing.`);
    }

    reviewAssets.push({
      bookId: book.id,
      title: book.title,
      assetType: expected.pageNumber === 0 ? "cover" : "reading-page",
      pageNumber: expected.pageNumber,
      path: expected.path,
      displayedText: expected.text,
      textSha256: asset.textSha256,
      visualBriefSha256: asset.briefSha256,
      imageSha256,
      visualTreatment: asset.visualTreatment,
      provenance: asset.generatorProvenance,
      reviewer: "Codex direct original-detail visual review",
      reviewedAt,
      viewport: { width: asset.width, height: asset.height, detail: "original" },
      disposition: "approved",
      notes: asset.directReview.notes,
      sourceManifest: asset.sourceManifest
    });

    if (expected.page) {
      canonicalPages.push({
        bookId: book.id,
        title: book.title,
        level: book.level,
        pageNumber: expected.pageNumber,
        displayedText: expected.text,
        imagePath: expected.path,
        textSha256: asset.textSha256,
        imageSha256,
        status: "approved",
        issueCodes: [],
        issues: [],
        regenerationBrief: `Original-detail review recorded in ${asset.sourceManifest}: ${asset.directReview.notes}`
      });
    }
  }
}

reviewAssets.sort((left, right) =>
  left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber
);
const review = {
  schemaVersion: 1,
  collection: "Willow Street Readers",
  status: "complete",
  reviewedAt,
  scope: {
    books: books.length,
    covers: reviewAssets.filter(asset => asset.assetType === "cover").length,
    readingPages: canonicalPages.length,
    assets: reviewAssets.length,
    approved: reviewAssets.filter(asset => asset.disposition === "approved").length,
    replacementsOpen: 0
  },
  method: "Every final cover and reading-page asset was inspected at original 1365x768 detail against its exact manuscript text, page-specific visual brief, sequence, recurring-cast state, factual or procedural accuracy, anatomy, safety, embedded-text risk, and calm print zone. The source manifests preserve the asset-level notes and hashes.",
  assets: reviewAssets
};
fs.writeFileSync(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

const canonical = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));
const willowIds = new Set(books.map(book => book.id));
canonical.pages = (canonical.pages || [])
  .filter(record => !willowIds.has(record.bookId))
  .concat(canonicalPages)
  .sort((left, right) => left.bookId.localeCompare(right.bookId) || left.pageNumber - right.pageNumber);

const replacementPages = canonical.pages.filter(record => record.status === "replace");
const auditedBookIds = [...new Set(canonical.pages.map(record => record.bookId))].sort();
const booksWithReplacements = new Set(replacementPages.map(record => record.bookId));
canonical.auditDate = reviewedAt.slice(0, 10);
canonical.status = replacementPages.length ? "in_progress" : "complete";
canonical.scope = {
  activeBooksAudited: auditedBookIds.length,
  activePagesAudited: canonical.pages.length,
  missingImages: 0,
  approvedPages: canonical.pages.filter(record => record.status === "approved").length,
  replacementPages: replacementPages.length,
  approvedBooks: auditedBookIds.length - booksWithReplacements.size,
  booksWithReplacementPages: booksWithReplacements.size
};
canonical.approvedBookIds = auditedBookIds.filter(bookId => !booksWithReplacements.has(bookId));
canonical.replacementQueue = replacementPages;
canonical.standardSources = [...new Set([
  ...(canonical.standardSources || []),
  "docs/guided-reading/WILLOW_STREET_CONTENT_BIBLE.md",
  "docs/guided-reading/WILLOW_STREET_VISUAL_CONTINUITY.md",
  ...sourceManifestPaths,
  "docs/guided-reading/willow-street-visual-review.json"
])];
const methodEntry = `On ${reviewedAt.slice(0, 10)}, all 180 Willow Street covers and reading-page images were approved at original detail against exact text, visual briefs, full-book sequence, recurring-cast continuity, factual and procedural accuracy, anatomy, safety, embedded-text risk and runtime print placement; 160 reading pages were added to the fail-closed hash audit.`;
canonical.method = [...new Set([...(canonical.method || []), methodEntry])];
canonical.gateSemantics = canonical.gateSemantics || {};
canonical.gateSemantics.releaseFingerprintSha256 = releaseFingerprint(canonical.pages);
fs.writeFileSync(canonicalPath, `${JSON.stringify(canonical, null, 2)}\n`);

console.log(`Recorded Willow Street visual review: ${books.length} books, ${reviewAssets.length} assets, ${canonicalPages.length} reading pages.`);
