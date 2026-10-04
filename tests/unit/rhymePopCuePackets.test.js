import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { rhymePopV2Ladder } from '../../src/utils/rhymePopV2Levels.js';
import { getArcadeCuePicture } from '../../src/data/arcadeCuePictures.js';
import { getLedaWordAudioPath } from '../../src/data/ledaProductionAudio.js';

test('every possible local target has a concrete central picture kind and recorded cue', () => {
  const anchors = new Set();
  for (const difficulty of ['easy', 'medium', 'hard']) for (let seed = 0; seed < 32; seed++)
    for (const level of rhymePopV2Ladder(difficulty, seed)) anchors.add(level.targetWord);
  assert.equal(anchors.size, 70);
  for (const word of anchors) {
    const cue = getArcadeCuePicture(word), audio = getLedaWordAudioPath(word);
    assert.ok(['word', 'meaning-context'].includes(cue.kind), word);
    assert.ok(cue.image && existsSync(new URL('../../public' + cue.image, import.meta.url)), word);
    assert.ok(audio && existsSync(new URL('../../public' + audio, import.meta.url)), word);
  }
  // A broad spoken-rime cue is explicitly a meaning context, never an
  // assessment claim that this one picture uniquely identifies its word.
  assert.equal(getArcadeCuePicture('pun').kind, 'meaning-context');
  assert.equal(getArcadeCuePicture('glow').kind, 'meaning-context');
});

test('all popped near-rime choices have real names without changing family answers or counts', () => {
  const candidates = new Set();
  for (const difficulty of ['easy', 'medium', 'hard']) for (let seed = 0; seed < 32; seed++) for (const level of rhymePopV2Ladder(difficulty, seed)) {
    const choices = [...level.rhymingWords, ...level.distractors];
    assert.equal(new Set(choices).size, choices.length);
    assert.ok(!level.distractors.includes('knit') && !level.distractors.includes('rook'));
    if (level.distractors.includes('spit')) assert.equal(level.rime, '-ight');
    if (level.distractors.includes('took')) assert.equal(level.rime, '-ock');
    for (const word of choices) candidates.add(word);
  }
  assert.ok(candidates.has('spit') && candidates.has('took'));
  for (const word of candidates) {
    const audio = getLedaWordAudioPath(word);
    assert.ok(audio && existsSync(new URL('../../public' + audio, import.meta.url)), word);
  }
});
