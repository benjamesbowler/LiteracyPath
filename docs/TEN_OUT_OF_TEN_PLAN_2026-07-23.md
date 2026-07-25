# TEN OUT OF TEN — The Plan
**Input:** `docs/FULL_APP_CRITIQUE_2026-07-23.md` (10 areas × 10 recommendations = 100 items)
**Goal:** every area scores a *defensible* 10/10 — verified by re-audit, not self-declared.
**Audience:** Codex (implementer). This document is your operating manual. Read all of it before writing code.
**Date:** 2026-07-23

---

## 0. The Covenant (read first, binding for every task)

The critique's central finding is **release truth**: green checks that don't test the real product. So this plan's first rule is about *how* you work, not what you build.

1. **A task is DONE only when its named gate passes against the REACHABLE product.** Route-level, rendered, interacted-with. A check that greps source strings proves nothing and may not be used as evidence of completion. (The critique documents exactly this failure: `checkTeacherDashboardDataContracts.js` inspecting `AdminDashboardPage.jsx` strings while the app renders `TeacherDashboardPage`.)
2. **You may never weaken a check to pass it.** Any change to a check's thresholds, scope, or assertions requires a `CHECK-CHANGE:` block in the commit message stating what changed, why the *intent* is preserved, and what now covers the removed assertion. These blocks are audited in Loop C.
3. **No silent waivers.** An item may be marked `WAIVED` only with an entry in `docs/release/WAIVERS.md`: item ID, reason, owner (Ben), expiry date. Waivers without expiry are invalid. The scorecard counts open waivers against the area score.
4. **No fake externals.** Some items require humans (legal review, teacher/child pilots, expert calibration). You must never simulate, stub, or self-certify these. You prepare every artifact they need, mark the item `EXTERNAL-READY`, and list it in `docs/release/EXTERNAL.md`. An area with open externals caps at "10/10 pending external" — clearly displayed, never rounded up.
5. **Small commits, each naming its item IDs** (e.g. `A5.4`), each leaving the full gate suite no worse than before. Never batch unrelated areas in one commit.
6. **Truncation, sampling, and caps must be labeled.** Anywhere the product bounds a list (top-N, slice, cap), the UI/export must say so. Silent truncation anywhere is a P0 regression (this killed `check:release-readiness-surface`).
7. **When you discover a NEW problem while working, add it** to `docs/release/DISCOVERED.md` with an ID (`D-###`), severity, and area. Discovered P0/P1 items join the loop like the original 100. Hiding a discovered problem is faking.

## 1. What "10/10" means (operational definition)

A critic will rarely write the number 10. So the score is defined mechanically, per area:

**Area score = 10 when ALL of:**
- All 10 of its recommendations are `DONE` (gate-verified) or validly `WAIVED` (unexpired, Ben-approved);
- Zero open P0/P1 findings against the area (original or `DISCOVERED`);
- All gates mapped to the area pass inside `npm run check:release`;
- Loop C's fresh-eyes re-audit produced **no new P0/P1** in the area, twice consecutively;
- Externals for the area are closed by a human, or the area is displayed as "10/10 pending external" (allowed end-state only for A1.10, A2 pilots, A4.10, A8.10, A10.10).

**The plan is complete when:** `check:release` is green with zero unexpired waivers, the scorecard shows 10/10 on all ten areas, and two consecutive Loop C audits (§3) confirm it.

## 2. The scaffolding you build FIRST (Phase 0 — Release Truth)

Nothing else starts until Phase 0 is merged. It builds the measuring stick so all later work is honestly measured. Covers: A10.1, A10.2, A4.8, A6.1, A9.6 (test half), A10.4, A10.3, A10.5, A10.6.

### P0.1 — `npm run check:release` (the single truth) — covers A10.2, A4.8
Create `tools/releaseGate.mjs` composing EVERY named gate — including the ones currently failing:
`lint (--max-warnings=0)` · `test` · `build` · `test:smoke` · `check:assessment-question-integrity` · `check:assessment-runtime-variation` · `auditAllSkillsStrictProductionReadiness` · `check:skill-progression (warnings→failures per A1.5)` · `check:teacher-dashboard-data (route-level, see P0.4)` · `check:product-finish-surface` · `check:release-readiness-surface` · `check:bundle-size (real thresholds, P0.6)` · `npm audit (fail on high/critical)` · `check:repo-hygiene (baselined, A10.5)` · new gates added by this plan (a11y, DB policy, E2E, CSP, variation-simulation).
Output: `docs/release/manifest.json` — machine-readable:每 gate → pass/fail, counts, timestamps, commit SHA. **The curriculum gate is composed** (A4.8): correctness ∧ depth ∧ variation ∧ media ∧ runtime-selectability must ALL pass per skill; one green dimension can never mask a red one again.

### P0.2 — Scorecard generator
`tools/releaseScorecard.mjs`: reads `manifest.json` + `TRACEABILITY.md` status + `WAIVERS.md` + `EXTERNAL.md` + `DISCOVERED.md` → writes `docs/release/scorecards/<date>-<sha>.md` with the 10 area scores computed by §1's definition, plus deltas vs the previous scorecard. Run at the end of every loop iteration. Never edit a scorecard by hand.

### P0.3 — Seeded audit school (unblocks everything teacher-side) — covers A6.1, A10.7 precondition
- SQL seed + `tools/seedAuditSchool.mjs`: one non-production school, 2 teachers (A and B for isolation tests), 2 classes, 26 synthetic learners with varied evidence: high/low accuracy, sparse evidence (for A4.1), long histories (for A7.2 pagination), multilingual names, one archived learner, in-progress + completed EL benchmark attempts across BOY/MOY, guided-reading logs, Sound Seekers mastery states.
- Deterministic: same seed → same data. Used by E2E, Axe, screenshot, and DB-policy tests, design review, and support reproduction. Documented in `docs/release/AUDIT_ACCOUNT.md` (how to reset; never points at production).

### P0.4 — Route-level contract tests replace string greps — covers A9.6(test), A10.1 precondition
Rewrite `tools/checkTeacherDashboardDataContracts.js` (and any sibling that reads component source as strings) as Playwright checks that log in as the seeded teacher, render the actual route, and assert on the DOM: the reports surface, EL Formal Assessments section, export buttons, roster columns. From this commit on, **unreachable code can no longer satisfy any check**.

### P0.5 — CI becomes the whole-product gate — covers A10.1, A10.3
`.github/workflows/ci.yml`: add a required `release-gate` job running `npm run check:release` (with the seeded DB via local Supabase or a test project). Lint moves to `--max-warnings=0` (fails on the current 16 — fixed in WS4). Branch protection: `checks`, `visual`, `release-gate` all required.

### P0.6 — Bundle budgets that protect — covers A10.4, A9.1 (gate half)
`check:bundle-size` gets real thresholds: main entry ≤ 500 kB raw / 150 kB gzip (staged: start at current+0% to freeze regressions, ratchet down per WS9 milestones — write the ratchet schedule into the check config so it tightens automatically by date); every route chunk ≤ 700 kB raw; any NEW chunk over 250 kB needs a `CHECK-CHANGE` justification. PR output publishes the trend table.

### P0.7 — Hygiene baseline & read-only checks — covers A10.5, A10.6
`check:repo-hygiene`: add an explicit allowlist (`tools/hygiene-baseline.json`) for the intentional preview harnesses (now under `preview/`) and generated outputs; separate every audit script into `--check` (read-only, writes only to `$TMPDIR` or `docs/release/artifacts/`) vs `--write-report` modes. CI runs `--check` only. Hygiene must then be zero-failure and meaningful.

**Phase 0 exit gate:** `check:release` runs end-to-end and produces manifest + scorecard (mostly red — that's the point: the scorecard now tells the truth). CI enforces it. Seed account works. Commit the first honest scorecard.

## 3. The Loops (this is the "loop until 10/10" machine)

### Loop A — inner build loop (you, continuously)
For each task: implement → run the task's named gate → fix → repeat until green → run the workstream's gate set → commit with item IDs. Never move on with a red task gate.

### Loop B — release loop (end of every workstream, and at least daily)
Run `npm run check:release` → regenerate scorecard → diff vs previous. Any regression anywhere (even in an area you didn't touch) becomes your next task before new feature work. Append one line to `docs/release/LOOP_LOG.md`: date, sha, areas touched, gates fixed, gates broken, score vector (e.g. `7,6,8,6,5,5,8,7,8,5`).

### Loop C — adversarial fresh-eyes re-audit (the anti-faking loop)
Trigger: when Loop B's scorecard first claims all areas ≥ 9, and after that at every claimed all-10.
Protocol:
1. A **fresh session with no implementation context** (new Codex/Claude session; do not paste this plan) is given the SAME brief as the original critic: *"Full product critique of LiteracyPath: 10 areas × 10 recommendations, evidence-labeled (Observed/Derived/Inferred), P0–P3, run the named checks yourself, inspect the running app with the seeded teacher account."* It must run `check:release` itself and browse the seeded product.
2. Its output is committed verbatim to `docs/release/audits/RE_AUDIT_<n>.md`. You do not edit it.
3. Triage every finding: map to an existing item, or open a `D-###`. **Any new P0/P1 in an area resets that area's Loop C counter to zero.**
4. Fix, run Loop B, re-trigger Loop C.
5. Exit: **two consecutive** Loop C audits with zero new P0/P1 in every area. P2/P3 findings from Loop C go to a tracked backlog but don't block the 10.
Anti-gaming: Loop C auditors get the repo + running app + seed account, never this plan or prior triage; their prompts are stored in `docs/release/audits/PROMPT.md` and must not be tuned to be softer between rounds (same `CHECK-CHANGE` rule applies to the prompt).

### Loop D — per-skill curriculum loop (WS1's engine, runs in parallel)
For each of the 30 skill groups: `authored → approved → runtime-selectable` counts from the composed curriculum gate → fill question gaps → wire media → pass variation simulation → mark skill READY. Loop until **30/30 READY, 0 variation failures, 0 media-wiring failures**. Progress table auto-generated into the admin QA console (WS10.9) and `docs/release/CURRICULUM_BOARD.md`.

## 4. Workstreams (WS1–WS10 = critique Areas 1–10)

Task IDs are the critique's own numbering (`A<area>.<rec>`), so traceability is inherent: **all 100 exist below; none may be skipped.** Each task lists its gate. Sequence: Phase 0 → WS10+WS4 (truth+logic) → WS5+WS6+WS7 (teacher) → WS1+WS3 (curriculum+a11y, parallel via Loop D) → WS2 → WS8 → WS9 → Loop C rounds.

---

### WS1 — Student content & educational quality (Area 1) → 10/10
**10/10 =** 30/30 skills READY on the composed gate; 0 runtime-variation failures; 0 media-wiring failures; per-skill inventory visible; expert/pilot pack EXTERNAL-READY.

- **A1.1 (P0)** Write `src/content/releaseStandard.js` — ONE canonical "student-selectable & release-ready" standard (question count, balance, media, accessibility per skill). The composed curriculum gate imports it; publication is blocked per-skill until it passes. *Gate:* strict audit reads the same module (no second definition anywhere — grep-guard test).
- **A1.2 (P0)** Runtime diversity budgets: per-round caps for repeated image/word/distractor/phoneme/template. Implement in the actual selector (`initialSoundSelector.js` and siblings), then **test the real algorithm**: `tools/simulateRuntimeVariation.mjs` runs ≥500 seeded sessions per skill and asserts budget compliance. *Gate:* `check:assessment-runtime-variation` = 0 failures (currently 876: initial sounds 438, short-vowel 141, final sounds 137, CVC 107) AND the simulation gate passes.
- **A1.3 (P0)** Media completion board: generate `docs/release/MEDIA_BOARD.md` from the manifests — per skill: owner, source/license, review status, pronunciation variant; add `check:media-runtime-resolution` that loads each referenced asset URL from the built app (HTTP 200 + nonzero size), not manifest presence. *Gate:* 0 of the 384 wiring fixes remain; 28 missing-audio and 22 missing-image skill groups cleared or explicitly waived per skill.
- **A1.4 (P1)** Rebalance Initial Sounds: phoneme frequency + interaction-type concentration caps (no letter, prompt family, or response format > configured share per level) written into `releaseStandard.js`. *Gate:* balance report inside strict audit passes; `listen_and_find` share below cap.
- **A1.5 (P1)** `check:skill-progression`: repetition/underfill warnings become **failures** for release-managed skills; documented spaced-retrieval exceptions live in a reviewed exceptions file. *Gate:* 0 warnings (from 55) or listed exceptions.
- **A1.6 (P1)** Admin content QA shows `authored / approved / runtime-selectable` as three separate counts per skill (the 287 audio-blocked candidates made visible). *Gate:* route-level test asserts the three numbers for a seeded skill.
- **A1.7 (P2)** Strip internal metadata (`level-c`, `moonwood-tales`, `longer-story-pages`) from child-facing Guided Reading; replace with a child-friendly level badge; keep metadata for teacher/admin surfaces. *Gate:* smoke test asserts no internal slug text renders in student mode.
- **A1.8 (P1)** Replace *Shy Comes Out to Play* p9 image; rerun visual/media audit. *Gate:* integrity check reports zero unresolved active-book image flags — and this zero-flags condition joins `check:release` permanently.
- **A1.9 (P2)** Decoding-support ladder in the reader: whole-word audio → segmented/phoneme support → reread prompt; log support use per word into guided-reading records (teacher-visible; no picture/context cueing). *Gate:* unit tests on ladder state machine + support-use events visible in the seeded teacher's report.
- **A1.10 (P1 · EXTERNAL)** Prepare the expert-review + pre/post pilot pack: measurement plan (accuracy, latency, retention, transfer to unseen items, support use, subgroup outcomes), consent templates, data-export scripts, revision workflow. *Gate:* pack committed under `docs/research/`; listed EXTERNAL-READY. (Human execution required — never simulate results.)

### WS2 — Student UX, navigation & motivation (Area 2) → 10/10
**10/10 =** home hierarchy is one-dominant-action; all flows have tested error/recovery states; labels/CTAs specific; child pilot pack EXTERNAL-READY.

- **A2.1 (P1)** Home: ONE dominant recommended next activity (chosen by the policy module, WS4.2), two secondary, rest behind "More to explore". *Gate:* screenshot diff + DOM test of hierarchy; recommendation source asserted.
- **A2.2 (P1)** "Keep playing" → specific continuation: activity + remaining goal ("Continue Sound Seekers — 2 trails left"). *Gate:* DOM test with seeded progress.
- **A2.3 (P1)** Daily mission promoted into main hierarchy; per-step celebration; primary button launches the next required task. *Gate:* E2E: complete a step → celebration → button routes correctly.
- **A2.4 (P1)** Card states: `New / Continue / Teacher picked / progress marker` — no raw scores to children. *Gate:* DOM test across seeded states.
- **A2.5 (P2)** Spoken labels (tap-to-hear) + stable icons for rail destinations; teacher-controlled reduced-choice mode for emerging readers. *Gate:* a11y name tests + settings persistence test.
- **A2.6 (P1)** Login recovery: illustrated + spoken error states distinguishing "code not found" / "offline" / "ask your teacher"; entered code preserved. *Gate:* E2E for each failure path (mock network), asserting speech affordance + preserved input, never color-only.
- **A2.7 (P3)** Tighten login panel; teacher escape visible-but-subordinate; class-code visual example in freed space. *Gate:* screenshot diff.
- **A2.8 (P2)** Guided Reading controls: "Read Page" primary; page count becomes status; Full Screen/Back grouped secondary. *Gate:* DOM hierarchy test.
- **A2.9 (P2)** Sound Racer tutorial example generated from the CURRENT target sound, with audio; motor instruction separated from the phonics example. *Gate:* unit test: tutorial letter === level target across seeds.
- **A2.10 (P1)** Accessible names derive from the active surface ("Close Make your creature"); add semantic assertions for EVERY fullscreen modal/game overlay. *Gate:* new a11y test sweep over all overlays.
- *Pilot note:* child usability observation joins the A1.10 external pack.

### WS3 — Student UI, visual design & accessibility (Area 3) → 10/10
**10/10 =** Axe serious/critical = 0 on every primary route+modal at two breakpoints; comfort settings shipped; device matrix green; media-failure behavior question-safe.

- **A3.1 (P2)** Write `docs/design/CHILD_SURFACE_RULES.md` (title, instruction, choices, progress, one primary action) and audit every student route against it; fix deviations. *Gate:* checklist committed with per-route status, all pass.
- **A3.2 (P2)** Image hierarchy: instructional evidence > reward/world art > decoration; consistent framing + loading placeholders. *Gate:* screenshot diffs on key routes; placeholder test (throttled network).
- **A3.3 (P0)** Axe gates for EVERY primary route and key modal state, desktop + mobile viewports (student home, assessments, Guided Reading, reports, authenticated teacher pages via seed). *Gate:* `check:a11y-routes` in `check:release`, serious/critical = 0.
- **A3.4 (P1)** In-product accessibility settings per learner: reduced effects, untimed/extended response (this must ALSO disarm TrailRun-style countdowns), lower audio intensity, narration, simplified backgrounds; persisted per profile. *Gate:* E2E toggles each and asserts effect (e.g., timer absent).
- **A3.5 (P1)** Contrast + visible-focus verification for game overlays, disabled states, badges, low-opacity text (Sound Racer dark overlay, dimmed locked creature options); test high-contrast mode. *Gate:* automated contrast checks + focus-visible assertions in the overlay sweep.
- **A3.6 (P1)** Device matrix: small phone, tablet, Chromebook, projector resolutions × orientation × keyboard state × fullscreen transitions; screenshot diffs + overflow/tap-target (≥44px) assertions for every student route. *Gate:* `check:device-matrix` green.
- **A3.7 (P2)** Reading measure: line length constrained by level; optional line focus/highlight; per-template image/text ratios. *Gate:* rendered-line-length test per level template.
- **A3.8 (P2)** Locked items: coin icon + "20 coins — earn 12 more" (visible + spoken), preserving disabled-state contrast. *Gate:* DOM + contrast test.
- **A3.9 (P2)** Emphasis budget: strongest scale/color/motion reserved for the recommended learning action (pairs with A2.1). *Gate:* screenshot review checklist.
- **A3.10 (P1)** Media = evidence policy: meaningful alt/accessible names where images carry the answer; decoration explicitly marked; on media load failure the item is REMOVED from the round (question-safe fallback), never guessed around. *Gate:* unit test: failed image ⇒ item excluded + round refilled; a11y name audit on evidence images.

### WS4 — Assessment, adaptivity, logic & reasoning (Area 4) → 10/10
**10/10 =** one versioned policy module owns every threshold; no conclusion without evidence basis; 0 hook warnings; report truncation gone; EL formal surface live; composed gate green.

- **A4.2+A4.1 (P1, do together)** Create `src/policy/learningPolicy.js` — versioned, documented: thresholds (the 70%…), minimum-evidence rules, recency windows, confidence requirements, progression rules; every conclusion stores the policy version. Reteach flags require min evidence + recency + confidence, else render **"Not enough evidence"**. Kill every hard-coded threshold at presentation layer (the critique's `accuracy < 70`, and the 80/60 vs 85/65 double-standard in `reportSections.js` vs `assessmentHistoryStore.js`). *Gate:* grep-guard: no numeric thresholds outside the policy module; unit tests for min-evidence gating; UI shows "Not enough evidence" for the seeded sparse learner.
- **A4.3 (P1)** Class summaries: show learner-weighted AND response-weighted accuracy with evidence counts; suppress single class average when comparability is weak (policy-defined). *Gate:* unit tests on both aggregations; DOM shows both + counts.
- **A4.4 (P1)** "Why this next?" explanations everywhere a recommendation appears (child: brief; teacher: precise — evidence, dependency, confidence, unlock). *Gate:* DOM tests for both surfaces.
- **A4.5 (P1)** Fix all 16 React hook/dependency warnings (9 in `App.jsx`, plus Guided Reading + Adventure Game); each fix gets a focused regression test; lint `--max-warnings=0` becomes CI-enforced (P0.5). *Gate:* lint clean; new tests pass.
- **A4.6 (P0)** Remove mastered-item truncation from formal reports/exports; collapsible summaries only in interactive UI, labeled "abbreviated — full list in export" where used. Test a seeded high-volume learner (500+ items) for pagination + completeness. *Gate:* `check:release-readiness-surface` passes; export-completeness test green.
- **A4.7 (P1)** Engagement events: keep child flow non-blocking, but queue failed RPCs durably (retry with backoff), expose sync health per class to teachers/admins, alert when loss-rate exceeds threshold. *Gate:* unit tests for queue/retry; seeded sync-health panel renders; chaos test (offline mid-write) recovers.
- **A4.8 (P0)** The composed curriculum gate — built in P0.1. *Gate:* one command, five dimensions, all required.
- **A4.9 (P0)** EL Formal Assessments on the REACHABLE teacher route: saved reports, evidence scope, PDF/Excel, deletion/retention behavior. (Build inside WS5's consolidated dashboard — this is the contract; WS7.1 is the surface detail.) *Gate:* route-level `check:teacher-dashboard-data` + `check:product-finish-surface` pass.
- **A4.10 (P1 · EXTERNAL)** Calibration pack: item-difficulty and threshold-validation protocol with literacy specialists; monitoring dashboards for false-positive reteach, subgroup performance, differential item behavior (build the dashboards now from seeded data). *Gate:* dashboards live; protocol EXTERNAL-READY.

### WS5 — Teacher workflow & information architecture (Area 5) → 10/10
**10/10 =** ONE teacher product, five-intention IA, class-first context, complete intervention loop; the unreachable branch deleted.

- **A5.4 (P0, FIRST)** Consolidation: build `docs/teacher/PARITY_MATRIX.md` listing every capability in the unreachable `dashboardMode === "teacher"` branch of `AdminDashboardPage.jsx` (~2,000+ lines: Overview cards, Assessment Progress, class chart, heatmap, needs-support lists, Guided Reading log, HFW, Export hub) vs `TeacherDashboardPage.jsx`. Migrate the winners into the ONE teacher product, then **delete the dead branch**. Route-level tests prove which component renders. *Gate:* grep-guard: `dashboardMode === "teacher"` no longer exists; parity matrix all rows `migrated|dropped-with-reason`; route tests green.
- **A5.1 (P1)** IA reduced to five intentions: **Today · Classes · Assess · Progress · Plan/Resources**; the nine module-shaped destinations nest contextually. *Gate:* nav DOM test; old routes redirect.
- **A5.2 (P0)** Landing = a real "Today" briefing: who needs attention (policy-gated, evidence-labeled), what's due, what changed, direct actions. *Gate:* E2E with seeded data asserts all four zones + actions fire.
- **A5.3 (P1)** Class as persistent context: class → group → learner drill-down WITHOUT loading a learner into the whole app shell (kill the session-swap). *Gate:* E2E: open 3 learners from class view; teacher context (URL/state) preserved throughout.
- **A5.5 (P1)** Onboarding: setup checklist with completion state, sample/demo data, guided "create class → add/import learners → set logins → run first check". *Gate:* E2E of the golden path from a fresh seeded teacher.
- **A5.6 (P1)** Roster at real-class scale: CSV import (with duplicate handling), search, sort, filter, instructional groups, bulk login-card generation, safe archive/transfer. *Gate:* E2E: import 28-row CSV with 2 dupes → resolve → bulk cards → archive one → transfer one.
- **A5.7 (P2)** Copy code → accessible toast; regenerate → in-product dialog stating impact, deliberate confirm, reported result. No native `confirm`. *Gate:* interaction test + a11y announcement assertion.
- **A5.8 (P1)** Login cards: proper printable route or PDF (page-sized, previewed, accessible, school/class context), **no `document.write`** (also unblocks CSP in WS8.4). *Gate:* print-route test; grep-guard: no `document.write` in src.
- **A5.9 (P2)** "Previewing as…" banner in student-preview, writes disabled by default, one-click return to exact teacher context. *Gate:* E2E: preview → attempt write → blocked → return lands on the same screen.
- **A5.10 (P1)** Intervention loop: suggestions become trackable actions (owner, date, group, activity, outcome, next review); overdue/ineffective interventions resurface on Today. *Gate:* E2E full loop: plan → deliver → record → review → follow-up appears.

### WS6 — Teacher UI, design & operational usability (Area 6) → 10/10
**10/10 =** seeded account powers design review + tests; consistent feedback states; defined metrics everywhere; teacher journey a11y-clean; one design system.

- **A6.1 (P0)** = P0.3 (seed account). *Gate:* documented + used by CI.
- **A6.2 (P1)** Roster: scannable default columns + configurable columns + detail drawer; verified responsive on Chromebook (1366×768) and tablet in the device matrix. *Gate:* device-matrix screens + drawer interaction test.
- **A6.3 (P2)** "Question type guide" moves to contextual help/onboarding/searchable guide, linked from evidence drawers. *Gate:* dashboard DOM no longer contains the guide inline; help reachable in ≤2 clicks.
- **A6.4 (P1)** Page order by urgency: blockers/setup → Today actions → class pulse → roster admin (collapsed). *Gate:* DOM order test.
- **A6.5 (P1)** ONE feedback pattern for pending/success/error/undo across clipboard, sync, print, loading, exports — announced to AT. *Gate:* shared component adopted (grep-guard against ad-hoc toasts); a11y announcement tests.
- **A6.6 (P1)** Metric definitions: every accuracy/mastered/active/started/current-skill/trails figure carries a tooltip with denominator, date range, minimum evidence, update time — and the same definitions are embedded in exports. *Gate:* DOM test on each metric; export snapshot includes definitions sheet.
- **A6.7 (P0)** Authenticated teacher a11y: keyboard-only journey, SR landmarks/names, focus traps in dialogs, table semantics, chart text alternatives, Axe on the seeded journey. *Gate:* `check:a11y-teacher` green in `check:release`.
- **A6.8 (P2)** One assessment hub with teacher-tested language: universal benchmark / diagnostic follow-up / progress monitoring / practice (retire raw "Checkpoints/EL Checks/Advanced Phonics" taxonomy from nav). *Gate:* nav copy test; old terms only in help glossary.
- **A6.9 (P1)** Full state matrix per teacher surface: loading, empty, partial, offline, denied, conflict, expired, retry-success — designed and tested. *Gate:* state-matrix doc + storybook-style fixture tests for each state on the top 5 surfaces.
- **A6.10 (P1)** Consolidate teacher primitives (tokens, charts, tables, filters, dialogs, page shells) into `src/components/teacher/ui/` with visual regression coverage. *Gate:* duplicated implementations removed (grep-guard); visual snapshots stable.

### WS7 — Reporting, insight & exports (Area 7) → 10/10
**10/10 =** EL formal surface shipped + checked route-level; exports complete with provenance; class-first progress with growth views; three audiences.

- **A7.1 (P0)** EL Formal Assessments section in the real teacher Reports route (with A4.9): saved reports list, evidence scope picker, PDF/Excel, deletion/retention. Checks **render and interact**, never grep. *Gate:* the two failing checks pass route-level.
- **A7.2 (P0)** Complete evidence in formal outputs: summary vs appendix separation; high-volume pagination tested; any abbreviation labeled. *Gate:* `check:release-readiness-surface` + 500-item export test.
- **A7.3 (P1)** Class-first Progress area (salvaged heatmap etc. from A5.4): distribution, coverage, groups, outliers, drill-down to learner evidence. *Gate:* E2E from class view to item evidence in ≤3 clicks.
- **A7.4 (P1)** Every displayed conclusion exposes evidence basis (attempts, diversity, recency, confidence, support use) and renders "insufficient evidence" below policy minimums — never a bare misleading percentage. *Gate:* DOM test incl. the seeded sparse learner.
- **A7.5 (P1)** Growth: time-series for skill acquisition, retention, fluency, support dependence, intervention response — with curriculum-version markers on the axis. *Gate:* chart renders from seeded history; version marker test.
- **A7.6 (P2)** Saved instructional groups from transparent criteria; compare, assign follow-up, review movement; no public child ranking. *Gate:* E2E create/save/compare/assign.
- **A7.7 (P1)** Close the loop beside every actionable insight: Assign practice · Plan small group · Print resource · Record observation; follow-up measured (feeds A5.10). *Gate:* buttons present + wired on every insight card (DOM sweep).
- **A7.8 (P2)** Immutable evidence: store assessment/content/policy versions with results; raw evidence preserved so history stays explainable after curriculum changes. *Gate:* schema/migration + replay test: old report re-renders identically post-content-change.
- **A7.9 (P1)** Export provenance block in EVERY export: school/class, learner-ID policy, generated timestamp+timezone, filters, evidence window, app/content/policy versions, definitions, privacy classification. *Gate:* export snapshot tests for PDF+Excel+CSV.
- **A7.10 (P2)** Three report audiences: teacher diagnostic · class/leadership summary · family-friendly (strengths-based, action-oriented, no internal jargon, no currency). *Gate:* three templates render from one seeded learner; family version passes a plain-language lint (word/jargon list).

### WS8 — Backend, security, privacy & compliance (Area 8) → 10/10
**10/10 =** DB policies proven by tests; leaderboard safe; CSP enforced; 0 high/critical advisories; monitoring + recovery live; legal pack EXTERNAL-READY.

- **A8.1 (P1)** DB integration tests against a real (local/CI) Supabase: teacher A cannot read teacher B; anon child-login scope; expired/rotated codes; student-token scope; admin-only paths; deletes; EVERY security-definer RPC. *Gate:* `check:db-policies` in `check:release`.
- **A8.2 (P0)** Leaderboard lockdown: require valid student token; pseudonyms by default; class scope unless a teacher explicitly opts into school scope; write the privacy note. *Gate:* DB test: anon call fails; token call returns pseudonymized class-scoped rows. Flag the live RPC for human privacy review (EXTERNAL entry).
- **A8.3 (P1)** Class-code abuse controls: per-IP/device/code throttling, short lockouts, anomaly alerts, optional expiry, teacher-visible access log (minimal child data). *Gate:* rate-limit test (burst → 429/lockout); log renders for seeded teacher.
- **A8.4 (P1)** CSP: start report-only; remove blockers (`document.write` print — killed in A5.8; ExcelJS eval — A8.5/A9.4); then enforce nonce/hash policy + COOP/COEP/CORP as applicable. *Gate:* headers present in `vercel.json`/middleware; CSP-violation test page clean; enforcement on.
- **A8.5 (P0)** Dependencies: fix the 2 high + 3 low advisories (`brace-expansion` dev chain; `tmp@0.1.0` via `exceljs@3.4.0` — upgrade ExcelJS or replace with `exceljs`-free writer); verify exports byte-compatible enough (snapshot tests); `npm audit` gate (fail high/critical) in CI with documented exception process. *Gate:* audit clean; export snapshots pass.
- **A8.6 (P1)** Privacy-preserving remote error monitoring: redacted (no child names/answer content), release IDs, sampling, retention, alerting; keep the local ring buffer as fallback. *Gate:* deliberate test error appears in the monitor with release tag and without PII (assert redaction in the client hook's unit test).
- **A8.7 (P1)** Backup/restore: document RPO/RTO; verify backups; rehearse restore into an isolated environment; test recovery of classes, evidence, report history. *Gate:* `docs/ops/RECOVERY_RUNBOOK.md` + a recorded successful drill (restore log committed as artifact).
- **A8.8 (P1)** Data-rights workflow: in-product teacher/admin export + deletion for a learner; request tracking, identity verification steps, deletion SLA; audit trail. *Gate:* E2E: delete seeded learner → evidence gone from UI/exports → tombstone in audit log; docs updated.
- **A8.9 (P1)** Retention: configurable school policy, inactive-account cleanup, end-of-year archive/delete, deletion propagation incl. backups; subprocessor/region disclosure page. *Gate:* retention job unit tests + docs.
- **A8.10 (P0 · EXTERNAL)** Compliance pack for counsel: draft ToS, DPA, subprocessor list, security summary, accessibility statement, incident-response process, school/parent consent materials, region matrix (COPPA/FERPA/UK GDPR). *Gate:* pack complete under `docs/legal/` → EXTERNAL-READY for qualified legal review. Never mark reviewed yourself.

### WS9 — Performance, reliability & architecture (Area 9) → 10/10
**10/10 =** budgets enforced and met; real code-splitting; App.jsx decomposed below threshold; URL routing; typed boundaries; monitored fleet.

- **A9.1 (P1)** Meet the budgets from P0.6: bundle-graph inspection, remove unused deps/code, first-load student and teacher shells pull only their surface. *Gate:* main entry ≤ 500 kB raw/150 kB gzip (ratchet schedule to get there is in the check config; each ratchet step is a task).
- **A9.2 (P1)** Split the giant data chunks (HFW ~1.56 MB, skill-gap ~1.64 MB, language ~1.84 MB, plus 0.6–1.05 MB others) by skill/level; lazy-load on demand; normalize/compress; consider query-backed delivery where offline allows. *Gate:* no data chunk > 700 kB raw; student first-load network log shows only needed banks.
- **A9.3 (P1)** Fix the 5 ineffective dynamic imports: break `masterWordLexicon.js`'s static path into the question modules (or invert the boundary); add a build assertion that fails when a split point is statically reachable from the entry graph. *Gate:* Vite reports 0 ineffective dynamic imports; assertion in `check:release`.
- **A9.4 (P1)** ExcelJS: upgrade/replace (with A8.5); exports load only behind user action; verify CSP-compatible generation and large-report memory. *Gate:* eval warning gone from build; 500-item export memory test.
- **A9.5 (P1)** `App.jsx` (9,399 lines) decomposition — incremental, test-protected, no big-bang: extract bounded controllers/services (auth/session, progress sync, assessment orchestration, reports, student shell, teacher shell) and route components. Milestones: ≤7,000 → ≤5,000 → ≤3,000 lines, each merged green. *Gate:* line-count ratchet in `check:release` (fails on regression above current milestone); all tests green at each step.
- **A9.6 (P0)** = consolidation + route-level tests (done via A5.4 + P0.4). *Gate:* those gates.
- **A9.7 (P2)** Real URLs: stable routes for teacher/admin/report surfaces + safe student resume routes; browser back/refresh/deep-link work; migrate incrementally from `appView` with route/state tests. *Gate:* E2E: deep-link to a class report; refresh mid-assessment resumes safely.
- **A9.8 (P1)** Typed domain boundaries (auth, classes, evidence, reports, content): JSDoc/TS types + runtime validation of RPC payloads/responses; versioned stored schemas. *Gate:* validation rejects a malformed seeded payload in tests; boundary modules exist and are the only Supabase call sites (grep-guard).
- **A9.9 (P1)** Fleet monitoring: error boundaries paired with the remote monitor (A8.6), health dashboard, source maps, release tags, error budget. *Gate:* dashboard shows seeded release; budget doc committed.
- **A9.10 (P1)** Sync durability: end-to-end multi-device conflict tests, queued-event durability (with A4.7), visible sync status, reconciliation metrics, chaos tests (refresh/offline/token expiry mid-write). *Gate:* `check:sync-chaos` suite green.

### WS10 — QA, content ops & release readiness (Area 10) → 10/10
**10/10 =** one gate to rule them all (built in Phase 0), zero-warning policy, authenticated E2E, a11y program, one content rubric, research cadence installed.

- **A10.1 (P0)** = P0.5. **A10.2 (P0)** = P0.1+P0.2. **A10.4 (P1)** = P0.6. **A10.5 (P2)** = P0.7. **A10.6 (P2)** = P0.7. *Gates:* as defined there.
- **A10.3 (P1)** Warning backlog to zero (with A4.5); `--max-warnings=0` in CI; suppressions only with inline justification + linked regression test. *Gate:* lint clean in CI.
- **A10.7 (P1)** Deterministic authenticated E2E journeys on the seed: login → class → learner → assessment → report → export (file downloaded and parsed), plus permission separation (teacher B blocked), error paths, offline recovery. *Gate:* `check:e2e-teacher` in `check:release`.
- **A10.8 (P0)** Accessibility program: route/state inventory doc; automated serious/critical checks everywhere (A3.3/A6.7); scheduled manual audits — screen reader, switch/keyboard-only, zoom 200%, audio-off, motion-off, child usability. *Gate:* inventory committed; automated green; manual audit calendar + first-run template in EXTERNAL.md (human execution).
- **A10.9 (P1)** One content schema + one release rubric (from A1.1): admin QA console shows per-skill status, reason, owner, waiver, and exact student exposure ("what can a child actually meet today"). *Gate:* route-level test renders the console from live gate data; Loop D board generated from the same source.
- **A10.10 (P1 · EXTERNAL)** Recurring observation program: representative teachers, ages, reading levels, multilingual learners, accessibility needs; findings convert into owned release criteria. *Gate:* program doc + session templates + finding-to-criteria pipeline EXTERNAL-READY.

---

## 5. Traceability & status ledger

Maintain `docs/release/TRACEABILITY.md`: one row per item `A1.1 … A10.10` (+ every `D-###`): status (`TODO / IN-PROGRESS / DONE / WAIVED / EXTERNAL-READY / EXTERNAL-CLOSED`), gate name, evidence link (commit + manifest entry). The scorecard generator consumes this file — **an item without a passing gate cannot be DONE, mechanically.** All 100 rows must exist from day one (create the file as your first commit, all TODO).

## 6. External-dependency register (the honest list)

These CANNOT be closed by Codex — prepare them fully, then hand to Ben:
1. **A1.10 / A2 / A10.10** — expert curriculum review, child & teacher pilots, recurring research (people).
2. **A4.10** — threshold/difficulty calibration with literacy specialists (people + data).
3. **A8.2** — privacy/security review of the live leaderboard RPC (reviewer).
4. **A8.10** — qualified legal review of the compliance pack (counsel).
5. **A10.8** — manual assistive-technology audits (auditors).
Everything else in this plan is fully closable by Codex + gates.

## 7. Suggested execution order (compressed)

1. **Phase 0** (P0.1–P0.7) → first honest scorecard.
2. **WS4.5/A10.3** (hook warnings, they block zero-warning CI) → **A4.6/A7.2** (truncation) → **A5.4** (consolidation) → **A4.9/A7.1** (EL formal surface) → the four named failing checks turn green.
3. **A8.5 + A8.2** (dependencies + leaderboard — child safety first).
4. **WS5/WS6/WS7** teacher product to completion (seeded E2E throughout).
5. **Loop D** curriculum engine runs in parallel the whole time (WS1) with WS3 a11y sweeps.
6. **WS2** student UX hierarchy; **WS8** remaining security/ops; **WS9** performance ratchets.
7. **Loop C round 1** → triage → fix → **Loop C round 2** → if clean twice: done. If not: loop. There is no step 8; the loop IS the plan.

## 8. Daily rhythm (so nothing is skimmed)

Each working session: pick items in the order above → Loop A until each gate passes → Loop B before stopping → update TRACEABILITY + LOOP_LOG → commit scorecard. Weekly (or every ~25 closed items): mini fresh-eyes review of ONE random completed area (Loop C-lite, same fresh-session rule) to catch drift early. Any gate that has been green for two weeks and breaks gets a root-cause note in DISCOVERED.md — flaky gates are treated as bugs, not re-run until green.

---

*Definition of victory: `npm run check:release` green · scorecard 10/10 × 10 areas · two clean adversarial re-audits · externals handed to Ben with everything they need. Nothing skimmed, nothing skipped, nothing faked — the manifest proves it.*
