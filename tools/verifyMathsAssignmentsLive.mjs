#!/usr/bin/env node
import { readFileSync } from "node:fs";

function readEnvFile(filePath) {
  try {
    return Object.fromEntries(readFileSync(filePath, "utf8").split("\n")
      .map(line => line.trim()).filter(line => line && !line.startsWith("#") && line.includes("="))
      .map(line => { const index = line.indexOf("="); return [line.slice(0, index).trim(), line.slice(index + 1).trim()]; }));
  } catch { return {}; }
}

const fileEnv = { ...readEnvFile(".env"), ...readEnvFile(".env.local") };
const url = (process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Cannot probe live Maths assignments without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  process.exit(2);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
async function post(name, body) {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
  return { status: response.status, payload: await response.json().catch(() => ({})) };
}

function denied(result) {
  return [401, 403, 404].includes(result.status)
    || ["42501", "PGRST202", "PGRST203"].includes(result.payload?.code);
}

const invalidToken = "maths-live-probe-invalid-token";
const dummyUuid = "00000000-0000-0000-0000-000000000000";
const studentList = await post("student_list_maths_assignments", { p_token: invalidToken });
const studentComplete = await post("student_complete_maths_assignment", { p_token: invalidToken, p_assignment_id: dummyUuid });
const teacherList = await post("teacher_list_maths_assignments", { p_class_id: dummyUuid, p_include_archived: false });
const teacherCreate = await post("teacher_create_maths_assignment", {
  p_class_id: dummyUuid,
  p_skill_id: "F-N-COUNT-10",
  p_activity_type: "lesson",
  p_activity_id: "release-probe",
  p_title: "Release probe",
  p_student_ids: [dummyUuid],
  p_due_at: null
});
const teacherOperations = [
  ["teacher_update_due", "teacher_update_maths_assignment_due_at", {
    p_class_id: dummyUuid, p_assignment_id: dummyUuid, p_due_at: null
  }],
  ["teacher_duplicate", "teacher_duplicate_maths_assignment", {
    p_class_id: dummyUuid, p_assignment_id: dummyUuid, p_due_at: null
  }],
  ["teacher_list_media_issues", "teacher_list_maths_media_issues", {
    p_class_id: dummyUuid, p_include_reviewed: false
  }],
  ["teacher_resolve_media_issue", "teacher_resolve_maths_media_issue", {
    p_issue_id: dummyUuid, p_resolution: "not_reproducible"
  }],
  ["teacher_filtered_evidence", "teacher_read_maths_evidence_filtered_page", {
    p_class_id: dummyUuid,
    p_student_id: null,
    p_since: null,
    p_source: null,
    p_limit: 1,
    p_before_occurred_at: null,
    p_before_id: null
  }]
];
const teacherOperationResults = await Promise.all(
  teacherOperations.map(async ([label, rpc, body]) => [label, await post(rpc, body)])
);
const privateValidator = await post("maths_validate_student_evidence", {
  p_skill_id: "F-N-COUNT-10",
  p_event_type: "skills_check_response",
  p_content_version: "maths-foundation-number-v2",
  p_evidence: {}
});
const privateTables = [
  "maths_assignments",
  "maths_assignment_students",
  "maths_evidence_events",
  "maths_media_issue_reports",
  "maths_evidence_sync_health"
];
const directTableResults = await Promise.all(privateTables.map(async table => {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers,
    signal: AbortSignal.timeout(15000)
  });
  return [table, { status: response.status, payload: await response.json().catch(() => ({})) }];
}));

const failures = [];
for (const [name, result] of [["student_list", studentList], ["student_complete", studentComplete]]) {
  if (result.payload?.error !== "invalid_student_session") failures.push(`${name} did not fail closed for an invalid student token`);
}
for (const [name, result] of [["teacher_list", teacherList], ["teacher_create", teacherCreate]]) {
  if (!denied(result)) failures.push(`${name} was not denied to anon`);
}
for (const [name, result] of teacherOperationResults) {
  if (!denied(result)) failures.push(`${name} was not denied to anon`);
}
if (!denied(privateValidator)) failures.push("the authored v2 evidence validator was exposed to anon");
for (const [table, result] of directTableResults) {
  if (!denied(result)) failures.push(`direct ${table} table access was not denied (HTTP ${result.status})`);
}

if (failures.length) {
  console.error(`Live Maths assignment boundary failed:\n${failures.map(item => `- ${item}`).join("\n")}`);
  process.exit(1);
}
console.log("Live Maths boundary passed: student identity is token-derived; all teacher operations, the authored v2 validator and five private tables deny anonymous access.");
process.exit(0);
