import assert from "node:assert/strict";
import test from "node:test";

import { skillBlueprints } from "../../src/content/blueprints/skillBlueprints.js";
import blendsSource from "../../tools/assessmentRebuild/authoring/blends.mjs";
import cvcSource from "../../tools/assessmentRebuild/authoring/cvc_short_vowels.mjs";
import digraphsSource from "../../tools/assessmentRebuild/authoring/digraphs.mjs";
import finalSoundsSource from "../../tools/assessmentRebuild/authoring/final_sounds.mjs";
import initialSoundsSource from "../../tools/assessmentRebuild/authoring/initial_sounds.mjs";
import pluralsSource from "../../tools/assessmentRebuild/authoring/plurals.mjs";
import prefixesSuffixesSource from "../../tools/assessmentRebuild/authoring/prefixes_suffixes.mjs";
import prepositionsSource from "../../tools/assessmentRebuild/authoring/prepositions_of_place.mjs";
import rhymingSource from "../../tools/assessmentRebuild/authoring/rhyming.mjs";
import { expandBank } from "../../tools/assessmentRebuild/lib.mjs";

const sources = [
  blendsSource,
  cvcSource,
  digraphsSource,
  finalSoundsSource,
  initialSoundsSource,
  pluralsSource,
  prefixesSuffixesSource,
  prepositionsSource,
  rhymingSource
];

const expandedBySkill = Object.fromEntries(sources.map(source => [
  source.skillId,
  expandBank(source, skillBlueprints[source.skillId], source.imageResolver)
]));

const byId = (skillId, id) => {
  const item = expandedBySkill[skillId].find(candidate => candidate.id === id);
  assert.ok(item, `${id} must keep its stable assessment identity`);
  return item;
};

const hiddenCardAnswers = skillId => expandedBySkill[skillId]
  .filter(item => item.hideWrittenLabels)
  .map(item => item.answer);

test("retention prepositions measure their declared relation rather than an inverse relation", () => {
  const on = byId("prepositions_of_place", "lp3.prepositions_of_place.l1.R.on.v5r");
  assert.equal(on.answer, "on the chair");
  assert.match(on.prompt, /ball/i);

  const between = byId("prepositions_of_place", "lp3.prepositions_of_place.l1.R.between.v5r");
  assert.equal(between.answer, "between the books");
  assert.match(between.prompt, /cup/i);
});

test("morphology and plural prompts do not reveal or under-specify their answer", () => {
  const pretest = byId("prefixes_suffixes", "lp3.prefixes_suffixes.l2.B.prefix_pre.v5");
  assert.equal(pretest.answer, "before the lessons");
  assert.doesNotMatch(pretest.prompt.toLowerCase(), /before the lessons/);

  const irregular = byId("plurals", "lp3.plurals.l2.A.plural_irregular.v1");
  assert.equal(irregular.answer, "men");
  assert.match(irregular.prompt, /Three ___/);

  const wolves = byId("plurals", "lp3.plurals.l2.B.plural_f_to_ves.v2");
  assert.equal(wolves.answer, "wolves");
  assert.match(wolves.prompt, /Three ___/);
});

test("hidden-label sound cards use directly nameable referents", () => {
  const expectedAnswers = {
    "lp3.digraphs.l1.A.ph.v1": "fan",
    "lp3.digraphs.l1.B.ph.v2": "fox",
    "lp3.digraphs.l1.B.wh.v2": "watch",
    "lp3.digraphs.l2.A.wh.v4": "web",
    "lp3.initial_sounds.l2.C.g.v3": "glass",
    "lp3.initial_sounds.l2.R.g.v7r": "gate",
    "lp3.initial_sounds.l2.C.i.v3": "igloo",
    "lp3.initial_sounds.l1.C.n.v3": "nut",
    "lp3.initial_sounds.l2.C.n.v3": "net",
    "lp3.initial_sounds.l1.C.w.v3": "window",
    "lp3.rhyming.l1.A.at.v1": "hat",
    "lp3.rhyming.l1.B.op.v2": "mop",
    "lp3.rhyming.l1.C.in.v3": "pin",
    "lp3.final_sounds.l1.B.p.v2": "mop"
  };

  for (const [id, expectedAnswer] of Object.entries(expectedAnswers)) {
    const skillId = id.split(".")[1];
    const item = byId(skillId, id);
    assert.equal(item.answer, expectedAnswer, `${id} must use the audited direct referent`);
    const keyCard = item.imageCards?.find(card => card.word === expectedAnswer);
    assert.ok(keyCard?.imagePath, `${id} must resolve its answer-card image`);
  }

  const bannedBySkill = {
    digraphs: ["pheasant", "wheat"],
    initial_sounds: ["gift", "ink", "nest", "wheat"],
    rhyming: ["shop", "bin"],
    final_sounds: ["cap"]
  };
  for (const [skillId, bannedWords] of Object.entries(bannedBySkill)) {
    const usedWords = new Set(hiddenCardAnswers(skillId));
    for (const word of bannedWords) {
      assert.equal(usedWords.has(word), false, `${skillId} must not key a hidden ${word} label`);
    }
  }

  const at = byId("rhyming", "lp3.rhyming.l1.A.at.v1");
  assert.equal(new Set(at.imageCards.map(card => card.word)).has("cap"), false);
  assert.equal(new Set(at.imageCards.map(card => card.word)).has("hat"), true);
});

test("ambiguous plane, truck, and cap pictures no longer carry the scoring decision", () => {
  const plane = byId("blends", "lp3.blends.l1.B.pl.v2");
  assert.equal(plane.mediaTier, "audio-required");
  assert.equal(plane.targetWord, "plate");
  assert.equal(plane.imagePath, undefined);

  const truckBlend = byId("blends", "lp3.blends.l2.B.tr.v2");
  assert.equal(truckBlend.mediaTier, "audio-required");
  assert.equal(truckBlend.targetWord, "truck");
  assert.equal(truckBlend.imagePath, undefined);

  const initialSoundTargets = expandedBySkill.initial_sounds
    .filter(item => item.formatType === "FIRST_SOUND");
  assert.equal(initialSoundTargets.length, 107);
  for (const item of initialSoundTargets) {
    assert.equal(item.mediaTier, "image-required", `${item.id} must use picture support`);
    assert.ok(item.imagePath, `${item.id} must resolve its target picture`);
    assert.equal(item.assessmentMediaDecision?.role, "target-or-scene", `${item.id} media role`);
  }

  const cvcTargets = expandedBySkill.cvc_short_vowels.map(item => item.targetWord).filter(Boolean);
  assert.equal(cvcTargets.includes("truck"), false);
  assert.equal(byId("cvc_short_vowels", "lp3.cvc_short_vowels.l2.R.short_u.v8r").targetWord, "brush");

  const capTargetsWithPictures = expandedBySkill.final_sounds
    .filter(item => item.targetWord === "cap" && item.imagePath);
  assert.deepEqual(capTargetsWithPictures, []);
});
