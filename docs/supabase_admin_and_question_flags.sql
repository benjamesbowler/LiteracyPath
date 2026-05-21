-- Admin roles and meaningful question flags for LiteracyPath.
-- Run this after the teacher ownership migration.

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.question_flags (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  teacher_email text,
  student_id uuid,
  class_id uuid,
  question_id text not null,
  question_text text not null,
  choices jsonb not null default '[]'::jsonb,
  correct_answer text,
  skill text,
  diagnostic_target text,
  mode text,
  issue_type text,
  note text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  constraint question_flags_status_check check (status in ('open', 'resolved')),
  constraint question_flags_issue_type_check check (
    issue_type is null or issue_type in (
      'Incorrect answer',
      'Confusing wording',
      'Too hard',
      'Too easy',
      'Bad audio',
      'Bad image',
      'Wrong skill',
      'Other'
    )
  )
);

create unique index if not exists question_flags_one_open_per_teacher_question
  on public.question_flags (teacher_id, question_id)
  where status = 'open';

create index if not exists question_flags_status_created_idx
  on public.question_flags (status, created_at desc);

create index if not exists question_flags_teacher_idx
  on public.question_flags (teacher_id);

create index if not exists question_flags_student_idx
  on public.question_flags (student_id);

create index if not exists question_flags_class_idx
  on public.question_flags (class_id);

alter table public.app_admins enable row level security;
alter table public.question_flags enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_app_admin() from public;
grant execute on function public.is_app_admin() to authenticated;

-- app_admins: users can detect their own admin row; admins can manage all admin rows.
drop policy if exists "Users can read own admin row" on public.app_admins;
create policy "Users can read own admin row"
  on public.app_admins
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_app_admin());

drop policy if exists "Admins can insert admin rows" on public.app_admins;
create policy "Admins can insert admin rows"
  on public.app_admins
  for insert
  to authenticated
  with check (public.is_app_admin());

drop policy if exists "Admins can update admin rows" on public.app_admins;
create policy "Admins can update admin rows"
  on public.app_admins
  for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can delete admin rows" on public.app_admins;
create policy "Admins can delete admin rows"
  on public.app_admins
  for delete
  to authenticated
  using (public.is_app_admin());

-- question_flags: teachers can flag their own questions; admins can review and resolve all flags.
drop policy if exists "Teachers can insert own question flags" on public.question_flags;
create policy "Teachers can insert own question flags"
  on public.question_flags
  for insert
  to authenticated
  with check (
    teacher_id = auth.uid()
    and (
      class_id is null
      or exists (
        select 1
        from public.classes
        where classes.id = question_flags.class_id
          and classes.teacher_id = auth.uid()
      )
    )
    and (
      student_id is null
      or exists (
        select 1
        from public.students
        where students.id = question_flags.student_id
          and students.teacher_id = auth.uid()
      )
    )
  );

drop policy if exists "Teachers can read own question flags" on public.question_flags;
create policy "Teachers can read own question flags"
  on public.question_flags
  for select
  to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin());

drop policy if exists "Admins can update question flags" on public.question_flags;
create policy "Admins can update question flags"
  on public.question_flags
  for update
  to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

drop policy if exists "Admins can delete question flags" on public.question_flags;
create policy "Admins can delete question flags"
  on public.question_flags
  for delete
  to authenticated
  using (public.is_app_admin());

-- Admin-aware access for existing teacher-owned tables. These policies are additive and do not remove teacher isolation policies.
drop policy if exists "Admins can read all classes" on public.classes;
create policy "Admins can read all classes"
  on public.classes
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can delete classes" on public.classes;
create policy "Admins can delete classes"
  on public.classes
  for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can read all students" on public.students;
create policy "Admins can read all students"
  on public.students
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can delete students" on public.students;
create policy "Admins can delete students"
  on public.students
  for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can read all answers" on public.answers;
create policy "Admins can read all answers"
  on public.answers
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can delete answers" on public.answers;
create policy "Admins can delete answers"
  on public.answers
  for delete
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can read all mastery" on public.mastery;
create policy "Admins can read all mastery"
  on public.mastery
  for select
  to authenticated
  using (public.is_app_admin());

drop policy if exists "Admins can delete mastery" on public.mastery;
create policy "Admins can delete mastery"
  on public.mastery
  for delete
  to authenticated
  using (public.is_app_admin());

-- Optional tables may not exist in every environment yet.
do $$
begin
  if to_regclass('public.item_mastery') is not null then
    execute 'drop policy if exists "Admins can read all item mastery" on public.item_mastery';
    execute 'create policy "Admins can read all item mastery" on public.item_mastery for select to authenticated using (public.is_app_admin())';
    execute 'drop policy if exists "Admins can delete item mastery" on public.item_mastery';
    execute 'create policy "Admins can delete item mastery" on public.item_mastery for delete to authenticated using (public.is_app_admin())';
  end if;

  if to_regclass('public.assessment_sessions') is not null then
    execute 'drop policy if exists "Admins can read all assessment sessions" on public.assessment_sessions';
    execute 'create policy "Admins can read all assessment sessions" on public.assessment_sessions for select to authenticated using (public.is_app_admin())';
    execute 'drop policy if exists "Admins can delete assessment sessions" on public.assessment_sessions';
    execute 'create policy "Admins can delete assessment sessions" on public.assessment_sessions for delete to authenticated using (public.is_app_admin())';
  end if;
end $$;
