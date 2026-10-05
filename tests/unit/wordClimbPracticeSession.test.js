import test from 'node:test';
import assert from 'node:assert/strict';
import { createWordClimbSession } from '../../src/utils/wordClimbLevels.js';
import { createClimbJourney, advanceClimbJourney, climbRouteCenter } from '../../src/components/learn/games/games/wordClimbJourney.js';
import { jumpToClimbPlatform } from '../../src/components/learn/games/games/wordClimbWorld.js';
import { createWordClimbPracticeState, isHistoricalWordClimbCompletion, validateWordClimbPracticeSession } from '../../src/components/learn/games/games/wordClimbPracticeSession.js';
import { readClimbSession, writeClimbSession } from '../../src/components/learn/games/games/wordClimbSession.js';
import { commitWordClimbLanding, wordClimbRounds } from '../../src/components/learn/games/games/wordClimbLearning.js';

function fixture(originStep = 0, stageIndex = 0, legacyResume = false) {
  const session = createWordClimbSession('easy', () => .32), world = createClimbJourney(session, stageIndex, originStep, () => .32, {layoutRevision:'short-v2'});
  return createWordClimbPracticeState(session, world, { difficulty: 'easy', seed: 3, journeyIndex: 0, originStep, legacyResume });
}

function completePhysicalClimb(session, world, onLanding = () => {}) {
  let finalLaunchRest;
  for (let row = 1; row <= session.summit; row++) {
    let ticks = 0;
    while (world.journey.phase === 'climb' && ticks++ < 900) {
      const obstacle = world.journey.obstacles.find(item => item.section === world.step && item.y > world.y - 35 && item.y - world.y < 185);
      const desired = climbRouteCenter(world.journey, world.y, world.journey.branchStartX) - (obstacle?.side || 0) * 82, delta = desired - world.x;
      advanceClimbJourney(world, 1 / 60, { up: true, left: delta < -2, right: delta > 2 });
    }
    assert.equal(world.journey.phase, 'word');
    const choice = world.platforms.find(platform => platform.kind === 'word' && platform.row === row && platform.correct);
    finalLaunchRest = structuredClone(world.journey.safeRest);
    assert(jumpToClimbPlatform(world, choice.id));
    ticks = 0;
    while (world.step < row && ticks++ < 100) advanceClimbJourney(world, 1 / 60, {});
    assert.equal(world.step, row); onLanding(choice, row);
  }
  return finalLaunchRest;
}

test('Climb zero cursor saves actual approach position and stable three-word layout without regenerating choices', () => {
  const state = fixture();
  for (let index = 0; index < 18; index++) advanceClimbJourney(state.world, 1 / 60, { up: true, right: true });
  const restored = validateWordClimbPracticeSession(state, 'easy', 3, 0);
  assert.ok(restored); assert.equal(restored.world.x, state.world.x); assert.equal(restored.world.y, state.world.y);
  assert.deepEqual(restored.world.platforms, state.world.platforms);
  restored.world.x += 5; assert.notEqual(restored.world.x, state.world.x);
  assert.equal(validateWordClimbPracticeSession(state, 'easy', 4, 0), null);
  assert.equal(validateWordClimbPracticeSession(state, 'easy', 3, 1), null);
});

test('Climb saves genuine partial word flight, then actual solid landing and immutable evidence at the same cursor', () => {
  const state = fixture(), world = state.world;
  world.y = 300; world.camera = 185; world.safeId = 'base-0'; world.standingId = 'base-0'; world.journey.safeRest = { id: 'base-0', x: world.x, y: 300 }; world.journey.phase = 'word';
  const choice = world.platforms.find(platform => platform.row === 1 && platform.correct);
  assert.equal(jumpToClimbPlatform(world, choice.id), true);
  advanceClimbJourney(world, .05, {});
  const flying = validateWordClimbPracticeSession(state, 'easy', 3, 0);
  assert.ok(flying); assert.equal(flying.world.state, 'airborne'); assert.equal(flying.world.targetId, choice.id);
  for (let index = 0; index < 100 && !world.step; index++) advanceClimbJourney(world, 1 / 60, {});
  assert.equal(world.step, 1);
  const round = wordClimbRounds(world, state.session, state)[0];
  state.evidence = commitWordClimbLanding(state.evidence, round, choice.id, { delivery: 'unavailable', responseAt: 20 }).evidence;
  assert.ok(validateWordClimbPracticeSession(state, 'easy', 3, 0));
  const forged = structuredClone(state); forged.world.step = 2;
  assert.equal(validateWordClimbPracticeSession(forged, 'easy', 3, 0), null);
});

test('Legacy stage77/origin3 preserves earned prefix and actual choices, while hosted mappings and fabricated prefix are rejected', () => {
  const state = fixture(3, 77, true);
  const restored = validateWordClimbPracticeSession(state, 'easy', 3, 0);
  assert.ok(restored); assert.equal(restored.world.step, 3); assert.equal(restored.stageIndex, 77); assert.deepEqual(restored.evidence.firstResponses, []);
  const newClaim = structuredClone(state); newClaim.legacyResume = false;
  assert.equal(validateWordClimbPracticeSession(newClaim, 'easy', 3, 0), null);
  const forged = structuredClone(state); forged.evidence.completions = ['old-invented-row'];
  assert.equal(validateWordClimbPracticeSession(forged, 'easy', 3, 0), null);
});

test('A migrated fully completed legacy summit retains its actual world and empty v2 evidence as history, while Replay starts a new climb', () => {
  const session = createWordClimbSession('easy', () => .32), world = createClimbJourney(session, 77, 0, () => .32, {layoutRevision:'short-v2'});
  const finalLaunchRest = completePhysicalClimb(session, world);
  assert.equal(world.completed, true, 'The legacy fixture is written after the actual final physical landing');
  // Reproduce exactly the former completed-sidecar mismatch; retain its real
  // final sole position, solid shelf, layout, totals and no v2 response history.
  world.journey.safeRest = finalLaunchRest;
  delete world.journey.layoutRevision;
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  writeClimbSession(storage, 'old-complete', session, world, 'My completed summit');
  const actual = readClimbSession(storage, 'old-complete', session.summit - 1, true);
  assert(actual); assert.equal(actual.world.completed, true); assert.equal(actual.world.step, session.summit);
  assert.deepEqual(actual.world.journey.safeRest, { id: world.safeId, x: world.x, y: world.y });
  const migrated = createWordClimbPracticeState(actual.session, actual.world, { difficulty: 'easy', seed: 0xffffffff,
    journeyIndex: 0, originStep: session.summit - 1, legacyResume: true, legacyCompletedResume: true });
  const restored = validateWordClimbPracticeSession(migrated, 'easy', 0xffffffff, 0);
  assert(restored); assert(isHistoricalWordClimbCompletion(restored));
  assert.deepEqual(restored.evidence.firstResponses, []); assert.deepEqual(restored.evidence.assistedRetries, []);
  assert.deepEqual(restored.evidence.completions, []); assert.equal(restored.world.y, actual.world.y);
  assert.deepEqual(restored.world.platforms, actual.world.platforms); assert.equal(restored.world.wrong, actual.world.wrong);
  const newClimb = fixture(); assert.equal(isHistoricalWordClimbCompletion(newClimb), false);
  assert.equal(newClimb.world.step, 0); assert.equal(newClimb.world.completed, false);
  const fabricated = structuredClone(restored); fabricated.legacyCompletedResume = false;
  assert.equal(validateWordClimbPracticeSession(fabricated, 'easy', 0xffffffff, 0), null,
    'A fully completed native claim cannot borrow historical height in place of an actual final landing');
});

test('The actual new final solid landing saves its six genuine response rows and final hold, while inconsistent current v2 saves remain rejected', () => {
  const state = fixture();
  const launchRest = completePhysicalClimb(state.session, state.world, (choice, row) => {
    const round = wordClimbRounds(state.world, state.session, state).find(item => item.row === row);
    state.evidence = commitWordClimbLanding(state.evidence, round, choice.id, { delivery: 'unavailable', responseAt: row }).evidence;
  });
  assert.equal(state.evidence.firstResponses.length, 6); assert.equal(state.evidence.completions.length, 6);
  assert.deepEqual(state.world.journey.safeRest, { id: state.world.safeId, x: state.world.x, y: state.world.y });
  const restored = validateWordClimbPracticeSession(state, 'easy', 3, 0);
  assert(restored); assert.equal(isHistoricalWordClimbCompletion(restored), false);
  assert.deepEqual(restored.evidence, state.evidence); assert.equal(restored.world.y, state.world.y);
  const inconsistent = structuredClone(state); inconsistent.world.journey.safeRest = launchRest;
  assert.equal(validateWordClimbPracticeSession(inconsistent, 'easy', 3, 0), null,
    'Historical normalization is not a generic repair of inconsistent current v2 saves');
});

test('Climb rejects malformed geometry, recovery/choice relationships and unbounded worlds rather than relocating a saved child', () => {
  for (const mutate of [state => { state.world.platforms[1].x += 1; }, state => { state.world.platforms[1].word = 'bad-tamper'; },
    state => { state.world.journey.collected = ['not-a-light']; }, state => { state.world.journey.safeRest.id = 'not-a-hold'; },
    state => { state.world.vx = Infinity; }, state => { state.world.extra = 'x'.repeat(2000001); }]) {
    const state = fixture(); mutate(state); assert.equal(validateWordClimbPracticeSession(state, 'easy', 3, 0), null);
  }
});

test('Climb retains the actual browser branch x after one-ULP Math.sin rounding without accepting a changed route', () => {
  const session = createWordClimbSession('hard', () => .32), world = createClimbJourney(session, 2, 0, () => .32, {layoutRevision:'short-v2'});
  const state = createWordClimbPracticeState(session, world, { difficulty: 'hard', seed: 3, journeyIndex: 0 });
  // Exact branch-2-0 value from the genuine ten-landing browser checkpoint.
  // Node's reference was358.807998398053; no saved response is reconstructed.
  world.journey.obstacles[2].x = 358.80799839805303;
  const restored = validateWordClimbPracticeSession(state, 'hard', 3, 0);
  assert(restored); assert.equal(restored.world.journey.obstacles[2].x, 358.80799839805303);
  assert.deepEqual(restored.evidence, state.evidence);
  for (const mutate of [
    value => { value.world.journey.obstacles[2].x += 1e-8; },
    value => { value.world.journey.obstacles[2].x = Infinity; },
    value => { value.world.journey.obstacles[2].y += 1e-12; },
    value => { value.world.journey.obstacles[2].section += 1; },
    value => { value.world.journey.obstacles[2].width += 1; },
    value => { value.world.journey.obstacles[2].side *= -1; },
    value => { value.world.journey.obstacles[2].id = 'branch-2-fake'; },
    value => { value.world.journey.obstacles[2].extra = true; },
    value => { delete value.world.journey.obstacles[2].side; },
    value => { value.world.journey.obstacles.reverse(); },
    value => { value.world.journey.obstacles.pop(); },
    value => { value.world.platforms[1].x += 1e-8; },
    value => { value.world.journey.lights[2].x += 1e-8; },
  ]) {
    const changed = structuredClone(state); mutate(changed);
    assert.equal(validateWordClimbPracticeSession(changed, 'hard', 3, 0), null);
  }
});
