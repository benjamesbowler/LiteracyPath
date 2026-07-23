# LiteracyPath full product critique

**Audit date:** 23 July 2026  
**Scope:** student, teacher, admin-adjacent reporting, curriculum/content, educational design, UX, UI, accessibility, assessment logic, reporting, backend, security, performance, architecture, QA, and release operations.  
**Verdict:** **Promising and substantially built, but not yet ready to be described as fully production-ready for a broad school rollout.** The student product is visually strong, the core data model has thoughtful safeguards, and the automated unit-test base is excellent. The largest remaining risks are curriculum variation/readiness, a fragmented teacher experience, incomplete report/export surfaces, performance, and release gates that do not currently protect the whole product.

## How to read this audit

This report contains **exactly 10 product areas and 10 recommendations in each area: 100 recommendations total**.

- **Observed** means directly seen in the running app, source, SQL, or named check output.
- **Derived** means calculated or concluded from multiple observed facts.
- **Inferred** means a product/usability risk that should be validated with real teachers or children.
- **P0** blocks a broad launch; **P1** should be fixed before scaling; **P2** is an important improvement; **P3** is polish or longer-term work.

### Important limitation

The public entry, student login, student home preview, Guided Reading preview, Sound Racer preview, creature builder, and teacher authentication screen were inspected live. The authenticated teacher workspace could not be exercised with real class data because no audit account was available. Teacher findings are therefore based on the rendered route wiring, component code, data contracts, SQL, existing automated checks, and the accessible pre-authentication UI. A seeded teacher audit account should be added to close this final evidence gap.

## Executive scorecard

These scores are product judgments, not empirical learning-effectiveness scores.

| Area | Score | Summary |
|---|---:|---|
| Student visual experience | 8.0/10 | Warm, distinctive, child-appropriate, and consistently illustrated. |
| Student UX and navigation | 6.5/10 | Clear individual screens, but the home gives young learners too many equal choices and too little next-step guidance. |
| Curriculum correctness | 7.5/10 | The active question integrity gate is strong; breadth, media readiness, and runtime variation are not. |
| Educational/adaptive logic | 6.0/10 | Substantial evidence infrastructure exists, but several teacher conclusions rely on simplistic thresholds or opaque aggregation. |
| Teacher workflow | 5.0/10 | Useful roster mechanics exist, but navigation is fragmented and the intended teacher command center is not the route being rendered. |
| Reporting and exports | 5.0/10 | Rich underlying data, but incomplete EL/report contracts, truncation, and insufficient class-first insight block confidence. |
| Backend/data integrity | 8.0/10 | Strong RLS direction, security-definer RPCs, progress merging, and extensive unit coverage. |
| Security/privacy readiness | 6.5/10 | Good baseline controls; dependency, child-leaderboard, retention, rate-limit, and monitoring work remains. |
| Reliability and QA | 8.0/10 | 955 unit tests and 8 smoke tests passed; whole-product release gates and authenticated end-to-end coverage lag. |
| Performance/architecture | 5.0/10 | Very large bundles, a 9,399-line application shell, duplicate teacher implementations, and ineffective splitting increase risk. |

## Highest-priority launch blockers

1. Close the curriculum readiness gap: the strict audit found only **9 of 30** audited skill groups ready, **566** additional questions needed, **384** media-wiring fixes, and **876** runtime-variation failures.
2. Consolidate the two teacher dashboard implementations and make validators test the dashboard the app actually renders.
3. Fix the failed teacher report/export contract for **EL Formal Assessments**.
4. Stop truncating mastered-item lists in the finished student report.
5. Add effective bundle thresholds and reduce the 1.15 MB raw main JavaScript entry plus several 1.5–1.8 MB data chunks.
6. Resolve the two high-severity dependency advisories and review the old ExcelJS chain.
7. Eliminate the 16 React hook warnings in core learning flows.
8. Add authenticated teacher, report, assessment, and database-policy tests to CI.
9. Add privacy-preserving production error monitoring and operational recovery procedures.
10. Run structured usability pilots with teachers and children before treating inferred UX and educational judgments as settled.

---

## Area 1 — Student content and educational quality

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P0 · Observed** | The strict production-readiness audit classifies only **9 of 30** skill groups as ready. Valid questions exist, but many skill groups lack the volume or approved media required by the stricter release standard. | Define one canonical “student-selectable and release-ready” standard, then block publication per skill until question count, balance, media, and accessibility requirements all pass. |
| 2 | **P0 · Observed** | `check:assessment-runtime-variation` reports **876 failures**, concentrated in initial sounds (438), short-vowel discrimination (141), final sounds (137), and CVC short vowels (107). Children can encounter excessive repetition even when each item is technically correct. | Add runtime diversity budgets by round: cap repeated image, word, distractor, phoneme, and template use; test the actual selection algorithm over many seeded sessions. |
| 3 | **P0 · Observed** | The strict audit reports **28 skill groups with missing audio**, **22 with missing images**, and **384 media-wiring fixes**. | Create a per-skill media completion board with named owners, source/license, review status, pronunciation variant, and automated checks that verify runtime resolution—not just manifest presence. |
| 4 | **P1 · Observed** | Initial Sounds passes quantity but is marked weak because of letter/item imbalance and an over-dominant `listen_and_find` pattern. | Rebalance phoneme frequency and interaction types; publish maximum-concentration limits so no letter, prompt family, or response format dominates a level. |
| 5 | **P1 · Observed** | `check:skill-progression` emits **55 warnings**, including repeated IDs/words and underfilled digraph and vocabulary selections. | Turn repetition and underfill warnings into failures for release-managed skills, with explicit exceptions only where deliberate spaced retrieval is documented. |
| 6 | **P1 · Observed** | The integrity audit finds **287 active candidates blocked by unapproved audio**. This is good safety behavior, but it means authored breadth is not the same as usable breadth. | Show “authored / approved / runtime-selectable” counts separately in admin content QA so curriculum owners can see the real student inventory. |
| 7 | **P2 · Observed** | Guided Reading exposes internal metadata such as `level-c`, `moonwood-tales`, and `longer-story-pages` directly beneath the child-facing title. | Replace implementation labels with a child-friendly level badge or remove them from student mode; retain full metadata only for teachers/admins. |
| 8 | **P1 · Observed** | Guided Reading validation passes with 176 approved active books, but the integrity check still flags one page image for replacement: *Shy Comes Out to Play*, page 9. | Replace the asset, rerun the visual/media audit, and require zero unresolved active-book image flags before release. |
| 9 | **P2 · Inferred** | “Tap words to hear them” is useful, but the reader does not visibly explain what happens after repeated word taps or how support fades as fluency grows. | Add a deliberate decoding-support ladder: whole-word audio, segmented/phoneme support where appropriate, reread prompt, and teacher-visible support-use evidence—without cueing from pictures or context. |
| 10 | **P1 · Inferred** | Automated correctness and coverage do not establish that sequencing, feedback, difficulty, and transfer produce learning gains for ages 4–7 or multilingual learners. | Run expert curriculum review plus a small pre/post pilot. Track accuracy, latency, retention, transfer to unseen items, support use, and subgroup outcomes; revise content from that evidence. |

## Area 2 — Student UX, navigation, and motivation

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P1 · Observed/Inferred** | Student home presents seven substantial destinations plus a daily mission and “Keep playing.” For a 4–7-year-old, too many equal-weight choices can shift attention from the intended learning sequence. | Make one recommended next activity dominant, show two secondary choices, and place the full catalogue behind “More to explore.” |
| 2 | **P1 · Observed** | “Keep playing” does not name the activity, skill, or remaining goal. | Change it to a specific continuation CTA such as “Continue Sound Seekers — 2 trails left,” including the expected duration or progress. |
| 3 | **P1 · Observed** | The daily mission appears as small text near the bottom of the rail and shows `0 of 3 complete`; it competes poorly with large illustrated cards. | Promote the mission into the main content hierarchy, celebrate each step, and let its primary button launch the next required task directly. |
| 4 | **P1 · Observed** | Home cards do not expose recent progress, mastery, assignment state, or why an activity is recommended. | Add one simple state per card: “New,” “Continue,” “Teacher picked,” or a short progress marker. Avoid exposing raw scores to children. |
| 5 | **P2 · Inferred** | The persistent rail improves consistency, but most labels still require confident reading: Sound Seekers, Adventure Map, Story Quests, Reading Library. | Pair each destination with optional spoken labels, stable icons, and a teacher-controlled reduced-choice mode for emerging readers. |
| 6 | **P1 · Observed/Inferred** | Student login has a good three-step model and large controls, but recovery from an invalid/expired class code or unavailable network needs to be exceptionally concrete for children. | Use illustrated, spoken error states; preserve the entered code; distinguish “code not found,” “offline,” and “ask your teacher”; never rely on generic red text alone. |
| 7 | **P3 · Observed** | The student login panel leaves a very large unused lower region and strands “I am a teacher” at the bottom-left. | Tighten the panel height, keep the teacher escape visible but subordinate, and use the recovered space for one visual example of a class code. |
| 8 | **P2 · Observed** | Guided Reading gives five similarly styled top controls—Read Page, Read Whole Book, page count, Full Screen, Back—before the reading begins. | Make “Read Page” the primary support, convert page count to non-button status, and group Full Screen/Back as secondary utilities. |
| 9 | **P2 · Observed** | Sound Racer’s tutorial demonstrates **S → sun** while the active level behind it targets **J**. The example is valid but creates a needless context switch. | Generate the tutorial example from the current target sound and include audio; keep the motor-control instruction separate from the phonics example. |
| 10 | **P1 · Observed** | The creature builder’s close button has the accessible name “Close Sound Seekers,” although the screen is “Make your creature.” | Derive accessible labels from the active surface and add semantic assertions for every fullscreen modal/game overlay. |

## Area 3 — Student UI, visual design, and accessibility

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P2 · Observed** | The visual system is attractive and distinctive, but layout density varies sharply: the student login is sparse while home and game screens are information-rich. | Define child-surface density rules for title, instruction, choices, progress, and one primary action; audit every route against them. |
| 2 | **P2 · Observed** | Illustration quality is a major strength, but content images and UI chrome sometimes carry equal visual weight. | Establish an image hierarchy: instructional evidence first, reward/world art second, decorative art last. Apply consistent framing and loading placeholders. |
| 3 | **P0 · Observed** | Axe coverage is limited to the student-entry page and selected Quest tests; it does not systematically cover student home, assessments, Guided Reading, reports, or authenticated teacher pages. | Add serious/critical Axe gates for every primary route and key modal state at desktop and mobile breakpoints. |
| 4 | **P1 · Inferred** | Fast motion, timers, 3D scenes, audio, and game feedback can overload some learners even when `prefers-reduced-motion` is respected. | Add in-product accessibility settings for reduced effects, untimed/extended response, lower audio intensity, narration, and simplified backgrounds. Persist them per learner. |
| 5 | **P1 · Inferred** | The dark Sound Racer overlay and dimmed locked creature options should be verified for text, focus, and disabled-state contrast under real displays. | Run WCAG contrast and visible-focus checks on all game overlays, disabled options, badges, and low-opacity text; test high-contrast mode. |
| 6 | **P1 · Observed** | Smoke tests cover desktop/mobile entry and selected routes, but the complete student journey is not visually tested across small phone, tablet, Chromebook, and projector-sized displays. | Add a device matrix with screenshot diffs and overflow/tap-target assertions for every student route, orientation, keyboard state, and fullscreen transition. |
| 7 | **P2 · Observed/Inferred** | Guided Reading uses large readable type, but fixed wide text blocks can create long saccades and uneven empty space across pages. | Constrain line length by reading level, support optional line focus/highlighting, and tune image/text ratios per book template rather than one universal split. |
| 8 | **P2 · Observed** | Locked creature items are substantially dimmed and show only a number, which may not clearly communicate that the number is a coin cost. | Pair cost with the coin icon and a spoken/visible explanation such as “20 coins — earn 12 more,” while maintaining disabled-state contrast. |
| 9 | **P2 · Observed** | Student home uses several large cards with similar CTA treatment; visual polish does not yet communicate learning priority. | Reserve the strongest scale/color/motion for the recommended learning action, then reduce emphasis progressively for free-choice and reward areas. |
| 10 | **P1 · Derived** | The app relies heavily on imagery and audio, so missing, late, or failed media is not merely cosmetic—it can invalidate a question. | Require meaningful alt/accessibility names where images carry evidence, mark decoration explicitly, and provide question-safe fallback behavior that removes an item rather than guessing. |

## Area 4 — Assessment, adaptivity, logic, and reasoning

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P1 · Observed** | Teacher “reteach” suggestions use `accuracy < 70` with no visible minimum-attempt rule or confidence estimate. A child can be classified from too little evidence. | Require minimum evidence, recency, and confidence before a reteach flag; otherwise label the state “Not enough evidence.” |
| 2 | **P1 · Observed** | The 70% threshold is hard-coded at the presentation layer, separating pedagogical policy from the evidence engine. | Centralize thresholds and progression rules in a versioned policy module, document their instructional rationale, and store the policy version with each conclusion. |
| 3 | **P1 · Observed** | Class average accuracy appears to average student percentages, even though students may have very different attempt volumes and content difficulty. | Show both learner-weighted and response-weighted summaries, include evidence counts, and avoid a single class average when comparability is weak. |
| 4 | **P1 · Inferred** | Students and teachers receive recommendations without a plain-language explanation of which evidence caused the recommendation. | Add “Why this next?” explanations: recent evidence, skill dependency, confidence, and what successful practice will unlock. Keep child wording brief and teacher wording precise. |
| 5 | **P1 · Observed** | Lint reports **16 React hook/dependency warnings**, including nine in the 9,399-line `App.jsx` and warnings in Guided Reading and Adventure Game. Stale closures can corrupt timing, state, or adaptivity. | Resolve every hook warning, add `--max-warnings=0`, and introduce focused regression tests for each corrected effect/callback. |
| 6 | **P0 · Observed** | `check:release-readiness-surface` fails because the finished student report truncates mastered-item lists instead of rendering the full evidence set. | Remove the truncation for formal reports/exports; keep collapsible summaries only in the interactive UI and state clearly when any display is abbreviated. |
| 7 | **P1 · Observed** | Engagement logging intentionally swallows RPC failures. This protects play, but “Active today” and mission/streak conclusions can silently become incomplete. | Keep the child flow non-blocking, but queue failed events, expose sync health to teachers/admins, and alert operations when event-loss rates exceed a threshold. |
| 8 | **P0 · Derived** | The question-integrity check passes with zero active integrity failures, while strict readiness and runtime variation fail badly. Multiple “green” definitions obscure the real release state. | Create one composed curriculum gate with separate correctness, depth, variation, media, and runtime-selectability dimensions; require all dimensions for release. |
| 9 | **P0 · Observed** | Teacher dashboard/report checks fail because the expected **EL Formal Assessments** surface is missing from the live teacher product contract. | Add the formal EL report workflow to the reachable teacher report route, including saved reports, evidence scope, PDF/Excel output, and deletion/retention behavior. |
| 10 | **P1 · Inferred** | There is no cited external calibration showing that mastery labels, difficulty steps, timing rules, or multilingual-learner interpretations are reliable and fair. | Validate item difficulty and decision thresholds with literacy specialists and real response data; monitor false-positive reteach, subgroup performance, and differential item behavior. |

## Area 5 — Teacher workflow and information architecture

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P1 · Observed** | The teacher rail contains nine top-level destinations: Dashboard, Student Page, Checkpoints, EL Checks, Guided Reading, Story Quests, Present, Worksheets, and Reports. It reflects system modules more than teacher jobs. | Reduce the primary model to roughly five intentions: Today, Classes, Assess, Progress, and Plan/Resources; nest tools contextually. |
| 2 | **P0 · Observed** | The current teacher dashboard is a roster/class manager, not the “Today” briefing described in the repo’s teacher UX specification. | Make the landing screen answer: who needs attention, what is due, what changed, and what can I do next—with direct actions. |
| 3 | **P1 · Observed** | Reports, assessments, reading, and child surfaces generally require selecting a student first, making class-level review and group instruction cumbersome. | Make class the persistent context; allow drill-down from class → group → student without repeatedly loading a learner into the whole app shell. |
| 4 | **P0 · Observed** | `AdminDashboardPage.jsx` contains a 2,000-line-plus `dashboardMode === "teacher"` experience, but `App.jsx` only renders it with `dashboardMode="admin"`; the live teacher route uses `TeacherDashboardPage.jsx`. | Choose one teacher product, migrate needed features into it, delete the unreachable branch, and make route-level tests prove which component renders. |
| 5 | **P1 · Observed/Inferred** | Empty states explain class/student setup, but onboarding is oriented toward data entry rather than reaching the first meaningful assessment or assignment quickly. | Add a setup checklist with completion, sample/demo data, and a guided “create class → add/import learners → set login → run first check” path. |
| 6 | **P1 · Observed** | The roster supports adding one learner but lacks obvious import, search, sort, filter, grouping, move, archive, and bulk actions needed by real classes. | Add CSV/SIS-ready import, duplicate handling, search/sort, instructional groups, bulk login-card generation, and safe archive/transfer workflows. |
| 7 | **P2 · Observed** | Copying a class code has no visible success confirmation, while regeneration uses the browser’s native `confirm`. | Use an accessible toast for copy and an in-product confirmation dialog that states the impact, requires deliberate confirmation, and reports success/failure. |
| 8 | **P1 · Observed** | Printing login cards opens a new window and writes raw HTML with `document.write`, which is brittle and complicates security policy. | Generate a proper printable route or PDF with page sizing, preview, accessibility, school/class context, and tests—without runtime document injection. |
| 9 | **P2 · Observed/Inferred** | “Student Page” places a teacher inside child-facing navigation; the system must preserve teacher context and avoid accidental progress changes. | Add a persistent, unmistakable “Previewing as…” banner, disable writes by default, and provide one-click return to the exact teacher context. |
| 10 | **P1 · Inferred** | Suggested actions can filter a roster or assign practice, but there is no complete intervention loop: plan, deliver, record, review, and follow up. | Turn suggestions into trackable actions with owner, date, learner group, activity, outcome, and next review; surface overdue or ineffective interventions on Today. |

## Area 6 — Teacher UI, visual design, and operational usability

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P0 · Observed** | There is no seeded audit/demo account, so the most important teacher screens cannot be visually or interactively verified without live credentials. | Maintain a non-production seeded school/class account with synthetic learners for design review, automated tests, sales demos, and support reproduction. |
| 2 | **P1 · Observed/Inferred** | The main roster table has seven columns with nested progress, Sound Seekers, login, activity, and action controls. It is likely too dense on smaller teacher devices. | Provide a scannable default table with configurable columns and a detail drawer; verify real responsive behavior on Chromebook and tablet. |
| 3 | **P2 · Observed** | A “Question type guide” sits below the operational roster, mixing training documentation with daily work. | Move explanations into contextual help, an onboarding tour, or a searchable teacher guide; keep the dashboard focused on decisions. |
| 4 | **P1 · Inferred** | Summary metrics and action cards are useful, but they compete with class-code setup and roster controls without a strong task hierarchy. | Order the page by urgency: blockers/setup, Today actions, class pulse, then roster management; collapse rarely used administration. |
| 5 | **P1 · Observed** | Several actions are best-effort or asynchronous, yet feedback patterns are inconsistent: clipboard, sync, print pop-up failure, loading, and exports. | Standardize pending/success/error/undo states and announce them to assistive technology; never leave teachers guessing whether a write completed. |
| 6 | **P1 · Observed/Inferred** | Terms such as accuracy, mastered, active today, started, current skill, and trails are shown without consistent definitions or evidence windows. | Add concise tooltips/data definitions with denominator, date range, minimum evidence, and update time; include them in exports. |
| 7 | **P0 · Observed** | Automated accessibility coverage does not include the authenticated teacher workspace, complex roster, dialogs, charts, or report/export flows. | Add keyboard-only, screen-reader landmark/name, focus-trap, table, chart alternative, and Axe tests to the seeded teacher journey. |
| 8 | **P2 · Observed** | “Checkpoints,” “EL Checks,” “Assessment,” “Advanced Phonics,” and “Reports” overlap conceptually and can force teachers to learn internal taxonomy. | Use teacher-tested language and one assessment hub; distinguish universal benchmark, diagnostic follow-up, progress monitoring, and practice. |
| 9 | **P1 · Inferred** | Empty states are thoughtfully written, but partial-data, permission, sync-delay, deleted-student, and stale-session states need equivalent care. | Design and test a complete state matrix for every teacher surface: loading, empty, partial, offline, denied, conflict, expired, and retry success. |
| 10 | **P1 · Derived** | Teacher UI exists across `TeacherDashboardPage`, the unreachable teacher branch in `AdminDashboardPage`, reports in `AppPages`, and app-level overlays, encouraging visual and interaction drift. | Consolidate shared teacher primitives, tokens, charts, tables, filters, dialogs, and page shells into a documented design system with visual regression coverage. |

## Area 7 — Reporting, insight, and exports

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P0 · Observed** | Both `check:teacher-dashboard-data` and `check:product-finish-surface` fail on the missing **EL Formal Assessments** report/export surface. | Implement and route the section in the actual teacher workspace, then make checks render and interact with it rather than search source strings. |
| 2 | **P0 · Observed** | Finished reports fail the release gate because mastered items can be truncated. This can produce an incomplete formal record. | Export the complete evidence list, clearly separate summary from appendix, and test high-volume students for pagination and completeness. |
| 3 | **P1 · Observed** | The live teacher dashboard emphasizes per-student actions, while the richer class reports appear in the unreachable teacher-mode admin branch. | Build a reachable class-first Progress area with distribution, coverage, groups, outliers, and drill-down to learner evidence. |
| 4 | **P1 · Derived** | Accuracy and mastery can be displayed without attempt count, item diversity, recency, confidence, or support use, inviting overinterpretation. | Every conclusion should expose its evidence basis and label low-confidence states; report “insufficient evidence” instead of a misleading percentage. |
| 5 | **P1 · Inferred** | Current summaries lean toward status snapshots rather than growth trajectories. | Add time-series views for skill acquisition, retention, fluency, support dependence, and intervention response, with curriculum-version markers. |
| 6 | **P2 · Inferred** | Teachers need flexible instructional groups, but class reporting does not visibly support saved cohorts or comparisons. | Let teachers create/save groups from transparent criteria, compare their evidence, assign follow-up, and review group movement without ranking children publicly. |
| 7 | **P1 · Inferred** | Reports identify needs but do not consistently close the loop into a planned instructional response. | Place “Assign practice,” “Plan small group,” “Print resource,” and “Record observation” beside each actionable insight, then measure follow-up. |
| 8 | **P2 · Derived** | Learner progress is merged across local/cloud state and content evolves, but long-term reports need a stable interpretation of historical evidence. | Store assessment/content/policy versions and preserve immutable raw evidence so past results remain explainable after curriculum changes. |
| 9 | **P1 · Inferred** | Exports need clear provenance for school use; current code includes multiple PDF/Excel paths and locally saved report state. | Include school/class, learner ID policy, generated timestamp/timezone, filters, evidence window, app/content version, definitions, and privacy classification in every export. |
| 10 | **P2 · Inferred** | One report cannot serve classroom diagnosis, leadership review, and family communication equally well. | Create distinct teacher diagnostic, class/leadership summary, and family-friendly reports; keep child labels strengths-based and action-oriented. |

## Area 8 — Backend, data security, privacy, and compliance readiness

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P1 · Observed** | Supabase migrations show thoughtful RLS and security-definer RPCs, including fixes for class-code enumeration and teacher-only password setup, but most policy paths lack automated integration tests against a real database. | Add database tests for teacher A/teacher B isolation, anon child login, expired/rotated codes, student-token scope, admin-only access, deletes, and every security-definer function. |
| 2 | **P0 · Derived from SQL** | The school leaderboard path appears callable by `anon` and returns student names scoped by a school identifier obtainable during class lookup. Even if intentional, this can expose children beyond their class. | Require a valid student token, default to pseudonyms, scope to class unless explicitly enabled, add teacher opt-in, and commission a privacy/security review of the live RPC. |
| 3 | **P1 · Observed/Derived** | Six-character class codes have useful entropy and can be rotated, but no application-level rate limit, expiry, or abuse monitoring was evident in the inspected path. | Add per-IP/device/code throttling, short lockouts, anomaly alerts, optional expiry, and a teacher-visible access log without collecting unnecessary child data. |
| 4 | **P1 · Observed** | Vercel sets HSTS, `nosniff`, frame denial, referrer, permissions, and cache headers, but no Content Security Policy is present. | Introduce a report-only CSP, remove blockers such as injected print HTML/eval-dependent libraries, then enforce a nonce/hash-based policy plus relevant cross-origin policies. |
| 5 | **P0 · Observed** | Live `npm audit` reports **5 vulnerabilities: 2 high and 3 low**. High issues include `brace-expansion` in the development chain and `tmp@0.1.0` through direct `exceljs@3.4.0`; fixes are available. | Upgrade/replace affected dependencies, verify exports, rerun build/tests/audit, and add production plus development dependency scanning to CI with a documented exception process. |
| 6 | **P1 · Observed** | Crash logging is a 20-entry localStorage ring buffer surfaced to admin; there is no privacy-preserving remote error service. Failures on a child device can disappear with that device. | Add redacted production error monitoring with release IDs and no child names/answer content; define sampling, retention, alerting, and consent/privacy treatment. |
| 7 | **P1 · Not evidenced** | No tested backup, restore, disaster-recovery, or accidental-deletion procedure was found in the inspected product controls. | Document RPO/RTO, enable verified backups, rehearse restore into an isolated environment, and test recovery of classes, evidence, and report history. |
| 8 | **P1 · Observed** | The privacy policy offers access/deletion by personal email but no in-product workflow, request tracking, identity verification process, or stated deletion SLA. | Add teacher/admin export and deletion controls, a documented parent/school request workflow, verification steps, audit trail, and a clear response/deletion timeline. |
| 9 | **P1 · Observed/Inferred** | Retention is “as long as the account is active and the school wishes,” which is flexible but not operationally specific. | Add configurable school retention, inactive-account cleanup, end-of-year archive/delete, subprocessors/region disclosure, and deletion propagation/backup expiry rules. |
| 10 | **P0 before school-scale launch · Observed** | The privacy page itself says it is a draft requiring legal review. A privacy policy alone does not complete COPPA/FERPA/UK GDPR or school procurement readiness. | Obtain qualified legal/privacy review; prepare terms, DPA, subprocessor list, security summary, accessibility statement, incident process, and school/parent consent materials appropriate to target regions. |

## Area 9 — Performance, reliability, and architecture

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P1 · Observed** | The build succeeds but the main entry is about **1,148 kB raw / 242 kB gzip**, before the many large lazy/data chunks. | Set route budgets, inspect the bundle graph, remove unused dependencies/code, and make first-load student/teacher shells load only their required surface. |
| 2 | **P1 · Observed** | Generated HFW, skill-gap, and language question chunks are roughly **1.56 MB, 1.64 MB, and 1.84 MB** raw; several other chunks are 0.6–1.05 MB. | Split banks by skill/level, load on demand, compress/normalize data, and consider server/query-backed delivery where offline requirements allow. |
| 3 | **P1 · Observed** | Vite reports five ineffective dynamic imports because the same question modules are also statically imported through `masterWordLexicon.js`. | Remove the static dependency path or create clean boundaries so code splitting is real; add a build assertion that catches split points pulled back into the entry graph. |
| 4 | **P1 · Observed** | The export chunk includes an ExcelJS dependency that triggers a direct-eval warning and carries an old vulnerable `tmp` dependency. | Upgrade or replace ExcelJS, isolate export code behind deliberate user action, and verify CSP-compatible generation and large-report memory use. |
| 5 | **P1 · Observed** | `src/App.jsx` is **9,399 lines** and coordinates routing, auth, data fetching, sync, assessment, reports, student/teacher shells, and many transitions. | Extract bounded feature controllers/services and route components incrementally, protected by existing tests; keep state ownership explicit rather than performing a wholesale rewrite. |
| 6 | **P0 · Observed** | Reachable and unreachable teacher dashboards implement overlapping product concepts, while checks inspect the wrong one. This is both product and reliability debt. | Consolidate implementation and tests around one route/component contract; delete dead behavior after parity is proven. |
| 7 | **P2 · Observed/Derived** | Navigation is driven largely by a single in-memory `appView` state rather than a true URL router, limiting deep links, browser history, refresh restoration, and support reproducibility. | Introduce stable URLs for major teacher/admin/report routes and safe student resume routes; migrate gradually with route/state tests. |
| 8 | **P1 · Derived** | The main client coordinates direct Supabase calls and large untyped data shapes across components, making contract drift easier. | Create typed domain/service boundaries for auth, classes, evidence, reports, and content; validate RPC payloads/responses and version stored schemas. |
| 9 | **P1 · Observed** | Local error recovery is thoughtful, but a local-only crash recorder cannot establish fleet-wide error rate, affected release, or device-specific regressions. | Pair error boundaries with redacted remote monitoring, health dashboards, source maps, release tags, and an error budget. |
| 10 | **P1 · Observed/Derived** | Offline progress merge and Quest telemetry are unusually well developed and tested, but operational sync failures are mostly invisible and activity events can be dropped. | Add end-to-end multi-device conflict tests, queued-event durability, sync status, reconciliation metrics, and chaos tests for refresh/offline/token expiry during writes. |

## Area 10 — QA, content operations, and release readiness

| # | Priority / evidence | Critique | Recommendation |
|---:|---|---|---|
| 1 | **P0 · Observed** | CI runs lint, unit tests, build, and many Quest-specific gates, but it does not run the failing teacher-data, product-finish, release-readiness, runtime-variation, strict curriculum, dependency, or hygiene checks. | Add a whole-product required CI job. A release must fail when any launch-critical teacher, curriculum, report, security, or performance gate fails. |
| 2 | **P0 · Observed** | Several named product gates currently fail locally, yet the build and current CI-shaped checks can remain green. | Establish one `check:release` command that composes the authoritative gates and emits a single machine-readable release manifest. |
| 3 | **P1 · Observed** | Lint exits successfully with **16 warnings**. Warnings in core effects are treated as advisory even though they can alter behavior. | Fix the warning backlog and make CI use zero-warning enforcement. Allow narrowly documented suppressions only with a regression test. |
| 4 | **P1 · Observed** | `check:bundle-size` passes while reporting a 1.15 MB main entry and multiple multi-megabyte chunks; it inventories rather than protects. | Set gzip and raw thresholds per entry/route, fail on regression, and publish trend data in pull requests. |
| 5 | **P2 · Observed** | `check:repo-hygiene` reports **26 failures and 72 warnings**, but it flags intentional root preview harnesses used by smoke tests and outputs generated by audit tools. | Define approved fixture/output locations, baseline intentional files explicitly, and make hygiene findings actionable rather than noisy. |
| 6 | **P2 · Observed** | Some audit scripts mutate tracked/untracked documentation as a side effect and then hygiene checks flag those generated artifacts. | Separate read-only check mode from explicit report-generation mode; CI checks should write only to a temporary/artifact directory. |
| 7 | **P1 · Observed** | **955/955 unit tests** and **8/8 smoke tests** passed, but there is no complete browser journey for a seeded teacher: login → class → learner → assessment → report → export. | Add deterministic authenticated end-to-end journeys with synthetic data, including permission separation, errors, offline recovery, and export verification. |
| 8 | **P0 · Observed** | Accessibility gates cover too little of the product and do not include the teacher dashboard/reports or most student learning flows. | Make an accessibility route/state inventory, automate serious/critical checks, and schedule manual screen-reader, switch/keyboard, zoom, audio, motion, and child usability audits. |
| 9 | **P1 · Derived** | Content quality is governed by several partially overlapping checks whose results can conflict: integrity green, strict readiness red, runtime variation red. | Version one content schema and one release rubric; show per-skill status, reason, owner, waiver, and exact student exposure in an admin QA console. |
| 10 | **P1 · Inferred** | Technical gates cannot reveal whether teachers understand the data or whether children can independently navigate and learn. | Run recurring observation sessions with representative teachers, ages, reading levels, multilingual learners, and accessibility needs; convert findings into owned release criteria. |

---

## Verification evidence

### Checks that passed

| Check | Result |
|---|---|
| `npm test` | **955/955 unit tests passed**. |
| `npm run build` | Production build passed; Vite reported large chunks and ineffective dynamic imports. |
| `npm run test:smoke` | **8/8 Playwright smoke tests passed** after allowing the local test server. |
| `npm run validate:guided-reading` | Passed: 176 active approved books, 23 disabled candidates, 138 disabled pages. |
| `npm run validate:guided-stories` | Passed: 100 fiction + 76 nonfiction active, zero drafts. |
| `npm run check:assessment-question-integrity` | Passed: 7,471 active candidates and zero active correctness/integrity failures; 287 blocked by unapproved audio; one Guided Reading image replacement flagged. |
| `npm run check:bundle-size` | Exited successfully, but did not enforce meaningful thresholds. |
| `npm run check:skill-progression` | Exited successfully with 55 warnings. |
| `npm run lint` | Exited successfully with 16 React hook/dependency warnings; this is not a clean lint result. |

### Checks that failed or exposed blockers

| Check | Result |
|---|---|
| `npm run check:teacher-dashboard-data` | Failed: teacher Reports lacks required EL Formal Assessments contract. |
| `npm run check:product-finish-surface` | Failed on the same missing EL Formal Assessments surface. |
| `npm run check:release-readiness-surface` | Failed: finished report truncates mastered-item lists. |
| `npm run check:assessment-runtime-variation` | Failed with 876 runtime variation failures. |
| `node tools/auditAllSkillsStrictProductionReadiness.js` | Only 9/30 ready; 566 questions and 384 media-wiring fixes reported. |
| `npm run check:repo-hygiene` | Failed with 26 failures and 72 warnings; the signal is partly polluted by intentional previews and generated audit output. |
| `npm audit --json` | Failed with five advisories: two high, three low, zero critical. |

## Architectural evidence behind the teacher-dashboard finding

- `src/App.jsx` renders `AdminDashboardPage` only with `dashboardMode="admin"` and separately renders `TeacherDashboardPage` for the teacher dashboard.
- `src/components/AdminDashboardPage.jsx` nevertheless contains a large `dashboardMode === "teacher"` branch with reports, exports, Guided Reading, assessments, and related sections.
- `tools/checkTeacherDashboardDataContracts.js` inspects `AdminDashboardPage.jsx` source strings rather than exercising the reachable teacher route.
- This allows unreachable teacher code to satisfy most checks while the real teacher surface remains less complete. The immediate fix is not another string token; it is route consolidation plus interaction-level contract tests.

## Recommended delivery sequence

### Phase 1 — Release truth and child safety (immediate)

Unify the release command; fix report completeness and EL exports; secure the leaderboard; resolve high dependencies; make strict content, runtime variation, accessibility, and teacher route checks blocking.

### Phase 2 — Teacher product consolidation

Choose one teacher dashboard, build the Today/Class/Assess/Progress workflow, create seeded synthetic data, add authenticated browser/database tests, and complete class-first reports.

### Phase 3 — Curriculum depth and variation

Close questions/media gaps by skill, enforce runtime diversity, replace flagged assets, calibrate thresholds, and run expert plus classroom pilots.

### Phase 4 — Scale, polish, and operations

Split bundles, reduce `App.jsx`, add production monitoring and recovery drills, formalize privacy/compliance materials, and establish continuous teacher/child usability research.

## Bottom line

LiteracyPath is not a thin prototype. The student world has real character, the reading/game surfaces are often excellent, offline/progress handling is unusually thoughtful, and the test count reflects substantial engineering effort. The central issue is **release truth**: several green checks prove local correctness while the real product still has incomplete curriculum readiness, runtime repetition, an unreachable teacher implementation, and failed reporting contracts. Consolidating those definitions and the teacher architecture will create more value than adding another feature.
