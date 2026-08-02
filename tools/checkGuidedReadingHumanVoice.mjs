#!/usr/bin/env node

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";

const GENERIC_PROSE_PATTERNS = Object.freeze([
  { label: "stated lesson", pattern: /\b(?:they|he|she) learned that\b/i },
  { label: "generic future summary", pattern: /\bfrom that day on\b/i },
  { label: "generic optimistic ending", pattern: /\banything was possible\b/i },
  { label: "abstract emotion summary", pattern: /\b(?:a )?warm feeling\b/i },
  { label: "clinical child emotion", pattern: /\bworried feeling\b/i },
  { label: "clinical calming summary", pattern: /\bbreathing feels calm\b/i },
  { label: "abstract understanding summary", pattern: /\bunderstanding .+ (?:began|begun)\b/i },
  { label: "tidy growth moral", pattern: /\bnow (?:he|she|they) knew what .+ could feel like\b/i },
  { label: "abstract trait appraisal", pattern: /\bthey learned (?:he|she|it) (?:loved|liked|was|felt)\b/i },
  { label: "employee-like puppy description", pattern: /\binteresting work\b/i }
]);

const findings = guidedReadingBooks
  .filter(book => book.active !== false && book.type === "fiction")
  .flatMap(book => (book.pages || [])
    .filter(page => page.active !== false)
    .flatMap(page => GENERIC_PROSE_PATTERNS
      .filter(rule => rule.pattern.test(String(page.text || "")))
      .map(rule => ({
        bookId: book.id,
        pageNumber: page.pageNumber,
        issue: rule.label,
        text: page.text
      }))));

const summary = {
  activeFictionBooks: guidedReadingBooks.filter(
    book => book.active !== false && book.type === "fiction"
  ).length,
  activeFictionPages: guidedReadingBooks
    .filter(book => book.active !== false && book.type === "fiction")
    .reduce((count, book) => count + (book.pages || []).filter(page => page.active !== false).length, 0),
  genericVoiceFindings: findings.length,
  findings
};

console.log(JSON.stringify(summary, null, 2));
if (findings.length) process.exitCode = 1;
