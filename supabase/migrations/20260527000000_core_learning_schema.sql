-- Reconstructable core learning schema.
--
-- Every later managed migration assumes these tables already exist. Keeping
-- their creation in the first migration makes a fresh local/CI database
-- reproducible instead of depending on undocumented dashboard-created tables.

create extension if not exists pgcrypto;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, teacher_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, teacher_id),
  constraint students_class_teacher_fk
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  skill text not null default '',
  stage text not null default '',
  diagnostic_target text,
  question text not null default '',
  passage text not null default '',
  chosen_answer text not null default '',
  correct_answer text not null default '',
  is_correct boolean not null default false,
  answered_at timestamptz not null default now(),
  constraint answers_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade
);

create table if not exists public.mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  skill_label text not null default '',
  mastered boolean not null default false,
  attempts integer not null default 0 check (attempts >= 0),
  last_score integer not null default 0 check (last_score >= 0),
  last_total integer not null default 0 check (last_total >= 0),
  updated_at timestamptz not null default now(),
  constraint mastery_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade
);

create table if not exists public.item_mastery (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  item_key text not null,
  item_type text not null,
  attempts integer not null default 0 check (attempts >= 0),
  correct integer not null default 0 check (correct >= 0 and correct <= attempts),
  last_seen timestamptz,
  last_result boolean not null default false,
  sessions_seen integer not null default 0 check (sessions_seen >= 0),
  mastered boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint item_mastery_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  unique (teacher_id, student_id, item_key, item_type)
);

create index if not exists classes_teacher_name_idx
  on public.classes (teacher_id, lower(name));
create index if not exists students_teacher_class_name_idx
  on public.students (teacher_id, class_id, lower(name));
create index if not exists students_active_class_idx
  on public.students (class_id, name)
  where archived_at is null;
create index if not exists answers_teacher_student_answered_idx
  on public.answers (teacher_id, student_id, answered_at);
create index if not exists mastery_teacher_student_updated_idx
  on public.mastery (teacher_id, student_id, updated_at);
create index if not exists item_mastery_teacher_student_updated_idx
  on public.item_mastery (teacher_id, student_id, updated_at);

alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.answers enable row level security;
alter table public.mastery enable row level security;
alter table public.item_mastery enable row level security;

revoke all on public.classes, public.students, public.answers, public.mastery, public.item_mastery from anon;
grant select, insert, update, delete on public.classes, public.students, public.answers, public.mastery, public.item_mastery to authenticated;

create policy "Teachers manage owned classes"
  on public.classes for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Teachers manage owned students"
  on public.students for all to authenticated
  using (teacher_id = auth.uid())
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.classes c
      where c.id = students.class_id
        and c.teacher_id = auth.uid()
    )
  );

create policy "Teachers manage owned answers"
  on public.answers for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Teachers manage owned mastery"
  on public.mastery for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create policy "Teachers manage owned item mastery"
  on public.item_mastery for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

create or replace function public.set_core_learning_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_core_learning_updated_at();
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_core_learning_updated_at();
create trigger mastery_set_updated_at
  before update on public.mastery
  for each row execute function public.set_core_learning_updated_at();
create trigger item_mastery_set_updated_at
  before update on public.item_mastery
  for each row execute function public.set_core_learning_updated_at();

