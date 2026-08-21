import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  canonicalQuestHumanObservation,
  evaluateQuestHumanAcceptance,
  QUEST_HUMAN_PROFILES,
  validateQuestHumanObservation
} from "../src/utils/questHumanAcceptance.js";
import { questAcceptanceReportPath } from "./lib/releaseArtifactPaths.mjs";

const evidenceDir = path.resolve("docs/validation/quest-human-acceptance");
const reportPath = questAcceptanceReportPath("quest_human_acceptance.md");
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
  "# Sound Seekers Continuous Human Observation",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "No direct child or adult identifiers are permitted in these records.",
  "",
  "| Evidence area | Observation status | Records | Coverage checks |",
  "| --- | --- | ---: | --- |"
];
for (const profile of QUEST_HUMAN_PROFILES) {
  const profileRecords = records.filter(record => record.profileId === profile).length;
  const checks = result.categories[profile] || [];
  lines.push(`| ${profile} | ${result.categoryStatus[profile].toUpperCase()} | ${profileRecords} | ${checks.map(check => `${check.id}: ${check.pass ? "pass" : check.detail}`).join("; ")} |`);
}
lines.push(
  "",
  `Coverage: ${result.status.toUpperCase()} (${result.validRecords} valid records, ${result.invalidRecords} invalid records, ${result.duplicateRecords} duplicate records)`,
  "",
  "Observation is continuous and pass-by-exception. Missing cohort coverage does not create a publication queue. Invalid or duplicate evidence fails this integrity check; a reported product defect is quarantined through the release issue. Individual children are never labelled pass or fail."
);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);

if (failures.length) {
  console.error("Sound Seekers human-observation integrity failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(
  `Sound Seekers continuous observation accepted: ${result.validRecords} valid records; `
  + `${result.status === "pass" ? "target coverage reached" : "coverage is still growing"}.`
);
