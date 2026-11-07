import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { soundBeatLadder } from '../../src/utils/soundBeatTracks.js';
import { getChildWordAsset } from '../../src/data/childAssets.js';
import { SYLLABLE_WORDS } from '../../src/data/learnGamesData.js';
import { hasWordAudio } from '../../src/utils/questAudio.js';

test('a new recording alone does not admit an unpictured syllable cue', () => {
  assert.ok(SYLLABLE_WORDS.two.some(beats => beats.join('') === 'robot'));
  assert.ok(hasWordAudio('robot'), 'the reading expansion supplies the new recording');
  assert.ok(!getChildWordAsset('robot')?.image, 'robot has no canonical game picture');
  for (const difficulty of ['medium', 'hard']) {
    const words = soundBeatLadder(difficulty, 913).flatMap(level => level.items)
      .filter(item => item.unit === 'syllables').map(item => item.word);
    assert.ok(!words.includes('robot'), `${difficulty} must not introduce an audio-only cue`);
    assert.ok(words.includes('rabbit'), `${difficulty} retains complete existing cues`);
  }
});

for (const difficulty of ['easy', 'medium', 'hard']) test(`every ${difficulty} Sound Beat word or syllable cue resolves a retained picture and recording`, () => {
  const words = new Set(soundBeatLadder(difficulty, 913).flatMap(level => level.items)
    .filter(item => item.unit !== 'words').map(item => item.word));
  assert.ok(words.size > 20, 'Exercise the full authored bank, not one opening phrase');
  for (const word of words) {
    const asset = getChildWordAsset(word);
    assert.ok(asset?.image, `${word}: canonical picture must exist`);
    assert.ok(existsSync(new URL(`../../public${asset.image}`, import.meta.url)), `${word}: retained image file must exist`);
    assert.ok(asset.audio, `${word}: canonical recording must exist`);
    assert.ok(existsSync(new URL(`../../public${asset.audio}`, import.meta.url)), `${word}: retained recording file must exist`);
    assert.equal(asset.fallbackImage, asset.image, `${word}: failed delivery must not turn the target into another word`);
  }
});

test('adding reviewed cue pictures preserves the canonical blocked-image and recorded-audio boundary', () => {
  for (const word of ['bid', 'bud', 'nut']) {
    const asset = getChildWordAsset(word);
    assert.equal(asset.image, '');
    assert.equal(asset.fallbackImage, '');
    assert.ok(asset.audio);
  }
});
