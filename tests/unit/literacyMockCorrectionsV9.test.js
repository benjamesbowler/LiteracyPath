import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLiteracyMockBank, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyMockCorrectionsV9, listLiteracyMockCorrectionsV9AudioGaps } from '../../src/data/literacyMockCorrectionsV9.js';
import { buildLiteracyMockV9, listLiteracyMockV9AudioGaps } from '../../src/data/literacyMockV9.js';
import { literacyMockDemandV9, LITERACY_MOCK_V9_LADDERS } from '../../src/policy/literacyMockDemandV9.js';
import { literacyMockDemandV8, isLiteracyMockWorkedTutorialTarget } from '../../src/policy/literacyMockDemandV8.js';
import { isQuestionBlockedByMediaQa } from '../../src/data/mediaQaManifest.js';

const base = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v8', includeUnavailable: true });
const original = JSON.stringify(base);
const additions = buildLiteracyMockCorrectionsV9(base);
const bank = buildLiteracyMockV9(base, source => normalizeLiteracyMockItem(source, { contentVersion: 'literacy-mock-v8' }));
const byId = new Map(bank.map(q => [q.id, q]));

test('V9 publication leaves all V8 inputs immutable and carries honest new demand snapshots', () => {
  assert.equal(JSON.stringify(base), original);
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  for (const q of bank) {
    assert.equal(q.contentVersion, 'literacy-mock-v9');
    assert.equal(q.adaptiveAreaVersion, 'areas-v5');
    assert.equal(q.itemSnapshot.contentVersion, q.contentVersion);
    if (q.adaptiveAreaBand !== null) assert.deepEqual(q.adaptiveDemand, LITERACY_MOCK_V9_LADDERS[q.domainId][q.adaptiveAreaBand]);
  }
});

test('every custom V9 admission excludes worked tutorial words through the shared V8 authority', () => {
  assert.equal(byId.get('mock.v9.phonics.build.b5.sleeps').adaptiveAreaBand, null);
  const custom = bank.filter(q => q.sourceProvenance?.file === 'src/data/literacyMockCorrectionsV9.js' && q.adaptiveMixedEligible);
  for (const q of custom) for (const word of ['cat', 'cup', 'hat', 'dog', 'the', 'puppy', 'sleeps', 'clouds', 'cover', 'moon']) {
    assert.equal(literacyMockDemandV9({ ...q, targetWord: word }), null, `${q.id}: target ${word}`);
    assert.equal(literacyMockDemandV9({ ...q, passage: ` ${word.toUpperCase()} ` }), null, `${q.id}: passage ${word}`);
  }
  for (const q of base) {
    const oldPrecondition = q.tutorialOnly || new Set(['cat', 'cup', 'hat', 'dog', 'the', 'puppy', 'sleeps', 'clouds', 'cover', 'moon']).has(q.targetWord?.toLowerCase())
      || new Set(['cat', 'cup', 'hat', 'dog', 'the', 'puppy', 'sleeps', 'clouds', 'cover', 'moon']).has(q.passage?.trim().toLowerCase());
    assert.equal(Boolean(q.tutorialOnly || isLiteracyMockWorkedTutorialTarget(q)), Boolean(oldPrecondition));
    assert.equal(literacyMockDemandV8(q), q.adaptiveAreaBand, q.id);
  }
  assert.equal(JSON.stringify(base), original);
});

test('all listening stimuli stay spoken-only without changing old keys or recordings', () => {
  const affected = base.filter(q => q.domainId === 'listening' && q.passage && q.displayPassageDuringResponse);
  assert.equal(affected.filter(q => q.adaptiveAreaBand === 1).length, 42);
  for (const before of affected) {
    const q = byId.get(before.id);
    assert.equal(q.displayPassageDuringResponse, false, q.id);
    assert.equal(q.itemSnapshot.displayPassageDuringResponse, false, q.id);
    assert.deepEqual(q.requiredAudioCues, before.requiredAudioCues);
    assert.equal(q.answer, before.answer);
  }
});

test('boundary replacements remove capitalization cues and preserve historical exposure identity', () => {
  for (let n = 1; n <= 8; n++) {
    const old = byId.get(`mock.capacity.writing.boundary-${n}`);
    const q = byId.get(`mock.v9.writing.boundary-${n}`);
    assert.equal(old.adaptiveMixedEligible, false);
    assert.equal(q.adaptiveAreaBand, 3);
    assert.equal(q.exposureFamilyId, old.exposureFamilyId);
    assert.equal(q.canonicalItemId, old.canonicalItemId);
    assert.equal(new Set(q.choices.map(c => c.label)).size, 3);
    assert.ok(q.choices.every(c => c.label.split('. ').slice(1).every(s => /^[A-Z]/.test(s))), q.id);
    assert.ok(q.requiredAudioCues.every(c => c.role === 'instruction'), 'Punctuation contrasts must remain silent.');
  }
});

test('sounds contain no letter-mapping barrier and final comparisons are entirely oral', () => {
  const routed = bank.filter(q => q.domainId === 'sound_awareness' && q.adaptiveMixedEligible);
  assert.ok(!routed.some(q => ['initial_sound_grapheme_mapping'].includes(q.constructClaim)));
  assert.ok(!routed.some(q => q.prompt === 'Which letter spells the middle vowel sound?'));
  const finals = routed.filter(q => q.adaptiveAreaBand === 1);
  assert.ok(finals.length >= 50);
  for (const q of finals) {
    assert.equal(q.constructClaim, 'spoken_final_phoneme_comparison');
    assert.equal(q.hideWrittenLabels, true);
    assert.equal(q.evidenceModality, 'audio');
    assert.equal(q.requiredAudioCues.filter(c => c.role === 'choice').length, 3);
    const proof = q.taskDemand.proof;
    assert.equal(proof.choiceFinalPhonemes[q.answer], proof.targetFinalPhoneme);
    assert.equal(Object.values(proof.choiceFinalPhonemes).filter(p => p === proof.targetFinalPhoneme).length, 1);
    assert.ok(q.choices.every(c => c.label !== q.targetWord), 'Repeating the entire target would replace final-phoneme comparison with word matching.');
  }
  const selfMatch = structuredClone(finals[0]); selfMatch.choices[0].label = selfMatch.targetWord;
  assert.equal(literacyMockDemandV9(selfMatch), null);
});

test('fresh oral stock adds real targets and blending never plays the whole answer as its stimulus', () => {
  const medial = bank.filter(q => q.id.startsWith('mock.v9.sounds.medial.'));
  assert.equal(medial.length, 14);
  for (const q of medial) {
    assert.equal(q.adaptiveAreaBand, 3); assert.equal(q.mediaReady, true);
    assert.equal(q.hideWrittenLabels, true); assert.equal(q.evidenceModality, 'audio');
    assert.equal(q.choices.find(c => c.id === q.answer).label, q.taskDemand.proof.key);
    assert.ok(q.choices.every(c => c.label !== q.targetWord));
  }
  const blends = bank.filter(q => q.id.startsWith('mock.v9.sounds.blend.'));
  assert.equal(new Set(blends.map(q => q.targetWord)).size, 16);
  assert.ok(blends.every(q => !medial.some(other => other.targetWord === q.targetWord)), 'The new two operations must add separate lexical stock.');
  for (const q of blends) {
    assert.equal(q.adaptiveAreaBand, 4); assert.equal(q.mediaReady, true);
    assert.equal(q.requiredAudioCues.filter(c => c.role === 'phoneme').length, 3);
    assert.deepEqual(q.taskDemand.proof.phonemeCueKeys, q.requiredAudioCues.filter(c => c.role === 'phoneme').map(c => c.text));
    assert.equal(q.exposureFamilyId, `mock-foundation-word:${q.targetWord}`);
    assert.ok(!q.requiredAudioCues.some(c => ['target_word', 'passage'].includes(c.role)));
    assert.equal(q.choices.find(c => c.id === q.answer).label, q.targetWord);
    const leaked = structuredClone(q); leaked.requiredAudioCues.push({ role: 'target_word', text: q.targetWord, path: q.choices[0].audioPath, required: true });
    assert.equal(literacyMockDemandV9(leaked), null);
  }
});

test('new action targets reuse inspected available rasters and share one exposure across both rungs', () => {
  const actions = bank.filter(q => q.id.startsWith('mock.v9.language.action.'));
  assert.equal(actions.length, 34);
  assert.equal(new Set(actions.map(q => q.targetWord)).size, 17);
  for (const q of actions) {
    assert.equal(q.adaptiveAreaBand, q.foundationBand);
    assert.equal(q.choices.length, q.foundationBand === 0 ? 2 : 3);
    assert.equal(q.mediaReady, true); assert.equal(isQuestionBlockedByMediaQa(q), false);
    assert.ok(fs.existsSync(new URL(`../../public${q.image}`, import.meta.url)));
    assert.equal(q.requiredAudioCues.filter(c => c.role === 'choice').length, q.choices.length);
    assert.equal(q.exposureFamilyId, `mock-foundation-word:${q.targetWord}`);
    const sibling = actions.find(other => other.targetWord === q.targetWord && other.foundationBand !== q.foundationBand);
    assert.equal(sibling.exposureFamilyId, q.exposureFamilyId);
    assert.equal(sibling.image, q.image);
  }
});

test('new pictured CVC reading families require the declared print discrimination and never speak assessed words', () => {
  const words = bank.filter(q => q.id.startsWith('mock.v9.reading.word.'));
  assert.equal(words.length, 24);
  assert.equal(new Set(words.map(q => q.exposureFamilyId)).size, 12);
  for (const q of words) {
    assert.equal(q.adaptiveAreaBand, q.foundationBand);
    assert.equal(q.mediaReady, true); assert.equal(isQuestionBlockedByMediaQa(q), false);
    assert.ok(fs.existsSync(new URL(`../../public${q.image}`, import.meta.url)));
    assert.ok(/^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(q.targetWord));
    assert.ok(q.requiredAudioCues.every(c => c.role === 'instruction'));
    assert.ok(q.choices.every(c => !c.audioPath));
    if (q.foundationBand === 0) {
      assert.equal(q.choices.length, 2);
      assert.notEqual(q.choices[0].label[0], q.choices[1].label[0]);
    } else {
      assert.equal(q.choices.length, 3);
      assert.ok(q.choices.every(c => c.label[0] === q.targetWord[0]));
    }
  }
});

test('paired comprehension sources are normalized in V9 and their exact unresolved recordings join one gap ledger', () => {
  const paired = bank.filter(q => q.sourceProvenance?.file === 'src/data/literacyMockBoundaryComprehensionV9.js');
  assert.equal(paired.length, 112);
  assert.equal(new Set(paired.map(q => q.exposureFamilyId)).size, 28);
  assert.ok(paired.every(q => [5, 6].includes(q.adaptiveAreaBand)));
  const gaps = listLiteracyMockV9AudioGaps(base);
  assert.equal(new Set(gaps.map(g => `${g.role}:${g.text}`)).size, gaps.length);
  for (const q of paired) for (const c of q.requiredAudioCues.filter(c => !c.path)) {
    assert.ok(gaps.some(g => g.text === c.text && g.itemIds.includes(q.id)));
  }
});

test('confirmed misplaced demands cannot enter the same faulty band under V9', () => {
  assert.equal(byId.get('lp3.sentence_comprehension.l2.B.best_restatement.v8').adaptiveAreaBand, null);
  assert.ok(!bank.some(q => q.domainId === 'language' && q.constructClaim === 'best_restatement' && q.adaptiveMixedEligible));
  for (const id of ['mock.v8.listening.0.table', 'mock.v8.listening.1.table']) assert.equal(byId.get(id).adaptiveAreaBand, null);
  for (const word of ['while', 'until']) {
    assert.equal(byId.get(`mock.capacity.writing.complete-hard-${word}`).adaptiveAreaBand, null);
    assert.equal(byId.get(`mock.v9.writing.dependent-complete.${word}`).adaptiveAreaBand, 5);
  }
  const quantified = byId.get('mock.v9.language.scope.trays');
  assert.equal(quantified.adaptiveAreaBand, 5);
  assert.equal(quantified.choices.find(c => c.id === quantified.answer).label, 'All trays other than the green one had two cups.');
  const key = slug => { const q = byId.get(`mock.v9.language.scope.${slug}`); return q.choices.find(c => c.id === q.answer).label; };
  assert.equal(key('shelves'), 'All the new books were below the top shelf.');
  assert.equal(key('dancers'), 'Anyone in the show wearing a blue ribbon was a dancer, not a singer.');
  assert.equal(key('tickets'), 'No tickets remained for sale when the doors opened.');
  assert.equal(byId.get('mock.v9.language.scope.tickets').choices[1].label, 'Some tickets remained for sale when the doors opened.');
  for (const id of ['mock.v8.sounds.medial.dot', 'mock.v8.sounds.medial.fog']) assert.equal(byId.get(id).adaptiveAreaBand, null);
  assert.equal(byId.get('mock.v9.sounds.medial.dot').choices.find(c => c.id === byId.get('mock.v9.sounds.medial.dot').answer).label, 'rob');
});

test('upper phonics retain actual increasing sound and response load, never letter-count-as-phoneme-count', () => {
  const routed = bank.filter(q => q.domainId === 'phonics' && q.adaptiveMixedEligible);
  for (const q of routed.filter(q => q.adaptiveAreaBand >= 4)) {
    assert.equal(q.format, 'build_word', q.id);
    const { phonemes, responseTiles, spareTiles } = q.taskDemand.proof;
    assert.equal(responseTiles.join(''), q.targetWord);
    assert.equal(q.responseLength, responseTiles.length);
    assert.equal(q.taskDemand.features.phonemeCount, phonemes.length);
    assert.equal(q.choices.length, responseTiles.length + 2);
    assert.equal(spareTiles.length, 2);
    if (q.adaptiveAreaBand === 4) {
      assert.equal(phonemes.length, 4); assert.equal(responseTiles.length, 5);
      assert.equal(q.taskDemand.features.splitVowel, true);
    } else if (q.adaptiveAreaBand === 5) {
      assert.equal(phonemes.length, 5); assert.ok(responseTiles.length >= 5);
      assert.ok(q.taskDemand.features.vowelTeam);
    } else {
      assert.ok(phonemes.length >= 6); assert.ok(responseTiles.length >= 6);
      assert.ok(q.taskDemand.proof.compoundParts?.length >= 2 || q.taskDemand.proof.morphemeExtension);
    }
    const forged = structuredClone(q); forged.taskDemand.proof.phonemes.pop();
    assert.equal(literacyMockDemandV9(forged), null, 'Contradictory proof must fail closed.');
  }
  for (const band of [4, 5, 6]) assert.ok(routed.filter(q => q.adaptiveAreaBand === band).length >= 35, `Band ${band} fresh stock`);
  for (const q of routed.filter(q => q.adaptiveAreaBand === 3)) assert.equal(q.taskDemand?.features?.phonemeCount ?? q.responseLength ?? q.choices.length, 4, q.id);
  assert.equal(byId.get('mock.v6.phonics.team-build.rain').adaptiveAreaBand, null);
  assert.equal(byId.get('mock.capacity.foundation.silent-e-category.a_e.l2.cape').adaptiveAreaBand, null);
});

test('split-vowel dictation cannot build a second conventional homophone', () => {
  const split = bank.filter(q => q.domainId === 'phonics' && q.adaptiveAreaBand === 4);
  for (const unsafe of ['brake', 'stake', 'stale', 'pride', 'brute']) assert.ok(!split.some(q => q.targetWord === unsafe));
  function canBuild(q, word) {
    const visit = (offset, used) => {
      if (offset === word.length) return used.size === q.responseLength;
      return q.choices.some((c, i) => !used.has(i) && word.startsWith(c.label, offset)
        && visit(offset + c.label.length, new Set([...used, i])));
    };
    return visit(0, new Set());
  }
  for (const [target, homophone] of [['plane', 'plain'], ['waste', 'waist']]) {
    const q = split.find(q => q.targetWord === target);
    assert.ok(canBuild(q, target));
    assert.equal(canBuild(q, homophone), false, `${q.id}: ambiguous spoken-only spelling`);
  }
});

test('all unavailable new audio is discoverable as exact text and a required role', () => {
  const gaps = listLiteracyMockCorrectionsV9AudioGaps(base);
  const missing = additions.flatMap(q => q.requiredAudioCues.filter(c => !c.path).map(c => `${c.role === 'instruction' ? 'assessment_prompt' : c.role === 'passage' ? 'assessment_passage' : 'isolated_word'}:${c.text}`));
  assert.deepEqual(new Set(gaps.map(g => `${g.role}:${g.text}`)), new Set(missing));
  assert.ok(gaps.every(g => g.text && g.itemIds.length));
});
