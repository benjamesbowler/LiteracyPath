# Teacher surface state matrix

This is the product contract for non-happy states on the five primary teacher
surfaces. Every state preserves the teacher's current class and learner context
unless access has been denied. Missing data is never silently converted to zero,
and a failed write is never described as saved.

## Runtime signal contract

The shared `TeacherSurfaceState` component is adopted by both teacher page
families: `TeacherDashboardPage` owns Today and Classes; `TeacherIntentPage`
owns Assess, Progress, and Plan/Resources. A page supplies a `surfaceState` only
after its data or mutation layer has classified the condition. The component
does not guess from error text.

| State | Runtime signal | Data and controls |
|---|---|---|
| Loading | Initial request or a deliberate context change is unresolved. | Mark the region busy; do not offer a fake retry while the first request is active. |
| Empty | The request succeeded and the selected scope contains no relevant records. | Explain how to create the first meaningful record; never render an empty chart or zero as evidence. |
| Partial | At least one named source succeeded and at least one failed or is delayed. | Show only complete available values, label the missing source, and keep a targeted retry. |
| Offline | The browser is offline or the network request failed with a confirmed connectivity cause. | Saved data is read-only; writes and formal assessment starts stay paused. |
| Denied | Authentication succeeded but row, class, learner, or file permission failed. | Hide protected detail, preserve the broader teacher shell, and provide a safe route away. |
| Conflict | A write precondition or server version proves that a newer authorised change exists. | Preserve the local draft for comparison; never choose a version silently. |
| Expired | The session is absent or expired when protected data or a write must be confirmed. | Do not submit the write; preserve only the explicitly named local draft or notes. |
| Retry success | A user-initiated recovery finishes and all required sources now succeed. | State exactly what recovered, announce it politely, and offer one clear continuation. |

## Complete 5 × 8 matrix

| Matrix ID | Trigger and teacher meaning | Preserved or usable | Primary recovery |
|---|---|---|---|
| `today:loading` | Recent evidence and action priority are still being assembled. | Current class context. | Wait; no premature retry. |
| `today:empty` | The selected class has no evidence needing immediate follow-up. | Class activity and planning routes. | Review class activity. |
| `today:partial` | Some learner updates arrived and named updates are delayed or failed. | Actions based on available evidence only. | Review available actions; retry missing updates separately. |
| `today:offline` | The current brief cannot refresh because connectivity is unavailable. | Last saved brief, clearly described as saved. | Use the saved brief or retry the connection. |
| `today:denied` | The teacher no longer has permission for the selected class. | No protected learner detail; other authorised classes. | Choose another class or request access. |
| `today:conflict` | A newer authorised class update arrived while the page was open. | Current local notes. | Review the latest brief before keeping notes. |
| `today:expired` | The session ended before current evidence could be confirmed. | No class mutation; no protected values are exposed. | Sign in again. |
| `today:retry-success` | Previously missing learner updates now load. | Rebuilt brief and latest context. | Continue to today's actions. |
| `classes:loading` | Roster, learner access, and settings are being retrieved. | Selected school and class context. | Wait; no premature retry. |
| `classes:empty` | The authorised teacher has no class records. | School context and setup route. | Create a class. |
| `classes:partial` | Names loaded but progress, login, or activity fields are incomplete. | Available fields; missing values are not zero. | Use the available roster or retry missing fields. |
| `classes:offline` | The roster cannot refresh and roster writes cannot be confirmed. | Saved roster in read-only form. | View saved roster or retry the connection. |
| `classes:denied` | Roster permission for the selected class failed. | No learner access details; other authorised classes. | Choose another class or request roster access. |
| `classes:conflict` | Another authorised teacher saved a newer roster version. | Unsaved imported or edited names. | Compare versions before saving. |
| `classes:expired` | The session ended before a roster action was confirmed. | The action is unapplied. | Sign in again. |
| `classes:retry-success` | Roster, access details, and settings all reload. | Latest server roster. | Continue managing the class. |
| `assess:loading` | Learner evidence and eligible assessment choices are being prepared. | Selected class and learner context. | Wait; no premature retry. |
| `assess:empty` | No learner is selected for a learner-specific assessment. | Purpose-led assessment hub. | Choose a learner. |
| `assess:partial` | Assessment choices loaded but earlier comparison evidence did not. | Eligible checks and the evidence actually shown. | Choose an available assessment or retry earlier evidence. |
| `assess:offline` | A formal assessment cannot be started or securely completed offline. | Previously saved evidence. | Review saved evidence or retry the connection. |
| `assess:denied` | The teacher cannot access this learner's assessment record. | No assessment starts; other authorised learners. | Choose another learner or request access. |
| `assess:conflict` | A newer result was saved in another authorised session. | Unsaved observations for comparison. | Compare evidence before choosing what to keep. |
| `assess:expired` | The session ended before a result could be securely saved. | No incomplete result is added. | Sign in again. |
| `assess:retry-success` | Latest evidence and every eligible assessment choice reload. | Restored learner context. | Continue to assessment. |
| `progress:loading` | Checks, reading activity, and skill history are being combined. | Selected class, group, and learner context. | Wait; no premature retry. |
| `progress:empty` | No completed evidence exists for a progress conclusion. | Assessment and learning routes. | Choose an assessment. |
| `progress:partial` | At least one evidence source loaded and at least one did not. | Visible totals exclude missing sources. | Review available evidence or retry missing evidence. |
| `progress:offline` | The report cannot include new activity while offline. | Last saved report, labelled older and read-only. | View the saved report or retry the connection. |
| `progress:denied` | The teacher cannot access this learner's evidence. | No protected progress detail; other authorised learners. | Choose another learner or request report access. |
| `progress:conflict` | New evidence arrived while the current filtered report was open. | Current filters for comparison. | Refresh with latest evidence. |
| `progress:expired` | The session ended before report and export permissions were confirmed. | No export is produced. | Sign in again. |
| `progress:retry-success` | Missing sources load and totals are recalculated. | Complete latest report. | Continue reviewing progress. |
| `resources:loading` | Contextual teaching files and recommendations are being prepared. | Current class, learner, and curriculum focus. | Wait; no premature retry. |
| `resources:empty` | No plan has been saved in the current scope. | Curriculum browse and planning routes. | Browse teaching resources. |
| `resources:partial` | Core resources loaded while a linked file or recommendation failed. | Only complete available files. | Use available resources or retry missing resources. |
| `resources:offline` | New downloads and assignments cannot be confirmed. | Files already saved on the device. | View saved resources or retry the connection. |
| `resources:denied` | The selected protected file or context is not authorised. | Other available resources; no protected file content. | Browse available resources or request access. |
| `resources:conflict` | A newer teaching-plan version was saved elsewhere. | Unsaved local plan. | Compare plan versions before saving. |
| `resources:expired` | The session ended before a plan or assignment was confirmed. | Local draft; nothing is assigned. | Sign in again or keep the draft locally. |
| `resources:retry-success` | Missing files and recommendations now load. | Restored resources and local draft. | Continue planning. |

## State transition rules

1. Loading may resolve to the normal surface, Empty, Partial, Offline, Denied,
   or Expired. It does not jump directly to Retry success because no retry has
   happened.
2. Partial, Offline, Conflict, and Expired name what remains safe. Conflict and
   Expired never imply that a server write succeeded.
3. Retry success is temporary confirmation. Activating its continuation returns
   to the normal surface; it is not a permanent empty or success dashboard.
4. Denied clears protected detail before it is rendered. A request-access action
   never reveals whether an unauthorised learner record exists.
5. Conflict requires a server version or write precondition. Similar-looking
   text in a generic error message is not enough to classify a conflict.

## Assistive-technology contract

- Loading exposes `role="status"`, polite live announcement, and
  `aria-busy="true"` with no action that cannot yet work.
- Empty, Partial, Offline, and Retry success use polite status announcements.
- Denied, Conflict, and Expired use `role="alert"` and assertive announcement
  because the current protected task cannot continue safely.
- Every non-loading state has a primary action with a minimum 44-pixel target.
- Meaning is carried by the marker text, heading, and body; color is redundant.
- Focus remains on the action that triggered a retry. Recovery confirmation is
  announced without moving focus, and the teacher chooses when to continue.

## Fixture and release contract

`TeacherSurfaceStateFixtureSheet` renders all 40 combinations using the same
component and catalog as the product. The unit gate server-renders every fixture
and verifies identity, specific copy, action availability, preserved-data
language, roles, live regions, busy state, and fail-closed unknown IDs.
The browser fixture at `tests/fixtures/teacher-state-matrix.html` mounts that
same sheet for visual review without adding a test-only route to production.

`npm run check:teacher-state-matrix` runs that storybook-style fixture suite and
then confirms that this document covers all 40 catalog IDs and that both teacher
page families still adopt the shared primitive.
