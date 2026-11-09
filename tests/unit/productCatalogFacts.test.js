import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { GUIDED_READING_BRIDGE_BOOKS } from "../../src/data/guidedReadingBridgeBooks.js";
import { guidedReadingBooks } from "../../src/data/guidedReadingBooks.js";
import { GAME_LIST } from "../../src/data/learnGamesData.js";
import { PRODUCT_CATALOG_FACTS } from "../../src/data/productCatalogFacts.js";
import worldDiscoveryCohortManifest from "../../src/content/world-discovery/cohorts.json" with { type: "json" };

test("public catalogue figures match the authoritative product datasets", () => {
  const numberedSkillCycles = elSkillsBlockCycles.filter(cycle => (
    Number.isInteger(cycle.cycleNumber)
    && cycle.cycleNumber >= 1
    && cycle.cycleNumber <= 27
  ));
  const liveLearningGames = GAME_LIST.filter(game => !game.hidden);
  const cohort = worldDiscoveryCohortManifest.cohorts.find(row => row.id === "21-30");
  assert.equal(cohort.expectedBooks, 50);
  const additionIds = new Set("abcde".split("").flatMap(level => (
    Array.from({ length: 10 }, (_, index) => `world-discovery-${level}-${21 + index}`)
  )));
  const additions = guidedReadingBooks.filter(book => additionIds.has(book.id));
  assert.equal(guidedReadingBooks.filter(book => !additionIds.has(book.id)).length, 397);
  assert.deepEqual(new Set(additions.map(book => book.id)), cohort.active ? additionIds : new Set());
  assert.equal(additions.length, cohort.active ? 50 : 0);

  assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingBooks, guidedReadingBooks.length);
  assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingBooks, 397 + (cohort.active ? 50 : 0));
  assert.equal(PRODUCT_CATALOG_FACTS.guidedReadingQuizzes, undefined);
  assert.equal(GUIDED_READING_BRIDGE_BOOKS.length, 20);
  assert.equal(
    guidedReadingBooks.filter(book => book.collection === "Willow Street Readers").length,
    20
  );
  assert.equal(PRODUCT_CATALOG_FACTS.skillCycles, numberedSkillCycles.length);
  assert.equal(PRODUCT_CATALOG_FACTS.learningGames, liveLearningGames.length);
});

test("live authority has no frozen 206-book or three-question Guided Reading promise", () => {
  const liveAuthority = [
    "../../src/data/productCatalogFacts.js",
    "../../tools/verifyDatabasePoliciesLive.mjs",
    "../../docs/product/FREE_TIER_SPEC.md",
    "../../docs/guided-reading/INDEX.md",
    "../../docs/guided-reading/guided_reading_story_bible_content_audit_2026-08-01.md",
    "../../docs/instructional/instructional_standards.md",
    "../../docs/research/EXPERT_REVIEW_PROTOCOL.md"
  ].map(relativePath => readFileSync(new URL(relativePath, import.meta.url), "utf8")).join("\n");

  assert.doesNotMatch(liveAuthority, /guided reading books\s*\|\s*206|exact approved 206-book catalogue|active books:\s*\*\*206/iu);
  assert.doesNotMatch(liveAuthority, /exactly three questions|three comprehension questions|every guided reading book.{0,80}three questions/isu);
});
