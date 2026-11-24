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

test('placing a tile into a later box cannot complete a construction with empty boxes', () => {
  const item = build('fish', ['f', 'i', 'sh']);
  assert.equal(mockResponseComplete(item, ['', '', 't2']), false);
  assert.equal(mockResponseComplete(item, ['t0', '', 't2']), false);
  assert.equal(mockResponseComplete({ format:'order', sequenceLength:3 }, ['a', '', 'c']), false);
  assert.equal(mockResponseComplete(item, ['t0', 't1', 't2']), true);
  assert.equal(mockResponseComplete({ format:'choice' }, ['']), false, 'Returning a letter from its blank clears the answer');
});

test('alphabet spelling accepts repeated letters and an independently chosen response length', () => {
  const item = { ...build('bell', ['b','e','l']), alphabetSpelling:true };
  for (const word of ['b', 'bell', 'belle']) {
    assert.equal(mockResponseComplete(item,[...word]),true);
    assert.equal(mockResponseValue(item,[...word]),word);
  }
  assert.equal(mockResponseComplete(item,[]),false);
});

test('select-all accepts any nonempty subset while preserving historical exact-count mechanics', () => {
  const item = { format:'multi_select', selectCount:2, choices:['a','b','c','d'].map(id=>({id})), selectAllThatApply:true };
  for (const selection of [['b'],['b','d'],['a','b','d'],['a','b','c','d']]) assert.equal(mockResponseComplete(item,selection),true);
  for (const selection of [[],['a','a'],['missing']]) assert.equal(mockResponseComplete(item,selection),false);
  assert.equal(mockResponseComplete({...item,selectAllThatApply:false},['b']),false);
});
