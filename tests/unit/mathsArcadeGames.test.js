import assert from "node:assert/strict";
import test from "node:test";

import { createMathsGameSession, mathsGames } from "../../src/maths/games/mathsGames.js";
import {
  buildCountCarryLayout,
  buildGlimpseLayout,
  countCarryResponseEvidence,
  glimpsePatternNames,
  glimpseResponseEvidence
} from "../../src/maths/games/mathsArcadeLayouts.js";

test("the five Arcade worlds expose genuinely distinct play loops", () => {
  assert.equal(mathsGames.length, 5);
  assert.equal(new Set(mathsGames.map(game => game.genre)).size, mathsGames.length);
  for (const game of mathsGames) {
    assert.ok(game.genre.length > 18, `${game.id} needs a descriptive genre`);
    assert.ok(game.playLoop.length > 70, `${game.id} needs an explicit mathematical play loop`);
  }
});

test("Number Trail choices never make the answer the only number absent from the path", () => {
  for (let seedIndex = 0; seedIndex < 100; seedIndex += 1) {
    const session = createMathsGameSession("number-trail", `choice-audit-${seedIndex}`);
    for (const item of session.items) {
      const visible = new Set(item.model.sequence.filter(Number.isFinite));
      assert.equal(visible.has(item.target), false, `${item.id} shows its missing number`);
      assert.ok(
        item.options.filter(value => value !== item.target).every(value => !visible.has(value)),
        `${item.id} makes the answer obvious by repeating every distractor in the path`
      );
    }
  }
});

test("every Glimpse pattern has count-aware geometry and saves exactly what was rendered", () => {
  for (let total = 1; total <= 5; total += 1) {
    const parts = total <= 2 ? [total, 0] : [2, total - 2];
    const layouts = glimpsePatternNames.map(pattern => buildGlimpseLayout({ capacity: 5, parts, pattern, total }));
    const geometryOnly = layouts.map(layout => layout.slots.map(({ group, occupied, x, y }) => `${occupied}:${x},${y},${group}`).join("|"));
    assert.equal(new Set(geometryOnly).size, 4, `quantity ${total} repeats a Glimpse geometry`);

    for (const layout of layouts) {
      assert.equal(layout.slots.filter(slot => slot.occupied).length, total, `${layout.pattern} does not show ${total}`);
      assert.ok(layout.slots.every(slot => slot.x >= 0 && slot.x <= 100 && slot.y >= 0 && slot.y <= 100));
      assert.match(layout.accessibleDescription, new RegExp(`^${total} glowbugs`));
      const evidence = glimpseResponseEvidence(layout, { accessMode: "untimed_counting", optionSlot: 2 });
      assert.equal(evidence.renderedPattern, layout.pattern);
      assert.equal(evidence.layoutSignature, layout.signature);
      assert.deepEqual(evidence.parts, layout.parts);
      assert.deepEqual(evidence.renderedSlots, layout.slots);
    }
  }
});

test("Count and Carry plans consume authored rows and save truthful plan geometry", () => {
  for (let seedIndex = 0; seedIndex < 40; seedIndex += 1) {
    const session = createMathsGameSession("count-and-carry", `layout-audit-${seedIndex}`);
    for (const round of session.items) {
      const alternatePlan = round.model.total > 10 ? "ten_and_more" : "make_row";
      const meadow = buildCountCarryLayout({ selectedPlan: "move_once", ...round.model });
      const organised = buildCountCarryLayout({ selectedPlan: alternatePlan, ...round.model });
      for (const layout of [meadow, organised]) {
        assert.deepEqual(layout.layoutRows, round.model.rows, `${round.id} ignores its authored rows`);
        assert.equal(layout.layoutRows.reduce((sum, value) => sum + value, 0), round.model.total);
        assert.equal(layout.groups.flatMap(group => group.itemIndexes).length, round.model.total);
        const movedItemIndexes = Array.from({ length: round.model.total }, (_, index) => index);
        const evidence = countCarryResponseEvidence(layout, { movedItemIndexes, optionSlot: 1, options: round.options });
        assert.equal(evidence.selectedPlan, layout.selectedPlan);
        assert.equal(evidence.layoutMode, layout.layoutMode);
        assert.deepEqual(evidence.layoutRows, layout.layoutRows);
        assert.deepEqual(evidence.movedItemIndexes, movedItemIndexes);
      }
      assert.notEqual(meadow.layoutMode, organised.layoutMode, `${round.id} plans do not alter the rendered layout mode`);
      if (round.model.total > 10) assert.deepEqual(organised.layoutRows, [10, round.model.total - 10]);
    }
  }
});
