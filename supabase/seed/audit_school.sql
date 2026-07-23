-- Deterministic, non-production audit school.
--
-- This file is applied only through tools/seedAuditSchool.mjs, which replaces
-- the password and anchor placeholders and refuses unapproved remote targets.
-- It is intentionally not named supabase/seed.sql, so a normal database reset
-- cannot create audit accounts by accident.

begin;

create or replace function pg_temp.audit_uuid(seed text)
returns uuid
language sql
immutable
as $$
  select (
    substr(md5(seed), 1, 8) || '-' ||
    substr(md5(seed), 9, 4) || '-' ||
    substr(md5(seed), 13, 4) || '-' ||
    substr(md5(seed), 17, 4) || '-' ||
    substr(md5(seed), 21, 12)
  )::uuid;
$$;

-- Fixed IDs make reset and cross-test references deterministic.
-- Password and anchor are replaced in memory by seedAuditSchool.mjs.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  email_change_confirm_status,
  is_sso_user,
  is_anonymous
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'audit-teacher-a@literacypath.invalid',
    crypt('__AUDIT_PASSWORD__', gen_salt('bf')),
    '__AUDIT_ANCHOR__'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Audit Teacher A","audit_only":true}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    false,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'audit-teacher-b@literacypath.invalid',
    crypt('__AUDIT_PASSWORD__', gen_salt('bf')),
    '__AUDIT_ANCHOR__'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Audit Teacher B","audit_only":true}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    false,
    false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '12000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'audit-admin@literacypath.invalid',
    crypt('__AUDIT_PASSWORD__', gen_salt('bf')),
    '__AUDIT_ANCHOR__'::timestamptz,
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Audit Admin","audit_only":true}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    0,
    false,
    false
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_token_current = excluded.email_change_token_current,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token,
  updated_at = excluded.updated_at;

delete from auth.identities
where user_id in (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '12000000-0000-4000-8000-000000000001'
);

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '11000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '{"sub":"10000000-0000-4000-8000-000000000001","email":"audit-teacher-a@literacypath.invalid"}'::jsonb,
    'email',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    '11000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '{"sub":"10000000-0000-4000-8000-000000000002","email":"audit-teacher-b@literacypath.invalid"}'::jsonb,
    'email',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    '12100000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    '{"sub":"12000000-0000-4000-8000-000000000001","email":"audit-admin@literacypath.invalid"}'::jsonb,
    'email',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  );

insert into public.schools (id, name, created_at)
values (
  '20000000-0000-4000-8000-000000000001',
  '[AUDIT ONLY] LiteracyPath Seed School',
  '__AUDIT_ANCHOR__'::timestamptz
)
on conflict (id) do update set name = excluded.name;

insert into public.pending_teacher_accounts (
  id,
  user_id,
  email,
  username,
  display_name,
  name,
  role,
  status,
  approval_status,
  requested_at,
  approved_at,
  created_at,
  updated_at,
  school_id
)
values
  (
    '21000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'audit-teacher-a@literacypath.invalid',
    'audit_teacher_a',
    'Audit Teacher A',
    'Audit Teacher A',
    'teacher',
    'approved',
    'approved',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '20000000-0000-4000-8000-000000000001'
  ),
  (
    '21000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'audit-teacher-b@literacypath.invalid',
    'audit_teacher_b',
    'Audit Teacher B',
    'Audit Teacher B',
    'teacher',
    'approved',
    'approved',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz,
    '20000000-0000-4000-8000-000000000001'
  )
on conflict (user_id) do update set
  role = excluded.role,
  status = excluded.status,
  approval_status = excluded.approval_status,
  approved_at = excluded.approved_at,
  school_id = excluded.school_id,
  updated_at = excluded.updated_at;

insert into public.app_admins (id, user_id, email, created_at)
values (
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  'audit-admin@literacypath.invalid',
  '__AUDIT_ANCHOR__'::timestamptz
)
on conflict (user_id) do update set
  email = excluded.email;

insert into public.classes (
  id,
  teacher_id,
  school_id,
  name,
  access_code,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Audit Class A',
    'QA7M2K',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'Audit Class B',
    'QA8N3P',
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  )
on conflict (id) do update set
  teacher_id = excluded.teacher_id,
  school_id = excluded.school_id,
  name = excluded.name,
  access_code = excluded.access_code,
  updated_at = excluded.updated_at;

delete from public.students
where id::text like '40000000-0000-4000-8000-%';

insert into public.students (
  id,
  class_id,
  teacher_id,
  name,
  symbol_password,
  password_set_at,
  password_updated_by,
  archived_at,
  created_at,
  updated_at
)
values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Aarav','111','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Aisha','112','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Amara','113','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Bao','114','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Camila','115','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Diego','116','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Elena','117','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000008','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Farah','118','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000009','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Hana','119','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000010','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Ibrahim','121','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Jun','122','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000012','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Kai','123','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000013','30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Lina','124','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000001','__AUDIT_ANCHOR__','__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000014','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Mateo','125','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000015','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Mei','126','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000016','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Noah','127','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000017','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Omar','128','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000018','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Priya','129','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000019','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Ravi','131','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000020','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Sofia','132','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000021','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Tariq','133','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000022','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Uma','134','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000023','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Valentina','135','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000024','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Wei','136','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000025','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Yara','137','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__'),
  ('40000000-0000-4000-8000-000000000026','30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Zuri','138','__AUDIT_ANCHOR__','10000000-0000-4000-8000-000000000002',null,'__AUDIT_ANCHOR__','__AUDIT_ANCHOR__');

insert into public.answers (
  id,
  student_id,
  teacher_id,
  skill,
  stage,
  diagnostic_target,
  question,
  chosen_answer,
  correct_answer,
  is_correct,
  answered_at
)
select
  pg_temp.audit_uuid('answer:' || s.id || ':' || series.answer_number),
  s.id,
  s.teacher_id,
  case series.answer_number % 3
    when 0 then 'Initial Sounds'
    when 1 then 'Final Sounds'
    else 'CVC Short Vowels'
  end,
  case series.answer_number % 3
    when 0 then 'Initial Sounds'
    when 1 then 'Final Sounds'
    else 'CVC Short Vowels'
  end,
  case series.answer_number % 3 when 0 then '/m/' when 1 then '/t/' else 'short a' end,
  'Audit question ' || series.answer_number,
  case
    when s.id = '40000000-0000-4000-8000-000000000002'::uuid and series.answer_number % 3 <> 0 then 'incorrect'
    else 'correct'
  end,
  'correct',
  case
    when s.id = '40000000-0000-4000-8000-000000000001'::uuid then series.answer_number % 10 <> 0
    when s.id = '40000000-0000-4000-8000-000000000002'::uuid then series.answer_number % 3 = 0
    else (series.answer_number + substring(s.id::text, 36, 1)::integer) % 4 <> 0
  end,
  '__AUDIT_ANCHOR__'::timestamptz - make_interval(hours => 30 - series.answer_number)
from public.students s
cross join lateral generate_series(
  1,
  case
    when s.id = '40000000-0000-4000-8000-000000000003'::uuid then 1
    when s.id = '40000000-0000-4000-8000-000000000004'::uuid then 0
    when s.id in (
      '40000000-0000-4000-8000-000000000001'::uuid,
      '40000000-0000-4000-8000-000000000002'::uuid
    ) then 20
    else 12
  end
) as series(answer_number);

insert into public.mastery (
  id,
  student_id,
  teacher_id,
  skill_id,
  skill_label,
  mastered,
  attempts,
  last_score,
  last_total,
  updated_at
)
select
  pg_temp.audit_uuid('mastery:' || s.id || ':' || skill.skill_id),
  s.id,
  s.teacher_id,
  skill.skill_id,
  skill.skill_label,
  case
    when s.id = '40000000-0000-4000-8000-000000000001'::uuid then true
    when s.id = '40000000-0000-4000-8000-000000000002'::uuid then false
    else skill.skill_number <= (substring(s.id::text, 36, 1)::integer % 3)
  end,
  case when s.id = '40000000-0000-4000-8000-000000000003'::uuid then 1 else 4 end,
  case when s.id = '40000000-0000-4000-8000-000000000002'::uuid then 5 else 12 end,
  15,
  '__AUDIT_ANCHOR__'::timestamptz
from public.students s
cross join (
  values
    (1, 'initial_sounds', 'Initial Sounds'),
    (2, 'final_sounds', 'Final Sounds'),
    (3, 'cvc_short_vowels', 'CVC Short Vowels')
) as skill(skill_number, skill_id, skill_label)
where s.id <> '40000000-0000-4000-8000-000000000004'::uuid;

insert into public.student_progress (
  id,
  student_id,
  area,
  key,
  payload,
  updated_at
)
select
  pg_temp.audit_uuid('quest:' || s.id),
  s.id,
  'phonics_quest',
  '__all__',
  jsonb_build_object(
    'v', 1,
    'trail', jsonb_build_object(
      'stopsDone', to_jsonb(array['s1','s2','s3']),
      'stars', jsonb_build_object('s1', 3, 's2', 2, 's3', 2),
      'drops', '{}'::jsonb,
      'routeCursor', 4
    ),
    'mastery', jsonb_build_object(
      'm', jsonb_build_object(
        'seen', case when s.id = '40000000-0000-4000-8000-000000000002'::uuid then 12 else 10 end,
        'correct', case when s.id = '40000000-0000-4000-8000-000000000002'::uuid then 4 else 9 end,
        'state', case when s.id = '40000000-0000-4000-8000-000000000002'::uuid then 'at-risk' else 'mastered' end,
        'window', to_jsonb(array[1,1,1,0,1,1,1,1,1,1]),
        'shells', to_jsonb(array['stones','bridge']),
        'sessions', to_jsonb(array['audit-day-1','audit-day-2'])
      )
    ),
    'stones', to_jsonb(array['m']),
    'settings', jsonb_build_object('reducedMotion', false, 'soundEnabled', true)
  ),
  '__AUDIT_ANCHOR__'::timestamptz
from public.students s
where s.archived_at is null
on conflict (student_id, area, key) do update set
  payload = excluded.payload,
  updated_at = excluded.updated_at;

insert into public.student_progress (
  id,
  student_id,
  area,
  key,
  payload,
  updated_at
)
select
  pg_temp.audit_uuid('guided:' || s.id),
  s.id,
  'guided_reading',
  'moonwood-tales-book-01',
  jsonb_build_object(
    'v', 1,
    'bookId', 'moonwood-tales-book-01',
    'title', 'One Night in the Deep Dark',
    'level', 'C',
    'completed', (substring(s.id::text, 36, 1)::integer % 2 = 0),
    'lastPage', 12,
    'quizScore', 4,
    'quizTotal', 5,
    'lastReadAt', '__AUDIT_ANCHOR__'
  ),
  '__AUDIT_ANCHOR__'::timestamptz
from public.students s
where s.archived_at is null
on conflict (student_id, area, key) do update set
  payload = excluded.payload,
  updated_at = excluded.updated_at;

insert into public.learn_activity (
  id,
  student_id,
  class_id,
  teacher_id,
  area,
  item_id,
  event,
  payload,
  created_at
)
select
  pg_temp.audit_uuid('activity:' || s.id),
  s.id,
  s.class_id,
  s.teacher_id,
  'daily_mission',
  'audit-mission',
  'completed_step',
  jsonb_build_object('step', substring(s.id::text, 36, 1)::integer % 3),
  '__AUDIT_ANCHOR__'::timestamptz
from public.students s
where s.archived_at is null;

-- A 520-attempt history proves report pagination and complete exports.
insert into public.assessment_attempts (
  attempt_id,
  student_id,
  class_id,
  teacher_id,
  assessment_type,
  skill_id,
  skill_name,
  skill_level,
  skill_phase,
  started_at,
  completed_at,
  total_questions,
  correct_count,
  accuracy,
  status,
  administration_status,
  schema_version,
  payload,
  created_at,
  updated_at
)
select
  'audit-long-history-' || lpad(series.attempt_number::text, 4, '0'),
  '40000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'skill_checkpoint',
  case series.attempt_number % 3 when 0 then 'initial_sounds' when 1 then 'final_sounds' else 'cvc_short_vowels' end,
  case series.attempt_number % 3 when 0 then 'Initial Sounds' when 1 then 'Final Sounds' else 'CVC Short Vowels' end,
  1,
  1,
  '__AUDIT_ANCHOR__'::timestamptz - make_interval(days => series.attempt_number),
  '__AUDIT_ANCHOR__'::timestamptz - make_interval(days => series.attempt_number) + interval '10 minutes',
  15,
  13,
  86.67,
  'passed',
  'completed',
  1,
  jsonb_build_object(
    'attemptId', 'audit-long-history-' || lpad(series.attempt_number::text, 4, '0'),
    'studentId', '40000000-0000-4000-8000-000000000001',
    'classId', '30000000-0000-4000-8000-000000000001',
    'teacherId', '10000000-0000-4000-8000-000000000001',
    'policyVersion', 'audit-seed-v1',
    'questionRecords', jsonb_build_array(jsonb_build_object(
      'questionId', 'audit-item-' || series.attempt_number,
      'itemType', 'audit_item',
      'itemKey', 'audit-item-' || series.attempt_number,
      'responseStatus', 'correct',
      'isCorrect', true
    ))
  ),
  '__AUDIT_ANCHOR__'::timestamptz,
  '__AUDIT_ANCHOR__'::timestamptz
from generate_series(1, 520) as series(attempt_number)
on conflict (attempt_id) do update set
  payload = excluded.payload,
  updated_at = excluded.updated_at;

insert into public.assessment_attempts (
  attempt_id,
  student_id,
  class_id,
  teacher_id,
  assessment_type,
  skill_id,
  skill_name,
  skill_level,
  skill_phase,
  started_at,
  completed_at,
  total_questions,
  correct_count,
  accuracy,
  status,
  administration_status,
  schema_version,
  payload,
  created_at,
  updated_at
)
values
  (
    'audit-el-boy-completed',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'el_phonological_awareness',
    'el_phonological_awareness',
    'EL Benchmark Phonological Awareness',
    1,
    1,
    '__AUDIT_ANCHOR__'::timestamptz - interval '120 days',
    '__AUDIT_ANCHOR__'::timestamptz - interval '120 days' + interval '20 minutes',
    10,
    8,
    80,
    'passed',
    'completed',
    1,
    '{"gradePath":"1","benchmarkWindow":"BOY","policyVersion":"audit-seed-v1"}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    'audit-el-moy-in-progress',
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'el_decoding',
    'el_decoding',
    'EL Benchmark Decoding',
    1,
    2,
    '__AUDIT_ANCHOR__'::timestamptz - interval '1 day',
    '__AUDIT_ANCHOR__'::timestamptz - interval '1 day',
    10,
    3,
    30,
    'in_progress',
    'in_progress',
    1,
    '{"gradePath":"1","benchmarkWindow":"MOY","policyVersion":"audit-seed-v1"}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    'audit-el-boy-needs-support',
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'el_encoding',
    'el_encoding',
    'EL Benchmark Encoding',
    1,
    1,
    '__AUDIT_ANCHOR__'::timestamptz - interval '120 days',
    '__AUDIT_ANCHOR__'::timestamptz - interval '120 days' + interval '20 minutes',
    8,
    3,
    37.5,
    'needs_retry',
    'completed',
    1,
    '{"gradePath":"1","benchmarkWindow":"BOY","policyVersion":"audit-seed-v1"}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  ),
  (
    'audit-el-moy-completed',
    '40000000-0000-4000-8000-000000000014',
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'el_oral_reading_fluency',
    'el_oral_reading_fluency',
    'EL Benchmark Oral Reading Fluency',
    1,
    2,
    '__AUDIT_ANCHOR__'::timestamptz - interval '2 days',
    '__AUDIT_ANCHOR__'::timestamptz - interval '2 days' + interval '15 minutes',
    1,
    1,
    100,
    'passed',
    'completed',
    1,
    '{"gradePath":"1","benchmarkWindow":"MOY","policyVersion":"audit-seed-v1"}'::jsonb,
    '__AUDIT_ANCHOR__'::timestamptz,
    '__AUDIT_ANCHOR__'::timestamptz
  )
on conflict (attempt_id) do update set
  status = excluded.status,
  administration_status = excluded.administration_status,
  payload = excluded.payload,
  updated_at = excluded.updated_at;

insert into public.el_assessment_reports (
  report_id,
  report_type,
  class_id,
  student_id,
  teacher_id,
  generated_at,
  file_name,
  summary,
  payload,
  schema_version,
  created_at,
  updated_at
)
values (
  'audit-el-class-report-boy',
  'whole_class',
  '30000000-0000-4000-8000-000000000001',
  null,
  '10000000-0000-4000-8000-000000000001',
  '__AUDIT_ANCHOR__'::timestamptz,
  'audit-class-a-boy-formal-report.xlsx',
  '{"gradePath":"1","benchmarkWindow":"BOY","studentCount":13,"totalAssessments":2}'::jsonb,
  '{"reportId":"audit-el-class-report-boy","reportType":"whole_class","classId":"30000000-0000-4000-8000-000000000001","teacherId":"10000000-0000-4000-8000-000000000001","generatedAt":"__AUDIT_ANCHOR__","fileName":"audit-class-a-boy-formal-report.xlsx","benchmarkScope":{"grade":"1","benchmarkWindow":"BOY","label":"Grade 1 · BOY"},"summary":{"gradePath":"1","benchmarkWindow":"BOY","studentCount":13,"totalAssessments":2},"policyVersion":"audit-seed-v1"}'::jsonb,
  1,
  '__AUDIT_ANCHOR__'::timestamptz,
  '__AUDIT_ANCHOR__'::timestamptz
)
on conflict (report_id) do update set
  summary = excluded.summary,
  payload = excluded.payload,
  updated_at = excluded.updated_at;

do $$
declare
  learner_count integer;
  class_count integer;
  teacher_count integer;
  admin_count integer;
  long_history_count integer;
  long_history_item_count integer;
  archived_count integer;
  guided_count integer;
  quest_count integer;
  completed_el_count integer;
  in_progress_el_count integer;
begin
  select count(*) into learner_count
  from public.students
  where id::text like '40000000-0000-4000-8000-%';

  select count(*) into class_count
  from public.classes
  where id in (
    '30000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000002'
  );

  select count(*) into teacher_count
  from auth.users
  where id in (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002'
  );

  select count(*) into admin_count
  from public.app_admins
  where user_id = '12000000-0000-4000-8000-000000000001';

  select count(*) into long_history_count
  from public.assessment_attempts
  where attempt_id like 'audit-long-history-%';

  select coalesce(sum(jsonb_array_length(payload -> 'questionRecords')), 0) into long_history_item_count
  from public.assessment_attempts
  where attempt_id like 'audit-long-history-%';

  select count(*) into archived_count
  from public.students
  where id::text like '40000000-0000-4000-8000-%'
    and archived_at is not null;

  select count(*) into guided_count
  from public.student_progress
  where area = 'guided_reading'
    and student_id::text like '40000000-0000-4000-8000-%';

  select count(*) into quest_count
  from public.student_progress
  where area = 'phonics_quest'
    and student_id::text like '40000000-0000-4000-8000-%';

  select count(*) into completed_el_count
  from public.assessment_attempts
  where attempt_id like 'audit-el-%'
    and administration_status = 'completed';

  select count(*) into in_progress_el_count
  from public.assessment_attempts
  where attempt_id like 'audit-el-%'
    and administration_status = 'in_progress';

  if teacher_count <> 2
     or admin_count <> 1
     or class_count <> 2
     or learner_count <> 26
     or long_history_count <> 520
     or long_history_item_count <> 520
     or archived_count <> 1
     or guided_count <> 25
     or quest_count <> 25
     or completed_el_count < 3
     or in_progress_el_count < 1 then
    raise exception
      'audit_seed_verification_failed teachers=% admins=% classes=% learners=% long_history=% long_history_items=% archived=% guided=% quest=% el_complete=% el_in_progress=%',
      teacher_count,
      admin_count,
      class_count,
      learner_count,
      long_history_count,
      long_history_item_count,
      archived_count,
      guided_count,
      quest_count,
      completed_el_count,
      in_progress_el_count;
  end if;
end;
$$;

commit;
