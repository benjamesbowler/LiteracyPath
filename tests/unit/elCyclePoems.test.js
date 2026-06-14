import test from "node:test";
import assert from "node:assert/strict";
import { EL_CYCLE_POEMS } from "../../src/data/elCyclePoems.js";
import { themeWorldForCycle } from "../../src/utils/palWorlds.js";

test("there is one poem per cycle 1-27", () => {
  const cycles = EL_CYCLE_POEMS.map(p => p.cycle).sort((a, b) => a - b);
  assert.deepEqual(cycles, Array.from({ length: 27 }, (_v, i) => i + 1));
});

test("every poem contains each of its findWords as a whole word", () => {
  for (const poem of EL_CYCLE_POEMS) {
    const text = poem.lines.join(" ").toLowerCase();
    for (const word of poem.findWords) {
      const re = new RegExp(`\\b${word.toLowerCase()}\\b`);
      assert.ok(re.test(text), `cycle ${poem.cycle}: "${word}" missing from poem text`);
    }
  }
});

test("poems are short and well-formed", () => {
  for (const poem of EL_CYCLE_POEMS) {
    assert.ok(poem.title && poem.lines.length >= 2 && poem.findWords.length >= 1, `cycle ${poem.cycle} malformed`);
  }
});

test("theme world rotates every 3 cycles (meadow, dino, moonwood, repeat)", () => {
  const expect = { 1: "meadow", 3: "meadow", 4: "dino", 6: "dino", 7: "moonwood", 9: "moonwood", 10: "meadow", 13: "dino", 16: "moonwood", 19: "meadow", 22: "dino", 25: "moonwood", 27: "moonwood" };
  for (const [cycle, id] of Object.entries(expect)) {
    assert.equal(themeWorldForCycle(Number(cycle)).id, id, `cycle ${cycle} should be ${id}`);
  }
});
