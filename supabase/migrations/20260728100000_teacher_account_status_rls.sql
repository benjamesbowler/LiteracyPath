-- A signed-in account is not yet a teacher account.
--
-- The UI already held pending, rejected, and disabled accounts at the approval
-- screen, but the original owner policies only checked `teacher_id =
-- auth.uid()`. A caller could therefore bypass the UI and keep reading or
-- changing owned school data after approval was withdrawn.
--
-- Keep the privileged student-token RPCs unchanged: they authenticate a
-- short-lived child session and do not use these authenticated-teacher
-- policies.

create or replace function public.current_actor_has_teacher_access()
returns boolean
language sql
stable
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      public.is_app_admin(auth.uid())
      or exists (
        select 1
        from public.pending_teacher_accounts account
        where account.user_id = auth.uid()
          and lower(coalesce(account.role, '')) = 'teacher'
          and lower(coalesce(account.status, '')) = 'approved'
          and lower(coalesce(account.approval_status, '')) = 'approved'
      )
    );
$$;

revoke all on function public.current_actor_has_teacher_access()
  from public, anon;
grant execute on function public.current_actor_has_teacher_access()
  to authenticated;

comment on function public.current_actor_has_teacher_access() is
  'True only for an approved teacher account or an app administrator. Both status columns must remain approved so disabling either one removes access immediately.';

-- Row policies are not evaluated inside privileged functions owned by the
-- database role. Every callable teacher RPC therefore needs the same account
-- check before it validates arguments, reads an owned row, or performs a
-- write. This assertion deliberately remains an invoker function: when a
-- guarded RPC calls it, the RPC owner can read the account row while auth.uid()
-- still identifies the real caller.
create or replace function public.assert_current_actor_teacher_access()
returns void
language plpgsql
volatile
set search_path = public
as $$
begin
  if not public.current_actor_has_teacher_access() then
    raise exception using
      errcode = '42501',
      message = 'An approved teacher account is required.';
  end if;
end;
$$;

revoke all on function public.assert_current_actor_teacher_access()
  from public, anon, authenticated;

-- Keep this inventory exact. The migration refuses to apply if a new
-- authenticated privileged teacher RPC appears without joining the guard.
-- Existing definitions are rewritten in place so their signatures, grants,
-- return types, volatility, and fixed search paths remain unchanged.
do $guard_teacher_rpcs$
declare
  v_expected constant text[] := array[
    'teacher_assign_instructional_group_follow_up(uuid,text,text,date)',
    'teacher_class_access_log(uuid,integer)',
    'teacher_class_access_summary(uuid)',
    'teacher_complete_learner_deletion(uuid,text,jsonb)',
    'teacher_create_insight_intervention(text,uuid,jsonb,uuid[],text[],text,text,date)',
    'teacher_delete_empty_class(uuid)',
    'teacher_delete_learner_data_staged(uuid,uuid,text,text)',
    'teacher_delete_saved_assessment_report(text)',
    'teacher_export_learner_data(uuid,text,text)',
    'teacher_get_learner_deletion_status(uuid,text)',
    'teacher_list_learner_data_rights(uuid)',
    'teacher_prepare_learner_deletion(uuid,text,text)',
    'teacher_record_insight_observation(uuid,jsonb,uuid[],text,text,text,date)',
    'teacher_regenerate_class_code(uuid)',
    'teacher_reset_student_progress(uuid,timestamp with time zone)',
    'teacher_review_instructional_group(uuid,uuid[],jsonb)',
    'teacher_save_instructional_group(uuid,text,jsonb,uuid[],jsonb)',
    'teacher_set_class_code_expiry(uuid,timestamp with time zone)',
    'teacher_set_class_leaderboard_scope(uuid,text)',
    'teacher_set_school(text)',
    'teacher_set_student_archived(uuid,uuid,boolean)',
    'teacher_set_student_symbol_password(uuid,text,timestamp with time zone)',
    'teacher_transfer_student(uuid,uuid,uuid)'
  ];
  v_actual text[];
  v_signature text;
  v_function regprocedure;
  v_definition text;
  v_entry_marker constant text := E'\nbegin\n';
  v_entry_at integer;
begin
  select coalesce(
    array_agg(procedure.oid::regprocedure::text order by procedure.oid::regprocedure::text),
    '{}'::text[]
  )
  into v_actual
  from pg_proc procedure
  join pg_namespace namespace on namespace.oid = procedure.pronamespace
  where namespace.nspname = 'public'
    and procedure.prosecdef
    and procedure.proname like 'teacher\_%' escape '\'
    and has_function_privilege('authenticated', procedure.oid, 'EXECUTE');

  if v_actual is distinct from v_expected then
    raise exception
      'Authenticated teacher RPC inventory drift. Expected %, found %.',
      v_expected,
      v_actual;
  end if;

  foreach v_signature in array v_expected
  loop
    -- The staged deletion entry point is a SQL function. Its only operation is
    -- the shared deletion helper guarded below.
    if v_signature = 'teacher_delete_learner_data_staged(uuid,uuid,text,text)' then
      continue;
    end if;

    v_function := to_regprocedure('public.' || v_signature);
    v_definition := pg_get_functiondef(v_function);

    if position(
      'perform public.assert_current_actor_teacher_access();'
      in v_definition
    ) > 0 then
      continue;
    end if;

    v_entry_at := position(v_entry_marker in v_definition);
    if v_entry_at = 0 then
      raise exception 'Teacher RPC % has no unambiguous entry block.', v_signature;
    end if;

    v_definition := overlay(
      v_definition
      placing E'\nbegin\n  perform public.assert_current_actor_teacher_access();\n'
      from v_entry_at
      for char_length(v_entry_marker)
    );
    execute v_definition;
  end loop;

  -- Both SQL deletion entry points delegate immediately to this helper.
  -- Guarding the shared helper covers the callable staged path and the
  -- administrator-only retention path; application administrators pass the
  -- same predicate explicitly.
  v_function := to_regprocedure(
    'public.perform_verified_learner_deletion(uuid,uuid,text,text,boolean)'
  );
  v_definition := pg_get_functiondef(v_function);
  if position(
    'perform public.assert_current_actor_teacher_access();'
    in v_definition
  ) = 0 then
    v_entry_at := position(v_entry_marker in v_definition);
    if v_entry_at = 0 then
      raise exception 'Verified learner deletion has no unambiguous entry block.';
    end if;
    v_definition := overlay(
      v_definition
      placing E'\nbegin\n  perform public.assert_current_actor_teacher_access();\n'
      from v_entry_at
      for char_length(v_entry_marker)
    );
    execute v_definition;
  end if;
end
$guard_teacher_rpcs$;

drop policy if exists "Teachers manage owned classes" on public.classes;
create policy "Teachers manage owned classes"
  on public.classes for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage owned students" on public.students;
create policy "Teachers manage owned students"
  on public.students for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.classes c
      where c.id = students.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers manage owned answers" on public.answers;
create policy "Teachers manage owned answers"
  on public.answers for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage owned mastery" on public.mastery;
create policy "Teachers manage owned mastery"
  on public.mastery for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage owned item mastery" on public.item_mastery;
create policy "Teachers manage owned item mastery"
  on public.item_mastery for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage their students progress" on public.student_progress;
create policy "Teachers manage their students progress"
  on public.student_progress for all to authenticated
  using (
    public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.students s
      where s.id = student_progress.student_id
        and (
          s.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  )
  with check (
    public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.students s
      where s.id = student_progress.student_id
        and (
          s.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists "Teachers read their students activity" on public.learn_activity;
create policy "Teachers read their students activity"
  on public.learn_activity for select to authenticated
  using (
    public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.students s
      where s.id = learn_activity.student_id
        and (
          s.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists "Teachers insert their students activity" on public.learn_activity;
create policy "Teachers insert their students activity"
  on public.learn_activity for insert to authenticated
  with check (
    public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.students s
      where s.id = learn_activity.student_id
        and (
          s.teacher_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists "Teachers manage their own worksheets" on public.worksheet_bank;
create policy "Teachers manage their own worksheets"
  on public.worksheet_bank for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage owned interventions" on public.teacher_interventions;
create policy "Teachers manage owned interventions"
  on public.teacher_interventions for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_interventions.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups;
create policy "Teachers manage owned instructional groups"
  on public.teacher_instructional_groups for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
    and exists (
      select 1
      from public.classes c
      where c.id = teacher_instructional_groups.class_id
        and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews;
create policy "Teachers manage owned instructional group reviews"
  on public.teacher_instructional_group_reviews for all to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  )
  with check (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers manage owned assessment attempts"
  on public.assessment_attempts;
create policy "Teachers manage owned assessment attempts"
  on public.assessment_attempts for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      public.current_actor_has_teacher_access()
      and assessment_attempts.teacher_id::text = auth.uid()::text
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
      public.current_actor_has_teacher_access()
      and assessment_attempts.teacher_id::text = auth.uid()::text
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

drop policy if exists "Teachers manage owned EL assessment reports"
  on public.el_assessment_reports;
create policy "Teachers manage owned EL assessment reports"
  on public.el_assessment_reports for all to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      public.current_actor_has_teacher_access()
      and el_assessment_reports.teacher_id::text = auth.uid()::text
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
      public.current_actor_has_teacher_access()
      and el_assessment_reports.teacher_id::text = auth.uid()::text
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

drop policy if exists "Teachers read owned insight observations"
  on public.teacher_insight_observations;
create policy "Teachers read owned insight observations"
  on public.teacher_insight_observations for select to authenticated
  using (
    teacher_id = auth.uid()
    and public.current_actor_has_teacher_access()
  );

drop policy if exists "Teachers read their class activity sync health"
  on public.activity_sync_health;
create policy "Teachers read their class activity sync health"
  on public.activity_sync_health for select to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      teacher_id = auth.uid()
      and public.current_actor_has_teacher_access()
    )
  );

drop policy if exists "Teachers read their class access events"
  on public.class_access_events;
create policy "Teachers read their class access events"
  on public.class_access_events for select to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      teacher_id = auth.uid()
      and public.current_actor_has_teacher_access()
    )
  );

drop policy if exists "Teachers read owned data rights requests"
  on public.data_rights_requests;
create policy "Teachers read owned data rights requests"
  on public.data_rights_requests for select to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      teacher_id = auth.uid()
      and public.current_actor_has_teacher_access()
    )
  );

drop policy if exists "Teachers read owned data rights audit events"
  on public.data_rights_audit_events;
create policy "Teachers read owned data rights audit events"
  on public.data_rights_audit_events for select to authenticated
  using (
    public.is_app_admin(auth.uid())
    or (
      teacher_id = auth.uid()
      and public.current_actor_has_teacher_access()
    )
  );

notify pgrst, 'reload schema';
