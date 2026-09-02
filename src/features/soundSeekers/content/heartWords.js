import {
  HEART_WORD_ACTIVITY_TYPES,
  normalizeHeartWordActivityType
} from "../engine/evidenceEligibility.js";
import { HEART_WORD_RECORDS } from "./heartWordRecords.js";
import { getPronunciation } from "./pronunciationLexicon.js";

export { HEART_WORD_ACTIVITY_TYPES };

function freezeRecord(authored) {
  const pronunciation = getPronunciation(authored.pronunciationId);
  if (!pronunciation) throw new Error(`${authored.recordId}: missing pronunciation`);
  const regularParts = [];
  const heartParts = [];
  pronunciation.units.forEach((unit, index) => {
    (unit.role === "irregular" ? heartParts : regularParts).push(index);
  });
  const eligibleActivityTypes = HEART_WORD_ACTIVITY_TYPES.filter(activity =>
    activity !== "heart_part_mapping" || heartParts.length > 0);
  const answerTokensByActivity = {};
  for (const activity of eligibleActivityTypes) {
    if (!normalizeHeartWordActivityType(activity)) throw new Error(`${authored.recordId}: invalid activity`);
    answerTokensByActivity[activity] = activity === "heart_part_mapping"
      ? `hw:${authored.wordId}:heart-part:${heartParts[0]}`
      : `hw:${authored.wordId}:${activity.replaceAll("_", "-")}`;
  }
  return Object.freeze({
    answerTokensByActivity: Object.freeze(answerTokensByActivity),
    category: authored.category,
    contentId: authored.contentId,
    display: authored.display,
    eligibleActivityTypes: Object.freeze(eligibleActivityTypes),
    heartParts: Object.freeze(heartParts),
    introductionSlotId: authored.introductionSlotId,
    introductionStopId: authored.introductionStopId,
    meaningId: pronunciation.meaningId,
    pronunciationId: authored.pronunciationId,
    recordId: authored.recordId,
    regularParts: Object.freeze(regularParts),
    slotIds: authored.slotIds,
    targetId: authored.targetId,
    wordId: authored.wordId
  });
}

export const SOUND_SEEKERS_HEART_WORDS = Object.freeze(HEART_WORD_RECORDS.map(freezeRecord));
