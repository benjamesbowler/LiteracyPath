export async function createTeacherInsightIntervention({
  supabase,
  actionType,
  classId,
  insight,
  studentIds,
  targets = [],
  ownerLabel,
  activity,
  plannedFor
}) {
  const { data, error } = await supabase
    .call("teacher_create_insight_intervention", {
      p_action_type: actionType,
      p_class_id: classId,
      p_insight: insight,
      p_student_ids: studentIds,
      p_targets: targets,
      p_owner_label: ownerLabel,
      p_activity: activity,
      p_planned_for: plannedFor
    })
    .single();
  if (error) throw error;
  return data;
}

export async function recordTeacherInsightObservation({
  supabase,
  classId,
  insight,
  studentIds,
  note,
  ownerLabel,
  followUpActivity,
  followUpOn
}) {
  const { data, error } = await supabase
    .call("teacher_record_insight_observation", {
      p_class_id: classId,
      p_insight: insight,
      p_student_ids: studentIds,
      p_note: note,
      p_owner_label: ownerLabel,
      p_follow_up_activity: followUpActivity,
      p_follow_up_on: followUpOn
    })
    .single();
  if (error) throw error;
  return data;
}
