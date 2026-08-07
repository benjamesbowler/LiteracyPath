# Authorising new accounts — a plan

Written 2026-08-07 against `guided-reading/open-by-default` @ `dc4656c`. **Plan only. No code written.**
Every claim below has a file and line reference and was checked against the source, not remembered.

---

## Before the plan: signup is currently broken, and I need to say that first

`src/appState/useAppSessionController.js:1945` — immediately after `supabase.auth.signUp` succeeds, the
browser writes the pending row a second time itself:

```js
.table("pending_teacher_accounts").upsert(pendingRecord, { onConflict: "user_id" })
```

`pendingRecord` comes from `buildPendingAccountRecord()`, whose last line is `:1194`:

```js
school_id: overrides.school_id || metadata.school_id || null
```

`overrides` only ever carries `username` and `display_name` (`:1945-1948`). The signup metadata carries
`school_name`, not `school_id` (`:1907`). So `school_id` is **always `null`** in that payload. An upsert
on conflict compiles to `ON CONFLICT (user_id) DO UPDATE SET ... school_id = EXCLUDED.school_id`, so it
overwrites the `school_id` the database trigger had just correctly resolved
(`20260728120000_security_integrity_hardening.sql:914-918`) with null.

Nothing stops it. The row-level security policy allows a user to update their own pending row, and the
audit-integrity trigger guards the decision columns but not `school_id`.

The consequence: the admin screen renders **"School not resolved — approval blocked"** and disables the
Approve button (`AdminDashboardPage.jsx:404`, `:416`). If it were forced anyway, the database refuses:
`22023 'Resolve the teacher account school before approving access.'`
(`20260728127000...sql:226-234`).

And there is no way out through the interface. The only school editor lives in the **Teachers** section,
which builds its list from rows in `classes`/`students`/`answers` (`useAppSessionController.js:1515`). A
pending teacher owns none of those, so they never appear there. **Every teacher who has signed up since
that upsert was introduced is permanently stuck, and can only be rescued with hand-written SQL.**

That should be fixed this week regardless of whether you say yay to anything below. It is a two-line
change: pass the resolved `school_id` through, or better, delete the client upsert entirely and let the
trigger own the row, which is what the code's own warning message already assumes it does (`:1956`).

---

## The shape of the problem

Here is the asymmetry, measured rather than asserted.

To get into the children's area, a five-year-old must produce a six-character code drawn from a
31-character unambiguous alphabet, then a three-icon picture password, through a login that enforces
three-dimensional server-side rate limiting (10 attempts per device per minute, 60 per network, 120 per
code), a five-failure sixty-second account lockout, an expiring class code, and a hashed audit trail
that deliberately stores no raw code, IP or learner id. That is `20260725090000_class_access_security.sql`
and `20260728120000...sql:83-230`, and it is genuinely good work.

To get into the adult area, you type a string containing an `@`. That is the whole check.

No captcha. No rate limit at the application layer. No password check before submitting — Supabase
itself enforces a minimum of 8 characters (`config.toml:50`), so weak passwords are refused, but the
app only discovers this from the server and shows *"Choose a stronger password and try again"*
(`teacherErrorMessages.js:44`). The reset flow checks up front (`:2202`); signup doesn't. No email
verification —
`supabase/config.toml:56` sets `enable_confirmations = false`, `email_confirmed_at` is referenced in
exactly three places and none of them is an access check, and there is no confirmation UI anywhere in
`src/`. **An email address that does not exist can complete signup and reach the pending queue**, and if
approved, would hold full teacher access to real children's records.

Then nothing happens. No one is notified — I searched the whole repository for any mail, webhook, edge
function or realtime subscription and found one disabled local SMTP block in a config file and one
variable misleadingly named `notificationError` that writes a table row and notifies nobody. The only
way you learn a teacher is waiting is by opening the admin dashboard and clicking "Teacher requests".
And the teacher is told: *"An administrator must approve your account before you can use Literacy
Guide."* No timeframe, no contact route, no way to check. One button on the screen: Sign out.

So the honest summary is that the gate is strong against a determined attacker who has already signed
up — the database enforcement is real, twenty row-level-security policies call
`current_actor_has_teacher_access()`, and the approval history is genuinely append-only with a trigger
that raises on any UPDATE or DELETE — and almost nonexistent against anyone getting *to* that point.
And the human step it depends on has no way of knowing it is needed.

**One more thing I have to own.** The three MLL tables I added yesterday
(`20260806120000_multilingual_learner_profile.sql:165-180`, `:223`, `:264`) gate on
`teacher_id = auth.uid()` and **not** on `current_actor_has_teacher_access()`, with direct table grants
to `authenticated` at `:162`, `:220`, `:261`. So does `reading_sessions`
(`20260801090000_synced_guided_reading.sql:103-126`). A rejected or disabled teacher holding a live
session token retains access to guided-reading sessions and multilingual-learner records — exactly the
bypass the July migration was written to close. The drift guard that would have caught this only
inspects functions named `teacher_*`, so tables slipped past it. That is my bug and it is in the plan
below as Phase 0.

---

## The method I'd recommend

The instinct when approval is painful is to make approving faster. I think that is the wrong move. The
better move is to **approve schools instead of teachers**, because a school is approved once and a
teacher is approved forever after.

Right now every teacher is a separate decision you have to make, and school name is free text
(`SchoolNameInput.jsx:30-38` is a plain input with an advisory datalist — no verification, no domain
check, no allowlist), so the decision is made on information that means nothing. Anyone can type any
school and be attached to it.

Anchor trust to the **email domain** instead, and the decision becomes: *is `oakridge.sch.uk` really
Oakridge Primary?* You answer that once. Every teacher there afterwards gets in instantly, with no
involvement from you at all. This is how Slack, Figma, Notion and Google Workspace all handle exactly
this problem, and it is well understood by the people who'd be signing up.

That gives three lanes, chosen automatically by the system, not by you:

| Lane | Who | What happens | Your involvement |
|---|---|---|---|
| **A — Known domain** | Email domain already verified for a school | Confirm email → approved immediately | None, ever |
| **B — Invited** | A colleague at an approved school invited them | Confirm email → approved immediately | None, ever |
| **C — New school, or a free email** | First person from a new domain; or gmail/outlook/yahoo | Reviewed by you | One decision, which opens Lane A for that whole school |

The economics of this matter. Today a school of twelve teachers costs you twelve decisions. Under this
plan it costs you one, and the other eleven are instant. A second school costs one more. Your review
queue stops growing with your user base and starts growing with your *customer* base, which is a much
smaller number and a much more interesting one to look at.

**Invites are the path I'd push hardest.** An approved teacher enters a colleague's email; the colleague
gets a link; they set a password and they're in. It is the easiest possible experience and simultaneously
the strongest signal in the system, because a verified teacher at that school vouched for them by name.
It is better evidence than anything you could assess from an admin table.

**Lane C is where the judgement lives, and it should stay manual.** A free-mail address genuinely cannot
be domain-anchored, and a brand-new school is exactly the case where a human should look. But make the
screen show you what you'd actually want: the domain's website, whether the school name resolves against
a public schools directory, how many other requests came from that domain today, and what the person
wrote in a one-line "what do you teach?" box. Right now that screen shows you an email, a machine-generated
internal username nobody ever uses, a display name and an unverified free-text school string.

### The non-negotiable underneath all three lanes

**Email verification, enforced, before a pending row exists.** Everything above depends on the email
address being real — Lane A is domain matching, Lane B is a link sent to an address, Lane C is you
judging a domain. All three are meaningless against an unverified address. This is the single highest-value
change in the plan and it is mostly configuration plus a confirmation screen.

### And the thing that has nothing to do with security

Tell people what is happening. A teacher who signs up on a Sunday evening currently sees a wall with a
Sign out button and no information, and most of them will never come back. They should get: an email
confirming the request; a screen that says roughly how long it takes; an email the moment they're
approved; and — the part I care about most — **something to do while they wait.** Let them explore the
whole product with demo children and demo data. No real child records, nothing that syncs, no privacy
question at all. A teacher who has spent ten minutes inside the product while waiting is a different
person from one who saw a wall.

You should get told too: a daily digest when the queue is non-empty, and an immediate ping when it's a
new school. You cannot act on a queue you don't know exists.

---

## Ease and security, scored honestly

| | Today | Proposed |
|---|---|---|
| Time to access, teacher at an existing school | Unbounded (you must notice) | ~2 minutes, no human |
| Time to access, first teacher at a new school | Unbounded | One review by you |
| Your decisions per 100 teachers | 100 | Roughly 5–15, depending on schools per teacher |
| Fake / unreachable email can enter the queue | Yes | No |
| Automated bulk signup | Unlimited | Captcha + per-IP and per-domain limits |
| Unverified free-text school claim | Yes | Domain-anchored, verified once by a human |
| Stuck accounts recoverable in-app | No | Yes |
| Rejected/disabled account keeps some access | Yes (MLL, reading sessions) | No |
| Teacher knows what's happening | No | Confirmation, timeframe, approval email |

The proposal is both easier *and* stricter, which is possible only because the current system is strict
in the wrong place — it puts the whole burden on a manual step that has no supporting information and
no trigger to make it happen.

### What it costs, stated plainly

Domain trust assumes anyone with an address at a verified school domain is staff. For a K-3 product
that is safe — four-to-seven-year-olds don't have school email — but it would not hold for a secondary
product, and it's worth knowing you're relying on it.

A school could still be impersonated by registering a lookalike domain and waiting for you to approve
it in Lane C. That's why Lane C stays human, and why the review screen should show you the domain's
actual website.

And there is no de-provisioning. A teacher who leaves a school keeps access until someone disables them
by hand. That's true today as well, so it isn't a regression — but a domain-trust model makes it more
visible, and it should go on the list rather than be quietly inherited.

---

## Build order

**Phase 0 — repairs, this week, independent of the rest.** Delete the client-side upsert that nulls
`school_id`, and add a school editor to the Signup Requests screen so a stuck account can be rescued
without SQL. Add `current_actor_has_teacher_access()` to the MLL and `reading_sessions` policies, and
widen the migration drift guard to cover tables and not just `teacher_*` functions, so this cannot
happen again. Add a password-length check to signup to match the one on reset. Validate school-name
length client-side, because a one-character school name currently destroys the entire signup with a
generic error and no account is created — retrying with the same input fails forever
(`create_school_directory_entry` raises, which aborts the `auth.users` insert). And flag stuck accounts
distinctly in the queue: they *are* counted in the pending pill (`AdminDashboardPage.jsx:238`, `:350`),
but they present as ordinary pending requests with a disabled Approve button, so the number you see is
a number you cannot action and nothing tells you why.

**Phase 1 — email verification.** Turn on confirmations, build the confirm screen and the resend path,
and — importantly — make the pending row conditional on confirmation rather than on the raw signup.
Nothing else in this plan is trustworthy until this lands.

**Phase 2 — notifications, both directions.** Daily digest to you, immediate ping for a new school,
confirmation and approval emails to the teacher. This is the cheapest phase and probably has the
largest effect on how the system actually feels, because it converts an invisible queue into a visible
one.

**Phase 3 — school domains.** A `school_domains` table, verifying a domain as part of approving a Lane C
request, and auto-approval for a confirmed email whose domain is already verified. This is where your
workload drops.

**Phase 4 — invites.** Approved teachers invite colleagues; invited addresses auto-approve on
confirmation. Single-use, expiring tokens, revocable, and capped per teacher per week.

**Phase 5 — the abuse floor.** Captcha on signup and password reset, per-IP and per-domain signup limits,
a disposable-email blocklist, and a rate limit on school creation — the signup trigger currently routes
around the existing `find_or_create_school` limit of five schools per account per day, so signup is an
unauthenticated, unlimited school-row factory. Also: `list_school_names()` is granted to `anon` and
returns every school name unpaginated (`20260611090000_list_school_names.sql:5-18`), which lets any
visitor enumerate your entire customer list. That should be authenticated, or replaced with a prefix
search.

**Phase 6 — the waiting room.** Demo-data exploration while a request is pending.

Phases 1 and 2 alone fix most of what is actually wrong. Phase 3 is what makes it scale. Everything from
4 onward is improvement rather than repair.

---

## What I would deliberately not do

**Not multi-tier approval or roles beyond the current binary.** Approved or not is the right granularity
for now, and twenty RLS policies already depend on that shape. Adding a middle tier means auditing all
twenty.

**Not automated school verification against a government register.** The UK, US and international
registers have different shapes and coverage, and the failure mode — a real school rejected by a stale
dataset — is worse than the manual review it replaces. A link to the domain's website in the review
screen gets you 90% of the value for none of the cost.

**Not identity verification of teachers.** Proportionality. A vouched colleague at a verified domain is
sufficient evidence for access to a phonics app. Anything heavier will cost you signups and buy very
little.

**Not paid email-verification or anti-fraud services at launch.** A static disposable-domain blocklist
is most of the benefit at zero cost and no new subprocessor to declare in the privacy pack.

**Not touching the child login.** It is the strongest part of the system and should be left alone.

---

## What I need a yay or nay on

1. **Domain-anchored trust as the core idea** — approve schools once, then their teachers automatically.
   This is the load-bearing decision; everything else follows from it or doesn't.
2. **Email verification as a hard requirement**, accepting that it adds a step and will cost a small
   number of signups.
3. **Teacher-to-teacher invites** as a first-class path, with an approved teacher able to admit a
   colleague without you.
4. **Phase 0 going in immediately and separately**, because signup is broken right now and that is true
   whatever you decide about the rest.
5. **Whether the family accounts from the free-tier plan use this same machinery** — my view is no, they
   should skip approval entirely and be gated by email verification and payment-or-nothing instead,
   because a parent has no school and no colleague and there is nothing for you to review. Worth
   deciding now, because it changes where the entitlement layer sits.
