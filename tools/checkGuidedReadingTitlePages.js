import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_title_page_audit.md");

function publicFileExists(publicPath = "") {
  if (!publicPath || /^https?:\/\//.test(publicPath)) return false;
  return fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

const failures = [];
const warnings = [];
const rows = [];
const fictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const allowedFictionIds = new Set([
  "bob-and-nan-01",
  "bob-and-nan-02-park",
  "bob-and-nan-03-fluff",
  "bob-and-nan-04-beach",
  "bob-and-nan-05-school",
  "bob-and-nan-06-zoo",
  "bob-and-nan-07-birthday",
  "bob-and-nan-08-sick",
  "bob-and-nan-09-read",
  "bob-and-nan-10-vet",
  "james-and-anna-01-space",
  "james-and-anna-02-chips",
  "james-and-anna-03-shopping",
  "james-and-anna-04-dentist",
  "james-and-anna-05-tree-house",
  "ab-c-01",
  "ab-c-02",
  "ab-c-03",
  "ab-c-04",
  "ab-c-05",
  "ab-c-06",
  "ab-c-07",
  "ab-c-08",
  "ab-c-09",
  "ab-c-10"
]);
const unexpectedFictionBooks = fictionBooks.filter(book => !allowedFictionIds.has(book.id));

if (unexpectedFictionBooks.length) {
  failures.push(`Unexpected fiction Guided Reading books remain after removal: ${unexpectedFictionBooks.map(book => book.id).join(", ")}`);
}

for (const rawBook of guidedReadingBooks) {
  const book = normalizeReadableBook(rawBook);
  const titlePage = book.pages[0];
  const sourcePageCount = rawBook.pages?.length || 0;

  if (!titlePage) {
    failures.push(`${rawBook.id}: missing normalized title page`);
    continue;
  }

  if (titlePage.type !== "title") failures.push(`${rawBook.id}: reader page 1 is not a title page`);
  if (titlePage.pageNumber !== 1) failures.push(`${rawBook.id}: title page number is ${titlePage.pageNumber}, expected 1`);
  if (!titlePage.text.includes(rawBook.title)) failures.push(`${rawBook.id}: title page text missing book title`);
  if (!/^by\s+.+/im.test(titlePage.text)) failures.push(`${rawBook.id}: title page text missing by line`);
  if (!/^illustrated by\s+.+/im.test(titlePage.text)) failures.push(`${rawBook.id}: title page text missing illustrated by line`);
  if (!titlePage.image) failures.push(`${rawBook.id}: title page missing cover/title image`);
  if (titlePage.image && !publicFileExists(titlePage.image)) failures.push(`${rawBook.id}: title page image does not exist (${titlePage.image})`);

  if (book.pages.length !== sourcePageCount + 1) {
    failures.push(`${rawBook.id}: normalized page count ${book.pages.length}, expected source pages + title (${sourcePageCount + 1})`);
  }

  const firstStoryPage = book.pages[1];
  if (!firstStoryPage) {
    failures.push(`${rawBook.id}: missing first story page after title page`);
  } else {
    if (firstStoryPage.type !== "story") failures.push(`${rawBook.id}: reader page 2 is not marked as story`);
    if (firstStoryPage.pageNumber !== 2) failures.push(`${rawBook.id}: first story reader page is ${firstStoryPage.pageNumber}, expected 2`);
    if (firstStoryPage.storyPageNumber !== 1) failures.push(`${rawBook.id}: first story page keeps storyPageNumber ${firstStoryPage.storyPageNumber}, expected 1`);
  }

  rows.push({
    id: rawBook.id,
    title: rawBook.title,
    level: rawBook.level,
    type: rawBook.type,
    sourcePages: sourcePageCount,
    readerPages: book.pages.length,
    titleImage: titlePage.image,
    titleText: titlePage.text.replace(/\n/g, " / ")
  });
}

const report = [
  "# Guided Reading Title Page Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Strategy",
  "",
  "Every remaining app-created Guided Reading book is normalized with reader page 1 as a title page. Fiction guided-reading is limited to Bob and Nan Level A books 1-10, James and Anna Level B, and Aiden and Betty Level C teacher-preview series.",
  "",
  `Visible fiction books: ${fictionBooks.length}`,
  `Visible nonfiction books: ${guidedReadingBooks.length - fictionBooks.length}`,
  "",
  "## Books Checked",
  "",
  "| ID | Title | Type | Level | Source Pages | Reader Pages | Title Image | Title Text |",
  "|---|---|---|---|---:|---:|---|---|",
  ...rows.map(row => `| ${row.id} | ${row.title} | ${row.type || ""} | ${row.level || ""} | ${row.sourcePages} | ${row.readerPages} | ${row.titleImage || "missing"} | ${row.titleText} |`),
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  "## Failures",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Result\n\nFAIL" : "## Result\n\nPASS"
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Guided Reading books checked: ${rows.length}`);
console.log(`Visible fiction books: ${fictionBooks.length}`);
console.log(`Title page failures: ${failures.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.slice(0, 30).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
