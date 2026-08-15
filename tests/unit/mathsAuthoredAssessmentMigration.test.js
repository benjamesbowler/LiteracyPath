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
const v3Sql = fs.readFileSync(
  new URL("../../supabase/migrations/20260814143000_maths_assessment_multi_direction_v3.sql", import.meta.url),
  "utf8"
);
const v4Sql = fs.readFileSync(
  new URL("../../supabase/migrations/20260814170000_maths_assessment_interaction_integrity_v4.sql", import.meta.url),
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

test("Maths v3 validates both assessment directions while retaining queued versions", () => {
  assert.match(v3Sql, /p_content_version='maths-foundation-number-v1'/i);
  assert.match(v3Sql, /p_content_version='maths-foundation-number-v2'/i);
  assert.match(v3Sql, /p_content_version='maths-foundation-number-v3'/i);
  assert.match(v3Sql, /F-N-COUNT-10','F-N-COUNT-20/i);
  assert.match(v3Sql, /p_skill_id='F-N-MATCH'/i);
  assert.match(v3Sql, /v_blueprint<>'make_quantity'/i);
  assert.match(v3Sql, /v_blueprint<>'count_collection'/i);
  assert.match(v3Sql, /v_expected_representation/i);
  assert.match(v3Sql, /return public\.maths_validate_student_evidence_v2/i);
  assert.match(v3Sql, /revoke all on function public\.maths_validate_student_evidence_v3/i);
});

test("Maths v4 binds declared assessment purpose and direction to the authored item", () => {
  assert.match(v4Sql, /p_content_version='maths-foundation-number-v1'/i);
  assert.match(v4Sql, /p_content_version='maths-foundation-number-v2'/i);
  assert.match(v4Sql, /p_content_version='maths-foundation-number-v3'/i);
  assert.match(v4Sql, /p_content_version='maths-foundation-number-v4'/i);
  assert.match(v4Sql, /v_response_direction is distinct from v_expected_direction/i);
  assert.match(v4Sql, /v_evidence_purpose is distinct from v_expected_purpose/i);
  assert.match(v4Sql, /renderedRepresentation' ->> 'responseDirection'/i);
  assert.match(v4Sql, /renderedRepresentation' ->> 'evidencePurpose'/i);
  assert.match(v4Sql, /return public\.maths_validate_student_evidence_v1/i);
});

test("Maths v4 checks the actual interaction trace rather than trusting a client label", () => {
  assert.match(v4Sql, /v_expected_response_mode := case/i);
  assert.match(v4Sql, /construct_sequence/i);
  assert.match(v4Sql, /construct_quantity/i);
  assert.match(v4Sql, /construct_pair_then_select/i);
  assert.match(v4Sql, /jsonb_array_length\(v_response_trace -> 'options'\) <> 3/i);
  assert.match(v4Sql, /abs\(v_value-v_last\) <> 1/i);
  assert.match(v4Sql, /v_pairs_created is distinct from v_pair_target/i);
  assert.match(v4Sql, /count\(\*\) filter \(where action\.value='add'\) - count\(\*\) filter \(where action\.value='remove'\)/i);
  assert.match(v4Sql, /v_response_trace ->> 'representation' is distinct from v_item_representation/i);
  assert.match(v4Sql, /p_evidence ->> 'representation'='sequential_access_count'[\s\S]*?accessMode'='non_visual_description'/i);
  assert.match(v4Sql, /accessMode'='visual_flash'[\s\S]*?flashDurationMs'\)::integer=1500/i);
  assert.match(v4Sql, /maths_validate_student_evidence_v3/i);
  assert.match(v4Sql, /revoke all on function public\.maths_validate_student_evidence_v4/i);
});

test("Maths v4 preserves an explicit not-sure interaction as neutral", () => {
  assert.match(v4Sql, /v_response_mode is distinct from 'not_sure'/i);
  assert.match(v4Sql, /'classification','not_checked'/i);
  assert.match(v4Sql, /'observedSignals','\[\]'::jsonb/i);
  assert.match(v4Sql, /'misconceptionCodes','\[\]'::jsonb/i);
});
