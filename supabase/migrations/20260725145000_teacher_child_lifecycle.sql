-- Give teachers one explicit, audited boundary for archiving and restoring a
-- child. The column reconciliation keeps older managed installations safe to
-- upgrade before the frontend begins using this RPC.

alter table public.students
  add column if not exists archived_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.teacher_set_student_archived(
  p_student_id uuid,
  p_class_id uuid,
  p_archived boolean
)
returns table (id uuid)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_owner_id uuid;
begin
  if v_actor_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required.';
  end if;

  select c.teacher_id
    into v_owner_id
  from public.students s
  join public.classes c
    on c.id = s.class_id
   and c.teacher_id = s.teacher_id
  where s.id = p_student_id
    and s.class_id = p_class_id;

  if v_owner_id is null then
    raise exception using
      errcode = 'P0002',
      message = 'The child was not found in this class.';
  end if;

  if v_owner_id is distinct from v_actor_id
     and not public.is_app_admin(v_actor_id)
  then
    raise exception using
      errcode = '42501',
      message = 'You do not have permission to change this child.';
  end if;

  return query
  update public.students s
     set archived_at = case when p_archived then now() else null end,
         updated_at = now()
   where s.id = p_student_id
     and s.class_id = p_class_id
  returning s.id;
end;
$$;

comment on function public.teacher_set_student_archived(uuid, uuid, boolean) is
  'Archives or restores one child after verifying teacher ownership of the class.';

revoke all on function public.teacher_set_student_archived(uuid, uuid, boolean)
  from public, anon;
grant execute on function public.teacher_set_student_archived(uuid, uuid, boolean)
  to authenticated;
