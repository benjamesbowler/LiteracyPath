import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync(
  new URL("../../supabase/migrations/20260812123000_maths_authored_assessment_v2.sql", import.meta.url),
  "utf8"
);
const neutralSql = fs.readFileSync(
  new URL("../../supabase/migrations/20260813120000_maths_not_sure_is_neutral.sql", import.meta.url),
  "utf8"
);

test("Maths v2 retains queued v1 evidence and dispatches by content version", () => {
  assert.match(sql, /rename to maths_validate_student_evidence_v1/i);
  assert.match(sql, /p_content_version='maths-foundation-number-v1'/i);
  assert.match(sql, /p_content_version='maths-foundation-number-v2'/i);
  assert.match(sql, /return public\.maths_validate_student_evidence_v2/i);
});

test("Maths v2 checks explicit authored values and rendered representations", () => {
  assert.match(sql, /when 'F-N-SEQ-20' then \(array\[2,5,8,11,14/i);
  assert.match(sql, /when 'F-N-COMPARE' then \(array\[3,7,4,9,2/i);
  assert.match(sql, /when 'F-N-PART-10' then \(array\[1,6,5,8,3/i);
  assert.match(sql, /v_rendered_target is distinct from v_target/i);
  assert.match(sql, /v_blueprint='part_whole' and v_rendered_part_a is distinct from v_part_a/i);
  assert.match(sql, /'serverValidated',true/i);
});

test("Maths v2 helpers remain private implementation functions", () => {
  assert.match(sql, /revoke all on function public\.maths_validate_student_evidence_v1[\s\S]*?from public,anon,authenticated/i);
  assert.match(sql, /revoke all on function public\.maths_validate_student_evidence_v2[\s\S]*?from public,anon,authenticated/i);
  assert.match(sql, /revoke all on function public\.maths_validate_student_evidence\(text,text,text,jsonb\)[\s\S]*?from public,anon,authenticated/i);
});

test("an explicit not-sure response remains neutral after server validation", () => {
  assert.match(neutralSql, /p_evidence->>'response' is null/i);
  assert.match(neutralSql, /'classification','not_checked'/i);
  assert.match(neutralSql, /'observedSignals','\[\]'::jsonb/i);
  assert.match(neutralSql, /revoke all on function public\.maths_validate_student_evidence/i);
});
