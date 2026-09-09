import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  SAFARI_AUDIO_SCRIPTS, safariInstructionPath, safariWordClips, safariModelClips
} from '../../src/components/learn/games/games/soundSafariAudio.js';
import { SOUND_SAFARI_WORDS } from '../../src/data/soundSafariWords.js';
import {
  getSoundSafariPronunciation, soundSafariWordAudio, soundSafariUnitAudio
} from '../../src/data/soundSafariPronunciations.js';
import { KNOWN_BAD_AUDIO_PATHS } from '../../src/data/knownBadWordAudio.js';
import { runSoundSafariAudio } from '../../tools/generateSoundSafariAudio.mjs';

const expectedScripts = {
  instruction: 'Listen to the word. Catch its word parts in order. Some letters stay together.',
  model: 'Watch this word. Then you will try a different word.',
  turn: 'Now try a new word. Listen and catch its word parts.',
  retry: 'Listen to the word again. Which part comes next?',
  home: 'The path is ready. Guide the creatures home!'
};
const expectedSource = {
  version: 3, provider: 'Google Cloud Text-to-Speech', voice: 'en-US-Chirp3-HD-Leda',
  aiGenerated: true, languageCode: 'en-US',
  synthesis: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 },
  normalization: { highpassHz: 60, integratedLufs: -24, truePeakDb: -2, loudnessRange: 7,
    fadeInSeconds: 0.015, fadeOutSeconds: 0.025, sampleRateHertz: 44100, channels: 1, bitRate: '128k' }
};
const rows = Object.entries(expectedScripts).map(([id, text]) =>
  ({ id, text, role: 'instruction', audio: `/audio/sound-safari/${id}-v3.mp3` }));
const words = Object.values(SOUND_SAFARI_WORDS).flat();
const publicFile = audio => fileURLToPath(new URL(`../../public${audio}`, import.meta.url));
const provenancePath = publicFile('/audio/sound-safari/provenance.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

test('static scripts and versioned paths exactly match the five agreed cues', () => {
  assert.deepEqual(SAFARI_AUDIO_SCRIPTS, expectedScripts);
  assert.ok(Object.isFrozen(SAFARI_AUDIO_SCRIPTS));
  for (const row of rows) assert.equal(safariInstructionPath(row.id), row.audio);
});

test('all 90 authored words use the actual exact resolver and existing MP3 bytes', t => {
  assert.equal(words.length, 90);
  assert.equal(new Set(words).size, 90);
  for (const word of words) {
    const record = getSoundSafariPronunciation(word);
    const audio = soundSafariWordAudio(word);
    assert.equal(audio.available, true, word);
    assert.deepEqual(safariWordClips(record), [audio.path], word);
    assert.deepEqual(safariWordClips(Object.freeze({ item: record, index: 1 })), [audio.path], word);
    assert.ok(!KNOWN_BAD_AUDIO_PATHS.has(audio.path), word);
    const bytes = readFileSync(publicFile(audio.path));
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0), word);
  }
  t.diagnostic('90 authored word paths and MP3 signatures checked; no listening claim');
});

test('models retain exact word then requested unit for every authored occurrence and variant', t => {
  let occurrences = 0;
  let missing = 0;
  for (const word of words) {
    const record = getSoundSafariPronunciation(word);
    for (const item of [record, ...record.variants.map(variant => getSoundSafariPronunciation(word, variant.id))]) {
      for (const [index, unit] of item.units.entries()) {
        const audio = soundSafariUnitAudio(unit, word);
        const expected = [soundSafariWordAudio(word).path, audio.path];
        assert.deepEqual(safariModelClips(item, index), expected, `${word}:${index}`);
        assert.deepEqual(safariModelClips({ item, index: 999, modelAccepted: false }, index), expected);
        if (audio.path) assert.ok(readFileSync(publicFile(audio.path)).length > 0, audio.path);
        else missing += 1;
        occurrences += 1;
      }
    }
  }
  t.diagnostic(`${occurrences} unit occurrences including variants; ${missing} unavailable positions retained`);
});

test('model sound identity follows the authored soundKey instead of printed letters or cached audio', () => {
  for (const [word, grapheme, suffix] of [
    ['thread', 'ea', 'short-e'], ['meadow', 'ea', 'short-e'], ['owl', 'ow', 'ow-cow'],
    ['acorn', 'a', 'long-a'], ['rabbit', 'bb', 'b'], ['badger', 'dg', 'j-soft-g'],
    ['butterfly', 'y', 'long-i'], ['woodland', 'oo', 'short-oo']
  ]) {
    const record = getSoundSafariPronunciation(word);
    const index = record.units.findIndex(unit => unit.grapheme === grapheme);
    const units = record.units.map(unit => ({ ...unit, audio: { path: '/invented.mp3', available: true } }));
    assert.deepEqual(safariModelClips({ ...record, units, wordAudio: { path: '/invented.mp3' } }, index),
      [soundSafariWordAudio(word).path, `/audio/phonemes/reviewed/${suffix}.mp3`], word);
  }
  const shining = getSoundSafariPronunciation('shining');
  const indices = shining.units.flatMap((unit, index) => unit.grapheme === 'i' ? [index] : []);
  assert.equal(indices.length, 2);
  assert.notEqual(safariModelClips(shining, indices[0])[1], safariModelClips(shining, indices[1])[1]);
});

test('missing schwa stays empty in position without borrowing short-u or changing the model word', () => {
  for (const word of ['forest', 'squirrel']) {
    const record = getSoundSafariPronunciation(word);
    const index = record.units.findIndex(unit => unit.soundKey === 'schwa');
    assert.ok(index >= 0, word);
    assert.deepEqual(safariModelClips(record, index), [soundSafariWordAudio(word).path, '']);
  }
  assert.deepEqual(safariModelClips({ word: 'cat', units: [{ grapheme: 'u', soundKey: 'schwa' }] }, 0),
    [soundSafariWordAudio('cat').path, '']);
});

test('unknown or invalid entries remain empty strings and never shift the sequence', () => {
  for (const task of [undefined, null, {}, { word: 'unrecorded-safari-word', units: [] }]) {
    assert.deepEqual(safariWordClips(task), ['']);
    assert.deepEqual(safariModelClips(task, 0), ['', '']);
  }
  const cat = getSoundSafariPronunciation('cat');
  for (const index of [undefined, -1, 0.5, NaN, Infinity, '0', 999]) {
    assert.deepEqual(safariModelClips(cat, index), [soundSafariWordAudio('cat').path, '']);
  }
  assert.deepEqual(safariModelClips({ word: 'unrecorded-safari-word', units: cat.units }, 0),
    ['', soundSafariUnitAudio(cat.units[0], 'unrecorded-safari-word').path]);
  assert.deepEqual(safariModelClips({ word: 'cat', units: [{ grapheme: 'c' }] }, 0),
    [soundSafariWordAudio('cat').path, '']);
});

test('known bad word and unit paths are rejected even when a task has cached their availability', () => {
  const cat = getSoundSafariPronunciation('cat');
  const wordAudio = soundSafariWordAudio('cat');
  const unitAudio = soundSafariUnitAudio(cat.units[0], 'cat');
  const task = { ...cat, wordAudio, units: cat.units.map(unit => ({ ...unit, audio: unitAudio })) };
  assert.ok(wordAudio.path && unitAudio.path);
  try {
    KNOWN_BAD_AUDIO_PATHS.add(wordAudio.path);
    assert.deepEqual(safariWordClips(task), ['']);
    assert.deepEqual(safariModelClips(task, 0), ['', unitAudio.path]);
    KNOWN_BAD_AUDIO_PATHS.add(unitAudio.path);
    assert.deepEqual(safariModelClips(task, 0), ['', '']);
    KNOWN_BAD_AUDIO_PATHS.delete(wordAudio.path);
    assert.deepEqual(safariModelClips(task, 0), [wordAudio.path, '']);
  } finally {
    KNOWN_BAD_AUDIO_PATHS.delete(wordAudio.path);
    KNOWN_BAD_AUDIO_PATHS.delete(unitAudio.path);
  }
});

// In-memory verifier fixtures never request credentials, synthesize, write
// files or execute media tools. Actual generated bytes are checked separately.
function verifierFixture(t) {
  const bytes = Buffer.from('synthetic Safari provenance test bytes');
  const provenance = { ...structuredClone(expectedSource), assets: Object.fromEntries(rows.map(row =>
    [row.id, { ...row, sha256: hash(bytes), durationSeconds: 1.25, humanListening: 'unknown' }])) };
  const files = new Map(rows.map(row => [publicFile(row.audio), bytes]));
  t.mock.method(fs, 'readFile', async file => {
    if (file === provenancePath) return JSON.stringify(provenance);
    if (files.has(file)) return files.get(file);
    throw Object.assign(new Error(`Missing ${file}`), { code: 'ENOENT' });
  });
  for (const method of ['mkdir', 'mkdtemp', 'writeFile', 'copyFile', 'rm', 'rename']) {
    t.mock.method(fs, method, () => assert.fail(`Verifier attempted a filesystem mutation: ${method}`));
  }
  t.mock.method(globalThis, 'fetch', () => assert.fail('Verifier attempted synthesis'));
  const inspect = t.mock.method(childProcess, 'execFileSync', (command, args) => {
    assert.ok(['ffprobe', 'ffmpeg'].includes(command), `Verifier attempted credentials: ${command}`);
    assert.ok(!args.includes('-y'), 'Verifier must not overwrite media');
    return command === 'ffprobe' ? JSON.stringify({ format: { duration: '1.25' },
      streams: [{ codec_name: 'mp3', sample_rate: '44100', channels: 1 }] }) : '';
  });
  t.mock.method(console, 'log', () => {});
  return { files, provenance, bytes, inspect };
}

test('generator verify probes and decodes all five exact bindings without writes or synthesis', async t => {
  const { inspect } = verifierFixture(t);
  await runSoundSafariAudio({ verify: true });
  assert.equal(inspect.mock.callCount(), 10);
  assert.deepEqual(inspect.mock.calls.filter(call => call.arguments[0] === 'ffprobe')
    .map(call => call.arguments[1].at(-1)).sort(), rows.map(row => publicFile(row.audio)).sort());
});

test('generator re-run is immutable and reuses a complete verified version without credentials', async t => {
  const { inspect } = verifierFixture(t);
  await runSoundSafariAudio();
  assert.equal(inspect.mock.callCount(), 10);
});

test('generator rejects changed bytes, exact scripts and asset identity for every static clip', async t => {
  const { files, provenance, bytes } = verifierFixture(t);
  for (const row of rows) {
    const original = { ...provenance.assets[row.id] };
    const cases = [
      () => files.set(publicFile(row.audio), Buffer.from('changed bytes')),
      () => { provenance.assets[row.id].sha256 = 'wrong hash'; },
      () => { provenance.assets[row.id].id = 'other'; },
      () => { provenance.assets[row.id].text += ' Changed.'; },
      () => { provenance.assets[row.id].role = 'phoneme'; },
      () => { provenance.assets[row.id].audio = '/audio/sound-safari/other-v2.mp3'; },
      () => { provenance.assets[row.id].durationSeconds = 999; },
      () => { provenance.assets[row.id].humanListening = 'approved'; }
    ];
    for (const mutate of cases) {
      mutate();
      for (const verify of [true, false]) await assert.rejects(runSoundSafariAudio({ verify }), /provenance.*differs/i);
      files.set(publicFile(row.audio), bytes);
      provenance.assets[row.id] = { ...original };
    }
  }
});

test('generator binds voice, provider, version, disclosure and all measured-end processing settings', async t => {
  const { provenance } = verifierFixture(t);
  const original = structuredClone(provenance);
  const cases = [
    ...['voice', 'provider', 'version', 'languageCode', 'aiGenerated'].map(key => () => { provenance[key] = 'changed'; }),
    ...Object.keys(expectedSource.synthesis).map(key => () => { provenance.synthesis[key] = 'changed'; }),
    ...Object.keys(expectedSource.normalization).map(key => () => { provenance.normalization[key] = 'changed'; }),
    () => { delete provenance.assets.home; },
    () => { provenance.assets.schwa = { ...provenance.assets.home }; }
  ];
  for (const mutate of cases) {
    Object.assign(provenance, structuredClone(original));
    mutate();
    for (const verify of [true, false]) await assert.rejects(runSoundSafariAudio({ verify }), /provenance.*differs/i);
  }
});

test('generator refuses every missing provenanced clip instead of regenerating or touching files', async t => {
  const { files, bytes } = verifierFixture(t);
  for (const row of rows) {
    files.delete(publicFile(row.audio));
    for (const verify of [true, false]) {
      await assert.rejects(runSoundSafariAudio({ verify }), error => error.message.includes(`Missing ${row.audio}`));
    }
    files.set(publicFile(row.audio), bytes);
  }
});

test('generator refuses orphan recordings without exact provenance before obtaining credentials', async t => {
  const { files } = verifierFixture(t);
  t.mock.method(fs, 'readFile', async file => {
    if (files.has(file)) return files.get(file);
    throw Object.assign(new Error('No provenance'), { code: 'ENOENT' });
  });
  for (const verify of [true, false]) await assert.rejects(runSoundSafariAudio({ verify }), /provenance.*differs/i);
});

test('generator dry run lists only five static instructions without file or provider access', async t => {
  for (const method of ['readFile', 'mkdir', 'mkdtemp', 'writeFile', 'copyFile', 'rm']) {
    t.mock.method(fs, method, () => assert.fail(`Dry run accessed files: ${method}`));
  }
  t.mock.method(globalThis, 'fetch', () => assert.fail('Dry run attempted synthesis'));
  t.mock.method(childProcess, 'execFileSync', () => assert.fail('Dry run executed a command'));
  const output = t.mock.method(console, 'log', () => {});
  await runSoundSafariAudio({ dryRun: true });
  assert.deepEqual(output.mock.calls[0].arguments[0], rows);
});

test('generated static recordings have exact scripts, Leda settings and matching SHA-256 provenance', () => {
  const { assets, ...source } = JSON.parse(readFileSync(provenancePath, 'utf8'));
  assert.deepEqual(source, expectedSource);
  assert.deepEqual(Object.keys(assets).sort(), rows.map(row => row.id).sort());
  for (const row of rows) {
    const asset = assets[row.id];
    assert.deepEqual({ id: asset.id, text: asset.text, role: asset.role, audio: asset.audio }, row);
    assert.equal(asset.sha256, hash(readFileSync(publicFile(row.audio))));
    assert.ok(asset.durationSeconds > 0);
    assert.equal(asset.humanListening, 'unknown');
  }
});
