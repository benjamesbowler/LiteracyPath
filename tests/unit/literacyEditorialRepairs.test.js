import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { loadLiteracyPracticeExtensions } from '../../src/data/literacyPracticeExtensions.js';
import { loadLiteracyReferenceBank } from '../../src/data/literacyReferenceBank.js';
import { loadLiteracyMockBank, LITERACY_MOCK_VERSION } from '../../src/data/literacyMockBank.js';
import { getLedaInstructionAudioPath, getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';
import { literacyMockManifestSql } from '../../tools/generateLiteracyMockManifest.mjs';
import theme from '../../tools/assessmentRebuild/authoring/theme_higher_comprehension.mjs';

test('v2 repairs published comprehension wording while v1 retains the complete historical contract', async () => {
  assert.equal(LITERACY_MOCK_VERSION, 'literacy-mock-v2');
  const [old, current] = await Promise.all([
    loadLiteracyMockBank({ contentVersion: 'literacy-mock-v1' }), loadLiteracyMockBank(),
  ]);
  assert.equal(old.length, 3958);
  assert.equal(current.length, 3976);
  const id = 'lp3.key_details.l1.A.who.v43';
  const before = old.find(item => item.id === id), after = current.find(item => item.id === id);
  assert.equal(before.choices.find(choice => choice.id === before.answer).label, 'the person looking after the school building');
  assert.equal(after.choices.find(choice => choice.id === after.answer).label, 'the caretaker');
  assert.equal(before.contentVersion, 'literacy-mock-v1');
  assert.equal(after.contentVersion, 'literacy-mock-v2');
  assert.equal(after.canonicalItemId, id);
  const listening = current.find(item => item.id === `listen:${id}`);
  assert.equal(listening.canonicalItemId, after.canonicalItemId);
  assert.equal(listening.canonicalPassageId, after.canonicalPassageId);
  assert.equal(listening.exposureFamilyId, after.exposureFamilyId);
  await assert.rejects(loadLiteracyMockBank({ contentVersion: 'unpublished-version' }), /Unsupported/);
});

test('retired duplicate picture sequences are recoverable but never offered as new practice', async () => {
  const current = await loadLiteracyPracticeBank(), recovery = await loadLiteracyPracticeBank({ includeRetired: true });
  const retired = recovery.filter(item => item.retiredFromNewPractice);
  assert.equal(retired.length, 6);
  for (const item of retired) {
    assert.ok(item.retirementReason.includes('same three'));
    assert.ok(item.literacyAudioReady);
    assert.equal(current.some(candidate => candidate.id === item.id), false);
  }
  const details = current.filter(item => item.mapInteraction === 'picture_choice' && item.skillId === 'listen_key_details');
  assert.equal(details.length, 9);
  for (const item of details) {
    assert.ok(item.passage.split(/\s+/).length <= 12);
    assert.ok(item.audioRequirements.some(cue => cue.role === 'passage' && cue.path === getLedaInstructionAudioPath(item.passage)));
    assert.ok(item.exposureFamilyId.startsWith('pictured-story:'));
  }
});

test('semantic covers, contents and glossaries preserve every literal word of the source', async () => {
  const features = (await loadLiteracyPracticeExtensions()).filter(item => item.textFeature);
  assert.equal(features.length, 14);
  for (const item of features) {
    const feature = item.textFeature;
    const lines = feature.kind === 'book_cover'
      ? [feature.title, ...(feature.subtitle ? [feature.subtitle] : []), ...feature.credits.map(credit => `${credit.label} ${credit.name}`)]
      : feature.kind === 'contents'
        ? [feature.title, ...feature.entries.map(entry => `${entry.label} — page ${entry.page}`)]
        : [...(feature.context ? [feature.context] : []), feature.title, ...feature.entries.map(entry => `${entry.term}: ${entry.definition}`)];
    assert.equal(lines.join('\n'), item.passage, item.id);
    assert.equal(feature.answer, undefined);
    assert.equal(feature.correct, undefined);
  }
});

test('additional sound work has exact oral cues and does not print spelling as evidence', async () => {
  const oral = (await loadLiteracyPracticeExtensions()).filter(item => item.skillId === 'sound_manipulation');
  assert.equal(oral.length, 34);
  assert.equal(oral.filter(item => item.constructClaim === 'blend_phonemes').length, 12);
  assert.equal(oral.filter(item => item.constructClaim === 'delete_word_part').length, 14);
  for (const item of oral) {
    assert.equal(item.passage, '');
    assert.equal(item.hideWrittenLabels, true);
    assert.equal(item.literacyAudioReady, true);
    assert.ok(item.exposureFamilyId);
    assert.equal(item.choices.some(word => word === 'flour'), false, 'Flower/flour are not different oral answers.');
    for (const cue of item.audioRequirements.filter(cue => cue.role === 'choice')) {
      assert.equal(cue.path, getLedaWordAudioPath(cue.text));
    }
  }
});

test('vowel classification specifies the first sound and scene matches require visible actions', () => {
  const bank = loadLiteracyReferenceBank();
  const find = id => bank.find(item => item.sourceProvenance.sourceId === id);
  for (const [word, vowel] of [['igloo','i'], ['umbrella','u']]) {
    const item = find(`classify-${word}`);
    assert.equal(item.prompt, 'Listen to the word. What is the first sound?');
    assert.equal(item.answer, `short ${vowel}`);
    assert.equal(item.instructionAudioPath, getLedaInstructionAudioPath(item.prompt));
    assert.equal(item.literacyAudioReady, true);
  }
  for (const id of ['picture-camping','picture-snowboarding','picture-doing-schoolwork','picture-partner']) {
    assert.doesNotMatch(find(id).choices.join(' '), /likes|are friends/);
  }
  assert.equal(find('picture-partner').answer, 'The children are smiling.');
  assert.equal(find('police-worker').constructClaim, 'occupation_vocabulary');
});

test('theme repair keeps reasonable positive alternatives and reuses exact recorded choices', () => {
  for (const variant of [40,41,50,51]) {
    const item = theme.items.find(row => row.v === variant);
    assert.match(item.note, /only the key transfers the specific change/);
    assert.equal(item.choices.filter(choice => choice.k).length, 1);
    for (const choice of item.choices) assert.ok(getLedaInstructionAudioPath(choice.t) || getLedaWordAudioPath(choice.t), choice.t);
    assert.doesNotMatch(item.choices.map(choice => choice.t).join(' '), /hides|blames|always be right|without discussion|must stop/);
  }
});

test('heard sound, printed mapping and spelling completion keep distinct construct claims', async () => {
  const bank = await loadLiteracyPracticeBank({ includeReference: false });
  const first = bank.filter(item => item.skillId === 'initial_sounds' && item.formatType === 'FIRST_SOUND');
  assert.equal(first.length, 149);
  assert.ok(first.every(item => item.constructClaim === 'initial_sound_grapheme_mapping'));
  const printedFinal = bank.filter(item => item.skillId === 'final_sounds' && item.evidenceModality === 'audio+print' && item.formatType !== 'ENDING_SOUND');
  assert.equal(printedFinal.length, 27);
  assert.ok(printedFinal.every(item => item.constructClaim === 'final_sound_comparison_with_print_support'));
  const heardPictures = bank.filter(item => item.skillId === 'digraphs' && item.formatType === 'DIGRAPH_IMAGE_CHOICE');
  assert.equal(heardPictures.length, 23);
  assert.ok(heardPictures.every(item => item.constructClaim === 'heard_sound_picture_discrimination' && item.hideWrittenLabels));
  const spelling = bank.filter(item => item.skillId === 'digraphs' && item.formatType === 'DIGRAPH_COMPLETE_WORD');
  assert.equal(spelling.length, 69);
  assert.ok(spelling.every(item => item.constructClaim === 'map_spoken_word_to_digraph_spelling'));
});

test('the huge synonym question no longer offers another valid size synonym', async () => {
  const bank = await loadLiteracyPracticeBank({ focus: 'antonyms_synonyms', includeReference: false });
  const item = bank.find(row => row.prompt === "Which word means very large, just like 'huge'?");
  assert.ok(item);
  assert.equal(item.answer, 'enormous');
  assert.deepEqual(new Set(item.choices), new Set(['enormous','small','narrow','tall']));
});

test('publication SQL refuses conflicting snapshots and publishes only a complete unique manifest', () => {
  const manifest = { contentVersion: LITERACY_MOCK_VERSION, itemCount: 1, unavailableItemIds: [], items: [{ id: 'one' }] };
  const sql = literacyMockManifestSql(manifest);
  assert.match(sql, /old\.item is distinct from incoming\.item/);
  assert.match(sql, /on conflict \(content_version, id\) do nothing/);
  assert.match(sql, /literacy_mock_publications/);
  assert.throws(() => literacyMockManifestSql({ ...manifest, itemCount: 2 }), /exact count/);
  assert.throws(() => literacyMockManifestSql({ ...manifest, itemCount: 2, items: [...manifest.items, ...manifest.items] }), /unique/);
});
