-- Reconcile installations where the core tables predate managed migrations.
-- The early bootstrap migration creates fresh databases; this migration adds
-- the safe ownership constraints and admin policies to existing databases.

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

alter table public.classes
  add column if not exists updated_at timestamptz not null default now();

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists classes_id_teacher_key
  on public.classes (id, teacher_id);
create unique index if not exists students_id_teacher_key
  on public.students (id, teacher_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'students_class_teacher_fk'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_class_teacher_fk
      foreign key (class_id, teacher_id)
      references public.classes(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'answers_student_teacher_fk'
      and conrelid = 'public.answers'::regclass
  ) then
    alter table public.answers
      add constraint answers_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'mastery_student_teacher_fk'
      and conrelid = 'public.mastery'::regclass
  ) then
    alter table public.mastery
      add constraint mastery_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'item_mastery_student_teacher_fk'
      and conrelid = 'public.item_mastery'::regclass
  ) then
    alter table public.item_mastery
      add constraint item_mastery_student_teacher_fk
      foreign key (student_id, teacher_id)
      references public.students(id, teacher_id)
      on delete cascade
      not valid;
  end if;
end;
$$;

drop policy if exists "App admins manage all classes" on public.classes;
create policy "App admins manage all classes"
  on public.classes for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all students" on public.students;
create policy "App admins manage all students"
  on public.students for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all answers" on public.answers;
create policy "App admins manage all answers"
  on public.answers for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all mastery" on public.mastery;
create policy "App admins manage all mastery"
  on public.mastery for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists "App admins manage all item mastery" on public.item_mastery;
create policy "App admins manage all item mastery"
  on public.item_mastery for all to authenticated
  using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists students_set_updated_at on public.students;
create trigger students_set_updated_at
  before update on public.students
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists mastery_set_updated_at on public.mastery;
create trigger mastery_set_updated_at
  before update on public.mastery
  for each row execute function public.set_core_learning_updated_at();

drop trigger if exists item_mastery_set_updated_at on public.item_mastery;
create trigger item_mastery_set_updated_at
  before update on public.item_mastery
  for each row execute function public.set_core_learning_updated_at();
