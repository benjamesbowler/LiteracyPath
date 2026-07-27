import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../../src/App.jsx", import.meta.url), "utf8");
const appSurfaceSource = readFileSync(new URL("../../src/components/AppSurface.jsx", import.meta.url), "utf8");

function functionSource(name, nextName) {
  const start = appSource.indexOf(`async function ${name}`);
  const end = appSource.indexOf(`async function ${nextName}`, start + 1);
  assert.ok(start >= 0, `Expected ${name}`);
  assert.ok(end > start, `Expected ${nextName} after ${name}`);
  return appSource.slice(start, end);
}

test("completed EL evidence accepts either durable store and returns a structured outcome", () => {
  const source = functionSource("finishElBenchmarkAssessment", "discontinueElBenchmarkAssessment");
  assert.match(source, /if \(!archiveResult\)/);
  assert.doesNotMatch(source, /cloudArchiveRequired/);
  assert.doesNotMatch(source, /status: "in_progress"/);
  assert.doesNotMatch(source, /completedAt: ""/);
  assert.match(source, /syncPending = cloudExpected && localSaved && !cloudSaved/);
  assert.match(source, /archiveResult\.persistence\.syncQueued/);
  assert.match(source, /ok: false,[\s\S]*durable: false/);
  assert.match(source, /ok: true,[\s\S]*durable: true/);
  // 2026-07-27: the EL hub became the Checks funnel, so finishing returns there.
  assert.match(source, /setAppView\(APP_VIEWS\.ASSESSMENTS\)/);
});

test("a hard completion failure keeps the terminal session open for retry", () => {
  const source = functionSource("finishElBenchmarkAssessment", "discontinueElBenchmarkAssessment");
  assert.match(source, /saveElBenchmarkDraft\(\{ teacherId, studentId, session: completedSession \}\)/);
  assert.match(source, /setElBenchmarkSession\(completedSession\)/);
  assert.match(source, /select Retry finish/);
});

test("save and exit routes terminal sessions back through terminal persistence", () => {
  const source = functionSource("saveElBenchmarkPartialAndExit", "finishElBenchmarkAssessment");
  assert.match(source, /terminalStatus === "completed"\) return finishElBenchmarkAssessment/);
  assert.match(source, /terminalStatus === "discontinued"\) return discontinueElBenchmarkAssessment/);
  assert.match(appSurfaceSource, /el-benchmark-hub-message\$\{message\.includes\("Cloud sync is pending"\)/);
  assert.match(appSurfaceSource, /role="status"/);
  assert.match(appSource, /window\.addEventListener\("online", flushPendingAssessmentAttempts\)/);
  assert.match(appSource, /flushAssessmentAttemptSyncQueue\(\{ teacherId, supabase \}\)/);
});
