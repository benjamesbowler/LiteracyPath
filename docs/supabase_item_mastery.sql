-- LiteracyPath item mastery infrastructure
-- Run this after docs/supabase_teacher_ownership.sql has been applied.
-- This table tracks item-level mastery in parallel with the existing stage mastery system.

begin;

create table if not exists public.item_mastery (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  student_id uuid not null references public.students(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  attempts integer not null default 0,
  correct integer not null default 0,
  last_seen timestamptz,
  last_result boolean not null default false,
  sessions_seen integer not null default 0,
  mastered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint item_mastery_attempts_nonnegative check (attempts >= 0),
  constraint item_mastery_correct_nonnegative check (correct >= 0),
  constraint item_mastery_correct_not_more_than_attempts check (correct <= attempts),
  constraint item_mastery_sessions_nonnegative check (sessions_seen >= 0),
  constraint item_mastery_unique_item unique (teacher_id, student_id, item_key, item_type)
);

create index if not exists item_mastery_teacher_student_idx
  on public.item_mastery(teacher_id, student_id);

create index if not exists item_mastery_student_type_idx
  on public.item_mastery(student_id, item_type, item_key);

alter table public.item_mastery enable row level security;

drop policy if exists "Teachers can read own item mastery" on public.item_mastery;
drop policy if exists "Teachers can insert own item mastery" on public.item_mastery;
drop policy if exists "Teachers can update own item mastery" on public.item_mastery;
drop policy if exists "Teachers can delete own item mastery" on public.item_mastery;

create policy "Teachers can read own item mastery"
  on public.item_mastery for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own item mastery"
  on public.item_mastery for insert
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = item_mastery.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update own item mastery"
  on public.item_mastery for update
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = item_mastery.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete own item mastery"
  on public.item_mastery for delete
  using (teacher_id = auth.uid());

commit;
