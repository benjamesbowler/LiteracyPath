# Accessibility route and state inventory

Status: automated coverage implemented; manual assistive-technology execution
is external and not started.

The executable source of truth is
`src/accessibility/primaryRouteInventory.js`. The release gate fails if this
document drops an executable route/state ID or either required viewport.

## Automated viewports

| ID | Size | Purpose |
|---|---:|---|
| `desktop` | 1280×900 | Laptop/desktop route and state coverage |
| `mobile` | 390×844 | Small-phone route and state coverage |

Every row below is checked at both viewports for serious/critical Axe findings
and page errors by `check:a11y-routes`.

## Primary student routes

| Inventory ID | Human surface |
|---|---|
| `student-login` | Child class-code and learner sign-in |
| `student-home` | Signed-in child home and daily recommendation |
| `phonics` | Phonics learning route |
| `arcade` | Arcade game selection |
| `adventure-map` | Adventure Map |
| `sound-seekers` | Sound Seekers |
| `story-quests` | Story Quests |
| `reading-library` | Guided Reading library |
| `my-hollow` | My Hollow |

## Primary teacher routes

| Inventory ID | Human surface |
|---|---|
| `teacher-today` | Today priorities |
| `teacher-classes` | Classes and roster |
| `teacher-assess` | Assessment selection |
| `teacher-progress` | Class and learner progress |
| `teacher-resources` | Planning and resources |
| `teacher-report` | Learner report |
| `teacher-assessment` | Live formal assessment |
| `teacher-guided-reading` | Teacher Guided Reading workflow |

The production-authenticated `check:a11y-teacher` journey additionally covers
the five teacher intentions, semantic roster, class sound-map alternative,
question guide, class-code dialog, keyboard activation, focus trap, Escape
close, and focus restoration using the deterministic audit school.

## Key modal and overlay states

| Inventory ID | Human state |
|---|---|
| `teacher-question-guide` | Question-type guide dialog |
| `teacher-learner-drawer` | Learner detail dialog |
| `teacher-class-code` | Class-code regeneration dialog |
| `teacher-assessment-discontinue` | Stop-assessment confirmation |
| `sound-seekers-creator` | Creature creator |
| `arcade-game` | Full-screen game |
| `arcade-resume` | Resume-game alert dialog |

## Automation boundary

Automation is necessary but cannot establish usability with a screen reader,
switch device, keyboard-only workflow, 200% browser zoom, sound disabled,
reduced motion, or a child participant. Those modes are scheduled and recorded
using `MANUAL_AUDIT_PROGRAM.md` and the unexecuted first-run record in
`docs/release/EXTERNAL.md`. No automated pass is presented as human approval.
