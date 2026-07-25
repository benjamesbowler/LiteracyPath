import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  composeCurriculumResult,
  expandReleaseGateSelection,
  extractGateCounts,
  isGateImplemented,
  RELEASE_GATES,
  validateAuditEnvironment
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
    "student-home-hierarchy",
    "student-home-continuation",
    "student-daily-mission",
    "student-home-card-states",
    "student-rail-accessibility",
    "student-login-recovery",
    "student-login-panel",
    "guided-reading-control-hierarchy",
    "guided-reading-measure",
    "locked-item-affordance",
    "sound-racer-tutorial",
    "fullscreen-overlay-semantics",
    "child-surface-rules",
    "student-emphasis-budget",
    "assessment-media-evidence",
    "learning-policy",
    "class-summary-accuracy",
    "recommendation-explanations",
    "engagement-sync",
    "key-route-visuals",
    "a11y-routes",
    "learner-accessibility-settings",
    "overlay-contrast-focus",
    "device-matrix",
    "assessment-runtime-variation",
    "assessment-skill-contracts",
    "strict-curriculum",
    "skill-progression",
    "teacher-dashboard-data",
    "teacher-today",
    "teacher-context",
    "teacher-dashboard-consolidation",
    "product-finish-surface",
    "release-readiness-surface",
    "bundle-size",
    "dependency-audit",
    "repo-hygiene",
    "audit-read-only",
    "database-bootstrap-schema",
    "retention-policy",
    "audit-school-seed",
    "audit-school-live",
    "a11y-routes",
    "db-policies",
    "e2e-teacher",
    "csp",
    "runtime-variation-simulation",
    "media-runtime-resolution",
    "media-quality"
  ]) {
    assert.equal(ids.has(required), true, `missing ${required}`);
  }
});

test("the permanent integrity gate fails on unresolved active-book image flags", () => {
  const integritySource = readFileSync(
    new URL("../../tools/checkAssessmentQuestionIntegrity.js", import.meta.url),
    "utf8"
  );
  const integrityGate = RELEASE_GATES.find(gate => gate.id === "assessment-question-integrity");

  assert.deepEqual(
    integrityGate?.command,
    ["npm", "run", "check:assessment-question-integrity", "--", "--check"]
  );
  assert.match(
    integritySource,
    /if\s*\([\s\S]*?\|\|\s*guidedRows\.length\s*\)[\s\S]*?process\.exit\(1\)/
  );
});

test("CI runs the canonical release gate against a fresh seeded local database", () => {
  const workflow = readFileSync(
    new URL("../../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );

  assert.match(workflow, /^[ ]{2}release-gate:$/m);
  assert.match(workflow, /supabase\/setup-cli@v2/);
  assert.match(workflow, /supabase db reset --local --no-seed/);
  assert.match(workflow, /npm run seed:audit-school/);
  assert.match(workflow, /npm run check:release/);
  assert.match(workflow, /docs\/release\/manifest\.json/);
  assert.match(workflow, /if: steps\.whole-product\.outcome != 'success'/);
  assert.match(workflow, /npm run lint -- --max-warnings=0/);
});

test("missing npm scripts are explicitly not implemented", () => {
  const gate = RELEASE_GATES.find(item => item.id === "a11y-routes");
  assert.equal(isGateImplemented(gate, {}), false);
  assert.equal(isGateImplemented(RELEASE_GATES.find(item => item.id === "unit-tests"), { test: "node --test" }), true);
});

test("release credential preflight fails once without exposing secret values", () => {
  const result = validateAuditEnvironment({
    LP_AUDIT_SUPABASE_URL: "not-a-url",
    LP_AUDIT_SUPABASE_ANON_KEY: "anon-secret-that-must-not-appear",
    LP_AUDIT_DATABASE_URL: "",
    LP_AUDIT_TEACHER_PASSWORD: "short"
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["LP_AUDIT_DATABASE_URL"]);
  assert.deepEqual(result.invalid, [
    "LP_AUDIT_SUPABASE_URL must be an http(s) URL",
    "LP_AUDIT_TEACHER_PASSWORD must contain at least 12 characters"
  ]);
  assert.doesNotMatch(result.message, /anon-secret|not-a-url|\bshort\b/);
  assert.match(result.message, /process environment or CI secret store/);
});

test("release credential preflight accepts structurally valid injected credentials", () => {
  const result = validateAuditEnvironment({
    LP_AUDIT_SUPABASE_URL: "http://127.0.0.1:54321",
    LP_AUDIT_SUPABASE_ANON_KEY: "injected-anon-key",
    LP_AUDIT_DATABASE_URL: "postgresql://postgres:password@127.0.0.1:54322/postgres",
    LP_AUDIT_TEACHER_PASSWORD: "long-audit-password"
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.match(result.message, /preflight passed/);
});

test("CSP release gate is enforced by deployment headers and hostile browser probes", () => {
  const packageJson = JSON.parse(readFileSync(
    new URL("../../package.json", import.meta.url),
    "utf8"
  ));
  const vercelConfig = JSON.parse(readFileSync(
    new URL("../../vercel.json", import.meta.url),
    "utf8"
  ));
  const cspCheck = readFileSync(
    new URL("../../tools/checkCsp.mjs", import.meta.url),
    "utf8"
  );
  const globalHeaders = Object.fromEntries(
    vercelConfig.headers
      .find(rule => rule.source === "/(.*)")
      .headers
      .map(header => [header.key, header.value])
  );

  assert.equal(packageJson.scripts["check:csp"], "npm run build && node tools/checkCsp.mjs");
  assert.match(globalHeaders["Content-Security-Policy"], /script-src 'self'/);
  assert.doesNotMatch(globalHeaders["Content-Security-Policy"], /unsafe-eval/);
  assert.doesNotMatch(globalHeaders["Content-Security-Policy"], /script-src[^;]*unsafe-inline/);
  for (const directive of ["script-src-elem", "frame-src", "object-src", "connect-src"]) {
    assert.match(cspCheck, new RegExp(JSON.stringify(directive)));
  }
});

test("sync-chaos release gate combines real queue/merge units with a two-device browser journey", () => {
  const packageJson = JSON.parse(readFileSync(
    new URL("../../package.json", import.meta.url),
    "utf8"
  ));
  const syncJourney = readFileSync(
    new URL("../release/sync-chaos.spec.js", import.meta.url),
    "utf8"
  );

  assert.match(packageJson.scripts["check:sync-chaos"], /progressQueue\.test\.js/);
  assert.match(packageJson.scripts["check:sync-chaos"], /progressMerge\.test\.js/);
  assert.match(packageJson.scripts["check:sync-chaos"], /sync-chaos\.spec\.js/);
  assert.match(syncJourney, /setOffline\(true\)/);
  assert.match(syncJourney, /expired-token/);
  assert.match(syncJourney, /deviceA/);
  assert.match(syncJourney, /deviceB/);
  assert.match(syncJourney, /cloud\.conflicts/);
});

test("teacher E2E gate joins the authenticated golden path, full assessment, state matrix, and ownership denial", () => {
  const packageJson = JSON.parse(readFileSync(
    new URL("../../package.json", import.meta.url),
    "utf8"
  ));
  const teacherJourney = readFileSync(
    new URL("../release/teacher-e2e.spec.js", import.meta.url),
    "utf8"
  );
  const script = packageJson.scripts["check:e2e-teacher"];

  assert.match(script, /teacherSurfaceStateMatrix\.test\.js/);
  assert.match(script, /teacher-e2e\.spec\.js/);
  assert.match(script, /el-assessment-route-and-final-review\.spec\.js/);
  assert.match(script, /--workers=1/);
  assert.match(teacherJourney, /audit-teacher-a/);
  assert.match(teacherJourney, /audit-teacher-b/);
  assert.match(teacherJourney, /Assessment attempt/);
  assert.match(teacherJourney, /Question evidence/);
  assert.match(teacherJourney, /cannot discover or deep-link/);
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
  assert.deepEqual(
    extractGateCounts(generic, "initial_sounds failures: 438\nRuntime variation failures: 876\n"),
    { failed: 876 }
  );
});

test("composed curriculum gate requires all five dimensions for every skill", () => {
  const pass = id => ({ id, status: "pass" });
  const dependencies = [
    "assessment-question-integrity",
    "strict-curriculum",
    "curriculum-release-standard",
    "assessment-runtime-variation",
    "assessment-skill-contracts",
    "skill-progression",
    "runtime-variation-simulation",
    "media-runtime-resolution",
    "media-quality"
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
      strictUsableQuestionCount: 92,
      releaseStandardDecision: {
        releaseReady: true,
        dimensions: {
          questionCount: "pass",
          balance: "pass",
          media: "pass",
          accessibility: "pass"
        }
      }
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

test("the standalone composed curriculum selection expands to every required dependency", () => {
  const packageJson = JSON.parse(readFileSync(
    new URL("../../package.json", import.meta.url),
    "utf8"
  ));
  assert.equal(
    packageJson.scripts["check:curriculum-composed"],
    "node tools/releaseGate.mjs --only curriculum-composed"
  );
  const selected = expandReleaseGateSelection(new Set(["curriculum-composed"]));
  assert.deepEqual([...selected].sort(), [
    "assessment-question-integrity",
    "assessment-runtime-variation",
    "assessment-skill-contracts",
    "curriculum-release-standard",
    "media-quality",
    "media-runtime-resolution",
    "runtime-variation-simulation",
    "skill-progression",
    "strict-curriculum"
  ]);
  assert.equal(selected.has("curriculum-composed"), false);
  assert.deepEqual(
    [...expandReleaseGateSelection(new Set(["curriculum-composed", "lint"]))].sort(),
    [...selected, "lint"].sort()
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
