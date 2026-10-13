# Teacher dashboard parity matrix

**Scope:** A5.4 / A9.6
**Source retired:** the unreachable `dashboardMode` teacher variant formerly embedded in `AdminDashboardPage.jsx`
**Canonical teacher product:** Dashboard (`TeacherTodayPage.jsx`), Teach (`TeacherIntentPage.jsx`), Students (`TeacherStudentsPage.jsx`), Assessments and Reports, with Settings as a utility. Destination review: 13 October 2026.

This matrix inventories every distinct capability that the retired branch exposed. A capability is marked `migrated` only when a reachable teacher surface owns the useful outcome. `dropped-with-reason` means the old behavior was misleading, incomplete, duplicated, unsafe, or contradicted a later plan requirement; the reason names the replacement where one exists.

**Current report entry:** Reports opens **Whole class** directly when no student is selected; **Report for** switches to a student's direct summary. There is no Open class report step. The existing class renderer and named full results remain inside that page, with the whole class's evidence. `#teacher/reports/class?class=<id>` remains a compatible bookmark for `#teacher/reports?class=<id>`. The Reporting Bible governs the meaning of every retained metric.

| ID | Retired capability | Decision | Canonical reachable destination or reason |
|---|---|---|---|
| CAP-001 | Overview class count | migrated | Dashboard current-class control and the class selector expose the teacher's complete class list. |
| CAP-002 | Overview student count | migrated | Dashboard class summary and roster show the selected class count without mixing classes. |
| CAP-003 | Overview recent-assessment count | dropped-with-reason | The count was the first 40 records from an unscoped history. Reports exposes scoped evidence with explicit read status and history filters. |
| CAP-004 | Overview needs-support count | migrated | Dashboard teaching-needs rows use current focus evidence; Reports → Whole class retains class-level support evidence. |
| CAP-005 | Quick link to reports | migrated | Persistent teacher navigation owns Reports as a reachable destination. |
| CAP-006 | Quick link to exports | migrated | Export actions live beside the report they describe instead of in a detached export hub. |
| CAP-007 | Quick link to class management | migrated | Students → Manage class owns roster operations; Settings → Classes and groups owns its existing class/account controls. |
| CAP-008 | Quick link to guided-reading data | migrated | Teach → Browse books owns generic browsing; student reading opens with explicit learner scope. Reports → Detailed reports owns Guided Reading evidence. |
| CAP-009 | Students-needing-attention list | migrated | Dashboard teaching-needs rows and Reports → Whole class provide scoped next steps without automatically creating groups. |
| CAP-010 | Recent-activity list capped at five | dropped-with-reason | Reports → Saved activity history is scoped to class/student, identifies original records, filters loaded history and loads older mock pages. It distinguishes unloaded pages and failed reads from empty results. |
| CAP-011 | Class list and delete controls | migrated | Dashboard owns teacher class selection and creation. Destructive school-wide deletion remains an admin-only responsibility. |
| CAP-012 | Student list and load controls | migrated | Students owns learner selection, progress, sign-in and actions in persistent class context. |
| CAP-013 | Export-readiness summary | migrated | Reports shows the selected learner and evidence availability; Class Report renders the evidence set before PDF export. |
| CAP-014 | Class report PDF | migrated | Reports → Whole class owns the class document and its scoped print/PDF action. |
| CAP-015 | Class report Excel | dropped-with-reason | The retired action persisted an EL-specific workbook from a generic class screen. A4.9/A7.1 owns the correctly scoped formal-EL export on the live Reports route. |
| CAP-016 | Individual report handoff | migrated | Opening a learner from the roster preserves the learner context; Reports then opens Whole Child, EL, Guided Reading, Skills Check, or Other Learning. |
| CAP-017 | EL benchmark evidence-scope picker | dropped-with-reason | The old admin-derived class picker was unreachable and mixed formal scopes. A4.9/A7.1 owns the scope control on the live formal-EL surface. |
| CAP-018 | Saved EL report download history | dropped-with-reason | Browser-local saved-report metadata was not a durable teacher record. A4.9/A7.1 owns durable saved reports, retention, download, and deletion. |
| CAP-019 | Detached export hub | dropped-with-reason | Separating export from its evidence made scope errors likely. Exports now sit on the corresponding live report; formal EL completion is A4.9/A7.1. |
| CAP-020 | Raw assessment CSV export | migrated | Each reachable student report retains its scoped labelled workbook/evidence serializer; Export names the supported format and scope. |
| CAP-021 | Raw assessment JSON export | dropped-with-reason | Unlabelled internal storage JSON is not a teacher report and can expose implementation details. The existing scoped report serializers remain available. |
| CAP-022 | Assessment summary metrics | migrated | Dashboard class summary and Reports Class Snapshot provide scoped students, accuracy, support, and mastery measures. |
| CAP-023 | Recent assessment attempts capped at twenty | dropped-with-reason | The cap violated the complete-evidence covenant. Learner Skills Check reports now retain and export every attempt. |
| CAP-024 | Advanced-phonics pattern mastery table | migrated | Reports → Detailed reports → EL assessments retains the Phonics patterns result; Saved activity history opens its original saved attempt with the same renderer. |
| CAP-025 | Class accuracy line chart | dropped-with-reason | It combined incomparable attempts and omitted evidence counts. Class Report Growth by Skill Area is the scoped replacement. |
| CAP-026 | Weakest-skills, support, and ready-for-challenge lists | migrated | Reports → Whole class retains the summary and named full class results for teaching focus and student evidence. |
| CAP-027 | Per-student assessment flags | migrated | Students and Dashboard next steps provide class-scoped status and direct learner actions. |
| CAP-028 | Skill-coverage heatmap | migrated | Reports → Whole class retains detailed class evidence and the sound-map destination; it no longer requires opening a second class-report page. |
| CAP-029 | Whole-class next-step prose | migrated | Class Report focus rows and Suggested Focus Groups include named learners and activities. |
| CAP-030 | Cross-class Guided Reading log from browser storage | dropped-with-reason | A device-local scan could not prove school-wide completeness. Reachable learner Reports owns detailed Guided Reading evidence; A7.3 owns a durable class-first view. |
| CAP-031 | Guided Reading completion Excel from browser storage | dropped-with-reason | The export inherited the incomplete device-local scope. Complete report exports remain learner-scoped until A7.3 provides durable class evidence. |
| CAP-032 | HFW class summary capped at thirty learners | migrated | HFW evidence remains in Reports → Whole class and each student's Skills Check detail without a thirty-learner presentation cap. |

## Page split capabilities, with current destinations

The July page split retired `TeacherDashboardPage.jsx` and its `isClassesPage` branch. The destinations below reflect the current explicit assessment chooser and October task navigation, rather than the original one-click-check rollout.

| ID | Capability | Decision | Where it lives now |
|---|---|---|---|
| CAP-033 | Class setup checklist | migrated | Renders on **both** Today and Students until setup is complete. It previously vanished the moment a teacher followed it onto the roster. "Continue" carries the step across so the right control opens. |
| CAP-034 | Roster empty state ("Add your first student") | migrated | Always reachable on Students. It was previously unreachable from the Dashboard route. |
| CAP-035 | Start a check | migrated | Start assessment opens the shared Assessments chooser with the known class/student; Choose assessment selects a type, and the final Start control begins that assessment. The student panel may instead promote focused practice or review when evidence justifies it. |
| CAP-036 | Old `Checks` card menu | dropped-with-reason | Assessments is the canonical task destination. `#teacher/checks` and `#teacher/assess` remain aliases preserving context, including exact mock session/result references. Daily navigation is Dashboard · Teach · Students · Assessments · Reports. |
| CAP-037 | Per-student overview page (`StudentOverviewPage`, `APP_VIEWS.OVERVIEW`) | dropped-with-reason | A second dashboard with its own metrics. Its skill-level select moved onto the check screen; "Reset check data" moved into the per-student admin menu, away from the start button. |
| CAP-038 | Skill-level select | migrated | A small control in the check screen top bar. Changing it restarts the round at that level. |
| CAP-039 | EL formal check entry | migrated | Assessments retains named Letters and sounds, Phonics patterns and EL benchmark choices; student shortcuts carry the learner to that same chooser. Existing assessment engines and saved drafts remain owned by their original routes. |
| CAP-040 | Reset check data | migrated | The per-student admin menu, styled as destructive. It no longer sits beside the start button. |
| CAP-041 | Guided reading and Story Quests for one student | migrated | Named student shortcuts remain in the student panel; Teach owns generic book preview, reading-mode choices, Present and Worksheets. Generic Browse books does not inherit the previously viewed student. |
| CAP-042 | Second student-report picker on the class report page | dropped-with-reason | Reports has one Report for selector for Whole class or a student, and immediately renders that summary. Student-panel report shortcuts use the same route. |
| CAP-043 | Targeted-review recommendation explanation | migrated | The checkpoint screen, next to the "Review mistakes" button that offers the review. |
| CAP-044 | Shared roster reading and setup state | migrated | `src/components/teacher/teacherClassModel.js` (logic) and `TeacherClassParts.jsx` (shared components), so the two pages cannot disagree about who needs attention or whether setup is finished. |

## Consolidation contract

- `TeacherTodayPage.jsx` and `TeacherStudentsPage.jsx` are the only class-dashboard components reachable to signed-in teachers, and neither forks on a page-intent flag.
- `AdminDashboardPage.jsx` is admin-only and accepts no teacher/admin mode switch.
- Teacher route tests assert the canonical dashboard marker and assert that the admin dashboard is absent.
- The setup checklist renders on both teacher class pages until setup is complete; if it is ever restricted to one page again, CAP-033 becomes false.
- Assessment shortcuts and the primary Assessments entry share the canonical chooser and exact learner scope; Choose and Start remain separate actions.
- Every retained report is reached through the product navigation and tested against the seeded audit school.
- Reports must keep Whole class reachable without selecting a student or reopening a second class-report page.

## October task consolidation

| Capability | Canonical destination | Preserved boundary |
|---|---|---|
| Whole-class lessons, practice and print | Teach → Present / Send practice / Worksheets | Confirmed teaching cycle remains separate from student progression. |
| Supported activities and independent Skills assessment | Practise / Assess in session setup | Generic non-MAP practice and Skills mastery rules remain distinct; teacher-observed assessments retain their own chooser and administration. |
| New MAP assessment | Assessments → Mock MAP test; Reports → Mock MAP results | One teacher-launched full 43-question form; a break pauses the same test. No new short/timed mock or competing practice/snapshot launch. |
| Historical literacy practice, independent snapshots and previous mock forms | Reports → Saved activity history → original record | Original profiles, feedback, administration and saved results remain readable; practice is not relabelled as independent mock evidence. |
| Reading together | Teach or session setup → Read together → existing book/group selector | Teacher-paced group of at most six, explicit final confirmation. |
| Active focus, reading and mock work | Persistent session controls and Prepare / Live / Results frame | Separate engines, permitted controls and confirmed-save states. |
| Saved assessment and mock results | Reports → Saved activity history → original record | Class/student ownership, exact IDs, separate source semantics and older-history disclosure. |
| Family reporting | Student report → Preview family update | Canonical family snapshot; explicit release of the exact preview. |
| Guardian invitations, revocation and withdrawals | Student report → Manage guardian access | Existing authorised guardian model. |
| Sign-in and accessibility maintenance | Students → Student sign-in / Learning support; exact Settings shortcuts | Explicit learner selection and existing access protections. |
| Teaching help | Persistent Help | Daily tools stay on Teach; the specialist-tools directory is removed. |
