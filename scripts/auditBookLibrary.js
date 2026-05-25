import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { publicDomainBookSourcePdf, publicDomainBooks } from "../src/content/books/publicDomainBooks.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bookRoot = path.join(repoRoot, "public", "books", "public-domain");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "library_coverage_report.md");
const selectionAuditPath = path.join(repoRoot, "docs", "guided-reading", "public_domain_book_audit.md");

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath.replace(/^\//, "public/")));
}

function readManifest(bookId) {
  const manifestPath = path.join(bookRoot, bookId, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function getBookStatus(book, manifest, hasLocalPdf, hasCover, hasPages) {
  if (manifest?.active && hasLocalPdf && hasCover && hasPages) return "Available";
  if (!manifest?.pdfUrl && !book.pdfUrl) return "Needs PDF";
  if (!hasLocalPdf) return "Needs PDF";
  if (!hasCover || !hasPages) return "Needs processing";
  return "Needs review";
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });

let active = 0;
let available = 0;
let needsPdf = 0;
let needsProcessing = 0;
let needsReview = 0;
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
  const hasLocalPdf = fs.existsSync(path.join(bookRoot, book.id, "original.pdf"));
  const hasCover = coverPath ? exists(coverPath) : false;
  const renderedPageFiles = fs.existsSync(path.join(bookRoot, book.id, "pages"))
    ? fs.readdirSync(path.join(bookRoot, book.id, "pages")).filter(file => /^page-\d+\.webp$/i.test(file)).length
    : 0;
  const hasPages = pages.length > 0 && pages.every(page => page.image && exists(page.image)) && pages.length === renderedPageFiles;
  const hasComprehension = Boolean((manifest?.comprehension || book.comprehension || []).length);
  const status = getBookStatus(book, manifest, hasLocalPdf, hasCover, hasPages);

  if (book.active || manifest?.active) active += 1;
  if (status === "Available") available += 1;
  if (status === "Needs PDF") needsPdf += 1;
  if (status === "Needs processing") needsProcessing += 1;
  if (status === "Needs review") needsReview += 1;
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
    status,
    pdfUrl: manifest?.pdfUrl || book.pdfUrl || "",
    localPdf: hasLocalPdf,
    manifest: Boolean(manifest),
    cover: hasCover,
    pages: pages.length,
    renderedPageFiles,
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
  `Available books: ${available}`,
  `Needs PDF: ${needsPdf}`,
  `Needs processing: ${needsProcessing}`,
  `Needs review: ${needsReview}`,
  `Books by grade band: ${[...byGrade.entries()].map(([key, value]) => `${key} ${value}`).join(", ")}`,
  `Books by difficulty: ${[...byDifficulty.entries()].map(([key, value]) => `${key} ${value}`).join(", ")}`,
  `Missing manifest count: ${missingManifest}`,
  `Missing cover count: ${missingCover}`,
  `Missing page image count: ${missingPages}`,
  `Missing comprehension count: ${missingComprehension}`,
  "",
  "## Book Status",
  "",
  "| Book | Status | Grade | Difficulty | Active | PDF URL | Local PDF | Manifest | Cover | Pages in Manifest | Rendered Pages | Page Images | Comprehension |",
  "|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ...rows.map(row => `| ${row.title} | ${row.status} | ${row.gradeBand} | ${row.difficulty} | ${row.active ? "yes" : "no"} | ${row.pdfUrl ? "yes" : "no"} | ${row.localPdf ? "yes" : "no"} | ${row.manifest ? "yes" : "no"} | ${row.cover ? "yes" : "no"} | ${row.pages} | ${row.renderedPageFiles} | ${row.pageImagesReady ? "yes" : "no"} | ${row.comprehension ? "yes" : "no"} |`),
  "",
  "## Notes",
  "",
  "Books are kept inactive until the PDF, cover, and rendered page images are present and the manifest page count matches the rendered page files. Missing cover/page counts are expected while external downloads and conversion tools are unavailable."
];

fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

const selectionLines = [
  "# Public-Domain Guided Reading Book Audit",
  "",
  `Source URL: ${publicDomainBookSourcePdf}`,
  `Date checked: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "## Selection Methodology",
  "",
  "This pass curates a source-verified starter shelf rather than dumping every title from the no-copyright PDF into the app. Books were selected for K-2 usefulness, page-based reading suitability, visual clarity, child appeal, and instructional value for guided reading, read aloud, fluency, vocabulary, and comprehension.",
  "",
  "Network access from this workspace could not resolve the external book hosts, so exact PDF downloads remain pending. The selected books are staged as inactive manifests until source files and rendered page images are present and manually reviewed.",
  "",
  "## Pilot Download Status",
  "",
  "The first activation target is a small 3-book pilot. Exact PDF/download URLs have been added for the easiest stable candidates, but the books remain inactive until the files are actually downloaded and rendered locally.",
  "",
  "| Book | Source Page | PDF/Download URL | Status |",
  "|---|---|---|---|",
  ...publicDomainBooks
    .filter(book => book.pilot)
    .map(book => `| ${book.title} | ${book.downloadPageUrl || book.sourceUrl} | ${book.pdfUrl || "pending"} | ${rows.find(row => row.title === book.title)?.status || "Needs PDF"} |`),
  "",
  "## Copyright/Public-Domain Note",
  "",
  "The books below are source-verified against the provided no-copyright/public-domain list and mapped to their Project Gutenberg source pages where available. Exact scans/editions should still be manually verified before commercial deployment.",
  "",
  "## Rejected Categories",
  "",
  "- Dense chapter books with too much text for K-2 guided reading.",
  "- Books with poor page-image suitability or likely difficult scan quality.",
  "- Titles likely to contain dated racial, cultural, or social stereotypes.",
  "- Religious or moralizing books that would need heavy adaptation.",
  "- Books with violent, frightening, or confusing plot material for young readers.",
  "- Books requiring older background knowledge or archaic language on most pages.",
  "",
  "## Final Selected List",
  "",
  "| Title | Author/Illustrator | Source URL | Public-Domain Status Note | Grade Band | Difficulty | Score | Reason Selected | Possible Concerns | Tags | Skills |",
  "|---|---|---|---|---|---|---:|---|---|---|---|",
  ...publicDomainBooks.map(book => {
    const reason = (book.tags || []).includes("alphabet")
      ? "Alphabet/rhyme support and simple page turns."
      : (book.tags || []).includes("fables")
        ? "Short moral stories support main idea, inference, and retell."
        : (book.tags || []).includes("rhyme")
          ? "Rhyme and repeated language support fluency."
          : "Strong picture-book candidate for guided reading and retell.";
    const concerns = book.difficulty === "read-aloud"
      ? "Better for teacher read aloud/shared reading than independent early reading."
      : "Review exact scan for dated language and page clarity before activation.";
    return `| ${book.title} | ${book.author || ""} | ${book.sourceUrl} | ${book.licenseNote || "Listed in source PDF; exact edition pending final verification."} | ${book.gradeBand} | ${book.difficulty} | ${book.suitabilityScore} | ${reason} | ${concerns} | ${(book.tags || []).join(", ")} | ${(book.skills || []).join(", ")} |`;
  }),
  "",
  "## Rejected But Reviewed",
  "",
  "| Title/Category | Reason |",
  "|---|---|",
  "| Long dense fairy-tale collections | Useful as source material, but too text-heavy as full page-image guided readers. |",
  "| Heavily moral/religious primers | Not appropriate for broad classroom deployment without adaptation. |",
  "| Older geography/history readers | Often rely on outdated context and may include cultural stereotypes. |",
  "| Scary or violent fairy-tale editions | Not ideal for K-2 guided reading without substantial teacher mediation. |",
  "| Poor-scan alphabet/nursery books | Rejected unless page images are clear enough after processing. |",
  "| Very archaic verse collections | Useful for read aloud excerpts, but weak for independent guided reading. |",
  "| Older school readers with mixed selections | Too inconsistent; individual selections may be curated later. |",
  "| Large chapter novels for older children | Better suited for Grade 3+ read aloud, not K-2 library cards. |"
];

fs.writeFileSync(selectionAuditPath, `${selectionLines.join("\n")}\n`);

if (missingManifest > 0) {
  console.error(`Book library audit failed: ${missingManifest} manifests are missing.`);
  process.exit(1);
}

console.log(`Book library audit complete: ${publicDomainBooks.length} curated, ${active} active, ${missingPages} pending page-image sets.`);
