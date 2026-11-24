import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LITERACY_MOCK_AREA_MAX } from '../src/policy/literacyMockAdaptivePolicy.js';

import { LITERACY_MOCK_V11_AREA_BUDGETS, LITERACY_MOCK_V14_AREA_BUDGETS, LITERACY_MOCK_V14_MAX_ITEMS } from '../src/policy/literacyMockProgressionV11.js';

const migrations = new URL('../supabase/migrations/', import.meta.url);
export const V14_SCHEMA_MIGRATION = '20261124090000_literacy_mock_adaptive_v14.sql';
const read = name => fs.readFileSync(new URL(name, migrations), 'utf8');
function substitute(text, before, after) {
  assert.ok(text.includes(before), `Missing SQL anchor: ${before}`);
  return text.replace(before, () => after);
}

// The receipt, permissions and validation functions come from the last applied
// schema. Only the version dispatch and the V14 route differ.
export function literacyMockV14SchemaSql() {
  const v13 = read('20261122090000_literacy_mock_short_routing_v13.sql');
  const v11 = read('20261020030000_literacy_mock_progression_v11.sql');
  const state = v11.match(/create or replace function public\.lp_mock_boundary_state_v11\([\s\S]*?end; \$\$;/)[0];
  let nextState = state.replaceAll('lp_mock_boundary_state_v11', 'lp_mock_boundary_state_v14');
  nextState = substitute(nextState, JSON.stringify(LITERACY_MOCK_V11_AREA_BUDGETS), JSON.stringify(LITERACY_MOCK_V14_AREA_BUDGETS));
  nextState = substitute(nextState, 'v_next:=0; v_answered', 'v_next:=1; v_answered');
  nextState = substitute(nextState, 'if v_correct_streak>=(case when v_band=0 then 3 else 2 end) then v_next:=least(v_max,v_band+1); end if;', 'v_next:=least(v_max,v_band+1);');
  nextState = substitute(nextState, 'if v_wrong_streak>=2 then v_next:=greatest(0,v_band-1); end if;', 'v_next:=greatest(0,v_band-1);');

  let sql = v13.slice(v13.indexOf('begin;')).replaceAll("'literacy-mock-v13')", "'literacy-mock-v13','literacy-mock-v14')");
  sql = substitute(sql, 'create or replace function public.teacher_literacy_mock_v13_available',
    `${nextState}
revoke all on function public.lp_mock_boundary_state_v14(jsonb) from public,anon,authenticated;

create or replace function public.teacher_literacy_mock_v13_available`);
  // Create separate readiness and prepare entry points, preserving all existing
  // definitions in the database for in-flight requests and earlier sittings.
  for (const name of ['teacher_literacy_mock_v13_available','lp_mock_prepare_v13_before_delivery','teacher_prepare_literacy_mock_session_v13']) {
    const start = sql.indexOf(`create or replace function public.${name}(`);
    assert.ok(start >= 0);
    const end = sql.indexOf('\n\ncreate or replace function', start);
    const block = sql.slice(start, end);
    sql = sql.slice(0, start) + block.replaceAll('v13','v14') + sql.slice(end);
  }
  sql = substitute(sql, "select case when p_version in ('literacy-mock-v11'", "select case when p_version='literacy-mock-v14' then public.lp_mock_boundary_state_v14(p_rows) when p_version in ('literacy-mock-v11'");
  sql = substitute(sql, "v_mock->>'content_version'='literacy-mock-v13'", "v_mock->>'content_version' in ('literacy-mock-v13','literacy-mock-v14')");
  sql = substitute(sql, "not (v_version='literacy-mock-v13' and", "not (v_version in ('literacy-mock-v13','literacy-mock-v14') and");

  const start = sql.indexOf('create or replace function public.lp_mock_balanced_schedule_v13');
  const end = sql.indexOf('\n\ncreate or replace function',start);
  let pairs = sql.slice(start,end).replaceAll('lp_mock_balanced_schedule_v13','lp_mock_paired_schedule_v14');
  pairs = substitute(pairs, JSON.stringify(LITERACY_MOCK_V11_AREA_BUDGETS), JSON.stringify(LITERACY_MOCK_V14_AREA_BUDGETS));
  pairs = substitute(pairs, 'v_area integer;', 'v_area integer; v_first integer;');
  pairs = substitute(pairs, 'jsonb_array_length(v_schedule)>124', `jsonb_array_length(v_schedule)>${LITERACY_MOCK_V14_MAX_ITEMS}`);
  pairs = substitute(pairs, 'for v_ordinal in 1..17 loop', `for v_first in 1..${Math.max(...Object.values(LITERACY_MOCK_V14_AREA_BUDGETS))} by 2 loop`);
  pairs = substitute(pairs, '   if v_ordinal<=', '   for v_ordinal in v_first..v_first+1 loop\n   if v_ordinal<=');
  pairs = substitute(pairs, 'then v_schedule:=v_schedule||jsonb_build_array(v_domain); end if;', 'then v_schedule:=v_schedule||jsonb_build_array(v_domain); end if;\n   end loop;');
  sql = sql.slice(0,start) + pairs + sql.slice(end);
  sql = substitute(sql, "case when p_version='literacy-mock-v13' then public.lp_mock_balanced_schedule_v13",
    "case when p_version='literacy-mock-v14' then public.lp_mock_paired_schedule_v14(p_rows,p_states,p_session_id) when p_version='literacy-mock-v13' then public.lp_mock_balanced_schedule_v13");
  sql = substitute(sql, 'else v_expected:=case when v_version in', `else v_expected:=case when v_version='literacy-mock-v14' then least(v_ordinal,('${JSON.stringify(LITERACY_MOCK_AREA_MAX)}'::jsonb->>v_domain)::integer) when v_version in`);
  return '-- Generated by tools/generateLiteracyMockV14Schema.mjs. Preserve earlier routes and signed receipts.\n' + sql;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL(V14_SCHEMA_MIGRATION, migrations);
  if (process.argv.includes('--check')) assert.equal(read(V14_SCHEMA_MIGRATION), literacyMockV14SchemaSql());
  else fs.writeFileSync(target, literacyMockV14SchemaSql());
}
