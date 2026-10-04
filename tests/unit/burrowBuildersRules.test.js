import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildBurrowMissions, createBurrowWorld, walkingHeight, moveBurrowPlayer, placeBurrowPart, pickupBurrowPart,
  undoBurrowEdit, installBurrowKit, newBurrowEvidence, commitBurrowResponse, terrainAt, MAX_BUILD_BLOCKS,
  growBurrowGardens, burrowShelteredBeds, burrowWaterCells, effectiveBurrowTerrain } from '../../src/utils/burrowBuildersRules.js';

for (const difficulty of ['easy', 'medium', 'hard']) test(`${difficulty} supplies six distinct fresh blueprints and stable choices`, () => {
  const missions = buildBurrowMissions(difficulty, 172, 2);
  assert.equal(missions.length, 6); assert.equal(new Set(missions.map(m => m.id)).size, 6);
  assert.deepEqual(missions, buildBurrowMissions(difficulty, 172, 2));
  assert.notDeepEqual(missions.map(m => m.id), buildBurrowMissions(difficulty, 991, 2).map(m => m.id));
  assert.notDeepEqual(missions, buildBurrowMissions(difficulty, 172, 3));
  for (const mission of missions) {
    if (difficulty === 'hard') {
      assert.equal(mission.kind, 'reading'); assert.equal(mission.choices.filter(c => c.x === mission.correct.x && c.z === mission.correct.z).length, 1);
      assert.ok(mission.choices.every(c => terrainAt(c.x, c.z)));
    } else {
      assert.equal(mission.chunks.join(''), mission.word);
      assert.ok(mission.chunks.every(chunk => mission.choices.includes(chunk)));
      assert.ok(mission.choices.some(chunk => !mission.chunks.includes(chunk)));
      assert.ok(fs.existsSync(`public${mission.image}`)); assert.ok(fs.existsSync(`public${mission.audio}`));
      assert.match(mission.audio, /^\/audio\/production\/en-US\//);
    }
  }
});

test('a stream is unwalkable until the child actually constructs a crossing, then dismantling repairs player position', () => {
  let world = { ...createBurrowWorld(), player: { x: 4, z: 5 }, selection: { x: 5, z: 5 } };
  assert.equal(walkingHeight(world, 5, 5), null);
  assert.equal(moveBurrowPlayer(world, 1, 0), world);
  const placed = placeBurrowPart(world, { type: 'bridge' }); assert.equal(placed.changed, true);
  world = moveBurrowPlayer(placed.world, 1, 0); assert.equal(world.player.x, 5);
  const lifted = pickupBurrowPart(world); assert.equal(lifted.changed, true); assert.equal(walkingHeight(lifted.world, 5, 5), null);
  assert.deepEqual(lifted.world.player, { x: 2, z: 5 });
  assert.equal(undoBurrowEdit(lifted.world).blocks.length, 1);
});

test('stacks, rotations, gather radius, capped undo and unlimited free building are physical state, not learning', () => {
  let world = createBurrowWorld(); world.rotation = 3;
  let result = placeBurrowPart(world); assert.equal(result.block.rotation, 3); assert.equal(result.block.y, 0);
  result = placeBurrowPart(result.world); assert.equal(result.block.y, 1); assert.equal(result.world.materials.wood, 22);
  for (let i = 0; i < 20; i++) { const x = i % 4, z = 7 + Math.floor(i / 4) % 3; world = placeBurrowPart({ ...world, selection: { x, z } }, { free: true }).world; }
  assert.ok(world.undo.length <= 16);
  const exhausted = { ...createBurrowWorld(), materials: { wood: 0, stone: 0 } };
  assert.equal(placeBurrowPart(exhausted).changed, false); assert.equal(placeBurrowPart(exhausted, { free: true }).changed, true);
  let supply = { ...createBurrowWorld(), selection: { x: 9, z: 6 } }; assert.equal(pickupBurrowPart(supply).changed, false);
  supply.player = { x: 9, z: 5 }; supply = pickupBurrowPart(supply).world;
  assert.equal(supply.materials.stone, 30); assert.equal(pickupBurrowPart(supply).changed, false);
  assert.deepEqual(supply.gathered, ['8:6'], 'the edge pile retains its original save receipt');
  assert.equal(pickupBurrowPart({ ...supply, materials: { wood: 24, stone: 18 } }).changed, false, 'an old receipt cannot gather the moved supply twice');
  assert.deepEqual(newBurrowEvidence(), { firstResponses: [], assistedRetries: [], completions: [] });
});

test('closed gates affect traversability and Place opens them without manufacturing literacy credit', () => {
  let world = placeBurrowPart(createBurrowWorld(), { type: 'gate', x: 4, z: 5 }).world;
  assert.equal(walkingHeight(world, 4, 5), null);
  const opened = placeBurrowPart(world, { type: 'gate', x: 4, z: 5 });
  assert.equal(opened.gateOpened, true); assert.equal(walkingHeight(opened.world, 4, 5), 0);
  assert.equal(undoBurrowEdit(opened.world).blocks[0].rotation, 0);
  world = { ...opened.world, player: { x: 4, z: 5 } };
  const closed = placeBurrowPart(world, { type: 'gate', x: 4, z: 5 });
  assert.equal(closed.gateOpened, false); assert.equal(walkingHeight(closed.world, 4, 5), null);
  assert.deepEqual(closed.world.player, { x: 2, z: 5 }, 'closing the gate under the guide recovers a safe standing cell');
  let packed = world;
  for (let layer = 0; layer < 5 && packed.blocks.length < MAX_BUILD_BLOCKS; layer++) for (let z = 0; z < 11; z++) for (let x = 0; x < 11; x++) {
    if (x === 4 && z === 5) continue;
    packed = placeBurrowPart(packed, { type: 'wood', x, z, free: true }).world;
  }
  assert.equal(packed.blocks.length, MAX_BUILD_BLOCKS);
  assert.equal(placeBurrowPart(packed, { type: 'gate', x: 4, z: 5 }).changed, true, 'a full island still permits editing its existing gate');
});

test('construction stays finite, rejects water decoration and impossible grid coordinates', () => {
  const world = createBurrowWorld();
  for (const props of [{ x: -1, z: 4 }, { x: 11, z: 4 }, { x: 5, z: 4, type: 'roof' }, { x: 3, z: 4, y: 5 }, { type: 'untrusted-html' }]) assert.equal(placeBurrowPart(world, props).changed, false);
  const max = { ...world, blocks: Array.from({ length: MAX_BUILD_BLOCKS }, (_, i) => ({ x: i % 11, z: Math.floor(i / 11) % 11, y: Math.floor(i / 121), type: 'wood', rotation: 0 })) };
  assert.equal(placeBurrowPart(max, { free: true }).changed, false);
});

test('a wrong grapheme retains the first response and cue delivery cannot repair it retrospectively', () => {
  const mission = buildBurrowMissions('medium', 56)[0], wrong = mission.choices.find(chunk => chunk !== mission.chunks[0]);
  const first = commitBurrowResponse(newBurrowEvidence(), mission, wrong, 0, { delivery: 'pending' });
  assert.equal(first.correct, false); assert.equal(first.awarded, 0); assert.equal(first.response.independentPractice, false);
  const retry = commitBurrowResponse(first.evidence, mission, mission.chunks[0], 0, { delivery: 'delivered', supportReasons: ['contrast-feedback'] });
  assert.equal(retry.correct, true); assert.equal(retry.evidence.firstResponses[0].selected, wrong);
  assert.equal(retry.evidence.firstResponses[0].deliveryAtResponse, 'pending'); assert.equal(retry.evidence.assistedRetries[0].independentPractice, false);
});

test('picture/audio encoding requires both delivered cues; missing or pending pictures freeze supported practice', () => {
  const mission = buildBurrowMissions('easy', 42)[0];
  for (const pictureDelivery of ['pending', 'unavailable']) {
    const result = commitBurrowResponse(newBurrowEvidence(), mission, mission.chunks[0], 0, { delivery: 'delivered', pictureDelivery });
    assert.equal(result.response.correct, true); assert.equal(result.response.independentPractice, false);
    assert.equal(result.response.pictureDelivery, pictureDelivery); assert.ok(result.response.supportReasons.includes('undelivered-picture'));
  }
  const delivered = commitBurrowResponse(newBurrowEvidence(), mission, mission.chunks[0], 0, { delivery: 'delivered', pictureDelivery: 'delivered' });
  assert.equal(delivered.response.independentPractice, true);
});

test('only the final valid grapheme crafts its useful kit, once; movement and invalid choices never award points', () => {
  const mission = buildBurrowMissions('easy', 70).find(m => m.word === 'hut'); let evidence = newBurrowEvidence();
  const invalid = commitBurrowResponse(evidence, mission, 'javascript', 0, { delivery: 'delivered' }); assert.equal(invalid.valid, false);
  for (const [slot, chunk] of mission.chunks.entries()) {
    const result = commitBurrowResponse(evidence, mission, chunk, slot, { delivery: 'delivered' }); evidence = result.evidence;
    assert.equal(result.awarded, slot === mission.chunks.length - 1 ? 30 : 0); assert.equal(result.response.wordVisible, false); assert.equal(result.response.practiceOnly, true);
  }
  assert.equal(evidence.completions.length, 1);
  assert.equal(commitBurrowResponse(evidence, mission, mission.chunks.at(-1), 2, { delivery: 'delivered' }).awarded, 0);
  const world = installBurrowKit(createBurrowWorld(), mission); assert.ok(world.blocks.some(block => block.type === 'roof')); assert.ok(world.blocks.filter(block => block.type === 'wood').length >= 2);
  assert.equal(burrowShelteredBeds(world).length, 1, 'a real dry sleeping place is part of the completed shelter');
});

test('dams drain the downstream pond; connected channels redirect water and undo restores the exact flow', () => {
  let world = createBurrowWorld(); const initialWater = burrowWaterCells(world).size;
  assert.equal(effectiveBurrowTerrain(world, 5, 7).water, true); assert.equal(effectiveBurrowTerrain(world, 4, 5).water, false);
  world = placeBurrowPart(world, { type: 'channel', x: 4, z: 5, free: true }).world;
  assert.equal(effectiveBurrowTerrain(world, 4, 5).water, true); assert.equal(walkingHeight(world, 4, 5), null);
  world = placeBurrowPart(world, { type: 'dam', x: 5, z: 3, free: true }).world;
  assert.ok(burrowWaterCells(world).size < initialWater); assert.equal(effectiveBurrowTerrain(world, 5, 7).dryBed, true);
  assert.equal(effectiveBurrowTerrain(world, 4, 5).water, false); assert.notEqual(walkingHeight(world, 4, 5), null);
  world = undoBurrowEdit(world); assert.equal(effectiveBurrowTerrain(world, 4, 5).water, true); assert.equal(effectiveBurrowTerrain(world, 5, 7).water, true);
});

test('gardens grow in foreground simulation, roofs protect beds, and the physical effects never issue learning credit', () => {
  let world = placeBurrowPart(createBurrowWorld(), { type: 'garden', x: 3, z: 5, free: true }).world;
  assert.equal(world.blocks[0].growth, 0); world = growBurrowGardens(world, 6); assert.equal(world.blocks[0].growth, .5);
  world = growBurrowGardens(world, 600); assert.equal(world.blocks[0].growth, 1); assert.equal(growBurrowGardens(world, 1), world);
  world = placeBurrowPart(world, { type: 'bed', x: 2, z: 4, free: true }).world; assert.equal(burrowShelteredBeds(world).length, 0);
  const roof = placeBurrowPart(world, { type: 'roof', x: 2, z: 4, free: true }); assert.equal(roof.block.y, 1); world = roof.world;
  assert.equal(burrowShelteredBeds(world).length, 1); assert.equal(burrowShelteredBeds(undoBurrowEdit(world)).length, 0);
  assert.equal(newBurrowEvidence().completions.length, 0);
});

test('ordered encoding cannot skip prior sounds, and prolonged retries retain an accepted repaired prefix', () => {
  const mission = buildBurrowMissions('easy', 18)[0]; let evidence = newBurrowEvidence();
  assert.equal(commitBurrowResponse(evidence, mission, mission.chunks[2], 2, { delivery: 'delivered' }).valid, false);
  const wrong = mission.choices.find(value => value !== mission.chunks[0]); evidence = commitBurrowResponse(evidence, mission, wrong, 0).evidence;
  evidence = commitBurrowResponse(evidence, mission, mission.chunks[0], 0, { delivery: 'delivered', supportReasons: ['contrast-feedback'] }).evidence;
  for (let i = 0; i < 300; i++) evidence = commitBurrowResponse(evidence, mission, mission.choices.find(value => value !== mission.chunks[1]), 1).evidence;
  assert.equal(evidence.assistedRetries.length, 216); assert.ok(evidence.assistedRetries.some(row => row.slot === 0 && row.correct));
  evidence = commitBurrowResponse(evidence, mission, mission.chunks[1], 1).evidence;
  assert.equal(commitBurrowResponse(evidence, mission, mission.chunks[2], 2).awarded, 30);
});

test('each hard reading instruction commits a spatial construction choice with an unambiguous correct location', () => {
  const mission = buildBurrowMissions('hard', 80)[0], evidence = newBurrowEvidence();
  const wrong = mission.choices.find(c => c.x !== mission.correct.x || c.z !== mission.correct.z);
  assert.equal(commitBurrowResponse(evidence, mission, wrong, 0).correct, false);
  const correct = commitBurrowResponse(evidence, mission, mission.correct, 0);
  assert.equal(correct.correct, true); assert.equal(correct.awarded, 30); assert.equal(correct.response.construct, 'literal-spatial-reading-comprehension');
  assert.equal(correct.response.independentPractice, true); assert.equal(correct.response.stimulusDelivered, false);
});

test('fresh islands have a broad empty clearing and only a removable crossing with untouched learning and materials', () => {
  const world = createBurrowWorld('river', { starter: true }), count = world.blocks.length;
  assert.equal(count, 3); assert.ok(world.blocks.every(block => block.type === 'bridge' && block.z === 3)); assert.equal(world.undo.length, 0);
  assert.deepEqual(world.materials, { wood: 24, stone: 18 }); assert.equal(walkingHeight(world, 5, 3), .18);
  assert.equal(walkingHeight(world, 5, 5), null); assert.equal(burrowShelteredBeds(world).length, 0);
  for (const x of [1, 2, 3, 4, 7, 8, 9]) for (const z of [6, 7, 8, 9]) if (!terrainAt(x,z)?.water) assert.equal(walkingHeight(world,x,z), 0, 'both low banks remain open building space');
  const removed = pickupBurrowPart({ ...world, selection: { x: 5, z: 3 } }); assert.equal(removed.changed, true);
  assert.equal(walkingHeight(removed.world, 5, 3), null); assert.equal(undoBurrowEdit(removed.world).blocks.length, count);
  assert.deepEqual(newBurrowEvidence(), { firstResponses: [], assistedRetries: [], completions: [] });
});

test('a barrier above a crossing cannot divert shallow water; a dam must reach the stream bed', () => {
  const world = createBurrowWorld('meadow', { starter: true }), wet = burrowWaterCells(world).size;
  assert.equal(placeBurrowPart(world, { type: 'dam', x: 5, z: 3, free: true }).changed, false);
  const above = { ...world, blocks: [...world.blocks, { x: 5, z: 3, y: 1, rotation: 0, type: 'dam' }] };
  assert.equal(burrowWaterCells(above).size, wet);
  const floor = placeBurrowPart(world, { type: 'dam', x: 5, z: 2, free: true }); assert.equal(floor.changed, true);
  assert.ok(burrowWaterCells(floor.world).size < wet); assert.equal(burrowWaterCells(undoBurrowEdit(floor.world)).size, wet);
});

test('literal spatial reading remains a textual construct when image and word audio are unused', () => {
  const mission = buildBurrowMissions('hard', 54, 0)[0];
  const result = commitBurrowResponse(newBurrowEvidence(), mission, mission.correct, 0, { delivery: 'pending', pictureDelivery: 'pending' });
  assert.equal(result.correct, true); assert.equal(result.evidence.firstResponses[0].construct, 'literal-spatial-reading-comprehension');
  assert.equal(result.evidence.firstResponses[0].independentPractice, true); assert.equal(result.evidence.firstResponses[0].stimulusDelivered, false);
  assert.deepEqual(result.evidence.firstResponses[0].supportReasons, []);
});
