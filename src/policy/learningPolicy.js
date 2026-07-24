import {
  SOUND_SEEKERS_TRAIL_COUNT,
  isSoundSeekersTrailId
} from "../data/soundSeekersContract.js";

/**
 * Canonical learning-policy owner.
 *
 * Accuracy bands, evidence sufficiency, confidence, recency, progression, and
 * student-home recommendations all live here. Reporting and presentation code
 * may ask this module for a conclusion; it must not recreate these rules.
 */
export const LEARNING_POLICY_VERSION = "2026.07.24-a4.3";
export const STUDENT_HOME_RECOMMENDATION_POLICY_VERSION = "2026.07.24";

export const LEARNING_STATUS_IDS = Object.freeze({
  SECURE: "secure",
  DEVELOPING: "developing",
  NEEDS_SUPPORT: "needs_support",
  NOT_ENOUGH_EVIDENCE: "not_enough_evidence",
  NOT_CHECKED: "not_checked"
});

export const LEARNING_STATUS_LABELS = Object.freeze({
  [LEARNING_STATUS_IDS.SECURE]: "Secure",
  [LEARNING_STATUS_IDS.DEVELOPING]: "Developing",
  [LEARNING_STATUS_IDS.NEEDS_SUPPORT]: "Needs support",
  [LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE]: "Not enough evidence",
  [LEARNING_STATUS_IDS.NOT_CHECKED]: "Not checked"
});

export const LEARNING_EVIDENCE_POLICY = Object.freeze({
  id: "literacy-learning-evidence",
  version: LEARNING_POLICY_VERSION,
  accuracyPercent: Object.freeze({
    secureMinimum: 85,
    developingMinimum: 70,
    intensiveSupportMaximum: 50
  }),
  minimumEvidence: Object.freeze({
    learnerScoredResponses: 8,
    exactItemIndependentAttempts: 3
  }),
  recency: Object.freeze({
    conclusionWindowDays: 90
  }),
  confidence: Object.freeze({
    moderateMinimumSkillDiversity: 2,
    strongerMinimumResponses: 20,
    strongerMinimumSkillDiversity: 3
  }),
  progression: Object.freeze({
    minimumCorrectResponses: 2,
    classMasteryProportion: 0.7
  }),
  comparison: Object.freeze({
    classOutlierPercentagePoints: 15,
    classFocusProportion: 0.3,
    minimumPolicyReadyLearners: 2,
    minimumPolicyReadyProportion: 0.7,
    maximumResponseImbalanceRatio: 4
  })
});

const DAY_MS = 24 * 60 * 60 * 1000;

function finitePolicyNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function finitePolicyTimestamp(value) {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function normalizeAccuracyPercent(value) {
  const number = finitePolicyNumber(value);
  if (number === null) return null;
  return Math.max(0, Math.min(100, number));
}

export function isLearningEvidenceRecent(
  observedAt,
  {
    now = new Date(),
    maximumAgeDays = LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays,
    allowUndated = false
  } = {}
) {
  const observedTimestamp = finitePolicyTimestamp(observedAt);
  if (observedTimestamp === null) return Boolean(allowUndated);
  const nowTimestamp = finitePolicyTimestamp(now);
  if (nowTimestamp === null) return false;
  const age = nowTimestamp - observedTimestamp;
  return age >= 0 && age <= maximumAgeDays * DAY_MS;
}

export function learningConfidence({
  attempts = 0,
  skillDiversity = 0,
  minimumAttempts = LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses
} = {}) {
  const normalizedAttempts = Math.max(0, finitePolicyNumber(attempts) || 0);
  const normalizedDiversity = Math.max(0, finitePolicyNumber(skillDiversity) || 0);
  if (normalizedAttempts < minimumAttempts) {
    return {
      id: "not-enough-evidence",
      label: LEARNING_STATUS_LABELS[LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE],
      detail: `${normalizedAttempts} of ${minimumAttempts} required attempts`,
      sufficient: false,
      policyVersion: LEARNING_POLICY_VERSION
    };
  }
  if (
    normalizedAttempts >= LEARNING_EVIDENCE_POLICY.confidence.strongerMinimumResponses
    && normalizedDiversity >= LEARNING_EVIDENCE_POLICY.confidence.strongerMinimumSkillDiversity
  ) {
    return {
      id: "stronger",
      label: "Stronger evidence",
      detail: `${normalizedAttempts} attempts across ${normalizedDiversity} skills`,
      sufficient: true,
      policyVersion: LEARNING_POLICY_VERSION
    };
  }
  if (normalizedDiversity >= LEARNING_EVIDENCE_POLICY.confidence.moderateMinimumSkillDiversity) {
    return {
      id: "moderate",
      label: "Moderate evidence",
      detail: `${normalizedAttempts} attempts across ${normalizedDiversity} skills`,
      sufficient: true,
      policyVersion: LEARNING_POLICY_VERSION
    };
  }
  return {
    id: "limited-diversity",
    label: "Limited diversity",
    detail: `${normalizedAttempts} attempts across ${normalizedDiversity} recorded skills`,
    sufficient: true,
    policyVersion: LEARNING_POLICY_VERSION
  };
}

export function rawLearningStatus(accuracy) {
  const normalizedAccuracy = normalizeAccuracyPercent(accuracy);
  if (normalizedAccuracy === null) return LEARNING_STATUS_IDS.NOT_CHECKED;
  if (normalizedAccuracy >= LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum) {
    return LEARNING_STATUS_IDS.SECURE;
  }
  if (normalizedAccuracy >= LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum) {
    return LEARNING_STATUS_IDS.DEVELOPING;
  }
  return LEARNING_STATUS_IDS.NEEDS_SUPPORT;
}

export function evaluateLearningConclusion({
  accuracy = null,
  attempts = 0,
  skillDiversity = 0,
  observedAt = "",
  now = new Date(),
  minimumAttempts = LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses,
  requireRecency = true,
  allowUndated = false
} = {}) {
  const normalizedAccuracy = normalizeAccuracyPercent(accuracy);
  const normalizedAttempts = Math.max(0, finitePolicyNumber(attempts) || 0);
  const confidence = learningConfidence({
    attempts: normalizedAttempts,
    skillDiversity,
    minimumAttempts
  });
  const recent = !requireRecency || isLearningEvidenceRecent(observedAt, { now, allowUndated });
  const hasScoredEvidence = normalizedAttempts > 0 && normalizedAccuracy !== null;
  const evidenceReady = hasScoredEvidence && confidence.sufficient && recent;
  const statusId = !hasScoredEvidence
    ? LEARNING_STATUS_IDS.NOT_CHECKED
    : evidenceReady
      ? rawLearningStatus(normalizedAccuracy)
      : LEARNING_STATUS_IDS.NOT_ENOUGH_EVIDENCE;

  return {
    policyId: LEARNING_EVIDENCE_POLICY.id,
    policyVersion: LEARNING_POLICY_VERSION,
    status: {
      id: statusId,
      label: LEARNING_STATUS_LABELS[statusId]
    },
    accuracy: normalizedAccuracy,
    attempts: normalizedAttempts,
    minimumAttempts,
    observedAt: observedAt || "",
    recent,
    confidence,
    ready: evidenceReady,
    reason: !hasScoredEvidence
      ? "No scored evidence has been recorded."
      : !confidence.sufficient
        ? confidence.detail
        : !recent
          ? `The latest evidence is older than ${LEARNING_EVIDENCE_POLICY.recency.conclusionWindowDays} days.`
          : "The evidence meets the published learning-policy requirements."
  };
}

export function evaluateClassComparability({
  totalLearners = 0,
  policyReadyLearners = 0,
  responseCounts = []
} = {}) {
  const total = Math.max(0, finitePolicyNumber(totalLearners) || 0);
  const ready = Math.max(0, finitePolicyNumber(policyReadyLearners) || 0);
  const counts = responseCounts
    .map(value => Math.max(0, finitePolicyNumber(value) || 0))
    .filter(value => value > 0);
  const readyProportion = total > 0 ? ready / total : 0;
  const responseImbalanceRatio = counts.length > 1
    ? Math.max(...counts) / Math.min(...counts)
    : counts.length === 1
      ? 1
      : null;
  const reasons = [];

  if (ready < LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyLearners) {
    reasons.push(
      `${ready} of ${LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyLearners} required policy-ready learners`
    );
  }
  if (readyProportion < LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyProportion) {
    reasons.push(
      `${Math.round(readyProportion * 100)}% of learners are policy-ready; `
      + `${Math.round(LEARNING_EVIDENCE_POLICY.comparison.minimumPolicyReadyProportion * 100)}% required`
    );
  }
  if (counts.length !== ready) {
    reasons.push("one or more policy-ready learners has no response count");
  }
  if (
    responseImbalanceRatio !== null
    && responseImbalanceRatio
      > LEARNING_EVIDENCE_POLICY.comparison.maximumResponseImbalanceRatio
  ) {
    reasons.push(
      `${Math.round(responseImbalanceRatio * 10) / 10}:1 response imbalance; `
      + `${LEARNING_EVIDENCE_POLICY.comparison.maximumResponseImbalanceRatio}:1 maximum`
    );
  }

  return {
    policyId: LEARNING_EVIDENCE_POLICY.id,
    policyVersion: LEARNING_POLICY_VERSION,
    comparable: reasons.length === 0,
    totalLearners: total,
    policyReadyLearners: ready,
    readyProportion,
    responseImbalanceRatio,
    reasons,
    reason: reasons.length
      ? reasons.join("; ")
      : "The class meets the policy-ready learner coverage and response-balance requirements."
  };
}

export function meetsLearningProgressionRule({
  accuracy = null,
  attempts = 0,
  correct = 0,
  observedAt = "",
  now = new Date(),
  minimumAttempts = LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts,
  allowUndated = false
} = {}) {
  const conclusion = evaluateLearningConclusion({
    accuracy,
    attempts,
    skillDiversity: 1,
    observedAt,
    now,
    minimumAttempts,
    allowUndated
  });
  return {
    ...conclusion,
    progresses: conclusion.ready
      && conclusion.status.id === LEARNING_STATUS_IDS.SECURE
      && Number(correct || 0) >= LEARNING_EVIDENCE_POLICY.progression.minimumCorrectResponses
  };
}

export const STUDENT_HOME_RECOMMENDATION_POLICY = Object.freeze({
  id: "student-home-next-activity",
  version: STUDENT_HOME_RECOMMENDATION_POLICY_VERSION,
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
