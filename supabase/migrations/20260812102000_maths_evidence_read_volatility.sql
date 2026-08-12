-- The read RPC executes the approved-teacher guard, which is deliberately
-- volatile. Match that volatility so PostgreSQL does not treat the guarded
-- read as stable during planning.

begin;

alter function public.teacher_read_maths_evidence(uuid, uuid, integer)
  volatile;

notify pgrst, 'reload schema';

commit;
