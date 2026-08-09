import assert from "node:assert/strict";
import test from "node:test";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { PRODUCT_CATALOG_FACTS } from "../../src/data/productCatalogFacts.js";

test("public catalogue figures match the authoritative product datasets", () => {
  const numberedSkillCycles = elSkillsBlockCycles.filter(cycle => (
    Number.isInteger(cycle.cycleNumber)
    && cycle.cycleNumber >= 1
    && cycle.cycleNumber <= 27
  ));
  const liveLearningGames = GAME_LIST.filter(game => !game.hidden);

  assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingBooks, guidedReadingBooks.length);
  assert.equal(PRODUCT_CATALOG_FACTS.skillCycles, numberedSkillCycles.length);
  assert.equal(PRODUCT_CATALOG_FACTS.learningGames, liveLearningGames.length);
});
