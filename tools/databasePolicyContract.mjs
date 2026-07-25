import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = path.join(repoRoot, "supabase", "migrations");
export const SECURITY_BOUNDARY_MIGRATION = "20260725150000_security_definer_boundary.sql";

export const ANON_SECURITY_DEFINER_RPCS = Object.freeze([
  "get_game_leaderboard(text, integer)",
  "report_app_error(uuid, text, text, text, text, text, text, text[], numeric)",
  "student_class_by_code(text, text)",
  "student_get_progress(text)",
  "student_log_activity_v2(text, text, text, text, text, jsonb, timestamp with time zone, integer)",
  "student_login(uuid, text, text, text)",
  "student_report_activity_sync_health(text, text, bigint, bigint, bigint, bigint, bigint, bigint, timestamp with time zone)",
  "student_save_progress(text, text, text, jsonb)"
]);

export const AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS = Object.freeze([
  "admin_error_monitor_summary()",
  "admin_get_school_retention_policy(uuid)",
  "admin_list_deletion_propagation(uuid)",
  "admin_preview_school_retention(uuid)",
  "admin_purge_expired_error_events()",
  "admin_recent_error_events(integer)",
  "admin_run_school_retention(uuid, text)",
  "admin_save_school_retention_policy(uuid, integer, integer, text, integer, integer, integer)",
  "admin_verify_deletion_propagation(uuid, text, text)",
  "find_or_create_school(text)",
  "is_app_admin(uuid)",
  "list_school_names()",
  "set_app_config(text, jsonb)",
  "teacher_assign_instructional_group_follow_up(uuid, text, text, date)",
  "teacher_class_access_log(uuid, integer)",
  "teacher_class_access_summary(uuid)",
  "teacher_create_insight_intervention(text, uuid, jsonb, uuid[], text[], text, text, date)",
  "teacher_delete_learner_data(uuid, uuid, text, text)",
  "teacher_export_learner_data(uuid, text, text)",
  "teacher_list_learner_data_rights(uuid)",
  "teacher_prepare_learner_deletion(uuid, text, text)",
  "teacher_record_insight_observation(uuid, jsonb, uuid[], text, text, text, date)",
  "teacher_regenerate_class_code(uuid)",
  "teacher_review_instructional_group(uuid, uuid[], jsonb)",
  "teacher_save_instructional_group(uuid, text, jsonb, uuid[], jsonb)",
  "teacher_set_class_code_expiry(uuid, timestamp with time zone)",
  "teacher_set_class_leaderboard_scope(uuid, text)",
  "teacher_set_school(text)"
]);

export const AUTHENTICATED_SECURITY_DEFINER_RPCS = Object.freeze([
  ...ANON_SECURITY_DEFINER_RPCS,
  ...AUTHENTICATED_ONLY_SECURITY_DEFINER_RPCS
].sort());

const LEGACY_RPC_SIGNATURES = Object.freeze([
  "student_list_schools()",
  "student_list_classes(uuid)",
  "student_list_students(uuid)",
  "student_set_password(uuid, text)",
  "student_set_password(uuid, text, text)",
  "student_login(uuid, text)",
  "student_class_by_code(text)",
  "student_log_activity(text, text, text, text, jsonb)"
]);

function comparableSignature(value) {
  return String(value || "")
    .replace(/^public\./, "")
    .replaceAll("timestamptz", "timestamp with time zone")
    .replace(/\bint\b/g, "integer")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function sorted(values) {
  return [...values].map(comparableSignature).sort();
}

function sameValues(actual, expected) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

export function auditSecurityBoundarySource({
  files = fs.readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort(),
  source = fs.readFileSync(path.join(migrationDir, SECURITY_BOUNDARY_MIGRATION), "utf8")
} = {}) {
  const failures = [];
  if (!files.includes(SECURITY_BOUNDARY_MIGRATION)) {
    failures.push(`missing ${SECURITY_BOUNDARY_MIGRATION}`);
  }
  const laterSecurityDefiners = files
    .filter(file => file > SECURITY_BOUNDARY_MIGRATION)
    .filter(file => /security\s+definer/i.test(
      fs.readFileSync(path.join(migrationDir, file), "utf8")
    ));
  if (laterSecurityDefiners.length) {
    failures.push(
      `SECURITY DEFINER functions were added after the boundary migration: ${laterSecurityDefiners.join(", ")}`
    );
  }
  for (const required of [
    "procedure.prosecdef",
    "revoke execute on function %s from public, anon, authenticated",
    "notify pgrst, 'reload schema'"
  ]) {
    if (!source.includes(required)) failures.push(`missing boundary contract: ${required}`);
  }
  for (const signature of LEGACY_RPC_SIGNATURES) {
    const escaped = signature
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace("\\(", "\\s*\\(")
      .replaceAll(",\\ ", ",\\s*");
    if (!new RegExp(`drop function if exists public\\.${escaped}`, "i").test(source)) {
      failures.push(`legacy RPC is not dropped: ${signature}`);
    }
  }
  const grantMatches = [...source.matchAll(
    /grant\s+execute\s+on\s+function\s+public\.([a-z0-9_]+\s*\([\s\S]*?\))\s+to\s+(anon,\s*authenticated|authenticated)\s*;/gi
  )];
  const anon = [];
  const authenticated = [];
  for (const match of grantMatches) {
    const signature = comparableSignature(match[1]);
    authenticated.push(signature);
    if (/^anon/i.test(match[2])) anon.push(signature);
  }
  if (!sameValues(anon, ANON_SECURITY_DEFINER_RPCS)) {
    failures.push("anonymous RPC grants do not match the explicit allow-list");
  }
  if (!sameValues(authenticated, AUTHENTICATED_SECURITY_DEFINER_RPCS)) {
    failures.push("authenticated RPC grants do not match the explicit allow-list");
  }
  return {
    failures,
    files,
    anonymousRpcCount: ANON_SECURITY_DEFINER_RPCS.length,
    authenticatedRpcCount: AUTHENTICATED_SECURITY_DEFINER_RPCS.length,
    legacyRpcCount: LEGACY_RPC_SIGNATURES.length
  };
}

export function auditSecurityDefinerCatalog(rows) {
  const failures = [];
  const normalized = rows.map(row => ({
    ...row,
    signature: comparableSignature(row.signature)
  }));
  const publicExecute = normalized.filter(row => row.public_execute);
  if (publicExecute.length) {
    failures.push(
      `PUBLIC can execute SECURITY DEFINER functions: ${publicExecute.map(row => row.signature).join(", ")}`
    );
  }
  const unsafeSearchPath = normalized.filter(row => {
    const settings = Array.isArray(row.settings) ? row.settings : [];
    return !settings.some(setting => /^search_path=public(?:,\s*extensions)?$/.test(setting));
  });
  if (unsafeSearchPath.length) {
    failures.push(
      `SECURITY DEFINER functions lack a fixed safe search_path: ${unsafeSearchPath.map(row => row.signature).join(", ")}`
    );
  }
  const anon = normalized.filter(row => row.anon_execute).map(row => row.signature);
  const authenticated = normalized
    .filter(row => row.authenticated_execute)
    .map(row => row.signature);
  if (!sameValues(anon, ANON_SECURITY_DEFINER_RPCS)) {
    failures.push(
      `live anonymous SECURITY DEFINER surface differs from allow-list; actual: ${sorted(anon).join(", ")}`
    );
  }
  if (!sameValues(authenticated, AUTHENTICATED_SECURITY_DEFINER_RPCS)) {
    failures.push(
      `live authenticated SECURITY DEFINER surface differs from allow-list; actual: ${sorted(authenticated).join(", ")}`
    );
  }
  const legacy = normalized.filter(row => LEGACY_RPC_SIGNATURES.includes(row.signature));
  if (legacy.length) {
    failures.push(`legacy SECURITY DEFINER RPCs still exist: ${legacy.map(row => row.signature).join(", ")}`);
  }
  return {
    failures,
    securityDefinerCount: normalized.length,
    privateHelperCount: normalized.filter(
      row => !row.anon_execute && !row.authenticated_execute
    ).length,
    anonymousRpcCount: anon.length,
    authenticatedRpcCount: authenticated.length
  };
}
