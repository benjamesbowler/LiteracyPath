import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { upgradeFoundationChoicesV11 } from '../../src/data/literacyMockFourChoiceFoundationsV11.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v10', includeUnavailable: true });
const inScope = item => ['sound_awareness', 'phonics', 'print'].includes(item.domainId) || item.adaptiveAreaBand < 2;
test('every active foundation single-answer item has four distinct answers without mutating V10', () => {
  let changed = 0;
  for (const item of bank.filter(q => q.adaptiveMixedEligible && inScope(q) && q.format === 'choice' && q.answerMode === 'exact')) {
    const original = JSON.stringify(item);
    const next = upgradeFoundationChoicesV11(item, bank);
    assert.equal(next.choices.length, 4, item.id);
    assert.equal(new Set(next.choices.map(c => c.label)).size, 4, item.id);
    assert.equal(next.choices.filter(c => c.id === next.answer).length, 1, item.id);
    assert.equal(JSON.stringify(item), original, item.id);
    assert.equal(next.exposureFamilyId, item.exposureFamilyId);
    assert.equal(next.canonicalItemId, item.canonicalItemId);
    if (next !== item) { changed++; assert.equal(next.id, `${item.id}.v11`); }
    for (const path of next.requiredAudioPaths || []) assert.ok(existsSync(`public${path}`), `${item.id}: ${path}`);
    for (const path of next.requiredImagePaths || []) assert.ok(existsSync(`public${path.split('#')[0]}`), `${item.id}: ${path}`);
    const usesChoiceAudio = item.requiredAudioCues?.some(c => c.role === 'choice');
    if (usesChoiceAudio) for (const choice of next.choices) {
      assert.ok(choice.audioPath, `${item.id}: ${choice.label}`);
      assert.ok(next.requiredAudioCues.some(c => c.role === 'choice' && c.choiceId === choice.id && c.path === choice.audioPath));
    }
    if (item.choices.every(c => c.image)) assert.ok(next.choices.every(c => c.image), item.id);
  }
  assert.ok(changed > 1000);
});

test('printed recognition never starts speaking its response choices', () => {
  for (const item of bank.filter(q => q.adaptiveMixedEligible && inScope(q) && q.format === 'choice' && !q.requiredAudioCues?.some(c => c.role === 'choice')))
    assert.ok(!upgradeFoundationChoicesV11(item, bank).requiredAudioCues.some(c => c.role === 'choice'), item.id);
});

test('construction formats and out-of-scope comprehension snapshots remain unchanged', () => {
  for (const item of bank.filter(q => q.format !== 'choice' || !inScope(q))) assert.equal(upgradeFoundationChoicesV11(item, bank), item);
});


test('category bird never treats a duck or a hen as an incorrect bird', () => {
  const source = bank.find(q => q.constructClaim === 'familiar_word_within_category' && q.targetWord === 'bird');
  const next = upgradeFoundationChoicesV11(source, bank);
  assert.deepEqual(next.choices.map(c => c.label), ['bird', 'fish', 'frog', 'cat']);
});

test('print boundary fourth cards use the actual complete printed stimulus', () => {
  for (const item of bank.filter(q => q.adaptiveMixedEligible && q.domainId === 'print' && ['first_word','last_word','return_sweep','sentence_end_location'].includes(q.constructClaim))) {
    const next = upgradeFoundationChoicesV11(item, bank);
    const words = (next.passage.match(/[a-z]+/gi) || []).map(w => w.toLowerCase());
    for (const c of next.choices) assert.ok(words.includes(c.label.toLowerCase().replace(/[^a-z]/g, '')), `${item.id}: ${c.label}`);
  }
});

test('letter-boundary distractors come from the displayed word and keep one correct position', () => {
  for (const item of bank.filter(q => q.adaptiveMixedEligible && q.domainId === 'print' && ['first_letter','last_letter'].includes(q.constructClaim))) {
    const next = upgradeFoundationChoicesV11(item, bank);
    for (const c of next.choices) assert.ok(next.passage.includes(c.label), `${item.id}: ${c.label}`);
    const expected = next.constructClaim === 'first_letter' ? next.passage[0] : next.passage.at(-1);
    assert.equal(next.choices.find(c => c.id === next.answer).label, expected);
  }
});

test('spoken-final comparison metadata includes all four actual alternatives with one shared sound', () => {
  for (const item of bank.filter(q => q.adaptiveMixedEligible && q.constructClaim === 'spoken_final_phoneme_comparison')) {
    const next = upgradeFoundationChoicesV11(item, bank);
    const proof = next.taskDemand.proof;
    assert.equal(Object.keys(proof.choiceFinalPhonemes).length, 4);
    assert.equal(Object.values(proof.choiceFinalPhonemes).filter(sound => sound === proof.targetFinalPhoneme).length, 1);
  }
});

test('a stimulus scene cannot masquerade as a new exact-word answer image', () => {
  const source = bank.find(q => q.constructClaim === 'familiar_word_within_category' && q.targetWord === 'sun');
  const sceneOnly = { id: 'scene-only', targetWord: 'cloud', image: '/incorrect-scene.webp', imageAlt: 'Clouds over a busy town', choices: [] };
  const next = upgradeFoundationChoicesV11(source, [source, sceneOnly]);
  assert.ok(next.choices.every(c => c.image !== '/incorrect-scene.webp'));
  assert.equal(next.choices.find(c => c.label === 'cloud').image, '/images/child-mode/blends/cloud.webp');
});

test('introductory directions use familiar delivery words with matching exact recordings',()=>{
 const prompts={
  'Which printed word matches this recording?':'Listen. Choose the word you hear.',
  'Which printed word matches the recording?':'Listen. Choose the word you hear.',
  'Which word has the same final sound?':'Which word has the same last sound?',
 };
 for(const source of bank.filter(q=>q.adaptiveMixedEligible&&prompts[q.prompt])){
  const q=upgradeFoundationChoicesV11(source,bank);
  assert.equal(q.prompt,prompts[source.prompt]);
  const instruction=q.requiredAudioCues.find(c=>c.role==='instruction');
  assert.equal(instruction.text,q.prompt);
  assert.ok(instruction.path?.startsWith('/audio/production/en-US/mock-v11/'));
  assert.ok(existsSync(`public${instruction.path}`));
  assert.ok(!q.requiredAudioCues.some(c=>c.role==='instruction'&&c.text===source.prompt));
 }
});
