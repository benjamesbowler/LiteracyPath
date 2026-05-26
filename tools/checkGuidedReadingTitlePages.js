import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_title_page_audit.md");
const levelCLionId = "gs-c-01";

function publicFileExists(publicPath = "") {
  if (!publicPath || /^https?:\/\//.test(publicPath)) return false;
  return fs.existsSync(path.join(rootDir, "public", publicPath.replace(/^\//, "")));
}

function storyPageImageMatches(bookId, storyPageNumber, image = "") {
  const padded3 = String(storyPageNumber).padStart(3, "0");
  const padded2 = String(storyPageNumber).padStart(2, "0");
  return (
    image.includes(`/guided-reading/pages/${bookId}/page-${padded3}.`) ||
    image.includes(`/guided-reading/pages/${bookId}-page-${padded2}.`)
  );
}

const failures = [];
const warnings = [];
const rows = [];

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

const lionRaw = guidedReadingBooks.find(book => book.id === levelCLionId);
if (!lionRaw) {
  failures.push(`${levelCLionId}: Level C lion book missing from guidedReadingBooks`);
} else {
  const lion = normalizeReadableBook(lionRaw);
  const firstStoryPage = lion.pages[1];
  if (!firstStoryPage?.text?.startsWith("Luma the lion slept")) {
    failures.push(`${levelCLionId}: first story text is not the Luma sleeping page`);
  }
  if (!storyPageImageMatches(levelCLionId, 1, firstStoryPage?.image || "")) {
    failures.push(`${levelCLionId}: first story image is not story page 1 (${firstStoryPage?.image || "missing"})`);
  }
}

const report = [
  "# Guided Reading Title Page Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Strategy",
  "",
  "Every app-created Guided Reading book is normalized with reader page 1 as a title page. The title page uses the cover image and stable author/illustrator credits. Original story page 1 becomes reader page 2, which prevents cover/title art from shifting story text out of sync.",
  "",
  "Public-domain books keep their own manifest/page structure and are not force-shifted by this app-created Guided Reading normalizer.",
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
console.log(`Title page failures: ${failures.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);

if (failures.length) {
  failures.slice(0, 30).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
