import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const TEACHER_A = {
  email: "audit-teacher-a@literacypath.invalid",
  id: "10000000-0000-4000-8000-000000000001",
  classId: "30000000-0000-4000-8000-000000000001",
  studentId: "40000000-0000-4000-8000-000000000001",
  archivedStudentId: "40000000-0000-4000-8000-000000000013"
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

function errorContains(result, text) {
  return String(result.error?.message || "").includes(text);
}

async function createPlan(client, {
  groupLabel,
  studentIds = [TEACHER_A.studentId],
  plannedFor = "2026-07-29"
}) {
  return client.rpc("teacher_create_intervention_plan", {
    p_class_id: TEACHER_A.classId,
    p_owner_label: "Backend verifier",
    p_group_label: groupLabel,
    p_student_ids: studentIds,
    p_focus: "Lifecycle integrity",
    p_activity: "Verify server-owned support evidence",
    p_planned_for: plannedFor
  });
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

  const prefix = `Backend evidence ${Date.now()}`;

  try {
    const directInsert = await teacherA.from("teacher_interventions").insert({
      teacher_id: TEACHER_A.id,
      class_id: TEACHER_A.classId,
      owner_label: "Forged browser",
      group_label: `${prefix} forged`,
      student_ids: [TEACHER_A.studentId],
      focus: "Forged evidence",
      activity: "This terminal row must be rejected",
      planned_for: "2026-07-29",
      status: "reviewed",
      delivered_at: "2001-01-01T00:00:00.000Z",
      outcome: "effective",
      outcome_note: "Forged",
      recorded_at: "2001-01-01T00:00:00.000Z",
      reviewed_at: "2001-01-01T00:00:00.000Z",
      next_review_on: "2026-07-30"
    });
    requireCondition(
      Boolean(directInsert.error),
      "Authenticated browser inserted terminal intervention evidence directly"
    );

    const emptyGroup = await createPlan(teacherA, {
      groupLabel: `${prefix} empty`,
      studentIds: []
    });
    requireCondition(
      errorContains(emptyGroup, "at least one learner"),
      "The backend accepted a support plan with no learners"
    );

    const archivedLearner = await createPlan(teacherA, {
      groupLabel: `${prefix} archived`,
      studentIds: [TEACHER_A.archivedStudentId]
    });
    requireCondition(
      errorContains(archivedLearner, "active and belong"),
      "The backend accepted an archived learner in a support plan"
    );

    const foreignLearner = await createPlan(teacherA, {
      groupLabel: `${prefix} foreign`,
      studentIds: [TEACHER_B.studentId]
    });
    requireCondition(
      errorContains(foreignLearner, "active and belong"),
      "The backend accepted a learner from another teacher's class"
    );

    const lifecycle = requireNoError(
      await createPlan(teacherA, {
        groupLabel: `${prefix} lifecycle`,
        plannedFor: "2026-07-29"
      }),
      "Owned support-plan creation"
    ).data;
    const lifecycleId = lifecycle.id;

    const hiddenFromTeacherB = requireNoError(
      await teacherB.from("teacher_interventions").select("id").eq("id", lifecycleId),
      "Cross-teacher intervention read"
    );
    requireCondition(
      hiddenFromTeacherB.data.length === 0,
      "RLS exposed Teacher A intervention to Teacher B"
    );

    const crossTeacherEdit = await teacherB.rpc("teacher_update_planned_intervention", {
      p_intervention_id: lifecycleId,
      p_owner_label: "Wrong teacher",
      p_group_label: "Cross-tenant write",
      p_student_ids: [TEACHER_B.studentId],
      p_focus: "Wrong teacher",
      p_activity: "Must fail",
      p_planned_for: "2026-07-30"
    });
    requireCondition(
      errorContains(crossTeacherEdit, "planned support record was not found"),
      "Teacher B changed Teacher A's support plan"
    );

    const forgedTime = await teacherA
      .from("teacher_interventions")
      .update({
        status: "delivered",
        delivered_at: "2001-01-01T00:00:00.000Z"
      })
      .eq("id", lifecycleId);
    requireCondition(
      Boolean(forgedTime.error),
      "Authenticated browser supplied a forged delivery timestamp"
    );

    const edited = requireNoError(
      await teacherA.rpc("teacher_update_planned_intervention", {
        p_intervention_id: lifecycleId,
        p_owner_label: "Reading teacher",
        p_group_label: `${prefix} rescheduled`,
        p_student_ids: [TEACHER_A.studentId],
        p_focus: "Initial sound a",
        p_activity: "Model, practise, check",
        p_planned_for: "2026-07-30"
      }),
      "Owned planned intervention update"
    ).data;
    requireCondition(
      edited.planned_for === "2026-07-30"
        && edited.group_label === `${prefix} rescheduled`,
      "The planned support record did not retain its correction"
    );

    const delivered = requireNoError(
      await teacherA.rpc("teacher_mark_intervention_delivered", {
        p_intervention_id: lifecycleId
      }),
      "Server-owned intervention delivery"
    ).data;
    const deliveredAt = new Date(delivered.delivered_at).getTime();
    requireCondition(
      Number.isFinite(deliveredAt) && deliveredAt > Date.now() - 60_000,
      "Delivery did not use a current server-owned timestamp"
    );

    const recorded = requireNoError(
      await teacherA.rpc("teacher_record_intervention_outcome", {
        p_intervention_id: lifecycleId,
        p_outcome: "partial",
        p_outcome_note: "Needed one extra model before answering."
      }),
      "Server-owned intervention outcome"
    ).data;
    requireCondition(
      recorded.status === "recorded"
        && recorded.outcome === "partial"
        && new Date(recorded.recorded_at).getTime() >= deliveredAt,
      "Outcome evidence was not appended after delivery"
    );

    const reviewed = requireNoError(
      await teacherA.rpc("teacher_review_intervention", {
        p_intervention_id: lifecycleId,
        p_next_review_on: "2026-08-06"
      }),
      "Server-owned intervention review"
    ).data;
    requireCondition(
      reviewed.status === "reviewed"
        && reviewed.follow_up_required === true
        && new Date(reviewed.reviewed_at).getTime()
          >= new Date(recorded.recorded_at).getTime(),
      "Review evidence was not appended in lifecycle order"
    );

    const rewriteReviewed = await teacherA
      .from("teacher_interventions")
      .update({ outcome_note: "Rewritten evidence" })
      .eq("id", lifecycleId);
    requireCondition(
      Boolean(rewriteReviewed.error),
      "Authenticated browser rewrote reviewed evidence"
    );

    const deleteReviewed = await teacherA
      .from("teacher_interventions")
      .delete()
      .eq("id", lifecycleId);
    requireCondition(
      Boolean(deleteReviewed.error),
      "Authenticated browser directly deleted reviewed evidence"
    );

    const deleteReviewedRpc = await teacherA.rpc("teacher_delete_planned_intervention", {
      p_intervention_id: lifecycleId
    });
    requireCondition(
      errorContains(deleteReviewedRpc, "planned support record was not found"),
      "Planned-draft RPC deleted reviewed evidence"
    );

    const draft = requireNoError(
      await createPlan(teacherA, { groupLabel: `${prefix} disposable draft` }),
      "Disposable draft creation"
    ).data;
    requireNoError(
      await teacherA.rpc("teacher_delete_planned_intervention", {
        p_intervention_id: draft.id
      }),
      "Planned draft deletion"
    );
    const deletedDraft = requireNoError(
      await teacherA.from("teacher_interventions").select("id").eq("id", draft.id),
      "Deleted draft check"
    );
    requireCondition(deletedDraft.data.length === 0, "Planned draft still exists after deletion");

    const deletedDraftEvent = requireNoError(
      await teacherA
        .from("teacher_intervention_events")
        .select("event_type,actor_kind,occurred_at")
        .eq("intervention_id", draft.id)
        .eq("event_type", "plan_deleted"),
      "Deleted draft event history"
    );
    requireCondition(
      deletedDraftEvent.data.length === 1
        && deletedDraftEvent.data[0].actor_kind === "teacher",
      "Planned draft deletion lost its actor/time provenance"
    );

    const cancelPlan = requireNoError(
      await createPlan(teacherA, { groupLabel: `${prefix} cancellation` }),
      "Cancellable support creation"
    ).data;
    const cancelDelivery = requireNoError(
      await teacherA.rpc("teacher_mark_intervention_delivered", {
        p_intervention_id: cancelPlan.id
      }),
      "Cancellable support delivery"
    ).data;
    const cancelled = requireNoError(
      await teacherA.rpc("teacher_cancel_intervention", {
        p_intervention_id: cancelPlan.id,
        p_reason: "The learner moved before follow-up."
      }),
      "Delivered support cancellation"
    ).data;
    requireCondition(
      cancelled.status === "cancelled"
        && cancelled.cancelled_from_status === "delivered"
        && cancelled.cancel_reason === "The learner moved before follow-up."
        && cancelled.delivered_at === cancelDelivery.delivered_at,
      "Cancellation lost the original delivery evidence or its reason"
    );

    const lifecycleEvents = requireNoError(
      await teacherA
        .from("teacher_intervention_events")
        .select("event_type,from_status,to_status,actor_kind,occurred_at")
        .eq("intervention_id", lifecycleId)
        .order("occurred_at", { ascending: true })
        .order("id", { ascending: true }),
      "Lifecycle event history"
    ).data;
    requireCondition(
      lifecycleEvents.map(event => event.event_type).join(",")
        === "plan_created,plan_updated,delivered,outcome_recorded,reviewed",
      "Lifecycle event history is incomplete or out of order"
    );
    requireCondition(
      lifecycleEvents.every(event => event.actor_kind === "teacher" && event.occurred_at),
      "Lifecycle event history lost actor or server-time provenance"
    );

    const rewriteHistory = await teacherA
      .from("teacher_intervention_events")
      .update({ detail: { forged: true } })
      .eq("intervention_id", lifecycleId);
    requireCondition(Boolean(rewriteHistory.error), "Authenticated browser rewrote event history");

    const deleteHistory = await teacherA
      .from("teacher_intervention_events")
      .delete()
      .eq("intervention_id", lifecycleId);
    requireCondition(Boolean(deleteHistory.error), "Authenticated browser deleted event history");
  } finally {
    await Promise.all([teacherA.auth.signOut(), teacherB.auth.signOut()]);
  }

  console.log(
    "Teacher intervention RPC ownership, server-time, lifecycle immutability, draft deletion, cancellation, and append-only history verification passed."
  );
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
