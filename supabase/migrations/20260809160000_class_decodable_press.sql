begin;

create table if not exists public.student_book_projects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  rules jsonb not null check (jsonb_typeof(rules) = 'object'),
  content_version integer not null default 1 check (content_version > 0),
  allow_class_library boolean not null default false,
  deadline timestamptz,
  status text not null default 'open' check (status in ('open','closed','archived')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.student_book_project_learners (
  project_id uuid not null references public.student_book_projects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  primary key (project_id, student_id)
);

create table if not exists public.student_books (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.student_book_projects(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null default 'My book' check (char_length(title) between 1 and 80),
  current_revision_id uuid,
  approved_revision_id uuid,
  visibility text not null default 'private' check (visibility in ('private','class')),
  status text not null default 'draft' check (status in ('draft','submitted','changes_requested','approved_private','approved_class','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, student_id)
);

create table if not exists public.student_book_revisions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.student_books(id) on delete cascade,
  revision integer not null check (revision > 0),
  parent_revision_id uuid references public.student_book_revisions(id),
  client_event_id text not null check (char_length(client_event_id) between 8 and 160),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  validation jsonb not null check (jsonb_typeof(validation) = 'object'),
  created_at timestamptz not null default now(),
  unique (book_id, revision),
  unique (book_id, client_event_id)
);

alter table public.student_books add constraint student_books_current_revision_fk foreign key (current_revision_id) references public.student_book_revisions(id);
alter table public.student_books add constraint student_books_approved_revision_fk foreign key (approved_revision_id) references public.student_book_revisions(id);

create table if not exists public.student_book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.student_books(id) on delete cascade,
  revision_id uuid not null references public.student_book_revisions(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  decision text not null check (decision in ('approved','changes_requested','archived')),
  allow_class_library boolean not null default false,
  approved_challenges jsonb not null default '[]'::jsonb check (jsonb_typeof(approved_challenges) = 'array'),
  child_feedback text not null default '' check (char_length(child_feedback) <= 1000),
  review_version integer not null default 1,
  created_at timestamptz not null default now()
);

create unique index if not exists student_book_one_terminal_review_per_revision on public.student_book_reviews(revision_id);
create index if not exists student_book_projects_teacher_class on public.student_book_projects(teacher_id,class_id,status);
create index if not exists student_books_review_queue on public.student_books(project_id,status,updated_at desc);
create index if not exists student_book_revisions_book on public.student_book_revisions(book_id,revision desc);

alter table public.student_book_projects enable row level security;
alter table public.student_book_project_learners enable row level security;
alter table public.student_books enable row level security;
alter table public.student_book_revisions enable row level security;
alter table public.student_book_reviews enable row level security;
revoke all on public.student_book_projects,public.student_book_project_learners,public.student_books,public.student_book_revisions,public.student_book_reviews from public,anon,authenticated;

create or replace function public.teacher_create_press_project(p_class_id uuid,p_learner_ids uuid[],p_project_rules jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_project public.student_book_projects; v_count integer; v_title text; v_assets jsonb; v_pages jsonb;
begin
  perform public.assert_current_actor_teacher_access();
  if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid()) then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  if coalesce(array_length(p_learner_ids,1),0)=0 then return jsonb_build_object('ok',false,'error','learners_required'); end if;
  select count(distinct id) into v_count from public.students where id=any(p_learner_ids) and class_id=p_class_id and coalesce(is_archived,false)=false;
  if v_count<>array_length(p_learner_ids,1) then return jsonb_build_object('ok',false,'error','learner_scope_invalid'); end if;
  v_title:=trim(coalesce(p_project_rules->>'title',''));
  v_assets:=p_project_rules->'assetIds'; v_pages:=p_project_rules->'pagePrompts';
  if jsonb_typeof(p_project_rules)<>'object' or char_length(v_title) not between 1 and 120 or jsonb_typeof(v_assets)<>'array' or jsonb_array_length(v_assets)=0 or jsonb_typeof(v_pages)<>'array' or jsonb_array_length(v_pages)<>4 then return jsonb_build_object('ok',false,'error','project_rules_invalid'); end if;
  insert into public.student_book_projects(teacher_id,class_id,title,rules,content_version,allow_class_library,deadline)
  values(auth.uid(),p_class_id,v_title,p_project_rules,coalesce((p_project_rules->>'contentVersion')::integer,1),coalesce((p_project_rules->>'allowClassLibrary')::boolean,false),nullif(p_project_rules->>'deadline','')::timestamptz) returning * into v_project;
  insert into public.student_book_project_learners(project_id,student_id) select v_project.id,id from public.students where id=any(p_learner_ids) and class_id=p_class_id;
  return jsonb_build_object('ok',true,'project',to_jsonb(v_project),'assigned_count',v_count);
end; $$;

create or replace function public.student_list_press_projects(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_student public.students; v_rows jsonb;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'rules',p.rules,'deadline',p.deadline,'book',case when b.id is null then null else jsonb_build_object('id',b.id,'title',b.title,'status',b.status,'visibility',b.visibility,'current_revision_id',b.current_revision_id,'approved_revision_id',b.approved_revision_id,'content',r.content,'validation',r.validation,'review',(select to_jsonb(rv) from public.student_book_reviews rv where rv.revision_id=b.current_revision_id order by rv.created_at desc limit 1)) end) order by p.created_at desc),'[]'::jsonb) into v_rows
  from public.student_book_projects p join public.student_book_project_learners pl on pl.project_id=p.id and pl.student_id=v_student.id left join public.student_books b on b.project_id=p.id and b.student_id=v_student.id left join public.student_book_revisions r on r.id=b.current_revision_id where p.status='open';
  return jsonb_build_object('ok',true,'projects',v_rows);
end; $$;

create or replace function public.student_save_book_revision(p_token text,p_project_id uuid,p_book_id uuid,p_client_event_id text,p_book jsonb,p_validation jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_student public.students; v_project public.student_book_projects; v_book public.student_books; v_revision public.student_book_revisions; v_number integer; v_page jsonb; v_asset text; v_assets jsonb; v_title text;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select p.* into v_project from public.student_book_projects p join public.student_book_project_learners pl on pl.project_id=p.id where p.id=p_project_id and pl.student_id=v_student.id and p.status='open'; if v_project.id is null then return jsonb_build_object('ok',false,'error','project_not_found'); end if;
  if jsonb_typeof(p_book)<>'object' or jsonb_typeof(p_book->'pages')<>'array' or jsonb_array_length(p_book->'pages')<>4 then return jsonb_build_object('ok',false,'error','book_shape_invalid'); end if;
  v_title:=trim(coalesce(p_book->>'title','')); if char_length(v_title) not between 1 and 80 then return jsonb_build_object('ok',false,'error','title_invalid'); end if;
  v_assets:=v_project.rules->'assetIds';
  for v_page in select value from jsonb_array_elements(p_book->'pages') loop
    v_asset:=v_page->>'assetId'; if char_length(trim(coalesce(v_page->>'text',''))) not between 1 and 240 or not v_assets ? v_asset then return jsonb_build_object('ok',false,'error','page_invalid'); end if;
  end loop;
  if p_book_id is null then insert into public.student_books(project_id,student_id,title) values(p_project_id,v_student.id,v_title) returning * into v_book;
  else select * into v_book from public.student_books where id=p_book_id and project_id=p_project_id and student_id=v_student.id for update; if v_book.id is null or v_book.status in ('submitted','archived') then return jsonb_build_object('ok',false,'error','book_not_editable'); end if; end if;
  select * into v_revision from public.student_book_revisions where book_id=v_book.id and client_event_id=p_client_event_id; if v_revision.id is not null then return jsonb_build_object('ok',true,'book_id',v_book.id,'revision_id',v_revision.id,'revision',v_revision.revision,'idempotent',true); end if;
  select coalesce(max(revision),0)+1 into v_number from public.student_book_revisions where book_id=v_book.id;
  insert into public.student_book_revisions(book_id,revision,parent_revision_id,client_event_id,content,validation) values(v_book.id,v_number,v_book.current_revision_id,p_client_event_id,p_book,p_validation) returning * into v_revision;
  update public.student_books set title=v_title,current_revision_id=v_revision.id,status='draft',updated_at=now() where id=v_book.id;
  return jsonb_build_object('ok',true,'book_id',v_book.id,'revision_id',v_revision.id,'revision',v_number,'status','draft');
end; $$;

create or replace function public.student_submit_book_revision(p_token text,p_book_id uuid,p_revision_id uuid)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_student public.students; v_book public.student_books; v_project public.student_book_projects;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select * into v_book from public.student_books where id=p_book_id and student_id=v_student.id for update;
  if v_book.id is null then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  select * into v_project from public.student_book_projects where id=v_book.project_id;
  if v_project.id is null or v_project.status<>'open' then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  if v_book.current_revision_id<>p_revision_id or v_book.status<>'draft' then return jsonb_build_object('ok',false,'error','revision_not_submittable'); end if;
  update public.student_books set status='submitted',updated_at=now() where id=v_book.id;
  return jsonb_build_object('ok',true,'status','submitted','revision_id',p_revision_id);
end; $$;

create or replace function public.teacher_list_press_work(p_class_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_projects jsonb; v_books jsonb;
begin
  perform public.assert_current_actor_teacher_access(); if not exists(select 1 from public.classes where id=p_class_id and teacher_id=auth.uid()) then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) into v_projects from public.student_book_projects p where p.class_id=p_class_id and p.teacher_id=auth.uid();
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'project_id',b.project_id,'student_id',b.student_id,'student_name',s.name,'title',b.title,'status',b.status,'visibility',b.visibility,'current_revision_id',b.current_revision_id,'approved_revision_id',b.approved_revision_id,'revision',r.revision,'content',r.content,'validation',r.validation,'created_at',r.created_at) order by b.updated_at desc),'[]'::jsonb) into v_books from public.student_books b join public.student_book_projects p on p.id=b.project_id join public.students s on s.id=b.student_id left join public.student_book_revisions r on r.id=b.current_revision_id where p.class_id=p_class_id and p.teacher_id=auth.uid();
  return jsonb_build_object('ok',true,'projects',v_projects,'books',v_books);
end; $$;

create or replace function public.teacher_review_book_revision(p_book_id uuid,p_revision_id uuid,p_decision text,p_review jsonb)
returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare v_book public.student_books; v_project public.student_book_projects; v_allow_class boolean; v_feedback text; v_status text;
begin
  perform public.assert_current_actor_teacher_access();
  select * into v_book from public.student_books where id=p_book_id for update;
  if v_book.id is null then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  select * into v_project from public.student_book_projects where id=v_book.project_id and teacher_id=auth.uid();
  if v_project.id is null then return jsonb_build_object('ok',false,'error','book_not_found'); end if;
  if v_book.status<>'submitted' or v_book.current_revision_id<>p_revision_id or not exists(select 1 from public.student_book_revisions where id=p_revision_id and book_id=p_book_id) then return jsonb_build_object('ok',false,'error','stale_or_unsubmitted_revision'); end if;
  if p_decision not in ('approved','changes_requested','archived') then return jsonb_build_object('ok',false,'error','decision_invalid'); end if;
  v_feedback:=trim(coalesce(p_review->>'childFeedback','')); if char_length(v_feedback)>1000 or (p_decision='changes_requested' and v_feedback='') then return jsonb_build_object('ok',false,'error','feedback_invalid'); end if;
  v_allow_class:=p_decision='approved' and v_project.allow_class_library and coalesce((p_review->>'allowClassLibrary')::boolean,false);
  insert into public.student_book_reviews(book_id,revision_id,teacher_id,decision,allow_class_library,approved_challenges,child_feedback,review_version) values(p_book_id,p_revision_id,auth.uid(),p_decision,v_allow_class,coalesce(p_review->'approvedChallenges','[]'::jsonb),v_feedback,1);
  v_status:=case when p_decision='approved' and v_allow_class then 'approved_class' when p_decision='approved' then 'approved_private' else p_decision end;
  update public.student_books set status=v_status,approved_revision_id=case when p_decision='approved' then p_revision_id else approved_revision_id end,visibility=case when v_allow_class then 'class' else 'private' end,updated_at=now() where id=p_book_id;
  return jsonb_build_object('ok',true,'status',v_status,'approved_revision_id',case when p_decision='approved' then p_revision_id else null end);
exception when unique_violation then return jsonb_build_object('ok',false,'error','revision_already_reviewed');
end; $$;

create or replace function public.student_read_class_press_library(p_token text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare v_student public.students; v_books jsonb;
begin
  v_student:=public.student_from_token(p_token); if v_student.id is null then return jsonb_build_object('ok',false,'error','invalid_student_session'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'title',b.title,'author_name',s.name,'revision_id',b.approved_revision_id,'content',r.content) order by b.updated_at desc),'[]'::jsonb) into v_books from public.student_books b join public.student_book_projects p on p.id=b.project_id join public.students s on s.id=b.student_id join public.student_book_revisions r on r.id=b.approved_revision_id join public.student_book_reviews rv on rv.revision_id=b.approved_revision_id and rv.decision='approved' and rv.allow_class_library=true where p.class_id=v_student.class_id and b.status='approved_class' and b.visibility='class';
  return jsonb_build_object('ok',true,'books',v_books);
end; $$;

revoke all on function public.teacher_create_press_project(uuid,uuid[],jsonb),public.student_list_press_projects(text),public.student_save_book_revision(text,uuid,uuid,text,jsonb,jsonb),public.student_submit_book_revision(text,uuid,uuid),public.teacher_list_press_work(uuid),public.teacher_review_book_revision(uuid,uuid,text,jsonb),public.student_read_class_press_library(text) from public;
grant execute on function public.teacher_create_press_project(uuid,uuid[],jsonb),public.teacher_list_press_work(uuid),public.teacher_review_book_revision(uuid,uuid,text,jsonb) to authenticated;
grant execute on function public.student_list_press_projects(text),public.student_save_book_revision(text,uuid,uuid,text,jsonb,jsonb),public.student_submit_book_revision(text,uuid,uuid),public.student_read_class_press_library(text) to anon,authenticated;

commit;
