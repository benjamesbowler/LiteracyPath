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

test("theme world matches the quest map's land bands (1-9 meadow, 10-18 dino, 19-27 moonwood)", () => {
  const expect = { 1: "meadow", 3: "meadow", 4: "meadow", 6: "meadow", 7: "meadow", 9: "meadow", 10: "dino", 13: "dino", 16: "dino", 18: "dino", 19: "moonwood", 22: "moonwood", 25: "moonwood", 27: "moonwood" };
  for (const [cycle, id] of Object.entries(expect)) {
    assert.equal(themeWorldForCycle(Number(cycle)).id, id, `cycle ${cycle} should be ${id}`);
  }
});

// Guard against re-introducing the poem/map land mismatch: every poem's cast
// must belong to the land the quest map places that cycle in.
// Character names unique to one land (Bouncy/Grumpy/Shy exist in two casts,
// and Sleepy/Tiny double as ordinary adjectives - all excluded). Used both to
// demand a home-land star and to catch strays.
const UNIQUE_CAST = {
  meadow: ["muddy", "woolly", "clucky", "speedy", "noisy", "giggly", "splashy", "cuddly"],
  dino: ["chompy", "sunny", "dozy", "zippy", "honky", "wiggly", "cheeky", "bossy", "clumsy", "sneezy", "flappy"],
  moonwood: ["pip", "fern", "glimmer", "wren", "spark", "luna", "dewdrop", "stone"]
};
const HOME_WORDS = {
  meadow: ["meadow pals", "farm", "barn", "duck pond", "haystack"],
  dino: ["dino", "hollow", "fossil creek", "volcano", "valley"],
  moonwood: ["moonwood", "great oak", "crystal stream", "whispering meadow"]
};

test("every poem stars characters from its own land and none from another", () => {
  for (const poem of EL_CYCLE_POEMS) {
    const world = themeWorldForCycle(poem.cycle).id;
    const text = poem.lines.join(" ").toLowerCase();
    const hasHome = UNIQUE_CAST[world].some(name => new RegExp(`\\b${name}\\b`).test(text)) ||
      HOME_WORDS[world].some(term => text.includes(term));
    assert.ok(hasHome, `cycle ${poem.cycle}: poem has no ${world} character or setting`);
    for (const [otherWorld, names] of Object.entries(UNIQUE_CAST)) {
      if (otherWorld === world) continue;
      const strays = names.filter(name => new RegExp(`\\b${name}\\b`).test(text));
      assert.deepEqual(strays, [], `cycle ${poem.cycle} (${world}): mentions ${otherWorld} names: ${strays.join(", ")}`);
    }
  }
});
