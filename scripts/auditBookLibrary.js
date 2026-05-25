import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bookRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "library_coverage_report.md");

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath.replace(/^\//, "public/")));
}

function readManifest(bookId) {
  const manifestPath = path.join(bookRoot, bookId, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });

let active = 0;
let missingCover = 0;
let missingPages = 0;
let missingManifest = 0;
let missingComprehension = 0;

const byGrade = new Map();
const byDifficulty = new Map();
const rows = [];

for (const book of publicDomainBooks) {
  const manifest = readManifest(book.id);
  if (!manifest) missingManifest += 1;
  const pages = manifest?.pages || book.pages || [];
  const coverPath = manifest?.cover || book.cover;
  const hasCover = coverPath ? exists(coverPath) : false;
  const hasPages = pages.length > 0 && pages.every(page => page.image && exists(page.image));
  const hasComprehension = Boolean((manifest?.comprehension || book.comprehension || []).length);

  if (book.active || manifest?.active) active += 1;
  if (!hasCover) missingCover += 1;
  if (!hasPages) missingPages += 1;
  if (!hasComprehension) missingComprehension += 1;
  byGrade.set(book.gradeBand, (byGrade.get(book.gradeBand) || 0) + 1);
  byDifficulty.set(book.difficulty, (byDifficulty.get(book.difficulty) || 0) + 1);

  rows.push({
    title: book.title,
    gradeBand: book.gradeBand,
    difficulty: book.difficulty,
    active: book.active || manifest?.active || false,
    manifest: Boolean(manifest),
    cover: hasCover,
    pages: pages.length,
    pageImagesReady: hasPages,
    comprehension: hasComprehension
  });
}

const lines = [
  "# Guided Reading Library Coverage Report",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  `Total curated books: ${publicDomainBooks.length}`,
  `Active books: ${active}`,
  `Books by grade band: ${[...byGrade.entries()].map(([key, value]) => `${key} ${value}`).join(", ")}`,
  `Books by difficulty: ${[...byDifficulty.entries()].map(([key, value]) => `${key} ${value}`).join(", ")}`,
  `Missing manifest count: ${missingManifest}`,
  `Missing cover count: ${missingCover}`,
  `Missing page image count: ${missingPages}`,
  `Missing comprehension count: ${missingComprehension}`,
  "",
  "## Book Status",
  "",
  "| Book | Grade | Difficulty | Active | Manifest | Cover | Pages | Page Images | Comprehension |",
  "|---|---:|---|---:|---:|---:|---:|---:|---:|",
  ...rows.map(row => `| ${row.title} | ${row.gradeBand} | ${row.difficulty} | ${row.active ? "yes" : "no"} | ${row.manifest ? "yes" : "no"} | ${row.cover ? "yes" : "no"} | ${row.pages} | ${row.pageImagesReady ? "yes" : "no"} | ${row.comprehension ? "yes" : "no"} |`),
  "",
  "## Notes",
  "",
  "Books are kept inactive until source PDFs and rendered page images are present. Missing cover/page counts are expected while external downloads and conversion tools are unavailable."
];

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

if (missingManifest > 0) {
  console.error(`Book library audit failed: ${missingManifest} manifests are missing.`);
  process.exit(1);
}

console.log(`Book library audit complete: ${publicDomainBooks.length} curated, ${active} active, ${missingPages} pending page-image sets.`);
