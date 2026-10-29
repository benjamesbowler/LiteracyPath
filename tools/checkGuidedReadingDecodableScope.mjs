import { getRuntimeGuidedReadingBooks } from "../src/utils/guidedReading/runtimeBooks.js";
import { auditDecodableBook, auditDecodableCurriculum } from "../src/utils/guidedReading/decodableScope.js";

const books = getRuntimeGuidedReadingBooks().filter(book => book.readingMode === "decodable");
const failures = auditDecodableCurriculum();
const expectedIds = [
  ...Array.from({ length: 20 }, (_, index) => `small-steps-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 30 }, (_, index) => `next-steps-${String(index + 1).padStart(2, "0")}`)
];
if (books.length !== expectedIds.length) failures.push(`Expected ${expectedIds.length} active decodable books, found ${books.length}.`);
for (const id of expectedIds) if (!books.some(book => book.id === id)) failures.push(`${id}: missing active decodable book.`);
const results = books.map(book => {
  const audit = auditDecodableBook(book);
  if (!book.decodableScope?.reviewedTextFingerprint || !book.decodableScope?.reviewedAt || !book.decodableScope?.reviewMethod) {
    failures.push(`${book.id}: missing full-manuscript review provenance.`);
  }
  for (const failure of audit.failures) failures.push(`${book.id}: ${failure}`);
  return { id: book.id, title: book.title, ...audit };
});
console.log(JSON.stringify({ bookCount: books.length, failureCount: failures.length, failures, books: results }, null, 2));
if (failures.length) process.exitCode = 1;
