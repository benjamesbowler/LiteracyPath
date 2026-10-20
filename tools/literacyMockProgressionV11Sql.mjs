import fs from 'node:fs';
import assert from 'node:assert/strict';
import { literacyMockBoundaryV9Sql } from './literacyMockBoundaryV9Sql.mjs';
import { LITERACY_MOCK_AREA_MAX } from '../src/policy/literacyMockAdaptivePolicy.js';
import { LITERACY_MOCK_V9_AREA_BUDGETS } from '../src/policy/literacyMockBoundaryV9.js';
import { LITERACY_MOCK_V11_AREA_BUDGETS, LITERACY_MOCK_V11_MAX_ITEMS } from '../src/policy/literacyMockProgressionV11.js';
const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const definition=(source,name)=>[...source.matchAll(/create or replace function public\.(\w+)\([\s\S]*?\$\$;/g)].find(m=>m[1]===name)?.[0];
export function literacyMockProgressionV11Sql(){
 let state=definition(literacyMockBoundaryV9Sql(),'lp_mock_boundary_state_v9').replaceAll('lp_mock_boundary_state_v9','lp_mock_boundary_state_v11').replace(literal(LITERACY_MOCK_V9_AREA_BUDGETS),literal(LITERACY_MOCK_V11_AREA_BUDGETS));
 state=state.replace('v_non_band integer;','v_non_band integer; v_streak_band integer; v_correct_streak integer; v_wrong_streak integer; v_last_correct jsonb; v_last_wrong jsonb;');
 state=state.replace("v_wrong:=v_correct;", "v_wrong:=v_correct; v_last_correct:=v_correct; v_last_wrong:=v_correct;");
 state=state.replace('v_non_independent:=0; v_non_band:=null;\n  for','v_non_independent:=0; v_non_band:=null; v_streak_band:=null; v_correct_streak:=0; v_wrong_streak:=0;\n  for');
 state=state.replace('v_non_band:=v_band; continue;','v_non_band:=v_band; v_correct_streak:=0; v_wrong_streak:=0; v_next:=v_band; continue;');
 state=state.replace("   if (v_row->>'isCorrect')::boolean then", "   if v_streak_band is distinct from v_band then v_correct_streak:=0; v_wrong_streak:=0; end if;\n   v_streak_band:=v_band; v_next:=v_band;\n   if (v_row->>'isCorrect')::boolean then");
 state=state.replace("v_correct:=jsonb_set(v_correct","v_last_correct:=jsonb_set(v_last_correct,array[v_band::text],to_jsonb(v_answered)); v_correct:=jsonb_set(v_correct");
 state=state.replace("v_wrong:=jsonb_set(v_wrong","v_last_wrong:=jsonb_set(v_last_wrong,array[v_band::text],to_jsonb(v_answered)); v_wrong:=jsonb_set(v_wrong");
 state=state.replace('v_next:=least(v_max,v_band+1);', 'v_correct_streak:=v_correct_streak+1; v_wrong_streak:=0;\n    if v_correct_streak>=(case when v_band=0 then 3 else 2 end) then v_next:=least(v_max,v_band+1); end if;');
 state=state.replace('v_next:=greatest(0,v_band-1);','v_wrong_streak:=v_wrong_streak+1; v_correct_streak:=0;\n    if v_wrong_streak>=2 then v_next:=greatest(0,v_band-1); end if;');
 state=state.replace('(v_correct->>v_band)::integer>=2 and','(v_correct->>v_band)::integer>=(case when v_band=0 then 3 else 2 end) and');
 state=state.replace("(v_wrong->>(v_band+1))::integer>=2 then","(v_wrong->>(v_band+1))::integer>=2 and (v_last_correct->>v_band)::integer>(v_last_wrong->>(v_band+1))::integer then");
 state=state.replace("'correctByBand',v_correct", "'lastCorrectByBand',v_last_correct,'lastIncorrectByBand',v_last_wrong,'streakBand',v_streak_band,'correctStreak',v_correct_streak,'incorrectStreak',v_wrong_streak,'correctByBand',v_correct");
 const cache=fs.readFileSync(new URL('../supabase/migrations/20261016171110_literacy_mock_v9_delivery_validation_cache.sql',import.meta.url),'utf8');
 let schedule=definition(cache,'lp_mock_boundary_schedule_with_state_v9').replaceAll('lp_mock_boundary_schedule_with_state_v9','lp_mock_boundary_schedule_with_state_v11').replace(literal(LITERACY_MOCK_V9_AREA_BUDGETS),literal(LITERACY_MOCK_V11_AREA_BUDGETS)).replace('>67',`>${LITERACY_MOCK_V11_MAX_ITEMS}`).replace('0..4 loop',`0..${Math.ceil(Math.max(...Object.values(LITERACY_MOCK_V11_AREA_BUDGETS))/2)-1} loop`);
 assert.ok(schedule.includes(`>${LITERACY_MOCK_V11_MAX_ITEMS}`));
 return `create or replace function public.lp_mock_placeholder_band_v11(p_domain text,p_ordinal integer)
returns integer language sql immutable set search_path='' as $$
 select case when p_domain='print' then case when p_ordinal>5 then 2 else 0 end
  else least((${literal(LITERACY_MOCK_AREA_MAX)}->>p_domain)::integer,case when p_ordinal<=3 then 0 else 1+(p_ordinal-4)/2 end) end;
$$;

${state}\n\n${schedule}\n\ncreate or replace function public.lp_mock_boundary_state_for_version(p_rows jsonb,p_version text)
returns jsonb language sql immutable set search_path='' as $$
 select case when p_version='literacy-mock-v11' then public.lp_mock_boundary_state_v11(p_rows) else public.lp_mock_boundary_state_v9(p_rows) end;
$$;
create or replace function public.lp_mock_boundary_schedule_for_version(p_rows jsonb,p_states jsonb,p_version text)
returns jsonb language sql immutable set search_path='' as $$
 select case when p_version='literacy-mock-v11' then public.lp_mock_boundary_schedule_with_state_v11(p_rows,p_states) else public.lp_mock_boundary_schedule_with_state_v9(p_rows,p_states) end;
$$;`;
}
