// Pure, import-free localStorage key helpers for student progress. Kept separate
// from progressSync.js so they can be unit-tested without the Supabase client.

// Every progress area we sync. Keep in step with localProgressStorageKey.
export const PROGRESS_AREAS = [
  "story_quests", "phonics_letters", "cvc", "learn_games",
  "el_quest", "daily_mission", "profile", "guided_reading", "hollow",
  "phonics_quest", "transfer_missions"
];

// These surfaces are retired, but their old browser keys remain part of local
// privacy cleanup so removing a learner also removes data made by older builds.
export const RETIRED_PROGRESS_AREAS = ["reading_passport", "cooperative_story_quest"];

export function retiredLocalProgressStorageKey(area, scopeKey) {
  if (area === "reading_passport") return `lp-reading-passport:${scopeKey || "default"}`;
  if (area === "cooperative_story_quest") return `lp-cooperative-story-quest:${scopeKey || "default"}`;
  return "";
}

export function localProgressStorageKey(area, scopeKey) {
  const scope = encodeURIComponent(scopeKey || "default");
  if (area === "story_quests") return `literacyPath.storyQuestProgress.v1.${scope}`;
  if (area === "phonics_letters") return `lp_phonics_progress_${scopeKey || "default"}`;
  if (area === "cvc") return `lp_cvc_progress_${scopeKey || "default"}`;
  if (area === "learn_games") return `literacy-guide-learn-games:${scopeKey || "default"}`;
  if (area === "el_quest") return `lp-el-quest:${scopeKey || "default"}`;
  if (area === "daily_mission") return `lp-daily-mission:${scopeKey || "default"}`;
  if (area === "profile") return `lp-student-profile:${scopeKey || "default"}`;
  if (area === "guided_reading") return `literacyPath.guidedReadingRecords.${scope}`;
  if (area === "hollow") return `lp-hollow:${scopeKey || "default"}`;
  if (area === "phonics_quest") return `lp-quest:${scopeKey || "default"}`;
  if (area === "transfer_missions") return `lp-transfer-missions:${scopeKey || "default"}`;
  return "";
}

// Every localStorage key that holds progress for one student.
export function localProgressKeysForStudent(studentId) {
  return [
    ...PROGRESS_AREAS.map(area => localProgressStorageKey(area, studentId)),
    ...RETIRED_PROGRESS_AREAS.map(area => retiredLocalProgressStorageKey(area, studentId))
  ].filter(Boolean);
}

// Sentinel "tombstone" row a teacher reset leaves in the cloud so every device
// knows to wipe its local copy. It is not a real progress area (maps to no
// storage key), so the normal hydrate loop ignores it.
export const RESET_AREA = "__reset__";

// A device should wipe local progress when the cloud reset timestamp is newer
// than the reset it has already applied (ISO strings compare correctly).
export function shouldApplyReset(cloudResetAt, appliedResetAt) {
  if (!cloudResetAt) return false;
  return !appliedResetAt || cloudResetAt > appliedResetAt;
}
