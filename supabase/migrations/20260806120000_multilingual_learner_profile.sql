-- Multilingual learner profile fields.
--
-- Adds the language-background and service columns the MLL reporting module
-- needs. See docs/reporting/MLL_LANGUAGE_REPORTING.md.
--
-- THREE DESIGN NOTES, each of which is a correctness decision rather than a
-- preference:
--
--  1. Home language ORAL and home language LITERACY are separate columns. A
--     child literate in Spanish transfers differently from one who is not, and a
--     child whose first language uses a non-Latin script differs again. Collapsing
--     these into one boolean loses the distinction that drives the transfer
--     analysis.
--
--  2. Every column is NULLABLE with no default. "Not recorded" and "no" are
--     different facts. A default of false would silently assert that every child
--     in every existing class is not a multilingual learner, which is not
--     something this migration knows.
--
--  3. There is deliberately NO disability or special-education column here.
--     Several state records rules (Arizona's is representative) require that any
--     record identifying a student as having a disability be filed in secured
--     special-education files. Attaching that to a language record would pull the
--     whole table into that regime. If it is ever needed, it belongs in its own
--     table with its own policy.
--
-- Proficiency scores live in `mll_language_assessments` rather than on the
-- student row, because a student has many of them over time and because the
-- 2025-26 WIDA rebaseline means the row must carry the testing year to be
-- interpretable at all.

alter table public.students
  add column if not exists is_multilingual_learner boolean,
  add column if not exists mll_lifecycle_stage text,
  add column if not exists mll_date_first_identified date,
  add column if not exists mll_date_exited date,
  add column if not exists home_language text,
  add column if not exists home_language_oral boolean,
  add column if not exists home_language_literacy boolean,
  add column if not exists other_languages text[],
  add column if not exists country_of_origin text,
  add column if not exists years_in_us_schools smallint,
  add column if not exists mll_funds_of_knowledge text,
  add column if not exists mll_program_model text,
  add column if not exists mll_service_minutes_per_week smallint,
  add column if not exists mll_service_provider text,
  add column if not exists mll_support_types text[],
  add column if not exists mll_accommodations text[],
  add column if not exists mll_family_declined_services boolean,
  add column if not exists mll_updated_at timestamptz;

alter table public.students
  drop constraint if exists students_mll_lifecycle_stage_check;

alter table public.students
  add constraint students_mll_lifecycle_stage_check
  check (
    mll_lifecycle_stage is null
    or mll_lifecycle_stage in (
      'home_language_survey', 'screened', 'identified', 'served',
      'monitoring', 'former', 'never_identified'
    )
  );

alter table public.students
  drop constraint if exists students_years_in_us_schools_check;

alter table public.students
  add constraint students_years_in_us_schools_check
  check (years_in_us_schools is null or (years_in_us_schools >= 0 and years_in_us_schools <= 20));

alter table public.students
  drop constraint if exists students_mll_service_minutes_check;

alter table public.students
  add constraint students_mll_service_minutes_check
  check (mll_service_minutes_per_week is null or (mll_service_minutes_per_week >= 0 and mll_service_minutes_per_week <= 2400));

comment on column public.students.home_language_oral is
  'Speaks the home language. Tracked apart from literacy on purpose: what transfers depends on which.';
comment on column public.students.home_language_literacy is
  'Reads and writes the home language. Drives whether the alphabetic principle itself needs teaching.';
comment on column public.students.mll_funds_of_knowledge is
  'What this student brings — an asset field, per the WIDA Can Do Philosophy. Not a deficit note.';

-- Only flagged students need indexing; the partial index keeps it small.
create index if not exists students_multilingual_learner_idx
  on public.students (teacher_id, class_id)
  where is_multilingual_learner is true;

/* ------------------------------------------------------------------ *
 * Language proficiency assessments
 * ------------------------------------------------------------------ */

create table if not exists public.mll_language_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null default auth.uid(),

  -- Where the score came from. `official` is derived in the app from this value;
  -- classroom evidence and an ACCESS score must never share a chart axis.
  source text not null,

  -- The testing year is not decoration. WIDA rebaselined the scale for 2025-26
  -- and states plainly that scores either side of that boundary are not
  -- comparable. Without this column a trajectory cannot know where to break.
  testing_year text,
  administered_on date not null,
  grade_at_test text,

  listening_level numeric(2,1),
  speaking_level numeric(2,1),
  reading_level numeric(2,1),
  writing_level numeric(2,1),

  listening_scale_score smallint,
  speaking_scale_score smallint,
  reading_scale_score smallint,
  writing_scale_score smallint,

  oral_language_level numeric(2,1),
  literacy_level numeric(2,1),
  comprehension_level numeric(2,1),
  overall_level numeric(2,1),

  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Same composite-foreign-key pattern as every other child-data table: a row
  -- can only ever point at a student the same teacher owns.
  constraint mll_language_assessments_student_fkey
    foreign key (student_id, teacher_id)
    references public.students (id, teacher_id)
    on delete cascade,

  constraint mll_language_assessments_source_check
    check (source in ('access', 'screener', 'model', 'district', 'classroom', 'teacher')),

  -- Levels run 1.0 to 6.0. A row outside that range is a data error, not a
  -- very advanced child.
  constraint mll_language_assessments_level_range_check check (
    coalesce(listening_level, 1) between 1 and 6
    and coalesce(speaking_level, 1) between 1 and 6
    and coalesce(reading_level, 1) between 1 and 6
    and coalesce(writing_level, 1) between 1 and 6
    and coalesce(oral_language_level, 1) between 1 and 6
    and coalesce(literacy_level, 1) between 1 and 6
    and coalesce(comprehension_level, 1) between 1 and 6
    and coalesce(overall_level, 1) between 1 and 6
  ),

  constraint mll_language_assessments_unique_administration
    unique (student_id, source, administered_on)
);

create index if not exists mll_language_assessments_student_idx
  on public.mll_language_assessments (teacher_id, student_id, administered_on desc);

alter table public.mll_language_assessments enable row level security;
revoke all on public.mll_language_assessments from anon;
grant select, insert, update, delete on public.mll_language_assessments to authenticated;

drop policy if exists mll_language_assessments_teacher_access on public.mll_language_assessments;
create policy mll_language_assessments_teacher_access
  on public.mll_language_assessments
  for all
  to authenticated
  using (
    teacher_id = auth.uid()
    or public.is_app_admin(auth.uid())
  )
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students s
      where s.id = mll_language_assessments.student_id
        and s.teacher_id = auth.uid()
    )
  );

/* ------------------------------------------------------------------ *
 * District exit criteria
 * ------------------------------------------------------------------ */

-- Exit thresholds range 4.0 to 5.0 across states, are frequently conjunctive
-- (composite AND a domain floor), and every WIDA state will revisit its cut
-- after the July 2026 standard setting. So: configuration with an effective
-- date, never a constant.
create table if not exists public.mll_exit_criteria (
  id uuid primary key default gen_random_uuid(),
  school_id uuid,
  teacher_id uuid not null default auth.uid(),
  composite_id text not null default 'overall',
  composite_minimum numeric(2,1),
  domain_floor numeric(2,1),
  additional_criteria text[],
  effective_from date not null,
  effective_to date,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint mll_exit_criteria_composite_check
    check (composite_id in ('overall', 'oral_language', 'literacy', 'comprehension')),
  constraint mll_exit_criteria_minimum_check
    check (composite_minimum is null or composite_minimum between 1 and 6),
  constraint mll_exit_criteria_floor_check
    check (domain_floor is null or domain_floor between 1 and 6),
  constraint mll_exit_criteria_dates_check
    check (effective_to is null or effective_to > effective_from)
);

create index if not exists mll_exit_criteria_lookup_idx
  on public.mll_exit_criteria (teacher_id, effective_from desc);

alter table public.mll_exit_criteria enable row level security;
revoke all on public.mll_exit_criteria from anon;
grant select, insert, update, delete on public.mll_exit_criteria to authenticated;

drop policy if exists mll_exit_criteria_teacher_access on public.mll_exit_criteria;
create policy mll_exit_criteria_teacher_access
  on public.mll_exit_criteria
  for all
  to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  with check (teacher_id = auth.uid());

/* ------------------------------------------------------------------ *
 * Family communication log
 * ------------------------------------------------------------------ */

-- The audit trail. ESEA 1112(e)(3) requires notification within 30 days of the
-- school year, or two weeks for a mid-year enrollee, "in a language the parents
-- can understand". This is the record that it happened — the thing an EL teacher
-- is asked for at a compliance visit and cannot reconstruct afterwards.
create table if not exists public.mll_family_contacts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  teacher_id uuid not null default auth.uid(),
  contacted_on date not null,
  method text not null,
  language text,
  interpreter_used boolean,
  topic text,
  outcome text,
  created_at timestamptz not null default now(),

  constraint mll_family_contacts_student_fkey
    foreign key (student_id, teacher_id)
    references public.students (id, teacher_id)
    on delete cascade
);

create index if not exists mll_family_contacts_student_idx
  on public.mll_family_contacts (teacher_id, student_id, contacted_on desc);

alter table public.mll_family_contacts enable row level security;
revoke all on public.mll_family_contacts from anon;
grant select, insert, update, delete on public.mll_family_contacts to authenticated;

drop policy if exists mll_family_contacts_teacher_access on public.mll_family_contacts;
create policy mll_family_contacts_teacher_access
  on public.mll_family_contacts
  for all
  to authenticated
  using (teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1
      from public.students s
      where s.id = mll_family_contacts.student_id
        and s.teacher_id = auth.uid()
    )
  );

-- Records retention: state rules commonly hold EL records for four years after
-- the year of last attendance. That is a policy the school configures, not a
-- constant this migration can set — see docs/reporting/MLL_LANGUAGE_REPORTING.md
-- and the existing school retention policy migration.
