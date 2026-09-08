import { queueProgressSave } from "./progressSync.js";
import { normalizePracticeCompletionEvent, practiceStatusMap, readPracticeProgressRecords, writePracticeProgressRecords } from "./practiceCompletionRecords.js";

const STORAGE_PREFIX = "lp_cvc_progress_";

export function loadCvcProgressRecords(scopeKey) {
  return readPracticeProgressRecords(STORAGE_PREFIX + scopeKey);
}
export function loadCvcProgress(scopeKey) {
  return practiceStatusMap(loadCvcProgressRecords(scopeKey));
}
export function saveCvcProgress(scopeKey, progress) {
  return writePracticeProgressRecords(STORAGE_PREFIX + scopeKey, progress, { area: "cvc", scopeKey, enqueue: queueProgressSave });
}
export function recordCvcCompletion(scopeKey, family, completion) {
  if (!normalizePracticeCompletionEvent(completion)) return { localSaved: false, queued: false, error: "invalid_completion" };
  return saveCvcProgress(scopeKey, { [family]: { v: 3, status: "completed", completions: [completion] } });
}
