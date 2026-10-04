import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import * as THREE from 'three';
import { createBouncyFigure, createMeadowTree, createPalFigure, animatePalFigure, createWorldTree } from '../../src/components/learn/games/shared/physicalArcadeWorld.js';
import { physicalThemeForDifficulty } from '../../src/components/learn/games/shared/physicalArcadeThemes.js';
import { disposeObject } from '../../src/components/learn/games/shared/threeShell.js';
import { GAME_LIST, gameMenuGroup } from '../../src/data/learnGamesData.js';
import { ARCADE_JOURNEYS, arcadeJourneyChapter } from '../../src/utils/arcadeJourneys.js';
import { ARCADE_VERTICAL_SLICE_BRIEFS } from '../../src/components/learn/games/shared/arcadeVerticalSliceBriefs.js';
import { ARCADE_PREMIUM_PROFILES } from '../../src/components/learn/games/shared/arcadePremiumProfiles.js';
import { validateArcadeRendererRegistry, validateGameVerticalSliceBrief } from '../../src/components/learn/games/shared/premiumGameStandard.js';
import { BLENDER_WORLD_ASSETS } from '../../src/components/learn/games/shared/arcadeBlenderWorlds.js';
import { applyCheckpoint } from '../../src/utils/gameCheckpoints.js';
import { readPlayerCheckpoint } from '../../src/components/learn/games/arcadeLearningContext.js';
import { sanitizeCloudProgressPayload, computeHydratedValue } from '../../src/utils/progressMerge.js';
import { saveLearnGameResult } from '../../src/utils/learnGamesProgress.js';
import { clearProgressSyncSession, configureProgressSync } from '../../src/utils/progressSync.js';
import { getGameMusicTrack } from '../../src/utils/audio/gameMusic.js';

const IDS = ['tower-tumble', 'rally-pals', 'burrow-builders'];

test('difficulty retains the shared three-world authority with distinct canonical playable casts and foliage', () => {
  const names = [], treeSignatures = [];
  for (const [difficulty, id, name] of [['easy','meadow','Bouncy'],['medium','dino','Chompy'],['hard','moonwood','Pip']]) {
    const theme = physicalThemeForDifficulty(difficulty); assert.equal(theme.id, id); assert.equal(theme.hero, name);
    assert.ok(existsSync(`public${theme.reference}`));
    const hero = createPalFigure(THREE, { world: id }), tree = createWorldTree(THREE, { world: id });
    assert.equal(hero.name, name); names.push(hero.userData.characterId);
    animatePalFigure(hero, 1, true); animatePalFigure(hero, 0, false);
    assert.equal(hero.userData.rig.body.position.y, hero.userData.rig.restBodyY);
    const shapes = [];
    tree.traverse(node => { if (node.geometry) shapes.push(node.geometry.type); }); treeSignatures.push(JSON.stringify(shapes));
    hero.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(hero);
    assert.ok(bounds.max.y > 2 && bounds.max.y < 2.5); assert.ok(bounds.min.y >= -.04);
    disposeObject(hero); disposeObject(tree);
  }
  assert.equal(new Set(names).size, 3); assert.equal(new Set(treeSignatures).size, 3);
});

test('shared original geometry batches curls and leaves without losing the animated rig and releases owned GPU resources once', () => {
  const hero = createBouncyFigure(THREE), tree = createMeadowTree(THREE);
  const scene = new THREE.Group(); scene.add(hero, tree);
  assert.ok(hero.userData.rig.rightArm && hero.userData.rig.leftLeg);
  let heroMeshes = 0, instances = 0;
  hero.traverse(node => { if (node.isMesh) heroMeshes += 1; if (node.isInstancedMesh) instances += node.count; });
  assert.ok(heroMeshes < 40, `hero uses ${heroMeshes} draws instead of separate curls`);
  assert.equal(instances, 45);
  const resources = new Set(), instanceMeshes = [];
  scene.traverse(node => {
    if (node.geometry) resources.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) resources.add(material);
    if (node.isInstancedMesh) instanceMeshes.push(node);
  });
  const disposed = new Map();
  for (const resource of [...resources, ...instanceMeshes]) resource.addEventListener('dispose', () => disposed.set(resource, (disposed.get(resource) || 0) + 1));
  disposeObject(scene);
  for (const resource of [...resources, ...instanceMeshes]) assert.equal(disposed.get(resource), 1);
});

test('three physical games extend the open catalogue while regrouping preserves original eligibility and journeys', () => {
  assert.equal(GAME_LIST.length, 27); assert.equal(new Set(GAME_LIST.map(game => game.id)).size, 27);
  assert.equal(GAME_LIST.filter(game => gameMenuGroup(game) === 'arcade').length, 16);
  assert.equal(GAME_LIST.filter(game => gameMenuGroup(game) === 'phonics').length, 11);
  for (const id of ['drum-trail', 'lantern-lagoon']) {
    const game = GAME_LIST.find(game => game.id === id);
    assert.equal(gameMenuGroup(game), 'phonics'); assert.ok(game.surfaces.includes('arcade')); assert.equal(ARCADE_JOURNEYS[id].chapterCount, 12);
  }
  assert.equal(Object.keys(ARCADE_JOURNEYS).length, 18);
  const registry = readFileSync('src/components/learn/games/games/index.js', 'utf8');
  for (const id of IDS) {
    const game = GAME_LIST.find(game => game.id === id);
    assert.ok(game && !game.hidden && game.fullBleed); assert.equal(game.renderer, 'three-physical-world');
    assert.ok(existsSync(game.engineModule)); assert.ok(existsSync(game.assetManifest));
    assert.ok(registry.includes(`"${id}"`));
    assert.equal(ARCADE_PREMIUM_PROFILES[id].version, '1.0');
    const brief = ARCADE_VERTICAL_SLICE_BRIEFS[id];
    assert.deepEqual(validateGameVerticalSliceBrief(brief), [], id);
    assert.equal(brief.learning.movementCreatesEvidence, false);
    assert.ok(brief.prompt.visible.includes('never printed'));
    for (let chapter = 0; chapter < 12; chapter += 1) assert.equal(arcadeJourneyChapter(id, chapter).index, chapter);
  }
  assert.deepEqual(validateArcadeRendererRegistry(GAME_LIST, [...Object.keys(BLENDER_WORLD_ASSETS), 'sound-racer', 'rocket-run']), []);
  assert.ok(validateArcadeRendererRegistry([{ id: 'bad', surfaces: ['arcade'], renderer: 'three-physical-world' }], []).some(issue => issue.includes('source manifest')));
});

test('all three menu pictures decode, match source hashes and share the complete menu dimensions', async () => {
  const manifest = JSON.parse(readFileSync('public/images/learn-games/menu/manifest.json', 'utf8'));
  assert.equal(manifest.assets.length, 27);
  for (const id of IDS) {
    const item = manifest.assets.find(asset => asset.id === id); assert.ok(item);
    const bytes = readFileSync(`public/images/learn-games/menu/${item.file}`);
    assert.equal(bytes.length, item.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    assert.equal(createHash('sha256').update(readFileSync(item.source)).digest('hex'), item.sourceSha256);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, manifest.width); assert.equal(metadata.height, manifest.height); assert.equal(metadata.format, 'webp');
    await sharp(bytes).raw().toBuffer();
    const music = getGameMusicTrack(id); assert.ok(music.volume <= .22); assert.ok(music.sources.length >= 2);
    for (const audio of music.sources) assert.ok(existsSync(`public${audio}`));
  }
});

test('held first tasks retain the seed, outing and response support at zero without changing older engines', () => {
  for (const id of IDS) {
    const games = applyCheckpoint({}, id, 'easy', 0, 9, 777, 3);
    assert.deepEqual(readPlayerCheckpoint(games, id, 'easy'), { level: 0, totalLevels: 9, sessionSeed: 777, chapter: 3 });
    assert.equal(readPlayerCheckpoint(games, id, 'medium'), null);
    const invalid = structuredClone(games); invalid[id].checkpoints.easy.level = 9;
    assert.equal(readPlayerCheckpoint(invalid, id, 'easy'), null);
  }
  assert.equal(readPlayerCheckpoint(applyCheckpoint({}, 'rocket-run', 'easy', 0, 9, 777, 3), 'rocket-run', 'easy'), null);
});

test('mutable physical world and retry support stay local while immutable completion survives scoped sync', t => {
  const values = new Map(), previousWindow = globalThis.window;
  const storage = { get length() { return values.size; }, key: index => [...values.keys()][index] ?? null,
    getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const window = new EventTarget(); Object.assign(window, { localStorage: storage, setTimeout: () => 1, clearTimeout() {} }); globalThis.window = window;
  t.after(() => { clearProgressSyncSession(); globalThis.window = previousWindow; });
  configureProgressSync({ mode: 'student', studentId: 'physical-arcade-unit', token: 'unit-only', client: { call: async () => ({ data: { ok: true } }) } });
  for (const id of IDS) {
    const localMap = { seed: 777, supportReasons: ['partial-hint'], blocks: [{ x: 2, y: 0, z: 2, type: 'wood', rotation: 0 }], undo: ['local-only'] };
    const payload = { games: { [id]: { practiceSession: { easy: localMap } } } };
    const cloud = sanitizeCloudProgressPayload('learn_games', payload);
    assert.equal(cloud.games[id].practiceSession, undefined);
    const incoming = { games: { [id]: { practiceSession: { easy: { seed: 42, blocks: [] } } } } };
    assert.deepEqual(computeHydratedValue('learn_games', '__all__', payload, incoming).games[id].practiceSession.easy, localMap);
    storage.setItem('literacy-guide-learn-games:physical-arcade-unit', JSON.stringify(payload));
    const first = { responseId: 'first', correct: false, wordVisible: false, supportReasons: [], practiceOnly: true };
    const retry = { responseId: 'first', correct: true, wordVisible: false, supportReasons: ['partial-hint'], practiceOnly: true };
    const saved = saveLearnGameResult('physical-arcade-unit', id, 3, 90, 9, {
      contentVersion: `${id}-v1`, sessionSeed: 777, journeyIndex: 3, firstResponses: [first], assistedRetries: [retry]
    }, 'easy', 3);
    const completion = saved.games[id].practiceRecord.completions[0];
    assert.equal(completion.contentVersion, `${id}-v1`); assert.equal(completion.practiceContext.motorCreatesEvidence, false);
    assert.equal(completion.practiceContext.masteryClaim, false); assert.deepEqual(completion.steps, [first]); assert.deepEqual(completion.assistedRetries, [retry]);
    assert.deepEqual(saved.games[id].practiceSession.easy, localMap);
    assert.deepEqual(saved.games[id].journeys.easy.completed, [3]);
    const sanitized = sanitizeCloudProgressPayload('learn_games', saved);
    assert.equal(sanitized.games[id].practiceSession, undefined); assert.deepEqual(sanitized.games[id].practiceRecord.completions[0], completion);
  }
});
