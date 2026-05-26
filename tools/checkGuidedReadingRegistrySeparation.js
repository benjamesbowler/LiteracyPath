import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const pilotLevelCIds = new Set(["gs-c-01", "gs-c-02", "gs-c-03", "gs-c-04", "gs-c-06"]);

function publicPathExists(publicUrl = "") {
  if (!publicUrl || /^https?:\/\//.test(publicUrl)) return false;
  return fs.existsSync(path.join(projectRoot, "public", publicUrl.replace(/^\//, "")));
}

function fail(message, details = "") {
  failures.push(details ? `${message}: ${details}` : message);
}

const failures = [];
const warnings = [];

const removedLibraryBookIds = new Set([
  "a-apple-pie",
  "mcguffeys-eclectic-primer",
  "tale-of-benjamin-bunny",
  "tale-of-peter-rabbit",
  "tale-of-squirrel-nutkin"
]);
const removedLibraryLeak = guidedReadingBooks.filter(book =>
  removedLibraryBookIds.has(book.id) ||
  /external.?library|candidate.?library/i.test(String(book.sourceType || book.readingType || book.category || ""))
);
if (removedLibraryLeak.length) {
  fail("Removed external-library books leaked into normal Guided Reading", removedLibraryLeak.map(book => book.id).join(", "));
}

const levelCPilotBooks = guidedReadingBooks.filter(book => pilotLevelCIds.has(book.id));
const missingLevelC = [...pilotLevelCIds].filter(id => !levelCPilotBooks.some(book => book.id === id));
if (missingLevelC.length) fail("Level C pilot books missing from normal Guided Reading", missingLevelC.join(", "));

const misplacedLevelC = levelCPilotBooks.filter(book =>
  book.type !== "fiction" ||
  book.level !== "C" ||
  book.reviewMode ||
  /draft|pilot|current/i.test(String(book.qaStatus || ""))
);
if (misplacedLevelC.length) {
  fail("Level C pilot books are not approved Fiction Level C entries", misplacedLevelC.map(book => `${book.id}:${book.type}:${book.level}:${book.qaStatus}:review=${book.reviewMode}`).join(", "));
}

for (const book of guidedReadingBooks) {
  const normalized = normalizeReadableBook(book);
  if (!normalized.pages.length) fail("Visible Guided Reading book has no readable pages", book.id);
  for (const page of normalized.pages) {
    if (!page.image) fail("Visible Guided Reading page missing image path", `${book.id} page ${page.pageNumber}`);
    if (!page.text) fail("Visible Guided Reading page missing text", `${book.id} page ${page.pageNumber}`);
  }
}

console.log(`Normal Guided Reading books: ${guidedReadingBooks.length}`);
console.log(`Level C pilot books in Fiction Level C: ${levelCPilotBooks.length}/${pilotLevelCIds.size}`);
if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach(warning => console.log(`- ${warning}`));
}

if (failures.length) {
  console.error("\nGuided Reading registry separation failed:");
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log("Guided Reading registry separation passed.");
