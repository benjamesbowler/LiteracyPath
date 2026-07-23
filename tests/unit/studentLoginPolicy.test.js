import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

async function source(relativePath) {
  return readFile(resolve(ROOT, relativePath), "utf8");
}

test("child login keeps the code-gated roster but requires teacher-set pictures", async () => {
  const [loginFlow, dashboard, migration] = await Promise.all([
    source("src/components/StudentLoginFlow.jsx"),
    source("src/components/TeacherDashboardPage.jsx"),
    source("supabase/migrations/20260723090000_teacher_only_student_password_setup.sql")
  ]);

  assert.match(loginFlow, /student_class_by_code/);
  assert.match(loginFlow, /step === "not-ready"/);
  assert.match(loginFlow, /Your teacher can set your three login pictures/);
  assert.doesNotMatch(loginFlow, /student_set_password/);
  assert.doesNotMatch(loginFlow, /step === "setup"|setStep\("setup"\)/);

  assert.match(dashboard, /Class display name/);
  assert.match(dashboard, /English name or classroom nickname/);
  assert.match(dashboard, /Do not enter a surname or other personal details/);
  assert.match(dashboard, /loginReady \? "Change" : "Set pictures"/);

  assert.match(
    migration,
    /revoke execute on function public\.student_set_password\(uuid, text\)[\s\S]*from public, anon, authenticated/
  );
  assert.match(
    migration,
    /revoke execute on function public\.student_set_password\(uuid, text, text\)[\s\S]*from public, anon, authenticated/
  );
});
