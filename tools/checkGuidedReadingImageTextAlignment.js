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

if (fictionBooks.length) {
  failures.push(`Fiction Guided Reading books remain after removal: ${fictionBooks.map(book => book.id).join(", ")}`);
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
  "Fiction guided-reading books were removed. This check now verifies that every remaining nonfiction book has title-page normalization and that story page images stay mechanically aligned with story page numbers.",
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
