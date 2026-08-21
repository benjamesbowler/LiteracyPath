-- Remove the retired non-literacy domain from an already-migrated deployment.
--
-- Fresh databases no longer create these objects because the feature migrations
-- have been removed. This migration is deliberately idempotent so the same
-- repository also cleans a production database that received those migrations.

begin;

do $restore_export_chain$
begin
  if to_regprocedure(
    'public.teacher_export_learner_data_without_maths_evidence(uuid,text,text)'
  ) is not null then
    drop function if exists public.teacher_export_learner_data(uuid, text, text);
    drop function if exists public.teacher_export_learner_data_without_maths_assignments(
      uuid, text, text
    );
    alter function public.teacher_export_learner_data_without_maths_evidence(
      uuid, text, text
    ) rename to teacher_export_learner_data;
  end if;

  if to_regprocedure(
    'public.teacher_complete_learner_deletion_without_maths(uuid,text,jsonb)'
  ) is not null then
    drop function if exists public.teacher_complete_learner_deletion(uuid, text, jsonb);
    alter function public.teacher_complete_learner_deletion_without_maths(
      uuid, text, jsonb
    ) rename to teacher_complete_learner_deletion;
  end if;
end
$restore_export_chain$;

do $drop_retired_functions$
declare
  retired_function regprocedure;
begin
  for retired_function in
    select procedure.oid::regprocedure
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname ilike '%maths%'
  loop
    execute format('drop function %s cascade', retired_function);
  end loop;
end
$drop_retired_functions$;

do $drop_retired_tables$
declare
  retired_table regclass;
begin
  for retired_table in
    select class.oid::regclass
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relkind in ('r', 'p')
      and class.relname ilike '%maths%'
  loop
    execute format('drop table %s cascade', retired_table);
  end loop;
end
$drop_retired_tables$;

revoke all on function public.teacher_export_learner_data(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.teacher_export_learner_data(uuid, text, text)
  to authenticated;

revoke all on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.teacher_complete_learner_deletion(uuid, text, jsonb)
  to authenticated;

do $verify_retired_domain_absent$
begin
  if exists (
    select 1
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname ilike '%maths%'
  ) or exists (
    select 1
    from pg_class class
    join pg_namespace namespace on namespace.oid = class.relnamespace
    where namespace.nspname = 'public'
      and class.relname ilike '%maths%'
  ) then
    raise exception 'Retired non-literacy database objects remain.';
  end if;
end
$verify_retired_domain_absent$;

commit;
