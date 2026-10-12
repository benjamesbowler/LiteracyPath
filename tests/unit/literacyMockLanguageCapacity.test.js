import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockLanguageCapacityItems } from '../../src/data/literacyMockLanguageCapacity.js';
import { sameLiteracyMockTask } from '../../src/utils/literacyMockConditions.js';
import { canonicalLiteracyIdentity } from '../../src/utils/literacyEvidence.js';
import { normalizeSpokenCloze } from '../../src/utils/assessmentSpokenText.js';

const bank = (await loadLiteracyMockBank({ includeUnavailable: true, contentVersion: 'literacy-mock-v3' })).filter(item => !item.id.startsWith('mock.capacity.language.'));
const additions = buildLiteracyMockLanguageCapacityItems(bank).map(source => normalizeLiteracyMockItem(source));
const bySuffix = suffix => additions.find(item => item.id.endsWith(suffix));

test('language capacity retains each authored task, level, response mode and passage access', () => {
 assert.equal(additions.length, 569);
 assert.equal(new Set(additions.map(item => item.id)).size, additions.length);
 for (const item of additions) {
  const template = bank.find(source => source.id === item.sourceProvenance.taskTemplate);
  assert.ok(template, item.id);
  assert.ok(sameLiteracyMockTask(item, template, { includeLevel: true }), item.id);
  for (const field of ['format','answerMode','displayPassageDuringResponse','hideWrittenLabels']) assert.equal(item[field], template[field], `${item.id}:${field}`);
  assert.equal(item.canonicalItemId, item.id);
  assert.equal(item.itemSnapshot.id, item.id);
  const choiceIds = new Set(item.choices.map(choice => choice.id));
  assert.equal(choiceIds.size, item.choices.length, item.id);
  for (const answer of Array.isArray(item.answer) ? item.answer : [item.answer]) assert.ok(choiceIds.has(answer), item.id);
  assert.equal(new Set(item.choices.map(choice => choice.label.toLowerCase())).size, item.choices.length, item.id);
  assert.ok(item.explanation, item.id);
 }
});

test('narrated grammar stays narrated while printed context clues retain their original access', () => {
 const grammar = bySuffix('.flexible');
 assert.ok(grammar.requiredAudioCues.some(cue => cue.role === 'instruction' && cue.text.includes(normalizeSpokenCloze(grammar.passage))));
 for (const item of additions.filter(row => row.skillId === 'context_clues')) {
  assert.ok(item.passage.length > 100, item.id);
  assert.equal(item.requiredAudioCues.find(cue => cue.role === 'instruction').text, item.prompt);
  assert.equal(item.requiredAudioCues.some(cue => cue.text.includes(item.passage)), false, item.id);
 }
 for (const item of additions.filter(row => row.modality === 'reading')) assert.ok(item.requiredAudioCues.every(cue => cue.role === 'instruction'), item.id);
});

test('a or an before a new language cloze cannot identify the answer by itself', () => {
 const clozes = additions.filter(item => item.format === 'choice' && /\b(?:a|an) _+/i.test(item.passage));
 assert.ok(clozes.length > 10, 'Check the sibling noun and homophone clozes, not only octopus.');
 for (const item of clozes) {
  const article = item.passage.match(/\b(a|an) _+/i)[1].toLowerCase();
  // The current authored inventory has ordinary vowel onsets except silent-h hour.
  // This checks the actual options, not their stored answer positions.
  const compatible = item.choices.filter(choice => {
   const vowelOnset = /^(?:[aeiou]|hour\b)/i.test(choice.label);
   return article === 'an' ? vowelOnset : !vowelOnset;
  });
  assert.ok(compatible.some(choice => choice.id === item.answer), `${item.id}: keyed option must fit its article`);
  assert.ok(compatible.length > 1, `${item.id}: article alone must not reveal the key`);
 }
 const octopus = bySuffix('.octopus');
 assert.equal(octopus.choices.find(choice => choice.id === octopus.answer).label, 'octopus');
 assert.equal(octopus.requiredAudioCues.find(cue => cue.role === 'instruction').text,
  `${normalizeSpokenCloze(octopus.passage)} ${octopus.prompt}`);
});

test('homophone spellings remain pair-specific and are never printed in their new cloze contexts', () => {
 for (const item of additions.filter(row => row.skillId === 'homophones' && row.passage)) {
  const template = bank.find(source => source.id === item.sourceProvenance.taskTemplate);
  assert.equal(item.constructClaim, template.constructClaim);
  const key = item.choices.find(choice => choice.id === item.answer).label;
  assert.equal(new RegExp(`\\b${key}\\b`, 'i').test(item.passage), false, item.id);
 }
 assert.equal(bySuffix('.right-hand').passage, 'Your left hand is opposite your ___ hand.');
 for (const suffix of ['.ves-leaves','.ves-wolves','.ves-thieves','.plural-ponies','.sentence-plural-hooves']) assert.match(bySuffix(suffix).passage, /many|Three|two|both/);
 assert.match(bySuffix('.made-built').passage, /^Yesterday,/);
});

test('reused spatial pictures retain one exposure identity across tasks and are essential evidence', () => {
 const spatial = additions.filter(item => item.skillId === 'prepositions');
 assert.equal(spatial.length, 104);
 for (const rows of Map.groupBy([...bank, ...spatial].filter(item => item.skillId === 'prepositions'), item => item.image).values()) {
  assert.equal(new Set(rows.map(item => canonicalLiteracyIdentity(item).passageKey)).size, 1);
  assert.equal(new Set(rows.map(item => item.stimulusKey)).size, 1);
  assert.equal(new Set(rows.map(item => item.exposureFamilyId)).size, 1);
 }
 for (const item of spatial) {
  assert.ok(item.image);
  assert.deepEqual(item.requiredImagePaths, [item.image]);
  assert.equal(item.mediaDecision.role, 'target-or-scene');
  assert.ok(item.requiredAudioCues.every(cue => ['instruction','choice'].includes(cue.role)));
  assert.equal(item.requiredAudioCues.filter(cue => cue.role === 'choice').length, item.choices.length);
 }
 const mouse = spatial.filter(item => item.image.endsWith('/mouse-under.webp'));
 assert.deepEqual(mouse.map(item => item.constructClaim).sort(), ['below','under']);
 assert.equal(new Set(mouse.map(item => item.stimulusKey)).size, 1);
});

test('through scenes describe movement using natural complete clause frames', () => {
 const moving = additions.filter(item => item.skillId === 'prepositions' && item.constructClaim === 'through');
 assert.equal(moving.length, 6);
 for (const item of moving) {
  assert.match(item.prompt, item.image.endsWith('/stream-through-culvert.webp') ? /The stream flows ___\.$/ : / goes ___\.$/);
  assert.doesNotMatch(item.prompt, / is ___/);
  const instruction = item.requiredAudioCues.find(cue => cue.role === 'instruction');
  assert.ok(instruction.text.includes(item.prompt.includes(' flows ') ? ' flows ' : ' goes '));
  assert.equal(item.choices.find(choice => choice.id === item.answer).label.startsWith('through the '), true);
 }
});
