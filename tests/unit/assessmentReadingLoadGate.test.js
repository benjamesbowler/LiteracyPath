import test from "node:test";
import assert from "node:assert/strict";
import { lintBank } from "../../tools/assessmentRebuild/lib.mjs";
import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";

function readingIssues(skillId, level, passage) {
  const blueprint = skillBlueprints[skillId];
  return lintBank([{
    id: "reading-load-fixture", skillId, level, phase: 1, form: "A",
    itemKey: blueprint.unitsByLevel[level][0], formatType: "COMPREHENSION",
    prompt: "What happened?", passage,
    choices: ["a", "b", "c", "d"], answer: "a",
    distractorRationales: { b: "D-OPPOSITE", c: "D-OPPOSITE", d: "D-OPPOSITE" }
  }], blueprint).filter(issue => issue.code === "L-READ");
}

test("a short L1-sized passage cannot be published as a higher-level passage", () => {
  const short = "Mia saw the lost bag beside the gate. She took it to the school office. The teacher found a name on its tag. Soon the bag was back with its owner.";
  assert.equal(readingIssues("main_idea", 1, short).length, 0);
  assert.ok(readingIssues("main_idea", 2, short).some(issue => /minimum 70/.test(issue.message)));
});

test("Sentence Comprehension keeps its longer single-sentence bridge contract", () => {
  assert.equal(readingIssues("sentence_comprehension", 1,
    "Near the gate, our dog slept on a soft blanket.").length, 0);
  assert.equal(readingIssues("sentence_comprehension", 2,
    "After we closed the shop, Mum checked that every window was locked.").length, 0);
  assert.ok(readingIssues("sentence_comprehension", 2,
    "Mum closed the shop. Then she checked every window before leaving.").length > 0);
  assert.ok(readingIssues("sentence_comprehension", 2,
    "Mum checked that each window was locked.").length > 0);
});

test("short paragraphs and excessive sentence load cannot hide inside word totals", () => {
  assert.ok(readingIssues("key_details", 1, "The dog hid behind the tree.").length > 0);
  const longSentence = "Mia went down to the old garden where the tall trees were growing beside the wall and she saw a small bird that was trying to build its nest.";
  assert.ok(readingIssues("key_details", 1, longSentence).some(issue => /passage sentence/.test(issue.message)));
});

test("picture-to-sentence items check every response without adding an answer-revealing passage", () => {
  const item = { id: "scene", skillId: "sentence_comprehension", level: 1, phase: 1,
    itemKey: "picture_match", formatType: "COMPREHENSION", constructClaim: "picture_to_sentence_meaning",
    prompt: "Which sentence matches?", passage: "",
    choices: ["The red ball lies under the wooden chair.", "The blue ball sits on the wooden chair.",
      "The red ball sits on the wooden chair.", "The blue ball lies under the wooden chair."],
    answer: "The red ball lies under the wooden chair." };
  const check = value => lintBank([value], skillBlueprints.sentence_comprehension).filter(issue => issue.code === "L-READ");
  assert.equal(check(item).length, 0);
  assert.equal(check({ ...item, choices: [...item.choices.slice(0, 3), "A ball."] }).length, 1);
});
