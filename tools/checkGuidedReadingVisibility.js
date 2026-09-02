import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatGuidedReadingType,
  guidedReadingBooks,
  normalizeGuidedReadingType
} from "../src/data/guidedReadingBooks.js";
import { PRODUCT_CATALOG_FACTS } from "../src/data/productCatalogFacts.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(repoRoot, "docs", "guided_reading_level_c_visibility_fix.md");

function publicPathExists(publicPath = "") {
  if (!publicPath) return false;
  return fs.existsSync(path.join(repoRoot, "public", publicPath.replace(/^\//, "")));
}

const failures = [];
const fictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const nonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const removedNonfictionIds = new Set(["gr-c-36", "gr-d-41"]);
const removedNonfictionRestored = guidedReadingBooks.filter(book => removedNonfictionIds.has(book.id));

if (!nonfictionBooks.length) {
  failures.push("No nonfiction Guided Reading books remain visible.");
}
if (guidedReadingBooks.length !== PRODUCT_CATALOG_FACTS.guidedReadingBooks) {
  failures.push(`Expected ${PRODUCT_CATALOG_FACTS.guidedReadingBooks} total Guided Reading books, found ${guidedReadingBooks.length}.`);
}
if (removedNonfictionRestored.length) {
  failures.push(`Deleted nonfiction books are still visible: ${removedNonfictionRestored.map(book => book.id).join(", ")}`);
}

const rows = guidedReadingBooks.map(book => {
  const pageImagesMissing = (book.pages || [])
    .filter(page => !publicPathExists(page.image))
    .map(page => page.pageNumber);
  if (book.active === false) failures.push(`${book.id}: active is false`);
  if (book.qaStatus !== "approved") failures.push(`${book.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved`);
  if (book.teacherPreviewOnly) failures.push(`${book.id}: teacherPreviewOnly should be false for student release`);
  if (!book.pages?.length) failures.push(`${book.id}: no pages`);
  if (!publicPathExists(book.coverImage)) failures.push(`${book.id}: cover image missing`);
  if (pageImagesMissing.length) failures.push(`${book.id}: missing page images ${pageImagesMissing.join(", ")}`);
  return {
    id: book.id,
    title: book.title,
    typeLabel: formatGuidedReadingType(book.type),
    level: book.level || "",
    qaStatus: book.qaStatus || "",
    pages: book.pages?.length || 0,
    coverExists: publicPathExists(book.coverImage),
    pageImagesMissing
  };
});

const report = [
  "# Guided Reading Visibility Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Current Policy",
  "",
  "Guided Reading exports only approved, active app-created fiction and nonfiction books for student readers. Explicitly removed books must remain off the readable shelf.",
  "",
  `Visible fiction books: ${fictionBooks.length}`,
  `Visible nonfiction books: ${nonfictionBooks.length}`,
  "",
  "## Visible Books",
  "",
  "| ID | Title | Type | Level | QA | Pages | Cover | Missing Page Images |",
  "|---|---|---|---|---|---:|---:|---|",
  ...rows.map(row => `| ${row.id} | ${row.title} | ${row.typeLabel} | ${row.level} | ${row.qaStatus} | ${row.pages} | ${row.coverExists ? "yes" : "no"} | ${row.pageImagesMissing.length ? row.pageImagesMissing.join(", ") : "none"} |`),
  "",
  failures.length
    ? `## Failures\n\n${failures.map(item => `- ${item}`).join("\n")}`
    : "## Result\n\nPASS: all current Guided Reading books are approved for student release, old fiction stays hidden, and nonfiction Guided Reading books remain readable."
];

fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Guided Reading books exported: ${guidedReadingBooks.length}`);
console.log(`Visible fiction books: ${fictionBooks.length}`);
console.log(`Visible nonfiction books: ${nonfictionBooks.length}`);
console.log(`Visibility failures: ${failures.length}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
