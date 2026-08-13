-- Complete the operational teacher workflows for the Foundation Maths pilot.
-- Assignments expose their exact learner roster, may be duplicated or have a
-- deadline changed, flagged audio has an owned review queue, and large reports
-- can be narrowed on the server before events reach the browser.

begin;

alter table public.maths_media_issue_reports
  add column if not exists resolution text,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null;

alter table public.maths_media_issue_reports
  drop constraint if exists maths_media_issue_reports_resolution_check;
alter table public.maths_media_issue_reports
  add constraint maths_media_issue_reports_resolution_check
  check (resolution is null or resolution in (
    'replacement_requested','playback_verified','not_reproducible'
  ));

create or replace function public.teacher_list_maths_assignments(
  p_class_id uuid,
  p_include_archived boolean default false
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v_rows jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists (
    select 1 from public.classes class
    where class.id = p_class_id and class.teacher_id = auth.uid()
  ) then return jsonb_build_object('ok',false,'error','class_not_found'); end if;

  select coalesce(jsonb_agg(payload order by created_at desc),'[]'::jsonb)
  into v_rows
  from (
    select assignment.created_at, jsonb_build_object(
      'id',assignment.id,
      'skillId',assignment.skill_id,
      'activityType',assignment.activity_type,
      'activityId',assignment.activity_id,
      'title',assignment.title,
      'dueAt',assignment.due_at,
      'createdAt',assignment.created_at,
      'archivedAt',assignment.archived_at,
      'assignedCount',(select count(*) from public.maths_assignment_students link where link.assignment_id=assignment.id),
      'completedCount',(select count(*) from public.maths_assignment_students link where link.assignment_id=assignment.id and link.completed_at is not null),
      'learners',coalesce((
        select jsonb_agg(jsonb_build_object(
          'studentId',student.id,
          'name',student.name,
          'assignedAt',link.assigned_at,
          'completedAt',link.completed_at
        ) order by student.name,student.id)
        from public.maths_assignment_students link
        join public.students student on student.id=link.student_id
        where link.assignment_id=assignment.id
      ),'[]'::jsonb)
    ) payload
    from public.maths_assignments assignment
    where assignment.teacher_id=auth.uid()
      and assignment.class_id=p_class_id
      and (p_include_archived or assignment.archived_at is null)
  ) rows;
  return jsonb_build_object('ok',true,'assignments',v_rows);
end;
$$;

create function public.teacher_update_maths_assignment_due_at(
  p_class_id uuid,
  p_assignment_id uuid,
  p_due_at timestamptz
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_assignment_id is null
    or (p_due_at is not null and p_due_at < now() - interval '5 minutes')
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  update public.maths_assignments assignment
  set due_at=p_due_at
  where assignment.id=p_assignment_id and assignment.class_id=p_class_id
    and assignment.teacher_id=auth.uid() and assignment.archived_at is null;
  if not found then return jsonb_build_object('ok',false,'error','assignment_not_found'); end if;
  return jsonb_build_object('ok',true,'assignmentId',p_assignment_id,'dueAt',p_due_at);
end;
$$;

create function public.teacher_duplicate_maths_assignment(
  p_class_id uuid,
  p_assignment_id uuid,
  p_due_at timestamptz default null
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_original public.maths_assignments;
  v_copy public.maths_assignments;
  v_count integer;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_assignment_id is null
    or (p_due_at is not null and p_due_at < now() - interval '5 minutes')
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select * into v_original from public.maths_assignments assignment
  where assignment.id=p_assignment_id and assignment.class_id=p_class_id
    and assignment.teacher_id=auth.uid();
  if v_original.id is null then return jsonb_build_object('ok',false,'error','assignment_not_found'); end if;

  insert into public.maths_assignments(
    teacher_id,class_id,skill_id,activity_type,activity_id,title,due_at
  ) values (
    auth.uid(),p_class_id,v_original.skill_id,v_original.activity_type,
    v_original.activity_id,v_original.title,p_due_at
  ) returning * into v_copy;
  insert into public.maths_assignment_students(assignment_id,student_id)
  select v_copy.id,student.id
  from public.maths_assignment_students link
  join public.students student on student.id=link.student_id
  where link.assignment_id=v_original.id and student.class_id=p_class_id
    and student.teacher_id=auth.uid() and student.archived_at is null;
  get diagnostics v_count = row_count;
  if v_count=0 then
    delete from public.maths_assignments where id=v_copy.id;
    return jsonb_build_object('ok',false,'error','no_active_learners');
  end if;
  return jsonb_build_object('ok',true,'assignmentId',v_copy.id,'assignedCount',v_count);
end;
$$;

create function public.teacher_list_maths_media_issues(
  p_class_id uuid default null,
  p_include_reviewed boolean default false
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare v_rows jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is not null and not exists (
    select 1 from public.classes class
    where class.id=p_class_id and class.teacher_id=auth.uid()
  ) then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',report.id,'audioId',report.audio_id,'reason',report.reason,
    'actorType',report.actor_type,'classId',report.class_id,'studentId',report.student_id,
    'studentName',student.name,'createdAt',report.created_at,
    'reviewedAt',report.reviewed_at,'resolution',report.resolution
  ) order by report.reviewed_at nulls first,report.created_at desc),'[]'::jsonb)
  into v_rows
  from public.maths_media_issue_reports report
  left join public.students student on student.id=report.student_id
  where report.teacher_id=auth.uid()
    and (p_class_id is null or report.class_id=p_class_id or report.class_id is null)
    and (p_include_reviewed or report.reviewed_at is null);
  return jsonb_build_object('ok',true,'issues',v_rows);
end;
$$;

create function public.teacher_resolve_maths_media_issue(
  p_issue_id uuid,
  p_resolution text
)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  perform public.assert_current_actor_teacher_access();
  if p_issue_id is null or p_resolution not in (
    'replacement_requested','playback_verified','not_reproducible'
  ) then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  update public.maths_media_issue_reports report
  set reviewed_at=coalesce(report.reviewed_at,now()),
      reviewed_by=auth.uid(),resolution=p_resolution
  where report.id=p_issue_id and report.teacher_id=auth.uid();
  if not found then return jsonb_build_object('ok',false,'error','issue_not_found'); end if;
  return jsonb_build_object('ok',true,'issueId',p_issue_id,'resolution',p_resolution);
end;
$$;

create function public.teacher_read_maths_evidence_filtered_page(
  p_class_id uuid,
  p_student_id uuid default null,
  p_since timestamptz default null,
  p_source text default null,
  p_limit integer default 500,
  p_before_occurred_at timestamptz default null,
  p_before_id uuid default null
)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_events jsonb;
  v_has_more boolean := false;
  v_next_time timestamptz;
  v_next_id uuid;
begin
  perform public.assert_current_actor_teacher_access();
  if p_class_id is null or p_limit is null or p_limit not between 1 and 500
    or ((p_before_occurred_at is null) <> (p_before_id is null))
    or (p_source is not null and char_length(p_source) not between 1 and 80)
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  if not exists(select 1 from public.classes class where class.id=p_class_id and class.teacher_id=auth.uid())
  then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  if p_student_id is not null and not exists(
    select 1 from public.students student where student.id=p_student_id
      and student.class_id=p_class_id and student.teacher_id=auth.uid()
  ) then return jsonb_build_object('ok',false,'error','learner_not_in_owned_class'); end if;

  with filtered as (
    select event.* from public.maths_evidence_events event
    where event.teacher_id=auth.uid() and event.class_id=p_class_id
      and (p_student_id is null or event.student_id=p_student_id)
      and (p_since is null or event.occurred_at>=p_since)
      and (p_source is null or coalesce(event.evidence->>'source',event.event_type)=p_source)
      and (p_before_occurred_at is null or (event.occurred_at,event.id)<(p_before_occurred_at,p_before_id))
  ), page as (
    select * from filtered order by occurred_at desc,id desc limit p_limit
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',page.id,'classId',page.class_id,'studentId',page.student_id,
    'actorType',page.actor_type,'skillId',page.skill_id,'eventType',page.event_type,
    'evidence',page.evidence,'evidencePurpose',page.evidence_purpose,
    'contentVersion',page.content_version,'clientEventId',page.client_event_id,
    'occurredAt',page.occurred_at,'receivedAt',page.received_at
  ) order by page.occurred_at desc,page.id desc),'[]'::jsonb)
  into v_events from page;

  select event.occurred_at,event.id into v_next_time,v_next_id
  from public.maths_evidence_events event
  where event.teacher_id=auth.uid() and event.class_id=p_class_id
    and (p_student_id is null or event.student_id=p_student_id)
    and (p_since is null or event.occurred_at>=p_since)
    and (p_source is null or coalesce(event.evidence->>'source',event.event_type)=p_source)
    and (p_before_occurred_at is null or (event.occurred_at,event.id)<(p_before_occurred_at,p_before_id))
  order by event.occurred_at desc,event.id desc offset greatest(p_limit-1,0) limit 1;
  if v_next_id is not null then
    select exists(select 1 from public.maths_evidence_events event
      where event.teacher_id=auth.uid() and event.class_id=p_class_id
        and (p_student_id is null or event.student_id=p_student_id)
        and (p_since is null or event.occurred_at>=p_since)
        and (p_source is null or coalesce(event.evidence->>'source',event.event_type)=p_source)
        and (event.occurred_at,event.id)<(v_next_time,v_next_id)) into v_has_more;
  end if;
  return jsonb_build_object('ok',true,'events',v_events,'hasMore',coalesce(v_has_more,false),
    'nextBeforeOccurredAt',case when v_has_more then v_next_time else null end,
    'nextBeforeId',case when v_has_more then v_next_id else null end);
end;
$$;

revoke all on function public.teacher_update_maths_assignment_due_at(uuid,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.teacher_duplicate_maths_assignment(uuid,uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.teacher_list_maths_media_issues(uuid,boolean) from public,anon,authenticated;
revoke all on function public.teacher_resolve_maths_media_issue(uuid,text) from public,anon,authenticated;
revoke all on function public.teacher_read_maths_evidence_filtered_page(uuid,uuid,timestamptz,text,integer,timestamptz,uuid) from public,anon,authenticated;
grant execute on function public.teacher_update_maths_assignment_due_at(uuid,uuid,timestamptz) to authenticated;
grant execute on function public.teacher_duplicate_maths_assignment(uuid,uuid,timestamptz) to authenticated;
grant execute on function public.teacher_list_maths_media_issues(uuid,boolean) to authenticated;
grant execute on function public.teacher_resolve_maths_media_issue(uuid,text) to authenticated;
grant execute on function public.teacher_read_maths_evidence_filtered_page(uuid,uuid,timestamptz,text,integer,timestamptz,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
