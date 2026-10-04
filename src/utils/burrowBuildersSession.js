import { loadLearnGamesProgress, saveLearnGamesProgress } from './learnGamesProgress.js';
import { BURROW_BUILDERS_VERSION, BUILD_ISLANDS, BUILD_PARTS, MAX_BUILD_BLOCKS, walkingHeight, terrainAt, buildBurrowMissions } from './burrowBuildersRules.js';

const integer = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
const cell = value => value && integer(value.x, 0, 10) && integer(value.z, 0, 10);
const block = value => {
  if (!cell(value) || !integer(value.y, 0, 4) || !integer(value.rotation, 0, 3) || !BUILD_PARTS.includes(value.type)) return false;
  const terrain = terrainAt(value.x, value.z);
  return terrain && !terrain.scenery && value.y >= Math.max(0, terrain.height)
    && (value.type !== 'channel' || (terrain.height <= 0 && value.y === 0))
    && (value.growth === undefined || (value.type === 'garden' && Number.isFinite(value.growth) && value.growth >= 0 && value.growth <= 1));
};
const blocksValid = values => Array.isArray(values) && values.length <= MAX_BUILD_BLOCKS && values.every(block)
  && new Set(values.map(value => `${value.x}:${value.z}:${value.y}`)).size === values.length;
const materialsValid = value => value && integer(value.wood, 0, 200) && integer(value.stone, 0, 200);

export function validBurrowWorld(world, islandId) {
  return world && world.islandId === islandId && BUILD_ISLANDS.some(island => island.id === islandId)
    && blocksValid(world.blocks) && cell(world.selection) && terrainAt(world.selection.x, world.selection.z, islandId) && BUILD_PARTS.includes(world.selectedPart)
    && integer(world.rotation, 0, 3) && integer(world.camera, 0, 3)
    && world.player && Number.isFinite(world.player.x) && Number.isFinite(world.player.z)
    && world.player.x >= 0 && world.player.x <= 10 && world.player.z >= 0 && world.player.z <= 10
    && walkingHeight(world, Math.round(world.player.x), Math.round(world.player.z)) !== null
    && materialsValid(world.materials) && Array.isArray(world.gathered) && world.gathered.length <= 3
    && world.gathered.every(value => ['1:6', '8:6', '3:2'].includes(value))
    && Array.isArray(world.undo) && world.undo.length <= 16
    && world.undo.every(value => blocksValid(value.blocks) && materialsValid(value.materials));
}

export function validateBurrowSession(value, difficulty, seed, journeyIndex, missions) {
  if (!value || value.version !== BURROW_BUILDERS_VERSION || value.difficulty !== difficulty || value.seed !== seed
    || value.journeyIndex !== journeyIndex || !integer(value.cursor, 0, missions.length - 1)
    || !['ready', 'celebrating', 'creative'].includes(value.phase) || !BUILD_ISLANDS.some(island => island.id === value.islandId)
    || (value.freeBuilding !== undefined && typeof value.freeBuilding !== 'boolean')
    || !value.worlds || Object.keys(value.worlds).length !== BUILD_ISLANDS.length
    || BUILD_ISLANDS.some(island => !value.worlds[island.id])
    || !Object.entries(value.worlds).every(([id, world]) => validBurrowWorld(world, id)) || !value.worlds[value.islandId]
    || !Array.isArray(value.chunks) || value.chunks.length > 5 || !integer(value.mistakes, 0, 999)
    || !Array.isArray(value.supportReasons) || value.supportReasons.length > 20
    || value.supportReasons.some(reason => typeof reason !== 'string' || reason.length > 80)
    || !['pending', 'delivered', 'unavailable'].includes(value.delivery) || !integer(value.score, 0, 180)
    || !value.evidence || !Array.isArray(value.evidence.firstResponses) || value.evidence.firstResponses.length > 30
    || !Array.isArray(value.evidence.assistedRetries) || value.evidence.assistedRetries.length > 216
    || !Array.isArray(value.evidence.completions) || value.evidence.completions.length > missions.length
    || new Set(value.evidence.completions).size !== value.evidence.completions.length
    || value.score !== value.evidence.completions.length * 30) return null;
  const current = missions[value.cursor], byId = new Map(missions.map(mission => [mission.roundId, mission]));
  if (current.kind === 'spelling' && (value.chunks.length > current.chunks.length || value.chunks.some((chunk, index) => chunk !== current.chunks[index]))) return null;
  if (current.kind === 'reading' && value.chunks.length) return null;
  if (value.evidence.completions.some(id => !byId.has(id)) || (value.phase === 'creative' && value.evidence.completions.length !== missions.length)) return null;
  const validResponse = row => {
    const mission = byId.get(row?.roundId);
    if (!mission || !integer(row.slot, 0, mission.kind === 'spelling' ? mission.chunks.length - 1 : 0)
      || row.responseId !== `${mission.roundId}:${row.slot}` || row.practiceOnly !== true || row.wordVisible !== false
      || !Array.isArray(row.supportReasons) || row.supportReasons.length > 20 || !['pending', 'delivered', 'unavailable'].includes(row.deliveryAtResponse)
      || !['pending', 'delivered', 'unavailable'].includes(row.pictureDelivery)) return false;
    const ownsChoice = mission.kind === 'spelling' ? mission.choices.includes(row.selected) : mission.choices.some(position => position.x === row.selected?.x && position.z === row.selected?.z);
    if (!ownsChoice) return false;
    const correct = mission.kind === 'spelling' ? row.selected === mission.chunks[row.slot] : row.selected.x === mission.correct.x && row.selected.z === mission.correct.z;
    if (row.correct !== correct) return false;
    return !row.independentPractice || (correct && !row.supportReasons.length && !row.modelUsed && (mission.kind === 'reading' || (row.deliveryAtResponse === 'delivered' && row.pictureDelivery === 'delivered')));
  };
  if (new Set(value.evidence.firstResponses.map(row => row.responseId)).size !== value.evidence.firstResponses.length
    || !value.evidence.firstResponses.every(validResponse) || !value.evidence.assistedRetries.every(row => validResponse(row) && !row.independentPractice)) return null;
  const accepted = [...value.evidence.firstResponses, ...value.evidence.assistedRetries].filter(row => row.correct);
  const unitBuilt = (mission, slot) => accepted.some(row => row.roundId === mission.roundId && row.slot === slot);
  if (value.evidence.completions.some(id => { const mission = byId.get(id); return mission.kind === 'reading' ? !unitBuilt(mission, 0) : mission.chunks.some((_, slot) => !unitBuilt(mission, slot)); })
    || value.chunks.some((_, slot) => !unitBuilt(current, slot))) return null;
  return value;
}

export function saveBurrowSession(scope, difficulty, state) {
  const current = loadLearnGamesProgress(scope), previous = current.games['burrow-builders'] || {};
  const next = { ...current, games: { ...current.games, 'burrow-builders': { ...previous,
    practiceSession: { ...(previous.practiceSession || {}), [difficulty]: { ...state, version: BURROW_BUILDERS_VERSION, difficulty } },
  } } };
  try { saveLearnGamesProgress(scope, next); return { localSaved: true, syncPending: false }; }
  catch (error) { return { localSaved: Boolean(error.savedProgress), syncPending: Boolean(error.savedProgress) }; }
}

export function loadBurrowSession(scope, difficulty, seed, journeyIndex, missions) {
  return validateBurrowSession(loadLearnGamesProgress(scope).games['burrow-builders']?.practiceSession?.[difficulty], difficulty, seed, journeyIndex, missions);
}

// A new learning seed must not throw away a child's sculpture. Carry only the
// strictly validated bounded world maps; never old answers, support or credit.
export function loadBurrowSavedWorlds(scope, difficulty) {
  const sessions = loadLearnGamesProgress(scope).games['burrow-builders']?.practiceSession || {};
  for (const band of [difficulty, ...['easy', 'medium', 'hard'].filter(value => value !== difficulty)]) {
    const value = sessions[band];
    if (!value || !Number.isSafeInteger(value.seed) || value.seed < 0 || !integer(value.journeyIndex, 0, 11)) continue;
    const valid = validateBurrowSession(value, band, value.seed, value.journeyIndex, buildBurrowMissions(band, value.seed, value.journeyIndex));
    if (valid) return valid.worlds;
  }
  return null;
}
