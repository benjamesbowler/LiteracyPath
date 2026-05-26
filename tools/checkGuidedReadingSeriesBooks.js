import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, guidedReadingSeriesBookDrafts, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const bobReportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_import_audit.md");
const jamesReportPath = path.join(rootDir, "docs", "guided-reading", "james_and_anna_import_audit.md");

const expectedBobBookIds = [
  "bob-and-nan-01",
  "bob-and-nan-02-park",
  "bob-and-nan-03-fluff",
  "bob-and-nan-04-beach",
  "bob-and-nan-05-school"
];

const expectedJamesBooks = [
  { id: "james-and-anna-01-space", title: "James and Anna go to Space", pages: 14 },
  { id: "james-and-anna-02-chips", title: "James and Anna and Chips", pages: 12 },
  { id: "james-and-anna-03-shopping", title: "James and Anna go Shopping", pages: 13 },
  { id: "james-and-anna-04-dentist", title: "James and Anna go to the Dentist", pages: 13 },
  { id: "james-and-anna-05-tree-house", title: "James and Anna build a Tree House", pages: 14 }
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
const jamesRows = [];
const warnings = [];
const draftBobBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "bob-and-nan");
const draftJamesBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "james-and-anna");
const visibleBobBooks = guidedReadingBooks.filter(book => book.seriesId === "bob-and-nan");
const visibleJamesBooks = guidedReadingBooks.filter(book => book.seriesId === "james-and-anna");
const visibleNonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const oldFictionRestored = guidedReadingBooks.filter(book => oldFictionIds.includes(book.id));

if (draftBobBooks.length !== 5) failures.push(`Expected 5 Bob and Nan draft books, found ${draftBobBooks.length}.`);
if (visibleBobBooks.length !== 5) failures.push(`Expected 5 visible Bob and Nan teacher-preview books, found ${visibleBobBooks.length}.`);
if (draftJamesBooks.length !== 5) failures.push(`Expected 5 James and Anna draft books, found ${draftJamesBooks.length}.`);
if (visibleJamesBooks.length !== 5) failures.push(`Expected 5 visible James and Anna teacher-preview books, found ${visibleJamesBooks.length}.`);
if (visibleNonfictionBooks.length !== 23) failures.push(`Expected 23 nonfiction books to remain, found ${visibleNonfictionBooks.length}.`);
if (oldFictionRestored.length) failures.push(`Old deleted fiction ids were restored: ${oldFictionRestored.map(book => book.id).join(", ")}`);

for (const id of expectedBobBookIds) {
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

for (const expected of expectedJamesBooks) {
  const book = draftJamesBooks.find(item => item.id === expected.id);
  if (!book) {
    failures.push(`${expected.id}: missing from James and Anna draft data.`);
    continue;
  }

  const storyPages = book.pages || [];
  const coverExists = publicPathExists(book.coverImage);
  const importedPages = storyPages.filter(page => publicPathExists(page.image)).map(page => page.pageNumber);
  const missingStoryImages = storyPages.filter(page => !publicPathExists(page.image)).map(page => page.pageNumber);
  const firstStoryImage = storyPages[0]?.image || "";

  if (book.level !== "B") failures.push(`${expected.id}: level is ${book.level}, expected B.`);
  if (normalizeGuidedReadingType(book.type) !== "fiction") failures.push(`${expected.id}: type is ${book.type}, expected fiction.`);
  if (book.seriesTitle !== "James and Anna") failures.push(`${expected.id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.ageRange !== "5-6") failures.push(`${expected.id}: ageRange is ${book.ageRange || "missing"}.`);
  if (book.qaStatus !== "needs_review") failures.push(`${expected.id}: qaStatus is ${book.qaStatus || "missing"}, expected needs_review for teacher preview.`);
  if (!book.teacherPreviewOnly) failures.push(`${expected.id}: teacherPreviewOnly should be true for teacher preview.`);
  if (storyPages.length !== expected.pages) failures.push(`${expected.id}: source page count is ${storyPages.length}, expected ${expected.pages}.`);
  if (!coverExists) failures.push(`${expected.id}: cover missing at ${book.coverImage || "missing"}.`);
  if (importedPages.length !== expected.pages) failures.push(`${expected.id}: imported story image count is ${importedPages.length}, expected ${expected.pages}.`);
  if (missingStoryImages.length) failures.push(`${expected.id}: missing story page images ${missingStoryImages.join(", ")}.`);
  if (!firstStoryImage.endsWith("page-001.webp")) failures.push(`${expected.id}: story page 1 does not use page-001.webp (${firstStoryImage}).`);
  if (firstStoryImage === book.coverImage) failures.push(`${expected.id}: story page 1 is incorrectly using the cover image.`);
  if (book.availableStoryPageCount !== expected.pages) failures.push(`${expected.id}: availableStoryPageCount is ${book.availableStoryPageCount}, expected ${expected.pages}.`);
  if (book.missingStoryPages?.length) failures.push(`${expected.id}: missingStoryPages should be empty after full import (${book.missingStoryPages.join(", ")}).`);

  const visibleBook = visibleJamesBooks.find(item => item.id === expected.id);
  if (!visibleBook) {
    failures.push(`${expected.id}: missing from visible teacher-preview shelf.`);
  } else if ((visibleBook.pages || []).length !== expected.pages) {
    failures.push(`${expected.id}: visible preview page count is ${visibleBook.pages?.length || 0}, expected ${expected.pages} delivered pages.`);
  }

  jamesRows.push({
    id: expected.id,
    title: book.title,
    level: book.level,
    pages: storyPages.length,
    importedPages,
    missingStoryImages,
    coverExists,
    qaStatus: book.qaStatus
  });
}

const bobReport = [
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
  failures.length ? failures.filter(item => item.includes("Bob") || item.includes("bob-and-nan") || item.includes("Nonfiction") || item.includes("Old deleted")).map(item => `- ${item}`).join("\n") || "None affecting Bob and Nan." : "PASS: Bob and Nan is wired as a Level A fiction teacher-preview series without restoring old fiction books."
];

const jamesReport = [
  "# James and Anna Level B Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`~/Desktop/Our Guided Reading Books Literacy Path/James and Anna 1-5 B`",
  "",
  "## Summary",
  "",
  `- James and Anna draft books added: ${draftJamesBooks.length}`,
  `- James and Anna teacher-preview books: ${visibleJamesBooks.length}`,
  "- Preview scope: full delivered image pack is imported for all story pages; books remain teacher-preview until QA approves text-picture matching.",
  `- Imported covers: ${jamesRows.filter(row => row.coverExists).length}/5`,
  `- Imported story page images: ${jamesRows.reduce((sum, row) => sum + row.importedPages.length, 0)}`,
  `- Missing story page images: ${jamesRows.reduce((sum, row) => sum + row.missingStoryImages.length, 0)}`,
  `- Nonfiction books kept: ${visibleNonfictionBooks.length}`,
  `- Old deleted fiction books restored: ${oldFictionRestored.length}`,
  `- Validation failures: ${failures.length}`,
  "",
  "## Imported Books",
  "",
  "| ID | Title | Level | Source Pages | Imported Images | Missing Images | Cover | QA |",
  "|---|---|---|---:|---|---|---:|---|",
  ...jamesRows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.pages} | ${row.importedPages.join(", ") || "none"} | ${row.missingStoryImages.join(", ") || "none"} | ${row.coverExists ? "yes" : "no"} | ${row.qaStatus} |`),
  "",
  "## Sequence Check",
  "",
  "The imported pages are mapped safely: `page-001.webp` is the first story page image, and no one-page shift was introduced.",
  "",
  "The delivered `book-xx-cover.webp` files in the James and Anna illustration folder still showed the old Bob/Nan-looking cover art, so they were not used. For teacher preview, each Level B `cover.webp` now uses that book's `page-001.webp` image so the shelf/title page no longer shows Bob/Nan characters. These covers should be replaced later with proper James and Anna title/cover art.",
  "",
  "## Remaining TODOs",
  "",
  "- Keep `qaStatus: needs_review` and teacher-preview status until all delivered pages are checked.",
  "- Request proper James and Anna cover/title images for the five Level B books if unique cover art is needed before student release.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: James and Anna assets are visible as teacher previews with full story image coverage."
];

fs.mkdirSync(path.dirname(bobReportPath), { recursive: true });
fs.writeFileSync(bobReportPath, `${bobReport.join("\n")}\n`);
fs.writeFileSync(jamesReportPath, `${jamesReport.join("\n")}\n`);

console.log(`Bob and Nan books visible: ${visibleBobBooks.length}`);
console.log(`James and Anna draft books: ${draftJamesBooks.length}`);
console.log(`James and Anna visible books: ${visibleJamesBooks.length}`);
console.log(`Nonfiction books visible: ${visibleNonfictionBooks.length}`);
console.log(`Old fiction restored: ${oldFictionRestored.length}`);
console.log(`Wrote ${path.relative(rootDir, bobReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, jamesReportPath)}`);

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
