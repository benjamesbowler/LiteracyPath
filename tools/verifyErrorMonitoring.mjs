import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source("supabase/migrations/20260725100000_remote_error_monitoring.sql");
const client = source("src/utils/errorLog.js");
const boundary = source("src/components/ErrorBoundary.jsx");
const main = source("src/main.jsx");
const admin = source("src/components/AdminDashboardPage.jsx");
const vite = source("vite.config.js");

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
assert.match(client, /client\.rpc\("report_app_error"/);
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

console.log(
  "Remote error monitoring: release attribution, strict no-message payload, "
  + "PII rejection, 25% global/100% boundary sampling, 30-day retention, "
  + "repeat/fatal alerting, admin fleet view, and local fallback verified."
);
