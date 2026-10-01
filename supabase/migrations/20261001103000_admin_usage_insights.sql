-- Admin-only app improvement exports. One capture statement freezes all source
-- rows; page requests read only that cache. Learner deletion invalidates the
-- snapshot and cascades its rows. Expiry denies access; physical purge is also
-- performed on create/open/release. A daily scheduler may call the purge RPC,
-- but this migration deliberately does not install an unapproved hosted job.
begin;

create table public.admin_usage_snapshots (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  invalidated boolean not null default false,
  filters jsonb not null,
  metadata jsonb not null default '{}'::jsonb
);
create table public.admin_usage_snapshot_rows (
  snapshot_id uuid not null references public.admin_usage_snapshots(id) on delete cascade,
  row_number bigint not null,
  student_id uuid not null references public.students(id) on delete cascade,
  source text not null,
  evidence jsonb not null,
  primary key (snapshot_id, row_number)
);
create index admin_usage_snapshot_rows_student_idx on public.admin_usage_snapshot_rows(student_id);
create index admin_usage_snapshot_expiry_idx on public.admin_usage_snapshots(expires_at);
create table public.admin_usage_export_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  snapshot_ref uuid not null,
  event text not null check (event in ('created', 'download_requested', 'released', 'expired')),
  occurred_at timestamptz not null default now(),
  detail jsonb not null
);
alter table public.admin_usage_snapshots enable row level security;
alter table public.admin_usage_snapshot_rows enable row level security;
alter table public.admin_usage_export_audit enable row level security;
revoke all on table public.admin_usage_snapshots, public.admin_usage_snapshot_rows,
  public.admin_usage_export_audit from public, anon, authenticated;

-- Conservative recursive projection: identifiers are export-specific aliases;
-- credentials, names, contact details, device IDs and free-text staff notes are
-- omitted. Exact learner names found in arbitrary retained text are redacted.
-- Pseudonymous evidence remains sensitive and is not called anonymous.
create function public.usage_export_project(p_value jsonb, p_salt text, p_names text[] default '{}')
returns jsonb language plpgsql immutable set search_path = public, extensions as $$
declare v_result jsonb; v_key text; v_value jsonb; v_text text; v_match text[]; v_name text;
begin
  if p_value is null then return null; end if;
  if jsonb_typeof(p_value) = 'object' then
    v_result := '{}'::jsonb;
    for v_key, v_value in select key, value from jsonb_each(p_value) loop
      -- This dedicated machine enum is safe to retain; arbitrary staff/child
      -- free-text reasons remain excluded by the conservative rule below.
      if v_key = 'interactionReason' then
        if jsonb_typeof(v_value) = 'string' and v_value #>> '{}' in
          ('answer_locked','answer_pending','images_pending','images_loading','pictures_loading',
           'media_unavailable','media_pending','feedback_pending','paused') then
          v_result := v_result || jsonb_build_object(v_key,v_value);
        end if;
        continue;
      end if;
      if regexp_replace(lower(v_key), '[^a-z]', '', 'g') ~
        '(name|email|token|password|credential|device|address|phone|birth|note|comment|reason|guardian|contact|ipaddress|url|filename)' then continue; end if;
      if v_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        v_key := 'ref-' || substr(encode(digest(p_salt || v_key, 'sha256'), 'hex'), 1, 24);
      end if;
      if regexp_replace(lower(v_key), '[^a-z]', '', 'g') in ('clienteventid','answereventid','responseid') and jsonb_typeof(v_value) = 'string' then
        v_value := to_jsonb('ref-' || substr(encode(digest(p_salt || lower(v_value #>> '{}'), 'sha256'), 'hex'), 1, 24));
      else
        v_value := public.usage_export_project(v_value, p_salt, p_names);
      end if;
      v_result := v_result || jsonb_build_object(v_key, v_value);
    end loop;
    return v_result;
  elsif jsonb_typeof(p_value) = 'array' then
    select coalesce(jsonb_agg(public.usage_export_project(value, p_salt, p_names) order by ordinal), '[]'::jsonb)
      into v_result from jsonb_array_elements(p_value) with ordinality a(value, ordinal);
    return v_result;
  elsif jsonb_typeof(p_value) = 'string' then
    v_text := p_value #>> '{}';
    for v_match in select regexp_matches(v_text, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', 'g') loop
      v_text := replace(v_text, v_match[1], 'ref-' || substr(encode(digest(p_salt || lower(v_match[1]), 'sha256'), 'hex'), 1, 24));
    end loop;
    foreach v_name in array p_names loop
      if length(v_name) >= 2 then v_text := regexp_replace(v_text, regexp_replace(v_name, $rx$(\W)$rx$, $rx$\\\1$rx$, 'g'), '[learner]', 'gi'); elsif v_text = v_name then v_text := '[learner]'; end if;
    end loop;
    -- Unstructured contact information is never a learning stimulus.
    if v_text ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' then return to_jsonb('[contact omitted]'::text); end if;
    return to_jsonb(v_text);
  end if;
  return p_value;
end;
$$;
revoke all on function public.usage_export_project(jsonb, text, text[]) from public, anon, authenticated;

create function public.invalidate_learner_usage_snapshots()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.admin_usage_snapshots set invalidated = true
    where id in (select snapshot_id from public.admin_usage_snapshot_rows where student_id = old.id);
  return old;
end;
$$;
revoke all on function public.invalidate_learner_usage_snapshots() from public, anon, authenticated;
create trigger students_invalidate_usage_export before delete on public.students
  for each row execute function public.invalidate_learner_usage_snapshots();

create function public.admin_purge_usage_snapshots()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count bigint;
begin
  if auth.uid() is null or not coalesce(public.is_app_admin(auth.uid()), false) then
    raise exception using errcode = '42501', message = 'Application administrator required';
  end if;
  insert into public.admin_usage_export_audit(actor_id, snapshot_ref, event, detail)
    select auth.uid(), id, 'expired', jsonb_build_object('schemaVersion', 1)
    from public.admin_usage_snapshots where expires_at <= now() or invalidated;
  delete from public.admin_usage_snapshots where expires_at <= now() or invalidated;
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok', true, 'purged', v_count);
end;
$$;

create function public.admin_create_usage_snapshot(
  p_from timestamptz, p_to timestamptz, p_school_id uuid default null
)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid; v_sources jsonb := '[]'::jsonb; v_sql text := ''; v_union text := '';
  v_table text; v_time text; v_optional boolean; v_total bigint; v_counts jsonb;
  v_now timestamptz := now(); v_filters jsonb; v_metadata jsonb;
begin
  if auth.uid() is null or not coalesce(public.is_app_admin(auth.uid()), false) then
    raise exception using errcode = '42501', message = 'Application administrator required';
  end if;
  if p_from is null or p_to is null or p_to <= p_from or p_to > now() + interval '1 day' then
    raise exception using errcode = '22023', message = 'A valid from/to date range is required';
  end if;
  if p_school_id is not null and not exists(select 1 from public.schools where id = p_school_id) then
    raise exception using errcode = '22023', message = 'Unknown school';
  end if;
  perform public.admin_purge_usage_snapshots();
  v_filters := jsonb_build_object('from', p_from, 'toExclusive', p_to,
    'schoolRef', case when p_school_id is null then null else 'selected_school' end);
  insert into public.admin_usage_snapshots(actor_id, filters) values(auth.uid(), v_filters) returning id into v_id;
  -- Minimal current cohort context includes learners with no cloud evidence,
  -- so an empty event stream cannot silently become zero enrolled learners.
  v_sources := jsonb_build_array(jsonb_build_object('source','learner_context','available',true));
  v_union := 'select s.id student_id, ''learner_context'' source, now() observed_at,
    jsonb_build_object(''created_at'',to_jsonb(s)->''created_at'',''archived_at'',to_jsonb(s)->''archived_at'') evidence,
    s.class_id,c.school_id from public.students s join public.classes c on c.id=s.class_id
    where ($3 is null or c.school_id=$3) and (to_jsonb(s)->>''created_at'' is null or (to_jsonb(s)->>''created_at'')::timestamptz < $2)';
  -- The registry declares every usage/evidence source and any unavailable optional
  -- source. A later source must be added here, never silently read from the browser.
  for v_table, v_time, v_optional in select * from (values
    ('learn_activity', 'coalesce(r.occurred_at, r.created_at)', false),
    ('answers', 'r.answered_at', false),
    ('assessment_attempts', 'r.completed_at', false),
    ('student_progress', 'r.updated_at', false),
    ('mastery', 'r.updated_at', false),
    ('item_mastery', 'r.updated_at', false),
    ('activity_sync_health', 'r.observed_at', false),
    ('student_focus_cycle_practice_attempts', 'r.completed_at', true),
    ('student_focus_session_members', 'r.updated_at', true),
    ('reading_session_presence', 'r.last_seen_at', true),
    ('student_sessions', 'r.created_at', true)
  ) registry(source, observed_time, optional) loop
    if to_regclass('public.' || v_table) is null then
      if not v_optional then raise exception 'Required usage source unavailable: %', v_table; end if;
      v_sources := v_sources || jsonb_build_array(jsonb_build_object('source', v_table, 'available', false, 'rows', null));
      continue;
    end if;
    v_sources := v_sources || jsonb_build_array(jsonb_build_object('source', v_table, 'available', true));
    v_union := v_union || case when v_union = '' then '' else ' union all ' end || format(
      'select s.id student_id, %L source, %s observed_at, to_jsonb(r) evidence,
        s.class_id, c.school_id from public.%I r join public.students s on r.student_id::text = s.id::text
        join public.classes c on c.id = s.class_id where ($3 is null or c.school_id = $3)
        and %s >= $1 and %s < $2', v_table, v_time, v_table, v_time, v_time);
  end loop;
  -- All source SELECTs share one PostgreSQL statement snapshot. Later writes,
  -- resets or progress updates never change the cached evidence.
  v_sql := 'with raw as (' || v_union || '), names as (
      select coalesce(array_agg(distinct name), array[]::text[]) value from public.students
    ), captured as (
      select row_number() over (order by source, observed_at, student_id, evidence::text) n,
        student_id, source, jsonb_build_object(''source'', source, ''observedAt'', observed_at,
          ''learnerRef'', ''learner-'' || substr(encode(digest($4::text || student_id::text, ''sha256''), ''hex''),1,24),
          ''classRef'', ''class-'' || substr(encode(digest($4::text || class_id::text, ''sha256''), ''hex''),1,24),
          ''schoolRef'', case when school_id is null then null else ''school-'' || substr(encode(digest($4::text || school_id::text,''sha256''),''hex''),1,24) end,
          ''data'', public.usage_export_project(evidence - ''student_id'' - ''teacher_id'' - ''class_id'' - ''device_id'', $4::text, names.value)) evidence
      from raw cross join names
    ) insert into public.admin_usage_snapshot_rows(snapshot_id, row_number, student_id, source, evidence)
      select $4, n, student_id, source, evidence from captured';
  execute v_sql using p_from, p_to, p_school_id, v_id;
  get diagnostics v_total = row_count;
  select coalesce(jsonb_object_agg(source, n), '{}'::jsonb) into v_counts
    from (select source, count(*) n from public.admin_usage_snapshot_rows where snapshot_id = v_id group by source) counted;
  select coalesce(jsonb_agg(value || jsonb_build_object('rows', case when (value->>'available')::boolean
    then coalesce((v_counts->>(value->>'source'))::bigint, 0) else null end)), '[]'::jsonb)
    into v_sources from jsonb_array_elements(v_sources);
  v_metadata := jsonb_build_object('schemaVersion', 1, 'collectionVersion', 2, 'snapshotId', v_id,
    'capturedAt', v_now, 'expiresAt', v_now + interval '30 minutes', 'filters', v_filters,
    'rowCount', v_total, 'sources', v_sources, 'privacy', 'export-specific pseudonyms; names, credentials, device IDs and staff notes omitted',
    'rangeSemantics', 'Events and completed attempts by observation time; progress/mastery/sync are latest mutable records updated within the window, not historical reconstructions',
    'excludedSources', jsonb_build_array('learner profile names/credentials', 'teacher/family free-text reports', 'unlinked/orphan legacy records', 'anonymous preview/local-only unsynced usage'),
    'retention', 'Access expires in 30 minutes. Rows purge on release and next admin open/create/purge; scheduled physical purge requires deployment configuration.');
  update public.admin_usage_snapshots set metadata = v_metadata where id = v_id;
  insert into public.admin_usage_export_audit(actor_id, snapshot_ref, event, detail)
    values(auth.uid(), v_id, 'created', jsonb_build_object('schemaVersion',1,'filters',v_filters,'rowCount',v_total,'sourceCounts',v_counts));
  return v_metadata || jsonb_build_object('ok', true);
end;
$$;

create function public.admin_read_usage_snapshot(p_snapshot_id uuid, p_after bigint default 0, p_limit integer default 500)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_snapshot public.admin_usage_snapshots; v_rows jsonb; v_last bigint; v_total bigint;
begin
  if auth.uid() is null or not coalesce(public.is_app_admin(auth.uid()), false) then
    raise exception using errcode = '42501', message = 'Application administrator required';
  end if;
  if p_snapshot_id is null or p_after is null or p_after < 0 or p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception using errcode = '22023', message = 'Invalid snapshot page';
  end if;
  select * into v_snapshot from public.admin_usage_snapshots where id = p_snapshot_id and actor_id = auth.uid() for share;
  if not found or v_snapshot.expires_at <= now() or v_snapshot.invalidated then
    raise exception using errcode = '22023', message = 'Snapshot expired, released, unavailable, or invalidated by learner deletion. Generate again.';
  end if;
  select count(*) into v_total from public.admin_usage_snapshot_rows where snapshot_id = p_snapshot_id;
  if v_total <> (v_snapshot.metadata->>'rowCount')::bigint then
    raise exception using errcode = '22023', message = 'Snapshot evidence changed by privacy deletion. Generate again.';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('rowNumber',row_number,'evidence',evidence) order by row_number), '[]'::jsonb), max(row_number)
    into v_rows, v_last from (select row_number,evidence from public.admin_usage_snapshot_rows
      where snapshot_id = p_snapshot_id and row_number > p_after order by row_number limit p_limit) page;
  return jsonb_build_object('ok', true, 'snapshotId', p_snapshot_id, 'rows', v_rows,
    'nextAfter', coalesce(v_last,p_after), 'complete', coalesce(v_last,p_after) >= v_total, 'rowCount', v_total);
end;
$$;

create function public.admin_release_usage_snapshot(p_snapshot_id uuid, p_download_requested boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_snapshot public.admin_usage_snapshots;
begin
  if auth.uid() is null or not coalesce(public.is_app_admin(auth.uid()), false) then
    raise exception using errcode = '42501', message = 'Application administrator required';
  end if;
  select * into v_snapshot from public.admin_usage_snapshots where id = p_snapshot_id and actor_id = auth.uid() for update;
  if not found then return jsonb_build_object('ok',true,'released',false); end if;
  if p_download_requested and (v_snapshot.invalidated or v_snapshot.expires_at <= now()) then
    raise exception using errcode = '22023', message = 'Snapshot no longer valid for download. Generate again.';
  end if;
  insert into public.admin_usage_export_audit(actor_id,snapshot_ref,event,detail)
    values(auth.uid(),p_snapshot_id,case when p_download_requested then 'download_requested' else 'released' end,
      jsonb_build_object('schemaVersion',1,'rowCount',v_snapshot.metadata->'rowCount'));
  delete from public.admin_usage_snapshots where id = p_snapshot_id;
  return jsonb_build_object('ok',true,'released',true);
end;
$$;

revoke all on function public.admin_create_usage_snapshot(timestamptz,timestamptz,uuid),
  public.admin_read_usage_snapshot(uuid,bigint,integer), public.admin_release_usage_snapshot(uuid,boolean),
  public.admin_purge_usage_snapshots() from public, anon, authenticated;
grant execute on function public.admin_create_usage_snapshot(timestamptz,timestamptz,uuid),
  public.admin_read_usage_snapshot(uuid,bigint,integer), public.admin_release_usage_snapshot(uuid,boolean),
  public.admin_purge_usage_snapshots() to authenticated;
commit;
