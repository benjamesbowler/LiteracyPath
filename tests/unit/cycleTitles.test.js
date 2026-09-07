import assert from "node:assert/strict";
import test from "node:test";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { cyclePickerTitle } from "../../src/utils/cycleTitles.js";

test("every selectable cycle has a content title", () => {
  const titles = elSkillsBlockCycles
    .filter(cycle => Number.isInteger(cycle.cycleNumber))
    .map(cyclePickerTitle);

  assert.equal(titles.length, 27);
  assert.deepEqual(titles, [
    "Cycle 1: Meet A and M",
    "Cycle 2: Meet T and S",
    "Cycle 3: Meet N and I",
    "Cycle 4: Meet F and D",
    "Cycle 5: Meet O and L",
    "Cycle 6: Meet R and H",
    "Cycle 7: Review letters A to H",
    "Cycle 8: B and W",
    "Cycle 9: Qu and U",
    "Cycle 10: C and G",
    "Cycle 11: P, Y, and X",
    "Cycle 12: E and V",
    "Cycle 13: K, J, and Z",
    "Cycle 14: Review letters B to Z",
    "Cycle 15: sh, ch, th",
    "Cycle 16: a and all",
    "Cycle 17: i",
    "Cycle 18: o",
    "Cycle 19: u",
    "Cycle 20: e",
    "Cycle 21: wh",
    "Cycle 22: nk",
    "Cycle 23: ng and Rime Families",
    "Cycle 24: fizzle letters",
    "Cycle 25: Review and wrap-up",
    "Cycle 26: Pattern Power",
    "Cycle 27: Poem Launch"
  ]);
});
