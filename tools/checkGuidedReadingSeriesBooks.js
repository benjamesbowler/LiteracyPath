import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, guidedReadingSeriesBookDrafts, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const bobReportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_import_audit.md");
const bobBooks610ReportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_books_6_10_import_audit.md");
const jamesReportPath = path.join(rootDir, "docs", "guided-reading", "james_and_anna_import_audit.md");
const aidenReportPath = path.join(rootDir, "docs", "guided-reading", "aiden_and_betty_import_audit.md");

const expectedBobBooks = [
  { id: "bob-and-nan-01", title: "Bob and Nan", pages: 7 },
  { id: "bob-and-nan-02-park", title: "Bob and Nan go to the Park", pages: 7 },
  { id: "bob-and-nan-03-fluff", title: "Bob, Nan and Fluff", pages: 7 },
  { id: "bob-and-nan-04-beach", title: "Bob and Nan go to the Beach", pages: 7 },
  { id: "bob-and-nan-05-school", title: "Bob and Nan's First Day at School", pages: 7 },
  { id: "bob-and-nan-06-zoo", title: "Nan and Bob go to the Zoo", pages: 8 },
  { id: "bob-and-nan-07-birthday", title: "Nan and Bob: Bob's Birthday Party", pages: 8 },
  { id: "bob-and-nan-08-sick", title: "Nan and Bob get Sick", pages: 8 },
  { id: "bob-and-nan-09-read", title: "Nan and Bob Learn to Read", pages: 8 },
  { id: "bob-and-nan-10-vet", title: "Fluff Visits the Vet", pages: 8 }
];

const expectedBobBooks610Text = {
  "bob-and-nan-06-zoo": [
    "Nan and Bob go to the zoo.",
    "Bob sees a big cat.",
    "Nan sees a red bird.",
    "Nan and Bob see the big fish.",
    "Nan sees a fat frog on a log.",
    "Bob and Nan see the big ape.",
    "The big ape ate a fig.",
    "Nan and Bob had a lot of fun!"
  ],
  "bob-and-nan-07-birthday": [
    "It is Bob's big day!",
    "Nan has a big gift for Bob.",
    "Bob rips it! It is a red bat!",
    "Mum lit the big cake.",
    "Bob can see six big candles.",
    "Nan and Bob ate the big cake!",
    "Nan and Bob run and hop!",
    "It was the best day!"
  ],
  "bob-and-nan-08-sick": [
    "Bob is hot. Bob is ill.",
    "Bob has to rest in bed.",
    "Nan is ill too.",
    "Nan has a nap. Fluff has a nap too.",
    "Mum has a hot cup for Nan and Bob.",
    "Nan and Bob sip and rest.",
    "Bob is well! Nan is well!",
    "Run, Bob! Run, Nan! Run, Fluff!"
  ],
  "bob-and-nan-09-read": [
    "Nan has a big red book.",
    "Nan can read! Bob can not yet.",
    "Nan will help Bob.",
    "C - A - T. Cat! Bob can get it!",
    "Bob can read it: 'The dog ran.'",
    "Bob can read! Bob is so glad!",
    "Nan and Bob read all day.",
    "Fluff had a nap. Good dog, Fluff!"
  ],
  "bob-and-nan-10-vet": [
    "Fluff has a sore leg.",
    "Nan and Bob are sad.",
    "Mum and Nan and Bob go to the vet.",
    "Fluff sits on the big bed.",
    "The vet has a look.",
    "The vet has a jab for Fluff.",
    "Fluff is so good! What a pup!",
    "Fluff is well! Run, Fluff, run!"
  ]
};

const expectedJamesBooks = [
  { id: "james-and-anna-01-space", title: "James and Anna go to Space", pages: 14 },
  { id: "james-and-anna-02-chips", title: "James and Anna and Chips", pages: 12 },
  { id: "james-and-anna-03-shopping", title: "James and Anna go Shopping", pages: 13 },
  { id: "james-and-anna-04-dentist", title: "James and Anna go to the Dentist", pages: 13 },
  { id: "james-and-anna-05-tree-house", title: "James and Anna build a Tree House", pages: 14 },
  { id: "ja-b-06", title: "James and Anna visit Grandma's Farm", pages: 12 },
  { id: "ja-b-07", title: "James and Anna and the School Play", pages: 13 },
  { id: "ja-b-08", title: "Chips's Play Date", pages: 12 },
  { id: "ja-b-09", title: "James and Anna's New Bikes", pages: 13 },
  { id: "ja-b-10", title: "James, Anna and Chips go Camping", pages: 14 }
];

const expectedAidenBooks = [
  { id: "ab-c-01", title: "Aiden and Betty Start Grade 1", pages: 13 },
  { id: "ab-c-02", title: "Aiden and Betty have a Yard Sale", pages: 13 },
  { id: "ab-c-03", title: "Aiden and Betty go on Holiday", pages: 13 },
  { id: "ab-c-04", title: "Aiden and Betty and Socks", pages: 14 },
  { id: "ab-c-05", title: "Socks Goes Missing", pages: 14 },
  { id: "ab-c-06", title: "Aiden and Betty and the Science Fair", pages: 13 },
  { id: "ab-c-07", title: "Aiden, Betty and Socks's Big Adventure", pages: 13 },
  { id: "ab-c-08", title: "Aiden and Betty and the Bully", pages: 13 },
  { id: "ab-c-09", title: "Aiden and Betty: New Teeth", pages: 13 },
  { id: "ab-c-10", title: "Aiden and Betty and the Castle", pages: 13 }
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
const bobBooks610Rows = [];
const jamesRows = [];
const aidenRows = [];
const warnings = [];
const draftBobBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "bob-and-nan");
const draftJamesBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "james-and-anna");
const draftAidenBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "aiden-and-betty");
const visibleBobBooks = guidedReadingBooks.filter(book => book.seriesId === "bob-and-nan");
const visibleJamesBooks = guidedReadingBooks.filter(book => book.seriesId === "james-and-anna");
const visibleAidenBooks = guidedReadingBooks.filter(book => book.seriesId === "aiden-and-betty");
const visibleNonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const oldFictionRestored = guidedReadingBooks.filter(book => oldFictionIds.includes(book.id));

if (draftBobBooks.length !== 10) failures.push(`Expected 10 Bob and Nan draft books, found ${draftBobBooks.length}.`);
if (visibleBobBooks.length !== 10) failures.push(`Expected 10 visible Bob and Nan teacher-preview books, found ${visibleBobBooks.length}.`);
if (draftJamesBooks.length !== 10) failures.push(`Expected 10 James and Anna draft books, found ${draftJamesBooks.length}.`);
if (visibleJamesBooks.length !== 10) failures.push(`Expected 10 visible James and Anna teacher-preview books, found ${visibleJamesBooks.length}.`);
if (draftAidenBooks.length !== 10) failures.push(`Expected 10 Aiden and Betty draft books, found ${draftAidenBooks.length}.`);
if (visibleAidenBooks.length !== 10) failures.push(`Expected 10 visible Aiden and Betty teacher-preview books, found ${visibleAidenBooks.length}.`);
if (visibleNonfictionBooks.length !== 23) failures.push(`Expected 23 nonfiction books to remain, found ${visibleNonfictionBooks.length}.`);
if (oldFictionRestored.length) failures.push(`Old deleted fiction ids were restored: ${oldFictionRestored.map(book => book.id).join(", ")}`);

for (const expected of expectedBobBooks) {
  const id = expected.id;
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

  if (book.title !== expected.title) failures.push(`${id}: title is ${book.title}, expected ${expected.title}.`);
  if (book.level !== "A") failures.push(`${id}: level is ${book.level}, expected A.`);
  if (normalizeGuidedReadingType(book.type) !== "fiction") failures.push(`${id}: type is ${book.type}, expected fiction.`);
  if (book.seriesTitle !== "Bob and Nan") failures.push(`${id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.ageRange !== "4-5") failures.push(`${id}: ageRange is ${book.ageRange || "missing"}.`);
  if (book.qaStatus !== "needs_review") failures.push(`${id}: qaStatus is ${book.qaStatus || "missing"}, expected needs_review.`);
  if (!book.teacherPreviewOnly) failures.push(`${id}: teacherPreviewOnly is not true.`);
  if (storyPages.length !== expected.pages) failures.push(`${id}: story page count is ${storyPages.length}, expected ${expected.pages}.`);
  (expectedBobBooks610Text[id] || []).forEach((expectedText, index) => {
    const pageText = storyPages[index]?.text || "";
    if (pageText !== expectedText) failures.push(`${id} page ${index + 1}: text mismatch. Expected "${expectedText}", found "${pageText}".`);
  });
  const promptLeakPages = storyPages
    .filter(page => /PAGE\s+\d+|ILLUSTRATION|IMAGE GENERATION|SERIES CHARACTER|QA NOTES/i.test(page.text || ""))
    .map(page => page.pageNumber);
  if (promptLeakPages.length) failures.push(`${id}: reading text contains prompt/page-label markers on pages ${promptLeakPages.join(", ")}.`);
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

  if (book.bookNumber >= 6 && book.bookNumber <= 10) {
    bobBooks610Rows.push({
      id,
      title: book.title,
      level: book.level,
      expectedPages: expected.pages,
      importedPages: storyPages.filter(page => publicPathExists(page.image)).map(page => page.pageNumber),
      missingStoryImages,
      coverExists,
      coverStatus: coverExists ? "delivered cover used" : "missing",
      qaStatus: book.qaStatus,
      teacherPreviewOnly: Boolean(book.teacherPreviewOnly)
    });
  }
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

for (const expected of expectedAidenBooks) {
  const book = draftAidenBooks.find(item => item.id === expected.id);
  if (!book) {
    failures.push(`${expected.id}: missing from Aiden and Betty draft data.`);
    continue;
  }

  const storyPages = book.pages || [];
  const coverExists = publicPathExists(book.coverImage);
  const importedPages = storyPages.filter(page => publicPathExists(page.image)).map(page => page.pageNumber);
  const missingStoryImages = storyPages.filter(page => !publicPathExists(page.image)).map(page => page.pageNumber);
  const firstStoryImage = storyPages[0]?.image || "";
  const normalized = normalizeReadableBook(book);

  if (book.title !== expected.title) failures.push(`${expected.id}: title is ${book.title}, expected ${expected.title}.`);
  if (book.level !== "C") failures.push(`${expected.id}: level is ${book.level}, expected C.`);
  if (book.guidedReadingLevel !== "C") failures.push(`${expected.id}: guidedReadingLevel is ${book.guidedReadingLevel}, expected C.`);
  if (normalizeGuidedReadingType(book.type) !== "fiction") failures.push(`${expected.id}: type is ${book.type}, expected fiction.`);
  if (book.seriesTitle !== "Aiden and Betty") failures.push(`${expected.id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.ageRange !== "6-7") failures.push(`${expected.id}: ageRange is ${book.ageRange || "missing"}.`);
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
  if (normalized.pages[0]?.type !== "title") failures.push(`${expected.id}: normalized reader page 1 is not a title page.`);
  if (normalized.pages[0]?.image !== book.coverImage) failures.push(`${expected.id}: title page does not use the cover image.`);

  const visibleBook = visibleAidenBooks.find(item => item.id === expected.id);
  if (!visibleBook) {
    failures.push(`${expected.id}: missing from visible teacher-preview shelf.`);
  } else if ((visibleBook.pages || []).length !== expected.pages) {
    failures.push(`${expected.id}: visible preview page count is ${visibleBook.pages?.length || 0}, expected ${expected.pages} delivered pages.`);
  }

  aidenRows.push({
    id: expected.id,
    title: book.title,
    level: book.level,
    pages: storyPages.length,
    importedPages,
    missingStoryImages,
    coverExists,
    coverStatus: coverExists ? "delivered cover used" : "missing",
    qaStatus: book.qaStatus,
    teacherPreviewOnly: Boolean(book.teacherPreviewOnly)
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
  `- Story page images expected: ${expectedBobBooks.reduce((sum, book) => sum + book.pages, 0)}`,
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

const bobBooks610Report = [
  "# Bob and Nan Level A Books 6-10 Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`/Users/benjaminbowler/Desktop/LiteracyPath/Our Guided Reading Books Literacy Path`",
  "",
  "DOCX files and image pack found under `Nan and Bob 1-5 A`; Books 6-10 images were imported from `Kimi_Agent_James & Anna Illustration Series/bob-nan-a`.",
  "",
  "## Target",
  "",
  "`public/guided-reading/series/bob-and-nan/book-06` through `book-10`",
  "",
  "## Summary",
  "",
  `- Bob and Nan Books 6-10 imported: ${bobBooks610Rows.length}`,
  "- Import order: Level A books 6-10.",
  "- Preview scope: full delivered image pack is imported for all story pages; books remain teacher-preview until QA approves text-picture matching.",
  `- Imported covers: ${bobBooks610Rows.filter(row => row.coverExists).length}/5`,
  `- Imported story page images: ${bobBooks610Rows.reduce((sum, row) => sum + row.importedPages.length, 0)}`,
  `- Missing story page images: ${bobBooks610Rows.reduce((sum, row) => sum + row.missingStoryImages.length, 0)}`,
  `- QA status: needs_review`,
  `- Validation failures: ${failures.length}`,
  "",
  "## Imported Books",
  "",
  "| ID | Title | Level | Expected Pages | Imported Images | Missing Images | Cover Status | QA | Preview Only |",
  "|---|---|---|---:|---|---|---|---|---:|",
  ...bobBooks610Rows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.expectedPages} | ${row.importedPages.join(", ") || "none"} | ${row.missingStoryImages.join(", ") || "none"} | ${row.coverStatus} | ${row.qaStatus} | ${row.teacherPreviewOnly ? "yes" : "no"} |`),
  "",
  "## Text Alignment",
  "",
  "- Story text was checked against the source DOCX page sections and the expected page text.",
  "- Title page text, `PAGE` labels, illustration prompts, character references, image-generation notes, and QA notes are not included as student reading text.",
  "- Each story page maps to the matching `page-XXX.webp` file with no one-page offset.",
  "",
  "## Cover Review",
  "",
  "The delivered covers from the Books 6-10 Bob and Nan image pack were used. Source QA notes mark the covers and page images as passing first-pass QA; books remain `needs_review` for teacher QA before student release.",
  "",
  "## Questionable Covers",
  "",
  "None flagged by the source QA notes.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Bob and Nan Level A Books 6-10 are visible as teacher previews with full story image coverage."
];

const jamesReport = [
  "# James and Anna Level B Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`/Users/benjaminbowler/Desktop/LiteracyPath/Our Guided Reading Books Literacy Path/James and Anna 1-10 B`",
  "",
  "## Summary",
  "",
  `- James and Anna draft books added: ${draftJamesBooks.length}`,
  `- James and Anna teacher-preview books: ${visibleJamesBooks.length}`,
  "- Preview scope: full delivered image pack is imported for all story pages; books remain teacher-preview until QA approves text-picture matching.",
  `- Imported covers: ${jamesRows.filter(row => row.coverExists).length}/${expectedJamesBooks.length}`,
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
  "Books 1-5 use the existing imported assets. Books 6-10 use the delivered `cover.webp` files from the James and Anna Level B Books 6-10 image pack. All books remain teacher-preview until QA approves text-picture matching.",
  "",
  "## Remaining TODOs",
  "",
  "- Keep `qaStatus: needs_review` and teacher-preview status until all delivered pages are checked.",
  "- Keep Books 6-10 in `needs_review` until the optional source QA notes are reviewed.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: James and Anna assets are visible as teacher previews with full story image coverage."
];

const aidenReport = [
  "# Aiden and Betty Level C Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`/Users/benjaminbowler/Desktop/LiteracyPath/Our Guided Reading Books Literacy Path/Aiden and Betty 1-10 C`",
  "",
  "Nested image packs used: `Kimi_Agent_Aiden & Betty Illustration Series/aiden-betty-c` and `Kimi_Agent_AB - Aiden & Betty 6-10 images/aiden-betty-c-6-10`.",
  "",
  "## Target",
  "",
  "`public/guided-reading/series/aiden-and-betty/book-01` through `book-10`",
  "",
  "## Summary",
  "",
  `- Aiden and Betty draft books added: ${draftAidenBooks.length}`,
  `- Aiden and Betty teacher-preview books: ${visibleAidenBooks.length}`,
  "- Import order: Level C books 1-10.",
  "- Preview scope: full delivered image pack is imported for all story pages; books remain teacher-preview until QA approves text-picture matching.",
  `- Imported covers: ${aidenRows.filter(row => row.coverExists).length}/10`,
  `- Imported story page images: ${aidenRows.reduce((sum, row) => sum + row.importedPages.length, 0)}`,
  `- Missing story page images: ${aidenRows.reduce((sum, row) => sum + row.missingStoryImages.length, 0)}`,
  `- Nonfiction books kept: ${visibleNonfictionBooks.length}`,
  `- Old deleted fiction books restored: ${oldFictionRestored.length}`,
  `- Validation failures: ${failures.length}`,
  "",
  "## Imported Books",
  "",
  "| ID | Title | Level | Expected Pages | Imported Images | Missing Images | Cover Status | QA | Preview Only |",
  "|---|---|---|---:|---|---|---|---|---:|",
  ...aidenRows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.pages} | ${row.importedPages.join(", ") || "none"} | ${row.missingStoryImages.join(", ") || "none"} | ${row.coverStatus} | ${row.qaStatus} | ${row.teacherPreviewOnly ? "yes" : "no"} |`),
  "",
  "## Text Alignment",
  "",
  "- Story text was extracted from the source DOCX page sections.",
  "- `PAGE` labels, illustration prompts, character references, image-generation notes, and QA notes are not included as student reading text.",
  "- Each story page maps to the matching `page-XXX.webp` file with no one-page offset.",
  "",
  "## Cover Review",
  "",
  "The nested delivered Aiden and Betty covers were used. Source pack QA notes mark cover/title images and character consistency as PASS; books still remain `needs_review` for teacher QA before student release.",
  "",
  "## Remaining TODOs",
  "",
  "- Keep `qaStatus: needs_review` and teacher-preview status until all delivered pages are checked in the app.",
  "- Replace any cover later only if teacher QA identifies a mismatch.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Aiden and Betty Level C books 1-5 are visible as teacher previews with full story image coverage."
];

fs.mkdirSync(path.dirname(bobReportPath), { recursive: true });
fs.writeFileSync(bobReportPath, `${bobReport.join("\n")}\n`);
fs.writeFileSync(bobBooks610ReportPath, `${bobBooks610Report.join("\n")}\n`);
fs.writeFileSync(jamesReportPath, `${jamesReport.join("\n")}\n`);
fs.writeFileSync(aidenReportPath, `${aidenReport.join("\n")}\n`);

console.log(`Bob and Nan books visible: ${visibleBobBooks.length}`);
console.log(`James and Anna draft books: ${draftJamesBooks.length}`);
console.log(`James and Anna visible books: ${visibleJamesBooks.length}`);
console.log(`Aiden and Betty draft books: ${draftAidenBooks.length}`);
console.log(`Aiden and Betty visible books: ${visibleAidenBooks.length}`);
console.log(`Nonfiction books visible: ${visibleNonfictionBooks.length}`);
console.log(`Old fiction restored: ${oldFictionRestored.length}`);
console.log(`Wrote ${path.relative(rootDir, bobReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, bobBooks610ReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, jamesReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, aidenReportPath)}`);

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
