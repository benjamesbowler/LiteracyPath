import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCyclePresentation,
  presentationCycleOptions,
  presentationLessonTiming,
  PRESENTATION_DAYS
} from "../../src/utils/present/presentationBuilder.js";

test("launcher and daily deck agree on timings derived from every generated slide", () => {
  const cycles = presentationCycleOptions().filter(cycle => cycle.type !== "assessment");
  for (const cycle of cycles) for (const { value: day } of PRESENTATION_DAYS) {
    const deck = buildCyclePresentation(cycle.id, { day });
    const { slides, timing } = deck.manifest;
    const estimate = items => Math.round(items.reduce((seconds, item) =>
      seconds + item.responseTurns * timing.responseSeconds + timing.transitionSeconds, 0) / 6) / 10;
    assert.deepEqual(presentationLessonTiming(cycle.id, day), timing);
    assert.equal(deck.lessonPlan.timing, timing);
    assert.equal(timing.budgetMinutes, day === "friday" ? 30 : 20);
    assert.equal(timing.estimatedMinutes, estimate(slides));
    assert.equal(timing.priorityEstimatedMinutes, estimate(slides.filter(item => item.priority === "core")));
    assert.equal(timing.observedMinutes, null);

    const reading = slides.filter(item => item.block === "reading");
    const readingBlock = deck.lessonPlan.blocks.find(item => item.id === "reading");
    assert.equal(readingBlock.minutes, day === "friday" ? 12 : 7);
    assert.equal(readingBlock.estimatedMinutes, estimate(reading));
    assert.equal(reading.filter(item => item.construct === "supported-reading-comprehension").length, 4);
    assert.ok(reading.filter(item => item.construct === "supported-reading-comprehension").every(item => item.priority === "core"));

    if (day !== "friday") {
      assert.equal(timing.extraSlideCount, 0);
      continue;
    }
    assert.ok(timing.priorityEstimatedMinutes < timing.estimatedMinutes);
    assert.equal(timing.extraSlideCount, slides.filter(item => item.priority === "extra").length);
    for (const kind of ["p-word-build", "p-picture-match"]) {
      assert.deepEqual(deck.slideIndex.filter(item => item.cls === kind).map(item => slides[item.index].priority),
        ["core", "extra", "extra"]);
    }
    assert.equal(reading.filter(item => item.reread && item.priority === "extra").length, 2);
  }
});

test("explicit timing allowances update the estimates while preserving the nominal target", () => {
  const options = { day: "friday", planningBudgetMinutes: 25, timingAllowances: { responseSeconds: 15, transitionSeconds: 0 } };
  const deck = buildCyclePresentation("cycle-19", options);
  const { slides, timing } = deck.manifest;
  assert.equal(timing.nominalBudgetMinutes, 30);
  assert.equal(timing.budgetMinutes, 25);
  assert.equal(timing.transitionSeconds, 0);
  assert.equal(timing.estimatedMinutes, Math.round(slides.reduce((turns, item) => turns + item.responseTurns, 0) * 15 / 6) / 10);
  assert.deepEqual(presentationLessonTiming("cycle-19", options.day, options), timing);
});
