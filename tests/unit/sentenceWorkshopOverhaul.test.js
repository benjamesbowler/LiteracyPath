import test from "node:test";
import assert from "node:assert/strict";
import { SENTENCES, SENTENCE_FIX } from "../../src/data/learnGamesData.js";
import { sentenceTiles } from "../../src/utils/recognitionPractice.js";
import { buildSortRounds } from "../../src/utils/adventureRounds.js";
import { gameRandom } from "../../src/utils/gameReplay.js";
import { existsSync } from "node:fs";
import { getLedaInstructionAudioPath } from "../../src/data/ledaProductionAudio.js";
import { buildFactoryOuting, buildRecordedHopOuting, factoryChoiceRule, factoryRetryFeedback, hopLearningTask, nextHopWords, repairFeedback, repairLearningTask, repairMeaningClue, repairPieces, repairReplayText } from "../../src/components/learn/games/games/sentenceWorkshopModel.js";
import { learningChoiceSignature, learningStimulusSignature } from "../../src/utils/learningResponseState.js";

test("every sentence in every tier has three distinguishable word-order choices without duplicate copies", () => {
  const positions = new Set();
  for (const sentences of Object.values(SENTENCES)) for (const sentence of sentences) {
    const tiles = sentenceTiles(sentence);
    for (let index = 0; index < tiles.length; index += 1) for (const seed of [1, 37, 913, 4051]) {
      const choices = nextHopWords(sentence, index, seed);
      assert.equal(choices.length, 3, sentence);
      assert.equal(new Set(choices).size, choices.length, sentence);
      assert.equal(choices.filter(word => word === tiles[index].word).length, 1);
      assert.ok(choices.every(word => tiles.some(tile => tile.word === word)));
      positions.add(choices.indexOf(tiles[index].word));
      assert.deepEqual(choices, nextHopWords(sentence, index, seed));
    }
    assert.deepEqual(nextHopWords(sentence, tiles.length, 1), []);
  }
  assert.deepEqual(positions, new Set([0, 1, 2]));
});

test("repeated a and and are valid next-word choices, never competing later physical copies", () => {
  const sentence = "Mum and I bake a cake.";
  assert.equal(nextHopWords(sentence, 4, 2).filter(word => word === "a").length, 1);
  const repeated = "A cat and a dog and a pig.";
  for (const index of [3, 6]) assert.equal(nextHopWords(repeated, index, 2).filter(word => word === "a").length, 1);
});

test("all authored repairs retain every accepted alternative and restore old object-shaped tool snapshots", () => {
  for (const fixes of Object.values(SENTENCE_FIX)) for (const fix of fixes) {
    for (const seed of [4, 50]) {
      const pieces = repairPieces(fix, seed);
      assert.deepEqual(new Set(pieces), new Set(fix.options));
      for (const accepted of fix.acceptedAnswers || [fix.answer]) assert.ok(pieces.includes(accepted));
      const oldSnapshot = pieces.map((label, index) => ({ id: `repair-${index}`, label }));
      assert.deepEqual(repairPieces(fix, seed, oldSnapshot), pieces);
      assert.deepEqual(repairPieces(fix, seed, ["broken", "broken", "broken"]), pieces);
    }
  }
});

test("feedback explains question, telling and strong-feeling marks using the actual intent", () => {
  for (const fixes of Object.values(SENTENCE_FIX)) for (const fix of fixes.filter(item => item.kind === "end")) {
    const feedback = repairFeedback(fix, fix.options.find(piece => piece !== fix.answer), false);
    assert.match(feedback, fix.answer === "?" ? /asks a question/ : fix.answer === "!" ? /strong feeling/ : /calm telling sentence/);
    assert.match(repairFeedback(fix, fix.answer, true), fix.answer === "?" ? /question mark/ : fix.answer === "!" ? /exclamation mark/ : /full stop/);
  }
});

test("semantic retry quotes the actual wrong sentence and disambiguates the fox container", () => {
  const fox = SENTENCE_FIX.easy.find(fix => fix.answer === "box");
  assert.match(repairMeaningClue(fox), /cardboard container/);
  assert.match(repairFeedback(fox, "bus", false), /The fox sat in the bus/);
  assert.match(repairFeedback(fox, "bus", false), /does not match our story/);
  const wizard = SENTENCE_FIX.hard.find(fix => fix.acceptedAnswers);
  assert.match(repairFeedback(wizard, "her", true), /her/);
  assert.doesNotMatch(repairFeedback(wizard, "her", true), /his/);
});

test("all three factory tiers restore seeded content with one longest-prefix chute per parcel", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const sort = buildSortRounds(difficulty, gameRandom(719));
    assert.deepEqual(sort, buildSortRounds(difficulty, gameRandom(719)));
    assert.notDeepEqual(sort, buildSortRounds(difficulty, gameRandom(720)));
    for (const item of sort.items) {
      const matching = [item.binA, item.binB].filter(bin => item.word.startsWith(bin)).sort((a, b) => b.length - a.length);
      assert.equal(matching[0], item.bin, item.word);
      assert.ok([item.binA, item.binB].every(bin => sort.items.some(other => other.shift === item.shift && other.bin === bin)));
    }
  }
});

test("factory outings are bounded, balanced, tiered and varied across recorded seeds", () => {
  for (const [difficulty, pairs, digraphPairs] of [["easy", 4, 0], ["medium", 6, 2], ["hard", 8, 4]]) {
    const contrastSets = new Set();
    for (const seed of [9, 731, 34561, 88242]) {
      const sort = buildFactoryOuting(difficulty, gameRandom(seed));
      assert.deepEqual(sort, buildFactoryOuting(difficulty, gameRandom(seed)));
      assert.equal(sort.shifts, pairs);
      assert.equal(sort.items.length, pairs * 4);
      let complex = 0;
      const contrasts = [];
      for (let shift = 0; shift < pairs; shift += 1) {
        const items = sort.items.filter(item => item.shift === shift);
        const { binA, binB } = items[0];
        contrasts.push([binA, binB].sort().join("/"));
        if (binA.length > 1 || binB.length > 1) complex += 1;
        assert.equal(items.filter(item => item.bin === binA).length, 2);
        assert.equal(items.filter(item => item.bin === binB).length, 2);
        assert.equal(new Set(items.map(item => item.word)).size, 4);
        for (const item of items) assert.equal([binA, binB].filter(bin => item.word.startsWith(bin)).sort((a, b) => b.length - a.length)[0], item.bin);
      }
      assert.equal(complex, digraphPairs);
      contrastSets.add(contrasts.sort().join(","));
    }
    assert.ok(contrastSets.size > 1, difficulty);
  }
});

test("factory teaches longest overlapping groups without false short-prefix feedback", () => {
  for (const [word, target, short] of [["ship", "sh", "s"], ["whale", "wh", "w"], ["thin", "th", "t"], ["chin", "ch", "c"]]) {
    assert.match(factoryChoiceRule([target, short]), /both match.*longer/);
    assert.match(factoryChoiceRule([short, target]), /both match.*longer/);
    const feedback = factoryRetryFeedback(word, target, short);
    assert.match(feedback, new RegExp(`You chose ${short}`));
    assert.doesNotMatch(feedback, new RegExp(`not ${short}[. ]`));
  }
  assert.equal(factoryChoiceRule(["t", "b"]), "Tap the matching chute.");
});

test("fresh Hop outings keep tier lengths and use distinct authored whole-recorded targets and model", () => {
  for (const [difficulty, level, count] of [["easy", "level1", 9], ["medium", "level2", 9], ["hard", "level3", 7]]) {
    const authored = new Set([...SENTENCES[level], ...SENTENCE_FIX[difficulty].map(fix => fix.say)]);
    const variants = new Set();
    for (const seed of [17, 113, 957, 41716]) {
      const outing = buildRecordedHopOuting(difficulty, 10, gameRandom(seed));
      assert.deepEqual(outing, buildRecordedHopOuting(difficulty, 10, gameRandom(seed)));
      assert.equal(outing.sentences.length, count);
      assert.equal(new Set(outing.sentences).size, count);
      assert.ok(!outing.sentences.includes(outing.modelSentence));
      for (const sentence of [outing.modelSentence, ...outing.sentences]) {
        assert.ok(authored.has(sentence), sentence);
        const path = getLedaInstructionAudioPath(sentence);
        assert.ok(path, sentence);
        assert.ok(existsSync(new URL(`../../public${path}`, import.meta.url)), path);
        const words = sentenceTiles(sentence);
        for (let index = 0; index < words.length; index += 1) assert.equal(nextHopWords(sentence, index, seed).length, 3);
      }
      variants.add(JSON.stringify(outing));
    }
    assert.equal(variants.size, 4);
  }
});

test("repair replay cannot reveal an unsolved answer or voice the wrong accepted pronoun", () => {
  for (const fix of Object.values(SENTENCE_FIX).flat()) {
    assert.equal(repairReplayText(fix), fix.prompt);
    assert.notEqual(repairReplayText(fix), fix.say);
    assert.equal(repairReplayText(fix, fix.answer), fix.say);
  }
  const wizard = SENTENCE_FIX.hard.find(fix => fix.acceptedAnswers?.includes("her"));
  assert.match(repairReplayText(wizard, "her"), /her wand/);
  assert.doesNotMatch(repairReplayText(wizard, "her"), /his wand/);
  assert.equal(getLedaInstructionAudioPath(repairReplayText(wizard, "her")), "");
});

test("Hop teaching keeps a completed prefix and selects genuinely fresh future sentence content", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const state = buildRecordedHopOuting(difficulty, 10, gameRandom(8831));
    const words = sentenceTiles(state.sentences[0]).map(tile => tile.word);
    const task = hopLearningTask(state, 0, 2);
    assert.deepEqual(task.question.builtPrefix, words.slice(0, 2));
    assert.deepEqual(task.expected, words.slice(2));
    assert.ok(task.transfer);
    assert.notEqual(learningStimulusSignature(task.question), learningStimulusSignature(task.transfer.question));
    assert.notEqual(learningChoiceSignature(task.question), learningChoiceSignature(task.transfer.question));
    assert.deepEqual(task.transfer.question.builtPrefix, []);
    assert.deepEqual(task.transfer.expected, sentenceTiles(task.transfer.question.sentence).map(tile => tile.word));
    assert.equal(hopLearningTask(state, state.sentences.length - 1, 0).transfer, null);
  }
});

test("Fix teaching preserves the exact context and avoids ambiguous scalar transfer alternatives", () => {
  for (const fixes of Object.values(SENTENCE_FIX)) {
    const state = { fixes };
    for (let round = 0; round < fixes.length; round += 1) {
      const fix = fixes[round], task = repairLearningTask(state, round, repairPieces(fix, 122));
      assert.equal(task.question.instructionCue, fix.prompt);
      assert.equal(task.question.display, fix.display);
      assert.equal(task.question.storyClue, repairMeaningClue(fix));
      if (!task.transfer) continue;
      const source = fixes.find(item => item.display === task.transfer.question.display);
      assert.equal(source.kind, fix.kind);
      assert.equal((source.acceptedAnswers || [source.answer]).length, 1);
      assert.notEqual(learningStimulusSignature(task.question), learningStimulusSignature(task.transfer.question));
      assert.notEqual(learningChoiceSignature(task.question), learningChoiceSignature(task.transfer.question));
      assert.equal(task.transfer.expected, source.answer);
    }
  }
});
