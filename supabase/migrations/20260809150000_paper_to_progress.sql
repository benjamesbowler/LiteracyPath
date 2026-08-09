begin;

create table public.worksheet_instances (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null, title text not null check(char_length(btrim(title)) between 1 and 200),
  recipe jsonb not null check(jsonb_typeof(recipe)='object' and octet_length(recipe::text)<=131072),
  content_version text not null check(char_length(btrim(content_version)) between 1 and 120),
  lookup_hash bytea not null unique, short_code text not null unique check(short_code ~ '^[A-Z2-9]{8}$'),
  status text not null default 'open' check(status in ('open','closed')),
  created_at timestamptz not null default now(), closed_at timestamptz,
  constraint worksheet_instances_class_teacher_fk foreign key(class_id,teacher_id) references public.classes(id,teacher_id) on delete cascade
);
create table public.worksheet_instance_students (
  instance_id uuid not null references public.worksheet_instances(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key(instance_id,student_id)
);
create table public.worksheet_observation_batches (
  id uuid primary key default gen_random_uuid(), instance_id uuid not null references public.worksheet_instances(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade, revision integer not null check(revision>0),
  supersedes_batch_id uuid references public.worksheet_observation_batches(id) on delete restrict,
  client_event_id text not null check(char_length(client_event_id) between 1 and 120),
  batch_note text not null default '' check(char_length(batch_note)<=2000), created_at timestamptz not null default now(),
  unique(instance_id,revision), unique(teacher_id,client_event_id)
);
create table public.worksheet_observation_marks (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.worksheet_observation_batches(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  target_key text not null check(char_length(target_key) between 1 and 200), item_id text,
  state text not null check(state in ('independent','supported','incorrect','not_checked','not_completed')),
  note text not null default '' check(char_length(note)<=1000), evidence_purpose text not null default 'practice' check(evidence_purpose='practice'),
  unique(batch_id,student_id,target_key,item_id)
);
create index worksheet_instance_students_student_idx on public.worksheet_instance_students(student_id,instance_id);
create index worksheet_marks_student_idx on public.worksheet_observation_marks(student_id,batch_id);
alter table public.worksheet_instances enable row level security; alter table public.worksheet_instance_students enable row level security;
alter table public.worksheet_observation_batches enable row level security; alter table public.worksheet_observation_marks enable row level security;
revoke all on public.worksheet_instances,public.worksheet_instance_students,public.worksheet_observation_batches,public.worksheet_observation_marks from public,anon,authenticated;

create or replace function public.teacher_create_worksheet_instance(p_class_id uuid,p_learner_ids uuid[],p_recipe jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public,extensions as $$
declare v_instance public.worksheet_instances; v_token text; v_code text; v_invalid uuid;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid())
    or coalesce(cardinality(p_learner_ids),0) not between 1 and 40
    or (select count(distinct id) from unnest(p_learner_ids) id)<>cardinality(p_learner_ids)
    or jsonb_typeof(p_recipe)<>'object' or coalesce((p_recipe->>'schemaVersion')::integer,0)<>1
    or jsonb_typeof(p_recipe->'targets')<>'array' or jsonb_array_length(p_recipe->'targets') not between 1 and 80
    or nullif(p_recipe->>'title','') is null or nullif(p_recipe->>'contentVersion','') is null
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select requested.id into v_invalid from unnest(p_learner_ids) requested(id) left join public.students student on student.id=requested.id and student.class_id=p_class_id and student.teacher_id=auth.uid() and student.archived_at is null where student.id is null limit 1;
  if v_invalid is not null then return jsonb_build_object('ok',false,'error','student_not_in_class'); end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  loop v_code:=upper(substr(translate(encode(gen_random_bytes(8),'base64'),'+/=','XYZ'),1,8)); exit when v_code ~ '^[A-Z2-9]{8}$' and not exists(select 1 from public.worksheet_instances where short_code=v_code); end loop;
  insert into public.worksheet_instances(teacher_id,class_id,title,recipe,content_version,lookup_hash,short_code)
  values(auth.uid(),p_class_id,p_recipe->>'title',p_recipe,p_recipe->>'contentVersion',digest(v_token,'sha256'),v_code) returning * into v_instance;
  insert into public.worksheet_instance_students(instance_id,student_id) select v_instance.id,id from unnest(p_learner_ids) id;
  return jsonb_build_object('ok',true,'instance_id',v_instance.id,'lookup_token',v_token,'short_code',v_code,'status',v_instance.status);
end; $$;

create or replace function public.teacher_resolve_worksheet_code(p_code text)
returns jsonb language plpgsql stable security definer set search_path=public,extensions as $$
declare v_instance public.worksheet_instances; v_ids uuid[];
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_instance from public.worksheet_instances where teacher_id=auth.uid() and (short_code=upper(btrim(coalesce(p_code,''))) or lookup_hash=digest(btrim(coalesce(p_code,'')),'sha256'));
  if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if;
  select array_agg(student_id order by student_id) into v_ids from public.worksheet_instance_students where instance_id=v_instance.id;
  return jsonb_build_object('ok',true,'instance',jsonb_build_object('id',v_instance.id,'class_id',v_instance.class_id,'title',v_instance.title,'recipe',v_instance.recipe,'learner_ids',coalesce(v_ids,'{}'::uuid[]),'status',v_instance.status,'created_at',v_instance.created_at));
end; $$;

create or replace function public.teacher_record_worksheet_observation(p_instance_id uuid,p_client_event_id text,p_marks jsonb,p_note text,p_supersedes_batch_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_instance public.worksheet_instances; v_batch public.worksheet_observation_batches; v_revision integer; v_mark jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_instance from public.worksheet_instances where id=p_instance_id and teacher_id=auth.uid() for update;
  if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if;
  if v_instance.status<>'open' then return jsonb_build_object('ok',false,'error','worksheet_closed'); end if;
  if nullif(btrim(coalesce(p_client_event_id,'')),'') is null or char_length(p_client_event_id)>120 or jsonb_typeof(p_marks)<>'array' or jsonb_array_length(p_marks) not between 1 and 3200 or char_length(coalesce(p_note,''))>2000
  then return jsonb_build_object('ok',false,'error','invalid_payload'); end if;
  select * into v_batch from public.worksheet_observation_batches where teacher_id=auth.uid() and client_event_id=p_client_event_id;
  if v_batch.id is not null then return jsonb_build_object('ok',true,'batch_id',v_batch.id,'revision',v_batch.revision,'duplicate',true); end if;
  select coalesce(max(revision),0)+1 into v_revision from public.worksheet_observation_batches where instance_id=v_instance.id;
  if v_revision>1 and (p_supersedes_batch_id is null or not exists(select 1 from public.worksheet_observation_batches where id=p_supersedes_batch_id and instance_id=v_instance.id and revision=v_revision-1))
  then return jsonb_build_object('ok',false,'error','supersedes_required'); end if;
  for v_mark in select value from jsonb_array_elements(p_marks) loop
    if coalesce(v_mark->>'state','') not in ('independent','supported','incorrect','not_checked','not_completed')
      or not exists(select 1 from public.worksheet_instance_students where instance_id=v_instance.id and student_id=(v_mark->>'learnerId')::uuid)
      or not exists(select 1 from jsonb_array_elements(v_instance.recipe->'targets') target where target->>'targetKey'=v_mark->>'targetKey')
      or char_length(coalesce(v_mark->>'note',''))>1000
    then return jsonb_build_object('ok',false,'error','invalid_mark'); end if;
  end loop;
  insert into public.worksheet_observation_batches(instance_id,teacher_id,revision,supersedes_batch_id,client_event_id,batch_note)
  values(v_instance.id,auth.uid(),v_revision,p_supersedes_batch_id,p_client_event_id,coalesce(p_note,'')) returning * into v_batch;
  insert into public.worksheet_observation_marks(batch_id,student_id,target_key,item_id,state,note)
  select v_batch.id,(mark->>'learnerId')::uuid,mark->>'targetKey',nullif(mark->>'itemId',''),mark->>'state',coalesce(mark->>'note','') from jsonb_array_elements(p_marks) mark;
  return jsonb_build_object('ok',true,'batch_id',v_batch.id,'revision',v_batch.revision,'evidence_purpose','practice');
end; $$;

create or replace function public.teacher_read_worksheet_history(p_instance_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_instance public.worksheet_instances; v_batches jsonb;
begin
  perform public.assert_current_actor_teacher_access(); select * into v_instance from public.worksheet_instances where id=p_instance_id and teacher_id=auth.uid(); if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if;
select coalesce(jsonb_agg(jsonb_build_object('id',batch.id,'revision',batch.revision,'supersedes_batch_id',batch.supersedes_batch_id,'note',batch.batch_note,'created_at',batch.created_at,'marks',(select coalesce(jsonb_agg(to_jsonb(mark) order by mark.student_id,mark.target_key),'[]'::jsonb) from public.worksheet_observation_marks mark where mark.batch_id=batch.id)) order by batch.revision),'[]'::jsonb) into v_batches from public.worksheet_observation_batches batch where batch.instance_id=v_instance.id;
return jsonb_build_object('ok',true,'batches',v_batches); end; $$;

create or replace function public.teacher_close_worksheet_instance(p_instance_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_instance public.worksheet_instances;
begin
  perform public.assert_current_actor_teacher_access(); update public.worksheet_instances set status='closed',closed_at=coalesce(closed_at,now()) where id=p_instance_id and teacher_id=auth.uid() returning * into v_instance; if v_instance.id is null then return jsonb_build_object('ok',false,'error','worksheet_not_found'); end if; return jsonb_build_object('ok',true,'status',v_instance.status,'closed_at',v_instance.closed_at); end; $$;

revoke all on function public.teacher_create_worksheet_instance(uuid,uuid[],jsonb),public.teacher_resolve_worksheet_code(text),public.teacher_record_worksheet_observation(uuid,text,jsonb,text,uuid),public.teacher_read_worksheet_history(uuid),public.teacher_close_worksheet_instance(uuid) from public,anon;
grant execute on function public.teacher_create_worksheet_instance(uuid,uuid[],jsonb),public.teacher_resolve_worksheet_code(text),public.teacher_record_worksheet_observation(uuid,text,jsonb,text,uuid),public.teacher_read_worksheet_history(uuid),public.teacher_close_worksheet_instance(uuid) to authenticated;
commit;
