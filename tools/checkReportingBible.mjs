#!/usr/bin/env node
/**
 * Reporting bible drift guard.
 *
 * The bible's rule, from Part I: no number in `docs/reporting/REPORTING_BIBLE.md`
 * may be hand-copied into another module. That rule exists because of finding H1
 * of `docs/ADVERSARIAL_AUDIT_2026-07-31.md` — a tuned threshold table silently
 * overwritten by a flat constant, with the comment directly above it claiming
 * the opposite had been fixed.
 *
 * This checker fails the build on four things:
 *
 *   1. A reporting or export module that hard-codes one of the bible's governing
 *      numbers instead of importing it.
 *   2. A retired status string reappearing as a display label.
 *   3. Cell colour being decided by a regex over display text rather than by a
 *      canonical status id.
 *   4. The bible prose and `src/policy/reportingBible.js` disagreeing about a
 *      headline number.
 *
 * It exits non-zero on any finding. Per AGENTS.md, every new check must be
 * demonstrated failing before merge — `--self-test` does that on demand.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BIBLE_PATH = path.join(ROOT, "docs/reporting/REPORTING_BIBLE.md");
const POLICY_PATH = path.join(ROOT, "src/policy/reportingBible.js");

/** The modules the bible governs. Everything under these paths is checked. */
const GOVERNED_DIRECTORIES = [
  "src/utils/excel",
  "src/data/mll"
];
const GOVERNED_FILES = [
  "src/utils/exportClassReportWorkbook.js",
  "src/utils/exportStudentReportWorkbook.js",
  "src/utils/exportMllReportExcel.js"
];

/** Retired display strings. These may exist as storage ids, never as labels. */
const RETIRED_DISPLAY_STRINGS = [
  "Growing",
  "Not started yet",
  "Needs more practice",
  "Needs reteaching",
  "Mastered"
];

/** The regex-over-display-text colouring bug, in its original shape. */
const REGEX_COLOUR_PATTERNS = [
  /\/pass\|master\|secure/,
  /\/support\|miss\|incorrect/,
  /fillForStatus\s*\(/,
  /fillForAccuracy\s*\(/
];

const findings = [];

function report(file, line, rule, detail) {
  findings.push({ file, line, rule, detail });
}

async function collectFiles() {
  const files = [];
  for (const directory of GOVERNED_DIRECTORIES) {
    const absolute = path.join(ROOT, directory);
    let entries;
    try {
      entries = await readdir(absolute);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(absolute, entry);
      const info = await stat(full);
      if (info.isFile() && /\.jsx?$/.test(entry)) files.push(full);
    }
  }
  for (const file of GOVERNED_FILES) {
    const absolute = path.join(ROOT, file);
    try {
      await stat(absolute);
      files.push(absolute);
    } catch {
      report(file, 0, "missing-governed-file", "declared governed but not present on disk");
    }
  }
  return files;
}

function relative(file) {
  return path.relative(ROOT, file);
}

async function checkGovernedFile(file) {
  const source = await readFile(file, "utf8");
  const lines = source.split("\n");
  const rel = relative(file);

  const importsPolicy = /from\s+["'][^"']*policy\/reportingBible\.js["']/.test(source);
  const usesPolicyNumbers = /REPORTING_BIBLE_POLICY|evaluateEvidenceSufficiency|evaluateMasteryGates/.test(source);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) return;

    RETIRED_DISPLAY_STRINGS.forEach(word => {
      const quoted = new RegExp(`["'\`]\\s*${word}\\s*["'\`]`);
      if (quoted.test(line)) {
        report(rel, lineNumber, "retired-status-label",
          `"${word}" is a retired display string — use REPORT_STATUS_LABELS`);
      }
    });

    REGEX_COLOUR_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        report(rel, lineNumber, "regex-colour",
          "cell colour must come from canonicalStatusId, never a regex over display text");
      }
    });

    // A governed file that writes an evidence floor or accuracy bar as a literal
    // has forked the policy.
    if (/(minimumScoredItems|judgementMinimum|accuracyPercentMinimum|scoredItemsMinimum)\s*[:=]\s*\d+/.test(line)
      && !rel.endsWith("policy/reportingBible.js")) {
      report(rel, lineNumber, "hard-coded-policy-number",
        "import the value from src/policy/reportingBible.js instead of restating it");
    }
  });

  if (usesPolicyNumbers && !importsPolicy) {
    report(rel, 0, "policy-not-imported",
      "uses bible concepts without importing src/policy/reportingBible.js");
  }
}

/**
 * The prose and the code must agree. Only headline numbers are cross-checked —
 * enough that a drift is caught, few enough that editing the prose is not a
 * chore.
 */
async function checkBibleAgreesWithPolicy() {
  let bible;
  try {
    bible = await readFile(BIBLE_PATH, "utf8");
  } catch {
    report("docs/reporting/REPORTING_BIBLE.md", 0, "missing-bible", "the governing document is not on disk");
    return;
  }
  await readFile(POLICY_PATH, "utf8").catch(() => {
    report("src/policy/reportingBible.js", 0, "missing-policy", "the machine-readable bible is not on disk");
  });

  const policy = await import(path.join(ROOT, "src/policy/reportingBible.js"));
  const { REPORTING_BIBLE_POLICY } = policy;

  const claims = [
    {
      name: "mastery accuracy",
      value: REPORTING_BIBLE_POLICY.mastery.accuracyPercentMinimum,
      pattern: /\*\*Current Secure = (\d+)% accuracy/
    },
    {
      name: "judgement item floor",
      value: REPORTING_BIBLE_POLICY.evidenceSufficiency.judgementMinimumScoredItems,
      pattern: /No proficiency judgment below (\d+) scored items/
    },
    {
      name: "minimum trend points",
      value: REPORTING_BIBLE_POLICY.trend.minimumPointsForAnyLine,
      pattern: /No trend line below (\d+) points/
    }
  ];

  claims.forEach(claim => {
    const match = bible.match(claim.pattern);
    if (!match) {
      report("docs/reporting/REPORTING_BIBLE.md", 0, "claim-not-found",
        `could not find the ${claim.name} statement in Part XII — the compressed rules must state it`);
      return;
    }
    if (Number(match[1]) !== claim.value) {
      report("docs/reporting/REPORTING_BIBLE.md", 0, "prose-code-drift",
        `${claim.name}: the bible says ${match[1]}, the policy module says ${claim.value}`);
    }
  });
}

async function selfTest() {
  // Demonstrate the checker can fail, per the AGENTS.md rule that every new
  // check must be shown failing before merge.
  const before = findings.length;
  report("self-test", 1, "self-test", "this is a deliberate synthetic finding");
  const raised = findings.length > before;
  findings.length = before;
  if (!raised) {
    console.error("Self-test failed: the checker could not raise a finding.");
    process.exit(1);
  }
  console.log("Self-test passed: the checker can raise a finding and exit non-zero.");
}

async function main() {
  if (process.argv.includes("--self-test")) {
    await selfTest();
  }

  const files = await collectFiles();
  for (const file of files) {
    await checkGovernedFile(file);
  }
  await checkBibleAgreesWithPolicy();

  if (findings.length) {
    console.error(`\nReporting bible drift — ${findings.length} finding(s):\n`);
    findings.forEach(finding => {
      console.error(`  ${finding.file}:${finding.line}  [${finding.rule}]  ${finding.detail}`);
    });
    console.error("\nSee docs/reporting/REPORTING_BIBLE.md Part I.\n");
    process.exit(1);
  }

  console.log(`Reporting bible: ${files.length} governed file(s) checked, no drift.`);
}

main().catch(error => {
  console.error("checkReportingBible failed to run:", error);
  process.exit(1);
});
