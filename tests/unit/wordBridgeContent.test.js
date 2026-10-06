import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { CVC_WORDS, SENTENCES } from '../../src/data/learnGamesData.js';
import { WORD_BRIDGE_CONTENT_VERSION, WORD_BRIDGE_LEGACY_CONTENT_VERSION } from '../../src/data/arcadeContentVersions.js';
import { wordBridgeLadder, buildLevel } from '../../src/utils/wordBridgeLevels.js';
import { wordBridgeContentLadder, wordBridgeContentVersion, wordBridgeFreshWord, WORD_BRIDGE_V3_SENTENCES, WORD_BRIDGE_STUMP_PICTURE } from '../../src/components/learn/games/games/wordBridgeContent.js';
import { buildWordBridgeRounds } from '../../src/components/learn/games/games/wordBridgeLearning.js';

const versions = [WORD_BRIDGE_LEGACY_CONTENT_VERSION, WORD_BRIDGE_CONTENT_VERSION];
test('Bridge chooses revision before geometry: fresh v3, exact v2 sidecar/legacy, whitelisted cloud tag and no unknown versions', () => {
  assert.equal(wordBridgeContentVersion(), WORD_BRIDGE_CONTENT_VERSION);
  assert.equal(wordBridgeContentVersion({ savedVersion: WORD_BRIDGE_LEGACY_CONTENT_VERSION }), WORD_BRIDGE_CONTENT_VERSION);
  assert.equal(wordBridgeContentVersion({ resumedCheckpoint: true }), WORD_BRIDGE_LEGACY_CONTENT_VERSION);
  for (const version of versions) {
    assert.equal(wordBridgeContentVersion({ resumedCheckpoint: true, savedVersion: version }), version);
    assert.equal(wordBridgeContentVersion({ resumedCheckpoint: true, checkpointContentVersion: version }), version);
  }
  assert.equal(wordBridgeContentVersion({ resumedCheckpoint: true, savedVersion: 'word-bridge-v4' }), WORD_BRIDGE_LEGACY_CONTENT_VERSION);
  assert.equal(wordBridgeContentVersion({ resumedCheckpoint: true, checkpointContentVersion: WORD_BRIDGE_CONTENT_VERSION, savedVersion: WORD_BRIDGE_LEGACY_CONTENT_VERSION }), WORD_BRIDGE_CONTENT_VERSION);
  assert.throws(() => wordBridgeContentVersion({ resumedCheckpoint: true, checkpointContentVersion: 'word-bridge-v4' }), /Unsupported/);
});

test('Old v2 all-world geometry/targets remain byte-equivalent, and Easy/Medium fresh plans do not change curriculum', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) for (const seed of [0, 1, 3, 127, 0x80000000, 0xffffffff]) {
    const old = wordBridgeLadder(difficulty, seed);
    assert.deepEqual(wordBridgeContentLadder(difficulty, seed, WORD_BRIDGE_LEGACY_CONTENT_VERSION), old);
    if (difficulty !== 'hard') assert.deepEqual(wordBridgeContentLadder(difficulty, seed), old);
  }
  assert.throws(() => wordBridgeContentLadder('hard', 3, 'word-bridge-v4'), /Unsupported/);
});

test('Fresh Hard keeps ten stages/six taught word stations, every exact voiced sentence and literal punctuation without touching global banks', async () => {
  const original = JSON.stringify({ CVC_WORDS, SENTENCES }), seenWords = new Set(), seenSentences = new Set();
  for (let seed = 0; seed < 128; seed++) {
    const levels = wordBridgeContentLadder('hard', seed), rounds = buildWordBridgeRounds(levels, 'hard', seed, 0);
    assert.equal(rounds.length, 10); assert.equal(rounds.filter(r => !r.isSentence).length, 6);
    for (const round of rounds) {
      assert.ok(round.roundId.startsWith(`${WORD_BRIDGE_CONTENT_VERSION}:`)); assert.ok(round.audio, round.target);
      await fs.access('public' + round.audio);
      if (round.isSentence) {
        seenSentences.add(round.target);
        assert.ok(WORD_BRIDGE_V3_SENTENCES.some(([, sentence]) => sentence === round.target));
        assert.equal(round.units.at(-1), round.target.at(-1));
        assert.equal(round.tiles.filter(tile => tile.correct && tile.glyph === round.target.at(-1)).length, 1);
      } else {
        seenWords.add(round.target); assert.notEqual(round.target, 'grump');
        if (round.target === 'stump') assert.deepEqual(round.pictures, [WORD_BRIDGE_STUMP_PICTURE]);
      }
    }
  }
  const wholePool = CVC_WORDS.hard.map(wordBridgeFreshWord);
  assert.equal(wholePool.length, 30); assert.equal(new Set(wholePool).size, 30);
  assert.ok([...seenWords].every(word => wholePool.includes(word))); assert.ok(seenWords.has('stump')); assert.equal(seenSentences.size, 8);
  for (const word of wholePool) {
    const level = buildLevel({ world: 'moonwood', cycle: 0, mode: 'bridge', target: word, sessionSeed: 3 });
    const round = buildWordBridgeRounds([level], 'hard', 3, 0)[0];
    assert.ok(round.audio, word); await fs.access('public' + round.audio);
  }
  assert.equal(JSON.stringify({ CVC_WORDS, SENTENCES }), original);
  assert.ok(CVC_WORDS.hard.includes('grump')); assert.ok(SENTENCES.level3.some(sentence => sentence.includes('robot')));
  await fs.access('public' + WORD_BRIDGE_STUMP_PICTURE);
});
