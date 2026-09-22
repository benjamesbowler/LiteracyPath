import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { expandBank, makeImageResolver, checkFreshRetry, independentLengthShortcuts, ROOT } from "../../tools/assessmentRebuild/lib.mjs";
import { skillBlueprints, PHASE_PASS_RULE } from "../../src/content/blueprints/skillBlueprints.js";

const skills = ["nouns", "verbs", "adjectives", "prepositions_of_place", "plurals", "prefixes_suffixes", "antonyms_synonyms", "homophones_homonyms"];
const sources = Object.fromEntries(await Promise.all(skills.map(async skill => [
  skill, (await import(`../../tools/assessmentRebuild/authoring/${skill}.mjs`)).default
])));
const fallback = makeImageResolver();
const banks = Object.fromEntries(skills.map(skill => [skill,
  expandBank(sources[skill], skillBlueprints[skill], sources[skill].imageResolver || fallback)
]));

test("every grammar phase has two complete, different formal sittings without borrowing retention", () => {
  for (const skill of skills) {
    const result = checkFreshRetry(banks[skill], skillBlueprints[skill]);
    assert.equal(result.pass, true, `${skill}: ${JSON.stringify(result.phases)}`);
  }
});

test("neither answer length nor sentence length alone can pass any grammar phase", () => {
  for (const skill of skills) {
    for (const result of independentLengthShortcuts(banks[skill])) {
      assert.ok(result.expectedAccuracy < PHASE_PASS_RULE.accuracyMin,
        `${skill} L${result.level} P${result.phase}: ${result.strategy} = ${result.expectedAccuracy}`);
    }
  }
});

test("noun-count completion choices have equal overlap with their sentence", () => {
  const phrases = banks.nouns.filter(item => item.itemKey === "noun_two_step" && item.sentence);
  assert.ok(phrases.length >= 6);
  for (const item of phrases) {
    assert.equal((item.sentence.match(/___/g) || []).length, 1, item.id);
    const evidence = new Set(item.sentence.toLowerCase().match(/[a-z]+/g));
    const overlaps = item.choices.map(choice => choice.toLowerCase().match(/[a-z]+/g).filter(word => evidence.has(word)).length);
    assert.equal(new Set(overlaps).size, 1, `${item.id}: ${overlaps}`);
  }
  for (const result of independentLengthShortcuts(phrases)) {
    assert.ok(result.expectedAccuracy < PHASE_PASS_RULE.accuracyMin, JSON.stringify(result));
  }
});

test("choosing the second-longest sentence cannot pass the noun-count item family", () => {
  const sentences = banks.nouns.filter(item => item.itemKey === "noun_two_step" && !item.sentence);
  for (const result of independentLengthShortcuts(sentences)) {
    assert.ok(result.expectedAccuracy < PHASE_PASS_RULE.accuracyMin, JSON.stringify(result));
  }
});

test("every location question has its actual scoring scene and cannot speak its answer-bearing filename", () => {
  for (const [index, item] of banks.prepositions_of_place.entries()) {
    const source = sources.prepositions_of_place;
    assert.equal(item.imagePath, source.imageResolver(source.items[index].img), item.id);
    assert.equal(item.suppressStimulusAudio, true, item.id);
    assert.equal(item.mediaTier, "image-required", item.id);
    assert.ok(item.imagePath, item.id);
    assert.ok(fs.existsSync(path.join(ROOT, "public", item.imagePath)), `${item.id}: ${item.imagePath}`);
    assert.ok(item.imageAlt && !/look at (?:the )?scene|_/.test(item.imageAlt), item.id);
  }
});

test("plural picture questions cannot say the plural answer as a target word", () => {
  for (const item of banks.plurals.filter(item => item.formatType === "PLURAL_IMAGE_SPELLING")) {
    assert.equal(item.suppressStimulusAudio, true, item.id);
  }
});

test("action identification presents completed sentences with the actual words to classify", () => {
  for (const item of banks.verbs.filter(item => item.formatType === "GRAMMAR_WORD_CHOICE")) {
    assert.doesNotMatch(item.sentence, /___/, item.id);
    const words = new Set(item.sentence.toLowerCase().match(/[a-z]+/g));
    assert.ok(item.choices.every(choice => words.has(choice.toLowerCase())), item.id);
  }
});

test("homophone items that contrast present and past spellings explicitly supply time", () => {
  const tensePairs = [["ate", "eat"], ["blew", "blows"], ["knew", "know"]];
  for (const item of banks.homophones_homonyms) {
    const choices = item.choices.map(choice => choice.toLowerCase());
    if (!tensePairs.some(pair => pair.every(word => choices.includes(word)))) continue;
    const pastKey = tensePairs.some(([past]) => past === item.answer.toLowerCase());
    assert.match(item.prompt, pastKey ? /yesterday|last night|last year|in the past/i : /now|today|at present/i, item.id);
  }
});

test("homonym exposure follows the existing blueprint rather than supplying homophone mastery evidence", () => {
  const blueprint = skillBlueprints.homophones_homonyms;
  const nonGating = new Set(blueprint.nonGatingUnits);
  for (const item of banks.homophones_homonyms) {
    assert.equal(Boolean(item.nonGating), nonGating.has(item.itemKey), item.id);
  }
});
