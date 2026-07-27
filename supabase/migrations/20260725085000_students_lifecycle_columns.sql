-- Add the two student lifecycle columns BEFORE anything reads them.
--
-- Why this file exists
-- --------------------
-- 20260725145000_teacher_child_lifecycle.sql adds students.archived_at and
-- students.updated_at, but three earlier migrations already reference them:
--
--   20260725090000_class_access_security.sql   reads s.archived_at
--   20260725110000_learner_data_rights.sql     reads v_student.archived_at
--   20260725120000_school_retention_policy.sql reads s.updated_at
--
-- On a database that already had the columns this was invisible. Applying the
-- set in order to a database that did NOT have them fails at
-- retention_last_learner_activity with:
--
--   ERROR: 42703: column s.updated_at does not exist
--
-- because PostgreSQL validates the body of a `language sql` function when the
-- function is created, not when it is called. Observed on 2026-07-27 against
-- the hosted project.
--
-- The columns are declared once, first, so no later migration can depend on a
-- column that does not exist yet. 20260725145000 still declares them too; both
-- are `if not exists`, so running either order is safe.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.students.archived_at is
  'When the teacher archived this child. Null means active.';
comment on column public.students.updated_at is
  'Last change to the student row. Used by retention to find the last activity.';
