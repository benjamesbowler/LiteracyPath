import { CYCLE_ACTIVITY_REVISION } from "../../policy/cyclePracticePolicy.js";

/** Old frozen saves remain retryable; unfinished old decks never mix with the replacement. */
export function restoreCyclePracticeSession(saved, fresh) {
  if (!saved) return { ...fresh, activityRevision: CYCLE_ACTIVITY_REVISION };
  if (saved.activityRevision === CYCLE_ACTIVITY_REVISION) return saved;
  if (saved.pendingAttempt || saved.result) return { ...saved, activityRevision: CYCLE_ACTIVITY_REVISION };
  return {
    ...fresh,
    activityRevision: CYCLE_ACTIVITY_REVISION,
    // Learner-created evidence is retained for recovery in the same scoped
    // storage record and removed by the same learner cleanup lifecycle.
    previousContentSession: saved,
  };
}
