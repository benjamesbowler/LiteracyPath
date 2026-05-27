import fs from "node:fs";
import path from "node:path";
import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { analyzeGuidedReadingPage, enrichGuidedReadingBook } from "../src/utils/guidedReading/phonicsPageAnalyzer.js";
import { recommendBooksForStudent } from "../src/utils/guidedReading/recommendBooksForStudent.js";

const rootDir = process.cwd();
const reportPath = path.join(rootDir, "docs", "guided-reading", "guided_reading_experience_audit.md");
const publicPath = value => path.join(rootDir, "public", String(value || "").replace(/^\//, ""));
const fileExists = value => Boolean(value) && fs.existsSync(publicPath(value));

const failures = [];
const warnings = [];
const rows = [];
const patternCounts = new Map();
const microphaseCounts = new Map();
const visibleFictionBooks = guidedReadingBooks.filter(book => String(book.type || "").toLowerCase() === "fiction");
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
  "ab-c-10"
]);
const unexpectedFictionBooks = visibleFictionBooks.filter(book => !allowedFictionIds.has(book.id));

if (unexpectedFictionBooks.length) {
  failures.push(`Unexpected fiction Guided Reading books visible: ${unexpectedFictionBooks.map(book => book.id).join(", ")}`);
}

for (const book of guidedReadingBooks) {
  const enriched = enrichGuidedReadingBook(book);
  const visible = book.active !== false || book.reviewMode || book.teacherPreviewOnly || book.qaStatus === "approved";
  if (!visible) continue;

  if (!fileExists(book.coverImage || book.cover || "")) {
    warnings.push(`${book.id}: cover missing or generated fallback needed (${book.coverImage || book.cover || "none"}).`);
  }

  (book.pages || []).forEach(page => {
    if (!page.text) failures.push(`${book.id} page ${page.pageNumber}: missing page text.`);
    if (!page.image || !fileExists(page.image)) failures.push(`${book.id} page ${page.pageNumber}: missing page image ${page.image || "none"}.`);
    try {
      analyzeGuidedReadingPage(page);
    } catch (error) {
      failures.push(`${book.id} page ${page.pageNumber}: phonics analyzer failed (${error.message}).`);
    }
  });

  if (book.qaStatus === "draft_needs_assets" && book.active === true && !book.reviewMode) {
    failures.push(`${book.id}: draft book is active without review mode.`);
  }
  if (allowedFictionIds.has(book.id) && (book.qaStatus !== "approved" || book.teacherPreviewOnly || book.active === false)) {
    failures.push(`${book.id}: fiction series books should be approved, active, and available to student readers.`);
  }
  if (book.qaStatus === "approved" && (book.pages || []).some(page => page.qaStatus && !["approved", "needs_image_alignment_review"].includes(page.qaStatus))) {
    failures.push(`${book.id}: approved book contains non-approved/review page status.`);
  }

  enriched.dominantPhonicsPatterns.forEach(pattern => patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1));
  microphaseCounts.set(enriched.recommendedMicrophase, (microphaseCounts.get(enriched.recommendedMicrophase) || 0) + 1);
  rows.push({
    id: book.id,
    title: book.title,
    level: book.level,
    qaStatus: book.qaStatus || "",
    pages: book.pages?.length || 0,
    wordCount: enriched.wordCount,
    decodablePercentage: enriched.decodablePercentage,
    microphase: enriched.recommendedMicrophase,
    patterns: enriched.dominantPhonicsPatterns.slice(0, 6).join(", ")
  });
}

let recommendations = [];
try {
  recommendations = recommendBooksForStudent({
    books: guidedReadingBooks,
    studentProgress: { needs: ["cvc", "short-o", "final-sounds", "digraphs"] },
    readingHistory: {}
  }).slice(0, 10);
  if (!recommendations.length) failures.push("Recommendation function returned no books.");
} catch (error) {
  failures.push(`Recommendation function failed: ${error.message}`);
}

const table = rows.map(row => `| ${row.id} | ${row.title} | ${row.level} | ${row.qaStatus} | ${row.pages} | ${row.wordCount} | ${row.decodablePercentage}% | ${row.microphase} | ${row.patterns || "-"} |`).join("\n");
const patternTable = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([pattern, count]) => `| ${pattern} | ${count} |`).join("\n");
const microphaseTable = [...microphaseCounts.entries()].sort((a, b) => b[1] - a[1]).map(([phase, count]) => `| ${phase} | ${count} |`).join("\n");
const recommendationRows = recommendations.map(item => `| ${item.book.id} | ${item.book.title} | ${item.score} | ${item.reasons.join("; ")} |`).join("\n");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `# Guided Reading Experience Audit\n\nGenerated: 2026-05-26\n\n## Summary\n\n- Books analyzed: ${rows.length}\n- Failures: ${failures.length}\n- Warnings: ${warnings.length}\n- Recommendation results: ${recommendations.length}\n\n## Books\n\n| ID | Title | Level | QA Status | Pages | Words | Decodable/HFW | Microphase | Dominant Patterns |\n|---|---|---|---|---:|---:|---:|---|---|\n${table || "| - | - | - | - | 0 | 0 | 0% | - | - |"}\n\n## Dominant Patterns\n\n| Pattern | Book count |\n|---|---:|\n${patternTable || "| - | 0 |"}\n\n## Microphases\n\n| Microphase | Book count |\n|---|---:|\n${microphaseTable || "| - | 0 |"}\n\n## Recommendation Smoke Test\n\n| Book ID | Title | Score | Reasons |\n|---|---|---:|---|\n${recommendationRows || "| - | - | 0 | - |"}\n\n## Warnings\n\n${warnings.length ? warnings.map(item => `- ${item}`).join("\n") : "None."}\n\n## Failures\n\n${failures.length ? failures.map(item => `- ${item}`).join("\n") : "None."}\n`);

console.log(`Guided Reading books analyzed: ${rows.length}`);
console.log(`Dominant phonics patterns: ${[...patternCounts.keys()].slice(0, 12).join(", ")}`);
console.log(`Recommendation smoke results: ${recommendations.length}`);
console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
if (warnings.length) console.warn(`Guided Reading warnings: ${warnings.length}`);
if (failures.length) {
  console.error(`Guided Reading experience failures: ${failures.length}`);
  failures.slice(0, 20).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
