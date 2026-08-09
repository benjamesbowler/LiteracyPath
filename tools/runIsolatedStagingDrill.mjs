import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationsRoot = path.join(repoRoot, "supabase", "migrations");
const artifactPath = path.join(
  repoRoot,
  ".artifacts",
  "capacity",
  "2026-08-09-isolated-staging-scale-and-recovery.json"
);

const SCALE = Object.freeze({
  schools: 100,
  teachers: 500,
  classes: 2_000,
  studentsPerClass: 30,
  answersPerStudent: 20,
  masteryPerStudent: 4,
  itemMasteryPerStudent: 10
});

const PROTECTED_TABLES = Object.freeze([
  "classes",
  "students",
  "answers",
  "mastery",
  "item_mastery",
  "assessment_attempts",
  "el_assessment_reports"
]);

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
}

async function applyCurrentSchema(db) {
  await db.exec(readFileSync(path.join(repoRoot, "tools", "db", "bootstrap.sql"), "utf8"));
  const files = readdirSync(migrationsRoot).filter(file => file.endsWith(".sql")).sort();
  for (const file of files) {
    await db.exec(readFileSync(path.join(migrationsRoot, file), "utf8"));
  }
  // Supabase installs pgcrypto in `extensions`; PGlite's helper initially puts
  // it in `public`, so align the isolated drill with the hosted namespace.
  await db.exec("alter extension pgcrypto set schema extensions;");
  return files.length;
}

async function seedSyntheticLoad(db) {
  const students = SCALE.classes * SCALE.studentsPerClass;
  await db.exec(`
    insert into public.schools (id, name)
    select md5('school-' || n)::uuid, 'Synthetic School ' || n
    from generate_series(1, ${SCALE.schools}) n;

    insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
    select md5('teacher-' || n)::uuid, 'teacher-' || n || '@invalid.test', now(), '{"audit_only":true}'::jsonb
    from generate_series(1, ${SCALE.teachers}) n;

    insert into public.classes (id, teacher_id, school_id, name, access_code)
    select
      md5('class-' || n)::uuid,
      md5('teacher-' || (((n - 1) % ${SCALE.teachers}) + 1))::uuid,
      md5('school-' || (((n - 1) % ${SCALE.schools}) + 1))::uuid,
      'Synthetic Class ' || n,
      'S' || lpad(n::text, 7, '0')
    from generate_series(1, ${SCALE.classes}) n;

    insert into public.students (id, class_id, teacher_id, name)
    select
      md5('student-' || n)::uuid,
      md5('class-' || (((n - 1) / ${SCALE.studentsPerClass}) + 1))::uuid,
      md5('teacher-' || (((((n - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'Synthetic Learner ' || n
    from generate_series(1, ${students}) n;

    insert into public.answers (
      student_id, teacher_id, skill, stage, question, chosen_answer,
      correct_answer, is_correct, client_event_id
    )
    select
      md5('student-' || s)::uuid,
      md5('teacher-' || (((((s - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'skill-' || (((a - 1) % 30) + 1),
      'assessment',
      'Synthetic question ' || a,
      case when a % 4 = 0 then 'b' else 'a' end,
      'a',
      a % 4 <> 0,
      'scale-' || s || '-' || a
    from generate_series(1, ${students}) s
    cross join generate_series(1, ${SCALE.answersPerStudent}) a;

    insert into public.mastery (
      student_id, teacher_id, skill_id, skill_label, mastered, attempts,
      last_score, last_total, checkpoint_id
    )
    select
      md5('student-' || s)::uuid,
      md5('teacher-' || (((((s - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'skill-' || m,
      'Synthetic Skill ' || m,
      m <= 2,
      5,
      case when m <= 2 then 5 else 3 end,
      5,
      'scale-checkpoint-' || s || '-' || m
    from generate_series(1, ${students}) s
    cross join generate_series(1, ${SCALE.masteryPerStudent}) m;

    insert into public.item_mastery (
      student_id, teacher_id, item_key, item_type, attempts, correct,
      last_seen, last_result, sessions_seen, mastered
    )
    select
      md5('student-' || s)::uuid,
      md5('teacher-' || (((((s - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'phoneme-' || i,
      'phoneme',
      6,
      case when i <= 7 then 5 else 3 end,
      now(),
      i <= 7,
      3,
      i <= 7
    from generate_series(1, ${students}) s
    cross join generate_series(1, ${SCALE.itemMasteryPerStudent}) i;

    insert into public.assessment_attempts (
      attempt_id, student_id, class_id, teacher_id, skill_id, skill_name,
      total_questions, correct_count, accuracy, status, payload
    )
    select
      'scale-attempt-' || s,
      md5('student-' || s)::uuid::text,
      md5('class-' || (((s - 1) / ${SCALE.studentsPerClass}) + 1))::uuid::text,
      md5('teacher-' || (((((s - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'skill-1',
      'Synthetic Assessment',
      10,
      8,
      0.8,
      'passed',
      jsonb_build_object('synthetic', true, 'studentOrdinal', s)
    from generate_series(1, ${students}) s;

    insert into public.el_assessment_reports (
      report_id, report_type, class_id, student_id, teacher_id, file_name,
      summary, payload
    )
    select
      'scale-report-' || s,
      'student',
      md5('class-' || (((s - 1) / ${SCALE.studentsPerClass}) + 1))::uuid::text,
      md5('student-' || s)::uuid::text,
      md5('teacher-' || (((((s - 1) / ${SCALE.studentsPerClass})::int) % ${SCALE.teachers}) + 1))::uuid,
      'synthetic-report-' || s || '.json',
      jsonb_build_object('accuracy', 0.8),
      jsonb_build_object('synthetic', true)
    from generate_series(1, ${students}) s
    where s % 6 = 0;
  `);
}

async function tableSnapshot(db) {
  const result = {};
  for (const table of PROTECTED_TABLES) {
    const { rows: [row] } = await db.query(`
      select
        count(*)::int as rows,
        encode(
          extensions.digest(
            concat_ws(':',
              count(*)::text,
              coalesce(sum(hashtextextended(to_jsonb(row_value)::text, 0)::numeric)::text, '0'),
              coalesce(min(md5(to_jsonb(row_value)::text)), ''),
              coalesce(max(md5(to_jsonb(row_value)::text)), '')
            ),
            'sha256'
          ),
          'hex'
        ) as fingerprint
      from public.${table} row_value
    `);
    result[table] = row;
  }
  return result;
}

async function timedQuery(db, name, sql, params = []) {
  const started = performance.now();
  const result = await db.query(sql, params);
  return {
    name,
    durationMs: Number((performance.now() - started).toFixed(2)),
    rows: result.rows.length
  };
}

async function representativeQueries(db) {
  return Promise.all([
    timedQuery(db, "school-name-lookup", `
      select id, name from public.schools where name_normalized = $1 limit 20
    `, ["synthetic school 50"]),
    timedQuery(db, "teacher-class-list", `
      select id, name from public.classes where teacher_id = md5('teacher-250')::uuid order by name
    `),
    timedQuery(db, "class-roster", `
      select id, name from public.students where class_id = md5('class-1000')::uuid
        and archived_at is null order by name
    `),
    timedQuery(db, "student-progress-report", `
      select s.id,
        (select count(*) from public.answers a where a.student_id = s.id) answer_count,
        (select count(*) from public.mastery m where m.student_id = s.id and m.mastered) mastered_skills,
        (select count(*) from public.item_mastery i where i.student_id = s.id and i.mastered) mastered_items
      from public.students s where s.id = md5('student-30000')::uuid
    `),
    timedQuery(db, "class-progress-summary", `
      with answer_summary as (
        select a.student_id, count(*) attempts, count(*) filter (where a.is_correct) correct
        from public.answers a
        join public.students s on s.id = a.student_id
        where s.class_id = md5('class-1000')::uuid
        group by a.student_id
      )
      select count(*) learners, sum(attempts) attempts, sum(correct) correct
      from answer_summary
    `)
  ]);
}

async function concurrentReadProbe(db) {
  const timings = [];
  let errors = 0;
  const requests = Array.from({ length: 250 }, (_, index) => index + 1);
  const concurrency = 25;
  let cursor = 0;
  async function worker() {
    while (cursor < requests.length) {
      const request = requests[cursor++];
      const student = ((request * 239) % (SCALE.classes * SCALE.studentsPerClass)) + 1;
      const started = performance.now();
      try {
        await db.query(`
          select count(*)::int attempts, count(*) filter (where is_correct)::int correct
          from public.answers where student_id = md5($1)::uuid
        `, [`student-${student}`]);
      } catch {
        errors += 1;
      }
      timings.push(performance.now() - started);
    }
  }
  const started = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const durationMs = performance.now() - started;
  return {
    requests: requests.length,
    concurrency,
    errors,
    durationMs: Number(durationMs.toFixed(2)),
    requestsPerSecond: Number((requests.length / (durationMs / 1000)).toFixed(2)),
    p50Ms: Number(percentile(timings, 0.5).toFixed(2)),
    p95Ms: Number(percentile(timings, 0.95).toFixed(2)),
    p99Ms: Number(percentile(timings, 0.99).toFixed(2))
  };
}

const startedAt = new Date();
const source = await PGlite.create({ extensions: { pgcrypto }, relaxedDurability: true });
const migrations = await applyCurrentSchema(source);

const seedStarted = performance.now();
await seedSyntheticLoad(source);
const seedDurationMs = performance.now() - seedStarted;

const sourceSnapshot = await tableSnapshot(source);
const queries = await representativeQueries(source);
const concurrency = await concurrentReadProbe(source);

const dumpStarted = performance.now();
const dump = await source.dumpDataDir("gzip");
const dumpDurationMs = performance.now() - dumpStarted;
const dumpBytes = dump.size;

const restoreStarted = performance.now();
const restored = await PGlite.create({
  extensions: { pgcrypto },
  loadDataDir: dump,
  relaxedDurability: true
});
const restoredSnapshot = await tableSnapshot(restored);
const restoreDurationMs = performance.now() - restoreStarted;

const mismatches = PROTECTED_TABLES.filter(table => (
  sourceSnapshot[table].rows !== restoredSnapshot[table].rows
  || sourceSnapshot[table].fingerprint !== restoredSnapshot[table].fingerprint
));
const finishedAt = new Date();
const result = {
  schemaVersion: 1,
  status: mismatches.length === 0 && concurrency.errors === 0 ? "pass" : "fail",
  isolation: "local PGlite PostgreSQL; synthetic data only; no production reads or writes",
  hostedStaging: "unavailable: Supabase Branching entitlement returned HTTP 402",
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  migrationsApplied: migrations,
  scale: {
    ...SCALE,
    students: SCALE.classes * SCALE.studentsPerClass,
    answers: SCALE.classes * SCALE.studentsPerClass * SCALE.answersPerStudent,
    mastery: SCALE.classes * SCALE.studentsPerClass * SCALE.masteryPerStudent,
    itemMastery: SCALE.classes * SCALE.studentsPerClass * SCALE.itemMasteryPerStudent,
    assessmentAttempts: SCALE.classes * SCALE.studentsPerClass,
    elAssessmentReports: Math.floor((SCALE.classes * SCALE.studentsPerClass) / 6)
  },
  timings: {
    seedDurationMs: Number(seedDurationMs.toFixed(2)),
    dumpDurationMs: Number(dumpDurationMs.toFixed(2)),
    restoreDurationMs: Number(restoreDurationMs.toFixed(2))
  },
  queries,
  concurrency,
  backup: {
    bytes: dumpBytes,
    sha256: createHash("sha256").update(new Uint8Array(await dump.arrayBuffer())).digest("hex")
  },
  protectedTables: sourceSnapshot,
  restoreMismatches: mismatches
};

await mkdir(path.dirname(artifactPath), { recursive: true });
await writeFile(artifactPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
await Promise.all([source.close(), restored.close()]);

console.log(JSON.stringify(result, null, 2));
if (result.status !== "pass") process.exitCode = 1;
