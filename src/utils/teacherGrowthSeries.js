const POLICY_MIN_RESPONSES = 8;
const ACQUISITION_ACCURACY = 80;

export const GROWTH_METRICS = Object.freeze([
  {
    id: "skill-acquisition",
    label: "Skill acquisition",
    shortLabel: "Acquisition",
    unit: "skills",
    description: "Cumulative skills first demonstrated at 80% or better across at least eight scored responses."
  },
  {
    id: "retention",
    label: "Retention",
    shortLabel: "Retention",
    unit: "%",
    description: "Accuracy when a previously acquired skill is checked again; monthly points average repeated checks."
  },
  {
    id: "fluency",
    label: "Fluency",
    shortLabel: "Fluency",
    unit: "WCPM",
    description: "Saved words-correct-per-minute evidence from completed oral-reading-fluency checks."
  },
  {
    id: "support-dependence",
    label: "Support dependence",
    shortLabel: "Support use",
    unit: "%",
    description: "Share of responses explicitly recorded as supported; lower values mean less recorded support."
  },
  {
    id: "intervention-response",
    label: "Intervention response",
    shortLabel: "Interventions",
    unit: "response",
    description: "Reviewed outcomes over time: ineffective 0, partial 50, effective 100."
  }
]);

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isoTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function attemptTime(attempt) {
  return isoTime(
    attempt?.completed_at
    || attempt?.completedAt
    || attempt?.payload?.completedAt
    || attempt?.payload?.completed_at
  );
}

function attemptSkill(attempt) {
  return String(
    attempt?.skill_id
    || attempt?.skillId
    || attempt?.skill_name
    || attempt?.skillName
    || attempt?.assessment_type
    || ""
  ).trim();
}

function attemptAccuracy(attempt) {
  const direct = finiteNumber(attempt?.accuracy);
  if (direct !== null) return direct;
  const total = finiteNumber(attempt?.total_questions ?? attempt?.totalQuestions);
  const correct = finiteNumber(attempt?.correct_count ?? attempt?.correctCount);
  return total && correct !== null ? Math.round((correct / total) * 10000) / 100 : null;
}

function attemptTotal(attempt) {
  return Math.max(0, finiteNumber(attempt?.total_questions ?? attempt?.totalQuestions) || 0);
}

function isCompletedAttempt(attempt) {
  const status = String(attempt?.status || "").toLowerCase();
  const administration = String(
    attempt?.administration_status
    || attempt?.administrationStatus
    || attempt?.payload?.administrationStatus
    || ""
  ).toLowerCase();
  if (["in_progress", "partial", "started"].includes(status)) return false;
  if (["in_progress", "partial", "not_administered"].includes(administration)) return false;
  return Boolean(attemptTime(attempt));
}

function monthKey(value) {
  return String(value || "").slice(0, 7);
}

function bucketMonthly(points) {
  const buckets = new Map();
  for (const point of points) {
    const key = monthKey(point.date);
    if (!key) continue;
    const bucket = buckets.get(key) || { key, values: [], date: point.date };
    bucket.values.push(point.value);
    if (point.date > bucket.date) bucket.date = point.date;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .map(bucket => ({
      date: bucket.date,
      value: Math.round(
        (bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length) * 10
      ) / 10,
      evidenceCount: bucket.values.length
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildAcquisition(attempts) {
  const acquired = new Set();
  const points = [];
  for (const attempt of attempts) {
    const skill = attemptSkill(attempt);
    const accuracy = attemptAccuracy(attempt);
    if (
      !skill
      || acquired.has(skill)
      || attemptTotal(attempt) < POLICY_MIN_RESPONSES
      || accuracy === null
      || accuracy < ACQUISITION_ACCURACY
    ) continue;
    acquired.add(skill);
    points.push({
      date: attemptTime(attempt),
      value: acquired.size,
      evidenceCount: 1,
      detail: String(attempt?.skill_name || attempt?.skillName || skill)
    });
  }
  return points;
}

function buildRetention(attempts) {
  const acquired = new Set();
  const repeated = [];
  for (const attempt of attempts) {
    const skill = attemptSkill(attempt);
    const accuracy = attemptAccuracy(attempt);
    if (!skill || attemptTotal(attempt) < POLICY_MIN_RESPONSES || accuracy === null) continue;
    if (acquired.has(skill)) {
      repeated.push({
        date: attemptTime(attempt),
        value: accuracy,
        evidenceCount: 1
      });
    }
    if (accuracy >= ACQUISITION_ACCURACY) acquired.add(skill);
  }
  return bucketMonthly(repeated);
}

function fluencyValue(attempt) {
  const payload = attempt?.payload || {};
  const candidates = [
    payload?.metrics?.wcpm,
    payload?.wcpm,
    payload?.fluency?.wcpm,
    ...(Array.isArray(payload?.questionRecords)
      ? payload.questionRecords.map(record => record?.wcpm)
      : [])
  ];
  return candidates.map(finiteNumber).find(value => value !== null) ?? null;
}

function buildFluency(attempts) {
  return attempts
    .filter(attempt => /fluency/i.test([
      attempt?.assessment_type,
      attempt?.skill_id,
      attempt?.skill_name
    ].join(" ")))
    .flatMap(attempt => {
      const value = fluencyValue(attempt);
      return value === null ? [] : [{
        date: attemptTime(attempt),
        value,
        evidenceCount: 1
      }];
    });
}

function supportPoint(attempt) {
  const records = Array.isArray(attempt?.payload?.questionRecords)
    ? attempt.payload.questionRecords
    : [];
  const captured = records.filter(record => (
    Object.hasOwn(record || {}, "supportUsed")
    || Object.hasOwn(record || {}, "supported")
  ));
  if (!captured.length) return null;
  const supported = captured.filter(record => record.supportUsed === true || record.supported === true).length;
  return {
    date: attemptTime(attempt),
    value: Math.round((supported / captured.length) * 1000) / 10,
    evidenceCount: captured.length
  };
}

function buildSupportDependence(attempts) {
  return bucketMonthly(attempts.map(supportPoint).filter(Boolean));
}

const INTERVENTION_VALUES = Object.freeze({
  ineffective: 0,
  partial: 50,
  effective: 100
});

function buildInterventionResponse(interventions) {
  return interventions
    .flatMap(intervention => {
      if (String(intervention?.status || "").toLowerCase() !== "reviewed") return [];
      const outcome = String(intervention?.outcome || "").toLowerCase();
      const value = INTERVENTION_VALUES[outcome];
      const date = isoTime(intervention?.reviewed_at || intervention?.reviewedAt);
      if (!Number.isFinite(value) || !date) return [];
      return [{
        date,
        value,
        evidenceCount: 1,
        detail: outcome
      }];
    })
    .sort((left, right) => left.date.localeCompare(right.date));
}

function curriculumVersion(attempt) {
  return String(
    attempt?.payload?.curriculumVersion
    || attempt?.payload?.curriculum_version
    || ""
  ).trim();
}

function buildVersionMarkers(attempts) {
  const seen = new Set();
  return attempts.flatMap(attempt => {
    const version = curriculumVersion(attempt);
    const date = attemptTime(attempt);
    if (!version || !date || seen.has(version)) return [];
    seen.add(version);
    return [{ id: version, label: version, date }];
  });
}

function formatDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

function formatValue(metric, value, detail = "") {
  if (metric.id === "skill-acquisition") return `${value} skill${value === 1 ? "" : "s"}`;
  if (metric.id === "fluency") return `${value} WCPM`;
  if (metric.id === "intervention-response") {
    return detail
      ? detail[0].toUpperCase() + detail.slice(1)
      : value === 100 ? "Effective" : value === 50 ? "Partial" : "Ineffective";
  }
  return `${value}%`;
}

function decorateSeries(metric, points, domain) {
  const values = points.map(point => point.value);
  const yMax = metric.unit === "%"
    || metric.id === "intervention-response"
    ? 100
    : Math.max(1, ...values);
  const span = Math.max(1, domain.max - domain.min);
  return {
    ...metric,
    points: points.map(point => ({
      ...point,
      dateLabel: formatDate(point.date),
      valueLabel: formatValue(metric, point.value, point.detail),
      x: ((new Date(point.date).getTime() - domain.min) / span) * 100,
      y: 100 - (point.value / yMax) * 100
    })),
    yMax,
    current: points.length ? formatValue(metric, points.at(-1).value, points.at(-1).detail) : "No evidence",
    change: points.length >= 2
      ? Math.round((points.at(-1).value - points[0].value) * 10) / 10
      : null
  };
}

export function buildTeacherGrowthSeries(history = {}) {
  const attempts = (Array.isArray(history.attempts) ? history.attempts : [])
    .filter(isCompletedAttempt)
    .sort((left, right) => (
      attemptTime(left).localeCompare(attemptTime(right))
      || String(left?.attempt_id || "").localeCompare(String(right?.attempt_id || ""))
    ));
  const interventions = (Array.isArray(history.interventions) ? history.interventions : [])
    .filter(intervention => (
      String(intervention?.status || "").toLowerCase() === "reviewed"
      && Boolean(isoTime(intervention?.reviewed_at || intervention?.reviewedAt))
    ));
  const rawSeries = {
    "skill-acquisition": buildAcquisition(attempts),
    retention: buildRetention(attempts),
    fluency: buildFluency(attempts),
    "support-dependence": buildSupportDependence(attempts),
    "intervention-response": buildInterventionResponse(interventions)
  };
  const markers = buildVersionMarkers(attempts);
  const dates = [
    ...Object.values(rawSeries).flat().map(point => new Date(point.date).getTime()),
    ...markers.map(marker => new Date(marker.date).getTime())
  ].filter(Number.isFinite);
  const now = Date.now();
  const domain = {
    min: dates.length ? Math.min(...dates) : now,
    max: dates.length ? Math.max(...dates) : now
  };
  const span = Math.max(1, domain.max - domain.min);
  return {
    attemptCount: attempts.length,
    interventionCount: interventions.length,
    domain: {
      start: formatDate(new Date(domain.min).toISOString()),
      end: formatDate(new Date(domain.max).toISOString())
    },
    markers: markers.map(marker => ({
      ...marker,
      dateLabel: formatDate(marker.date),
      x: ((new Date(marker.date).getTime() - domain.min) / span) * 100
    })),
    series: GROWTH_METRICS.map(metric => decorateSeries(metric, rawSeries[metric.id], domain))
  };
}
