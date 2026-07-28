import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = path.join(repoRoot, "supabase", "migrations");

export const HOSTED_SCHEMA_DRIFT_MIGRATION =
  "20260728129000_hosted_schema_drift_cleanup.sql";

export const HOSTED_ONLY_TABLES = Object.freeze([
  "app_user_roles",
  "child_mode_answers",
  "media_qa_records",
  "question_flags"
]);

export const HOSTED_ONLY_FUNCTIONS = Object.freeze([
  "is_app_admin()",
  "is_literacypath_admin()"
]);

export const HOSTED_DRIFT_POLICIES = Object.freeze([
  ["answers", "Admins can delete answers"],
  ["answers", "Admins can read all answers"],
  ["answers", "Teachers can delete own answers"],
  ["answers", "Teachers can insert own answers"],
  ["answers", "Teachers can read own answers"],
  ["answers", "Teachers can update own answers"],
  ["classes", "Admins can delete classes"],
  ["classes", "Admins can read all classes"],
  ["classes", "Teachers can delete own classes"],
  ["classes", "Teachers can insert own classes"],
  ["classes", "Teachers can read own classes"],
  ["classes", "Teachers can update own classes"],
  ["item_mastery", "Admins can delete item mastery"],
  ["item_mastery", "Admins can read all item mastery"],
  ["item_mastery", "Teachers can delete own item mastery"],
  ["item_mastery", "Teachers can insert own item mastery"],
  ["item_mastery", "Teachers can read own item mastery"],
  ["item_mastery", "Teachers can update own item mastery"],
  ["mastery", "Admins can delete mastery"],
  ["mastery", "Admins can read all mastery"],
  ["mastery", "Teachers can delete own mastery"],
  ["mastery", "Teachers can insert own mastery"],
  ["mastery", "Teachers can read own mastery"],
  ["mastery", "Teachers can update own mastery"],
  ["students", "Admins can delete students"],
  ["students", "Admins can read all students"],
  ["students", "Teachers can delete own students"],
  ["students", "Teachers can insert own students"],
  ["students", "Teachers can read own students"],
  ["students", "Teachers can update own students"],
  ["pending_teacher_accounts", "Admins can update pending teacher accounts"],
  ["pending_teacher_accounts", "Admins can view pending teacher accounts"],
  ["pending_teacher_accounts", "Teachers can create own pending teacher account"],
  ["pending_teacher_accounts", "Teachers can view own pending teacher account"],
  ["app_admins", "Users can read own app admin row"],
  ["app_user_roles", "Admins can insert app user roles"],
  ["app_user_roles", "Admins can update all app user roles"],
  ["app_user_roles", "Admins can view all app user roles"],
  ["app_user_roles", "Users can view own app role"],
  ["child_mode_answers", "Teachers can delete own child mode answers"],
  ["child_mode_answers", "Teachers can insert own child mode answers"],
  ["child_mode_answers", "Teachers can read own child mode answers"],
  ["media_qa_records", "Teachers can insert media QA records"],
  ["media_qa_records", "Teachers can read media QA records"],
  ["media_qa_records", "Teachers can update media QA records"],
  ["question_flags", "Admins can delete question flags"],
  ["question_flags", "Admins can update question flags"],
  ["question_flags", "Teachers can insert own question flags"],
  ["question_flags", "Teachers can read own question flags"]
]);

export const AUTHENTICATED_TABLE_PRIVILEGES = Object.freeze({
  activity_sync_health: Object.freeze(["SELECT"]),
  answers: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  app_admins: Object.freeze(["SELECT"]),
  app_error_events: Object.freeze(["SELECT"]),
  assessment_attempts: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  class_access_events: Object.freeze(["SELECT"]),
  classes: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  el_assessment_reports: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  item_mastery: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  learn_activity: Object.freeze(["SELECT", "INSERT"]),
  mastery: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  pending_teacher_accounts: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  schools: Object.freeze(["SELECT"]),
  student_progress: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  students: Object.freeze(["SELECT", "INSERT", "UPDATE"]),
  worksheet_bank: Object.freeze(["SELECT", "INSERT", "DELETE"])
});

export const TABLE_PRIVILEGES = Object.freeze([
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "TRUNCATE",
  "REFERENCES",
  "TRIGGER",
  "MAINTAIN"
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expectedGrantPattern(table, privileges) {
  const privilegePattern = privileges
    .map(privilege => privilege.toLowerCase())
    .join("\\s*,\\s*");
  return new RegExp(
    `grant\\s+${privilegePattern}\\s+on\\s+table\\s+public\\.${escapeRegExp(table)}\\s+to\\s+authenticated\\s*;`,
    "i"
  );
}

function actualAuthenticatedPrivileges(row) {
  return TABLE_PRIVILEGES.filter(
    privilege => row[`authenticated_${privilege.toLowerCase()}`]
  );
}

function samePrivileges(actual, expected) {
  return [...actual].sort().join(",") === [...expected].sort().join(",");
}

export function auditHostedSchemaDriftSource({
  files = fs.readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort(),
  source = fs.readFileSync(
    path.join(migrationDir, HOSTED_SCHEMA_DRIFT_MIGRATION),
    "utf8"
  )
} = {}) {
  const failures = [];
  if (!files.includes(HOSTED_SCHEMA_DRIFT_MIGRATION)) {
    failures.push(`missing ${HOSTED_SCHEMA_DRIFT_MIGRATION}`);
  }

  for (const [table, policy] of HOSTED_DRIFT_POLICIES) {
    const tuple = new RegExp(
      `\\(\\s*'${escapeRegExp(table)}'\\s*,\\s*'${escapeRegExp(policy)}'\\s*\\)`,
      "i"
    );
    if (!tuple.test(source)) {
      failures.push(`historical policy is not removed: ${table}.${policy}`);
    }
  }

  for (const table of HOSTED_ONLY_TABLES) {
    if (!source.includes(`'${table}'`)) {
      failures.push(`retained hosted table is not locked: ${table}`);
    }
  }
  for (const required of [
    "alter table public.%I enable row level security",
    "revoke all privileges on table public.%I from public, anon, authenticated"
  ]) {
    if (!source.includes(required)) {
      failures.push(`missing retained-table lock contract: ${required}`);
    }
  }

  for (const signature of HOSTED_ONLY_FUNCTIONS) {
    if (!new RegExp(
      `drop\\s+function\\s+if\\s+exists\\s+public\\.${escapeRegExp(signature)}\\s*;`,
      "i"
    ).test(source)) {
      failures.push(`obsolete hosted function is not removed: ${signature}`);
    }
  }

  for (const [table, privileges] of Object.entries(AUTHENTICATED_TABLE_PRIVILEGES)) {
    if (!new RegExp(
      `revoke\\s+all\\s+on\\s+table\\s+public\\.${escapeRegExp(table)}\\s+from\\s+public\\s*,\\s*anon\\s*,\\s*authenticated\\s*;`,
      "i"
    ).test(source)) {
      failures.push(`browser table privileges are not reset: ${table}`);
    }
    if (!expectedGrantPattern(table, privileges).test(source)) {
      failures.push(
        `authenticated table grant differs from the minimum surface: ${table} ${privileges.join("/")}`
      );
    }
  }

  for (const required of [
    "revoke all on sequence public.data_rights_audit_events_id_seq",
    "revoke execute on function public.teacher_create_demo_class()",
    "from public, anon;",
    "grant execute on function public.teacher_create_demo_class()",
    "to authenticated;",
    "notify pgrst, 'reload schema'"
  ]) {
    if (!source.includes(required)) failures.push(`missing hosted-drift contract: ${required}`);
  }

  if (/\bdrop\s+table\b|\bdelete\s+from\b|\btruncate\s+(?:table\s+)?public\./i.test(source)) {
    failures.push("hosted-drift cleanup contains a destructive data operation");
  }

  return {
    failures,
    files,
    historicalPolicyCount: HOSTED_DRIFT_POLICIES.length,
    retainedTableCount: HOSTED_ONLY_TABLES.length,
    exactGrantTableCount: Object.keys(AUTHENTICATED_TABLE_PRIVILEGES).length
  };
}

export function auditHostedSchemaDriftCatalog({
  tables = [],
  policies = [],
  allFunctions = [],
  sequences = []
} = {}) {
  const failures = [];
  const tableByName = new Map(tables.map(row => [row.table_name, row]));
  const historicalPolicyNames = new Set(HOSTED_DRIFT_POLICIES.map(([, name]) => name));

  for (const policy of policies) {
    if (historicalPolicyNames.has(policy.policy_name)) {
      failures.push(
        `${policy.table_name}: historical permissive policy remains: ${policy.policy_name}`
      );
    }
    if (HOSTED_ONLY_TABLES.includes(policy.table_name)) {
      failures.push(
        `${policy.table_name}: retained hosted-only table still has policy ${policy.policy_name}`
      );
    }
  }

  for (const table of HOSTED_ONLY_TABLES) {
    const row = tableByName.get(table);
    if (!row) continue;
    const anonymous = TABLE_PRIVILEGES.filter(
      privilege => row[`anon_${privilege.toLowerCase()}`]
    );
    const authenticated = actualAuthenticatedPrivileges(row);
    if (anonymous.length || authenticated.length) {
      failures.push(
        `${table}: retained hosted-only table is browser-accessible`
        + ` (anon=${anonymous.join("/") || "none"},`
        + ` authenticated=${authenticated.join("/") || "none"})`
      );
    }
  }

  for (const [table, expected] of Object.entries(AUTHENTICATED_TABLE_PRIVILEGES)) {
    const row = tableByName.get(table);
    if (!row) {
      failures.push(`${table}: canonical table is missing from the live catalogue`);
      continue;
    }
    const actual = actualAuthenticatedPrivileges(row);
    if (!samePrivileges(actual, expected)) {
      failures.push(
        `${table}: authenticated privileges are ${actual.join("/") || "none"};`
        + ` expected ${expected.join("/")}`
      );
    }
  }

  const functionBySignature = new Map(
    allFunctions.map(row => [String(row.signature || "").replace(/^public\./, ""), row])
  );
  for (const signature of HOSTED_ONLY_FUNCTIONS) {
    if (functionBySignature.has(signature)) {
      failures.push(`obsolete hosted-only function still exists: ${signature}`);
    }
  }
  const demoFunction = functionBySignature.get("teacher_create_demo_class()");
  if (!demoFunction) {
    failures.push("teacher_create_demo_class() is missing from the live catalogue");
  } else {
    if (demoFunction.public_execute || demoFunction.anon_execute) {
      failures.push("teacher_create_demo_class(): anonymous execution is still allowed");
    }
    if (!demoFunction.authenticated_execute) {
      failures.push("teacher_create_demo_class(): authenticated execution is missing");
    }
  }

  const auditSequence = sequences.find(
    row => row.sequence_name === "data_rights_audit_events_id_seq"
  );
  if (!auditSequence) {
    failures.push("data_rights_audit_events_id_seq is missing from the live catalogue");
  } else {
    const browserSequenceAccess = [
      auditSequence.anon_select && "anon SELECT",
      auditSequence.anon_usage && "anon USAGE",
      auditSequence.anon_update && "anon UPDATE",
      auditSequence.authenticated_select && "authenticated SELECT",
      auditSequence.authenticated_usage && "authenticated USAGE",
      auditSequence.authenticated_update && "authenticated UPDATE"
    ].filter(Boolean);
    if (browserSequenceAccess.length) {
      failures.push(
        `data_rights_audit_events_id_seq: browser access remains (${browserSequenceAccess.join(", ")})`
      );
    }
  }

  return {
    failures,
    historicalPolicyCount: HOSTED_DRIFT_POLICIES.length,
    retainedHostedTablesPresent: HOSTED_ONLY_TABLES.filter(table => tableByName.has(table)).length,
    exactGrantTableCount: Object.keys(AUTHENTICATED_TABLE_PRIVILEGES).length
  };
}
