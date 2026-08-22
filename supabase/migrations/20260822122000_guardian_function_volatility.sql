-- The approved-teacher assertion is intentionally VOLATILE because it checks
-- current account state. Match that contract on the family-access inventory
-- RPC that invokes it so PostgreSQL does not make unsafe stability assumptions.

begin;

alter function public.teacher_list_guardian_access(uuid) volatile;

notify pgrst, 'reload schema';

commit;
