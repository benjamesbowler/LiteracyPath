# Teacher-side audit and fixes — 2026-07-27

A **record**. It describes what was found and changed on this date. It is not a
standard and will not be edited again.

Triggered by one screenshot: deleting a child from the roster failed with
`Could not find the function public.teacher_prepare_learner_deletion(p_requester_role,
p_student_id, p_verification_method) in the schema cache`, rendered verbatim into
the teacher's confirmation dialog.

Three read-only audits (security, UX, reporting truth) were run across the teacher
surface, then the findings were fixed in priority order. Commit `006f7037`.

---

## The reported failure had two independent causes

**1. The live database never received the migration.**
`supabase/migrations/20260725110000_learner_data_rights.sql` creates that function.
The repo has it; production did not. Every screen calling it failed.

The blind spot that let this run: `tools/verifyLearnerDataRightsBackend.mjs` reads
the migration *file* and asserts the SQL text is correct. It was green throughout.
A check that never touches the running system is a blank, not a pass — and this is
now written into its own output.

- `docs/ops/APPLY_PENDING_DATABASE_UPDATES_2026-07-27.sql` — one re-runnable block
  for the Supabase SQL editor, with two verification queries at the end. Parses as
  329 statements under `pglast`; `begin`/`commit` balanced; no unguarded
  `create policy` or `create trigger`.
- `tools/verifyLiveDatabaseFunctions.mjs` (`npm run check:live-database`) — asks the
  running database whether all 28 functions the app calls exist. Exits 2 on
  *inconclusive* rather than passing, so an unreachable database can never read as green.

Kept as two separate checks on purpose: bolting the live check onto
`check:learner-data-rights` would fail CI wherever there is legitimately no network.

**2. The error code was discarded before it could be used.**
`unwrapRpc` in `src/data/learnerDataRights.js` threw `new Error(message)`, dropping
`error.code`. `describeRosterOperationError` branches on `PGRST202` to say "the
database is missing a pending update" — so with the code stripped, that branch was
unreachable and every missing-function failure fell through to the last-resort branch,
which pasted the database's own sentence into the dialog.

Codes, details and hints are now preserved. No raw database prose reaches a teacher;
the error **code** survives as a quotable reference, so the failure stays diagnosable.

---

## Data integrity

| Defect | Mechanism |
| --- | --- |
| Every teacher figure computed from at most 1000 answers | PostgREST caps responses at `max_rows` (1000 in `supabase/config.toml`). The dashboard queries had no `.range()` and ordered `answered_at ASC`, so a class past ~1000 lifetime answers silently showed its **oldest** thousand. No error, no flag. New `src/data/pagedSelect.js` pages, and throws rather than returning a quietly partial result. |
| "N of 30 secured" could exceed 30 | `masteredCount` counted mastery **rows**; `public.mastery` has no unique constraint and the round controller inserts one row per completed round. Now counts distinct `skill_id`. The teacher's count and the child's own record had disagreed on identical data. |
| Deleting one learner destroyed other children's evidence | `teacher_delete_learner_data` matched the subject's id anywhere in `payload`/`summary` and deleted the **whole row**. A whole-class report took twenty-nine other children with it, bypassing RLS as `security definer`. Reports *about* the subject are now deleted; shared reports are **redacted**. |
| Archiving a child left them signed in | `student_from_token` did not filter `archived_at`, and `teacher_set_student_archived` revoked nothing. Up to 12 hours of continued access while the teacher's screen said they were gone. |
| A completed, irreversible deletion reported as "Nothing has changed" | `onDeleted` ran inside the same `try` as the delete, so any throw in the roster refresh overwrote the success message. |
| Sign-in cards printed sequences that were never saved | The guard was `result.saved === 0`, so a *partial* failure fell through and the preview was built from locally generated sequences. Laminated cards that do not work. |

The redaction is load-bearing in a non-obvious way. `teacher_delete_learner_data`
finishes by refusing to complete if the subject's id still appears anywhere in
`payload::text` or `summary::text`. Redaction therefore erases the id as a
**substring**, not just whole-value matches — otherwise one id embedded in a file
name would make every deletion raise and roll back.

---

## Truth in reporting

- The **"Skills secured" tooltip** described Sound Seekers' rule (4 correct, two days,
  two question types) while labelling a number produced by curriculum checkpoints —
  a different subsystem with a different rule, which that very tooltip excluded.
- **"Theme and Higher Comprehension" was relabelled "Digraphs"** by an unanchored
  `/ch|sh|th/` matching the `th` inside "Theme". Two heatmap rows then shared one
  canonical name, which is used as a React key.
- A sound went **red "needs re-teaching" on a single correct answer**, with a tooltip
  reading 100%. Red now waits for the same minimum evidence every other conclusion
  surface uses.
- **Reports and Students gave opposite verdicts on identical evidence** — one called
  `evaluateLearningConclusion` with `requireRecency: false`, the other without.
- **Today held its own copies of two policy thresholds**, and the threshold guard did
  not scan that file.
- **Both metric guards passed by checking that strings existed.** They now check that
  the numbers agree and that every documented figure has a render site. Negative
  controls were run and reverted.

---

## Teacher experience

Confident zeros while loading on Today, Assessments, Reports and the sync panel; a
fresh sign-in telling an established teacher they had no classes; surface-state
buttons rendered with no handler; the class-code expiry option that *described* the
current setting silently removing it; sound-map status carried by colour alone and
explained in a `title` attribute no tablet can show; thirty roster buttons sharing the
accessible name "Reset"; a suppressed class average always blaming the wrong rule.

---

## Security boundary

`createValidatedSupabaseClient` was **default-allow** — it threw only for `from` and
`rpc`, so `supabase.schema("public").from("students")` returned a raw, unchecked
client, and the CI regex in `checkSupabaseDomainBoundaries.mjs` could not see that
shape either. Now default-deny on every real property of the SDK client, with symbols
and absent properties still resolving so `await` and devtools keep working.

---

## What green means here

- **175 unit suites, 166 green.** 9 fail only in cloud sandboxes
  (`@rolldown/binding-linux-arm64-gnu`); `studentReportExperienceGuards` fails
  identically at clean `HEAD` — verified by stashing and re-running, not assumed.
- **eslint clean** across the repo.
- **Nine guards green**: learning-policy thresholds, metric definitions, app copy,
  teacher state matrix, Supabase domain boundaries, learner data rights, database
  policy contract, teacher UI primitives, dashboard consolidation.
- `tests/unit/databasePolicyContract.test.js` **caught a real ordering violation** in
  the new migration — the security-definer boundary must be the last such migration.
  Fixed by re-issuing the boundary, following this repo's existing pattern.

**Not verified from here, and nobody should treat it as verified:**

1. The SQL against a live PostgreSQL. No Postgres in the sandbox; `pglast` parses the
   statements but treats plpgsql bodies as opaque strings. The redaction *algorithm*
   was re-derived independently and holds on five payload shapes — that proves the
   algorithm, not the SQL.
2. Any browser render. No dev server, and the JSX test harness is the arm64-broken path.
3. The hosted PostgREST `max_rows`. `supabase/config.toml` says 1000; the hosted
   project's Settings → API may differ.

---

## Left open, deliberately — these need a decision, not a patch

1. **The admin dashboard can delete a learner with no audit trail.**
   `20260527000000_core_learning_schema.sql:110` grants `delete` on `students` and
   `classes` to `authenticated`, and nothing revokes it.
   `useAppSessionController.js` takes that path directly, cascading through answers,
   mastery and progress while writing **zero** rows to `data_rights_requests`. The
   roster path is correct; the admin path is not. Revoking the grant needs the admin
   delete-*class* flow rerouted first, which the data-rights RPC does not cover.
2. **Class-code rate limiting is bypassable.** The `device` bucket is keyed on a
   client-supplied id and the `code` bucket on the guessed code, so both are void;
   only the network bucket holds, and it takes the *leftmost* `X-Forwarded-For` hop —
   the one the caller controls.
3. **Class codes never expire by default** and the raw code is stored in cleartext in
   `localStorage` on the child's device.
4. **Picture passwords have 729 combinations** behind a lockout that resets every 60s
   (~5 guesses/minute, no escalation).
5. **Access codes come from `random()`**, not a CSPRNG, though `pgcrypto` is installed.
6. **Every child's plaintext sign-in credential is loaded into the teacher SPA** on
   dashboard boot, including on screens that never show it.
7. **`teacherGrowthSeries.js` is imported by nothing in `src/`.** Two real defects were
   fixed in it, but no teacher currently sees that curve. Decide whether it ships.
8. **`TeacherProgressOverview.jsx` is dead app code**, reachable only from a dev
   preview. Removed from the guard's certified list; deleting it also means deleting
   `preview/learning-policy.html` and two Playwright specs that assert markup it no
   longer renders.
