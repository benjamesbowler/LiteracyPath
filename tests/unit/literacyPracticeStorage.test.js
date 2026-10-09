import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLiteracyPracticeBank } from '../../src/data/literacyPracticeBank.js';
import { createSkillsPracticeEvent } from '../../src/utils/skillsPracticeModel.js';
import { loadLearnGamesProgress, saveLearnGamesProgress } from '../../src/utils/learnGamesProgress.js';
import { encodeProgressStorage, decodeProgressStorage } from '../../src/utils/progressStorageCodec.js';
import { configureProgressSync, clearProgressSyncSession, getProgressSyncState, flushQueuedProgressWrites } from '../../src/utils/progressSync.js';
import { readProgressQueueRecords } from '../../src/utils/progressQueue.js';

function browser(t) {
  const data = new Map(); const limit = 5 * 1024 * 1024;
  const storage = { get length() { return data.size; }, key: i => [...data.keys()][i] ?? null,
    getItem: k => data.get(k) ?? null, removeItem: k => data.delete(k),
    setItem(k, v) { const next = new Map(data); next.set(k, String(v)); if ([...next].reduce((sum, [key, value]) => sum + 2 * (key.length + value.length), 0) > limit) throw new Error('QuotaExceededError'); data.set(k, String(v)); } };
  const before = globalThis.window;
  globalThis.window = { localStorage: storage, addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, setTimeout() { return 1; }, clearTimeout() {} };
  t.after(() => { clearProgressSyncSession(); globalThis.window = before; });
  return { storage, data, limit };
}

test('ten full MAP sittings fit local, cache and atomic upload storage without losing any answer or resume state', async t => {
  const { storage, data, limit } = browser(t);
  const bank = (await loadLiteracyPracticeBank()).filter(q => q.passage && q.literacyModality === 'reading');
  const completions = Array.from({ length: 400 }, (_, i) => ({ ...createSkillsPracticeEvent({ question: bank[i % bank.length], sessionId: `sitting-${Math.floor(i / 40)}`, responseId: `answer-${i}`, selected: bank[i % bank.length].answer, isCorrect: i % 3 !== 0 }), gameId: 'literacy-practice', contentVersion: 'literacy-practice-v1' }));
  const progress = { musicEnabled: false, games: { 'literacy-practice': { practiceRecord: { v: 3, status: 'inprogress', completions }, checkpoints: { practice: { questionIds: bank.slice(0, 40).map(q => q.id), index: 13, answers: completions.slice(-13), responseEpisode: { question: bank[13], passageAudioUsed: true } } } }, 'letter-leap': { stars: 2 } } };
  const raw = JSON.stringify(progress);
  assert.ok(raw.length * 2 * 3 > limit, 'the old local/cache/queue copies exceed the actual UTF-16 quota');
  storage.setItem('literacy-guide-learn-games:other-child', '{"games":{"letter-leap":{"stars":3}}}');
  const other = storage.getItem('literacy-guide-learn-games:other-child');
  const sent = [];
  configureProgressSync({ studentId: 'map-capacity', mode: 'student', token: 'fixture-token', client: { call: async (_, args) => { sent.push(args); return { data: { ok: true } }; } } });
  // Legacy JSON is still readable and migrates on the next genuine save.
  storage.setItem('literacy-guide-learn-games:map-capacity', raw);
  assert.deepEqual(loadLearnGamesProgress('map-capacity').games, progress.games);
  saveLearnGamesProgress('map-capacity', progress);
  assert.ok(storage.getItem('literacy-guide-learn-games:map-capacity').startsWith('lp-progress-gzip-'));
  storage.setItem('lp-cloud-progress-rows-v1', encodeProgressStorage({ 'map-capacity': [{ area: 'learn_games', key: '__all__', payload: progress }] }));
  assert.equal(getProgressSyncState('map-capacity').status, 'saving');
  assert.equal(getProgressSyncState('map-capacity').volatilePending, 0);
  assert.deepEqual(loadLearnGamesProgress('map-capacity').games, progress.games);
  assert.deepEqual(readProgressQueueRecords(storage)[0].entry.payload.games, progress.games);
  assert.deepEqual(decodeProgressStorage(storage.getItem('lp-cloud-progress-rows-v1'))['map-capacity'][0].payload, progress);
  assert.equal(storage.getItem('literacy-guide-learn-games:other-child'), other);
  assert.ok([...data].reduce((sum, [k, v]) => sum + 2 * (k.length + v.length), 0) < limit);
  await flushQueuedProgressWrites();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].p_payload.games['literacy-practice'].practiceRecord.completions.length, 400);
  assert.equal(getProgressSyncState('map-capacity').pending, 0);
  assert.deepEqual(loadLearnGamesProgress('map-capacity').games, progress.games);
});

test('a genuine device storage failure still blocks the local commit instead of claiming it saved', t => {
  const { storage } = browser(t);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => saveLearnGamesProgress('map-failed', { games: {} }), /QuotaExceededError/);
});
