import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import {
  GUIDED_READING_DISCUSSION_PROMPTS,
  getGuidedReadingDiscussion
} from "../../src/data/guidedReadingDiscussionPrompts.js";
import { sourceOfTruthRegistry } from "../../src/data/sourceOfTruthRegistry.js";
import { normalizeReadableBook } from "../../src/utils/guidedReading/normalizeReadableBook.js";
import { validateGuidedReadingDiscussionPrompts } from "../../tools/checkGuidedReadingDiscussionPrompts.mjs";

const ASSESSMENT_LIKE_KEYS = /^(?:answer|answerKey|choice|choices|correct|correctness|mastery|proficiency|quiz|result|score|threshold|total)$/i;

function collectKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.push(key);
    collectKeys(child, keys);
  }
  return keys;
}

test("every current runtime book has one frozen oral move and one valid visual move", () => {
  assert.equal(guidedReadingBooks.length, 206);
  assert.deepEqual(
    new Set(Object.keys(GUIDED_READING_DISCUSSION_PROMPTS)),
    new Set(guidedReadingBooks.map(book => book.id))
  );

  for (const book of guidedReadingBooks) {
    const discussion = getGuidedReadingDiscussion(book.id);
    assert.ok(Object.isFrozen(discussion), `${book.id}: record must be frozen`);
    assert.ok(Object.isFrozen(discussion.oral), `${book.id}: oral move must be frozen`);
    assert.ok(Object.isFrozen(discussion.visual), `${book.id}: visual move must be frozen`);
    assert.deepEqual(Object.keys(discussion).sort(), ["oral", "visual"]);
    assert.deepEqual(Object.keys(discussion.oral).sort(), ["listenFor", "prompt"]);
    assert.deepEqual(Object.keys(discussion.visual).sort(), ["lookFor", "page", "prompt"]);
    assert.match(discussion.oral.prompt, /\S/);
    assert.match(discussion.oral.listenFor, /\S/);
    assert.match(discussion.visual.prompt, /\S/);
    assert.match(discussion.visual.lookFor, /\S/);

    const visualPage = book.pages.find(page => page.pageNumber === discussion.visual.page);
    assert.ok(visualPage, `${book.id}: visual page ${discussion.visual.page} must exist`);
    assert.match(
      visualPage.image || visualPage.imageUrl || visualPage.pageImage || "",
      /\S/,
      `${book.id}: visual page ${discussion.visual.page} must have art`
    );
    assert.equal(
      collectKeys(discussion).some(key => ASSESSMENT_LIKE_KEYS.test(key)),
      false,
      `${book.id}: discussion support must not contain assessment-like fields`
    );
  }
});

test("the discussion gate rejects missing, orphaned, generic, unsupported, and assessment-like records", () => {
  const fixtureBooks = [{
    id: "book-one",
    title: "A Red Kite",
    pages: [{
      pageNumber: 1,
      text: "The red kite lifts above the oak tree.",
      image: "/kite.webp",
      imageAlt: "A red kite flying above an oak tree."
    }]
  }];
  const validRecord = Object.freeze({
    oral: Object.freeze({
      prompt: "Why did the red kite lift above the oak tree?",
      listenFor: "Connects the rising wind with the kite lifting."
    }),
    visual: Object.freeze({
      page: 1,
      prompt: "Which two things show how high the red kite has flown?",
      lookFor: "Points to the red kite above the oak tree."
    })
  });

  assert.deepEqual(validateGuidedReadingDiscussionPrompts(fixtureBooks, { "book-one": validRecord }), []);
  assert.match(
    validateGuidedReadingDiscussionPrompts(fixtureBooks, {})[0],
    /missing discussion record/i
  );
  assert.match(
    validateGuidedReadingDiscussionPrompts(fixtureBooks, {
      "book-one": validRecord,
      orphan: validRecord
    }).join("\n"),
    /orphan discussion record/i
  );
  assert.match(
    validateGuidedReadingDiscussionPrompts(fixtureBooks, {
      "book-one": {
        ...validRecord,
        oral: { prompt: "What happened?", listenFor: "" }
      }
    }).join("\n"),
    /empty|generic/i
  );
  assert.match(
    validateGuidedReadingDiscussionPrompts(fixtureBooks, {
      "book-one": {
        ...validRecord,
        visual: { page: 1, prompt: "Where is the purple submarine?", lookFor: "Points to the submarine." }
      }
    }).join("\n"),
    /page evidence/i
  );
  assert.match(
    validateGuidedReadingDiscussionPrompts(fixtureBooks, {
      "book-one": { ...validRecord, score: 1 }
    }).join("\n"),
    /assessment-like key/i
  );
});

test("current prompts pass the coverage, evidence, and excessive-template gate", () => {
  assert.deepEqual(
    validateGuidedReadingDiscussionPrompts(guidedReadingBooks, GUIDED_READING_DISCUSSION_PROMPTS),
    []
  );
});

test("normalization preserves the private discussion authority for teacher consumers", () => {
  const book = guidedReadingBooks.find(item => item.id === "level-c-nonfiction-01-bees");
  const normalized = normalizeReadableBook(book);

  assert.equal(normalized.discussion, getGuidedReadingDiscussion(book.id));
});

test("the source-of-truth registry includes the static discussion authority", () => {
  assert.ok(
    sourceOfTruthRegistry.guidedReading.activeRuntimeFiles.includes(
      "src/data/guidedReadingDiscussionPrompts.js"
    )
  );
});

test("the discussion panel has no student identity, persistence, scoring, or result API", () => {
  const source = readFileSync(
    new URL("../../src/components/guided-reading/BookDiscussionPanel.jsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /studentId|studentName|saveGuidedReadingRecord|onSave|onResult|score|quiz/i);
});
