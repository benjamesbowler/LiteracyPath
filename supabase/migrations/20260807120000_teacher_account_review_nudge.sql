-- A waiting teacher can say "I am still waiting", and the administrator can see it.
--
-- WHY. A teacher who signs up sees a wall — "an administrator must approve your
-- account" — with one Sign out button. No timeframe, no way to check, no way
-- back. Meanwhile nothing anywhere tells the administrator a request exists:
-- there is no mail, no webhook, no realtime subscription in this repository, so
-- the queue is discovered only by remembering to open the admin dashboard.
--
-- Manual approval was kept deliberately rather than moving to domain-anchored
-- auto-approval, which makes that discovery problem the load-bearing one. This
-- migration adds the cheapest half of the fix that needs a database change: the
-- person actually affected can raise their hand, and their request sorts to the
-- top of the queue.
--
-- NO NEW FUNCTION, deliberately. The existing row-level security policy "Users
-- can update their own pending signup profile" already lets a pending user
-- write their own row, and enforce_teacher_account_audit_integrity guards the
-- decision columns and not these. So this is a plain ALTER — no SECURITY
-- DEFINER, and therefore no boundary migration behind it.

begin;

alter table public.pending_teacher_accounts
  add column if not exists nudged_at timestamptz;

alter table public.pending_teacher_accounts
  add column if not exists nudge_count integer not null default 0;

comment on column public.pending_teacher_accounts.nudged_at is
  'When the applicant last said they are still waiting. Sorts their request to the top of the review queue. Set by the applicant, never a decision field.';
comment on column public.pending_teacher_accounts.nudge_count is
  'How many times they have asked. A rising number on an old request is the clearest signal in the queue that someone has been left waiting.';

-- The admin queue reads pending rows ordered by age, and the table has no index
-- on the status columns at all — the dashboard pages the whole table and filters
-- in JavaScript. This is the one index that makes the queue query cheap, and it
-- is partial so it stays small however many approved accounts accumulate.
create index if not exists pending_teacher_accounts_waiting_idx
  on public.pending_teacher_accounts (requested_at desc)
  where lower(coalesce(approval_status, status, '')) = 'pending';

commit;
