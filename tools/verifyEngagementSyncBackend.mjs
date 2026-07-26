import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260724234500_engagement_sync_health.sql",
    import.meta.url
  ),
  "utf8"
);
const client = readFileSync(
  new URL("../src/utils/progressSync.js", import.meta.url),
  "utf8"
);

assert.match(migration, /create unique index[\s\S]*student_id,\s*client_event_id/i);
assert.match(migration, /on conflict \(student_id, client_event_id\)[\s\S]*do nothing/i);
assert.match(migration, /create table if not exists public\.activity_sync_health/i);
assert.match(migration, /alter table public\.activity_sync_health enable row level security/i);
assert.match(migration, /teacher_id = auth\.uid\(\)[\s\S]*is_app_admin/i);
assert.match(migration, /create or replace function public\.student_report_activity_sync_health/i);
assert.match(migration, /p_delivered > p_attempted/i);
assert.match(migration, /p_recovered > p_delivered/i);
assert.match(migration, /p_delivered \+ p_pending \+ p_lost > p_attempted/i);
assert.match(migration, /least\(coalesce\(p_occurred_at, now\(\)\), now\(\)\)/i);
assert.match(
  migration,
  /when p_oldest_pending_at is null then null[\s\S]*least\(p_oldest_pending_at, now\(\)\)/i
);
assert.doesNotMatch(migration, /p_observed_at/);
assert.match(client, /call\("student_log_activity_v2"/);
assert.match(client, /call\("student_report_activity_sync_health"/);
assert.match(
  client,
  /export function logStudentActivity[\s\S]*enqueueEngagementEvent[\s\S]*scheduleEngagementFlush/
);
assert.match(client, /engagementInFlightFlushes/);
assert.doesNotMatch(client, /call\("student_log_activity"/);

console.log(
  "Engagement sync backend: idempotent event RPC, cumulative health RPC, "
  + "teacher/admin RLS, and client v2 routing verified."
);
