import assert from "node:assert/strict";
import test from "node:test";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import { questions } from "../../src/data/v3/banks/antonyms_synonyms.v3.generated.js";

const byId = id => questions.find(item => item.id === id);

test("antonym and synonym distractors stay plausible and relation-focused", () => {
  const sittingSize = skillBlueprints.antonyms_synonyms.sitting;
  for (const level of [1, 2]) {
    for (const phase of [1, 2]) {
      const eligible = questions.filter(item => item.level === level && item.phase === phase && !item.retentionOnly);
      assert.ok(eligible.length >= 2 * sittingSize, `L${level} P${phase}: enough questions for a complete fresh retry`);
    }
  }

  questions.forEach(item => {
    const rationales = Object.values(item.distractorRationales || {});
    assert.equal(rationales.includes("D-SEMANTIC"), false, item.id);
    assert.equal(rationales.includes("D-SAME-DOMAIN"), true, item.id);
  });

  const genericColourFillers = new Set(["blue", "brown", "green", "orange", "pink", "red", "tan"]);
  questions.forEach(item => {
    item.choices.forEach(choice => {
      const relationWords = choice.toLowerCase().split(/\s+—\s+/).map(word => word.trim());
      relationWords.forEach(word => {
        assert.equal(genericColourFillers.has(word), false, `${item.id}: ${choice}`);
      });
    });
  });
});

test("the reported concrete examples no longer expose the key through a random option", () => {
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.A.antonym_concrete.v1").choices),
    new Set(["hot — heated", "hot — cold", "hot — scorching", "hot — warm"])
  );
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.B.antonym_concrete.v2").choices),
    new Set(["big — small", "big — huge", "big — tall", "big — high"])
  );
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.C.antonym_concrete.v3").choices),
    new Set(["up — down", "up — high", "up — over", "up — top"])
  );
});

test("image-choice targets never reuse the keyed answer image", () => {
  questions.filter(item => item.imageCards?.length).forEach(item => {
    const keyCard = item.imageCards.find(card => card.value === item.answer);
    assert.ok(keyCard, item.id);
    assert.notEqual(item.targetImagePath, keyCard.imagePath, item.id);
  });
});
