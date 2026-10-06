import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketWorldRecordsOwner } from '../../src/components/learn/games/games/rocketRunWorldRecords.js';
import { loadRocketRunCraft } from '../../src/components/learn/games/games/rocketRunCraftData.js';

const complete = (world, character) => ({ [world]: { character, url: '/game-assets/rocket-run/models/'+character+'-spacecraft-v1.glb',
  capture: { socket: 'wordCaptureSocket' }, flight: { primary: { frames: Array.from({ length: 42 }, () => ({})) },
    emergency: { frames: Array.from({ length: 21 }, () => ({})) } },
  route: { primary: { roles: Object.fromEntries(['station', 'portal', 'courier', 'planet', 'asteroid', 'beacon', 'comet'].map(role => [role, {}])) } },
  venue: { primary: {}, embedded: {} } } });
const deferred = () => { let resolve; return { promise: new Promise(done => { resolve = done; }), resolve: value => resolve(value) }; };

test('all actual delivered worlds load only their selected complete metadata and canonical pilot', async () => {
  for (const [difficulty, world, character] of [['easy','meadow','bouncy'],['medium','dino','chompy'],['hard','moonwood','pip']]) {
    const requests = [], created = [];
    const owner = createRocketWorldRecordsOwner({ difficulty,
      loadWorld: selected => { requests.push(selected); return loadRocketRunCraft(selected); },
      createEngine: options => { created.push(options); return { destroy() {}, debugSnapshot: () => ({}) }; } });
    assert.equal(await owner.start(), true);
    assert.deepEqual(requests, [world]); assert.equal(created.length, 1);
    assert.deepEqual(Object.keys(created[0].records), [world]);
    const record = created[0].records[world];
    assert.equal(record.character, character);
    assert.equal(record.flight.primary.frames.length, 42); assert.equal(record.flight.emergency.frames.length, 21);
    assert.equal(record.capture.radius, .34); assert.equal(Object.keys(record.route.primary.roles).length, 7);
    assert.equal(owner.inspect().status, 'ready'); owner.destroy();
  }
});

test('pause and support while the selected module is pending are applied before engine creation', async () => {
  const pending = deferred(), created = [], events = [];
  const owner = createRocketWorldRecordsOwner({ difficulty: 'hard', loadWorld: () => pending.promise,
    createEngine: options => { created.push(options); return { destroy() {}, pause: () => events.push('pause'),
      resume: () => events.push('resume'), markSupported: reason => events.push(reason), debugSnapshot: () => ({ round: 0 }) }; } });
  const start = owner.start(); owner.pause(); owner.markSupported('help-opened');
  assert.equal(created.length, 0); assert.equal(owner.debugSnapshot().paused, true);
  pending.resolve(complete('moonwood','pip')); assert.equal(await start, true);
  assert.equal(created[0].initiallyPaused, true); assert.deepEqual(created[0].initialSupportReasons, ['help-opened']);
  owner.resume(); assert.deepEqual(events, ['resume']); owner.destroy();
});

test('a genuine selected-module failure retries that same world and cannot silently substitute a theme', async () => {
  const requests = [], created = [], statuses = [];
  const owner = createRocketWorldRecordsOwner({ difficulty: 'medium', onStatus: value => statuses.push(value.status),
    loadWorld: world => { requests.push(world); return Promise.resolve(requests.length === 1 ? complete('meadow','bouncy') : complete('dino','chompy')); },
    createEngine: options => { created.push(options); return { destroy() {}, debugSnapshot: () => ({}) }; } });
  assert.equal(await owner.start(), false); assert.equal(owner.inspect().status, 'failed'); assert.equal(created.length, 0);
  assert.equal(await owner.start(), true); assert.deepEqual(requests, ['dino','dino']);
  assert.deepEqual(statuses, ['loading','failed','loading','ready']); owner.destroy();
});

test('pending exit and superseded retries never create an engine or resurrect delivered status', async () => {
  const first = deferred(), second = deferred(), created = [], statuses = [], signals = [];
  let loads = 0;
  const owner = createRocketWorldRecordsOwner({ difficulty: 'easy', onStatus: value => statuses.push(value.status),
    loadWorld: (world, { signal }) => { signals.push(signal); return ++loads === 1 ? first.promise : second.promise; },
    createEngine: options => { created.push(options); return { destroy() {}, debugSnapshot: () => ({}) }; } });
  const old = owner.start(), newer = owner.start();
  assert.equal(signals[0].aborted, true);
  assert.equal(signals[1].aborted, false);
  first.resolve(complete('meadow','bouncy')); assert.equal(await old, false); assert.equal(created.length, 0);
  owner.destroy(); second.resolve(complete('meadow','bouncy')); assert.equal(await newer, false);
  assert.equal(signals[1].aborted, true);
  assert.equal(created.length, 0); assert.deepEqual(statuses, ['loading','loading']);
  assert.equal(await owner.start(), false); assert.equal(loads, 2);
});

test('native control cancellation reaches the live release rule and cannot resurrect an exited owner', async () => {
  let released = 0;
  const owner = createRocketWorldRecordsOwner({ difficulty: 'easy', loadWorld: async () => complete('meadow', 'bouncy'),
    createEngine: () => ({ destroy() {}, release: () => { released++; } }) });
  owner.release();
  assert.equal(await owner.start(), true);
  owner.release();
  assert.equal(released, 1);
  owner.destroy();
  owner.release();
  assert.equal(released, 1);
});
