import { loadLearnGamesProgress, saveLearnGamesProgress } from "./learnGamesProgress.js";
import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import { SKILLS_PRACTICE_ID, skillsPracticeRecord } from "./skillsPracticeModel.js";

export function loadSkillsPracticeProgress(scopeKey) {
  return skillsPracticeRecord(loadLearnGamesProgress(scopeKey).games[SKILLS_PRACTICE_ID]);
}

export function saveSkillsPracticeSession(scopeKey, session) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[SKILLS_PRACTICE_ID] || {};
  const next = { ...previous };
  if (session) next.checkpoints = { practice: session };
  else delete next.checkpoints;
  saveLearnGamesProgress(scopeKey, { ...progress, games: { ...progress.games, [SKILLS_PRACTICE_ID]: next } });
}

export function loadSkillsPracticeSession(scopeKey) {
  return loadLearnGamesProgress(scopeKey).games[SKILLS_PRACTICE_ID]?.checkpoints?.practice || null;
}

export function saveSkillsPracticeEvent(scopeKey, event, session) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[SKILLS_PRACTICE_ID] || {};
  const practiceRecord = mergePracticeProgressRecords(previous.practiceRecord, { v: 3, status: "inprogress", completions: [event] });
  saveLearnGamesProgress(scopeKey, {
    ...progress,
    games: { ...progress.games, [SKILLS_PRACTICE_ID]: { ...previous, practiceRecord,
      ...(session ? { checkpoints: { practice: session } } : {}) } }
  });
  return practiceRecord;
}
