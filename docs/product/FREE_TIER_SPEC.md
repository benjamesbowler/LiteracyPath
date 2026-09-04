# The public free tier — specification

**Status: SPEC ONLY. No code written.** Written 2026-08-06 against `main` @ `8a2d492`.

The ask: members of the public register with email and password, add up to two children, and get access
to roughly 20% of the children's practice area. No parent reporting — a practice area, not a dashboard.
Free at launch, with a paid path later.

---

## Part 0 — Read this first

Three findings from the codebase audit reshape the plan, and all three should be settled before any code
is written.

### 0.1 There is no entitlement mechanism of any kind

Searched for `entitlement|subscription|trial|locked|premium|paywall|plan|tier|featureFlag|billing|stripe|checkout|freemium`.

**Commerce: zero.** No payments dependency in `package.json`. No plan, no tier, no trial, no paywall.
Every keyword hit is something else: `premiumGameStandard.js` is GPU setpiece budgets;
`lockedItemAffordance.js` is the in-game coin shop; `childTrailPolicy.js` is map-stop progression.

The only real access gate in the product is `isTeacherAccountApproved()`, mirrored in the database by
`current_actor_has_teacher_access()`. It is binary, teacher-scoped and admin-toggled.

**So this is greenfield.** That is good news for design freedom and bad news for estimates.

### 0.2 The current data model cannot represent a parent or a class-less child

Four structural blockers, each one a migration:

| # | Blocker | Where |
|---|---|---|
| 1 | `pending_teacher_accounts.role` accepts only `pending` and `teacher`. There is no parent role. | `20260529000000_signup_approval_profiles.sql` |
| 2 | **School name is mandatory at signup.** The `auth.users` insert trigger raises `invalid_teacher_signup_metadata` when it is null. A parent signup fails at the database, not in the UI. | `20260725130000_security_definer_boundary.sql:82-92` |
| 3 | **Approval is mandatory.** `current_actor_has_teacher_access()` requires both status columns to equal `approved`. A free tier needs auto-approval or a fourth status. | `20260728100000_teacher_account_status_rls.sql:27-39` |
| 4 | **A child cannot exist without a class.** `students.class_id` is `NOT NULL` with a composite foreign key to `classes(id, teacher_id)`, and every class is issued an access code. | `20260527000000_core_learning_schema.sql` |

Blocker 4 is the interesting one, and §3 proposes living with it rather than fighting it.

### 0.3 The privacy policy currently forbids this feature

`docs/legal/PRIVACY_POLICY.md:14-17`, verbatim:

> "LiteracyPath is a teacher-managed early-literacy and phonics service for learners roughly aged 4-7. A
> school or authorised adult creates and manages learner access. **We do not knowingly offer independent
> child sign-up or collect information from children outside the school-managed context.**"

`SCHOOL_PARENT_CONSENT_MATERIALS.md` likewise frames COPPA authority as flowing from **school** consent,
"in the educational context and not an unrelated commercial use."

**This is not a documentation chore.** The school-authorization route and the direct-to-consumer route
are different legal regimes, and `check:legal-pack` asserts required phrases per file, so the gate will
fail until the pack is rewritten. See §7.

---

## Part 1 — What the tier is, in one paragraph

A parent creates an account with an email and a password, confirms the email, and adds up to two
children by first name and age. Each child gets a picture code and can play a curated slice of the app —
roughly a fifth of the content, chosen to be a genuine sample of every activity type rather than a
locked-off tour. There is no reporting, no class, no teacher dashboard, no export. The parent sees that
their child has been playing and what they have been playing. That is all.

The purpose is not to be a free product. It is to let a parent or a teacher-shopping-for-their-school see
the thing working, with a real child, in five minutes, without contacting anybody.

---

## Part 2 — Account model

### 2.1 A separate account type, not a teacher with fewer permissions

Recommended: a `family` role alongside `teacher`, sharing the `auth.users` identity but with its own
row type.

Why not reuse `teacher`: the teacher path is approval-gated, school-scoped and admin-visible. Making a
parent a "teacher whose school is null and whose approval is auto" means every teacher-facing query,
every admin screen, and every RLS policy has to learn a special case. That is how a codebase acquires
the kind of ambiguity `docs/ADVERSARIAL_AUDIT_2026-07-31.md` documents.

```
auth.users
  ├── pending_teacher_accounts   (existing — school, approval, admin-managed)
  └── family_accounts            (new)
        ├── id, user_id, created_at, email_confirmed_at
        ├── plan_id              → 'free_try'
        ├── consent_version, consent_recorded_at, consent_method
        ├── child_slots_allowed  (default 2)
        └── deletion_requested_at
```

### 2.2 Changes needed to the signup trigger

`create_pending_teacher_account_for_new_user()` currently raises on missing `school_name`. It needs a
branch on `raw_user_meta_data->>'account_type'`:

- `teacher` (default, existing behaviour) — school name required, `approval_status: pending`
- `family` — school name **not** required; writes a `family_accounts` row; auto-approved

**Do not weaken the teacher branch.** The school-name requirement is doing real work: it is what makes
the school-authorization COPPA route defensible for the school product.

### 2.3 Entitlements

A single new table, deliberately boring:

```
entitlements
  ├── id, account_id, account_type ('family' | 'teacher')
  ├── plan_id            ('free_try' | 'family_paid' | 'school')
  ├── content_scope_id   → the manifest key in §4
  ├── child_slots
  ├── features           jsonb — { reporting: false, export: false, ... }
  ├── starts_at, ends_at
  └── source             ('signup' | 'admin' | 'purchase')
```

Read once at sign-in into an `EntitlementContext`; never read per-render. `src/policy/entitlementPolicy.js`
becomes the single answer to "may this account do this", in the same shape as the existing
`childTrailPolicy.js` and `studentRailPolicy.js`, unit-testable from `node --test` per house style.

**Entitlement is checked in the database as well as the client.** A client-only gate is a marketing
banner, not a limit.

---

## Part 3 — Children

### 3.1 Give each family an invisible class

The cleanest path is to **not** fight blocker 4. On family signup, create one `classes` row owned by the
family account, named after the family, with **no access code issued**. Children are ordinary `students`
rows in it.

This buys a lot: every existing progress, sync, evidence and deletion path works unchanged; the composite
foreign keys keep working; `student_login` works with a family-scoped code instead of a class code; and
the learner-data-rights machinery in `learnerDataRights.js` applies as-is.

The cost is one conceptual oddity — a "class" of two siblings — which is invisible to the user and
documented in one comment.

### 3.2 Enforce the two-child limit in the database

Not in the UI. A `with check` on the `students` insert policy, or a trigger, counting existing
non-archived rows for the account against `entitlements.child_slots`.

Archived children still count. Otherwise the limit is bypassed by archiving and re-adding, and someone
will find that within a week of launch.

### 3.3 Child sign-in

Reuse the existing three-step flow (`StudentLoginFlow.jsx`) with the family code in place of a class
code. **Do not build a second child-auth path.** The existing one is rate-limited, device-fingerprinted
and lockout-protected (`20260725090000_class_access_security.sql`), and duplicating that correctly is
harder than it looks.

One change worth making: on a family account the roster is at most two names, so the "pick your name"
step should skip straight through when there is only one child.

### 3.4 Data footprint

A free-tier child's footprint is exactly a school child's, minus the class:
one `students` row, up to ten `student_progress` rows (one per area in `progressKeys.js`), a stream of
`learn_activity` events, and a `student_sessions` row.

**Set a retention policy for free accounts at creation**, not later. The amended COPPA rule prohibits
indefinite retention and requires a specific schedule. Recommended: delete on 12 months of inactivity,
with an email at 11 months. This is a launch requirement, not a nice-to-have.

---

## Part 4 — The 20% content slice

### 4.1 What 100% is

Measured from the source, not estimated:

| Content | Total |
|---|---|
| Skills | 30 |
| Assessment questions (v3) | 2,512 |
| Guided reading books | 226 (Level A 65, B 86, C 75) |
| Story Quests | 13 (313 pages) |
| Arcade games | 21 defined, 20 visible |
| Adventure Map cycles | 27 playable |
| Sound Seekers stops | 40 across 3 acts |
| High-frequency words | 1,000, of which 100 assessed |

### 4.2 The slice should be a cross-section, not a prefix

The tempting cut is "Level A only" — 65 of 226 books is 29%, cycles 1-9 is 33%, Sound Seekers act 1 is
33%. Tempting because the data already groups that way.

**Resist it.** A prefix cut gives a five-year-old the easiest content and a seven-year-old nothing they
can do, and it shows a prospective buyer only the shallow end. A cross-section shows the product.

Recommended slice, ~20% by volume and 100% by activity type:

| Content | Free | Share | Chosen for |
|---|---|---|---|
| Guided reading books | 40 | 18% | Spread across A/B/C, both C bands, fiction and nonfiction, so any child finds a fit |
| Story Quests | 3 | 23% | One per level band. These are the strongest hook. |
| Arcade games | 5 | 25% | One per category — phonics, CVC, fluency, sight words, spelling |
| Adventure Map cycles | 5 | 19% | Cycles 1-3 plus two later ones, so the ladder is visible |
| Sound Seekers stops | 8 | 20% | Act 1 up to the first world hub — a complete arc, not a truncated one |
| Skills assessed | 6 | 20% | Across at least three domains |
| High-frequency words | 25 | 25% | Band 1 |
| My Hollow | full | — | The reward loop is the retention mechanism. Gating it gates the reason to come back. |

**Give every free child the same slice.** Per-child variation is a merchandising idea that would double
the support surface for no learning benefit.

### 4.3 Where the manifest lives

A new `src/policy/freeTierPolicy.js` holding a versioned content manifest, mirroring the shape of
`childTrailPolicy.js`. Versioned because the slice will be tuned, and a child mid-way through content
that disappears is a bad Tuesday.

`public.app_config` is the obvious candidate for making it remotely tunable — it already exists and is
anon-readable — but it is **global, not per-account**, so it can hold the manifest while entitlements
hold who gets it.

### 4.4 The locked affordance

`lockedItemAffordance.js` is coin-shop-only; the content-locked affordance does not exist and needs
designing carefully, because the audience is five.

Rules:

- **Never a padlock on a greyed tile in a grid of colour.** For a young child that reads as failure, and
  it is the same normative-display problem the reporting bible bans on data walls.
- **Show what is available. Mention what is not, once, at the edge.** A single "More stories are coming"
  card at the end of a shelf, not a lock on every third item.
- **Nothing in the child's flow ever asks them to get a grown-up to pay.** Purchase prompts belong on the
  parent surface. A child should never be the sales channel.
- **The recommender must never recommend locked content.** `selectStudentHomeRecommendation` in
  `learningPolicy.js` and `buildDailyMission` in `dailyMission.js` both need the manifest, or the app
  will cheerfully send a child at a door they cannot open.

### 4.5 Components that need lock-state

1. `StudentHomePage.jsx` — the six doorways
2. `studentRailPolicy.js` — `STUDENT_RAIL_DESTINATIONS`, the tab bar
3. `AppSurface.jsx` — the view switch and tab handlers
4. `StudentBooksPage.jsx` + `childLibraryPolicy.js` — shelves
5. `LearnAreaPage.jsx` — Story Quest shelves
6. `GameArcadeHub.jsx` — the game grid
7. `StudentAdventureMapPage.jsx` + `childTrailPolicy.js` — already has a `locked` visual state to reuse
8. `questSequence.js` — the 40 stops
9. `learningPolicy.js` — the recommender
10. `dailyMission.js` — the mission builder

---

## Part 5 — No parent reporting, and what to show instead

"No parent reporting" is right, and it is worth being precise about why rather than treating it as a
feature cut.

The reporting bible's Part II is explicit about what a family may see and what a child may never see,
and every one of those rules assumes a teacher is in the loop to interpret. A parent-facing status
dashboard with no teacher between it and the family is exactly the labelling risk the bible's Part VIII
exists to prevent — on a five-year-old, on unvalidated free-tier data, with no professional context.

So: **no status, no accuracy, no skill bars, no comparison, no reading level.** Not "hidden behind a
paywall" — genuinely not computed for this tier.

What the parent surface *should* show is activity, warmly:

- What their child played, and when
- How long they spent
- What they collected in My Hollow
- Which story they are in the middle of
- One "try this together" suggestion drawn from what the child has been doing — not from what they got wrong

This is a scrapbook, not a report card. It is also, not incidentally, the honest representation of what
20% of the content on an unproctored device can support.

**Implementation note:** the reporting modules must not be reachable at all for a family account.
Gate at the route and at the entitlement, not by hiding a button — `entitlements.features.reporting` is
read in `AppSurface.jsx`'s view switch, and the teacher views are simply not mounted.

---

## Part 6 — Security and abuse

The current posture is built for a school product where every account is human-approved. A public
signup form removes that filter entirely.

| Gap | Today | Needed |
|---|---|---|
| Signup rate limiting | None at the application layer. Supabase defaults only. | Supabase Auth captcha (Turnstile or hCaptcha) plus a per-IP signup limit |
| Email confirmation | Not enforced | Required before a child can be created |
| CAPTCHA | None anywhere | On signup and password reset |
| CSP | `connect-src 'self' https://*.supabase.co`, `frame-src 'none'` | Must widen for the captcha provider. `Permissions-Policy: payment=()` must change if checkout ever ships |
| Disposable email | Not checked | Worth a blocklist; not worth a paid service at launch |
| Child login | Already rate-limited, device-fingerprinted, 5-failure lockout | Unchanged. This part is good. |

**One existing exposure to check before launch, not after:**
`get_game_leaderboard` is anon-callable and returns child display names, gated only by
`p_school_id is not null` (`20260613100000_leaderboard_require_school.sql:35-36`). A family account has
no school, so it currently fails safe and returns nothing. **Add a test that asserts that**, because the
next person to touch that function will not know it is load-bearing.

**And confirm before launch:** `20260801091000_security_definer_boundary.sql` must be applied. If it is
not, the 2026-06-10 anon grants still stand and `student_list_students(uuid)` dumps every child's real
name to `anon`. That is bad in a school product and catastrophic in a public one.

---

## Part 7 — Legal, which is the real critical path

This is the part that takes longest and cannot be parallelised with the build.

Under the school model, the **school** provides COPPA consent on parents' behalf, in the educational
context. Under a direct-to-consumer model, **the operator is the covered party** and needs verifiable
parental consent, direct notice, and its own retention schedule. The FTC's 2022 policy statement is
explicit that companies cannot delegate compliance to schools or parents.

The amended COPPA rule's final compliance deadline was **22 April 2026** — already binding.

### 7.1 Required before launch

1. **Rewrite `PRIVACY_POLICY.md`** to cover both routes, clearly separated. The current disclaimer of
   independent child sign-up must go, and `check:legal-pack` assertions updated with it.
2. **Rewrite `SCHOOL_PARENT_CONSENT_MATERIALS.md`** into two documents: school-authorized and
   parent-consented.
3. **Add an in-product consent flow.** None exists — no age gate, no consent capture, no terms
   acceptance anywhere in `src/`. Needs: an "I am the parent or guardian" attestation, a terms and
   privacy acceptance recorded with version and timestamp, and a direct notice at the point of adding a
   child that names what is collected and how long it is kept.
4. **Verifiable parental consent.** For a free tier collecting only a first name and a picture code, the
   FTC's "email plus" method is the proportionate route. Document the choice and why.
5. **Write the retention schedule.** Specific, published, enforced by a job. Indefinite retention is
   prohibited.
6. **Written information security program** — a designated coordinator, annual risk assessments, regular
   testing, service-provider oversight. Required by the amended rule.
7. **Re-scope `learnerDataRights.js`.** Every current verification path runs through the school
   (`school_record_match`, `verified_parent_via_school`, `authorised_school_official`). A parent with no
   school needs a self-serve path, which means account-ownership verification rather than school
   verification.
8. **Resolve Google Fonts.** `docs/legal/SUBPROCESSORS.md` already flags it as "must be removed or
   approved before launch". `index.html` loads seven families from `fonts.googleapis.com`. Under a school
   contract this is a negotiable subprocessor; under a consumer product with EU visitors it is a
   third-party data flow on first paint. Self-host the fonts — it is an afternoon and it removes the
   question.
9. **Do not display a Student Privacy Pledge badge.** It was retired 25 April 2025 and now signals
   out-of-date compliance work.

### 7.2 Worth doing regardless

Sign the **SDPC National Data Privacy Agreement v2.2** and publish the general offer. Over 275,000 DPAs
executed across 28 state alliances; it removes per-district legal negotiation from the school sales
cycle. Highest-ROI compliance action available to a K-12 vendor, and unrelated to the free tier except
that both want doing before launch.

---

## Part 8 — What "free at the start" implies

Two things worth deciding explicitly now rather than discovering later.

**Free means no payment infrastructure, which is a real saving.** No Stripe, no PCI surface, no
`Permissions-Policy` change, no CSP widening for a payment provider, no refund policy, no tax handling.
Keep it that way for launch. The entitlement table is designed so that adding `plan_id: 'family_paid'`
later is a row, not a refactor.

**Free does not mean free of cost.** Every free child consumes Supabase rows, sync traffic and audio
bandwidth. The media inventory is 21,788 files. Before launch, know the marginal cost of a free child
per month, and set the inactivity-deletion policy with that number in hand as well as the COPPA one.

---

## Part 9 — Build order

Each phase should be shippable and testable on its own.

**Phase 0 — legal and policy.** §7 items 1, 2, 8, 9 plus the retention schedule. Start here because it
is the long pole and because it determines what the consent UI must capture. Nothing else is blocked by
it, so it runs alongside Phase 1.

**Phase 1 — entitlement layer.** `entitlements` table, `src/policy/entitlementPolicy.js`,
`EntitlementContext`, and RLS. Ship it with the school product first, where every account gets a
full-access entitlement and nothing visibly changes. This proves the layer under no user pressure.

**Phase 2 — the content manifest.** `src/policy/freeTierPolicy.js`, the ten components in §4.5, and the
locked affordance. Testable against a synthetic restricted entitlement before any parent exists.

**Phase 3 — family accounts.** The signup trigger branch, `family_accounts`, the invisible class, the
two-child database limit, and the child-slot check.

**Phase 4 — signup and consent UI.** Registration, email confirmation, captcha, consent capture, add-a-child.

**Phase 5 — the parent scrapbook surface.** §5.

**Phase 6 — abuse and observability.** Rate limits, CSP changes, the leaderboard assertion test, the
retention job, and a dashboard for signup volume and free-child cost.

---

## Part 10 — Open questions

These need Ben, not a spec.

1. **Age gate.** Does a parent enter a child's age or a year group? Age drives content selection and the
   grade cluster the reporting modules need; asking for a birthdate collects a data point the privacy
   posture would rather not hold. A year band is probably enough.
2. **What happens at the end of the free content?** A wall, a waitlist, or a "tell your school about us"
   path? This is the most important product decision in the tier and it is not a technical one.
3. **Is the free tier a funnel to a paid family product, or to school sales?** They imply different
   slices. A school funnel wants the teacher-impressive content visible; a family funnel wants the
   child-sticky content visible. The §4.2 slice leans school-funnel.
4. **Does a free child's data migrate if their school later buys?** Technically feasible — it is a
   `class_id` and `teacher_id` change — but it needs a consent story, because the data was collected
   under parental consent and would move into a school context.
5. **Two children per account: per account or per email?** Same thing until someone makes a second
   account with a plus-address. Probably fine to ignore at launch, worth knowing you are ignoring it.
