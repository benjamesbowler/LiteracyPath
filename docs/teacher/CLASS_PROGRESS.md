# Class-first Progress contract

Plan item: **A7.3**

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
- The manual critic covers 1366×768, 1024×768, 768×1024, and 390×844 with no
  horizontal overflow or runtime console errors.
