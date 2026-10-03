import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createProgressRunSync } from '../../src/data/progressRunSync.js';
import { loadProgressRun, loadProgressRunLocal, saveProgressRunLocal } from '../../src/data/progressTestStore.js';
import { PROGRESS_BANK as bank } from '../../src/content/assessments/v3/progressBank.generated.js';
import { createProgressTestRun, beginProgressTest, commitProgressResponse, nextProgressItem } from '../../src/utils/progressTestRouter.js';
import { progressAudioCues, progressCheckAudioPath } from '../../src/utils/progressCheckAudio.js';
import { PROGRESS_CHECK_INSTRUCTIONS } from '../../src/data/progressCheckInstructions.js';
import { clearLocalProgressForStudent } from '../../src/utils/progressSync.js';
const make = () => beginProgressTest(createProgressTestRun({ bank, studentId: 'sync-pupil', teacherId: 'sync-teacher', planKind: 'focused', trackId: 'reading_stories', seed: 47 }));
const answer = run => commitProgressResponse(run, { itemId: run.currentItem.id, selected: run.currentItem.answer });
const storage = () => { const previous = globalThis.localStorage, rows = new Map(); globalThis.localStorage = { getItem: key => rows.get(key) || null, setItem: (key, value) => rows.set(key, value) }; return () => { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }; };

test('slow uploads never delay durable first answers and queued saves coalesce without losing evidence', async () => {
  const restore = storage(), calls = [], releases = [], states = [];
  const client = { call: async (name, args) => { calls.push(args.p_run); return new Promise(resolve => releases.push(() => resolve({ data: { ok: true } }))); } };
  const sync = createProgressRunSync({ client, onState: state => states.push(state.status) });
  try {
    let run = make(); const first = sync.checkpoint(run);
    run = answer(run); sync.checkpoint(run);
    run = answer(nextProgressItem(run)); sync.checkpoint(run);
    assert.equal(loadProgressRunLocal(run).responses.length, 2);
    assert.equal(calls.length, 1);
    releases.shift()(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(calls.length, 2); assert.equal(calls[1].responses.length, 2);
    releases.shift()(); await first.promise;
    assert.equal(states.at(-1), 'saved');
    assert.deepEqual(calls[1].responses, run.responses);
  } finally { sync.dispose(); restore(); }
});
test('a server timeout leaves exact evidence for retry, and disposal suppresses late learner callbacks', async () => {
  const restore = storage(); let fail = true; const states = [];
  const sync = createProgressRunSync({ client: { call: async () => fail ? { error: Object.assign(new Error('statement timeout'), { code: '57014' }) } : { data: { ok: true } } }, onState: state => states.push(state.status) });
  try {
    const run = answer(make()); await assert.rejects(sync.checkpoint(run).promise, /timeout/);
    assert.deepEqual(loadProgressRunLocal(run).responses, run.responses);
    fail = false; await sync.retry(); assert.equal(states.at(-1), 'saved');
    sync.dispose(); const count = states.length; await sync.retry(); assert.equal(states.length, count);
  } finally { sync.dispose(); restore(); }
});
test('without device storage even a local checkpoint waits for a server receipt', async () => {
  const previous = globalThis.localStorage; delete globalThis.localStorage;
  let release; const states = [];
  const sync = createProgressRunSync({ client: { call: async () => new Promise(resolve => { release = () => resolve({ data: { ok: true } }); }) }, onState: state => states.push(state.status) });
  try {
    const checkpoint = sync.checkpoint(make(), { upload: false });
    assert.equal(checkpoint.localSaved, false); assert.equal(typeof release, 'function');
    assert.equal(states.at(-1), 'pending'); release(); await checkpoint.promise;
    assert.equal(states.at(-1), 'saved');
  } finally { sync.dispose(); if (previous !== undefined) globalThis.localStorage = previous; }
});
test('a cloud receipt for an earlier snapshot cannot label a newer device checkpoint cloud-saved', async () => {
  const restore = storage(), states = []; let release;
  const sync = createProgressRunSync({ client: { call: async () => new Promise(resolve => { release = () => resolve({ data: { ok: true } }); }) }, onState: state => states.push(state.status) });
  try {
    const run = make(), first = sync.checkpoint(run);
    const audioCheckpoint = { ...run, checkpointRevision: 2, currentAudioDelivery: { instruction: 'completed' } };
    sync.checkpoint(audioCheckpoint, { upload: false });
    release(); await first.promise;
    assert.equal(states.at(-1), 'device');
    assert.deepEqual(loadProgressRunLocal(run), audioCheckpoint);
    sync.checkpoint({ ...audioCheckpoint, checkpointRevision: 3 }, { upload: false });
    assert.equal(states.at(-1), 'device');
  } finally { sync.dispose(); restore(); }
});
test('full device storage retains the exact queued cloud retry and only reports saved after its receipt', async () => {
  const previous = globalThis.localStorage, calls = [], states = []; let fail = true;
  globalThis.localStorage = { setItem: () => { throw Object.assign(new Error('Storage is full'), { name: 'QuotaExceededError' }); } };
  const sync = createProgressRunSync({ client: { call: async (name, args) => {
    calls.push(args.p_run);
    return fail ? { error: Object.assign(new Error('statement timeout'), { code: '57014' }) } : { data: { ok: true } };
  } }, onState: state => states.push(state) });
  try {
    const run = answer(make()), checkpoint = sync.checkpoint(run, { upload: false });
    assert.equal(checkpoint.localSaved, false);
    await assert.rejects(checkpoint.promise, /timeout/);
    assert.equal(states.at(-1).status, 'error'); assert.equal(states.at(-1).localSaved, false);
    fail = false; await sync.retry();
    assert.equal(states.at(-1).status, 'saved'); assert.equal(states.at(-1).localSaved, false);
    assert.deepEqual(calls[1], calls[0]); assert.equal(calls[1].responses.length, 1);
  } finally { sync.dispose(); if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
test('the storage fallback cannot upload evidence for a learner whose progress was cleared', async () => {
  const previous = globalThis.localStorage; let calls = 0;
  globalThis.localStorage = { length: 0, key: () => null, getItem: () => null, removeItem: () => {}, setItem: () => {} };
  const run = { ...make(), studentId: 'cleared-storage-pupil' };
  clearLocalProgressForStudent(run.studentId, { blockFutureWrites: true, storage: globalThis.localStorage });
  const sync = createProgressRunSync({ client: { call: async () => { calls++; return { data: { ok: true } }; } } });
  try { await assert.rejects(sync.checkpoint(run).promise, /cleared/); assert.equal(calls, 0); }
  finally { sync.dispose(); if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
test('a validated cloud draft resumes when device caching is full without bypassing a learner reset', async () => {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new DOMException('Storage is full', 'QuotaExceededError'); } };
  try {
    const run = make(), client = { call: async () => ({ data: { ok: true, run, history: [], exposures: [] } }) };
    assert.deepEqual((await loadProgressRun({ client, ...run })).run, run);
    const cleared = { ...run, studentId: 'cleared-cache-pupil' };
    clearLocalProgressForStudent(cleared.studentId, { blockFutureWrites: true, storage: { length: 0, key: () => null, getItem: () => null, setItem: () => {}, removeItem: () => {} } });
    await assert.rejects(loadProgressRun({ client: { call: async () => ({ data: { ok: true, run: cleared } }) }, ...cleared }), /cleared/);
  } finally { if (previous === undefined) delete globalThis.localStorage; else globalThis.localStorage = previous; }
});
test('resume keeps later local audio and pause checkpoints but rejects conflicting pause histories', async () => {
  const restore = storage();
  try {
    const remote = make(); const local = { ...remote, checkpointRevision: 9, currentAudioDelivery: { instruction: 'completed' }, pause: true, pauseEvents: [{ kind: 'pause', at: '2026-10-03T02:00:00Z' }] };
    saveProgressRunLocal(local);
    const client = { call: async () => ({ data: { ok: true, run: remote } }) };
    assert.deepEqual((await loadProgressRun({ client, ...local })).run, local);
    const divergent = { ...local, pauseEvents: [{ kind: 'pause', at: '2026-10-03T03:00:00Z' }] };
    saveProgressRunLocal(divergent);
    const conflict = await loadProgressRun({ client: { call: async () => ({ data: { ok: true, run: local } }) }, ...local });
    assert.match(conflict.conflict, /did not match/);
  } finally { restore(); }
});
test('temporary load failure resumes only a matching durable draft and never hides an authorization denial', async () => {
  const restore = storage();
  try {
    const run = answer(make()); saveProgressRunLocal(run);
    const offline = { call: async () => ({ error: new Error('Network connection unavailable') }) };
    const resumed = await loadProgressRun({ client: offline, ...run });
    assert.deepEqual(resumed.run, run); assert.equal(resumed.interruptedLoad, true);
    await assert.rejects(loadProgressRun({ client: offline, ...run, studentId: 'other-pupil' }), /Network/);
    await assert.rejects(loadProgressRun({ client: { call: async () => ({ data: { ok: false, error: 'not_owner' } }) }, ...run }), /not_owner/);
  } finally { restore(); }
});
test('every permitted progress cue and interface instruction resolves to exact Leda; story precedes question', () => {
  for (const item of bank.items) {
    const cues = progressAudioCues(item);
    for (const cue of cues) { assert.ok(cue.path, `${item.id}: ${cue.text}`); assert.ok(fs.existsSync(new URL(`../../public${cue.path}`, import.meta.url)), cue.path); }
    if (item.trackId === 'listening_stories') assert.equal(cues[0].role, 'passage');
    if (item.trackId === 'reading_stories') assert.equal(cues.some(cue => cue.role === 'passage'), false);
    if (['printed_words', 'common_words'].includes(item.trackId)) assert.equal(cues.some(cue => cue.role.startsWith('choices')), false);
  }
  for (const text of Object.values(PROGRESS_CHECK_INSTRUCTIONS)) assert.ok(progressCheckAudioPath(text));
});
