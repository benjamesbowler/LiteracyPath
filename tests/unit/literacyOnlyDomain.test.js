import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateLiteracyOnlyDomain } from "../../tools/checkLiteracyOnlyDomain.mjs";

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "literacy-only-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }
  return root;
}

test("the complete repository is literacy-only", () => {
  assert.deepEqual(validateLiteracyOnlyDomain(), []);
});

test("ordinary programming Math primitives are allowed", () => {
  const root = fixture({ "src/score.js": "const score = Math.max(0, Math.floor(value));\n" });
  assert.deepEqual(validateLiteracyOnlyDomain({ root, files: ["src/score.js"] }), []);
});

test("retired domain copy and paths fail the gate", () => {
  const root = fixture({
    "src/old-lesson.js": "export const label = 'Mathematics lesson';\n",
    "public/images/maths-card.webp": "not-a-real-image"
  });
  const issues = validateLiteracyOnlyDomain({
    root,
    files: ["src/old-lesson.js", "public/images/maths-card.webp"]
  });
  assert.ok(issues.some(issue => /Mathematics/.test(issue)));
  assert.ok(issues.some(issue => /retired domain term remains in its path/.test(issue)));
});

test("the cleanup tombstone may drop retired objects but never recreate them", () => {
  const relativePath = "supabase/migrations/20260821220000_retired_domain_cleanup.sql";
  const goodRoot = fixture({ [relativePath]: "drop table if exists public.maths_scores;\n" });
  assert.deepEqual(validateLiteracyOnlyDomain({ root: goodRoot, files: [relativePath] }), []);

  const badRoot = fixture({
    [relativePath]: "drop table if exists public.maths_scores;\ncreate table public.maths_scores(id uuid);\n"
  });
  assert.ok(validateLiteracyOnlyDomain({ root: badRoot, files: [relativePath] }).some(issue => /never recreate/.test(issue)));
});
