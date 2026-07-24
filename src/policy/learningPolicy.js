/**
 * Canonical learning-policy owner.
 *
 * A4.1/A4.2 will extend this module with the product-wide evidence thresholds.
 * A2.1 starts the policy boundary here so the student-home recommendation is
 * deterministic, versioned, and testable instead of being implied by card
 * order or visual emphasis.
 */
export const LEARNING_POLICY_VERSION = "2026.07.24";

export const STUDENT_HOME_RECOMMENDATION_POLICY = Object.freeze({
  id: "student-home-next-activity",
  version: LEARNING_POLICY_VERSION,
  dailyMissionOrder: Object.freeze(["quest", "book", "game"]),
  fallbackActivityOrder: Object.freeze([
    "sound-seekers",
    "phonics-learning",
    "adventure-map",
    "reading-library",
    "story-quests",
    "arcade",
    "my-hollow"
  ])
});

function assertUniqueActivities(activities) {
  const seen = new Set();
  for (const activity of activities) {
    const id = String(activity?.id || "").trim();
    if (!id) throw new Error("Every student-home activity requires an id.");
    if (seen.has(id)) throw new Error(`Duplicate student-home activity id: ${id}`);
    seen.add(id);
  }
}

function orderByPolicy(activities, ids) {
  const rank = new Map(ids.map((id, index) => [id, index]));
  return [...activities].sort((left, right) => {
    const leftRank = rank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = rank.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}

/**
 * Partition available student-home activities into one primary, at most two
 * secondary choices, and the remaining exploration choices.
 *
 * Daily mission work wins while a step is incomplete. Once the mission is
 * complete (or its activity is unavailable), the stable fallback order keeps
 * the decision predictable across devices.
 */
export function selectStudentHomeRecommendation({
  activities = [],
  missionStatus = {}
} = {}) {
  assertUniqueActivities(activities);
  const available = activities.filter(activity => activity.available !== false);
  if (!available.length) {
    return {
      policyId: STUDENT_HOME_RECOMMENDATION_POLICY.id,
      policyVersion: STUDENT_HOME_RECOMMENDATION_POLICY.version,
      source: "no-available-activity",
      childReason: "Ask a grown-up to help choose your next activity.",
      primary: null,
      secondary: [],
      explore: []
    };
  }

  const done = missionStatus.done || {};
  const incompleteMissionKinds = STUDENT_HOME_RECOMMENDATION_POLICY.dailyMissionOrder
    .filter(kind => !done[kind]);
  const primaryMissionKind = incompleteMissionKinds.find(kind => (
    available.some(activity => activity.missionKind === kind)
  ));
  const fallbackOrdered = orderByPolicy(
    available,
    STUDENT_HOME_RECOMMENDATION_POLICY.fallbackActivityOrder
  );
  const primary = primaryMissionKind
    ? available.find(activity => activity.missionKind === primaryMissionKind)
    : fallbackOrdered[0];
  const source = primaryMissionKind
    ? `daily-mission:${primaryMissionKind}`
    : missionStatus.missionComplete
      ? "daily-mission-complete:fallback"
      : "policy-fallback";
  const childReason = primaryMissionKind
    ? "This is your next step in today’s adventure."
    : missionStatus.missionComplete
      ? "Your daily adventure is complete, so this is a good next choice."
      : "This is the best available place to start.";

  const remaining = available.filter(activity => activity.id !== primary.id);
  const incompleteMissionActivities = incompleteMissionKinds
    .filter(kind => kind !== primaryMissionKind)
    .map(kind => remaining.find(activity => activity.missionKind === kind))
    .filter(Boolean);
  const missionIds = new Set(incompleteMissionActivities.map(activity => activity.id));
  const fallbackRemaining = orderByPolicy(
    remaining.filter(activity => !missionIds.has(activity.id)),
    STUDENT_HOME_RECOMMENDATION_POLICY.fallbackActivityOrder
  );
  const orderedRemaining = [...incompleteMissionActivities, ...fallbackRemaining];

  return {
    policyId: STUDENT_HOME_RECOMMENDATION_POLICY.id,
    policyVersion: STUDENT_HOME_RECOMMENDATION_POLICY.version,
    source,
    childReason,
    primary,
    secondary: orderedRemaining.slice(0, 2),
    explore: orderedRemaining.slice(2)
  };
}
