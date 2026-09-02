import { SOUND_SEEKERS_EXPEDITIONS } from "./expeditions.js";
import { ADVANCED_SCENE_TOKEN_IDS } from "./connectedTextUsage.generated.js";
import {
  MEANING_SUPPORT_RECORDS,
  REQUIRED_ACTION_MEANING_WORD_IDS
} from "./meaningSupportRecords.js";

const derivedActionIds = [...new Set(SOUND_SEEKERS_EXPEDITIONS
  .flatMap(expedition => expedition.phases)
  .filter(phase => ["word_forge", "blend_bridge"].includes(phase.powerId) && phase.wordId)
  .map(phase => phase.wordId))].sort();

if (JSON.stringify(derivedActionIds) !== JSON.stringify(REQUIRED_ACTION_MEANING_WORD_IDS)) {
  throw new Error("Sound Seekers action meaning support snapshot is stale");
}

const requiredIds = [...new Set([
  ...derivedActionIds,
  ...ADVANCED_SCENE_TOKEN_IDS
])].sort();
const authoredIds = MEANING_SUPPORT_RECORDS.map(record => record.wordId).sort();
if (JSON.stringify(requiredIds) !== JSON.stringify(authoredIds)) {
  throw new Error("Sound Seekers meaning support must exactly cover current use");
}

export const SOUND_SEEKERS_MEANING_SUPPORT = MEANING_SUPPORT_RECORDS;
const byWordId = new Map(SOUND_SEEKERS_MEANING_SUPPORT.map(record => [record.wordId, record]));

export function getMeaningSupport(wordId) {
  return byWordId.get(String(wordId || "").trim().toLocaleLowerCase("en-US")) || null;
}
