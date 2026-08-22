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
end;
$$;

rollback;
