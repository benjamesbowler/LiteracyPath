import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import { releasedMathsStories } from "../../src/maths/stories/mathsStoryCatalog.js";
import { mathsAssessmentBank } from "../../src/maths/assessment/mathsAssessmentBank.js";

test("released Foundation number stories have complete 4:3 page media", async () => {
  const pages = releasedMathsStories.flatMap(story => story.pages.map(page => ({ story, page })));
  assert.equal(pages.length, 16);
  assert.equal(new Set(pages.map(({ page }) => page.image)).size, 16);
  for (const { story, page } of pages) {
    const absolute = path.join(process.cwd(), "public", page.image);
    assert.ok(fs.existsSync(absolute), `${story.id} page ${page.pageNumber} is missing`);
    assert.ok(fs.statSync(absolute).size > 150_000, `${story.id} page ${page.pageNumber} is too small for release media`);
    const metadata = await sharp(absolute).metadata();
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 900);
    assert.equal(metadata.format, "webp");
  }
});

test("authored Maths assessment surfaces use natural grammar and specific number paths", () => {
  const prompts = mathsAssessmentBank.flatMap(item => item.surfaceVariants.map(surface => surface.promptText));
  for (const prompt of prompts) {
    assert.doesNotMatch(prompt, /each (meadow stones|buttons|leaves|shells)/i);
    assert.doesNotMatch(prompt, /exactly 1 (spaces|counters)/i);
    assert.doesNotMatch(prompt, /\b1 are one colour\b/i);
  }
  const sequenceItems = mathsAssessmentBank.filter(item => item.blueprintId === "number_sequence");
  assert.equal(new Set(sequenceItems.map(item => item.surfaceVariants[0].promptText)).size, 20);
  assert.ok(sequenceItems.every(item => item.authoredPrompt && item.surfaceVariants.every(surface => surface.promptText.includes("blank"))));
});

test("released story illustrations remain paired with exact mathematical models", () => {
  const buns = releasedMathsStories.find(story => story.id === "maths-story-f-five-buns");
  const lights = releasedMathsStories.find(story => story.id === "maths-story-f-ten-lights");
  assert.deepEqual(buns.pages.map(page => page.model.total), [5, 5, 5, 5, 5, 5, 5, 5]);
  assert.deepEqual(lights.pages.map(page => page.model.capacity), [10, 10, 10, 10, undefined, 10, undefined, 10]);
  assert.deepEqual(lights.pages.map(page => page.model.filled ?? page.model.total), [0, 5, 5, 7, 7, 10, 10, 10]);
});
