# Assessments and Reports funnels — 2026-07-27

Change record. Ben's brief: "it's currently convoluted", and two exact flows —

    Assessments > class > student > assessment > start point > Begin
    Reports     > class > student > report style > display

## Why it was convoluted

There was no single path to either. Starting an assessment meant finding the student
first: a "Check" button on a roster row, or "Check {name}" in the drawer. Seven separate
entry points funnelled into five different starter functions. The EL hub had **no URL at
all** — `useAppSessionController` rewrote it to the Students hash — so refreshing
mid-choice dumped you on the roster. `ASSESSMENT`, `CHECKPOINT`, `LETTERS` and
`ADVANCED_PHONICS` had no URL either.

Reports was worse: the sidebar Reports item did not reach the class report at all
(`#teacher/reports` resolved to a different view), a student's report opened from the
Students panel via one of **two duplicate handlers**, and the route whitelist silently
rewrote two of the six report styles to Overview on reload.

The choose-your-start-point control existed in exactly one place: a `<select>` *inside
the already-running assessment*. Backwards.

## What replaced it

**A registry.** `src/data/assessmentCatalog.js` is new and is the single source of truth
for what a teacher can start — seven entries composed from `skillTree.js` and
`EL_BENCHMARK_CATALOG` rather than forked from them. Each declares a `startPoint`
descriptor (`none` / `skill` / `gradeAndTime` / `gradeTimeAndBand`) so step 4 of the
funnel is data-driven instead of hand-written per assessment.

**Two funnel pages**, same shape so the pattern is learned once:
`TeacherAssessmentsPage.jsx` and `TeacherReportsHubPage.jsx`. Progressive disclosure —
each step unlocks as the one above is answered, earlier answers stay visible and
changeable, changing one clears the answers below it. A newly unlocked step takes focus.

**The whole funnel state lives in the URL.** `#teacher/assessments?class=&learner=
&check=&skill=&grade=&time=&band=`. A refresh keeps your place. This is the single
biggest fix for "convoluted".

**Whole class is a choice, not a destination.** At the Reports student step, "Whole
class" sits above the individual students, so the class report is inside the one funnel
instead of being a second place to go.

## Notable

- **"Assessments", not "Checks".** `tools/checkAppCopy.js` banned the word, so the first
  build shipped as "Checks". Ben asked for "Assessments" explicitly, so the ban moved
  instead — same call as `students?` before it. It stays banned in *child* copy.
- **A real bug found while testing the funnel:** `Number(params.get("skill"))` is `0`
  for a missing param, so every skills check would have silently started on Initial
  Sounds rather than the student's next skill.
- The EL prerequisite-override safeguard is preserved: deviating from the band the
  student's evidence points at still requires a recorded reason.
- `DashboardSummary` no longer renders over a saved report. Its gate was
  deny-list-driven and included `FINISHED` **by omission**, putting live-session metrics
  ("Round 0/15", "Session accuracy") above a saved report — figures the metric
  definitions themselves say will not match it. The gate is now allow-list driven.
- `TEACHER_REPORT_VIEWS` is derived from `STUDENT_REPORT_VIEWS`, so a seventh report
  style cannot reintroduce the drift.
- Retired: `APP_VIEWS.EL_ASSESSMENTS`, `APP_VIEWS.TEACHER_PROGRESS`, `ELAssessmentsPage`
  as a page, the dead `assess` intent and its two dead CSS rules, and one of the two
  duplicate open-report handlers.

## Still open

- `tools/checkElAssessmentProgressPersistence.js` was already failing before this work
  (`buildAssessmentAttemptRecord` does not exist in `App.jsx` at HEAD either).
- `elExportEvidenceConsistency` D-001 is timezone-dependent and fails outside local TZ.
- `TeacherProgressOverview.jsx` is kept but its `onOpenClassReport` branch is now
  unreachable. It survives only because `tools/checkLearningPolicyThresholds.mjs` names
  it as a surface.

---

## Browser pass on the deployed preview — 2026-07-27

Nine defects found by opening the app that no gate caught. Recorded because the pattern
matters more than the list: every one of these was invisible to a source-string check.

| # | What a teacher saw | Cause |
| --- | --- | --- |
| 1 | "Get set up in four steps · **0 of 4** · Create your class" on an account with a class and two students | `hasSetupClass = Boolean(selectedClass)` — the SELECTED class, not whether any exist. The primary button would have made a duplicate class. |
| 2 | Funnel choices rendered as bare bold text, no card, no border | `.app button` (0,1,1) beats `.teacher-funnel-option` (0,1,0) and sets `border: none`, `radius: 14px`, `padding: 10px 16px`. Measured in the browser. |
| 3 | "**[]** Full screen" mid-assessment | The literal string `"[]"` was a placeholder that shipped. |
| 4 | Full-screen icon would have drawn blobs | Both icons are stroke drawings with open subpaths; nothing set `fill: none`/`stroke`. The Learn area had been rendering blobs already. |
| 5 | A report rendered titled "**· Overview**" with no student | Show was gated on `styleChosen` alone, and `reportView` carries a persisted default, so step 3 counted as answered before step 2 existed. |
| 6 | Step 3 greyed out and locked, yet showing an answer and a Change link | `answer` was passed unconditionally to a locked step. |
| 7 | "Selecte…" in the report toolbar | `auto auto` grid squeezed a 149px label into 89px with `text-overflow: ellipsis`. The report is narrower now that it renders inside the funnel. |
| 8 | "Loaded Aaron." pinned at the top through the whole funnel | Developer phrasing in `setMessage`, and it shifts the layout on arrival. |
| 9 | Step 4 asked about "this check" while its own field said "assessment" | Missed in the Checks → Assessments rename. |

**The lesson, again.** Every gate was green before this pass and stayed green during it.
Defect 2 is the sharpest example: the CSS was correct, present, committed and deployed —
it simply never won. No amount of reading `App.css` would have revealed it; it took
`getComputedStyle` on the live page. `tools/checkButtonSpecificity.mjs` was added so this
particular trap fails a build instead of a teacher, and it ratchets against a baseline of
38 pre-existing losers rather than starting red.
