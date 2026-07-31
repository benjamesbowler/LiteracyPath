# LiteracyPath — staleness audit and decision record, 2026-07-31

**Purpose:** find everything old that has been updated, replaced or scrapped but is still in play, so that
only current paperwork governs. Conflicts were put to Benjamin as choices; his answers are recorded here
as binding.

**Headline:** the v3 cutover is real and complete at runtime — all 30 skills serve v3 — but **nothing v2
was retired.** The old apparatus is not merely present: it is still generated on every build, and in two
places it is still actively changing what a child sees. Meanwhile `docs/INDEX.md`, the file every agent is
told to enter through, **does not link to the nine documents that govern the live question bank at all.**

**One thing to do before anything else:** do not run `npm run build:v3-banks` until decision 6 below is
applied. Today it would write an empty status map and revert all 30 skills to the v2 banks. It is a
one-command product regression.

---

# PART 1 — Decisions (binding)

These override any document, comment or gate that says otherwise.

| # | Question | Decision |
|---|---|---|
| 1 | Skill assessment pass mark | **70%.** Intended, not a bug. |
| 2 | Human sign-off as a gate | **Not a factor.** Remove it; never add it. |
| 3 | Round length: v2 table vs v3 blueprint | **v3 blueprint sittings.** |
| 4 | HFW "Find the word: a" | **Remove properly** — delete the items and the format. |
| 5 | "Secure" — roster vs report | **One bar: the report's rule, everywhere.** |
| 6 | Locale | **American English.** Change the text; keep the voice. |
| 7 | Question quotas (46/level) | **Keep.** The gate stays; the plan gets amended. |
| 8 | Synthetic audio (TTS) | **TTS stands.** Retire the prohibition. |
| 9 | Stale documentation | **Delete and archive as recommended.** |

## What each decision costs and changes

### 1 — 70% is the pass mark
Confirmed intended. So the per-skill `passScore` values in `masteryRules` (HFW 90%, Initial Sounds 88%,
Inference 86%, Final Sounds 80%) are **dead config that disagrees with your policy** — they were already
being overwritten at `src/masterySystem.js:201`. Delete them; do not restore them. Rewrite the comment at
`:193-196`, which claims the opposite of what the code does.

### 2 — No sign-off gates
`G7_human_signoff` comes out of `hardGateKeys` in `tools/assessmentRebuild/gate.mjs`. This is not a
concession — **it fixes a live landmine.** Because G7 can never pass (`lib.mjs:239` defaults
`signedOffBy: null` and no authoring file ever sets it), a full `build:v3-banks` run today produces
`merged = Object.fromEntries(statusEntries)` with `statusEntries` empty, discarding all 30 published
skills. Removing G7 makes the gate honest and the build safe in one change.

It also explains the strangest artefact in the repo: `assessmentRebuildStatus.generated.js` says
*"GENERATED — do not hand-edit"* but contains `"G7_human_signoff": "pending-ben"` — a string its generator
cannot emit — and omits `G6_one_report` entirely, which the generator always writes. Someone hand-edited
the file to get past a gate that could not be passed. That is what an impossible gate produces.

**Keep G6.** It is not sign-off — it is the one-status-brain check, and it is the machine enforcement of
decision 5.

### 3 — Round length: v3 blueprint sittings win
Two systems are live and disagree for **17 of 30 skills**: `masteryRules` decides what the child is
*asked*; `blueprint.sitting` decides whether the report counts the sitting as *complete*.

| Skill | Child asked (old) | Report expects (new) |
|---|---|---|
| Initial Sounds | 8 | 10 |
| Final Sounds | 15 | 10 |
| HFW ×4 bands | 10 | 12 |
| Plurals, Antonyms & Synonyms | 10 | 8 |
| Homophones & Homonyms | 12 | 10 |
| Sentence Comp, Key Details, Sequencing, Main Idea, Cause & Effect | 12 | 8 |
| Inference, Context Clues, Theme | 14 | 8 |

Where the blueprint expects *more* than the round delivers (Initial Sounds, all four HFW bands), a child
can finish a round the report then refuses to count.

**Four skills currently ask for more questions than exist** — Plurals asks 10 from a pool of 8; Inference,
Context Clues and Theme ask 14 from 12. `App.jsx:2532` already apologises on screen: *"only has {n}
distinct items right now; a full round asks {ROUND_LENGTH}. The round will stop early."* Moving to
blueprint sittings makes all of those 8 and the problem disappears.

**Actions.** Delete `masteryRules` (~208 lines). Point `src/App.jsx:448-452` at
`getV3BlueprintForRuntimeSkillId(id).sitting`. Also retire `INITIAL_SOUND_ROUND_LENGTH = 15` at
`src/content/initialSounds/initialSoundWordBank.js:6` — a *third* live round length for the same skill.
`docs/skills-assessment-rebuild/PLAN.md:92` already prescribed exactly this.

### 4 — "Find the word: a" comes out properly
A v2-era guard (`BAD_HFW_PROMPT_PATTERNS`, `src/data/sourceOfTruthRegistry.js:210`) is applied to the v3
bank at `loadAssessmentSkillBank.js:650` and **silently deletes 100 live items** — 25 per HFW band, every
one `formatType: "HFW_READ_FIND_WORD"`. The gate counts 125 selectable per band; the runtime serves 100.
Level 1 loses one of the two formats its own blueprint promises.

You chose to make the ban real rather than reverse it. **Actions:** delete the 100 items from the
authoring files, remove `HFW_READ_FIND_WORD` from `formatsByLevel[1]` in `skillBlueprints.js`, and leave
the guard in place. Then blueprint, gate count and served bank agree for the first time.

### 5 — One definition of "Secure"
Today the roster and the report reach different verdicts from identical evidence. Run with 10 rhyming
answers, 9 correct:

```
ROSTER  (teacherClassModel → learningPolicy) : 90% over 10 answers → "Secure"
REPORT  (skillStatusPolicy)                  : "Level 1 passed", not secure
        whyNot: Level 2 Phase 1 not assessed; Level 2 Phase 2 not assessed
```

There are **four rival status vocabularies** live — `SKILL_STATUS_IDS`, `LEARNING_STATUS_IDS`,
`REPORTING_STATUS_IDS`, and `getAccuracyStatus` — plus a `reportStatusLabel` helper whose only job is to
flatten them back down, with an accept-list that is itself archaeology:
`["secure","mastered","passed","got it","on track"]`.

**Actions.** Point `teacherClassModel.buildStudentSkillEvidence` at `computeSkillStatus`. Collapse the four
vocabularies to one. Add `teacherClassModel.js` to `productionUsesOneStatusBrain()` in `gate.mjs` — G6
currently passes for free because the roster is not in its file list.

**Expect the roster to show fewer Secures.** That is the correction, not a regression: Secure now means
both levels passed at 70% *and* a retention check of 8 items scoring ≥7, taken at least 3 days later.

### 6 — American English; the text moves, not the voice
This decision was never owned by any document. `AUTHORING_STANDARDS.md` — the file that governs authoring —
contains **no locale rule at all**, so it got made twice, in opposite directions.

Measured on disk: `/audio/production/en-US/` has **15,212 references and 15,212 files — an exact match.**
The audio bank is complete and American. The text is British: `colour`/`colours` ×117, `grey` ×38,
`neighbour` ×64, `practise` ×40, `favourite` ×10, `jewellery` ×7, `travelling` ×4, `programme` ×2, plus
~100 comprehension items resting on *wellies, torch, bin day, head teacher, queue, crisps, car boot sale,
Bonfire Night*.

**Actions.** Add a `LOCALE` constant and a spelling rule to `AUTHORING_STANDARDS.md`. Run a normaliser over
`src/data/v3/banks/`, `src/data/*Books.js`, `src/utils/present/presentationBuilder.js` and
`worksheets/worksheetBuilder.js`. Localise the ~100 culture-specific comprehension items
(torch→flashlight, wellies→rain boots, bin day→trash day, head teacher→principal, queue→line). Add a CI
marker test. Rewrite `docs/IMPROVEMENT_LOOPS.md:38` — *"UK-appropriate, age-appropriate everything"* is now
wrong.

### 7 — Quotas stay: 46 per level, 92 per skill
`src/content/releaseStandard.js` stays and stays wired into the release gate.

**This means `docs/skills-assessment-rebuild/PLAN.md:106` is now wrong and must be amended:** *"Quantity
never gates: no '46 per level' quotas anywhere in code or gates."* The plan changes, not the gate.

**The cost, plainly: ~2,212 questions still need authoring** before `check:curriculum-release-standard`
can pass honestly. Today it exits 1 and records *"generated publication bypassed a failing strict
decision"* for **25 of 30 skills**. Decision 4 makes the shortfall 100 worse. This is now your content
backlog, and it is the reason `npm run check:release` cannot be green — worth knowing before you plan
around a green release gate.

### 8 — TTS stands
`docs/IMPROVEMENT_LOOPS.md:27-29` says *"Never generate synthetic audio for phonics. TTS/AI letter sounds
have failed human ear-checks twice… The blocklist in `src/data/knownBadWordAudio.js` must never be emptied
without a human ear-check."* Both clauses are dead letters: the product runs entirely on Google
`en-US-Chirp3-HD-Leda`, and `knownBadWordAudio.js:7` is `new Set()` — emptied, with a comment citing Leda
replacements.

Leaving a false "NON-NEGOTIABLE" in place is worse than having no rule, because it teaches every reader
that the whole file is optional.

**Actions.** Rewrite those lines to state the Leda policy and keep an ear-check step for *new* batches.
Fix `src/audioSpeechPolicy.js:38`, which still declares `requiredVoice: "clean neutral human MP3"`. Clean
up **866 distinct code references to `/audio/child-mode/…`** — the retired human-recording scheme, which
has **0 files on disk**.

### 9 — Documentation cleanup approved
Delete 11, archive 8, rewrite 8. Detail in Part 3.

---

# PART 2 — What is stale in the code

## 2.1 The v2 bank apparatus is still built and shipped

All 30 skills serve v3 (verified: `loadAssessmentSkillBank` returns a pure-v3 bank for every skill id).
But the v2 machinery was never removed:

| | |
|---|---|
| Modules reachable **only** via the dead legacy arms of the loader | **102 files · 11.8 MB · 380,238 lines** |
| Unreachable from `main.jsx` and untested | **69 files · 21.0 MB · 766,917 lines** |
| v2 candidate pool still importable | **10,219 items** |
| Exported symbols referenced nowhere | **394** of 2,718 |
| `tools/` scripts referenced nowhere executable | **73** (491 kB) — plus 57 mentioned only in docs prose (961 kB) |

Rollup still emits a chunk per dynamic import, so all of this is built and deployed on every release. It
is simply never fetched.

**The most dangerous single file: `src/content/skillMedia/skillAssetRegistry.js`.** 483 lines, statically
importing 35 legacy banks and exporting:

```js
export const runtimeQuestionSources = [ ...masteryCoreQuestions, ...masteryExtraQuestions, /* 33 more */ ]
```

It is unreachable by a child — its only importers are three helpers used by five tools. But a constant
named `runtimeQuestionSources` listing 35 banks is exactly what a person or a model reads to answer *"what
questions does the runtime use?"*, and the answer it gives is **wrong by 10,219 items.** It also carries
`/* eslint-disable no-unused-vars -- LEGACY-LINT */` on line 1.

**Actions.** Delete the 39 `EXPANSION_BANK_LOADERS` and the legacy `DYNAMIC_BANK_LOADERS` plus the
`!releaseReady` branch (`loadAssessmentSkillBank.js:141-537, 656-687`). Archive `skillAssetRegistry.js`
and its four satellites. At absolute minimum, **rename `runtimeQuestionSources` → `legacyV2QuestionSources`
today** — two minutes, and it removes the biggest single misdirection in the repo.

## 2.2 `prebuild` regenerates dead artefacts on every deploy

Three of the ten generators in `prebuild` exist solely for the dead path:

| Generator | Output | Reality |
|---|---|---|
| `generateItemUniverse.js` | `itemUniverse.generated.js` | Reads the **v2** pool. Its header claims the student report derives chart denominators from it — false; its only importer is a unit test. |
| `generateAssessmentReleaseStatus.mjs` | 3 files incl. `assessmentReleaseExposure.generated.js` (**360 kB**) | The complete v2 publication register, 4,697 question ids. Read only inside the unreachable branch. |
| `generateRuntimeQuestionBankShards.mjs` | 53 shards | Loaded only by dead loaders. Three are empty files. |

`generateHfwEligibilityKeys.js` is **genuinely live** — keep it.

Also: **11 generated files have no writer tool at all**, and **11 more have a writer outside the prebuild
closure**, so they drift silently — including `cvc.generated.js`, `finalSounds.generated.js`,
`skillWordBank.generated.js` and `ledaProductionAudio.generated.js`.

## 2.3 Obsolete constraints still in code

| Constraint | Still does anything? |
|---|---|
| `HARD_GATES` narrowed 7→5 (`v3Registry.js:65`) | **Yes** — this is what lets the current status file publish. Decision 2 resolves it. |
| `BAD_HFW_PROMPT_PATTERNS` | **Yes** — deletes 100 live items. Decision 4 resolves it. |
| `masteryRules[*].passScore` ×30 | No — recomputed. Delete. |
| `masteryRules[*].reviewAfter` ×30 | No — referenced nowhere in `src`, `tools` or `tests`. Delete. |
| `INITIAL_SOUND_ROUND_LENGTH = 15` | **Yes** — a third live round length. Retire with decision 3. |
| `bannedRuntimePhrases` (6) | No — 0 matches across all 2,518 v3 items. |
| `legacyCandidates` blocklist (4 files) | No — all four already unreachable. |
| `BLOCKED_QA_STATUSES` | No — 0 v3 items carry any. |
| `sourceOfTruthRegistry.activeRuntimeFiles` (~40 paths) | No — **every assessment path listed is v2.** Reads as the authoritative map of live content; is a map of dead content. High misdirection risk. |
| `LEVEL_PASS_RULE` (85%) | No — exported, read by nothing. |
| Date-gated logic | **None found.** Clean. |
| `_old` / `backup` / `tmp` files in `src` | **None.** Cleaner than expected. |

## 2.4 The live v3 bank content is clean

Worth saying plainly, because it is the good news: across all 2,518 items — **0** duplicate ids, **0**
`active: false`, **0** deprecated/retired/blocked statuses, **1** source value, **0** answers missing from
choices, **0** legacy asset-path schemes. The 369 `retentionOnly` items are correctly filtered. The only
superseded-data problem is the external guard in decision 4, not the content.

## 2.5 Media — the opposite problem from the one expected

Measured directly on your disk:

| | |
|---|---|
| Media files on disk (images + audio + media) | **21,788** |
| Referenced by nothing in `src` | **6 — 0.0%** |
| Distinct media paths referenced in `src` | **32,610** |
| Referenced but **missing on disk** | **8,748 (27%)** |

**There is essentially no old media to clean up.** The problem is the reverse: a quarter of all media
references point at nothing. Concentrated in `guided-reading/audio` (1,264), `media/vocabulary` (913),
`audio/child-mode` (866 — the retired human scheme, decision 8), `guided-reading/nonfiction` (460),
`media/initial-sounds` (349).

**Correction to the previous audit.** Assessment images are essentially all present — **1** missing path,
not 6,441. The *"Total exact missing images: 6441"* figure in
`docs/validation/all_skills_strict_production_audit.md` counts expected-but-unauthored asset keys, not
broken paths, and it is being read as the latter. Finding H5 in
`docs/ADVERSARIAL_AUDIT_2026-07-31.md` should be tempered accordingly — the wrong-image problem is real,
the missing-image problem is largely not.

One shipped placeholder worth deleting: `/images/assessment/does-not-exist-a3-10.webp`.

---

# PART 3 — The paperwork

## 3.1 The entry point is the problem

`docs/INDEX.md` is what `CLAUDE.md` and `AGENTS.md` order every agent to enter through. It:

- **does not mention `docs/skills-assessment-rebuild/` anywhere** — the nine documents that govern the live
  question bank are unreachable from it by any link path (62 of 548 files are unreachable; 11 of them are
  the newest governing paperwork);
- still points at `implementation/roadmap.md` as *"meant to stay current"*, a file naming *Echo Caves
  (Short-A)* as the current world (zero hits in `src/`) and citing two source-of-truth documents that do
  not exist;
- reports 465 files (actual **548**), 251 release rows (actual **269**), 151 discovered items (actual
  **169**) — so **18 known defects are invisible to anyone who reads only the index**;
- still repeats the retired fixed-canvas rule at `:150`.

## 3.2 The six dangerous documents

These present themselves as rules and describe a product that no longer exists.

| File | The problem |
|---|---|
| `docs/IMPROVEMENT_LOOPS.md` | Header: *"NON-NEGOTIABLE FUNDAMENTALS… override anything a loop asks for."* Three are now false (TTS ban, media-request location, UK locale). |
| `docs/implementation/roadmap.md` | Index says it stays current. Names a world that doesn't exist; cites two missing files. |
| `docs/INDEX.md` | See above. |
| `docs/STATUS_OPEN_ITEMS.md` | *"Media: ALL DELIVERED AND LIVE"* / *"No outstanding media requests."* Also uses "Literacy Pals", a name the brand decision forbids. |
| `docs/release/MEDIA_BOARD.md` | *"Release status: CLEAR"* with zeroes for missing media. The most dangerous single line in `docs/release/`. |
| `docs/architecture/teacher_assessment_ux_review_v1.md` | Indexed as the standard for the assessment module; still defines a "Mastered" token that `MASTERY_SYSTEM.md:194` retired; cites two missing files. |

## 3.3 Rival plans — the pattern to fix

Four areas have two or more documents each presenting itself as *the* plan:

- **Assessment rebuild — three rival release standards.** `TEN_OUT_OF_TEN_PLAN` (07-23) vs
  `skills-assessment-rebuild/PLAN.md` (07-30) vs `EL_ALIGNED_BENCHMARK_SUITE` (07-21). **The newer plan
  wins on paper; the older one wins in CI.** Decision 7 resolves this in the older plan's favour on
  quotas — so amend `PLAN.md:106` and keep `TEN_OUT_OF_TEN` as the release standard of record.
- **Media production — five rival queues**, two of which call themselves FINAL, one of which
  (`docs/assets/README.md`, June) still calls a superseded file "the active source of truth".
- **Teacher area — the index's supersession chain stops one generation short**, so an agent following the
  index's own rule acts on the 07-27 remediation instead of the 07-28 v2 plan.
- **Kids side — the plan and the ship pass from the same day disagree about stage geometry.** The code
  agrees with the ship pass (fluid width); the plan's fixed 1194×834 rule is now explicitly *"a defect"*
  under `CHILD_SURFACE_RULES.md` — and the index still propagates the retired version.

## 3.4 The artifacts mirror — delete it

`docs/release/artifacts/**/repo/docs/**` holds 48 markdown files. 47 have a live twin elsewhere in
`docs/`; **only 4 are byte-identical — 43 are older, differing copies.** A grep for a document name returns
two versions with different findings and no date in the path to distinguish them. All 51 files under
`artifacts/` are unreachable from any index. This directory exists only to be found first by grep.

## 3.5 The delete / archive / rewrite list

**DELETE (11).** `docs/release/artifacts/**/repo/**` (48 files — the whole mirror) ·
`…/external/Users/benjaminbowler/Desktop/LiteracyPath_Strict_Audit_For_ChatGPT.md` (duplicate, embeds a
personal path) · `docs/assets/README.md` (contradicts its own folder's INDEX; points at two missing files) ·
`docs/assets/kimi_master_replacement_queue.md` (June "source of truth", superseded twice) ·
`docs/KIMI_FINAL_MEDIA_RUN.md` ("one batch closes everything" — false) · `docs/product-polish-roadmap.md` ·
`docs/MARKET_READINESS.md` · `docs/STATUS_OPEN_ITEMS.md` ·
`docs/kimi-requests/` (one stray file) · `docs/implementation/generated_docs_churn_plan.md` ·
`docs/release/artifacts/{bundle-size,first-load-network}.md`.

**ARCHIVE (8)** — move to `docs/archive/` with a one-line "closed" banner.
`KIDS_REDESIGN_PLAN_2026-07-29.md` (its own supersede clause fired the same day) ·
`validation/assessment_rebuild_gate.md` (superseded 2h later) · `VOICE_UNIFICATION_PLAN.md` ·
`instructional/LiteracyPath_Phonics_Question_Model_Framework_v1.md` · `DEPLOYMENT_AUDIT_2026-07-04.md` ·
`CODEX_PROMPT_home_restructure_and_audio_2026-07-06.md` (carries an unexpiring content freeze) ·
`COMIC_REDESIGN_CODEX_PROMPT_2026-07-07.md` (its "do not edit" list contradicts the current design
system) · `archive/PROJECT_STATUS.md` (already archived but still worded as live instruction).

**REWRITE (8).** `INDEX.md` (**the priority**) · `IMPROVEMENT_LOOPS.md` (decisions 6 and 8) ·
`implementation/roadmap.md` · `release/MEDIA_BOARD.md` (regenerate) ·
`architecture/teacher_assessment_ux_review_v1.md` · `EL_ALIGNED_BENCHMARK_ASSESSMENT_SUITE_2026-07-21.md`
(split; distinguish EL Education's cycles 1–75 from LiteracyPath's 27) ·
`SYNCED_GUIDED_READING_SPEC_2026-07-27.md:3` (one word: 8 children → 6, matching its own §8.1 and the
implementation plan's DB constraint) · `skills-assessment-rebuild/PLAN.md` (amend `:106` per decision 7;
delete `:5` *"Nothing in this plan has been implemented"* — 2,518 items were live when it was written).

**Net: 548 → ~490 files, and the top-20 most-read documents stop contradicting each other.**

## 3.6 Obsolete constraints in the paperwork

Rules written for a world that has passed, still findable by grep:

- `PLAN.md:52` — Phase 0 required registering the rebuild docs in `INDEX.md`. **Never done**; phases 3–8
  shipped anyway. That single skipped step is why the governing paperwork is invisible.
- `PLAN.md:67` — "Wire into `check:release`". `check:audit:assessment-rebuild` exists in `package.json`
  but appears nowhere in `tools/releaseGate.mjs`.
- `TEN_OUT_OF_TEN_PLAN:14` — items may be `WAIVED` only with a row in `docs/release/WAIVERS.md`. **That
  table is empty**, yet `CURRICULUM_BOARD.md` carries per-skill exclusions with review dates. Exclusions
  are functioning as unrecorded waivers.
- `CODEX_PROMPT_…_2026-07-06.md:9` — *"Content is frozen. Do NOT change any curriculum text, words,
  sounds, sentences, cycle data."* Task closed 2026-07-06; the freeze has no expiry.
- `OPUS_PRESENT_OVERHAUL_2026-07-09.md:6` — "Do not touch Codex's arcade WIP." No such WIP exists.
- `docs/release/EXTERNAL.md` — the manual audit calendar's first target date is **2026-08-03, in three
  days**, "Unconfirmed", with no human owner recorded. The one obsolete-constraint entry that is a live
  deadline rather than a dead one.

---

# PART 4 — Suggested order of work

1. **Remove `G7_human_signoff` from `hardGateKeys`** and regenerate `assessmentRebuildStatus.generated.js`
   so it stops containing a hand-typed value. Until this lands, `build:v3-banks` is a product regression.
2. **Two-minute misdirection fixes:** rename `runtimeQuestionSources` → `legacyV2QuestionSources`; delete
   the 60 dead numbers in `masteryRules`. Largest reduction in "someone reads this and changes the wrong
   thing" per unit of effort.
3. **Rewrite `docs/INDEX.md`** to link `docs/skills-assessment-rebuild/`, correct the counts, and drop the
   retired geometry line. Everything downstream depends on the entry point being true.
4. **Apply decisions 3, 4, 5** (round length, HFW format, one Secure) — these change what children and
   teachers see, so they should land together and be checked together.
5. **Locale pass** (decision 6) — mechanical, scriptable, plus ~100 hand-edited comprehension items.
6. **Delete the dead v2 apparatus** — legacy loader arms, the 102-module cluster, three generators out of
   `prebuild`, the 69 untested unreachable modules, the 73 orphan tools into `tools/legacy/`. Roughly
   **33 MB and ~1.1M lines** out of `src` without changing anything a child or teacher sees.
7. **Documentation cleanup** (decision 9).
8. **Then** start on the ~2,212-question authoring backlog that decision 7 commits you to.

---

# PART 5 — Still open

**Your outstanding request, not yet designed:** a data bank in the app showing teachers exactly what each
student got wrong and needs to practise. This is the natural partner to a 70% pass mark — passing at 70%
means roughly 30% of items were missed, and those specific items *are* the practice list. Worth building
as: per-item wrong-answer records (skill, item id, what they chose, what was correct, date) → surfaced in
the teacher report → drivable straight into a practice round. Say the word and I'll spec it.

**What I could not verify:**

- I did not run `npm run check:audit:assessment-rebuild` — it ran out of memory in the sandbox. The
  conclusion about the hand-edited status file is derived from reading the generator and comparing it
  against the artefacts it claims to have produced, plus file timestamps. Worth one command on your Mac:
  `npm run check:audit:assessment-rebuild; echo "exit=$?"`.
- No git history in the working copy, so I could not date when defects entered or attribute them.
- `mockups/` and `graphify-out/` were not staged, so I could not check the two prototype folders that the
  teacher and kids redesign plans both call binding specs.
- I have not verified that any proposed fix works. They are designs argued from source. Given what these
  two audits found about named checks, verify the check before you trust it.
