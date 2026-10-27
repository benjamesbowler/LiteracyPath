import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { COMPREHENSION_PASSAGES } from '../../src/content/comprehension/passages.js';
import {
  COMPREHENSION_AUDIO_PAUSE_MS, COMPREHENSION_AUDIO_RECIPE, comprehensionAudioText,
  comprehensionPassageAudioSegments, comprehensionQuestionAudioSegments,
  resolveComprehensionPassageAudio, resolveComprehensionQuestionAudio
} from '../../src/content/comprehension/audio.js';
import { comprehensionNarrationRecords } from '../../tools/generateComprehensionLedaAudio.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const root = new URL('../../', import.meta.url);
const manifest = () => JSON.parse(readFileSync(new URL('src/content/comprehension/audioManifest.generated.json', root), 'utf8'));

test('every current passage and ordered four-choice question has exact canonical Leda audio and byte provenance', () => {
  const source = manifest();
  const expected = comprehensionNarrationRecords(COMPREHENSION_PASSAGES);
  assert.equal(source.voice, 'en-US-Chirp3-HD-Leda');
  assert.equal(source.reviewMode, 'continuous-pass-by-exception');
  assert.equal(source.clips.length, expected.length);
  assert.deepEqual(readdirSync(new URL('public/audio/production/en-US/comprehension/', root)).sort(),
    source.clips.map(clip => clip.audioPath.split('/').at(-1)).sort(), 'no unused combined-question or superseded files remain');
  const clips = new Map(source.clips.map(clip => [clip.text, clip]));
  for (const record of expected) {
    const clip = clips.get(record.text);
    assert.ok(clip, `Missing exact narration: ${record.references[0].sourceId}`);
    assert.equal(clip.audioPath, record.audioPath);
    assert.deepEqual(clip.references, record.references);
    assert.deepEqual(clip.segments, record.segments);
    assert.equal(clip.textSha256, hash(record.text));
    assert.equal(clip.voice, source.voice);
    assert.equal(clip.engine, 'Google Cloud Text-to-Speech v1');
    assert.ok(clip.recipe.startsWith(COMPREHENSION_AUDIO_RECIPE));
    assert.equal(clip.recipe, record.recipe);
    assert.equal(clip.tempo, record.tempo);
    assert.equal(clip.pauseBetweenSegmentsMs, COMPREHENSION_AUDIO_PAUSE_MS);
    assert.equal(clip.finalPaddingMs, 150);
    assert.ok(Number.isFinite(Date.parse(clip.generatedAt)));
    const filename = fileURLToPath(new URL(`public${clip.audioPath}`, root));
    assert.ok(statSync(filename).size > 1000, `${clip.audioPath}: empty file`);
    assert.equal(hash(readFileSync(filename)), clip.audioSha256, `${clip.audioPath}: bytes changed`);
  }
  for (const passage of COMPREHENSION_PASSAGES) {
    assert.equal(resolveComprehensionPassageAudio(passage).status, 'ready');
    assert.equal(resolveComprehensionPassageAudio(passage).text, comprehensionAudioText([passage.title, passage.text]));
    for (const question of passage.questions) {
      assert.equal(resolveComprehensionQuestionAudio(question).status, 'ready');
      const resolved = resolveComprehensionQuestionAudio(question);
      const segments = [question.prompt, ...question.options.flatMap((option, i) => [`Option ${'ABCD'[i]}.`, option])];
      assert.deepEqual(comprehensionQuestionAudioSegments(question), segments);
      assert.equal(resolved.path, '');
      assert.equal(resolved.parts.length, 9);
      assert.deepEqual(resolved.parts, segments.map((text, index) => ({
        path: clips.get(text).audioPath, gapBeforeMs: index > 0 ? 450 : 0
      })));
    }
  }
});

test('fresh text explicitly misses; shuffled options resolve exact atomic audio in their visible order', () => {
  const passage = COMPREHENSION_PASSAGES[0];
  assert.deepEqual(comprehensionPassageAudioSegments(null), []);
  assert.deepEqual(comprehensionQuestionAudioSegments({ prompt: 'Test', options: ['one'] }), []);
  assert.equal(resolveComprehensionPassageAudio({ ...passage, text: `${passage.text} Changed.` }).status, 'missing');
  assert.equal(resolveComprehensionPassageAudio({ ...passage, title: `${passage.title}!` }).path, '');
  const question = passage.questions[0];
  const original = resolveComprehensionQuestionAudio(question);
  const reversed = resolveComprehensionQuestionAudio({ ...question, options: [...question.options].reverse() });
  assert.equal(reversed.status, 'ready');
  assert.equal(reversed.parts[0].path, original.parts[0].path);
  assert.equal(reversed.parts[1].path, original.parts[1].path, 'A remains the first visible label');
  assert.equal(reversed.parts[2].path, original.parts[8].path, 'the fourth authored choice can occupy visible A');
  assert.equal(reversed.parts[8].path, original.parts[2].path, 'the first authored choice can occupy visible D');
  assert.equal(resolveComprehensionQuestionAudio({ ...question, options: ['A completely new unrecorded answer', ...question.options.slice(1)] }).status, 'missing');
  assert.equal(resolveComprehensionQuestionAudio({ ...question, prompt: `${question.prompt}!` }).path, '');
  assert.equal(resolveComprehensionQuestionAudio(null).status, 'missing');
});

test('generator deduplicates exact repeated narration and keeps every source reference', () => {
  const passage = COMPREHENSION_PASSAGES[0];
  const duplicate = { ...passage, id: 'copy', questions: passage.questions.map(q => ({ ...q, id: `copy-${q.id}` })) };
  const original = comprehensionNarrationRecords([passage]);
  const combined = comprehensionNarrationRecords([passage, duplicate]);
  assert.equal(combined.length, original.length);
  assert.ok(combined.every(record => record.references.length === (record.references[0].role === 'choice-label' ? 1 : 2)));
  const revised = comprehensionNarrationRecords([{ ...passage, text: `${passage.text} ` }]);
  assert.notEqual(revised[0].audioPath, original[0].audioPath, 'whitespace is part of the exact source identity');
});
