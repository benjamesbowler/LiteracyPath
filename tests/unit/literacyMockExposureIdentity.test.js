import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyMockBank, literacyMockStimulusKey, normalizeLiteracyMockItem } from '../../src/data/literacyMockBank.js';
import { buildLiteracyExposureIndex, getLiteracyExposure } from '../../src/utils/literacyEvidence.js';

test('different actual picture scenes remain fresh under the same generic direction', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const scenes = bank.filter(item => item.constructClaim === 'picture_to_sentence_meaning');
  assert.ok(scenes.length >= 8);
  assert.equal(new Set(scenes.map(item => item.image)).size, scenes.length);
  assert.equal(new Set(scenes.map(item => item.stimulusKey)).size, scenes.length);
  const history = buildLiteracyExposureIndex({ exposures: [scenes[0]] });
  assert.equal(getLiteracyExposure(scenes[1], history).knownFamiliar, null);
  assert.equal(getLiteracyExposure(scenes[0], history).knownFamiliar, true);
});

test('scene and actual target identity do not become fresh through foils or option order', () => {
  const base = { prompt: 'Which word names a person?', choices: ['vet', 'repair', 'kind'], answer: 'vet' };
  const key = literacyMockStimulusKey(base);
  assert.equal(literacyMockStimulusKey({ ...base, choices: ['kind', 'vet', 'quickly'] }), key);
  assert.notEqual(literacyMockStimulusKey({ ...base, choices: ['nurse', 'repair', 'kind'], answer: 'nurse' }), key);
  const normalized = { prompt: base.prompt, choices: [{ id: 'a', label: 'vet' }, { id: 'b', label: 'repair' }], answer: 'a' };
  assert.equal(literacyMockStimulusKey(normalized), key);
  const pictured = { ...base, image: '/scenes/actual-scene.webp' };
  assert.equal(literacyMockStimulusKey({ ...pictured, prompt: 'A different direction', choices: ['new', 'foils'], answer: 'new' }), literacyMockStimulusKey(pictured));
});

test('explicit targets and authored shared identities take precedence over response evidence', () => {
  const base = { prompt: 'Listen and choose.', choices: ['hat', 'sun'], answer: 'hat' };
  assert.equal(literacyMockStimulusKey({ ...base, targetWord: 'cat' }), 'cat');
  assert.equal(literacyMockStimulusKey({ ...base, passage: 'The cat sat.' }), 'the cat sat.');
  assert.equal(literacyMockStimulusKey({ ...base, stimulusKey: 'shared-family-stimulus' }), 'shared-family-stimulus');
});

test('an odd-one-out rhyme stimulus is its complete spoken comparison, independent of position', () => {
  const item = { formatType: 'RHYME_ODD_ONE_OUT', prompt: 'Which word does NOT rhyme with the others?', choices: ['jam', 'sing', 'ring', 'king'], answer: 'jam' };
  assert.equal(literacyMockStimulusKey({ ...item, choices: ['king', 'jam', 'ring', 'sing'] }), literacyMockStimulusKey(item));
  assert.notEqual(literacyMockStimulusKey({ ...item, choices: ['jam', 'cup', 'pup', 'up'] }), literacyMockStimulusKey(item));
});

test('explicit instructional passages use actual response evidence without inferring every passage is a direction', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const direction = bank.find(item => item.id === 'literacy.writing_revision.complete-thought');
  assert.equal(direction.passageIsInstruction, true);
  assert.equal(direction.stimulusKey, 'response-evidence:["the puppy sleeps."]');
  assert.equal(direction.canonicalPassageId, `sentence-options:${direction.stimulusKey}`);
  const changedFoils = { ...direction, stimulusKey: undefined, choices: direction.choices.map(choice => choice.id === direction.answer ? choice : { ...choice,label:'Another fragment' }) };
  assert.equal(literacyMockStimulusKey(changedFoils), direction.stimulusKey);
  const story = bank.find(item => item.id === 'mock.depth.key_details.ticket');
  assert.equal(story.passageIsInstruction, undefined);
  assert.equal(story.canonicalPassageId, story.passage.toLowerCase());
});

test('dictated fixed HFW targets and Dear-name greeting patterns cannot gain freshness from wrappers', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const spelling = bank.filter(item => item.skillId === 'hfw_1_25' && item.format === 'build_word' && item.targetWord === 'a');
  assert.ok(spelling.length >= 2);
  assert.notEqual(spelling[0].passage, spelling[1].passage);
  assert.equal(new Set(spelling.map(item => item.stimulusKey)).size, 1);
  assert.equal(spelling[0].finiteInventory.kind, 'closed_lexical_target');
  assert.equal(spelling[0].finiteInventory.maximumIndependentTargets, 1);
  assert.equal(getLiteracyExposure(spelling[1], buildLiteracyExposureIndex({ exposures: [spelling[0]] })).knownFamiliar, true);
  const greetings = bank.filter(item => item.skillId === 'punctuation' && item.constructClaim === 'greeting');
  assert.equal(greetings.length, 2);
  assert.equal(greetings[0].stimulusKey, 'salutation_dear_name');
  assert.equal(getLiteracyExposure(greetings[1], buildLiteracyExposureIndex({ exposures: [greetings[0]] })).knownFamiliar, true);
});

test('supplied HFW targets and spatial scene evidence remain shared across different operations', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const supplied = bank.filter(item => item.skillId === 'hfw_1_25' && item.targetWord === 'a'
    && item.requiredAudioCues.some(cue => cue.role === 'target_word' && cue.text === 'a'));
  assert.ok(supplied.some(item => item.format === 'choice'));
  assert.ok(supplied.some(item => item.format === 'build_word'));
  assert.ok(supplied.every(item => item.exposureFamilyId === 'hfw-word:a'));
  const broad = supplied.find(item => item.constructClaim === 'spoken_to_print_high_frequency_word_recognition');
  assert.ok(broad);
  assert.equal(broad.finiteInventory, undefined, 'a broad multi-word operation is not a single-word finite pool');
  const scenes = Map.groupBy(bank.filter(item => item.skillId === 'prepositions' && item.image),item=>item.image);
  const repeated = [...scenes.values()].filter(items=>items.length>1);
  assert.ok(repeated.length>0);
  for(const items of repeated) {
    assert.equal(new Set(items.map(item=>item.exposureFamilyId)).size,1);
    assert.equal(getLiteracyExposure(items[1],buildLiteracyExposureIndex({exposures:[items[0]]})).knownFamiliar,true);
  }
});

test('supplied weekday case forms share their seven lexical targets across sentence wrappers', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const days = bank.filter(item => item.constructClaim === 'supply_weekday_capital_form');
  assert.ok(days.length > 7);
  assert.equal(new Set(days.map(item => item.stimulusKey)).size, 7);
  for (const item of days) {
    const day = item.choices[0].label.toLowerCase();
    assert.equal(item.stimulusKey, `weekday-capital-form:${day}`);
    assert.equal(item.canonicalPassageId, item.stimulusKey);
    assert.equal(item.exposureFamilyId, item.stimulusKey);
    assert.equal(item.itemSnapshot.stimulusKey, item.stimulusKey);
    assert.equal(item.finiteInventory.maximumIndependentTargets, 7);
    assert.equal(item.finiteInventory.controlledTargets.length, 7);
  }
  const mondays = days.filter(item => item.stimulusKey.endsWith(':monday'));
  assert.ok(mondays.length > 1);
  assert.notEqual(mondays[0].passage, mondays[1].passage);
  assert.equal(getLiteracyExposure(mondays[1], buildLiteracyExposureIndex({ exposures: [mondays[0]] })).knownFamiliar, true);
  const locating = normalizeLiteracyMockItem({ ...mondays[0], id: 'case-location-control',
    constructClaim: 'locate_weekday_capital', stimulusKey: 'find the lower-case monday in this sentence',
    passage: 'We swim on monday.' });
  assert.notEqual(locating.stimulusKey, mondays[0].stimulusKey);
  assert.notEqual(locating.canonicalPassageId, mondays[0].canonicalPassageId);
});

test('required pending artwork cannot become available merely because its narration is recorded',()=>{
  const source={id:'test-pending-scene',skillId:'prepositions',domainId:'language',level:1,format:'choice',answerMode:'exact',
    constructClaim:'behind',prompt:'Where is the puppy?',image:'/images/pending-scene.webp',
    choices:[{id:'c0',label:'behind the watering can'},{id:'c1',label:'on the watering can'}],answer:'c0',
    requiredAudioCues:[{role:'instruction',text:'Where is the puppy?',path:'/audio/existing.wav'}],
    mediaDecision:{role:'target-or-scene',constructReview:'pending',answerNeutral:'approved'}};
  const pending=normalizeLiteracyMockItem(source);
  assert.equal(pending.requiredAudioPaths.length,1);
  assert.equal(pending.requiredImagePaths.length,1);
  assert.equal(pending.mediaReady,false);
  assert.equal(pending.itemSnapshot.mediaReady,false);
  const reviewed=normalizeLiteracyMockItem({...source,mediaDecision:{...source.mediaDecision,constructReview:'approved'}});
  assert.equal(reviewed.mediaReady,true);
  assert.equal(reviewed.itemSnapshot.mediaReady,true);
  const missingAudio=normalizeLiteracyMockItem({...source,mediaDecision:reviewed.mediaDecision,requiredAudioCues:[{role:'instruction',text:source.prompt,path:null}]});
  assert.equal(missingAudio.mediaReady,false);
});

test('printed vowel-category targets stay familiar across levels and spelling without merging real contexts', async () => {
  const bank = await loadLiteracyMockBank({ includeUnavailable: true });
  const entry = bank.find(item => item.constructClaim === 'identify_read_split_vowel_sound:a_e'
    && item.level === 1 && item.choices.find(choice => choice.id === item.answer)?.label === 'cane');
  const hard = bank.find(item => item.id === 'lp3.long_vowels_silent_e.l2.B.a_e.v2');
  const supplied = bank.find(item => item.skillId === 'long_vowels' && item.targetWord === 'cane'
    && item.constructClaim === 'silent_e_vowel_contrast');
  assert.ok(entry && hard && supplied);
  assert.equal(hard.stimulusKey, 'cane');
  assert.equal(hard.itemSnapshot.canonicalPassageId, 'cane');
  for (const first of [entry, supplied]) {
    assert.equal(getLiteracyExposure(hard, buildLiteracyExposureIndex({ exposures: [first] })).knownFamiliar, true);
    assert.equal(getLiteracyExposure(first, buildLiteracyExposureIndex({ exposures: [hard] })).knownFamiliar, true);
  }
  const context = normalizeLiteracyMockItem({ ...hard, id: 'word-context-control', passage: 'The cane holds up a young plant.',
    stimulusKey: 'the cane holds up a young plant.', exposureFamilyId: 'unique-context' });
  assert.equal(context.stimulusKey, 'the cane holds up a young plant.');
  assert.equal(context.canonicalPassageId, context.stimulusKey);
  const targetComparison = normalizeLiteracyMockItem({ ...hard, id: 'word-comparison-control', targetWord: 'train',
    stimulusKey: 'train', exposureFamilyId: 'spoken-comparison' });
  assert.equal(targetComparison.stimulusKey, 'train');
});
