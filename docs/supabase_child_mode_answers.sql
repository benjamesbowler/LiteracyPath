-- LiteracyPath Child Mode answer event log
-- Child Mode evidence is intentionally separate from formal EL assessment answers/exports.

begin;

create table if not exists public.child_mode_answers (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'child_mode',
  teacher_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  question_id text not null,
  target_word text not null,
  item_key text not null,
  item_type text not null,
  format_type text not null,
  is_correct boolean not null,
  selected_answer text not null,
  correct_answer text not null,
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists child_mode_answers_teacher_student_idx
  on public.child_mode_answers(teacher_id, student_id);

create index if not exists child_mode_answers_student_item_idx
  on public.child_mode_answers(student_id, item_type, item_key);

create index if not exists child_mode_answers_source_idx
  on public.child_mode_answers(source);

alter table public.child_mode_answers enable row level security;

drop policy if exists "Teachers can read own child mode answers" on public.child_mode_answers;
drop policy if exists "Teachers can insert own child mode answers" on public.child_mode_answers;
drop policy if exists "Teachers can delete own child mode answers" on public.child_mode_answers;

create policy "Teachers can read own child mode answers"
  on public.child_mode_answers for select
  using (teacher_id = auth.uid());

create policy "Teachers can insert own child mode answers"
  on public.child_mode_answers for insert
  with check (
    source = 'child_mode'
    and teacher_id = auth.uid()
    and exists (
      select 1
      from public.students
      where students.id = child_mode_answers.student_id
        and students.teacher_id = auth.uid()
    )
  );

create policy "Teachers can delete own child mode answers"
  on public.child_mode_answers for delete
  using (teacher_id = auth.uid());

commit;
