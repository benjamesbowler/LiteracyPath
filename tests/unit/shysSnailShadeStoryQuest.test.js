import assert from "node:assert/strict";
import test from "node:test";

import { storyQuests } from "../../src/data/storyQuests.js";

const QUEST_ID = "dp_ra_b_05_shys_snail_shade";
const quest = storyQuests.find(candidate => candidate.id === QUEST_ID);
const byId = new Map((quest?.pages || []).map(page => [page.id, page]));
const failures = new Set(["p02_leaf_failure", "p02_twig_failure"]);
const expectedEndings = new Set([
  "p06_log_ending",
  "p06_fern_ending"
]);

function completeRoutes() {
  const routes = [];

  function walk(pageId, route, seen) {
    const page = byId.get(pageId);
    assert.ok(page, `missing route page ${pageId}`);
    assert.equal(seen.has(pageId), false, `narrative loop reaches ${pageId}`);

    const nextRoute = [...route, pageId];
    const nextSeen = new Set(seen).add(pageId);
    for (const choice of page.choices || []) {
      if (choice.nextPageId === "end") {
        routes.push(nextRoute);
      } else if (choice.label !== "Read again") {
        walk(choice.nextPageId, nextRoute, nextSeen);
      }
    }
  }

  walk(quest.startPageId, [], new Set());
  return routes;
}

test("Shy's Snail Shade is registered with collision-free identity and media", () => {
  assert.ok(quest);
  assert.equal(quest.level, "B");
  assert.equal(quest.series, "Dino Pals");
  assert.equal(quest.mediaFolder, "shy-snail-shade");
  assert.equal(quest.pages.length, 12);
  assert.equal(
    storyQuests.filter(candidate => candidate.id === QUEST_ID).length,
    1
  );
  assert.equal(
    storyQuests.filter(candidate => candidate.mediaFolder === quest.mediaFolder).length,
    1
  );
});

test("every snail-trail route resolves its failed support with a continuous material path", () => {
  const routes = completeRoutes();
  assert.equal(routes.length, 4);

  const reachedEndings = new Set();
  for (const route of routes) {
    assert.ok(route.length >= 6 && route.length <= 7, route.join(" -> "));
    assert.equal(route.filter(pageId => failures.has(pageId)).length, 1, route.join(" -> "));
    assert.equal(route[0], "p01_start");
    assert.ok(expectedEndings.has(route.at(-1)), route.join(" -> "));
    reachedEndings.add(route.at(-1));
  }

  assert.deepEqual(reachedEndings, expectedEndings);
});

test("bark stays bark and moss stays moss through the matching shelter", () => {
  assert.deepEqual(
    byId.get("p01_start").choices.map(choice => choice.nextPageId),
    ["p02_leaf_failure", "p02_twig_failure"]
  );
  for (const route of completeRoutes()) {
    const bark = route.includes("p03_bark");
    assert.equal(route.some(id => id.includes(bark ? "moss" : "bark")), false);
    assert.equal(route.at(-1), bark ? "p06_log_ending" : "p06_fern_ending");
    if (!bark) {
      assert.ok(route.indexOf("p04_moss_dots") < route.indexOf("p04_moss_strip"));
      assert.match(byId.get("p04_moss_strip").text.join(" "), /fills the gap/i);
    }
  }
  assert.match(byId.get("p02_leaf_failure").text.join(" "), /leaf tips/i);
});

test("every declared snail-shade target word can be recorded on a visited page", () => {
  const tags = new Set(
    quest.pages.flatMap(page => page.skillTags || []).map(tag => String(tag).toLowerCase())
  );
  for (const word of quest.targetWords) {
    assert.ok(tags.has(word.toLowerCase()), `missing skill tag for ${word}`);
  }
});
