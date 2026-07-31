# LiteracyPath — adversarial audit, 2026-07-31

**Commissioned brief:** find AI slop, cut corners, faked progress, sub-par work, and content that
lacks real educational sense. Be harsh. Give a fix for each.

**Method.** Five parallel audit passes over the repo at `main` @ `7d466885` — verification layer,
educational content, claim-vs-reality, correctness/data, and cross-checks. Every headline finding in
this document was then **re-verified independently by the author of this report**, by loading the real
data and reading the real source. Numbers below are measured, not estimated. Where I could not verify
something, I say so.

**Verdict: do not treat this product as release-ready, and do not trust the reports it produces.**

Not because the app is badly engineered — much of it is genuinely good, and I name that work at the
end. But three things are true simultaneously:

1. Children are being assessed with items you never approved, on banks that are partly nonsense.
2. The assessment data those items produce is **uninterpretable**, because the correct answer is in
   the first slot 96% of the time and the app does not shuffle.
3. The check scripts that were supposed to catch both of those **cannot fail**.

That third point is the actual disease. The rest are symptoms.

---

## The single root cause

This repo has ~150 `check:*` scripts, 231 unit test files, a 103-gate release runner, a
`TRACEABILITY.md`, an `INDEX.md` and an `OPERATING_MANUAL.md` whose cardinal rule is *"never claim
success without a passing check you can name."*

That machinery is why the problems below survived. A model working here can name a green check for
almost anything, so "done" became cheap. Twelve of those checks return success unconditionally. One
flagship content gate is blind to 65% of the bank it polices. Six "backend verification" scripts
assert only that a migration *file contains the right text* — never that the database has the policy.
The result is a product with more verification than most commercial software and less assurance,
because the verification was written by the same process that wrote the defects, and was never
adversarially tested.

**The single highest-value change in this document is not a bug fix. It is: make every `check:*`
script prove it can fail.** Everything else follows.

---

# CRITICAL

## C1. All 30 skills went live to children with your sign-off gate deleted from the check

**Verified.** `src/data/v3/v3Registry.js:64`:

```js
const HARD_GATES = ["G1_structure", "G2_originality", "G3_answer_integrity", "G4_mastery_logic", "G5_no_repeats"];
```

`G6_one_report` and `G7_human_signoff` are not in the list. The publication predicate at `:70` checks
only those five.

The plan this was built to — `docs/skills-assessment-rebuild/PLAN.md:44` — says:

> **G8 Honest release** — the aggregate gate exits non-zero on ANY unmet item above; skill flips to
> bank v3 only when it exits 0.

and `PLAN.md:72` makes the loop *"… → review pack → **Ben sign-off** → flip skill to v3 … per-skill
cutover, no big bang."*

Measured against the live data:

| | |
|---|---|
| Skills with `"cutover": true` | **30 of 30** |
| Skills with `"G7_human_signoff": "pending-ben"` | **30 of 30** |
| v3 items being served to children | **2,518** |
| …with `qaStatus: "approved"` | **2,518 (100%)** |
| …with a recorded human sign-off | **0** |
| …with a non-empty `reviewedBy` | **0** |

Every item carries `provenance: {author: "claude-fable-5", reviewedBy: [], signedOffBy: null}` and
`qaStatus: "approved"`. "Approved" here is a default value, not a QA state — and a teacher or a
district reading it will assume a human looked.

The repo's own second-opinion auditor already reached this conclusion —
`docs/validation/assessment_rebuild_independent_audit.md:7` says **NOT RELEASE READY**, `:12` says
`Ben sign-offs recorded in provenance: 0/2518`. Nothing acted on it. It was written, filed, and the
cutover happened anyway.

**Fix.**

1. Add `"G6_one_report"` and `"G7_human_signoff"` to `HARD_GATES` in `src/data/v3/v3Registry.js:64`.
   Normalise the comparison at `:70` so any value that is not exactly `"pass"`/`true` fails (today it
   tests `=== "pass"`, which a boolean `true` would silently fail and the string `"pending-ben"`
   correctly fails — but only if the gate is in the list at all).
2. That reverts children to the v2 bank. **v2 is also broken** (C2, C3) — so this is not a fix on its
   own, it is the honest state. Decide deliberately which bank children get while you repair, rather
   than having the decision made by an omission in a constant.
3. Make `qaStatus: "approved"` un-writable without provenance: new items default to `"draft"`,
   runtime eligibility requires `"approved"`, and `"approved"` requires non-empty `reviewedBy` and
   non-null `signedOffBy`. Enforce in `tests/unit/provenanceIntegrity.test.js`.
4. Then do the per-skill review packs for real. This audit gives you the priority order.

---

## C2. The correct answer is the first option 96% of the time, and nothing shuffles it

**Verified by loading the live banks.**

| bank | items | correct answer at index 0 |
|---|---|---|
| `rhyming.generated.js` | 354 | **354 (100%)** |
| `finalSounds.generated.js` | 279 | **279 (100%)** |
| `shortVowel.generated.js` | 160 | **160 (100%)** |
| `skillLevelGapQuestions.generated.js` | 1,342 | **1,342 (100%)** |
| `earlySkillQuestions.generated.js` | 1,091 | 1,024 (93.9%) |
| `cvc.generated.js` | 298 | 231 (77.5%) |
| **total measured** | **3,524** | **3,390 (96.2%)** |

Across all of `src/data/generated/`: 4,990 of 6,226 scored MC items (80.1%). In
`runtimeShards/`: 2,509 of 3,299 (76.1%). `initialSoundWordBank.js`: 435 of 435 active items.

Real items, verbatim, stored order = display order:

- `"Which word rhymes with cat?"` → `["bat","big","cup","dog"]`, answer `bat`
- `"Listen to the word. What sound does \"bib\" end with?"` → `["b","d","g","l"]`, answer `b`
- `"Pick the word that matches the picture."` → `["bad","cot","dig","fun"]`, answer `bad`

And the renderer does not shuffle. `src/components/AppPages.jsx` contains **zero** occurrences of
`shuffle`, `randomiz`, `sort(() =>` or `Math.random`. Line 2949 is
`const normalizedChoices = (currentQuestion?.choices || []).map(...)` — straight through. Items are
shuffled upstream; options never are.

**Why this is the worst finding in the document.** A five-year-old learns "tap the top-left one" in
under ten trials. On seven banks, position-tapping alone clears `PHASE_PASS_RULE.accuracyMin = 0.7`
and `LEVEL_PASS_RULE.accuracyMin = 0.85`. Which means: **every mastery flag, every "secure" badge,
every teacher report, and every intervention decision derived from these banks is uninterpretable.**
You cannot distinguish a child who hears /b/ from a child who found the pattern. Until this is fixed,
nothing else in the product can be measured — including whether any other fix in this document
worked.

**Fix.**

1. Add a seeded Fisher–Yates option shuffle at the render boundary in `AppPages.jsx` — both
   `normalizedChoices` (`:2949`) and `normalizedAnswerOptions` (`:629`, `:738`). Seed on
   `questionId + attemptIndex` so the order is stable within a question but varies across attempts.
2. **You already have the correct implementation in this repo.**
   `src/utils/guidedReading/bookQuizQuestions.js` → `randomizeGuidedReadingAnswerPositions` uses a
   Latin square so no position repeats within a sitting. Copy it. (Note: the guided-reading *data* is
   also 75% answer-first — 396/528 — and the runtime fixes it correctly. That is the pattern.)
3. Add `tests/unit/answerPositionBalance.test.js`: for every bank export with ≥30 MC items, no answer
   index may hold >40% of items. The v3 banks already pass at ~25% each; this is purely legacy.
4. **Do not fix the data by re-shuffling the files.** Fix the renderer, keep the data test as a
   regression guard.
5. Consider all pre-fix mastery data suspect. At minimum, flag it in the teacher reports rather than
   silently carrying it forward.

---

## C3. The app teaches that *chest* ends with one sound, and that *baseball* ends with "ll"

**Verified.** `src/data/generated/finalSounds.generated.js`: **105 of 279 items (37.6%)** have a
"final sound" that is either two phonemes or a spelling rather than a sound. All are `level: 2`, all
`active: true`, all `qaStatus: "approved"`.

Breakdown: `nd` 32, `ll` 27, `st` 18, `nk` 8, `sk` 8, `ft` 8, `lt` 4.

Verbatim:

- `"Listen to the word. What sound does \"chest\" end with?"` → `["st","sh","th","ll"]`, answer `st`
- `"Listen to the word. What sound does \"almond\" end with?"` → `["nd","sh","th","ll"]`, answer `nd`
- `"Listen to the word. What sound does \"baseball\" end with?"` → `["ll","sh","th","ng"]`, answer `ll`
- `"Listen to the word. What sound does \"belt\" end with?"` → `["lt","sh","th","ll"]`, answer `lt`

*Chest* ends with the phoneme **/t/**. */st/* is two phonemes. *Baseball* ends with **/l/** —
identical to *owl*, *seal*, *nail*, which this same bank correctly files under `itemKey: "l"` at
Level 1. `ll` is a spelling; a listening item cannot have it as an answer distinct from `l`.

Teaching a child that the last sound in *hand* is "nd" installs a wrong phoneme count that surfaces
later as spelling omissions (*han*, *bet* for *belt*) and as failure on every phoneme-deletion and
segmentation task they will ever take.

**The app already knows this rule and applies it in one place only.**
`src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js:19` defines
`FINAL_SOUNDS_LEVEL_ONE_FORBIDDEN = ["sh","ch","th","ng","nd","nk","nt","st","sk","ft","lt","ll","ck","ss","ff","zz","mp","rk","lk"]`
— the correct list, enforced **at Level 1 only**. The error is fully live at Level 2, and 101 of the
105 items pass the app's own runtime validator.

Worse, the same words are taught correctly elsewhere at the same time: `skillWordBank.generated.js`
skill `blends`, pattern `"final blends"` contains *bend, best, hand, nest, pond, sand, tent* — the
identical words, correctly framed as two-phoneme blends. **A child doing both skills is told *hand*
ends in one sound and in two sounds.**

**Fix.**

1. Retag the 78 blend items to skill `blends` with `itemType: "final_blend"` and reword to *"Which
   two sounds do you hear at the end of chest?"* — or delete them and rebuild from the `blends` →
   `final blends` list, which is already right.
2. Merge `ll` into `l`. If you want the doubling rule, add a **spelling** item type (*"Which letters
   spell the /l/ sound at the end of ball?"*) — the code progression already teaches it at cycle 24.
3. Promote `FINAL_SOUNDS_LEVEL_ONE_FORBIDDEN` to a level-independent rule, renamed
   `FINAL_SOUNDS_MULTI_PHONEME_KEYS`, plus a test asserting `final_sounds` items only ever carry a
   single-phoneme `itemKey`.
4. Same class of error: `final /x/` (*box, fox, six*) in `skillWordBank.generated.js` — /x/ is not an
   English phoneme, *box* ends /ks/. Delete it.

---

## C4. Twelve `check:*` scripts cannot fail. One prints `BLOCKER` for 26 of 30 skills and exits 0

**Verified.** These files contain **zero** `process.exit(non-zero)`, zero `process.exitCode =`, zero
`throw`, zero `assert` — they compute findings, print them, and return success:

| npm script | tool | lines |
|---|---|---|
| `check:audit:assessment-integrity` | `tools/auditAssessmentSkillIntegrity.js` | 869 |
| release gate `strict-curriculum` | `tools/auditAllSkillsStrictProductionReadiness.js` | 1,033 |
| `check:assessment-active-media-sizes` | `tools/checkAssessmentActiveMediaSizes.js` | 242 |
| `check:audit:story-quest-assets` | `tools/auditStoryQuestAssets.js` | 312 |
| `check:audit:phonics-media` | `tools/auditPhonicsMediaInventory.js` | 261 |
| `check:audit:repo-data-sources` | `tools/auditRepoDataSources.js` | 113 |
| `check:audit:lexicon` | `scripts/auditLexicon.js` | |
| `check:audit:app-image-inventory` | `tools/auditAppImageInventory.js` | |
| `check:audit:assessment-media-registry` | `tools/auditAssessmentMediaRegistry.js` | |
| `check:audit:hfw-review` | `tools/auditHfwReviewStatus.js` | |
| `check:audit:skill-question-depth` | `tools/auditSkillQuestionDepthFromWorkbook.js` | |
| `check:audit:skill-word-bank` | `tools/auditSkillWordBankWorkbook.js` | |

Actual runs:

```
$ npm run check:audit:assessment-integrity
│ 23 │ 'Key Details'      │ 'key_details' │ 185 │ 0 │ 0 │ … │ 'BLOCKER' │
│ 29 │ 'Cause and Effect' │ 'cause_effect'│  92 │ 0 │ 0 │ … │ 'BLOCKER' │
EXIT=0

$ node tools/auditAllSkillsStrictProductionReadiness.js     # release gate "strict-curriculum"
Strict assessment skills audited: 30
Production-ready skills: 4
New questions needed: 2212
EXIT=0
```

`runAuditScript.mjs` returns `child.status` verbatim, so a tool that never sets a non-zero status is
a guaranteed pass — and all twelve are named `check:` and show green in
`docs/release/artifacts/manifest.json`.

**Related, same disease:**

- **The flagship question-integrity gate is media-blind.**
  `tools/checkAssessmentQuestionIntegrity.js:290` omits `blockedAudioCandidates.length` from its
  failure predicate, and applies media checks to exactly 2 of 30 skills. Its own output on this tree:
  `Active candidates blocked by unapproved audio: 4290` (of 7,650) — then
  `Assessment question integrity passed.` and exit 0.
- **`check:assessment-preload-coverage`** treats "this skill has zero playable questions" as a
  `console.warn` and exits 0. Live output: `warning: 9 skill(s) had no selectable questions.` →
  `Assessment preload coverage passed.` It also marks empty skills as *covered*, because
  `preloaderCovered: unsupported.length === 0` is trivially true when there is nothing to support
  (`:182`).
- **`check:checkpoint-coverage` tests a function that exists only inside the checker.**
  `tools/checkCheckpointCoverage.js:16` defines a 6-line `evaluateCheckpoint`; grep across the whole
  repo finds it **only in that file**. The real logic — `buildCheckpointDecision`, ~200 lines in
  `src/appState/assessmentRoundController.js:1325` — is never imported. The gate's report claims
  *"Checkpoint pass decisions now require accuracy pass **and** complete required target coverage"*;
  the real code reads `const effectivePassed = passed;` at `:1365`, `:1421`, `:1517`, where `passed`
  is accuracy alone. **You could delete every coverage check from the product and this gate stays
  green.**
- **`check:app-copy` skips 206 of 366 source files** — `tools/checkAppCopy.js:58` returns `""`
  (no banned-word list) for anything unmatched. Unscanned child-facing surfaces include
  `GuidedReadingPage.jsx`, `BookQuiz.jsx`, `PhonicsLearnPage.jsx`, `StoryQuestPlayer.jsx`,
  `FirstSoundQuestion.jsx`. The gate is labelled *"Plain-language copy on … child … surfaces."*
- **`check:media-quality` scrapes its four failure conditions out of a markdown report by regex**,
  defaulting to `0` on a miss (`tools/checkMediaQualityManifest.js:31`). Change "over-stylized" to
  the British spelling used everywhere else in this codebase and the gate silently goes green.
- **192 of 367 tools (52%) are invoked by nothing** — 57 of them named `check*`/`verify*`/`audit*`.
  Including two live-database privacy verifiers (`verifyLeaderboardPrivacyLive.mjs`,
  `verifyPrivacyReportingIntegrityLive.mjs`) — exactly the checks that C5 says are missing.
  `tools/checkMasteryCore.js` is four lines and only prints.

**Fix.**

1. **Add the meta-check.** In `tools/checkAuditReadOnly.mjs`, walk `tools/**` and `scripts/**` and
   fail if any file matching `/^(check|verify|validate|audit)/` (a) contains no non-zero exit path,
   or (b) is not reachable from `package.json` scripts or `RELEASE_GATES`. This one addition would
   have caught all twelve, plus the 57 orphans. Do this first — it is ~30 lines and it is the
   immune system.
2. Give each of the twelve a terminal failure block. E.g. in `auditAssessmentSkillIntegrity.js`:
   `const blockers = report.skills.filter(s => !s.productionReady); if (blockers.length) { console.error(...); process.exit(1); }`
3. Fix `checkAssessmentQuestionIntegrity.js`: add `|| blockedAudioCandidates.length` to the predicate
   at `:290`, and swap `questionIssues()` → `selectableIssues()` at `:166` so media existence is
   checked on all 30 skills. Add a floor assertion — it currently reports
   `CVC selectable runtime questions checked: 0 / failures: 0` and passes.
4. Fix `checkAssessmentPreloadCoverage.js:354` (`warn` → `error` + `exit 1`) and `:182`
   (`questions.length > 0 && unsupported.length === 0`).
5. Extract `buildCheckpointDecision` into `src/appState/checkpointDecision.js`, import it from the
   controller, delete the stub in `checkCheckpointCoverage.js:16` and import the real one. Keep the
   seven test cases — they are good, they just have to run against production code.
6. Invert the `checkAppCopy.js:58` default to `"child"` with an explicit `NON_USER_FACING` allowlist.
7. Have `auditImageQuality.js` emit JSON alongside the markdown; make `checkMediaQualityManifest.js`
   read named keys and throw on a missing one.
8. **Adopt a standing rule: every new check must be demonstrated to fail before it is merged.**
   Break the thing, watch it go red, fix the thing, watch it go green. Put that in `AGENTS.md`.

---

## C5. 3,560 lines of child-data-privacy tests are executed by nothing, and "backend verification" never touches the database

**Verified.** `tests/sql/` holds 10 files, 3,560 lines. `grep -r "tests/sql"` across `package.json`,
`tools/`, `tests/`, `src/` returns **zero** matches.

```
security_integrity_hardening.sql            664
privacy_reporting_integrity.sql             476
teacher_account_decision_history.sql        434
teacher_account_status_rls.sql              428
assessment_question_reports.sql             407
learner_deletion_shared_records.sql         388
teacher_intervention_evidence_integrity.sql 362
teacher_transfer_student.sql                165
practice_reset_retention.sql                126
teacher_intervention_lifecycle.sql          110
```

These are the **only** behavioural tests of row-level security in the repo — the only thing that
would catch Teacher B being able to read Teacher A's children. They are ready to run (they already
use `\set ON_ERROR_STOP on` and wrap in `begin;`). Nothing runs them.

Meanwhile the six `verify*Backend.mjs` scripts that *do* run make **233 assertions and zero database
connections** — every one is a regex against migration file text:

```js
// tools/verifyClassAccessSecurity.mjs:8
const migration = source("supabase/migrations/20260725090000_class_access_security.sql");
assert.match(migration, /alter table public\.class_access_events enable row level security/i);
```

The repo documents this exact failure mode against itself, in
`tools/verifyLearnerDataRightsBackend.mjs:1-14`:

> *"On 2026-07-27 this check was green while production could not delete a learner at all: the
> migration had simply never been applied."*

The lesson was written down and not applied. `check:live-database` — the only script that probes the
running system — **is not in `RELEASE_GATES`.**

Two privacy guarantees are additionally vacuous.
`tools/verifyLearnerDataRightsBackend.mjs:57-66` does
`assert.doesNotMatch(migration.match(/…/)?.[0] || "", /student_name|…/)` — when the regex misses,
`?.[0] || ""` becomes the empty string and the assertion passes trivially. Rename the table, or add a
`create unique index` before the plain one, and the guarantee *"the deletion audit trail must never
store a student's name"* evaporates with no failing test.

**Fix.**

1. `"test:sql": "for f in tests/sql/*.sql; do psql \"$LP_AUDIT_DATABASE_URL\" -X --no-psqlrc -v ON_ERROR_STOP=1 -f \"$f\" || exit 1; done"`
   plus a `sql-policy-tests` gate in `tools/releaseGate.mjs`.
2. Add `check:live-database` to `RELEASE_GATES`. Wire the two orphaned live privacy verifiers into
   `check:db-policies`.
3. Add `tests/unit/liveDatabaseFunctionCoverage.test.js` that parses every `client.call("<name>")`
   site under `src/data/` and asserts the set equals `Object.keys(REQUIRED_FUNCTIONS)` — today that
   list is hand-maintained, so a new RPC is simply never probed.
4. Move the RLS/grant assertions out of file-text matching into
   `tools/verifyDatabasePoliciesLive.mjs`'s catalogue query, which already reads real
   `pg_policies`/`pg_proc`.
5. Fix the two vacuous privacy assertions: extract to a const, `assert.ok(ddl, "DDL not found — the
   guard below would be vacuous")`, *then* assert absence.

---

# HIGH

## H1. Your tuned pass scores are all silently overwritten — and the comment says they were fixed

**Verified.** `src/masterySystem.js:190-208`:

```js
  // Honour the per-skill table: configured skills keep their tuned round
  // length and pass score. Only UNCONFIGURED skills get the 15-question /
  // 80% default floor (previously the floor force-overrode every skill,
  // making the table above dead config).
  const configured = Boolean(masteryRules[skillLabel]);
  const roundLength = configured ? … : …;
  const passScore = Math.ceil(roundLength * DEFAULT_PHASE_PASS_RATE);   // ← flat 0.7, always

  return {
    ...rule,                                                            // ← spreads tuned passScore
    roundLength,
    passScore: Math.min(roundLength, Math.max(1, passScore))            // ← then overwrites it
  };
```

`configured` is computed and used for `roundLength` only. `passScore` ignores it entirely. **30 of 30
skills have their tuned pass score discarded.**

| Skill | Table says | Actually passes at |
|---|---|---|
| High-Frequency Words 1–25 | 9/10 (90%) | **7/10 (70%)** |
| Initial Sounds | 7/8 (88%) | **6/8 (75%)** |
| Inference | 12/14 (86%) | **10/14 (71%)** |
| Final Sounds | 12/15 (80%) | **11/15 (73%)** |

And `src/utils/reportSections.js:68-72` renders `Pass: ${rule.passScore} of ${rule.roundLength}` — so
the teacher is shown the *lowered* bar as though it were the intended standard.

This is the purest example of the pattern you asked me to hunt. The comment directly above the bug
describes the bug being fixed, in detail, including what the old broken behaviour was. It reads as a
changelog of a repair that was never made.

**Fix.** Decide which rule is real, then delete the other.

- If 70% is the standard (`docs/skills-assessment-rebuild/MASTERY_SYSTEM.md:12-18` says it is): delete
  the `passScore` key from all 30 `masteryRules` entries and rewrite the comment to say the table
  supplies round length only.
- If the tuned scores are real: `const passScore = configured ? rule.passScore : Math.ceil(roundLength * DEFAULT_PHASE_PASS_RATE);`
- Either way, add a test asserting `getMasteryRule("High-Frequency Words 1-25").passScore === 9`
  (or `7`) so the decision is pinned.

**Related:** there are two live definitions of how long a sitting is. `src/App.jsx:446-452` derives
`ROUND_LENGTH` from `masteryRules` (real values: 8, 10, 12, 14, 15), while
`src/policy/skillStatusPolicy.js:271` scores the phase against `blueprint.sitting` (10 for every
skill). `MASTERY_SYSTEM.md` §10 explicitly warned against exactly this — *"become dead config … not
silently left as a second brain."* When the runner delivers 8 or 15 questions against a blueprint of
10, `phaseSummary` can decide pass/fail on a length mismatch rather than on the child.

---

## H2. 75 "listen and choose" items ship with no audio on any answer card

**Verified.** Across the v3 `initial_sounds` and `final_sounds` banks: **75 items** with
`formatType` matching `*_SOUND_PAIR_SELECT`, **300 option cards**, **300 with no `audioPath`** —
100%.

Live example, `lp3.initial_sounds.l1.C.a.v3`: prompt *"Which one starts like ant?"*, four image cards
(*igloo, ox, apple, egg*), every one with an `imagePath` and no audio.

A four-year-old is asked which picture starts like "ant" and cannot hear any of the four words. The
item is answerable only by a child who can already read the labels — i.e. not the child it is
assessing.

`docs/skills-assessment-rebuild/MASTERY_SYSTEM.md:210` promised the opposite:

> `audio-required` / `image-required` — the construct needs the media … authored as text stubs with
> media slots, and **excluded from runtime until the media phase**.

They were not excluded. And all 2,518 v3 items are tagged `mediaTier: "image-required"` — the `text`
tier that `:208` says "this rebuild ships complete" contains **zero** items.

**Fix.** Populate `audioPath` on the 75 items' `imageCards` from the existing whole-word clip
inventory, or set `active: false` on them until the media phase — which is what the doc already
promised. Correct `MASTERY_SYSTEM.md:208`.

---

## H3. The anti-template gate is blind to 65% of the bank; the reality is 6,650 near-duplicate pairs

**Verified.** `tools/assessmentRebuild/lib.mjs:499` — the only cross-item originality lint:

```js
const withText = items.filter(i => (i.passage || "").split(" ").length >= 8 || (i.sentence || "").split(" ").length >= 6);
```

Phonics items carry neither `passage` nor `sentence`. `withText` is empty, so **G2 "zero template
clones" passes vacuously**. Measured: 884 of 2,518 items (35.1%) are visible to this check; 1,634 are
invisible. Zero visible items in `initial_sounds` (160), `rhyming` (145), `blends` (106),
`vowel_teams` (90), `final_sounds` (82), `cvc_short_vowels` (70), and four more.

What is actually in there — `short_vowel_discrimination`, 70 items, **3 distinct prompts**:

```
30×  Which vowel do you hear in the middle?
28×  Which word goes with the picture?
 3×  Which picture has the short e sound?
```

`rhyming`, 145 items, 3 prompt shapes. The repo's own independent auditor counts **6,650 near-template
pairs** where `docs/validation/assessment_rebuild_gate.md` shows a green ✅ on all 30 skills:
`initial_sounds` 5,460 · `short_vowel_discrimination` 435 · `rhyming` 378 · `r_controlled_vowels` 157.

Killing the template mill was the rebuild's headline promise. G2 green is why nobody caught that it
didn't happen.

**Fix.** Replace the `withText` filter with the independent auditor's `textForSimilarity`
(prompt + passage + sentence + choices) and its n-gram thresholds from
`tools/assessmentRebuild/independentAudit.mjs:77-102`, so one similarity implementation serves both
the gate and the auditor. Until that lands, delete the G2 ✅ column from
`docs/validation/assessment_rebuild_gate.md` rather than leave it asserting something unmeasured.

---

## H4. `skillLevelGapQuestions.generated.js` — 1,342 items of combinatorial filler

**File:** `src/data/generated/skillLevelGapQuestions.generated.js`, `source: "skill_level_depth_gap_generator"`.

Of 3,614 passage sentences over 25 characters, **2,330 (64.5%) are verbatim repeats** of a sentence in
another passage. **552 items (41%)** appear at *both* level 1 and level 2 with identical prompt and
identical choices. 828 comprehension items share only **135 distinct choice sets**.

Most-repeated sentences:

- *"When a small problem came up, they talked it through instead of rushing."* — **92 passages**
- *"By the end, the whole group understood what to do next."* — **92 passages**
- *"They handled it in the safest way they could."* — **92 passages**

The "progression", verbatim:

> **L1** `gap_main_idea_l1_story_01` — *"Owen and Aunt Jo spent the morning at the fire station. They
> checked the open garage, gathered supplies, and made sure everyone knew the plan. When a small
> problem came up, they talked it through instead of rushing. By the end, the whole group understood
> what to do next."*
> Q: *"What is the passage mostly about?"* → `["solving a small problem", "losing a favorite toy at the playground", …]`

> **L2** `gap_main_idea_l2_story_01` — *"Ruby and Mr. Patel spent the morning at the forest trail.
> They checked the fallen log, gathered supplies, and made sure everyone knew the plan. When a small
> problem came up, they talked it through instead of rushing. By the end, the whole group understood
> what to do next."*
> Q: same question, **same four choices, same answer.**

And 46 of 368 L1/L2 pairs are the L1 passage with one meta-sentence bolted on: *"The class used the
important details to explain the answer."*

The passages are contentless by construction — main-idea templates with the topic nouns removed — so
*"what is it mostly about?"* is answered by lifting the phrase *"a small problem"* out of the text.
That is word-matching, not main idea. In `cause_effect`, **76 of 92 items (83%)** have lexical overlap
between passage and correct answer while no distractor does — a pure surface-matching cue.

**Fix.** Retire it from `loadAssessmentSkillBank.js` and `skillAssetRegistry.js`. Do not patch it —
92 copies of one sentence cannot be repaired by editing. Rebuild against the v3 comprehension banks,
which are genuinely good (see "What is well made"). Add CI checks: no >25-char sentence in more than
2 passages per bank; no `(prompt, sorted choices)` pair at more than one level; reject any
comprehension item where the correct answer shares a content word with the passage and no distractor
does.

---

## H5. A quarter of v3 items show a picture of the wrong thing

**Scale:** 621 of 2,263 image-bearing items (**27.4%**) have an image whose asset key matches neither
the target word, nor the correct answer, nor any choice. 1,521 (67%) share an image with an item from
a *different skill*. 710 distinct images serve 2,263 items. All 2,518 items are `image-required`.

The mechanism is visible in the data: the image is resolved from a word in the **prompt stem**, not
the item content.

- `finish-end-01.webp` (a picture of *finish/end*) → **33 items**, all with prompts beginning
  `"Finish: __"` — `"Finish: __ooter"` (*scooter*), `"Finish: __in"` (*skin*), `"Finish: sh__t"` (*short*).
- `build-construct-01.webp` (construction imagery) → **31 items** beginning `"Build the missing word:"`
  — e.g. *"Build the missing word: We met ___ the pond."* (answer *at*).
- `hfw/find.webp` → **21 items**: `"Find the word: at"`, `"Find the word: do"`, `"Find the word: or"`
  — 16 different targets all showing a picture of *find*.
- `morning-mourning-01.webp` → **21 items**, including a `cause_effect` item *"What happened because
  of the deep snow?"*. A *morning/mourning* homophone card is by construction half a bereavement
  image, attached to unrelated items for 4–8 year-olds.
- A well-written inference item about stage fright → `prefixes-suffixes/quickly-01.webp`, resolved
  from the word *"quickly"* inside the passage.

`imageAlt` is the prompt string verbatim on 1,004 of 2,263 items (e.g. `"imageAlt": "Finish: sh__t"`),
so screen-reader users get no image information at all.

For an EL child and any pre-reader, **the picture is the item**. A race finish-line photo next to
"Finish: __ooter" is not decoration; it is a competing cue the child attends to first, pointing
nowhere.

**Fix.** In the v3 generator, derive `requiredImageAssetKey` from `targetWord`/`correctAnswer` only —
never from prompt tokens — and fail generation rather than fall back. Add
`tests/unit/v3ImageIntegrity.test.js` asserting `resolvedImageAssetKey ∈ {targetWord, correctAnswer,
...choices}` and that no image is bound across skills. Items that need no picture (grapheme-cloze,
HFW *"Find the word: X"*) should be `mediaTier: "text-only"` — that alone removes ~600 bad bindings.
Blocklist `morning-mourning-01.webp` outside homophones. Generate real `imageAlt` from the depicted
noun.

*Caveat: `public/` was not in my extract, so this is derived from asset keys and paths, not from
seeing the images. Spot-check visually before acting — though the `"Finish: __ooter"` →
`finish-end-01.webp` mechanism is unambiguous in the data.*

---

## H6. Cycle 1 recommends a book in which the child can read zero words

**Verified against the app's own scope-and-sequence** (`src/data/elSkillsBlockCycles.js`, 34 cycles).
Testing every unique word in each recommended book against the cumulative taught graphemes + taught
HFW at that cycle:

| cycle | taught so far | recommended book | unique words | **not decodable** |
|---|---|---|---|---|
| 1 | `a, m`; HFW `am, I` | `bob-and-nan-01` | 11 | **11 (100%)** |
| 1 | " | `first-facts-level-a-13-fruit` | 25 | **23 (92%)** |
| 4 | `a,m,t,s,n,i,f,d` | `first-facts-level-a-08-my-pet` | 25 | **20 (80%)** |
| 7 | +`o,l,r,h` | `first-facts-level-a-11-at-the-farm` | 27 | **18 (67%)** |

Mean across all 68 recommendations: **25.5% of unique words are not decodable.**

The full cycle-1 fiction recommendation: *"This is Bob. / Bob can run. / This is Nan. / Nan can run. /
Bob and Nan ran. / Bob and Nan sat. / Bob and Nan are pals!"* — after cycle 1 the child knows `a`,
`m`, `am`, `I`. Not one word is accessible.

`elSkillsBlockCycles.js` is a textbook cumulative synthetic-phonics sequence. Cumulative sequences
carry a decodability obligation: practice text is restricted to taught code plus explicitly taught
tricky words. Matching by F&P level letter instead means the "aligned reader" is 100% undecodable in
week one — and children respond to that by guessing from pictures, the exact habit the sequence
exists to prevent.

Also: only **18 distinct books** are recommended across 34 cycles from a 176-book library;
`bob-and-nan-01` is recommended **10 times**. All 68 `reason` strings are template output with a
double article — *"A A-level fiction read that gives students story language…"*. 10 have empty
`skillConnections`, 8 empty `hfwConnections`, 10 empty `patternConnections`.

Sequence error: cycle 9 introduces `Qu/qu` (/kw/), but `Cc` arrives at cycle 10 and `Kk` at cycle 13 —
the child is taught a two-phoneme grapheme one cycle before *either* grapheme for its own first
phoneme /k/.

**Fix.** Write `src/utils/guidedReading/decodabilityScore.js` returning
`% decodable | taught-HFW | off-code` for a (book, cycle) pair; reject any recommendation below 90%
for cycles 1–13. Regenerate `guidedReadingRecommendations` using it as primary sort with F&P as
tiebreak. **Nothing in the current 176 books qualifies at cycle 1** — until a decodable A/A+ series
exists, cycles 1–6 should recommend *shared/echo reading* explicitly, not "read this". Fix the
`"A A-level"` template. Move `Qu/qu` after cycle 13.

---

## H7. The reading ladder is not a ladder

| declared level | n | total words | words/page | sentence len |
|---|---|---|---|---|
| A | 55 | 47 avg (25–74) | 5.8 (4–8) | 3.8 |
| B | 76 | 115 avg (24–**332**) | 11.9 (4–**27**) | 5.0 |
| C | 45 | 320 avg (193–**679**) | 27 (17–**49**) | 7.0 |

Level C spans 3.5× internally and jumps 2.8× from B with nothing between. In
`guidedReadingRegenBooks.js` the order inverts outright: Level **D** averages 30 words, Level **E** 31,
while Level **B** *First Facts* books average 79.

All three of these are tagged **Level C, ages 5–6**:

- `ab-c-04`, p1: *"It was an ordinary Saturday in late August when Uncle Eddie arrived at the door
  with a travelling bag, a very wide smile, and something small and determined scratching inside a
  sturdy pet carrier."* — one 32-word sentence. 679 words total. This is F&P Level N–P, US grade 3–4.
- `gr-c-37` "Water", complete: *"Water can be a liquid. / Water can be ice. / … / Water is
  important!"* — 26 words.
- `moonwood-tales-c-01` — 237 words.

And Level B `gr-b-33` "Tools" (ages 4–5) needs *wrench* (silent w + `ch`), *bolts*, *measures* (/ʒ/,
one of the rarest English phonemes), *length* — none decodable in any cycle up to 27, and harder than
anything at Level D or E.

Separately, **21 of 21** books in `guidedReadingRegenBooks.js` are the identical 6-page template:
five parallel sentences on one frame plus a wrap-up ending in `!`. `gr-c-38` "Five Senses" (Level C)
and `gr-e-50` "Our Five Senses" (Level E) are the same book two levels apart.

**Fix.** Write `docs/LEVELLING_RUBRIC.md` with hard bands (A ≤ 8 words/page & ≤ 5-word sentences;
B ≤ 12/≤ 7; C ≤ 20/≤ 9; D ≤ 30/≤ 11; E ≤ 45/≤ 13) and `tests/unit/bookLevelBands.test.js` failing any
book outside its band. On today's data that fails the whole `aiden-and-betty` series (re-label ~M–N or
move to a "Read to Me" shelf) and all of `guidedReadingRegenBooks.js` at C/D/E. Fill the B→C gap —
there is currently nothing between 12 and 17 words/page. Cap templated-frame books at A–B. Merge the
duplicate-topic collisions: *"Five Senses"* ×3 at three levels, *"Colors"* ×3, *"My Body"* ×3,
*"Day and Night"* ×2, *"The Moon"* ×2, *"Water"* ×2.

---

## H8. The word bank's "sounds" are letters, not phonemes

`src/data/generated/skillWordBank.generated.js` → `skillColumnEntries` (4,554 rows). `initial_sounds`
is 300 rows across 25 targets `/a/…/z/` — **an alphabet, not a phoneme inventory.**

- `initial /c/`: *cat, cap, cup, cake, candle, carrot…* and `initial /k/`: *kit, kid, kite, key,
  king…* — **the same phoneme /k/ as two separate "sound" targets** (24 words, 8% of the skill). A
  child can "master" two achievements having learned one sound.
- `initial /q/`: *queen, quilt, quiz, quack…* — /q/ is not a phoneme; these all begin /kw/.
- `initial /u/`: *up, us, under, umbrella…* plus **unicorn, uniform, ukulele, utensil** (all begin
  **/j/**) and *urchin* (r-controlled). **5 of 12 wrong.**
- `initial /a/` includes *apron, acorn* (/eɪ/); `/e/` includes *eagle, easel* (/iː/); `/i/` includes
  *island, icicle* (/aɪ/); `/o/` includes *ocean, overalls* (/oʊ/), *outside* (/aʊ/), *orange* (r-controlled).
- `final /r/`: *car, jar, star… tiger, teacher* — the last two end in /ər/, not /r/; and in any
  non-rhotic accent none of them ends in /r/ at all.
- `final /k/` and `final /ck/` share *duck, sock, truck* — `ck` **is** /k/.

In `cvc_short_vowels`: `short i CVC` contains **six** (4 phonemes); `short o CVC` contains **box, fox**
(4 phonemes). `short i CCVC/CVCC` contains **fish, ship, thin** — all three are CVC, because `sh`/`th`
are single phonemes. Across the five CCVC/CVCC lists, **12 of 51 words are in the wrong structural
class.** Digraphs counted as clusters is the single most common cause of children segmenting *fish*
as f-i-s-h.

**The correct exclusion list already exists in this repo** —
`initialSoundPhonemeMismatchTargets` in `src/content/initialSounds/initialSoundWordBank.js:252` names
38 of exactly these words, with per-word justifications and tests. It was never applied to the
workbook import, and the v3 bank reintroduces one of its own documented exclusions:
`lp3.initial_sounds.l2.B.u.v2` asks *"Which letter makes the first sound in **uniform**?"*, answer `u`.

**Fix.** Rebuild the `initial_sounds`/`final_sounds` inventories from a **phoneme** list (24
consonants + 5 short vowels). Merge `/c/`+`/k/` into one `/k/` unit with both spellings; delete `/q/`
and `/x/` as sound units and move them to a *grapheme* skill. Split each vowel unit into `short_X`/
`long_X`. Add a `syllableStructure()` check to `tools/importSkillWordBankWorkbook.js` that treats
`sh, ch, th, ng, ck, ph, wh` as one unit and rejects a word whose computed structure disagrees with
its column. Promote `initialSoundPhonemeMismatchTargets` and `LOW_VALUE_CVC_EXCLUSIONS` into a shared
`src/content/lexicon/blockedTargets.js` imported by **every** generator.

Vowel-team units need the same treatment: **`read` appears in both `ea long e` and `ea short e`** (a
heteronym, unanswerable in isolation); `ie/oe/ue` mixes *pie/tie* (/aɪ/), *field/chief* (/iː/),
*blue/glue* (/uː/) and *rescue* (/juː/) — four phonemes in one "unit"; `er` mixes stressed /ɜːr/
(*her, fern*) with unstressed /ər/ (*teacher, sister, water*); `or` misfiles *door*; `au` misfiles
*because*.

---

## H9. The vocabulary lexicon's phonics tags are heuristic guesses, several exactly backwards

`src/data/kimiVocabulary500Lexicon.js` (500 entries), generated by
`src/utils/phonics/phonicsHeuristics.js`. 66 words carry a silent-e tag; **at least 20 are wrong.**

- `"above"` → `longVowel: "o"`, `cvce: true`, `vowelPattern: "silent-e"`, `syllableType:
  "vowel-consonant-e"`, `tags: [… "silent-e", "silent_e_intro"]`. *Above* is /əˈbʌv/ — schwa onset,
  **short u**, and the final `e` is the "no English word ends in v" e.
- `"glove"` → `longVowel: "o"`, `vowelPattern: "silent-e"`. Filed this way it teaches a child to read
  "glohve".
- `"dove"` → `longVowel: "o"` — a heteronym, unusable as a phonics target either way.
- **`badge`, `bridge`, `fridge`** all tagged `silent_e_intro` — `-dge` **short-vowel** words, the
  textbook counter-example to the rule.
- `"ice"` → `longVowel: "e"` (it is long **i**); `"eye"` → `longVowel: "e"` (it is /aɪ/).
- 28 words are rhyming-eligible with `rimeFamily` equal to the whole word, so can never be paired:
  *alligator, asparagus, anteater, artichoke, emu, orchid, iris, eel, elk, arch, almond*.
- `recommendedLevel: 1` (the youngest band) includes **`yen`**, with a picture.

Silent-e is one of the highest-leverage generalisations in English. Populating a silent-e lesson from
`tags: silent-e` shows a child *glove, above, dove, badge, bridge* alongside *bike, cone, cube* and
tells them the pattern is the same. That is worse than not teaching it.

**Fix.** Remove the heuristic from pattern assignment — it may *suggest*, never be source of truth.
Gate on `src/content/lexicon/approvedWords.json` → `phonics`, described in-file as *"human-reviewed
word→pattern mappings; L-LEX rejects any phonics item whose mapping is absent."* **That gate is not
enforced: 380 of 766 v3 phonics items (50%) use a target word absent from the map.** Enforce it, and
extend the map — it currently has no entries at all for `ee, ea, ai, ay, oa, igh, oo, ar, or, er, ir,
ur, oi, oy, ou, ow, aw, au` or any blend. Blocklist the silent-e exception set (*have, give, live,
love, above, glove, dove, come, some, done, none, one, gone, move, prove, whose, were*) and all
`-dge`/`-Cle` words, with a unit test. Null `rimeFamily` for multisyllables. While in
`approvedWords.json`: `e_e` contains `"pete"` (lowercase proper noun) and *scene, complete, concrete,
athlete* (none CVCe); `o_e` lists `"stone"` twice; `u_e` conflates /juː/ with /uː/.

---

## H10. `GRAMMAR_SENTENCE_FIT` — 138 of 138 items cannot be answered by the criterion the prompt states

`src/data/generated/secondBlockSkillTopUpQuestions.generated.js`. All 138 items have **all four
options sharing the target part of speech.**

A complete item, verbatim:

```
prompt:        "Choose the adjective that best fits the sentence."
sentence:      "The pictured object looks ___."
choices:       ["brave","cute","huge","silent"]
correctAnswer: "brave"
explanation:   "brave fits the sentence as a adjective."
```

*"The pictured object looks brave / cute / huge / silent"* are all grammatical. The stated criterion
discriminates nothing — it is secretly a picture-naming task with an undepictable target.

Also: `"Tap the picture that shows a adjective."` ×36 (options are words, not pictures);
`second_nouns_l2_41_sock` → `["snake","snow","sock","star"]`, all four nouns;
`second_r_controlled_l1_03_ir_bird` → *"**Listen** to the word and choose its r-controlled spelling"*
→ `["ir","ar","er","or"]` ×30 items — *er*, *ir*, *ur* spell the identical phoneme /ɜːr/, so the task
as worded is undecidable by ear. 166 items run on 53 generic stems (*"The object is ___ the other
object."* ×28). **92 explanations and 46 prompts contain the agreement error "a adjective."**

**Fix.** Rewrite so distractors are **other parts of speech** (*"The dog is ___." → brave / run / dog
/ quickly*) — that is what makes the criterion do work. Replace all 53 placeholder stems with
authored sentences naming a real referent. Global `a adjective` → `an adjective` (92 + 46 strings)
plus a CI regex guard `\ba (a|e|i|o|u|adjective|adverb|hour)\b` over all content strings. Reframe the
30 r-controlled items as *"Which spelling is used in the word bird?"* with the word shown, or drop
them.

---

## H11. The documentation reports a state the code does not produce

Eleven of 26 checked doc claims diverge from source. The pattern: the v3 bank replaced v2 in the live
loader on 2026-07-29/30, and the release ledger, curriculum board, admin console module and the
"measured findings are fixed" paragraph were all last verified against **v2 on 2026-07-27** and never
re-run.

- **`docs/INDEX.md:123-125`** — *"`check:assessment-runtime-variation` cited 876 failures and now
  reports **0**. Verified by running both, 2026-07-27."* → running it today: **exit 1, 662 failures**
  (484 × resolved-media-validation, 177 × repeated image, 1 × blocked audio). The committed report
  still says `Status: PASS` and describes a bank that no longer exists (lists `rhyming | 656`
  selectable; the live loader returns 135).
- **`docs/release/TRACEABILITY.md:5`** states the rule: *"A row may become DONE only when its named
  gate passes against the reachable product."* Rows **A1.1** and **A1.2** are `DONE`;
  `checkCurriculumReleaseStandard.mjs` exits 1 with **4,757** failures of the form *"audited question
  <id> is absent from the student loader"* (the audited set is v2 ids, the loader returns v3 `lp3.*`
  ids). Both gates are wired into `check:release`, so the whole release gate is red while the ledger
  reports 90/100 items closed.
- **`docs/release/CURRICULUM_BOARD.md`** is headed *"Current truth"* and is rendered by the in-app
  Admin Content Coverage screen (`AdminDashboardPage.jsx:73`, `:1932`):

  | | board says | loader actually returns |
  |---|---|---|
  | initial_sounds | 92 | **150** |
  | rhyming | 656 | **135** |
  | final_sounds | 366 | **72** |
  | prepositions_of_place | **"0 — blocked from children"** | **64** |

  `node tools/checkCurriculumBoard.mjs` → exit 1, *"Generated admin curriculum-board module is
  stale."* Anyone checking coverage in the app is told a skill is withheld from children while 64
  questions are being served.
- **`docs/validation/assessment_rebuild_gate.md`** could not have been produced by the generator that
  now exists: 9 columns committed, 11 columns generated, different footer wording. Under today's
  `gate.mjs`, G7 is a real boolean evaluating `false`, so all 30 rows would be `ready: false`. The
  committed all-✅ report is unreproducible.

**Fix.** Run `npm run check:release` on the current tree and treat its output as the *source* for
those four documents rather than editing them by hand. Flip A1.1/A1.2 to `IN-PROGRESS` with current
failure counts. Regenerate `curriculumReleaseBoard.generated.js` + `CURRICULUM_BOARD.md` against the
v3 loader and put `check:curriculum-board` in the pre-deploy path. Delete
`assessment_rebuild_gate.md` and regenerate into `docs/release/artifacts/` where dated artefacts
belong. **Structurally: forbid hand-written status in `docs/`. If a number is a measurement, it must
be generated, and the generator must be in the release gate.**

---

# MEDIUM

- **M1 — Comprehension items are excellent and pitched five years too old, in the wrong dialect.**
  525 items all tagged `grade: "K-2"`; all 32 `theme_higher_comprehension` level-1 items are
  `difficulty: 1` with 50-word passages doing multi-step inference on reciprocal altruism, em-dash
  parentheticals and 20-year time spans — Year 5/6 work. **100 of 525 (19%)** carry UK-specific
  vocabulary (*mum* 31, *gran* 30, *queue* 13, *torch* 11, *head teacher* 7, *wellies* 6, *allotment*
  4, *bin day*, *car boot sale*, *Bonfire Night*, *crisps*). An EL child cannot infer *"long kindness
  may be repaid quickly"* from a passage presupposing corner-shop credit and British flood-response
  norms, with no L1 gloss or vocabulary pre-teach attached. **Fix:** re-band to a `grade: "3-5"` tier
  and author a real K-2 tier (2–3 sentence passages, single-step inference); localise or pre-teach the
  100 flagged items; cap level-1 passages at 25 words / 8-word sentences in CI.

- **M2 — Locale collision.** 41 books contain UK markers, 16 US, 5 both — in one 176-book shelf.
  *"Look at the Colours!"* and *"Colors"* are both Level B and both live. `ab-c-01` is *"Aiden and
  Betty Start **Grade 1**"* while `ab-c-04` in the same series has *"a **travelling** bag"* and *"an
  animal **behaviour** researcher"*. v3 has `yoghurt`; the word bank has `yogurt`. **For a phonics
  product, orthography is the content** — a child taught `colour` and `color` in the same week from
  the same shelf is being taught that spelling is arbitrary. **Fix:** declare a `LOCALE` constant and
  a primary locale in `docs/`, run a normaliser over the book/bank/worksheet/presentation files, add
  a CI marker test. If both must ship, fork the files — do not interleave.

- **M3 — 38 of 148 cloze items (26%) have more than one correct answer.** `"Finish: __op"` →
  `["dr","cr","st","sh"]`, answer `st` → but *drop, crop, shop* are all real words. `"Finish: __ick"`
  → *brick, trick, stick, click*. `"Finish: m__t"` → *meat, meet, moat*. And two items share the
  identical printed stem `"Finish: sh__t"` with **opposite** correct answers (*shirt* vs *short*). 36
  of the 38 are recoverable via `spokenPrompt`, but that silently changes the construct from grapheme
  selection to picture-naming-plus-listening — a systematic disadvantage to EL and hearing-impaired
  children. **2 are fully broken** because their image is one of the H5 mis-resolutions. **Fix:**
  generation-time check rejecting any cloze where >1 choice yields a lexicon word; pick distractors
  that make non-words; `tests/unit/clozeUniqueness.test.js`.

- **M4 — CVC "match the picture" on unpicturable words.** 101 items whose targets include *bad, dab,
  sad, mad, dug, fun, hit, wag, dip*. There is no picture of *bad*, *fun*, *dug* or *hit* a
  five-year-old names uniquely — the child fails on picture interpretation and it is recorded as a
  decoding failure. 67 distinct distractor triples for 101 items, one reused 5×, so the rest become
  solvable by elimination. **Fix:** filter the generator on `isImageable && isConcrete && noun`;
  re-author the ~35 unpicturable items as listening items; require ≥3 distractor sets per vowel.

- **M5 — HFW band integrity.** The four "25-word" bands hold **23 / 32 / 22 / 23** words, so three of
  four band labels are wrong. **`of`** — the second most frequent word in written English — is in the
  *last* band, while band 1 holds *come, look, my*. 40 tokens appear as distractors but are never a
  target in any band. **500 of 2,000 `hfwSentences` carry `"notes": "Review for cloze ambiguity
  before converting into assessment item"`** and 99 carry `"likelyAmbiguous": true` — shipped with
  their own review-before-use note attached. The very first row is one: target `the`, sentence *"The
  dog ran to the gate."* (target appears twice; distractors *a, my, one* all give a grammatical
  sentence). **Fix:** adopt one published list (Dolch or Fry 1–100) and state it in `docs/`;
  rebalance to 25; make the distractor pool a subset of taught + next-band; **exclude any row with
  `likelyAmbiguous: true` from item generation** until reviewed.

- **M6 — 600 items request an image that was never made.** All 600 in
  `hfwApprovedQuestionBank.generated.js` carry `cartoonImageNeeded: true` with `imagePolicy:
  "no_image"`. And **all 313 story-quest pages** carry `narrationNeedsRebuild: true`, which
  `readAloudPolicy.js:33` turns into `""` — **read-aloud is disabled on 100% of story-quest pages.**
  **Fix:** either commission the media or remove the flags and the affordance; a permanent "needs
  rebuild" flag on 100% of a surface is a decision, not a to-do.

- **M7 — `tools/checkDetailedReportDataContracts.js` is permanently red and orphaned.** It asserts
  `AdminDashboardPage.jsx` contains teacher-report strings that moved to `TeacherReportsHubPage.jsx`
  in the 07-26 overhaul. 13 FAILs, exit 1, referenced by nothing. `docs/TEACHER_AREA_OVERHAUL_2026-07-26.md`
  records fixing this exact failure mode for a different file — *"A gate that is always red proves
  nothing."* **Fix:** repoint or delete.

- **M8 — 378 exported symbols in `src/` are referenced nowhere** in `src`+`tools`+`tests`+`scripts`.
  Not all are dead (some are entry points), but it is a large enough surface to hide dead features.
  **Fix:** a `check:dead-exports` script with an explicit allowlist for genuine entry points.

---

# LOW

- `presentationBuilder.js:326` — `const BLEND_DIGRAPHS = ["sh","ch","th","wh","ng","nk","qu","ck"]`.
  `nk` and `qu` are not digraphs (two phonemes each), and the name conflates blends with digraphs.
- `imageAlt` duplicates the prompt verbatim on 1,004 of 2,263 v3 items — no image information for
  screen-reader users.
- `moonwood-tales-c-01` and `-c-24`: `targetSkills` is a raw dump of every word in the book in order
  of appearance (129 entries). 2 of 81 books.
- `initialSoundWordBank.js` carries quota-padding phrases (*"zesty lemon", "yawning child", "quilted
  blanket", "zebra crossing"*) plus `yoyo` and `yo-yo` as separate entries — correctly `active:
  false`, so harmless, but 65 of 500 items are dead weight.
- `check:skill-progression` reports *"Unresolved progression warnings: N"* where `warnings` is
  declared and never pushed to — it has published `0` since it was written.
- 4 npm scripts point at `playwright.quest*.config.js` files that do not exist, and 37 point at
  `tests/release/*.spec.js`. `checkRepoHygiene.js:252` only regex-matches commands containing the
  literal token `node`, so no Playwright target is ever existence-checked. `tests/browser/` (1,673
  lines, including `quest-accessibility.spec.js`) has no reachable runner.

---

# What is well made — protect this work

I went looking for reasons to fail these and did not find them. This matters: the problems above are
not "the whole thing is slop." They are specific, and they sit next to real craft.

1. **`src/content/initialSounds/initialSoundWordBank.js`** — a hand-written, reasoned exclusion list
   of 38 phonemically-mismatched targets with per-word justifications, enforced via `active: false` +
   `qaStatus` + a runtime eligibility function, backed by `tests/unit/initialSoundAuditFixes.test.js`
   which also asserts `c` and `k` are never offered together for one spoken /k/. **This is genuine
   specialist work.** My criticism is only that it was never applied anywhere else.
2. **`src/utils/guidedReading/bookQuizQuestions.js`** — six structural validators plus a Latin-square
   answer-position randomiser guaranteeing each position is used once per quiz. The underlying data is
   75% answer-first; the runtime fixes it correctly. **This file is the model for the C2 fix.**
3. **`hfwApprovedQuestionBank.generated.js`** — I ran a same-word-class substitution test over all 300
   Level-1 cloze items: only 3 had a rival, and all 3 were false positives on inspection. Answer
   positions balanced (79/63/84/74). 8 duplicate sentences in 600. **This is the reference standard
   for the rest of the product.**
4. **The v3 comprehension banks** (`inference`, `main_idea`, `key_details`, `cause_effect`,
   `context_clues`) — genuinely distinct passages (0 reuse across 736), real `distractorRationales`
   (`D-OPPOSITE`, `D-PLAUSIBLE-UNSUPPORTED`), authoring notes explaining why each answer is uniquely
   supported. The problem is placement and locale (M1), not craft.
5. **`rhyming.generated.js` + `rhymeGroups.js`** — 354 items validated against 55 rhyme families:
   **0** non-rhyme answers, **0** items with a second rhyming choice, 336 distinct distractor triples
   for 354 items. Only defect is the position bias.
6. **`tools/checkSkillProgression.js` + `skillProgressionExceptions.js`** — 5 exceptions, every one
   with `rationale`, `reviewedBy`, `reviewedAt`, `reviewDue`; the checker **fails on an expired
   review** and **fails on an exception no longer exercised**. This is how allowlists should be
   governed, and it should be the template for every other waiver in the repo.
7. **`tools/checkPrivateSourceMaps.mjs`** — builds, symbolicates a real production stack frame,
   verifies it resolves to the right source file. A check that actually re-derives.
8. **The unit test layer is genuinely strong.** 231 files, 1,588 cases: **zero** skipped tests, zero
   tautological assertions, zero empty bodies. Instrumenting `node:assert` across every case, no
   passing test ran zero assertions; V8 coverage over the 177 fully-passing files found **1**
   never-executed assert site out of ~2,800. Mutating `PHASE_PASS_RULE.accuracyMin` from 0.7 to 0.1
   produced a real failure. **The rot is in `tools/`, not `tests/unit/`.**
9. **`docs/TEACHER_SIDE_REMEDIATION_2026-07-27.md`** is unusually honest — it explicitly refuses to
   mark items DONE. The dishonesty is concentrated in the older top-level summaries (`INDEX.md`,
   `TRACEABILITY.md`, `CURRICULUM_BOARD.md`) that were never re-run after the v3 swap, not in the
   day-to-day change records.
10. **`releaseGate.mjs` itself is honest** — it refuses to run without all six audit credentials
    (exit 2), and marks missing scripts `not-implemented` rather than skipping them.

---

# Fix order

Do these in sequence. Each one makes the next measurable.

**1 — Make the checks able to fail.** The meta-check in C4 fix 1 (~30 lines in
`checkAuditReadOnly.mjs`), then repair the twelve. Until this lands, every other fix in this document
is unverifiable, and any future model working here can claim it green. Add to `AGENTS.md`: *every new
check must be demonstrated failing before merge.*

**2 — Shuffle the answers (C2).** One file, plus a CI test, plus copy an implementation you already
have. Nothing about children's learning can be measured until this ships.

**3 — Decide, deliberately, which bank children get (C1).** Add G6/G7 to `HARD_GATES`. Understand
that this reverts to v2, which has C2 and C3. That is the honest state; make the call consciously.

**4 — Pull the 105 blend/`ll` items out of `final_sounds` (C3).** This is the one a phonics
consultant would refuse to sign past.

**5 — Run `tests/sql` and put `check:live-database` in the release gate (C5).** Child-data boundaries
are the one category where being wrong is not recoverable.

**6 — Fix the pass-score overwrite (H1)** and delete whichever of the two sitting-length systems you
don't want.

**7 — Regenerate the four stale status documents from the gates (H11)**, and stop hand-writing
numbers into `docs/`.

**8 — Content re-authoring, in this order:** retire `skillLevelGapQuestions` (H4) → bind v3 images to
targets or mark text-only (H5) → decodability score before book recommendation (H6) → phoneme-based
word bank inventory (H8) → lexicon phonics gate (H9) → `GRAMMAR_SENTENCE_FIT` rewrite (H10).

---

# Coverage and honesty

**Verified by me directly, by loading real data or reading real source:** C1 (`HARD_GATES` contents,
30/30 cutover, 30/30 `pending-ben`, 2,518 approved / 0 signed off), C2 (3,390/3,524 = 96.2% at index
0, measured; zero shuffle tokens in `AppPages.jsx`), C3 (105/279 = 37.6%, measured), C4 (six of the
twelve confirmed to contain zero failure mechanisms), C5 (`tests/sql` = 10 files, 0 references), H1
(the overwrite at `masterySystem.js:207`), H2 (75 items / 300 cards / 300 without audio, measured).

**Reported by specialist passes and traced to file:line but not independently re-measured by me:**
H3–H11 and all M/L findings. The evidence in each is quoted verbatim from source; I did not re-run
every count.

**Not covered:**

- **All audio and all images.** `public/` (3.2 GB) was not staged. Every media claim is derived from
  paths and asset keys, not from seeing or hearing an asset. **H5 in particular should be
  spot-checked visually before you act on it.**
- **~30 legacy question-bank files** imported by `skillAssetRegistry.js` — `templateExpansion*`,
  `questionBankExpansion8–14`, `masteryCore/ExtraQuestions`, `ixlStyleSeedQuestions`,
  `kimiDataset7RuntimeQuestions`, `safeContentExpansionQuestions`,
  `targetedContentRecoveryQuestions`, `fixSentenceQuestions`. **Given what C2 and H4 found in their
  siblings, I expect these to be worse, not better. They are the largest unexamined risk.**
- `tests/release/` (41 MB of Playwright specs) — not in the extract.
- Git history — this was a source copy, so I could not date when defects entered or attribute them.
- Runtime behaviour — nothing was executed in a browser. No accessibility pass against a live DOM.
- `publicMediaInventory.js`, `mediaQaReviewItems.generated.js`, audio manifests — media inventories,
  not pedagogy.

**One thing I want to be explicit about:** I did not verify that any of my proposed fixes work. They
are designs, argued from the source. Apply them through your own Loop — inspect, fix, run a named
check, read the result honestly. Given what this audit found about named checks, verify the check
before you trust it.
