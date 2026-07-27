import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const migration = source("supabase/migrations/20260725090000_class_access_security.sql");
const loginFlow = source("src/components/StudentLoginFlow.jsx");
const compatibility = source("src/data/classApiCompatibility.js");
const settings = source("src/components/teacher/TeacherSettingsPage.jsx");
const seed = source("supabase/seed/audit_school.sql");

assert.match(migration, /array\['device', 'network', 'code'\]/i);
assert.match(migration, /array\[10, 60, 120\]/i);
assert.match(migration, /locked_until = now\(\) \+ interval '2 minutes'/i);
assert.match(migration, /'error', 'rate_limited'/i);
assert.match(migration, /create table if not exists public\.class_access_events/i);
assert.match(migration, /alter table public\.class_access_events enable row level security/i);
assert.match(migration, /teacher_id = auth\.uid\(\)[\s\S]*is_app_admin/i);
assert.match(migration, /create or replace function public\.teacher_class_access_log/i);
assert.match(migration, /create or replace function public\.teacher_class_access_summary/i);
assert.match(migration, /create or replace function public\.teacher_set_class_code_expiry/i);
assert.match(migration, /access_code_expires_at <= now\(\)/i);
assert.match(
  migration,
  /revoke execute on function public\.student_class_by_code\(text\)[\s\S]*from public, anon, authenticated/i
);
assert.match(
  migration,
  /revoke execute on function public\.student_login\(uuid, text\)[\s\S]*from public, anon, authenticated/i
);
assert.match(loginFlow, /deviceId: deviceIdRef\.current/g);
assert.match(loginFlow, /code: normalizedCodeInput/);
assert.match(compatibility, /p_device_id: deviceId/g);
assert.match(compatibility, /p_code: code/g);
assert.match(loginFlow, /lp-class-access-device-v1/);
assert.doesNotMatch(
  migration,
  /create table[\s\S]{0,240}\b(raw_ip|ip_address|class_code|password|student_name)\b/i
);
assert.match(settings, /Unusual sign-in activity/);
assert.match(settings, /No child names, passwords, class codes, device IDs, or network addresses are stored here/);
assert.match(settings, /Code expiry/);
assert.match(seed, /insert into public\.class_access_events/i);
assert.match(seed, /'rate_limited'/i);
assert.match(
  migration,
  /v_class\.access_code is distinct from upper\(btrim\(coalesce\(p_code, ''\)\)\)/
);

console.log(
  "Class access security: device/network/code throttles, two-minute lockout, "
  + "optional expiry, privacy-minimal teacher history, anomaly summary, and "
  + "non-bypassable RPC signatures verified."
);
