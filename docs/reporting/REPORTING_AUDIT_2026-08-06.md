# Reporting audit, 2026-08-06

Every reporting surface and every export in Literacy Guide, audited against
`docs/reporting/REPORTING_BIBLE.md`. Audited at `main` @ `8a2d492`.

Findings are ranked by how badly they mislead a teacher, not by how hard they are to fix. Each carries a
file reference, the bible clause it breaks, and what was done about it in this pass.

**Status key:** ✅ fixed this pass · 🟡 partially fixed · ⬜ open, with a stated reason

---

## The one-paragraph summary

The in-app reporting is better than its reputation. The evidence model is genuinely careful — the
practice cap, the "missing is never zero" discipline, the descriptive-EL separation and the refusal to
draw a growth line out of a half-split are all correct calls that most competitors get wrong, and the
code comments defending them are worth keeping. **The failures are concentrated in three places:**
the exports, which were audit logs wearing a report's name; the status vocabulary, which had drifted to
five parallel systems that disagreed with each other and with the screen; and the evidence floor, which
let a handful of items produce a confident-looking judgment. Two of those three are now fixed. The
third is staged, because tightening it retroactively restates history and that needs a version stamp
rather than a silent change.

---

## Severity 1 — a teacher would act on a wrong number

### E1 ✅ The class "Export spreadsheet" was not a report

`AppPages.jsx` wrote `class-report.csv`: a provenance preamble concatenated with
`exportAssessmentAttemptsCsv(classAssessmentHistory)` — every saved attempt row, flat.

That file answers "what rows are in the database." It does not answer "who do I see on Monday," which
is the only question a class report exists to answer. There was no summary, no grouping, no next step,
no status split, no coverage figure, and nothing a teacher could take to a planning meeting.

Breaks Part X.1 (a workbook is a report), X.2 (required sheet shape), Law 5 (ends in an action).

**Fixed.** `src/utils/exportClassReportWorkbook.js` produces a ten-sheet workbook: Cover, Summary,
**Teach next**, Students, Skills, Skill matrix, Tricky items, How to read this, Data, About this
report. The raw attempt CSV survives as a second, clearly-labelled "Export raw rows" button for anyone
who wants to pivot the source rows themselves.

The Teach next sheet is third, before any detail sheet. That placement is the whole point: a 2025
survey of 251 K-3 educators found 76% confident interpreting screening data and only 38% confident
implementing tiered interventions. A report that stops at data leaves that gap exactly where it found it.

### E2 ✅ Student exports were six disconnected CSVs in a different language from the screen

`FinishedReportPage.jsx` wrote one flat CSV per report view. Worse, `exportStudentWorkspaceCsv.js`
carried its own status vocabulary:

| Screen said | Export said |
|---|---|
| Developing | **Growing** |
| Not checked | **Not started yet** |
| Summary | **Student overview** |
| Skills | **Skills assessment** |

A teacher comparing the printout to the app was reading two different documents about the same child.

Breaks Part IV.1 (one vocabulary everywhere) and X.1.

**Fixed.** `src/utils/exportStudentReportWorkbook.js` produces one workbook covering every view, in the
screen's own words, sourced from `TEACHER_COPY` and the canonical status labels. It adds two things the
screen cannot easily give a teacher on paper: a **Simple View of Reading profile** naming what kind of
reader this child currently is, and a **Teach next** sheet.

### E3 ✅ Export cell colour was decided by regex over display text

`exportElAssessmentExcel.js` coloured cells by matching the *string in the cell*:

```
/pass|master|secure|yes|correct/  → green
/support|miss|incorrect|no|risk/  → red
/not|unseen|reached/              → grey
```

Any cell containing the substring "no" turned red. Any note containing "correct" turned green,
including "not correct". This is not a hypothetical: teacher note fields and skill names flow through
these columns.

Breaks Part X.3 (colour from the canonical status id, never a regex).

**Fixed.** `src/utils/excel/reportWorkbookTheme.js` keys every treatment off `canonicalStatusId`. The
regex matcher is gone from every new export path.

### E4 ✅ Export colours did not match the screen

The old export palette was an independent invention: `greenSoft FFD9FBE8` where the screen renders
`#F0FDF4`; `redSoft FFFFDADA` where the screen renders `#FEF2F2`; `amberSoft FFFFF1C2` against
`#FEF3C7`. Same status, different colour, depending on which artifact you were holding.

**Fixed.** One palette, lifted from `App.css` and `student-reports.css`, in
`src/utils/excel/reportWorkbookTheme.js`. Every status also carries a mark glyph (`✓ ~ ! ? –`) so the
sheet reads in greyscale and to a colour-blind reader — CCSSO's guidance is explicit about not letting
red-green carry meaning alone.

### E5 🟡 No evidence floor on a concept judgment

`resolveWholeChildConcepts` (`reportingEvidenceModel.js`) resolves a status from whatever evidence
exists. `LEARNING_EVIDENCE_POLICY.minimumEvidence.exactItemIndependentAttempts` is **3**. One tap on a
correct answer, three times, produces "Secure" on a concept tile, and secure rows are grouped under a
heading that until recently read "Mastered."

Sinharay's work is unambiguous: "subscores based on tests smaller than 10 items almost never have added
value." Three items is not a measurement.

This is compounded by adversarial-audit finding C2 — 96.2% of measured items had the correct answer at
index 0 with no shuffle — which means position-tapping alone cleared the thresholds. Pre-fix mastery
data is uninterpretable, and a 3-item floor made it trivially so.

Breaks Law 2 and Part IV.2 gate 2.

**Partially fixed.** `evaluateEvidenceSufficiency` in `src/policy/reportingBible.js` implements the
10/20 floor and every new export path routes status through it — a cell backed by fewer than 10 scored
items renders "Not enough results", not a status. The in-app tiles still use the old floor.

⬜ **Open, deliberately.** Lowering the floor in the live evidence model retroactively restates every
child's history the next time a teacher opens the app. That needs to ship with a version stamp and a
one-line explanation in the UI, not silently. `reportingBibleMigrationDeltas()` names the change and its
effect; the sequencing is in "What to do next" below.

### E6 ⬜ Two parallel reporting systems still produce different numbers for the same child

The roster, Today, and class report read legacy `answers` + `mastery` through `reportingSystem.js`
(raw all-time accuracy). The student report reads the concept spine over `assessment_attempts` (90-day
window, strength precedence). Same child, two numbers, no label saying which is which. Class report
totals also differ by door — `AppPages.jsx` filters to the last 90 days, `AdminDashboardPage.jsx` does
not.

This was already the top finding of the 2026-07-27 teacher-reporting review and Ben's binding decision
of 2026-07-31 resolves it: one bar, the report's rule, everywhere.

⬜ **Open.** Out of scope for this pass, and it should not be folded into it — pointing
`teacherClassModel.buildStudentSkillEvidence` at `computeSkillStatus` is a behaviour change to the
roster that deserves its own commit and its own before/after. The new exports read the class model as
it is, so they will inherit the fix automatically when it lands.

---

## Severity 2 — a teacher would be misled about certainty

### E7 ✅ No denominator on export rows

Score columns shipped without an adjacent count. A teacher could not tell 2/2 from 18/20, and neither
could the product.

**Fixed.** Every new export carries `items_scored` beside every score, plus an explicit
`evidence_sufficiency` column. Part X.4, rules 3 and 4.

### E8 ✅ Exports had no interpretive material

`metricDefinitions.js` shipped a definitions sheet — good, and better than most — but there was no
"how to read this", no statement of what Secure means, no explanation of why some rows have no status.
Hambleton and Zenisky's applied work found Supporting Material to be the field's weakest domain at
1.28 out of 3.0, and the fix they identify is a standalone interpretive guide under four pages.

**Fixed.** `addHowToReadSheet` ships that guide inside the workbook, where it cannot be separated from
the artifact it explains. It states the four mastery gates, why 90% and not 80%, and why a skill with
fewer than 10 items gets no judgment.

### E9 ✅ No cover, no summary, no headline

Every export opened on a data grid. A teacher had to construct the story themselves.

**Fixed.** Cover with a one-paragraph headline, then a Summary with the KPI band and status split —
the screen's top-of-report, in cells.

### R1 🟡 Five status vocabularies, plus two ad-hoc string sets

Catalogued: `LEARNING_STATUS_IDS` · `REPORTING_STATUS_IDS` · `SKILL_STATUS_IDS` ·
`getAccuracyStatus` ids (`on_track` ≠ `secure`) · class-report ids (`mastered`, `not_assessed`) ·
plus Sound Seekers' "Got it / Almost there / Needs reteaching" and `FAMILY_COPY`'s "Growing / Needs
more practice." `reportStatusLabel` in `studentReportUiUtils.js` emits a sixth state, "Mixed results",
that exists nowhere in the model.

Two CSS bugs fall out of this: `.lg-report-status.needs-support` and `.mixed-results` have no rule, so
those pills render default grey. `.teacher-class-report-pill.not-enough` and `.not-checked` likewise.

**Partially fixed.** `canonicalStatusId` in `src/policy/reportingBible.js` is the single boundary
translator, with a test asserting all 24 known legacy strings resolve into six ids and that unknown
input becomes `not_checked` rather than a guess. Every new export path goes through it.

⬜ The in-app surfaces still use their own enums. Collapsing them is the same commit as E6.

### R2 ⬜ Three export collectors read this browser's localStorage with no hydration

- `studentDetailedReportBuilder.js:284` — guided reading records
- `exportGuidedReadingCompletionExcel.js:122` — scans every `literacyPath.guidedReadingRecords.*` key
- `exportReportSections.js:295` — engagement, story quests, arcade, hollow

If the teacher never opened that student on that browser, the section silently reports zero. Silent
zero is the exact failure Law 1 exists to prevent, and it is worse than a visible gap because it looks
like data.

⬜ **Open.** The fix is to route these through the hydration path `loadStudentProgress` already uses.
Flagged rather than fixed because it needs a live database to verify against and the sparse checkout
this audit ran in has none.

**Interim mitigation:** the new student workbook reads from `buildStudentReportingWorkspaceModel`,
which is cloud-hydrated, rather than from those three collectors.

### R3 ✅ Colour by percentage rather than by status

`simpleStudentReports.js` documents this carefully — the band comes from status, not accuracy, so a
100%-accuracy tile on thin evidence is legitimately neutral grey. Exports that colour by percentage
contradict the screen on exactly the cases that matter most.

**Fixed and asserted.** `addStatusMatrix` and `addTable`'s `type: "status"` colour from the status id
only. A numeric heatmap helper exists for genuinely continuous quantities and is not used for status.

---

## Severity 3 — missing capability the bible requires

### M1 ⬜ No growth reporting at all

`growthAreas: []` and `readingRows: []` in `buildClassReportModel`, with a comment explaining that a
mixed list of attempts split in half is not longitudinal growth. **That comment is right and the
decision stands.** `teacherGrowthSeries.js` (411 lines) and `teacherGrowthHistory.js` (108 lines) are
built, tested, and imported by nothing.

Part V.4-V.5 requires status and growth as orthogonal axes. The blocker is real: growth normed on
starting point needs conditional norms this product does not have.

**Provided:** `evaluateTrendEligibility`, `theilSenSlope` and `isReportableWcpmChange` in
`src/policy/reportingBible.js` — the machinery for an honest growth display when there are two
policy-ready windows to compare. `growthPercentilesAvailable` is `false` and stays false until there
are real norms. Inventing a percentile is worse than not having one.

### M2 ✅ No Simple View of Reading anywhere

The product assesses both halves of reading and reported neither as a half. A stack of skill bars
cannot tell a teacher whether to teach decoding or language.

**Fixed.** `buildSvrProfile` in `src/utils/exportStudentReportWorkbook.js` folds the concept spine into
word recognition and language comprehension, names one of four profiles, and states the move each
implies. It refuses to name a profile unless both halves clear the evidence floor — which is the honest
answer far more often than a chart would suggest.

### M3 ✅ High-frequency words reported as a flat count

`hfwIntro` counts "X of Y listed word assessments." A child failing Flash Words has a phonics problem;
a child failing Heart Words has an orthographic-memory problem. One percentage hides the difference,
and the difference is the whole instructional decision.

**Fixed.** `HFW_BUCKETS` in the bible policy; the student workbook prints the three buckets with the
teaching note for each.

### M4 ⬜ No family-facing report is reachable

`reportAudienceTemplates.js` builds a `family_friendly` template with a banned-terms linter and is
imported by nothing outside its own test — the "built, tested, dead" parent one-pager.

The linter is good and the template is close to the bible's Part VII shape.

⬜ **Open.** Wiring it needs a UI surface and a delivery decision (print? email? portal?) that is a
product question, not a reporting one.

### M5 ⬜ No assessment-time budget counter

Part VIII.1 asks for a running total of minutes spent assessing, shown to the teacher. Nothing tracks it.
Small, novel, and trust-building; not built this pass.

### M6 ⬜ No RTI evaluation-right notice

Part VI.2 requires a persistent, non-dismissible note wherever tiering appears. There is no tier UI
today, so nothing is currently violating it — but `STANDING_NOTICES.rtiEvaluationRight` is defined and
ready so that whoever builds the tier surface has no excuse.

---

## The multilingual-learner gap

### L1 ✅ There was no English-learner concept in the product at all

"EL" throughout this codebase means **EL Education / EL Skills Block** — `elSkillsBlockCycles.js`,
`ElSkillsQuest.jsx`, and the six `el_*` benchmark assessments. That is curriculum alignment, not learner
classification.

Searching the entire repository for `wida|proficiency_level|ELD|ELP|multilingual|english_learner`
returned exactly **one** hit: a string in `tools/rubrics/differentiation.csv`. No EL flag on a student,
no home language, no proficiency level, no listening or speaking domain anywhere in
`REPORTING_DOMAIN_LABELS`.

**Built.** The MLL module, in full — see `docs/reporting/MLL_LANGUAGE_REPORTING.md`. Named MLL to avoid
a head-on collision with ~100 existing `El*` files, and because "multilingual learner" is WIDA's own
preferred term.

### L2 ✅ English-only phonics data was reportable without a language caveat

Every EL student's phonics results were reported identically to a monolingual child's. An English-only
phonics screen cannot distinguish "cannot decode" from "does not have that phoneme," and the National
Academies finding is that over 90% of the variance in EL special-education classification is unrelated
to English proficiency.

**Built.** `src/data/mll/l1TransferModel.js` with reference tables for Spanish, Mandarin, Vietnamese and
Arabic, and the non-transfer residue analysis. The product now refuses to offer any transfer claim
without a recorded home language, and hard-blocks referral recommendations.

---

## What was verified and found sound

Worth recording, because an audit that only lists faults teaches the wrong lesson.

- **"Missing is never zero" is real and defended.** `AppPages.jsx` ("'Not enough results' and 'Not
  checked' are white cards, not a colour of failure"), `ElClassReportDocument.jsx` ("A missing measure
  is shown as 'Not recorded,' never as zero"). Both correct. The bible generalises them rather than
  inventing them.
- **The practice cap holds.** Practice and exposure evidence resolving to Secure is downgraded to
  Developing (`reportingEvidenceModel.js`). Load-bearing; do not weaken.
- **Unlike sources are not averaged.** The strength precedence and the explicit `mixed_evidence` state
  are the right design, and better than the field norm.
- **Descriptive EL discipline is honoured.** The four benchmark assessments never produce a mastery
  status and are stripped from every accuracy calculation. Exactly right, and it is the same instinct
  the MLL module needs.
- **Growth is refused rather than faked.** `growthAreas: []` with a comment explaining why. Most
  products would ship the half-split.
- **`tests/unit/` is genuinely strong.** 231 files, 1,588 cases, zero skips. The verification rot
  identified in the adversarial audit is in `tools/`, not here.

---

## What to do next, in order

1. **Land E6 and R1 together** — one status brain, one set of numbers. Point
   `teacherClassModel.buildStudentSkillEvidence` at `computeSkillStatus`, collapse the four rival
   vocabularies through `canonicalStatusId`, add `teacherClassModel.js` to
   `productionUsesOneStatusBrain()` in `gate.mjs` (G6 currently passes vacuously because the roster is
   not in its file list). Expect fewer Secures. That is the point.
2. **Then raise the evidence floor (E5)** with a version stamp and a one-line in-app explanation. Do
   not do this before step 1 or the two changes will be indistinguishable in the data.
3. **Fix the three unhydrated localStorage collectors (R2).** Needs a live database to verify.
4. **Add `check:reporting-bible` to `RELEASE_GATES`** so the bible's numbers cannot drift out of
   `src/policy/reportingBible.js` — the H1 failure mode, prevented rather than re-learned.
5. **Wire the family report (M4)** once the delivery mechanism is decided.

---

## Gates added this pass

- `tests/unit/reportingBible.test.js` — 47 cases over the evidence floor, mastery gates, trend
  eligibility, the do-not-report list and the status translator.
- `tests/unit/mllLanguageReporting.test.js` — 55 cases over the WIDA framework constants, the
  kindergarten ceilings, the 2025-26 rebaseline, the descriptor bank and the transfer model.

Both include tests that fail if a future change loosens a rule rather than merely breaking it — the
composite weights, the ten-item floor, the 90% bar, the "no transfer claim without L1" rule and the
"emit ranges, never decimals" rule are all asserted directly.
