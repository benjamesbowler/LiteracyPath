import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, scoreLiteracyMockResponse } from '../../src/data/literacyMockBank.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import {
  correctLiteracyMockDemandV4, buildLiteracyMockDemandItemsV4, literacyMockDemandV4MissingAudio,
} from '../../src/data/literacyMockDemandCorrectionsV4.js';

const v3 = await loadLiteracyMockBank({ contentVersion: 'literacy-mock-v3', includeUnavailable: true });
const original = JSON.stringify(v3);
const bank = v3.map(item => correctLiteracyMockDemandV4(item, v3));
const byId = id => bank.find(item => item.id === id);
const key = item => item.choices.find(choice => choice.id === item.answer)?.label;
const endingClaims = new Set(['full_stop', 'question_mark', 'exclamation_mark']);
const normalize = text => text.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();

test('v4 corrections preserve every v3 object, literal task and exposure identity', () => {
  assert.equal(JSON.stringify(v3), original);
  const oldDog = v3.find(item => item.id === 'literacy.punctuation.sentence-fix-easy-1');
  const oldOwl = v3.find(item => item.id === 'literacy.punctuation.sentence-fix-hard-7');
  assert.equal(oldDog.passage, 'I see a big dog___');
  assert.equal(oldOwl.passage, 'The owl hunts when the moon is bright___');
  assert.equal(oldDog.constructClaim, 'full_stop');
  for (const item of bank.filter(item => item.sourceProvenance?.v4Correction)) {
    const old = v3.find(candidate => candidate.id === item.id);
    assert.equal(item.contentVersion, 'literacy-mock-v4');
    assert.equal(item.canonicalItemId, old.canonicalItemId);
    assert.equal(item.exposureFamilyId, old.exposureFamilyId);
    assert.equal(item.itemSnapshot.itemSnapshot, undefined);
    const { itemSnapshot, ...fields } = item;
    assert.deepEqual(itemSnapshot, fields);
  }
  assert.deepEqual(buildLiteracyMockDemandItemsV4(bank), []);
});

test('the actual dog/owl pair changes from a named end mark to a shared sentence-boundary operation', () => {
  const entry = byId('literacy.punctuation.sentence-fix-easy-1');
  const harder = byId('literacy.punctuation.sentence-fix-hard-7');
  assert.equal(entry.prompt, 'Which choice separates the two complete sentences?');
  assert.equal(harder.prompt, entry.prompt);
  assert.equal(entry.constructClaim, 'punctuate_two_sentence_boundary');
  assert.equal(harder.constructClaim, entry.constructClaim);
  assert.equal(entry.passage, 'the dog ran the cat hid');
  assert.equal(key(entry), 'The dog ran. The cat hid.');
  assert.equal(harder.passage, 'before the sun rose, the birds woke the farmer got up');
  assert.equal(key(harder), 'Before the sun rose, the birds woke. The farmer got up.');
  assert.deepEqual(harder.choices.map(choice => choice.label), [
    'Before the sun rose, the birds woke. The farmer got up.',
    'Before the sun rose. The birds woke, the farmer got up.',
    'Before the sun rose, the birds. Woke the farmer got up.',
  ]);
  assert.equal(entry.modality, harder.modality);
  assert.deepEqual(entry.requiredAudioCues.map(cue => cue.role), ['instruction']);
  assert.deepEqual(harder.requiredAudioCues, entry.requiredAudioCues);
});

test('every inherited full-stop/question/exclamation sibling is corrected with a real grammar contrast', () => {
  const sources = v3.filter(item => item.skillId === 'punctuation' && item.modality === 'recognition'
    && endingClaims.has(item.constructClaim));
  assert.equal(sources.length, 60);
  for (const source of sources) {
    const item = byId(source.id);
    assert.equal(item.constructClaim, 'punctuate_two_sentence_boundary', source.id);
    assert.deepEqual(correctLiteracyMockDemandV4(source), item, 'Standalone correction must not depend on bank order or filtering.');
    assert.equal(item.mediaReady, true);
    assert.equal(item.requiredAudioCues[0].path, getLedaInstructionAudioPath(item.prompt));
    assert.equal(item.choices.length, 3);
    assert.equal(new Set(item.choices.map(choice => choice.label)).size, 3);
    assert.ok(item.choices.every(choice => choice.label.split(' ').length === key(item).split(' ').length));
    assert.ok(item.choices.every(choice => (choice.label.match(/\./g) || []).length === 2));
    assert.equal(scoreLiteracyMockResponse(item, item.answer), true);
    for (const foil of item.choices.filter(choice => choice.id !== item.answer)) {
      assert.equal(scoreLiteracyMockResponse(item, foil.id), false);
      assert.ok(item.distractorRationales[foil.id]);
    }
    if (item.level === 1) {
      assert.doesNotMatch(key(item), /^(While|When|Before|After|Because|Although)\b/);
      assert.equal(item.taskDemand.dependentClause, false);
      assert.equal(key(item).split('. ')[0].toLowerCase(), item.taskDemand.mainClauses[0]);
    } else {
      // Literal text, independent of the difficulty description, contains a
      // dependent clause. The first foil ends it as a standalone fragment.
      assert.match(key(item), /^(While|When|Before|After|Because|Although)\b.+, .+\. .+\.$/);
      assert.match(item.choices[1].label, /^(While|When|Before|After|Because|Although)\b[^,.]+\. .+, .+\.$/);
      assert.equal(key(item).split('. ')[0].toLowerCase(), item.taskDemand.keyBoundaryAfter);
    }
  }
  assert.equal(bank.filter(item => item.skillId === 'punctuation' && item.modality === 'recognition'
    && endingClaims.has(item.constructClaim)).length, 0);
});

test('Mara uses the same recorded evidence with close affect competitors; clue count does not justify extension', () => {
  const entry = byId('lp3.inference.l1.A.feeling_from_evidence.v1');
  const harder = byId('mock.depth.inference.stage');
  assert.equal(key(entry), 'nervous');
  assert.deepEqual(entry.choices.map(choice => choice.label).sort(), ['angry', 'bored', 'nervous', 'sleepy']);
  assert.equal(key(harder), 'nervous');
  assert.deepEqual(harder.choices.map(choice => choice.label), ['nervous', 'excited', 'confident']);
  assert.match(harder.passage, /rehearsed her song all week/);
  assert.match(harder.passage, /twisting the edge of her sleeve/);
  assert.match(harder.passage, /checked the opening words again/);
  assert.equal(harder.passage, v3.find(item => item.id === harder.id).passage);
  assert.match(harder.distractorRationales.c1, /Excitement.*taking part.*checking/);
  assert.match(harder.distractorRationales.c2, /Practice.*confidence.*tense/);
  assert.doesNotMatch(harder.difficultyEvidence, /three.*clues|longer|sentence count/);
  assert.equal(harder.constructClaim, entry.constructClaim);
});

test('all ten feeling siblings use specific trigger/time/role disambiguation and exact recorded paired access', () => {
  const readings = bank.filter(item => item.skillId === 'inference' && item.level === 2
    && item.constructClaim === 'feeling_from_evidence');
  assert.equal(readings.length, 10);
  for (const reading of readings) {
    const listening = bank.find(item => item.skillId === 'listen_inference'
      && item.level === reading.level && item.canonicalItemId === reading.canonicalItemId);
    assert.ok(listening, reading.id);
    assert.equal(listening.passage, reading.passage);
    assert.deepEqual(listening.choices.map(choice => choice.label), reading.choices.map(choice => choice.label));
    assert.equal(listening.displayPassageDuringResponse, false);
    assert.equal(reading.displayPassageDuringResponse, true);
    assert.deepEqual(reading.requiredAudioCues.map(cue => cue.role), ['instruction']);
    assert.equal(listening.requiredAudioCues.filter(cue => cue.role === 'passage')[0].text, reading.passage);
    assert.ok(listening.requiredAudioCues.every(cue => cue.path));
    assert.equal(listening.mediaReady, true);
    assert.ok(reading.choices.every(choice => choice.label.split(' ').length === 1));
    for (const cue of listening.requiredAudioCues.filter(cue => cue.role === 'choice')) {
      assert.equal(cue.path, getLedaWordAudioPath(cue.text) || getLedaInstructionAudioPath(cue.text));
      assert.equal(listening.choices.find(choice => choice.id === cue.choiceId).label, cue.text);
    }
    assert.ok(reading.distractorRationales.c1.length > 40);
    assert.ok(reading.distractorRationales.c2.length > 40);
  }
  const ring = byId('mock.capacity.inference.found-ring');
  assert.deepEqual(ring.choices.map(choice => choice.label), ['relieved', 'worried', 'grateful']);
  assert.match(ring.prompt, /at the end/);
  assert.match(ring.distractorRationales.c1, /earlier.*end/);
  const reunion = byId('mock.depth.inference.reunion');
  assert.deepEqual(reunion.choices.map(choice => choice.label), ['excited', 'relieved', 'proud']);
  assert.match(reunion.distractorRationales.c2, /Dev did not make the trip/);
});

test('all location and prediction siblings retain exact tasks and receive overlapping-clue alternatives', () => {
  for (const claim of ['where_am_i', 'what_happens_next']) {
    const readings = bank.filter(item => item.skillId === 'inference' && item.level === 2 && item.constructClaim === claim);
    assert.equal(readings.length, 10);
    assert.ok(readings.every(item => item.sourceProvenance.v4Correction));
    assert.ok(readings.every(item => item.taskDemand.sharedClueFoils.length === 2));
    assert.ok(readings.every(item => item.mediaReady));
  }
  const books = byId('mock.capacity.inference.returned-books');
  assert.deepEqual(books.choices.map(choice => choice.label), [
    'at a library’s book-return desk', 'at a library reading table', 'at a bookshop till',
  ]);
  assert.match(books.passage, /return slot/);
  assert.match(books.passage, /borrowing card/);
  const entry = byId('lp3.inference.l1.A.what_happens_next.v1');
  const bus = byId('mock.capacity.inference.bus-number-check');
  assert.equal(bus.constructClaim, entry.constructClaim);
  assert.deepEqual(bus.choices.map(choice => choice.label), [
    'board the number twelve bus going to the library',
    'board the number twelve bus going to the market',
    'board the number ten bus going to the library',
  ]);
  assert.match(bus.passage, /number twelve bus to the market/);
  assert.match(bus.passage, /number ten bus to the library/);
  assert.match(bus.passage, /number twelve bus showing Library/);
});

test('every harder prediction has competing plans, an exception or two selection conditions in the literal account', () => {
  const cases = [
    ['kite', /was sweeping leaves/, /set the dustpan.*followed her/, /kite.*Dad looked up.*raised the broom/s],
    ['plant', /root poked through.*bigger pot/s, /bigger pot.*for later/, /jug.*over the dry soil/s],
    ['loose-shoelace', /chose a clear place.*raised her hand/s, /one shoe was untied/, /stepped away.*one loose end in each hand/s],
    ['empty-paint-tray', /Earlier.*stirred the paint/, /no paint left in the tray/, /lifted it over the empty tray.*away from the wall/s],
    ['bus-number-check', /number twelve bus to the market/, /number ten bus to the library/, /number twelve bus showing Library.*card/s],
    ['paper-rip', /tape to hang a paper chain/, /it broke between two loops/, /torn edges together.*peeled a strip of tape/s],
    ['overflowing-bin', /usually.*bag inside an empty bin/, /Today.*still full/, /bag.*open beside the bin.*reached for the first bottle/s],
    ['garden-hose-kink', /turned the tap higher.*flow stayed weak/s, /sharply bent beneath a chair leg/, /reached for the chair with both hands/],
    ['recipe-measure', /poured oats straight.*feed birds/s, /Now.*making biscuits.*recipe.*one cup/s, /mixing bowl.*measuring cup/s],
    ['quiet-birdwatch', /empty patch.*lowered them/s, /friend pointed.*farther to the left/s, /lifted the binoculars again.*towards the stem/s],
  ];
  for (const [name, competingPlan, condition, immediateIntention] of cases) {
    const item = bank.find(candidate => candidate.skillId === 'inference' && candidate.level === 2
      && candidate.constructClaim === 'what_happens_next' && candidate.id.endsWith(`.${name}`));
    assert.ok(item, name);
    assert.match(item.passage, competingPlan, name);
    assert.match(item.passage, condition, name);
    assert.match(item.passage, immediateIntention, name);
    assert.notEqual(item.passage, v3.find(candidate => candidate.id === item.id).passage, name);
    assert.ok(item.passage.split(/\s+/).length <= 110, name);
  }
});

test('every harder location requires separating earlier setting clues from the current visit and functional evidence', () => {
  const cases = [
    ['repair', /had hired a bicycle/, /different shop/, /stand to examine the tyre.*customer’s bicycle chain/s],
    ['bakery', /mix bread dough at home/, /Later.*buy rolls/s, /behind the counter.*large oven.*coins/s],
    ['returned-books', /sat at a quiet table/, /walked across the room/, /counter.*return slot.*borrowing card/s],
    ['tooth-check', /haircut that morning/, /Later.*another appointment/s, /open his mouth.*small mirror.*each tooth/s],
    ['departure-board', /finished a flight/, /Next.*train/s, /track four.*platform.*not arrived/s],
    ['animal-check', /shown her rabbit.*visitors/s, /afternoon.*another place/s, /scales.*examination table.*health card/s],
    ['baking-counter', /market stall.*finished loaves/s, /walked on.*entered.*shop/s, /soft dough.*oven.*payment/s],
    ['paintings-room', /unfinished picture.*workroom/s, /Later.*different building/s, /labels naming artists.*guide.*without touching/s],
    ['lane-rope', /boats on a lake that morning/, /After lunch.*went to his lesson/s, /lanes.*breathe out under water.*lifeguard/s],
    ['plant-labels', /vegetables.*cut flowers/s, /next shop/, /living plants in pots.*Labels.*light.*potting soil/s],
  ];
  for (const [name, priorSetting, transition, currentEvidence] of cases) {
    const item = bank.find(candidate => candidate.skillId === 'inference' && candidate.level === 2
      && candidate.constructClaim === 'where_am_i' && candidate.id.endsWith(`.${name}`));
    assert.ok(item, name);
    assert.match(item.passage, priorSetting, name);
    assert.match(item.passage, transition, name);
    assert.match(item.passage, currentEvidence, name);
    assert.notEqual(item.passage, v3.find(candidate => candidate.id === item.id).passage, name);
    assert.ok(item.passage.split(/\s+/).length <= 110, name);
    const lengths = item.choices.map(choice => choice.label.split(/\s+/).length);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 2, name);
  }
});

test('required exact listening recordings determine readiness and pending cues form a deduplicated worklist', () => {
  const gaps = literacyMockDemandV4MissingAudio(bank);
  assert.equal(new Set(gaps.map(cue => `${cue.role}:${cue.text}`)).size, gaps.length);
  const bus = byId('mock.capacity.listen_inference.bus-number-check');
  const passage = bus.requiredAudioCues.find(cue => cue.role === 'passage');
  assert.equal(passage.text, bus.passage);
  assert.equal(bus.mediaReady, bus.requiredAudioCues.every(cue => Boolean(cue.path)));
  assert.equal(gaps.filter(cue => cue.role === 'passage' && cue.itemIds.includes(bus.id)).length, passage.path ? 0 : 1);
  const expectedGaps = new Set(bank.flatMap(item => item.requiredAudioCues.filter(cue => !cue.path)
    .map(cue => `${cue.role}:${cue.text}`)));
  assert.deepEqual(new Set(gaps.map(cue => `${cue.role}:${cue.text}`)), expectedGaps);
  for (const item of bank.filter(item => item.missingAudioCues?.length)) {
    assert.equal(item.modality, 'listening');
    assert.equal(item.mediaReady, false);
    for (const missing of item.missingAudioCues) {
      assert.equal(item.requiredAudioCues.find(cue => cue.role === missing.role && cue.text === missing.text).path, '');
      assert.ok(gaps.some(cue => cue.text === missing.text && cue.role === missing.role && cue.itemIds.includes(item.id)));
    }
  }
});

test('corrected task pools retain enough mutually fresh stimuli for two adaptive sittings and a six-item extension check', () => {
  const conditions = [
    ['punctuation', 'punctuate_two_sentence_boundary', 30, 30],
    ['inference', 'feeling_from_evidence', 14, 10],
    ['listen_inference', 'listening_feeling_from_evidence', 14, 10],
    ['inference', 'where_am_i', 12, 10],
    ['inference', 'what_happens_next', 12, 10],
  ];
  for (const [skill, claim, entries, extensions] of conditions) {
    const pool = bank.filter(item => item.skillId === skill && item.constructClaim === claim);
    for (const [level, count] of [[1, entries], [2, extensions]]) {
      const items = pool.filter(item => item.level === level && item.mediaReady);
      assert.equal(items.length, count, `${skill}/${claim}/${level}`);
      for (const field of ['canonicalItemId', 'canonicalPassageId', 'exposureFamilyId', 'stimulusKey']) {
        assert.equal(new Set(items.map(item => normalize(item[field]))).size, count, `${skill}/${claim}/${level}/${field}`);
      }
    }
    // Two entry -> extension -> extension administrations use two entry and
    // four extension families; six further extension families still remain.
    const used = pool.filter(item => item.level === 1).slice(0, 2)
      .concat(pool.filter(item => item.level === 2).slice(0, 4));
    const seen = new Set(used.flatMap(item => [item.canonicalItemId, item.canonicalPassageId, item.exposureFamilyId, item.stimulusKey]));
    assert.ok(pool.filter(item => item.level === 2 && item.mediaReady
      && [item.canonicalItemId, item.canonicalPassageId, item.exposureFamilyId, item.stimulusKey].every(id => !seen.has(id))).length >= 6);
  }
});
