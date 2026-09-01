import { QUEST_CHAPTERS } from "../../../../data/questChapters.js";
import { FOSSIL_CANYON_DELTA } from "./fossilCanyon.js";
import { FORGE_SETTLEMENT_DELTA } from "./forgeSettlement.js";
import { GLASS_MARSH_DELTA } from "./glassMarsh.js";
import { LANTERN_FOREST_DELTA } from "./lanternForest.js";
import { RIVER_GARDENS_DELTA } from "./riverGardens.js";
import { SEEDWAKE_MEADOW_DELTA } from "./seedwakeMeadow.js";
import { STAR_REACH_DELTA } from "./starReach.js";
import { STORM_COAST_DELTA } from "./stormCoast.js";

const DELTAS = Object.freeze([
  SEEDWAKE_MEADOW_DELTA,
  RIVER_GARDENS_DELTA,
  FOSSIL_CANYON_DELTA,
  FORGE_SETTLEMENT_DELTA,
  GLASS_MARSH_DELTA,
  STORM_COAST_DELTA,
  LANTERN_FOREST_DELTA,
  STAR_REACH_DELTA
]);
const DELTA_FIELDS = new Set(["id", "stopIds", "repairBeatIds", "wonderId", "bossTransferId", "biomeKitId"]);

function assertDelta(delta) {
  const extraFields = Object.keys(delta).filter(field => !DELTA_FIELDS.has(field));
  if (extraFields.length) throw new Error(`${delta.id}: chapter delta duplicates identity fields: ${extraFields.join(", ")}`);
  if (delta.stopIds.length !== 5 || delta.repairBeatIds.length !== 5) {
    throw new Error(`${delta.id}: chapter delta needs five stops and five repair beats`);
  }
}

if (DELTAS.length !== QUEST_CHAPTERS.length || new Set(DELTAS.map(delta => delta.id)).size !== DELTAS.length) {
  throw new Error("Sound Seekers chapter deltas must join one-to-one with the eight legacy chapters");
}
for (const delta of DELTAS) assertDelta(delta);

const deltaById = new Map(DELTAS.map(delta => [delta.id, delta]));

export const SOUND_SEEKERS_CHAPTERS = Object.freeze(QUEST_CHAPTERS.map(legacy => {
  const delta = deltaById.get(legacy.id);
  if (!delta) throw new Error(`${legacy.id}: missing Sound Seekers v2 chapter delta`);
  if (delta.stopIds.some((stopId, index) => stopId !== legacy.stopIds[index])) {
    throw new Error(`${legacy.id}: v2 chapter delta changed the immutable stop boundary`);
  }
  return Object.freeze({
    ...legacy,
    ...delta,
    stopIds: legacy.stopIds
  });
}));

if (SOUND_SEEKERS_CHAPTERS.some(chapter => !deltaById.has(chapter.id))) {
  throw new Error("Sound Seekers v2 chapter join contains an unknown identity");
}
