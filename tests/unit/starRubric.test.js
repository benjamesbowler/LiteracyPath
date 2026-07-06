import test from "node:test";
import assert from "node:assert/strict";
import { starRubric } from "../../src/utils/starRubric.js";

test("achieving nothing earns ZERO stars (so no undeserved gem)", () => {
  assert.equal(starRubric({ correct: 0, total: 12, mistakes: 3 }), 0);
  assert.equal(starRubric({ correct: 0, total: 0 }), 0);
});

test("clean accurate run = 3 stars; within the ~1-per-10 slip budget still 3", () => {
  assert.equal(starRubric({ correct: 20, total: 20, mistakes: 0, deaths: 0 }), 3);
  assert.equal(starRubric({ correct: 20, total: 20, mistakes: 2, deaths: 0 }), 3);
  assert.equal(starRubric({ correct: 19, total: 20, mistakes: 0 }), 3); // 95%
});

test("good-not-perfect = 2 stars", () => {
  assert.equal(starRubric({ correct: 15, total: 20, mistakes: 5 }), 2); // 75%
  assert.equal(starRubric({ correct: 14, total: 20, mistakes: 0 }), 2); // 70%
});

test("finishing with low accuracy = 1 star (not 0, not inflated)", () => {
  assert.equal(starRubric({ correct: 5, total: 20, mistakes: 12 }), 1);
});

test("any death caps you below 3 stars", () => {
  assert.equal(starRubric({ correct: 20, total: 20, mistakes: 0, deaths: 1 }), 2);
});
