import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank } from '../../src/data/literacyMockBank.js';
import { buildLiteracyExposureIndex, canonicalLiteracyIdentity, getLiteracyExposure, literacyExposureIdentities } from '../../src/utils/literacyEvidence.js';
import { allocateIndependentItems, selectLiteracyMockPlan, adaptLiteracyMockPlan, replaceFailedLiteracyMockMedia } from '../../src/utils/literacyMockPlanner.js';
import { selectLiteracyMockPrintRetakePool } from '../../src/utils/literacyMockRetakePool.js';

const bank = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v7' });
const byId = new Map(bank.map(item => [item.id, item]));
const aIds = ['literacy.letter_knowledge.name-a', 'literacy.letter_knowledge.case-a',
  'mock.capacity.foundation.letter-case.l1.a', 'mock.capacity.foundation.letter-case.l2.a'];

test('letter names and case variants share one target across snapshots and compact historical exposures', () => {
  const originals = aIds.map(id => byId.get(id));
  const before = JSON.stringify(originals);
  const records = originals.flatMap(item => [item, { questionId: item.id }, { exposureItemId: item.id },
    { questionId: item.id, itemSnapshot: item.itemSnapshot }]);
  for (const record of records) {
    const history = buildLiteracyExposureIndex({ exposures: [record] });
    for (const candidate of originals) assert.equal(getLiteracyExposure(candidate, history).knownFamiliar, true,
      `${record.questionId || record.exposureItemId || record.id} -> ${candidate.id}`);
    assert.equal(getLiteracyExposure(byId.get('literacy.letter_knowledge.name-b'), history).knownFamiliar, null);
  }
  assert.equal(JSON.stringify(originals), before, 'published snapshots are not rewritten');
  assert.equal(new Set(originals.map(item => canonicalLiteracyIdentity(item).familyId)).size, 1);
});

test('letter aliases do not decode arbitrary IDs or unrelated word and context targets', () => {
  const a = byId.get('mock.capacity.foundation.letter-case.l1.a');
  for (const value of [
    { exposureItemId: 'unrelated-item-a' },
    { questionId: 'other.letter-case.l1.a' },
    { id: 'unrelated', domainId: 'phonics', skillId: 'letter_knowledge', constructClaim: 'letter_name', targetWord: 'A' },
    { id: 'unrelated', domainId: 'print', skillId: 'print_concepts', constructClaim: 'first_letter', passage: 'a' },
  ]) assert.equal(getLiteracyExposure(a, buildLiteracyExposureIndex({ exposures: [value] })).knownFamiliar, null);
});

test('new print snapshots share their literal letter target without relying on their item ID', () => {
  const snapshot = { id: 'new-print-probe', contentVersion: 'literacy-mock-v8', domainId: 'print',
    skillId: 'letter_knowledge', constructClaim: 'letter_case_correspondence', format: 'match',
    matchTargets: [{ id: 'm0', label: 'A' }], choices: [{ id: 'c0', label: 'a' }], answer: ['c0'] };
  assert.equal(getLiteracyExposure(snapshot, buildLiteracyExposureIndex({ exposures: [byId.get(aIds[0])] })).knownFamiliar, true);
  const multiple = { ...snapshot, id: 'new-two-letter-probe', matchTargets: [{ label: 'A' }, { label: 'B' }] };
  assert.notEqual(canonicalLiteracyIdentity(multiple).familyId, 'letter-case:a');
});

const lexicalVariants = [
  { exposureItemId: 'old-hfw', exposurePassageKey: 'hfw-word:rain', exposureFamilyId: 'hfw-word:rain' },
  { id: 'v6-team', domainId: 'phonics', targetWord: 'rain', stimulusKey: 'v6-phonics-team:rain', exposureFamilyId: 'v6-phonics-team:rain' },
  { questionId: 'foundation-word', itemSnapshot: { id: 'foundation-word', domainId: 'reading',
    stimulusKey: 'rain', exposureFamilyId: 'mock-foundation-word:rain' } },
  { id: 'v4-context', domainId: 'vocabulary', passage: 'The rain fell on the dry ground.',
    exposureFamilyId: 'v4-context-word-senses:rain' },
  { exposureItemId: 'new-context', exposureFamilyId: 'v8-context-word-senses:rain' },
];

test('trusted lexical families share their word across HFW, vowel-team, foundation and context families', () => {
  const before = JSON.stringify(lexicalVariants);
  for (const exposure of lexicalVariants) for (const candidate of lexicalVariants) {
    assert.equal(getLiteracyExposure(candidate, buildLiteracyExposureIndex({ exposures: [exposure] })).knownFamiliar, true);
    assert.equal(canonicalLiteracyIdentity(candidate).familyId, 'mock-foundation-word:rain');
  }
  const identities = literacyExposureIdentities(lexicalVariants[0]);
  assert.ok(identities.some(identity => identity.familyId === 'mock-foundation-word:rain'));
  assert.ok(identities.some(identity => identity.familyId === 'hfw-word:rain'), 'retain the original published family too');
  assert.equal(canonicalLiteracyIdentity(lexicalVariants[0]).passageKey, 'hfw-word:rain');
  assert.equal(JSON.stringify(lexicalVariants), before);
});

test('single-word sound anchors share lexical exposure without treating spoken foils as target words', () => {
  for (const constructClaim of ['initial_sound_discrimination', 'initial_sound_grapheme_mapping',
    'spoken_medial_vowel_discrimination', 'spoken_rhyme_discrimination']) {
    const anchor = { id: `anchor-${constructClaim}`, domainId: 'sound_awareness', constructClaim,
      targetWord: 'rain', exposureFamilyId: `source-item:anchor-${constructClaim}`, stimulusKey: 'rain' };
    for (const prior of [anchor, lexicalVariants[0]]) {
      const candidate = prior === anchor ? lexicalVariants[0] : anchor;
      assert.equal(getLiteracyExposure(candidate, buildLiteracyExposureIndex({ exposures: [prior] })).knownFamiliar, true, constructClaim);
    }
    const foils = { ...anchor, targetWord: 'cat', stimulusKey: 'cat', choices: [{ label: 'rain' }, { label: 'mat' }] };
    assert.equal(getLiteracyExposure(lexicalVariants[0], buildLiteracyExposureIndex({ exposures: [foils] })).knownFamiliar, null);
  }
});

test('unrelated contexts, arbitrary IDs and response labels cannot manufacture a lexical family alias', () => {
  for (const exposure of [
    { questionId: 'arbitrary-rain', exposurePassageKey: 'response-evidence:["rain"]' },
    { id: 'context', domainId: 'vocabulary', constructClaim: 'meaning_at_named_occurrence', targetWord: 'rain', passage: 'Rain is falling.' },
    { id: 'wrong-area', domainId: 'reading', constructClaim: 'spoken_rhyme_discrimination', targetWord: 'rain' },
    { id: 'context-anchor', domainId: 'sound_awareness', constructClaim: 'initial_sound_discrimination', targetWord: 'rain', passage: 'Rain is falling.' },
    { id: 'phrase-anchor', domainId: 'sound_awareness', constructClaim: 'spoken_rhyme_discrimination', targetWord: 'rain cloud' },
    { exposureFamilyId: 'unknown-family:rain' },
  ]) assert.equal(getLiteracyExposure(lexicalVariants[0], buildLiteracyExposureIndex({ exposures: [exposure] })).knownFamiliar, null);
});

const printBand = item => item.adaptiveAreaBand === 0 || item.adaptiveAreaBand === 1;
const history = 'abcdefghijklmnopqrst'.split('').map(letter => ({ exposureItemId: `literacy.letter_knowledge.name-${letter}` }));
const historyIndex = buildLiteracyExposureIndex({ exposures: history });
const fresh = bank.filter(item => !getLiteracyExposure(item, historyIndex).knownFamiliar);
const initial = selectLiteracyMockPlan(bank, { sessionId: 'fifth-print-sitting', studentId: 'same-child', exposures: history });

test('the fifth sitting packs exactly six remaining letters and retains every exact repair variant', () => {
  const pack = selectLiteracyMockPrintRetakePool(fresh, initial, byId);
  const initialPrint = initial.itemIds.map(id => byId.get(id)).filter(item => item.domainId === 'print');
  assert.equal(initialPrint.length, 5);
  assert.equal(new Set(pack.map(item => canonicalLiteracyIdentity(item).familyId)).size, 6);
  assert.ok(initialPrint.every(item => pack.includes(item)));
  assert.equal(pack.length, 24, 'six names plus legacy case and both source-level matching variants');
  for (const letter of 'uvwxyz') for (const id of [`literacy.letter_knowledge.name-${letter}`,
    `literacy.letter_knowledge.case-${letter}`, `mock.capacity.foundation.letter-case.l1.${letter}`,
    `mock.capacity.foundation.letter-case.l2.${letter}`]) assert.ok(pack.some(item => item.id === id), id);
  assert.equal(allocateIndependentItems(Array.from({ length: 7 }, () => pack)), null,
    'unseen alternatives cannot inflate the independent inventory');
  const six = allocateIndependentItems(Array.from({ length: 6 }, () => pack));
  assert.equal(new Set(six.map(item => canonicalLiteracyIdentity(item).familyId)).size, 6);
});

test('five-question adaptive plans keep fresh letters on correct, wrong, reversal, alternating and supported paths', () => {
  const pack = selectLiteracyMockPrintRetakePool(fresh, initial, byId);
  const printIds = new Set(pack.map(item => item.id));
  const pool = bank.filter(item => item.domainId !== 'print' || !printBand(item) || printIds.has(item.id));
  for (const pattern of ['correct', 'wrong', 'reversal', 'alternating', 'supported']) {
    let plan = initial, printCount = 0;
    const responses = [], seen = new Set();
    for (let index = 0; index < 43; index++) {
      const item = byId.get(plan.itemIds[index]);
      let isCorrect = true, evidenceType = 'independent';
      if (item.domainId === 'print') {
        const family = canonicalLiteracyIdentity(item).familyId;
        assert.equal(seen.has(family), false, `${pattern}:${item.id}`); seen.add(family);
        isCorrect = pattern === 'correct' || pattern === 'supported' || (pattern === 'reversal' ? printCount < 2 : pattern === 'alternating' && printCount % 2 === 0);
        if (pattern === 'supported') evidenceType = 'supported';
        printCount++;
      }
      responses.push({ questionId: item.id, skillId: item.skillId, domainId: item.domainId, itemSnapshot: item.itemSnapshot,
        responseStatus: 'answered', evidenceType, supportUsed: evidenceType === 'supported', isCorrect });
      const prefix = plan.itemIds.slice(0, index + 1);
      plan = adaptLiteracyMockPlan(pool, plan, responses, [], [], { exposures: history });
      assert.deepEqual(plan.itemIds.slice(0, index + 1), prefix);
    }
    assert.equal(printCount, 5);
  }
});

test('every initial print task retains a same-level repair while a shared failed source still stops safely', () => {
  const pack = selectLiteracyMockPrintRetakePool(fresh, initial, byId), ids = new Set(pack.map(item => item.id));
  const pool = bank.filter(item => item.domainId !== 'print' || !printBand(item) || ids.has(item.id));
  for (const failed of initial.itemIds.map(id => byId.get(id)).filter(item => item.domainId === 'print')) {
    const repaired = replaceFailedLiteracyMockMedia(pool, initial, [], [{ questionId: failed.id }], [], { exposures: [...history, failed] });
    assert.equal(repaired.unavailable, false, failed.id);
    const replacement = byId.get(repaired.plan.itemIds[initial.itemIds.indexOf(failed.id)]);
    assert.equal(replacement.level, failed.level);
    assert.equal(replacement.constructClaim, failed.constructClaim);
    assert.equal(replacement.modality, failed.modality);
    assert.notEqual(canonicalLiteracyIdentity(replacement).familyId, canonicalLiteracyIdentity(failed).familyId);
    const blocked = replaceFailedLiteracyMockMedia(pool, initial, [], [{ questionId: failed.id,
      failedMediaPaths: failed.requiredAudioPaths }], [], { exposures: history });
    assert.equal(blocked.unavailable, true, 'a common failed instruction has no safe same-task repair');
    assert.deepEqual(blocked.plan, initial);
  }
});

test('five true remaining letters cannot promise a six-letter reserve, regardless of duplicate snapshots', () => {
  const five = fresh.filter(item => canonicalLiteracyIdentity(item).familyId !== 'letter-case:z');
  assert.throws(() => selectLiteracyMockPrintRetakePool(five, initial, byId), error => error.code === 'mock_fresh_capacity');
});

test('unavailable names and tutorial variants cannot complete an otherwise fresh letter reserve', () => {
  for (const field of [{ mediaReady: false }, { tutorialOnly: true }]) {
    const incomplete = fresh.map(item => item.id === 'literacy.letter_knowledge.name-z' ? { ...item, ...field } : item);
    assert.throws(() => selectLiteracyMockPrintRetakePool(incomplete, initial, byId), error => error.code === 'mock_fresh_capacity');
  }
});

test('a duplicate letter in the initial form and a spare lacking its exact repair task are rejected', () => {
  const print = initial.itemIds.map(id => byId.get(id)).filter(item => item.domainId === 'print');
  const duplicateId = bank.find(item => item.domainId === 'print' && item.adaptiveAreaBand === 1
    && item.id !== print[0].id && canonicalLiteracyIdentity(item).familyId === canonicalLiteracyIdentity(print[0]).familyId).id;
  const duplicated = { ...initial, itemIds: initial.itemIds.map(id => id === print[1].id ? duplicateId : id) };
  assert.throws(() => selectLiteracyMockPrintRetakePool(fresh, duplicated, byId), error => error.code === 'mock_fresh_capacity');
  const plannedFamilies = new Set(print.map(item => canonicalLiteracyIdentity(item).familyId));
  const noMatchingSpare = fresh.filter(item => plannedFamilies.has(canonicalLiteracyIdentity(item).familyId)
    || item.constructClaim !== print[0].constructClaim || item.level !== print[0].level || item.modality !== print[0].modality);
  assert.throws(() => selectLiteracyMockPrintRetakePool(noMatchingSpare, initial, byId), error => error.code === 'mock_fresh_capacity');
});
