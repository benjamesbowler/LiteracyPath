import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { LANTERN_READING_SCENES, LANTERN_SUPPORTED_SCENES } from '../../src/data/lanternLagoonContent.js';
import { LANTERN_LAGOON_AUDIO, LANTERN_LAGOON_AUDIO_METADATA } from '../../src/data/generated/lanternLagoonAudio.generated.js';
import { normalizeLedaAudioText } from '../../src/data/normalizeLedaAudioText.js';
import { LEDA_PRODUCTION_VOICE } from '../../src/data/ledaProductionVoice.js';
import { AUDIO_QUEST_PATHS } from '../../src/data/generated/audioQuestPaths.generated.js';
import { isKnownBadAudioPath } from '../../src/data/knownBadWordAudio.js';

test('every complete authored Lagoon sentence has exactly matched production narration', () => {
  const scenes = [...LANTERN_READING_SCENES, ...LANTERN_SUPPORTED_SCENES];
  const expected = new Set(scenes.map(scene => normalizeLedaAudioText(scene.sentence)));
  assert.deepEqual(new Set(Object.keys(LANTERN_LAGOON_AUDIO)), expected);
  assert.deepEqual(new Set(Object.keys(LANTERN_LAGOON_AUDIO_METADATA)), expected);
  for (const scene of scenes) {
    const key = normalizeLedaAudioText(scene.sentence);
    const metadata = LANTERN_LAGOON_AUDIO_METADATA[key];
    assert.equal(metadata.text, scene.sentence);
    assert.equal(metadata.audio, LANTERN_LAGOON_AUDIO[key]);
    assert.equal(metadata.voice, LEDA_PRODUCTION_VOICE);
    assert.equal(metadata.provider, 'Google Cloud Text-to-Speech');
    assert.equal(metadata.aiGenerated, true);
    assert.equal(metadata.humanListening, 'unknown');
    assert.ok(metadata.durationSeconds > 0 && metadata.durationSeconds < 30);
    assert.ok(metadata.peakDb > -40 && metadata.peakDb <= 0);
    assert.ok(AUDIO_QUEST_PATHS.has(metadata.audio));
    assert.equal(isKnownBadAudioPath(metadata.audio), false);
    const bytes = fs.readFileSync(new URL(`../../public${metadata.audio}`, import.meta.url));
    assert.ok(bytes.byteLength > 1000 && bytes.byteLength < 350 * 1024);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), metadata.sha256);
  }
});

test('existing exact recordings are reused and newly authored speech cannot overwrite them', () => {
  const records = Object.values(LANTERN_LAGOON_AUDIO_METADATA);
  assert.equal(records.filter(record => record.reusedExisting).length, 3);
  const newRecords = records.filter(record => !record.reusedExisting);
  assert.equal(newRecords.length, 27);
  for (const record of newRecords) {
    const id = createHash('sha256').update(`${LEDA_PRODUCTION_VOICE}|instruction|${record.text}|lantern-lagoon-v1`).digest('hex').slice(0, 12);
    assert.ok(record.audio.endsWith(`-${id}.mp3`));
  }
});
