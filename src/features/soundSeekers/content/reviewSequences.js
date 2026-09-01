import { QUEST_STOPS } from "../../../data/questSequence.js";

const REVIEW_WINDOWS = Object.freeze([
  Object.freeze({ stopId: "s8", afterStopIndex: 0 }),
  Object.freeze({ stopId: "s17", afterStopIndex: 8 })
]);

function buildReviewSequence({ stopId, afterStopIndex }) {
  const reviewStop = QUEST_STOPS.find(stop => stop.id === stopId);
  if (!reviewStop) throw new Error(`${stopId}: review stop does not exist`);
  if (reviewStop.teach.length !== 0) throw new Error(`${stopId}: review stop cannot introduce targets`);

  const sourceStops = QUEST_STOPS.filter(stop => (
    stop.index > afterStopIndex && stop.index < reviewStop.index
  ));
  const targetIds = sourceStops.flatMap(stop => stop.teach.map(target => target.id));
  const taughtBefore = new Set(QUEST_STOPS
    .filter(stop => stop.index < reviewStop.index)
    .flatMap(stop => stop.teach.map(target => target.id)));

  if (targetIds.length === 0) throw new Error(`${stopId}: review sequence cannot be empty`);
  if (new Set(targetIds).size !== targetIds.length) throw new Error(`${stopId}: review targets must be unique`);
  for (const targetId of targetIds) {
    if (!taughtBefore.has(targetId)) throw new Error(`${stopId}:${targetId} was not taught before review`);
  }

  return Object.freeze({
    stopId,
    sourceStopIds: Object.freeze(sourceStops.map(stop => stop.id)),
    targetIds: Object.freeze(targetIds)
  });
}

export const SOUND_SEEKERS_REVIEW_SEQUENCES = Object.freeze(Object.fromEntries(
  REVIEW_WINDOWS.map(window => {
    const sequence = buildReviewSequence(window);
    return [sequence.stopId, sequence];
  })
));

export function getReviewSequence(stopId) {
  return SOUND_SEEKERS_REVIEW_SEQUENCES[String(stopId || "").trim()] || null;
}
