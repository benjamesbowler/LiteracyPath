import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyPracticeExtensions, LITERACY_EXTENSION_SKILLS, listLiteracyPracticeAudioGaps, listLiteracyPracticeTeachingAudioGaps } from '../../src/data/literacyPracticeExtensions.js';
import { auditLiteracyPracticeItem, auditLiteracyPracticeBank, literacyPracticeRequiredAudioCues } from '../../tools/lib/literacyPracticeContracts.mjs';

const items = await loadLiteracyPracticeExtensions();
const clone = value => JSON.parse(JSON.stringify(value));
const named = suffix => clone(items.find(item => item.id.endsWith(`.${suffix}`)));
const codes = item => auditLiteracyPracticeItem(item).map(issue => issue.code);

test('the full authored source passes all non-audio contracts and unresolved recordings fail closed', () => {
  const issues = auditLiteracyPracticeBank(items, LITERACY_EXTENSION_SKILLS);
  assert.deepEqual(issues.filter(issue => issue.code !== 'Q-LITERACY-AUDIO-MISSING'), []);
  const gaps = [...listLiteracyPracticeAudioGaps(items), ...listLiteracyPracticeTeachingAudioGaps(items)];
  assert.equal(issues.filter(issue => issue.code === 'Q-LITERACY-AUDIO-MISSING').length, gaps.reduce((sum, cue) => sum + cue.itemIds.length, 0));
  const missing = named('name-a');
  missing.audioRequirements[0].path = '';
  missing.instructionAudioPath = '';
  missing.literacyAudioReady = false;
  assert.ok(codes(missing).includes('Q-LITERACY-AUDIO-MISSING'));
});

test('the media contract rejects undeclared artwork and missing construct decisions', () => {
  const item = named('book-title');
  delete item.assessmentMediaDecision;
  assert.ok(codes(item).includes('Q-LITERACY-MEDIA'));
  item.assessmentMediaDecision = named('book-title').assessmentMediaDecision;
  item.image = '/images/decorative-answer.webp';
  assert.ok(codes(item).includes('Q-LITERACY-MEDIA'));
});

test('required cues preserve exact instruction, isolated phoneme and oral choice sources', () => {
  const item = named('blend-map');
  item.audioRequirements[1].path = item.audioRequirements[2].path;
  assert.ok(codes(item).includes('Q-LITERACY-AUDIO-SOURCE'));
  const reordered = named('blend-map');
  [reordered.audioRequirements[1], reordered.audioRequirements[2]] = [reordered.audioRequirements[2], reordered.audioRequirements[1]];
  assert.ok(codes(reordered).includes('Q-LITERACY-ORAL'));
  const wrongWord = named('blend-map');
  wrongWord.audioRequirements.find(cue => cue.role === 'choice').text = 'unrelated';
  assert.ok(codes(wrongWord).includes('Q-LITERACY-ORAL'));
  const sequence = literacyPracticeRequiredAudioCues([named('blend-map')]);
  assert.deepEqual(sequence.filter(cue => cue.scope === 'response').map(cue => cue.role), ['instruction', 'phoneme', 'phoneme', 'phoneme', 'choice', 'choice', 'choice']);
  assert.equal(sequence.filter(cue => cue.scope === 'teaching').length, 1);
});

test('teaching is audited even though its cues are not part of the independent first response', () => {
  const item = named('blend-map');
  item.teachingAudioRequirements = [];
  assert.ok(codes(item).includes('Q-LITERACY-TEACHING'));
  const mismatched = named('blend-map');
  mismatched.teachingCueId = named('delete-s-snow').teachingCueId;
  mismatched.teachingPrompt = named('delete-s-snow').teachingPrompt;
  mismatched.teachingAudioRequirements = named('delete-s-snow').teachingAudioRequirements;
  assert.ok(codes(mismatched).includes('Q-LITERACY-TEACHING'));
});

test('reading and recognition cannot claim independent evidence after narration supplies the target', () => {
  const item = named('book-title');
  item.suppressStimulusAudio = false;
  item.allowChoiceAudio = true;
  assert.ok(codes(item).includes('Q-LITERACY-READING-LEAK'));
  assert.ok(codes(item).includes('Q-LITERACY-CHOICE-LEAK'));
  const oral = named('blend-map');
  oral.hideWrittenLabels = false;
  assert.ok(codes(oral).includes('Q-LITERACY-ORAL'));
});

test('stock with missing constructs, cloned tasks or no fresh transfer fails the release contract', () => {
  const item = named('book-title');
  const duplicate = { ...clone(item), id: `${item.id}.clone` };
  const issues = auditLiteracyPracticeBank([item, duplicate], LITERACY_EXTENSION_SKILLS);
  for (const code of ['Q-LITERACY-DUPLICATE', 'Q-LITERACY-STOCK', 'Q-LITERACY-TRANSFER']) assert.ok(issues.some(issue => issue.code === code));
  assert.ok(auditLiteracyPracticeBank([], []).some(issue => issue.code === 'Q-LITERACY-COVERAGE'));
});

test('the existing permanent question and audibility gates include supplemental authored stock', () => {
  const questionGate = fs.readFileSync(new URL('../../tools/checkQuestionDesignPolicy.mjs', import.meta.url), 'utf8');
  const audioGate = fs.readFileSync(new URL('../../tools/checkAssessmentLedaAudioAudibility.mjs', import.meta.url), 'utf8');
  assert.match(questionGate, /await auditLiteracyPreparation\(\)/);
  assert.match(questionGate, /auditLiteracyPracticeBank\(items, LITERACY_EXTENSION_SKILLS\)/);
  assert.match(audioGate, /literacyPracticeRequiredAudioCues\(await loadLiteracyPracticeExtensions\(\)\)/);
});
