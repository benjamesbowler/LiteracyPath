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

function publicPathExists(publicPath = "") {
  if (!publicPath) return false;
  return fs.existsSync(path.join(repoRoot, "public", publicPath.replace(/^\//, "")));
}

const failures = [];
const fictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const nonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
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
  "ja-b-06",
  "ja-b-07",
  "ja-b-08",
  "ja-b-09",
  "ja-b-10",
  "ab-c-01",
  "ab-c-02",
  "ab-c-03",
  "ab-c-04",
  "ab-c-05",
  "ab-c-06",
  "ab-c-07",
  "ab-c-08",
  "ab-c-09",
  "ab-c-10",
  "dino-pals-01-chompys-big-lunch",
  "dino-pals-02-sunnys-rainy-day",
  "dino-pals-03-dozy-wont-wake-up",
  "dino-pals-04-grumpy-needs-help",
  "dino-pals-05-bossy-makes-a-plan",
  "dino-pals-06-bouncy-bumps-into-everything",
  "dino-pals-07-wigglys-messy-day",
  "dino-pals-08-zippy-slows-down",
  "dino-pals-09-honkys-inside-voice",
  "dino-pals-10-cheekys-prank-goes-wrong"
]);
const teacherPreviewFictionIds = new Set([
  "dino-pals-01-chompys-big-lunch",
  "dino-pals-02-sunnys-rainy-day",
  "dino-pals-03-dozy-wont-wake-up",
  "dino-pals-04-grumpy-needs-help",
  "dino-pals-05-bossy-makes-a-plan",
  "dino-pals-06-bouncy-bumps-into-everything",
  "dino-pals-07-wigglys-messy-day",
  "dino-pals-08-zippy-slows-down",
  "dino-pals-09-honkys-inside-voice",
  "dino-pals-10-cheekys-prank-goes-wrong"
]);
const unexpectedFictionBooks = fictionBooks.filter(book => !allowedFictionIds.has(book.id));

if (unexpectedFictionBooks.length) {
  failures.push(`Unexpected fiction books visible: ${unexpectedFictionBooks.map(book => book.id).join(", ")}`);
}
if (!nonfictionBooks.length) {
  failures.push("No nonfiction Guided Reading books remain visible.");
}

const rows = guidedReadingBooks.map(book => {
  const pageImagesMissing = (book.pages || [])
    .filter(page => !publicPathExists(page.image))
    .map(page => page.pageNumber);
  if (normalizeGuidedReadingType(book.type) === "nonfiction" && book.active === false) failures.push(`${book.id}: active is false`);
  if (normalizeGuidedReadingType(book.type) === "nonfiction" && book.qaStatus !== "approved") failures.push(`${book.id}: qaStatus is ${book.qaStatus || "missing"}`);
  if (teacherPreviewFictionIds.has(book.id)) {
    if (book.qaStatus !== "needs_review") failures.push(`${book.id}: qaStatus is ${book.qaStatus || "missing"}, expected needs_review`);
    if (!book.teacherPreviewOnly) failures.push(`${book.id}: teacherPreviewOnly should be true for teacher preview`);
  } else if (allowedFictionIds.has(book.id)) {
    if (book.qaStatus !== "approved") failures.push(`${book.id}: qaStatus is ${book.qaStatus || "missing"}, expected approved`);
    if (book.teacherPreviewOnly) failures.push(`${book.id}: teacherPreviewOnly should be false for student release`);
  }
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
  "Guided Reading now allows approved nonfiction books plus approved Bob and Nan Level A, James and Anna Level B, and Aiden and Betty Level C fiction series. Dino Pals Level B is allowed only as teacher-preview / needs-review fiction. Old deleted fiction and public-domain books must remain off the readable shelf.",
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
    : "## Result\n\nPASS: approved fiction remains visible, Dino Pals is limited to teacher preview, old fiction stays hidden, and nonfiction Guided Reading books remain readable."
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
