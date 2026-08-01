import assert from "node:assert/strict";
import test from "node:test";

import {
  GUIDED_READING_NARRATION_RATE,
  GUIDED_READING_PAGE_LEAD_IN_MS,
  GUIDED_READING_PAGE_LEAD_OUT_MS,
  waitForGuidedReadingPause
} from "../../src/utils/guidedReading/readAloudPacing.js";

test("whole-book pacing gives children a visible pause around every page", () => {
  assert.ok(GUIDED_READING_PAGE_LEAD_IN_MS >= 1000);
  assert.ok(GUIDED_READING_PAGE_LEAD_IN_MS <= 2000);
  assert.ok(GUIDED_READING_PAGE_LEAD_OUT_MS >= 1000);
  assert.ok(GUIDED_READING_PAGE_LEAD_OUT_MS <= 2000);

  // A typical 5.5-second page takes about 50% longer once the two visual
  // pauses are included, while the voice remains only gently slowed.
  const typicalNarrationMs = 5500;
  const narratedAtChildRateMs = typicalNarrationMs / GUIDED_READING_NARRATION_RATE;
  const pacedPageMs = narratedAtChildRateMs
    + GUIDED_READING_PAGE_LEAD_IN_MS
    + GUIDED_READING_PAGE_LEAD_OUT_MS;
  const pacingRatio = pacedPageMs / narratedAtChildRateMs;

  assert.ok(GUIDED_READING_NARRATION_RATE >= 0.85);
  assert.ok(GUIDED_READING_NARRATION_RATE <= 0.95);
  assert.ok(pacingRatio >= 1.45 && pacingRatio <= 1.55, `pacing ratio was ${pacingRatio}`);
});

test("a guided-reading pause can be cancelled before it advances", async () => {
  const controller = new AbortController();
  const pause = waitForGuidedReadingPause(5000, { signal: controller.signal });
  controller.abort();

  assert.equal(await pause, false);
});

test("a completed guided-reading pause authorises the next step", async () => {
  assert.equal(await waitForGuidedReadingPause(1), true);
});
