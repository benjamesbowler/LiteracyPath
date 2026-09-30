import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(new URL("../../supabase/migrations/20261001090000_teacher_insight_plan_source.sql", import.meta.url), "utf8");

test("teacher insight plans retain their exact source inside the gated owned RPC", () => {
  const rpc = sql.slice(sql.indexOf("create or replace function public.teacher_create_insight_intervention"));
  assert.match(rpc, /security definer[\s\S]*set search_path = public[\s\S]*perform public\.assert_current_actor_teacher_access\(\)/);
  assert.match(rpc, /c\.teacher_id = v_teacher_id/);
  assert.match(rpc, /s\.class_id = p_class_id[\s\S]*s\.teacher_id = v_teacher_id[\s\S]*s\.archived_at is null/);
  assert.match(rpc, /source_action,\s*insight_snapshot,\s*practice_targets/);
  assert.match(rpc, /'planned',\s*p_action_type,\s*p_insight,\s*case when p_action_type = 'assign_practice' then p_targets/);
  assert.doesNotMatch(rpc, /insert into public\.student_progress|update public\.student_progress/);
  assert.match(rpc, /from public, anon, authenticated[\s\S]*to authenticated/);
});

test("source cannot be rewritten and member deletion leaves no retained source copy", () => {
  assert.match(sql, /old\.insight_snapshot is distinct from new\.insight_snapshot/);
  assert.match(sql, /old\.practice_targets is distinct from new\.practice_targets/);
  assert.match(sql, /unnest\(old\.student_ids\)[\s\S]*not \(student_id = any\(new\.student_ids\)\)[\s\S]*new\.insight_snapshot := null/);
  assert.match(sql, /before update on public\.teacher_interventions/);
  assert.doesNotMatch(sql, /grant .* on (?:table )?public\.teacher_interventions/);
});
