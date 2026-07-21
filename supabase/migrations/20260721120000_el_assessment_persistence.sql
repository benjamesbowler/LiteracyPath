-- Durable EL assessment attempts and generated reports.
-- The payload columns retain the complete, versioned assessment evidence while
-- relational columns support secure teacher/student filters and summaries.

create table if not exists public.assessment_attempts (
  attempt_id text primary key,
  student_id text not null,
  class_id text,
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  assessment_type text not null default 'skill_checkpoint',
  skill_id text not null default '',
  skill_name text not null default 'Assessment',
  skill_level integer not null default 1,
  skill_phase integer not null default 1,
  started_at timestamptz,
  completed_at timestamptz not null default now(),
  total_questions integer not null default 0,
  correct_count integer not null default 0,
  accuracy numeric(5, 2) not null default 0,
  status text not null default 'needs_retry',
  administration_status text not null default 'completed',
  schema_version integer not null default 1,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep this migration safe for installations where the app's optional cloud
-- table was created manually before it became part of the managed schema.
alter table public.assessment_attempts
  add column if not exists attempt_id text,
  add column if not exists student_id text,
  add column if not exists class_id text,
  add column if not exists teacher_id uuid default auth.uid() references auth.users(id) on delete cascade,
  add column if not exists assessment_type text not null default 'skill_checkpoint',
  add column if not exists skill_id text not null default '',
  add column if not exists skill_name text not null default 'Assessment',
  add column if not exists skill_level integer not null default 1,
  add column if not exists skill_phase integer not null default 1,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz not null default now(),
  add column if not exists total_questions integer not null default 0,
  add column if not exists correct_count integer not null default 0,
  add column if not exists accuracy numeric(5, 2) not null default 0,
  add column if not exists status text not null default 'needs_retry',
  add column if not exists administration_status text not null default 'completed',
  add column if not exists schema_version integer not null default 1,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists assessment_attempts_attempt_id_key
  on public.assessment_attempts (attempt_id);
create index if not exists assessment_attempts_teacher_completed_idx
  on public.assessment_attempts (teacher_id, completed_at desc);
create index if not exists assessment_attempts_teacher_student_completed_idx
  on public.assessment_attempts (teacher_id, student_id, completed_at desc);
create index if not exists assessment_attempts_teacher_class_completed_idx
  on public.assessment_attempts (teacher_id, class_id, completed_at desc);

create table if not exists public.el_assessment_reports (
  report_id text primary key,
  report_type text not null,
  class_id text,
  student_id text,
  teacher_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  file_name text not null default '',
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.el_assessment_reports
  add column if not exists report_id text,
  add column if not exists report_type text,
  add column if not exists class_id text,
  add column if not exists student_id text,
  add column if not exists teacher_id uuid default auth.uid() references auth.users(id) on delete cascade,
  add column if not exists generated_at timestamptz not null default now(),
  add column if not exists file_name text not null default '',
  add column if not exists summary jsonb not null default '{}'::jsonb,
  add column if not exists payload jsonb not null default '{}'::jsonb,
  add column if not exists schema_version integer not null default 1,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists el_assessment_reports_report_id_key
  on public.el_assessment_reports (report_id);
create index if not exists el_assessment_reports_teacher_generated_idx
  on public.el_assessment_reports (teacher_id, generated_at desc);
create index if not exists el_assessment_reports_teacher_student_generated_idx
  on public.el_assessment_reports (teacher_id, student_id, generated_at desc);
create index if not exists el_assessment_reports_teacher_class_generated_idx
  on public.el_assessment_reports (teacher_id, class_id, generated_at desc);

create or replace function public.set_el_assessment_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assessment_attempts_set_updated_at on public.assessment_attempts;
create trigger assessment_attempts_set_updated_at
  before update on public.assessment_attempts
  for each row execute function public.set_el_assessment_updated_at();

drop trigger if exists el_assessment_reports_set_updated_at on public.el_assessment_reports;
create trigger el_assessment_reports_set_updated_at
  before update on public.el_assessment_reports
  for each row execute function public.set_el_assessment_updated_at();

alter table public.assessment_attempts enable row level security;
alter table public.el_assessment_reports enable row level security;

revoke all on public.assessment_attempts from anon;
revoke all on public.el_assessment_reports from anon;
grant select, insert, update, delete on public.assessment_attempts to authenticated;
grant select, insert, update, delete on public.el_assessment_reports to authenticated;

drop policy if exists "Teachers manage owned assessment attempts" on public.assessment_attempts;
create policy "Teachers manage owned assessment attempts"
  on public.assessment_attempts for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      assessment_attempts.teacher_id::text = auth.uid()::text
      and exists (
        select 1
        from public.students s
        where s.id::text = assessment_attempts.student_id::text
          and s.teacher_id = auth.uid()
      )
      and (
        assessment_attempts.class_id is null
        or assessment_attempts.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = assessment_attempts.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.is_app_admin(auth.uid())
    or (
      assessment_attempts.teacher_id::text = auth.uid()::text
      and exists (
        select 1
        from public.students s
        where s.id::text = assessment_attempts.student_id::text
          and s.teacher_id = auth.uid()
      )
      and (
        assessment_attempts.class_id is null
        or assessment_attempts.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = assessment_attempts.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Teachers manage owned EL assessment reports" on public.el_assessment_reports;
create policy "Teachers manage owned EL assessment reports"
  on public.el_assessment_reports for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      el_assessment_reports.teacher_id::text = auth.uid()::text
      and (
        el_assessment_reports.student_id is null
        or el_assessment_reports.student_id = ''
        or exists (
          select 1
          from public.students s
          where s.id::text = el_assessment_reports.student_id::text
            and s.teacher_id = auth.uid()
        )
      )
      and (
        el_assessment_reports.class_id is null
        or el_assessment_reports.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = el_assessment_reports.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  )
  with check (
    public.is_app_admin(auth.uid())
    or (
      el_assessment_reports.teacher_id::text = auth.uid()::text
      and (
        el_assessment_reports.student_id is null
        or el_assessment_reports.student_id = ''
        or exists (
          select 1
          from public.students s
          where s.id::text = el_assessment_reports.student_id::text
            and s.teacher_id = auth.uid()
        )
      )
      and (
        el_assessment_reports.class_id is null
        or el_assessment_reports.class_id = ''
        or exists (
          select 1
          from public.classes c
          where c.id::text = el_assessment_reports.class_id::text
            and c.teacher_id = auth.uid()
        )
      )
    )
  );

comment on table public.assessment_attempts is
  'Versioned assessment attempts with complete item-level evidence in payload.';
comment on table public.el_assessment_reports is
  'Versioned EL class and student report snapshots with complete report payloads.';
