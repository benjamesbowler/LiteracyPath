import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyPracticeExtensions } from '../../src/data/literacyPracticeExtensions.js';
import { loadLiteracyMockItems } from '../../src/data/literacyMockItems.js';
import { PHASE_PASS_RULE } from '../../src/content/blueprints/skillBlueprints.js';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { literacyMockTaskKey } from '../../src/utils/literacyMockConditions.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const extensions = await loadLiteracyPracticeExtensions();

test('rewording the same synonym contrast does not create fresh independent evidence', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const word of ['reluctant', 'fragile']) {
    const concrete = bank.find(item => item.id === `mock.depth.synonym_concrete-${word}`);
    const context = bank.find(item => item.id === `mock.depth.synonym_picture-${word}`);
    for (const [seen, candidate] of [[concrete, context], [context, concrete]]) {
      const exposure = getLiteracyExposure(candidate, buildLiteracyExposureIndex({ exposures: [seen] }));
      assert.equal(exposure.knownFamiliar, true, candidate.id);
      assert.ok(exposure.familiarityReasons.includes('family'), candidate.id);
    }
  }
});

test('no length rank can pass writing-purpose or organization by appearance alone', () => {
  for (const skillId of ['writing_purpose', 'writing_organization']) {
    for (const level of [1, 2]) {
      const pool = extensions.filter(item => item.skillId === skillId && item.level === level);
      assert.ok(pool.length >= 6);
      for (const measure of [value => value.length, value => value.split(/\s+/).length]) {
        for (const rank of [0, 1, 2]) {
          // Shuffled ties give each candidate an equal chance. This measures a
          // content leak without mistaking original array position for UI order.
          const expectedHits = pool.reduce((sum, item) => {
            const target = item.choices.map(measure).sort((a, b) => a - b)[rank];
            const ties = item.choices.filter(value => measure(value) === target);
            return sum + (ties.includes(item.answer) ? 1 / ties.length : 0);
          }, 0);
          assert.ok(expectedHits / pool.length < PHASE_PASS_RULE.accuracyMin,
            `${skillId} level ${level}: length alone predicts ${expectedHits}/${pool.length} keys`);
        }
      }
    }
  }
});

test('writing distractors preserve comparable communicative actions and the stated evidence', () => {
  const find = id => extensions.find(item => item.id === `literacy.writing_purpose.${id}`);
  for (const id of ['sign', 'request', 'sign-library']) {
    assert.ok(find(id).choices.every(choice => choice.startsWith('Please ')), id);
  }
  const lost = find('lost');
  assert.ok(lost.choices.every(choice => choice.startsWith('I lost ')));
  assert.equal(lost.choices.filter(choice => choice.includes('red hat')).length, 1);
  const opening = extensions.find(item => item.id === 'literacy.writing_organization.opening-pet');
  assert.match(opening.passage, /fins, eyes, and tail/);
  assert.ok(opening.choices.every(choice => choice.includes('pet fish')));
});

test('every ordered writing task narrates each piece once without an ordered-answer recording', async () => {
  const items = await loadLiteracyMockItems();
  const entry = items.filter(item => item.skillId === 'writing_organization');
  assert.equal(entry.length, 16);
  assert.equal(entry.filter(item => !item.tutorialOnly).length, 15);
  for (const item of entry) {
    assert.equal(item.oralLanguageAccess, true, item.id);
    assert.equal(item.evidenceModality, 'audio+text', item.id);
    const cues = item.requiredAudioCues.filter(cue => cue.role === 'choice');
    assert.equal(cues.length, item.choices.length, item.id);
    for (const choice of item.choices) {
      assert.equal(cues.filter(cue => cue.choiceId === choice.id && cue.text === choice.label).length, 1, item.id);
    }
    assert.deepEqual(item.requiredAudioCues.filter(cue => cue.role !== 'choice').map(cue => cue.role), ['instruction'], item.id);
  }
  assert.ok(items.filter(item => item.oralLanguageAccess).every(item => entry.includes(item)));
});

test('independent reading directions contain the question only, never the source narrated story', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const item of bank.filter(item => item.modality === 'reading' && item.passage)) {
    assert.deepEqual(item.requiredAudioCues.map(cue => [cue.role, cue.text]), [['instruction', item.prompt]], item.id);
    assert.notEqual(item.evidenceModality, 'audio+text', item.id);
  }
  const snowman = bank.find(item => item.id === 'lp3.sequencing.l1.A.last_event.v4');
  assert.equal(snowman.requiredAudioCues[0].text, 'What happened last?');
});

test('scored word ordering requires an internal ordering decision beyond its two boundary cues', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const item of bank.filter(item => item.constructClaim === 'sentence_word_order' && !item.tutorialOnly)) {
    const internal = item.choices.filter(choice => !/^[A-Z]/.test(choice.label) && !/[.!?]$/.test(choice.label));
    assert.ok(internal.length >= 2, item.id);
  }
});

test('new harder language and comprehension examples retain their entry task and access contract', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const item of bank.filter(item => item.sourceProvenance.kind === 'original_mock_depth' && item.level === 2)) {
    const entry = bank.filter(other => other.level === 1 && literacyMockTaskKey(other) === literacyMockTaskKey(item));
    assert.ok(entry.length >= 2, item.id);
    assert.ok(item.difficultyEvidence.length > 30, item.id);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, item.choices.length, item.id);
    if (item.format === 'choice') assert.ok(item.choices.some(choice => choice.id === item.answer), item.id);
  }
});

test('Mock-only native variants do not alter the separately reviewed public adapter contract', async () => {
  const publicRows = await loadLiteracyMockItems({ includeMockOnly: false });
  assert.equal(publicRows.length, 60);
  assert.ok(publicRows.filter(item => item.skillId === 'writing_organization' && item.level === 2)
    .every(item => !item.oralLanguageAccess && !item.requiredAudioCues.some(cue => cue.role === 'choice')));
  assert.equal(publicRows.find(item => item.id === 'mock.sentence.birds').choices.length, 3);
  assert.ok(!publicRows.some(item => item.id === 'mock.build.fish'));
});

test('fixed task ceilings name a separate next task and never claim a learner ceiling', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const item of bank.filter(item => item.demandCeiling)) {
    assert.equal(item.demandCeiling, 1, item.id);
    assert.equal(item.level, 1, item.id);
    assert.ok(item.ceilingReason.length > 60, item.id);
    assert.match(item.ceilingNextTask, /separate/, item.id);
    assert.equal(item.itemSnapshot.ceilingNextTask, item.ceilingNextTask);
  }
});

test('new book-cover tasks render their own authored title and credits instead of inherited template evidence', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const covers = bank.filter(item => item.id.startsWith('mock.depth.') && item.textFeature?.kind === 'book_cover');
  assert.equal(covers.length, 3);
  for (const item of covers) {
    assert.equal(item.textFeature.title, item.choices.find(choice => choice.id === item.answer).label, item.id);
    assert.ok(item.passage.includes(item.textFeature.title), item.id);
    for (const credit of item.textFeature.credits) assert.ok(item.passage.includes(credit.name), item.id);
    assert.notEqual(item.textFeature.title, 'A Rainy Walk');
  }
});

test('sentence completeness exposure follows the actual options rather than a repeated generic direction', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const items = bank.filter(item => item.id.startsWith('mock.depth.complete-sentence'));
  assert.equal(items.length, 3);
  assert.equal(new Set(items.map(item => item.canonicalPassageId)).size, 3);
  assert.ok(items.every(item => item.passageIsInstruction && item.canonicalPassageId.startsWith('sentence-options:')));
});


test('heard r-controlled pattern selection declares its fixed demand after separating spelling operations', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  for (const pattern of ['ar', 'or', 'er', 'ir', 'ur']) {
    const rows = bank.filter(item => item.constructClaim === `identify_heard_r_controlled_spelling:${pattern}`);
    assert.ok(rows.length >= 3, pattern);
    assert.ok(rows.every(item => item.level === 1 && item.demandCeiling === 1), pattern);
    assert.ok(rows.every(item => /independent decoding/.test(item.ceilingNextTask)), pattern);
  }
});
