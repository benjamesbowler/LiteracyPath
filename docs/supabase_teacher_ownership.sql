-- LiteracyPath teacher ownership migration
-- Run this in the Supabase SQL editor after backing up production data.
-- Existing rows need a manual teacher_id backfill before strict classroom use.

begin;

alter table public.classes
  add column if not exists teacher_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.students
  add column if not exists teacher_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.answers
  add column if not exists teacher_id uuid references auth.users(id) on delete cascade default auth.uid();

alter table public.mastery
  add column if not exists teacher_id uuid references auth.users(id) on delete cascade default auth.uid();

create index if not exists classes_teacher_id_idx on public.classes(teacher_id);
create index if not exists students_teacher_id_idx on public.students(teacher_id);
create index if not exists students_teacher_class_idx on public.students(teacher_id, class_id);
create index if not exists answers_teacher_student_idx on public.answers(teacher_id, student_id);
create index if not exists mastery_teacher_student_idx on public.mastery(teacher_id, student_id);

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.answers enable row level security;
alter table public.mastery enable row level security;

-- Remove old broad policies on these app tables, including unsafe anon read/write policies.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('classes', 'students', 'answers', 'mastery')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end $$;

create policy "Teachers can read own classes"
  on public.classes for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own classes"
  on public.classes for insert
  with check (teacher_id = auth.uid());

create policy "Teachers can update own classes"
  on public.classes for update
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Teachers can delete own classes"
  on public.classes for delete
  using (teacher_id = auth.uid());

create policy "Teachers can read own students"
  on public.students for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own students"
  on public.students for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes
      where classes.id = students.class_id
        and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update own students"
  on public.students for update
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes
      where classes.id = students.class_id
        and classes.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete own students"
  on public.students for delete
  using (teacher_id = auth.uid());

create policy "Teachers can read own answers"
  on public.answers for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own answers"
  on public.answers for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = answers.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update own answers"
  on public.answers for update
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = answers.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete own answers"
  on public.answers for delete
  using (teacher_id = auth.uid());

create policy "Teachers can read own mastery"
  on public.mastery for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own mastery"
  on public.mastery for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = mastery.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update own mastery"
  on public.mastery for update
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = mastery.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete own mastery"
  on public.mastery for delete
  using (teacher_id = auth.uid());

commit;

-- Optional after manual backfill of old rows:
-- alter table public.classes alter column teacher_id set not null;
-- alter table public.students alter column teacher_id set not null;
-- alter table public.answers alter column teacher_id set not null;
-- alter table public.mastery alter column teacher_id set not null;
