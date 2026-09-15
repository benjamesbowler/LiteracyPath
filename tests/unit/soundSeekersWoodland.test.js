import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import postcss from 'postcss';
import { woodlandChapterStorageKey, localProgressKeysForStudent, localProgressStorageKeyForRow } from '../../src/utils/progressKeys.js';
import { freshChapter, currentRound, judgeChoice, selectProject } from '../../demos/sound-seekers/src/chapter/progress.js';
import { SAVE_KEY } from '../../demos/sound-seekers/src/chapter/progress.js';
import { readChapterSave, writeChapterSave } from '../../demos/sound-seekers/src/chapter/storage.js';

test('woodland saves keep learners, anonymous previews and the old campaign separate', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const getStorage = () => storage;
  const alice = woodlandChapterStorageKey('alice'), bob = woodlandChapterStorageKey('bob');
  const legacy = localProgressStorageKeyForRow('phonics_quest', 'sound_seekers_v3', 'alice');
  values.set(SAVE_KEY, JSON.stringify(freshChapter(12)));
  values.set(legacy, 'retained campaign save');
  assert.equal(readChapterSave(alice, getStorage), null);
  assert.equal(readChapterSave(bob, getStorage), null);
  let progress = freshChapter(61);
  const round = currentRound(progress);
  progress = judgeChoice(progress, round.answer).progress;
  assert.equal(writeChapterSave(alice, progress, getStorage), true);
  assert.equal(readChapterSave(alice, getStorage).jobs.picnic.round, 1, 'pending answer settles exactly once');
  assert.equal(readChapterSave(alice, getStorage).jobs.picnic.round, 1);
  assert.equal(readChapterSave(bob, getStorage), null);
  assert.equal(values.get(legacy), 'retained campaign save');
  assert.equal(JSON.parse(values.get(SAVE_KEY)).seed, 12);
  assert.ok(localProgressKeysForStudent('alice').includes(alice), 'learner removal and reset include the local chapter');
  assert.ok(!localProgressKeysForStudent('bob').includes(alice));
});

test('woodland save restores the chosen project and reports unavailable storage', () => {
  const values = new Map();
  const getStorage = () => ({ getItem: key => values.get(key), setItem: (key,value) => values.set(key,value) });
  const key = woodlandChapterStorageKey('class/a:b');
  assert.notEqual(key, woodlandChapterStorageKey('class%2Fa%3Ab'));
  assert.throws(() => woodlandChapterStorageKey(' '), TypeError);
  const progress = selectProject(freshChapter(77), 'brook');
  progress.settings = { muted: true, reduced: true, low: true };
  assert.equal(writeChapterSave(key, progress, getStorage), true);
  assert.deepEqual(readChapterSave(key, getStorage), progress);
  const blocked = () => { throw new Error('Storage blocked'); };
  assert.equal(readChapterSave(key, blocked), null);
  assert.equal(writeChapterSave(key, progress, blocked), false);
  values.set(key, '{broken');
  assert.equal(readChapterSave(key, getStorage), null);
});

test('woodland styles cannot change the host app after leaving the game', () => {
  for (const file of ['style.css', 'chapter/chapter.css']) {
    const root = postcss.parse(fs.readFileSync(new URL('../../demos/sound-seekers/src/' + file, import.meta.url), 'utf8'));
    root.walkRules(rule => {
      if (rule.parent.name?.includes('keyframes')) return;
      for (const selector of rule.selectors) assert.ok(selector.startsWith('.sound-seekers-woodland'), selector);
    });
    root.walkAtRules('keyframes', rule => assert.ok(rule.params.startsWith('woodland-')));
  }
});
