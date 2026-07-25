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

function errorText(error) {
  return `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;
}

export function isLegacyClassSchemaError(error) {
  if (error?.code !== "42703") return false;
  return /classes\.(access_code_created_at|access_code_expires_at|leaderboard_scope)/i
    .test(errorText(error));
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
  const current = await teacherClassQuery(client, teacherId, CURRENT_CLASS_FIELDS);
  if (!isLegacyClassSchemaError(current.error)) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await teacherClassQuery(client, teacherId, LEGACY_CLASS_FIELDS);
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

/**
 * The July class-access migration added a device ID to the roster lookup. Retry
 * the previous signature only when PostgREST proves that exact overload is not
 * installed yet.
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
  if (!isMissingRpcOverload(current.error, "student_class_by_code")) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await client.call("student_class_by_code", { p_code: code });
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}

/**
 * The matching student-login overload changed in the same migration. As above,
 * no functional or authorization error is converted into a legacy retry.
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
  if (!isMissingRpcOverload(current.error, "student_login")) {
    return { ...current, compatibility: "current" };
  }
  const legacy = await client.call("student_login", {
    p_student_id: studentId,
    p_sequence: sequence
  });
  return { ...legacy, compatibility: legacy.error ? "failed" : "legacy" };
}
