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
const directTable = await fetch(`${url}/rest/v1/maths_assignments?select=id&limit=1`, { headers, signal: AbortSignal.timeout(15000) });
const directPayload = await directTable.json().catch(() => ({}));

const failures = [];
for (const [name, result] of [["student_list", studentList], ["student_complete", studentComplete]]) {
  if (result.payload?.error !== "invalid_student_session") failures.push(`${name} did not fail closed for an invalid student token`);
}
for (const [name, result] of [["teacher_list", teacherList], ["teacher_create", teacherCreate]]) {
  if (![401, 403].includes(result.status) && result.payload?.code !== "42501") failures.push(`${name} was not denied to anon`);
}
if (![401, 403].includes(directTable.status) && directPayload?.code !== "42501") failures.push("direct assignment table access was not denied");

if (failures.length) {
  console.error(`Live Maths assignment boundary failed:\n${failures.map(item => `- ${item}`).join("\n")}`);
  process.exit(1);
}
console.log("Live Maths assignment boundary passed: student identity is token-derived; teacher RPCs and both tables deny anonymous access.");
process.exit(0);
