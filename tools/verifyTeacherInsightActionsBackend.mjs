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

const insight = {
  schemaVersion: 1,
  key: "backend-verifier-insight",
  kind: "instructional-group",
  label: "Backend verifier insight",
  focus: "Exact backend action ownership",
  reason: "One policy-ready learner shares the current target.",
  criterion: {
    type: "exact-sound-item",
    minimumIndependentAttempts: 3
  },
  evidence: {
    target: "m",
    independentAttempts: 4,
    policyReady: true
  }
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

  const createdInterventionIds = [];
  try {
    const practice = requireNoError(
      await teacherA.rpc("teacher_create_insight_intervention", {
        p_action_type: "assign_practice",
        p_class_id: TEACHER_A.classId,
        p_insight: insight,
        p_student_ids: [TEACHER_A.studentId],
        p_targets: ["m"],
        p_owner_label: "Backend verifier",
        p_activity: "Assign one exact target and review the response",
        p_planned_for: "2026-07-23"
      }).single(),
      "Owned insight practice assignment"
    );
    createdInterventionIds.push(practice.data.id);
    requireCondition(
      practice.data.group_label === "Backend verifier insight practice"
        && practice.data.student_ids[0] === TEACHER_A.studentId,
      "Practice assignment did not create the linked owned intervention"
    );

    const progress = requireNoError(
      await teacherA.from("student_progress")
        .select("payload")
        .eq("student_id", TEACHER_A.studentId)
        .eq("area", "phonics_quest")
        .eq("key", "__all__")
        .single(),
      "Assigned student progress read"
    );
    requireCondition(
      progress.data.payload?.assignment?.targets?.length === 1
        && progress.data.payload.assignment.targets[0] === "m"
        && progress.data.payload.assignment.insight?.criterion?.type === "exact-sound-item"
        && progress.data.payload.assignment.insight?.evidence?.independentAttempts === 4,
      "Practice action did not retain its exact target and evidence-backed insight"
    );

    const observation = requireNoError(
      await teacherA.rpc("teacher_record_insight_observation", {
        p_class_id: TEACHER_A.classId,
        p_insight: insight,
        p_student_ids: [TEACHER_A.studentId],
        p_note: "The learner segmented accurately after one explicit model.",
        p_owner_label: "Backend verifier",
        p_follow_up_activity: "Check transfer with one unseen item",
        p_follow_up_on: "2026-07-23"
      }).single(),
      "Owned insight observation"
    );
    createdInterventionIds.push(observation.data.intervention_id);
    requireCondition(
      observation.data.insight_snapshot?.reason === insight.reason
        && observation.data.insight_snapshot?.criterion?.type === "exact-sound-item"
        && observation.data.insight_snapshot?.evidence?.policyReady === true,
      "Observation did not retain its immutable criterion and current evidence"
    );

    const linkedIntervention = requireNoError(
      await teacherA.from("teacher_interventions")
        .select("id,group_label,student_ids")
        .eq("id", observation.data.intervention_id)
        .single(),
      "Observation follow-up read"
    );
    requireCondition(
      linkedIntervention.data.group_label === "Backend verifier insight observation follow-up"
        && linkedIntervention.data.student_ids[0] === TEACHER_A.studentId,
      "Observation did not atomically create its measured follow-up"
    );

    const hiddenObservation = requireNoError(
      await teacherB.from("teacher_insight_observations")
        .select("id")
        .eq("id", observation.data.id),
      "Cross-teacher observation read"
    );
    requireCondition(
      hiddenObservation.data.length === 0,
      "RLS exposed Teacher A's observation to Teacher B"
    );

    const directObservation = await teacherA.from("teacher_insight_observations").insert({
      teacher_id: practice.data.teacher_id,
      class_id: TEACHER_A.classId,
      intervention_id: practice.data.id,
      insight_snapshot: insight,
      student_ids: [TEACHER_A.studentId],
      note: "This direct insert must be denied."
    });
    requireCondition(
      Boolean(directObservation.error?.message?.includes("permission denied")),
      "A teacher could bypass the atomic observation RPC"
    );

    const mutatedObservation = await teacherA.from("teacher_insight_observations")
      .update({ note: "Mutated observation" })
      .eq("id", observation.data.id);
    requireCondition(
      Boolean(mutatedObservation.error?.message?.includes("permission denied")),
      "A teacher could mutate immutable observation evidence"
    );

    const foreignLearner = await teacherA.rpc("teacher_create_insight_intervention", {
      p_action_type: "assign_practice",
      p_class_id: TEACHER_A.classId,
      p_insight: { ...insight, key: "backend-verifier-foreign" },
      p_student_ids: [TEACHER_B.studentId],
      p_targets: ["m"],
      p_owner_label: "Backend verifier",
      p_activity: "This must be rejected",
      p_planned_for: "2026-07-23"
    });
    requireCondition(
      Boolean(foreignLearner.error?.message?.includes("must be active")),
      "The practice action accepted a learner from another teacher's class"
    );

    const crossTeacherAction = await teacherB.rpc("teacher_create_insight_intervention", {
      p_action_type: "plan_small_group",
      p_class_id: TEACHER_A.classId,
      p_insight: { ...insight, key: "backend-verifier-cross-teacher" },
      p_student_ids: [TEACHER_A.studentId],
      p_targets: [],
      p_owner_label: "Cross-tenant owner",
      p_activity: "This must be rejected",
      p_planned_for: "2026-07-23"
    });
    requireCondition(
      Boolean(crossTeacherAction.error?.message?.includes("owned class was not found")),
      "Teacher B could create an action in Teacher A's class"
    );

    const invalidObservation = await teacherA.rpc("teacher_record_insight_observation", {
      p_class_id: TEACHER_A.classId,
      p_insight: {
        schemaVersion: 2,
        key: "invalid-observation",
        kind: "instructional-group",
        label: "Invalid observation",
        focus: "This version must be rejected"
      },
      p_student_ids: [TEACHER_A.studentId],
      p_note: "This malformed source must roll back.",
      p_owner_label: "Backend verifier",
      p_follow_up_activity: "This intervention must not survive",
      p_follow_up_on: "2026-07-23"
    });
    requireCondition(
      Boolean(invalidObservation.error?.message?.includes("invalid schema")),
      "The backend accepted an incomplete observation insight snapshot"
    );
    const rollback = requireNoError(
      await teacherA.from("teacher_interventions")
        .select("id")
        .eq("group_label", "Invalid observation observation follow-up"),
      "Malformed-observation rollback read"
    );
    requireCondition(
      rollback.data.length === 0,
      "Malformed observation left an intervention after the transaction failed"
    );

    const unknownSnapshotKey = await teacherA.rpc("teacher_create_insight_intervention", {
      p_action_type: "plan_small_group",
      p_class_id: TEACHER_A.classId,
      p_insight: {
        ...insight,
        unboundedClientPayload: { must: "not be persisted" }
      },
      p_student_ids: [TEACHER_A.studentId],
      p_targets: [],
      p_owner_label: "Backend verifier",
      p_activity: "This must be rejected",
      p_planned_for: "2026-07-23"
    });
    requireCondition(
      Boolean(unknownSnapshotKey.error?.message?.includes("invalid schema")),
      "The backend accepted an unknown insight snapshot field"
    );
  } finally {
    if (createdInterventionIds.length) {
      requireNoError(
        await teacherA.from("teacher_interventions")
          .delete()
          .in("id", createdInterventionIds),
        "Insight-action verifier cleanup"
      );
    }
    await Promise.all([teacherA.auth.signOut(), teacherB.auth.signOut()]);
  }

  console.log(
    "Teacher insight practice, observation, follow-up, immutability, and ownership verification passed."
  );
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
