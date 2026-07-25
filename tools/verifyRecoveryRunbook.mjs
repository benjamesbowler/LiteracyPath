import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runbookPath = path.join(repoRoot, "docs", "ops", "RECOVERY_RUNBOOK.md");
const drillPath = path.join(repoRoot, "tools", "recoveryDrill.mjs");

const runbook = fs.readFileSync(runbookPath, "utf8");
const drill = fs.readFileSync(drillPath, "utf8");
const requiredRunbookTerms = [
  "RPO",
  "RTO",
  "isolated",
  "classes",
  "assessment_attempts",
  "el_assessment_reports",
  "data-rights",
  "LP_RECOVERY_DRILL_CONFIRM",
  "restore-drill.json"
];
const missing = requiredRunbookTerms.filter(term => !runbook.includes(term));
if (missing.length) {
  console.error(`Recovery runbook is missing: ${missing.join(", ")}`);
  process.exit(1);
}
for (const unsafe of ["console.log(sourceUrl", "console.log(targetUrl"]) {
  if (drill.includes(unsafe)) {
    console.error(`Recovery drill contains an unsafe secret-handling pattern: ${unsafe}`);
    process.exit(1);
  }
}
console.log("Recovery runbook and isolated-drill safety contract verified.");
