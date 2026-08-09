begin;

create table public.teacher_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  intervention_id uuid references public.teacher_interventions(id) on delete set null,
  cycle_id text not null check (char_length(btrim(cycle_id)) between 1 and 80),
  target_key text not null check (char_length(btrim(target_key)) between 1 and 120),
  duration_minutes integer not null check (duration_minutes in (8, 12, 20)),
  recipe jsonb not null check (jsonb_typeof(recipe) = 'object' and octet_length(recipe::text) <= 65536),
  content_version text not null check (char_length(btrim(content_version)) between 1 and 120),
  evidence_source jsonb not null default '{"kind":"teacher_selected","limitations":"No automatic diagnosis or mastery update."}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'delivered', 'cancelled')),
  revision integer not null default 1 check (revision > 0),
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_lesson_plans_class_teacher_fk foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id) on delete cascade
);

create table public.teacher_lesson_plan_students (
  plan_id uuid not null references public.teacher_lesson_plans(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (plan_id, student_id)
);

create table public.teacher_lesson_plan_deliveries (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.teacher_lesson_plans(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null,
  completion_state text not null check (completion_state in ('delivered', 'partially_delivered', 'not_delivered')),
  notes text not null default '' check (char_length(notes) <= 2000),
  observed_support jsonb not null default '{}'::jsonb check (jsonb_typeof(observed_support) = 'object' and octet_length(observed_support::text) <= 8192),
  evidence_purpose text not null default 'practice' check (evidence_purpose = 'practice'),
  client_event_id text not null check (char_length(client_event_id) between 1 and 120),
  delivered_at timestamptz not null default now(),
  unique (teacher_id, client_event_id),
  constraint teacher_lesson_delivery_class_teacher_fk foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id) on delete cascade
);

create table public.teacher_lesson_delivery_students (
  delivery_id uuid not null references public.teacher_lesson_plan_deliveries(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (delivery_id, student_id)
);

create index teacher_lesson_plans_class_status_idx on public.teacher_lesson_plans(teacher_id, class_id, status, updated_at desc);
create index teacher_lesson_plan_students_student_idx on public.teacher_lesson_plan_students(student_id, plan_id);
create index teacher_lesson_delivery_students_student_idx on public.teacher_lesson_delivery_students(student_id, delivery_id);

alter table public.teacher_lesson_plans enable row level security;
alter table public.teacher_lesson_plan_students enable row level security;
alter table public.teacher_lesson_plan_deliveries enable row level security;
alter table public.teacher_lesson_delivery_students enable row level security;
revoke all on public.teacher_lesson_plans, public.teacher_lesson_plan_students,
  public.teacher_lesson_plan_deliveries, public.teacher_lesson_delivery_students
  from public, anon, authenticated;

create or replace function public.assert_lesson_recipe(p_recipe jsonb)
returns void language plpgsql immutable set search_path = public as $$
declare v_role text;
begin
  if jsonb_typeof(p_recipe) <> 'object'
    or coalesce((p_recipe ->> 'schemaVersion')::integer, 0) <> 1
    or coalesce((p_recipe ->> 'durationMinutes')::integer, 0) not in (8, 12, 20)
    or nullif(btrim(coalesce(p_recipe ->> 'cycleId', '')), '') is null
    or nullif(btrim(coalesce(p_recipe ->> 'targetKey', '')), '') is null
    or nullif(btrim(coalesce(p_recipe ->> 'contentVersion', '')), '') is null
    or jsonb_typeof(p_recipe -> 'componentIds') <> 'array'
    or jsonb_array_length(p_recipe -> 'componentIds') not between 5 and 12
  then raise exception using errcode='22023', message='The lesson recipe is invalid.'; end if;
  foreach v_role in array array['retrieve','model','guide','apply','observe'] loop
    if not exists(select 1 from jsonb_array_elements(p_recipe -> 'componentIds') component where component ->> 'role'=v_role and nullif(component ->> 'id','') is not null)
    then raise exception using errcode='22023', message='The lesson recipe is incomplete.'; end if;
  end loop;
end;
$$;

create or replace function public.teacher_create_lesson_plan(
  p_class_id uuid, p_intervention_id uuid, p_learner_ids uuid[], p_recipe jsonb,
  p_evidence_source jsonb default '{"kind":"teacher_selected","limitations":"No automatic diagnosis or mastery update."}'::jsonb,
  p_scheduled_for timestamptz default null
) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_plan public.teacher_lesson_plans; v_invalid uuid;
begin
  perform public.assert_current_actor_teacher_access();
  perform public.assert_lesson_recipe(p_recipe);
  if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid())
    or coalesce(cardinality(p_learner_ids),0) not between 1 and 40
    or (select count(distinct id) from unnest(p_learner_ids) id) <> cardinality(p_learner_ids)
    or jsonb_typeof(coalesce(p_evidence_source,'{}'::jsonb)) <> 'object'
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select requested.id into v_invalid from unnest(p_learner_ids) requested(id)
  left join public.students student on student.id=requested.id and student.class_id=p_class_id and student.teacher_id=auth.uid() and student.archived_at is null
  where student.id is null limit 1;
  if v_invalid is not null then return jsonb_build_object('ok',false,'error','student_not_in_class'); end if;
  if p_intervention_id is not null and not exists(select 1 from public.teacher_interventions where id=p_intervention_id and teacher_id=auth.uid() and class_id=p_class_id)
  then return jsonb_build_object('ok',false,'error','intervention_not_found'); end if;
  insert into public.teacher_lesson_plans(teacher_id,class_id,intervention_id,cycle_id,target_key,duration_minutes,recipe,content_version,evidence_source,scheduled_for)
  values(auth.uid(),p_class_id,p_intervention_id,p_recipe->>'cycleId',p_recipe->>'targetKey',(p_recipe->>'durationMinutes')::integer,p_recipe-'learnerIds',p_recipe->>'contentVersion',coalesce(p_evidence_source,'{}'::jsonb),p_scheduled_for)
  returning * into v_plan;
  insert into public.teacher_lesson_plan_students(plan_id,student_id) select v_plan.id,id from unnest(p_learner_ids) id;
  return jsonb_build_object('ok',true,'plan_id',v_plan.id,'revision',v_plan.revision,'status',v_plan.status);
end; $$;

create or replace function public.teacher_read_lesson_plan(p_plan_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_plan public.teacher_lesson_plans; v_ids uuid[];
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_plan from public.teacher_lesson_plans where id=p_plan_id and teacher_id=auth.uid();
  if v_plan.id is null then return jsonb_build_object('ok',false,'error','plan_not_found'); end if;
  select array_agg(student_id order by student_id) into v_ids from public.teacher_lesson_plan_students where plan_id=v_plan.id;
  return jsonb_build_object('ok',true,'plan',to_jsonb(v_plan)||jsonb_build_object('recipe',v_plan.recipe||jsonb_build_object('learnerIds',coalesce(v_ids,'{}'::uuid[]))));
end; $$;

create or replace function public.teacher_update_draft_lesson_plan(
  p_plan_id uuid, p_expected_revision integer, p_learner_ids uuid[], p_recipe jsonb, p_scheduled_for timestamptz default null
) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_plan public.teacher_lesson_plans; v_invalid uuid;
begin
  perform public.assert_current_actor_teacher_access(); perform public.assert_lesson_recipe(p_recipe);
  select * into v_plan from public.teacher_lesson_plans where id=p_plan_id and teacher_id=auth.uid() for update;
  if v_plan.id is null then return jsonb_build_object('ok',false,'error','plan_not_found'); end if;
  if v_plan.status <> 'draft' then return jsonb_build_object('ok',false,'error','plan_immutable'); end if;
  if v_plan.revision <> p_expected_revision then return jsonb_build_object('ok',false,'error','revision_conflict','revision',v_plan.revision); end if;
  if coalesce(cardinality(p_learner_ids),0) not between 1 and 40 or (select count(distinct id) from unnest(p_learner_ids) id) <> cardinality(p_learner_ids)
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select requested.id into v_invalid from unnest(p_learner_ids) requested(id) left join public.students student on student.id=requested.id and student.class_id=v_plan.class_id and student.teacher_id=auth.uid() and student.archived_at is null where student.id is null limit 1;
  if v_invalid is not null then return jsonb_build_object('ok',false,'error','student_not_in_class'); end if;
  update public.teacher_lesson_plans set cycle_id=p_recipe->>'cycleId',target_key=p_recipe->>'targetKey',duration_minutes=(p_recipe->>'durationMinutes')::integer,recipe=p_recipe-'learnerIds',content_version=p_recipe->>'contentVersion',scheduled_for=p_scheduled_for,revision=revision+1,updated_at=now() where id=v_plan.id returning * into v_plan;
  delete from public.teacher_lesson_plan_students where plan_id=v_plan.id;
  insert into public.teacher_lesson_plan_students(plan_id,student_id) select v_plan.id,id from unnest(p_learner_ids) id;
  return jsonb_build_object('ok',true,'plan_id',v_plan.id,'revision',v_plan.revision,'status',v_plan.status);
end; $$;

create or replace function public.teacher_record_lesson_delivery(
  p_plan_id uuid, p_client_event_id text, p_learner_ids uuid[], p_completion_state text,
  p_notes text default '', p_observed_support jsonb default '{}'::jsonb
) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_plan public.teacher_lesson_plans; v_delivery public.teacher_lesson_plan_deliveries; v_invalid uuid;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_plan from public.teacher_lesson_plans where id=p_plan_id and teacher_id=auth.uid() for update;
  if v_plan.id is null then return jsonb_build_object('ok',false,'error','plan_not_found'); end if;
  if v_plan.status <> 'draft' then return jsonb_build_object('ok',false,'error','plan_immutable'); end if;
  if nullif(btrim(coalesce(p_client_event_id,'')),'') is null or char_length(p_client_event_id)>120 or p_completion_state not in ('delivered','partially_delivered','not_delivered') or char_length(coalesce(p_notes,''))>2000 or jsonb_typeof(coalesce(p_observed_support,'{}'::jsonb))<>'object'
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select requested.id into v_invalid from unnest(p_learner_ids) requested(id) left join public.teacher_lesson_plan_students member on member.plan_id=v_plan.id and member.student_id=requested.id where member.student_id is null limit 1;
  if v_invalid is not null or coalesce(cardinality(p_learner_ids),0)<1 then return jsonb_build_object('ok',false,'error','student_not_in_plan'); end if;
  insert into public.teacher_lesson_plan_deliveries(plan_id,teacher_id,class_id,completion_state,notes,observed_support,client_event_id)
  values(v_plan.id,auth.uid(),v_plan.class_id,p_completion_state,coalesce(p_notes,''),coalesce(p_observed_support,'{}'::jsonb),p_client_event_id)
  on conflict(teacher_id,client_event_id) do nothing returning * into v_delivery;
  if v_delivery.id is null then select * into v_delivery from public.teacher_lesson_plan_deliveries where teacher_id=auth.uid() and client_event_id=p_client_event_id; return jsonb_build_object('ok',true,'delivery_id',v_delivery.id,'duplicate',true); end if;
  insert into public.teacher_lesson_delivery_students(delivery_id,student_id) select v_delivery.id,id from unnest(p_learner_ids) id;
  update public.teacher_lesson_plans set status=case when p_completion_state='not_delivered' then 'cancelled' else 'delivered' end,revision=revision+1,updated_at=now() where id=v_plan.id;
  return jsonb_build_object('ok',true,'delivery_id',v_delivery.id,'evidence_purpose','practice');
end; $$;

revoke all on function public.assert_lesson_recipe(jsonb) from public,anon,authenticated;
revoke all on function public.teacher_create_lesson_plan(uuid,uuid,uuid[],jsonb,jsonb,timestamptz), public.teacher_read_lesson_plan(uuid), public.teacher_update_draft_lesson_plan(uuid,integer,uuid[],jsonb,timestamptz), public.teacher_record_lesson_delivery(uuid,text,uuid[],text,text,jsonb) from public,anon;
grant execute on function public.teacher_create_lesson_plan(uuid,uuid,uuid[],jsonb,jsonb,timestamptz), public.teacher_read_lesson_plan(uuid), public.teacher_update_draft_lesson_plan(uuid,integer,uuid[],jsonb,timestamptz), public.teacher_record_lesson_delivery(uuid,text,uuid[],text,text,jsonb) to authenticated;

commit;
