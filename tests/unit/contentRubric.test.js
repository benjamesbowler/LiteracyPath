import { test } from "node:test";
import assert from "node:assert/strict";
import { CUE_PATTERNS, scanSource, stringLiterals } from "../../tools/checkContentRubric.mjs";

// The line this gate walks: pictures as the STIMULUS of a question are
// ordinary early-years item design; pictures (or context, or the first
// letter) as a strategy to identify a word INSTEAD OF DECODING IT are
// three-cueing (rubric P-E4, tools/rubrics/ela.csv). The first pattern set
// got this wrong in both directions — 607 false positives on legitimate
// stimulus questions — so the boundary is pinned here.

const hits = source => scanSource(source).map(h => h.pattern);

test("unambiguous three-cueing instructions FAIL", () => {
  assert.ok(hits(`const p = "Does it look right? Does it make sense?";`).includes("three-cueing-triad"));
  assert.ok(hits(`const p = "Guess the word from the picture.";`).includes("context-guess"));
  assert.ok(hits(`const p = "Use the picture to help you read the word.";`).includes("cue-to-read-word"));
  assert.ok(hits(`const p = "Look at the first letter to work out the word.";`).includes("cue-to-read-word"));
  assert.ok(hits(`const p = "Skip the word and come back to it.";`).includes("skip-and-guess"));
  assert.ok(hits(`const p = "What would make sense here?";`).includes("context-guess"));
});

test("legitimate stimulus and phonics items PASS", () => {
  const clean = [
    `const p = "Look at the picture. Where is the duck?";`, // prepositions: picture IS the question
    `const p = "Which word matches the picture?";`, // vocabulary
    `const p = "Look at the picture. Which vowel team completes the word?";`, // encoding: picture names the target
    `const p = "What sound does sun start with?";`, // phonemic awareness
    `const p = "Sound it out, one letter at a time.";`,
    `const p = "Read the words around it for clues to what it means.";` // vocabulary strategy, not word-ID
  ];
  for (const source of clean) {
    assert.deepEqual(hits(source), [], `false positive on: ${source}`);
  }
});

test("a cueing phrase as a DISTRACTOR (answer choice) does not fail the bank", () => {
  // qb14_cc_051 offers "look at the first letter only" as a WRONG answer in a
  // which-strategy question — teaching a child to reject it. That is not an
  // instruction and must not trip the gate.
  const source = `const q = { choices: ["read the words around it for clues", "look at the first letter only"] };`;
  assert.deepEqual(hits(source), []);
});

test("comments never trip the scan — string literals only", () => {
  const source = `// teachers must never say "does it look right" — three-cueing\nconst x = 1;`;
  assert.deepEqual(hits(source), []);
});

test("literal extraction tracks line numbers incrementally", () => {
  const source = `const a = "first literal here";\nconst b = "does it look right";\n`;
  const literals = stringLiterals(source);
  assert.equal(literals.length, 2);
  assert.equal(literals[1].line, 2);
  assert.equal(CUE_PATTERNS.some(p => p.rx.test(literals[1].value)), true);
});
