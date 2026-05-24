#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  guidedReadingBookCandidates,
  guidedReadingBooks
} from "../src/data/guidedReadingBooks.js";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_content_audit.md");
const validTypes = new Set(["fiction", "nonfiction"]);
const validLevels = new Set(["A", "B", "C", "D", "E"]);
const forbiddenStrings = [
  "placeholder",
  "test",
  "hhhhh",
  "lorem",
  "undefined",
  "null"
];

function publicFileExists(publicPath = "") {
  if (!publicPath) return false;
  return fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

function sentenceLooksValid(text = "") {
  const clean = String(text || "").trim();
  return /^[A-Z0-9"']/.test(clean) && /[.!?]["']?$/.test(clean);
}

function hasSpacedPunctuation(text = "") {
  return /\s+[.,!?;:]/.test(text);
}

function textHasForbiddenString(text = "") {
  const lower = String(text || "").toLowerCase();
  return forbiddenStrings.find(item => lower.includes(item));
}

function heuristicWarnings(page = {}) {
  const haystack = [
    page.image || "",
    page.imageAlt || "",
    page.pageDescription || "",
    page.embeddedImageText || "",
    page.qaNotes || ""
  ].join(" ").toLowerCase();
  const text = String(page.text || "").toLowerCase();
  const warnings = [];

  if (/\bday\b/.test(text) && /\b(night|moon|stars?)\b/.test(haystack)) {
    warnings.push("text mentions day but image metadata suggests night/moon/stars");
  }
  if (/\bnight\b/.test(text) && /\b(sun|day|morning)\b/.test(haystack)) {
    warnings.push("text mentions night but image metadata suggests sun/day");
  }
  if (/\bsun\b/.test(text) && /\b(moon|night)\b/.test(haystack)) {
    warnings.push("text mentions sun but image metadata suggests moon/night");
  }
  if (/\b(cans?|pans?)\b/.test(text) && /\b(map|crayons?|paint|book)\b/.test(haystack)) {
    warnings.push("text noun may conflict with image metadata");
  }

  return warnings;
}

function validateBook(book) {
  const issues = [];
  const pages = book.pages || [];
  const activePages = pages.filter(page => page.active !== false && page.qaStatus === "approved");

  if (!book.id) issues.push("missing book id");
  if (!book.title) issues.push("missing title");
  if (!validTypes.has(book.type)) issues.push(`invalid type: ${book.type}`);
  if (!validLevels.has(book.level)) issues.push(`invalid level: ${book.level}`);
  if (!book.coverImage) issues.push("missing cover image path");
  else if (!publicFileExists(book.coverImage)) issues.push(`missing cover image file: ${book.coverImage}`);
  if (book.active !== false && book.qaStatus === "approved" && activePages.length < 4) {
    issues.push("active approved book has fewer than 4 active approved pages");
  }

  const pageIssues = [];
  const seenPageNumbers = new Set();
  pages.forEach((page, index) => {
    const pageNumber = page.pageNumber || index + 1;
    const rowIssues = [];
    if (seenPageNumbers.has(pageNumber)) rowIssues.push(`duplicate page number ${pageNumber}`);
    seenPageNumbers.add(pageNumber);
    if (pageNumber !== index + 1) rowIssues.push(`non-sequential page number ${pageNumber}; expected ${index + 1}`);
    if (!page.text?.trim()) rowIssues.push("missing page text");
    if (page.text && !sentenceLooksValid(page.text)) rowIssues.push("sentence lacks capitalization or ending punctuation");
    if (hasSpacedPunctuation(page.text)) rowIssues.push("spaced punctuation");
    const forbidden = textHasForbiddenString(page.text);
    if (forbidden) rowIssues.push(`forbidden bad string: ${forbidden}`);
    if (!page.image) rowIssues.push("missing image path");
    else if (!publicFileExists(page.image)) rowIssues.push(`missing page image file: ${page.image}`);
    if (page.pageAudio && !publicFileExists(page.pageAudio)) rowIssues.push(`missing page narration file: ${page.pageAudio}`);
    if (!page.imageAlt) rowIssues.push("missing imageAlt metadata");
    if (!page.pageDescription) rowIssues.push("missing pageDescription metadata");
    if (!Array.isArray(page.targetWords)) rowIssues.push("missing targetWords metadata");
    if (!page.qaStatus) rowIssues.push("missing qaStatus");
    rowIssues.push(...heuristicWarnings(page));
    if (rowIssues.length) {
      pageIssues.push({ book, page, pageNumber, issues: rowIssues });
    }
  });

  return { issues, pageIssues };
}

const allBooksForValidation = [
  ...guidedReadingBookCandidates,
  ...guidedReadingBooks
];

const bookResults = allBooksForValidation.map(book => ({
  book,
  ...validateBook(book)
}));

const pageIssues = bookResults.flatMap(result => result.pageIssues);
const activeBooks = guidedReadingBooks;
const activePages = activeBooks.flatMap(book => book.pages || []);
const disabledBooks = guidedReadingBookCandidates.filter(book => book.active === false || book.qaStatus !== "approved");
const disabledPages = guidedReadingBookCandidates.flatMap(book =>
  (book.pages || [])
    .map((page, index) => ({ book, page, pageNumber: index + 1 }))
    .filter(item => item.page.active === false || item.page.qaStatus !== "approved")
);

const activeErrors = [
  ...bookResults
    .filter(result => result.book.active !== false && result.book.qaStatus === "approved")
    .flatMap(result => result.issues.map(issue => `${result.book.id}: ${issue}`)),
  ...pageIssues
    .filter(item => item.book.active !== false && item.book.qaStatus === "approved" && item.page.active !== false && item.page.qaStatus === "approved")
    .map(item => `${item.book.id} page ${item.pageNumber}: ${item.issues.join("; ")}`)
];

const regenerationRows = disabledPages.map(({ book, page, pageNumber }) => {
  const pageId = `${book.id}-page-${pageNumber}`;
  const reason = page.regenerationReason || book.regenerationReason || "Needs regeneration";
  const suggestedPrompt = [
    `Regenerate ${pageId} as an illustration-only page for "${book.title}".`,
    `No embedded text in the image.`,
    `Make the image clearly match this app text or provide new matching text/audio: "${page.text}".`,
    `Maintain Level ${book.level} ${book.type} style.`
  ].join(" ");
  return `| ${book.id} | ${book.title.replace(/\|/g, "\\|")} | ${pageNumber} | ${pageId} | ${reason.replace(/\|/g, "\\|")} | ${page.text.replace(/\|/g, "\\|")} | ${suggestedPrompt.replace(/\|/g, "\\|")} |`;
});

const pageIssueRows = pageIssues.length
  ? pageIssues.map(item =>
      `| ${item.book.id} | ${item.book.title.replace(/\|/g, "\\|")} | ${item.pageNumber} | ${item.issues.join("; ").replace(/\|/g, "\\|")} | ${String(item.page.text || "").replace(/\|/g, "\\|")} | ${item.page.qaStatus || "missing"} |`
    )
  : ["| none | none | none | No model validation issues found. | n/a | n/a |"];

const decisionText = activeBooks.length
  ? "Original Pack 8 Guided Reading candidates remain disabled. Validated regenerated books are now active from the separate regen import, and active reader content is limited to books/pages with approved QA status and existing assets."
  : "The imported Pack 8 Guided Reading books are disabled from active use for now. Visual inspection confirmed severe text/image problems in early pages: embedded image text conflicts with app text, some images show different nouns/actions than the app sentence, and page narration would become unreliable if text were silently rewritten.";

const report = `# Guided Reading Content Audit

Generated: ${new Date().toISOString()}

## Summary

- Candidate books checked: ${guidedReadingBookCandidates.length}
- Candidate pages checked: ${guidedReadingBookCandidates.flatMap(book => book.pages || []).length}
- Active approved books: ${activeBooks.length}
- Active approved pages: ${activePages.length}
- Disabled books: ${disabledBooks.length}
- Disabled pages: ${disabledPages.length}
- Active validation errors: ${activeErrors.length}

## Decision

${decisionText}

## Specific Observed Examples

| Book/Page | Problem | Action |
|---|---|---|
| gr-a-03 page 1 | App text says "Nan and Sam see a bag." The image focuses on a child with a map and embedded text "A MAP! WHERE WILL IT LEAD?" | Disabled. Needs clean illustration-only remake or matching text/audio. |
| gr-a-27 page 2 | App text says "It is day." The image shows sunset/night transition and embedded text "GOODBYE, SUN!" | Disabled. Needs matching text/audio or new illustration. |
| gr-a-02 page 3 | App text says "Sam can pick up the cans." The image shows crayons and a box labeled "CRAYONS." | Disabled. Needs matching text/audio or new illustration. |
| gr-a-02 page 5 | App text says "I can help, says Nan." The image shows Sam helping a friend and embedded text "Sam helps a friend." | Disabled. Needs matching text/audio or new illustration. |

## Validation Issues

| Book ID | Title | Page | Issues | Text | QA Status |
|---|---|---:|---|---|---|
${pageIssueRows.join("\n")}

## Pages Needing Kimi Regeneration

| Book ID | Title | Page | Page ID | Reason | Current app text | Suggested replacement request |
|---|---|---:|---|---|---|---|
${regenerationRows.join("\n")}

## Requirements For Replacement Pack

- Page images must be illustration-only, with no embedded story text unless the app text exactly matches it.
- Page narration must match the app text word-for-word.
- Each page needs imageAlt, pageDescription, embeddedImageText, targetWords, decodableFocus, highFrequencyWords, qaStatus, and qaNotes.
- Level A/B sentences can stay simple, but they must be coherent, natural, capitalized, and punctuated.
- Do not reuse the current mismatched page art as active reader content.
`;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report);

if (activeErrors.length) {
  console.error(activeErrors.join("\n"));
  process.exit(1);
}

console.log(`Guided Reading candidate books checked: ${guidedReadingBookCandidates.length}`);
console.log(`Guided Reading active approved books: ${activeBooks.length}`);
console.log(`Guided Reading disabled books: ${disabledBooks.length}`);
console.log(`Guided Reading disabled pages: ${disabledPages.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
