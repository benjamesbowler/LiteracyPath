// Presentation context only. Every launch still goes through its own owned RPC.
const PURPOSES = new Set(["practise", "assess", "read"]);
const ADMINISTRATIONS = new Set(["supported_practice", "student_independent", "teacher_observed", "teacher_paced"]);

export function createTeacherLaunchContext({ classId, audience = "whole_class", studentIds = [], target = "", purpose = "practise", administration = "supported_practice", contentId = "", returnView = "teacherDashboard", returnLabel = "Return to class" } = {}) {
  if (!classId) throw new Error("Choose a class before preparing an activity.");
  if (!["whole_class", "selected_students"].includes(audience)) throw new Error("Choose who will take part.");
  const ids = [...new Set(studentIds.filter(Boolean).map(String))];
  if (audience === "selected_students" && !ids.length) throw new Error("Choose at least one student.");
  if (!PURPOSES.has(purpose) || !ADMINISTRATIONS.has(administration)) throw new Error("Choose the activity and how it will be used.");
  return Object.freeze({ classId: String(classId), audience, studentIds: audience === "whole_class" ? [] : ids, target, purpose, administration, contentId, returnView, returnLabel });
}

export function resolveLaunchAudience(context, students = []) {
  const active = students.filter(student => student?.id && !student.archived_at && !student.archivedAt);
  if (context?.audience === "whole_class") return { students: active, missingIds: [], label: `Whole class · ${active.length} students` };
  const ids = new Set((context?.studentIds || []).map(String));
  const chosen = active.filter(student => ids.has(String(student.id)));
  const available = new Set(chosen.map(student => String(student.id)));
  return { students: chosen, missingIds: [...ids].filter(id => !available.has(id)), label: `${chosen.length} selected ${chosen.length === 1 ? "student" : "students"}` };
}
