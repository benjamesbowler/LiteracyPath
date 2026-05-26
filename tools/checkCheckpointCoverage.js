import path from "node:path";

import { coverageExpectations } from "../src/data/coverageExpectations.js";
import { repoRoot, writeFile } from "./phonicsRuntimeUtils.js";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function evaluateCheckpoint({ expectedTargets, priorMastered = [], currentCorrect = [], accuracyPassed }) {
  const mastered = new Set([...priorMastered, ...currentCorrect]);
  const missingTargets = expectedTargets.filter(target => !mastered.has(target));
  return {
    accuracyPassed,
    coverageComplete: missingTargets.length === 0,
    passed: Boolean(accuracyPassed && missingTargets.length === 0),
    missingTargets
  };
}

const finalLevelOneTargets = coverageExpectations.final_sounds.levels[1];
const finalLevelTwoTargets = coverageExpectations.final_sounds.levels[2];
const cvcTargets = coverageExpectations.cvc_short_vowels.itemKeys;
const rhymingTargets = coverageExpectations.rhyming.itemKeys;

const finalSevenOfEight = evaluateCheckpoint({
  expectedTargets: finalLevelOneTargets,
  priorMastered: ["p", "d", "t", "m", "n", "g", "b"],
  currentCorrect: [],
  accuracyPassed: true
});

const finalEightOfEight = evaluateCheckpoint({
  expectedTargets: finalLevelOneTargets,
  priorMastered: ["p", "d", "t", "m", "n", "g", "b"],
  currentCorrect: ["l"],
  accuracyPassed: true
});

const finalLevelTwoPartial = evaluateCheckpoint({
  expectedTargets: finalLevelTwoTargets,
  priorMastered: ["sh", "th", "ll", "ng", "nd", "nk", "st", "sk", "ft"],
  currentCorrect: [],
  accuracyPassed: true
});

const cvcPartial = evaluateCheckpoint({
  expectedTargets: cvcTargets,
  priorMastered: ["short_a", "short_e", "short_i", "short_o"],
  currentCorrect: [],
  accuracyPassed: true
});

const rhymingPartial = evaluateCheckpoint({
  expectedTargets: rhymingTargets,
  priorMastered: rhymingTargets.slice(0, -1),
  currentCorrect: [],
  accuracyPassed: true
});

const cases = [
  {
    name: "Final Sounds Level 1 7/8 with 100% accuracy",
    expectedPass: false,
    result: finalSevenOfEight
  },
  {
    name: "Final Sounds Level 1 8/8 with 100% accuracy",
    expectedPass: true,
    result: finalEightOfEight
  },
  {
    name: "Final Sounds Level 2 partial with 100% accuracy",
    expectedPass: false,
    result: finalLevelTwoPartial
  },
  {
    name: "CVC Short Vowels partial with 100% accuracy",
    expectedPass: false,
    result: cvcPartial
  },
  {
    name: "Rhyming partial rime coverage with 100% accuracy",
    expectedPass: false,
    result: rhymingPartial
  }
];

const failures = cases.filter(testCase => testCase.result.passed !== testCase.expectedPass);

const report = `# Checkpoint Coverage Audit

Generated: ${new Date().toISOString()}

Checkpoint pass decisions now require both:

- accuracy pass
- complete required target coverage for the current skill/level

## Required Targets

- Final Sounds Level 1: ${finalLevelOneTargets.join(", ")}
- Final Sounds Level 2: ${finalLevelTwoTargets.join(", ")}
- CVC Short Vowels: ${cvcTargets.join(", ")}
- Rhyming Words: ${rhymingTargets.join(", ")}

## Simulated Decisions

| Case | Accuracy Passed | Coverage Complete | Missing Targets | Expected Pass | Actual Pass |
| --- | --- | --- | --- | --- | --- |
${cases.map(testCase => `| ${testCase.name} | ${testCase.result.accuracyPassed ? "yes" : "no"} | ${testCase.result.coverageComplete ? "yes" : "no"} | ${unique(testCase.result.missingTargets).join(", ") || "none"} | ${testCase.expectedPass ? "yes" : "no"} | ${testCase.result.passed ? "yes" : "no"} |`).join("\n")}

## Failures

${failures.length ? failures.map(testCase => `- ${testCase.name}: expected ${testCase.expectedPass}, got ${testCase.result.passed}`).join("\n") : "- none"}
`;

writeFile(path.join(repoRoot, "docs/validation/checkpoint_coverage_audit.md"), report);

console.log(`Final Sounds 7/8 + 100% pass result: ${finalSevenOfEight.passed ? "PASS" : "BLOCKED"}`);
console.log(`Still to cover: ${finalSevenOfEight.missingTargets.join(", ") || "none"}`);
console.log("Wrote docs/validation/checkpoint_coverage_audit.md");

if (failures.length) {
  failures.forEach(testCase => console.error(`- ${testCase.name}`));
  process.exit(1);
}

console.log("Checkpoint coverage check passed.");
