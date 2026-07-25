import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationDir = path.join(repoRoot, "supabase", "migrations");
const requiredCoreTables = [
  "classes",
  "students",
  "answers",
  "mastery",
  "item_mastery"
];

function migrationFiles() {
  return fs.readdirSync(migrationDir)
    .filter(file => file.endsWith(".sql"))
    .sort();
}

export function auditDatabaseBootstrap(files = migrationFiles()) {
  const createdAt = new Map();
  const firstReferencedAt = new Map();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    for (const table of requiredCoreTables) {
      const createPattern = new RegExp(
        `create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?public\\.${table}\\b`,
        "i"
      );
      const referencePattern = new RegExp(
        `(?:alter\\s+table|references|from|into|update|on)\\s+public\\.${table}\\b`,
        "i"
      );
      if (!createdAt.has(table) && createPattern.test(sql)) createdAt.set(table, file);
      if (!firstReferencedAt.has(table) && referencePattern.test(sql)) {
        firstReferencedAt.set(table, file);
      }
    }
  }

  const failures = [];
  for (const table of requiredCoreTables) {
    const created = createdAt.get(table);
    const referenced = firstReferencedAt.get(table);
    if (!created) {
      failures.push(`${table}: no managed CREATE TABLE migration`);
      continue;
    }
    if (referenced && created.localeCompare(referenced) > 0) {
      failures.push(`${table}: first created in ${created}, after first reference in ${referenced}`);
    }
  }

  const bootstrapSql = fs.readFileSync(
    path.join(migrationDir, files[0]),
    "utf8"
  );
  for (const expected of [
    "enable row level security",
    "Teachers manage owned classes",
    "Teachers manage owned students",
    "Teachers manage owned answers",
    "Teachers manage owned mastery",
    "Teachers manage owned item mastery"
  ]) {
    if (!bootstrapSql.includes(expected)) {
      failures.push(`first migration is missing ownership control: ${expected}`);
    }
  }
  for (const policy of [
    "Teachers manage owned classes",
    "Teachers manage owned students",
    "Teachers manage owned answers",
    "Teachers manage owned mastery",
    "Teachers manage owned item mastery"
  ]) {
    if (!bootstrapSql.includes(`drop policy if exists "${policy}"`)) {
      failures.push(`first migration does not safely replace existing policy: ${policy}`);
    }
  }
  for (const trigger of [
    "classes_set_updated_at",
    "students_set_updated_at",
    "mastery_set_updated_at",
    "item_mastery_set_updated_at"
  ]) {
    if (!bootstrapSql.includes(`drop trigger if exists ${trigger}`)) {
      failures.push(`first migration does not safely replace existing trigger: ${trigger}`);
    }
  }

  return {
    files,
    createdAt: Object.fromEntries(createdAt),
    firstReferencedAt: Object.fromEntries(firstReferencedAt),
    failures
  };
}

const report = auditDatabaseBootstrap();
console.log(`Migration files inspected: ${report.files.length}`);
for (const table of requiredCoreTables) {
  console.log(`${table}: created ${report.createdAt[table] || "never"}; first referenced ${report.firstReferencedAt[table] || "never"}`);
}
if (report.failures.length) {
  report.failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Database bootstrap schema check passed.");
}
