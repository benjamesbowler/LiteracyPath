import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LITERACY_MOCK_DEMAND_ANCHORS } from '../src/policy/literacyMockReviewedDemand.js';
import { V14_SCHEMA_MIGRATION } from './generateLiteracyMockV14Schema.mjs';
import { CONTINUOUS_ROUTING_MIGRATION } from './generateLiteracyMockContinuousRouting.mjs';

export const V15_SCHEMA_MIGRATION = '20261124143000_literacy_mock_reviewed_v15.sql';
const migrations = new URL('../supabase/migrations/', import.meta.url);
const read = name => fs.readFileSync(new URL(name, migrations), 'utf8');

// Take definitions, including grants, from the two frozen migrations which own
// the active schema. The continuous validator supersedes the original V14 one.
function definitions(sql) {
  return new Map(sql.split("notify pgrst")[0].split(/(?=^create or replace function public\.)/m)
    .filter(block => block.startsWith('create or replace function'))
    .map(block => [block.match(/^create or replace function public\.(\w+)/)[1], block.trim()]));
}

const reviewedRouting = `
create function public.lp_mock_reviewed_anchors(p_domain text) returns jsonb
language sql immutable set search_path='' as $$
 select '${JSON.stringify(LITERACY_MOCK_DEMAND_ANCHORS)}'::jsonb->p_domain;
$$;
revoke all on function public.lp_mock_reviewed_anchors(text) from public,anon,authenticated;

create function public.lp_mock_reviewed_last(p_rows jsonb) returns table(anchor integer,direction integer)
language plpgsql immutable set search_path='' as $$
declare
 v_row jsonb; v_item jsonb; v_direction integer; v_found boolean:=false;
begin
 -- A continuous string of supported or unscored answers retains the first
 -- such task's anchor instead of repeatedly rounding between uneven ladders.
 for v_row in select value from jsonb_array_elements(p_rows) with ordinality h(value,slot)
   where value->>'responseStatus' is distinct from 'media_failed' order by slot desc loop
  v_direction:=case when (v_row ? 'classification' and v_row->>'classification'<>'independent')
       or not public.lp_literacy_response_eligible(v_row) then 0
     when (v_row->>'isCorrect')::boolean then 1 else -1 end;
  if v_found and v_direction<>0 then exit; end if;
  v_item:=coalesce(v_row->'itemSnapshot',v_row->'questionSnapshot',v_row);
  anchor:=(public.lp_mock_reviewed_anchors(v_item->>'domainId')->>public.lp_mock_area_band(jsonb_build_object('itemSnapshot',v_item)))::integer;
  direction:=v_direction;
  v_found:=true;
  if direction<>0 then exit; end if;
 end loop;
 if v_found then return next; end if;
end; $$;
revoke all on function public.lp_mock_reviewed_last(jsonb) from public,anon,authenticated;

create function public.lp_mock_reviewed_next_band(p_rows jsonb,p_domain text) returns integer
language plpgsql immutable set search_path='' as $$
declare
 v_steps jsonb:=public.lp_mock_reviewed_anchors(p_domain); v_score integer; v_dir integer; v_band integer;
begin
 if v_steps is null then return null; end if;
 select anchor,direction into v_score,v_dir from public.lp_mock_reviewed_last(p_rows);
 if not found then return 1; end if;
 if v_dir>0 then
  select min(i-1) into v_band from jsonb_array_elements_text(v_steps) with ordinality a(s,i) where s::integer>v_score;
  return coalesce(v_band,jsonb_array_length(v_steps)-1);
 elsif v_dir<0 then
  select max(i-1) into v_band from jsonb_array_elements_text(v_steps) with ordinality a(s,i) where s::integer<v_score;
  return coalesce(v_band,0);
 end if;
 select i-1 into v_band from jsonb_array_elements_text(v_steps) with ordinality a(s,i)
 order by abs(s::integer-v_score),i desc limit 1;
 return v_band;
end; $$;
revoke all on function public.lp_mock_reviewed_next_band(jsonb,text) from public,anon,authenticated;

create function public.lp_mock_reviewed_schedule(p_rows jsonb,p_states jsonb,p_session uuid) returns jsonb
language plpgsql immutable set search_path='' as $$
declare
 v_plan jsonb:=public.lp_mock_paired_schedule_v14(p_rows,p_states,p_session);
 v_print jsonb:=public.lp_mock_reviewed_anchors('print');
 v_prefix integer; v_score integer; v_dir integer; v_slot integer;
begin
 select count(*) into v_prefix from jsonb_array_elements(p_rows) r where r->>'responseStatus' is distinct from 'media_failed';
 if v_prefix=0 or v_prefix>=jsonb_array_length(v_plan) then return v_plan; end if;
 select anchor,direction into v_score,v_dir from public.lp_mock_reviewed_last(p_rows);
 if v_dir>0 and v_score>=(v_print->> (-2))::integer and v_score<(v_print->> (-1))::integer
    and not exists(select 1 from jsonb_array_elements_text(v_plan) with ordinality p(area,i) where area='print' and i<=v_prefix) then
  select min(i)-1 into v_slot from jsonb_array_elements_text(v_plan) with ordinality p(area,i) where area='print' and i>v_prefix;
 elsif v_dir>=0 and v_plan->>v_prefix='print' and (v_score>(v_print->> (-1))::integer or (v_dir>0 and v_score=(v_print->> (-1))::integer)) then
  select min(i)-1 into v_slot from jsonb_array_elements_text(v_plan) with ordinality p(area,i) where area<>'print' and i>v_prefix;
  if v_slot is null and v_score>(v_print->> (-1))::integer then
   return (select jsonb_agg(area order by i) from jsonb_array_elements(v_plan) with ordinality p(area,i) where i<=v_prefix);
  end if;
 end if;
 if v_slot is null or v_slot=v_prefix then return v_plan; end if;
 return (select jsonb_agg(area order by case when i=v_slot+1 then v_prefix+1 else i end,case when i=v_slot+1 then 0 else 1 end)
   from jsonb_array_elements(v_plan) with ordinality p(area,i));
end; $$;
revoke all on function public.lp_mock_reviewed_schedule(jsonb,jsonb,uuid) from public,anon,authenticated;`;

export function literacyMockV15SchemaSql() {
  const prior = read(V14_SCHEMA_MIGRATION);
  const base = definitions(prior);
  const continuous = definitions(read(CONTINUOUS_ROUTING_MIGRATION));
  const schema = prior.slice(prior.indexOf('alter table'), prior.indexOf('create or replace function'));
  const extendLists = block => block.replaceAll("'literacy-mock-v14')", "'literacy-mock-v14','literacy-mock-v15')");
  const output = [extendLists(schema).trim(), reviewedRouting.trim()];
  const renamed = (block, from, to) => block.replaceAll(from, to);

  output.push(renamed(base.get('teacher_literacy_mock_v14_available'), 'v14', 'v15'));
  output.push(renamed(continuous.get('teacher_prepare_literacy_mock_continuous_session'), 'v14', 'v15')
    .replaceAll('teacher_prepare_literacy_mock_continuous_session', 'teacher_prepare_literacy_mock_session_v15'));
  for (const [name, original] of base) {
    if (name.includes('_v14')) continue;
    const block = continuous.get(name) ?? original;
    let next = extendLists(block);
    if (name === 'lp_mock_session_boundary_schedule') {
      next = next.replace("case when p_version='literacy-mock-v14'", "case when p_version='literacy-mock-v15' then public.lp_mock_reviewed_schedule(p_rows,p_states,p_session_id) when p_version='literacy-mock-v14'");
    } else {
      next = next.replaceAll("p_version='literacy-mock-v14'", "p_version in ('literacy-mock-v14','literacy-mock-v15')")
        .replaceAll("v_version='literacy-mock-v14'", "v_version in ('literacy-mock-v14','literacy-mock-v15')");
    }
    if (name === 'lp_mock_boundary_plan_error_v9') {
      next = next.replace('v_expected:=public.lp_mock_continuous_next_band(v_rows,v_domain);',
        "v_expected:=case when v_version='literacy-mock-v15' then public.lp_mock_reviewed_next_band(v_rows,v_domain) else public.lp_mock_continuous_next_band(v_rows,v_domain) end;");
    }
    if (name === 'student_record_literacy_mock_event') {
      next = next.replace("case when v_mock->>'routing_policy'='continuous-v1'",
        "case when v_mock->>'content_version'='literacy-mock-v15' then public.lp_mock_reviewed_next_band(v_rows,v_item->>'domainId') when v_mock->>'routing_policy'='continuous-v1'");
    }
    if (next !== block) output.push(next);
  }
  return '-- Generated by tools/generateLiteracyMockV15Schema.mjs. Preserve earlier published sittings.\nbegin;\n\n'
    + output.join('\n\n') + "\n\nnotify pgrst,'reload schema';\ncommit;\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = literacyMockV15SchemaSql();
  if (process.argv.includes('--check')) assert.equal(read(V15_SCHEMA_MIGRATION), sql);
  else fs.writeFileSync(new URL(V15_SCHEMA_MIGRATION, migrations), sql);
}
