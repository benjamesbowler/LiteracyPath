import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalQuestDeviceEvidence,
  evaluateQuestDeviceEvidence,
  QUEST_DEVICE_RELEASE_PROFILES
} from "../src/utils/questDeviceAcceptance.js";

const allowMissing = process.argv.includes("--allow-missing");
const evidenceDir = path.resolve("docs/validation/quest-device-acceptance");
const reportPath = path.resolve("docs/validation/quest_device_acceptance.md");
const failures = [];
const records = [];

for (const fileName of fs.existsSync(evidenceDir) ? fs.readdirSync(evidenceDir).filter(name => name.endsWith(".json")).sort() : []) {
  const filePath = path.join(evidenceDir, fileName);
  try {
    const evidence = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const expectedHash = createHash("sha256").update(canonicalQuestDeviceEvidence(evidence)).digest("hex");
    const evaluation = evaluateQuestDeviceEvidence(evidence);
    const hashValid = evidence.evidenceHash === expectedHash;
    if (!hashValid) failures.push(`${fileName}: evidence hash is missing or does not match the record`);
    if (evaluation.status !== "pass") failures.push(`${fileName}: ${evaluation.failures.join(", ")}`);
    if (evidence.evaluation?.status !== evaluation.status) failures.push(`${fileName}: stored evaluation does not match current policy`);
    records.push({ fileName, evidence, evaluation, hashValid });
  } catch (error) {
    failures.push(`${fileName}: ${error.message}`);
  }
}

const accepted = new Map();
for (const profileId of QUEST_DEVICE_RELEASE_PROFILES) {
  const record = records.find(item =>
    item.evidence.profileId === profileId
    && item.evidence.runMode === "release"
    && item.evidence.physicalDevice === true
    && item.evaluation.status === "pass"
    && item.hashValid);
  if (record) accepted.set(profileId, record);
  else if (!allowMissing) failures.push(`${profileId}: no passing physical release record`);
}

const lines = [
  "# Sound Seekers Device Acceptance",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "| Profile | Status | Device | Operator | Duration | Frame average | Long frames | Input p95 |",
  "| --- | --- | --- | --- | ---: | ---: | ---: | ---: |"
];
for (const profileId of QUEST_DEVICE_RELEASE_PROFILES) {
  const record = accepted.get(profileId);
  if (!record) {
    lines.push(`| ${profileId} | MISSING | - | - | - | - | - | - |`);
    continue;
  }
  const value = record.evidence;
  lines.push(`| ${profileId} | PASS | ${value.device.model} / ${value.device.os} | ${value.operator} | ${Math.round(value.durationMs / 60000)} min | ${Number(value.telemetry.averageFrameMs || 0).toFixed(1)} ms | ${(Number(value.telemetry.longFrameRate || 0) * 100).toFixed(1)}% | ${Math.round(value.input.p95Ms || 0)} ms |`);
}
lines.push(
  "",
  `Accepted profiles: ${accepted.size}/${QUEST_DEVICE_RELEASE_PROFILES.length}`,
  "",
  "A profile passes only with a 20-minute physical-device record, operator and device identity, stable renderer and memory evidence, bounded input latency, no uncaught/context/offline-shell errors, non-regressing progress, and a recovered network interruption."
);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

if (failures.length) {
  console.error("Sound Seekers device acceptance failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (accepted.size < QUEST_DEVICE_RELEASE_PROFILES.length) {
  console.log(`Sound Seekers device harness ready; physical acceptance remains ${accepted.size}/${QUEST_DEVICE_RELEASE_PROFILES.length}.`);
} else {
  console.log(`Sound Seekers physical device acceptance passed (${accepted.size}/${QUEST_DEVICE_RELEASE_PROFILES.length}).`);
}
