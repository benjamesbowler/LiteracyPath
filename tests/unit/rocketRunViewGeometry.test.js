import test from 'node:test';
import assert from 'node:assert/strict';
import { createRocketViewGeometry, rocketRunMeteorField } from '../../src/utils/rocketRunViewGeometry.js';
import { createRocketCourierState, selectRocketCourier, stepRocketCouriers } from '../../src/utils/rocketRunCourierSimulation.js';

test('every unchanged physical lane has a readable real first contact at the declared small reading floor', () => {
  const plan = { round: 0, target: 'k', needed: 1, choices: [{ id: 'kettle', word: 'kettle', correct: true }] };
  for (const [width, height] of [[1366, 768], [320, 568], [320, 340], [568, 260], [568, 320]]) {
    const view = createRocketViewGeometry(width, height);
    for (const lane of [0, 1, 2]) {
      const state = createRocketCourierState(plan, { seed: 127, lane, laneX: view.laneX });
      state.queue = []; state.spawnIn = 99;
      state.carriers = [{ trialId: 'kettle', word: 'kettle', flightId: 1, lane, x: view.laneX(lane), z: -42,
        radius: .43, depthRadius: .24, alive: true, passed: false, misses: 0 }]; state.nextFlightId = 2;
      let selected = false, event = null, readableFrames = 0;
      for (let tick = 0; tick < 700 && !event; tick++) {
        const paint = view.faces(state.carriers, word => word.length * 9.6)[0];
        if (paint?.readable) { readableFrames++; state.carriers[0].visible = true; state.carriers[0].readable = true;
          if (!state.intent) selected ||= selectRocketCourier(state, plan, 'keyboard'); }
        const events = stepRocketCouriers(state, plan, 1 / 120, { laneX: view.laneX,
          presentation: carrier => view.faces([carrier], word => word.length * 9.6)[0] || {} });
        event = events.find(row => row.type !== 'motor-passage');
      }
      assert.ok(selected, `${width}x${height}/lane${lane}: no readable selection window`);
      assert.ok(readableFrames >= 36, `${width}x${height}/lane${lane}: less than .3 seconds of real readable flight`);
      assert.equal(event?.type, 'accepted-word', `${width}x${height}/lane${lane}: actual first contact is not an actionable reading response`);
      assert.equal(state.caughtIds.length, 1);
    }
  }
});

test('a resize changes projection but never lane positions, fixed IDs, target fields or source state', () => {
  const state = [{ flightId: 9, trialId: 'word-9', word: 'blackcurrant', alive: true, passed: false, x: -2.2, lane: 0, z: -12 }];
  const before = structuredClone(state);
  const wide = createRocketViewGeometry(1366, 768), small = createRocketViewGeometry(320, 340);
  assert.deepEqual([0, 1, 2].map(wide.laneX), [0, 1, 2].map(small.laneX));
  for (const view of [wide, small]) { const face = view.faces(state)[0]; assert.equal(face.flightId, 9);
    assert.equal(face.word, 'blackcurrant'); assert.equal(face.fontSize, 16); assert.equal(face.hitHeight, 56); }
  assert.deepEqual(state, before);
});

test('meteor positions use motor distance and give a fresh round an honest distant approach', () => {
  const view = createRocketViewGeometry(1366, 768);
  const state = { seed: 127, round: 4, distance: 84, hazardOriginDistance: 0 };
  const before = structuredClone(state), rows = rocketRunMeteorField(state, 'hard', view.laneX);
  assert.equal(rows[0].z, -3); assert.equal(rows[0].x, view.laneX(rows[0].lane));
  const next = { ...state, round: 5, hazardOriginDistance: 84 };
  assert.equal(rocketRunMeteorField(next, 'hard', view.laneX)[0].z, -43);
  assert.deepEqual(state, before); assert.ok(rows.every(row => !Object.hasOwn(row, 'word') && !Object.hasOwn(row, 'correct')));
});

test('receiver and hazard silhouettes project their actual world dimensions rather than fixed pixel sprites', () => {
  for (const [width, height] of [[1366, 768], [320, 568], [568, 260]]) {
    const view = createRocketViewGeometry(width, height);
    const receiver = view.receiver(0, .54, -1.8);
    assert.deepEqual(receiver.points[0], view.project(.34, .54, -1.8));
    const top = view.project(0, .88, -1.8);
    assert.ok(Math.abs(receiver.points[8].x - top.x) < 1e-8 && Math.abs(receiver.points[8].y - top.y) < 1e-8);
    const near = view.volume(0, .54, -3, { radius: .55, depthRadius: .33 });
    const far = view.volume(0, .54, -35, { radius: .55, depthRadius: .33 });
    assert.ok(near.bounds.right - near.bounds.x > 2 * (far.bounds.right - far.bounds.x));
    assert.ok(near.bounds.bottom - near.bounds.y > 2 * (far.bounds.bottom - far.bounds.y));
    assert.equal(near.radius, .55); assert.equal(near.depthRadius, .33);
    assert.ok(near.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
    assert.notDeepEqual(receiver.bounds, createRocketViewGeometry(width, height + 100).receiver(0, .54, -1.8).bounds);
  }
});

test('current readable faces stay outside the actual reserved feedback strip at every compact layout', () => {
  const overlap = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
  for (const [width, height] of [[1366, 768], [320, 568], [320, 340], [568, 260], [568, 320]]) {
    const view = createRocketViewGeometry(width, height);
    let readable = 0;
    for (const lane of [0, 1, 2]) for (let z = -46; z < -1.8; z += .05) {
      const face = view.faces([{ flightId: 1, trialId: 'six-letter-word', word: 'kettle', lane,
        x: view.laneX(lane), z, alive: true, passed: false }])[0];
      if (!face.readable) continue;
      readable++; assert.equal(overlap(face.rect, view.layout.coach), false);
      assert.equal(overlap(face.rect, view.layout.cue), false); assert.equal(face.fontSize, 16);
    }
    assert.ok(readable > 0, `${width}x${height}: feedback removed all real reading windows`);
    assert.ok(view.layout.coach.y >= 64 && view.layout.coach.bottom <= height - 8);
    if (view.layout.compact && !view.layout.portrait) assert.ok(view.layout.coach.x >= 312);
  }
});
