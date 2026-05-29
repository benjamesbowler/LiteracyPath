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

const app = read("src/App.jsx");
const appPages = read("src/components/AppPages.jsx");
const admin = read("src/components/AdminDashboardPage.jsx");

check(
  "Signup form collects username",
  /authUsername/.test(appPages) && /Username/.test(appPages),
  "AuthPage must render and pass username state."
);

check(
  "Signup form supports display name",
  /authDisplayName/.test(appPages) && /Display name/.test(appPages),
  "Display name should be optional but stored when provided."
);

check(
  "Signup stores pending approval status",
  /approval_status:\s*"pending"/.test(app) && /role:\s*"pending"/.test(app),
  "New signup/profile rows must be pending by default."
);

check(
  "App approval gate rejects session-only access",
  /function isTeacherAccountApproved\(\)\s*{[^}]*teacherAccountStatus === "approved"/s.test(app) &&
    !/legacy_approved/.test(app),
  "No code path should treat legacy/no-profile users as approved."
);

check(
  "Missing approval schema blocks access",
  /approval_setup_required/.test(app),
  "Missing table/RLS/schema errors should not fall through to app access."
);

check(
  "Pending and rejected screens exist",
  /Account Waiting For Approval/.test(app) && /Account Not Approved/.test(app),
  "Users need clear pending/rejected states."
);

check(
  "Admin dashboard has Signup Requests section",
  /Signup Requests/.test(admin) && /pendingAccounts/.test(admin),
  "Admin Dashboard should show signup requests."
);

check(
  "Admin can approve and reject",
  /updateTeacherAccountStatus\?\.\(account\.id,\s*"approved"\)/.test(admin) &&
    /updateTeacherAccountStatus\?\.\(account\.id,\s*"rejected"\)/.test(admin),
  "Signup requests need Approve and Reject actions."
);

check(
  "Approve/reject writes audit fields",
  /approved_at/.test(app) && /approved_by/.test(app) && /rejected_at/.test(app) && /rejected_by/.test(app),
  "Approval decisions should store timestamps and reviewer ids."
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
  exists("supabase/migrations/20260529000000_signup_approval_profiles.sql"),
  "Migration should create/extend the approval table."
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
