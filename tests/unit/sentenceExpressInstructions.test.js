import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SENTENCE_EXPRESS_INSTRUCTIONS } from '../../src/components/learn/games/games/sentenceExpressInstructions.js';
import { getLedaInstructionAudioPath } from '../../src/data/ledaProductionAudio.js';

test('every Sentence Express action resolves an exact production recording with real MP3 bytes', () => {
  assert.deepEqual(Object.keys(SENTENCE_EXPRESS_INSTRUCTIONS), ['engine', 'build', 'repair', 'gap', 'caboose', 'send']);
  const paths = new Set();
  for (const text of Object.values(SENTENCE_EXPRESS_INSTRUCTIONS)) {
    const publicPath = getLedaInstructionAudioPath(text);
    assert.match(publicPath, /^\/audio\/production\/en-US\/instruction\/.+\.mp3$/);
    const bytes = fs.readFileSync(new URL(`../../public${publicPath}`, import.meta.url));
    assert.ok(bytes.length > 1000, `${text}: production recording is empty`);
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || bytes[0] === 0xff, `${text}: not MP3 bytes`);
    paths.add(publicPath);
  }
  assert.equal(paths.size, Object.keys(SENTENCE_EXPRESS_INSTRUCTIONS).length);
});
