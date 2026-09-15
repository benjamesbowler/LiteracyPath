import test from 'node:test';
import assert from 'node:assert/strict';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import { cycleSoundPosition, CYCLE_SOUND_WORDS, CYCLE_PICTURE_WORD_HOLDOUTS } from '../../src/data/cycleSoundWords.js';
import { cycleCardGraphemes, taughtCycleGraphemes, taughtCycleHighFrequencyWords, practiceRepetitionKey } from '../../src/utils/cyclePracticeVariation.js';
import { buildCyclePracticePlan, buildCyclePracticePools, cyclePracticeReadiness } from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { buildStationRounds, stationsForCycle } from '../../src/components/elQuest/elQuestEngine.js';

const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const counts = values => values.reduce((map, key) => map.set(key, (map.get(key) || 0) + 1), new Map());

test('shared picture resources preserve the programme vocabulary exclusions in practice, checks and map games', () => {
  function checkLabels(value, context) {
    if (typeof value === 'string') assert.ok(!CYCLE_PICTURE_WORD_HOLDOUTS.includes(value.toLowerCase()), `${context}: excluded picture label ${value}`);
    else if (value && typeof value === 'object') for (const nested of Object.values(value)) checkLabels(nested, context);
  }
  for (const cycle of cycles) {
    checkLabels(buildCyclePracticePools(cycle, 'familiar-pictures'), `${cycle.id}: authored practice`);
    checkLabels(buildCyclePracticePlan(cycle, 'familiar-pictures', 0, true).rounds, `${cycle.id}: check`);
    for (const station of stationsForCycle(cycle)) checkLabels(buildStationRounds(cycle, station.id, { seed: 'familiar-pictures' }), `${cycle.id}: ${station.id}`);
  }
});

test('old Cycle 1 build links resolve to its single Letter Find activity', () => {
  assert.equal(stationsForCycle(cycles[0]).some(station => station.id === 'build'), false);
  assert.deepEqual(buildStationRounds(cycles[0], 'build', { seed: 'old-link' }), buildStationRounds(cycles[0], 'trace', { seed: 'old-link' }));
});

test('display pairs remain single letters, while ff and ss remain taught spelling patterns', () => {
  assert.deepEqual(cycleCardGraphemes({ grapheme: 'Ff', spelling: 'ff' }), ['f']);
  assert.deepEqual(cycleCardGraphemes({ grapheme: 'Qq', spelling: 'qq' }), ['qu']);
  assert.deepEqual(cycleCardGraphemes({ spelling: 'ff ss zz ll' }), ['ff', 'ss', 'zz', 'll']);
  assert.deepEqual(taughtCycleGraphemes(2), ['a', 'm', 't', 's']);
});

test('sight-word review follows the fixed introduction sequence and deduplicates later review', () => {
  assert.deepEqual(taughtCycleHighFrequencyWords(4), ['am', 'I', 'a', 'the', 'an', 'and', 'is', 'of']);
  const later = taughtCycleHighFrequencyWords(27);
  assert.equal(later.filter(word => word === 'my').length, 1);
  for (const cycle of cycles) {
    const taught = taughtCycleHighFrequencyWords(cycle.cycleNumber).map(word => word.toLowerCase());
    const expected = [...new Set(cycles.filter(item => item.cycleNumber <= cycle.cycleNumber).flatMap(item => item.highFrequencyWords.map(word => word.toLowerCase())))];
    assert.deepEqual(taught, expected, cycle.id);
  }
});

test('all 27 practice decks cap the same target and format at three, while retaining cumulative targets', () => {
  for (const cycle of cycles) for (const pass of [0, 1]) {
    const { rounds } = buildCyclePracticePlan(cycle, 'three-of-a-kind', pass);
    for (const [key, count] of counts(rounds.map(practiceRepetitionKey))) assert.ok(count <= 3, `${cycle.id}/${pass}: ${key} occurs ${count} times`);
    for (const target of taughtCycleGraphemes(cycle.cycleNumber)) {
      for (const mechanic of ['pictureSound', 'letterMatch', 'soundSort', 'letterTrace']) {
        assert.ok(rounds.some(round => round.mechanicId === mechanic && round.targetGrapheme === target), `${cycle.id}: ${mechanic} includes ${target}`);
      }
      if (target.length === 1) for (const form of [target, target.toUpperCase()]) {
        assert.equal(rounds.filter(round => round.variant === 'letterCase' && round.answer === form).length, 1, `${cycle.id}: one case match for ${form}`);
      }
    }
    if (cycle.cycleNumber > 1) for (const target of ['a', 'm']) {
      assert.ok(rounds.slice(0, 36).some(round => (round.focusGrapheme || round.targetGrapheme?.toLowerCase()) === target), `${cycle.id}: early ${target} review`);
    }
  }
});

test('new S/T practice introduces both cases and reviews A/M in the opening activities', () => {
  for (const seed of ['child-one', 'child-two', 'child-three']) {
    const opening = buildCyclePracticePlan(cycles[1], seed).rounds.slice(0, 24);
    for (const form of ['s', 'S', 't', 'T']) assert.ok(opening.some(round => round.variant === 'letterCase' && round.answer === form), `${seed}: ${form}`);
    for (const letter of ['a', 'm']) assert.ok(opening.some(round => (round.focusGrapheme || round.targetGrapheme?.toLowerCase()) === letter), `${seed}: review ${letter}`);
  }
});

test('map levels retain every eligible earlier target with both cases and no duplicated letter grids', () => {
  for (const cycle of cycles) for (const seed of ['map-first', 'map-replay']) {
    const stations = stationsForCycle(cycle).filter(station => station.id !== 'check');
    const rounds = stations.flatMap(station => buildStationRounds(cycle, station.id, { seed }));
    const newLetters = (cycle.focusLetters || []).flatMap(cycleCardGraphemes).filter(value => value.length === 1);
    if (cycle.cycleNumber < 25 && newLetters.length) {
      const opening = buildStationRounds(cycle, 'letters', { seed }).slice(0, newLetters.length * 4);
      for (const target of newLetters) for (const form of [target, target.toUpperCase()]) assert.ok(opening.some(round => round.answer === form), `${cycle.id}: ${form} appears early`);
    }
    const singles = taughtCycleGraphemes(cycle.cycleNumber).filter(value => value.length === 1);
    const gridCounts = counts(rounds.filter(round => round.mechanicId === 'letterGrid').flatMap(round => round.cells.filter(cell => cell.matches).map(cell => cell.letter)));
    for (const letter of singles) for (const form of [letter, letter.toUpperCase()]) {
      assert.ok(gridCounts.get(form) >= 1 && gridCounts.get(form) <= 3, `${cycle.id}: find ${form} at most three times across the level's grids`);
      if (cycle.cycleNumber < 25) assert.equal(rounds.filter(round => round.mechanicId === 'letterPair' && round.answer === form).length, 1, `${cycle.id}: match ${form}`);
    }
    for (const target of taughtCycleGraphemes(cycle.cycleNumber).filter(value => cycleSoundPosition(value) === 'first')) {
      assert.ok(rounds.some(round => ['sceneHunt', 'pictureSearch'].includes(round.mechanicId) && round.targetGrapheme === target), `${cycle.id}: pictured review for ${target}`);
    }
    for (const station of stations) {
      for (const [key, count] of counts(buildStationRounds(cycle, station.id, { seed }).map(practiceRepetitionKey))) assert.ok(count <= 3, `${cycle.id}/${station.id}: ${key}`);
    }
  }
});

test('S/T mixed quests always practise current targets and review A/M across varied formats', () => {
  for (let pass = 0; pass < 16; pass++) {
    const rounds = buildStationRounds(cycles[1], 'check', { seed: `quest-review:${pass}` });
    const targets = new Set(rounds.flatMap(round => ['soundChoice', 'sceneHunt', 'pictureSearch'].includes(round.mechanicId) ? [round.targetGrapheme] : round.mechanicId === 'missingLetter' ? [round.missingGrapheme] : []));
    for (const letter of ['s', 't', 'a', 'm']) assert.ok(targets.has(letter), `pass ${pass}: ${letter}`);
    assert.deepEqual(new Set(rounds.map(round => round.mechanicId)), new Set([
      'letterPair', 'soundChoice', 'sceneHunt', 'sightWordChoice', 'missingLetter', 'letterGrid', 'pictureSearch'
    ]));
    assert.deepEqual(new Set(rounds.filter(round => round.mechanicId === 'sightWordChoice').map(round => round.targetWord)), new Set(['am', 'I', 'a', 'the']));
  }
});

test('replay changes actual sound pictures, rhyme families and compound targets, not just answer slots', () => {
  for (const station of ['hunt', 'play', 'compound']) {
    const selections = new Set();
    for (let pass = 0; pass < 12; pass++) {
      const rounds = buildStationRounds(cycles[0], station, { seed: `new-examples:${pass}` });
      selections.add(JSON.stringify(rounds.map(round => round.rhymingWords || round.answer)));
      if (station === 'hunt') for (const round of rounds) assert.ok(CYCLE_SOUND_WORDS[round.targetGrapheme].includes(round.answer));
    }
    assert.ok(selections.size >= 8, `${station}: varied content on replay`);
  }
  const targets = new Set();
  for (let pass = 0; pass < 8; pass++) {
    const rows = buildCyclePracticePlan(cycles[0], 'rotate-examples', pass).rounds;
    targets.add(JSON.stringify(rows.filter(round => round.mechanicId === 'pictureSound').map(round => round.targetWord).sort()));
  }
  assert.ok(targets.size >= 6);
});

test('completed coverage survives selecting a different set of replay examples', () => {
  const first = buildCyclePracticePlan(cycles[1], 'resume-evidence').rounds;
  const records = first.slice(0, 36).map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
  assert.equal(cyclePracticeReadiness(cycles[1], records, 1800).ready, true);
  buildCyclePracticePlan(cycles[1], 'resume-evidence', 1);
  assert.equal(cyclePracticeReadiness(cycles[1], records, 1800).ready, true);
  const later = buildCyclePracticePlan(cycles[1], 'resume-evidence', 2).rounds;
  const allRecords = [...first, ...later].map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
  const coverage = cyclePracticeReadiness(cycles[1], allRecords, 1800);
  assert.ok(coverage.completedTasks <= coverage.totalTasks, 'coverage counts the full bank across replay selections');
});
