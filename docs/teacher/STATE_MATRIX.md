# Teacher runtime-state truth

This document records only the non-happy states that the current teacher
product can actually select from live request state. It deliberately does not
turn a design fixture into release evidence.

Missing data is never silently converted to zero, an earlier class is never
reused as the current class, and a failed write is never described as saved.

## Runtime signals actually wired

The shared `TeacherSurfaceState` component is used by Today, Students,
Assessments, Reports and Resources. Each call is reached from a concrete
read-state branch:

| State | Live signal | Product behaviour |
|---|---|---|
| Loading | The class, roster or class-results request is idle/loading for the current teacher or selected class. | Mark the region busy, pause conclusions and show no retry button while the request is active. |
| Empty | A complete class-list request for the current teacher contains no classes. | Explain the first useful action and focus the real create-class control. |
| Partial | A current class, roster or results read failed, was truncated, or contains explicitly incomplete learner evidence. | Keep only verified context, withhold totals and recommendations that need missing data, name what stays safe and retry the exact failed source. |

The exact production-reachable combinations are:

| Combination | Trigger |
|---|---|
| `today:loading` | Current teacher's classes, selected roster or selected class results are still loading. |
| `today:partial` | Current class, roster, class results or learner evidence is incomplete. |
| `classes:loading` | Current teacher's classes, selected roster or selected class results are still loading. |
| `classes:empty` | Current teacher's class read completed with no classes. |
| `classes:partial` | Current class, roster, class results or learner evidence is incomplete. |
| `assess:loading` | Current teacher's class list is still loading. |
| `assess:empty` | Current teacher's class read completed with no classes. |
| `assess:partial` | The current class list failed or was truncated. |
| `progress:partial` | A class, roster or saved-results source needed by the report funnel is incomplete. |
| `resources:loading` | Current teacher's class list is still loading. |
| `resources:partial` | Current teacher's class list failed or was truncated. |

The page components do not accept a `surfaceState` override. This prevents a
test or story prop from being mistaken for product reachability.

## States not claimed

The earlier 5 × 8 fixture claimed Empty, Offline, Denied, Conflict, Expired and
Retry success across pages that did not select those states in production.
Those claims have been removed.

- Today has a real “no urgent actions” briefing, not a shared empty error state.
- Students has page-specific empty states for an empty roster and empty filter.
- Assessments and Reports are their own workflow pages. Their concrete
  incomplete-data branches are included above rather than being inferred from
  the older `TeacherIntentPage`.
- A signed-out or expired account is handled by the authenticated app shell.
- Row access is enforced by database policy and protected reads fail closed.
- Connectivity failures currently use the honest incomplete-data state; the app
  does not claim a readable offline snapshot that it has not persisted.
- The app does not claim conflict resolution because its roster records do not
  yet expose a server version precondition.
- A successful retry returns to the normal product view; it is not represented
  as a permanent synthetic success dashboard.

If any of those states gains a real runtime signal, data-preservation rule and
working recovery action, it can be added with a production journey first.

## Assistive-technology contract

- Loading exposes `role="status"`, a polite live announcement and
  `aria-busy="true"`, with no action that cannot yet work.
- Empty and Partial use polite status announcements.
- Every rendered recovery action has a real handler and a minimum 44-pixel
  target.
- Partial state names what stays safe; meaning never depends on colour alone.
- Retry moves focus to the live loading status while the request runs. If the
  read still fails, focus returns to its recovery action; if it succeeds, focus
  moves to the restored page heading. A replaced retry control never leaves
  focus behind on the document body.

## Production evidence contract

`TeacherSurfaceStateFixtureSheet` renders the eleven catalogued combinations
using the same component and copy as the product. It is a visual review tool,
not proof of reachability.

The release gate:

1. server-renders and checks all eleven combinations;
2. rejects unsupported combinations such as `today:conflict`;
3. confirms Today, Students, Assessments, Reports and Resources contain the
   corresponding concrete state branches;
4. rejects a generic state-injection prop on those pages;
5. checks the production mount for Resources and the 44-pixel action target.

`npm run check:teacher-state-matrix` runs those executable checks.
