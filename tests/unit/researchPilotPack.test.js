import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createPilotCsvExports,
  summarizePilotDataset,
  validatePilotDataset
} from "../../docs/research/scripts/pilotData.mjs";
import { exportPilotDataset } from "../../docs/research/scripts/exportPilotDataset.mjs";

function iso(day, hour = 9) {
  return `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:00:00.000Z`;
}

function createDataset() {
  const children = Array.from({ length: 5 }, (_, index) => ({
    participantCode: `P-C${index + 1}`,
    participantType: "child",
    ageBand: "5-6",
    gradeBand: "year-1",
    multilingualLearner: index < 2,
    additionalSupport: index === 4,
    cohortCode: "COHORT-A",
    deviceClass: "chromebook",
    schoolApprovalRef: "SCHOOL-APPROVAL-01",
    guardianConsentAt: iso(1, 8),
    childAssentAt: iso(2, 8),
    teacherConsentAt: null,
    withdrawnAt: null
  }));
  const teacher = {
    participantCode: "P-T1",
    participantType: "teacher",
    ageBand: "adult",
    gradeBand: "adult",
    multilingualLearner: null,
    additionalSupport: null,
    cohortCode: "COHORT-A",
    deviceClass: "desktop",
    schoolApprovalRef: "SCHOOL-APPROVAL-01",
    guardianConsentAt: null,
    childAssentAt: null,
    teacherConsentAt: iso(1, 8),
    withdrawnAt: null
  };
  const sessions = [];
  const itemEvents = [];
  children.forEach((participant, participantIndex) => {
    const phases = [
      ["pre", 2, "FORM-PRE"],
      ["post", 3, "FORM-POST"],
      ["retention", 10, "FORM-RETENTION"],
      ["transfer", 10, "FORM-TRANSFER"]
    ];
    phases.forEach(([phase, day, formId], phaseIndex) => {
      const sessionId = `S-${participant.participantCode}-${phase}`;
      sessions.push({
        sessionId,
        participantCode: participant.participantCode,
        phase,
        startedAt: iso(day, 9 + phaseIndex),
        completedAt: iso(day, 10 + phaseIndex),
        facilitatorCode: "F-01",
        appReleaseId: "release-test",
        curriculumVersion: "curriculum-test",
        deviceClass: "chromebook",
        accessibilityAdjustments: [],
        sessionStatus: "completed",
        assentConfirmedAt: iso(day, 8)
      });
      itemEvents.push({
        eventId: `E-${participant.participantCode}-${phase}`,
        sessionId,
        participantCode: participant.participantCode,
        phase,
        skillId: "initial_sounds",
        itemKey: phase === "transfer" ? `unseen-${participantIndex}` : `${phase}-${participantIndex}`,
        formId,
        responseStatus: phase === "pre" && participantIndex > 2 ? "incorrect" : "correct",
        latencyMs: 1000 + participantIndex * 100,
        supportStages: phase === "pre" && participantIndex === 4 ? ["whole_word_audio"] : [],
        supportInitiator: phase === "pre" && participantIndex === 4 ? "child" : "none",
        isUnseenTransfer: phase === "transfer",
        selfCorrected: false,
        observedAt: iso(day, 9 + phaseIndex)
      });
    });
  });
  sessions.push({
    sessionId: "S-P-C1-usability",
    participantCode: "P-C1",
    phase: "usability_first",
    startedAt: iso(2, 14),
    completedAt: iso(2, 15),
    facilitatorCode: "F-01",
    appReleaseId: "release-test",
    curriculumVersion: "curriculum-test",
    deviceClass: "chromebook",
    accessibilityAdjustments: [],
    sessionStatus: "completed",
    assentConfirmedAt: iso(2, 13)
  });
  sessions.push({
    sessionId: "S-P-T1-workflow",
    participantCode: "P-T1",
    phase: "teacher_workflow",
    startedAt: iso(4, 9),
    completedAt: iso(4, 10),
    facilitatorCode: "F-02",
    appReleaseId: "release-test",
    curriculumVersion: "curriculum-test",
    deviceClass: "desktop",
    accessibilityAdjustments: [],
    sessionStatus: "completed",
    assentConfirmedAt: null
  });

  return {
    schemaVersion: 1,
    study: {
      studyId: "LP-PILOT-TEST",
      protocolVersion: "1.0-test",
      packCommit: "test-commit",
      appReleaseId: "release-test",
      curriculumVersion: "curriculum-test",
      exportedAt: iso(11, 12)
    },
    participants: [...children, teacher],
    sessions,
    itemEvents,
    usabilityObservations: [{
      observationId: "O-1",
      sessionId: "S-P-C1-usability",
      participantCode: "P-C1",
      taskId: "U-NEXT",
      taskState: "independent",
      durationSeconds: 12,
      navigationErrors: 0,
      adultPrompts: 0,
      confusionCodes: [],
      accessibilityBarrierCodes: [],
      recoverySucceeded: null,
      affect: "comfortable",
      quoteRedacted: "I know where to go.",
      observedAt: iso(2, 14)
    }],
    teacherFeedback: [{
      feedbackId: "TF-1",
      sessionId: "S-P-T1-workflow",
      participantCode: "P-T1",
      taskId: "VIEW-SUPPORT",
      taskState: "independent",
      durationSeconds: 45,
      errors: 0,
      helpRequests: 0,
      confidenceRating: 4,
      workloadRating: 2,
      issueCodes: [],
      commentRedacted: "The support stages were clear.",
      observedAt: iso(4, 9)
    }],
    deviations: []
  };
}

test("the canonical pilot dataset validates and exports every declared table", () => {
  const dataset = createDataset();
  const validation = validatePilotDataset(dataset);
  const exports = createPilotCsvExports(dataset);

  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.deepEqual(Object.keys(exports), [
    "participants.csv",
    "sessions.csv",
    "item_events.csv",
    "usability_observations.csv",
    "teacher_feedback.csv",
    "deviations.csv"
  ]);
  assert.equal(exports["participants.csv"].rowCount, 6);
  assert.match(exports["item_events.csv"].content, /"isUnseenTransfer"/);
  assert.doesNotMatch(exports["participants.csv"].content, /guardianConsentAt|childAssentAt/);
});

test("validation fails closed on identifiers, missing consent and exposed transfer items", () => {
  const dataset = createDataset();
  dataset.participants[0].studentName = "Identifying child";
  dataset.participants[0].guardianConsentAt = null;
  dataset.itemEvents.find(event => event.phase === "transfer").itemKey =
    dataset.itemEvents.find(event => event.phase === "pre").itemKey;

  const validation = validatePilotDataset(dataset);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.includes("direct identifier keys")));
  assert.ok(validation.errors.some(error => error.includes("guardianConsentAt")));
  assert.ok(validation.errors.some(error => error.includes("previously exposed")));
});

test("descriptive summaries preserve denominators and suppress subgroup cells below five", () => {
  const summary = summarizePilotDataset(createDataset(), { minimumSubgroupSize: 5 });

  assert.equal(summary.descriptiveOnly, true);
  assert.equal(summary.causalClaim, false);
  assert.equal(summary.imputationPerformed, false);
  assert.equal(summary.phaseMetrics.pre.accuracyDenominator, 5);
  assert.equal(summary.phaseMetrics.pre.accuracyNumerator, 3);
  assert.equal(summary.phaseMetrics.pre.accuracy, 0.6);
  assert.equal(summary.phaseMetrics.transfer.participants, 5);
  assert.equal(summary.subgroupOutcomes.cohortCode["COHORT-A"].suppressed, false);
  assert.equal(summary.subgroupOutcomes.multilingualLearner.yes.suppressed, true);
  assert.equal(summary.subgroupOutcomes.multilingualLearner.no.suppressed, true);
});

test("the file exporter writes de-identified tables and a verifiable manifest", async () => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), "lp-pilot-pack-"));
  const inputPath = path.join(temporaryRoot, "capture.json");
  const outputDirectory = path.join(temporaryRoot, "export");
  await fs.writeFile(inputPath, `${JSON.stringify(createDataset(), null, 2)}\n`, "utf8");

  try {
    const result = await exportPilotDataset({ inputPath, outputDirectory });
    const manifest = JSON.parse(
      await fs.readFile(path.join(outputDirectory, "export-manifest.json"), "utf8")
    );
    assert.equal(result.manifest.validationPassed, true);
    assert.equal(manifest.deidentified, true);
    assert.equal(manifest.humanResultsSimulated, false);
    assert.equal(manifest.files["participants.csv"].rows, 6);
    assert.match(manifest.files["analysis-ready.json"].sha256, /^[a-f0-9]{64}$/);
  } finally {
    await fs.rm(temporaryRoot, { recursive: true, force: true });
  }
});
