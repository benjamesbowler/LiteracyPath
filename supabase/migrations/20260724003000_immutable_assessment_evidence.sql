-- Preserve the exact result and the versions that governed it.
--
-- The relational version columns make provenance queryable. raw_evidence is
-- an immutable replay envelope containing the complete stored result, so a
-- later content, form, or policy deployment cannot rewrite history.

alter table public.assessment_attempts
  add column if not exists evidence_schema_version integer not null default 1,
  add column if not exists assessment_version text not null default 'legacy_unspecified',
  add column if not exists content_version text not null default 'legacy_unspecified',
  add column if not exists policy_version text not null default 'legacy_unspecified',
  add column if not exists raw_evidence jsonb not null default '{}'::jsonb;

update public.assessment_attempts
set
  evidence_schema_version = 1,
  assessment_version = coalesce(
    nullif(btrim(payload ->> 'assessmentVersion'), ''),
    nullif(btrim(payload ->> 'formVersion'), ''),
    nullif(btrim(assessment_type), '') || '-schema-' || schema_version::text,
    'legacy_unspecified'
  ),
  content_version = coalesce(
    nullif(btrim(payload ->> 'contentVersion'), ''),
    'content-' || md5(coalesce(payload -> 'questionRecords', '[]'::jsonb)::text)
  ),
  policy_version = coalesce(
    nullif(btrim(payload ->> 'policyVersion'), ''),
    nullif(btrim(payload ->> 'scoringRuleVersion'), ''),
    nullif(btrim(payload ->> 'scoringVersion'), ''),
    'legacy-unspecified-' || coalesce(nullif(btrim(assessment_type), ''), 'assessment')
      || '-schema-' || schema_version::text
  )
where raw_evidence = '{}'::jsonb;

update public.assessment_attempts
set raw_evidence = jsonb_build_object(
  'schemaVersion', evidence_schema_version,
  'attemptId', attempt_id,
  'capturedAt', completed_at,
  'assessmentVersion', assessment_version,
  'contentVersion', content_version,
  'policyVersion', policy_version,
  'result', payload
)
where raw_evidence = '{}'::jsonb;

alter table public.assessment_attempts
  drop constraint if exists assessment_attempts_evidence_schema_check;
alter table public.assessment_attempts
  add constraint assessment_attempts_evidence_schema_check check (
    evidence_schema_version = 1
    and char_length(btrim(assessment_version)) between 1 and 160
    and char_length(btrim(content_version)) between 1 and 160
    and char_length(btrim(policy_version)) between 1 and 160
    and jsonb_typeof(raw_evidence) = 'object'
  );

create index if not exists assessment_attempts_versions_idx
  on public.assessment_attempts (
    teacher_id,
    assessment_type,
    assessment_version,
    content_version,
    policy_version
  );

create or replace function public.validate_immutable_assessment_evidence()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.raw_evidence = '{}'::jsonb then
    new.evidence_schema_version := 1;
    if new.assessment_version = 'legacy_unspecified' then
      new.assessment_version := coalesce(
        nullif(btrim(new.payload ->> 'assessmentVersion'), ''),
        nullif(btrim(new.payload ->> 'formVersion'), ''),
        nullif(btrim(new.assessment_type), '') || '-schema-' || new.schema_version::text,
        'legacy_unspecified'
      );
    end if;
    if new.content_version = 'legacy_unspecified' then
      new.content_version := coalesce(
        nullif(btrim(new.payload ->> 'contentVersion'), ''),
        'content-' || md5(coalesce(new.payload -> 'questionRecords', '[]'::jsonb)::text)
      );
    end if;
    if new.policy_version = 'legacy_unspecified' then
      new.policy_version := coalesce(
        nullif(btrim(new.payload ->> 'policyVersion'), ''),
        nullif(btrim(new.payload ->> 'scoringRuleVersion'), ''),
        nullif(btrim(new.payload ->> 'scoringVersion'), ''),
        'legacy-unspecified-' || coalesce(
          nullif(btrim(new.assessment_type), ''),
          'assessment'
        ) || '-schema-' || new.schema_version::text
      );
    end if;
    new.raw_evidence := jsonb_build_object(
      'schemaVersion', new.evidence_schema_version,
      'attemptId', new.attempt_id,
      'capturedAt', new.completed_at,
      'assessmentVersion', new.assessment_version,
      'contentVersion', new.content_version,
      'policyVersion', new.policy_version,
      'result', new.payload
    );
  end if;

  if new.evidence_schema_version <> 1
    or char_length(btrim(new.assessment_version)) not between 1 and 160
    or char_length(btrim(new.content_version)) not between 1 and 160
    or char_length(btrim(new.policy_version)) not between 1 and 160
    or jsonb_typeof(new.raw_evidence) <> 'object'
    or not (
      new.raw_evidence ?& array[
        'schemaVersion',
        'attemptId',
        'capturedAt',
        'assessmentVersion',
        'contentVersion',
        'policyVersion',
        'result'
      ]
    )
    or jsonb_typeof(new.raw_evidence -> 'schemaVersion') <> 'number'
    or jsonb_typeof(new.raw_evidence -> 'attemptId') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'capturedAt') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'assessmentVersion') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'contentVersion') <> 'string'
    or jsonb_typeof(new.raw_evidence -> 'policyVersion') <> 'string'
    or new.raw_evidence ->> 'attemptId' <> new.attempt_id
    or new.raw_evidence ->> 'assessmentVersion' <> new.assessment_version
    or new.raw_evidence ->> 'contentVersion' <> new.content_version
    or new.raw_evidence ->> 'policyVersion' <> new.policy_version
    or jsonb_typeof(new.raw_evidence -> 'result') <> 'object'
    or new.raw_evidence -> 'result' <> new.payload
    or octet_length(new.raw_evidence::text) > 5000000
  then
    raise exception 'Assessment evidence archive does not match its stored result and versions';
  end if;

  if (new.raw_evidence ->> 'schemaVersion')::numeric
    <> new.evidence_schema_version
    or (new.raw_evidence ->> 'capturedAt')::timestamptz <> new.completed_at
  then
    raise exception 'Assessment evidence archive does not match its stored result and versions';
  end if;

  if tg_op = 'UPDATE'
    and old.administration_status in (
      'completed',
      'discontinued',
      'not_administered',
      'not_scorable'
    )
    and (
      to_jsonb(new) - array['created_at', 'updated_at']
      <> to_jsonb(old) - array['created_at', 'updated_at']
    )
  then
    raise exception 'Completed assessment evidence is immutable';
  end if;

  return new;
end;
$$;

drop trigger if exists assessment_attempts_evidence_immutable
  on public.assessment_attempts;
create trigger assessment_attempts_evidence_immutable
  before insert or update on public.assessment_attempts
  for each row execute function public.validate_immutable_assessment_evidence();

comment on column public.assessment_attempts.assessment_version is
  'Version of the assessment/form definition used for this result.';
comment on column public.assessment_attempts.content_version is
  'Version or content fingerprint of the administered items.';
comment on column public.assessment_attempts.policy_version is
  'Version of the scoring, routing, or mastery policy used for this result.';
comment on column public.assessment_attempts.raw_evidence is
  'Immutable replay envelope containing the complete result and its provenance.';
