export function buildReducedChoiceProfilePatch(
  enabled,
  { teacherId = "", now = () => new Date().toISOString() } = {}
) {
  return {
    reducedChoiceMode: Boolean(enabled),
    reducedChoiceModeAt: now(),
    reducedChoiceModeBy: teacherId || "teacher"
  };
}

export async function saveStudentReducedChoiceMode({
  supabase,
  studentId,
  enabled,
  teacherId = "",
  now
}) {
  if (!supabase || !studentId) {
    return { ok: false, error: new Error("A student and database client are required.") };
  }
  const payload = buildReducedChoiceProfilePatch(enabled, { teacherId, now });
  const { error } = await supabase.from("student_progress").upsert({
    student_id: studentId,
    area: "profile",
    key: "__all__",
    payload,
    updated_at: payload.reducedChoiceModeAt
  }, { onConflict: "student_id,area,key" });

  return error ? { ok: false, error } : { ok: true, payload };
}
