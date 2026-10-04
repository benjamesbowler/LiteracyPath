import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBurrowMissions, createBurrowWorld, newBurrowEvidence, commitBurrowResponse, placeBurrowPart, BURROW_BUILDERS_VERSION } from '../../src/utils/burrowBuildersRules.js';
import { validateBurrowSession, saveBurrowSession, loadBurrowSession, loadBurrowSavedWorlds } from '../../src/utils/burrowBuildersSession.js';

function sample() {
  const missions = buildBurrowMissions('easy', 18, 1), answer = commitBurrowResponse(newBurrowEvidence(), missions[0], missions[0].chunks[0], 0, { delivery: 'delivered' });
  const world = placeBurrowPart(createBurrowWorld(), { x: 3, z: 5 }).world;
  return { version: BURROW_BUILDERS_VERSION, difficulty: 'easy', seed: 18, journeyIndex: 1, cursor: 0, phase: 'ready', islandId: 'meadow', worlds: { meadow: world, river: createBurrowWorld('river'), moonwood: createBurrowWorld('moonwood') },
    chunks: [missions[0].chunks[0]], mistakes: 0, supportReasons: [], delivery: 'delivered', score: 0, evidence: answer.evidence };
}

test('same learner, difficulty, seed and outing restores arbitrary editable world and held sound slots', () => {
  const previous = globalThis.window, map = new Map(); globalThis.window = { localStorage: { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) } };
  try {
    const value = sample(), missions = buildBurrowMissions('easy', 18, 1);
    assert.equal(saveBurrowSession('builder-a', 'easy', value).localSaved, true);
    const restored = loadBurrowSession('builder-a', 'easy', 18, 1, missions);
    assert.equal(restored.worlds.meadow.blocks.length, 1); assert.deepEqual(restored.chunks, value.chunks); assert.equal(restored.worlds.meadow.undo.length, 1);
    assert.equal(loadBurrowSavedWorlds('builder-a', 'medium').meadow.blocks.length, 1, 'fresh difficulty retains art, without copying answers');
    assert.equal(loadBurrowSavedWorlds('builder-b', 'easy'), null);
    for (const [scope, difficulty, seed, journey] of [['builder-b', 'easy', 18, 1], ['builder-a', 'medium', 18, 1], ['builder-a', 'easy', 19, 1], ['builder-a', 'easy', 18, 2]]) assert.equal(loadBurrowSession(scope, difficulty, seed, journey, missions), null);
    assert.equal([...map.keys()].filter(key => key.startsWith('literacy-guide-learn-games:')).length, 1, 'world uses existing scoped progress record');
  } finally { globalThis.window = previous; }
});

test('the fresh clearing never replaces an existing prefab-size build, held answer or supply receipts', () => {
  const previous = globalThis.window, map = new Map(); globalThis.window = { localStorage: { getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) } };
  try {
    const value = sample(), world = value.worlds.meadow;
    world.blocks = [];
    for (const x of [7,8,9]) for (const z of [6,7,8,9]) for (const y of [0,1]) world.blocks.push({ x,z,y,type:y ? 'wood' : 'stone',rotation:0 });
    for (const x of [7,8,9]) for (const z of [6,7]) world.blocks.push({ x,z,y:2,type:'roof',rotation:0 });
    world.blocks.push({ x:3,z:5,y:0,type:'garden',rotation:0,growth:.7 },{ x:3,z:6,y:0,type:'bed',rotation:0 });
    world.gathered = ['1:6','8:6']; assert.equal(world.blocks.length,32);
    assert.equal(saveBurrowSession('builder-existing','easy',value).localSaved,true);
    const restored=loadBurrowSession('builder-existing','easy',18,1,buildBurrowMissions('easy',18,1));
    assert.deepEqual(restored.worlds.meadow,world); assert.deepEqual(restored.chunks,value.chunks); assert.deepEqual(restored.evidence,value.evidence);
    assert.deepEqual(loadBurrowSavedWorlds('builder-existing','easy').meadow,world);
    assert.equal(createBurrowWorld('meadow',{starter:true}).blocks.length,3);
  } finally { globalThis.window=previous; }
});

test('malformed structures, oversized evidence, counterfeit independent credit and stale content fail closed', () => {
  const missions = buildBurrowMissions('easy', 18, 1); assert.ok(validateBurrowSession(sample(), 'easy', 18, 1, missions));
  const mutate = fn => { const value = sample(); fn(value); assert.equal(validateBurrowSession(value, 'easy', 18, 1, missions), null); };
  mutate(value => { value.version = 'old'; }); mutate(value => { value.worlds.meadow.blocks[0].x = 99; });
  mutate(value => { delete value.worlds.river; }); mutate(value => { value.worlds.meadow.blocks[0].x = 0; value.worlds.meadow.blocks[0].z = 0; });
  mutate(value => { value.worlds.meadow.blocks[0].x = 8; value.worlds.meadow.blocks[0].z = 2; });
  mutate(value => { value.worlds.meadow.blocks.push({ ...value.worlds.meadow.blocks[0] }); });
  mutate(value => { value.worlds.meadow.player.x = NaN; }); mutate(value => { value.worlds.meadow.player = { x: 5, z: 5 }; });
  mutate(value => { value.worlds.meadow.undo = Array(17).fill(value.worlds.meadow.undo[0]); });
  mutate(value => { value.worlds.meadow.selectedPart = 'external-command'; }); mutate(value => { value.chunks = ['wrong']; });
  mutate(value => { value.evidence.firstResponses[0].supportReasons = ['hint']; value.evidence.firstResponses[0].independentPractice = true; });
  mutate(value => { value.evidence.firstResponses[0].correct = false; }); mutate(value => { value.score = 30; });
  mutate(value => { value.phase = 'creative'; });
});

test('storage failure retains recovery and reports the actual local outcome', () => {
  const previous = globalThis.window; globalThis.window = { localStorage: { getItem: () => null, setItem: () => { throw new Error('quota'); } } };
  try { assert.equal(saveBurrowSession('builder-a', 'easy', sample()).localSaved, false); }
  finally { globalThis.window = previous; }
});

test('creative completion retains the island, undo and evidence without issuing another learning response', () => {
  const value = sample(), missions = buildBurrowMissions('easy', 18, 1); let evidence = newBurrowEvidence();
  for (const mission of missions) for (const [slot, chunk] of mission.chunks.entries()) evidence = commitBurrowResponse(evidence, mission, chunk, slot, { delivery: 'delivered' }).evidence;
  Object.assign(value, { phase: 'creative', cursor: 5, chunks: missions[5].chunks, evidence, score: 180 });
  assert.ok(validateBurrowSession(value, 'easy', 18, 1, missions)); assert.equal(value.worlds.meadow.blocks.length, 1);
});
