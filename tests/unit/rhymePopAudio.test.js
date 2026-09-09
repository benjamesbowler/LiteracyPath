import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import childProcess from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  RHYME_AUDIO_SCRIPTS, RHYME_WORD_AUDIO, rhymeInstructionPath, rhymeWordAudioPath,
  rhymeQuestionClips, rhymeFeedbackClips
} from '../../src/components/learn/games/games/rhymePopAudio.js';
import { rhymePopLadder } from '../../src/utils/rhymePopLevels.js';
import { getLedaWordAudioPath, getLedaInstructionAudioPath, normalizeLedaAudioText } from '../../src/data/ledaProductionAudio.js';
import { GUIDED_READING_LEDA_GAPS } from '../../src/data/generated/guidedReadingLedaGaps.generated.js';
import { KNOWN_BAD_WORD_AUDIO, KNOWN_BAD_AUDIO_PATHS } from '../../src/data/knownBadWordAudio.js';
import { runRhymePopAudio } from '../../tools/generateRhymePopAudio.mjs';

const publicRoot = new URL('../../public/', import.meta.url);
const levels = ['easy', 'medium', 'hard'].flatMap(rhymePopLadder);
const expectedWordAudio = Object.freeze({
  knit: '/audio/rhyme-pop/word-knit-v3.mp3',
  nun: '/audio/rhyme-pop/word-nun-v3.mp3',
  rack: '/audio/rhyme-pop/word-rack-v3.mp3',
  rook: '/audio/rhyme-pop/word-rook-v3.mp3',
  shun: '/audio/rhyme-pop/word-shun-v3.mp3'
});
const expectedRows = () => [
  ...Object.entries(RHYME_AUDIO_SCRIPTS).map(([id, text]) => ({ id, text, role: 'instruction', audio: rhymeInstructionPath(id) })),
  ...Object.entries(expectedWordAudio).map(([word, audio]) => ({ id: `word-${word}`, text: word, role: 'isolated_word', audio }))
];
const recordedPath = word => [expectedWordAudio[word], getLedaWordAudioPath(word), getLedaInstructionAudioPath(word),
  GUIDED_READING_LEDA_GAPS.isolated_word?.[normalizeLedaAudioText(word)]]
  .find(path => path && !KNOWN_BAD_AUDIO_PATHS.has(path)) || '';
const publicFile = audio => fileURLToPath(new URL(audio.slice(1), publicRoot));

test('instruction scripts bind the exact basket action and relationships to immutable v3 paths', () => {
  assert.deepEqual(RHYME_AUDIO_SCRIPTS, {
    instruction: 'Pop every word that rhymes with the target. Each rhyme adds a balloon to the basket.',
    rhymes: 'rhymes with', mismatch: 'does not rhyme with', ready: 'Balloon basket ready!'
  });
  assert.ok(Object.isFrozen(RHYME_AUDIO_SCRIPTS));
  for (const id of Object.keys(RHYME_AUDIO_SCRIPTS)) {
    assert.equal(rhymeInstructionPath(id), `/audio/rhyme-pop/${id}-v3.mp3`);
  }
});

test('only the five scoped authored words explicitly resolve to their immutable isolated-word recordings', () => {
  assert.deepEqual(RHYME_WORD_AUDIO, expectedWordAudio);
  assert.ok(Object.isFrozen(RHYME_WORD_AUDIO));
  for (const [word, audio] of Object.entries(expectedWordAudio)) {
    assert.equal(rhymeWordAudioPath(word), audio);
    assert.equal(rhymeWordAudioPath(word.toUpperCase()), audio);
    assert.equal(rhymeWordAudioPath(`${word}!`), audio);
  }
  for (const word of ['unrecorded-g16-word', '__proto__', 'constructor']) assert.equal(rhymeWordAudioPath(word), '');
});

test('all nine owned clips have actual recordings and exact immutable per-clip provenance', () => {
  const rows = expectedRows();
  assert.equal(rows.length, 9);
  const missing = rows.filter(row => !existsSync(publicFile(row.audio))).map(row => row.audio);
  assert.deepEqual(missing, [], `Awaiting parent generation: ${missing.join(', ')}`);
  const provenance = JSON.parse(readFileSync(publicFile('/audio/rhyme-pop/provenance.json'), 'utf8'));
  assert.equal(provenance.version, 3);
  assert.equal(provenance.voice, 'en-US-Chirp3-HD-Leda');
  assert.equal(provenance.provider, 'Google Cloud Text-to-Speech');
  assert.equal(provenance.aiGenerated, true);
  assert.deepEqual(Object.keys(provenance.assets).sort(), rows.map(row => row.id).sort());
  for (const row of rows) {
    const asset = provenance.assets[row.id];
    assert.deepEqual({ id: asset.id, text: asset.text, role: asset.role, audio: asset.audio }, row);
    assert.equal(asset.sha256, createHash('sha256').update(readFileSync(publicFile(row.audio))).digest('hex'));
    assert.ok(asset.durationSeconds > 0);
    assert.equal(asset.humanListening, 'unknown');
  }
});

test('every authored target, rhyme, distractor and hard near-rime has an exact known recorded asset', t => {
  const missing = new Map();
  const words = new Set();
  for (const level of levels) {
    for (const word of [level.targetWord, ...level.rhymingWords, ...level.distractors]) {
      words.add(word);
      const audio = rhymeWordAudioPath(word);
      assert.equal(audio, recordedPath(word), `Exact Leda lookup: ${word}`);
      if (!audio || !existsSync(publicFile(audio)) || statSync(publicFile(audio)).size === 0) {
        const contexts = missing.get(word) || [];
        contexts.push(`${level.difficulty}/${level.level}`);
        missing.set(word, contexts);
        continue;
      }
      assert.match(audio, /^\/audio\/(?:production\/en-US\/|rhyme-pop\/word-(?:knit|nun|rack|rook|shun)-v3\.mp3$)/, word);
      assert.ok(!KNOWN_BAD_AUDIO_PATHS.has(audio), `${word}: quarantined path`);
      assert.ok(!KNOWN_BAD_WORD_AUDIO.has(word), `${word}: quarantined word`);
      const bytes = readFileSync(publicFile(audio));
      assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
        `${word}: expected recorded MP3 bytes at ${audio}`);
    }
  }
  t.diagnostic(`${levels.length} authored tier/rounds; ${words.size} distinct recorded words checked`);
  assert.deepEqual([...missing.keys()].sort(), [], `Missing exact word recordings: ${JSON.stringify(Object.fromEntries(missing))}`);
});

test('all authored question clips retain the target and every exact choice in the supplied order', () => {
  for (const level of levels) {
    const choices = [...level.rhymingWords, ...level.distractors].map((word, index) =>
      Object.freeze({ word, id: `choice-${index}`, isRhyme: false }));
    for (const ordered of [choices, [...choices].reverse()]) {
      Object.freeze(ordered);
      assert.deepEqual(rhymeQuestionClips(level.targetWord, ordered), [
        rhymeInstructionPath('rhymes'), recordedPath(level.targetWord), ...ordered.map(choice => recordedPath(choice.word))
      ], `${level.difficulty}/${level.level}`);
    }
  }
});

test('all authored feedback speaks selected word, authoritative relationship, then retained target', () => {
  for (const level of levels) {
    for (const [words, correct] of [[level.rhymingWords, true], [level.distractors, false]]) {
      for (const response of words) {
        assert.deepEqual(rhymeFeedbackClips(Object.freeze({ response, target: level.targetWord, correct })), [
          recordedPath(response), rhymeInstructionPath(correct ? 'rhymes' : 'mismatch'), recordedPath(level.targetWord)
        ], `${level.difficulty}/${level.level}: ${response} / ${level.targetWord}`);
      }
    }
  }
});

test('chair/share/square rhyme across spellings and snow/cow contrasts despite matching spelling', () => {
  for (const difficulty of ['medium', 'hard']) {
    const chair = rhymePopLadder(difficulty).find(level => level.targetWord === 'chair');
    for (const word of ['share', 'square']) {
      assert.ok(chair.rhymingWords.includes(word));
      assert.deepEqual(rhymeFeedbackClips({ response: word, target: 'chair', correct: true }),
        [recordedPath(word), '/audio/rhyme-pop/rhymes-v3.mp3', recordedPath('chair')]);
    }
  }
  const snow = rhymePopLadder('hard').find(level => level.targetWord === 'snow');
  for (const word of ['now', 'cow', 'how', 'saw']) {
    assert.ok(snow.distractors.includes(word));
    assert.ok(!snow.rhymingWords.includes(word));
    assert.deepEqual(rhymeFeedbackClips({ response: word, target: 'snow', correct: false }),
      [recordedPath(word), '/audio/rhyme-pop/mismatch-v3.mp3', recordedPath('snow')]);
  }
});

test('unknown clips stay missing in their sequence position and never become another word', () => {
  for (const word of ['', undefined, null, 'unrecorded-g16-word', 'chair share']) {
    assert.equal(rhymeWordAudioPath(word), '');
  }
  assert.deepEqual(rhymeQuestionClips('chair', [{ word: 'unrecorded-g16-word' }, { word: 'share' }]),
    [rhymeInstructionPath('rhymes'), recordedPath('chair'), '', recordedPath('share')]);
  assert.deepEqual(rhymeQuestionClips('unrecorded-g16-word', [{ word: 'cow' }]),
    [rhymeInstructionPath('rhymes'), '', recordedPath('cow')]);
  assert.deepEqual(rhymeFeedbackClips({ response: 'unrecorded-g16-word', target: 'snow', correct: false }),
    ['', rhymeInstructionPath('mismatch'), recordedPath('snow')]);
  for (const response of [undefined, null, {}, { response: 'cow', target: 'snow' }]) {
    assert.deepEqual(rhymeFeedbackClips(response), [], 'No semantic claim without a rules response');
  }
});

test('lookup keeps approved replacement words and the existing exact knot recording', () => {
  for (const word of ['zipper', 'vase', 'umbrella']) assert.equal(rhymeWordAudioPath(word), getLedaWordAudioPath(word));
  assert.equal(rhymeWordAudioPath('CHAIR'), recordedPath('chair'));
  const knot = GUIDED_READING_LEDA_GAPS.isolated_word.knot;
  assert.ok(knot && existsSync(publicFile(knot)));
  assert.equal(rhymeWordAudioPath('knot'), knot);
});

test('quarantined words and all defective candidate paths are rejected', () => {
  const word = 'chair';
  const paths = [...new Set([getLedaWordAudioPath(word), getLedaInstructionAudioPath(word),
    GUIDED_READING_LEDA_GAPS.isolated_word?.[word]].filter(Boolean))];
  const priorWords = new Set(KNOWN_BAD_WORD_AUDIO);
  const priorPaths = new Set(KNOWN_BAD_AUDIO_PATHS);
  try {
    KNOWN_BAD_WORD_AUDIO.add(word);
    assert.equal(rhymeWordAudioPath(word), '');
    assert.equal(rhymeWordAudioPath('CHAIR'), '');
    KNOWN_BAD_WORD_AUDIO.delete(word);
    for (const path of paths) {
      KNOWN_BAD_AUDIO_PATHS.add(path);
      assert.equal(rhymeWordAudioPath(word), paths.find(candidate => !KNOWN_BAD_AUDIO_PATHS.has(candidate)) || '');
    }
    assert.equal(rhymeWordAudioPath(word), '');
    assert.deepEqual(rhymeFeedbackClips({ response: word, target: 'snow', correct: false }),
      ['', rhymeInstructionPath('mismatch'), recordedPath('snow')]);
    KNOWN_BAD_AUDIO_PATHS.add(GUIDED_READING_LEDA_GAPS.isolated_word.knot);
    assert.equal(rhymeWordAudioPath('knot'), '', 'The additional exact-word bank also rejects defective paths');
  } finally {
    KNOWN_BAD_WORD_AUDIO.clear(); priorWords.forEach(word => KNOWN_BAD_WORD_AUDIO.add(word));
    KNOWN_BAD_AUDIO_PATHS.clear(); priorPaths.forEach(path => KNOWN_BAD_AUDIO_PATHS.add(path));
  }
});

test('all five scoped word recordings honor word and exact-path quarantine', () => {
  const priorWords = new Set(KNOWN_BAD_WORD_AUDIO);
  const priorPaths = new Set(KNOWN_BAD_AUDIO_PATHS);
  try {
    for (const [word, audio] of Object.entries(expectedWordAudio)) {
      KNOWN_BAD_WORD_AUDIO.add(word);
      assert.equal(rhymeWordAudioPath(word), '');
      assert.equal(rhymeWordAudioPath(word.toUpperCase()), '');
      KNOWN_BAD_WORD_AUDIO.delete(word);
      KNOWN_BAD_AUDIO_PATHS.add(audio);
      assert.equal(rhymeWordAudioPath(word), '');
      KNOWN_BAD_AUDIO_PATHS.delete(audio);
      assert.equal(rhymeWordAudioPath(word), audio);
    }
  } finally {
    KNOWN_BAD_WORD_AUDIO.clear(); priorWords.forEach(word => KNOWN_BAD_WORD_AUDIO.add(word));
    KNOWN_BAD_AUDIO_PATHS.clear(); priorPaths.forEach(path => KNOWN_BAD_AUDIO_PATHS.add(path));
  }
});

// Synthetic verifier fixtures: no generation, credentials, media command or
// filesystem write is permitted by these unit tests.
function verifierFixture(t) {
  const bytes = Buffer.from('synthetic audio bytes for provenance verification');
  const rows = expectedRows();
  const provenance = {
    version: 3, provider: 'Google Cloud Text-to-Speech', voice: 'en-US-Chirp3-HD-Leda', aiGenerated: true,
    languageCode: 'en-US',
    synthesis: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000, speakingRate: 0.94, pitch: 0 },
    normalization: { highpassHz: 60, integratedLufs: -24, truePeakDb: -2, loudnessRange: 7,
      fadeInSeconds: 0.015, fadeOutSeconds: 0.025, sampleRateHertz: 44100, channels: 1, bitRate: '128k' },
    assets: Object.fromEntries(rows.map(row => [row.id, { ...row,
      sha256: createHash('sha256').update(bytes).digest('hex'), durationSeconds: 1.25, humanListening: 'unknown' }]))
  };
  const files = new Map(rows.map(row => [publicFile(row.audio), bytes]));
  const manifestPath = publicFile('/audio/rhyme-pop/provenance.json');
  t.mock.method(fs, 'readFile', async file => {
    if (file === manifestPath) return JSON.stringify(provenance);
    if (files.has(file)) return files.get(file);
    throw Object.assign(new Error(`Missing ${file}`), { code: 'ENOENT' });
  });
  for (const method of ['mkdir', 'mkdtemp', 'writeFile', 'copyFile', 'rm', 'rename']) {
    t.mock.method(fs, method, () => assert.fail(`Verifier attempted a filesystem mutation: ${method}`));
  }
  t.mock.method(globalThis, 'fetch', () => assert.fail('Verifier attempted synthesis'));
  const inspect = t.mock.method(childProcess, 'execFileSync', (command, args) => {
    assert.ok(['ffprobe', 'ffmpeg'].includes(command), `Verifier attempted credentials or synthesis: ${command}`);
    assert.ok(!args.includes('-y'), 'Verifier must not overwrite media');
    return command === 'ffprobe' ? JSON.stringify({ format: { duration: '1.25' },
      streams: [{ codec_name: 'mp3', sample_rate: '44100', channels: 1 }] }) : '';
  });
  t.mock.method(console, 'log', () => {});
  return { files, provenance, bytes, inspect };
}

test('generator verify mode validates all nine script/word/byte bindings without any writes or synthesis', async t => {
  const { inspect } = verifierFixture(t);
  await runRhymePopAudio({ verify: true });
  assert.equal(inspect.mock.callCount(), 18, 'Each of nine clips must be probed and decoded');
  assert.deepEqual(inspect.mock.calls.filter(call => call.arguments[0] === 'ffprobe')
    .map(call => call.arguments[1].at(-1)).sort(), expectedRows().map(row => publicFile(row.audio)).sort());
});

test('generator verify mode requires each of the five isolated-word clips', async t => {
  const { files, bytes } = verifierFixture(t);
  for (const audio of Object.values(expectedWordAudio)) {
    files.delete(publicFile(audio));
    await assert.rejects(runRhymePopAudio({ verify: true }), error => error.message.includes(`Missing ${audio}`));
    files.set(publicFile(audio), bytes);
  }
});

test('generator rejects isolated-word byte, text, role and path changes for every scoped word', async t => {
  const { files, provenance, bytes } = verifierFixture(t);
  for (const [word, audio] of Object.entries(expectedWordAudio)) {
    const id = `word-${word}`;
    const original = { ...provenance.assets[id] };
    const cases = [
      () => files.set(publicFile(audio), Buffer.from(`different ${word} bytes`)),
      () => { provenance.assets[id].text = `${word} rhymes`; },
      () => { provenance.assets[id].role = 'instruction'; },
      () => { provenance.assets[id].audio = '/audio/rhyme-pop/word-other-v3.mp3'; }
    ];
    for (const mutate of cases) {
      mutate();
      await assert.rejects(runRhymePopAudio({ verify: true }), /provenance|versioned path|differs/i);
      files.set(publicFile(audio), bytes);
      provenance.assets[id] = { ...original };
    }
  }
});

test('generator verify mode reports missing versioned clips without trying to generate', async t => {
  const { files } = verifierFixture(t);
  files.delete(publicFile(rhymeInstructionPath('mismatch')));
  await assert.rejects(runRhymePopAudio({ verify: true }), /Missing.*mismatch-v3\.mp3/);
});

test('generator rejects changed bytes, script, path, voice, settings or duration under an existing version', async t => {
  const { files, provenance, bytes } = verifierFixture(t);
  const original = structuredClone(provenance);
  const cases = [
    () => files.set(publicFile(rhymeInstructionPath('instruction')), Buffer.from('tampered')),
    () => { provenance.assets.instruction.text = 'Aim and fire'; },
    () => { provenance.assets.instruction.audio = '/audio/rhyme-pop/instruction-v2.mp3'; },
    () => { provenance.voice = 'another voice'; },
    () => { provenance.provider = 'another provider'; },
    () => { provenance.aiGenerated = false; },
    () => { provenance.version = 2; },
    () => { provenance.synthesis.speakingRate = 1.5; },
    () => { provenance.normalization.fadeOutSeconds = 1; },
    () => { provenance.assets.instruction.durationSeconds = 999; },
    () => { delete provenance.assets.instruction; }
  ];
  for (const mutate of cases) {
    Object.assign(provenance, structuredClone(original));
    files.set(publicFile(rhymeInstructionPath('instruction')), bytes);
    mutate();
    await assert.rejects(runRhymePopAudio({ verify: true }), /provenance|versioned path|differs/i);
  }
});

test('generator dry run describes exactly four instructions and five authored isolated words without touching media', async t => {
  for (const method of ['readFile', 'mkdir', 'mkdtemp', 'writeFile', 'copyFile', 'rm']) {
    t.mock.method(fs, method, () => assert.fail(`Dry run accessed files: ${method}`));
  }
  t.mock.method(globalThis, 'fetch', () => assert.fail('Dry run attempted synthesis'));
  t.mock.method(childProcess, 'execFileSync', () => assert.fail('Dry run executed a command'));
  const output = t.mock.method(console, 'log', () => {});
  await runRhymePopAudio({ dryRun: true });
  assert.deepEqual(output.mock.calls[0].arguments[0], expectedRows());
});
