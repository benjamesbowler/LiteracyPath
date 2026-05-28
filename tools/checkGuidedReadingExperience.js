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
  "dino-pals-10-cheekys-prank-goes-wrong",
  "dino-pals-11-shys-secret-gift",
  "dino-pals-12-fancys-bad-day",
  "dino-pals-13-clumsy-to-the-rescue",
  "dino-pals-14-what-is-flappy",
  "dino-pals-15-sneezy-and-the-waterfall",
  "dino-pals-16-chompy-and-grumpys-day-out",
  "dino-pals-17-the-sunny-hollow-games",
  "dino-pals-18-dozys-wonderful-dream",
  "dino-pals-19-zippys-race",
  "dino-pals-20-the-big-storm",
  "meadow-pals-01-muddy-has-a-bath",
  "meadow-pals-02-woolly-cant-sleep",
  "meadow-pals-03-clucky-lays-an-egg",
  "meadow-pals-04-bouncy-wont-stop",
  "meadow-pals-05-grumpy-gets-a-surprise",
  "meadow-pals-06-sleepy-cant-wake-up",
  "meadow-pals-07-noisy-tries-to-be-quiet",
  "meadow-pals-08-tiny-is-very-small",
  "meadow-pals-09-shy-comes-out-to-play",
  "meadow-pals-10-giggly-has-the-hiccups",
  "meadow-pals-11-brave-climbs-the-hay-bale",
  "meadow-pals-12-hungry-eats-everything",
  "meadow-pals-13-splashy-finds-a-puddle",
  "meadow-pals-14-speedy-slows-down",
  "meadow-pals-15-cuddly-wants-a-hug",
  "meadow-pals-16-muddy-and-splashy-make-a-mess",
  "meadow-pals-17-bouncy-and-speedy-have-a-race",
  "meadow-pals-18-noisy-wakes-everyone-up",
  "meadow-pals-19-tiny-and-brave-go-on-an-adventure",
  "meadow-pals-20-shy-and-cuddly-find-each-other",
  "meadow-pals-21-woolly-and-grumpy-are-stuck",
  "meadow-pals-22-sleepys-big-dream",
  "meadow-pals-23-giggly-and-clucky-bake-a-cake",
  "meadow-pals-24-grumpys-secret",
  "meadow-pals-25-the-big-farm-party",
  "moonwood-tales-c-01",
  "moonwood-tales-c-02",
  "moonwood-tales-c-03",
  "moonwood-tales-c-04",
  "moonwood-tales-c-05",
  "moonwood-tales-c-06",
  "moonwood-tales-c-07",
  "moonwood-tales-c-08",
  "moonwood-tales-c-09",
  "moonwood-tales-c-10"
]);
const unexpectedFictionBooks = visibleFictionBooks.filter(book => !allowedFictionIds.has(book.id));
const removedNonfictionIds = new Set(["gr-c-36", "gr-d-41"]);
const removedNonfictionRestored = guidedReadingBooks.filter(book => removedNonfictionIds.has(book.id));

if (unexpectedFictionBooks.length) {
  failures.push(`Unexpected fiction Guided Reading books visible: ${unexpectedFictionBooks.map(book => book.id).join(", ")}`);
}
if (removedNonfictionRestored.length) {
  failures.push(`Deleted nonfiction Guided Reading books visible: ${removedNonfictionRestored.map(book => book.id).join(", ")}`);
}
if (guidedReadingBooks.length !== 161) {
  failures.push(`Expected 161 total Guided Reading books after Meadow Pals 16-25 import, found ${guidedReadingBooks.length}.`);
}

for (const book of guidedReadingBooks) {
  const enriched = enrichGuidedReadingBook(book);
  const visible = book.active !== false || book.qaStatus === "approved";
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
