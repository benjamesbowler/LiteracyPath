import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRef = "ajweixqzejjfvjehofnq";

function fileEnvironment() {
  const result = {};
  for (const name of [".env", ".env.local", ".env.production", ".env.production.local"]) {
    const file = path.join(repoRoot, name);
    if (fs.existsSync(file)) Object.assign(result, dotenv.parse(fs.readFileSync(file)));
  }
  return result;
}

function projectKeys() {
  const output = execFileSync("supabase", [
    "projects", "api-keys", "--project-ref", projectRef, "--output", "json"
  ], { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const rows = JSON.parse(output);
  return {
    anon: rows.find(row => row.type === "anon" || row.name === "anon")?.api_key,
    service: rows.find(row => row.type === "service_role" || row.name === "service_role")?.api_key
  };
}

function client(url, key, accessToken = "") {
  return createClient(url, key, {
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

function requireData(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function familySnapshot({ studentId, name, schoolName }) {
  return {
    schemaVersion: 1,
    learner: { id: studentId, name, classLabel: "Audit Class", schoolName },
    updatedLabel: "Released 22 August 2026",
    highlight: `${name} is building reading skills through regular practice.`,
    strengths: [`${name} listens carefully during shared reading.`],
    canDo: [`${name} can talk about a familiar story.`],
    nextFocus: [`${name} is working on reading unfamiliar words.`],
    meaning: "Short, calm practice and reading together will help.",
    progress: [{ id: "reading_words", label: "Reading unfamiliar words", status: "growing", detail: "This is developing with teaching and practice." }],
    atHome: {
      title: "A short reading routine",
      introduction: "Read together and stop while it still feels positive.",
      durationLabel: "5 to 10 minutes",
      language: "en",
      activities: [{ moment: "Day 1", title: "Read together", direction: "Take turns reading one short page." }],
      privacyText: "Home practice is not recorded."
    },
    contact: { name: "Audit teacher", email: "", message: "Contact the school with questions." }
  };
}

const loaded = { ...fileEnvironment(), ...process.env };
const keys = projectKeys();
const url = loaded.LP_AUDIT_SUPABASE_URL || loaded.VITE_SUPABASE_URL || `https://${projectRef}.supabase.co`;
const anonKey = loaded.LP_AUDIT_SUPABASE_ANON_KEY || loaded.VITE_SUPABASE_ANON_KEY || keys.anon;
const serviceKey = loaded.LP_AUDIT_SUPABASE_SERVICE_KEY || keys.service;
if (!url || !anonKey || !serviceKey) throw new Error("Hosted Supabase credentials are unavailable.");

const service = client(url, serviceKey);
const anonymous = client(url, anonKey);
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
const schoolName = `[AUDIT ONLY] Guardian portal ${suffix}`;
const password = `${randomUUID()}Aa1!`;
const teacherEmail = `guardian-audit-teacher-${suffix}@literacypath.invalid`;
const guardianAEmail = `guardian-audit-a-${suffix}@literacypath.invalid`;
const guardianBEmail = `guardian-audit-b-${suffix}@literacypath.invalid`;
const userIds = [];
let schoolId = "";

try {
  const authSettingsResponse = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
  const authSettings = await authSettingsResponse.json();
  assert(authSettingsResponse.ok, "Hosted authentication settings could not be checked.");
  assert(authSettings.mailer_autoconfirm === false, "Hosted guardian sign-up does not require email confirmation.");

  for (const [email, metadata] of [
    [teacherEmail, { audit_only: true, feature: "guardian_portal_live" }],
    [guardianAEmail, { account_type: "guardian", feature: "guardian_portal_live" }],
    [guardianBEmail, { account_type: "guardian", feature: "guardian_portal_live" }]
  ]) {
    const created = requireData(await service.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: metadata
    }), `Create ${email}`);
    userIds.push(created.user.id);
  }
  const [teacherId, guardianAId] = userIds;
  const guardianTeacherRows = requireData(await service.from("pending_teacher_accounts").select("user_id").in("user_id", userIds.slice(1)), "Guardian teacher-queue probe");
  assert(guardianTeacherRows.length === 0, "A guardian identity entered the teacher approval queue.");
  requireData(await service.from("app_admins").insert({ user_id: teacherId, email: teacherEmail }), "Grant temporary teacher audit access");
  const school = requireData(await service.from("schools").insert({ name: schoolName }).select("id").single(), "Create audit school");
  schoolId = school.id;
  const classRow = requireData(await service.from("classes").insert({ teacher_id: teacherId, school_id: schoolId, name: "Audit Class" }).select("id").single(), "Create audit class");
  const students = requireData(await service.from("students").insert([
    { teacher_id: teacherId, class_id: classRow.id, name: "Audit Learner A" },
    { teacher_id: teacherId, class_id: classRow.id, name: "Audit Learner B" }
  ]).select("id,name"), "Create audit learners");
  const studentA = students.find(row => row.name.endsWith("A"));
  const studentB = students.find(row => row.name.endsWith("B"));

  const teacherSession = requireData(await anonymous.auth.signInWithPassword({ email: teacherEmail, password }), "Sign in audit teacher");
  const teacher = client(url, anonKey, teacherSession.session.access_token);
  const guardianASession = requireData(await client(url, anonKey).auth.signInWithPassword({ email: guardianAEmail, password }), "Sign in guardian A");
  const guardianBSession = requireData(await client(url, anonKey).auth.signInWithPassword({ email: guardianBEmail, password }), "Sign in guardian B");
  const guardianA = client(url, anonKey, guardianASession.session.access_token);
  const guardianB = client(url, anonKey, guardianBSession.session.access_token);

  const inviteA = requireData(await teacher.rpc("teacher_create_guardian_invite", { p_student_id: studentA.id, p_guardian_email: guardianAEmail, p_expires_days: 7 }), "Create guardian A invitation");
  const inviteB = requireData(await teacher.rpc("teacher_create_guardian_invite", { p_student_id: studentB.id, p_guardian_email: guardianBEmail, p_expires_days: 7 }), "Create guardian B invitation");
  assert(inviteA.ok && inviteB.ok && inviteA.token !== inviteB.token, "Teacher invitations were not unique.");

  const preview = requireData(await anonymous.rpc("guardian_invite_preview", { p_token: inviteA.token }), "Preview guardian invitation");
  assert(preview.ok && preview.school_name === schoolName, "Invitation preview did not name the school.");
  assert(!JSON.stringify(preview).includes("Audit Learner"), "Invitation preview exposed a learner before acceptance.");

  const mismatch = requireData(await guardianA.rpc("guardian_accept_invite", {
    p_token: inviteB.token,
    p_display_name: "Guardian A",
    p_terms_version: "2026-08-22-uk-beta-v2",
    p_privacy_version: "2026-08-22-uk-v2"
  }), "Cross-family invitation attempt");
  assert(!mismatch.ok && mismatch.error === "invitation_email_mismatch", "Guardian A could consume Guardian B's invitation.");

  const acceptedA = requireData(await guardianA.rpc("guardian_accept_invite", {
    p_token: inviteA.token,
    p_display_name: "Guardian A",
    p_terms_version: "2026-08-22-uk-beta-v2",
    p_privacy_version: "2026-08-22-uk-v2"
  }), "Accept guardian A invitation");
  const acceptedB = requireData(await guardianB.rpc("guardian_accept_invite", {
    p_token: inviteB.token,
    p_display_name: "Guardian B",
    p_terms_version: "2026-08-22-uk-beta-v2",
    p_privacy_version: "2026-08-22-uk-v2"
  }), "Accept guardian B invitation");
  assert(acceptedA.ok && acceptedB.ok, "Matching guardians could not accept their invitations.");

  const malformedRelease = requireData(await teacher.rpc("teacher_release_family_report", {
    p_student_id: studentA.id,
    p_title: "Malformed audit update",
    p_snapshot: {}
  }), "Reject malformed family snapshot");
  assert(!malformedRelease.ok && malformedRelease.error === "invalid_family_snapshot", "An empty family snapshot crossed the database shape contract.");

  const reportA = requireData(await teacher.rpc("teacher_release_family_report", {
    p_student_id: studentA.id,
    p_title: "Audit family update A",
    p_snapshot: familySnapshot({ studentId: studentA.id, name: studentA.name, schoolName })
  }), "Release guardian A report");
  const reportB = requireData(await teacher.rpc("teacher_release_family_report", {
    p_student_id: studentB.id,
    p_title: "Audit family update B",
    p_snapshot: familySnapshot({ studentId: studentB.id, name: studentB.name, schoolName })
  }), "Release guardian B report");
  assert(reportA.ok && reportB.ok, "Family reports were not released.");

  const portalA = requireData(await guardianA.rpc("guardian_get_portal"), "Load guardian A portal");
  const portalText = JSON.stringify(portalA);
  assert(portalA.ok && portalA.children.length === 1, "Guardian A did not receive exactly one linked learner.");
  assert(portalText.includes(studentA.id) && !portalText.includes(studentB.id), "Guardian A received another family's learner or report.");

  const foreignEvent = await guardianA.rpc("guardian_record_report_event", { p_report_id: reportB.report_id, p_event_type: "report_viewed" });
  assert(foreignEvent.error?.code === "42501", "Guardian A could record access to Guardian B's report.");
  const directRead = await guardianA.from("family_report_releases").select("id");
  assert(directRead.error?.message?.toLowerCase().includes("permission denied"), "Guardian A could bypass the reviewed portal RPC.");
  for (const table of [
    "classes", "students", "answers", "mastery", "item_mastery",
    "student_progress", "assessment_attempts", "assessment_sessions",
    "el_assessment_reports", "reading_sessions", "teacher_interventions"
  ]) {
    const result = await guardianA.from(table).select("*").limit(1);
    assert(result.error || result.data?.length === 0, `Guardian A could read ${table} directly.`);
  }
  const teacherRpcAttempt = await guardianA.rpc("teacher_list_guardian_access", { p_student_id: studentA.id });
  assert(teacherRpcAttempt.error?.code === "42501", "A guardian account crossed into the approved-teacher RPC surface.");

  const revoked = requireData(await teacher.rpc("teacher_revoke_guardian_access", { p_student_id: studentA.id, p_guardian_user_id: guardianAId }), "Revoke guardian A access");
  assert(revoked.ok, "Teacher could not revoke guardian access.");
  const afterRevocation = requireData(await guardianA.rpc("guardian_get_portal"), "Load guardian A after revocation");
  assert(afterRevocation.children.length === 0, "Revoked guardian access remained effective.");

  const teacherList = requireData(await teacher.rpc("teacher_list_guardian_access", { p_student_id: studentB.id }), "Read teacher family controls");
  assert(teacherList.links.length === 1 && teacherList.reports.length === 1, "Teacher family-control inventory is incomplete.");

  console.log("Guardian portal live verification passed: confirmation enforced, two-family isolation held, direct reads denied, and revocation was immediate.");
} finally {
  const allUserIds = [...userIds].filter(Boolean);
  if (allUserIds.length) {
    await service.from("guardian_access_audit").delete().in("guardian_user_id", allUserIds);
    await service.from("guardian_legal_acceptance_events").delete().in("guardian_user_id", allUserIds);
  }
  if (schoolId) await service.from("schools").delete().eq("id", schoolId);
  for (const userId of allUserIds.reverse()) await service.auth.admin.deleteUser(userId);
}
