export const EL_BENCHMARK_ASSESSMENT_IDS = Object.freeze({
  PHONOLOGICAL_AWARENESS: "el_phonological_awareness",
  ENCODING: "el_encoding",
  DECODING: "el_decoding",
  ORAL_READING_FLUENCY: "el_oral_reading_fluency"
});

export const EL_BENCHMARK_DOMAIN_DEFINITIONS = Object.freeze([
  Object.freeze({
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.PHONOLOGICAL_AWARENESS,
    domainKey: "phonologicalAwareness",
    domainLabel: "Phonological and Phonemic Awareness"
  }),
  Object.freeze({
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ENCODING,
    domainKey: "encoding",
    domainLabel: "Encoding and Spelling"
  }),
  Object.freeze({
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.DECODING,
    domainKey: "decoding",
    domainLabel: "Decoding and Automaticity"
  }),
  Object.freeze({
    assessmentId: EL_BENCHMARK_ASSESSMENT_IDS.ORAL_READING_FLUENCY,
    domainKey: "oralReadingFluency",
    domainLabel: "Oral Reading Fluency"
  })
]);

const BENCHMARK_DOMAIN_BY_ID = new Map(
  EL_BENCHMARK_DOMAIN_DEFINITIONS.map(definition => [definition.assessmentId, definition])
);

function normalizeCompact(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cloneValue(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function normalizeBenchmarkGrade(value = "") {
  const source = typeof value === "object" && value !== null
    ? value.grade ?? value.gradePath ?? value.value ?? ""
    : value;
  const grade = String(source ?? "").trim().toUpperCase().replace(/^GRADE\s*/, "");
  if (["K", "KG", "KINDERGARTEN", "0"].includes(grade)) return "K";
  return grade;
}

function normalizeBenchmarkWindow(value = "") {
  return String(value || "").trim().toUpperCase();
}

export function benchmarkWindowLabel(value = "") {
  const window = normalizeBenchmarkWindow(value);
  if (window === "BOY") return "Beginning of year";
  if (window === "MOY") return "Middle of year";
  if (window === "EOY") return "End of year";
  return String(value || "").trim() || "Assessment period not recorded";
}

export function getElBenchmarkAssessmentId(record = {}) {
  const assessmentType = normalizeCompact(record.assessmentType);
  if (assessmentType && BENCHMARK_DOMAIN_BY_ID.has(assessmentType)) return assessmentType;
  if (assessmentType && assessmentType !== "el_benchmark") return "";
  const candidates = [record.assessmentId, record.skillId];
  for (const candidate of candidates) {
    const normalized = normalizeCompact(candidate);
    if (normalized && BENCHMARK_DOMAIN_BY_ID.has(normalized)) return normalized;
  }
  return "";
}

export function isElBenchmarkAssessmentRecord(record = {}) {
  return Boolean(getElBenchmarkAssessmentId(record));
}

export function benchmarkDomainForRecord(record = {}) {
  return BENCHMARK_DOMAIN_BY_ID.get(getElBenchmarkAssessmentId(record)) || null;
}

function benchmarkRouteForRecord(record = {}) {
  const metadata = record.metadata || {};
  return {
    grade: normalizeBenchmarkGrade(
      record.grade || record.gradePath?.grade || record.gradePath || metadata.grade || ""
    ),
    benchmarkWindow: normalizeBenchmarkWindow(
      record.benchmarkWindow || record.window || metadata.benchmarkWindow || metadata.window || ""
    )
  };
}

function benchmarkRouteKey({ grade = "", benchmarkWindow = "" } = {}) {
  return `${normalizeBenchmarkGrade(grade)}::${normalizeBenchmarkWindow(benchmarkWindow)}`;
}

function benchmarkAttemptTimestamp(record = {}) {
  const value = record.completedAt || record.updatedAt || record.startedAt || "";
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function benchmarkScopeLabel({ grade = "", benchmarkWindow = "" } = {}) {
  const gradeLabel = grade
    ? grade === "K" ? "Kindergarten" : `Grade ${grade}`
    : "Grade not recorded";
  return `${gradeLabel} · ${benchmarkWindowLabel(benchmarkWindow)}`;
}

export function displayBenchmarkScopeLabel(
  scope = {},
  fallback = "Grade and time of year not recorded"
) {
  const grade = normalizeBenchmarkGrade(scope.grade || scope.gradePath || "");
  const benchmarkWindow = normalizeBenchmarkWindow(
    scope.benchmarkWindow || scope.window || ""
  );
  if (grade || benchmarkWindow) {
    return benchmarkScopeLabel({ grade, benchmarkWindow });
  }

  const storedLabel = String(scope.label || "").trim();
  if (!storedLabel) return fallback;
  // Reports saved before the plain-language copy migration can still contain
  // the internal BOY/MOY/EOY abbreviations. They are immutable evidence, but
  // their presentation is not: expand those tokens whenever an old snapshot
  // is shown or downloaded.
  return storedLabel
    .replace(/\bBOY\b/g, benchmarkWindowLabel("BOY"))
    .replace(/\bMOY\b/g, benchmarkWindowLabel("MOY"))
    .replace(/\bEOY\b/g, benchmarkWindowLabel("EOY"));
}

export function benchmarkRecordMatchesScope(record = {}, scope = {}) {
  if (!isElBenchmarkAssessmentRecord(record)) return false;
  const route = benchmarkRouteForRecord(record);
  if (scope.resolved === true && scope.isRouteScoped === false) {
    return route.grade === (scope.grade || "") &&
      route.benchmarkWindow === (scope.benchmarkWindow || "");
  }
  return (!scope.grade || route.grade === scope.grade) &&
    (!scope.benchmarkWindow || route.benchmarkWindow === scope.benchmarkWindow);
}

export function filterAssessmentHistoryForElBenchmarkScope(records = [], scope = {}) {
  return (Array.isArray(records) ? records : []).filter(record => (
    !isElBenchmarkAssessmentRecord(record) || benchmarkRecordMatchesScope(record, scope)
  ));
}

export function resolveElBenchmarkReportScope({
  records = [],
  benchmarkScope = null,
  benchmarkGrade = "",
  benchmarkWindow = ""
} = {}) {
  const benchmarkRecords = (Array.isArray(records) ? records : [])
    .filter(isElBenchmarkAssessmentRecord);
  const availableByRoute = new Map();
  benchmarkRecords.forEach(record => {
    const route = benchmarkRouteForRecord(record);
    const key = benchmarkRouteKey(route);
    const existing = availableByRoute.get(key) || {
      ...route,
      attemptCount: 0,
      latestDate: "",
      latestTimestamp: 0
    };
    existing.attemptCount += 1;
    const timestamp = benchmarkAttemptTimestamp(record);
    if (timestamp >= existing.latestTimestamp) {
      existing.latestTimestamp = timestamp;
      existing.latestDate = record.completedAt || record.updatedAt || record.startedAt || "";
    }
    availableByRoute.set(key, existing);
  });
  const availableRoutes = Array.from(availableByRoute.values())
    .sort((left, right) => right.latestTimestamp - left.latestTimestamp)
    .map(route => ({
      grade: route.grade,
      benchmarkWindow: route.benchmarkWindow,
      attemptCount: route.attemptCount,
      latestDate: route.latestDate,
      label: benchmarkScopeLabel(route)
    }));

  if (benchmarkScope?.resolved === true) {
    const grade = normalizeBenchmarkGrade(benchmarkScope.grade);
    const resolvedWindow = normalizeBenchmarkWindow(
      benchmarkScope.benchmarkWindow || benchmarkScope.window
    );
    const resolved = {
      ...cloneValue(benchmarkScope, {}),
      grade,
      benchmarkWindow: resolvedWindow,
      label: benchmarkScopeLabel({ grade, benchmarkWindow: resolvedWindow }),
      isRouteScoped: Boolean(grade && resolvedWindow),
      resolved: true,
      availableRoutes
    };
    resolved.matchingAttemptCount = benchmarkRecords.filter(record => (
      benchmarkRecordMatchesScope(record, resolved)
    )).length;
    return resolved;
  }

  const requestedGrade = normalizeBenchmarkGrade(benchmarkScope?.grade ?? benchmarkGrade);
  const requestedWindow = normalizeBenchmarkWindow(
    benchmarkScope?.benchmarkWindow ?? benchmarkScope?.window ?? benchmarkWindow
  );
  const matchingRequested = benchmarkRecords
    .filter(record => {
      const route = benchmarkRouteForRecord(record);
      return (!requestedGrade || route.grade === requestedGrade) &&
        (!requestedWindow || route.benchmarkWindow === requestedWindow);
    })
    .sort((left, right) => benchmarkAttemptTimestamp(right) - benchmarkAttemptTimestamp(left));
  const latest = matchingRequested[0] || (!requestedGrade && !requestedWindow
    ? benchmarkRecords.slice().sort((left, right) => (
      benchmarkAttemptTimestamp(right) - benchmarkAttemptTimestamp(left)
    ))[0]
    : null);
  const latestRoute = latest ? benchmarkRouteForRecord(latest) : {};
  const grade = requestedGrade || latestRoute.grade || "";
  const resolvedWindow = requestedWindow || latestRoute.benchmarkWindow || "";
  const hasRequest = Boolean(requestedGrade || requestedWindow);
  const source = requestedGrade && requestedWindow
    ? "explicit"
    : hasRequest && latest
      ? "requested_plus_latest_match"
      : hasRequest
        ? "explicit_partial_unmatched"
        : latest
          ? "latest_benchmark_attempt"
          : "none";
  const resolved = {
    grade,
    benchmarkWindow: resolvedWindow,
    label: benchmarkScopeLabel({ grade, benchmarkWindow: resolvedWindow }),
    source,
    requestedGrade,
    requestedBenchmarkWindow: requestedWindow,
    isRouteScoped: Boolean(grade && resolvedWindow),
    resolved: true,
    availableRoutes
  };
  resolved.matchingAttemptCount = benchmarkRecords.filter(record => (
    benchmarkRecordMatchesScope(record, resolved)
  )).length;
  return resolved;
}
