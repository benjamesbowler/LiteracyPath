// CHECK: content rubric — the mechanically-checkable slice of the published
// Anthropic / Learning Commons K-12 rubric (tools/rubrics/, Apache-2.0).
//
// P-E4 — NO THREE-CUEING. The rubric: "The lesson contains no instruction to
// use picture cues, context cues, or initial-letter prompting to identify
// unknown words." Three-cueing is the discredited guessing strategy the
// Science of Reading replaced; Sound Seekers exists BECAUSE decoding beats
// guessing. Nothing in this repo does it today — this gate exists so a
// well-meaning hint in some future question batch ("look at the picture!",
// "what would make sense here?") cannot drift it in. It scans STRING LITERALS
// only, so code comments discussing three-cueing (like this one) never trip it.
//
// P-E5 — DECODABLE PRACTICE TEXT ONLY — is enforced at build time by
// `check:quest` (>= 6 decodable words per stop) and in the round builders
// (isDecodable filters in questRounds.js / questEncounters.js). Recorded here
// as ledger, not re-implemented.
//
// Run: npm run check:content-rubric

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The classic three-cueing moves, as INSTRUCTIONS in child-facing copy.
//
// Tuning history (this matters — the first pattern set produced 608 hits and
// 607 were legitimate): a picture used as the STIMULUS of a question — "Look
// at the picture. Where is the duck?" (prepositions), "Which word matches the
// picture?" (vocabulary), "Which vowel team completes r__n?" beside a picture
// of rain (encoding) — is ordinary early-years item design and NOT
// three-cueing. Three-cueing is instructing a child to use pictures, context
// or the first letter to IDENTIFY A WORD INSTEAD OF DECODING IT. So each
// pattern below either couples the cue to word-identification or is one of
// the unambiguous guessing-strategy phrases (the "look right / sound right /
// make sense" triad, "guess the word", "skip it and come back").
//
// Also deliberately NOT matched: "what sound does 'sun' start with?" —
// hearing an initial phoneme is phonemic awareness, our bread and butter.
export const CUE_PATTERNS = [
  {
    id: "cue-to-read-word",
    rx: /(use|look at|check) the (picture|pictures|first letter|context|clues?)[^.?!]{0,40}\bto (read|work out|figure out|guess|help you (read|say|know))\b[^.?!]{0,30}\b(word|it says|what it says)/i
  },
  { id: "context-guess", rx: /what would make sense (here|in the sentence|instead)|guess (the word|what it says|what the word)/i },
  { id: "three-cueing-triad", rx: /does (it|that|the word) (look right|sound right|make sense)/i },
  { id: "skip-and-guess", rx: /skip (it|the word|that word) and (come back|read on|move on and guess)/i }
];

// Child-facing content lives here. Tests, tools and docs are not child-facing.
const SCAN_DIRS = ["src"];
const SCAN_EXTENSIONS = new Set([".js", ".jsx"]);

// Pull every string literal (single, double, template) out of a JS/JSX source
// file with a real state machine, so COMMENTS NEVER TRIP THE SCAN — including
// comments that quote a cueing phrase in quotes (a regex extractor failed
// exactly that case in this file's own unit test). Single pass, incremental
// line tracking: the generated question banks are multi-megabyte files with
// tens of thousands of literals, and anything quadratic times out (observed,
// not theoretical).
export function stringLiterals(source) {
  const literals = [];
  let line = 1;
  let i = 0;
  const n = source.length;
  while (i < n) {
    const ch = source[i];
    if (ch === "\n") { line += 1; i += 1; continue; }
    // comments — skipped entirely
    if (ch === "/" && source[i + 1] === "/") {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") line += 1;
        i += 1;
      }
      i += 2;
      continue;
    }
    // string literals — collected
    if (ch === "'" || ch === "\"" || ch === "`") {
      const quote = ch;
      const startLine = line;
      let value = "";
      i += 1;
      while (i < n && source[i] !== quote) {
        if (source[i] === "\\") { value += source[i + 1] ?? ""; i += 2; continue; }
        if (source[i] === "\n") { if (quote !== "`") break; line += 1; }
        value += source[i];
        i += 1;
      }
      i += 1; // closing quote
      if (value.length >= 8) literals.push({ value, line: startLine }); // shorter can't hold an instruction
      continue;
    }
    i += 1;
  }
  return literals;
}

export function scanSource(source) {
  const hits = [];
  for (const literal of stringLiterals(source)) {
    for (const pattern of CUE_PATTERNS) {
      if (pattern.rx.test(literal.value)) {
        hits.push({ pattern: pattern.id, line: literal.line, snippet: literal.value.slice(0, 110) });
      }
    }
  }
  return hits;
}

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      yield* walk(full);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

function main() {
  let files = 0;
  let literals = 0;
  const failures = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const source = fs.readFileSync(file, "utf8");
      files += 1;
      const found = stringLiterals(source);
      literals += found.length;
      for (const literal of found) {
        for (const pattern of CUE_PATTERNS) {
          if (pattern.rx.test(literal.value)) {
            failures.push({
              file: path.relative(ROOT, file),
              pattern: pattern.id,
              line: literal.line,
              snippet: literal.value.slice(0, 110)
            });
          }
        }
      }
    }
  }

  console.log("content rubric — mechanically-checkable criteria (tools/rubrics/)");
  console.log(`  P-E4 no three-cueing      scanned ${files} files / ${literals} string literals`);
  console.log("  P-E5 decodable-only text  enforced by check:quest + round builders (ledger)");

  if (failures.length) {
    console.error(`\nFAIL — ${failures.length} three-cueing phrase(s) in child-facing copy:`);
    for (const failure of failures) {
      console.error(`  ${failure.file}:${failure.line}  [${failure.pattern}]  "${failure.snippet}"`);
    }
    console.error("\nThree-cueing teaches guessing; this product teaches decoding. Reword the hint.");
    process.exitCode = 1;
    return;
  }
  console.log("check:content-rubric OK — no cueing language in child-facing copy");
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
