import { guidedReadingBooks, normalizeGuidedReadingType } from "../src/data/guidedReadingBooks.js";
import { normalizeReadableBook } from "../src/utils/guidedReading/normalizeReadableBook.js";

const failures = [];
const warnings = [];
const fictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const nonfictionBooks = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");

if (fictionBooks.length) {
  failures.push(`Fiction books leaked into Guided Reading after removal: ${fictionBooks.map(book => book.id).join(", ")}`);
}
if (!nonfictionBooks.length) {
  failures.push("No nonfiction Guided Reading books remain.");
}

for (const book of guidedReadingBooks) {
  const normalized = normalizeReadableBook(book);
  if (!normalized.pages.length) failures.push("Visible Guided Reading book has no readable pages", book.id);
  for (const page of normalized.pages) {
    if (!page.image) failures.push(`Visible Guided Reading page missing image path: ${book.id} page ${page.pageNumber}`);
    if (!page.text) failures.push(`Visible Guided Reading page missing text: ${book.id} page ${page.pageNumber}`);
  }
}

console.log(`Normal Guided Reading books: ${guidedReadingBooks.length}`);
console.log(`Visible fiction books: ${fictionBooks.length}`);
console.log(`Visible nonfiction books: ${nonfictionBooks.length}`);
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
