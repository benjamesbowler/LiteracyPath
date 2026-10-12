import { loadLearnGamesProgress, saveLearnGamesProgress } from "./learnGamesProgress.js";
import { mergePracticeProgressRecords } from "./practiceCompletionRecords.js";
import { SKILLS_PRACTICE_ID, skillsPracticeRecord } from "./skillsPracticeModel.js";

function checkpointSnapshot(session, previous) {
  // This revision orders saves within a sitting. A new sitting starts its own
  // revision; its identity/start time prevents a late old-device save winning.
  const sameRun = session?.id && session.id === previous?.id;
  return { ...session, checkpointRevision: sameRun && Number.isSafeInteger(previous.checkpointRevision)
    ? previous.checkpointRevision + 1 : 1 };
}

export function loadSkillsPracticeProgress(scopeKey, practiceId = SKILLS_PRACTICE_ID) {
  return skillsPracticeRecord(loadLearnGamesProgress(scopeKey).games[practiceId]);
}

export function saveSkillsPracticeSession(scopeKey, session, practiceId = SKILLS_PRACTICE_ID) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[practiceId] || {};
  const next = { ...previous };
  const previousCheckpoint = previous.checkpoints?.practice;
  const checkpoint = session ? checkpointSnapshot(session, previousCheckpoint)
    : previousCheckpoint?.id ? checkpointSnapshot({ id: previousCheckpoint.id, startedAt: previousCheckpoint.startedAt,
      index: previousCheckpoint.index, cleared: true }, previousCheckpoint) : null;
  next.checkpoints = { ...previous.checkpoints, practice: checkpoint };
  saveLearnGamesProgress(scopeKey, { ...progress, games: { ...progress.games, [practiceId]: next } });
}

export function loadSkillsPracticeSession(scopeKey, practiceId = SKILLS_PRACTICE_ID) {
  const checkpoint = loadLearnGamesProgress(scopeKey).games[practiceId]?.checkpoints?.practice;
  return checkpoint?.cleared ? null : checkpoint || null;
}

export function saveSkillsPracticeEvent(scopeKey, event, session, practiceId = SKILLS_PRACTICE_ID) {
  const progress = loadLearnGamesProgress(scopeKey);
  const previous = progress.games[practiceId] || {};
  const practiceRecord = mergePracticeProgressRecords(previous.practiceRecord, { v: 3, status: "inprogress", completions: [event] });
  saveLearnGamesProgress(scopeKey, {
    ...progress,
    games: { ...progress.games, [practiceId]: { ...previous, practiceRecord,
      ...(session ? { checkpoints: { ...previous.checkpoints,
        practice: checkpointSnapshot(session, previous.checkpoints?.practice) } } : {}) } }
  });
  return practiceRecord;
}
