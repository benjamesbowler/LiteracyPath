import assert from "node:assert/strict";
import test from "node:test";

import {
  composeCurriculumResult,
  extractGateCounts,
  isGateImplemented,
  RELEASE_GATES
} from "../../tools/releaseGate.mjs";
import {
  calculateScorecard,
  parseDiscoveredTraceability,
  parseMarkdownTable,
  parseTraceability
} from "../../tools/releaseScorecard.mjs";

test("release gate registry includes every Phase 0 and planned whole-product gate", () => {
  const ids = new Set(RELEASE_GATES.map(gate => gate.id));
  for (const required of [
    "lint",
    "unit-tests",
    "build",
    "smoke",
    "assessment-question-integrity",
    "assessment-runtime-variation",
    "strict-curriculum",
    "skill-progression",
    "teacher-dashboard-data",
    "product-finish-surface",
    "release-readiness-surface",
    "bundle-size",
    "dependency-audit",
    "repo-hygiene",
    "database-bootstrap-schema",
    "a11y-routes",
    "db-policies",
    "e2e-teacher",
    "csp",
    "runtime-variation-simulation",
    "media-runtime-resolution"
  ]) {
    assert.equal(ids.has(required), true, `missing ${required}`);
  }
});

test("missing npm scripts are explicitly not implemented", () => {
  const gate = RELEASE_GATES.find(item => item.id === "a11y-routes");
  assert.equal(isGateImplemented(gate, {}), false);
  assert.equal(isGateImplemented(RELEASE_GATES.find(item => item.id === "unit-tests"), { test: "node --test" }), true);
});

test("gate counts parse TAP, browser, warnings, and strict-audit metrics", () => {
  const generic = {
    outputFormat: null
  };
  assert.deepEqual(
    extractGateCounts(generic, "# tests 955\n# pass 955\n# fail 0\nWarnings: 16\n"),
    { tests: 955, passed: 955, failed: 0, warnings: 16 }
  );
  assert.deepEqual(
    extractGateCounts(generic, "8 passed\nStrict assessment skills audited: 30\nProduction-ready skills: 9\n"),
    { passed: 8, productionReadySkills: 9, auditedSkills: 30 }
  );
});

test("composed curriculum gate requires all five dimensions for every skill", () => {
  const pass = id => ({ id, status: "pass" });
  const dependencies = [
    "assessment-question-integrity",
    "strict-curriculum",
    "assessment-runtime-variation",
    "skill-progression",
    "runtime-variation-simulation",
    "media-runtime-resolution"
  ].map(pass);
  const strictAudit = {
    strictStandard: { minimumTotal: 60 },
    perSkill: [{
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      level1MissingTo30: 0,
      level2MissingTo30: 0,
      missingImageCount: 0,
      missingAudioCount: 0,
      mediaWiringFixCount: 0,
      strictUsableQuestionCount: 60
    }]
  };
  assert.equal(composeCurriculumResult(dependencies, strictAudit).status, "pass");
  const failed = dependencies.map(result => (
    result.id === "assessment-runtime-variation" ? { ...result, status: "fail" } : result
  ));
  assert.equal(composeCurriculumResult(failed, strictAudit).status, "fail");
  assert.equal(
    composeCurriculumResult(failed, strictAudit).skills[0].dimensions.variation,
    "fail"
  );
});

test("traceability parser requires explicit A-item rows", () => {
  const text = `| Item | Area | Priority | Status | Named gate | Evidence |
|---|---:|---|---|---|---|
| A1.1 | 1 | P0 | TODO | gate | — |
| D-001 | 1, 8 | P0 | TODO | gate | — |`;
  assert.equal(parseMarkdownTable(text).length, 2);
  assert.deepEqual(parseTraceability(text), [{
    item: "A1.1",
    area: 1,
    priority: "P0",
    status: "TODO",
    gate: "gate",
    evidence: "—"
  }]);
  assert.deepEqual(parseDiscoveredTraceability(text), [{
    id: "D-001",
    areas: [1, 8],
    severity: "P0",
    status: "TODO",
    gate: "gate",
    evidence: "—"
  }]);
});

test("scorecard never grants a ten while mapped gates or Loop C remain open", () => {
  const traceRows = Array.from({ length: 10 }, (_, index) => ({
    item: `A1.${index + 1}`,
    area: 1,
    priority: "P2",
    status: "DONE"
  }));
  const emptyAreas = Array.from({ length: 90 }, (_, index) => ({
    item: `A${Math.floor(index / 10) + 2}.${(index % 10) + 1}`,
    area: Math.floor(index / 10) + 2,
    priority: "P2",
    status: "TODO"
  }));
  const result = calculateScorecard({
    traceRows: [...traceRows, ...emptyAreas],
    manifest: {
      partial: false,
      gates: [{ id: "gate", status: "fail", areas: [1] }]
    },
    waivers: [],
    discovered: [{
      id: "D-999",
      areas: [1, 8],
      severity: "P0",
      status: "IN-PROGRESS"
    }],
    externals: [],
    loopCAuditCount: 0
  });
  assert.equal(result.areas[0].score, 9);
  assert.equal(result.areas[0].blockers.some(blocker => blocker.includes("mapped gate")), true);
  assert.equal(result.areas[0].openDiscoveredP01.includes("D-999"), true);
  assert.equal(result.areas[7].openDiscoveredP01.includes("D-999"), true);
});
