#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { guidedReadingSelBooksDraft } from "../src/data/guidedReadingSelBooks.draft.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const mediaRoot = path.join(publicRoot, "images/guided-reading/sel-books");
const manifestPath = path.join(root, "docs/content/sel-books/SEL_MEDIA_MANIFEST.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const failures = [];
const words = text => String(text || "").replace(/[.,!?;:()"']/g, "").split(/\s+/).filter(Boolean);
const slug = value => String(value).toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const publicFile = publicPath => path.join(publicRoot, publicPath.replace(/^\/+/, ""));
const imageChecks = [];

const checkImage = (publicPath, label) => {
  const filePath = publicFile(publicPath);
  if (!fs.existsSync(filePath)) {
    failures.push(`${label}: missing ${publicPath}`);
    return;
  }
  imageChecks.push((async () => {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width !== 1376 || metadata.height !== 768 || metadata.format !== "webp") {
      failures.push(`${label}: expected 1376x768 WEBP, got ${metadata.width}x${metadata.height} ${metadata.format}`);
    }
  })());
};

assert.equal(guidedReadingSelBooksDraft.length, 30, "SEL draft collection must contain 30 books");
for (const level of ["A", "B", "C"]) {
  const books = guidedReadingSelBooksDraft.filter(book => book.level === level);
  assert.equal(books.length, 10, `Level ${level} must contain 10 books`);
  assert.deepEqual(books.map(book => book.bookNumber), Array.from({ length: 10 }, (_, index) => index + 1));
}

for (const book of guidedReadingSelBooksDraft) {
  if (!book.title.startsWith("") || !book.learningFocus || !book.storySpine) {
    failures.push(`${book.id}: missing title, SEL focus or story spine`);
  }
  const pageLimit = book.level === "A" ? 6 : book.level === "B" ? 14 : 22;
  const sceneLimit = book.level === "A" ? [5, 10] : book.level === "B" ? [6, 12] : [8, 14];
  if (book.pages.length < sceneLimit[0] || book.pages.length > sceneLimit[1]) {
    failures.push(`${book.id}: ${book.pages.length} pages outside Level ${book.level} range`);
  }
  book.pages.forEach((entry, index) => {
    const count = words(entry.text).length;
    if (count > pageLimit) failures.push(`${book.id} page ${index + 1}: ${count} words exceeds ${pageLimit}`);
    if (!entry.scene) failures.push(`${book.id} page ${index + 1}: missing illustration state`);
    if (book.level === "A" && /[,;:-]|\b(says|said)\b/i.test(entry.text)) {
      failures.push(`${book.id} page ${index + 1}: Level A punctuation/dialogue exceeds the band`);
    }
  });

  const expectedFiles = new Set(["cover.webp"]);
  const coverPath = `/images/guided-reading/sel-books/${book.id}/cover.webp`;
  checkImage(coverPath, `${book.id} cover`);
  book.pages.forEach((entry, index) => {
    const name = `page-${String(index + 1).padStart(2, "0")}-${slug(book.title)}.webp`;
    expectedFiles.add(name);
    checkImage(`/images/guided-reading/sel-books/${book.id}/${name}`, `${book.id} page ${index + 1}`);
  });

  const bookDirectory = path.join(mediaRoot, book.id);
  if (fs.existsSync(bookDirectory)) {
    for (const name of fs.readdirSync(bookDirectory)) {
      if (!expectedFiles.has(name)) failures.push(`${book.id}: unexpected unused media ${name}`);
    }
  }
}

await Promise.all(imageChecks);

if (manifest.pageCount !== 240 || manifest.pages?.length !== 240) failures.push("SEL media manifest must contain 240 page records");
if (manifest.coverCount !== 30 || manifest.covers?.length !== 30) failures.push("SEL media manifest must contain 30 cover records");
if (manifest.imageDimensions !== "1376x768") failures.push("SEL media manifest must declare 1376x768 images");

const manifestPages = new Map((manifest.pages || []).map(record => [`${record.bookId}:${record.pageNumber}`, record]));
const manifestCovers = new Map((manifest.covers || []).map(record => [record.bookId, record]));
for (const book of guidedReadingSelBooksDraft) {
  const cover = manifestCovers.get(book.id);
  const expectedCoverPath = `/images/guided-reading/sel-books/${book.id}/cover.webp`;
  if (!cover || cover.coverPath !== expectedCoverPath) failures.push(`${book.id}: missing or incorrect cover manifest record`);
  if (!cover?.imageStatus || /not-generated|awaiting-visual-review/.test(cover.imageStatus)) {
    failures.push(`${book.id}: cover direct visual review is incomplete`);
  }

  book.pages.forEach((entry, index) => {
    const pageNumber = index + 1;
    const record = manifestPages.get(`${book.id}:${pageNumber}`);
    const expectedImagePath = `/images/guided-reading/sel-books/${book.id}/page-${String(pageNumber).padStart(2, "0")}-${slug(book.title)}.webp`;
    if (!record) {
      failures.push(`${book.id} page ${pageNumber}: missing manifest record`);
      return;
    }
    if (record.exactText !== entry.text) failures.push(`${book.id} page ${pageNumber}: manifest text drift`);
    if (record.imagePath !== expectedImagePath) failures.push(`${book.id} page ${pageNumber}: incorrect image path`);
    if (!record.imageStatus || /not-generated|awaiting-visual-review/.test(record.imageStatus)) {
      failures.push(`${book.id} page ${pageNumber}: direct visual review is incomplete`);
    }
    if (!record.audioPath || !fs.existsSync(publicFile(record.audioPath))) {
      failures.push(`${book.id} page ${pageNumber}: narration file is missing`);
    }
    if (!record.audioStatus || record.audioStatus === "not-generated") {
      failures.push(`${book.id} page ${pageNumber}: narration generation is incomplete`);
    }
    if (record.audioVoice !== "en-US-Chirp3-HD-Leda") {
      failures.push(`${book.id} page ${pageNumber}: narration voice is not Leda`);
    }
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("SEL draft gate passed: 30 books, 240 reviewed page images, 30 reviewed covers and 240 generated Leda clips are present.");
}
