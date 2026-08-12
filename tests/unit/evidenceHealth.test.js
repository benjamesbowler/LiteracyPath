import assert from "node:assert/strict";
import test from "node:test";

import { buildEvidenceHealth } from "../../src/data/evidenceHealth.js";
import {
  createReportingConcept,
  createReportingEvidence,
  REPORTING_EVIDENCE_KINDS,
  REPORTING_STATUS_IDS,
  reportingStatus
} from "../../src/data/reportingEvidenceModel.js";

const now = new Date("2026-08-13T12:00:00.000Z");

function concept(key, statusId) {
  return {
    ...createReportingConcept({
      domain: "phonics",
      construct: "grapheme_sound",
      key,
      label: `Sound for ${key}`
    }),
    status: reportingStatus(statusId)
  };
}

function evidence(key, observedAt) {
  return createReportingEvidence({
    evidenceId: `evidence-${key}-${observedAt || "undated"}`,
    sourceArea: "assessment",
    sourceLabel: "Assessment",
    sourceRecordId: key,
    sourceRecordType: "skill_check",
    evidenceKind: REPORTING_EVIDENCE_KINDS.FORMAL,
    concept: concept(key, REPORTING_STATUS_IDS.SECURE),
    statusCandidate: REPORTING_STATUS_IDS.SECURE,
    observedAt,
    details: { observations: 3, independentAttempts: 3, correct: 3, accuracy: 100 }
  });
}

test("evidence health combines conflicts, stale results, sufficiency and source-read warnings without scoring the student", () => {
  const health = buildEvidenceHealth({
    concepts: [
      concept("sh", REPORTING_STATUS_IDS.MIXED_EVIDENCE),
      concept("ai", REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE)
    ],
    evidence: [
      evidence("sh", "2026-08-12T12:00:00.000Z"),
      evidence("ai", "2025-08-12T12:00:00.000Z"),
      evidence("ee", "")
    ],
    sourceReads: [{ store: "assessment_attempts", syncStatus: "failed" }],
    now
  });

  assert.equal(health.state, "review");
  assert.equal(health.isCombined, true);
  assert.equal(health.doesNotChangeLearningStatus, true);
  assert.deepEqual(health.signals.map(signal => signal.id), [
    "source_read_warning",
    "source_conflict",
    "undated_evidence",
    "stale_evidence",
    "insufficient_evidence"
  ]);
  assert.equal(Object.hasOwn(health, "score"), false);
  assert.equal(health.signals.find(signal => signal.id === "source_conflict").labels[0], "Sound for sh");
});

test("not checked is neutral and a clean current record produces a clear review", () => {
  const health = buildEvidenceHealth({
    concepts: [
      concept("th", REPORTING_STATUS_IDS.NOT_CHECKED),
      concept("oa", REPORTING_STATUS_IDS.SECURE)
    ],
    evidence: [evidence("oa", "2026-08-12T12:00:00.000Z")],
    sourceReads: [{ store: "assessment_attempts", syncStatus: "complete" }],
    now
  });

  assert.equal(health.state, "clear");
  assert.equal(health.signalCount, 0);
  assert.match(health.summary, /No conflict/);
});

test("pending reads and insufficient results request more evidence without becoming a review failure", () => {
  const health = buildEvidenceHealth({
    concepts: [concept("igh", REPORTING_STATUS_IDS.NOT_ENOUGH_EVIDENCE)],
    sourceReads: [{ store: "answers", syncStatus: "loading" }],
    now
  });

  assert.equal(health.state, "collect");
  assert.deepEqual(health.signals.map(signal => signal.id), [
    "insufficient_evidence",
    "source_read_pending"
  ]);
});
