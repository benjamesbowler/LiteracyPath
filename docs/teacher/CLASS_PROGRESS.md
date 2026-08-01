# Class-first Progress contract

Plan items: **A7.3, A7.4, A7.5, A7.6, A7.7**

The real teacher `Progress` intention is class-first. It reads the same live
class-dashboard dataset used by Today and Classes, then keeps the selected
class, group, and learner in the teacher profile and route hash.

## Required class views

| View | Evidence | Interpretation guard |
|---|---|---|
| Distribution | Current assessment accuracy for every active learner | A learner needs at least 8 scored responses before entering an accuracy band. |
| Coverage | Learners with any evidence, policy-ready learners, scored responses, and exact sound targets reached | Coverage means evidence exists; it does not claim mastery. |
| Groups | Learners sharing a current curriculum focus or exact Sound Seekers re-teaching signal | Suggestions are transparent and never auto-assign a learner. |
| Outliers | Policy-ready learners at least 15 percentage points from the class median | The class median and response count stay visible beside the flag. |

## Drill-down contract

From the Classes view, exact learner item evidence is reachable in no more than
three interactions:

1. Open `Progress`.
2. Open a learner from Groups or Outliers.
3. Open an exact sound item.

The item panel exposes the curriculum stop, current signal, recorded
encounters, independent-attempt denominator, independent accuracy, evidence
source, and update time. `at-risk` Sound Seekers records are classified as
`Needs re-teaching`; they cannot be softened to `Almost there` merely because
the learner accumulated historical correct responses.

## Evidence-basis policy

Every class, group, outlier, learner, and exact-item conclusion exposes the
same five bases:

| Basis | Displayed meaning |
|---|---|
| Attempts | Scored responses for learner/class and named-skill conclusions; independent attempts for an exact item. |
| Diversity | Distinct assessment skills represented in the saved response history. |
| Recency | Latest saved evidence date in UTC, or an explicit no-time state. |
| Confidence | `Insufficient evidence` below 8 learner responses; `Limited diversity` when policy-ready evidence covers fewer than 2 skills; `Moderate evidence` at 8+ responses across 2+ skills; `Stronger evidence` at 20+ responses across 3+ skills. |
| Support use | Supported versus recorded Sound Seekers encounters when the source captures it; otherwise `Not captured in scored checks`, never an invented zero. |

An overall learner/class accuracy conclusion requires 8 scored responses
across at least 2 distinct skills. A conclusion for one explicitly named skill
requires 8 scored responses for that skill. Exact-item accuracy requires 3
independent attempts. Below the relevant threshold, the product retains the
raw record but renders `Insufficient evidence`; one named skill can never
silently become a whole-learner band or class average. Suggested groups exclude
sparse learner accuracy and require either policy-ready shared-focus evidence
or policy-ready exact-item re-teaching evidence.

## Longitudinal growth

Selecting a learner loads the complete dated assessment history and reviewed
intervention history in bounded 500-row pages. Progress derives five views from
raw evidence rather than storing a second summary:

| View | Source and rule |
|---|---|
| Skill acquisition | First completed check that meets the current shared Secure evidence policy; the line is the cumulative count. |
| Retention | Later policy-ready checks of an already acquired skill, averaged by UTC month. |
| Fluency | Saved WCPM from completed oral-reading-fluency checks. |
| Support dependence | Percentage of question records that explicitly captured `supportUsed` or `supported`; missing support capture does not become zero. |
| Intervention response | Reviewed ineffective, partial, and effective outcomes shown as 0, 50, and 100 on the response axis. |

Every view uses the same dated horizontal domain. A curriculum marker appears
only when the raw attempt contains `curriculumVersion`; missing metadata stays
unlabelled. The chart never substitutes an in-progress attempt, current
aggregate, or zero for missing history.

## Saved instructional groups

Progress suggestions can become private saved instructional groups. Every group
stores the exact criterion, plain-language basis, and policy that produced it.
Membership is not overwritten: saving and each later movement review append an
immutable dated evidence snapshot.

Teachers can select exactly two saved groups for a side-by-side aggregate
comparison of learner count, scored responses, skill diversity, policy-ready
denominator, mean accuracy, and captured support use. The comparison never
ranks or orders individual children by performance. Movement is shown as
stayed, joined, and left under the same saved criterion; if that criterion is
no longer available, the last reviewed membership is preserved rather than
inventing a change.

Assigning a follow-up creates a normal owned, dated intervention linked to the
saved group and its latest reviewed membership. It therefore enters the
existing plan → deliver → record → review lifecycle on Today instead of
becoming an untracked report action.

## Insight actions

Every actionable group, outlier, and exact-item insight exposes the same four
next steps:

| Action | Contract |
|---|---|
| Assign practice | The teacher chooses learners and one to six exact targets supported by the current insight. The assignment is forward-merged into Sound Seekers progress and a normal dated intervention is created for response tracking. |
| Plan small group | The teacher confirms the learner membership, owner, date, and teaching activity. The plan is stored as a normal dated intervention. |
| Print resource | A real browser print view opens for a Sound Seekers practice pack at the lowest evidenced curriculum stop represented by the selected learners. |
| Record observation | Directly observed evidence is stored as an immutable insight snapshot and atomically linked to a dated intervention describing the next teaching response. |

Actions never infer a target or curriculum stop from absent evidence. Practice
assignments retain their exact targets and bounded insight snapshot.
Observation rows retain the insight label, focus, reason, criterion, learner
membership, and current evidence at the moment the teacher acted; they are
append-only, class-owned, and inaccessible across teacher tenants. Small-group
plans retain their confirmed membership, owner, date, focus, and activity in
the intervention record. Every tracked action appears on Today so the
follow-up can be measured through the existing intervention lifecycle.

## Persistence and recovery

- The route is `#teacher/progress?class=…&group=…&learner=…`.
- Reloading restores the class-dashboard dataset as well as the roster.
- A missing class or a class without evidence receives a specific empty state.
- The full learner report remains one explicit next action from the drill-down.

## Automated evidence

- `tests/unit/teacherProgressOverview.test.js` pins distribution, coverage,
  grouping, outlier, sparse-evidence, and semantic-render contracts.
- `tests/unit/questTeacherTools.test.js` pins `at-risk` re-teaching
  classification.
- `@teacher-class-progress` exercises the authenticated seeded route, counts
  the three interactions, verifies exact `/m/` evidence, and reloads the saved
  context.
- `@teacher-evidence-basis` verifies all five bases on the reachable class
  route and proves the seeded one-response learner renders `Insufficient
  evidence` without a bare `100%` conclusion.
- `@teacher-growth-history` loads 524 completed Aarav attempts across two
  storage pages, renders all five longitudinal views, and verifies the three
  seeded curriculum versions on the shared axis.
- `@teacher-instructional-groups` creates and reloads two criterion-backed
  groups, compares aggregate evidence, appends a movement review, assigns a
  linked follow-up, and proves the intervention appears on Today.
- `tests/unit/teacherInsightActions.test.js` pins exact target selection,
  lowest-stop print decodability, evidence withholding, and secure-focus
  fallback rules.
- `@teacher-insight-actions` sweeps every actionable insight card for all four
  wired controls, executes each action, proves the three tracked actions on
  Today, audits the modal, and verifies 1366, 1024, 768, and 390 widths.
- `tools/verifyTeacherInsightActionsBackend.mjs` proves assignment writes,
  observation/follow-up atomicity, append-only snapshots, tenant isolation,
  foreign-learner rejection, and malformed-snapshot rollback.
- The manual critic covers 1366×768, 1024×768, 768×1024, and 390×844 with no
  horizontal overflow or runtime console errors.
