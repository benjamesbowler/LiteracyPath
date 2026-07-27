import { attachInstructionalGroupReviews } from "../utils/teacherInstructionalGroups.js";

const PAGE_SIZE = 500;
const MAX_PAGES = 40;

const GROUP_FIELDS = [
  "id",
  "teacher_id",
  "class_id",
  "name",
  "criteria",
  "status",
  "created_at",
  "updated_at"
].join(",");

const REVIEW_FIELDS = [
  "id",
  "group_id",
  "teacher_id",
  "class_id",
  "student_ids",
  "evidence_snapshot",
  "reviewed_at",
  "created_at"
].join(",");

async function loadPages({
  supabase,
  table,
  fields,
  teacherId,
  classId,
  orderColumn
}) {
  const rows = [];
  let previousTail = "";
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .table(table)
      .select(fields)
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .order(orderColumn, { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const pageRows = data || [];
    const tail = String(pageRows.at(-1)?.id || "");
    if (pageRows.length === PAGE_SIZE && tail && tail === previousTail) {
      throw new Error(`${table} pagination did not advance.`);
    }
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) return rows;
    previousTail = tail;
  }
  throw new Error(`${table} exceeded the ${PAGE_SIZE * MAX_PAGES}-row safety ceiling.`);
}

export async function loadTeacherInstructionalGroups({
  supabase,
  teacherId,
  classId
}) {
  if (!supabase || !teacherId || !classId) return [];
  const [groups, reviews] = await Promise.all([
    loadPages({
      supabase,
      table: "teacher_instructional_groups",
      fields: GROUP_FIELDS,
      teacherId,
      classId,
      orderColumn: "updated_at"
    }),
    loadPages({
      supabase,
      table: "teacher_instructional_group_reviews",
      fields: REVIEW_FIELDS,
      teacherId,
      classId,
      orderColumn: "reviewed_at"
    })
  ]);
  return attachInstructionalGroupReviews(
    groups.filter(group => group.status === "active"),
    reviews
  );
}

export async function saveTeacherInstructionalGroup({
  supabase,
  classId,
  name,
  criteria,
  studentIds,
  evidenceSnapshot
}) {
  const { data, error } = await supabase
    .call("teacher_save_instructional_group", {
      p_class_id: classId,
      p_name: name,
      p_criteria: criteria,
      p_student_ids: studentIds,
      p_evidence_snapshot: evidenceSnapshot
    })
    .single();
  if (error) throw error;
  return data;
}

export async function reviewTeacherInstructionalGroup({
  supabase,
  groupId,
  studentIds,
  evidenceSnapshot
}) {
  const { data, error } = await supabase
    .call("teacher_review_instructional_group", {
      p_group_id: groupId,
      p_student_ids: studentIds,
      p_evidence_snapshot: evidenceSnapshot
    })
    .single();
  if (error) throw error;
  return data;
}

export async function assignTeacherInstructionalGroupFollowUp({
  supabase,
  groupId,
  ownerLabel,
  activity,
  plannedFor
}) {
  const { data, error } = await supabase
    .call("teacher_assign_instructional_group_follow_up", {
      p_group_id: groupId,
      p_owner_label: ownerLabel,
      p_activity: activity,
      p_planned_for: plannedFor
    })
    .single();
  if (error) throw error;
  return data;
}
