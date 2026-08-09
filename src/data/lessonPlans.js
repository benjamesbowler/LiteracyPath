export async function createTeacherLessonPlan(client, { classId, learnerIds, recipe, evidenceSource, scheduledFor = null }) {
  const { data, error } = await client.call("teacher_create_lesson_plan", {
    p_class_id: classId,
    p_intervention_id: null,
    p_learner_ids: learnerIds,
    p_recipe: recipe,
    p_evidence_source: evidenceSource,
    p_scheduled_for: scheduledFor
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "The lesson plan could not be saved.");
  return data;
}

export async function recordTeacherLessonDelivery(client, { planId, learnerIds, completionState, notes = "", observedSupport = {} }) {
  const { data, error } = await client.call("teacher_record_lesson_delivery", {
    p_plan_id: planId,
    p_client_event_id: crypto.randomUUID(),
    p_learner_ids: learnerIds,
    p_completion_state: completionState,
    p_notes: notes,
    p_observed_support: observedSupport
  });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "The lesson delivery could not be recorded.");
  return data;
}
