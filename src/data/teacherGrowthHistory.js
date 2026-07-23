const PAGE_SIZE = 500;
const MAX_PAGES = 40;

const ATTEMPT_FIELDS = [
  "attempt_id",
  "student_id",
  "assessment_type",
  "skill_id",
  "skill_name",
  "completed_at",
  "total_questions",
  "correct_count",
  "accuracy",
  "status",
  "administration_status",
  "schema_version",
  "payload"
].join(",");

const INTERVENTION_FIELDS = [
  "id",
  "student_ids",
  "focus",
  "status",
  "outcome",
  "delivered_at",
  "recorded_at",
  "reviewed_at",
  "created_at",
  "updated_at"
].join(",");

async function loadAttemptPages({ supabase, teacherId, classId, studentId }) {
  const rows = [];
  let previousTail = "";

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("assessment_attempts")
      .select(ATTEMPT_FIELDS)
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .eq("student_id", studentId)
      .order("completed_at", { ascending: true })
      .order("attempt_id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const pageRows = data || [];
    const tail = String(pageRows.at(-1)?.attempt_id || "");
    if (pageRows.length === PAGE_SIZE && tail && tail === previousTail) {
      throw new Error("Growth history pagination did not advance.");
    }
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) return rows;
    previousTail = tail;
  }

  throw new Error(`Growth history exceeded the ${PAGE_SIZE * MAX_PAGES}-attempt safety ceiling.`);
}

async function loadInterventions({ supabase, teacherId, classId, studentId }) {
  const rows = [];
  let previousTail = "";

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("teacher_interventions")
      .select(INTERVENTION_FIELDS)
      .eq("teacher_id", teacherId)
      .eq("class_id", classId)
      .eq("status", "reviewed")
      .contains("student_ids", [studentId])
      .order("reviewed_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const pageRows = data || [];
    const tail = String(pageRows.at(-1)?.id || "");
    if (pageRows.length === PAGE_SIZE && tail && tail === previousTail) {
      throw new Error("Growth intervention pagination did not advance.");
    }
    rows.push(...pageRows);
    if (pageRows.length < PAGE_SIZE) return rows;
    previousTail = tail;
  }

  throw new Error(`Growth history exceeded the ${PAGE_SIZE * MAX_PAGES}-intervention safety ceiling.`);
}

export async function loadTeacherGrowthHistory({
  supabase,
  teacherId,
  classId,
  studentId
}) {
  if (!supabase || !teacherId || !classId || !studentId) {
    return { attempts: [], interventions: [] };
  }
  const [attempts, interventions] = await Promise.all([
    loadAttemptPages({ supabase, teacherId, classId, studentId }),
    loadInterventions({ supabase, teacherId, classId, studentId })
  ]);
  return { attempts, interventions };
}
