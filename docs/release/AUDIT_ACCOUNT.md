# Seeded audit school

The seeded school is for local and explicitly approved non-production test databases only. The seed tool refuses an unlabelled remote target and the SQL file is not part of the automatic Supabase seed path.

## Deterministic fixture

- School: `[AUDIT ONLY] LiteracyPath Seed School`
- Teacher A: `audit-teacher-a@literacypath.invalid`
- Teacher B: `audit-teacher-b@literacypath.invalid`
- Admin: `audit-admin@literacypath.invalid` (admin-only route contract checks)
- Classes: `Audit Class A` and `Audit Class B`
- Learners: 26 synthetic first names across the two teachers
- Class codes: `QA7M2K` and `QA8N3P`
- One archived learner
- Explicit high-, low-, sparse-, and no-evidence learners
- 520 assessment attempts with 520 uniquely keyed question records for export/pagination testing
- Completed and in-progress EL benchmark attempts across BOY and MOY
- Guided Reading and Sound Seekers progress records

IDs, evidence, and timestamps are deterministic for a given anchor. The default anchor is `2026-07-23T09:00:00.000Z`; CI may set `LP_AUDIT_ANCHOR` explicitly.

## Validate without a database

```sh
npm run check:audit-school-seed
```

This verifies the fixture contract and never writes external state.

## Apply to a local database

The local database must already have all managed migrations applied.

```sh
LP_AUDIT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
LP_AUDIT_TEACHER_PASSWORD='<local test password, at least 12 characters>' \
npm run seed:audit-school
```

The password is injected in memory and is never stored in the repository.

## Apply to a remote test project

Never point this command at production. A remote test target requires both an explicit acknowledgement and a non-production label:

```sh
LP_AUDIT_DATABASE_URL='<test database connection URL>' \
LP_AUDIT_TEACHER_PASSWORD='<test password>' \
LP_AUDIT_ALLOW_REMOTE_TEST_PROJECT=I_UNDERSTAND_TEST_ONLY \
LP_AUDIT_PROJECT_LABEL='literacypath-e2e-test' \
npm run seed:audit-school
```

The SQL finishes with assertions for two teachers, one separate admin, two classes, 26 learners, one archive, 520 long-history attempts with 520 item records, Guided Reading, Sound Seekers, and both completed/in-progress EL evidence. Any mismatch rolls back the transaction.

## Verify Auth and teacher isolation

After applying the seed, run the reachable API gate:

```sh
LP_AUDIT_SUPABASE_URL='http://127.0.0.1:54321' \
LP_AUDIT_SUPABASE_ANON_KEY='<local anon key from supabase status>' \
LP_AUDIT_TEACHER_PASSWORD='<same test password used by the seed>' \
npm run check:audit-school-live
```

This logs in as both teachers through Supabase Auth, verifies each teacher sees only their own class and learners, checks the archived and long-history fixtures, and proves Guided Reading and Sound Seekers rows are visible through teacher-scoped RLS.

## Reset

Re-run the same command. Fixed IDs and conflict-safe writes make the seed repeatable; learner-owned rows cascade when the 26 fixture learners are replaced.

## Production safety

- The emails use the reserved `.invalid` top-level domain.
- The school name is visibly marked audit-only.
- `tools/seedAuditSchool.mjs` refuses unapproved remote URLs.
- The SQL lives at `supabase/seed/audit_school.sql`, not the automatic `supabase/seed.sql`.
- No production URL, service key, or password is stored in this document or the seed.
