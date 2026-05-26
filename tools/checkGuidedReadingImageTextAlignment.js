import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_image_text_alignment_audit.md");

function publicFileExists(publicPath = "") {
  if (!publicPath || /^https?:\/\//.test(publicPath)) return false;
  return fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

function expectedImagePatterns(bookId, storyPageNumber) {
  const bobAndNanMap = {
    "bob-and-nan-01": "01",
    "bob-and-nan-02-park": "02",
    "bob-and-nan-03-fluff": "03",
    "bob-and-nan-04-beach": "04",
    "bob-and-nan-05-school": "05"
  };
  const jamesAndAnnaMap = {
    "james-and-anna-01-space": "01",
    "james-and-anna-02-chips": "02",
    "james-and-anna-03-shopping": "03",
    "james-and-anna-04-dentist": "04",
    "james-and-anna-05-tree-house": "05"
  };
  const aidenAndBettyMap = {
    "ab-c-01": "01",
    "ab-c-02": "02",
    "ab-c-03": "03",
    "ab-c-04": "04",
    "ab-c-05": "05"
  };
  if (bobAndNanMap[bookId]) {
    return [`/guided-reading/series/bob-and-nan/book-${bobAndNanMap[bookId]}/page-${String(storyPageNumber).padStart(3, "0")}.`];
  }
  if (jamesAndAnnaMap[bookId]) {
    return [`/guided-reading/series/james-and-anna/book-${jamesAndAnnaMap[bookId]}/page-${String(storyPageNumber).padStart(3, "0")}.`];
  }
  if (aidenAndBettyMap[bookId]) {
    return [`/guided-reading/series/aiden-and-betty/book-${aidenAndBettyMap[bookId]}/page-${String(storyPageNumber).padStart(3, "0")}.`];
  }

  return [
    `/guided-reading/regen/pages/${bookId}-page-${String(storyPageNumber).padStart(2, "0")}.`,
    `/guided-reading/pages/${bookId}/page-${String(storyPageNumber).padStart(3, "0")}.`,
    `/guided-reading/pages/${bookId}-page-${storyPageNumber}.`,
    `/guided-reading/pages/${bookId}-page-${String(storyPageNumber).padStart(2, "0")}.`
  ];
}

function imageMatchesStoryPage(bookId, page) {
  return expectedImagePatterns(bookId, page.storyPageNumber).some(pattern => String(page.image || "").includes(pattern));
}

const failures = [];
const rows = [];
const fictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const allowedFictionIds = new Set([
  "bob-and-nan-01",
  "bob-and-nan-02-park",
  "bob-and-nan-03-fluff",
  "bob-and-nan-04-beach",
  "bob-and-nan-05-school",
  "james-and-anna-01-space",
  "james-and-anna-02-chips",
  "james-and-anna-03-shopping",
  "james-and-anna-04-dentist",
  "james-and-anna-05-tree-house",
  "ab-c-01",
  "ab-c-02",
  "ab-c-03",
  "ab-c-04",
  "ab-c-05"
]);
const unexpectedFictionBooks = fictionBooks.filter(book => !allowedFictionIds.has(book.id));

if (unexpectedFictionBooks.length) {
  failures.push(`Unexpected fiction Guided Reading books remain after removal: ${unexpectedFictionBooks.map(book => book.id).join(", ")}`);
}

for (const rawBook of guidedReadingBooks) {
  const book = normalizeReadableBook(rawBook);

  if (book.pages[0]?.type !== "title") {
    failures.push(`${book.id}: reader page 1 is not title page`);
  }

  for (const page of book.pages.slice(1)) {
    const exists = publicFileExists(page.image);
    const matches = imageMatchesStoryPage(book.id, page);
    if (!exists) failures.push(`${book.id}: reader page ${page.pageNumber} missing image file ${page.image || "none"}`);
    if (!matches) failures.push(`${book.id}: reader page ${page.pageNumber} story page ${page.storyPageNumber} uses out-of-sequence image ${page.image || "none"}`);
    rows.push({
      id: book.id,
      title: book.title,
      readerPage: page.pageNumber,
      storyPage: page.storyPageNumber,
      text: page.text,
      image: page.image,
      imageExists: exists,
      sequenceMatch: matches
    });
  }
}

const report = [
  "# Guided Reading Image/Text Alignment Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## What This Check Proves",
  "",
  "This check verifies that every visible Guided Reading book has title-page normalization and that story page images stay mechanically aligned with story page numbers. Fiction is limited to Bob and Nan Level A, James and Anna Level B, and Aiden and Betty Level C teacher-preview series.",
  "",
  `Visible fiction books: ${fictionBooks.length}`,
  "",
  "## Page Sequence",
  "",
  "| Book | Reader Page | Story Page | Image Exists | Sequence Match | Image | Text Start |",
  "|---|---:|---:|---:|---:|---|---|",
  ...rows.map(row => `| ${row.id} | ${row.readerPage} | ${row.storyPage} | ${row.imageExists ? "yes" : "no"} | ${row.sequenceMatch ? "yes" : "no"} | ${row.image} | ${String(row.text || "").slice(0, 80).replace(/\|/g, "/")} |`),
  "",
  "## Failures",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Result\n\nFAIL" : "## Result\n\nPASS"
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Guided Reading books checked: ${new Set(rows.map(row => row.id)).size}`);
console.log(`Guided Reading story pages checked: ${rows.length}`);
console.log(`Image/text alignment failures: ${failures.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.slice(0, 40).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
