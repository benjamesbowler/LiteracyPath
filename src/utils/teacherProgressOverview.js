export const PROGRESS_MIN_RESPONSES = 8;

const DISTRIBUTION_BANDS = Object.freeze([
  {
    id: "secure",
    label: "85–100%",
    description: "Current evidence is consistently accurate.",
    matches: accuracy => accuracy >= 85
  },
  {
    id: "developing",
    label: "70–84%",
    description: "Current evidence is developing.",
    matches: accuracy => accuracy >= 70 && accuracy < 85
  },
  {
    id: "needs-support",
    label: "Below 70%",
    description: "Current evidence suggests targeted follow-up.",
    matches: accuracy => accuracy < 70
  }
]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
function normalizedHeat(row) {
  return Array.isArray(row?.soundSeekers?.heat)
    ? row.soundSeekers.heat.filter(item => item?.id)
    : [];
}

function evidenceReady(row) {
  return finiteNumber(row?.answered) >= PROGRESS_MIN_RESPONSES
    && Number.isFinite(Number(row?.accuracy));
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function itemEvidenceFor(row) {
  return normalizedHeat(row)
    .filter(item => finiteNumber(item.seen) > 0)
    .map(item => ({
      id: String(item.id),
      label: String(item.label || item.id),
      stopName: String(item.stopName || "Curriculum sequence"),
      bucket: String(item.bucket || "almost"),
      seen: finiteNumber(item.seen),
      independentSeen: finiteNumber(item.independentSeen),
      accuracy: Number.isFinite(Number(item.accuracy)) ? Number(item.accuracy) : null,
      updatedAt: row?.soundSeekers?.lastActiveAt || row?.soundSeekers?.syncedAt || row?.lastActive || ""
    }));
}

function buildGroups(rows) {
  const focusGroups = new Map();
  const soundGroups = new Map();

  for (const row of rows) {
    const focus = String(row.currentSkill || "").trim();
    if (focus && focus !== "Not started" && finiteNumber(row.answered) > 0) {
      const key = focus.toLowerCase();
      const group = focusGroups.get(key) || {
        id: `focus:${key}`,
        label: focus,
        basis: "Shared current curriculum focus",
        learners: []
      };
      group.learners.push({ id: row.id, name: row.name });
      focusGroups.set(key, group);
    }

    for (const item of normalizedHeat(row)) {
      if (item.bucket !== "reteach") continue;
      const group = soundGroups.get(item.id) || {
        id: `sound:${item.id}`,
        label: `${item.label || item.id} re-teaching`,
        basis: "Shared Sound Seekers re-teaching evidence",
        learners: []
      };
      group.learners.push({ id: row.id, name: row.name });
      soundGroups.set(item.id, group);
    }
  }

  return [...soundGroups.values(), ...focusGroups.values()]
    .filter(group => group.learners.length >= 2)
    .sort((left, right) =>
      right.learners.length - left.learners.length
      || left.label.localeCompare(right.label)
    )
    .slice(0, 6);
}

export function buildTeacherProgressOverview(sourceRows = []) {
  const rows = sourceRows
    .filter(row => row?.id)
    .map(row => ({
      ...row,
      id: String(row.id),
      name: String(row.name || "Learner"),
      answered: Math.max(0, finiteNumber(row.answered)),
      masteredCount: Math.max(0, finiteNumber(row.masteredCount)),
      accuracy: Number.isFinite(Number(row.accuracy)) ? Number(row.accuracy) : null,
      itemEvidence: itemEvidenceFor(row)
    }));

  const readyRows = rows.filter(evidenceReady);
  const insufficientRows = rows.filter(row => !evidenceReady(row));
  const classMedian = median(readyRows.map(row => row.accuracy));
  const distribution = DISTRIBUTION_BANDS.map(band => ({
    id: band.id,
    label: band.label,
    description: band.description,
    count: readyRows.filter(row => band.matches(row.accuracy)).length,
    learners: readyRows
      .filter(row => band.matches(row.accuracy))
      .map(row => ({ id: row.id, name: row.name }))
  }));
  distribution.push({
    id: "insufficient",
    label: `Fewer than ${PROGRESS_MIN_RESPONSES}`,
    description: "More evidence is needed before placing these learners in an accuracy band.",
    count: insufficientRows.length,
    learners: insufficientRows.map(row => ({ id: row.id, name: row.name }))
  });

  const learnersWithAnyEvidence = rows.filter(row =>
    row.answered > 0 || row.itemEvidence.length > 0
  ).length;
  const itemTargetCount = rows.reduce(
    (maximum, row) => Math.max(maximum, normalizedHeat(row).length),
    0
  );
  const seenItemIds = new Set(rows.flatMap(row => row.itemEvidence.map(item => item.id)));
  const coverage = {
    totalLearners: rows.length,
    learnersWithAnyEvidence,
    learnersPolicyReady: readyRows.length,
    learnerPercent: rows.length
      ? Math.round((learnersWithAnyEvidence / rows.length) * 100)
      : 0,
    policyReadyPercent: rows.length
      ? Math.round((readyRows.length / rows.length) * 100)
      : 0,
    responseCount: rows.reduce((sum, row) => sum + row.answered, 0),
    itemTargetsSeen: seenItemIds.size,
    itemTargetCount,
    itemPercent: itemTargetCount
      ? Math.round((seenItemIds.size / itemTargetCount) * 100)
      : 0
  };

  const outliers = classMedian === null
    ? []
    : readyRows
      .map(row => ({
        id: row.id,
        name: row.name,
        accuracy: row.accuracy,
        answered: row.answered,
        difference: row.accuracy - classMedian,
        direction: row.accuracy >= classMedian ? "above" : "below",
        itemEvidence: row.itemEvidence
      }))
      .filter(row => Math.abs(row.difference) >= 15)
      .sort((left, right) =>
        Math.abs(right.difference) - Math.abs(left.difference)
        || left.name.localeCompare(right.name)
      );

  return {
    rows,
    distribution,
    coverage,
    groups: buildGroups(rows),
    outliers,
    classMedian,
    policy: {
      minimumResponses: PROGRESS_MIN_RESPONSES,
      outlierDistance: 15
    }
  };
}
