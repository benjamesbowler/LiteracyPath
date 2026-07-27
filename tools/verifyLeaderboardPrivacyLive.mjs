import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

const EXPECTED = Object.freeze({
  teacherEmail: "audit-teacher-a@literacypath.invalid",
  classId: "30000000-0000-4000-8000-000000000001",
  studentId: "40000000-0000-4000-8000-000000000001",
  studentPassword: "111",
  classCode: "QA7M2K",
  deviceId: "audit-leaderboard-device-v1",
  classRows: 12,
  schoolRows: 25,
  realNames: [
    "Aarav", "Aisha", "Amara", "Bao", "Camila", "Diego", "Elena", "Farah",
    "Hana", "Ibrahim", "Jun", "Kai", "Lina", "Mateo", "Mei", "Noah", "Omar",
    "Priya", "Ravi", "Sofia", "Tariq", "Uma", "Valentina", "Wei", "Yara", "Zuri"
  ]
});

function client(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

function assertPrivateBoard(board, { scope, rowCount }) {
  assert(board?.scope === scope, `expected ${scope} scope, received ${board?.scope}`);
  assert(Array.isArray(board?.rows), "leaderboard rows were not returned");
  assert(board.rows.length === rowCount, `expected ${rowCount} ${scope} rows, received ${board.rows.length}`);
  assert(
    board.rows.every(row => /^Reader [A-F0-9]{6}$/.test(row.student_name)),
    "leaderboard returned a non-pseudonymous identity"
  );
  assert(
    board.rows.every(row => !EXPECTED.realNames.includes(row.student_name)),
    "leaderboard exposed a real learner name"
  );
  assert(
    board.rows.every(row => Number(row.total_points) > 0),
    "leaderboard fixture did not return scored rows"
  );
}

export async function verifyLeaderboardPrivacyLive({ apiUrl, anonKey, password }) {
  if (!apiUrl || !anonKey || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }

  const studentClient = client(apiUrl, anonKey);
  const invalid = await studentClient.rpc("get_game_leaderboard", {
    p_student_token: "not-a-valid-session-token",
    p_limit: 50
  });
  assert(Boolean(invalid.error), "anonymous caller without a valid student session was accepted");

  const unauthorizedScopeChange = await studentClient.rpc(
    "teacher_set_class_leaderboard_scope",
    { p_class_id: EXPECTED.classId, p_scope: "school" }
  );
  assert(Boolean(unauthorizedScopeChange.error), "anonymous caller changed leaderboard scope");

  const login = requireResult(
    await studentClient.rpc("student_login", {
      p_student_id: EXPECTED.studentId,
      p_sequence: EXPECTED.studentPassword,
      p_device_id: EXPECTED.deviceId,
      p_code: EXPECTED.classCode
    }),
    "audit learner login"
  );
  assert(login?.ok && login?.token, "audit learner login did not return a valid session token");

  const classBoard = requireResult(
    await studentClient.rpc("get_game_leaderboard", {
      p_student_token: login.token,
      p_limit: 50
    }),
    "class leaderboard"
  );
  assertPrivateBoard(classBoard, { scope: "class", rowCount: EXPECTED.classRows });

  const teacherClient = client(apiUrl, anonKey);
  requireResult(
    await teacherClient.auth.signInWithPassword({
      email: EXPECTED.teacherEmail,
      password
    }),
    "audit teacher login"
  );

  try {
    requireResult(
      await teacherClient.rpc("teacher_set_class_leaderboard_scope", {
        p_class_id: EXPECTED.classId,
        p_scope: "school"
      }),
      "teacher school-scope opt-in"
    );
    const schoolBoard = requireResult(
      await studentClient.rpc("get_game_leaderboard", {
        p_student_token: login.token,
        p_limit: 50
      }),
      "school leaderboard"
    );
    assertPrivateBoard(schoolBoard, { scope: "school", rowCount: EXPECTED.schoolRows });
  } finally {
    requireResult(
      await teacherClient.rpc("teacher_set_class_leaderboard_scope", {
        p_class_id: EXPECTED.classId,
        p_scope: "class"
      }),
      "restore class-only leaderboard scope"
    );
    await teacherClient.auth.signOut();
  }

  return {
    invalidTokenRejected: true,
    anonymousScopeChangeRejected: true,
    classRows: classBoard.rows.length,
    schoolRows: EXPECTED.schoolRows,
    identities: "pseudonymous"
  };
}

export async function main(environment = process.env) {
  const result = await verifyLeaderboardPrivacyLive({
    apiUrl: environment.LP_AUDIT_SUPABASE_URL,
    anonKey: environment.LP_AUDIT_SUPABASE_ANON_KEY,
    password: environment.LP_AUDIT_TEACHER_PASSWORD
  });
  console.log("Leaderboard student-token and privacy verification passed.");
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
