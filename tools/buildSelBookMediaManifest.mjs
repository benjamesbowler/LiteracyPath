#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingSelBooksDraft } from "../src/data/guidedReadingSelBooks.draft.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs/content/sel-books/SEL_MEDIA_MANIFEST.json");
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const manifest = guidedReadingSelBooksDraft.flatMap(book => book.pages.map((entry, index) => ({
  bookId: book.id,
  label: book.label,
  title: book.title,
  level: book.level,
  pageNumber: index + 1,
  exactText: entry.text,
  illustrationPrompt: `${book.title}: ${entry.scene}. Preserve the canon characters ${book.characters.join(", ")}, the declared reading-band scene, continuity and safe-area rules. No embedded text, captions, watermarks or extra characters.`,
  imagePath: `/images/guided-reading/sel-books/${book.id}/page-${String(index + 1).padStart(2, "0")}-${slug(book.title)}.webp`,
  audioPath: `/audio/guided-reading/sel-books/${book.id}/page-${String(index + 1).padStart(2, "0")}-${slug(book.title)}.mp3`,
  audioStatus: "not-generated",
  imageStatus: "not-generated"
})));

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify({
  collection: "Little Literacy Guides SEL Books 1-10",
  generatedFrom: "src/data/guidedReadingSelBooks.draft.js",
  status: "draft-only",
  pageCount: manifest.length,
  pages: manifest
}, null, 2)}\n`);
console.log(`Wrote ${manifest.length} page media records to ${path.relative(root, output)}`);
