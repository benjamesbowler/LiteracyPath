import {
  LEARNING_EVIDENCE_POLICY,
  LEARNING_POLICY_VERSION
} from "../policy/learningPolicy.js";

export const CALIBRATION_MONITORING_VERSION = "2026.08.09-a4.11";
export const CALIBRATION_SEED_VERSION = "LP-CALIBRATION-SEED-2026.08.09";

export const CALIBRATION_MONITORING_POLICY = Object.freeze({
  version: CALIBRATION_MONITORING_VERSION,
  minimumSubgroupParticipants: 5,
  minimumItemResponses: 30,
  minimumDifferentialParticipantsPerGroup: 20,
  minimumDifferentialResponsesPerGroup: 30,
  differentialReviewGapPercentagePoints: 15,
  followUpWindowDays: 14
});

const SEED_ITEMS = Object.freeze([
  { itemId: "cal-initial-m", skillId: "initial_sounds", label: "Initial /m/", probability: 0.88 },
  { itemId: "cal-cvc-cat", skillId: "cvc_short_vowels", label: "Read cat", probability: 0.76 },
  { itemId: "cal-blend-flag", skillId: "blends", label: "Read flag", probability: 0.71 },
  { itemId: "cal-digraph-sh", skillId: "digraphs", label: "Read ship", probability: 0.68 },
  { itemId: "cal-hfw-said", skillId: "hfw_26_50", label: "Read said", probability: 0.61 },
  { itemId: "cal-noun-person", skillId: "nouns", label: "Identify a person noun", probability: 0.73 },
  { itemId: "cal-sentence-meaning", skillId: "sentence_comprehension", label: "Sentence meaning", probability: 0.57 },
  { itemId: "cal-inference-clue", skillId: "inference", label: "Use a text clue", probability: 0.49 },
  { itemId: "cal-context-word", skillId: "context_clues", label: "Infer a word meaning", probability: 0.65 },
  { itemId: "cal-vocab-meaning", skillId: "vocabulary", label: "Choose a word meaning", probability: 0.67 }
]);

const ABILITY_ADJUSTMENTS = Object.freeze({
  emerging: -0.19,
  developing: 0,
  secure: 0.16
});

function deterministicFraction(key) {
  let hash = 2166136261;
  for (const character of String(key)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function percentage(correct, total) {
  if (!total) return null;
  return Math.round((correct / total) * 1000) / 10;
}

function sortByLabel(rows) {
  return [...rows].sort((left, right) => String(left.label).localeCompare(String(right.label)));
}

export function createCalibrationSeedDataset() {
  const participants = Array.from({ length: 72 }, (_, index) => ({
    participantCode: `SEED-${String(index + 1).padStart(3, "0")}`,
    abilityBand: ["emerging", "developing", "secure"][index % 3],
    multilingualLearner: index % 2 === 0 ? "yes" : "no",
    additionalSupport: index % 4 === 0 || index % 9 === 0 ? "yes" : "no"
  }));
  const itemEvents = [];

  for (const participant of participants) {
    const participantIndex = Number(participant.participantCode.slice(-3));
    for (const phase of ["initial", "follow_up"]) {
      for (const item of SEED_ITEMS) {
        const phaseAdjustment = phase === "follow_up" ? 0.1 : 0;
        const deliberateInitialDip = participantIndex % 12 === 0 && phase === "initial" ? -0.28 : 0;
        const deliberateRecovery = participantIndex % 12 === 0 && phase === "follow_up" ? 0.14 : 0;
        const multilingualItemAdjustment =
          participant.multilingualLearner === "yes" && item.itemId === "cal-digraph-sh"
            ? -0.18
            : 0;
        const supportAdjustment = participant.additionalSupport === "yes" ? -0.04 : 0;
        const probability = clamp(
          item.probability
            + ABILITY_ADJUSTMENTS[participant.abilityBand]
            + phaseAdjustment
            + deliberateInitialDip
            + deliberateRecovery
            + multilingualItemAdjustment
            + supportAdjustment,
          0.05,
          0.98
        );
        const correct = deterministicFraction(
          `${CALIBRATION_SEED_VERSION}:${participant.participantCode}:${phase}:${item.itemId}`
        ) < probability;
        itemEvents.push({
          participantCode: participant.participantCode,
          itemId: item.itemId,
          itemLabel: item.label,
          skillId: item.skillId,
          phase,
          observedAt: phase === "initial" ? "2026-07-01T09:00:00.000Z" : "2026-07-10T09:00:00.000Z",
          correct,
          independent: true,
          abilityBand: participant.abilityBand,
          multilingualLearner: participant.multilingualLearner,
          additionalSupport: participant.additionalSupport
        });
      }
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    datasetVersion: CALIBRATION_SEED_VERSION,
    sourceMode: "seeded_preview",
    humanValidationStatus: "not_started",
    participants,
    itemEvents
  });
}

export const CALIBRATION_SEED_DATASET = createCalibrationSeedDataset();

function difficultyBand(accuracy) {
  if (accuracy === null) return "not_enough_evidence";
  if (accuracy < 35) return "very_hard";
  if (accuracy < 55) return "hard";
  if (accuracy <= 85) return "target_range";
  if (accuracy <= 95) return "easy";
  return "very_easy";
}

function buildDifficultyRows(events) {
  const rows = new Map();
  for (const event of events.filter(row => row.phase === "initial" && row.independent)) {
    const row = rows.get(event.itemId) || {
      itemId: event.itemId,
      label: event.itemLabel,
      skillId: event.skillId,
      responses: 0,
      correct: 0
    };
    row.responses += 1;
    row.correct += event.correct ? 1 : 0;
    rows.set(event.itemId, row);
  }
  return [...rows.values()].map(row => {
    const accuracy = percentage(row.correct, row.responses);
    const evidenceReady = row.responses >= CALIBRATION_MONITORING_POLICY.minimumItemResponses;
    return {
      ...row,
      accuracy: evidenceReady ? accuracy : null,
      observedAccuracy: accuracy,
      evidenceReady,
      difficultyBand: evidenceReady ? difficultyBand(accuracy) : "not_enough_evidence",
      decisionStatus: "specialist_review_required"
    };
  }).sort((left, right) => (
    (left.accuracy ?? 101) - (right.accuracy ?? 101)
    || left.label.localeCompare(right.label)
  ));
}

function eventsByParticipant(events, phase) {
  const rows = new Map();
  for (const event of events.filter(row => row.phase === phase && row.independent)) {
    const row = rows.get(event.participantCode) || {
      participantCode: event.participantCode,
      responses: 0,
      correct: 0,
      lastObservedAt: ""
    };
    row.responses += 1;
    row.correct += event.correct ? 1 : 0;
    if (!row.lastObservedAt || event.observedAt > row.lastObservedAt) {
      row.lastObservedAt = event.observedAt;
    }
    rows.set(event.participantCode, row);
  }
  return rows;
}

function buildReteachMonitoring(events) {
  const initialRows = eventsByParticipant(events, "initial");
  const followUpRows = eventsByParticipant(events, "follow_up");
  const flagged = [];

  for (const initial of initialRows.values()) {
    const initialAccuracy = percentage(initial.correct, initial.responses);
    const policyReady =
      initial.responses >= LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses;
    const reteachRecommended =
      policyReady
      && initialAccuracy < LEARNING_EVIDENCE_POLICY.accuracyPercent.developingMinimum;
    if (!reteachRecommended) continue;

    const followUp = followUpRows.get(initial.participantCode);
    const followUpAccuracy = percentage(followUp?.correct || 0, followUp?.responses || 0);
    const followUpReady =
      (followUp?.responses || 0) >= LEARNING_EVIDENCE_POLICY.minimumEvidence.learnerScoredResponses;
    const followUpElapsedMs =
      new Date(followUp?.lastObservedAt || "").getTime()
      - new Date(initial.lastObservedAt || "").getTime();
    const followUpDays = Number.isFinite(followUpElapsedMs)
      ? Math.round((followUpElapsedMs / (24 * 60 * 60 * 1000)) * 10) / 10
      : null;
    const followUpInWindow =
      followUpDays !== null
      && followUpDays >= 0
      && followUpDays <= CALIBRATION_MONITORING_POLICY.followUpWindowDays;
    const contradictoryFollowUp =
      followUpReady
      && followUpInWindow
      && followUpAccuracy >= LEARNING_EVIDENCE_POLICY.accuracyPercent.secureMinimum;
    flagged.push({
      participantCode: initial.participantCode,
      initialResponses: initial.responses,
      initialAccuracy,
      followUpResponses: followUp?.responses || 0,
      followUpAccuracy,
      followUpDays,
      followUpInWindow,
      contradictoryFollowUp,
      status: contradictoryFollowUp ? "adjudication_candidate" : "not_contradicted",
      adjudication: "not_started"
    });
  }

  const candidates = flagged.filter(row => row.contradictoryFollowUp);
  return {
    flaggedCount: flagged.length,
    candidateCount: candidates.length,
    candidateRate: percentage(candidates.length, flagged.length),
    adjudicatedCount: 0,
    rows: flagged,
    note: "A contradictory follow-up creates a review candidate; it does not prove that the original reteach recommendation was wrong."
  };
}

function buildSubgroupRows(dataset, dimension) {
  const events = dataset.itemEvents.filter(row => row.phase === "initial" && row.independent);
  const participantValues = new Map(
    dataset.participants.map(participant => [participant.participantCode, participant[dimension]])
  );
  const groups = new Map();
  for (const event of events) {
    const label = participantValues.get(event.participantCode) || "not_recorded";
    const row = groups.get(label) || {
      dimension,
      group: label,
      participantCodes: new Set(),
      responses: 0,
      correct: 0
    };
    row.participantCodes.add(event.participantCode);
    row.responses += 1;
    row.correct += event.correct ? 1 : 0;
    groups.set(label, row);
  }
  return sortByLabel([...groups.values()].map(row => {
    const participants = row.participantCodes.size;
    const suppressed = participants < CALIBRATION_MONITORING_POLICY.minimumSubgroupParticipants;
    return {
      dimension,
      group: row.group,
      label: `${dimension}:${row.group}`,
      participants,
      responses: row.responses,
      accuracy: suppressed ? null : percentage(row.correct, row.responses),
      suppressed
    };
  }));
}

function buildSubgroupMonitoring(dataset) {
  return [
    ...buildSubgroupRows(dataset, "multilingualLearner"),
    ...buildSubgroupRows(dataset, "additionalSupport")
  ];
}

function buildDifferentialRows(dataset) {
  const initialEvents = dataset.itemEvents.filter(row => row.phase === "initial" && row.independent);
  const itemIds = [...new Set(initialEvents.map(row => row.itemId))];
  const rows = [];

  for (const itemId of itemIds) {
    const itemEvents = initialEvents.filter(row => row.itemId === itemId);
    const item = itemEvents[0];
    const groupEvents = {
      yes: itemEvents.filter(row => row.multilingualLearner === "yes"),
      no: itemEvents.filter(row => row.multilingualLearner === "no")
    };
    const groupParticipants = Object.fromEntries(
      Object.entries(groupEvents).map(([group, events]) => [
        group,
        new Set(events.map(row => row.participantCode)).size
      ])
    );
    const suppressed = ["yes", "no"].some(group => (
      groupParticipants[group] < CALIBRATION_MONITORING_POLICY.minimumSubgroupParticipants
    ));
    const evidenceReady = ["yes", "no"].every(group => (
      groupParticipants[group] >= CALIBRATION_MONITORING_POLICY.minimumDifferentialParticipantsPerGroup
      && groupEvents[group].length >= CALIBRATION_MONITORING_POLICY.minimumDifferentialResponsesPerGroup
    ));

    const strata = ["emerging", "developing", "secure"].map(abilityBand => {
      const yes = groupEvents.yes.filter(row => row.abilityBand === abilityBand);
      const no = groupEvents.no.filter(row => row.abilityBand === abilityBand);
      const yesAccuracy = percentage(yes.filter(row => row.correct).length, yes.length);
      const noAccuracy = percentage(no.filter(row => row.correct).length, no.length);
      const weight = Math.min(yes.length, no.length);
      return {
        abilityBand,
        yesResponses: yes.length,
        noResponses: no.length,
        gap: yesAccuracy === null || noAccuracy === null ? null : yesAccuracy - noAccuracy,
        weight
      };
    }).filter(row => row.gap !== null && row.weight > 0);
    const totalWeight = strata.reduce((sum, row) => sum + row.weight, 0);
    const standardizedGap = evidenceReady && totalWeight
      ? Math.round(
        (strata.reduce((sum, row) => sum + row.gap * row.weight, 0) / totalWeight) * 10
      ) / 10
      : null;
    const reviewCandidate =
      standardizedGap !== null
      && Math.abs(standardizedGap)
        >= CALIBRATION_MONITORING_POLICY.differentialReviewGapPercentagePoints;
    rows.push({
      itemId,
      label: item.itemLabel,
      skillId: item.skillId,
      referenceGroup: "multilingualLearner:no",
      focalGroup: "multilingualLearner:yes",
      referenceParticipants: suppressed ? null : groupParticipants.no,
      focalParticipants: suppressed ? null : groupParticipants.yes,
      standardizedGap,
      evidenceReady,
      suppressed,
      reviewCandidate,
      status: suppressed
        ? "suppressed"
        : !evidenceReady
        ? "not_enough_evidence"
        : reviewCandidate
          ? "specialist_review"
          : "monitor",
      strata
    });
  }

  return rows.sort((left, right) => (
    Math.abs(right.standardizedGap || 0) - Math.abs(left.standardizedGap || 0)
    || left.label.localeCompare(right.label)
  ));
}

function validateDataset(dataset) {
  const failures = [];
  if (!dataset || dataset.schemaVersion !== 1) failures.push("Calibration dataset schemaVersion must be 1.");
  if (!dataset?.datasetVersion) failures.push("Calibration dataset must name its version.");
  if (!["seeded_preview", "external_observed"].includes(dataset?.sourceMode)) {
    failures.push("Calibration sourceMode must be seeded_preview or external_observed.");
  }
  if (!Array.isArray(dataset?.participants) || !dataset.participants.length) {
    failures.push("Calibration dataset must contain participants.");
  }
  if (!Array.isArray(dataset?.itemEvents) || !dataset.itemEvents.length) {
    failures.push("Calibration dataset must contain item events.");
  }
  const participants = new Set((dataset?.participants || []).map(row => row.participantCode));
  if (participants.size !== (dataset?.participants || []).length) {
    failures.push("Calibration participant codes must be unique.");
  }
  const forbiddenIdentityKeys = new Set([
    "name",
    "firstName",
    "lastName",
    "email",
    "phone",
    "address",
    "dateOfBirth",
    "dob"
  ]);
  for (const participant of dataset?.participants || []) {
    const exposedKeys = Object.keys(participant).filter(key => forbiddenIdentityKeys.has(key));
    if (exposedKeys.length) {
      failures.push(`Calibration participant ${participant.participantCode || "(missing code)"} contains direct-identity fields.`);
    }
  }
  const eventKeys = new Set();
  for (const event of dataset?.itemEvents || []) {
    if (!participants.has(event.participantCode)) {
      failures.push(`Calibration event references unknown participant ${event.participantCode}.`);
    }
    if (!event.itemId || !event.skillId || !["initial", "follow_up"].includes(event.phase)) {
      failures.push("Calibration item events require itemId, skillId, and a supported phase.");
    }
    if (typeof event.correct !== "boolean" || typeof event.independent !== "boolean") {
      failures.push(`Calibration event ${event.itemId || "(missing item)"} has invalid scored fields.`);
    }
    const exposedKeys = Object.keys(event).filter(key => forbiddenIdentityKeys.has(key));
    if (exposedKeys.length) {
      failures.push(`Calibration event ${event.itemId || "(missing item)"} contains direct-identity fields.`);
    }
    const eventKey = `${event.participantCode}:${event.itemId}:${event.phase}`;
    if (eventKeys.has(eventKey)) {
      failures.push(`Calibration dataset contains duplicate event ${eventKey}.`);
    }
    eventKeys.add(eventKey);
  }
  if (
    dataset?.sourceMode === "seeded_preview"
    && dataset?.humanValidationStatus !== "not_started"
  ) {
    failures.push("Seeded calibration evidence cannot claim human validation.");
  }
  return [...new Set(failures)];
}

export function buildCalibrationMonitoringModel(dataset = CALIBRATION_SEED_DATASET) {
  const failures = validateDataset(dataset);
  if (failures.length) {
    return {
      state: "invalid",
      failures,
      source: null,
      summary: null,
      difficultyRows: [],
      reteachMonitoring: null,
      subgroupRows: [],
      differentialRows: []
    };
  }

  const difficultyRows = buildDifficultyRows(dataset.itemEvents);
  const reteachMonitoring = buildReteachMonitoring(dataset.itemEvents);
  const subgroupRows = buildSubgroupMonitoring(dataset);
  const differentialRows = buildDifferentialRows(dataset);
  return {
    state: dataset.sourceMode === "seeded_preview" ? "seeded_preview" : "observed_unvalidated",
    failures: [],
    source: {
      datasetVersion: dataset.datasetVersion,
      sourceMode: dataset.sourceMode,
      humanValidationStatus: dataset.humanValidationStatus,
      monitoringVersion: CALIBRATION_MONITORING_VERSION,
      learningPolicyVersion: LEARNING_POLICY_VERSION,
      disclaimer: dataset.sourceMode === "seeded_preview"
        ? "Synthetic seeded preview only — not child evidence, calibration, efficacy, fairness, or validation."
        : "Observed evidence awaiting independent specialist review; monitoring flags are not conclusions."
    },
    summary: {
      participants: dataset.participants.length,
      itemEvents: dataset.itemEvents.length,
      items: difficultyRows.length,
      reteachFlags: reteachMonitoring.flaggedCount,
      reteachReviewCandidates: reteachMonitoring.candidateCount,
      differentialReviewCandidates: differentialRows.filter(row => row.reviewCandidate).length,
      suppressedSubgroupCells: subgroupRows.filter(row => row.suppressed).length
    },
    difficultyRows,
    reteachMonitoring,
    subgroupRows,
    differentialRows,
    interpretationRules: {
      seededResultsAreClaims: false,
      subgroupDifferencesAreCausal: false,
      differentialFlagsAreBiasFindings: false,
      reteachCandidatesAreConfirmedErrors: false,
      specialistDecisionRequired: true
    }
  };
}
