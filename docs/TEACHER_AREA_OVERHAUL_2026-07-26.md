# Teacher area overhaul — 2026-07-26

Change record for the teacher-side pass that followed the Story Quest rewrite.
Written for whoever picks this up next, not as a status report.

## What was wrong

1. **The presentation view rendered nothing.** `presentationBuilder.js` injected the
   whole deck runtime as an inline `<script>` into a `blob:` document. A `blob:`
   document inherits its opener's Content Security Policy, and ours is
   `script-src 'self'` — so the browser silently dropped the script and the tab
   showed only the static footer line. Every screenshot of "the broken present
   area" was this and nothing else.
2. **"0 mastered" sat next to green 100% badges.** The Mastered count came from
   `statusId === "secure"` (a five-state evidence ladder). The colour band came
   from a bare `accuracy >= 50` cut. Two unrelated rules on the same card. A skill
   with three correct answers out of three was green *and* uncounted, and no screen
   told the teacher why.
3. **Starting a check bounced you out of the class.** The assess intent showed a
   read-only "current student" label; changing student meant navigating back to the
   roster and re-entering.
4. **Teacher UI said "children".** Every teacher-facing surface. Teachers say
   students. The copy gate `checkAppCopy.js` was actively enforcing the wrong word
   by listing `students?` as banned teacher jargon.
5. **One 2,845-line page.** `TeacherDashboardPage.jsx` was today's briefing, the
   roster, per-student panels, group planning, and settings in one file.

## What changed

**Presentation.** The deck runtime moved to `public/present/deck.js` and is loaded
as a same-origin `<script src>`, which CSP allows. Being a real file, it is now
linted — two empty `catch` blocks it had been hiding are fixed.

**Mastery.** `simpleAccuracyBand` is status-driven, not accuracy-driven: both the
count and the colour now come from the same five-state ladder
(secure / developing / needs_teaching / not_enough_evidence / not_checked).
`whyNotSecure()` returns the specific reason, and the summary splits into
needsTeaching / practising / mastered / notEnoughYet / yetToLearn. Every metric on
the teacher side has an entry in `src/utils/metricDefinitions.js`, surfaced through
the (i) buttons — added: practising, needs-teaching, not-enough-yet, round,
el-placement; corrected: mastered, current-skill, accuracy.

**Student selection.** `TeacherIntentPage` now renders a `<select>` scoped to the
class you are already in. The bounce to `TEACHER_CLASSES` is gone. `AppSurface`
passes `progressRows`, `selectedLearnerId`, `onSelectLearner` and `onOpenView`
into the assess and resources intents.

**Naming.** Teacher surfaces say "student". `students?` removed from
`TEACHER_BANNED`; `learners?` kept, so copy still normalises learner -> student.
Child-facing surfaces are untouched — `StudentEntryPage` still says what a
five-year-old reads, and the copy gate caught the one place that overreached.

**Split.** `TeacherDashboardPage.jsx` is deleted. In its place:
`TeacherTodayPage.jsx` (563 lines), `TeacherStudentsPage.jsx` (2,171),
`teacher/TeacherClassParts.jsx` (277) and `teacher/teacherClassModel.js` (178).
Sidebar nav is Dashboard / Students / Reports / Resources / Settings — the
separate "Checks" entry is gone, because a check now starts from the student you
are looking at. The nav id stays `"children"` so saved routes keep resolving.

**Reports route.** `/reports` is a whole-class report. One student's report opens
from the Student panel. The old per-student "report landing" screen — the one that
made you pick Skills check or Guided reading before showing anything — is deleted,
along with the two helpers that fed it.

## Gates

`checkAppStateArchitectureContracts.js` had been failing on all eight of its
App.jsx route needles, because routing moved to `AppSurface.jsx` and
`appRuntimeSurfaces.jsx` some passes ago and nobody repointed the gate. A gate
that is always red proves nothing, so it now checks the route surface as a whole.
The App.jsx-only assertions that still mean something (no `dashboardMode`, no
`useReducer`) are unchanged.

Four tests asserted pre-rename or pre-refactor text and were updated with a
one-line reason each. None were weakened.

## Still open

- `surfaceState` is never wired in production — ~330 lines of good empty/loading
  copy that nothing renders.
- Roster screenshot baselines need regenerating after the split.
- The simple report says "Practising" where the formal EL report says
  "Developing". Defensible (different registers, one is a standards document) but
  worth a decision.
- ~19 Story Quest art re-renders and 465 stale narration mp3s, per
  `STORY_QUEST_REWRITE_2026-07-26.md`.
