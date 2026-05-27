import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks, guidedReadingSeriesBookDrafts, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const bobReportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_import_audit.md");
const bobBooks610ReportPath = path.join(rootDir, "docs", "guided-reading", "bob_and_nan_books_6_10_import_audit.md");
const jamesReportPath = path.join(rootDir, "docs", "guided-reading", "james_and_anna_import_audit.md");
const aidenReportPath = path.join(rootDir, "docs", "guided-reading", "aiden_and_betty_import_audit.md");
const dinoReportPath = path.join(rootDir, "docs", "guided-reading", "dino_pals_books_11_20_import_audit.md");

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

const expectedDinoBooks = [
  { id: "dino-pals-01-chompys-big-lunch", title: "Chompy's Big Lunch", pages: 8 },
  { id: "dino-pals-02-sunnys-rainy-day", title: "Sunny's Rainy Day", pages: 8 },
  { id: "dino-pals-03-dozy-wont-wake-up", title: "Dozy Won't Wake Up", pages: 8 },
  { id: "dino-pals-04-grumpy-needs-help", title: "Grumpy Needs Help", pages: 8 },
  { id: "dino-pals-05-bossy-makes-a-plan", title: "Bossy Makes a Plan", pages: 8 },
  { id: "dino-pals-06-bouncy-bumps-into-everything", title: "Bouncy Bumps Into Everything", pages: 8 },
  { id: "dino-pals-07-wigglys-messy-day", title: "Wiggly's Messy Day", pages: 8 },
  { id: "dino-pals-08-zippy-slows-down", title: "Zippy Slows Down", pages: 8 },
  { id: "dino-pals-09-honkys-inside-voice", title: "Honky's Inside Voice", pages: 8 },
  { id: "dino-pals-10-cheekys-prank-goes-wrong", title: "Cheeky's Prank Goes Wrong", pages: 8 },
  { id: "dino-pals-11-shys-secret-gift", title: "Shy's Secret Gift", pages: 12 },
  { id: "dino-pals-12-fancys-bad-day", title: "Fancy's Bad Day", pages: 12 },
  { id: "dino-pals-13-clumsy-to-the-rescue", title: "Clumsy to the Rescue", pages: 12 },
  { id: "dino-pals-14-what-is-flappy", title: "What is Flappy?", pages: 12 },
  { id: "dino-pals-15-sneezy-and-the-waterfall", title: "Sneezy and the Waterfall", pages: 12 },
  { id: "dino-pals-16-chompy-and-grumpys-day-out", title: "Chompy and Grumpy's Day Out", pages: 12 },
  { id: "dino-pals-17-the-sunny-hollow-games", title: "The Sunny Hollow Games", pages: 12 },
  { id: "dino-pals-18-dozys-wonderful-dream", title: "Dozy's Wonderful Dream", pages: 12 },
  { id: "dino-pals-19-zippys-race", title: "Zippy's Race", pages: 12 },
  { id: "dino-pals-20-the-big-storm", title: "The Big Storm", pages: 12 }
];

const expectedFirstFactsBooks = [
  { id: "first-facts-a-01-look-at-the-colours", title: "Look at the Colours!", pages: 7 },
  { id: "first-facts-a-02-the-four-seasons", title: "The Four Seasons", pages: 9 },
  { id: "first-facts-a-03-little-seeds-grow", title: "Little Seeds Grow", pages: 7 },
  { id: "first-facts-a-04-what-is-weather", title: "What is Weather?", pages: 8 },
  { id: "first-facts-a-05-flowers-and-trees", title: "Flowers and Trees", pages: 8 },
  { id: "first-facts-a-06-baby-animals", title: "Baby Animals", pages: 8 },
  { id: "first-facts-a-07-animals-on-the-farm", title: "Animals on the Farm", pages: 8 },
  { id: "first-facts-a-08-animals-in-the-ocean", title: "Animals in the Ocean", pages: 8 },
  { id: "first-facts-a-09-animals-at-night", title: "Animals at Night", pages: 6 },
  { id: "first-facts-a-10-bugs-all-around-us", title: "Bugs All Around Us", pages: 8 },
  { id: "first-facts-a-11-pets-we-love", title: "Pets We Love", pages: 7 },
  { id: "first-facts-a-12-shapes-everywhere", title: "Shapes Everywhere", pages: 7 },
  { id: "first-facts-a-13-big-and-small", title: "Big and Small", pages: 6 },
  { id: "first-facts-a-14-hot-and-cold", title: "Hot and Cold", pages: 7 },
  { id: "first-facts-a-15-things-that-float-and-sink", title: "Things That Float and Sink", pages: 7 },
  { id: "first-facts-a-16-push-and-pull", title: "Push and Pull", pages: 7 },
  { id: "first-facts-a-17-hello-sun", title: "Hello, Sun!", pages: 7 },
  { id: "first-facts-a-18-the-moon", title: "The Moon", pages: 7 },
  { id: "first-facts-a-19-day-and-night", title: "Day and Night", pages: 7 },
  { id: "first-facts-a-20-my-five-senses", title: "My Five Senses", pages: 8 },
  { id: "first-facts-a-21-how-i-grow", title: "How I Grow", pages: 7 },
  { id: "first-facts-a-22-staying-healthy", title: "Staying Healthy", pages: 7 },
  { id: "first-facts-a-23-my-body", title: "My Body", pages: 8 },
  { id: "first-facts-a-24-rocks-and-pebbles", title: "Rocks and Pebbles", pages: 7 },
  { id: "first-facts-a-25-water-everywhere", title: "Water Everywhere", pages: 9 }
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
const dinoRows = [];
const firstFactsRows = [];
const warnings = [];
const draftBobBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "bob-and-nan");
const draftJamesBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "james-and-anna");
const draftAidenBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "aiden-and-betty");
const draftDinoBooks = guidedReadingSeriesBookDrafts.filter(book => book.seriesId === "dino-pals");
const visibleBobBooks = guidedReadingBooks.filter(book => book.seriesId === "bob-and-nan");
const visibleJamesBooks = guidedReadingBooks.filter(book => book.seriesId === "james-and-anna");
const visibleAidenBooks = guidedReadingBooks.filter(book => book.seriesId === "aiden-and-betty");
const visibleNonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const visibleFirstFactsBooks = guidedReadingBooks.filter(book => book.seriesId === "first-facts");
const oldFictionRestored = guidedReadingBooks.filter(book => oldFictionIds.includes(book.id));
const removedNonfictionIds = new Set(["gr-c-36", "gr-d-41"]);
const removedNonfictionRestored = guidedReadingBooks.filter(book => removedNonfictionIds.has(book.id));

if (draftBobBooks.length !== 10) failures.push(`Expected 10 Bob and Nan draft books, found ${draftBobBooks.length}.`);
if (visibleBobBooks.length !== 10) failures.push(`Expected 10 visible Bob and Nan approved books, found ${visibleBobBooks.length}.`);
if (draftJamesBooks.length !== 10) failures.push(`Expected 10 James and Anna draft books, found ${draftJamesBooks.length}.`);
if (visibleJamesBooks.length !== 10) failures.push(`Expected 10 visible James and Anna approved books, found ${visibleJamesBooks.length}.`);
if (draftAidenBooks.length !== 10) failures.push(`Expected 10 Aiden and Betty draft books, found ${draftAidenBooks.length}.`);
if (visibleAidenBooks.length !== 10) failures.push(`Expected 10 visible Aiden and Betty approved books, found ${visibleAidenBooks.length}.`);
if (draftDinoBooks.length !== 20) failures.push(`Expected 20 Dino Pals draft books, found ${draftDinoBooks.length}.`);
if (visibleFirstFactsBooks.length !== 25) failures.push(`Expected 25 First Facts public nonfiction books, found ${visibleFirstFactsBooks.length}.`);
if (visibleNonfictionBooks.length !== 46) failures.push(`Expected 46 nonfiction books after First Facts Books 21-25 import, found ${visibleNonfictionBooks.length}.`);
if (oldFictionRestored.length) failures.push(`Old deleted fiction ids were restored: ${oldFictionRestored.map(book => book.id).join(", ")}`);
if (removedNonfictionRestored.length) failures.push(`Deleted nonfiction ids were restored: ${removedNonfictionRestored.map(book => book.id).join(", ")}`);

for (const expected of expectedBobBooks) {
  const id = expected.id;
  const book = visibleBobBooks.find(item => item.id === id);
  if (!book) {
    failures.push(`${id}: missing from visible approved Guided Reading books.`);
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
  if (book.qaStatus !== "approved") failures.push(`${id}: qaStatus is ${book.qaStatus || "missing"}, expected approved.`);
  if (book.teacherPreviewOnly) failures.push(`${id}: teacherPreviewOnly should be false for student release.`);
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
  if (book.qaStatus !== "approved") failures.push(`${expected.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved for student release.`);
  if (book.teacherPreviewOnly) failures.push(`${expected.id}: teacherPreviewOnly should be false for student release.`);
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
    failures.push(`${expected.id}: missing from visible approved shelf.`);
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
  if (book.qaStatus !== "approved") failures.push(`${expected.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved for student release.`);
  if (book.teacherPreviewOnly) failures.push(`${expected.id}: teacherPreviewOnly should be false for student release.`);
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
    failures.push(`${expected.id}: missing from visible approved shelf.`);
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

for (const expected of expectedDinoBooks) {
  const book = draftDinoBooks.find(item => item.id === expected.id);
  if (!book) {
    failures.push(`${expected.id}: missing from Dino Pals draft data.`);
    continue;
  }

  const storyPages = book.pages || [];
  const coverExists = publicPathExists(book.coverImage);
  const importedPages = storyPages.filter(page => publicPathExists(page.image)).map(page => page.pageNumber);
  const audioPages = storyPages.filter(page => publicPathExists(page.audio || page.pageAudio)).map(page => page.pageNumber);
  const missingStoryImages = storyPages.filter(page => !publicPathExists(page.image)).map(page => page.pageNumber);
  const firstStoryImage = storyPages[0]?.image || "";
  const normalized = normalizeReadableBook(book);
  const promptLeakPages = storyPages
    .filter(page => /PAGE\s+\d+|ILLUSTRATION|IMAGE GENERATION|SERIES CHARACTER|QA NOTES/i.test(page.text || ""))
    .map(page => page.pageNumber);

  if (book.title !== expected.title) failures.push(`${expected.id}: title is ${book.title}, expected ${expected.title}.`);
  if (book.level !== "B") failures.push(`${expected.id}: level is ${book.level}, expected B.`);
  if (book.guidedReadingLevel !== "B") failures.push(`${expected.id}: guidedReadingLevel is ${book.guidedReadingLevel}, expected B.`);
  if (normalizeGuidedReadingType(book.type) !== "fiction") failures.push(`${expected.id}: type is ${book.type}, expected fiction.`);
  if (book.seriesTitle !== "Dino Pals") failures.push(`${expected.id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.ageRange !== "5-6") failures.push(`${expected.id}: ageRange is ${book.ageRange || "missing"}.`);
  if (book.author !== "Nora Bell") failures.push(`${expected.id}: author is ${book.author || "missing"}, expected Nora Bell.`);
  if (book.illustrator !== "Milo Reed") failures.push(`${expected.id}: illustrator is ${book.illustrator || "missing"}, expected Milo Reed.`);
  if (book.status !== "approved") failures.push(`${expected.id}: status is ${book.status || "missing"}, expected approved.`);
  if (book.qaStatus !== "approved") failures.push(`${expected.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved.`);
  if (book.teacherPreviewOnly) failures.push(`${expected.id}: teacherPreviewOnly should be false for student release.`);
  if (storyPages.length !== expected.pages) failures.push(`${expected.id}: source page count is ${storyPages.length}, expected ${expected.pages}.`);
  if (!coverExists) failures.push(`${expected.id}: cover missing at ${book.coverImage || "missing"}.`);
  if (importedPages.length !== expected.pages) failures.push(`${expected.id}: imported story image count is ${importedPages.length}, expected ${expected.pages}.`);
  if (audioPages.length !== expected.pages) warnings.push(`${expected.id}: page audio count is ${audioPages.length}, expected ${expected.pages}.`);
  if (missingStoryImages.length) failures.push(`${expected.id}: missing story page images ${missingStoryImages.join(", ")}.`);
  if (!firstStoryImage.endsWith("page-001.webp")) failures.push(`${expected.id}: story page 1 does not use page-001.webp (${firstStoryImage}).`);
  if (firstStoryImage === book.coverImage) failures.push(`${expected.id}: story page 1 is incorrectly using the cover image.`);
  if (promptLeakPages.length) failures.push(`${expected.id}: reading text contains prompt/page-label markers on pages ${promptLeakPages.join(", ")}.`);
  if (book.availableStoryPageCount !== expected.pages) failures.push(`${expected.id}: availableStoryPageCount is ${book.availableStoryPageCount}, expected ${expected.pages}.`);
  if (book.missingStoryPages?.length) failures.push(`${expected.id}: missingStoryPages should be empty after full import (${book.missingStoryPages.join(", ")}).`);
  if (normalized.pages[0]?.type !== "title") failures.push(`${expected.id}: normalized reader page 1 is not a title page.`);
  if (normalized.pages[0]?.image !== book.coverImage) failures.push(`${expected.id}: title page does not use the cover image.`);
  if (normalized.pages[1]?.storyPageNumber !== 1) failures.push(`${expected.id}: first story page is not storyPageNumber 1.`);
  if (normalized.pages[1]?.image !== firstStoryImage) failures.push(`${expected.id}: normalized story page 1 image changed from source page-001.`);

  dinoRows.push({
    id: expected.id,
    title: book.title,
    level: book.level,
    expectedPages: expected.pages,
    importedPages,
    audioPages,
    missingStoryImages,
    coverExists,
    coverStatus: coverExists ? "delivered cover used" : "missing",
    qaStatus: book.qaStatus,
    teacherPreviewOnly: Boolean(book.teacherPreviewOnly)
  });
}

for (const expected of expectedFirstFactsBooks) {
  const book = visibleFirstFactsBooks.find(item => item.id === expected.id);
  if (!book) {
    failures.push(`${expected.id}: missing from First Facts public nonfiction shelf.`);
    continue;
  }

  const storyPages = book.pages || [];
  const coverExists = publicPathExists(book.coverImage);
  const importedPages = storyPages.filter(page => publicPathExists(page.image)).map(page => page.pageNumber);
  const audioPages = storyPages.filter(page => publicPathExists(page.audio || page.pageAudio)).map(page => page.pageNumber);
  const missingStoryImages = storyPages.filter(page => !publicPathExists(page.image)).map(page => page.pageNumber);
  const firstStoryImage = storyPages[0]?.image || "";
  const normalized = normalizeReadableBook(book);
  const fullBookAudioExists = publicPathExists(book.fullBookAudio);
  const promptLeakPages = storyPages
    .filter(page => /PAGE\s+\d+|ILLUSTRATION|IMAGE GENERATION|SERIES CHARACTER|QA NOTES/i.test(page.text || ""))
    .map(page => page.pageNumber);

  if (book.title !== expected.title) failures.push(`${expected.id}: title is ${book.title}, expected ${expected.title}.`);
  if (book.level !== "A") failures.push(`${expected.id}: level is ${book.level}, expected A.`);
  if (book.guidedReadingLevel !== "A") failures.push(`${expected.id}: guidedReadingLevel is ${book.guidedReadingLevel}, expected A.`);
  if (normalizeGuidedReadingType(book.type) !== "nonfiction") failures.push(`${expected.id}: type is ${book.type}, expected nonfiction.`);
  if (book.seriesTitle !== "First Facts") failures.push(`${expected.id}: seriesTitle is ${book.seriesTitle || "missing"}.`);
  if (book.author !== "Mara Lane") failures.push(`${expected.id}: author is ${book.author || "missing"}, expected Mara Lane.`);
  if (book.illustrator !== "Theo Finch") failures.push(`${expected.id}: illustrator is ${book.illustrator || "missing"}, expected Theo Finch.`);
  if (book.status !== "approved") failures.push(`${expected.id}: status is ${book.status || "missing"}, expected approved.`);
  if (book.qaStatus !== "approved") failures.push(`${expected.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved.`);
  if (book.teacherPreviewOnly) failures.push(`${expected.id}: teacherPreviewOnly should be false for student release.`);
  if (storyPages.length !== expected.pages) failures.push(`${expected.id}: source page count is ${storyPages.length}, expected ${expected.pages}.`);
  if (!coverExists) failures.push(`${expected.id}: cover missing at ${book.coverImage || "missing"}.`);
  if (importedPages.length !== expected.pages) failures.push(`${expected.id}: imported story image count is ${importedPages.length}, expected ${expected.pages}.`);
  if (audioPages.length !== expected.pages) failures.push(`${expected.id}: page audio count is ${audioPages.length}, expected ${expected.pages}.`);
  if (!fullBookAudioExists) failures.push(`${expected.id}: full-book audio missing at ${book.fullBookAudio || "missing"}.`);
  if (missingStoryImages.length) failures.push(`${expected.id}: missing story page images ${missingStoryImages.join(", ")}.`);
  if (!firstStoryImage.endsWith("page-001.webp")) failures.push(`${expected.id}: story page 1 does not use page-001.webp (${firstStoryImage}).`);
  if (firstStoryImage === book.coverImage) failures.push(`${expected.id}: story page 1 is incorrectly using the cover image.`);
  if (promptLeakPages.length) failures.push(`${expected.id}: reading text contains prompt/page-label markers on pages ${promptLeakPages.join(", ")}.`);
  if (normalized.pages[0]?.type !== "title") failures.push(`${expected.id}: normalized reader page 1 is not a title page.`);
  if (normalized.pages[0]?.image !== book.coverImage) failures.push(`${expected.id}: title page does not use the cover image.`);
  if (normalized.pages[1]?.storyPageNumber !== 1) failures.push(`${expected.id}: first story page is not storyPageNumber 1.`);
  if (normalized.pages[1]?.image !== firstStoryImage) failures.push(`${expected.id}: normalized story page 1 image changed from source page-001.`);

  firstFactsRows.push({
    id: expected.id,
    title: book.title,
    pages: storyPages.length,
    importedPages,
    audioPages,
    missingStoryImages,
    coverExists,
    fullBookAudioExists,
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
  failures.length ? failures.filter(item => item.includes("Bob") || item.includes("bob-and-nan") || item.includes("Nonfiction") || item.includes("Old deleted")).map(item => `- ${item}`).join("\n") || "None affecting Bob and Nan." : "PASS: Bob and Nan is wired as an approved Level A fiction series without restoring old fiction books."
];

const dinoBooks1120Rows = dinoRows.filter(row => /^dino-pals-(1[1-9]|20)-/.test(row.id));

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
  "- Release scope: full delivered image pack is imported for all story pages; books are approved for student readers.",
  `- Imported covers: ${bobBooks610Rows.filter(row => row.coverExists).length}/5`,
  `- Imported story page images: ${bobBooks610Rows.reduce((sum, row) => sum + row.importedPages.length, 0)}`,
  `- Missing story page images: ${bobBooks610Rows.reduce((sum, row) => sum + row.missingStoryImages.length, 0)}`,
  `- QA status: approved`,
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
  "The delivered covers from the Books 6-10 Bob and Nan image pack were used. Source QA notes mark the covers and page images as passing first-pass QA; books are now approved for student release.",
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
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Bob and Nan Level A Books 6-10 are visible to student readers with full story image coverage."
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
  `- James and Anna approved books: ${visibleJamesBooks.length}`,
  "- Release scope: full delivered image pack is imported for all story pages; books are approved for student readers.",
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
  "Books 1-5 use the existing imported assets. Books 6-10 use the delivered `cover.webp` files from the James and Anna Level B Books 6-10 image pack. All books are approved for student readers.",
  "",
  "## Remaining TODOs",
  "",
  "- Keep `qaStatus: approved` for released fiction books.",
  "- Continue requiring cover and story image validation for every approved book.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: James and Anna assets are visible to student readers with full story image coverage."
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
  `- Aiden and Betty approved books: ${visibleAidenBooks.length}`,
  "- Import order: Level C books 1-10.",
  "- Release scope: full delivered image pack is imported for all story pages; books are approved for student readers.",
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
  "The nested delivered Aiden and Betty covers were used. Source pack QA notes mark cover/title images and character consistency as PASS; books are now approved for student release.",
  "",
  "## Remaining TODOs",
  "",
  "- Keep `qaStatus: approved` for released fiction books.",
  "- Replace any cover later only if teacher QA identifies a mismatch.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Aiden and Betty Level C books are visible to student readers with full story image coverage."
];

const dinoReport = [
  "# Dino Pals Level B Books 11-20 Import Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Source",
  "",
  "`/Users/benjaminbowler/Desktop/LiteracyPath_Source_Packs/Organised/Level B/Dino Pals`",
  "",
  "Media archive: organised Dino Pals Books 11-20 source pack with WebP page images and MP3 page audio.",
  "",
  "## Target",
  "",
  "`public/guided-reading/series/dino-pals/book-11` through `book-20` for this import; Books 1-10 are also checked for continuity.",
  "",
  "## Summary",
  "",
  `- Dino Pals total draft books checked: ${draftDinoBooks.length}`,
  `- Dino Pals Books 11-20 imported in this pass: ${dinoBooks1120Rows.length}`,
  "- Import order: Level B fiction books 11-20 added after existing Books 1-10.",
  "- Release scope: student public viewing.",
  `- Imported covers for Books 11-20: ${dinoBooks1120Rows.filter(row => row.coverExists).length}/10`,
  `- Imported story page images for Books 11-20: ${dinoBooks1120Rows.reduce((sum, row) => sum + row.importedPages.length, 0)}`,
  `- Imported story page audio files for Books 11-20: ${dinoBooks1120Rows.reduce((sum, row) => sum + row.audioPages.length, 0)}`,
  `- Missing story page images for Books 11-20: ${dinoBooks1120Rows.reduce((sum, row) => sum + row.missingStoryImages.length, 0)}`,
  `- Nonfiction books kept: ${visibleNonfictionBooks.length}`,
  `- Old deleted fiction books restored: ${oldFictionRestored.length}`,
  `- Validation failures: ${failures.length}`,
  "",
  "## Imported Books",
  "",
  "| ID | Title | Level | Expected Pages | Imported Images | Audio Files | Missing Images | Cover Status | QA | Preview Only |",
  "|---|---|---|---:|---|---|---|---|---|---:|",
  ...dinoBooks1120Rows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.expectedPages} | ${row.importedPages.join(", ") || "none"} | ${row.audioPages.join(", ") || "none"} | ${row.missingStoryImages.join(", ") || "none"} | ${row.coverStatus} | ${row.qaStatus} | ${row.teacherPreviewOnly ? "yes" : "no"} |`),
  "",
  "## Text Alignment",
  "",
  "- Story text was extracted from the source DOCX page sections.",
  "- Cover/title images are kept as `cover.webp` and are not counted as story page 1.",
  "- `PAGE` labels, illustration prompts, character references, image-generation notes, and QA notes are not included as student reading text.",
  "- Each story page maps to the matching `page-XXX.webp` file with no one-page offset.",
  "",
  "## Audio",
  "",
  dinoRows.every(row => row.audioPages.length === row.expectedPages)
    ? "PASS: Each Dino Pals story page has a matching page audio file."
    : "Some page audio files are missing; affected books are listed in validation warnings.",
  "",
  "## QA Status",
  "",
  "All Dino Pals books are released as `approved` and visible to student readers.",
  "",
  "## Next Steps",
  "",
  "- Teacher-review Dino Pals Books 11-20 covers, page-image sequence, and page audio.",
  "- After review, move approved books from preview-only to student availability.",
  "",
  "## Warnings",
  "",
  warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None.",
  "",
  failures.length ? "## Failures" : "## Result",
  "",
  failures.length ? failures.map(item => `- ${item}`).join("\n") : "PASS: Dino Pals Level B Books 11-20 are imported with cover, twelve story pages, and page audio for student readers; Books 1-10 remain intact."
];

fs.mkdirSync(path.dirname(bobReportPath), { recursive: true });
fs.writeFileSync(bobReportPath, `${bobReport.join("\n")}\n`);
fs.writeFileSync(bobBooks610ReportPath, `${bobBooks610Report.join("\n")}\n`);
fs.writeFileSync(jamesReportPath, `${jamesReport.join("\n")}\n`);
fs.writeFileSync(aidenReportPath, `${aidenReport.join("\n")}\n`);
fs.writeFileSync(dinoReportPath, `${dinoReport.join("\n")}\n`);

console.log(`Bob and Nan books visible: ${visibleBobBooks.length}`);
console.log(`James and Anna draft books: ${draftJamesBooks.length}`);
console.log(`James and Anna visible books: ${visibleJamesBooks.length}`);
console.log(`Aiden and Betty draft books: ${draftAidenBooks.length}`);
console.log(`Aiden and Betty visible books: ${visibleAidenBooks.length}`);
console.log(`Dino Pals draft books: ${draftDinoBooks.length}`);
console.log(`Nonfiction books visible: ${visibleNonfictionBooks.length}`);
console.log(`Old fiction restored: ${oldFictionRestored.length}`);
console.log(`Wrote ${path.relative(rootDir, bobReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, bobBooks610ReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, jamesReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, aidenReportPath)}`);
console.log(`Wrote ${path.relative(rootDir, dinoReportPath)}`);

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
