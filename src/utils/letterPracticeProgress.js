import { LETTER_PRACTICE_VERSION, LETTER_PRACTICE_ROUND_COUNT, LETTER_PRACTICE_STEPS_PER_ROUND } from "../policy/letterPractice.js";
import { practiceProgressStatus } from "./practiceCompletionRecords.js";
import { localProgressStorageKey } from "./progressKeys.js";

export function getLetterPracticeProgress(record) {
  const completions = record?.completions || [];
  const rounds = new Set();
  // Older finished lessons retain one round of credit, however often replayed.
  if (practiceProgressStatus(record) === "completed" && (
    typeof record === "string" || record.legacyEvidenceUnknown || !completions.length
    || completions.some(event => event.contentVersion !== LETTER_PRACTICE_VERSION)
  )) rounds.add(1);
  for (const event of completions) {
    if (event.contentVersion !== LETTER_PRACTICE_VERSION || record?.completionConflictIds?.includes(event.id)) continue;
    const round = event.steps?.[0]?.practiceRound;
    if (!Number.isInteger(round) || round < 1 || round > LETTER_PRACTICE_ROUND_COUNT) continue;
    if (event.steps.length === LETTER_PRACTICE_STEPS_PER_ROUND
      && event.steps.every(step => step.practiceRound === round)
      && new Set(event.steps.map(step => step.practiceStep)).size === LETTER_PRACTICE_STEPS_PER_ROUND
      && event.steps.every(step => [1, 2, 3].includes(step.practiceStep))) rounds.add(round);
  }
  const completedRounds = [...rounds].sort((a, b) => a - b);
  const complete = completedRounds.length === LETTER_PRACTICE_ROUND_COUNT;
  return {
    completedRounds, completedCount: completedRounds.length, complete,
    nextRound: Array.from({ length: LETTER_PRACTICE_ROUND_COUNT }, (_, index) => index + 1).find(round => !rounds.has(round)) || 1,
    status: complete ? "completed" : rounds.size || practiceProgressStatus(record) === "inprogress" ? "inprogress" : "default"
  };
}

export function letterPracticeSessionKey(scopeKey) {
  return `${localProgressStorageKey("phonics_letters", scopeKey)}:practice-session-v1`;
}
export function loadLetterPracticeSession(scopeKey, letter) {
  try {
    const value = JSON.parse(localStorage.getItem(letterPracticeSessionKey(scopeKey)) || "{}")[letter];
    return value?.version === LETTER_PRACTICE_VERSION && Number.isInteger(value.round)
      && value.round >= 1 && value.round <= LETTER_PRACTICE_ROUND_COUNT
      && [1, 2, 3].includes(value.step) && Array.isArray(value.evidence)
      && typeof value.seed === "string" ? value : null;
  } catch { return null; }
}
export function saveLetterPracticeSession(scopeKey, letter, session) {
  try {
    const key = letterPracticeSessionKey(scopeKey);
    const all = JSON.parse(localStorage.getItem(key) || "{}");
    if (session) all[letter] = { ...session, version: LETTER_PRACTICE_VERSION };
    else delete all[letter];
    if (Object.keys(all).length) localStorage.setItem(key, JSON.stringify(all));
    else localStorage.removeItem(key);
    return true;
  } catch { return false; }
}
