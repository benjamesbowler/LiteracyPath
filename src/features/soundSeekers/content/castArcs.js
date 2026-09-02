import { SOUND_SEEKERS_CHAPTERS } from "./chapters/index.js";
import { SOUND_SEEKERS_EXPEDITIONS } from "./expeditions.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

const words = value => String(value || "").replaceAll("-", " ");

export const SOUND_SEEKERS_CAST_ARCS = deepFreeze(Object.fromEntries(
  SOUND_SEEKERS_CHAPTERS.map(chapter => {
    const expeditions = SOUND_SEEKERS_EXPEDITIONS.filter(item => item.chapterId === chapter.id);
    const characters = [chapter.cast.guide, ...chapter.cast.residents]
      .map(character => ({
        id: character.name,
        role: character.role,
        archetype: character.archetype
      }));
    const relationshipBeats = expeditions.map((expedition, index) => {
      const earlier = expeditions.slice(0, index);
      const callbackRepairIds = index === 4
        ? [...new Set([earlier.at(-1).payoff.repairId, earlier[0].payoff.repairId])]
        : index > 0 ? [earlier.at(-1).payoff.repairId] : [];
      return {
        id: expedition.payoff.relationshipBeatId,
        chapterId: expedition.chapterId,
        stopId: expedition.stopId,
        residentId: expedition.residentId,
        repairId: expedition.payoff.repairId,
        consequenceId: expedition.payoff.consequenceId,
        callbackRepairIds,
        callbackLines: callbackRepairIds.map(repairId => ({
          repairId,
          text: `We remember ${words(repairId)} and the path it restored.`
        }))
      };
    });
    return [chapter.id, { chapterId: chapter.id, characters, relationshipBeats }];
  })
));

const beatById = new Map(Object.values(SOUND_SEEKERS_CAST_ARCS)
  .flatMap(arc => arc.relationshipBeats).map(beat => [beat.id, beat]));

export function getCastRelationshipBeat(relationshipBeatId) {
  return beatById.get(String(relationshipBeatId || "").trim()) || null;
}
