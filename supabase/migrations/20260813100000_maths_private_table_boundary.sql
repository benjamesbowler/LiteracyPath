-- Keep every Maths persistence table RPC-only. This migration also asserts the
-- effective anonymous and authenticated privileges so a hosted drift cannot be
-- recorded as successfully repaired while either client role still inherits a
-- direct table grant.

begin;

revoke all privileges on table public.maths_evidence_events
  from public, anon, authenticated;
revoke all privileges on table public.maths_assignments
  from public, anon, authenticated;
revoke all privileges on table public.maths_assignment_students
  from public, anon, authenticated;
revoke all privileges on table public.maths_media_issue_reports
  from public, anon, authenticated;
revoke all privileges on table public.maths_evidence_sync_health
  from public, anon, authenticated;

do $maths_private_table_boundary$
declare
  table_name text;
  client_role text;
begin
  foreach table_name in array array[
    'maths_evidence_events',
    'maths_assignments',
    'maths_assignment_students',
    'maths_media_issue_reports',
    'maths_evidence_sync_health'
  ]
  loop
    foreach client_role in array array['anon', 'authenticated']
    loop
      if has_table_privilege(client_role, format('public.%I', table_name),
        'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
      then
        raise exception 'Maths table %.% remains directly accessible to %',
          'public', table_name, client_role;
      end if;
    end loop;
  end loop;
end
$maths_private_table_boundary$;

notify pgrst, 'reload schema';
commit;
