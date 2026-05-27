#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const checks = [
  {
    label: "Supabase reset email is wired",
    file: "src/App.jsx",
    pattern: /resetPasswordForEmail/
  },
  {
    label: "Supabase password update is wired",
    file: "src/App.jsx",
    pattern: /updateUser\(\{\s*password/
  },
  {
    label: "Pending teacher account table is referenced",
    file: "src/App.jsx",
    pattern: /pending_teacher_accounts/
  },
  {
    label: "Teacher class deletion is teacher-owned",
    file: "src/App.jsx",
    pattern: /\.from\("classes"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("teacher_id", teacherId\)[\s\S]*?\.eq\("id", classId\)/
  },
  {
    label: "Teacher student deletion is teacher-owned",
    file: "src/App.jsx",
    pattern: /\.from\("students"\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("teacher_id", teacherId\)[\s\S]*?\.eq\("id", selectedStudentId\)/
  },
  {
    label: "Pending accounts panel exists",
    file: "src/components/AdminDashboardPage.jsx",
    pattern: /New Teacher Signups/
  },
  {
    label: "Mobile table labels are present",
    file: "src/components/AdminDashboardPage.jsx",
    pattern: /data-label=/
  },
  {
    label: "Admin mobile card layout exists",
    file: "src/App.css",
    pattern: /@media \(max-width: 640px\)[\s\S]*?\.admin-table td::before/
  }
];

const failures = [];

for (const check of checks) {
  const content = read(check.file);
  if (!check.pattern.test(content)) {
    failures.push(`${check.label} (${check.file})`);
  }
}

if (failures.length) {
  console.error("Admin/auth management checks failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Admin/auth management checks passed: ${checks.length}/${checks.length}`);
