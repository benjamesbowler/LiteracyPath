import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PROGRESS_BANK } from '../../src/content/assessments/v3/progressBank.generated.js';
import { buildProgressBank, generatedProgressBankSource, PROGRESS_BANK_PATH, validateProgressBank, progressStockReadiness } from '../../tools/assessmentRebuild/buildProgressBank.mjs';
import { createProgressTestRun, beginProgressTest, nextProgressItem, commitProgressResponse, progressAttemptFromRun } from '../../src/utils/progressTestRouter.js';

const clone = value => JSON.parse(JSON.stringify(value));
const requiredDelivery = item => Object.fromEntries(Object.entries(item.audio).flatMap(([role, cue]) => Array.isArray(cue) ? cue.flatMap((entry, i) => entry.required ? [[`${role}:${i}`, 'completed']] : []) : cue.required ? [[role, 'completed']] : []));
function administer(trackId, outcome, startingTier, previousAttempts = [], seed = 1) {
  let run = beginProgressTest(createProgressTestRun({ bank: PROGRESS_BANK, studentId: 'bank-test-learner', planKind: 'focused', trackId, startingTier, previousAttempts, seed, at: '2026-10-02T09:00:00.000Z' }));
  for (let n = 0; run.currentItem && n < 25; n++) {
    const item = run.currentItem;
    const correct = outcome(n, item);
    run = nextProgressItem(commitProgressResponse(run, { itemId: item.id, selected: correct ? item.answer : item.choices.find(choice => choice.id !== item.answer).id, audioDelivery: requiredDelivery(item), at: '2026-10-02T09:01:00.000Z' }));
  }
  return run;
}

test('reserved generated progress view is fresh, construct-valid and contains six complete tracks', () => {
  const { bank, errors } = buildProgressBank();
  assert.deepEqual(errors, []);
  assert.deepEqual(bank, PROGRESS_BANK);
  assert.equal(fs.readFileSync(PROGRESS_BANK_PATH, 'utf8'), generatedProgressBankSource(bank));
  assert.equal(bank.items.length, 576);
  assert.equal(bank.tracks.length, 6);
  for (const row of bank.readiness.tracks) assert.deepEqual(row.familyCountsByTier, [32,32,32]);
  assert.equal(new Set(bank.items.map(item => item.stimulusFamilyId)).size, 576);
});

test('exact pronunciation evidence fails closed and cannot be substituted with an instruction clip', () => {
  const original = PROGRESS_BANK.items.find(item => item.trackId === 'hear_sounds');
  const missing = clone(original);
  missing.media.requiredSources[0].path = '/audio/missing-progress-stimulus.mp3';
  assert.ok(validateProgressBank([missing]).some(error => error.message.includes('Missing exact approved required')));
  const wrongRole = clone(original);
  wrongRole.media.requiredSources[0].path = '/audio/production/en-US/assessment_prompt/listen-and-find-the-word-74aac166fd.mp3';
  assert.ok(validateProgressBank([wrongRole]).some(error => error.message.includes('does not match')));
});

test('print recognition and independent reading reject audio leakage; spoken tracks reject visible spelling', () => {
  const word = clone(PROGRESS_BANK.items.find(item => item.trackId === 'printed_words'));
  word.audio.choices = [{ text: word.choices[0].label, required: false }];
  assert.ok(validateProgressBank([word]).some(error => error.message.includes('must not be narrated')));
  const reading = clone(PROGRESS_BANK.items.find(item => item.trackId === 'reading_stories'));
  reading.audio.passage = { text: reading.passage, required: false };
  assert.ok(validateProgressBank([reading]).some(error => error.message.includes('may not be spoken')));
  const sound = clone(PROGRESS_BANK.items.find(item => item.trackId === 'hear_sounds'));
  sound.hideWrittenLabels = false;
  assert.ok(validateProgressBank([sound]).some(error => error.message.includes('hidden print')));
});

test('original listening questions retain exact published public families and never use retention stock', () => {
  for (const item of PROGRESS_BANK.items.filter(item => item.trackId === 'listening_stories')) {
    assert.equal(item.exposure.sourceReuse, 'approved_public_recorded_passage');
    assert.equal(item.exposure.priorExposureStatus, 'unknown');
    assert.ok(item.enemyItemGroups.includes(item.exposure.sourceItemId));
    assert.ok(item.enemyItemGroups.includes(item.exposure.publicStimulusFamilyId));
    assert.ok(item.exposure.limitation.includes('previously public'));
    assert.equal(item.audio.passage.text, item.passage);
  }
  const item = clone(PROGRESS_BANK.items.find(row => row.trackId === 'listening_stories'));
  item.exposure.sourceItemId = 'lp3.key_details.l1.R.what_happened.v9r';
  assert.ok(validateProgressBank([item]).some(error => error.message.includes('retention reserves are forbidden')));
});

test('relabelled duplicate IDs/families cannot inflate readiness or originality', () => {
  const item = clone(PROGRESS_BANK.items[0]);
  const renamed = clone(item);
  renamed.id = 'renamed-token-swap';
  assert.ok(validateProgressBank([item, renamed]).some(error => error.message.includes('Duplicate prompt/stimulus/options')));
  const sameFamily = Array.from({ length: 32 }, (_, i) => ({ ...item, id: `fake-${i}` }));
  assert.equal(progressStockReadiness(sameFamily).ready, false);
  assert.deepEqual(progressStockReadiness(sameFamily).tracks[0].familyCountsByTier, [1,0,0]);
});

test('two focused administrations finish at floor, ceiling and contradictory paths without any repeated family', () => {
  const patterns = [() => false, () => true, n => n % 2 === 0, (n, item) => n === 0 || (item.difficultyTier === 0 ? n % 3 === 0 : item.difficultyTier === 2 ? n % 3 !== 0 : n % 2 === 0)];
  for (const track of PROGRESS_BANK.tracks) for (const [i, pattern] of patterns.entries()) {
    const first = administer(track.id, pattern, i === 1 ? 2 : i === 0 ? 0 : 1);
    assert.equal(first.status, 'completed', `${track.id} pattern ${i}`);
    assert.ok(first.responses.length >= 10 && first.responses.length <= 16);
    const second = administer(track.id, pattern, i === 1 ? 2 : i === 0 ? 0 : 1, [progressAttemptFromRun(first)], 19);
    assert.equal(second.status, 'completed', `${track.id} repeat pattern ${i}`);
    const families = [...first.responses, ...second.responses].map(row => row.stimulusFamilyId);
    assert.equal(new Set(families).size, families.length);
  }
});

test('32 independent families per tier cover every finite 16-response routing branch twice', () => {
  // Exhaustively enumerate directions at every initial tier. Actual stop rules
  // can only shorten these paths; at most16 families in a tier are consumed in
  // any one path. The two administrations may follow different branches.
  const maximumDemand = [0,0,0];
  for (const initial of [0,1,2]) for (let mask = 0; mask < 2 ** 16; mask++) {
    let tier = initial;
    const counts = [0,0,0];
    for (let n = 0; n < 16; n++) {
      counts[tier]++;
      tier = Math.max(0, Math.min(2, tier + (mask & (1 << n) ? 1 : -1)));
    }
    for (let i = 0; i < 3; i++) maximumDemand[i] = Math.max(maximumDemand[i], counts[i]);
  }
  for (const track of PROGRESS_BANK.tracks) {
    const stock = progressStockReadiness(PROGRESS_BANK.items).tracks.find(row => row.trackId === track.id).familyCountsByTier;
    for (let tier = 0; tier < 3; tier++) assert.ok(stock[tier] >= 2 * maximumDemand[tier]);
  }
});

test('known passage exposure excludes the whole public source family and depleted stock stops before starting', () => {
  const item = PROGRESS_BANK.items.find(row => row.trackId === 'listening_stories');
  const run = createProgressTestRun({ bank: PROGRESS_BANK, studentId: 'exposure-test', planKind: 'focused', trackId: 'listening_stories', knownExposures: [{ sourceStimulusFamilyId: item.exposure.publicStimulusFamilyId }] });
  assert.ok(!run.pool.some(row => row.id === item.id));
  const depleted = PROGRESS_BANK.items.filter(row => row.trackId === 'listening_stories' && row.difficultyTier === 0).slice(0,17).map(row => ({ stimulusFamilyId: row.stimulusFamilyId }));
  assert.throws(() => createProgressTestRun({ bank: PROGRESS_BANK, studentId: 'exposure-test', planKind: 'focused', trackId: 'listening_stories', knownExposures: depleted }), /Not enough fresh question families/);
});
