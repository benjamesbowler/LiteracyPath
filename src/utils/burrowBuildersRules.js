import { getChildWordAsset } from '../data/childAssets.js';
import { getLedaWordAudioPath } from '../data/ledaProductionAudio.js';
import { replayShuffle } from './gameReplay.js';
import { BURROW_BUILDERS_CONTENT_VERSION } from '../data/arcadeContentVersions.js';

export const BURROW_BUILDERS_VERSION = BURROW_BUILDERS_CONTENT_VERSION;
export const BUILD_GRID_SIZE = 11;
export const MAX_BUILD_BLOCKS = 180;
export const BUILD_PARTS = Object.freeze(['wood', 'stone', 'bridge', 'roof', 'window', 'garden', 'gate', 'bed', 'channel', 'dam']);
// Gathering receipts keep their original keys when the visible piles move to
// the island edge, so an existing save never receives those supplies twice.
export const BUILD_SUPPLY_PILES = Object.freeze([
  { x: 1, z: 8, type: 'wood', key: '1:6' },
  { x: 9, z: 6, type: 'stone', key: '8:6' },
  { x: 3, z: 1, type: 'wood', key: '3:2' },
]);
const BLOCK_HEIGHT = { wood: 1, stone: 1, bridge: .18, roof: .6, window: .9, garden: .65, gate: 1, bed: .6, channel: 0, dam: 1 };
const waterCache = new WeakMap();
const FIXED_SCENERY = new Set(['1:2', '8:3', '8:5', '0:3', '10:8']);
export const BUILD_ISLANDS = Object.freeze([
  { id: 'meadow', name: 'Meadow Homes', sky: '#c4e9ee', grass: '#82b84d', soil: '#a37a47', water: '#50bcd0' },
  { id: 'river', name: 'River Workshop', sky: '#bddfed', grass: '#70b583', soil: '#a08364', water: '#409fcd' },
  { id: 'moonwood', name: 'Moonwood Village', sky: '#c2c6e6', grass: '#8c9bba', soil: '#78697f', water: '#746fcd' },
]);

const WORD_BLUEPRINTS = {
  easy: [
    ['hut', ['h', 'u', 't'], 'roof'], ['log', ['l', 'o', 'g'], 'bridge'],
    ['box', ['b', 'o', 'x'], 'wood'], ['pot', ['p', 'o', 't'], 'garden'],
    ['mat', ['m', 'a', 't'], 'window'], ['bed', ['b', 'e', 'd'], 'bed'],
  ],
  medium: [
    ['shed', ['sh', 'e', 'd'], 'roof'], ['shop', ['sh', 'o', 'p'], 'window'],
    ['rock', ['r', 'o', 'ck'], 'stone'], ['duck', ['d', 'u', 'ck'], 'bridge'],
    ['ring', ['r', 'i', 'ng'], 'gate'], ['fish', ['f', 'i', 'sh'], 'garden'],
  ],
};

const SPATIAL_BLUEPRINTS = [
  { id: 'garden-left', instruction: 'Put a garden beside the pond, on its left.', part: 'garden', cells: [{ x: 3, z: 7 }, { x: 7, z: 7 }, { x: 7, z: 2 }], correct: { x: 3, z: 7 }, anchor: 'pond' },
  { id: 'gate-right', instruction: 'Put a gate beside the pond, on its right.', part: 'gate', cells: [{ x: 3, z: 7 }, { x: 7, z: 7 }, { x: 7, z: 2 }], correct: { x: 7, z: 7 }, anchor: 'pond' },
  { id: 'roof-beside', instruction: 'Put a roof beside the small cottage.', part: 'roof', cells: [{ x: 2, z: 2 }, { x: 8, z: 8 }, { x: 3, z: 8 }], correct: { x: 2, z: 2 }, anchor: 'house' },
  { id: 'bed-behind', instruction: 'Put a bed behind the small cottage.', part: 'bed', cells: [{ x: 1, z: 1 }, { x: 2, z: 4 }, { x: 8, z: 8 }], correct: { x: 1, z: 1 }, anchor: 'house' },
  { id: 'stone-between', instruction: 'Put a stone between the two tall trees on the right bank.', part: 'stone', cells: [{ x: 8, z: 4 }, { x: 2, z: 6 }, { x: 8, z: 9 }], correct: { x: 8, z: 4 }, anchor: 'trees' },
  { id: 'bridge-stream', instruction: 'Put a bridge across the stream.', part: 'bridge', cells: [{ x: 5, z: 5 }, { x: 3, z: 5 }, { x: 8, z: 8 }], correct: { x: 5, z: 5 }, anchor: 'stream' },
];

export function buildBurrowMissions(difficulty = 'easy', seed = 0, journeyIndex = 0) {
  const prefix = `${BURROW_BUILDERS_VERSION}:${difficulty}:${seed}:${journeyIndex}`;
  if (difficulty === 'hard') return replayShuffle(SPATIAL_BLUEPRINTS, `${prefix}:deck`).map((item, index) => ({
    ...item, kind: 'reading', roundId: `${prefix}:${index}:${item.id}`, choices: replayShuffle(item.cells, `${prefix}:cells:${index}`),
  }));
  const band = WORD_BLUEPRINTS[difficulty] || WORD_BLUEPRINTS.easy;
  return replayShuffle(band, `${prefix}:deck`).map(([word, chunks, part], index) => {
    const distractors = difficulty === 'medium' ? ['ch', 'th', 's', 'a', 'm', 't', 'n'] : ['m', 'r', 'e', 's', 'n', 'a', 'p'];
    const choices = replayShuffle([...new Set([...chunks, ...distractors])], `${prefix}:tiles:${index}`).slice(0, 9);
    // Every expected unit is retained even when all candidate units exceed nine.
    for (const chunk of chunks) if (!choices.includes(chunk)) choices[choices.findIndex(value => !chunks.includes(value))] = chunk;
    const asset = getChildWordAsset(word) || {};
    return { kind: 'spelling', id: word, roundId: `${prefix}:${index}:${word}`, word, chunks, part,
      choices, image: asset.image || asset.fallbackImage || '', audio: getLedaWordAudioPath(word) };
  });
}

export function terrainAt(x, z, islandId = 'meadow') {
  if (!Number.isInteger(x) || !Number.isInteger(z) || x < 0 || z < 0 || x >= 11 || z >= 11) return null;
  if ((x === 0 || x === 10) && (z < 2 || z > 8)) return null;
  if (x === 5 || ([4, 6].includes(x) && z >= 6 && z <= 8)) return { height: -0.3, water: true };
  return { height: x >= 8 && z <= 3 ? 1 : 0, water: false, islandId, scenery: FIXED_SCENERY.has(`${x}:${z}`) };
}

export function createBurrowWorld(islandId = 'meadow', { starter = false } = {}) {
  // A new island is the child's blank building space. The only starter pieces
  // are an upstream crossing, making both banks reachable without a lesson.
  // Existing saved worlds are loaded directly and never receive this template.
  const blocks = starter ? [4, 5, 6].map(x => ({ type: 'bridge', x, z: 3, y: 0, rotation: 0 })) : [];
  return { islandId, blocks, player: { x: 2, z: 5 }, selection: { x: 3, z: 5 }, selectedPart: 'wood', rotation: 0,
    materials: { wood: 24, stone: 18 }, gathered: [], undo: [], camera: 0 };
}

export function burrowWaterCells(world) {
  if (waterCache.has(world.blocks)) return waterCache.get(world.blocks);
  const channels = new Set(world.blocks.filter(block => block.type === 'channel').map(block => `${block.x}:${block.z}`));
  const dams = new Set(world.blocks.filter(block => block.type === 'dam' && block.y === 0).map(block => `${block.x}:${block.z}`));
  const wet = new Set(), queue = [{ x: 5, z: 0 }];
  while (queue.length) {
    const cell = queue.shift(), key = `${cell.x}:${cell.z}`, base = terrainAt(cell.x, cell.z, world.islandId);
    if (!base || dams.has(key) || wet.has(key) || !(base.water || channels.has(key))) continue;
    wet.add(key);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) queue.push({ x: cell.x + dx, z: cell.z + dz });
  }
  waterCache.set(world.blocks, wet); return wet;
}

export function effectiveBurrowTerrain(world, x, z) {
  const base = terrainAt(x, z, world.islandId); if (!base) return null;
  const cut = base.water || world.blocks.some(block => block.type === 'channel' && block.x === x && block.z === z);
  return { ...base, water: cut && burrowWaterCells(world).has(`${x}:${z}`), height: cut ? -.3 : base.height, dryBed: cut && !burrowWaterCells(world).has(`${x}:${z}`) };
}

export function burrowShelteredBeds(world) {
  return world.blocks.filter(block => block.type === 'bed' && world.blocks.some(roof => roof.type === 'roof' && roof.x === block.x && roof.z === block.z && roof.y > block.y));
}

export function growBurrowGardens(world, seconds) {
  if (!(seconds > 0) || !world.blocks.some(block => block.type === 'garden' && (block.growth || 0) < 1)) return world;
  return { ...world, blocks: world.blocks.map(block => block.type === 'garden' ? { ...block, growth: Math.min(1, (block.growth || 0) + seconds / 12) } : block) };
}

export function walkingHeight(world, x, z) {
  const tile = effectiveBurrowTerrain(world, x, z);
  if (!tile || tile.scenery) return null;
  const blocks = world.blocks.filter(block => block.x === x && block.z === z);
  if (blocks.some(block => block.type === 'gate' && block.rotation % 2 === 0)) return null;
  if (tile.water && !blocks.some(block => ['bridge', 'wood', 'stone', 'dam'].includes(block.type) && block.y === 0)) return null;
  const solids = blocks.filter(block => ['wood', 'stone', 'bridge', 'dam'].includes(block.type));
  return Math.max(tile.water ? 0 : tile.height, ...solids.map(block => block.y + (block.type === 'bridge' ? .18 : 1)));
}

export function moveBurrowPlayer(world, dx, dz) {
  const from = walkingHeight(world, Math.round(world.player.x), Math.round(world.player.z));
  const next = { x: Math.max(0, Math.min(10, world.player.x + dx)), z: Math.max(0, Math.min(10, world.player.z + dz)) };
  const to = walkingHeight(world, Math.round(next.x), Math.round(next.z));
  if (to === null || from === null || Math.abs(to - from) > 1.1) return world;
  return { ...world, player: next };
}

function recoverBuilder(world) {
  if (walkingHeight(world, Math.round(world.player.x), Math.round(world.player.z)) !== null) return world;
  const candidates = [{ x: 2, z: 5 }, { x: 2, z: 4 }, { x: 3, z: 4 }, ...Array.from({ length: 121 }, (_, index) => ({ x: index % 11, z: Math.floor(index / 11) }))];
  const safe = candidates.find(cell => walkingHeight(world, cell.x, cell.z) !== null);
  return safe ? { ...world, player: safe } : null;
}

function withUndo(world, blocks, materials = world.materials) {
  return { ...world, blocks, materials, undo: [...world.undo, { blocks: world.blocks, materials: world.materials }].slice(-16) };
}

export function placeBurrowPart(world, { type = world.selectedPart, x = world.selection.x, z = world.selection.z, y, free = false, kit = false } = {}) {
  const terrain = effectiveBurrowTerrain(world, x, z);
  if (!terrain || terrain.scenery || !BUILD_PARTS.includes(type)) return { world, changed: false, reason: 'Choose a clear island cell beside the house and trees.' };
  const cell = world.blocks.filter(block => block.x === x && block.z === z);
  const gate = cell.find(block => block.type === 'gate');
  if (gate && type === 'gate') {
    const next = recoverBuilder(withUndo(world, world.blocks.map(block => block === gate ? { ...block, rotation: (block.rotation + 1) % 4 } : block)));
    return next ? { world: next, changed: true, gateOpened: gate.rotation % 2 === 0 } : { world, changed: false, reason: 'Leave one safe place to stand.' };
  }
  if (world.blocks.length >= MAX_BUILD_BLOCKS) return { world, changed: false, reason: 'Pick up a piece to make room for a new one.' };
  const base = Math.max(0, terrain.height);
  const level = y ?? (type === 'channel' ? base : cell.length ? Math.max(base, ...cell.map(block => Math.ceil(block.y + BLOCK_HEIGHT[block.type]))) : base);
  if (!Number.isInteger(level) || level < base || level > 4 || cell.some(block => block.y === level)) return { world, changed: false, reason: 'Pick up a piece or choose a lower cell.' };
  if (terrain.water && !['wood', 'stone', 'bridge', 'dam', 'channel'].includes(type)) return { world, changed: false, reason: 'Build a crossing first.' };
  if (type === 'channel' && terrain.height > 0) return { world, changed: false, reason: 'Dig a channel on the low ground.' };
  if (type === 'dam' && (level !== 0 || terrain.height > 0)) return { world, changed: false, reason: 'Put a dam on the low stream bed. Pick up a crossing first.' };
  const material = type === 'stone' ? 'stone' : 'wood';
  if (!free && !kit && world.materials[material] <= 0) return { world, changed: false, reason: 'Walk to a supply pile and pick up more.' };
  const block = { x, z, y: level, type, rotation: world.rotation, ...(type === 'garden' ? { growth: 0 } : {}) };
  let next = withUndo(world, [...world.blocks, block], { ...world.materials, [material]: world.materials[material] - ((!free && !kit) ? 1 : 0) });
  next = recoverBuilder(next);
  if (!next) return { world, changed: false, reason: 'Leave one safe place to stand.' };
  return { world: next, changed: true, block };
}

export function pickupBurrowPart(world) {
  const { x, z } = world.selection;
  const cell = world.blocks.filter(block => block.x === x && block.z === z).sort((a, b) => b.y - a.y);
  if (!cell.length) {
    const pile = BUILD_SUPPLY_PILES.find(p => p.x === x && p.z === z);
    if (pile && Math.hypot(world.player.x - x, world.player.z - z) <= 2 && !world.gathered.includes(pile.key)) return { world: { ...world, gathered: [...world.gathered, pile.key], materials: { ...world.materials, [pile.type]: Math.min(200, world.materials[pile.type] + 12) } }, changed: true, gathered: true };
    return { world, changed: false, reason: pile ? 'Walk closer to the supply pile.' : 'Choose a placed piece or supply pile.' };
  }
  const block = cell[0], blocks = world.blocks.filter(item => item !== block), material = block.type === 'stone' ? 'stone' : 'wood';
  let next = withUndo(world, blocks, { ...world.materials, [material]: Math.min(200, world.materials[material] + 1) });
  next = recoverBuilder(next);
  if (!next) return { world, changed: false, reason: 'Keep one safe place to stand.' };
  return { world: next, changed: true, block };
}

export function undoBurrowEdit(world) {
  if (!world.undo.length) return world;
  const previous = world.undo.at(-1), next = { ...world, ...previous, undo: world.undo.slice(0, -1) };
  return recoverBuilder(next) || world;
}

export function newBurrowEvidence() { return { firstResponses: [], assistedRetries: [], completions: [] }; }

export function commitBurrowResponse(evidence, mission, selected, slot, context = {}) {
  const rows = [...evidence.firstResponses, ...evidence.assistedRetries];
  const prefixBuilt = mission.kind === 'reading' || mission.chunks.slice(0, slot).every((chunk, previousSlot) => rows.some(row => row.roundId === mission.roundId && row.slot === previousSlot && row.correct && row.selected === chunk));
  const valid = prefixBuilt && (mission.kind === 'reading' ? mission.choices.some(cell => cell.x === selected?.x && cell.z === selected?.z) : mission.choices.includes(selected) && Number.isInteger(slot) && slot >= 0 && slot < mission.chunks.length);
  if (!valid) return { evidence, valid: false, correct: false, awarded: 0 };
  const correct = mission.kind === 'reading' ? selected.x === mission.correct.x && selected.z === mission.correct.z : selected === mission.chunks[slot];
  const responseId = `${mission.roundId}:${mission.kind === 'reading' ? 0 : slot}`;
  const first = !evidence.firstResponses.some(row => row.responseId === responseId);
  const supportReasons = [...new Set([...(context.supportReasons || []),
    ...(mission.kind === 'spelling' && context.delivery !== 'delivered' ? ['undelivered-word'] : []),
    ...(mission.kind === 'spelling' && context.pictureDelivery !== 'delivered' ? ['undelivered-picture'] : [])])];
  const response = { responseId, roundId: mission.roundId, slot, selected, correct, expected: mission.kind === 'reading' ? mission.correct : mission.chunks[slot],
    wordVisible: false, construct: mission.kind === 'reading' ? 'literal-spatial-reading-comprehension' : 'ordered-grapheme-encoding',
    deliveryAtResponse: context.delivery || 'pending', stimulusDelivered: context.delivery === 'delivered', pictureDelivery: context.pictureDelivery || 'pending',
    supportReasons, modelUsed: Boolean(context.modelUsed), independentPractice: first && correct && !supportReasons.length && !context.modelUsed, practiceOnly: true };
  const completed = correct && (mission.kind === 'reading' || slot === mission.chunks.length - 1) && !evidence.completions.includes(mission.roundId);
  const retries = first ? [...evidence.assistedRetries] : [...evidence.assistedRetries, { ...response, independentPractice: false }];
  // Retain accepted repaired units while trimming prolonged wrong practice.
  // Otherwise a long retry on the next unit could erase the only proof of an
  // earlier repaired sound and make the word impossible to finish.
  while (retries.length > 216) { const discard = retries.findIndex(row => !row.correct); retries.splice(discard < 0 ? 0 : discard, 1); }
  return { valid: true, correct, first, response, awarded: completed ? 30 : 0,
    evidence: { firstResponses: first ? [...evidence.firstResponses, response] : evidence.firstResponses,
      assistedRetries: retries,
      completions: completed ? [...evidence.completions, mission.roundId] : evidence.completions } };
}

export function installBurrowKit(world, mission) {
  let next = world;
  const clearCells = Array.from({ length: 121 }, (_, index) => ({ x: index % 11, z: Math.floor(index / 11) }))
    .filter(cell => terrainAt(cell.x, cell.z)?.water === false && !terrainAt(cell.x, cell.z)?.scenery && !world.blocks.some(block => block.x === cell.x && block.z === cell.z))
    .sort((a, b) => Math.hypot(a.x - world.selection.x, a.z - world.selection.z) - Math.hypot(b.x - world.selection.x, b.z - world.selection.z));
  if (mission.part === 'bridge') {
    for (const x of [4, 5, 6]) next = placeBurrowPart(next, { type: 'bridge', x, z: 5, y: 0, kit: true }).world;
  } else if (mission.part === 'roof') {
    const origin = clearCells.find(cell => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => terrainAt(cell.x + dx, cell.z + dz)?.water === false && !terrainAt(cell.x + dx, cell.z + dz)?.scenery && terrainAt(cell.x + dx, cell.z + dz).height === terrainAt(cell.x, cell.z).height
      && !world.blocks.some(block => block.x === cell.x + dx && block.z === cell.z + dz)));
    if (origin) {
      const y = terrainAt(origin.x, origin.z).height;
      for (const dx of [0, 1]) next = placeBurrowPart(next, { type: 'wood', x: origin.x + dx, z: origin.z + 1, y, kit: true }).world;
      next = placeBurrowPart(next, { type: 'bed', x: origin.x, z: origin.z, y, kit: true }).world;
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) next = placeBurrowPart(next, { type: 'roof', x: origin.x + dx, z: origin.z + dz, y: y + 1, kit: true }).world;
    }
  } else if (clearCells.length) next = placeBurrowPart(next, { type: mission.part, ...clearCells[0], kit: true }).world;
  return next;
}
