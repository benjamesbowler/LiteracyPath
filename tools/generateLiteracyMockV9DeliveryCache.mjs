import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
export const V9_DELIVERY_CACHE_MIGRATION = '20261016171110_literacy_mock_v9_delivery_validation_cache.sql';
const read = name => fs.readFileSync(new URL(`supabase/migrations/${name}`, root), 'utf8');
const definitions = source => new Map([...source.matchAll(/create or replace function public\.(\w+)\([\s\S]*?\$\$;/g)].map(match => [match[1], match[0]]));
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw Error(`Frozen delivery definition no longer matches patch: ${before.slice(0, 100)}`);
  return source.replace(before, after);
}

/** Forward-only validation optimization. Never regenerate an applied V9 source.
 * Shared support is materialized per response, never cached across requests.
 * All canonical freshness, ownership, media and immutable-prefix checks remain. */
export function literacyMockV9DeliveryCacheSql() {
  const previous = definitions(read('20261016141521_literacy_mock_boundary_v9.sql'));
  const support = definitions(read('20261013053259_literacy_mock_content_quarantine.sql'));
  const effective = replaceOnce(support.get('lp_literacy_mock_effective_response'),
    'with support as (', 'with support as materialized (');
  let responseWithHelp = replaceOnce(support.get('lp_literacy_mock_effective_response'),
    'public.lp_literacy_mock_effective_response(p_session_id uuid,p_student_id uuid,p_response jsonb)',
    'public.lp_mock_response_with_help_v9(p_response jsonb,p_help jsonb)');
  responseWithHelp = replaceOnce(responseWithHelp, 'language sql stable security definer', 'language sql immutable');
  responseWithHelp = replaceOnce(responseWithHelp,
    "with support as (select public.lp_literacy_mock_help(p_session_id,p_student_id,p_response->>'questionId') h)",
    'with support as (select p_help h)');
  const rows = `create or replace function public.lp_mock_boundary_rows_v9(p_session_id uuid,p_student_id uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 -- Support is current at this statement, including late teacher resolutions.
 -- One grouped event read replaces a help query for every historical answer.
 with support as materialized (
  select question_id,max(event_id) filter(where event_type='help_requested') requested,
   max(event_id) filter(where event_type='help_cancelled') cancelled,
   max(event_id) filter(where event_type='support_resolved') resolved,
   bool_or(payload->>'assistance'='answer') filter(where event_type='support_resolved') answer_help,
   bool_or(payload->>'assistance'='access') filter(where event_type='support_resolved') access_help
  from public.literacy_mock_events where session_id=p_session_id and student_id=p_student_id
   and event_type in ('help_requested','help_cancelled','support_resolved') group by question_id
 )
 select coalesce(jsonb_agg(public.lp_mock_response_with_help_v9(r.response,jsonb_build_object(
   'helpRequested',s.requested is not null,
   'pending',coalesce(s.requested>greatest(coalesce(s.resolved,0),coalesce(s.cancelled,0)),false),
   'assistanceType',case when s.answer_help then 'answer' when s.access_help then 'access' else 'none' end))
   ||jsonb_build_object('questionId',i.id,'domainId',i.item->'domainId','skillId',i.item->'skillId','itemSnapshot',i.item->'itemSnapshot') order by r.position),'[]'::jsonb)
 from public.literacy_mock_runs run cross join lateral jsonb_array_elements(run.responses) with ordinality r(response,position)
 join public.literacy_mock_items i on i.content_version='literacy-mock-v9' and i.id=r.response->>'questionId'
 left join support s on s.question_id=r.response->>'questionId'
 where run.session_id=p_session_id and run.student_id=p_student_id;
$$;`;
  let schedule = replaceOnce(previous.get('lp_mock_boundary_schedule_v9'),
    'public.lp_mock_boundary_schedule_v9(p_rows jsonb)', 'public.lp_mock_boundary_schedule_with_state_v9(p_rows jsonb,v_states jsonb)');
  schedule = replaceOnce(schedule, '; v_states jsonb:=public.lp_mock_boundary_state_v9(p_rows);', ';');
  const wrapper = `create or replace function public.lp_mock_boundary_schedule_v9(p_rows jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select public.lp_mock_boundary_schedule_with_state_v9(p_rows,public.lp_mock_boundary_state_v9(p_rows));
$$;`;
  const plan = replaceOnce(previous.get('lp_mock_boundary_plan_error_v9'),
    'v_schedule:=public.lp_mock_boundary_schedule_v9(v_reserved);',
    `v_schedule:=public.lp_mock_boundary_schedule_with_state_v9(v_reserved,
  case when v_reserved=v_rows then v_states else public.lp_mock_boundary_state_v9(v_reserved) end);`);
  let event = replaceOnce(previous.get('student_record_literacy_mock_event'),
    'v_item jsonb; v_payload jsonb; v_familiarity jsonb;', 'v_item jsonb; v_payload jsonb; v_familiarity jsonb; v_rows jsonb; v_states jsonb;');
  event = replaceOnce(event,
    ` if v_mock->>'content_version'='literacy-mock-v9' and p_event='presented' and (
  (public.lp_mock_boundary_state_v9(public.lp_mock_boundary_rows_v9(p_session_id,v_student.id))#>>array[v_item->>'domainId','complete'])::boolean
  or public.lp_mock_boundary_schedule_v9(public.lp_mock_boundary_rows_v9(p_session_id,v_student.id))->>jsonb_array_length(v_run.responses) is distinct from v_item->>'domainId') then
  return json_build_object('ok',false,'error','invalid_adaptation'); end if;
 if v_mock->>'content_version' in ('literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8','literacy-mock-v9') and p_event='presented'
  and public.lp_mock_area_band(v_item) is distinct from public.lp_mock_area_next_band(p_session_id,v_student.id,v_item->>'domainId') then
  return json_build_object('ok',false,'error','invalid_adaptation'); end if;`,
    ` if v_mock->>'content_version'='literacy-mock-v9' and p_event='presented' then
  -- One current canonical/support projection serves all three guards. No
  -- projection survives this request; later assistance is read again.
  v_rows:=public.lp_mock_boundary_rows_v9(p_session_id,v_student.id);
  v_states:=public.lp_mock_boundary_state_v9(v_rows);
  if (v_states#>>array[v_item->>'domainId','complete'])::boolean
   or public.lp_mock_boundary_schedule_with_state_v9(v_rows,v_states)->>jsonb_array_length(v_run.responses) is distinct from v_item->>'domainId'
   or public.lp_mock_area_band(v_item) is distinct from (v_states#>>array[v_item->>'domainId','nextBand'])::integer then
   return json_build_object('ok',false,'error','invalid_adaptation'); end if;
 elsif v_mock->>'content_version' in ('literacy-mock-v5','literacy-mock-v6','literacy-mock-v7','literacy-mock-v8') and p_event='presented'
  and public.lp_mock_area_band(v_item) is distinct from public.lp_mock_area_next_band(p_session_id,v_student.id,v_item->>'domainId') then
  return json_build_object('ok',false,'error','invalid_adaptation'); end if;`);
  return [`-- Generated by tools/generateLiteracyMockV9DeliveryCache.mjs. Forward-only; applied V1-V9 migrations and publications stay immutable.
-- A 58-answer device queue must drain without repeatedly reconstructing the
-- same response/support evidence. All validation and receipt writes remain.
begin;`, effective, responseWithHelp, rows, schedule, wrapper, plan, event,
  `revoke all on function public.lp_literacy_mock_effective_response(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_response_with_help_v9(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_rows_v9(uuid,uuid) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_schedule_with_state_v9(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_schedule_v9(jsonb) from public,anon,authenticated;
revoke all on function public.lp_mock_boundary_plan_error_v9(uuid,uuid,jsonb,jsonb,integer,jsonb) from public,anon,authenticated;
revoke all on function public.student_record_literacy_mock_event(text,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.student_record_literacy_mock_event(text,uuid,text,text,text) to anon,authenticated;
notify pgrst, 'reload schema';
commit;`].join('\n\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sql = literacyMockV9DeliveryCacheSql(), target = new URL(`supabase/migrations/${V9_DELIVERY_CACHE_MIGRATION}`, root);
  if (process.argv.includes('--check')) {
    if (fs.readFileSync(target, 'utf8') !== sql) throw Error('The V9 delivery cache migration is stale.');
  } else fs.writeFileSync(target, sql);
}
