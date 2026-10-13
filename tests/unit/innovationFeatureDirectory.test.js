import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Teach keeps its four daily tools without the removed specialist directory", async () => {
  const source = await readFile(new URL("../../src/components/teacher/TeacherIntentPage.jsx", import.meta.url), "utf8");
  for (const retired of ["Misconception Detective", "Buddy Reading", "Transfer Missions", "Class Quest Live", "Paper-to-Progress", "Observed Change", "Reading Passport", "Story Crew", "Decodable Press"]) {
    assert.doesNotMatch(source, new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(source, /Help with teaching tools|Find a specialist tool/);
  for (const tool of ["present", "practice", "worksheets", "guided-reading"]) assert.match(source, new RegExp(`id: "${tool}"`));
});
