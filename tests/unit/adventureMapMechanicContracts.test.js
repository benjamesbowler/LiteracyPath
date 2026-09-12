import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildStationRounds, sharesSound, stationsForCycle, taughtGraphemesThrough, onsetGrapheme, adventureWordsRhyme, ADVENTURE_WORD_BUILD_INVENTORY } from "../../src/components/elQuest/elQuestEngine.js";
import { ADVENTURE_MECHANIC_IDS } from "../../src/components/elQuest/adventureRoundModel.js";
import { elSkillsBlockCycles } from "../../src/data/elSkillsBlockCycles.js";
import { requiresCycleAudio } from "../../src/policy/cyclePracticePolicy.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const generated = cycles.flatMap(cycle => stationsForCycle(cycle).filter(station => station.id !== "check").flatMap(station =>
  buildStationRounds(cycle, station.id, { seed: `contract:${cycle.id}:${station.id}` }).map(round => ({ cycle, station, round }))));

function assertMedia(item, context) {
  assert.ok(item.image && fs.existsSync(path.join(root, "public", item.image)), `${context} has no image: ${item.word || item.image}`);
  assert.ok(item.audio && fs.existsSync(path.join(root, "public", item.audio)), `${context} has no word audio: ${item.word}`);
}

test("all 27 cycles expose the ten active child games without retired gate content", () => {
  assert.deepEqual([...new Set(generated.map(item => item.round.mechanicId))].sort(), [...ADVENTURE_MECHANIC_IDS].sort());
  for (const { cycle, station, round } of generated) {
    assert.ok(station.mechanicIds.includes(round.mechanicId), `${cycle.id}/${station.id}/${round.mechanicId}`);
    assert.ok(round.construct && round.roundKey && round.recoverable);
    assert.ok(round.prompt.split(/\s+/u).length <= 12, round.prompt);
    assert.doesNotMatch(round.prompt, /gate|magnet|grapheme|onset|study.*hide|poetry|load|tag|confirm/iu);
  }
});

test("letter matches and grids only use taught code, with real distractors", () => {
  for (const { cycle, round } of generated.filter(item => ["letterPair", "letterGrid", "soundChoice"].includes(item.round.mechanicId))) {
    const taught = taughtGraphemesThrough(cycle.cycleNumber);
    const choices = round.cells?.map(cell => cell.letter) || round.choices;
    for (const choice of choices) assert.ok(taught.includes(choice.toLowerCase()), `${cycle.id}: untaught ${choice}`);
    if (round.mechanicId === "letterGrid") {
      assert.equal(round.cells.length, 12);
      assert.ok(round.cells.some(cell => cell.matches) && round.cells.some(cell => !cell.matches));
      assert.equal(new Set(round.cells.map(cell => cell.id)).size, round.cells.length);
      for (const cell of round.cells) assert.equal(cell.matches, round.targetLetters.includes(cell.letter.toLowerCase()));
      assert.deepEqual(round.answer, round.cells.filter(cell => cell.matches).map(cell => cell.id));
      for (const target of round.targetLetters) assert.ok([target, target.toUpperCase()].every(letter => round.cells.some(cell => cell.letter === letter)));
    } else {
      assert.equal(new Set(round.choices).size, round.choices.length);
      assert.ok(round.choices.includes(round.answer));
    }
  }
  const second = buildStationRounds(cycles[1], "trace", { seed: "mixed-am" });
  assert.ok(second.some(round => round.targetLetters.length === 2 && round.targetLetters.includes("a") && round.targetLetters.includes("m")));
});

test("sound choices never mark an equivalent sound as wrong", () => {
  for (const { round } of generated.filter(item => item.round.mechanicId === "soundChoice")) {
    assert.ok(round.audio && requiresCycleAudio(round));
    for (const choice of round.choices) assert.equal(round.acceptedAnswers.includes(choice), sharesSound(choice, round.targetGrapheme));
  }
});

test("initial-sound pictures use genuine onsets and complete accessible media", () => {
  for (const { cycle, round } of generated.filter(item => ["sceneHunt", "pictureSearch"].includes(item.round.mechanicId))) {
    for (const object of round.objects) {
      assertMedia(object, `${cycle.id}/${round.mechanicId}`);
      assert.equal(object.matches, sharesSound(onsetGrapheme(object.word), round.targetGrapheme));
    }
    assert.ok(round.objects.some(item => !item.matches));
    if (round.mechanicId === "sceneHunt") assert.equal(round.objects.filter(item => item.matches).length, 1);
    else {
      assert.ok(round.objects.length >= 8);
      assert.ok(round.objects.filter(item => item.matches).length >= 2);
      assert.equal(new Set(round.objects.map(item => item.word)).size, round.objects.length);
      assert.ok(round.objects.every(item => item.x >= 8 && item.x <= 92 && item.y >= 8 && item.y <= 92));
      assert.ok(fs.existsSync(path.join(root, "public", round.sceneBackground)));
    }
  }
  const first = buildStationRounds(cycles[0], "hunt", { seed: "m-onset" });
  assert.ok(first.filter(round => round.targetGrapheme === "m").every(round => round.objects.filter(item => item.matches).every(item => item.word.startsWith("m"))));
  for (const cycleNumber of [10, 13]) {
    const cycle = cycles.find(item => item.cycleNumber === cycleNumber);
    for (let pass = 0; pass < 16; pass += 1) {
      for (const station of ["hunt", "search"]) {
        const rounds = buildStationRounds(cycle, station, { seed: `kw-decoys:${pass}` }).filter(round => sharesSound(round.targetGrapheme, "k"));
        assert.ok(rounds.length > 0);
        assert.ok(rounds.every(round => round.objects.every(item => onsetGrapheme(item.word) !== "qu")), "queen/quilt cannot be wrong /k/ choices");
      }
    }
  }
});

test("word memory has opaque card IDs and two copies of each taught sight word", () => {
  for (const { cycle, round } of generated.filter(item => item.round.mechanicId === "wordMemory")) {
    const taught = new Set(cycles.filter(item => item.cycleNumber <= cycle.cycleNumber).flatMap(item => item.highFrequencyWords || []).map(word => word.toLowerCase()));
    assert.ok(round.cards.length >= 4 && round.cards.length <= 8);
    assert.equal(new Set(round.cards.map(card => card.id)).size, round.cards.length);
    assert.ok(round.cards.every(card => /^card-\d+-\d+$/u.test(card.id)));
    for (const word of round.words) {
      assert.ok(taught.has(word.toLowerCase()), `${cycle.id}: untaught sight word ${word}`);
      if (word.toLowerCase() === "i") assert.equal(word, "I", "the pronoun must keep its standard uppercase form");
      assert.equal(round.cards.filter(card => card.word === word).length, 2);
    }
    assert.equal(round.construct, "high_frequency_word_matching");
    assert.equal(round.evidenceScope, "visual_word_matching_practice");
  }
  const first = buildStationRounds(cycles[0], "quick", { seed: "pronoun-I" });
  assert.ok(first.every(round => round.cards.filter(card => card.word === "I").length === 2));
});

test("missing-letter rounds are authored CVCs using only cycle-taught letters", () => {
  const inventory = new Map(ADVENTURE_WORD_BUILD_INVENTORY.map(item => [item.word, item]));
  for (const word of ["sat", "man", "fin", "dad", "lot", "gum", "gap", "vet"]) {
    assert.equal(inventory.has(word), false, `${word} has labelled or ambiguous target artwork`);
  }
  for (const { cycle, round } of generated.filter(item => item.round.mechanicId === "missingLetter")) {
    const entry = inventory.get(round.word);
    assert.ok(entry && entry.authorizedFromCycle <= cycle.cycleNumber);
    assert.match(round.word, /^[^aeioux][aeiou][^aeioux]$/u);
    assert.ok(round.graphemes.every(letter => taughtGraphemesThrough(cycle.cycleNumber).includes(letter)));
    assert.equal(round.answer, round.word);
    assert.equal(round.image, entry.image, "missing words must use their reviewed text-free image");
    assert.equal(round.graphemes[round.missingIndex], round.missingGrapheme);
    assert.ok([0, 2].includes(round.missingIndex));
    assert.equal(round.choices.filter(letter => sharesSound(letter, round.missingGrapheme)).length, 1);
    assertMedia(round, `${cycle.id}/missingLetter`);
  }
  assert.equal(generated.some(({ cycle, round }) => cycle.cycleNumber === 1 && round.mechanicId === "missingLetter"), false);
  const firstCvc = buildStationRounds(cycles[1], "build", { seed: "text-free-mat" });
  assert.deepEqual(firstCvc.map(round => round.word), ["mat", "mat"]);
  assert.deepEqual(firstCvc.map(round => round.missingIndex), [0, 2]);
  assert.ok(firstCvc.every(round => round.image === "/media/initial-sounds/images/m/mat.webp"));
});

test("three spoken rhyme choices contain exactly one defensible pair", () => {
  for (const { round } of generated.filter(item => ["rhymePair", "rhymeOdd"].includes(item.round.mechanicId))) {
    assert.equal(round.choices.length, 3);
    const pairs = round.choices.flatMap((word, index) => round.choices.slice(index + 1).filter(other => adventureWordsRhyme(word, other)).map(other => [word, other]));
    assert.equal(pairs.length, 1);
    assert.deepEqual(new Set(pairs[0]), new Set(round.rhymingWords));
    if (round.mechanicId === "rhymePair") assert.deepEqual(new Set(round.answer), new Set(pairs[0]));
    else {
      assert.equal(pairs[0].includes(round.answer), false);
      assert.match(round.prompt, /NOT/u);
    }
    round.objects.forEach(item => assertMedia(item, round.mechanicId));
    assert.equal(requiresCycleAudio(round), true);
  }
});

test("compound pictures have real parts and three illustrated spoken answer choices", () => {
  for (const { round } of generated.filter(item => item.round.mechanicId === "compoundPicture")) {
    assert.equal(round.parts.length, 2);
    assert.equal(round.parts.map(part => part.word).join(""), round.answer);
    assert.equal(round.choices.length, 3);
    assert.equal(new Set(round.choices).size, 3);
    [...round.parts, ...round.objects].forEach(item => assertMedia(item, "compoundPicture"));
    assert.equal(round.objects.filter(item => item.matches).length, 1);
    assert.equal(requiresCycleAudio(round), true);
  }
});

test("each new attempt rebuilds choice objects and varies correct positions", () => {
  for (const [cycleNumber, station] of [[1, "letters"], [1, "sounds"], [1, "hunt"], [2, "build"], [1, "poem"]]) {
    const cycle = cycles.find(item => item.cycleNumber === cycleNumber);
    const positions = new Set();
    for (let pass = 0; pass < 12; pass += 1) {
      const [round] = buildStationRounds(cycle, station, { seed: `positions:${pass}` });
      positions.add(round.choices.indexOf(round.missingGrapheme || round.answer));
    }
    assert.ok(positions.size > 1, `${cycleNumber}/${station} has a fixed answer slot`);
  }
  const first = buildStationRounds(cycles[0], "search", { seed: "fresh" });
  const replay = buildStationRounds(cycles[0], "search", { seed: "fresh" });
  assert.deepEqual(first, replay);
  assert.notEqual(first[0].objects, replay[0].objects);
  assert.notEqual(first[0].objects[0], replay[0].objects[0]);
});
