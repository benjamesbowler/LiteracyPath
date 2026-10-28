import test from 'node:test';
import assert from 'node:assert/strict';
import { LITERACY_MOCK_RUNTIME_V11 } from '../../src/data/generated/literacyMockRuntimeV11.generated.js';
import { literacyMockBeginnerVocabularyIssue as issue, LITERACY_MOCK_BEGINNER_VOCABULARY as policy } from '../../src/policy/literacyMockBeginnerVocabulary.js';

// V12 inherits this immutable V11 content under its new publication contract.
// Review that derivative without changing the frozen V11 runtime fixtures.
const bank = LITERACY_MOCK_RUNTIME_V11.filter(q => q.adaptiveMixedEligible && !q.tutorialOnly)
  .map(q => ({ ...q, contentVersion: 'literacy-mock-v12', itemSnapshot: { ...q.itemSnapshot, contentVersion: 'literacy-mock-v12' } }));
const item = id => {
  const value = bank.find(q => q.id === id);
  assert.ok(value, `Published fixture missing: ${id}`);
  return value;
};

test('the reported vulture question and unfamiliar lower-band siblings are excluded without changing their snapshots', () => {
  for (const id of [
    'mock.v8.sounds.initial.vulture.v11',
    'mock.v8.sounds.initial.microphone.v11',
    'mock.v8.listening.0.ladle.v11',
    'mock.v8.listening.1.lantern.v11',
    'mock.v11.everyday.reading.0.yam',
    'mock.v11.phonics.cvc-capacity.cob',
    'mock.v8.writing.sentence-capital.1.v11',
  ]) {
    const q = item(id), before = JSON.stringify(q);
    assert.equal(issue(q)?.code, 'beginner_vocabulary', id);
    assert.equal(JSON.stringify(q), before, 'Review must not rewrite historical text, keys or media');
  }
  assert.deepEqual(issue(item('mock.v8.sounds.initial.vulture.v11')).unfamiliarWords, ['vulture']);
});

test('the vocabulary of wrong choices and spoken/printed instructions is reviewed, not only the correct answer', () => {
  for (const domainId of Object.keys(policy.families)) {
    const q = bank.find(value => value.domainId === domainId && value.adaptiveAreaBand === 0 && !issue(value));
    assert.ok(q, domainId);
    for (const replacement of [
      { targetWord: 'astrolabe' },
      { prompt: `${q.prompt} astrolabe` },
      { passage: 'An astrolabe.' },
      { sentence: 'An astrolabe.' },
      { choices: q.choices.map((c, index) => index === q.choices.length - 1 ? { ...c, label: 'astrolabe' } : c) },
      { requiredAudioCues: [...q.requiredAudioCues, { role: 'instruction', text: 'Astrolabe.' }] },
    ]) assert.ok(issue({ ...q, ...replacement })?.unfamiliarWords.includes('astrolabe'), `${domainId}: ${Object.keys(replacement)[0]}`);
  }
  assert.ok(issue(item('lp3.initial_sounds.l2.C.f.v3'))?.unfamiliarWords.includes('volcano'));
  assert.equal(item('lp3.initial_sounds.l2.C.f.v3').targetWord, 'fan');
});

test('familiar longer words, ordinary short phonics words, letters and name case contrasts remain available', () => {
  for (const [domain, targetWords] of [
    ['vocabulary', ['banana', 'toothbrush', 'watermelon', 'shark']],
    ['listening', ['elephant', 'red', 'shark']],
    ['reading', ['fox', 'cub', 'den', 'peg', 'ram', 'rug']],
    ['phonics', ['doll', 'shout', 'seed', 'son', 'dry', 'put', 'wax']],
    ['sound_awareness', ['gate', 'cone', 'chick', 'plum', 'tie']],
    ['writing', ['Maeve', 'Sam']],
    ['print', ['A', 'Z']],
  ]) {
    const q = bank.find(value => value.domainId === domain && value.adaptiveAreaBand <= 1 && !issue(value));
    assert.ok(q, domain);
    for (const targetWord of targetWords) assert.equal(issue({ ...q, targetWord }), null, `${domain}: ${targetWord}`);
  }
});

test('review uses exact lower-band context and does not regrade a harder task or infer scope from its ID', () => {
  const q = item('mock.v8.sounds.initial.vulture.v11');
  for (const replacement of [
    { adaptiveAreaBand: 2 }, { adaptiveAreaBand: '0' }, { adaptiveAreaBand: undefined },
    { contentVersion: undefined }, { contentVersion: 'literacy-mock-v1' },
    { adaptiveAreaVersion: undefined }, { adaptiveAreaVersion: 'areas-future' }, { tutorialOnly: true },
  ]) assert.equal(issue({ ...q, ...replacement }), null);
  assert.equal(issue({ ...q, id: 'a-new-id', sourceItemId: 'a-new-source' })?.code, 'beginner_vocabulary');
  for (let version = 1; version <= 11; version++) {
    for (const adaptiveAreaVersion of ['areas-v5', 'areas-v6']) {
      assert.equal(issue({ ...q, contentVersion: `literacy-mock-v${version}`, adaptiveAreaVersion }), null,
        `V${version} keeps its historical admission and saved evidence`);
    }
  }
  assert.deepEqual(policy.contentVersions, ['literacy-mock-v12']);
  assert.deepEqual(policy.areaVersions, ['areas-v6']);
});

test('all eight lower-band task families are covered and retain usable First steps and Starter pools', () => {
  for (const domain of Object.keys(policy.families)) {
    for (const band of policy.bands) {
      const before = bank.filter(q => q.domainId === domain && q.adaptiveAreaBand === band);
      assert.ok(before.length > 0, `${domain}/${band} exists`);
      assert.ok(before.every(q => policy.families[domain].skills.includes(q.skillId)), `${domain}/${band} has no unreviewed task family`);
      assert.ok(before.filter(q => !issue(q)).length >= 10, `${domain}/${band} retains a real pool`);
    }
  }
});
