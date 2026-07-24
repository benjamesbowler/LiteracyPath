import {
  SOUND_SEEKERS_TRAIL_COUNT,
  isSoundSeekersTrailId
} from "../data/soundSeekersContract.js";

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

export function countCompletedSoundSeekersTrails(progress = {}) {
  const stops = Array.isArray(progress?.trail?.stopsDone)
    ? progress.trail.stopsDone
    : [];
  return new Set(stops.filter(isSoundSeekersTrailId)).size;
}

function pluralized(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function stateResult(label, progressText = "") {
  return {
    label,
    tone: label === "Teacher picked"
      ? "teacher"
      : label === "Continue"
        ? "continue"
        : "new",
    progressText
  };
}

export function buildStudentHomeCardState(activityId, progress = {}) {
  if (activityId === "sound-seekers") {
    const completed = countCompletedSoundSeekersTrails(progress.soundSeekers);
    const assignmentTargets = Array.isArray(progress.soundSeekers?.assignment?.targets)
      ? [...new Set(progress.soundSeekers.assignment.targets.filter(Boolean))]
      : [];
    const progressText = completed > 0
      ? `${completed} of ${SOUND_SEEKERS_TRAIL_COUNT} trails`
      : assignmentTargets.length > 0
        ? pluralized(assignmentTargets.length, "sound")
        : "";
    if (assignmentTargets.length > 0) return stateResult("Teacher picked", progressText);
    return stateResult(completed > 0 ? "Continue" : "New", progressText);
  }

  if (activityId === "phonics-learning") {
    const rows = Object.values(progress.phonics || {});
    const completed = rows.filter(value => (
      value === "completed" || value?.status === "completed"
    )).length;
    const started = rows.filter(value => {
      const status = typeof value === "string" ? value : value?.status;
      return status === "completed" || status === "inprogress";
    }).length;
    return stateResult(
      started > 0 ? "Continue" : "New",
      completed > 0
        ? `${pluralized(completed, "letter")} complete`
        : started > 0
          ? `${pluralized(started, "letter")} started`
          : ""
    );
  }

  if (activityId === "adventure-map") {
    const cycles = Object.values(progress.adventureMap?.cycles || {});
    const completed = cycles.filter(row => Number(row?.stars) > 0).length;
    return stateResult(
      cycles.length > 0 ? "Continue" : "New",
      completed > 0 ? `${pluralized(completed, "map stop")} complete` : ""
    );
  }

  if (activityId === "arcade") {
    const games = Object.values(progress.arcade?.games || {});
    const played = games.filter(row => (
      Number(row?.plays) > 0 || Boolean(row?.lastPlayedAt) || Number(row?.wordsCompleted) > 0
    )).length;
    return stateResult(
      played > 0 ? "Continue" : "New",
      played > 0 ? `${pluralized(played, "game")} tried` : ""
    );
  }

  if (activityId === "story-quests") {
    const rows = Object.values(progress.storyQuests || {}).filter(row => (
      row && (row.completed || row.completedAt || row.updatedAt || row.lastPageId)
    ));
    const completed = rows.filter(row => row.completed || row.completedAt).length;
    return stateResult(
      rows.length > 0 ? "Continue" : "New",
      completed > 0
        ? `${pluralized(completed, "story")} complete`
        : rows.length > 0
          ? `${pluralized(rows.length, "story")} started`
          : ""
    );
  }

  if (activityId === "reading-library") {
    const rows = Object.values(progress.readingLibrary || {}).filter(row => (
      row && typeof row === "object" && (
        row.completed
        || row.completedAt
        || row.lastReadAt
        || Number(row.completedPages) > 0
        || Number(row.readCount) > 0
      )
    ));
    const completed = rows.filter(row => row.completed || row.completedAt).length;
    return stateResult(
      rows.length > 0 ? "Continue" : "New",
      completed > 0
        ? `${pluralized(completed, "book")} read`
        : rows.length > 0
          ? `${pluralized(rows.length, "book")} started`
          : ""
    );
  }

  if (activityId === "my-hollow") {
    const ledger = progress.hollow || {};
    const changes = (ledger.purchases?.length || 0)
      + (ledger.feeds?.length || 0)
      + (ledger.chests?.length || 0)
      + Object.keys(ledger.layout?.equipped || {}).length
      + Object.keys(ledger.layout?.slots || {}).length;
    return stateResult(
      changes > 0 ? "Continue" : "New",
      changes > 0 ? `${pluralized(changes, "change")} saved` : ""
    );
  }

  return stateResult("New");
}

/**
 * Turn the policy-selected activity into an explicit, measurable continuation
 * CTA. The label never falls back to the ambiguous "Keep playing".
 */
export function buildStudentHomeContinuation({
  activity,
  missionStatus = {},
  soundSeekersProgress = {}
} = {}) {
  if (!activity) {
    return {
      label: "Choose an activity",
      remaining: null,
      goal: "available activity"
    };
  }

  if (activity.id === "sound-seekers") {
    const completed = countCompletedSoundSeekersTrails(soundSeekersProgress);
    const remaining = Math.max(0, SOUND_SEEKERS_TRAIL_COUNT - completed);
    return {
      label: remaining > 0
        ? `Continue Sound Seekers — ${pluralized(remaining, "trail")} left`
        : "Replay Sound Seekers — trail complete",
      remaining,
      goal: "Sound Seekers trails"
    };
  }

  if (activity.missionKind && !missionStatus.done?.[activity.missionKind]) {
    const doneCount = Number.isFinite(Number(missionStatus.doneCount))
      ? Number(missionStatus.doneCount)
      : Object.values(missionStatus.done || {}).filter(Boolean).length;
    const remaining = Math.max(1, 3 - doneCount);
    return {
      label: `Continue ${activity.title} — ${pluralized(remaining, "task")} left today`,
      remaining,
      goal: "daily mission tasks"
    };
  }

  return {
    label: `Continue ${activity.title} — choose your next activity`,
    remaining: null,
    goal: "next activity"
  };
}
