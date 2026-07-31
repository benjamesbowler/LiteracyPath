import { selectAllRows } from "./pagedSelect.js";

const CURRENT_CLASS_FIELDS = [
  "id",
  "name",
  "school_id",
  "access_code",
  "access_code_created_at",
  "access_code_expires_at",
  "leaderboard_scope"
].join(",");

const LEGACY_CLASS_FIELDS = [
  "id",
  "name",
  "school_id",
  "access_code"
].join(",");

const CURRENT_STUDENT_FIELDS = [
  "id",
  "name",
  "teacher_id",
  "class_id",
  "created_at",
  "updated_at",
  "symbol_password",
  "archived_at"
].join(",");

const LEGACY_STUDENT_FIELDS = [
  "id",
  "name",
  "teacher_id",
  "class_id",
  "created_at",
  "symbol_password"
].join(",");

function errorText(error) {
  return `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
}

export function isLegacyClassSchemaError(error) {
  if (error?.code !== "42703") return false;
  return /classes\.(access_code_created_at|access_code_expires_at|leaderboard_scope)/i
    .test(errorText(error));
}

export function isLegacyStudentSchemaError(error) {
  if (error?.code !== "42703") return false;
  return /students\.(updated_at|archived_at)/i.test(errorText(error));
}

export function isMissingRpcOverload(error, rpcName) {
  return error?.code === "PGRST202"
    && errorText(error).includes(`public.${rpcName}`);
}

function teacherClassQuery(client, teacherId, fields) {
  return client
    .table("classes")
    .select(fields)
    .eq("teacher_id", teacherId)
    .order("name", { ascending: true });
}

/**
 * Keep class loading available during a database-first or frontend-first rolling
 * release. The legacy retry is deliberately limited to the known missing-column
 * response; permission, network, validation and other database errors pass
 * through unchanged.
 */
export async function loadCompatibleTeacherClasses({ client, teacherId }) {
  const current = await selectAllRows(() =>
    teacherClassQuery(client, teacherId, CURRENT_CLASS_FIELDS)
  );
  if (!isLegacyClassSchemaError(current.error)) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await selectAllRows(() =>
    teacherClassQuery(client, teacherId, LEGACY_CLASS_FIELDS)
  );
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

function teacherStudentCountQuery(client, teacherId, fields, activeOnly) {
  let query = client
    .table("students")
    .select(fields)
    .eq("teacher_id", teacherId);
  if (activeOnly) query = query.is("archived_at", null);
  return query.order("class_id", { ascending: true });
}

/**
 * Read the active roster once for the class chooser. Class rows do not carry a
 * trustworthy student total, so showing `0 students` from a missing field is a
 * false claim. The legacy retry keeps counts working before `archived_at`
 * reaches every database.
 */
export async function loadCompatibleTeacherClassCounts({ client, teacherId }) {
  const current = await selectAllRows(() =>
    teacherStudentCountQuery(client, teacherId, "id,class_id,archived_at", true)
  );
  if (!isLegacyStudentSchemaError(current.error)) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await selectAllRows(() =>
    teacherStudentCountQuery(client, teacherId, "id,class_id", false)
  );
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

function teacherStudentQuery(client, {
  teacherId,
  classId,
  fields,
  activeOnly
}) {
  let query = client
    .table("students")
    .select(fields)
    .eq("teacher_id", teacherId)
    .eq("class_id", classId);
  if (activeOnly) query = query.is("archived_at", null);
  return query.order("name", { ascending: true });
}

/**
 * Load the teacher roster across the pre-archive and current student schemas.
 * A database without archived_at cannot contain archived rows, so its complete
 * roster is also its active roster.
 */
export async function loadCompatibleTeacherStudents({
  client,
  teacherId,
  classId
}) {
  const current = await selectAllRows(() =>
    teacherStudentQuery(client, {
      teacherId,
      classId,
      fields: CURRENT_STUDENT_FIELDS,
      activeOnly: false
    })
  );
  if (!isLegacyStudentSchemaError(current.error)) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await selectAllRows(() =>
    teacherStudentQuery(client, {
      teacherId,
      classId,
      fields: LEGACY_STUDENT_FIELDS,
      activeOnly: false
    })
  );
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

/**
 * The teacher summary uses an archived_at filter as well as a narrower field
 * set. Retry without that unavailable filter only for the known old schema.
 */
export async function loadCompatibleDashboardStudents({
  client,
  teacherId,
  classId
}) {
  const fields = "id,name,created_at";
  const current = await selectAllRows(() =>
    teacherStudentQuery(client, {
      teacherId,
      classId,
      fields,
      activeOnly: true
    })
  );
  if (!isLegacyStudentSchemaError(current.error)) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await selectAllRows(() =>
    teacherStudentQuery(client, {
      teacherId,
      classId,
      fields,
      activeOnly: false
    })
  );
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

/**
 * The device-aware class lookup is a security boundary, not a compatibility
 * enhancement. If the backend is behind the frontend, fail closed and let the
 * child-facing recovery UI ask for teacher help. Retrying the retired overload
 * would bypass the device/network/code throttles that replaced it.
 */
export async function loadCompatibleStudentClass({
  client,
  code,
  deviceId
}) {
  const current = await client.call("student_class_by_code", {
    p_code: code,
    p_device_id: deviceId
  });
  return {
    ...current,
    compatibility: isMissingRpcOverload(current.error, "student_class_by_code")
      ? "migration-required"
      : "current"
  };
}

/**
 * Student login follows the same fail-closed rule. A rolling release may keep
 * teacher-side read compatibility, but it must never restore a retired
 * anonymous authentication path.
 */
export async function loginCompatibleStudent({
  client,
  studentId,
  sequence,
  deviceId,
  code
}) {
  const current = await client.call("student_login", {
    p_student_id: studentId,
    p_sequence: sequence,
    p_device_id: deviceId,
    p_code: code
  });
  return {
    ...current,
    compatibility: isMissingRpcOverload(current.error, "student_login")
      ? "migration-required"
      : "current"
  };
}
