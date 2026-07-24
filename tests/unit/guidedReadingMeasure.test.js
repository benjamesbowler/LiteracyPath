import assert from "node:assert/strict";
import test from "node:test";

import {
  getGuidedReadingMeasure,
  GUIDED_READING_LEVEL_MEASURES,
  normalizeGuidedReadingLevel
} from "../../src/policy/guidedReadingMeasure.js";

test("A3.7 owns one complete reading-measure template for levels A, B, and C", () => {
  assert.deepEqual(Object.keys(GUIDED_READING_LEVEL_MEASURES), ["A", "B", "C"]);
  for (const [level, measure] of Object.entries(GUIDED_READING_LEVEL_MEASURES)) {
    assert.equal(measure.level, level);
    assert.equal(measure.templateId, `level-${level.toLowerCase()}`);
    assert.equal(measure.imageFraction + measure.textFraction, 100);
    assert.ok(measure.maxRenderedCharactersPerLine > 0);
    assert.ok(measure.maxLineMeasureCh > 0);
    assert.ok(measure.minFontSizePx >= 16);
    assert.ok(measure.maxFontSizePx >= measure.minFontSizePx);
    assert.ok(measure.lineHeight >= 1.3);
  }
});

test("A3.7 reading lines widen gradually as text complexity increases", () => {
  const measures = ["A", "B", "C"].map(getGuidedReadingMeasure);
  assert.deepEqual(
    measures.map(measure => measure.maxRenderedCharactersPerLine),
    [...measures]
      .map(measure => measure.maxRenderedCharactersPerLine)
      .sort((left, right) => left - right)
  );
  assert.deepEqual(
    measures.map(measure => measure.maxLineMeasureCh),
    [...measures]
      .map(measure => measure.maxLineMeasureCh)
      .sort((left, right) => left - right)
  );
});

test("A3.7 earlier templates reserve more space for instructional imagery", () => {
  const [levelA, levelB, levelC] = ["A", "B", "C"].map(getGuidedReadingMeasure);
  assert.ok(levelA.imageFraction > levelB.imageFraction);
  assert.ok(levelB.imageFraction > levelC.imageFraction);
  assert.ok(levelA.stackedImageViewportHeight > levelB.stackedImageViewportHeight);
  assert.ok(levelB.stackedImageViewportHeight > levelC.stackedImageViewportHeight);
});

test("unknown or malformed reading levels fail closed to the earliest template", () => {
  assert.equal(normalizeGuidedReadingLevel(" c "), "C");
  assert.equal(normalizeGuidedReadingLevel("Level B"), "A");
  assert.equal(getGuidedReadingMeasure("unknown").templateId, "level-a");
});

