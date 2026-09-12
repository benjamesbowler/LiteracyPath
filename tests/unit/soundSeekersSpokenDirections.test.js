import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { MORPHOLOGY_TEACH_EXAMPLES } from '../../src/features/soundSeekers/content/teachTargetMetadata.js';
import { CAMPAIGN_HELP_LINES } from '../../src/features/soundSeekers/v3/content/campaignLanguage.js';
import { buildSignpost, MECHANICS, DOMAINS } from '../../src/features/soundSeekers/v3/engine/challenges.js';
import { refreshCampaignTeaching } from '../../src/features/soundSeekers/v3/engine/campaignChallenges.js';
import { wordAudio } from '../../src/features/soundSeekers/v3/engine/lexicon.js';

test('generic assessment directions have exact recorded provenance without an item or answer', () => {
  const manifest = JSON.parse(readFileSync(new URL('../../public/audio/sound-seekers/campaign/manifest.json', import.meta.url)));
  const expected = {
    'letter-sound': 'Listen to the sounds. Which sound does this letter make?',
    'read-sound-group': 'Read the word. Choose its sound group.',
    'read-letter-pattern': 'Read the word. Choose its letter pattern.'
  };
  for (const [id, text] of Object.entries(expected)) {
    const cue = CAMPAIGN_HELP_LINES[id], record = manifest.assets.find(asset => asset.assetId === id);
    assert.equal(cue.text, text);
    assert.equal(record.text, text);
    assert.equal(record.path, cue.audio);
    assert.equal(record.voice, 'en-US-Chirp3-HD-Leda');
    const bytes = readFileSync(new URL(`../../public${cue.audio}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256);
    assert.ok(record.durationSeconds > 1 && record.durationSeconds < 7);
  }
});

test('suffix cards teach authored base-to-derived words and meaning, never a fabricated suffix phoneme', () => {
  for (const targetId of ['suffix_s', 'suffix_ing', 'suffix_ed']) {
    const example = MORPHOLOGY_TEACH_EXAMPLES[targetId];
    const beat = buildSignpost({ stopId: 'moonwood-29-2', targetIds: [targetId] });
    const [card] = beat.view.cards;
    assert.equal(card.baseWord, example.base);
    assert.equal(card.anchorWord, example.derived);
    assert.equal(card.meaning, example.meaning);
    assert.equal(card.baseAudio, wordAudio(example.base));
    assert.equal(card.anchorAudio, wordAudio(example.derived));
    assert.equal(card.phonemeAudio, '');
    assert.deepEqual(card.unitAudio, []);
    assert.deepEqual(beat.prompt.cues.map(cue => cue.text), [example.base, example.derived]);
    for (const src of [card.baseAudio, card.anchorAudio]) assert.ok(src && existsSync(new URL(`../../public${src}`, import.meta.url)));
  }
});

test('saved silent assessment prompts refresh directions while preserving questions, answers and evidence', () => {
  const cases = [
    { id: 'saved-g2p', mechanic: MECHANICS.ECHO_HUNT, domain: DOMAINS.G2P, view: { direction: 'letter-to-sound', options: [{ id: 'answer', audio: '/assessed-sound.mp3' }] }, cue: 'letter-sound' },
    { id: 'saved-read-sort', mechanic: MECHANICS.SOUND_SORT, domain: DOMAINS.G2P, view: { mode: 'read', items: [{ id: 'item1', word: 'happy', audio: '/assessed-word.mp3' }] }, cue: 'read-sound-group' },
    { id: 'saved-pattern-sort', mechanic: MECHANICS.SOUND_SORT, domain: 'spelling_pattern_sort', view: { mode: 'read', items: [{ id: 'item1', word: 'rain', audio: '/assessed-word.mp3' }] }, cue: 'read-letter-pattern' }
  ];
  for (const { cue, ...fixture } of cases) {
    const original = { ...fixture, prompt: { text: 'Original question', cues: [] }, key: { optionId: 'answer' }, supportUsed: ['model'], attempts: 2 };
    const before = structuredClone(original), [refreshed] = refreshCampaignTeaching([original]);
    assert.deepEqual(original, before);
    assert.deepEqual(refreshed, { ...original, prompt: { ...original.prompt, cues: [{ kind: 'instruction', src: CAMPAIGN_HELP_LINES[cue].audio }] } });
    assert.strictEqual(refreshed.key, original.key);
    assert.strictEqual(refreshed.view, original.view);
  }
  const old = buildSignpost({ stopId: 'moonwood-29-2', targetIds: ['suffix_ing', 'suffix_ed'] });
  old.view.cards.forEach(card => { card.anchorAudio = ''; card.baseAudio = ''; });
  const [fresh] = refreshCampaignTeaching([old]);
  assert.equal(fresh.id, old.id);
  assert.ok(fresh.view.cards.every(card => card.baseAudio && card.anchorAudio));
});
