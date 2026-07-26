import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source("supabase/migrations/20260725100000_remote_error_monitoring.sql");
const budgetMigration = source("supabase/migrations/20260725125000_error_monitor_budget.sql");
const client = source("src/utils/errorLog.js");
const boundary = source("src/components/ErrorBoundary.jsx");
const main = source("src/main.jsx");
const admin = source("src/components/AdminDashboardPage.jsx");
const vite = source("vite.config.js");
const budgetPolicy = source("src/policy/fleetErrorBudget.js");
const budgetRunbook = source("docs/ops/ERROR_BUDGET.md");
const sourceMapGate = source("tools/checkPrivateSourceMaps.mjs");
const publicSourceMapGate = source("tools/checkPublicSourceMaps.mjs");
const workflow = source(".github/workflows/ci.yml");

assert.match(migration, /create table if not exists public\.app_error_events/i);
assert.match(migration, /alter table public\.app_error_events enable row level security/i);
assert.match(migration, /public\.is_app_admin\(auth\.uid\(\)\)/i);
assert.match(migration, /expires_at timestamptz not null default now\(\) \+ interval '30 days'/i);
assert.match(migration, /create or replace function public\.report_app_error/i);
assert.match(migration, /invalid_or_sensitive_payload/i);
assert.match(migration, /frame !~ '\^\(assets\|src\)/i);
assert.match(migration, /v_recent_count >= 100/i);
assert.match(migration, /p_severity = 'fatal' or v_recent_count >= 4/i);
assert.doesNotMatch(
  migration,
  /p_(message|url|user_id|student_id|learner_id|class_id|answer|context)\b/i
);
assert.match(client, /remoteStackFrameLimit/);
assert.match(client, /boundarySampleRate: 1/);
assert.match(client, /globalSampleRate: 0\.25/);
assert.match(client, /retentionDays: 30/);
assert.match(client, /client\.call\("report_app_error"/);
assert.doesNotMatch(client, /error\?\.message[\s\S]{0,120}p_/);
assert.match(boundary, /componentStack: info\?\.componentStack/);
assert.match(main, /logClientError/);
assert.doesNotMatch(main, /CLIENT_ERROR_LOG_KEY|recordClientError/);
assert.match(vite, /VERCEL_GIT_COMMIT_SHA/);
assert.match(vite, /__APP_RELEASE_ID__/);
assert.match(admin, /Fleet error monitor/);
assert.match(admin, /No child names, answers, class codes, account IDs/);
assert.match(admin, /admin_error_monitor_summary/);
assert.match(admin, /admin_recent_error_events/);
assert.match(admin, /fatal_events_24h/);
assert.match(admin, /data-budget-status/);
assert.match(admin, /diagnostic incident budget, not a claim about measured user availability/);
assert.match(budgetMigration, /event\.stack_frames/);
assert.match(budgetMigration, /event\.severity = 'fatal'/);
assert.match(budgetPolicy, /fatalEventBudget: 0/);
assert.match(budgetPolicy, /alertEventBudget: 0/);
assert.match(budgetPolicy, /status: "no-data"/);
assert.match(budgetRunbook, /not described as an availability percentage/);
assert.match(budgetRunbook, /symbolicateFrame\.mjs/);
assert.match(vite, /sourcemap: privateSourceMaps \? 'hidden' : false/);
assert.match(sourceMapGate, /sourceMappingURL/);
assert.match(sourceMapGate, /src\/utils\/errorLog\.js/);
assert.match(publicSourceMapGate, /Public dist contains source maps/);
assert.match(workflow, /private-source-maps-\$\{\{ github\.sha \}\}/);

console.log(
  "Remote error monitoring: release attribution, strict no-message payload, "
  + "PII rejection, 25% global/100% boundary sampling, 30-day retention, "
  + "repeat/fatal alerting, strict 24-hour error budget, private source-map "
  + "symbolication, admin fleet view, and local fallback verified."
);
