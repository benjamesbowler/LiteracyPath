# Teacher-area redesign v2 — implementation plan (2026-07-28)

**Standard while the build runs; supersede when the last phase ships.** The approved
design is `mockups/design-handoff-teacher-area/Teacher Redesign v2.dc.html` (its README
is the written spec — colours, sizes, states, copy; read it first). The flat variant in
the same folder is reference only — do not build it.

**Viewing the prototype offline:** open `serve-v2.dc.html` over HTTP (any static
server) — it maps the runtime's unpkg React/Babel URLs onto the local copies committed
beside it via `window.__resources`, so it renders with no network. The `.dc.html`
originals need internet.

## Ground rules (from the handoff README, binding)

- Recreate with the existing `--lp-*` tokens and `src/components/teacher/ui/`
  primitives — never copy the prototype's inline styles, never introduce a new styling
  approach. Icons come from the app's existing set.
- Keep existing copy strings from `src/copy/teacherCopy.js` wherever they already say
  the same thing; every NEW string must clear `npm run check:app-copy`.
- "Not enough results" / "Not checked" are distinct first-class states — never 0%,
  never merged with accuracy. Accuracy and learning status stay separate columns.
- 44px touch targets (40px only for secondary in-row actions); visible custom focus
  (`2px solid` primary, 2px offset); all grids `auto-fit`/`minmax`; roster and reports
  tables scroll horizontally rather than compress.
- One screen per batch, verified and shown before the next (the handoff asks for this
  explicitly).

## Phase order and file map

Phase 1 — **Shared shell**: sidebar restyle + the NEW persistent context bar
(class/school/count + teaching cycle + global Present + Assess-a-student), mounted once
above the teacher content area in `AppSurface.jsx` (sidebar mounts at ~line 748; the
bar belongs at the top of `lg-content-area` for teacher views only).
Files: `Sidebar.jsx` (already has the right order/footer; needs class chip + Dashboard
badge + v2 visuals), new `teacher/TeacherContextBar.jsx`, `App.css` /
`lg-design-system.css`, `AppSurface.jsx`.
⚠ Data gap: **no class-level "current cycle" exists in the model** (verified 2026-07-28
during the Present work — nothing in class state carries a cycle). The bar's cycle slot
needs a real derivation (decide: teacher-set field on the class vs derived from class
progress) — decide before building the bar, since Dashboard's sound map and the
Assessments suggestion block want the same value.

Phase 2 — **Dashboard** (`TeacherTodayPage.jsx`): header, 5-metric strip (keep the
existing "fair average" tooltip wording), the two capped lists (attention 3 max / due
3-of-N), sound-map heat tiles (4 heat states incl. "not checked"), collapsed recent
changes. Wire to the real selectors behind today's briefing; numbers in the mock are
placeholders.

Phase 3 — **Students** (`TeacherStudentsPage.jsx`, 141KB — the big one): roster grid +
persistent right-hand student panel (status tiles, Do-next actions, latest evidence,
footer links), filter pills, search. Selection swaps the panel with no navigation and
no scroll jump.

Phase 4 — **Assessments** (`TeacherAssessmentsPage.jsx`): 1-2-3 step strip (step
derived, not stored), scoped student select ("changing student here does not leave the
page"), six assessment cards with colour-coded kind kickers, suggestion block.

Phase 5 — **Reports** (`TeacherReportsHubPage.jsx`): five-way status split, skills
table, EL-benchmark caveat footer verbatim.

Phase 6 — **Resources + Settings** (`TeacherIntentPage.jsx`,
`TeacherSettingsPage.jsx`): three whole-class tool cards, Level C book tiles wired to
`src/data/firstFactsLevelCBooks.js` (not hardcoded), four settings cards.

Cross-screen state (README "State Management"): `selectedStudentId` shared so every
"Assess"/"Open student" lands pre-scoped; `rosterFilter`; `soundMapSkillFilter` passed
to Reports. These ride the existing `goToTeacherIntent`/view-helpers routing — no new
router.

## Tests that assert the CURRENT markup (update to the new truth per phase, never delete)

`teacherBusyWorkflow` (whole-area source asserts), `teacherPrintAndResourceRoutes`
(landmarks + print isolation incl. sidebar hiding), `teacherSurfaceAccessibleNames`,
`teacherNavigationScale`, `teacherLoadingStates`, `teacherSurfaceStateMatrix`,
`teacherTodayBriefing` (phase 2), `teacherUiPrimitives`, `appViewHelpers`,
`primaryRouteA11yInventory`, `appCopyExports` + the rendered `check:app-copy` scan.
Known live faults to fix WITH their phase, not around: load-failure renders as "you
have no classes" (phase 1/2 territory), `surfaceState` passed by no caller, inactivity
filter string-matches "days ago" (phase 3). See the 2026-07-27 teacher critique record.

## Verification per phase (the bar the Present redesign set)

`TZ=Asia/Shanghai npm run test:unit` + `lint` + `build` + `check:app-copy`, plus
rendered screenshots of the real app next to the prototype screen. Cloud sandbox:
browser build 1223 is absent — symlink
`/opt/pw-browsers/chromium_headless_shell-1223/chrome-headless-shell-linux64/chrome-headless-shell`
→ `…-1194/chrome-linux/headless_shell` first.
