import assert from 'node:assert/strict';
import test from 'node:test';
import { mockConstructionLength, mockResponseComplete, mockResponseValue } from '../../src/utils/literacyMockResponse.js';
const build = (answer, tiles) => ({ format: 'build_word', answer, choices: tiles.map((label, index) => ({ id: `t${index}`, label })) });
test('build-word completion requires the authored tile count including digraphs', () => {
  const item = build('clock', ['c', 'l', 'o', 'ck']);
  assert.equal(mockConstructionLength(item), 4);
  assert.equal(mockResponseComplete(item, ['t0']), false);
  assert.equal(mockResponseComplete(item, ['t0', 't1', 't2']), false);
  assert.equal(mockResponseComplete(item, ['t0', 't1', 't2', 't3']), true);
  assert.equal(mockResponseValue(item, ['t0', 't1', 't2', 't3']), 'clock');
});
test('repeated letters occupy separate spaces and extra distractors do not extend the answer', () => {
  const item = build('bell', ['b', 'e', 'l', 'l', 'a']);
  assert.equal(mockConstructionLength(item), 4);
  assert.equal(mockResponseComplete(item, ['t0', 't1', 't2']), false);
  assert.equal(mockResponseComplete(item, ['t0', 't1', 't2', 't3', 't4']), false);
  assert.equal(mockResponseComplete(item, ['t4', 't3', 't2', 't1']), true); // completeness is not correctness
});
