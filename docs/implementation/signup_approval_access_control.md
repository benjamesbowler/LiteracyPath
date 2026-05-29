# Signup Approval Access Control

LiteracyPath must not treat a Supabase authenticated session as app access. A user can be signed in and still be blocked until an administrator approves the account.

## Required Tables

The app uses:

- `public.app_admins` to identify administrators.
- `public.pending_teacher_accounts` as the signup approval/profile table.

Apply the SQL in `docs/implementation/signup_approval_schema.sql` or the matching migration in `supabase/migrations/20260529000000_signup_approval_profiles.sql`.

## Approval Flow

1. A new user signs up with email, password, username, and optional display name.
2. The app creates a Supabase auth user.
3. A database trigger creates a `pending_teacher_accounts` row from the auth metadata. If Supabase returns an active session immediately, the frontend also upserts the same pending row for faster UI feedback.
   - `email`
   - `username`
   - `display_name`
   - `role = 'pending'`
   - `approval_status = 'pending'`
   - `requested_at`
4. Pending users see the waiting-for-approval screen and cannot enter teacher, student, admin, assessment, or guided-reading areas.
5. Admin Dashboard > Signup Requests shows pending, approved, and rejected requests.
6. Approve sets:
   - `approval_status = 'approved'`
   - `status = 'approved'`
   - `role = 'teacher'`
   - `approved_at`
   - `approved_by`
7. Reject sets:
   - `approval_status = 'rejected'`
   - `status = 'rejected'`
   - `rejected_at`
   - `rejected_by`

## Bootstrap First Admin

Do not hardcode an admin email in the app. After the real admin has a Supabase auth user, run:

```sql
insert into public.app_admins (user_id, email)
values ('AUTH_USER_UUID_HERE', 'ADMIN_EMAIL_HERE')
on conflict (user_id) do nothing;
```

For a clean profile row, also run:

```sql
insert into public.pending_teacher_accounts (
  user_id,
  email,
  username,
  display_name,
  name,
  role,
  status,
  approval_status,
  approved_at
)
values (
  'AUTH_USER_UUID_HERE',
  'ADMIN_EMAIL_HERE',
  'ADMIN_USERNAME_HERE',
  'Admin',
  'Admin',
  'admin',
  'approved',
  'approved',
  now()
)
on conflict (user_id) do update
set role = 'admin',
    status = 'approved',
    approval_status = 'approved',
    approved_at = coalesce(public.pending_teacher_accounts.approved_at, now());
```

## RLS Rules

The schema allows:

- Users to read their own approval row.
- Users to create their own pending request.
- Users to update their own profile only while still pending.
- App admins to read and update all signup approval rows.

The client never grants approval by local state alone. If the approval table is missing or blocked by RLS, non-admin users see a setup-required screen instead of entering the app.

The `create_pending_teacher_account_after_signup` trigger is important when Supabase email confirmation is enabled, because the browser may not have an authenticated session yet when `signUp` returns.

## Notifications

The current implementation provides dashboard notification: Admin Dashboard > Signup Requests shows a pending count and request table. Email notification can be added later with a Supabase Edge Function or another trusted server-side mail provider.
