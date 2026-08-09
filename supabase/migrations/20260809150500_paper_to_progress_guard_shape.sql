create or replace function public.teacher_read_worksheet_history(p_instance_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_instance public.worksheet_instances; v_batches jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_instance from public.worksheet_instances where id=p_instance_id and teacher_id=auth.uid();
  if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',batch.id,'revision',batch.revision,'supersedes_batch_id',batch.supersedes_batch_id,'note',batch.batch_note,'created_at',batch.created_at,'marks',(select coalesce(jsonb_agg(to_jsonb(mark) order by mark.student_id,mark.target_key),'[]'::jsonb) from public.worksheet_observation_marks mark where mark.batch_id=batch.id)) order by batch.revision),'[]'::jsonb) into v_batches from public.worksheet_observation_batches batch where batch.instance_id=v_instance.id;
  return jsonb_build_object('ok',true,'batches',v_batches);
end; $$;

create or replace function public.teacher_close_worksheet_instance(p_instance_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_instance public.worksheet_instances;
begin
  perform public.assert_current_actor_teacher_access();
  update public.worksheet_instances set status='closed',closed_at=coalesce(closed_at,now()) where id=p_instance_id and teacher_id=auth.uid() returning * into v_instance;
  if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if;
  return jsonb_build_object('ok',true,'status',v_instance.status,'closed_at',v_instance.closed_at);
end; $$;

revoke all on function public.teacher_read_worksheet_history(uuid),public.teacher_close_worksheet_instance(uuid) from public,anon;
grant execute on function public.teacher_read_worksheet_history(uuid),public.teacher_close_worksheet_instance(uuid) to authenticated;
