import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Resources names every new feature and its real product location", async () => {
  const source = await readFile(new URL("../../src/components/teacher/TeacherIntentPage.jsx", import.meta.url), "utf8");
  for (const feature of ["Class Quest Live", "Paper-to-Progress", "Observed Change", "Misconception Detective", "Reading Passport", "Buddy Reading", "Transfer Missions", "Story Crew"]) {
    assert.match(source, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /Where the other new features live/);
  assert.match(source, /onOpenReports/);
  assert.match(source, /onOpenStudents/);
  assert.match(source, /onOpenToday/);
});
