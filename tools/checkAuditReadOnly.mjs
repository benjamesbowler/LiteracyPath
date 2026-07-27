import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { RELEASE_GATES } from "./releaseGate.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const failures = [];

const releaseAuditGateIds = [
  "assessment-question-integrity",
  "assessment-runtime-variation",
  "strict-curriculum",
  "skill-progression",
  "repo-hygiene"
];
for (const gateId of releaseAuditGateIds) {
  const gate = RELEASE_GATES.find(item => item.id === gateId);
  const command = gate?.command?.join(" ") || "";
  if (!command.includes("--check")) {
    failures.push(`${gateId} does not invoke explicit --check mode.`);
  }
}

for (const [name, commandValue] of Object.entries(packageJson.scripts || {})) {
  const command = String(commandValue);
  if (!command.includes("runAuditScript.mjs --write-report")) continue;
  const checkName = `check:${name}`;
  const checkCommand = String(packageJson.scripts?.[checkName] || "");
  const target = command.split("--write-report ")[1]?.split(/\s+/)[0] || "";
  if (!checkCommand.includes(`runAuditScript.mjs --check ${target}`)) {
    failures.push(`${name} is missing paired ${checkName} --check mode for ${target}.`);
  }
}

const originalFixturePath = path.join(repoRoot, "docs", "validation", "audit-mode-fixture.txt");
const artifactFixturePath = path.join(
  repoRoot,
  "docs",
  "release",
  "artifacts",
  "audits",
  "auditWriteFixture",
  "repo",
  "docs",
  "validation",
  "audit-mode-fixture.txt"
);
if (fs.existsSync(originalFixturePath)) {
  failures.push("Fixture precondition failed: docs/validation/audit-mode-fixture.txt already exists.");
}
fs.rmSync(artifactFixturePath, { force: true });
const smoke = spawnSync(
  process.execPath,
  [
    "tools/runAuditScript.mjs",
    "--check",
    "tests/fixtures/auditWriteFixture.mjs"
  ],
  { cwd: repoRoot, encoding: "utf8" }
);
if (smoke.status !== 0) {
  failures.push(`Audit write-guard smoke failed: ${smoke.stderr || smoke.stdout}`);
}
if (fs.existsSync(originalFixturePath)) {
  failures.push("Check mode wrote the fixture into tracked docs/validation.");
}
if (!fs.existsSync(artifactFixturePath)) {
  failures.push("Check mode did not redirect the fixture into docs/release/artifacts.");
}

if (failures.length) {
  console.error("Read-only audit mode contract failed:");
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Read-only audit mode contract passed.");
  console.log(`Paired report/check scripts: ${
    Object.values(packageJson.scripts).filter(command =>
      String(command).includes("runAuditScript.mjs --write-report")
    ).length
  }`);
}
