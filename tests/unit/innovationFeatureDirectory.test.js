import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Resources names every retained supporting feature and omits shelved surfaces", async () => {
  const source = await readFile(new URL("../../src/components/teacher/TeacherIntentPage.jsx", import.meta.url), "utf8");
  for (const feature of ["Misconception Detective", "Buddy Reading", "Transfer Missions"]) {
    assert.match(source, new RegExp(feature.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const retired of ["Class Quest Live", "Paper-to-Progress", "Observed Change", "Reading Passport", "Story Crew", "Decodable Press"]) {
    assert.doesNotMatch(source, new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(source, /Where supporting features live/);
  assert.match(source, /onOpenToday/);
});
