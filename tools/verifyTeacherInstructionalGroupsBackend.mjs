import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const TEACHER_A = {
  email: "audit-teacher-a@literacypath.invalid",
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

const criteria = {
  schemaVersion: 1,
  sourceId: "backend-verifier",
  kind: "shared-current-curriculum-focus",
  label: "Backend ownership focus",
  basis: "Shared current curriculum focus",
  policy: "Verifier policy"
};

const snapshot = {
  schemaVersion: 1,
  capturedAt: "2026-07-23T09:00:00.000Z",
  memberCount: 1,
  policyReadyMembers: 1,
  attempts: 8,
  skillDiversity: 2,
  latestEvidenceAt: "2026-07-23T09:00:00.000Z",
  averageAccuracy: 75,
  supportRecorded: 2,
  supportUsed: 1
};

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

  const saved = requireNoError(
    await teacherA.rpc("teacher_save_instructional_group", {
      p_class_id: TEACHER_A.classId,
      p_name: "Backend verifier instructional group",
      p_criteria: criteria,
      p_student_ids: [TEACHER_A.studentId],
      p_evidence_snapshot: snapshot
    }).single(),
    "Owned instructional group save"
  );
  const groupId = saved.data.id;
  let interventionId = "";

  try {
    const reviews = requireNoError(
      await teacherA.from("teacher_instructional_group_reviews")
        .select("id,student_ids")
        .eq("group_id", groupId),
      "Owned review read"
    );
    requireCondition(
      reviews.data.length === 1
        && reviews.data[0].student_ids[0] === TEACHER_A.studentId,
      "Atomic group save did not create the initial review snapshot"
    );
    const reviewId = reviews.data[0].id;

    const directGroupShell = await teacherA.from("teacher_instructional_groups").insert({
      teacher_id: saved.data.teacher_id,
      class_id: TEACHER_A.classId,
      name: "Backend verifier direct shell",
      criteria: { ...criteria, sourceId: "backend-verifier-direct-shell" }
    });
    requireCondition(
      Boolean(directGroupShell.error?.message?.includes("permission denied")),
      "A teacher could bypass the atomic save RPC and create a group without a review"
    );

    const directReview = await teacherA.from("teacher_instructional_group_reviews").insert({
      group_id: groupId,
      teacher_id: saved.data.teacher_id,
      class_id: TEACHER_A.classId,
      student_ids: [TEACHER_A.studentId],
      evidence_snapshot: snapshot
    });
    requireCondition(
      Boolean(directReview.error?.message?.includes("permission denied")),
      "A teacher could bypass the review RPC and insert an untrusted snapshot"
    );

    const invalidSnapshot = await teacherA.rpc("teacher_save_instructional_group", {
      p_class_id: TEACHER_A.classId,
      p_name: "Backend verifier invalid snapshot",
      p_criteria: { ...criteria, sourceId: "backend-verifier-invalid-snapshot" },
      p_student_ids: [TEACHER_A.studentId],
      p_evidence_snapshot: { memberCount: 1 }
    });
    requireCondition(
      Boolean(invalidSnapshot.error?.message?.includes("invalid schema")),
      "The backend accepted an incomplete instructional-group evidence snapshot"
    );
    const invalidSnapshotRollback = requireNoError(
      await teacherA.from("teacher_instructional_groups")
        .select("id")
        .eq("name", "Backend verifier invalid snapshot"),
      "Invalid-snapshot rollback check"
    );
    requireCondition(
      invalidSnapshotRollback.data.length === 0,
      "The atomic save left a group shell after rejecting its evidence snapshot"
    );

    const mutatedSnapshot = await teacherA.from("teacher_instructional_group_reviews")
      .update({ evidence_snapshot: { altered: true } })
      .eq("id", reviewId);
    requireCondition(
      Boolean(mutatedSnapshot.error?.message?.includes("permission denied")),
      "A teacher could mutate an immutable instructional group review snapshot"
    );

    const mutatedCriterion = await teacherA.from("teacher_instructional_groups")
      .update({ criteria: { ...criteria, label: "Altered criterion" } })
      .eq("id", groupId);
    requireCondition(
      Boolean(mutatedCriterion.error?.message?.includes("immutable")),
      "A teacher could replace the criterion behind a saved instructional group"
    );

    const hiddenFromTeacherB = requireNoError(
      await teacherB.from("teacher_instructional_groups").select("id").eq("id", groupId),
      "Cross-teacher group read"
    );
    requireCondition(
      hiddenFromTeacherB.data.length === 0,
      "RLS exposed Teacher A instructional group to Teacher B"
    );

    const crossTeacherUpdate = requireNoError(
      await teacherB.from("teacher_instructional_groups")
        .update({ name: "Cross-tenant write" })
        .eq("id", groupId)
        .select("id"),
      "Cross-teacher group update"
    );
    requireCondition(
      crossTeacherUpdate.data.length === 0,
      "RLS allowed Teacher B to update Teacher A instructional group"
    );

    const foreignMember = await teacherA.rpc("teacher_save_instructional_group", {
      p_class_id: TEACHER_A.classId,
      p_name: "Backend verifier foreign member",
      p_criteria: { ...criteria, sourceId: "backend-verifier-foreign" },
      p_student_ids: [TEACHER_B.studentId],
      p_evidence_snapshot: snapshot
    });
    requireCondition(
      Boolean(foreignMember.error?.message?.includes("must be active in its class and teacher")),
      "The backend accepted a learner from another teacher's class"
    );
    const rolledBack = requireNoError(
      await teacherA.from("teacher_instructional_groups")
        .select("id")
        .eq("name", "Backend verifier foreign member"),
      "Foreign-member rollback check"
    );
    requireCondition(
      rolledBack.data.length === 0,
      "The atomic save left a group shell after rejecting its membership"
    );

    const duplicateReview = await teacherA.rpc("teacher_review_instructional_group", {
      p_group_id: groupId,
      p_student_ids: [TEACHER_A.studentId, TEACHER_A.studentId],
      p_evidence_snapshot: snapshot
    });
    requireCondition(
      Boolean(duplicateReview.error?.message?.includes("cannot contain duplicate learners")),
      "The backend accepted duplicate group membership"
    );

    const assignment = requireNoError(
      await teacherA.rpc("teacher_assign_instructional_group_follow_up", {
        p_group_id: groupId,
        p_owner_label: "Backend verifier",
        p_activity: "Verify the atomic group-to-intervention link",
        p_planned_for: "2026-07-23"
      }).single(),
      "Owned group follow-up assignment"
    );
    interventionId = assignment.data.id;
    requireCondition(
      assignment.data.instructional_group_id === groupId
        && assignment.data.student_ids.length === 1
        && assignment.data.student_ids[0] === TEACHER_A.studentId,
      "Assigned follow-up did not retain the group and latest reviewed membership"
    );

    const crossTeacherAssignment = await teacherB.rpc(
      "teacher_assign_instructional_group_follow_up",
      {
        p_group_id: groupId,
        p_owner_label: "Cross-tenant owner",
        p_activity: "This must be rejected",
        p_planned_for: "2026-07-23"
      }
    );
    requireCondition(
      Boolean(crossTeacherAssignment.error?.message?.includes("was not found")),
      "Teacher B could assign a follow-up from Teacher A's group"
    );
  } finally {
    if (interventionId) {
      requireNoError(
        await teacherA.rpc("teacher_delete_planned_intervention", {
          p_intervention_id: interventionId
        }),
        "Backend verifier intervention cleanup"
      );
    }
    requireNoError(
      await teacherA.from("teacher_instructional_groups")
        .update({ status: "archived" })
        .eq("id", groupId),
      "Backend verifier group archive"
    );
    await Promise.all([teacherA.auth.signOut(), teacherB.auth.signOut()]);
  }

  console.log("Teacher instructional group ownership, snapshots, and assignment verification passed.");
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
