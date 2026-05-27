# Admin Account Management And Password Reset Notes

## What Changed

- New teacher signups can create in-app pending account notifications for the owner/admin.
- Admin Dashboard now shows a New Teacher Signups panel with approve, reject, disable, and mark-reviewed controls.
- Pending/rejected/disabled teacher accounts are blocked from teacher tools once the `pending_teacher_accounts` table is enabled.
- Teachers can only delete students and classes that are loaded under their own `teacher_id`.
- Password reset uses Supabase Auth reset emails and password recovery links.

## Supabase Table Required For Full Approval Control

Create this table before relying on approval gating for new accounts:

```sql
create table if not exists public.pending_teacher_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'disabled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

alter table public.pending_teacher_accounts enable row level security;
```

Suggested RLS policy shape:

```sql
create policy "Users can create their own pending account"
on public.pending_teacher_accounts
for insert
with check (auth.uid() = user_id);

create policy "Users can read their own pending account"
on public.pending_teacher_accounts
for select
using (auth.uid() = user_id);

create policy "Admins can manage pending teacher accounts"
on public.pending_teacher_accounts
for all
using (
  exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.app_admins
    where app_admins.user_id = auth.uid()
  )
);
```

The frontend intentionally uses only the Supabase anon client. Do not add service-role keys to the app bundle.

## Current Admin Safety Behavior

- The existing app owner/admin remains approved through `app_admins`.
- If `pending_teacher_accounts` is not present yet, existing non-admin accounts fall back to `legacy_approved` so the live app is not accidentally locked out during rollout.
- Once the table exists and a signup row is created, `pending`, `rejected`, and `disabled` users are blocked before teacher tools load.

## Future Email Notification

The current implementation adds an in-app Admin Dashboard notification. A future Supabase Edge Function can send owner email notifications on insert into `pending_teacher_accounts`. That Edge Function may use service-role credentials server-side only.

## Password Reset

The login screen exposes Forgot password. It calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })`. When Supabase returns a password recovery session, the app shows the reset password form and calls `supabase.auth.updateUser({ password })`.
