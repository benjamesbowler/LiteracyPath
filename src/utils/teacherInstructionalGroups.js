function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function latestReview(group) {
  return Array.isArray(group?.reviews) ? group.reviews[0] || null : null;
}

function latestIso(values) {
  return values
    .filter(Boolean)
    .map(value => new Date(value))
    .filter(value => Number.isFinite(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime())[0]
    ?.toISOString() || "";
}

function nameFor(rowsById, id) {
  return rowsById.get(id)?.name || "Learner no longer on the active roster";
}

function namedMembers(ids, rowsById) {
  return ids
    .map(id => ({ id, name: nameFor(rowsById, id) }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function criterionFromSuggestion(suggestion) {
  const sourceId = String(suggestion?.id || "").trim();
  const label = String(suggestion?.label || "").trim();
  const basis = String(suggestion?.basis || "").trim();
  if (!sourceId || !label || !basis) return null;
  return {
    schemaVersion: 1,
    sourceId,
    kind: sourceId.startsWith("sound:")
      ? "shared-exact-reteaching-evidence"
      : "shared-current-curriculum-focus",
    label,
    basis,
    policy: sourceId.startsWith("sound:")
      ? "Each learner has at least three independent attempts on the same exact item and a current re-teaching signal."
      : "Each learner meets the eight-response policy minimum and shares the same current curriculum focus."
  };
}

export function buildInstructionalGroupSnapshot(rows = [], studentIds = [], capturedAt = "") {
  const memberIds = unique(studentIds.map(String));
  const rowsById = new Map(rows.map(row => [String(row?.id || ""), row]));
  const members = memberIds.map(id => rowsById.get(id)).filter(Boolean);
  const ready = members.filter(row => row?.evidence?.ready && Number.isFinite(Number(row?.accuracy)));
  const attempts = members.reduce(
    (sum, row) => sum + finiteNumber(row?.evidence?.attempts ?? row?.answered),
    0
  );
  const skills = unique(members.flatMap(row => (
    Array.isArray(row?.evidenceSkills) ? row.evidenceSkills : []
  )));
  const supportRecorded = members.reduce(
    (sum, row) => sum + finiteNumber(row?.evidence?.support?.recorded),
    0
  );
  const supportUsed = members.reduce(
    (sum, row) => sum + finiteNumber(row?.evidence?.support?.supported),
    0
  );
  return {
    schemaVersion: 1,
    capturedAt: capturedAt || latestIso(members.map(row => row?.evidence?.recency)),
    memberCount: memberIds.length,
    policyReadyMembers: ready.length,
    attempts,
    skillDiversity: skills.length,
    latestEvidenceAt: latestIso(members.map(row => row?.evidence?.recency)),
    averageAccuracy: ready.length
      ? Math.round(
        (ready.reduce((sum, row) => sum + Number(row.accuracy), 0) / ready.length) * 10
      ) / 10
      : null,
    supportRecorded,
    supportUsed
  };
}

export function buildInstructionalGroupMovement(group, suggestions = [], rows = []) {
  const rowsById = new Map(rows.map(row => [String(row?.id || ""), row]));
  const previousIds = unique((latestReview(group)?.student_ids || []).map(String));
  const suggestion = suggestions.find(row => row.id === group?.criteria?.sourceId) || null;
  if (!suggestion) {
    return {
      criterionAvailable: false,
      currentIds: previousIds,
      stayed: namedMembers(previousIds, rowsById),
      joined: [],
      left: []
    };
  }
  const currentIds = unique((suggestion.learners || []).map(learner => String(learner.id)));
  const previous = new Set(previousIds);
  const current = new Set(currentIds);
  return {
    criterionAvailable: true,
    currentIds,
    stayed: namedMembers(currentIds.filter(id => previous.has(id)), rowsById),
    joined: namedMembers(currentIds.filter(id => !previous.has(id)), rowsById),
    left: namedMembers(previousIds.filter(id => !current.has(id)), rowsById)
  };
}

function storedInstructionalGroupSnapshot(review) {
  const snapshot = review?.evidence_snapshot;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const requiredNumbers = [
    "memberCount",
    "policyReadyMembers",
    "attempts",
    "skillDiversity",
    "supportRecorded",
    "supportUsed"
  ];
  if (requiredNumbers.some(key => (
    typeof snapshot[key] !== "number"
    || !Number.isFinite(snapshot[key])
    || !Number.isInteger(snapshot[key])
    || snapshot[key] < 0
  ))) return null;
  if (
    snapshot.averageAccuracy !== null
    && (
      typeof snapshot.averageAccuracy !== "number"
      || !Number.isFinite(snapshot.averageAccuracy)
      || snapshot.averageAccuracy < 0
      || snapshot.averageAccuracy > 100
    )
  ) return null;
  if (
    snapshot.memberCount < 1
    || snapshot.memberCount > 40
    || snapshot.policyReadyMembers > snapshot.memberCount
    || snapshot.supportUsed > snapshot.supportRecorded
  ) return null;
  return { ...snapshot };
}

export function buildInstructionalGroupComparison(groups = []) {
  return groups.map(group => {
    const review = latestReview(group);
    const studentIds = unique((review?.student_ids || []).map(String));
    return {
      id: group.id,
      name: group.name,
      criterion: group.criteria,
      reviewedAt: review?.reviewed_at || "",
      studentIds,
      snapshot: storedInstructionalGroupSnapshot(review)
    };
  });
}

export function attachInstructionalGroupReviews(groups = [], reviews = []) {
  const byGroup = new Map();
  for (const review of reviews) {
    const groupRows = byGroup.get(review.group_id) || [];
    groupRows.push(review);
    byGroup.set(review.group_id, groupRows);
  }
  return groups.map(group => ({
    ...group,
    reviews: (byGroup.get(group.id) || []).sort((left, right) => (
      String(right.reviewed_at || "").localeCompare(String(left.reviewed_at || ""))
      || String(right.id || "").localeCompare(String(left.id || ""))
    ))
  }));
}
