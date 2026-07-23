#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { auditGuidedReadingQuestionBank } from "./guidedReadingQuestionAuditLib.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const quizDirectory = path.join(repoRoot, "public", "guided-reading", "quizzes");
const reportPath = path.join(repoRoot, "docs", "guided-reading", "guided_reading_question_bank_audit_2026-07-22.md");
const result = auditGuidedReadingQuestionBank({ books: guidedReadingBooks, quizDirectory });
const { metrics } = result;

const report = [
  "# Guided Reading Question Bank Audit — 2026-07-22",
  "",
  "## Current result",
  "",
  `- Active books: ${metrics.bookCount}`,
  `- Quiz files: ${metrics.quizFileCount}`,
  `- Questions: ${metrics.questionCount} (${metrics.fictionQuestionCount} fiction, ${metrics.nonfictionQuestionCount} nonfiction)`,
  `- Questions with exact page evidence: ${metrics.evidenceCount}/${metrics.questionCount}`,
  `- Additional exact supporting excerpts: ${metrics.supportingEvidenceExcerptCount}`,
  `- Answers supported by that evidence: ${metrics.supportedAnswerCount}/${metrics.questionCount}`,
  `  - Direct textual support: ${metrics.directlySupportedAnswerCount}`,
  `  - Traceable conceptual rationale: ${metrics.rationaleSupportedAnswerCount}`,
  `- Prohibited generic prompts: ${metrics.prohibitedPromptCount}`,
  `- Repeated answers within a quiz: ${metrics.repeatedAnswerCount}`,
  `- Correct-answer length giveaways: ${metrics.answerLengthGiveawayCount}`,
  `- Passing books: ${metrics.passingBooks}/${metrics.bookCount}`,
  `- Validation failures: ${metrics.failureCount}`,
  "",
  "## Per-book verification",
  "",
  "| Book | Title | Type | Level | Questions | Result |",
  "|---|---|---|---|---:|---|",
  ...result.rows.map(row => `| ${row.id} | ${String(row.title).replace(/\|/g, "\\|")} | ${row.type} | ${row.level} | ${row.questions} | ${row.status} |`),
  "",
  "## Failures",
  "",
  ...(result.failures.length ? result.failures.map(item => `- ${item}`) : ["None."]),
  "",
  "## Gate meaning",
  "",
  "A pass means every active book has exactly three structurally valid, genre-appropriate questions; all three answers are distinct; every question names an approved comprehension skill and exact supporting page text; every clause or list item in a compound answer links to validated primary/additional evidence, while non-literal inference/theme/cause/outcome answers require a human-authored rationale traceable to terms on both sides; generic word/title/cloze templates and conspicuous correct-answer length giveaways are absent; and repeated exact prompts are bounded across the bank.",
  ""
];

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${report.join("\n")}\n`);

console.log(`Guided Reading quiz files: ${metrics.quizFileCount}/${metrics.bookCount}`);
console.log(`Guided Reading questions: ${metrics.questionCount}`);
console.log(`Evidence-grounded answers: ${metrics.supportedAnswerCount}/${metrics.questionCount}`);
console.log(`Direct / rationale support: ${metrics.directlySupportedAnswerCount} / ${metrics.rationaleSupportedAnswerCount}`);
console.log(`Passing books: ${metrics.passingBooks}/${metrics.bookCount}`);
console.log(`Question-bank failures: ${metrics.failureCount}`);
console.log(`Wrote ${path.relative(repoRoot, reportPath)}`);

if (result.failures.length) {
  result.failures.slice(0, 80).forEach(item => console.error(`- ${item}`));
  process.exit(1);
}
