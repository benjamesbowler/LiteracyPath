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
  const [loginFlow, classApi, dashboard, migration] = await Promise.all([
    source("src/components/StudentLoginFlow.jsx"),
    source("src/data/classApiCompatibility.js"),
    source("src/components/TeacherStudentsPage.jsx"),
    source("supabase/migrations/20260723090000_teacher_only_student_password_setup.sql")
  ]);

  assert.match(loginFlow, /loadCompatibleStudentClass/);
  assert.match(classApi, /student_class_by_code/);
  assert.match(loginFlow, /step === "not-ready"/);
  assert.match(loginFlow, /Your teacher can choose your three sign-in pictures/);
  assert.doesNotMatch(loginFlow, /student_set_password/);
  assert.doesNotMatch(loginFlow, /step === "setup"|setStep\("setup"\)/);

  assert.match(dashboard, /TEACHER_COPY\.roster\.displayName/);
  assert.match(dashboard, /TEACHER_COPY\.roster\.displayNamePlaceholder/);
  assert.match(dashboard, /TEACHER_COPY\.roster\.privacy/);
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
