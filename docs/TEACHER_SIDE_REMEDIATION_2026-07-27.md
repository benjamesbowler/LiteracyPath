# Teacher-side remediation — 2026-07-27

A **record** of the remediation that followed
[Teacher-side audit and fixes — 2026-07-27](TEACHER_SIDE_AUDIT_AND_FIXES_2026-07-27.md).
It describes the current worktree on this date. It is not a standard and must
not be used to override a later standard.

## Status at the time of this record

**The implementation is broad, but the release claim is still open.** The
teacher remediation now records D-076 through D-151 in
[DISCOVERED](release/DISCOVERED.md); all 76 rows remain `IN-PROGRESS` in
[TRACEABILITY](release/TRACEABILITY.md). The current worktree contains a
concrete fix and focused regression contract for every listed row. None has
yet earned `DONE` because the final integrated unit/build checks, fresh local
database rebuild, complete authenticated browser pass, and final adversarial
re-audit have not all completed against one settled tree.

This distinction is intentional. A source change or focused green test is not
the same claim as a working teacher product.

The earlier dated audit was not edited. Its observations remain the record of
what was true at that point.

---

## Product decisions applied

These are the decisions used to judge the remediation:

1. Teacher-facing language uses **student / students** and **assessment /
   assessments**. This follows the owner's explicit direction and is now
   written into the living
   [app copy standard](APP_COPY_STANDARD_2026-07-25.md). The earlier
   child/check wording no longer governs teacher surfaces.
2. The teacher product has six plain sections: **Dashboard, Students,
   Assessments, Reports, Resources, Settings**.
3. Everyday reporting is short and actionable. It answers what the student has
   met, how many times, how many were correct, and what to teach next.
4. Everyday reports separate **Overview, Skills, High-frequency words, and
   Essential Literacy**. The formal EL assessment remains the detailed
   standalone school record.
5. Learning status and raw accuracy are different claims. The shared status
   vocabulary is **Secure, Developing, Needs support, Not enough results, Not
   checked**.
6. Missing, failed, truncated, stale, or construct-mismatched evidence never
   becomes zero, inactivity, mastery, or a recommendation.
7. Privacy deletion is not complete until active-system deletion and
   browser-local cleanup have both been verified.

---

## Findings and remediation map

| ID | Root mechanism found | Remediation observed in the current worktree | Closure gate |
| --- | --- | --- | --- |
| D-076 | Reporting mixed date windows, repeat variants, qualitative flags, aliases, and distinct HFW constructs. | One evidence-policy path now owns independent attempts, recency, construct identity, aliases, counts, and status. Exact values are withheld when the source does not contain them. | Reporting-policy units plus authenticated individual and class report journeys. |
| D-077 | Reset and deletion had several destructive side paths and could declare completion before local cleanup. | Scoped practice reset, session revocation, shared-row redaction, insert idempotency, deletion tombstones, direct-delete denial, and staged database/local completion are present. | Fresh-database reset/deletion, policy, sync-chaos, and data-rights gates. |
| D-078 | Routine teaching, administration, privacy, settings, and dense reports competed on long pages. | Urgency-first Dashboard, ten-student roster pages, focused student details, matching funnels, separated settings, class-aware Resources, and simpler reports are present. | Authenticated six-section E2E, a11y, and responsive browser critic. |
| D-079 | Failed/truncated reads became empty arrays and therefore false zeros; profile timestamps counted as learning. | Required-source completeness, prior-complete preservation, stale-response rejection, real-activity-only dates, and recommendation suppression are present. | Loading/model units and authenticated recovery journeys. |
| D-080 | HFW bands, target selection, audio policy, report constructs, and Nouns publication drifted from approved content. | Runtime bands now derive from the approved 100 words; HFW sentence tasks stay text-only; grammar option audio is preserved; Nouns publishes both approved formats; reports separate HFW constructs. | HFW, media, release-standard, skill-contract, and report gates. |
| D-081 | The D-053 trace scorer still treated order and direction as secondary to proximity. | Ordered stroke matching, direction, separation, noise tolerance, and device-rate resampling are present. | Formation unit cases and real pointer/touch browser review. |
| D-082 | The final security-definer allow-list omitted signed-out school-name autocomplete. | The final boundary now restores only the name-only school lookup to anonymous users. | Live catalogue/actor policy proof and signed-out signup browser journey. |
| D-083 | Same-name legacy EL cleanup lacked a mandatory teacher boundary. | Legacy name fallback now requires explicit teacher ownership and fails closed without it. | Cross-teacher reset/deletion and live tenant-isolation tests. |
| D-084 | Formal class output rendered `null%`, a fake minimum bar, hard-coded `NR`, and empty report pages. | Null-safe formatting, no bar without a value, no invented Reading status, dynamic pages, canonical states, and compact priorities are present. | Formal-report truth units and authenticated screen/print review. |
| D-085 | Teacher forms could clear failed input, leak backend prose, and use native confirmation. | Semantic auth form behavior, input preservation, safe error mapping, and the shared product dialog are present. | Auth/error/roster/EL units, copy gate, keyboard and focus journey. |
| D-086 | Today attached all-skill or stale evidence to the current focus and counted repeat mastery rows as new. | Exact current-skill evidence, recency/minimum-result guards, first secure transition, and incomplete-source suppression are present. | Today/current-skill/transition units and authenticated Dashboard journey. |
| D-087 | Assessments and Reports could lose the page's sole main landmark or nest a second one. | Each standalone surface owns one main landmark; an embedded individual report remains the sole main on its route. | Complete authenticated teacher accessibility journey. |
| D-088 | Assessment launch did not require a complete saved-result read. | The chooser and launch stay in loading/retry states until the selected student's evidence is explicitly complete. | Assessment units plus authenticated partial-history failure/retry. |
| D-089 | One Skills observation could become Secure in the formal EL workbook. | Skills-derived EL cells use independent attempts and the shared minimum-evidence policy. | EL evidence-consistency units and real workbook review. |
| D-090 | Dependent class/student route reads could complete out of order. | Sequenced route hydration is bound to the resolved class, learner, route, and account generation. | Unit races, direct-report routes, and authenticated account-switch journeys. |
| D-091 | Official class output could be generated from the first 500 of more than 500 assessment rows. | Formal launch, print, and workbook actions fail closed until the entire paged history read completes. | Assessment-history units plus held-tail browser failure/retry. |
| D-092 | Current conclusions used lifetime answers with only the newest timestamp. | Lifetime activity remains descriptive; status, focus, and recommendations use the canonical current window. | Dashboard model/Today units and authenticated source-truth journey. |
| D-093 | A missing dashboard record looked like a confidently unassessed student. | Missing or incomplete records remain unknown; only a complete explicit zero becomes Not assessed. | Class-model/loading units and authenticated retry journey. |
| D-094 | Formal EL current status ignored the canonical evidence window. | Current conclusions use the same window as the rest of reporting while older records remain history. | Builder/store/export recency units and report review. |
| D-095 | Advanced Phonics combined sound and printed-pattern reading. | Unlike constructs remain separate and cannot manufacture an overall Secure result. | Construct-separation units and workbook review. |
| D-096 | Printed period labels did not always match the records counted. | Descriptive totals and current conclusions carry explicit, matching period provenance. | Report-period units and authenticated period/print journey. |
| D-097 | Simple reports compared unlike denominators and overstated perfect performance. | Every sentence uses like-for-like canonical counts, dates, and policy reasons. | Simple-report units and authenticated report review. |
| D-098 | Failed sign-in-picture saves closed the modal and discarded the draft. | The controller returns strict success/failure; failure preserves the draft, dialog, feedback, and retry focus. | Controller/UI units and authenticated failure/retry. |
| D-099 | Delete copy denied the minimal audit record that is intentionally retained. | Both entry points now state exactly what active data is removed and what minimal request record remains. | Copy contracts and authenticated data-rights deletion. |
| D-100 | Failed or truncated roster reads became genuine empty classes. | Explicit roster completeness gates empty-state onboarding and Today conclusions. | Read-state units and authenticated failure/truncation/retry. |
| D-101 | Accessibility-save failure feedback appeared only behind the open dialog. | Pending and error feedback lives inside the dialog; failure preserves the draft and refocuses Retry. | Save-flow units and authenticated failure/retry. |
| D-102 | Permanent deletion sometimes skipped typed confirmation when the compact summary showed zero. | Every permanent deletion requires the exact normalized display name, regardless of visible activity. | Deletion units and zero-answer/formal-record browser journey. |
| D-103 | “No practice” ignored real Sound Seekers activity. | The roster now says “No scored answers” and reserves activity claims for complete activity sources. | Copy units and mixed-activity browser review. |
| D-104 | Overall accuracy looked like accuracy for the adjacent focus skill. | The drawer separately labels Current focus and Accuracy across skills. | Busy-workflow contract and mixed-skill browser review. |
| D-105 | Same-section navigation could be overwritten during the synchronous route-lock gap. | Exact-hash locking is installed before lazy parsing and every completion revalidates its full context. | Held-response route/history/account races. |
| D-106 | Standalone report tabs updated local view without updating parent state. | Visible report, controller state, saved profile, and URL now change together. | Direct-report refresh/view-change/Back on desktop and mobile. |
| D-107 | Settled report choices occupied the result fold and the class report then lacked Back. | Open-report mode hides settled choices, starts at the result, and retains an explicit Back action. | Fold, Back, responsive, and landmark browser checks. |
| D-108 | Legacy saved EL reports displayed BOY/MOY/EOY in screens and workbooks. | One presentation helper expands legacy labels without mutating immutable evidence. | Legacy UI and real workbook round-trip checks. |
| D-109 | Saved-report Delete inherited the same primary treatment as Download. | Explicit danger styles preserve destructive hierarchy in every interaction state. | Source contract and authenticated computed-style review. |
| D-110 | A delayed positive admin lookup could publish after the account changed. | Privileged state is cleared and every result is bound to request generation plus all current identities. | Account units and held real-admin-response browser race. |
| D-111 | Valid Settings subsection URLs could collapse to generic Settings. | Canonical route identity preserves the exact School, Site, Privacy, or Account hash. | Route units and authenticated reload/history/class-change. |
| D-112 | Incomplete ownership reads could consume a valid report deep link. | Only a complete read may deny a route; incomplete reads retain an exact retryable lock. | Failed class/roster deep-link recovery and genuine-denial journeys. |
| D-113 | A functionally disabled saved-report action did not look disabled. | A scoped disabled treatment now visibly dims report buttons without losing danger identity. | Held-delete desktop/mobile computed-style journey. |
| D-114 | Untouched Story Quests inherited a green success badge and the sage status colour failed contrast. | Explicit not-started/in-progress/completed classes now carry named, AA-compliant states. | Story Quest state units and desktop/mobile Axe routes. |
| D-115 | The collapsed class label briefly painted at low opacity on compact teacher routes. | The hidden label no longer transitions through a visible low-contrast state. | Compact teacher route/modal Axe matrix. |
| D-116 | Story Quest preview progress re-entered the player as a new object and caused a React update loop. | Seed evidence now uses stable normalized content, so identical progress does not republish forever. | Authenticated preview/return journey with empty page and console errors. |
| D-117 | The 3D preview emitted deprecated Three.js timing and shadow warnings. | The runtime now uses animation-frame timing, supported PCF shadows, and an explicit pause reset. | 3D API unit plus complete overlay contrast/focus matrix. |
| D-118 | Policy and accessibility previews targeted retired analytics DOM and stale controls. | Preview fixtures now mount current production surfaces and exercise current reachable interactions. | Combined 52-test policy/Axe preview gate. |
| D-119 | A late profile restore could replace an explicit Admin navigation with Today. | Public navigation now owns a revision; older saved-view and fresh-login restoration work may finish hydrating but cannot replace a newer page. | Navigation-revision unit, held production route-runtime race on desktop/mobile, and repeated learner-data-rights journey. |
| D-120 | Reports URLs could name one report while the controller displayed another after reload or history navigation. | Route parsing, controller hydration, and funnel history listeners now keep the exact report synchronized. | Route units plus preview and authenticated reload/Back/Forward journeys. |
| D-121 | Completing the Reports funnel left keyboard focus in the choice grid. | The final choice now focuses the explicit “Show the report” action. | Focus contract and keyboard browser journey. |
| D-122 | Today sent “Assess a student” to Children and could show six urgent pupils. | The shortcut opens Assessments and both urgency groups share one three-pupil budget. | Allocation units and authenticated Today journey. |
| D-123 | Assessment and report funnels rendered every pupil as one long tab sequence. | A shared searchable picker exposes eight pupils per page with truthful count and paging. | 40-pupil unit and browser journeys on both funnels. |
| D-124 | A 100-pupil roster rendered a page button for every page. | A maximum seven-item window retains first, last, current neighbours, and ellipses. | Pagination units and 105-pupil roster browser journey. |
| D-125 | The teacher rail hid lower destinations on a 667×320 landscape screen. | The destination region scrolls independently while the account footer and 44-pixel targets remain reachable. | CSS contract and exact-size keyboard browser journey. |
| D-126 | The EL PDF action printed the generic class report, which excludes descriptive EL benchmark results and the chosen route. | A dedicated route-scoped EL class document now owns the EL print target and contains the selected grade/time, pupils, domains, measures, administration states, and evidence notes. | Printable-document unit plus authenticated desktop/mobile target/content/style journey. |
| D-127 | Pending, rejected, and disabled teacher accounts retained table access, while privileged teacher RPCs could bypass row policies entirely. | One approved-teacher-or-administrator predicate now gates every equivalent row policy and all 23 callable privileged teacher RPCs without changing learner-token access. | Exact inventory contract plus four-state SQL and authenticated table/RPC attack exercise. |
| D-128 | Permanent deletion could claim browser cleanup without proving the live learner profile, drafts, session, queue, attempts, and reports were clear. | Exact-store removal, readback, corruption handling, and a fresh learner-bound client cleanup report now fail closed. | Exact/corrupt/failure units, proof SQL, and destructive browser journey. |
| D-129 | Deletion could retain an empty singleton intervention or the learner's name/UUID in a shared plan. | Singletons are deleted; shared plans keep classmates only after every free-text field is redacted and checked. | Shared/singleton intervention SQL and migration contract. |
| D-130 | Four answers from one sitting could be counted as independent evidence and reported as Secure. | Legacy and class summaries now require real independent sittings and the named three-sitting/eight-response/85% rule. | Reporting-workspace, summary, dashboard, roster, and simple-report units. |
| D-131 | A later administrator-profile or pending-account await could publish after the signed-in identity changed. | Every asynchronous stage and final publication now revalidates generation, expected user, and current authentication identity. | Held late-stage unit races and authenticated identity-switch journey. |
| D-137 | A paused 3D practice kept advancing elapsed time and retained held steering/boost input. | A pausable frame timer freezes elapsed time and resumes at zero delta; pause, resume, and onboarding dismissal clear all keyboard and pointer input. | Executable timer/input tests plus the complete overlay runtime matrix. |
| D-142 | Assessment question reports existed only in the browser that sent them. | A private cloud table and bounded idempotent RPC now accept an approved owning teacher or valid student token; app administrators alone can page, review, and delete, with server-owned attribution. | Store units, fresh-database actor/sanitisation SQL, and a two-browser teacher/admin journey. |
| D-143 | The Reported questions history page was not a complete cold-load or mobile Admin route. | Its exact pathname now owns the parent Admin view, participates in browser history, appears in the compact picker, and clears when the teacher leaves Admin. | Pathname units plus cold/reload/Back/Forward/mobile/rail-exit journeys. |
| D-144 | A failed saved-school lookup could appear as an editable blank. | School name now has an identity-scoped read state; failure and missing data hide editing until retry returns the verified saved value. | School-profile units and Settings loading/error/retry journey. |
| D-145 | React replaced the focused Retry control and left keyboard focus on the document body. | A bounded recovery watcher moves focus through loading to either the next recovery action or the restored page heading. | Recovery-focus units and authenticated failed-retry/loading/success journey. |
| D-146 | Reports moved focus to a clipped or visually silent context heading. | The context heading remains visible, receives a three-pixel focus outline, and is focused after click, direct load, and reload. | Report-focus units plus authenticated click/cold/reload computed-style review. |
| D-147 | Overview disclosures reapplied their initial open value during later report renders. | Each disclosure now owns local open state independently from its Show all/Fewer row state. | Report-experience units and an interactive multi-disclosure journey. |
| D-148 | Class sign-in summary and event history reused one failure/busy state. | Independent class-scoped read objects now preserve either source when the other loads or fails. | Settings access-read units and mixed summary/history failure journeys. |
| D-149 | Question-review controls and notes implied content changes the system had not made. | Filters expose pressed-button semantics, failures are alerts, stored tokens become plain labels, and delete explicitly removes only the report. | Review store/note units and authenticated keyboard/review/delete journey. |
| D-150 | Formal EL screens and downloads exposed route and microphase system language. | Grade/time, assessment plan, reading stage, and next-step decision language now spans the panel, runner, report, PDF, and workbook. | Formal-EL language/report/export units and browser/download review. |
| D-151 | Every archived student rendered in one unsearchable list. | The archived roster is class-scoped, searchable, limited to ten rows per page, bounded, clamped, reset with context, and paired with live counts. | Archived-roster units and a 25-student search/pagination journey. |

The full evidence, fix specification, and named gate for each row live in
[DISCOVERED](release/DISCOVERED.md). The table above is a navigation aid, not a
second specification.

---

## What changed for a busy teacher

### Sign-in and account setup

- The sign-in surface is a real form: required fields, Enter submission, and an
  explicit show/hide password control.
- Failed sign-in, signup, password, school, and student-create operations use
  short teacher language. Raw database, schema, RPC, and transport prose stays
  in diagnostics rather than the interface.
- Failed writes preserve the teacher's input. A name is cleared only after the
  student is actually saved.

### Dashboard

- Urgent work is visible first.
- Planning and secondary operational detail is collapsed until requested.
- Needs-support suggestions require enough current results.
- The current skill is paired only with results for that skill.
- A missing or truncated required source pauses recommendations and identifies
  what must be retried.
- Student creation, rename, or profile-update time is not presented as learning
  activity.

### Students

- The roster is paginated at ten students rather than making the page grow with
  the whole class.
- Archived students use the same ten-row bound, with their own search and
  truthful matching count, instead of recreating an unbounded second roster.
- Search, filters, the active/archived split, and the primary student action
  stay visible without exposing every secondary control at once.
- Opening a student reveals one focused detail layer. Edit, accessibility,
  privacy, archive, and restore actions are grouped by purpose.
- Privacy deletion remains a deliberate verified workflow. Ordinary edit and
  archive work no longer competes with it.

### Assessments

- The path remains class → student → assessment → start point → begin.
- Each unlocked step retains context, and changing an earlier choice clears
  only the dependent choices.
- Formal EL keeps its required detail and saved evidence behavior.
- Loading and save failures explain what happened, what remains safe, and the
  action to take. Raw backend messages do not render.

### Reports

- The everyday student report opens with Overview, Skills, High-frequency
  words, and Essential Literacy.
- Opening a report moves visible keyboard focus to its compact context heading;
  a direct link and reload do the same.
- Overview disclosures keep the teacher's open/closed choice when their row
  count changes.
- A typical skill sentence can state that the student met a target a given
  number of times with a given number correct, without turning one answer into
  mastery.
- HFW shows the complete approved 100-word set. Unseen words stay grey.
  Sentence choice, spelling, and isolated reading remain separate.
- The formal class report no longer invents a percentage, a bar, a reading
  category, or a page when its source data is absent.
- Formal EL uses grade/time, assessment-plan, reading-stage, and next-step
  language in the app, PDF, and workbook instead of route/microphase terms.
- Technical report details remain available where needed for print and audit,
  but do not dominate the on-screen teacher workflow.

### Resources and Settings

- Resources stays in class context and does not introduce a second student
  picker for whole-class tools.
- Settings separates school information, student sign-in, student privacy, and
  teacher account tasks.
- A school-name failure cannot become an editable blank, and recent sign-in
  summary/history reads no longer clear one another.
- Reset uses the product dialog rather than a browser-native confirmation.

### Admin and question review

- Reported questions use a real cloud-backed review queue rather than records
  confined to one browser.
- The page owns its cold/reload/Back/Forward URL, is reachable from the compact
  Admin picker, and leaves that pathname when the teacher returns to another
  section.
- Review controls record exactly what an administrator decided; they do not
  imply that a live question or image was changed.

---

## Reporting truth contract

The remediation treats each displayed statement as a measurement claim.

### Exact values

An exact attempts/correct/accuracy statement is allowed only when the stored
record contains those values for the same construct and time window. A legacy
label such as `mastered=true` cannot manufacture `100%`, and one correct answer
cannot become Secure.

### Independence

Repeated variants within one sitting are practice evidence, not independent
proof. Exact-item learning conclusions require separate eligible attempts under
the learning policy.

### Construct separation

These remain separate:

- sentence-context HFW choice;
- HFW spelling;
- isolated HFW reading;
- practice activity;
- formal assessment evidence.

The report may show them beside one another. It may not average them into one
score and call that score mastery.

### Current evidence

Displayed counts, accuracy, status, and recommendation all use the same current
window. A stale formal result can remain in history, but it cannot hide newer
practice or create a current urgent recommendation by itself.

### Class conclusions

Class-level focus requires enough students, balanced coverage, and current
policy-ready results. One student's need does not become a whole-class need.
Skill aliases collapse into one canonical row before aggregation.

---

## Data integrity and privacy contract

### Practice reset

A practice reset may remove derived mastery, item mastery, and resettable
practice progress. It retains:

- learner profile and accessibility settings;
- Guided Reading;
- Story Quest;
- immutable completed assessment evidence;
- pending engagement that has not yet safely synced.

A cross-device reset marker is written and existing student sessions are
revoked so stale device state cannot immediately replay over the reset.

### Credential change

Changing sign-in pictures and revoking active student sessions are one
transaction. A previously signed-in device cannot continue under the old
credential.

### Permanent deletion

The active-system transaction:

1. verifies teacher/student ownership and the exact confirmation;
2. writes a one-way learner tombstone;
3. locks affected evidence tables;
4. redacts the student from shared reports, observations, groups, and
   interventions while retaining classmates;
5. deletes student-only records;
6. proves zero residual managed records.

The request then waits for the authorised browser to clear and verify local
caches. Only after that second phase is the request marked complete. If the
browser is interrupted, the operation resumes from its recorded stage.

### Direct deletion

Authenticated clients no longer have direct table-delete authority over the
protected class/student/evidence path. Named, owned operations are required so
verification and audit cannot be bypassed.

---

## Curriculum and educational logic

### High-frequency words

The approved workbook owns the four 25-word bands. The current generated audit
records 100 of 100 targets and 588 eligible questions. Active sentence tasks
are intentionally text-only; the absence of a playable audio file is not a
release-media defect. The optional 598-scene cartoon list is a future visual
backlog, not a claim that current questions are incomplete.

The final curriculum gates still need to run against the final tree before
these numbers become release evidence.

### Nouns

The release contract expects 146 approved Nouns questions across image choice
and sentence fit. A loader path that exposes only 30 is now a failing
regression case.

### Letter formation

Proximity to the guide is necessary but not sufficient. A valid trace must also
respect the target's ordered strokes, direction, and separation. The scorer
retains tolerance for normal early-writer wobble, fast pointer sampling, and
one accidental lift; it rejects colouring, unrelated shapes, backwards
strokes, wrong order, concatenated strokes, and incomplete formation.

---

## Implementation and regression map

Load-bearing new boundaries and regressions include:

- `src/appState/classDashboardEvidence.js`
- `src/appState/accountAccessCheck.js`
- `src/appState/teacherErrorMessages.js`
- `src/data/learnerDataRights.js`
- `src/data/skillMasterySummary.js`
- `src/data/studentReportingWorkspaceModel.js`
- `src/data/questionFlagStore.js`
- `src/data/teacherSchoolProfile.js`
- `src/utils/elAssessmentReset.js`
- `src/appState/adminQaNavigation.js`
- `src/components/admin/QuestionFlagReviewPage.jsx`
- `src/components/teacher/TeacherFunnelStudentPicker.jsx`
- `src/components/teacher/teacherArchivedRoster.js`
- `src/components/teacher/teacherPagination.js`
- `src/components/teacher/ui/teacherSurfaceRecoveryFocus.js`
- `supabase/migrations/20260727120000_assessment_data_integrity_boundary.sql`
- `supabase/migrations/20260727130000_security_definer_boundary.sql`
- `supabase/migrations/20260728100000_teacher_account_status_rls.sql`
- `supabase/migrations/20260728110000_assessment_question_reports.sql`
- `supabase/migrations/20260728112000_assessment_question_report_review.sql`
- `supabase/migrations/20260728113000_security_definer_boundary.sql`
- `tests/sql/assessment_question_reports.sql`
- `tests/sql/learner_deletion_shared_records.sql`
- `tests/sql/teacher_account_status_rls.sql`
- `tests/unit/accountAccessCheck.test.js`
- `tests/unit/reportingEvidencePolicyIntegrity.test.js`
- `tests/unit/classDashboardEvidence.test.js`
- `tests/unit/learnerDataRights.test.js`
- `tests/unit/teacherBusyWorkflow.test.js`
- `tests/unit/formalClassReportTruth.test.js`
- `tests/unit/learnerDeletionMigrationContract.test.js`
- `tests/unit/localLearnerCleanup.test.js`
- `tests/unit/teacherClassModel.test.js`
- `tests/unit/teacherErrorMessages.test.js`
- `tests/unit/teacherNavigationScale.test.js`
- `tests/unit/questionReportStore.test.js`
- `tests/unit/teacherArchivedRoster.test.js`
- `tests/unit/teacherSchoolProfile.test.js`
- `tests/unit/traceLetterScoring.test.js`
- `tests/release/teacher-settings-truth.spec.js`
- `tests/release/teacher-navigation-scale.spec.js`

Existing release and unit contracts were also extended. This list names the
new seams; it is not a substitute for the final test manifest.

---

## Verification ledger

### Observed before this record was written

- All D-076 through D-151 findings have a concrete implementation and focused
  regression contract in the shared current worktree.
- Focused workstream runs were reported green during implementation, including
  reporting, persistence, auth, EL assessment, class-report truth, and
  busy-teacher workflow slices.
- On 2026-07-28, one combined focused Node run covering the D-142–D-151 store,
  route, school-read, focus, disclosure, EL-language, archive, and Settings
  contracts passed 53 of 53 tests. This was not a database or authenticated
  browser run.
- The generated HFW audits in the current worktree report 100 approved targets,
  588 live eligible questions, and no structural failures.

These observations do **not** close any D-076–D-151 row. The worktree continued
to change after some focused runs, and a focused run does not exercise the
spaces between workstreams.

### Required before any row becomes `DONE`

- [ ] final `npm test` against the settled worktree;
- [ ] final zero-warning lint;
- [ ] production build;
- [ ] bundle and split-boundary gates without rebaselining;
- [ ] learning-policy, class-summary, app-copy, teacher-state, and teacher-UI
      gates;
- [ ] HFW coverage, runtime, ambiguity, media, and curriculum gates;
- [ ] fresh local Supabase reset through every migration;
- [ ] deterministic audit-school seed and expected row-count proof;
- [ ] live database policy, learner-data-rights, recovery, and function checks;
- [ ] authenticated browser journey through all six teacher sections;
- [ ] individual and class report screen/print review;
- [ ] Letter Trace pointer/touch review;
- [ ] desktop, tablet, phone, keyboard, focus, and accessibility review;
- [ ] final adversarial re-audit with every new P0/P1 triaged.

The boxes remain deliberately unchecked here. The final operator should update
the live traceability ledger and append the exact command outcomes only after
those checks actually pass.

---

## Strongest remaining risk

The highest-risk work is the database lifecycle and question-report migration
set. Unit contracts can prove the intended SQL shape and JavaScript
orchestration, but only a fresh local migration rebuild followed by the
actor-isolated SQL and destructive tenant-isolated browser journeys can prove
the database functions, grants, triggers, table locks, sanitisation, redaction,
tombstones, and two-phase completion work together.

The next risk is integration drift: this remediation touched reporting,
dashboard loading, routing, teacher surfaces, curriculum eligibility, local
queues, and database boundaries at the same time. The final full suite and
browser pass are therefore load-bearing, not ceremonial.

---

## Traceability changes

- Appended D-076 through D-086 to
  [DISCOVERED](release/DISCOVERED.md).
- Added all eleven rows as `IN-PROGRESS` in
  [TRACEABILITY](release/TRACEABILITY.md).
- Added D-120 through D-125 and their focused navigation, history, scale, and
  short-screen evidence as `IN-PROGRESS` in the same two release ledgers.
- Added D-132 through D-136 for truthful Settings reads, code rotation,
  deletion refresh, class-scoped asynchronous state, and plain privacy
  language.
- Added D-138 through D-141 for compartmentalised Admin, real browser history,
  honest production state coverage, and the concise everyday class report with
  a separate formal EL record.
- Added D-142 through D-151 for durable assessment-question reports, complete
  Admin routing, truthful school/sign-in reads, keyboard recovery and report
  focus, stable disclosures, honest review semantics, formal EL teacher
  language, and archived-roster scale.
- Updated the living
  [app copy standard](APP_COPY_STANDARD_2026-07-25.md) to the
  user-directed student/assessment teacher taxonomy.
- Added this record to [the documentation index](INDEX.md).
