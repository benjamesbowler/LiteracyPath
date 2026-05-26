import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, guidedReadingSeriesBookDrafts, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_import_audit.md");

const expectedBookIds = [
  "bob-and-nan-01",
  "bob-and-nan-02-park",
  "bob-and-nan-03-fluff",
  "bob-and-nan-04-beach",
  "bob-and-nan-05-school"
];

const oldFictionIds = [
  "gs-c-01",
  "gs-c-02",
  "gs-c-03",
  "gs-c-04",
  "gs-c-06",
  "gr-a-01",
  "gr-a-02",
  "gr-a-03",
  "gr-a-04",
  "gr-a-05",
  "gr-b-06",
  "gr-b-07",
  "gr-b-08",
  "gr-b-09",
  "gr-c-11",
  "gr-c-12",
  "gr-c-13",
  "gr-c-14",
  "gr-c-15",
  "gr-d-16",
  "gr-d-17",
  "gr-d-18",
  "gr-d-19",
  "gr-e-21",
  "gr-e-22",
  "gr-e-23",
  "gr-e-24",
  "gr-e-25"
];

function publicPathExists(publicPath = "") {
  return Boolean(publicPath) && fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

const failures = [];
const rows = [];
const draftBobBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "bob-and-nan");
const visibleBobBooks = guidedReadingBooks.filter(book => book.seriesId === "bob-and-nan");
const visibleNonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const oldFictionRestored = guidedReadingBooks.filter(book => oldFictionIds.includes(book.id));

if (draftBobBooks.length !== 5) failures.push(`Expected 5 Bob and Nan draft books, found ${draftBobBooks.length}.`);
if (visibleBobBooks.length !== 5) failures.push(`Expected 5 visible Bob and Nan teacher-preview books, found ${visibleBobBooks.length}.`);
if (visibleNonfictionBooks.length !== 23) failures.push(`Expected 23 nonfiction books to remain, found ${visibleNonfictionBooks.length}.`);
if (oldFictionRestored.length) failures.push(`Old deleted fiction ids were restored: ${oldFictionRestored.map(book => book.id).join(", ")}`);

for (const id of expectedBookIds) {
  const book = visibleBobBooks.find(item => item.id === id);
  if (!book) {
    failures.push(`${id}: missing from visible teacher-preview Guided Reading books.`);
    continue;
  }

  const normalized = normalizeReadableBook(book);
  const storyPages = book.pages || [];
  const coverExists = publicPathExists(book.coverImage);
  const missingStoryImages = storyPages.filter(page => !publicPathExists(page.image)).map(page => page.pageNumber);
  const firstStoryImage = storyPages[0]?.image || "";

  if (book.level !== "A") failures.push(`${id}: level is ${book.level}, expected A.`);
  if (normalizeGuidedReadingType(book.type) !== "fiction") failures.push(`${id}: type is ${book.type}, expected fiction.`);
  if (book.seriesTitle !== "Bob and Nan") failures.push(`${id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.ageRange !== "4-5") failures.push(`${id}: ageRange is ${book.ageRange || "missing"}.`);
  if (book.qaStatus !== "needs_review") failures.push(`${id}: qaStatus is ${book.qaStatus || "missing"}, expected needs_review.`);
  if (!book.teacherPreviewOnly) failures.push(`${id}: teacherPreviewOnly is not true.`);
  if (storyPages.length !== 7) failures.push(`${id}: story page count is ${storyPages.length}, expected 7.`);
  if (!coverExists) failures.push(`${id}: cover missing at ${book.coverImage || "missing"}.`);
  if (missingStoryImages.length) failures.push(`${id}: missing story page images ${missingStoryImages.join(", ")}.`);
  if (!firstStoryImage.endsWith("page-001.webp")) failures.push(`${id}: story page 1 does not use page-001.webp (${firstStoryImage}).`);
  if (firstStoryImage === book.coverImage) failures.push(`${id}: story page 1 is incorrectly using the cover image.`);
  if (normalized.pages[0]?.type !== "title") failures.push(`${id}: normalized reader page 1 is not a title page.`);
  if (normalized.pages[0]?.image !== book.coverImage) failures.push(`${id}: title page does not use the cover image.`);
  if (normalized.pages[1]?.storyPageNumber !== 1) failures.push(`${id}: first story page is not storyPageNumber 1.`);
  if (normalized.pages[1]?.image !== firstStoryImage) failures.push(`${id}: normalized story page 1 image changed from source page-001.`);

  rows.push({
    id,
    title: book.title,
    level: book.level,
    type: normalizeGuidedReadingType(book.type),
    bookNumber: book.bookNumber,
    cover: book.coverImage,
    coverExists,
    pages: storyPages.length,
    missingStoryImages,
    qaStatus: book.qaStatus,
    teacherPreviewOnly: Boolean(book.teacherPreviewOnly)
  });
}

const report = [
  "# Bob and Nan Level A Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`~/Desktop/Our Guided Reading Books Literacy Path/Nan and Bob 1-5 A`",
  "",
  "## Summary",
  "",
  `- Bob and Nan books imported: ${visibleBobBooks.length}`,
  `- Story page images expected: ${visibleBobBooks.length * 7}`,
  `- Covers expected: ${visibleBobBooks.length}`,
  `- Nonfiction books kept: ${visibleNonfictionBooks.length}`,
  `- Old deleted fiction books restored: ${oldFictionRestored.length}`,
  `- Validation failures: ${failures.length}`,
  "",
  "## Imported Books",
  "",
  "| ID | Title | Level | Type | Book # | Pages | Cover | Missing Images | QA | Preview Only |",
  "|---|---|---|---|---:|---:|---:|---|---|---:|",
  ...rows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.type} | ${row.bookNumber} | ${row.pages} | ${row.coverExists ? "yes" : "no"} | ${row.missingStoryImages.length ? row.missingStoryImages.join(", ") : "none"} | ${row.qaStatus} | ${row.teacherPreviewOnly ? "yes" : "no"} |`),
  "",
  "## Sequence Check",
  "",
  "PASS criteria: cover is used only as the normalized title page, and story page 1 uses `page-001.webp`.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Bob and Nan is wired as a Level A fiction teacher-preview series without restoring old fiction books."
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Bob and Nan books visible: ${visibleBobBooks.length}`);
console.log(`Nonfiction books visible: ${visibleNonfictionBooks.length}`);
console.log(`Old fiction restored: ${oldFictionRestored.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
