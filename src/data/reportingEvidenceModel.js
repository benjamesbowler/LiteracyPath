/**
 * Source-neutral evidence primitives for the segmented student reports.
 *
 * These helpers are intentionally pure. They do not read localStorage, fetch
 * cloud rows, or render UI. Callers hydrate the existing source stores first,
 * then pass their records to the report builders.
 */

export const REPORTING_STATUS_IDS = Object.freeze({
  SECURE: "secure",
  DEVELOPING: "developing",
  NEEDS_TEACHING: "needs_teaching",
  MIXED_EVIDENCE: "mixed_evidence",
  NOT_CHECKED: "not_checked"
});

export const REPORTING_STATUS_LABELS = Object.freeze({
  [REPORTING_STATUS_IDS.SECURE]: "Secure",
  [REPORTING_STATUS_IDS.DEVELOPING]: "Developing",
  [REPORTING_STATUS_IDS.NEEDS_TEACHING]: "Needs teaching",
  [REPORTING_STATUS_IDS.MIXED_EVIDENCE]: "Mixed evidence",
  [REPORTING_STATUS_IDS.NOT_CHECKED]: "Not checked"
});

export const REPORTING_EVIDENCE_KINDS = Object.freeze({
  FORMAL: "formal",
  TEACHER_OBSERVATION: "teacher_observation",
  LEGACY_PROJECTION: "legacy_projection",
  PRACTICE: "practice",
  EXPOSURE: "exposure",
  DESCRIPTIVE: "descriptive"
});

export const REPORTING_EVIDENCE_STRENGTH = Object.freeze({
  [REPORTING_EVIDENCE_KINDS.FORMAL]: 3,
  [REPORTING_EVIDENCE_KINDS.TEACHER_OBSERVATION]: 3,
  [REPORTING_EVIDENCE_KINDS.LEGACY_PROJECTION]: 2,
  [REPORTING_EVIDENCE_KINDS.PRACTICE]: 1,
  [REPORTING_EVIDENCE_KINDS.EXPOSURE]: 0,
  [REPORTING_EVIDENCE_KINDS.DESCRIPTIVE]: 0
});

export const REPORTING_DOMAIN_LABELS = Object.freeze({
  alphabet_knowledge: "Alphabet knowledge",
  phonological_awareness: "Phonological awareness",
  phonics: "Phonics",
  decoding: "Decoding",
  encoding: "Encoding",
  fluency: "Oral reading fluency",
  comprehension: "Reading comprehension",
  connected_text_reading: "Connected-text reading",
  vocabulary: "Vocabulary",
  literacy_skill: "Literacy skills"
});

const STATUS_ALIASES = Object.freeze({
  secure: REPORTING_STATUS_IDS.SECURE,
  mastered: REPORTING_STATUS_IDS.SECURE,
  mastery: REPORTING_STATUS_IDS.SECURE,
  correct: REPORTING_STATUS_IDS.SECURE,
  passed: REPORTING_STATUS_IDS.SECURE,
  "got it": REPORTING_STATUS_IDS.SECURE,
  got_it: REPORTING_STATUS_IDS.SECURE,
  "got-it": REPORTING_STATUS_IDS.SECURE,
  developing: REPORTING_STATUS_IDS.DEVELOPING,
  almost: REPORTING_STATUS_IDS.DEVELOPING,
  practising: REPORTING_STATUS_IDS.DEVELOPING,
  practicing: REPORTING_STATUS_IDS.DEVELOPING,
  self_corrected: REPORTING_STATUS_IDS.DEVELOPING,
  needs_teaching: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  "needs teaching": REPORTING_STATUS_IDS.NEEDS_TEACHING,
  needs_support: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  "needs support": REPORTING_STATUS_IDS.NEEDS_TEACHING,
  reteach: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  "re-teach": REPORTING_STATUS_IDS.NEEDS_TEACHING,
  incorrect: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  no_response: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  skipped: REPORTING_STATUS_IDS.NEEDS_TEACHING,
  mixed_evidence: REPORTING_STATUS_IDS.MIXED_EVIDENCE,
  "mixed evidence": REPORTING_STATUS_IDS.MIXED_EVIDENCE,
  not_checked: REPORTING_STATUS_IDS.NOT_CHECKED,
  "not checked": REPORTING_STATUS_IDS.NOT_CHECKED,
  not_assessed: REPORTING_STATUS_IDS.NOT_CHECKED,
  unseen: REPORTING_STATUS_IDS.NOT_CHECKED
});

function cloneValue(value, fallback = null) {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return fallback;
  }
}

function finiteTimestamp(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function evidenceRichness(value = {}) {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

export function normalizeReportingKey(value = "") {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^a-z0-9']+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeReportingStatus(value, { practiceOnly = false } = {}) {
  const normalized = normalizeReportingKey(value);
  const resolved = STATUS_ALIASES[normalized] || null;
  if (practiceOnly && resolved === REPORTING_STATUS_IDS.SECURE) {
    return REPORTING_STATUS_IDS.DEVELOPING;
  }
  return resolved;
}

export function reportingStatus(statusId) {
  const id = normalizeReportingStatus(statusId) || REPORTING_STATUS_IDS.NOT_CHECKED;
  return { id, label: REPORTING_STATUS_LABELS[id] };
}

export function createReportingConcept({
  domain = "literacy_skill",
  construct = "skill",
  key = "",
  variant = "",
  label = "",
  domainLabel = ""
} = {}) {
  const normalizedDomain = normalizeReportingKey(domain) || "literacy_skill";
  const normalizedConstruct = normalizeReportingKey(construct) || "skill";
  const normalizedKey = normalizeReportingKey(key);
  const normalizedVariant = normalizeReportingKey(variant);
  const conceptId = [normalizedDomain, normalizedConstruct, normalizedKey, normalizedVariant]
    .filter(Boolean)
    .join("::");
  return {
    conceptId,
    domain: normalizedDomain,
    domainLabel: domainLabel || REPORTING_DOMAIN_LABELS[normalizedDomain] || "Literacy skills",
    construct: normalizedConstruct,
    key: normalizedKey,
    variant: normalizedVariant,
    label: label || String(key || construct || "Literacy skill").replace(/_/g, " ")
  };
}

export function createReportingEvidence({
  evidenceId = "",
  studentId = "",
  sourceArea = "",
  sourceLabel = "",
  sourceRecordId = "",
  sourceRecordType = "",
  evidenceKind = REPORTING_EVIDENCE_KINDS.DESCRIPTIVE,
  concept = {},
  outcome = "recorded",
  statusCandidate = null,
  observedAt = "",
  administrationStatus = "completed",
  scorable = true,
  knowledgeEligible = true,
  descriptive = false,
  details = {},
  provenance = {}
} = {}) {
  const normalizedKind = Object.values(REPORTING_EVIDENCE_KINDS).includes(evidenceKind)
    ? evidenceKind
    : REPORTING_EVIDENCE_KINDS.DESCRIPTIVE;
  const practiceOnly = [
    REPORTING_EVIDENCE_KINDS.PRACTICE,
    REPORTING_EVIDENCE_KINDS.EXPOSURE
  ].includes(normalizedKind);
  const normalizedConcept = createReportingConcept(concept);
  const normalizedStatus = scorable && knowledgeEligible && !descriptive
    ? normalizeReportingStatus(statusCandidate, { practiceOnly })
    : null;
  const fallbackEvidenceId = [
    normalizeReportingKey(sourceArea) || "source",
    normalizeReportingKey(sourceRecordId) || "record",
    normalizedConcept.conceptId || "concept",
    normalizeReportingKey(outcome) || "recorded"
  ].join(":");

  return {
    evidenceId: evidenceId || fallbackEvidenceId,
    studentId: String(studentId || ""),
    sourceArea: normalizeReportingKey(sourceArea) || "other",
    sourceLabel: sourceLabel || sourceArea || "Other learning",
    sourceRecordId: String(sourceRecordId || ""),
    sourceRecordType: normalizeReportingKey(sourceRecordType),
    evidenceKind: normalizedKind,
    strength: REPORTING_EVIDENCE_STRENGTH[normalizedKind],
    practiceOnly,
    concept: normalizedConcept,
    outcome: normalizeReportingKey(outcome) || "recorded",
    statusCandidate: normalizedStatus,
    status: normalizedStatus ? reportingStatus(normalizedStatus) : null,
    observedAt: observedAt || "",
    administrationStatus: normalizeReportingKey(administrationStatus) || "completed",
    scorable: Boolean(scorable),
    knowledgeEligible: Boolean(knowledgeEligible && !descriptive),
    descriptive: Boolean(descriptive),
    details: cloneValue(details, {}),
    provenance: cloneValue(provenance, {})
  };
}

export function dedupeReportingEvidence(evidence = []) {
  const byId = new Map();
  (Array.isArray(evidence) ? evidence : []).filter(Boolean).forEach(raw => {
    // Always pass supplied rows back through the constructor. Previously a
    // prebuilt-looking object could bypass the practice cap simply by carrying
    // an evidenceId and conceptId of its own.
    const normalized = createReportingEvidence({
      ...raw,
      statusCandidate: raw.statusCandidate ?? raw.status?.id ?? null
    });
    const candidate = {
      ...cloneValue(raw, {}),
      ...normalized,
      concept: {
        ...cloneValue(raw?.concept, {}),
        ...normalized.concept,
        conceptId: raw?.concept?.conceptId
          ? String(raw.concept.conceptId)
          : normalized.concept.conceptId
      }
    };
    const current = byId.get(candidate.evidenceId);
    if (!current) {
      byId.set(candidate.evidenceId, candidate);
      return;
    }
    const currentStrength = Number(current.strength || 0);
    const candidateStrength = Number(candidate.strength || 0);
    const currentTimestamp = finiteTimestamp(current.observedAt);
    const candidateTimestamp = finiteTimestamp(candidate.observedAt);
    if (
      candidateStrength > currentStrength ||
      (candidateStrength === currentStrength && candidateTimestamp > currentTimestamp) ||
      (
        candidateStrength === currentStrength &&
        candidateTimestamp === currentTimestamp &&
        evidenceRichness(candidate) >= evidenceRichness(current)
      )
    ) {
      byId.set(candidate.evidenceId, candidate);
    }
  });
  return Array.from(byId.values()).sort((a, b) => (
    finiteTimestamp(b.observedAt) - finiteTimestamp(a.observedAt) ||
    a.evidenceId.localeCompare(b.evidenceId)
  ));
}

function normalizeExpectedConcept(value = {}) {
  const concept = value.conceptId ? {
    conceptId: value.conceptId,
    domain: value.domain || "literacy_skill",
    domainLabel: value.domainLabel || REPORTING_DOMAIN_LABELS[value.domain] || "Literacy skills",
    construct: value.construct || "skill",
    key: value.key || "",
    variant: value.variant || "",
    label: value.label || value.key || "Literacy skill"
  } : createReportingConcept(value);
  return {
    ...concept,
    conceptId: concept.conceptId || createReportingConcept(concept).conceptId
  };
}

function latestPerSource(evidence = []) {
  const bySource = new Map();
  evidence.forEach(row => {
    const sourceKey = `${row.sourceArea}::${row.sourceRecordType || row.evidenceKind}`;
    const current = bySource.get(sourceKey);
    if (!current || finiteTimestamp(row.observedAt) >= finiteTimestamp(current.observedAt)) {
      bySource.set(sourceKey, row);
    }
  });
  return Array.from(bySource.values());
}

function resolveDecisiveStatus(decisive = []) {
  if (!decisive.length) return REPORTING_STATUS_IDS.NOT_CHECKED;
  const statuses = new Set(decisive.map(row => row.statusCandidate).filter(Boolean));
  if (
    statuses.has(REPORTING_STATUS_IDS.SECURE) &&
    statuses.has(REPORTING_STATUS_IDS.NEEDS_TEACHING)
  ) {
    return REPORTING_STATUS_IDS.MIXED_EVIDENCE;
  }
  if (statuses.has(REPORTING_STATUS_IDS.NEEDS_TEACHING)) {
    return REPORTING_STATUS_IDS.NEEDS_TEACHING;
  }
  if (statuses.has(REPORTING_STATUS_IDS.DEVELOPING)) {
    return REPORTING_STATUS_IDS.DEVELOPING;
  }
  if (statuses.has(REPORTING_STATUS_IDS.SECURE)) {
    return decisive.every(row => row.practiceOnly)
      ? REPORTING_STATUS_IDS.DEVELOPING
      : REPORTING_STATUS_IDS.SECURE;
  }
  return REPORTING_STATUS_IDS.NOT_CHECKED;
}

function keepCurrentConflictWindow(evidence = [], conflictWindowDays = 90) {
  const days = Number(conflictWindowDays);
  if (!Number.isFinite(days) || days < 0) return evidence;
  const newestTimestamp = evidence.reduce((newest, row) => (
    Math.max(newest, finiteTimestamp(row.observedAt))
  ), 0);
  if (!newestTimestamp) return evidence;
  const cutoff = newestTimestamp - days * 24 * 60 * 60 * 1000;
  // Undated direct evidence cannot be proved stale, so retain it and expose
  // its missing date in the disclosure rather than silently discarding it.
  return evidence.filter(row => {
    const timestamp = finiteTimestamp(row.observedAt);
    return !timestamp || timestamp >= cutoff;
  });
}

function statusExplanation(statusId, decisive = []) {
  const sourceNames = [...new Set(decisive.map(row => row.sourceLabel).filter(Boolean))];
  const sources = sourceNames.length ? sourceNames.join(" and ") : "available evidence";
  if (statusId === REPORTING_STATUS_IDS.MIXED_EVIDENCE) {
    return `The strongest included evidence from ${sources} does not yet agree.`;
  }
  if (statusId === REPORTING_STATUS_IDS.SECURE) {
    return `The strongest direct evidence from ${sources} indicates secure performance.`;
  }
  if (statusId === REPORTING_STATUS_IDS.DEVELOPING) {
    return decisive.length && decisive.every(row => row.practiceOnly)
      ? `Practice evidence from ${sources} shows progress; a direct check is still needed.`
      : `The strongest evidence from ${sources} shows emerging but not yet secure performance.`;
  }
  if (statusId === REPORTING_STATUS_IDS.NEEDS_TEACHING) {
    return `The strongest direct evidence from ${sources} indicates that teaching support is needed.`;
  }
  return "No scorable knowledge evidence has been recorded.";
}

function finiteMetric(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function evidenceObservationCount(row = {}) {
  const details = row.details || {};
  return finiteMetric(details.observations)
    ?? finiteMetric(details.independentSeen)
    ?? finiteMetric(details.attempts)
    ?? (row.scorable && row.knowledgeEligible && row.statusCandidate ? 1 : 0);
}

function evidenceCorrectCount(row = {}, observations = 0) {
  const details = row.details || {};
  const exact = finiteMetric(details.correct);
  if (exact !== null) return exact;
  const accuracy = finiteMetric(details.accuracy);
  if (accuracy !== null && observations > 0) return observations * (accuracy / 100);
  if (row.statusCandidate === REPORTING_STATUS_IDS.SECURE) return observations;
  if (row.statusCandidate === REPORTING_STATUS_IDS.NEEDS_TEACHING) return 0;
  return null;
}

function wholeChildEvidenceBasis(conceptEvidence = [], decisive = []) {
  const scored = conceptEvidence.filter(row => (
    row.scorable && row.knowledgeEligible && row.statusCandidate
  ));
  const observations = scored.reduce((total, row) => total + evidenceObservationCount(row), 0);
  const correctValues = scored.map(row => {
    const rowObservations = evidenceObservationCount(row);
    return evidenceCorrectCount(row, rowObservations);
  });
  const hasCompleteCorrectCount = scored.length > 0 && correctValues.every(value => value !== null);
  const correct = hasCompleteCorrectCount
    ? correctValues.reduce((total, value) => total + value, 0)
    : null;
  const dates = scored
    .map(row => row.observedAt)
    .filter(value => finiteTimestamp(value))
    .map(value => new Date(value).toISOString())
    .sort();
  const attemptIds = [...new Set(scored.map(row => row.sourceRecordId).filter(Boolean))];
  return {
    observations,
    correct: correct === null ? null : Number(correct.toFixed(2)),
    total: observations,
    accuracy: correct === null || !observations
      ? null
      : Number(((correct / observations) * 100).toFixed(1)),
    attemptCount: attemptIds.length,
    attemptIds,
    sourceCount: new Set(scored.map(row => row.sourceArea).filter(Boolean)).size,
    windowStart: dates[0] || "",
    windowEnd: dates.at(-1) || "",
    decisiveObservations: decisive.reduce((total, row) => total + evidenceObservationCount(row), 0)
  };
}

function triangulationKey(concept = {}) {
  if (
    (concept.domain === "alphabet_knowledge" && concept.construct === "letter_sound")
    || (concept.domain === "phonics" && concept.construct === "grapheme_sound")
  ) {
    return `grapheme_sound::${concept.key}`;
  }
  return [concept.domain, concept.construct, concept.key, concept.variant].filter(Boolean).join("::");
}

function datedSourceSummary(item = {}) {
  const source = item.sourceChips?.map(row => row.label).filter(Boolean).join(", ") || "available evidence";
  const timestamp = finiteTimestamp(item.latestAt);
  const date = timestamp ? new Date(timestamp).toISOString() : "undated";
  return `${item.label}: ${item.status.label} (${source}; ${date})`;
}

/**
 * Resolve source evidence into the five deliberately plain Whole Child states.
 *
 * Rules:
 * - only knowledge-eligible, scorable evidence can decide a status;
 * - the strongest evidence tier wins (formal/teacher > legacy > practice);
 * - practice-only evidence is capped at Developing;
 * - opposing direct evidence is retained as Mixed evidence, never averaged;
 * - exposure and missing evidence resolve to Not checked.
 */
export function resolveWholeChildConcepts({
  evidence = [],
  expectedConcepts = [],
  conflictWindowDays = 90
} = {}) {
  const dedupedEvidence = dedupeReportingEvidence(evidence);
  const concepts = new Map();

  (Array.isArray(expectedConcepts) ? expectedConcepts : []).forEach(raw => {
    const concept = normalizeExpectedConcept(raw);
    if (concept.conceptId) concepts.set(concept.conceptId, { concept, evidence: [] });
  });

  dedupedEvidence.forEach(row => {
    const concept = row.concept || createReportingConcept();
    if (!concept.conceptId) return;
    const current = concepts.get(concept.conceptId) || { concept, evidence: [] };
    current.evidence.push(row);
    concepts.set(concept.conceptId, current);
  });

  const resolved = Array.from(concepts.values()).map(({ concept, evidence: conceptEvidence }) => {
    const eligible = conceptEvidence.filter(row => (
      row.knowledgeEligible &&
      row.scorable &&
      row.statusCandidate &&
      row.statusCandidate !== REPORTING_STATUS_IDS.NOT_CHECKED
    ));
    const sourceLatest = latestPerSource(eligible);
    const strongest = sourceLatest.reduce((maximum, row) => Math.max(maximum, Number(row.strength || 0)), -1);
    const strongestEvidence = strongest < 0
      ? []
      : sourceLatest.filter(row => Number(row.strength || 0) === strongest);
    const decisive = keepCurrentConflictWindow(strongestEvidence, conflictWindowDays);
    const statusId = resolveDecisiveStatus(decisive);
    const decisiveStrength = decisive.reduce((maximum, row) => (
      Math.max(maximum, Number(row.strength || 0))
    ), -1);
    const decisiveLatestAt = decisive
      .map(row => row.observedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || "";
    const latestAt = conceptEvidence
      .map(row => row.observedAt)
      .filter(Boolean)
      .sort()
      .at(-1) || "";
    const sourceChips = Array.from(new Map(conceptEvidence.map(row => [
      row.sourceArea,
      {
        sourceArea: row.sourceArea,
        label: row.sourceLabel,
        evidenceKind: row.evidenceKind,
        strength: row.strength
      }
    ])).values()).sort((a, b) => b.strength - a.strength || a.label.localeCompare(b.label));

    return {
      conceptId: concept.conceptId,
      domain: concept.domain,
      domainLabel: concept.domainLabel,
      construct: concept.construct,
      key: concept.key,
      variant: concept.variant,
      label: concept.label,
      status: reportingStatus(statusId),
      latestAt,
      evidenceCount: conceptEvidence.length,
      decisiveEvidenceCount: decisive.length,
      decisiveStrength: Math.max(0, decisiveStrength),
      decisiveLatestAt,
      practiceOnlyDecision: Boolean(decisive.length && decisive.every(row => row.practiceOnly)),
      confidence: strongest >= 3 ? "Direct evidence" : strongest === 2 ? "Legacy evidence" : strongest === 1 ? "Practice evidence" : "No scored evidence",
      explanation: statusExplanation(statusId, decisive),
      coverageLabel: conceptEvidence.length ? "Seen in available evidence" : "Not seen in available evidence",
      evidenceBasis: wholeChildEvidenceBasis(conceptEvidence, decisive),
      sourceChips,
      decisiveEvidenceIds: decisive.map(row => row.evidenceId),
      evidence: conceptEvidence
    };
  });

  const triangulationGroups = new Map();
  resolved.forEach(item => {
    const key = triangulationKey(item);
    const group = triangulationGroups.get(key) || [];
    group.push(item);
    triangulationGroups.set(key, group);
  });
  triangulationGroups.forEach(group => {
    const sources = new Set(group.flatMap(item => item.sourceChips.map(source => source.label).filter(Boolean)));
    const statuses = new Set(group.map(item => item.status.id));
    const shouldExplain = group.length > 1 || sources.size > 1 || statuses.size > 1;
    if (!shouldExplain) return;
    const summary = group.map(datedSourceSummary).join("; ");
    group.forEach(item => {
      item.reconciliationNote = `Triangulated related evidence without averaging source strength: ${summary}. The displayed status follows the published evidence precedence.`;
      item.triangulationKey = triangulationKey(item);
    });
  });

  return resolved.sort((a, b) => (
    a.domainLabel.localeCompare(b.domainLabel) ||
    a.label.localeCompare(b.label) ||
    a.conceptId.localeCompare(b.conceptId)
  ));
}
