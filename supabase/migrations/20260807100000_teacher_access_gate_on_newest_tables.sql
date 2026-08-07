-- Close a rejected-teacher access leak on the four newest teacher tables.
--
-- WHY. 20260728100000_teacher_account_status_rls.sql established that every
-- teacher-facing table gates on public.current_actor_has_teacher_access(), which
-- requires role = 'teacher' AND status = 'approved' AND approval_status =
-- 'approved'. Its own header says the point is that a rejected or disabled
-- account holding a live JWT must lose access immediately rather than at token
-- expiry.
--
-- Four tables created after that migration missed the gate and check only
-- `teacher_id = auth.uid()`:
--
--   public.reading_sessions      20260801090000_synced_guided_reading.sql:103-122
--   public.mll_language_assessments  20260806120000_multilingual_learner_profile.sql:165
--   public.mll_exit_criteria         20260806120000_multilingual_learner_profile.sql:223
--   public.mll_family_contacts       20260806120000_multilingual_learner_profile.sql:264
--
-- All four hold direct `grant ... to authenticated`, so those policies are the
-- whole boundary. A teacher whose account was rejected or disabled kept reading
-- and writing guided-reading sessions and multilingual-learner records —
-- including the family-contact log, which is the compliance audit trail — until
-- their token expired.
--
-- The drift guard in 20260728100000 did not catch this because it only inspects
-- SECURITY DEFINER functions named `teacher_*`. Tables were never in scope.
-- Part 2 of this migration widens it.

begin;

/* ------------------------------------------------------------------ *
 * Part 1 — add the gate
 * ------------------------------------------------------------------ */

-- reading_sessions. Four separate policies rather than one FOR ALL, matching
-- the shape the original migration chose.

drop policy if exists "Teachers read their reading sessions" on public.reading_sessions;
create policy "Teachers read their reading sessions"
  on public.reading_sessions for select to authenticated
  using (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  );

drop policy if exists "Teachers create their reading sessions" on public.reading_sessions;
create policy "Teachers create their reading sessions"
  on public.reading_sessions for insert to authenticated
  with check (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  );

drop policy if exists "Teachers update their reading sessions" on public.reading_sessions;
create policy "Teachers update their reading sessions"
  on public.reading_sessions for update to authenticated
  using (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  )
  with check (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  );

drop policy if exists "Teachers delete their reading sessions" on public.reading_sessions;
create policy "Teachers delete their reading sessions"
  on public.reading_sessions for delete to authenticated
  using (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  );

-- MLL tables. `current_actor_has_teacher_access()` already returns true for an
-- app admin, so the separate `is_app_admin` disjunct stays only to keep the
-- admin read path identical to what it was.

drop policy if exists mll_language_assessments_teacher_access on public.mll_language_assessments;
create policy mll_language_assessments_teacher_access
  on public.mll_language_assessments
  for all
  to authenticated
  using (
    public.current_actor_has_teacher_access()
    and (teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  )
  with check (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
    and exists (
      select 1
      from public.students s
      where s.id = mll_language_assessments.student_id
        and s.teacher_id = auth.uid()
    )
  );

drop policy if exists mll_exit_criteria_teacher_access on public.mll_exit_criteria;
create policy mll_exit_criteria_teacher_access
  on public.mll_exit_criteria
  for all
  to authenticated
  using (
    public.current_actor_has_teacher_access()
    and (teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  )
  with check (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
  );

drop policy if exists mll_family_contacts_teacher_access on public.mll_family_contacts;
create policy mll_family_contacts_teacher_access
  on public.mll_family_contacts
  for all
  to authenticated
  using (
    public.current_actor_has_teacher_access()
    and (teacher_id = auth.uid() or public.is_app_admin(auth.uid()))
  )
  with check (
    public.current_actor_has_teacher_access()
    and teacher_id = auth.uid()
    and exists (
      select 1
      from public.students s
      where s.id = mll_family_contacts.student_id
        and s.teacher_id = auth.uid()
    )
  );

/* ------------------------------------------------------------------ *
 * Part 2 — stop this happening again, in CI rather than here
 * ------------------------------------------------------------------ */

-- The regression check for this lives in tests/unit/teacherAccessGateCoverage.test.js,
-- NOT in this migration, and that placement is deliberate.
--
-- The first draft of this file ended with a DO block that raised if any
-- browser-reachable table had a policy referencing auth.uid() without the gate.
-- Run against a real PostgreSQL (tools/db/checkTeacherGateDrift.mjs), it flagged
-- sixteen tables and aborted the migration. The heuristic was wrong:
-- `public.is_app_admin(auth.uid())` contains `auth.uid()`, so every admin policy
-- on every table matched. Shipping it would have blocked the deploy.
--
-- A check that can halt a production migration on a false positive is worse than
-- no check. The same assertion in a unit test fails in CI, where a human reads
-- it and nothing is broken meanwhile. That is where it now lives.

commit;
