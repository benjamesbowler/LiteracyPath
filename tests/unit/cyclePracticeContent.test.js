import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { elSkillsBlockCycles } from '../../src/data/elSkillsBlockCycles.js';
import {
  buildCyclePracticePlan, buildCyclePracticePools, cyclePictureCoverage,
  cycleFocusGraphemes, cycleTaughtGraphemes, cycleSoundMatches, cycleSoundsEquivalent,
  CYCLE_SOUND_WORDS, CYCLE_HFW_CONTEXTS, CYCLE_SYLLABLE_COUNTS, cyclePracticeSemanticKey, cyclePracticeReadiness,
} from '../../src/components/cycle-practice/cyclePracticeContent.js';
import { resolveCyclePracticeAudio } from '../../src/components/cycle-practice/cyclePracticeAudio.js';
import { taughtCycleHighFrequencyWords } from '../../src/utils/cyclePracticeVariation.js';
import { CYCLE_WORD_BUILD_INVENTORY, CYCLE_WORD_BUILD_IMAGE_HOLDOUTS } from '../../src/data/cycleWordBuildInventory.js';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
const mechanics = ['pictureSound', 'letterMatch', 'rhymeMatch', 'wordBuild', 'soundSort', 'letterTrace'];
const exists = file => typeof file === 'string' && file.startsWith('/') && fs.existsSync(path.join(root, 'public', file));

test('every numbered cycle has six meaningful actions, all focus sounds, and its own HFW in pictured spoken context', () => {
  assert.equal(cycles.length, 27);
  for (const cycle of cycles) {
    const pools = buildCyclePracticePools(cycle, 'curriculum');
    assert.deepEqual(Object.keys(pools), mechanics);
    for (const [mechanic, rows] of Object.entries(pools)) assert.ok(rows.length, `${cycle.id}: ${mechanic}`);
    const rows = Object.values(pools).flat();
    for (const grapheme of cycleFocusGraphemes(cycle)) assert.ok(rows.some(round => round.targetGrapheme === grapheme), `${cycle.id}: ${grapheme}`);
    for (const word of cycle.highFrequencyWords) {
      const row = rows.find(round => round.variant === 'highFrequency' && round.targetWord === word.toLowerCase());
      assert.ok(row, `${cycle.id}: ${word}`);
      assert.equal(row.checkEligible, false);
      assert.ok(row.modelWord);
      assert.equal(row.contextText, CYCLE_HFW_CONTEXTS[word.toLowerCase()].contextText);
      assert.ok(row.contextText.toLowerCase().includes(word.toLowerCase()));
    }
    if (cycle.cycleNumber === 1) assert.equal(rows.some(round => round.construct === 'grapheme_word_building'), false, 'Cycle 1 does not require independent decoding/spelling');
  }
});

test('every authored question and picture choice uses real local media and a recorded exact instruction', () => {
  for (const cycle of cycles) for (const rows of Object.values(buildCyclePracticePools(cycle, 'media'))) for (const round of rows) {
    assert.ok(exists(round.image), `${round.id}: missing image ${round.image}`);
    assert.ok(exists(round.audio), `${round.id}: missing word recording ${round.audio}`);
    assert.equal(round.audioRequired, true);
    const resolved = resolveCyclePracticeAudio(round);
    assert.ok(exists(resolved.instructionAudio), `${round.id}: exact spoken action recording`);
    if (round.contextText) assert.ok(exists(resolved.contentAudio), `${round.id}: exact HFW context recording`);
    const sequence = resolved.sequence;
    assert.ok(sequence.length >= 1, `${round.id}: spoken action required`);
    for (const audio of sequence) assert.ok(exists(audio), `${round.id}: missing instructional audio ${audio}`);
    for (const object of round.objects || []) {
      assert.ok(exists(object.image) && exists(object.audio), `${round.id}: each sortable object has exact image and speech`);
    }
    for (const choice of round.choices || []) {
      if (['pictureSound', 'rhymeMatch'].includes(round.mechanicId) || round.variant === 'wordParts') {
        assert.ok(exists(choice.image), `${round.id}: choice ${choice.value} image`);
        assert.ok(exists(choice.audio), `${round.id}: choice ${choice.value} audio`);
      }
      if (choice.audio) assert.ok(exists(choice.audio), `${round.id}: choice audio ${choice.value}`);
    }
  }
});

test('beginning sounds, endings, and rimes have exactly one defensible picture answer', () => {
  for (const cycle of cycles) for (let variant = 0; variant < 3; variant++) {
    const pools = buildCyclePracticePools(cycle, `ambiguity:${variant}`);
    for (const round of pools.pictureSound) {
      const valid = round.choices.filter(choice => cycleSoundMatches(choice.value, round.targetGrapheme, round.soundPosition));
      assert.deepEqual(valid.map(choice => choice.value), [round.answer], `${round.id}: ${round.choices.map(c => c.value)}`);
    }
    for (const round of pools.rhymeMatch) {
      assert.equal(round.choices.filter(choice => round.rhymeFamily.includes(choice.value)).length, 1, round.id);
      assert.notEqual(round.answer, round.targetWord, round.id);
    }
    for (const round of pools.soundSort.filter(r => r.variant !== 'syllableSort')) {
      assert.equal(round.choices.filter(choice => cycleSoundMatches(round.targetWord, choice.value, round.soundPosition)).length, 1, `${round.id}: only one bin can describe the heard word ending`);
    }
    for (const round of [...pools.letterMatch, ...pools.soundSort.filter(r => r.variant !== 'syllableSort')]) {
      const matches = choice => round.variant === 'letterCase' || round.variant === 'wordListen'
        ? choice.value === round.answer : cycleSoundsEquivalent(choice.value, round.answer);
      assert.equal(round.choices.filter(matches).length, 1, round.id);
    }
  }
  assert.equal(cycleSoundMatches('sun', 'ss'), false, 'first s must not be mistaken for ending s');
  assert.equal(cycleSoundMatches('mouse', 'ss'), true, 'silent-e ending s remains a valid answer');
  assert.equal(cycleSoundMatches('apple', 'll'), true, 'final l cannot be a wrong distractor for ll');
  assert.equal(cycleSoundMatches('who', 'wh'), false, 'who starts with h');
  assert.equal(cycleSoundMatches('orange', 'o'), false, 'avoid accent-dependent orange for short o');
});

test('sound pictures expand beyond the old small examples without confusing short vowels or x', () => {
  const coverage = cyclePictureCoverage();
  assert.ok(new Set(Object.values(coverage).flat()).size >= 200);
  assert.ok(coverage.a.length > 4 && coverage.m.length > 4 && coverage.i.length > 4);
  assert.ok(coverage.ung.includes('rung') && coverage.zz.includes('fizz'));
  for (const bad of ['ice', 'island', 'iguana']) assert.equal(CYCLE_SOUND_WORDS.i.includes(bad), false);
  for (const bad of ['eagle', 'ear', 'eraser']) assert.equal(CYCLE_SOUND_WORDS.e.includes(bad), false);
  for (const bad of ['unicorn', 'uniform', 'ukulele']) assert.equal(CYCLE_SOUND_WORDS.u.includes(bad), false);
  for (const word of coverage.x) assert.ok(word.endsWith('x'));
});

test('word construction stays inside taught print', () => {
  for (const cycle of cycles) {
    const taught = cycleTaughtGraphemes(cycle);
    for (const round of buildCyclePracticePools(cycle, 'spelling').wordBuild) {
      if (round.variant === 'highFrequency') continue;
      assert.equal(round.answer.join(''), round.targetWord);
      for (const token of round.answer) assert.ok(taught.includes(token), `${cycle.id}: ${round.targetWord}: ${token}`);
      for (const choice of round.choices) assert.ok(taught.includes(choice.value), `${cycle.id}: ${choice.value}`);
    }
  }
});

test('complete semantic decks are deterministic, rotate after exhaustion, and checks exclude supported copies and tracing', () => {
  for (const cycle of cycles) {
    const first = buildCyclePracticePlan(cycle, 'resume');
    assert.deepEqual(first, buildCyclePracticePlan(cycle, 'resume'));
    assert.notDeepEqual(first.rounds, buildCyclePracticePlan(cycle, 'resume', 1).rounds);
    for (let i = 1; i < Math.min(36, first.rounds.length); i++) assert.notEqual(first.rounds[i].mechanicId, first.rounds[i - 1].mechanicId);
    const check = buildCyclePracticePlan(cycle, 'resume', 0, true);
    assert.ok(check.rounds.every(round => round.checkEligible && round.mechanicId !== 'letterTrace' && round.variant !== 'highFrequency'));
    for (const focus of cycleFocusGraphemes(cycle)) assert.ok(check.rounds.some(round => round.targetGrapheme === focus));
    assert.equal(new Set(check.rounds.map(round => round.id)).size, check.rounds.length);
    for (const word of cycle.highFrequencyWords) assert.ok(check.rounds.some(round => round.variant === 'wordListen' && round.targetWord === word.toLowerCase()), `${cycle.id}: assess heard print form ${word}`);
  }
});

test('practice keeps complete taught-content decks with a small oral-language share and honest replay capacity', () => {
  for (const cycle of cycles) {
    const first = buildCyclePracticePlan(cycle, 'full-path');
    assert.ok(first.rounds.length >= first.blueprint.minimumCompletedTasks, `${cycle.id}: a full coverage pass precedes replay`);
    assert.equal(new Set(first.rounds.map(round => cyclePracticeSemanticKey(round))).size, first.rounds.length, `${cycle.id}: semantic uniqueness excludes rearrangements`);
    assert.equal(first.blueprint.distinctTasks, first.rounds.length);
    if (cycle.cycleNumber >= 3) assert.ok(first.blueprint.plannedMinutes[0] >= 30, `${cycle.id}: at least 30 minutes of planned content`);
    assert.ok(first.blueprint.byActivity.rhymeMatch * 10 <= first.rounds.length, `${cycle.id}: rhyme remains a small part of the deck`);
    assert.ok(first.rounds.filter(round => round.variant === 'syllableSort').length <= 4, `${cycle.id}: beats do not become filler`);
    assert.ok(first.rounds.filter(round => ['rhymeMatch', 'letterTrace'].includes(round.mechanicId) || round.variant === 'syllableSort').length < first.rounds.length / 2, `${cycle.id}: recognition and phonics remain the majority`);
    assert.ok(first.rounds.every(round => round.semanticKey && round.coverageTags.length));
    const next = buildCyclePracticePlan(cycle, 'full-path', 1);
    const authored = new Set(Object.values(buildCyclePracticePools(cycle, 'full-inventory')).flat().map(round => round.semanticKey));
    for (const round of [...first.rounds, ...next.rounds]) assert.ok(authored.has(round.semanticKey), `${cycle.id}: replay selects actual authored content`);
    assert.notDeepEqual(first.rounds.map(round => round.semanticKey), next.rounds.map(round => round.semanticKey), `${cycle.id}: select and order fresh examples`);
    const traceKeys = first.rounds.filter(round => round.mechanicId === 'letterTrace').map(round => round.targetGrapheme);
    assert.equal(new Set(traceKeys).size, traceKeys.length, 'same tracing path with different pictures is one task');
  }
});

test('every active cycle excludes compound deletion, two-step word changes and poems from practice, check and readiness', () => {
  for (const cycle of cycles) for (const seed of ['simple-first-visit', 'simple-replay']) for (const check of [false, true]) {
    const pools = Object.values(buildCyclePracticePools(cycle, seed, check)).flat();
    const plan = buildCyclePracticePlan(cycle, seed, 0, check);
    for (const round of [...pools, ...plan.rounds]) {
      assert.equal(['wordParts', 'wordChange', 'poem'].includes(round.variant), false, `${cycle.id}: ${round.variant}`);
      assert.equal(/compound|substitution|poem/u.test(round.construct), false, `${cycle.id}: ${round.construct}`);
    }
    if (!check) {
      assert.equal(plan.blueprint.requiredCoverageTags.some(tag => /compound|wordChange|poem/u.test(tag)), false);
      const records = plan.rounds.slice(0, 36).map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
      assert.equal(cyclePracticeReadiness(cycle, records, 1800).ready, true, `${cycle.id}: direct activities complete the existing breadth requirement`);
    }
  }
});

test('every practice pass models each high-frequency word before independent recognition without delaying core breadth', () => {
  for (const cycle of cycles) for (const seed of ['first-visit', 'returning-child', 'fresh-start']) for (const pass of [0, 1, 2]) {
    const { rounds } = buildCyclePracticePlan(cycle, seed, pass);
    const modeled = new Set();
    for (const round of rounds) {
      if (round.variant === 'highFrequency') modeled.add(round.targetWord);
      if (round.variant === 'wordListen' && !round.decodableWord) assert.ok(modeled.has(round.targetWord), `${cycle.id}: ${seed}/${pass}: ${round.targetWord} is modeled first`);
    }
    for (const word of cycle.highFrequencyWords) {
      assert.ok(modeled.has(word.toLowerCase()));
      assert.ok(rounds.some(round => round.variant === 'wordListen' && round.targetWord === word.toLowerCase()));
    }
    for (let index = 1; index < 36; index++) assert.notEqual(rounds[index].mechanicId, rounds[index - 1].mechanicId, `${cycle.id}: ${seed}/${pass}: varied core sequence`);
    const records = rounds.slice(0, 36).map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
    assert.equal(cyclePracticeReadiness(cycle, records, 1800).ready, true, `${cycle.id}: ${seed}/${pass}: first 36 retain all required coverage`);
    const check = buildCyclePracticePlan(cycle, seed, pass, true).rounds;
    assert.equal(check.some(round => round.variant === 'highFrequency'), false);
    for (const word of cycle.highFrequencyWords) assert.ok(check.some(round => round.variant === 'wordListen' && round.targetWord === word.toLowerCase()));
  }
});

test('Cycle 4 opens with cumulative HFW, taught sounds, CVC recognition and only a little rhyme', () => {
  const cycle = cycles[3];
  const words = taughtCycleHighFrequencyWords(4).map(word => word.toLowerCase());
  for (const seed of ['classroom-one', 'classroom-two', 'classroom-three']) {
    const { rounds, blueprint } = buildCyclePracticePlan(cycle, seed);
    const opening = rounds.slice(0, 48);
    for (const word of words) {
      const copy = opening.findIndex(round => round.variant === 'highFrequency' && round.targetWord === word);
      const listen = opening.findIndex(round => round.variant === 'wordListen' && round.targetWord === word);
      assert.ok(copy >= 0 && listen > copy, `${seed}: teach then recognise ${word}`);
    }
    for (const target of cycleTaughtGraphemes(cycle)) assert.ok(opening.some(round => round.targetGrapheme === target), `${seed}: review ${target}`);
    for (const construct of ['grapheme_phoneme_matching', 'grapheme_word_building', 'ending_sound_picture_identification']) assert.ok(opening.some(round => round.construct === construct), `${seed}: ${construct}`);
    assert.ok(opening.some(round => round.decodableWord), `${seed}: heard CVC to print is available early`);
    assert.ok(opening.filter(round => round.mechanicId === 'rhymeMatch').length <= 3, `${seed}: low rhyme frequency`);
    assert.ok(blueprint.plannedMinutes[0] >= 30);
  }
});

test('all cycles review taught sight words while independent checks retain the assigned word scope', () => {
  for (const cycle of cycles) {
    const rounds = buildCyclePracticePlan(cycle, 'cumulative-hfw').rounds;
    const taught = taughtCycleHighFrequencyWords(cycle.cycleNumber).map(word => word.toLowerCase());
    for (const word of taught) {
      assert.ok(rounds.some(round => round.variant === 'highFrequency' && round.targetWord === word), `${cycle.id}: model ${word}`);
      assert.ok(rounds.some(round => round.variant === 'wordListen' && !round.decodableWord && round.targetWord === word), `${cycle.id}: recognise ${word}`);
    }
    const checkWords = buildCyclePracticePlan(cycle, 'cumulative-hfw', 0, true).rounds.filter(round => round.variant === 'wordListen').map(round => round.targetWord).sort();
    assert.deepEqual(checkWords, cycle.highFrequencyWords.map(word => word.toLowerCase()).sort(), `${cycle.id}: check the assigned HFW targets`);
  }
});

test('new word recognition uses taught CVC print and reviewed pictures without creating HFW-copy evidence', () => {
  const inventory = new Map(CYCLE_WORD_BUILD_INVENTORY.map(item => [item.word, item]));
  for (const cycle of cycles) {
    const taught = cycleTaughtGraphemes(cycle);
    for (const round of buildCyclePracticePlan(cycle, 'heard-cvc').rounds.filter(round => round.decodableWord)) {
      assert.equal(round.construct, 'auditory_word_recognition');
      assert.equal(round.checkEligible, false);
      assert.equal(round.image, inventory.get(round.targetWord).image);
      assert.equal(round.coverageTags.some(tag => /^hfw/u.test(tag)), false);
      assert.ok(round.choices.length >= 2);
      assert.equal(round.choices.filter(choice => choice.value === round.answer).length, 1);
      for (const choice of round.choices) {
        const item = inventory.get(choice.value);
        assert.ok(item && item.authorizedFromCycle <= cycle.cycleNumber, `${cycle.id}: ${choice.value}`);
        assert.ok(item.graphemes.every(grapheme => taught.includes(grapheme)), `${cycle.id}: taught code for ${choice.value}`);
      }
    }
    for (const check of [false, true]) for (const round of buildCyclePracticePools(cycle, 'reviewed-build-pictures', check).wordBuild) {
      if (round.variant === 'highFrequency') continue;
      assert.equal(CYCLE_WORD_BUILD_IMAGE_HOLDOUTS.includes(round.targetWord), false, `${cycle.id}: rejected target picture`);
      assert.equal(CYCLE_WORD_BUILD_IMAGE_HOLDOUTS.includes(round.beforeWord), false, `${cycle.id}: rejected source picture`);
      if (inventory.has(round.targetWord)) assert.equal(round.image, inventory.get(round.targetWord).image);
    }
  }
});

test('sorting requires three real classified objects across two unambiguous sound categories', () => {
  for (const cycle of cycles) for (const round of buildCyclePracticePools(cycle, 'sort-groups').soundSort.filter(r => r.variant !== 'syllableSort')) {
    assert.equal(round.objects.length, 3, round.id);
    assert.equal(new Set(round.objects.map(object => object.word)).size, 3, round.id);
    assert.equal(new Set(round.objects.map(object => object.answer)).size, 2, round.id);
    for (const object of round.objects) {
      const validBins = round.choices.filter(choice => cycleSoundMatches(object.word, choice.value, round.soundPosition));
      assert.deepEqual(validBins.map(bin => bin.value), [object.answer], `${round.id}: ${object.word}`);
    }
    assert.equal(cyclePracticeSemanticKey(round), cyclePracticeSemanticKey({ ...round, objects: [...round.objects].reverse() }));
  }
});

test('beat sorting has explicitly authored oral counts and word-level pictures, with no reading requirement', () => {
  assert.equal(CYCLE_SYLLABLE_COUNTS.apple, 2);
  assert.equal(CYCLE_SYLLABLE_COUNTS.alligator, 4);
  assert.equal(CYCLE_SYLLABLE_COUNTS.lion, 2);
  assert.equal(CYCLE_SYLLABLE_COUNTS['yo-yo'], 2);
  assert.equal(CYCLE_SYLLABLE_COUNTS.camera, undefined, 'accent-variable syllable counts are not forced');
  for (const cycle of cycles) for (const round of buildCyclePracticePools(cycle, 'beats').soundSort.filter(r => r.variant === 'syllableSort')) {
    assert.equal(round.beats, CYCLE_SYLLABLE_COUNTS[round.targetWord]);
    assert.equal(round.answer, String(round.beats));
    assert.deepEqual(round.choices.map(choice => choice.beats), [1, 2, 3, 4]);
  }
});

test('readiness combines active 30 minutes with meaningful completed breadth, not elapsed time or retries', () => {
  for (const cycle of cycles) {
    const deck = buildCyclePracticePlan(cycle, 'core-coverage').rounds;
    const records = deck.slice(0, 36).map(round => ({ semanticKey: round.semanticKey, coverageTags: round.coverageTags, activityCompleted: true }));
    assert.equal(cyclePracticeReadiness(cycle, records, 1799).ready, false);
    assert.equal(cyclePracticeReadiness(cycle, [], 1800).ready, false);
    assert.equal(cyclePracticeReadiness(cycle, records, 1800).ready, true, cycle.id);
    assert.equal(cyclePracticeReadiness(cycle, Array(40).fill(records[0]), 1800).ready, false, 'retries do not manufacture completed learning');
    assert.equal(cyclePracticeReadiness(cycle, records.map(record => ({ ...record, activityCompleted: false })), 1800).ready, false);
    assert.equal(cyclePracticeReadiness(cycle, records.map((record, index) => ({ ...record, semanticKey: `not-an-authored-task:${index}` })), 1800).ready, false, 'stale or invented task IDs cannot manufacture coverage');
    const nested = records.map(({ activityCompleted, semanticKey, coverageTags }) => ({ evidence: { activityCompleted, semanticKey, coverageTags } }));
    assert.equal(cyclePracticeReadiness(cycle, nested, 1800).ready, true);
    const withoutHfw = records.filter(record => !record.coverageTags.some(tag => tag.startsWith('hfw:')));
    assert.equal(cyclePracticeReadiness(cycle, withoutHfw, 1800).coverageReady, false);
    const allCompleted = deck.map(round => ({ semanticKey: round.semanticKey, activityCompleted: true }));
    const onlyCopies = allCompleted.filter(record => !record.semanticKey.startsWith('wordListen:'));
    const onlyRecognition = allCompleted.filter(record => !record.semanticKey.startsWith('highFrequency:'));
    for (const word of cycle.highFrequencyWords) {
      assert.ok(cyclePracticeReadiness(cycle, onlyCopies, 1800).missingCategories.includes(`hfwListen:${word.toLowerCase()}`));
      assert.ok(cyclePracticeReadiness(cycle, onlyRecognition, 1800).missingCategories.includes(`hfwCopy:${word.toLowerCase()}`));
    }
    assert.deepEqual(buildCyclePracticePlan(cycle, 'scope').blueprint.curriculumPhonemicAwareness, cycle.phonemicAwareness);

  }
});


test('practice retains every taught predecessor in sound pictures, matching, sorting and formation', () => {
  for (const cycle of cycles) {
    const pools = buildCyclePracticePools(cycle, 'cumulative-review');
    for (const grapheme of cycleTaughtGraphemes(cycle)) {
      for (const mechanic of ['pictureSound', 'letterMatch', 'soundSort', 'letterTrace']) {
        assert.ok(pools[mechanic].some(round => round.targetGrapheme === grapheme), `${cycle.id} ${mechanic} reviews ${grapheme}`);
      }
    }
  }
});

test('early cycles mix every taught sound into the opening activities with varied n pictures', () => {
  for (const cycle of cycles.slice(0, 3)) {
    const rounds = buildCyclePracticePlan(cycle, 'child-surface-preview:preview').rounds;
    const opening = rounds.slice(0, 36);
    for (const grapheme of cycleTaughtGraphemes(cycle)) assert.ok(opening.some(round => (round.focusGrapheme || round.targetGrapheme?.toLowerCase()) === grapheme), `${cycle.id}: ${grapheme} is visible in initial play`);
    if (cycle.cycleNumber === 3) {
      const nWords = opening.filter(round => round.targetGrapheme === 'n').map(round => round.targetWord);
      assert.ok(new Set(nWords).size >= 3);
      assert.ok(opening.filter(round => round.targetWord === 'net').length <= 1);
    }
  }
});

test('all 27 Cycle Check decks retain a stable contract after direct-activity and picture corrections', () => {
  // Reviewed CVC pictures, rejected-image exclusions and retiring multi-step
  // activities change affected items. Focus, HFW, independent-response and
  // media validity are checked above; pin this corrected check selection.
  const hashes = cycles.map(cycle => createHash('sha256').update(JSON.stringify(buildCyclePracticePlan(cycle, 'check-contract', 0, true).rounds)).digest('hex'));
  assert.equal(createHash('sha256').update(hashes.join('|')).digest('hex'), '7cff4d0d6a62a9474376c6a4c98927c1624e9df4eeca5d3a7f27b7879e1d4185');
});
