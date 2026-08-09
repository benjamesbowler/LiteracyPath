begin;

do $$
declare
  merged jsonb;
begin
  merged := public.lp_merge_transfer_missions(
    '{"schemaVersion":1,"completed":[],"evidence":[],"offers":[],"active":{"missionId":"m1","updatedAt":"2026-08-09T01:00:00Z"}}',
    '{"schemaVersion":1,"completed":["m1"],"evidence":[{"missionId":"m1","contentVersion":"v1"}],"offers":[],"active":null}'
  );
  if jsonb_typeof(merged -> 'active') <> 'null' then raise exception 'completed transfer active state was resurrected'; end if;

  merged := public.lp_merge_reading_passport(
    '{"reflections":{"book-a":{"reflectionId":"learn","updatedAt":"2026-08-09T02:00:00Z"}}}',
    '{"reflections":{"book-a":{"reflectionId":"laugh","updatedAt":"2026-08-09T01:00:00Z"},"book-b":{"reflectionId":"again","updatedAt":"2026-08-09T03:00:00Z"}}}'
  );
  if merged #>> '{reflections,book-a,reflectionId}' <> 'learn' then raise exception 'newer passport reflection was lost'; end if;
  if merged #>> '{reflections,book-b,reflectionId}' <> 'again' then raise exception 'new passport reflection was omitted'; end if;
end;
$$;

rollback;
