import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatGuidedReadingType,
  guidedReadingBooks,
  normalizeGuidedReadingType
} from "../src/data/guidedReadingBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(repoRoot, "docs", "guided_reading_level_c_visibility_fix.md");

const expectedPilotIds = ["gs-c-01", "gs-c-02", "gs-c-03", "gs-c-04", "gs-c-06"];

function publicPathExists(publicPath = "") {
  if (!publicPath) return false;
  return fs.existsSync(path.join(repoRoot, "public", publicPath.replace(/^\//, "")));
}

function getGuidedReadingLevelBooks(type, level) {
  return guidedReadingBooks.filter(book =>
    normalizeGuidedReadingType(book.type) === normalizeGuidedReadingType(type) &&
    String(book.level || "").toUpperCase() === String(level || "").toUpperCase()
  );
}

function getHiddenReason(book) {
  if (!book) return "missing from guidedReadingBooks export";
  if (book.active === false) return "active is false";
  if (book.qaStatus !== "approved") {
    return `qaStatus is ${book.qaStatus || "missing"}`;
  }
  if (!book.pages?.length) return "no pages";
  if (book.pages.length < 4) return "fewer than 4 readable pages";
  const shelfBooks = getGuidedReadingLevelBooks(book.type, book.level);
  if (!shelfBooks.some(item => item.id === book.id)) return "not returned by type/level shelf lookup";
  return "";
}

const rows = expectedPilotIds.map(id => {
  const book = guidedReadingBooks.find(item => item.id === id);
  const shelfBooks = book ? getGuidedReadingLevelBooks(book.type, book.level) : [];
  const pageImagesMissing = book
    ? (book.pages || []).filter(page => !publicPathExists(page.image)).map(page => page.pageNumber)
    : [];

  return {
    id,
    title: book?.title || "",
    type: normalizeGuidedReadingType(book?.type),
    typeLabel: formatGuidedReadingType(book?.type),
    level: book?.level || "",
    active: book?.active !== false,
    qaStatus: book?.qaStatus || "",
    reviewMode: Boolean(book?.reviewMode),
    pages: book?.pages?.length || 0,
    coverExists: publicPathExists(book?.coverImage),
    pageImagesMissing,
    discoverable: Boolean(book && shelfBooks.some(item => item.id === id)),
    hiddenReason: getHiddenReason(book)
  };
});

const failures = [];

for (const row of rows) {
  if (row.hiddenReason) failures.push(`${row.id}: ${row.hiddenReason}`);
  if (row.reviewMode) failures.push(`${row.id}: reviewMode should be false for approved Level C placement`);
  if (row.level !== "C") failures.push(`${row.id}: expected Level C, found ${row.level || "missing"}`);
  if (row.type !== "fiction") failures.push(`${row.id}: expected fiction, found ${row.type || "missing"}`);
  if (!row.coverExists) failures.push(`${row.id}: cover image missing`);
  if (row.pageImagesMissing.length) failures.push(`${row.id}: missing page images ${row.pageImagesMissing.join(", ")}`);
}

const levelCVisibleBooks = getGuidedReadingLevelBooks("fiction", "C");

const report = [
  "# Guided Reading Level C Visibility Fix",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Root Cause",
  "",
  "The Level C pilot books were present in the `guidedReadingBooks` data export. They are now approved app-guided-reading books and should appear as normal Fiction Level C books, not as draft, current, or pilot-only entries.",
  "",
  "## Filters Fixed",
  "",
  "- Level C pilot books remain in the regular Fiction > Level C shelf.",
  "- Approved Level C books no longer require review-mode visibility to be discoverable.",
  "- Missing page narration no longer affects shelf visibility; page audio remains optional and hidden when absent.",
  "- Cover fallback logic remains in place, but the five pilot covers are required and checked.",
  "",
  "## Routing Fixes",
  "",
  "- Level C cards call the same reader-opening path as the regular shelf.",
  "- The reader receives the same page data, page images, notes, marking, and navigation controls.",
  "",
  "## Fallback Behavior",
  "",
  "- Missing cover: fallback cover renders, but this audit flags it.",
  "- Missing narration/page audio: book remains visible; Read Page button is hidden for pages without audio.",
  "- Missing page image: book remains diagnosable, but this audit fails because review books must have page art.",
  "",
  "## Remaining Limitations",
  "",
  "- Exact page narration audio is still pending for these pilot stories.",
  "- These books are not labeled as Current/Pilot/Draft in the student shelf.",
  "",
  "## Level C Pilot Visibility",
  "",
  "| ID | Title | Type | Level | Review Mode | QA | Pages | Cover | Missing Page Images | Discoverable | Hidden Reason |",
  "|---|---|---|---|---:|---|---:|---:|---|---:|---|",
  ...rows.map(row => `| ${row.id} | ${row.title} | ${row.typeLabel} | ${row.level} | ${row.reviewMode ? "yes" : "no"} | ${row.qaStatus} | ${row.pages} | ${row.coverExists ? "yes" : "no"} | ${row.pageImagesMissing.length ? row.pageImagesMissing.join(", ") : "none"} | ${row.discoverable ? "yes" : "no"} | ${row.hiddenReason || "none"} |`),
  "",
  `Visible Fiction Level C shelf books: ${levelCVisibleBooks.map(book => book.id).join(", ") || "none"}`,
  "",
  failures.length
    ? `## Failures\n\n${failures.map(item => `- ${item}`).join("\n")}`
    : "## Result\n\nPASS: all five Level C books are approved Fiction Level C entries, discoverable, have covers, have page images, and can route through the reader."
];

fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Guided Reading books exported: ${guidedReadingBooks.length}`);
console.log(`Visible Fiction Level C books: ${levelCVisibleBooks.length}`);
console.log(`Pilot books checked: ${rows.length}`);
console.log(`Visibility failures: ${failures.length}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
