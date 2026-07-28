#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

const checks = [];

function check(label, passed, detail = "") {
  checks.push({ label, passed, detail });
}

const controller = read("src/appState/useAppSessionController.js");
const authPage = read("src/components/AuthPage.jsx");
const appSurface = read("src/components/AppSurface.jsx");
const admin = read("src/components/AdminDashboardPage.jsx");
const integrityMigration = read(
  "supabase/migrations/20260728120000_security_integrity_hardening.sql"
);
const decisionFunction = controller.slice(
  controller.indexOf("async function updateTeacherAccountStatus"),
  controller.indexOf("async function signUpTeacher")
);

check(
  "Signup derives its internal username without burdening the teacher",
  !/authUsername|Account name/.test(authPage)
    && /createInternalTeacherUsername\(email\)/.test(controller),
  "Teachers sign in with email; the controller must create the unique internal handle."
);

check(
  "Signup form supports display name",
  /authDisplayName/.test(authPage) && /Name shown in LiteracyPath/.test(authPage),
  "Display name should be optional but stored when provided."
);

check(
  "Signup stores pending approval status",
  /approval_status:\s*"pending"/.test(controller)
    && /role:\s*"pending"/.test(controller),
  "New signup/profile rows must be pending by default."
);

check(
  "App approval gate rejects session-only access",
  /function isTeacherAccountApproved\(\)\s*{[^}]*teacherAccountStatus === "approved"/s
    .test(controller)
    && !/legacy_approved/.test(controller),
  "No code path should treat legacy/no-profile users as approved."
);

check(
  "Missing approval schema blocks access",
  /approval_setup_required/.test(controller)
    && /Account setup needs attention/.test(appSurface),
  "Missing table/RLS/schema errors should not fall through to app access."
);

check(
  "Pending and rejected screens exist",
  /Account awaiting approval/.test(appSurface)
    && /Account request rejected/.test(appSurface)
    && /Account disabled/.test(appSurface),
  "Users need clear pending/rejected states."
);

check(
  "Admin dashboard has Signup Requests section",
  /Signup Requests/.test(admin) && /pendingAccounts/.test(admin),
  "Admin Dashboard should show signup requests."
);

check(
  "Admin can approve and reject",
  /openTeacherAccountDecision\(account,\s*"approved"\)/.test(admin)
    && /openTeacherAccountDecision\(account,\s*"rejected"\)/.test(admin)
    && /Confirm/.test(admin)
    && /accountDecisionReason/.test(admin),
  "Signup requests need confirmed Approve and reasoned Reject actions."
);

check(
  "Approve/reject uses the server-owned decision RPC",
  /supabase\.call\(\s*"admin_set_teacher_account_status"/.test(decisionFunction)
    && !/\.table\("pending_teacher_accounts"\)[\s\S]*\.update\(/.test(decisionFunction)
    && !/new Date\(\)|reviewed_at|reviewed_by|approved_at|approved_by/
      .test(decisionFunction),
  "The browser must not supply approval timestamps or reviewer identities."
);

check(
  "Decision audit fields are derived by the database",
  /create or replace function public\.admin_set_teacher_account_status/
    .test(integrityMigration)
    && /reviewed_at = now\(\)/.test(integrityMigration)
    && /reviewed_by = auth\.uid\(\)/.test(integrityMigration)
    && /enforce_teacher_account_audit_integrity/.test(integrityMigration),
  "The decision RPC and trigger must own audit provenance."
);

check(
  "Signup approval SQL exists",
  exists("docs/implementation/signup_approval_schema.sql"),
  "Documented SQL is required for Supabase setup."
);

check(
  "Signup approval access-control doc exists",
  exists("docs/implementation/signup_approval_access_control.md"),
  "Implementation notes are required for setup and RLS."
);

check(
  "Supabase migration exists",
  exists("supabase/migrations/20260529000000_signup_approval_profiles.sql")
    && exists("supabase/migrations/20260728120000_security_integrity_hardening.sql"),
  "Migrations should create the approval table and its final decision boundary."
);

const failed = checks.filter(item => !item.passed);

console.log("\nSignup approval flow checks\n");
for (const item of checks) {
  console.log(`${item.passed ? "PASS" : "FAIL"} ${item.label}`);
  if (!item.passed && item.detail) console.log(`     ${item.detail}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} signup approval flow check(s) failed.`);
  process.exit(1);
}

console.log("\nAll signup approval flow checks passed.");
