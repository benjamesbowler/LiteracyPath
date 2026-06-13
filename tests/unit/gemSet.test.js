import test from "node:test";
import assert from "node:assert/strict";
import { GEM_SET, gemForIndex } from "../../src/data/gemSet.js";

test("gemForIndex returns a valid gem for index 0", () => {
  const gem = gemForIndex(0);
  assert.ok(gem.id && gem.name && gem.color);
  assert.equal(gem, GEM_SET[0]);
});

test("gemForIndex wraps around the set", () => {
  assert.equal(gemForIndex(GEM_SET.length), GEM_SET[0]);
  assert.equal(gemForIndex(GEM_SET.length + 2), GEM_SET[2]);
});

test("gemForIndex handles negative indices", () => {
  assert.equal(gemForIndex(-1), GEM_SET[1 % GEM_SET.length]);
  assert.ok(gemForIndex(-99).id);
});
