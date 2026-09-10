import test from 'node:test';
import assert from 'node:assert/strict';
import { createCarryWorld, advanceCarryWorld, requestCarryAction, carryRackX, carryStationX, carryWorldSnapshot, createConveyorWorld, advanceConveyor, divertConveyor, resolveConveyorDelivery } from '../../src/components/learn/games/games/adventureWorldModel.js';
function walk(w, n = 200) {
  for (let i = 0; i < n; i++) advanceCarryWorld(w, .05);
}
test('rescue has solid frontier, physical pickup and all six persistent crossings before friend rescue', () => {
  const w = createCarryWorld('rescue', 0, 6);
  w.input = 1;
  walk(w);
  assert.equal(w.x, 900);
  for (let i = 0; i < 6; i++) {
    w.index = i;
    requestCarryAction(w, {
      type: 'pickup',
      value: 'cat',
      x: carryRackX(w, i, 0)
    });
    walk(w);
    assert.equal(w.x, carryRackX(w, i, 0));
    assert.equal(w.solved, i);
    requestCarryAction(w, {
      type: 'place',
      x: carryStationX(w, i)
    });
    walk(w);
    assert.equal(w.x, carryStationX(w, i));
    assert.equal(w.solved, i);
    w.solved++;
  }
  assert.equal(w.rescued, false);
  walk(w);
  assert.equal(w.rescued, true);
  assert.equal(w.friendX, 6 * 1120 - 265);
});
test('carry snapshot resumes exact position and object but clears held input and travel', () => {
  const w = createCarryWorld('garden', 2, 5);
  w.carry = {
    value: 'b',
    index: 2
  };
  w.input = 1;
  walk(w, 20);
  const r = createCarryWorld('garden', 2, 5, carryWorldSnapshot(w));
  assert.equal(r.x, w.x);
  assert.deepEqual(r.carry, w.carry);
  assert.equal(r.input, 0);
  assert.equal(r.target, null);
});
test('conveyor waits indefinitely, judges only at physical chute and returns same word on error', () => {
  const w = createConveyorWorld('ship');
  for (let i = 0; i < 500; i++) advanceConveyor(w, .05);
  assert.equal(w.phase, 'ready');
  assert.equal(w.word, 'ship');
  assert.equal(w.event, null);
  assert.equal(divertConveyor(w, 'ch', 0), true);
  assert.equal(w.event, null);
  for (let i = 0; i < 17; i++) advanceConveyor(w, .05);
  assert.equal(w.phase, 'judging');
  assert.equal(w.x, 240);
  assert.equal(w.event.bin, 'ch');
  resolveConveyorDelivery(w, false);
  for (let i = 0; i < 17; i++) advanceConveyor(w, .05);
  assert.equal(w.phase, 'ready');
  assert.equal(w.word, 'ship');
  assert.equal(w.x, 500);
  assert.equal(divertConveyor(w, 'sh', 1), true);
  for (let i = 0; i < 17; i++) advanceConveyor(w, .05);
  resolveConveyorDelivery(w, true);
  assert.equal(w.phase, 'accepted');
});
test('manual conveyor cannot judge or move before explicit feed', () => {
  const w = createConveyorWorld('mat', true);
  for (let i = 0; i < 100; i++) advanceConveyor(w, .05);
  assert.equal(w.x, 150);
  assert.equal(w.phase, 'waiting');
  assert.equal(divertConveyor(w, 'm', 0), false);
});
test("garden seed ladder preserves the authored changed slot and source bank order", async () => {
  const {
    gardenSeedChoices
  } = await import("../../src/components/learn/games/games/adventureWorldModel.js");
  const round = {
    sourceWord: "map",
    word: "mat",
    changeIndex: 2,
    bank: ["p", "x", "q", "z", "t", "g"]
  };
  for (const [difficulty, count] of [["easy", 3], ["medium", 4], ["hard", 6]]) {
    const choices = gardenSeedChoices(round, difficulty);
    assert.equal(choices.length, count);
    assert.ok(choices.includes("t"));
    assert.equal(round.sourceWord, "map");
    assert.deepEqual(choices, [...choices].sort((a, b) => round.bank.indexOf(a) - round.bank.indexOf(b)));
  }
});

test('saved adventures are learner/mode/difficulty scoped and only match the parent checkpoint', async () => {
  const { adventureSessionKey, loadAdventureSession, saveAdventureSession } = await import('../../src/components/learn/games/games/adventureWorldModel.js');
  const original = globalThis.localStorage;
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key), setItem: (key,value) => storage.set(key,value), removeItem: key => storage.delete(key) };
  try {
    const key = adventureSessionKey('learner-a','garden','easy');
    saveAdventureSession(key,{index:2,score:32,roundSet:{garden:[{word:'mat'}]}});
    assert.equal(loadAdventureSession(key,2).score,32);
    assert.equal(loadAdventureSession(key,2,false),null);
    assert.equal(loadAdventureSession(key,1),null);
    assert.equal(loadAdventureSession(adventureSessionKey('learner-b','garden','easy'),2),null);
    assert.equal(loadAdventureSession(adventureSessionKey('learner-a','garden','hard'),2),null);
    saveAdventureSession(key,null);
    assert.equal(loadAdventureSession(key,2),null);
  } finally { if (original === undefined) delete globalThis.localStorage; else globalThis.localStorage = original; }
});

// Measure the complete extended trail through the same fixed-step movement
// model; a longer timeout or slower rendering cannot satisfy this assertion.
test('36-bridge rescue remains a multi-minute physical route at full walking speed', () => {
  const w = createCarryWorld('rescue', 0, 36);
  const reach = x => {
    requestCarryAction(w, { type: 'approach', x });
    let frames = 0;
    while (w.target && frames++ < 1000) advanceCarryWorld(w, 1 / 60);
    assert.equal(w.target, null);
  };
  for (let index = 0; index < w.total; index++) {
    w.index = index;
    reach(carryRackX(w, index, index % 3));
    reach(carryStationX(w, index));
    w.solved++;
  }
  while (!w.rescued) advanceCarryWorld(w, 1 / 60);
  assert.ok(w.time >= 120, `Only ${w.time} seconds of actual movement`);
  assert.ok(w.time < 150, 'No slow movement or artificial waiting was introduced');
});

test('the full garden is a multi-minute route without slowing movement', () => {
  const w = createCarryWorld('garden', 0, 26);
  for (let index = 0; index < w.total; index++) {
    for (const x of [carryRackX(w, index, index % 3), carryStationX(w, index)]) {
      requestCarryAction(w, { type: 'approach', x });
      let frames = 0;
      while (w.target && frames++ < 1000) advanceCarryWorld(w, 1 / 60);
      assert.equal(w.target, null);
    }
  }
  assert.ok(w.time >= 130 && w.time < 160, `Normal movement took ${w.time}s`);
});
