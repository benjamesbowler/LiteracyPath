import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLiveLessonContent,
  isLiveLessonResponseCorrect,
  publicLiveLessonPrompt
} from "../../src/content/liveLessons/liveLessonContent.js";
import { presentationCycleOptions } from "../../src/utils/present/presentationBuilder.js";

test("every teaching cycle produces deterministic, slide-bound live prompts", () => {
  for (const option of presentationCycleOptions()) {
    const first = buildLiveLessonContent(option.id, { day: "monday" });
    const second = buildLiveLessonContent(option.id, { day: "monday" });
    assert.deepEqual(first, second);
    assert.ok(Object.isFrozen(first));
    for (const prompt of first.prompts) {
      assert.ok(prompt.slideIndex >= 0 && prompt.slideIndex < first.slideCount);
      assert.equal(prompt.evidencePurpose, "diagnostic_not_mastery");
      assert.ok(prompt.id.startsWith(`slide-${prompt.slideIndex}-`));
      if (prompt.choices) {
        assert.ok(prompt.choices.includes(prompt.answer));
        assert.equal(new Set(prompt.choices).size, prompt.choices.length);
      }
    }
  }
});

test("the child prompt never exposes its answer", () => {
  const content = buildLiveLessonContent("cycle-2");
  const prompt = content.prompts[0];
  assert.ok(prompt);
  const safe = publicLiveLessonPrompt(prompt);
  assert.equal("answer" in safe, false);
  assert.equal(JSON.stringify(safe).includes('"answer"'), false);
});

test("choice and tile responses are checked without recording media", () => {
  const content = buildLiveLessonContent("cycle-3");
  const choice = content.prompts.find(prompt => prompt.choices);
  const tiles = content.prompts.find(prompt => prompt.tiles);
  assert.equal(isLiveLessonResponseCorrect(choice, choice.answer), true);
  assert.equal(isLiveLessonResponseCorrect(choice, "wrong"), false);
  if (tiles) {
    assert.equal(isLiveLessonResponseCorrect(tiles, tiles.answer.split("")), true);
    assert.equal(isLiveLessonResponseCorrect(tiles, [...tiles.answer].reverse()), false);
  }
});
