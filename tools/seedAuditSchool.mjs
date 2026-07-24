import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seedPath = path.join(repoRoot, "supabase", "seed", "audit_school.sql");
const DEFAULT_ANCHOR = "2026-07-23T09:00:00.000Z";
const EXPECTED_NAMES = [
  "Aarav",
  "Aisha",
  "Amara",
  "Bao",
  "Camila",
  "Diego",
  "Elena",
  "Farah",
  "Hana",
  "Ibrahim",
  "Jun",
  "Kai",
  "Lina",
  "Mateo",
  "Mei",
  "Noah",
  "Omar",
  "Priya",
  "Ravi",
  "Sofia",
  "Tariq",
  "Uma",
  "Valentina",
  "Wei",
  "Yara",
  "Zuri"
];

function sqlLiteral(value) {
  return String(value).replaceAll("'", "''");
}

export function inspectAuditSeed(sql = fs.readFileSync(seedPath, "utf8")) {
  const failures = [];
  const studentIds = [...sql.matchAll(
    /'40000000-0000-4000-8000-(\d{12})'/g
  )].map(match => match[0]);
  const uniqueStudentIds = new Set(studentIds);
  for (const name of EXPECTED_NAMES) {
    if (!sql.includes(`'${name}'`)) failures.push(`missing learner ${name}`);
  }
  for (const required of [
    "__AUDIT_PASSWORD__",
    "__AUDIT_ANCHOR__",
    "audit-teacher-a@literacypath.invalid",
    "audit-teacher-b@literacypath.invalid",
    "audit-teacher-fresh@literacypath.invalid",
    "audit-teacher-demo@literacypath.invalid",
    "audit-admin@literacypath.invalid",
    "public.app_admins",
    "[AUDIT ONLY] LiteracyPath Seed School",
    "generate_series(1, 520)",
    "'questionRecords'",
    "'itemKey', 'audit-item-'",
    "long_history_item_count <> 520",
    "administration_status = 'completed'",
    "administration_status = 'in_progress'",
    "'el_phonological_awareness'",
    "'el_encoding'",
    "'el_decoding'",
    "'el_oral_reading_fluency'",
    "'whole_class'",
    "audit-class-a-boy-formal-report.xlsx",
    "\"benchmarkScope\":{\"grade\":\"1\",\"benchmarkWindow\":\"BOY\"",
    "'guided_reading'",
    "'moonwood-tales-c-25'",
    "'supportUseEvents'",
    "'whole_word_audio'",
    "'segmented_phonemes'",
    "'reread_prompt'",
    "guided_support_count <> 25",
    "'phonics_quest'",
    "'learn_games'",
    "learn_games_count <> 25",
    "archived_at is not null",
    "audit_seed_verification_failed"
  ]) {
    if (!sql.includes(required)) failures.push(`missing seed contract: ${required}`);
  }
  for (const forbidden of [
    "'el_benchmark_phonological_awareness'",
    "'el_benchmark_encoding'",
    "'el_benchmark_decoding'",
    "'el_benchmark_oral_reading_fluency'",
    "'formal_class'",
    "audit-class-a-boy-formal-report.pdf",
    "'moonwood-tales-book-01'"
  ]) {
    if (sql.includes(forbidden)) failures.push(`non-production EL seed identifier: ${forbidden}`);
  }
  if (uniqueStudentIds.size !== 26) {
    failures.push(`expected 26 deterministic learner IDs, found ${uniqueStudentIds.size}`);
  }
  const teacherIds = new Set([...sql.matchAll(
    /'10000000-0000-4000-8000-(\d{12})'/g
  )].map(match => match[0]));
  if (teacherIds.size !== 4) {
    failures.push(`expected 4 deterministic teacher IDs, found ${teacherIds.size}`);
  }
  return {
    failures,
    learnerNames: EXPECTED_NAMES,
    learnerIds: uniqueStudentIds.size,
    teacherIds: teacherIds.size,
    adminIds: new Set([...sql.matchAll(
      /'12000000-0000-4000-8000-(\d{12})'/g
    )].map(match => match[0])).size,
    classIds: new Set([...sql.matchAll(
      /'30000000-0000-4000-8000-(\d{12})'/g
    )].map(match => match[0])).size,
    highVolumeAttempts: 520
  };
}

export function isApprovedAuditDatabaseUrl(rawUrl, environment = process.env) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { approved: false, reason: "LP_AUDIT_DATABASE_URL is not a valid URL." };
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    return { approved: false, reason: "LP_AUDIT_DATABASE_URL must use the postgres or postgresql protocol." };
  }
  const hostname = parsed.hostname.toLowerCase();
  const local = ["127.0.0.1", "localhost", "::1"].includes(hostname);
  if (local) return { approved: true, local: true, hostname };
  const explicitApproval = environment.LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT === "I_UNDERSTAND_TEST_ONLY";
  const label = String(environment.LP_AUDIT_PROJECT_LABEL || "").toLowerCase();
  if (!explicitApproval || !/(audit|test|staging|nonprod)/.test(label)) {
    return {
      approved: false,
      reason: "Remote seeding requires LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT=I_UNDERSTAND_TEST_ONLY and an audit/test/staging LP_AUDIT_PROJECT_LABEL."
    };
  }
  return { approved: true, local: false, hostname, label };
}

export function renderAuditSeed({
  password,
  anchor = DEFAULT_ANCHOR,
  sql = fs.readFileSync(seedPath, "utf8")
}) {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("LP_AUDIT_TEACHER_PASSWORD must contain at least 12 characters.");
  }
  const parsedAnchor = new Date(anchor);
  if (!Number.isFinite(parsedAnchor.getTime())) {
    throw new Error("LP_AUDIT_ANCHOR must be a valid date/time.");
  }
  return sql
    .replaceAll("__AUDIT_PASSWORD__", sqlLiteral(password))
    .replaceAll("__AUDIT_ANCHOR__", parsedAnchor.toISOString());
}

async function applyWithPsql({ databaseUrl, sql }) {
  return new Promise((resolve, reject) => {
    const child = spawn("psql", ["-v", "ON_ERROR_STOP=1"], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PGDATABASE: databaseUrl
      },
      stdio: ["pipe", "pipe", "pipe"]
    });
    child.stdout.on("data", chunk => process.stdout.write(chunk));
    child.stderr.on("data", chunk => process.stderr.write(chunk));
    child.on("error", error => {
      if (error.code === "ENOENT") {
        reject(new Error("psql is required to apply the audit seed but is not installed."));
      } else {
        reject(error);
      }
    });
    child.on("close", code => {
      if (code === 0) resolve();
      else reject(new Error(`psql exited with code ${code}.`));
    });
    child.stdin.end(sql);
  });
}

export async function main(argv = process.argv.slice(2)) {
  const mode = argv.includes("--apply") ? "apply" : "check";
  const inspection = inspectAuditSeed();
  console.log(`Audit seed learners: ${inspection.learnerIds}`);
  console.log(`Audit seed teachers: ${inspection.teacherIds}`);
  console.log(`Audit seed admins: ${inspection.adminIds}`);
  console.log(`Audit seed classes: ${inspection.classIds}`);
  console.log(`High-volume attempt rows: ${inspection.highVolumeAttempts}`);
  if (inspection.failures.length) {
    inspection.failures.forEach(failure => console.error(`- ${failure}`));
    return 1;
  }
  if (mode === "check") {
    console.log("Audit school seed contract passed.");
    return 0;
  }

  const databaseUrl = process.env.LP_AUDIT_DATABASE_URL || "";
  const approval = isApprovedAuditDatabaseUrl(databaseUrl);
  if (!approval.approved) {
    console.error(approval.reason);
    return 1;
  }
  const sql = renderAuditSeed({
    password: process.env.LP_AUDIT_TEACHER_PASSWORD || "",
    anchor: process.env.LP_AUDIT_ANCHOR || DEFAULT_ANCHOR
  });
  console.log(`Applying deterministic audit seed to approved ${approval.local ? "local" : "remote test"} database.`);
  await applyWithPsql({ databaseUrl, sql });
  console.log("Audit school applied and verified by SQL assertions.");
  return 0;
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try {
    process.exitCode = await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
