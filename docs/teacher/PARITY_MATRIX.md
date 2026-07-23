# Teacher dashboard parity matrix

**Scope:** A5.4 / A9.6
**Source retired:** the unreachable `dashboardMode` teacher variant formerly embedded in `AdminDashboardPage.jsx`
**Canonical teacher product:** `TeacherDashboardPage.jsx` plus its reachable Checkpoints, EL Assessments, Guided Reading, and Reports destinations

This matrix inventories every distinct capability that the retired branch exposed. A capability is marked `migrated` only when a reachable teacher surface owns the useful outcome. `dropped-with-reason` means the old behavior was misleading, incomplete, duplicated, unsafe, or contradicted a later plan requirement; the reason names the replacement where one exists.

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
| CAP-014 | Class report PDF | migrated | Reports → Class Report provides the printable five-page class document. |
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
| CAP-026 | Weakest-skills, support, and ready-for-challenge lists | migrated | Class Report separates mastery, whole-class focus, student progress, and suggested focus groups. |
| CAP-027 | Per-student assessment flags | migrated | Dashboard roster plus Suggested next steps provide class-scoped status and direct learner actions. |
| CAP-028 | Skill-coverage heatmap | migrated | Reports → Class Report → Student Progress Grid covers assessed skills; Dashboard also provides the interactive Sound Seekers class map. |
| CAP-029 | Whole-class next-step prose | migrated | Class Report focus rows and Suggested Focus Groups include named learners and activities. |
| CAP-030 | Cross-class Guided Reading log from browser storage | dropped-with-reason | A device-local scan could not prove school-wide completeness. Reachable learner Reports owns detailed Guided Reading evidence; A7.3 owns a durable class-first view. |
| CAP-031 | Guided Reading completion Excel from browser storage | dropped-with-reason | The export inherited the incomplete device-local scope. Complete report exports remain learner-scoped until A7.3 provides durable class evidence. |
| CAP-032 | HFW class summary capped at thirty learners | migrated | HFW evidence appears in the uncapped Class Report progress grid and in each learner's Skills Check evidence. |

## Consolidation contract

- `TeacherDashboardPage.jsx` is the only class-dashboard component reachable to signed-in teachers.
- `AdminDashboardPage.jsx` is admin-only and accepts no teacher/admin mode switch.
- Teacher route tests assert the canonical dashboard marker and assert that the admin dashboard is absent.
- Every retained report is reached through the product navigation and tested against the seeded audit school.
