// Pure, import-free localStorage key helpers for student progress. Kept separate
// from progressSync.js so they can be unit-tested without the Supabase client.

// Every progress area we sync. Keep in step with localProgressStorageKey.
export const PROGRESS_AREAS = [
  "story_quests", "phonics_letters", "cvc", "learn_games",
  "el_quest", "daily_mission", "profile", "guided_reading"
];

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
  return "";
}

// Every localStorage key that holds progress for one student.
export function localProgressKeysForStudent(studentId) {
  return PROGRESS_AREAS.map(area => localProgressStorageKey(area, studentId)).filter(Boolean);
}
