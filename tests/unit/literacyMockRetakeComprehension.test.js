import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiteracyMockRetakeComprehension } from '../../src/data/literacyMockRetakeComprehension.js';
import { buildLiteracyMockRetakeVocabulary } from '../../src/data/literacyMockRetakeVocabulary.js';
import { literacyMockDemandV8 } from '../../src/policy/literacyMockDemandV8.js';
import { canonicalLiteracyIdentity, buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

const comprehension = buildLiteracyMockRetakeComprehension();
const vocabulary = buildLiteracyMockRetakeVocabulary();
const bank = [...comprehension, ...vocabulary];
const text = value => value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
const byBand = (domain, band) => bank.filter(q => q.domainId === domain && literacyMockDemandV8(q) === band);

test('new original material supplies every requested quantity at its actual demand', () => {
  assert.equal(bank.length, 312);
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  for (const domain of ['reading', 'listening']) for (const [band, count] of [[2, 32], [3, 35], [4, 25], [5, 22], [6, 22]]) {
    assert.equal(byBand(domain, band).length, count, `${domain}/${band}`);
  }
  assert.equal(byBand('vocabulary', 3).length, 16);
  assert.equal(byBand('vocabulary', 4).length, 8);
  assert.equal(byBand('vocabulary', 5).length, 16);
  assert.equal(new Set(comprehension.map(q => q.exposureFamilyId)).size, 114);
  assert.equal(new Set(vocabulary.map(q => q.exposureFamilyId)).size, 24);
  assert.ok(bank.every(q => literacyMockDemandV8(q) !== null));
});

test('changing access or adding a second episode never manufactures freshness', () => {
  const families = Map.groupBy(comprehension, q => q.exposureFamilyId);
  for (const members of families.values()) {
    const bands = [...new Set(members.map(literacyMockDemandV8))];
    assert.ok(bands.length === 1 || bands.join(',') === '5,6');
    for (const band of bands) {
      const pair = members.filter(q => literacyMockDemandV8(q) === band);
      assert.equal(pair.length, 2);
      const reading = pair.find(q => q.domainId === 'reading');
      const listening = pair.find(q => q.domainId === 'listening');
      assert.equal(reading.passage, listening.passage);
      assert.deepEqual(reading.choices, listening.choices);
      assert.deepEqual(canonicalLiteracyIdentity(reading), canonicalLiteracyIdentity(listening));
    }
    const exposed = buildLiteracyExposureIndex({ exposures: [members[0]] });
    for (const sibling of members.slice(1)) assert.equal(getLiteracyExposure(sibling, exposed).knownFamiliar, true, sibling.id);
  }
  for (const pair of Map.groupBy(vocabulary.filter(q => q.constructClaim === 'meaning_at_named_occurrence'), q => q.exposureFamilyId).values()) {
    assert.equal(pair.length, 2);
    const exposed = buildLiteracyExposureIndex({ exposures: [pair[0]] });
    assert.equal(getLiteracyExposure(pair[1], exposed).knownFamiliar, true);
  }
});

test('literal retrieval preserves the actual concrete detail and ten-word ceiling', () => {
  for (const q of byBand('reading', 2)) {
    assert.ok(q.passage.split(/\s+/).length <= 10, q.id);
    assert.ok(text(q.passage).includes(text(q.choices[0].label)), q.id);
    assert.equal(q.taskDemand.features.relevantBindings, 1);
  }
});

test('higher comprehension retains two temporal links or two true partial accounts', () => {
  for (const q of byBand('reading', 3)) {
    assert.ok((q.passage.match(/\b(before|after)\b/gi) || []).length >= 2, q.id);
    assert.equal(q.taskDemand.features.temporalLinks, 2);
    assert.equal(q.taskDemand.features.presentationConflicts, 1);
    assert.deepEqual(q.taskDemand.proof.chronology, q.choices.map(c => c.label));
    assert.deepEqual(q.taskDemand.proof.temporalRelations, [{ before: 'c0', after: 'c1' }, { before: 'c1', after: 'c2' }]);
    assert.equal(q.taskDemand.proof.evidence.length, 2);
  }
  for (const q of byBand('reading', 4)) {
    assert.equal(q.taskDemand.features.requiredEvidenceParts, 2);
    assert.equal(q.taskDemand.features.competingTruePartialAccounts, 2);
    assert.equal(q.taskDemand.proof.evidence.length, 2);
    assert.equal(q.taskDemand.proof.foils.length, 2);
    for (const [index, foil] of q.choices.slice(1).entries()) assert.ok(q.taskDemand.proof.foils[index].includes(foil.label));
  }
});

test('lesson evidence consists of actual episodes without a supplied concluding moral', () => {
  for (const q of comprehension.filter(q => literacyMockDemandV8(q) >= 5)) {
    const episodes = q.taskDemand.proof.evidence;
    assert.equal(episodes.length, literacyMockDemandV8(q) === 5 ? 1 : 2);
    assert.equal(episodes.join(' '), q.passage);
    assert.ok(!text(q.passage).includes(text(q.choices[0].label)), q.id);
    const lastSentence = q.passage.match(/[^.!?]+[.!?]/g).at(-1);
    assert.doesNotMatch(lastSentence, /\b(the lesson|this shows|they learned|both learned|both used|their notes preserved)\b/i, q.id);
    if (literacyMockDemandV8(q) === 6) {
      assert.equal(q.taskDemand.features.plausiblePartialLessons, 2);
      assert.deepEqual(q.taskDemand.proof.partialLessons, q.choices.slice(1).map(c => c.label));
    }
  }
});

test('each vocabulary pair has one or two real target occurrences and literal sense evidence', () => {
  let first = 0;
  let second = 0;
  for (const q of vocabulary.filter(item => item.constructClaim === 'meaning_at_named_occurrence')) {
    const occurrences = q.passage.match(new RegExp(`\\b${q.targetWord}\\b`, 'gi')) || [];
    assert.equal(occurrences.length, q.taskDemand.features.targetOccurrences, q.id);
    if (literacyMockDemandV8(q) === 5) {
      assert.equal(q.taskDemand.features.trueSenseFoils, 1);
      assert.equal(q.taskDemand.proof.evidence.length, 2);
      if (q.taskDemand.features.queriedOccurrence === 1) first++;
      else second++;
    }
  }
  assert.equal(first, 8);
  assert.equal(second, 8);
});

test('every item records literal evidence, diagnostic foils and exact modality-specific cues', () => {
  const passageFamilies = new Map();
  for (const q of bank) {
    assert.equal(q.answer, 'c0');
    assert.deepEqual(q.choices.map(c => c.id), ['c0', 'c1', 'c2']);
    assert.equal(new Set(q.choices.map(c => text(c.label))).size, 3, q.id);
    assert.equal(q.canonicalPassageId, q.passage);
    const key = text(q.passage);
    if (passageFamilies.has(key)) assert.equal(passageFamilies.get(key), q.exposureFamilyId, q.id);
    else passageFamilies.set(key, q.exposureFamilyId);
    for (const evidence of q.taskDemand.proof.evidence) assert.ok(q.passage.includes(evidence), `${q.id}: ${evidence}`);
    assert.ok(q.distractorRationales.c1.length > 20);
    assert.ok(q.distractorRationales.c2.length > 20);
    assert.equal(q.taskDemand.reviewed, true);
    assert.equal(q.mediaDecision.constructReview, 'approved');
    assert.equal(q.mediaDecision.answerNeutral, 'approved');
    assert.equal(q.sourceProvenance.kind, 'original_literacy_guide_retake');
    assert.ok(q.sourceProvenance.file.endsWith('.js'));
    assert.equal(q.requiredImagePaths.length, 0);
    assert.ok(q.passage.split(/\s+/).length <= 110, q.id);
    assert.equal(q.requiredAudioCues.filter(cue => cue.role === 'instruction').length, 1);
    if (q.domainId === 'reading') {
      assert.equal(q.requiredAudioCues.length, 1);
      assert.equal(q.displayPassageDuringResponse, true);
    } else {
      assert.equal(q.requiredAudioCues.length, 5);
      assert.equal(q.requiredAudioCues.find(cue => cue.role === 'passage').text, q.passage);
      assert.equal(q.displayPassageDuringResponse, q.domainId === 'vocabulary');
      for (const choice of q.choices) assert.equal(q.requiredAudioCues.find(cue => cue.choiceId === choice.id).text, choice.label);
    }
    assert.equal(q.mediaReady, q.requiredAudioCues.every(cue => Boolean(cue.path)));
    assert.equal(q.missingAudioCues.length, q.requiredAudioCues.filter(cue => !cue.path).length);
  }
});

test('affix alternatives retain one root and require the supplied semantic contrast', () => {
  const affixes = vocabulary.filter(q => q.constructClaim === 'apply_affix_meaning_in_context');
  assert.equal(affixes.length, 8);
  assert.equal(new Set(affixes.map(q => q.taskDemand.proof.root)).size, 8);
  for (const q of affixes) {
    const proof = q.taskDemand.proof;
    assert.equal(literacyMockDemandV8(q), 4);
    assert.equal(q.taskDemand.features.sameRootAlternatives, 3);
    assert.equal(q.taskDemand.features.contextualContrast, true);
    assert.deepEqual(proof.forms, q.choices.map(c => c.label));
    assert.ok(proof.forms.every(form => form.includes(proof.root)), q.id);
    assert.ok(proof.forms[0].includes(proof.affix.replaceAll('-', '')), q.id);
    assert.ok(proof.affixMeaning.length > 2);
    assert.ok(proof.contrast.length > 40);
    assert.deepEqual(proof.foils, [q.distractorRationales.c1, q.distractorRationales.c2]);
  }
});
