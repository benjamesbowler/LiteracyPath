import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyPracticeExtensions } from '../../src/data/literacyPracticeExtensions.js';
import { loadLiteracyMockItems } from '../../src/data/literacyMockItems.js';
import { PHASE_PASS_RULE } from '../../src/content/blueprints/skillBlueprints.js';

const extensions = await loadLiteracyPracticeExtensions();

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

test('every entry-level ordered writing task narrates each piece once without an ordered-answer recording', async () => {
  const items = await loadLiteracyMockItems();
  const entry = items.filter(item => item.skillId === 'writing_organization' && item.level === 1);
  assert.equal(entry.length, 8);
  assert.equal(entry.filter(item => !item.tutorialOnly).length, 7);
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
