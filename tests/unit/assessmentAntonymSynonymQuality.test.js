import assert from "node:assert/strict";
import test from "node:test";

import { questions } from "../../src/data/v3/banks/antonyms_synonyms.v3.generated.js";

const byId = id => questions.find(item => item.id === id);

test("antonym and synonym distractors stay plausible and relation-focused", () => {
  assert.equal(questions.length, 60);

  questions.forEach(item => {
    const rationales = Object.values(item.distractorRationales || {});
    assert.equal(rationales.includes("D-SEMANTIC"), false, item.id);
    assert.equal(rationales.includes("D-SAME-DOMAIN"), true, item.id);
  });

  const genericColourFillers = new Set(["blue", "brown", "green", "orange", "pink", "red", "tan"]);
  questions.forEach(item => {
    item.choices.forEach(choice => {
      assert.equal(genericColourFillers.has(choice), false, `${item.id}: ${choice}`);
    });
  });
});

test("the reported concrete examples no longer expose the key through a random option", () => {
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.A.antonym_concrete.v1").choices),
    new Set(["cold", "boiling", "wet", "warm"])
  );
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.B.antonym_concrete.v2").choices),
    new Set(["small", "huge", "tall", "high"])
  );
  assert.deepEqual(
    new Set(byId("lp3.antonyms_synonyms.l1.C.antonym_concrete.v3").choices),
    new Set(["down", "high", "under", "top"])
  );
});

test("image-choice targets never reuse the keyed answer image", () => {
  questions.filter(item => item.imageCards?.length).forEach(item => {
    const keyCard = item.imageCards.find(card => card.value === item.answer);
    assert.ok(keyCard, item.id);
    assert.notEqual(item.targetImagePath, keyCard.imagePath, item.id);
  });
});
