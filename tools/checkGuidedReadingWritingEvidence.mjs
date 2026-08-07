#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = path.join(
  repositoryRoot,
  "docs",
  "guided-reading",
  "HUMAN_WRITING_EVIDENCE_DATABASE.json"
);

const REQUIRED_TEXT_FIELDS = Object.freeze([
  "example_id",
  "genre",
  "source_title",
  "author",
  "publisher_or_collection",
  "verified_age_or_level",
  "excerpt",
  "narrative_function",
  "craft_moves",
  "why_it_works",
  "rewrite_lesson",
  "source_url",
  "source_kind",
  "rights_note"
]);

const NON_COPYRIGHTED_RIGHTS = /\b(?:CC\s*BY|Creative Commons|public domain)\b/i;
const DISALLOWED_SOURCE_KINDS = /\b(?:fan|transcript|snippet|mirror|school-hosted)\b/i;
const ALLOWED_SOURCE_KINDS = /\b(?:official|publisher-authori[sz]ed|Google Books)\b/i;
const WORD_PATTERN = /[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu;

const failures = [];

function words(value = "") {
  return String(value).match(WORD_PATTERN) || [];
}

function requireNonEmptyString(row, field, label) {
  if (typeof row[field] !== "string" || !row[field].trim()) {
    failures.push(`${label}: ${field} must be a non-empty string`);
  }
}

let database;
try {
  database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
} catch (error) {
  console.error(`Writing-evidence database could not be read: ${error.message}`);
  process.exit(1);
}

if (!database || typeof database !== "object" || Array.isArray(database)) {
  failures.push("database root must be an object");
}
if (typeof database?.schema_version !== "string" || !database.schema_version.trim()) {
  failures.push("schema_version must be a non-empty string");
}
if (typeof database?.purpose !== "string" || !database.purpose.trim()) {
  failures.push("purpose must be a non-empty string");
}

const examples = Array.isArray(database?.examples) ? database.examples : [];
if (examples.length < 100) {
  failures.push(`at least 100 actual-text examples are required; found ${examples.length}`);
}

const ids = new Set();
const excerptKeys = new Set();
const copyrightedWordsByTitle = new Map();
const genreCounts = new Map();
const verifiedBandCounts = new Map();

for (const [index, row] of examples.entries()) {
  const label = `examples[${index}]${row?.example_id ? ` (${row.example_id})` : ""}`;
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    failures.push(`${label}: row must be an object`);
    continue;
  }

  for (const field of REQUIRED_TEXT_FIELDS) requireNonEmptyString(row, field, label);

  if (typeof row.excerpt_word_count !== "number" || !Number.isInteger(row.excerpt_word_count)) {
    failures.push(`${label}: excerpt_word_count must be an integer`);
  }

  const actualWordCount = words(row.excerpt).length;
  if (actualWordCount < 1 || actualWordCount > 20) {
    failures.push(`${label}: excerpt must contain 1-20 words; found ${actualWordCount}`);
  }
  if (row.excerpt_word_count !== actualWordCount) {
    failures.push(
      `${label}: excerpt_word_count ${row.excerpt_word_count} does not match ${actualWordCount}`
    );
  }

  if (ids.has(row.example_id)) failures.push(`${label}: duplicate example_id`);
  ids.add(row.example_id);

  const excerptKey = `${String(row.source_title).trim().toLowerCase()}::${String(row.excerpt).trim().toLowerCase()}`;
  if (excerptKeys.has(excerptKey)) failures.push(`${label}: duplicate title/excerpt pair`);
  excerptKeys.add(excerptKey);

  try {
    const sourceUrl = new URL(row.source_url);
    if (sourceUrl.protocol !== "https:") failures.push(`${label}: source_url must use HTTPS`);
  } catch {
    failures.push(`${label}: source_url must be a valid URL`);
  }

  if (DISALLOWED_SOURCE_KINDS.test(row.source_kind)) {
    failures.push(`${label}: source_kind is not an approved actual-text source`);
  }
  if (!ALLOWED_SOURCE_KINDS.test(row.source_kind)) {
    failures.push(`${label}: source_kind must identify an official or publisher-authorised source`);
  }

  const genreLabel = String(row.genre).trim().toLowerCase();
  const broadGenre = genreLabel.includes("nonfiction")
    ? "nonfiction"
    : genreLabel.includes("fiction")
      ? "fiction"
      : "other";
  genreCounts.set(broadGenre, (genreCounts.get(broadGenre) || 0) + 1);

  for (const band of ["A", "B", "C"]) {
    if (new RegExp(`\\b(?:Level|Band)\\s+${band}\\b`, "i").test(row.verified_age_or_level)) {
      verifiedBandCounts.set(band, (verifiedBandCounts.get(band) || 0) + 1);
    }
  }

  if (!NON_COPYRIGHTED_RIGHTS.test(row.rights_note)) {
    const titleKey = String(row.source_title).trim().toLowerCase();
    copyrightedWordsByTitle.set(
      titleKey,
      (copyrightedWordsByTitle.get(titleKey) || 0) + actualWordCount
    );
  }
}

if (!(genreCounts.get("fiction") > 0)) failures.push("database must include fiction examples");
if (!(genreCounts.get("nonfiction") > 0)) failures.push("database must include nonfiction examples");
for (const band of ["A", "B", "C"]) {
  if (!(verifiedBandCounts.get(band) > 0)) {
    failures.push(`database must include actual text from a publisher-verified Level ${band} book`);
  }
}

if (database?.scope?.example_count !== examples.length) {
  failures.push(`scope.example_count must equal ${examples.length}`);
}
if (!Array.isArray(database?.derived_patterns) || database.derived_patterns.length === 0) {
  failures.push("derived_patterns must contain the cross-source craft findings");
}

for (const [title, wordCount] of copyrightedWordsByTitle.entries()) {
  if (wordCount > 25) {
    failures.push(`copyrighted excerpts for ${JSON.stringify(title)} total ${wordCount} words; maximum is 25`);
  }
}

console.log("Guided Reading human-writing evidence audit");
console.log(
  `Examples: ${examples.length}; fiction: ${genreCounts.get("fiction") || 0}; `
  + `nonfiction: ${genreCounts.get("nonfiction") || 0}; `
  + `verified A/B/C rows: ${["A", "B", "C"].map(band => verifiedBandCounts.get(band) || 0).join("/")}.`
);
console.log(`Failures: ${failures.length}.`);

if (failures.length) {
  console.error("\nWriting-evidence database gate FAILED:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("The evidence database contains 100+ sourced, bounded, craft-analysed actual-text examples.");
