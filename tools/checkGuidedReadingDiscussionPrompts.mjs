import { pathToFileURL } from "node:url";

import { guidedReadingBooks } from "../src/data/guidedReadingBooks.js";
import { GUIDED_READING_DISCUSSION_PROMPTS } from "../src/data/guidedReadingDiscussionPrompts.js";

const ASSESSMENT_LIKE_KEY = /^(?:answer|answerKey|choice|choices|correct|correctness|mastery|proficiency|quiz|result|score|threshold|total)$/i;
const GENERIC_PROMPT = /^(?:what happened\??|what do you see\??|tell me about (?:the )?(?:book|story)\.?|did you like (?:the )?(?:book|story)\??)$/i;
const EVIDENCE_STOP_WORDS = new Set([
  "about", "after", "again", "also", "and", "are", "because", "before", "book", "both", "but", "can", "child",
  "connects", "detail", "details", "does", "earlier", "each", "every", "finds", "first", "from", "gives", "have",
  "helps", "identifies", "into", "later", "links", "look", "looks", "names", "notice", "page", "pictured", "picture",
  "points", "prompt", "says", "shares", "show", "shows", "story", "that", "their", "them", "then", "these", "they",
  "this", "through", "uses", "using", "what", "when", "where", "which", "with", "your"
]);

function collectKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    collectKeys(child, keys);
  }
  return keys;
}

function tokens(value = "") {
  return new Set((String(value).toLowerCase().match(/[a-z0-9]+(?:['’][a-z0-9]+)*/g) || [])
    .filter(token => token.length > 2 && !EVIDENCE_STOP_WORDS.has(token)));
}

function overlapCount(left, right) {
  const rightTokens = tokens(right);
  return [...tokens(left)].filter(token => rightTokens.has(token)).length;
}

function exactKeys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function normalizedWords(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[“”"'’]/g, "")
    .replace(/\b\d+\b/g, "#")
    .replace(/[^a-z#]+/g, " ")
    .trim()
    .split(/\s+/);
}

function normalizedOpening(value = "") {
  return normalizedWords(value).slice(0, 4).join(" ");
}

function duplicateIssues(records, fieldPath, label) {
  const values = Object.entries(records).map(([bookId, record]) => {
    const value = fieldPath.reduce((current, key) => current?.[key], record);
    return { bookId, value: String(value || "").trim() };
  });
  const exactCounts = new Map();
  const openingCounts = new Map();
  for (const item of values) {
    if (item.value) exactCounts.set(item.value, (exactCounts.get(item.value) || 0) + 1);
    const opening = normalizedOpening(item.value);
    if (opening) openingCounts.set(opening, (openingCounts.get(opening) || 0) + 1);
  }
  const issues = [];
  for (const [value, count] of exactCounts) {
    if (count > 1) issues.push(`${label}: full duplicate cue or prompt appears ${count} times: ${value}`);
  }
  for (const [opening, count] of openingCounts) {
    if (count > 3) issues.push(`${label}: excessive template reuse begins “${opening}” in ${count} records`);
  }
  return issues;
}

export function validateGuidedReadingDiscussionPrompts(books, records) {
  const issues = [];
  const bookIds = new Set((books || []).map(book => book.id));
  const recordIds = new Set(Object.keys(records || {}));

  for (const bookId of bookIds) {
    if (!recordIds.has(bookId)) issues.push(`${bookId}: missing discussion record`);
  }
  for (const bookId of recordIds) {
    if (!bookIds.has(bookId)) issues.push(`${bookId}: orphan discussion record`);
  }

  for (const book of books || []) {
    const record = records?.[book.id];
    if (!record) continue;
    const readablePages = (book.pages || []).filter(page => (
      page.active !== false && (!page.qaStatus || page.qaStatus === "approved")
    ));
    if (!exactKeys(record, ["oral", "visual"])) {
      issues.push(`${book.id}: record must contain exactly oral and visual moves`);
    }
    if (!exactKeys(record.oral, ["prompt", "listenFor"])) {
      issues.push(`${book.id}: oral move must contain exactly prompt and listenFor`);
    }
    if (!exactKeys(record.visual, ["page", "prompt", "lookFor"])) {
      issues.push(`${book.id}: visual move must contain exactly page, prompt, and lookFor`);
    }
    if (!Object.isFrozen(record) || !Object.isFrozen(record.oral) || !Object.isFrozen(record.visual)) {
      issues.push(`${book.id}: record and both moves must be frozen`);
    }

    for (const [field, value] of [
      ["oral.prompt", record.oral?.prompt],
      ["oral.listenFor", record.oral?.listenFor],
      ["visual.prompt", record.visual?.prompt],
      ["visual.lookFor", record.visual?.lookFor]
    ]) {
      if (!String(value || "").trim()) issues.push(`${book.id}: empty ${field}`);
    }
    if (GENERIC_PROMPT.test(String(record.oral?.prompt || "").trim())) {
      issues.push(`${book.id}: generic oral prompt is not book-specific`);
    }
    if (GENERIC_PROMPT.test(String(record.visual?.prompt || "").trim())) {
      issues.push(`${book.id}: generic visual prompt is not book-specific`);
    }

    for (const key of collectKeys(record)) {
      if (ASSESSMENT_LIKE_KEY.test(key)) issues.push(`${book.id}: assessment-like key “${key}” is prohibited`);
    }

    const page = readablePages.find(candidate => candidate.pageNumber === record.visual?.page);
    if (!page) {
      issues.push(`${book.id}: visual page ${record.visual?.page} does not exist`);
      continue;
    }
    const image = page.image || page.imageUrl || page.pageImage || "";
    if (!image || page.active === false || (page.qaStatus && page.qaStatus !== "approved")) {
      issues.push(`${book.id}: visual page ${record.visual.page} has no valid final media`);
    }
    const pageEvidence = [page.text, page.imageAlt, page.pageDescription, page.illustrationPrompt].filter(Boolean).join(" ");
    if (overlapCount(`${record.visual?.prompt} ${record.visual?.lookFor}`, pageEvidence) < 2) {
      issues.push(`${book.id}: visual move lacks concrete page evidence`);
    }
    const bookEvidence = readablePages.map(candidate => [
      candidate.text,
      candidate.imageAlt,
      candidate.pageDescription,
      candidate.illustrationPrompt
    ].filter(Boolean).join(" ")).join(" ");
    if (overlapCount(`${record.oral?.prompt} ${record.oral?.listenFor}`, bookEvidence) < 2) {
      issues.push(`${book.id}: oral move lacks concrete book evidence`);
    }
  }

  issues.push(...duplicateIssues(records || {}, ["oral", "prompt"], "oral prompts"));
  issues.push(...duplicateIssues(records || {}, ["visual", "prompt"], "visual prompts"));
  issues.push(...duplicateIssues(records || {}, ["oral", "listenFor"], "oral cues"));
  issues.push(...duplicateIssues(records || {}, ["visual", "lookFor"], "visual cues"));
  return [...new Set(issues)];
}

function run() {
  const issues = validateGuidedReadingDiscussionPrompts(
    guidedReadingBooks,
    GUIDED_READING_DISCUSSION_PROMPTS
  );
  if (issues.length) {
    console.error(`Guided Reading discussion prompt check failed with ${issues.length} issue(s):`);
    issues.forEach(issue => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }
  console.log(`Guided Reading discussion prompts: ${guidedReadingBooks.length} static book records passed.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) run();
