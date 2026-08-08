#!/usr/bin/env node

import assert from "node:assert/strict";
import { guidedReadingSelBooksDraft } from "../src/data/guidedReadingSelBooks.draft.js";

const failures = [];
const words = text => String(text || "").replace(/[.,!?;:()\"']/g, "").split(/\s+/).filter(Boolean);

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
    if (book.level === "A" && /[,;:\-]|\b(says|said)\b/i.test(entry.text)) {
      failures.push(`${book.id} page ${index + 1}: Level A punctuation/dialogue exceeds the band`);
    }
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("SEL draft gate passed: 30 books, 10 per level, page ranges and text limits are valid.");
}
