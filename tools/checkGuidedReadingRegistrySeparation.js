import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { publicDomainBooks, publicDomainBookSummary } from "../src/content/books/publicDomainBooks.js";
import { normalizeReadableBook, getReadableBookStatus } from "../src/utils/guidedReading/normalizeReadableBook.js";

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

const leakedPublicDomain = guidedReadingBooks.filter(book => book.publicDomain || book.sourceType === "public-domain" || book.sourceType === "public_domain");
if (leakedPublicDomain.length) {
  fail("Public-domain books leaked into normal Guided Reading", leakedPublicDomain.map(book => book.id).join(", "));
}

const readablePublicDomain = publicDomainBooks.filter(book => book.active || book.readable || book.libraryStatus === "readable");
const unreadableWithReadState = publicDomainBooks.filter(book =>
  !book.active && (book.readable || book.libraryStatus === "readable")
);
if (unreadableWithReadState.length) {
  fail("Unprocessed public-domain candidates are marked readable", unreadableWithReadState.map(book => book.id).join(", "));
}

for (const book of publicDomainBooks) {
  const normalized = normalizeReadableBook(book);
  const status = getReadableBookStatus(book);
  const shouldBeReadable = Boolean(book.active && book.libraryStatus === "readable");

  if (shouldBeReadable) {
    if (status !== "readable") fail("Readable public-domain book does not normalize", `${book.id} (${status})`);
    if (!publicPathExists(book.cover)) fail("Readable public-domain book missing cover", `${book.id} ${book.cover}`);
    for (const page of normalized.pages) {
      if (!publicPathExists(page.image)) fail("Readable public-domain page image missing", `${book.id} page ${page.pageNumber}: ${page.image}`);
      if (!page.text) fail("Readable public-domain page text missing", `${book.id} page ${page.pageNumber}`);
    }
  } else if (book.pages?.length && !book.active) {
    warnings.push(`${book.id} has processed pages but is not active/readable.`);
  }
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
console.log(`Public-domain candidates: ${publicDomainBookSummary.selectedCount}`);
console.log(`Public-domain readable: ${readablePublicDomain.length}`);
console.log(`Public-domain pending: ${publicDomainBookSummary.selectedCount - readablePublicDomain.length}`);
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
