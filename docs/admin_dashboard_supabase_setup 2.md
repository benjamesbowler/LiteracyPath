# Admin Dashboard Supabase Setup

The Admin Dashboard requires a Supabase table named `public.app_admins`. The app checks this table during sign-in with:

```sql
select id, user_id, email
from public.app_admins
where user_id = auth.uid();
```

If the table, row, or RLS policy is missing, the Admin Dashboard will not open.

## Apply the Migration

Run the migration in:

```text
supabase/migrations/20260528000000_create_app_admins.sql
```

This migration creates:

- `public.app_admins`
- a unique admin row per `auth.users.id`
- `public.is_app_admin(...)`
- RLS policies allowing signed-in users to read their own admin row
- an admin select policy for reading all admin rows

It does not add a real admin user.

## Add an Admin User

Find the user's UUID in Supabase Authentication, then run this in the Supabase SQL editor:

```sql
insert into public.app_admins (user_id, email)
values ('AUTH_USER_UUID_HERE', 'ADMIN_EMAIL_HERE')
on conflict (user_id) do nothing;
```

## Tables Used By The Admin Dashboard

The current Admin Dashboard reads these tables:

| Table | Required columns read by the app | Notes |
| --- | --- | --- |
| `app_admins` | `id`, `user_id`, `email` | Required for admin access check. |
| `classes` | `id`, `name`, `teacher_id`, `created_at` | Required for class totals. |
| `students` | `id`, `name`, `class_id`, `teacher_id`, `created_at` | Required for student totals and class mapping. |
| `answers` | `id`, `teacher_id`, `student_id` | Required for teacher answer counts. |
| `pending_teacher_accounts` | `id`, `user_id`, `email`, `username`, `display_name`, `name`, `role`, `status`, `approval_status`, `created_at`, `requested_at`, `reviewed_at`, `reviewed_by`, `approved_at`, `approved_by`, `rejected_at`, `rejected_by`, `rejection_reason` | Optional; the dashboard works if this table is absent, unavailable, or blocked by RLS. Only the Signup Requests section is disabled. |

Other Supabase tables used elsewhere in the app:

- `mastery`
- `item_mastery`
- `child_mode_answers`

If the Admin Dashboard opens but cannot load, confirm the admin user can select from `classes`, `students`, and `answers` under the active RLS policies.

## Expected Failure Messages

The frontend now distinguishes common admin setup issues:

- Missing table: apply the migration.
- RLS or permission error: update Supabase policies for the affected table.
- Signed in but not listed in `app_admins`: insert the admin row above.

Detailed Supabase error codes, messages, details, hints, and current user id/email are logged only in development mode.
