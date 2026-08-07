/**
 * Functional proof that an unconfirmed email cannot be approved into teacher
 * access — run against a real PostgreSQL (PGlite) with every migration applied.
 *
 * Source-text assertions can only show that a rule was WRITTEN. This executes
 * it: it creates an account, tries to approve it, confirms the address, and
 * tries again. Roughly 40 seconds, so it is an on-demand check rather than part
 * of the unit suite.
 *
 *   npm run check:teacher-email-confirmation
 */
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const MIGRATIONS = join(import.meta.dirname, "..", "..", "supabase", "migrations");
const ADMIN = "11111111-1111-1111-1111-111111111111";
const TEACHER = "22222222-2222-2222-2222-222222222222";
const GRANDFATHERED = "33333333-3333-3333-3333-333333333333";

const results = [];
function check(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "  ok  " : "FAIL  "} ${name}${detail ? `\n         ${detail}` : ""}`);
}

const db = await PGlite.create({ extensions: { pgcrypto } });
await db.exec(readFileSync(join(import.meta.dirname, "bootstrap.sql"), "utf8"));

// Seed BEFORE the migrations run, so the backfill has something to act on and
// the grandfather clause is exercised as it would be on the hosted database.
await db.exec(`
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values ('${GRANDFATHERED}', 'already.in@example.school', null, '{}'::jsonb);
`);

const files = readdirSync(MIGRATIONS).filter(f => f.endsWith(".sql")).sort();
const legacySeed = files.find(f => f.includes("signup_approval_profiles"));
let seededLegacy = false;
for (const file of files) {
  await db.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  // The moment the table exists, plant an already-approved account that never
  // confirmed — exactly the shape of every account on the live database today.
  if (!seededLegacy && file === legacySeed) {
    await db.exec(`
      insert into public.pending_teacher_accounts
        (user_id, email, username, display_name, role, status, approval_status, approved_at)
      values ('${GRANDFATHERED}', 'already.in@example.school', 'already-in', 'Already In',
              'teacher', 'approved', 'approved', now());
    `);
    seededLegacy = true;
  }
}
console.log(`Applied ${files.length} migrations.\n`);

// --- the grandfather clause -------------------------------------------------
const grandfathered = await db.query(`
  select email_confirmed_at, email_confirmation_source
  from public.pending_teacher_accounts where user_id = '${GRANDFATHERED}';
`);
check(
  "an account already approved when the rule arrived keeps its access",
  grandfathered.rows[0]?.email_confirmed_at !== null,
  "revoking working access from real teachers to enforce a rule introduced today would be the wrong trade"
);
check(
  "and is tagged so the unverified addresses can be found later",
  grandfathered.rows[0]?.email_confirmation_source === "grandfathered",
  `source = ${grandfathered.rows[0]?.email_confirmation_source}`
);

// --- a fresh, unconfirmed signup --------------------------------------------
await db.exec(`
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values ('${ADMIN}', 'admin@example.school', now(), '{"audit_only":true}'::jsonb);
  insert into public.app_admins (user_id) values ('${ADMIN}');
  insert into public.schools (name) values ('Oakridge Primary') on conflict do nothing;
  create or replace function auth.uid() returns uuid language sql stable
    as $x$ select '${ADMIN}'::uuid $x$;
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values ('${TEACHER}', 'new.teacher@example.school', null,
          '{"username":"new-teacher","display_name":"New Teacher","school_name":"Oakridge Primary"}'::jsonb);
`);

const account = await db.query(`
  select id, email_confirmed_at, school_id
  from public.pending_teacher_accounts where user_id = '${TEACHER}';
`);
const accountId = account.rows[0]?.id;
check("the signup trigger created the pending row", Boolean(accountId));
check(
  "with the school resolved, not nulled",
  Boolean(account.rows[0]?.school_id),
  "the client-side upsert that used to wipe this is gone"
);
check(
  "and no confirmation, because the address is unproven",
  account.rows[0]?.email_confirmed_at === null
);

// --- the rule ---------------------------------------------------------------
let refusal = null;
try {
  await db.query(`select * from public.admin_set_teacher_account_status('${accountId}', 'approved');`);
} catch (error) {
  refusal = String(error?.message || error);
}
check(
  "approving an unconfirmed address is REFUSED",
  Boolean(refusal) && /not confirmed their email/i.test(refusal),
  refusal || "the approval went through — the rule is not enforced"
);

const afterRefusal = await db.query(`
  select approval_status from public.pending_teacher_accounts where id = '${accountId}';
`);
check(
  "and the refusal changed nothing",
  afterRefusal.rows[0]?.approval_status === "pending",
  `status = ${afterRefusal.rows[0]?.approval_status}`
);

// --- confirmation, then approval --------------------------------------------
await db.exec(`update auth.users set email_confirmed_at = now() where id = '${TEACHER}';`);
const synced = await db.query(`
  select email_confirmed_at, email_confirmation_source
  from public.pending_teacher_accounts where id = '${accountId}';
`);
check(
  "confirming the address syncs onto the pending row",
  synced.rows[0]?.email_confirmed_at !== null,
  "the auth.users trigger fired"
);
check(
  "tagged as genuinely confirmed, not grandfathered",
  synced.rows[0]?.email_confirmation_source === "confirmed",
  `source = ${synced.rows[0]?.email_confirmation_source}`
);

let approvalError = null;
try {
  await db.query(`select * from public.admin_set_teacher_account_status('${accountId}', 'approved');`);
} catch (error) {
  approvalError = String(error?.message || error);
}
check("approval now succeeds", approvalError === null, approvalError || "");

const approved = await db.query(`
  select role, status, approval_status from public.pending_teacher_accounts where id = '${accountId}';
`);
check(
  "and grants teacher access on all three columns",
  approved.rows[0]?.role === "teacher"
    && approved.rows[0]?.status === "approved"
    && approved.rows[0]?.approval_status === "approved",
  JSON.stringify(approved.rows[0])
);

const history = await db.query(`
  select decision_status, previous_status from public.teacher_account_decision_events
  where account_id = '${accountId}';
`);
check(
  "exactly one decision was recorded — the refusal left no event",
  history.rows.length === 1 && history.rows[0].decision_status === "approved",
  `${history.rows.length} event(s)`
);

// --- the sync trigger must never break confirmation -------------------------
await db.exec(`
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data)
  values ('44444444-4444-4444-4444-444444444444', 'no.account@example.school', null, '{"audit_only":true}'::jsonb);
`);
let orphanError = null;
try {
  await db.exec(`
    update auth.users set email_confirmed_at = now()
    where id = '44444444-4444-4444-4444-444444444444';
  `);
} catch (error) {
  orphanError = String(error?.message || error);
}
check(
  "confirming a user with no pending row does not fail",
  orphanError === null,
  orphanError || "a trigger that raises here would break email confirmation for everyone"
);

const failed = results.filter(r => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) process.exit(1);
