import test from "node:test";
import assert from "node:assert/strict";
import { defaultCreature } from "../../src/data/creatureParts.js";
import { QUEST_CREATURE_JOINTS, questCreatureRigSpec } from "../../src/utils/questCreature3D.js";

test("the quest avatar contract preserves every customised creature slot", () => {
  const creature = {
    ...defaultCreature(),
    body: "moth",
    dye: "ember",
    pattern: "pattern-stars",
    eyes: "eyes-three",
    mouth: "mouth-beak",
    crest: "crest-antenna",
    tail: "tail-fan",
    feet: "feet-webbed",
    equipped: {
      head: "leaf-cap",
      back: "moth-wings",
      neck: "vine-scarf",
      held: "stone-staff"
    }
  };
  const spec = questCreatureRigSpec(creature);
  Object.values(spec.appearance).forEach(part => assert.ok(spec.visibleParts.includes(part)));
  Object.values(spec.equipment).forEach(part => assert.ok(spec.visibleParts.includes(part)));
  assert.equal(spec.visibleParts.length, 12);
  assert.deepEqual(spec.joints, [...QUEST_CREATURE_JOINTS]);
});

test("a creature's 3D signature changes with its appearance and cumulative gear", () => {
  const base = defaultCreature();
  const dressed = questCreatureRigSpec({
    ...base,
    equipped: { head: "leaf-cap", back: "moth-wings", neck: "vine-scarf", held: "stone-staff" }
  });
  const changedBody = questCreatureRigSpec({
    ...base,
    body: "boulder",
    equipped: { head: "leaf-cap", back: "moth-wings", neck: "vine-scarf", held: "stone-staff" }
  });
  assert.notEqual(dressed.signature, questCreatureRigSpec(base).signature);
  assert.notEqual(dressed.signature, changedBody.signature);
  assert.match(dressed.signature, /head:leaf-cap/);
  assert.match(dressed.signature, /back:moth-wings/);
  assert.match(dressed.signature, /neck:vine-scarf/);
  assert.match(dressed.signature, /held:stone-staff/);
});
