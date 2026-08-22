begin;

-- Lean-release retirement: remove every callable backend entry point for
-- Class Quest Live, Paper-to-Progress, and Class Decodable Press. Historical
-- rows remain intact so learner exports and verified erasure can still include
-- data created before retirement.
drop function if exists public.student_get_live_lesson(text, integer, boolean);
drop function if exists public.student_submit_live_response(text, uuid, text, jsonb, text);
drop function if exists public.teacher_start_live_lesson(uuid, uuid[], text, text, jsonb, text);
drop function if exists public.teacher_set_live_lesson_slide(uuid, integer, text);
drop function if exists public.teacher_get_live_lesson_snapshot(uuid);
drop function if exists public.teacher_get_active_live_lesson();
drop function if exists public.teacher_end_live_lesson(uuid);

drop function if exists public.teacher_create_worksheet_instance(uuid, uuid[], jsonb);
drop function if exists public.teacher_resolve_worksheet_code(text);
drop function if exists public.teacher_record_worksheet_observation(uuid, text, jsonb, text, uuid);
drop function if exists public.teacher_read_worksheet_history(uuid);
drop function if exists public.teacher_close_worksheet_instance(uuid);

drop function if exists public.teacher_create_press_project(uuid, uuid[], jsonb);
drop function if exists public.student_list_press_projects(text);
drop function if exists public.student_save_book_revision(text, uuid, uuid, text, jsonb, jsonb);
drop function if exists public.student_submit_book_revision(text, uuid, uuid);
drop function if exists public.teacher_list_press_work(uuid);
drop function if exists public.teacher_review_book_revision(uuid, uuid, text, jsonb);
drop function if exists public.student_read_class_press_library(text);

revoke all on table
  public.live_lesson_sessions,
  public.live_lesson_participants,
  public.live_lesson_presence,
  public.live_lesson_responses,
  public.worksheet_instances,
  public.worksheet_instance_students,
  public.worksheet_observation_batches,
  public.worksheet_observation_marks,
  public.student_book_projects,
  public.student_book_project_learners,
  public.student_books,
  public.student_book_revisions,
  public.student_book_reviews
from public, anon, authenticated;

-- Retired progress remains exportable and erasable, but it is no longer
-- returned to learner devices or accepted from old browser builds.
create or replace function public.student_get_progress(p_token text)
returns table (area text, key text, payload jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    raise exception 'invalid_session';
  end if;
  return query
    select sp.area, sp.key, sp.payload, sp.updated_at
    from public.student_progress sp
    where sp.student_id = v_student.id
      and sp.area not in ('reading_passport', 'cooperative_story_quest');
end;
$$;

create or replace function public.student_save_progress(
  p_token text, p_area text, p_key text, p_payload jsonb
)
returns json
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_student public.students;
begin
  v_student := public.student_from_token(p_token);
  if v_student.id is null then
    return json_build_object('ok', false, 'error', 'invalid_session');
  end if;
  if p_area is null or p_key is null or p_payload is null then
    return json_build_object('ok', false, 'error', 'invalid_payload');
  end if;
  if p_area not in (
    'story_quests', 'phonics_letters', 'cvc', 'learn_games', 'el_quest',
    'daily_mission', 'profile', 'guided_reading', 'hollow', 'phonics_quest',
    'transfer_missions'
  ) then
    return json_build_object('ok', false, 'error', 'progress_area_retired');
  end if;

  insert into public.student_progress (student_id, area, key, payload, updated_at)
  values (v_student.id, p_area, p_key, p_payload, now())
  on conflict (student_id, area, key)
  do update set payload = excluded.payload, updated_at = now();

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.student_get_progress(text) from public, anon, authenticated;
revoke all on function public.student_save_progress(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.student_get_progress(text) to anon, authenticated;
grant execute on function public.student_save_progress(text, text, text, jsonb) to anon, authenticated;

create or replace function public.lp_reject_retired_progress_area()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.area in ('reading_passport', 'cooperative_story_quest') then
    raise exception 'progress_area_retired';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_retired_progress_area on public.student_progress;
create trigger reject_retired_progress_area
before insert or update on public.student_progress
for each row execute function public.lp_reject_retired_progress_area();

create or replace function public.lp_forward_merge_progress(p_area text, p_existing jsonb, p_incoming jsonb)
returns jsonb language sql immutable as $$
  select case
    when p_area = 'daily_mission' then public.lp_merge_daily_mission(p_existing, p_incoming)
    when p_area = 'profile' then p_incoming
    when p_area = 'phonics_quest' then public.lp_merge_phonics_quest(p_existing, p_incoming)
    when p_area = 'hollow' then public.lp_merge_hollow(p_existing, p_incoming)
    when p_area = 'transfer_missions' then public.lp_merge_transfer_missions(p_existing, p_incoming)
    else public.lp_jsonb_forward_merge(p_existing, p_incoming)
  end;
$$;

revoke all on function public.lp_merge_reading_passport(jsonb, jsonb) from public, anon, authenticated;
drop function if exists public.lp_merge_reading_passport(jsonb, jsonb);

notify pgrst, 'reload schema';

commit;
