import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const TEACHER_A = {
  email: "audit-teacher-a@literacypath.invalid",
  id: "10000000-0000-4000-8000-000000000001",
  classId: "30000000-0000-4000-8000-000000000001",
  studentId: "40000000-0000-4000-8000-000000000001"
};
const TEACHER_B = {
  email: "audit-teacher-b@literacypath.invalid",
  studentId: "40000000-0000-4000-8000-000000000014"
};

function clientFor(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function requireNoError(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

function requireCondition(condition, label) {
  if (!condition) throw new Error(label);
}

async function main() {
  const apiUrl = process.env.LP_AUDIT_SUPABASE_URL;
  const anonKey = process.env.LP_AUDIT_SUPABASE_ANON_KEY;
  const password = process.env.LP_AUDIT_TEACHER_PASSWORD;
  if (!apiUrl || !anonKey || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }

  const teacherA = clientFor(apiUrl, anonKey);
  const teacherB = clientFor(apiUrl, anonKey);
  requireNoError(
    await teacherA.auth.signInWithPassword({ email: TEACHER_A.email, password }),
    "Teacher A login"
  );
  requireNoError(
    await teacherB.auth.signInWithPassword({ email: TEACHER_B.email, password }),
    "Teacher B login"
  );

  const inserted = requireNoError(
    await teacherA.from("teacher_interventions").insert({
      teacher_id: TEACHER_A.id,
      class_id: TEACHER_A.classId,
      owner_label: "Backend verifier",
      group_label: "Backend verifier group",
      student_ids: [TEACHER_A.studentId],
      focus: "Lifecycle integrity",
      activity: "Verify ownership and transitions",
      planned_for: "2026-07-23",
      status: "planned"
    }).select("id").single(),
    "Owned intervention insert"
  );
  const interventionId = inserted.data.id;

  try {
    const hiddenFromTeacherB = requireNoError(
      await teacherB.from("teacher_interventions").select("id").eq("id", interventionId),
      "Cross-teacher intervention read"
    );
    requireCondition(
      hiddenFromTeacherB.data.length === 0,
      "RLS exposed Teacher A intervention to Teacher B"
    );

    const crossTeacherUpdate = requireNoError(
      await teacherB.from("teacher_interventions")
        .update({ owner_label: "Cross-tenant write" })
        .eq("id", interventionId)
        .select("id"),
      "Cross-teacher intervention update"
    );
    requireCondition(
      crossTeacherUpdate.data.length === 0,
      "RLS allowed Teacher B to update Teacher A intervention"
    );

    const skippedState = await teacherA.from("teacher_interventions")
      .update({
        status: "recorded",
        delivered_at: new Date().toISOString(),
        outcome: "effective",
        outcome_note: "Attempted state skip",
        recorded_at: new Date().toISOString()
      })
      .eq("id", interventionId)
      .select("id");
    requireCondition(
      Boolean(skippedState.error?.message?.includes("Invalid intervention lifecycle transition")),
      "The backend accepted a planned-to-recorded lifecycle skip"
    );

    const foreignLearner = await teacherA.from("teacher_interventions").insert({
      teacher_id: TEACHER_A.id,
      class_id: TEACHER_A.classId,
      owner_label: "Backend verifier",
      group_label: "Foreign learner attempt",
      student_ids: [TEACHER_B.studentId],
      focus: "Ownership integrity",
      activity: "This row must be rejected",
      planned_for: "2026-07-23",
      status: "planned"
    });
    requireCondition(
      Boolean(foreignLearner.error?.message?.includes("must belong to its class and teacher")),
      "The backend accepted a learner from another teacher's class"
    );
  } finally {
    requireNoError(
      await teacherA.from("teacher_interventions").delete().eq("id", interventionId),
      "Backend verifier cleanup"
    );
    await Promise.all([teacherA.auth.signOut(), teacherB.auth.signOut()]);
  }

  console.log("Teacher intervention backend ownership and lifecycle verification passed.");
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
