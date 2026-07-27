import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  CALIBRATION_MONITORING_POLICY,
  CALIBRATION_SEED_DATASET,
  CALIBRATION_SEED_VERSION,
  buildCalibrationMonitoringModel,
  createCalibrationSeedDataset
} from "../../src/data/calibrationMonitoringModel.js";

test("the calibration preview is deterministic, complete, and explicitly synthetic", () => {
  const first = createCalibrationSeedDataset();
  const second = createCalibrationSeedDataset();
  assert.deepEqual(first, second);
  assert.equal(first.datasetVersion, CALIBRATION_SEED_VERSION);
  assert.equal(first.sourceMode, "seeded_preview");
  assert.equal(first.humanValidationStatus, "not_started");
  assert.equal(first.participants.length, 72);
  assert.equal(first.itemEvents.length, 1152);

  const model = buildCalibrationMonitoringModel(first);
  assert.equal(model.state, "seeded_preview");
  assert.equal(model.source.humanValidationStatus, "not_started");
  assert.match(model.source.disclaimer, /not child evidence/i);
  assert.deepEqual(model.failures, []);
  assert.equal(model.summary.items, 8);
  assert.ok(model.summary.reteachReviewCandidates > 0);
  assert.ok(model.summary.differentialReviewCandidates > 0);
});

test("difficulty monitoring reports evidence counts and withholds automatic decisions", () => {
  const model = buildCalibrationMonitoringModel(CALIBRATION_SEED_DATASET);
  assert.equal(model.difficultyRows.length, 8);
  for (const row of model.difficultyRows) {
    assert.ok(row.responses >= CALIBRATION_MONITORING_POLICY.minimumItemResponses);
    assert.equal(row.evidenceReady, true);
    assert.equal(row.decisionStatus, "specialist_review_required");
    assert.ok(row.accuracy >= 0 && row.accuracy <= 100);
  }
  assert.equal(model.interpretationRules.seededResultsAreClaims, false);
  assert.equal(model.interpretationRules.specialistDecisionRequired, true);
});

test("contradictory follow-up evidence creates candidates without declaring false positives", () => {
  const model = buildCalibrationMonitoringModel(CALIBRATION_SEED_DATASET);
  const candidates = model.reteachMonitoring.rows.filter(row => row.contradictoryFollowUp);
  assert.equal(candidates.length, model.reteachMonitoring.candidateCount);
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every(row => row.status === "adjudication_candidate"));
  assert.ok(candidates.every(row => row.adjudication === "not_started"));
  assert.ok(candidates.every(row => row.followUpInWindow));
  assert.ok(candidates.every(row => row.followUpDays === 9));
  assert.equal(model.reteachMonitoring.adjudicatedCount, 0);
  assert.match(model.reteachMonitoring.note, /does not prove/i);
  assert.equal(model.interpretationRules.reteachCandidatesAreConfirmedErrors, false);
});

test("differential screening matches within ability bands and remains a review signal", () => {
  const model = buildCalibrationMonitoringModel(CALIBRATION_SEED_DATASET);
  const flagged = model.differentialRows.filter(row => row.reviewCandidate);
  assert.ok(flagged.length > 0);
  for (const row of flagged) {
    assert.equal(row.status, "specialist_review");
    assert.ok(row.evidenceReady);
    assert.ok(
      Math.abs(row.standardizedGap)
        >= CALIBRATION_MONITORING_POLICY.differentialReviewGapPercentagePoints
    );
    assert.deepEqual(
      row.strata.map(stratum => stratum.abilityBand),
      ["emerging", "developing", "secure"]
    );
  }
  assert.equal(model.interpretationRules.differentialFlagsAreBiasFindings, false);
  assert.equal(model.interpretationRules.subgroupDifferencesAreCausal, false);
});

test("small subgroup cells are suppressed rather than converted into percentages", () => {
  const participants = Array.from({ length: 6 }, (_, index) => ({
    participantCode: `P-${index + 1}`,
    abilityBand: "developing",
    multilingualLearner: index === 0 ? "yes" : "no",
    additionalSupport: "no"
  }));
  const itemEvents = participants.map(participant => ({
    participantCode: participant.participantCode,
    itemId: "small-cell-item",
    itemLabel: "Small cell item",
    skillId: "initial_sounds",
    phase: "initial",
    observedAt: "2026-07-01T09:00:00.000Z",
    correct: true,
    independent: true,
    abilityBand: participant.abilityBand,
    multilingualLearner: participant.multilingualLearner,
    additionalSupport: participant.additionalSupport
  }));
  const model = buildCalibrationMonitoringModel({
    schemaVersion: 1,
    datasetVersion: "SMALL-CELL-FIXTURE",
    sourceMode: "external_observed",
    humanValidationStatus: "not_started",
    participants,
    itemEvents
  });
  const focal = model.subgroupRows.find(row => (
    row.dimension === "multilingualLearner" && row.group === "yes"
  ));
  assert.equal(focal.participants, 1);
  assert.equal(focal.suppressed, true);
  assert.equal(focal.accuracy, null);
  const differential = model.differentialRows[0];
  assert.equal(differential.suppressed, true);
  assert.equal(differential.focalParticipants, null);
  assert.equal(differential.referenceParticipants, null);
  assert.equal(differential.standardizedGap, null);
  assert.equal(differential.status, "suppressed");
});

test("seeded evidence fails closed if it claims human validation", () => {
  const model = buildCalibrationMonitoringModel({
    ...CALIBRATION_SEED_DATASET,
    humanValidationStatus: "approved"
  });
  assert.equal(model.state, "invalid");
  assert.match(model.failures.join("\n"), /cannot claim human validation/i);
  assert.equal(model.summary, null);
});

test("out-of-window follow-up cannot create a reteach adjudication candidate", () => {
  const delayed = {
    ...CALIBRATION_SEED_DATASET,
    datasetVersion: "DELAYED-FOLLOW-UP-FIXTURE",
    itemEvents: CALIBRATION_SEED_DATASET.itemEvents.map(event => (
      event.phase === "follow_up"
        ? { ...event, observedAt: "2026-08-10T09:00:00.000Z" }
        : event
    ))
  };
  const model = buildCalibrationMonitoringModel(delayed);
  assert.equal(model.reteachMonitoring.candidateCount, 0);
  assert.ok(model.reteachMonitoring.rows.every(row => row.followUpInWindow === false));
});

test("direct identity fields and duplicate item events fail closed", () => {
  const identityModel = buildCalibrationMonitoringModel({
    ...CALIBRATION_SEED_DATASET,
    datasetVersion: "IDENTITY-FIXTURE",
    participants: CALIBRATION_SEED_DATASET.participants.map((participant, index) => (
      index === 0 ? { ...participant, name: "Not allowed" } : participant
    ))
  });
  assert.equal(identityModel.state, "invalid");
  assert.match(identityModel.failures.join("\n"), /direct-identity fields/i);

  const duplicateModel = buildCalibrationMonitoringModel({
    ...CALIBRATION_SEED_DATASET,
    datasetVersion: "DUPLICATE-FIXTURE",
    itemEvents: [
      ...CALIBRATION_SEED_DATASET.itemEvents,
      CALIBRATION_SEED_DATASET.itemEvents[0]
    ]
  });
  assert.equal(duplicateModel.state, "invalid");
  assert.match(duplicateModel.failures.join("\n"), /duplicate event/i);
});

test("the admin route exposes the calibration dashboard and its no-fake-evidence warning", () => {
  const adminSource = fs.readFileSync(
    new URL("../../src/components/AdminDashboardPage.jsx", import.meta.url),
    "utf8"
  );
  const panelSource = fs.readFileSync(
    new URL("../../src/components/admin/CalibrationMonitoringPanel.jsx", import.meta.url),
    "utf8"
  );
  assert.match(adminSource, /id: "calibration", label: "Calibration"/);
  assert.match(adminSource, /activeSection === "calibration".*CalibrationMonitoringPanel/s);
  assert.match(panelSource, /Synthetic demonstration data — not real child evidence/);
  assert.match(panelSource, /Specialist review required/);
  assert.match(panelSource, /Cells below/);
  assert.doesNotMatch(panelSource, /calibration complete|validated fair|proven unbiased/i);
});
