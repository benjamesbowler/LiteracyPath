export async function insertRosterStudents({
  supabase,
  names,
  classId,
  teacherId
}) {
  return supabase
    .from("students")
    .insert(names.map(name => ({
      name,
      class_id: classId,
      teacher_id: teacherId
    })));
}

export async function setRosterStudentArchived({
  supabase,
  studentId,
  classId,
  archived
}) {
  return supabase
    .from("students")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", studentId)
    .eq("class_id", classId)
    .select("id");
}

export async function transferRosterStudent({
  supabase,
  studentId,
  sourceClassId,
  targetClassId
}) {
  return supabase
    .from("students")
    .update({ class_id: targetClassId })
    .eq("id", studentId)
    .eq("class_id", sourceClassId)
    .select("id");
}
