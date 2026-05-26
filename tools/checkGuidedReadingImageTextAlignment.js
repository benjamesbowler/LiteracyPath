import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_image_text_alignment_audit.md");
const levelCIds = new Set(["gs-c-01", "gs-c-02", "gs-c-03", "gs-c-04", "gs-c-06"]);

function publicFileExists(publicPath = "") {
  if (!publicPath || /^https?:\/\//.test(publicPath)) return false;
  return fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

function expectedImagePatterns(bookId, storyPageNumber) {
  return [
    `/guided-reading/pages/${bookId}/page-${String(storyPageNumber).padStart(3, "0")}.`,
    `/guided-reading/pages/${bookId}-page-${String(storyPageNumber).padStart(2, "0")}.`
  ];
}

function imageMatchesStoryPage(bookId, page) {
  return expectedImagePatterns(bookId, page.storyPageNumber).some(pattern => String(page.image || "").includes(pattern));
}

const failures = [];
const rows = [];

for (const rawBook of guidedReadingBooks.filter(book => levelCIds.has(book.id))) {
  const book = normalizeReadableBook(rawBook);

  if (book.pages[0]?.type !== "title") {
    failures.push(`${book.id}: reader page 1 is not title page`);
  }

  for (const page of book.pages.slice(1)) {
    const matches = imageMatchesStoryPage(book.id, page);
    const exists = publicFileExists(page.image);
    if (!exists) failures.push(`${book.id}: reader page ${page.pageNumber} missing image file ${page.image || "none"}`);
    if (!matches) {
      failures.push(`${book.id}: reader page ${page.pageNumber} story page ${page.storyPageNumber} uses out-of-sequence image ${page.image || "none"}`);
    }

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
  "This check prevents the global one-page drift by confirming that Level C reader page 1 is a title page and each story page then uses the image with the same story page number. It does not replace human visual QA for whether an illustration is beautiful or semantically strong; it ensures the text and image sequence is no longer mechanically offset.",
  "",
  "## Level C Page Sequence",
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

console.log(`Level C books checked: ${new Set(rows.map(row => row.id)).size}`);
console.log(`Level C story pages checked: ${rows.length}`);
console.log(`Image/text alignment failures: ${failures.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.slice(0, 40).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
