import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

const EXPECTED = Object.freeze({
  teacherA: {
    email: "audit-teacher-a@literacypath.invalid",
    userId: "10000000-0000-4000-8000-000000000001",
    classId: "30000000-0000-4000-8000-000000000001",
    learnerCount: 13,
    activeLearnerCount: 12,
    longHistoryCount: 520
  },
  teacherB: {
    email: "audit-teacher-b@literacypath.invalid",
    userId: "10000000-0000-4000-8000-000000000002",
    classId: "30000000-0000-4000-8000-000000000002",
    learnerCount: 13,
    activeLearnerCount: 13,
    longHistoryCount: 0
  }
});

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result;
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

async function verifyTeacher({
  apiUrl,
  anonKey,
  password,
  expected,
  forbiddenClassId,
  clientFactory
}) {
  const client = clientFactory(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
  const login = requireResult(
    await client.auth.signInWithPassword({ email: expected.email, password }),
    `${expected.email} login`
  );
  requireEqual(login.data.user?.id, expected.userId, `${expected.email} user ID`);

  const classes = requireResult(
    await client.from("classes").select("id, name, teacher_id"),
    `${expected.email} classes`
  );
  requireEqual(classes.data.length, 1, `${expected.email} visible class count`);
  requireEqual(classes.data[0]?.id, expected.classId, `${expected.email} owned class`);

  const forbiddenClass = requireResult(
    await client.from("classes").select("id").eq("id", forbiddenClassId),
    `${expected.email} forbidden class query`
  );
  requireEqual(forbiddenClass.data.length, 0, `${expected.email} cross-teacher class isolation`);

  const learners = requireResult(
    await client.from("students")
      .select("id, name, class_id, archived_at")
      .eq("class_id", expected.classId),
    `${expected.email} learners`
  );
  requireEqual(learners.data.length, expected.learnerCount, `${expected.email} learner count`);
  requireEqual(
    learners.data.filter(row => row.archived_at === null).length,
    expected.activeLearnerCount,
    `${expected.email} active learner count`
  );
  requireEqual(
    learners.data.every(row => row.class_id === expected.classId),
    true,
    `${expected.email} learner ownership`
  );

  const longHistory = requireResult(
    await client.from("assessment_attempts")
      .select("attempt_id", { count: "exact", head: true })
      .like("attempt_id", "audit-long-history-%"),
    `${expected.email} long assessment history`
  );
  requireEqual(
    longHistory.count,
    expected.longHistoryCount,
    `${expected.email} isolated long-history count`
  );

  const progress = requireResult(
    await client.from("student_progress")
      .select("student_id, area")
      .in("area", ["guided_reading", "phonics_quest"]),
    `${expected.email} progress fixtures`
  );
  requireEqual(
    progress.data.filter(row => row.area === "guided_reading").length,
    expected.activeLearnerCount,
    `${expected.email} Guided Reading fixture count`
  );
  requireEqual(
    progress.data.filter(row => row.area === "phonics_quest").length,
    expected.activeLearnerCount,
    `${expected.email} Sound Seekers fixture count`
  );

  requireResult(await client.auth.signOut(), `${expected.email} logout`);
  return {
    email: expected.email,
    classId: expected.classId,
    learners: learners.data.length,
    activeLearners: expected.activeLearnerCount,
    longHistory: longHistory.count
  };
}

export async function verifyAuditSchoolLive({
  apiUrl,
  anonKey,
  password,
  clientFactory = createClient
}) {
  if (!apiUrl || !anonKey || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }
  const [teacherA, teacherB] = await Promise.all([
    verifyTeacher({
      apiUrl,
      anonKey,
      password,
      expected: EXPECTED.teacherA,
      forbiddenClassId: EXPECTED.teacherB.classId,
      clientFactory
    }),
    verifyTeacher({
      apiUrl,
      anonKey,
      password,
      expected: EXPECTED.teacherB,
      forbiddenClassId: EXPECTED.teacherA.classId,
      clientFactory
    })
  ]);
  return { teacherA, teacherB };
}

export async function main(environment = process.env) {
  const result = await verifyAuditSchoolLive({
    apiUrl: environment.LP_AUDIT_SUPABASE_URL,
    anonKey: environment.LP_AUDIT_SUPABASE_ANON_KEY,
    password: environment.LP_AUDIT_TEACHER_PASSWORD
  });
  console.log("Audit school live Auth + RLS verification passed.");
  console.log(JSON.stringify(result, null, 2));
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
