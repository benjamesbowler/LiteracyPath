import assert from 'node:assert/strict';
import test from 'node:test';
import { shuffleAnswerPositions, shuffleLearningQuestionChoices } from '../../src/utils/answerPositionShuffle.js';
import { buildLevel } from '../../src/utils/wordBridgeLevels.js';
import { shufflePracticeChoices } from '../../src/utils/skillsPracticeModel.js';
import { beginProgressTest, createProgressTestRun, nextProgressItem, commitProgressResponse } from '../../src/utils/progressTestRouter.js';
import { grammarGrindLadder, grammarGrindSegmentChoices } from '../../src/utils/grammarGrindLevels.js';
import { safariChoiceLabels, soundSafariLevel } from '../../src/utils/soundSafariRounds.js';
import { reelReadAvailableLanes } from '../../src/utils/reelReadLevels.js';
import { hopscotchRoutes } from '../../src/components/learn/games/games/phonicsPlayModel.js';
import { sentencePractice } from '../../src/utils/recognitionPractice.js';
import { soundBeatLevel } from '../../src/utils/soundBeatTracks.js';
import { createLearningResponseEpisode, commitLearningResponse, learningResponseRecoveryIssue } from '../../src/utils/learningResponseState.js';

function balanced(count, positionForSeed) {
  const counts = Array(count).fill(0);
  for (let seed = 1; seed <= 1200; seed++) {
    const position = positionForSeed(seed);
    assert.ok(Number.isInteger(position) && position >= 0 && position < count, `invalid position ${position}`);
    counts[position]++;
  }
  for (const observed of counts) assert.ok(observed > 1200 / count * .72 && observed < 1200 / count * 1.28, `biased distribution ${counts}`);
  return counts;
}

test('native first-round and transfer choices reach every slot without separating media or ordered answers', () => {
  for (const count of [2, 3, 4, 6, 8]) {
    const question = { id: 'native', answerOptions: Array.from({length: count}, (_, index) => ({id: `tile:${index}`, value: String(index), label: `Picture ${index}`, image: `/image-${index}.webp`, audio: `/cue-${index}.mp3`})),
      choices: ['ignored fallback'], expected: ['0', '1'], objects: Array.from({length: count}, (_, index) => ({value: String(index)})) };
    const before = structuredClone(question);
    balanced(count, seed => shuffleLearningQuestionChoices(question, `native:${seed}`).answerOptions.findIndex(option => option.value === '0'));
    const prepared = shuffleLearningQuestionChoices(question, 'native:32');
    assert.deepEqual(prepared, shuffleLearningQuestionChoices(question, 'native:32'));
    assert.deepEqual(question, before);
    assert.deepEqual(prepared.expected, ['0', '1']);
    prepared.answerOptions.forEach((option, index) => {
      assert.equal(option.image, `/image-${option.value}.webp`);
      assert.equal(option.audio, `/cue-${option.value}.mp3`);
      assert.equal(prepared.objects[index].value, option.value);
    });
    const episode = createLearningResponseEpisode({id: 'native-run', instrument: 'letter_practice', question: prepared, expected: '0'});
    const saved = commitLearningResponse(episode, {selected: '0', correct: true});
    const restored = JSON.parse(JSON.stringify(saved));
    assert.deepEqual(restored.firstQuestion.answerOptions, prepared.answerOptions);
    assert.equal(restored.firstResponse.selected, '0');
    assert.equal(learningResponseRecoveryIssue(restored), '');
  }
});

test('Word Bridge no longer sends almost 80 percent of first letters to one tile slot', () => {
  balanced(5, seed => buildLevel({world: 'meadow', cycle: 0, mode: 'bridge', target: 'cat', sessionSeed: seed}).tiles.findIndex(tile => tile.correct && tile.order === 0));
  const level = buildLevel({world: 'meadow', cycle: 0, mode: 'bridge', target: 'cat', sessionSeed: 42});
  assert.deepEqual(level, buildLevel({world: 'meadow', cycle: 0, mode: 'bridge', target: 'cat', sessionSeed: 42}));
  assert.equal(level.tiles.filter(tile => tile.correct).sort((a, b) => a.order - b.order).map(tile => tile.glyph).join(''), 'CAT');
});

test('Skills Trail uses unbiased stable positions for complete choice objects', () => {
  const choices = Array.from({length: 4}, (_, index) => ({id: `c${index}`, image: `image-${index}`, audio: `audio-${index}`}));
  balanced(4, seed => shufflePracticeChoices(choices, seed).findIndex(choice => choice.id === 'c0'));
  assert.deepEqual(shufflePracticeChoices(choices, 28), shufflePracticeChoices(choices, 28));
  assert.ok(shufflePracticeChoices(choices, 28).every(choice => choices.includes(choice)));
});

test('Progress Check varies keys uniformly, keeps choice recordings aligned and restores exact saved choices', () => {
  const bank = {version: 'test', difficultyVersion: 'test', items: Array.from({length: 48}, (_, index) => ({id: `q${index}`, stimulusFamilyId: `f${index}`, trackId: 'reading_stories', difficultyTier: Math.floor(index / 16), reservedPurpose: 'progress_test',
    choices: [0, 1, 2].map(n => ({id: `c${n}`, text: `answer ${n}`, image: `image-${n}`})), answer: 'c0', audio: {choices: [0, 1, 2].map(n => ({choiceId: `c${n}`, path: `audio-${n}`, required: false}))}, media: {requiredSources: []}}))};
  const make = seed => beginProgressTest(createProgressTestRun({bank, studentId: 'synthetic', planKind: 'focused', trackId: 'reading_stories', seed, attemptId: 'position-check'}));
  balanced(3, seed => { const run = make(seed); return run.currentItem.choices.findIndex(choice => choice.id === run.currentItem.answer); });
  const run = make(32), restored = nextProgressItem(JSON.parse(JSON.stringify(run)));
  assert.deepEqual(restored.currentItem, run.currentItem);
  assert.deepEqual(run.currentItem.audio.choices.map(cue => cue.choiceId), run.currentItem.choices.map(choice => choice.id));
  const response = commitProgressResponse(run, {itemId: run.currentItem.id, selected: 'c0'});
  assert.equal(response.responses[0].isCorrect, true);
  assert.deepEqual(response.responses[0].itemSnapshot.choices, run.currentItem.choices);
  assert.deepEqual(bank.items[0].choices.map(choice => choice.id), ['c0', 'c1', 'c2']);
});

test('Grammar Grind and Sound Safari cannot be solved from cyclic key positions', () => {
  const ladder = grammarGrindLadder('easy'), level = ladder[0];
  balanced(3, seed => grammarGrindSegmentChoices(level, ladder, 0, seed).indexOf(level.segments[0]));
  const item = soundSafariLevel('easy', 0).words[0];
  balanced(4, seed => safariChoiceLabels(item, 0, 4, `safari:${seed}:0:0:0`).indexOf(item.graphemes[0]));
  assert.equal(new Set(safariChoiceLabels(item, 0, 4, 'saved-task')).size, 4);
  assert.deepEqual(safariChoiceLabels(item, 0, 4, 'saved-task'), safariChoiceLabels(item, 0, 4, 'saved-task'));
});

test('Reel and Read opening target can occupy any lane; refills preserve occupied lanes', () => {
  balanced(5, seed => reelReadAvailableLanes([], 5, `${seed}:0:0`)[0]);
  assert.deepEqual([...reelReadAvailableLanes([{lane: 1}, {lane: 3}], 5, 'refill')].sort(), [0, 2, 4]);
  assert.deepEqual(reelReadAvailableLanes([], 5, 'saved'), reelReadAvailableLanes([], 5, 'saved'));
});

test('Hopscotch route keys vary by saved run and retain sentence order and coordinates', () => {
  balanced(2, seed => hopscotchRoutes(['The cat sat.'], seed)[0][0].findIndex(stone => stone.accepted));
  const plan = sentencePractice('easy', 6, () => .42);
  assert.ok(Number.isInteger(plan.routeSeed));
  assert.deepEqual(hopscotchRoutes(plan.sentences, plan.routeSeed), hopscotchRoutes(JSON.parse(JSON.stringify(plan)).sentences, plan.routeSeed));
  const path = hopscotchRoutes(['The cat sat.'], 12)[0];
  assert.deepEqual(path.map(pair => pair.find(stone => stone.accepted).word), ['The', 'cat', 'sat']);
  assert.ok(path.every(pair => pair[0].x === pair[1].x));
});

test('Sound Beat varies the starting pad while preserving the complete rhythm', () => {
  balanced(4, seed => soundBeatLevel('easy', 0, seed).items[0].lanes[0]);
  const level = soundBeatLevel('easy', 0, 'saved-run');
  assert.deepEqual(level, soundBeatLevel('easy', 0, 'saved-run'));
  assert.ok(level.items.every(item => item.lanes.length === item.beats.length && item.lanes.every(lane => lane >= 0 && lane < 4)));
});

test('Sentence Grove complete repair choices preserve accepted keys and all permutations', () => {
  const choices = ['runs', 'run', 'running'];
  balanced(3, seed => shuffleAnswerPositions(choices, `sentence-grove:${seed}:0:0`).indexOf('runs'));
  assert.deepEqual(choices, ['runs', 'run', 'running']);
});
