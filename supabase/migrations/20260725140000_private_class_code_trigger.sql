-- Keep class access-code generation private while allowing normal teacher
-- inserts to fire the automatic-code trigger.
--
-- The security-definer boundary correctly revokes direct browser execution of
-- gen_class_access_code(). The trigger previously ran as the inserting teacher,
-- however, so its internal helper call inherited that revocation and every new
-- class insert failed. Run the trigger as its fixed owner instead; direct API
-- callers still cannot execute either internal function.

create or replace function public.set_class_access_code()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.access_code is null then
    new.access_code := public.gen_class_access_code();
  end if;
  return new;
end;
$$;

revoke execute on function public.set_class_access_code()
  from public, anon, authenticated;
revoke execute on function public.gen_class_access_code()
  from public, anon, authenticated;
