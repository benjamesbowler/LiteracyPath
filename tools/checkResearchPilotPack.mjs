import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const researchRoot = path.join(repoRoot, "docs", "research");
const manifestPath = path.join(researchRoot, "PACK_MANIFEST.json");
const traceabilityPath = path.join(repoRoot, "docs", "release", "TRACEABILITY.md");
const externalPath = path.join(repoRoot, "docs", "release", "EXTERNAL.md");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function requireText(content, needles, label, failures) {
  for (const needle of needles) {
    if (!content.toLowerCase().includes(needle.toLowerCase())) {
      failures.push(`${label}: missing required text ${needle}`);
    }
  }
}

export function inspectResearchPilotPack() {
  const failures = [];
  if (!fs.existsSync(manifestPath)) {
    return { failures: ["missing docs/research/PACK_MANIFEST.json"], fileCount: 0 };
  }

  let manifest;
  try {
    manifest = JSON.parse(read(manifestPath));
  } catch (error) {
    return { failures: [`PACK_MANIFEST.json is invalid JSON: ${error.message}`], fileCount: 0 };
  }

  if (manifest.schemaVersion !== 1) failures.push("manifest schemaVersion must be 1");
  if (manifest.itemId !== "A1.10") failures.push("manifest itemId must be A1.10");
  if (manifest.packStatus !== "EXTERNAL-READY") {
    failures.push("manifest packStatus must be EXTERNAL-READY");
  }
  if (manifest.humanExecutionStatus !== "not_started") {
    failures.push("human execution must remain not_started until real work is supplied");
  }
  if (manifest.humanResultsIncluded !== false || manifest.humanReviewCertified !== false) {
    failures.push("manifest must not claim human results or certification");
  }

  const requiredFiles = [
    "README.md",
    "MEASUREMENT_PLAN.md",
    "EXPERT_REVIEW_PROTOCOL.md",
    "PILOT_PROTOCOL.md",
    "CONSENT_AND_ASSENT_TEMPLATES.md",
    "DATA_DICTIONARY.md",
    "REVISION_WORKFLOW.md",
    "scripts/pilotData.mjs",
    "scripts/exportPilotDataset.mjs",
    "scripts/summarizePilotDataset.mjs"
  ];
  if (JSON.stringify(manifest.files) !== JSON.stringify(requiredFiles)) {
    failures.push("manifest files must exactly match the required execution pack");
  }
  for (const relativePath of requiredFiles) {
    const absolutePath = path.join(researchRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      failures.push(`missing ${relativePath}`);
      continue;
    }
    if (fs.statSync(absolutePath).size < 200) {
      failures.push(`${relativePath} is unexpectedly incomplete`);
    }
  }

  const metrics = [
    "accuracy",
    "latency",
    "retention",
    "transfer_to_unseen_items",
    "support_use",
    "subgroup_outcomes"
  ];
  if (JSON.stringify(manifest.requiredMetrics) !== JSON.stringify(metrics)) {
    failures.push("manifest requiredMetrics must list all six A1.10 outcomes");
  }

  const measurement = fs.existsSync(path.join(researchRoot, "MEASUREMENT_PLAN.md"))
    ? read(path.join(researchRoot, "MEASUREMENT_PLAN.md"))
    : "";
  requireText(measurement, [
    "Accuracy",
    "Latency",
    "Retention",
    "Transfer to unseen items",
    "Support use",
    "Subgroup outcomes",
    "missingness",
    "7–21 days",
    "prohibited"
  ], "MEASUREMENT_PLAN.md", failures);

  const expert = fs.existsSync(path.join(researchRoot, "EXPERT_REVIEW_PROTOCOL.md"))
    ? read(path.join(researchRoot, "EXPERT_REVIEW_PROTOCOL.md"))
    : "";
  requireText(expert, [
    "Reviewer eligibility and independence",
    "Complete review rubric",
    "all 30 skills",
    "critical",
    "requires empirical calibration"
  ], "EXPERT_REVIEW_PROTOCOL.md", failures);

  const pilot = fs.existsSync(path.join(researchRoot, "PILOT_PROTOCOL.md"))
    ? read(path.join(researchRoot, "PILOT_PROTOCOL.md"))
    : "";
  requireText(pilot, [
    "Child assent script",
    "Area 2 child-usability observation",
    "Teacher workflow protocol",
    "Safety, accessibility and incidents",
    "Deviations and data quality"
  ], "PILOT_PROTOCOL.md", failures);

  const consent = fs.existsSync(path.join(researchRoot, "CONSENT_AND_ASSENT_TEMPLATES.md"))
    ? read(path.join(researchRoot, "CONSENT_AND_ASSENT_TEMPLATES.md"))
    : "";
  requireText(consent, [
    "school permission",
    "parent or guardian",
    "child information and assent",
    "teacher participant consent",
    "withdrawal request",
    "not legal advice"
  ], "CONSENT_AND_ASSENT_TEMPLATES.md", failures);

  const dataDictionary = fs.existsSync(path.join(researchRoot, "DATA_DICTIONARY.md"))
    ? read(path.join(researchRoot, "DATA_DICTIONARY.md"))
    : "";
  requireText(dataDictionary, [
    "Privacy boundary",
    "Canonical JSON root",
    "itemEvents",
    "isUnseenTransfer",
    "small-cell suppression",
    "performs no imputation"
  ], "DATA_DICTIONARY.md", failures);

  const revision = fs.existsSync(path.join(researchRoot, "REVISION_WORKFLOW.md"))
    ? read(path.join(researchRoot, "REVISION_WORKFLOW.md"))
    : "";
  requireText(revision, [
    "Severity",
    "Triage and containment",
    "Root-cause categories",
    "Verification",
    "Study impact decisions",
    "EXTERNAL-CLOSED"
  ], "REVISION_WORKFLOW.md", failures);

  const forbiddenFileNames = fs.existsSync(researchRoot)
    ? fs.readdirSync(researchRoot, { recursive: true })
      .map(value => String(value))
      .filter(value => /(?:human[-_ ]?)?(?:results|outcomes)\.(?:csv|json|xlsx)$/i.test(value))
    : [];
  if (forbiddenFileNames.length) {
    failures.push(`human results files must not be fabricated: ${forbiddenFileNames.join(", ")}`);
  }

  const traceability = fs.existsSync(traceabilityPath) ? read(traceabilityPath) : "";
  if (!/\| A1\.10 \| 1 \| P1 EXTERNAL \| EXTERNAL-READY \|/.test(traceability)) {
    failures.push("TRACEABILITY.md must list A1.10 as EXTERNAL-READY");
  }
  const external = fs.existsSync(externalPath) ? read(externalPath) : "";
  if (!/\| A1\.10 \|[^|]+\| EXTERNAL-READY \|/.test(external)) {
    failures.push("EXTERNAL.md must list A1.10 as EXTERNAL-READY");
  }
  if (!/human execution not started/i.test(external)) {
    failures.push("EXTERNAL.md must state that A1.10 human execution has not started");
  }

  return {
    failures,
    fileCount: requiredFiles.length + 1,
    metrics,
    status: manifest.packStatus
  };
}

const result = inspectResearchPilotPack();
if (result.failures.length) {
  console.error("Research pilot pack failed:");
  result.failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Research pilot pack passed: ${result.fileCount} complete artifacts`);
  console.log(`Required outcomes covered: ${result.metrics.join(", ")}`);
  console.log("Pack status: EXTERNAL-READY; human execution not started");
}
