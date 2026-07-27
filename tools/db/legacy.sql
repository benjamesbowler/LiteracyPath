-- Simulate the hosted database: tables created by an OLDER schema, missing the
-- columns later migrations added. This is what an empty database never shows.
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, teacher_id)
);
create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (id, teacher_id),
  constraint students_class_teacher_fk foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id) on delete cascade
);
create table public.learn_activity (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  class_id uuid not null,
  teacher_id uuid not null,
  created_at timestamptz not null default now()
);
