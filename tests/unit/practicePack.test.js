import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPracticePackDocument,
  packStopIndex,
  packStopOptions
} from "../../src/utils/worksheets/practicePack.js";
import { taughtThrough, wordsThrough, QUEST_STOPS } from "../../src/data/questSequence.js";
import { isDecodable } from "../../src/utils/questSegments.js";

const RECIPE = { name: "Sam", targets: ["sh", "ch", "e", "ll", "st"], stopIndex: 13, date: "2026-07-17" };

test("the pack is deterministic (same recipe = same bytes)", () => {
  const a = buildPracticePackDocument(RECIPE);
  const b = buildPracticePackDocument(RECIPE);
  assert.equal(a.html, b.html);
  assert.equal(a.title, b.title);
});

test("the pack is two pages: teacher plan + student sheet", () => {
  const { html, title } = buildPracticePackDocument(RECIPE);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.equal((html.match(/class="page"/g) || []).length, 2);
  assert.ok(title.includes("Sam"));
  assert.ok(html.includes("five-minute sound practice"), "teacher page present");
  assert.ok(html.includes("sound trail"), "student page present");
  assert.ok(html.includes("Got it") && html.includes("Almost there") && html.includes("Needs re-teaching"),
    "exit ticket uses the published sort vocabulary");
  assert.ok(html.includes("Tricky words"), "heart words section present at stop 13");
});

test("every printed word is decodable at the chosen stop (P-E5 by construction)", () => {
  const { sections } = buildPracticePackDocument(RECIPE);
  assert.ok(sections.length >= 3, "most requested sounds produced a grid");
  const known = taughtThrough(13);
  const pool = new Set(wordsThrough(13));
  for (const section of sections) {
    assert.ok(section.words.length >= 2 && section.words.length <= 6);
    for (const word of section.words) {
      assert.ok(pool.has(word), `${word} comes from the curriculum's own word pool`);
      assert.ok(isDecodable(word, known), `${word} is decodable with sounds taught by stop 13`);
    }
  }
});

test("sounds without enough decodable words are skipped, not padded", () => {
  // "sh" is not taught by stop 2 — it must be skipped while "s" still prints.
  const { sections, skipped } = buildPracticePackDocument({
    name: "Sam", targets: ["s", "sh"], stopIndex: 2, date: "2026-07-17"
  });
  assert.ok(sections.some(section => section.target === "s"));
  assert.ok(skipped.includes("sh"));
});

test("a pack where nothing can print throws instead of printing an empty page", () => {
  assert.throws(() => buildPracticePackDocument({
    name: "Sam", targets: ["sh", "ch"], stopIndex: 1, date: "2026-07-17"
  }));
  assert.throws(() => buildPracticePackDocument({ name: "", targets: ["s"], stopIndex: 5 }));
  assert.throws(() => buildPracticePackDocument({ name: "Sam", targets: [], stopIndex: 5 }));
});

test("the child's name is escaped in the printed HTML", () => {
  const { html } = buildPracticePackDocument({
    name: 'Sam <script>alert("x")</script>', targets: ["s", "a"], stopIndex: 5, date: "2026-07-17"
  });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes("Sam &lt;script&gt;"));
});

test("split digraphs render as a–e, and a teacher can type them as a-e", () => {
  const { html, sections } = buildPracticePackDocument({
    name: "Sam", targets: ["a-e"], stopIndex: QUEST_STOPS.length, date: "2026-07-17"
  });
  assert.equal(sections[0].target, "a_e", "hyphen input maps to the curriculum id");
  assert.equal(sections[0].label, "a–e");
  assert.ok(html.includes("The sound a–e"));
  assert.ok(!html.includes("a_e"), "raw ids never reach the printed page");
});

test("packStopIndex finds the furthest stop with evidence", () => {
  assert.equal(packStopIndex({ heat: [
    { stopIndex: 1, bucket: "got-it" },
    { stopIndex: 4, bucket: "reteach" },
    { stopIndex: 9, bucket: "unseen" }
  ] }), 4);
  assert.equal(packStopIndex({ heat: [{ stopIndex: 3, bucket: "unseen" }] }), null);
  assert.equal(packStopIndex(null), null);
});

test("packStopOptions lists every quest stop in order", () => {
  const options = packStopOptions();
  assert.equal(options.length, QUEST_STOPS.length);
  assert.equal(options[0].index, 1);
  assert.ok(options.every(option => option.index && option.name));
});
