import { loadLearnGamesProgress, saveLearnGamesProgress } from "./learnGamesProgress.js";
import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import { SKILLS_PRACTICE_ID, skillsPracticeRecord } from "./skillsPracticeModel.js";

export function loadSkillsPracticeProgress(scopeKey, practiceId = SKILLS_PRACTICE_ID) {
  return skillsPracticeRecord(loadLearnGamesProgress(scopeKey).games[practiceId]);
}

export function saveSkillsPracticeSession(scopeKey, session, practiceId = SKILLS_PRACTICE_ID) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[practiceId] || {};
  const next = { ...previous };
  if (session) next.checkpoints = { practice: session };
  else delete next.checkpoints;
  saveLearnGamesProgress(scopeKey, { ...progress, games: { ...progress.games, [practiceId]: next } });
}

export function loadSkillsPracticeSession(scopeKey, practiceId = SKILLS_PRACTICE_ID) {
  return loadLearnGamesProgress(scopeKey).games[practiceId]?.checkpoints?.practice || null;
}

export function saveSkillsPracticeEvent(scopeKey, event, session, practiceId = SKILLS_PRACTICE_ID) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[practiceId] || {};
  const practiceRecord = mergePracticeProgressRecords(previous.practiceRecord, { v: 3, status: "inprogress", completions: [event] });
  saveLearnGamesProgress(scopeKey, {
    ...progress,
    games: { ...progress.games, [practiceId]: { ...previous, practiceRecord,
      ...(session ? { checkpoints: { practice: session } } : {}) } }
  });
  return practiceRecord;
}
