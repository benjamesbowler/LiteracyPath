import test from 'node:test';
import assert from 'node:assert/strict';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { FRY_WORD_FREQUENCY } from '../../src/data/fryWordFrequency.js';
import { memoryBoards } from '../../src/utils/recognitionPractice.js';
import { gameRandom } from '../../src/utils/gameReplay.js';
import { buildStationRounds } from '../../src/components/elQuest/elQuestEngine.js';
import { mergeElQuestProgress, emptyElQuestProgress } from '../../src/utils/adventureMapProgress.js';
import { WORD_MATCH_WORDS, WORD_MATCH_VERSION, WORD_MATCH_BOARD_COUNT, WORD_MATCH_EXTENSION_START,
  wordMatchBoardWords, nextWordMatchBoard, replayWordMatchBoard, adventureWordMatchOptions } from '../../src/utils/wordMatchProgression.js';

const cycles = elSkillsBlockCycles.filter(cycle => cycle.type === 'cycle');
const completedCycles = { ...emptyElQuestProgress(), cycles: Object.fromEntries(cycles.map(cycle => [cycle.id, { stars: 1 }])) };
const stepsFor = board => wordMatchBoardWords(board).map(({ word }, pair) => ({
  round: `${WORD_MATCH_VERSION}:${board}:${pair}`, target: word, correct: pair > 0
}));
const progressFor = boards => ({ games: { 'sight-word-memory': { practiceRecord: {
  completions: boards.map(board => ({ steps: stepsFor(board) }))
} } } });

test('word matching introduces all 27 cycles in curriculum order before frequency-ranked continuation', () => {
  const expected = [...new Set(cycles.flatMap(cycle => cycle.highFrequencyWords))];
  assert.deepEqual(WORD_MATCH_WORDS.filter(item => item.cycle).map(item => item.word), expected);
  assert.equal(expected.length, 68);
  assert.deepEqual(wordMatchBoardWords(0).map(item => item.word), ['am', 'I', 'a', 'the']);
  assert.deepEqual(wordMatchBoardWords(WORD_MATCH_EXTENSION_START).map(item => item.word), ['in', 'it', 'on', 'at']);
  const ranks = WORD_MATCH_WORDS.filter(item => !item.cycle).map(item => FRY_WORD_FREQUENCY.indexOf(item.word.toLowerCase()));
  assert.ok(ranks.every((rank, index) => rank >= 0 && (!index || rank > ranks[index - 1])));
  assert.equal(new Set(WORD_MATCH_WORDS.map(item => item.word)).size, WORD_MATCH_WORDS.length);
});

test('every matching board has exactly four distinct word pairs, including the last and replay boards', () => {
  for (let index = 0; index <= WORD_MATCH_BOARD_COUNT; index += 1) {
    const words = wordMatchBoardWords(index);
    assert.equal(words.length, 4);
    assert.equal(new Set(words.map(item => item.word)).size, 4);
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const board = memoryBoards(difficulty, gameRandom(12), index).boards[0];
      assert.equal(board.length, 8);
      for (const { word } of words) assert.equal(board.filter(card => card.word === word).length, 2);
    }
  }
  for (const invalid of [NaN, Infinity, -1, 'bad']) assert.deepEqual(wordMatchBoardWords(invalid), wordMatchBoardWords(0));
});

test('completed receipts advance the word sequence without allowing replay, legacy play or synced gaps to skip words', () => {
  assert.equal(nextWordMatchBoard(progressFor([0, 1, 1, 2])), 3);
  assert.equal(nextWordMatchBoard(progressFor([0, 2])), 1);
  const missingPair = progressFor([0]);
  missingPair.games['sight-word-memory'].practiceRecord.completions[0].steps.pop();
  assert.equal(nextWordMatchBoard(missingPair), 0);
  const legacy = progressFor([0]);
  legacy.games['sight-word-memory'].practiceRecord.completions[0].steps[0].round = 'pair-0';
  assert.equal(nextWordMatchBoard(legacy), 0);
  assert.equal(replayWordMatchBoard({ firstResponses: [...stepsFor(8), ...stepsFor(9)] }), 8);
});

test('all Adventure Map cycles retain ordered word practice and eight matching cards', () => {
  for (const cycle of cycles) {
    const station = cycle.cycleNumber < 25 ? 'quick' : 'spell';
    const rounds = buildStationRounds(cycle, station, { seed: 'cycle-word-order' });
    const recognition = rounds.filter(round => round.mechanicId === 'sightWordChoice');
    const half = recognition.length / 2;
    const ranks = recognition.slice(0, half).map(round => WORD_MATCH_WORDS.findIndex(item => item.word === round.targetWord));
    assert.ok(ranks.every((rank, index) => !index || rank > ranks[index - 1]));
    assert.deepEqual(recognition.slice(half).map(round => round.targetWord), recognition.slice(0, half).map(round => round.targetWord));
    for (const round of rounds.filter(round => round.mechanicId === 'wordMemory')) {
      assert.equal(round.cards.length, 8);
      assert.equal(round.words.length, 4);
      assert.equal(round.cards.filter(card => card.word === round.words[0]).length, cycle.cycleNumber === 1 ? 4 : 2);
    }
  }
});

test('Adventure Map continuation opens only after every cycle, advances through frequency words and merges forward', () => {
  assert.deepEqual(adventureWordMatchOptions({}), {});
  const incomplete = structuredClone(completedCycles);
  delete incomplete.cycles['cycle-12'];
  assert.deepEqual(adventureWordMatchOptions(incomplete), {});
  const first = adventureWordMatchOptions(completedCycles);
  assert.equal(first.wordMatchStartBoard, WORD_MATCH_EXTENSION_START);
  const rounds = buildStationRounds(cycles.at(-1), 'spell', { seed: 'extension', ...first });
  assert.equal(rounds.length, 3);
  assert.deepEqual(rounds[0].words, ['in', 'it', 'on', 'at']);
  assert.ok(rounds.every(round => round.cards.length === 8));
  const progressed = structuredClone(completedCycles);
  progressed.cycles['cycle-27'].wordMatchNextBoard = rounds.at(-1).wordMatchNextBoard;
  const merged = mergeElQuestProgress(progressed, completedCycles);
  assert.equal(adventureWordMatchOptions(merged).wordMatchStartBoard, WORD_MATCH_EXTENSION_START + 3);
});
