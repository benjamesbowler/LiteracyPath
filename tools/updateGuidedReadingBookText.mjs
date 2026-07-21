#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const [, , sourceArg, bookIdArg, revisionsArg] = process.argv;

if (!sourceArg || !bookIdArg || !revisionsArg) {
  console.error(
    "Usage: node tools/updateGuidedReadingBookText.mjs <data-file> <book-id> <revisions-json>",
  );
  process.exit(1);
}

const sourcePath = path.resolve(sourceArg);
const revisionsPath = path.resolve(revisionsArg);
const revisions = JSON.parse(fs.readFileSync(revisionsPath, "utf8"));

if (revisions.bookId !== bookIdArg) {
  throw new Error(
    `Revision file targets ${revisions.bookId || "no book"}, not ${bookIdArg}.`,
  );
}

const tokenize = (text) =>
  text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*(?:-[\p{L}\p{N}]+)*/gu) || [];

const audioSlug = (word) =>
  word
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9-]/g, "");

const formatArray = (value, continuationIndent) => {
  const lines = JSON.stringify(value, null, 2).split("\n");
  return lines
    .map((line, index) =>
      index === 0 ? line : `${" ".repeat(continuationIndent)}${line}`,
    )
    .join("\n");
};

const findMatching = (source, start, openChar, closeChar) => {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === openChar) depth += 1;
    if (char === closeChar) depth -= 1;
    if (depth === 0) return index;
  }

  throw new Error(`Unclosed ${openChar} at offset ${start}.`);
};

const replaceRange = (source, start, end, replacement) =>
  `${source.slice(0, start)}${replacement}${source.slice(end)}`;

let source = fs.readFileSync(sourcePath, "utf8");
const idNeedle = `"id": ${JSON.stringify(bookIdArg)}`;
const idIndex = source.indexOf(idNeedle);
if (idIndex === -1) throw new Error(`Book ${bookIdArg} was not found.`);

const bookStart = source.lastIndexOf("{", idIndex);
const bookEnd = findMatching(source, bookStart, "{", "}") + 1;
let book = source.slice(bookStart, bookEnd);

for (const revision of revisions.pages || []) {
  if (!Number.isInteger(revision.pageNumber) || !revision.text) {
    throw new Error("Every revision needs an integer pageNumber and non-empty text.");
  }

  const pageNeedle = `"pageNumber": ${revision.pageNumber}`;
  const pageNumberIndex = book.indexOf(pageNeedle);
  if (pageNumberIndex === -1) {
    throw new Error(`Page ${revision.pageNumber} was not found in ${bookIdArg}.`);
  }

  const pageStart = book.lastIndexOf("{", pageNumberIndex);
  const pageEnd = findMatching(book, pageStart, "{", "}") + 1;
  let page = book.slice(pageStart, pageEnd);

  page = page.replace(
    /^(\s*)"text":\s*"(?:\\.|[^"\\])*",/m,
    (_, indent) => `${indent}"text": ${JSON.stringify(revision.text)},`,
  );

  const wordsKeyIndex = page.indexOf('"words": [');
  if (wordsKeyIndex === -1) {
    throw new Error(`Page ${revision.pageNumber} has no words array.`);
  }
  const wordsArrayStart = page.indexOf("[", wordsKeyIndex);
  const wordsArrayEnd = findMatching(page, wordsArrayStart, "[", "]") + 1;
  const words = tokenize(revision.text).map((text) => ({
    text,
    audioPath: `/guided-reading/audio/words/${audioSlug(text)}.mp3`,
  }));
  page = replaceRange(
    page,
    wordsArrayStart,
    wordsArrayEnd,
    formatArray(words, 8),
  );

  if (!page.includes('"narrationNeedsRebuild": true')) {
    page = page.replace(
      /^(\s*"pageAudio":\s*"[^"]+",)$/m,
      '$1\n        "narrationNeedsRebuild": true,',
    );
  }

  book = replaceRange(book, pageStart, pageEnd, page);
}

const pagesKeyIndex = book.indexOf('"pages": [');
const pagesArrayStart = book.indexOf("[", pagesKeyIndex);
const pagesArrayEnd = findMatching(book, pagesArrayStart, "[", "]") + 1;
const pageTexts = [...book.slice(pagesArrayStart, pagesArrayEnd).matchAll(/"text":\s*"((?:\\.|[^"\\])*)",/g)].map(
  (match) => JSON.parse(`"${match[1]}"`),
);
const vocabulary = [];
const vocabularySeen = new Set();
for (const word of pageTexts.flatMap(tokenize)) {
  const normalized = word.toLowerCase();
  if (!vocabularySeen.has(normalized)) {
    vocabularySeen.add(normalized);
    vocabulary.push(normalized);
  }
}

const vocabularyKeyIndex = book.indexOf('"vocabulary": [');
const vocabularyStart = book.indexOf("[", vocabularyKeyIndex);
const vocabularyEnd = findMatching(book, vocabularyStart, "[", "]") + 1;
book = replaceRange(
  book,
  vocabularyStart,
  vocabularyEnd,
  formatArray(vocabulary, 4),
);

source = replaceRange(source, bookStart, bookEnd, book);
fs.writeFileSync(sourcePath, source);

console.log(
  `Updated ${bookIdArg}: ${revisions.pages.length} pages, ${vocabulary.length} vocabulary terms.`,
);
