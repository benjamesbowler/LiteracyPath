import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { loadLiteracyMockBank, normalizeLiteracyMockItem, scoreLiteracyMockResponse, LITERACY_MOCK_SKILLS } from '../../src/data/literacyMockBank.js';
import { listLiteracyMockAudioGaps, LITERACY_MOCK_ATLAS, literacyMockObjectImage } from '../../src/data/literacyMockItems.js';
import { createLiteracyMockManifest, literacyMockManifestSql } from '../../tools/generateLiteracyMockManifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const bank = await loadLiteracyMockBank({ includeUnavailable: true });
const practice = await loadLiteracyPracticeBank({ includeReference: false });

test('mock retains the published 47-skill bank and adds six real response formats', async () => {
  assert.equal(new Set(bank.map(item => item.id)).size, bank.length);
  for (const source of practice) assert.ok(bank.some(item => item.id === source.id), source.id);
  assert.deepEqual(new Set(bank.map(item => item.format)), new Set(['choice', 'build_word', 'select_text', 'multi_select', 'order', 'match']));
  assert.equal(bank.filter(item => item.sourceProvenance.kind === 'original_mock_practice').length, 60);
  const ready = await loadLiteracyMockBank();
  for (const skill of LITERACY_MOCK_SKILLS) for (const level of [1, 2]) {
    assert.ok(ready.some(item => item.skillId === skill.id && item.level === level), `${skill.id}:${level}`);
  }
  assert.equal(new Set(ready.map(item => item.domainId)).size, 8);
  assert.equal(new Set(ready.map(item => item.mapDomainId)).size, 4);
});

test('all 315 native letter/sound builds retain tiles and hide the spelling target', () => {
  const builds = bank.filter(item => item.format === 'build_word' && !item.id.startsWith('mock.'));
  assert.equal(builds.length, 315);
  for (const item of builds) {
    const source = practice.find(question => question.id === item.id);
    assert.equal(item.answer, source.answer);
    assert.equal(item.answerMode, 'exact');
    assert.equal(item.renderTargetText, false);
    assert.deepEqual(item.choices.map(choice => choice.label), source.letterTiles || source.letterBank || source.soundTiles);
    if (source.sentence) {
      assert.equal(item.passage, source.sentence);
      assert.ok(item.passage.includes('___'));
      assert.notEqual(item.passage, source.sentenceText);
    }
    assert.equal(item.requiredAudioCues.some(cue => cue.role === 'choice'), false);
    assert.ok(scoreLiteracyMockResponse(item, source.answer));
    assert.equal(scoreLiteracyMockResponse(item, item.choices.map(choice => choice.id)), false);
  }
});

test('literal case/punctuation keys become stable choice IDs without changing the source', () => {
  // Exercise the normalizer against today's practice authoring. The published
  // mock bank separately retains its versioned server contract.
  for (const source of practice) {
    const item = normalizeLiteracyMockItem(source);
    if (item.format !== 'choice') continue;
    assert.equal(item.choices.find(choice => choice.id === item.answer)?.label, source.answer);
    assert.equal(item.choices.filter(choice => choice.id === item.answer).length, 1);
    assert.ok(scoreLiteracyMockResponse(item, item.answer));
    assert.equal(scoreLiteracyMockResponse(item, 'unknown'), false);
  }
});

test('every dictated word can be constructed from the available visible tiles exactly once each', () => {
  for (const item of bank.filter(value => value.format === 'build_word')) {
    const compose = (prefix, remaining) => prefix === item.answer || remaining.some((choice, index) =>
      item.answer.startsWith(prefix + choice.label) && compose(prefix + choice.label, remaining.filter((_, i) => i !== index)));
    assert.ok(compose('', item.choices), item.id);
    assert.equal(item.hideWrittenLabels, false, item.id);
  }
  for (const item of bank.filter(value => value.hideWrittenLabels)) {
    assert.ok(item.choices.every(choice => choice.audioPath), item.id);
  }
});

test('silent reading and printed recognition have no accidental narrated answer shortcuts', () => {
  for (const item of bank.filter(item => item.modality === 'reading')) {
    assert.ok(item.requiredAudioCues.every(cue => cue.role === 'instruction'), item.id);
    assert.ok(item.choices.every(choice => !choice.audioPath), item.id);
  }
  for (const item of bank.filter(item => item.domainId === 'phonics' && !item.hideWrittenLabels)) {
    assert.ok(item.choices.every(choice => !choice.audioPath), item.id);
  }
  const listening = bank.find(item => item.id.startsWith('listen:'));
  assert.equal(listening.displayPassageDuringResponse, false);
  assert.ok(listening.requiredAudioCues.some(cue => cue.role === 'passage'));
});

test('missing required audio remains unavailable and is never replaced by browser speech', async () => {
  const ready = await loadLiteracyMockBank();
  const gaps = await listLiteracyMockAudioGaps();
  for (const item of bank) {
    assert.equal(item.mediaReady, item.requiredAudioCues.every(cue => Boolean(cue.path)));
    assert.equal(ready.some(value => value.id === item.id), item.mediaReady);
    assert.deepEqual(item.requiredAudioPaths, [...new Set(item.requiredAudioCues.map(cue => cue.path).filter(Boolean))]);
    for (const asset of [...item.requiredAudioPaths, ...item.requiredImagePaths]) assert.ok(fs.existsSync(path.join(root, 'public', asset.split('#')[0])), `${item.id}:${asset}`);
  }
  assert.ok(gaps.every(gap => gap.text && gap.role && gap.itemIds.length));
});

test('all new rhyme choices and spelling pictures resolve exact whole cells of one original illustration set', async () => {
  const pixels = fs.readFileSync(path.join(root, 'public', LITERACY_MOCK_ATLAS.path));
  assert.equal(createHash('sha256').update(pixels).digest('hex'), LITERACY_MOCK_ATLAS.sha256);
  const metadata = await sharp(pixels).metadata();
  assert.equal(metadata.width, LITERACY_MOCK_ATLAS.width);
  assert.equal(metadata.height, LITERACY_MOCK_ATLAS.height);
  assert.equal(metadata.format, 'webp');
  assert.equal(pixels.byteLength, LITERACY_MOCK_ATLAS.bytes);
  assert.ok(pixels.byteLength < 200000);
  assert.notEqual(LITERACY_MOCK_ATLAS.originalPngSha256, LITERACY_MOCK_ATLAS.sha256);
  assert.equal(new Set(LITERACY_MOCK_ATLAS.words).size, 23);
  for (const item of bank.filter(value => value.id.startsWith('mock.') && value.requiredImagePaths.length)) {
    const asset = item.sourceProvenance.assets[0];
    assert.equal(asset.sha256, LITERACY_MOCK_ATLAS.sha256);
    if (item.image) assert.equal(item.image, literacyMockObjectImage(item.targetWord));
    for (const choice of item.choices.filter(value => value.image)) {
      assert.equal(choice.image, literacyMockObjectImage(choice.label));
      assert.equal(choice.imageAlt, choice.label);
    }
    assert.deepEqual(item.itemSnapshot.sourceProvenance.assets, item.sourceProvenance.assets);
  }
  assert.throws(() => literacyMockObjectImage('unreviewed-object'), /unavailable/);
});

test('selectable text preserves token position, sentence punctuation and a valid unique expected token', () => {
  for (const item of bank.filter(item => item.format === 'select_text')) {
    assert.equal(item.choices.map(choice => choice.label).join(' '), item.passage);
    assert.deepEqual(item.choices.map(choice => choice.tokenIndex), item.choices.map((_, index) => index));
    assert.equal(item.choices.filter(choice => choice.id === item.answer).length, 1);
    const selected = item.choices.find(choice => choice.id === item.answer);
    if (item.constructClaim === 'first_word') assert.equal(selected.tokenIndex, 0);
    if (item.constructClaim === 'last_word') assert.equal(selected.tokenIndex, item.choices.length - 1);
    if (item.constructClaim === 'locate_missing_capital') assert.match(selected.label, /^[a-z]/);
  }
});

test('multiselect is set equality; order and match require the complete correct sequence', () => {
  for (const item of bank.filter(item => ['multi_select', 'order', 'match'].includes(item.format))) {
    assert.ok(item.answer.every(id => item.choices.some(choice => choice.id === id)));
    assert.ok(scoreLiteracyMockResponse(item, item.answer));
    assert.equal(scoreLiteracyMockResponse(item, item.answer.slice(1)), false);
    assert.equal(scoreLiteracyMockResponse(item, [...item.answer, item.answer[0]]), false);
    assert.equal(scoreLiteracyMockResponse(item, [...item.answer].reverse()), item.answerMode === 'set');
    if (item.format === 'match') assert.equal(item.matchTargets.length, item.answer.length);
  }
});

test('oral rhyme pictures are complete, named, audibly delivered, and never print the target words', () => {
  const rhymes = bank.filter(item => item.constructClaim === 'spoken_rhyme_pair');
  assert.equal(rhymes.length, 6);
  for (const item of rhymes) {
    assert.equal(item.hideWrittenLabels, true);
    assert.equal(item.passage, '');
    assert.equal(item.selectCount, 2);
    assert.ok(item.choices.every(choice => choice.image && choice.imageAlt === choice.label && choice.audioPath));
    assert.deepEqual(item.requiredAudioCues.filter(cue => cue.role === 'choice').map(cue => cue.choiceId), item.choices.map(choice => choice.id));
  }
});

test('canonical private manifest uses the same identities, answers, audio requirements and snapshots', async () => {
  const manifest = await createLiteracyMockManifest({ requireAllMedia: false });
  for (const row of manifest.items) {
    const item = bank.find(value => value.id === row.id);
    assert.deepEqual(row.answer, item.answer);
    assert.deepEqual(row.requiredAudioPaths, item.requiredAudioPaths);
    assert.deepEqual(row.itemSnapshot, item.itemSnapshot);
    assert.equal(row.itemSnapshot.itemSnapshot, undefined);
  }
  if (manifest.unavailableItemIds.length) assert.throws(() => literacyMockManifestSql(manifest), /unavailable media/);
  const sql = literacyMockManifestSql({ ...manifest, itemCount: 1, unavailableItemIds: [], items: manifest.items.slice(0, 1) });
  assert.match(sql, /insert into public\.literacy_mock_items/);
  assert.doesNotMatch(sql, /grant.*(?:anon|authenticated)/i);
});

test('malformed normalization fails rather than inventing a key or a partial task', () => {
  assert.throws(() => normalizeLiteracyMockItem({ id: 'bad', skillId: 'nouns', literacyDomainId: 'language', level: 1,
    prompt: 'Choose.', choices: ['cat', 'dog'], answer: 'bird' }), /no literal answer/);
});
