import { queueProgressSave } from "./progressSync.js";
import { normalizePracticeCompletionEvent, practiceProgressStatus, practiceStatusMap, readPracticeProgressRecords, writePracticeProgressRecords } from "./practiceCompletionRecords.js";

const STORAGE_PREFIX = "lp_phonics_progress_";

export const normalizePhonicsProgressStatus = practiceProgressStatus;

export function loadPhonicsProgressRecords(scopeKey) {
  return readPracticeProgressRecords(STORAGE_PREFIX + scopeKey);
}
export function loadPhonicsProgress(scopeKey) {
  return practiceStatusMap(loadPhonicsProgressRecords(scopeKey));
}
export function savePhonicsProgress(scopeKey, progress) {
  return writePracticeProgressRecords(STORAGE_PREFIX + scopeKey, progress, { area: "phonics_letters", scopeKey, enqueue: queueProgressSave });
}
export function recordPhonicsCompletion(scopeKey, letter, completion) {
  if (!normalizePracticeCompletionEvent(completion)) return { localSaved: false, queued: false, error: "invalid_completion" };
  return savePhonicsProgress(scopeKey, { [letter]: { v: 3, status: "completed", completions: [completion] } });
}
