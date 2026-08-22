-- School-linked guardian portal.
--
-- The school remains the controller for the learner record. A guardian auth
-- account receives no learner access by itself: it must consume a current,
-- single-use invitation for the same confirmed email address. The browser uses
-- only the reviewed RPC surface below; direct table privileges remain revoked.

begin;

create extension if not exists pgcrypto;

create table if not exists public.guardian_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 320),
  display_name text not null check (btrim(display_name) <> '' and char_length(display_name) <= 80),
  preferred_language text not null default 'en'
    check (preferred_language in ('en', 'es', 'zh-Hans')),
  report_notifications boolean not null default false,
  legal_terms_version text not null,
  privacy_notice_version text not null,
  legal_accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guardian_legal_acceptance_events (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid references auth.users(id) on delete set null,
  email text not null,
  terms_version text not null,
  privacy_notice_version text not null,
  acceptance_source text not null check (acceptance_source = 'guardian_invite'),
  accepted_at timestamptz not null default now()
);

create table if not exists public.guardian_invites (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  guardian_email text not null
    check (guardian_email = lower(btrim(guardian_email)) and char_length(guardian_email) between 3 and 320),
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint guardian_invites_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  constraint guardian_invites_lifecycle_check check (
    (accepted_at is null and accepted_by is null)
    or (accepted_at is not null and accepted_by is not null)
  ),
  constraint guardian_invites_revocation_check check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  ),
  constraint guardian_invites_expiry_check check (expires_at > created_at)
);

create unique index if not exists guardian_invites_one_active_email_student_idx
  on public.guardian_invites (student_id, guardian_email)
  where accepted_at is null and revoked_at is null;

create index if not exists guardian_invites_token_hash_idx
  on public.guardian_invites (token_hash)
  where accepted_at is null and revoked_at is null;

create table if not exists public.guardian_learner_links (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  invite_id uuid not null references public.guardian_invites(id) on delete restrict,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  constraint guardian_learner_links_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  constraint guardian_learner_links_revocation_check check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  )
);

create unique index if not exists guardian_learner_links_one_active_idx
  on public.guardian_learner_links (guardian_user_id, student_id)
  where revoked_at is null;

create index if not exists guardian_learner_links_guardian_idx
  on public.guardian_learner_links (guardian_user_id, created_at desc)
  where revoked_at is null;

create table if not exists public.family_report_releases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (btrim(title) <> '' and char_length(title) <= 120),
  schema_version integer not null default 1 check (schema_version = 1),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  released_by uuid not null references auth.users(id) on delete restrict,
  released_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  withdrawn_by uuid references auth.users(id) on delete set null,
  constraint family_report_releases_student_teacher_fk
    foreign key (student_id, teacher_id)
    references public.students(id, teacher_id)
    on delete cascade,
  constraint family_report_releases_withdrawal_check check (
    (withdrawn_at is null and withdrawn_by is null)
    or (withdrawn_at is not null and withdrawn_by is not null)
  )
);

create index if not exists family_report_releases_guardian_lookup_idx
  on public.family_report_releases (student_id, released_at desc)
  where withdrawn_at is null;

create table if not exists public.guardian_access_audit (
  id uuid primary key default gen_random_uuid(),
  guardian_user_id uuid references auth.users(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete set null,
  school_id uuid references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  invite_id uuid references public.guardian_invites(id) on delete cascade,
  report_id uuid references public.family_report_releases(id) on delete cascade,
  event_type text not null check (event_type in (
    'invite_created',
    'invite_cancelled',
    'invite_accepted',
    'access_revoked',
    'report_released',
    'report_withdrawn',
    'report_viewed',
    'report_printed',
    'preferences_updated'
  )),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null default now()
);

create index if not exists guardian_access_audit_student_idx
  on public.guardian_access_audit (student_id, occurred_at desc);
create index if not exists guardian_access_audit_guardian_idx
  on public.guardian_access_audit (guardian_user_id, occurred_at desc);

alter table public.guardian_profiles enable row level security;
alter table public.guardian_legal_acceptance_events enable row level security;
alter table public.guardian_invites enable row level security;
alter table public.guardian_learner_links enable row level security;
alter table public.family_report_releases enable row level security;
alter table public.guardian_access_audit enable row level security;

revoke all on table
  public.guardian_profiles,
  public.guardian_legal_acceptance_events,
  public.guardian_invites,
  public.guardian_learner_links,
  public.family_report_releases,
  public.guardian_access_audit
from public, anon, authenticated;

-- Defence-in-depth policies remain correct even if a later reviewed migration
-- grants a narrow direct read. The current portal still uses RPCs only.
drop policy if exists guardian_profiles_self_read on public.guardian_profiles;
create policy guardian_profiles_self_read
  on public.guardian_profiles for select to authenticated
  using (user_id = auth.uid());

drop policy if exists guardian_links_self_read on public.guardian_learner_links;
create policy guardian_links_self_read
  on public.guardian_learner_links for select to authenticated
  using (guardian_user_id = auth.uid() and revoked_at is null);

drop policy if exists guardian_reports_linked_read on public.family_report_releases;
create policy guardian_reports_linked_read
  on public.family_report_releases for select to authenticated
  using (
    withdrawn_at is null
    and exists (
      select 1
      from public.guardian_learner_links link
      where link.guardian_user_id = auth.uid()
        and link.student_id = family_report_releases.student_id
        and link.school_id = family_report_releases.school_id
        and link.revoked_at is null
    )
  );

create or replace function public.guardian_family_snapshot_is_valid(
  p_snapshot jsonb,
  p_student_id uuid
)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_text text := lower(coalesce(p_snapshot::text, ''));
  v_key text;
begin
  if jsonb_typeof(p_snapshot) <> 'object'
     or p_snapshot ->> 'schemaVersion' <> '1'
     or p_snapshot #>> '{learner,id}' <> p_student_id::text
     or jsonb_typeof(p_snapshot -> 'learner') <> 'object'
     or jsonb_typeof(p_snapshot -> 'strengths') <> 'array'
     or jsonb_typeof(p_snapshot -> 'canDo') <> 'array'
     or jsonb_typeof(p_snapshot -> 'nextFocus') <> 'array'
     or jsonb_typeof(p_snapshot -> 'progress') <> 'array'
     or jsonb_typeof(p_snapshot #> '{atHome,activities}') <> 'array'
     or jsonb_array_length(p_snapshot -> 'strengths') > 4
     or jsonb_array_length(p_snapshot -> 'canDo') > 4
     or jsonb_array_length(p_snapshot -> 'nextFocus') > 3
     or jsonb_array_length(p_snapshot -> 'progress') > 6
     or jsonb_array_length(p_snapshot #> '{atHome,activities}') > 5
     or octet_length(p_snapshot::text) > 65536
     or p_snapshot ? 'reports'
  then
    return false;
  end if;

  for v_key in select jsonb_object_keys(p_snapshot)
  loop
    if v_key not in (
      'schemaVersion', 'learner', 'updatedLabel', 'highlight', 'strengths',
      'canDo', 'nextFocus', 'meaning', 'progress', 'atHome',
      'recentReading', 'contact'
    ) then
      return false;
    end if;
  end loop;

  if v_text ~ '\m(accuracy|benchmark|class rank|denominator|mastery|percentile|phoneme|raw score)\M'
     or v_text ~ '[£$€¥]'
  then
    return false;
  end if;

  return true;
end;
$$;

revoke all on function public.guardian_family_snapshot_is_valid(jsonb, uuid)
  from public, anon, authenticated;

create or replace function public.current_actor_has_guardian_access(p_student_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.guardian_profiles profile
      join public.guardian_learner_links link
        on link.guardian_user_id = profile.user_id
      join public.students student
        on student.id = link.student_id
       and student.teacher_id = link.teacher_id
      join public.classes class
        on class.id = student.class_id
       and class.school_id = link.school_id
      where profile.user_id = auth.uid()
        and link.student_id = p_student_id
        and link.revoked_at is null
        and student.archived_at is null
    );
$$;

revoke all on function public.current_actor_has_guardian_access(uuid)
  from public, anon, authenticated;

create or replace function public.guardian_invite_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_invite public.guardian_invites;
  v_school_name text;
begin
  if coalesce(p_token, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_invitation');
  end if;

  select invite.*
  into v_invite
  from public.guardian_invites invite
  where invite.token_hash = digest(p_token, 'sha256')
    and invite.accepted_at is null
    and invite.revoked_at is null
    and invite.expires_at > now()
  limit 1;

  if v_invite.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_invitation');
  end if;

  select school.name into v_school_name
  from public.schools school
  where school.id = v_invite.school_id;

  return jsonb_build_object(
    'ok', true,
    'school_name', v_school_name,
    'expires_at', v_invite.expires_at
  );
end;
$$;

revoke all on function public.guardian_invite_preview(text)
  from public, anon, authenticated;

create or replace function public.guardian_accept_invite(
  p_token text,
  p_display_name text,
  p_terms_version text,
  p_privacy_version text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_email text;
  v_email_confirmed_at timestamptz;
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_invite public.guardian_invites;
  v_link_id uuid;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Sign in before accepting an invitation.';
  end if;

  select lower(email), email_confirmed_at
  into v_actor_email, v_email_confirmed_at
  from auth.users
  where id = v_actor_id;

  if v_email_confirmed_at is null then
    return jsonb_build_object('ok', false, 'error', 'email_not_confirmed');
  end if;

  if v_display_name = '' or char_length(v_display_name) > 80 then
    return jsonb_build_object('ok', false, 'error', 'display_name_required');
  end if;

  if p_terms_version <> '2026-08-22-uk-beta-v2'
     or p_privacy_version <> '2026-08-22-uk-v2'
  then
    return jsonb_build_object('ok', false, 'error', 'legal_version_outdated');
  end if;

  if coalesce(p_token, '') !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_invitation');
  end if;

  select * into v_invite
  from public.guardian_invites invite
  where invite.token_hash = digest(p_token, 'sha256')
    and invite.accepted_at is null
    and invite.revoked_at is null
    and invite.expires_at > now()
  for update;

  if v_invite.id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_invitation');
  end if;

  if v_actor_email is distinct from v_invite.guardian_email then
    return jsonb_build_object('ok', false, 'error', 'invitation_email_mismatch');
  end if;

  insert into public.guardian_profiles (
    user_id, email, display_name, legal_terms_version,
    privacy_notice_version, legal_accepted_at, updated_at
  ) values (
    v_actor_id, v_actor_email, v_display_name, p_terms_version,
    p_privacy_version, now(), now()
  )
  on conflict (user_id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    legal_terms_version = excluded.legal_terms_version,
    privacy_notice_version = excluded.privacy_notice_version,
    legal_accepted_at = excluded.legal_accepted_at,
    updated_at = now();

  insert into public.guardian_legal_acceptance_events (
    guardian_user_id, email, terms_version, privacy_notice_version,
    acceptance_source, accepted_at
  ) values (
    v_actor_id, v_actor_email, p_terms_version, p_privacy_version,
    'guardian_invite', now()
  );

  update public.guardian_learner_links
  set revoked_at = now(), revoked_by = v_actor_id
  where guardian_user_id = v_actor_id
    and student_id = v_invite.student_id
    and revoked_at is null;

  insert into public.guardian_learner_links (
    guardian_user_id, school_id, student_id, teacher_id, invite_id
  ) values (
    v_actor_id, v_invite.school_id, v_invite.student_id,
    v_invite.teacher_id, v_invite.id
  ) returning id into v_link_id;

  update public.guardian_invites
  set accepted_at = now(), accepted_by = v_actor_id
  where id = v_invite.id;

  insert into public.guardian_access_audit (
    guardian_user_id, teacher_id, school_id, student_id, invite_id,
    event_type, metadata
  ) values (
    v_actor_id, v_invite.teacher_id, v_invite.school_id,
    v_invite.student_id, v_invite.id, 'invite_accepted',
    jsonb_build_object('link_id', v_link_id)
  );

  return jsonb_build_object(
    'ok', true,
    'student_id', v_invite.student_id,
    'link_id', v_link_id
  );
end;
$$;

revoke all on function public.guardian_accept_invite(text, text, text, text)
  from public, anon, authenticated;

create or replace function public.guardian_get_portal()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_profile public.guardian_profiles;
  v_children jsonb;
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Guardian sign-in is required.';
  end if;

  select * into v_profile
  from public.guardian_profiles
  where user_id = v_actor_id;

  if v_profile.user_id is null then
    return jsonb_build_object('ok', false, 'error', 'guardian_profile_required');
  end if;

  select coalesce(jsonb_agg(child_row order by child_row -> 'learner' ->> 'name'), '[]'::jsonb)
  into v_children
  from (
    select jsonb_build_object(
      'learner', jsonb_build_object(
        'id', student.id,
        'name', student.name,
        'classLabel', class.name,
        'schoolName', school.name
      ),
      'latest_snapshot', (
        select report.snapshot
        from public.family_report_releases report
        where report.student_id = student.id
          and report.school_id = link.school_id
          and report.withdrawn_at is null
        order by report.released_at desc
        limit 1
      ),
      'reports', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', report.id,
          'title', report.title,
          'publishedAt', report.released_at,
          'publishedLabel', to_char(report.released_at at time zone 'UTC', 'FMDD FMMonth YYYY'),
          'summary', coalesce(report.snapshot ->> 'highlight', 'A family-ready reading update from school.'),
          'snapshot', report.snapshot
        ) order by report.released_at desc)
        from public.family_report_releases report
        where report.student_id = student.id
          and report.school_id = link.school_id
          and report.withdrawn_at is null
      ), '[]'::jsonb)
    ) as child_row
    from public.guardian_learner_links link
    join public.students student
      on student.id = link.student_id
     and student.teacher_id = link.teacher_id
     and student.archived_at is null
    join public.classes class
      on class.id = student.class_id
     and class.school_id = link.school_id
    join public.schools school on school.id = link.school_id
    where link.guardian_user_id = v_actor_id
      and link.revoked_at is null
  ) linked_children;

  return jsonb_build_object(
    'ok', true,
    'profile', jsonb_build_object(
      'user_id', v_profile.user_id,
      'email', v_profile.email,
      'display_name', v_profile.display_name,
      'preferred_language', v_profile.preferred_language,
      'report_notifications', v_profile.report_notifications
    ),
    'children', v_children
  );
end;
$$;

revoke all on function public.guardian_get_portal()
  from public, anon, authenticated;

create or replace function public.guardian_update_preferences(
  p_preferred_language text,
  p_report_notifications boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
begin
  if v_actor_id is null then
    raise exception using errcode = '42501', message = 'Guardian sign-in is required.';
  end if;
  if p_preferred_language not in ('en', 'es', 'zh-Hans') then
    return jsonb_build_object('ok', false, 'error', 'unsupported_language');
  end if;

  update public.guardian_profiles
  set preferred_language = p_preferred_language,
      report_notifications = coalesce(p_report_notifications, false),
      updated_at = now()
  where user_id = v_actor_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'guardian_profile_required');
  end if;

  insert into public.guardian_access_audit (
    guardian_user_id, event_type, metadata
  ) values (
    v_actor_id, 'preferences_updated',
    jsonb_build_object(
      'preferred_language', p_preferred_language,
      'report_notifications', coalesce(p_report_notifications, false)
    )
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.guardian_update_preferences(text, boolean)
  from public, anon, authenticated;

create or replace function public.guardian_record_report_event(
  p_report_id uuid,
  p_event_type text
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_report public.family_report_releases;
begin
  if p_event_type not in ('report_viewed', 'report_printed') then
    return jsonb_build_object('ok', false, 'error', 'invalid_event_type');
  end if;

  select * into v_report
  from public.family_report_releases report
  where report.id = p_report_id
    and report.withdrawn_at is null;

  if v_report.id is null
     or not public.current_actor_has_guardian_access(v_report.student_id)
  then
    raise exception using errcode = '42501', message = 'Guardian report access is required.';
  end if;

  insert into public.guardian_access_audit (
    guardian_user_id, teacher_id, school_id, student_id, report_id, event_type
  ) values (
    v_actor_id, v_report.teacher_id, v_report.school_id,
    v_report.student_id, v_report.id, p_event_type
  );

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.guardian_record_report_event(uuid, text)
  from public, anon, authenticated;

create or replace function public.teacher_create_guardian_invite(
  p_student_id uuid,
  p_guardian_email text,
  p_expires_days integer default 7
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  v_actor_id uuid := auth.uid();
  v_email text := lower(btrim(coalesce(p_guardian_email, '')));
  v_student public.students;
  v_school_id uuid;
  v_school_name text;
  v_token text;
  v_invite_id uuid;
  v_expires_at timestamptz;
begin
  perform public.assert_current_actor_teacher_access();

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     or char_length(v_email) > 320
  then
    return jsonb_build_object('ok', false, 'error', 'valid_guardian_email_required');
  end if;
  if p_expires_days is null or p_expires_days < 1 or p_expires_days > 30 then
    return jsonb_build_object('ok', false, 'error', 'invalid_expiry');
  end if;

  select student.*
  into v_student
  from public.students student
  where student.id = p_student_id
    and student.archived_at is null
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id));

  if v_student.id is null then
    raise exception using errcode = '42501', message = 'The learner is not available to this teacher.';
  end if;

  select class.school_id, school.name
  into v_school_id, v_school_name
  from public.classes class
  join public.schools school on school.id = class.school_id
  where class.id = v_student.class_id;

  if exists (
    select 1
    from public.guardian_profiles profile
    join public.guardian_learner_links link on link.guardian_user_id = profile.user_id
    where profile.email = v_email
      and link.student_id = p_student_id
      and link.revoked_at is null
  ) then
    return jsonb_build_object('ok', false, 'error', 'guardian_already_linked');
  end if;

  update public.guardian_invites
  set revoked_at = now(), revoked_by = v_actor_id
  where student_id = p_student_id
    and guardian_email = v_email
    and accepted_at is null
    and revoked_at is null;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + make_interval(days => p_expires_days);

  insert into public.guardian_invites (
    school_id, student_id, teacher_id, guardian_email,
    token_hash, expires_at
  ) values (
    v_school_id, v_student.id, v_student.teacher_id, v_email,
    digest(v_token, 'sha256'), v_expires_at
  ) returning id into v_invite_id;

  insert into public.guardian_access_audit (
    teacher_id, school_id, student_id, invite_id, event_type,
    metadata
  ) values (
    v_actor_id, v_school_id, v_student.id, v_invite_id, 'invite_created',
    jsonb_build_object('expires_at', v_expires_at)
  );

  return jsonb_build_object(
    'ok', true,
    'invite_id', v_invite_id,
    'token', v_token,
    'guardian_email', v_email,
    'expires_at', v_expires_at,
    'student_name', v_student.name,
    'school_name', v_school_name
  );
end;
$$;

revoke all on function public.teacher_create_guardian_invite(uuid, text, integer)
  from public, anon, authenticated;

create or replace function public.teacher_list_guardian_access(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_invites jsonb;
  v_links jsonb;
  v_reports jsonb;
begin
  perform public.assert_current_actor_teacher_access();

  select * into v_student
  from public.students student
  where student.id = p_student_id
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id));
  if v_student.id is null then
    raise exception using errcode = '42501', message = 'The learner is not available to this teacher.';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', invite.id,
    'guardian_email', invite.guardian_email,
    'expires_at', invite.expires_at,
    'created_at', invite.created_at
  ) order by invite.created_at desc), '[]'::jsonb)
  into v_invites
  from public.guardian_invites invite
  where invite.student_id = p_student_id
    and invite.accepted_at is null
    and invite.revoked_at is null
    and invite.expires_at > now();

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', link.id,
    'guardian_user_id', link.guardian_user_id,
    'guardian_email', profile.email,
    'display_name', profile.display_name,
    'created_at', link.created_at
  ) order by link.created_at desc), '[]'::jsonb)
  into v_links
  from public.guardian_learner_links link
  join public.guardian_profiles profile on profile.user_id = link.guardian_user_id
  where link.student_id = p_student_id
    and link.revoked_at is null;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', report.id,
    'title', report.title,
    'released_at', report.released_at
  ) order by report.released_at desc), '[]'::jsonb)
  into v_reports
  from public.family_report_releases report
  where report.student_id = p_student_id
    and report.withdrawn_at is null;

  return jsonb_build_object(
    'ok', true,
    'invites', v_invites,
    'links', v_links,
    'reports', v_reports
  );
end;
$$;

revoke all on function public.teacher_list_guardian_access(uuid)
  from public, anon, authenticated;

create or replace function public.teacher_cancel_guardian_invite(p_invite_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_invite public.guardian_invites;
begin
  perform public.assert_current_actor_teacher_access();

  select invite.* into v_invite
  from public.guardian_invites invite
  join public.students student on student.id = invite.student_id
  where invite.id = p_invite_id
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id))
  for update of invite;
  if v_invite.id is null then
    raise exception using errcode = '42501', message = 'The invitation is not available to this teacher.';
  end if;
  if v_invite.accepted_at is not null then
    return jsonb_build_object('ok', false, 'error', 'invitation_already_accepted');
  end if;

  update public.guardian_invites
  set revoked_at = coalesce(revoked_at, now()),
      revoked_by = coalesce(revoked_by, v_actor_id)
  where id = v_invite.id;

  insert into public.guardian_access_audit (
    teacher_id, school_id, student_id, invite_id, event_type
  ) values (
    v_actor_id, v_invite.school_id, v_invite.student_id,
    v_invite.id, 'invite_cancelled'
  );
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.teacher_cancel_guardian_invite(uuid)
  from public, anon, authenticated;

create or replace function public.teacher_revoke_guardian_access(
  p_student_id uuid,
  p_guardian_user_id uuid
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_school_id uuid;
begin
  perform public.assert_current_actor_teacher_access();

  select student.*
  into v_student
  from public.students student
  where student.id = p_student_id
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id));
  if v_student.id is null then
    raise exception using errcode = '42501', message = 'The learner is not available to this teacher.';
  end if;

  select class.school_id into v_school_id
  from public.classes class
  where class.id = v_student.class_id;

  update public.guardian_learner_links
  set revoked_at = now(), revoked_by = v_actor_id
  where student_id = p_student_id
    and guardian_user_id = p_guardian_user_id
    and revoked_at is null;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'active_link_not_found');
  end if;

  insert into public.guardian_access_audit (
    guardian_user_id, teacher_id, school_id, student_id, event_type
  ) values (
    p_guardian_user_id, v_actor_id, v_school_id,
    p_student_id, 'access_revoked'
  );
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.teacher_revoke_guardian_access(uuid, uuid)
  from public, anon, authenticated;

create or replace function public.teacher_release_family_report(
  p_student_id uuid,
  p_title text,
  p_snapshot jsonb
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_student public.students;
  v_school_id uuid;
  v_report_id uuid;
  v_released_at timestamptz;
begin
  perform public.assert_current_actor_teacher_access();

  select student.*
  into v_student
  from public.students student
  where student.id = p_student_id
    and student.archived_at is null
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id));
  if v_student.id is null then
    raise exception using errcode = '42501', message = 'The learner is not available to this teacher.';
  end if;

  select class.school_id into v_school_id
  from public.classes class
  where class.id = v_student.class_id;
  if btrim(coalesce(p_title, '')) = '' or char_length(btrim(p_title)) > 120 then
    return jsonb_build_object('ok', false, 'error', 'report_title_required');
  end if;
  if not public.guardian_family_snapshot_is_valid(p_snapshot, p_student_id) then
    return jsonb_build_object('ok', false, 'error', 'invalid_family_snapshot');
  end if;

  insert into public.family_report_releases (
    school_id, student_id, teacher_id, title, schema_version,
    snapshot, released_by, released_at
  ) values (
    v_school_id, v_student.id, v_student.teacher_id, btrim(p_title), 1,
    p_snapshot, v_actor_id, now()
  ) returning id, released_at into v_report_id, v_released_at;

  insert into public.guardian_access_audit (
    teacher_id, school_id, student_id, report_id, event_type
  ) values (
    v_actor_id, v_school_id, v_student.id, v_report_id, 'report_released'
  );

  return jsonb_build_object(
    'ok', true,
    'report_id', v_report_id,
    'released_at', v_released_at
  );
end;
$$;

revoke all on function public.teacher_release_family_report(uuid, text, jsonb)
  from public, anon, authenticated;

create or replace function public.teacher_withdraw_family_report(p_report_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_report public.family_report_releases;
begin
  perform public.assert_current_actor_teacher_access();

  select report.* into v_report
  from public.family_report_releases report
  join public.students student on student.id = report.student_id
  where report.id = p_report_id
    and (student.teacher_id = v_actor_id or public.is_app_admin(v_actor_id))
  for update of report;
  if v_report.id is null then
    raise exception using errcode = '42501', message = 'The report is not available to this teacher.';
  end if;

  update public.family_report_releases
  set withdrawn_at = coalesce(withdrawn_at, now()),
      withdrawn_by = coalesce(withdrawn_by, v_actor_id)
  where id = v_report.id;

  insert into public.guardian_access_audit (
    teacher_id, school_id, student_id, report_id, event_type
  ) values (
    v_actor_id, v_report.school_id, v_report.student_id,
    v_report.id, 'report_withdrawn'
  );
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.teacher_withdraw_family_report(uuid)
  from public, anon, authenticated;

-- Guardian signups must not enter the teacher approval queue. This does not
-- grant guardian access: the confirmed email still has to consume a matching
-- invitation through guardian_accept_invite().
create or replace function public.create_pending_teacher_account_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
  requested_display_name text;
  requested_school_name text;
  requested_school_id uuid;
  requested_terms_version text;
  requested_privacy_version text;
  requested_account_type text;
  accepted_legal boolean;
  audit_only boolean;
begin
  requested_account_type := lower(btrim(coalesce(new.raw_user_meta_data ->> 'account_type', 'teacher')));
  if requested_account_type = 'guardian' then
    return new;
  end if;

  audit_only := coalesce((new.raw_user_meta_data ->> 'audit_only')::boolean, false);
  requested_username := lower(nullif(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', ''),
    '[^a-zA-Z0-9_-]',
    '',
    'g'
  ), ''));
  requested_display_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    requested_username
  );
  requested_school_name := nullif(btrim(new.raw_user_meta_data ->> 'school_name'), '');
  requested_terms_version := nullif(btrim(new.raw_user_meta_data ->> 'legal_terms_version'), '');
  requested_privacy_version := nullif(btrim(new.raw_user_meta_data ->> 'privacy_notice_version'), '');
  accepted_legal := coalesce((new.raw_user_meta_data ->> 'legal_terms_accepted')::boolean, false);

  if not audit_only and (
    requested_username is null
    or requested_username !~ '^[a-z0-9_-]{3,30}$'
    or requested_display_name is null
    or char_length(requested_display_name) > 80
    or requested_school_name is null
    or not accepted_legal
    or requested_terms_version <> '2026-08-22-uk-beta-v2'
    or requested_privacy_version <> '2026-08-22-uk-v2'
  ) then
    raise exception 'invalid_teacher_signup_metadata';
  end if;

  if requested_username is not null and exists (
    select 1 from public.pending_teacher_accounts
    where lower(username) = requested_username
  ) then
    raise exception 'username_unavailable';
  end if;

  if requested_school_name is not null then
    select school.id into requested_school_id
    from public.create_school_directory_entry(requested_school_name) school;
  end if;

  insert into public.pending_teacher_accounts (
    user_id, email, username, display_name, name, role, status,
    approval_status, school_id, requested_at, created_at,
    legal_terms_version, privacy_notice_version, legal_accepted_at,
    legal_acceptance_source
  ) values (
    new.id,
    new.email,
    requested_username,
    requested_display_name,
    coalesce(requested_display_name, requested_username, split_part(new.email, '@', 1)),
    'pending',
    'pending',
    'pending',
    requested_school_id,
    now(),
    now(),
    case when accepted_legal then requested_terms_version end,
    case when accepted_legal then requested_privacy_version end,
    case when accepted_legal then now() end,
    case when accepted_legal then 'teacher_signup' end
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.create_pending_teacher_account_for_new_user()
  from public, anon, authenticated;

comment on table public.guardian_profiles is
  'Verified adult family accounts. A row does not grant learner access; guardian_learner_links is authoritative.';
comment on table public.guardian_invites is
  'School-created, single-use guardian invitations. Only a SHA-256 token digest is stored.';
comment on table public.guardian_learner_links is
  'Auditable and immediately revocable guardian-to-learner authority created from an accepted invitation.';
comment on table public.family_report_releases is
  'Immutable family-safe report snapshots explicitly released by school staff. Draft teacher data never appears here.';
comment on table public.guardian_access_audit is
  'Append-only security and release events for school-linked guardian access.';

notify pgrst, 'reload schema';

commit;
