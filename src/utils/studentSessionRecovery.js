import { supabase } from "../supabaseClient.js";
import { flushQueuedProgressWrites } from "./progressSync.js";

async function bounded(operation, milliseconds) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(operation).catch(() => null),
      new Promise(resolve => { timer = setTimeout(() => resolve(null), milliseconds); })
    ]);
  } finally { clearTimeout(timer); }
}

// Local sign-out remains immediate. No token is persisted for offline revocation.
export async function finishStudentSignOut(session, client = supabase) {
  if (!session?.token) return { revoked: true };
  const finalFlush = flushQueuedProgressWrites({ ...session, mode: "student" });
  await bounded(() => finalFlush, 1000);
  const result = await bounded(() => client.call("student_revoke_session", { p_token: session.token }), 3000);
  return { revoked: !result?.error && result?.data?.ok === true };
}
