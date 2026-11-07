#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateWorldDiscoveryDrafts, validateWorldDiscoveryReviews } from "./checkWorldDiscoveryBooks.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const books = ["a", "b", "c", "d", "e"].flatMap(level => JSON.parse(fs.readFileSync(path.join(root, `src/content/world-discovery/level-${level}.json`))));
const reviews = JSON.parse(fs.readFileSync(path.join(root, "src/content/world-discovery/reviews.json")));
const failures = [...validateWorldDiscoveryDrafts(books).failures, ...validateWorldDiscoveryReviews(books, reviews)];
if (failures.length) throw Error(failures.join("\n"));

// The existing unpublished-manuscript producer records exact page text and its
// missing word taps. Title-only production rows ensure titles receive the same
// service without changing the runtime page sequence or publishing dummy books.
const manuscript = books.flatMap(book => [
  {
    id: book.id.replace("world-discovery-", "world-discovery-unpublished-"),
    title: book.title, level: book.level, narrationProfile: "leda", active: true,
    sourceBookId: book.id,
    pages: book.pages.map(page => ({ pageNumber: page.pageNumber, text: page.text, pageAudioText: page.text, active: true, narrationNeedsRebuild: true }))
  },
  {
    id: book.id.replace("world-discovery-", "world-discovery-unpublished-title-"),
    title: book.title, level: book.level, narrationProfile: "leda", active: true,
    sourceBookId: book.id, productionRole: "title-only-not-a-runtime-book",
    pages: [{ pageNumber: 1, text: book.title, pageAudioText: book.title, active: true, narrationNeedsRebuild: true }]
  }
]);
const dir = path.join(root, ".artifacts/world-discovery/audio");
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, "reviewed-manuscript.json");
const bytes = JSON.stringify(manuscript, null, 2) + "\n";
fs.writeFileSync(file, bytes);
const sha256 = createHash("sha256").update(bytes).digest("hex");
fs.writeFileSync(path.join(dir, "reviewed-manuscript.sha256"), sha256 + "\n");
console.log(JSON.stringify({ books: books.length, pages: books.reduce((count, book) => count + book.pages.length, 0), titleClips: books.length, file: path.relative(root, file), sha256, voice: "en-US-Chirp3-HD-Leda", bookPrefix: "world-discovery-unpublished-" }));
