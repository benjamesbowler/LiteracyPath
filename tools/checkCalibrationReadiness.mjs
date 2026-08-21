import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  CALIBRATION_MONITORING_POLICY,
  CALIBRATION_MONITORING_VERSION,
  CALIBRATION_SEED_DATASET,
  CALIBRATION_SEED_VERSION,
  buildCalibrationMonitoringModel
} from "../src/data/calibrationMonitoringModel.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const researchRoot = path.join(repoRoot, "docs", "research");
const manifestPath = path.join(researchRoot, "CALIBRATION_PACK_MANIFEST.json");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

function requireText(content, needles, label, failures) {
  for (const needle of needles) {
    if (!content.toLowerCase().includes(needle.toLowerCase())) {
      failures.push(`${label}: missing required text ${needle}`);
    }
  }
}

function inspectManifest(failures) {
  if (!fs.existsSync(manifestPath)) {
    failures.push("Missing docs/research/CALIBRATION_PACK_MANIFEST.json.");
    return null;
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    failures.push(`CALIBRATION_PACK_MANIFEST.json is invalid JSON: ${error.message}`);
    return null;
  }
  const expectedDomains = [
    "item_difficulty",
    "threshold_validation",
    "false_positive_reteach_adjudication",
    "subgroup_performance",
    "differential_item_behavior"
  ];
  if (manifest.schemaVersion !== 1) failures.push("Calibration manifest schemaVersion must be 1.");
  if (manifest.itemId !== "A4.10") failures.push("Calibration manifest itemId must be A4.10.");
  if (manifest.protocolVersion !== CALIBRATION_MONITORING_VERSION) {
    failures.push("Calibration manifest protocolVersion is stale.");
  }
  if (manifest.monitoringVersion !== CALIBRATION_MONITORING_VERSION) {
    failures.push("Calibration manifest monitoringVersion is stale.");
  }
  if (manifest.seedDatasetVersion !== CALIBRATION_SEED_VERSION) {
    failures.push("Calibration manifest seedDatasetVersion is stale.");
  }
  if (manifest.packStatus !== "ACTIVE") {
    failures.push("Calibration packStatus must be ACTIVE.");
  }
  if (manifest.humanExecutionStatus !== "ongoing_pass_by_exception") {
    failures.push("Calibration human execution must remain ongoing_pass_by_exception.");
  }
  if (
    manifest.humanResultsIncluded !== false
    || manifest.humanReviewCertified !== false
    || manifest.seededPreviewIsChildEvidence !== false
  ) {
    failures.push("Calibration manifest must not claim human results, certification, or child evidence.");
  }
  if (JSON.stringify(manifest.monitoringDomains) !== JSON.stringify(expectedDomains)) {
    failures.push("Calibration manifest must list all five A4.10 monitoring domains.");
  }
  for (const relativePath of manifest.files || []) {
    const absolutePath = path.resolve(researchRoot, relativePath);
    if (!absolutePath.startsWith(`${repoRoot}${path.sep}`)) {
      failures.push(`Calibration manifest file escapes the repository: ${relativePath}`);
      continue;
    }
    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size < 200) {
      failures.push(`Calibration manifest file is missing or incomplete: ${relativePath}`);
    }
  }
  return manifest;
}

export function inspectCalibrationReadiness() {
  const failures = [];
  const manifest = inspectManifest(failures);
  const protocol = read("docs/research/CALIBRATION_PROTOCOL.md");
  const admin = read("src/components/AdminDashboardPage.jsx");
  const adminNavigation = read("src/appState/adminQaNavigation.js");
  const panel = read("src/components/admin/CalibrationMonitoringPanel.jsx");

  requireText(protocol, [
    "Purpose and limits",
    "Required independent team",
    "Frozen materials",
    "Item-difficulty analysis",
    "Threshold validation",
    "False-positive reteach review",
    "Subgroup reporting",
    "Differential item behavior",
    "Missingness, exclusions, and data quality",
    "Required signed calibration record",
    "EXTERNAL-CLOSED",
    "10/10 pending external",
    "cannot establish validity"
  ], "CALIBRATION_PROTOCOL.md", failures);
  requireText(panel, [
    "Calibration monitoring",
    "Synthetic demonstration data — not real child evidence",
    "Specialist review required",
    "Descriptive only; no causal claim",
    "Screening flags, not bias findings",
    "none adjudicated"
  ], "CalibrationMonitoringPanel.jsx", failures);
  if (/activeSection === ["']calibration["']/.test(admin) || /<CalibrationMonitoringPanel/.test(admin)) {
    failures.push(
      "Synthetic calibration preview must stay out of operational Admin navigation."
    );
  }
  requireText(adminNavigation, [
    '"/admin/app/assessment-consistency": "operations"'
  ], "adminQaNavigation.js", failures);

  const forbiddenResearchResults = fs.readdirSync(researchRoot, { recursive: true })
    .map(value => String(value))
    .filter(value => /calibration[-_ ]?(?:human[-_ ]?)?(?:results|outcomes)\.(?:csv|json|xlsx)$/i.test(value));
  if (forbiddenResearchResults.length) {
    failures.push(`Human calibration results must not be fabricated: ${forbiddenResearchResults.join(", ")}`);
  }

  const model = buildCalibrationMonitoringModel(CALIBRATION_SEED_DATASET);
  if (model.state !== "seeded_preview" || model.failures.length) {
    failures.push(`Seeded calibration model failed: ${model.failures.join("; ") || model.state}`);
  }
  if (
    model.summary?.participants !== 72
    || model.summary?.itemEvents !== 1440
    || model.summary?.items !== 10
  ) {
    failures.push("Seeded calibration model no longer exposes the complete 72/1,440/10 preview.");
  }
  if (!model.summary?.reteachReviewCandidates || !model.summary?.differentialReviewCandidates) {
    failures.push("Seeded calibration preview must exercise both review queues.");
  }
  if (
    model.interpretationRules?.seededResultsAreClaims !== false
    || model.interpretationRules?.subgroupDifferencesAreCausal !== false
    || model.interpretationRules?.differentialFlagsAreBiasFindings !== false
    || model.interpretationRules?.reteachCandidatesAreConfirmedErrors !== false
    || model.interpretationRules?.specialistDecisionRequired !== true
  ) {
    failures.push("Calibration interpretation safeguards have drifted.");
  }
  if (
    CALIBRATION_MONITORING_POLICY.minimumSubgroupParticipants < 5
    || model.subgroupRows.some(row => row.suppressed && row.accuracy !== null)
  ) {
    failures.push("Calibration small-cell suppression is unsafe.");
  }
  if (model.reteachMonitoring?.adjudicatedCount !== 0) {
    failures.push("Seeded reteach candidates must remain unadjudicated.");
  }
  if (model.differentialRows.some(row => row.reviewCandidate && row.status !== "specialist_review")) {
    failures.push("Differential screening may only open specialist review.");
  }

  return {
    failures,
    manifest,
    summary: model.summary
  };
}

const result = inspectCalibrationReadiness();
if (result.failures.length) {
  console.error(result.failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Calibration continuous-observation check passed.");
  console.log(`Seeded preview: ${result.summary.participants} participants, ${result.summary.itemEvents} events, ${result.summary.items} items.`);
  console.log(`Review queues: ${result.summary.reteachReviewCandidates} reteach, ${result.summary.differentialReviewCandidates} differential item.`);
  console.log("Human execution: ongoing pass-by-exception; seeded preview is not child evidence.");
}
