# Admin account management and password reset

## Teacher account approval

New teacher signups create a pending account record. Pending, rejected, and
disabled accounts cannot open teacher tools or call protected teacher
functions. An app administrator can approve or reject a request from the Admin
Dashboard.

The browser never writes approval status, reviewer identity, decision time, or
rejection metadata directly. The dashboard calls
`admin_set_teacher_account_status`; the database then:

- checks that the signed-in person is an app administrator;
- applies only an approved, rejected, or disabled state;
- derives `reviewed_by`, approval/rejection identities, and decision times from
  `auth.uid()` and database time;
- keeps account identity and request timestamps unchanged; and
- returns the saved row so the dashboard confirms the real server result.

A database trigger rejects attempts to change decision fields through the
ordinary `pending_teacher_accounts` table update route. A pending user may edit
only their permitted profile fields while the row-level policy allows it.
Database-owner migration and deterministic audit-seed connections remain
supported; an authenticated or anonymous PostgREST role cannot enter that
trusted setup path.

Do not recreate the table or policies by hand. Apply the managed Supabase
migrations in order. The relevant final integrity change is
`20260728120000_security_integrity_hardening.sql`.

## School assignment

Existing school names can be selected by an approved teacher or administrator.
Creating a new school directory entry is bounded per account over 24 hours.
Pending accounts cannot call the public create-or-find function. The trusted
signup trigger uses a separate private helper so a valid first signup can still
record its requested school before approval.

The frontend uses only the Supabase anonymous/public client. Never put a
service-role key in the browser bundle.

## Password reset

The login screen’s **Forgot password** action asks Supabase Auth to send a
recovery email back to the deployed app origin. When Supabase returns a password
recovery session, the app shows the new-password form and saves the replacement
through Supabase Auth.

Before a production launch, verify the deployed origin and recovery redirect in
the Supabase Auth settings. Test the complete email link journey with a
non-production teacher account; a successful API call alone does not prove that
the mail and redirect configuration works.
