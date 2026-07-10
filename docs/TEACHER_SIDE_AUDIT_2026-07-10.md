# Teacher Side — Deep-Dive Audit (2026-07-10)

> **STATUS 2026-07-10 (same day): FIXED.** Every P0/P1/P2 below was resolved in
> the "Teacher side overhaul" commit, verified by 230/230 unit tests (47 new),
> the checkpoint integrity audit, and 0 eslint errors on all touched files.
> Deliberate exceptions, decided rather than dodged:
> (1) mastery pass thresholds were NOT changed — they are now *displayed* on
> every skill card ("Pass: N of M"); changing the pedagogy needs Benjamin's
> sign-off. (2) Non-phonics checkpoints keep accuracy-based passing, but the
> new per-question review rolls results up by diagnostic target so gaps are
> visible. (3) The cycle-23 poem "sing/song" flag was a false positive — the
> repetition IS the cycle's -ing/-ong pattern. (4) Book-level overrides remain
> a maintained data file by design (they correct catalog levels globally, not
> per student). Live visual walkthrough still pending a logged-in session.

Scope: reporting, UI, logic, design, content across the whole teacher side.
Method: four parallel code deep-dives, with every P0 and headline claim re-verified
against source by hand. Each finding is tagged **VERIFIED** (checked line-by-line)
or **REPORTED** (from deep-dive, plausible, needs a runtime check). A live UI
walkthrough is still pending (needs a logged-in teacher session) — layout/visual
findings will be appended after that pass.

**The single biggest lever:** `docs/OPUS_PRESENT_OVERHAUL_2026-07-09.md` was
written but never executed — all 17 Present-mode findings are still open in the
code today (re-verified). Running that overhaul is one action that clears the
largest block of P0/P1 content issues on the teacher side.

---

## Top 10, ranked

1. **[P0][VERIFIED] Report chart shows made-up percentages.** `FinishedReportPage.jsx:740-741` — Level 1 Sounds uses a hardcoded denominator of 25; Level 2 uses `max(items + 5, 26)`, a denominator that *grows as the child masters more*, so Level 2 can never reach 100%. A child who has mastered everything shows ~85%. Teachers make intervention decisions on this chart.
2. **[P0][VERIFIED] Present decks silently teach nothing on digraph cycles.** `presentationBuilder.js:138` filters spellings to 1-2 letters, so cycles built around `sh/ch/th/ng/ing…` (15, 23) lose their letter-sound and writing slides entirely. (Opus doc A.5, still open.)
3. **[P0][VERIFIED] Present decks drop whole PA skills.** `presentationBuilder.js:362` caps phonemic-awareness slides at 4 total, so a cycle's second PA skill can vanish. (Opus doc A.1, still open.)
4. **[P0][REPORTED] Questions can repeat within a checkpoint round when a bank runs low.** `App.jsx:~5016` falls back to the full pool (including already-shown items) when unused items run out — matters for thin banks (verbs 53, adjectives 49). Needs a runtime repro to confirm frequency.
5. **[P1][VERIFIED] Per-question results are never saved.** `saveMasteryToSupabase` (App.jsx:~5366) stores only skill-level aggregates; the checkpoint history a teacher sees says "11/12" but never *which* items were missed, so no error-pattern analysis (e.g. "always misses /i/ CVC words") is possible.
6. **[P1][REPORTED] Switching students may leave residual assessment state.** `loadStudentProgress` (App.jsx:3755+) rebuilds answer history from the DB and clears the checkpoint decision, but does not explicitly reset round state (`roundAnswers`, `currentQuestion`, `usedByStage`). Probably masked by the OVERVIEW redirect, but one `clearAssessmentState()` call would make it provably safe.
7. **[P1][REPORTED] Diagnostic mode doesn't adapt.** `diagnosticTarget` is recorded (App.jsx:955, 1033) but never steers question selection — the mode teachers may believe is adaptive is effectively random within the skill.
8. **[P1][VERIFIED] Assessment-week decks don't exist.** BOY/MOY/EOY assessment rows are filtered out of Present's cycle options (Opus doc A.7, still open) — no way to present assessment-week routines.
9. **[P1][REPORTED] Class dashboard "current skill" logic hides in-progress work.** Shows the first unmastered skill rather than the skill the child is actively working, so the dashboard under-represents movement.
10. **[P2][REPORTED] Engagement data is invisible to teachers.** Daily-mission streaks, arcade stars, and Hollow coins exist per-student but appear nowhere in teacher reports or exports — the easiest "wow" addition for parent conferences.

---

## A. Reporting & exports

- **[P0][VERIFIED]** Fabricated chart denominators (Top 10 #1). Fix: derive totals from the actual curriculum banks (count of level-1/level-2 items in the managed skill definitions), never constants.
- **[P1][REPORTED]** Story-quest star fallback assumes 1 star for completed quests with missing data — under-reports achievement. (FinishedReportPage star aggregation.)
- **[P1][REPORTED]** "Mastered" vs "On Track" terminology conflates checkpoint pass with item-level mastery; pick one vocabulary and define it in a legend on the report page.
- **[P1][REPORTED]** EL pattern totals computed as `length × 2` while scored as binary flags — percentages misalign when only one field is filled.
- **[P2][REPORTED]** Excel exports (`exportElAssessmentExcel.js`, `exportGuidedReadingCompletionExcel.js`) lack timestamps/recency and omit Story Quests entirely; comparison sheet renders even on first export.
- **[P2][VERIFIED-PARTIAL]** `answers` insert (App.jsx:5352) does not set `answered_at`; reads sort by it. If the column has a DB default this is fine — one-line hardening below regardless.
- **Missing reports teachers would want:** per-question review per checkpoint (needs #5 fixed first), guided-reading level-over-time, mission/streak/engagement summary, reread vs new-book distinction.

## B. Dashboard, navigation, class management

- **[P1][REPORTED]** Residual state on student switch (Top 10 #6) — add one explicit `clearAssessmentState()`.
- **[P1][VERIFIED-PARTIAL]** Admin delete class/student uses bare `window.confirm` (App.jsx:~2945, ~3015) — replace with the styled confirm dialog already used for progress reset, showing exactly what will be deleted.
- **[P1][REPORTED]** Reset-progress tombstone failure only `console.warn`s — teacher never learns the reset didn't propagate to other iPads. Surface a retry toast.
- **[P1][REPORTED]** "approval_setup_required" teacher-signup state is a dead end with an admin-jargon message and no self-serve path.
- **[P2][REPORTED]** Generic error toasts on roster actions (no reason shown for duplicate/invalid student names).
- **Positive:** teacher CSS is consistent (no unstyled areas found); no "Literacy Path" branding leaks in live UI; no internal jargon leaks found in labels.

## C. Assessments, checkpoints, mastery logic

- **[P0][REPORTED]** In-round repeats on thin banks (Top 10 #4). Fix: hard-exclude `keysAlreadyInRound` even in the fallback path; if the pool is truly exhausted, end the round early rather than repeat.
- **[P1][VERIFIED]** No per-question persistence (Top 10 #5). Fix: save the round's item results array alongside the aggregate — the answers table already has the rows; the checkpoint record just needs their ids.
- **[P1][VERIFIED]** Threshold asymmetry in `masterySystem.js`: Initial Sounds/Rhyming 7/8 (87.5%), CVC/Blends 8/10 (80%), HFW 9/10 (90%). May be intentional pedagogy — decide deliberately, document in the teacher UI ("pass = 8 of 10"), and show it on the checkpoint card.
- **[P1][REPORTED]** Non-phonics checkpoints (comprehension skills) pass on raw accuracy with no sub-skill coverage, unlike the sophisticated initial/final-sounds decisions — a child can pass "Inference" while failing every question of one sub-type.
- **[P1][REPORTED]** Diagnostic mode inert (Top 10 #7). Either wire `diagnosticTarget` into selection or rename the mode ("Practice") so it doesn't overpromise.
- **[P2][VERIFIED]** Retake stamp exists (`lastRetakeFailedAt`, App.jsx:5836) but nothing uses it yet — add a gentle "retested today already" hint to discourage same-day hammering.
- **[P2][REPORTED]** Mastery eligibility rule (4 attempts / 3 correct / 2 sessions, App.jsx:~5169) is sound but invisible — one tooltip would let teachers trust the "Mastered" label.
- **[P2][REPORTED]** No pre-assessment media check: a skill with missing audio/images fails mid-round with "No valid questions" instead of warning up front.

## D. Present, worksheets, guided reading, content

- **[P0/P1][VERIFIED] Execute `docs/OPUS_PRESENT_OVERHAUL_2026-07-09.md`.** Re-verified still open: digraph filter (A.5), PA cap (A.1), HFW slice(0,4) (A.6), assessment rows invisible (A.7), no Monday/Tuesday day structure (A.2), no blending slides (A.3), no guided-reading books slide (A.4), pickPer collisions (A.8), CURRENT_WORLD global (A.9), silent popup-block failure (A.10), online-only fonts on classroom projectors (A.11), no default cycle (A.12).
- **[P2][REPORTED]** Worksheets: no default cycle, no preview before download, no type descriptions; consider a "decodable mini-book" worksheet type.
- **[P1][REPORTED]** Guided reading has no teacher dashboard: no class completion view, no UI for per-student level overrides (`bookLevelOverrides.js` exists but is data-only), and cycle book recommendations aren't visible to teachers.
- **[P2][REPORTED]** Sidebar buries the teaching tools (Worksheets, Present at the bottom) with no one-line descriptions distinguishing Present / Worksheets / Reports.
- **[P2][REPORTED]** Content nits: cycle-23 poem uses "sing" redundantly; later-cycle `focusLetters` carry digraph spellings that the deck builder then drops (same root cause as A.5).

---

## Fix plan (phased, each phase independently shippable)

**Phase 1 — wrong data in front of teachers (small diffs, big trust):**
1. Real denominators in the sounds chart (A: FinishedReportPage.jsx:740).
2. Hard-exclude in-round repeats in the pickQuestion fallback.
3. `clearAssessmentState()` on student switch + styled delete confirmations.
4. Optional DB hardening (paste in Supabase SQL editor):
   `alter table public.answers alter column answered_at set default now();`

**Phase 2 — the Present overhaul:** execute the existing Opus doc end-to-end
(it already contains the 5-commit plan and invariants).

**Phase 3 — checkpoint transparency:** persist per-question results; show a
per-question review on the checkpoint card; display the pass rule; use the
retake stamp for a same-day hint.

**Phase 4 — reporting upgrades:** engagement (missions/streaks/arcade/coins)
section in reports + exports; story quests in Excel; timestamps in exports;
guided-reading teacher dashboard with level overrides.

**Phase 5 — polish:** sidebar descriptions + reorder, worksheet defaults and
previews, signup dead-end message, roster error reasons.

**Still pending:** live UI walkthrough (visual design, spacing, real data
rendering) — needs a logged-in teacher session on the dev server.
