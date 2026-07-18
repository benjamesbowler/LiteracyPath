import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalQuestHumanObservation,
  evaluateQuestHumanAcceptance,
  QUEST_HUMAN_PROFILES,
  validateQuestHumanObservation
} from "../src/utils/questHumanAcceptance.js";

const allowMissing = process.argv.includes("--allow-missing");
const evidenceDir = path.resolve("docs/validation/quest-human-acceptance");
const reportPath = path.resolve("docs/validation/quest_human_acceptance.md");
const records = [];
const failures = [];

for (const fileName of fs.existsSync(evidenceDir) ? fs.readdirSync(evidenceDir).filter(name => name.endsWith(".json") && !name.endsWith(".example.json")).sort() : []) {
  try {
    const record = JSON.parse(fs.readFileSync(path.join(evidenceDir, fileName), "utf8"));
    const expectedHash = createHash("sha256").update(canonicalQuestHumanObservation(record)).digest("hex");
    const validation = validateQuestHumanObservation(record);
    if (record.evidenceHash !== expectedHash) failures.push(`${fileName}: evidence hash is missing or invalid`);
    if (validation.status !== "valid") failures.push(`${fileName}: ${validation.failures.join(", ")}`);
    records.push(record);
  } catch (error) {
    failures.push(`${fileName}: ${error.message}`);
  }
}

const result = evaluateQuestHumanAcceptance(records);
if (result.duplicateRecords) failures.push(`${result.duplicateRecords} duplicate profile/session record(s) were excluded`);
const lines = [
  "# Sound Seekers Human Acceptance",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "No direct child or adult identifiers are permitted in these records.",
  "",
  "| Evidence area | Status | Records | Acceptance checks |",
  "| --- | --- | ---: | --- |"
];
for (const profile of QUEST_HUMAN_PROFILES) {
  const profileRecords = records.filter(record => record.profileId === profile).length;
  const checks = result.categories[profile] || [];
  lines.push(`| ${profile} | ${result.categoryStatus[profile].toUpperCase()} | ${profileRecords} | ${checks.map(check => `${check.id}: ${check.pass ? "pass" : check.detail}`).join("; ")} |`);
}
lines.push(
  "",
  `Overall: ${result.status.toUpperCase()} (${result.validRecords} valid records, ${result.invalidRecords} invalid records, ${result.duplicateRecords} duplicate records)`,
  "",
  "The aggregate gate requires eight first-use child sessions, six repeat-play sessions, eight reward-choice observations, five adult report interpretations, and three distinct classroom-audio environments. Individual children are never labelled pass or fail."
);
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

if (!allowMissing && result.status !== "pass") failures.push("the complete human acceptance matrix is not yet satisfied");
if (failures.length) {
  console.error("Sound Seekers human acceptance failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(result.status === "pass"
  ? `Sound Seekers human acceptance passed (${result.validRecords} records).`
  : `Sound Seekers human evidence harness ready; acceptance remains ${result.validRecords} records / incomplete.`);
