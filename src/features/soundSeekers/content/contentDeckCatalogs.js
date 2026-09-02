import { CONTENT_DECK_RECORDS } from "./contentDeckRecords.js";
import { SOUND_SEEKERS_HEART_WORDS } from "./heartWords.js";

export const CONTENT_DECK_CATEGORIES = Object.freeze([
  "heartWords", "stories", "alternatives", "morphology", "transfer"
]);

export const SOUND_SEEKERS_CONTENT_DECK_CATALOGS = Object.freeze({
  heartWords: SOUND_SEEKERS_HEART_WORDS,
  stories: CONTENT_DECK_RECORDS.stories,
  alternatives: CONTENT_DECK_RECORDS.alternatives,
  morphology: CONTENT_DECK_RECORDS.morphology,
  transfer: CONTENT_DECK_RECORDS.transfer
});

export function getContentDeckCatalog(category) {
  return SOUND_SEEKERS_CONTENT_DECK_CATALOGS[category] || Object.freeze([]);
}

export function getContentDeckCatalogRecord(category, recordId) {
  return getContentDeckCatalog(category).find(record => record.recordId === recordId) || null;
}
