# Teacher dashboard parity matrix

**Scope:** A5.4 / A9.6
**Source retired:** the unreachable `dashboardMode` teacher variant formerly embedded in `AdminDashboardPage.jsx`
**Canonical teacher product:** `TeacherTodayPage.jsx` (decide what to do) and `TeacherStudentsPage.jsx` (manage the class), plus their reachable Check, EL, Guided Reading, and Reports destinations

This matrix inventories every distinct capability that the retired branch exposed. A capability is marked `migrated` only when a reachable teacher surface owns the useful outcome. `dropped-with-reason` means the old behavior was misleading, incomplete, duplicated, unsafe, or contradicted a later plan requirement; the reason names the replacement where one exists.

**Where "Class Report" lives (corrected 2026-07-26):** until today the class report rows below were false. `APP_VIEWS.REPORTS` was never set by any control, so `TeacherReportsPage` — which owns the class snapshot, whole-class focus list, student progress grid, suggested focus groups, Export Class PDF, and the formal EL class panel — had never rendered for a teacher. It is now reached from **Reports → Open class report** (route `#teacher/reports/class?class=<id>`), and it no longer requires a selected student, because a class report is about a class. The class tab also now counts the whole class: it previously filtered the selected student's history, so it could only ever have shown one student's attempts.

| ID | Retired capability | Decision | Canonical reachable destination or reason |
|---|---|---|---|
| CAP-001 | Overview class count | migrated | Dashboard current-class control and the class selector expose the teacher's complete class list. |
| CAP-002 | Overview student count | migrated | Dashboard class summary and roster show the selected class count without mixing classes. |
| CAP-003 | Overview recent-assessment count | dropped-with-reason | The count was the first 40 records from an unscoped history. Reports now exposes complete learner evidence and a class period filter. |
| CAP-004 | Overview needs-support count | migrated | Dashboard Suggested next steps groups learners by current focus; Reports Class Snapshot and focus rows expose class-level support needs. |
| CAP-005 | Quick link to reports | migrated | Persistent teacher navigation owns Reports as a reachable destination. |
| CAP-006 | Quick link to exports | migrated | Export actions live beside the report they describe instead of in a detached export hub. |
| CAP-007 | Quick link to class management | migrated | Dashboard is the canonical class and roster management surface. |
| CAP-008 | Quick link to guided-reading data | migrated | Persistent teacher navigation owns Guided Reading and Reports owns its evidence view. |
| CAP-009 | Students-needing-attention list | migrated | Dashboard Suggested next steps and Class Report focus rows provide scoped, actionable groups. |
| CAP-010 | Recent-activity list capped at five | dropped-with-reason | A five-row, cross-class sample could conceal evidence. The selected learner report exposes complete attempt history. |
| CAP-011 | Class list and delete controls | migrated | Dashboard owns teacher class selection and creation. Destructive school-wide deletion remains an admin-only responsibility. |
| CAP-012 | Student list and load controls | migrated | Dashboard roster owns learner selection, progress, login state, and actions in persistent class context. |
| CAP-013 | Export-readiness summary | migrated | Reports shows the selected learner and evidence availability; Class Report renders the evidence set before PDF export. |
| CAP-014 | Class report PDF | migrated | Reports → Open class report → Class report provides the printable class document and its Export Class PDF action. |
| CAP-015 | Class report Excel | dropped-with-reason | The retired action persisted an EL-specific workbook from a generic class screen. A4.9/A7.1 owns the correctly scoped formal-EL export on the live Reports route. |
| CAP-016 | Individual report handoff | migrated | Opening a learner from the roster preserves the learner context; Reports then opens Whole Child, EL, Guided Reading, Skills Check, or Other Learning. |
| CAP-017 | EL benchmark evidence-scope picker | dropped-with-reason | The old admin-derived class picker was unreachable and mixed formal scopes. A4.9/A7.1 owns the scope control on the live formal-EL surface. |
| CAP-018 | Saved EL report download history | dropped-with-reason | Browser-local saved-report metadata was not a durable teacher record. A4.9/A7.1 owns durable saved reports, retention, download, and deletion. |
| CAP-019 | Detached export hub | dropped-with-reason | Separating export from its evidence made scope errors likely. Exports now sit on the corresponding live report; formal EL completion is A4.9/A7.1. |
| CAP-020 | Raw assessment CSV export | migrated | Each reachable learner report exports its complete, labeled summary and evidence appendix. |
| CAP-021 | Raw assessment JSON export | dropped-with-reason | Unlabeled internal storage JSON is not a teacher report and can expose implementation details. Complete labeled CSV remains available. |
| CAP-022 | Assessment summary metrics | migrated | Dashboard class summary and Reports Class Snapshot provide scoped students, accuracy, support, and mastery measures. |
| CAP-023 | Recent assessment attempts capped at twenty | dropped-with-reason | The cap violated the complete-evidence covenant. Learner Skills Check reports now retain and export every attempt. |
| CAP-024 | Advanced-phonics pattern mastery table | migrated | Reports → Skills Check exposes item-level and aggregate skill evidence without the old ad-hoc pattern parser. |
| CAP-025 | Class accuracy line chart | dropped-with-reason | It combined incomparable attempts and omitted evidence counts. Class Report Growth by Skill Area is the scoped replacement. |
| CAP-026 | Weakest-skills, support, and ready-for-challenge lists | migrated | Reports → Open class report separates mastery, whole-class focus, student progress, and suggested focus groups. |
| CAP-027 | Per-student assessment flags | migrated | Dashboard roster plus Suggested next steps provide class-scoped status and direct learner actions. |
| CAP-028 | Skill-coverage heatmap | migrated | Reports → Open class report → Student Progress Grid covers assessed skills; Dashboard also provides the interactive Sound Seekers class map. |
| CAP-029 | Whole-class next-step prose | migrated | Class Report focus rows and Suggested Focus Groups include named learners and activities. |
| CAP-030 | Cross-class Guided Reading log from browser storage | dropped-with-reason | A device-local scan could not prove school-wide completeness. Reachable learner Reports owns detailed Guided Reading evidence; A7.3 owns a durable class-first view. |
| CAP-031 | Guided Reading completion Excel from browser storage | dropped-with-reason | The export inherited the incomplete device-local scope. Complete report exports remain learner-scoped until A7.3 provides durable class evidence. |
| CAP-032 | HFW class summary capped at thirty learners | migrated | HFW evidence appears in the uncapped Reports → Open class report progress grid and in each learner's Skills Check evidence. |

## What moved on 2026-07-26 (page split and one-click check)

`TeacherDashboardPage.jsx` served both the Dashboard and the Students nav items, forking on an `isClassesPage` boolean, so roughly 60% of the page was hidden on whichever route you were on. It is now two pages, and the four-screen path into a check is one click.

| ID | Capability | Decision | Where it lives now |
|---|---|---|---|
| CAP-033 | Class setup checklist | migrated | Renders on **both** Today and Students until setup is complete. It previously vanished the moment a teacher followed it onto the roster. "Continue" carries the step across so the right control opens. |
| CAP-034 | Roster empty state ("Add your first student") | migrated | Always reachable on Students. It was previously unreachable from the Dashboard route. |
| CAP-035 | Start a check | migrated | A **Check** button on every roster row, in the Student panel, and on each Today briefing row. It goes straight into the check. |
| CAP-036 | `Checks` nav item and its card menu | dropped-with-reason | The landing page only led to a student picker and a second dashboard. Nav is now Today · Students · Reports · Resources · Settings. `#teacher/checks` and `#teacher/assess` still parse and land on Students with class, group and student rehydrated. |
| CAP-037 | Per-student overview page (`StudentOverviewPage`, `APP_VIEWS.OVERVIEW`) | dropped-with-reason | A second dashboard with its own metrics. Its skill-level select moved onto the check screen; "Reset check data" moved into the per-student admin menu, away from the start button. |
| CAP-038 | Skill-level select | migrated | A small control in the check screen top bar. Changing it restarts the round at that level. |
| CAP-039 | EL formal check entry | migrated | A row in the student's **More** menu on the roster, and via the Student panel. `APP_VIEWS.EL_ASSESSMENTS` and its Letters / Advanced phonics / EL benchmark routes are unchanged. |
| CAP-040 | Reset check data | migrated | The per-student admin menu, styled as destructive. It no longer sits beside the start button. |
| CAP-041 | Guided reading and Story Quests for one student | migrated | The Student panel. They were cards on Resources behind a second student picker, which is why they so often sat greyed out. Resources keeps the whole-class tools: Worksheets and Present. |
| CAP-042 | Second student-report picker on the class report page | dropped-with-reason | It duplicated the picker on Reports and needed a student chosen elsewhere. `APP_VIEWS.REPORTS` is now the class report only; per-student reports open from Reports or from the Student panel. |
| CAP-043 | Targeted-review recommendation explanation | migrated | The checkpoint screen, next to the "Review mistakes" button that offers the review. |
| CAP-044 | Shared roster reading and setup state | migrated | `src/components/teacher/teacherClassModel.js` (logic) and `TeacherClassParts.jsx` (shared components), so the two pages cannot disagree about who needs attention or whether setup is finished. |

## Consolidation contract

- `TeacherTodayPage.jsx` and `TeacherStudentsPage.jsx` are the only class-dashboard components reachable to signed-in teachers, and neither forks on a page-intent flag.
- `AdminDashboardPage.jsx` is admin-only and accepts no teacher/admin mode switch.
- Teacher route tests assert the canonical dashboard marker and assert that the admin dashboard is absent.
- The setup checklist renders on both teacher class pages until setup is complete; if it is ever restricted to one page again, CAP-033 becomes false.
- Every check starts from a roster row, the Student panel, or a Today briefing row. If those buttons are removed, `APP_VIEWS.ASSESSMENT` is orphaned.
- Every retained report is reached through the product navigation and tested against the seeded audit school.
- The class report is reachable from Reports → Open class report; if that control is ever removed, every `Class Report` row above becomes false again and must be re-decided.
