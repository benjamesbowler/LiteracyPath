import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { createClient } from "@supabase/supabase-js";

function client(apiUrl, anonKey) {
  return createClient(apiUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export function assertRetiredPeerScoreAccessDenied(result, role) {
  // An invalid-session error would only prove token validation. Retirement
  // requires permission denial or absence from the role's PostgREST schema.
  if (!["42501", "PGRST202"].includes(result.error?.code)) {
    throw new Error(`Retired peer scores remain callable for ${role}`);
  }
}

export async function verifyLeaderboardPrivacyLive({ apiUrl, anonKey, password }) {
  if (!apiUrl || !anonKey || !password) {
    throw new Error(
      "LP_AUDIT_SUPABASE_URL, LP_AUDIT_SUPABASE_ANON_KEY, and LP_AUDIT_TEACHER_PASSWORD are required."
    );
  }

  const anonymous = client(apiUrl, anonKey);
  const teacher = client(apiUrl, anonKey);
  const args = { p_student_token: "retired-endpoint-probe", p_limit: 50 };
  assertRetiredPeerScoreAccessDenied(
    await anonymous.rpc("get_game_leaderboard", args),
    "anonymous"
  );
  const login = await teacher.auth.signInWithPassword({
    email: "audit-teacher-a@literacypath.invalid",
    password
  });
  if (login.error) throw new Error(`Audit teacher login: ${login.error.message}`);
  try {
    assertRetiredPeerScoreAccessDenied(
      await teacher.rpc("get_game_leaderboard", args),
      "authenticated"
    );
  } finally {
    await teacher.auth.signOut();
  }
  return {
    anonymousPeerScoresDenied: true,
    authenticatedPeerScoresDenied: true,
    recordsChanged: false
  };
}

export async function main(environment = process.env) {
  const result = await verifyLeaderboardPrivacyLive({
    apiUrl: environment.LP_AUDIT_SUPABASE_URL,
    anonKey: environment.LP_AUDIT_SUPABASE_ANON_KEY,
    password: environment.LP_AUDIT_TEACHER_PASSWORD
  });
  console.log("Retired peer-score endpoint rejects both API roles.");
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
