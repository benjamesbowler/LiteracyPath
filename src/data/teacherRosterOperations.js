import { isMissingRpcOverload } from "./classApiCompatibility.js";

export function normalizeRosterStudentName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export async function insertRosterStudents({
  supabase,
  names,
  classId,
  teacherId
}) {
  return supabase
    .table("students")
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
  const rpcResult = await supabase.call("teacher_set_student_archived", {
    p_student_id: studentId,
    p_class_id: classId,
    p_archived: Boolean(archived)
  });
  if (!isMissingRpcOverload(rpcResult.error, "teacher_set_student_archived")) {
    return rpcResult;
  }
  return supabase
    .table("students")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", studentId)
    .eq("class_id", classId)
    .select("id");
}

export async function updateRosterStudentName({
  supabase,
  studentId,
  classId,
  name
}) {
  const normalizedName = normalizeRosterStudentName(name);
  if (!normalizedName) {
    return {
      data: null,
      error: {
        code: "LP_INVALID_STUDENT_NAME",
        message: "Enter a display name."
      }
    };
  }
  if (normalizedName.length > 80) {
    return {
      data: null,
      error: {
        code: "LP_INVALID_STUDENT_NAME",
        message: "Display names must be 80 characters or fewer."
      }
    };
  }
  return supabase
    .table("students")
    .update({ name: normalizedName })
    .eq("id", studentId)
    .eq("class_id", classId)
    .select("id,name,class_id");
}

export async function transferRosterStudent({
  supabase,
  studentId,
  sourceClassId,
  targetClassId
}) {
  return supabase
    .table("students")
    .update({ class_id: targetClassId })
    .eq("id", studentId)
    .eq("class_id", sourceClassId)
    .select("id");
}
