begin;
create unique index worksheet_marks_identity_idx on public.worksheet_observation_marks(batch_id,student_id,target_key,coalesce(item_id,''));

alter function public.teacher_export_learner_data(uuid,text,text) rename to teacher_export_learner_data_without_paper_progress;
revoke all on function public.teacher_export_learner_data_without_paper_progress(uuid,text,text) from public,anon,authenticated;
create function public.teacher_export_learner_data(p_student_id uuid,p_requester_role text,p_verification_method text)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_package jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  v_package:=public.teacher_export_learner_data_without_paper_progress(p_student_id,p_requester_role,p_verification_method);
  return v_package||jsonb_build_object(
    'paperWorksheetInstances',coalesce((select jsonb_agg(jsonb_build_object('instanceId',instance.id,'title',instance.title,'recipe',instance.recipe,'contentVersion',instance.content_version,'status',instance.status,'createdAt',instance.created_at,'closedAt',instance.closed_at) order by instance.created_at,instance.id) from public.worksheet_instance_students member join public.worksheet_instances instance on instance.id=member.instance_id where member.student_id=p_student_id),'[]'::jsonb),
    'paperWorksheetObservations',coalesce((select jsonb_agg(jsonb_build_object('markId',mark.id,'batchId',batch.id,'instanceId',batch.instance_id,'revision',batch.revision,'supersedesBatchId',batch.supersedes_batch_id,'targetKey',mark.target_key,'itemId',mark.item_id,'state',mark.state,'note',mark.note,'evidencePurpose',mark.evidence_purpose,'recordedAt',batch.created_at) order by batch.created_at,batch.revision,mark.target_key) from public.worksheet_observation_marks mark join public.worksheet_observation_batches batch on batch.id=mark.batch_id where mark.student_id=p_student_id),'[]'::jsonb)
  );
end; $$;
revoke all on function public.teacher_export_learner_data(uuid,text,text) from public,anon;
grant execute on function public.teacher_export_learner_data(uuid,text,text) to authenticated;
commit;
