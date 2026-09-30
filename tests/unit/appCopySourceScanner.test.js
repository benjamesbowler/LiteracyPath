import assert from "node:assert/strict";
import test from "node:test";

import { scanAppCopySource } from "../../tools/checkAppCopy.js";

const teacherFile = new URL("../../src/copy/teacherCopy.js", import.meta.url).pathname;
const childFile = new URL("../../src/copy/childCopy.js", import.meta.url).pathname;

test("copy dictionary keys are identifiers while their displayed values remain scanned", () => {
  const source = `export const COPY = {
    "p-exit-check": "Show what you know",
    "saved_evidence": { "checkpoint": "Student results" },
    title: "Collect evidence",
    rawLabel: "not_assessed",
    nested: { "p-exit-check": "Start Skills check" }
  };`;
  const findings = scanAppCopySource(source, { file: teacherFile, audience: "teacher" });

  assert.equal(findings.length, 3);
  assert.ok(findings.some(finding => /copy contains “evidence” — Collect evidence/.test(finding)));
  assert.ok(findings.some(finding => /visible raw token “not_assessed”/.test(finding)));
  assert.ok(findings.some(finding => /copy contains “check” — Start Skills check/.test(finding)));
  assert.ok(findings.every(finding => !/— (p-exit-check|saved_evidence|checkpoint)$/.test(finding)));
});

test("excluding copy keys does not exempt child values or displayed JSX attributes", () => {
  const childFindings = scanAppCopySource(`export const COPY = {
    "checkpoint": "Your saved stop",
    warning: "Assessment failed",
    progress: "3/5"
  };`, { file: childFile, audience: "child" });
  assert.equal(childFindings.length, 2);
  assert.ok(childFindings.some(finding => /child copy contains “Assessment”/.test(finding)));
  assert.ok(childFindings.some(finding => /child copy contains a fraction/.test(finding)));

  const jsxFindings = scanAppCopySource(
    'export const View = () => <button aria-label="Collect evidence">Start assessment</button>;',
    { file: "/src/components/TeacherFixture.jsx", audience: "teacher" }
  );
  assert.equal(jsxFindings.length, 1);
  assert.match(jsxFindings[0], /teacher copy contains “evidence” — Collect evidence/);
});
