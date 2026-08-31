import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  composeCurriculumResult,
  expandReleaseGateSelection,
  extractGateCounts,
  isGateImplemented,
  RELEASE_GATES,
  validateAuditEnvironment
} from "../../tools/releaseGate.mjs";

test("release gate registry includes every Phase 0 and planned whole-product gate", () => {
  const ids = new Set(RELEASE_GATES.map(gate => gate.id));
  for (const required of [
    "lint",
    "unit-coverage",
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
    "dependency-audit",
    "repo-hygiene",
    "audit-read-only",
    "literacy-only-domain",
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

test("the release gate applies continuous pass-by-exception media review", () => {
  const mediaGate = RELEASE_GATES.find(gate => gate.id === "media-review-release");
  assert.deepEqual(mediaGate?.command, ["npm", "run", "check:media-review-beta"]);
  assert.match(mediaGate?.label || "", /accepted under continuous review/);
});

test("the canonical release blocks missing or inaudible assessment audio", () => {
  const audioGate = RELEASE_GATES.find(gate => gate.id === "assessment-audio-audibility");

  assert.deepEqual(
    audioGate?.command,
    ["npm", "run", "check:assessment-audio-audibility"]
  );
  assert.equal(audioGate?.planned, undefined);
});

test("the permanent integrity gate runs the one current v3 assessment gate", () => {
  const integritySource = readFileSync(
    new URL("../../tools/assessmentRebuild/gate.mjs", import.meta.url),
    "utf8"
  );
  const integrityGate = RELEASE_GATES.find(gate => gate.id === "assessment-question-integrity");

  assert.deepEqual(
    integrityGate?.command,
    ["npm", "run", "check:assessment-question-integrity", "--", "--check"]
  );
  assert.match(integritySource, /const hardGateKeys = \[/);
  assert.match(integritySource, /"G6_one_report"/);
  assert.doesNotMatch(integritySource, /G7_human_signoff|pending-ben/);
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
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /release_only:/);
  assert.match(workflow, /node tools\/releaseGate\.mjs --only "\$RELEASE_ONLY"/);
  assert.match(
    workflow,
    /Upload private source maps[\s\S]*?github\.event_name != 'workflow_dispatch' \|\| inputs\.release_only == ''/
  );
  assert.match(workflow, /\.artifacts\/release\/manifest\.json/);
  assert.match(workflow, /LP_RECOVERY_SOURCE_DATABASE_URL=\$DB_URL/);
  assert.match(workflow, /LP_RECOVERY_TARGET_DATABASE_URL=\$recovery_target_url/);
  assert.match(workflow, /LP_RECOVERY_DRILL_CONFIRM=RESTORE:\$recovery_database/);
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(workflow, /https:\/\/apt\.postgresql\.org\/pub\/repos\/apt/);
  assert.match(workflow, /Suites: noble-pgdg/);
  assert.match(workflow, /postgresql-client-17/);
  assert.match(workflow, /\/usr\/lib\/postgresql\/17\/bin\/pg_dump --version \| grep -F "17\."/);
  assert.match(workflow, /docs\/release\/artifacts\/recovery\//);
  assert.match(workflow, /if: steps\.whole-product\.outcome != 'success'/);
  assert.match(workflow, /npm run lint -- --max-warnings=0/);
  assert.match(workflow, /actions\/upload-artifact@v7/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact@v[1-6]\b/);
});

test("the local release database can sustain the canonical browser sign-in matrix", () => {
  const config = readFileSync(
    new URL("../../supabase/config.toml", import.meta.url),
    "utf8"
  );

  assert.match(config, /\[auth\.rate_limit\]/);
  assert.match(config, /token_refresh = 1000/);
  assert.match(config, /sign_in_sign_ups = 1000/);
});

test("CI gives the complete visual evidence lane enough hosted-runner headroom", () => {
  const workflow = readFileSync(
    new URL("../../.github/workflows/ci.yml", import.meta.url),
    "utf8"
  );
  const visualJob = workflow.slice(
    workflow.indexOf("\n  visual:\n"),
    workflow.indexOf("\n  release-gate:\n")
  );

  assert.match(visualJob, /timeout-minutes: 40/);
  assert.match(visualJob, /npm run check:quest-slice-camera/);
  assert.match(visualJob, /A11Y_ENFORCE=1 npm run shots/);
  assert.match(visualJob, /npm run check:soundkeys-midi/);
  assert.match(visualJob, /\.artifacts\/quest\/shots\//);
});

test("Linux visual baselines have an isolated reviewed refresh workflow", () => {
  const workflow = readFileSync(
    new URL("../../.github/workflows/refresh-visual-baselines.yml", import.meta.url),
    "utf8"
  );

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /authenticated-missing/);
  assert.match(workflow, /supabase db reset --local --no-seed/);
  assert.match(workflow, /npm run seed:audit-school/);
  assert.equal(workflow.match(/--update-snapshots=all/g)?.length, 2);
  assert.match(workflow, /tests\/release\/\*\*\/\*-snapshots\/linux\/\*\.png/);
  assert.match(workflow, /actions\/upload-artifact@v7/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact@v[1-6]\b/);
});

test("teacher release journeys open the disclosed class control before using it", () => {
  const releaseRoot = new URL("../release/", import.meta.url);
  const releaseFiles = readdirSync(releaseRoot, { recursive: true })
    .filter(file => String(file).endsWith(".js"));

  for (const relativeFile of releaseFiles) {
    if (relativeFile === "support/teacherLanding.js") continue;
    const source = readFileSync(new URL(relativeFile, releaseRoot), "utf8");
    assert.doesNotMatch(
      source,
      /getByLabel\((['"])Current class\1\)/,
      `${relativeFile} bypasses the disclosed class-and-school control`
    );
  }

  const support = readFileSync(new URL("support/teacherLanding.js", releaseRoot), "utf8");
  assert.match(support, /details\.teacher-students-class-tools/);
  assert.match(support, /element => element\.open/);
});

test("missing npm scripts are explicitly not implemented", () => {
  const gate = RELEASE_GATES.find(item => item.id === "a11y-routes");
  assert.equal(isGateImplemented(gate, {}), false);
  assert.equal(
    isGateImplemented(
      RELEASE_GATES.find(item => item.id === "unit-coverage"),
      { "check:unit-coverage": "node --experimental-test-coverage" }
    ),
    true
  );
});

test("release credential preflight fails once without exposing secret values", () => {
  const result = validateAuditEnvironment({
    VITE_SUPABASE_URL: "https://different.invalid",
    VITE_SUPABASE_ANON_KEY: "different-key",
    LP_AUDIT_SUPABASE_URL: "not-a-url",
    LP_AUDIT_SUPABASE_ANON_KEY: "anon-secret-that-must-not-appear",
    LP_AUDIT_DATABASE_URL: "",
    LP_AUDIT_TEACHER_PASSWORD: "short"
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ["LP_AUDIT_DATABASE_URL"]);
  assert.deepEqual(result.invalid, [
    "LP_AUDIT_SUPABASE_URL must be an http(s) URL",
    "LP_AUDIT_TEACHER_PASSWORD must contain at least 12 characters",
    "VITE_SUPABASE_URL must match LP_AUDIT_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY must match LP_AUDIT_SUPABASE_ANON_KEY"
  ]);
  assert.doesNotMatch(result.message, /anon-secret|not-a-url|\bshort\b/);
  assert.match(result.message, /process environment or CI secret store/);
});

test("release credential preflight accepts structurally valid injected credentials", () => {
  const result = validateAuditEnvironment({
    VITE_SUPABASE_URL: "http://127.0.0.1:54321",
    VITE_SUPABASE_ANON_KEY: "injected-anon-key",
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

test("SoundKeys direct route is rewritten to the SPA entry point", () => {
  const vercelConfig = JSON.parse(readFileSync(
    new URL("../../vercel.json", import.meta.url),
    "utf8"
  ));
  assert.ok(vercelConfig.rewrites?.some(rewrite => (
    rewrite.source === "/soundkeys/:path*" && rewrite.destination === "/"
  )));
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
  assert.match(teacherJourney, /Question result/);
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
  const assessmentGate = {
    results: [{
      skillId: "initial_sounds",
      ready: true,
      gates: {
        G1_structure: true,
        G2_originality: true,
        G3_answer_integrity: true,
        G4_mastery_logic: true,
        G5_no_repeats: true,
        G6_one_report: true
      }
    }]
  };
  assert.equal(composeCurriculumResult(dependencies, assessmentGate).status, "pass");
  const failed = dependencies.map(result => (
    result.id === "assessment-runtime-variation" ? { ...result, status: "fail" } : result
  ));
  assert.equal(composeCurriculumResult(failed, assessmentGate).status, "fail");
  assert.equal(
    composeCurriculumResult(failed, assessmentGate).skills[0].dimensions.variation,
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

test("the composed curriculum gate reads fresh check-mode assessment evidence", () => {
  const releaseGate = readFileSync(
    new URL("../../tools/releaseGate.mjs", import.meta.url),
    "utf8"
  );
  const assessmentGate = readFileSync(
    new URL("../../tools/assessmentRebuild/gate.mjs", import.meta.url),
    "utf8"
  );

  assert.match(
    releaseGate,
    /\.artifacts[\s\S]+assessment-rebuild[\s\S]+assessment_rebuild_gate\.json/
  );
  assert.match(
    releaseGate,
    /fs\.rmSync\(assessmentGateJsonPath, \{ force: true \}\)/
  );
  assert.match(
    assessmentGate,
    /fs\.writeFileSync\(reportPath \+ "\.json"[\s\S]+if \(write\)/
  );
});

test("the full public media inventory is an on-demand audit artifact, not runtime source", () => {
  const generator = readFileSync(
    new URL("../../tools/generatePublicMediaInventory.js", import.meta.url),
    "utf8"
  );
  const viteConfig = readFileSync(
    new URL("../../vite.config.js", import.meta.url),
    "utf8"
  );
  const hygiene = readFileSync(
    new URL("../../tools/checkRepoHygiene.js", import.meta.url),
    "utf8"
  );

  assert.match(generator, /\.artifacts[\s\S]+media-qa[\s\S]+public-media-inventory\.json/);
  assert.doesNotMatch(generator, /src["',\s]+data["',\s]+publicMediaInventory\.js/);
  assert.doesNotMatch(viteConfig, /publicMediaInventory/);
  assert.match(hygiene, /APPROVED_LARGE_SOURCE_FILES[\s\S]+mediaQaReviewItems\.generated\.js/);
});
