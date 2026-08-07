#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const baselineFlagIndex = process.argv.indexOf("--baseline");
const baselinePath = baselineFlagIndex === -1
  ? ""
  : path.resolve(String(process.argv[baselineFlagIndex + 1] || ""));

if (!baselinePath) {
  console.error(
    "Usage: node tools/checkMoonwoodExpandedManuscript.mjs --baseline <earlier-approval.html|json>"
  );
  process.exit(1);
}

const failures = [];

function words(text = "") {
  return String(text).match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g) || [];
}

function sentences(text = "") {
  return (String(text).match(/[^.!?]+[.!?]+(?:["”']+)?|[^.!?]+$/g) || [])
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function readBaseline(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(source);
  } catch {
    const embedded = source.match(
      /<script\s+id=["']manuscript-data["']\s+type=["']application\/json["']>([\s\S]*?)<\/script>/i
    );
    if (!embedded) throw new Error(`No manuscript data found in ${filePath}`);
    return JSON.parse(embedded[1]);
  }
}

function baselineText(page = {}) {
  return String(page.proposed ?? page.text ?? page.current ?? "").trim();
}

const baseline = readBaseline(baselinePath);
const baselineBooks = new Map(
  (baseline.books || [])
    .filter(book => String(book.seriesId || "") === "moonwood-tales" || /^moonwood-tales-c-/.test(book.id || ""))
    .map(book => [book.id, book])
);

const books = guidedReadingBooks.filter(
  book => book.active !== false && book.level === "C" && book.seriesId === "moonwood-tales"
);

if (books.length !== 35) failures.push(`Expected 35 active Moonwood books; found ${books.length}`);
if (baselineBooks.size !== 35) failures.push(`Expected 35 baseline Moonwood books; found ${baselineBooks.size}`);

let pageCount = 0;
let changedPageCount = 0;
let totalWords = 0;
let shortestPage = Infinity;
let longestPage = 0;

for (const book of books) {
  const oldBook = baselineBooks.get(book.id);
  if (!oldBook) {
    failures.push(`${book.id}: missing from baseline`);
    continue;
  }

  const oldPages = new Map(
    (oldBook.pages || []).map((page, index) => [Number(page.pageNumber || index + 1), baselineText(page)])
  );
  const pages = (book.pages || []).filter(page => page.active !== false);
  if (pages.length !== oldPages.size) {
    failures.push(`${book.id}: page count changed from ${oldPages.size} to ${pages.length}`);
  }

  const seenPageNumbers = new Set();
  for (const [index, page] of pages.entries()) {
    pageCount += 1;
    const pageNumber = Number(page.pageNumber || index + 1);
    const label = `${book.id}/page-${String(pageNumber).padStart(3, "0")}`;
    if (seenPageNumbers.has(pageNumber)) failures.push(`${label}: duplicate page number`);
    seenPageNumbers.add(pageNumber);

    const text = String(page.text || "").trim();
    const oldText = oldPages.get(pageNumber);
    const pageWords = words(text);
    const pageSentences = sentences(text);

    if (!oldPages.has(pageNumber)) failures.push(`${label}: page number was not present in baseline`);
    if (text !== oldText) changedPageCount += 1;
    else failures.push(`${label}: still uses the rejected short manuscript`);

    if (/\n/.test(text)) failures.push(`${label}: must be one paragraph without manual line breaks`);
    if (pageWords.length < 22 || pageWords.length > 38) {
      failures.push(`${label}: ${pageWords.length} words is outside the 22–38 Moonwood range`);
    }
    if (pageSentences.length < 2 || pageSentences.length > 4) {
      failures.push(`${label}: ${pageSentences.length} sentences is outside the 2–4 range`);
    }
    for (const [sentenceIndex, sentence] of pageSentences.entries()) {
      const sentenceWords = words(sentence).length;
      if (sentenceWords > 18) {
        failures.push(`${label}: sentence ${sentenceIndex + 1} has ${sentenceWords} words; maximum is 18`);
      }
    }
    if (/\b(?:TODO|TBD|placeholder|and so on)\b|\[\s*\.\.\.\s*\]/i.test(text)) {
      failures.push(`${label}: contains placeholder or abbreviated prose`);
    }

    totalWords += pageWords.length;
    shortestPage = Math.min(shortestPage, pageWords.length);
    longestPage = Math.max(longestPage, pageWords.length);
  }
}

console.log("Moonwood expanded-manuscript audit");
console.log(`Books: ${books.length}; pages: ${pageCount}; changed from rejected baseline: ${changedPageCount}.`);
console.log(
  `Words per page: ${shortestPage === Infinity ? 0 : shortestPage}–${longestPage}; `
  + `average: ${pageCount ? (totalWords / pageCount).toFixed(1) : "0.0"}.`
);
console.log(`Failures: ${failures.length}.`);

if (failures.length) {
  console.error("\nMoonwood expanded-manuscript gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("All 35 books and 405 pages use complete expanded paragraphs within the Moonwood Level C profile.");
