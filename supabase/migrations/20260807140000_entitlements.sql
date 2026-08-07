-- What an account is allowed to do.
--
-- WHY. The application has exactly one access gate — is this teacher approved —
-- and it is binary. There is no way to express "this account gets some of it".
-- An anonymous try-mode and a family tier both need that sentence, and neither
-- can be built on a binary gate.
--
-- THIS CHANGES NOTHING FOR ANY EXISTING ACCOUNT. Every current account is a
-- school teacher, and both the table default and the client resolver land on
-- the 'school' plan, which allows everything. The layer ships first and is
-- proved under no user pressure; the free tier later is a different plan_id
-- rather than a refactor.
--
-- A CLIENT-ONLY LIMIT IS A MARKETING BANNER. The table lives here so the
-- database can enforce plan limits itself once there is a plan that withholds
-- something. Nothing reads it for enforcement yet — that arrives with the tier
-- it gates — but the shape and the boundary are set now rather than retrofitted
-- around a live paying customer.

begin;

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),

  -- Deliberately NOT a foreign key to auth.users. A family account and a
  -- teacher account are different row types, and the anonymous try-mode has no
  -- account at all. Constraining this column to one of them now would have to
  -- be undone twice.
  account_id uuid not null,
  account_type text not null default 'teacher',

  plan_id text not null default 'school',

  -- Which slice of the content. Named rather than enumerated so the manifest
  -- can change without a migration.
  content_scope_id text not null default 'full',

  -- Null means no limit. Zero means none at all, which is the try-mode.
  learner_slots integer,

  -- Per-account overrides on top of the plan. Empty is the normal case; this is
  -- for the one school that negotiated something, not for routine variation.
  features jsonb not null default '{}'::jsonb,

  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  source text not null default 'signup',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entitlements_account_type_check
    check (account_type in ('teacher', 'family', 'anonymous')),
  constraint entitlements_plan_check
    check (plan_id in ('school', 'demo_try', 'family_free', 'family_paid')),
  constraint entitlements_content_scope_check
    check (content_scope_id in ('full', 'sample')),
  constraint entitlements_learner_slots_check
    check (learner_slots is null or learner_slots >= 0),
  constraint entitlements_dates_check
    check (ends_at is null or ends_at > starts_at),

  -- One live entitlement per account. Superseding a plan means updating the
  -- row or ending it, not stacking a second one nobody notices.
  constraint entitlements_one_per_account unique (account_id, account_type)
);

comment on table public.entitlements is
  'What an account may do. Absent row = the school plan, which allows everything — deliberate while every account is a school teacher, and must flip to the smallest plan when the family tier ships.';
comment on column public.entitlements.features is
  'Per-account overrides on top of the plan. Empty is normal; this is for a negotiated exception, not routine variation.';
comment on column public.entitlements.learner_slots is
  'Null = no limit. 0 = none, which is the anonymous try-mode.';

create index if not exists entitlements_account_idx
  on public.entitlements (account_id, account_type);

alter table public.entitlements enable row level security;
revoke all on public.entitlements from public, anon, authenticated;
grant select on public.entitlements to authenticated;

-- An account may READ its own entitlement and nothing else. Writes are an
-- administrator action or a purchase, never something the holder does to
-- themselves — so no insert, update or delete policy exists at all, and the
-- grant above is select-only.
drop policy if exists entitlements_read_own on public.entitlements;
create policy entitlements_read_own
  on public.entitlements
  for select
  to authenticated
  using (
    account_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

-- No backfill.
--
-- Every existing account resolves to the school plan through the absent-row
-- default, so writing a row per account would create thousands of rows that say
-- exactly what their absence already says. The first rows written here will be
-- the ones that actually withhold something.

commit;
