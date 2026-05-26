import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  guidedReadingBooks,
  guidedReadingRelevelAudit,
  guidedStoryBookDrafts,
  normalizeGuidedReadingType
} from "../src/data/guidedReadingBooks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const ensureDir = filePath => fs.mkdirSync(path.dirname(filePath), { recursive: true });
function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

const activeFiction = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "fiction");
const nonfiction = guidedReadingBooks.filter(book => normalizeGuidedReadingType(book.type) === "nonfiction");
const failures = [];

if (activeFiction.length) {
  failures.push(`Fiction books remain active: ${activeFiction.map(book => book.id).join(", ")}`);
}
if (guidedStoryBookDrafts.length) {
  failures.push(`Guided story fiction drafts remain exported: ${guidedStoryBookDrafts.map(book => book.id).join(", ")}`);
}
if (!nonfiction.length) {
  failures.push("No nonfiction guided-reading books remain active.");
}

const relevelRows = guidedReadingRelevelAudit.map(row =>
  `| ${row.id} | ${row.title} | ${row.oldLevel} | ${row.newLevel} | ${row.pageCount} | ${row.averageWordsPerPage} | ${row.reason} |`
);

writeFile(
  path.join(rootDir, "docs", "guided-reading", "guided_reading_relevel_audit.md"),
  `# Guided Reading Relevel Audit

Date: ${new Date().toISOString()}

## Current Policy

Guided Reading fiction books and fiction drafts were permanently removed. This audit now checks the remaining nonfiction library and keeps the relevel table available for the active books.

## Summary

- Active approved books audited: ${guidedReadingRelevelAudit.length}
- Active fiction books: ${activeFiction.length}
- Active nonfiction books: ${nonfiction.length}
- Guided story drafts exported: ${guidedStoryBookDrafts.length}
- Validation failures: ${failures.length}

## Relevel Table

| Book ID | Title | Old Level | New Level | Page Count | Average Words/Page | Reason |
|---|---|---:|---:|---:|---:|---|
${relevelRows.join("\n")}

${failures.length ? `## Failures\n\n${failures.map(item => `- ${item}`).join("\n")}\n` : "## Status\n\nPASS\n"}
`
);

writeFile(
  path.join(rootDir, "docs", "guided-reading", "guided_story_draft_audit.md"),
  `# Guided Story Draft Audit

Date: ${new Date().toISOString()}

## Summary

- Fiction guided story drafts exported: ${guidedStoryBookDrafts.length}
- Active fiction books: ${activeFiction.length}
- Active nonfiction books: ${nonfiction.length}
- Validation failures: ${failures.length}

Guided story fiction drafts were removed on 2026-05-26. New fiction will be rebuilt through a cleaner future method.

${failures.length ? `## Failures\n\n${failures.map(item => `- ${item}`).join("\n")}\n` : "## Status\n\nPASS\n"}
`
);

console.log(`Active fiction books: ${activeFiction.length}`);
console.log(`Active nonfiction books: ${nonfiction.length}`);
console.log(`Guided story drafts exported: ${guidedStoryBookDrafts.length}`);

if (failures.length) {
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
