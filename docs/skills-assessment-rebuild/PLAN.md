# Skills Assessment Rebuild — Master Plan (2026-07-29)

**What this is.** The complete, phased plan to take all 30 Skills assessments to 10/10 on **logic, mastery, questions, and answers** — a new evidence/mastery system that is fair, tough, and cleanly reportable; a fully re-authored question bank with zero template clones and zero false distractors; and a no-repeat guarantee across retakes. Media (recorded audio, new images) is explicitly out of scope for this plan and lands in a later phase; every spec here is written so the media pass bolts on without rewriting content.

**Who executes it.** Opus, in ordered sessions, one phase/wave at a time, under the repo Operating Manual (named green checks before "done"; answer→reasoning→risk; no irreversible step without the gate). Nothing in this plan has been implemented — the repo is unchanged as of this writing except for the addition of these six documents.

**The documents.**

| File | Role |
| --- | --- |
| `PLAN.md` (this file) | Phases, waves, gates, migration, effort, risks |
| `MASTERY_SYSTEM.md` | The new evidence/mastery/selection/reporting spec (Phase 1–2 source of truth) |
| `AUTHORING_STANDARDS.md` | Item schema v3, originality/correctness/distractor law, lints, review loop |
| `BLUEPRINTS_PHONOLOGICAL.md` · `BLUEPRINTS_PHONICS.md` · `BLUEPRINTS_HFW.md` · `BLUEPRINTS_LANGUAGE.md` · `BLUEPRINTS_COMPREHENSION.md` | Per-skill construct, units, formats, counts, distractor recipes, exemplars for all 30 skills |

---

## 1. Ground truth this plan stands on (verified 2026-07-29)

Method: reconstructed the exact published bank in a sandbox — loaded every runtime bank source in loader order, joined against `assessmentReleaseExposure.generated.js` — **4,990/4,990 published questions resolved, 0 missing**, per-skill counts matching the external audit exactly. Then re-derived the audit's key claims against that bank and the live code. All of the following is **observed**, not inherited from the audit:

1. **Mastery is sticky and unreachable at once.** `nextItemMasteryRow` (roundController ~1051): `mastered = previous?.mastered || (attempts≥4 && correct≥3 && lastCorrect && sessions≥2 && eligibility)`; `isMasteryEligible` (questionFormatFramework:223) needs ≥2 formats + phonics-specific exposure the published bank cannot supply: 0/45 rhyming units, 0 HFW keys in any band, 0/20 long-vowel keys, 0 comprehension keys can ever qualify — while legacy `mastered` flags never expire, even after failed retakes.
2. **HFW keys are per-question** (`the_HFWQ-0001`…): 147–149 keys per band, 0 of 25 configured words matched.
3. **Template inflation is real and worse than it looks.** Name-stripped skeleton clustering of published passages: Main Idea 92→**2** clusters (48+44), Context Clues 92→9, Inference 92→11, Sequencing/Cause-Effect/Theme 92→12 each; Inference L2 story 1 is L1 story 1 with swapped tokens (verbatim evidence in AUTHORING_STANDARDS §8). Key Details is the exception: 93→93 (keep it).
4. **Single-format walls.** Rhyming: 656 items, one format, printed-rime giveaway, audio suppressed, 222 duplicate prompt+answer groups. Prefixes/Suffixes: 92 items, one template.
5. **Broken content shipping today.** 30 "a adjective" prompts; 19 "Choose the precise word means…" prompts; `boxs/boxies/staries`-class fake distractors (11 items); Digraphs L1 prompts that name their own answer; vowel-team items published inside Long Vowels & Silent E by config design.
6. **Repeat memory is 3 rounds deep** (`ROUND_LENGTH * 3`), and the reuse ladder recycles seen items long before genuinely fresh content is exhausted — because clones make "fresh" ids non-fresh content.
7. **Round thresholds are uncalibrated design guesses** (masterySystem.js), and `docs/research/CALIBRATION_PROTOCOL.md` already says so honestly.
8. **Reporting is split-brain** (roster vs student report compute different numbers; "Mastered" with no evidence floor) — per verified project memory `teacher_reporting.md`.

Also verified as **good and kept**: fail-closed media evidence, answer-before-progress, choice shuffling, in-round diversity budgets, immutable attempts, `learningPolicy` 85/70/50 single-source thresholds, the EL benchmark's parallel-form precedent, Key Details bank, R-Controlled/SVD bank logic.

## 2. Definition of 10/10 (per skill — the exit bar)

A skill is done when ALL of:

1. **G1 Structure** — bank matches its blueprint: units, cells, forms A/B/C(+R) disjoint and complete; schema v3 valid (`L-SCHEMA`, `L-FORM`, `L-COVER`).
2. **G2 Originality** — zero template clones: skeleton similarity, option-set uniqueness, cross-level clone check all green (`L-UNIQ-*`).
3. **G3 Answer integrity** — one defensible key per item; every distractor real, plausible, rationale-coded; lexicon-verified mappings (`L-REALWORD`, `L-LEX`, `L-CLOZE-FIT`, `L-GRAM`, `L-DIST-*`).
4. **G4 Mastery logic** — SIM-PASS (four phases are reachable in four perfect sittings), SIM-GUESS (<0.1% across the full 10,000-trial run under the 70% phase rule), SIM-SCANNER (<5%), SIM-REGRESS (statuses drop on contradiction) all green against the real bank.
5. **G5 No repeats** — SIM-NOREPEAT green: 4 sittings + retention, zero repeated ids/signatures/option-sets/passages.
6. **G6 One report** — roster, class report, student report, exports all derive the skill's status from `skillStatusPolicy` (unit test + grep gate; "Mastered" absent product-wide).
7. **Question Design Policy** — runtime items pass the research-backed, cross-surface policy gate; optional review evidence may be recorded but is not a publication requirement.
8. **G8 Honest release** — the aggregate gate (`check:audit:assessment-rebuild`) exits non-zero on ANY unmet item above; skill flips to bank v3 only when it exits 0.

## 3. Phases

Dependency shape: Phase 0 → 1 → 2 unlock everything; waves 3–8 are content and can interleave; 9–10 close.

### Phase 0 — Freeze & baseline (½ session)
1. Branch `assessment-rebuild`. Snapshot current `assessmentReleaseExposure.generated.js` + release status into `docs/skills-assessment-rebuild/baseline/` (records, never edited).
2. Register these docs in `docs/INDEX.md` under Standards (this plan is the successor to the assessment portions of TEN_OUT_OF_TEN_PLAN; mark supersessions per the index's rules).
3. No behavior changes. Gate: repo checks all green pre-work (know your baseline; any pre-existing red is named now, not inherited later).

### Phase 1 — Engine: schema, blueprints-as-data, status policy, sittings (2–3 sessions)
1. `src/content/blueprints/` — one data module per skill encoding its blueprint (units, cells, formats, family, sitting size, form sizes, exemptions like digraph wh/ph, nonGating units). The five blueprint docs are the source; the data files are what code and gates read.
2. Item schema v3 validator + `check:bank-lints` runner (all `L-*` lints from AUTHORING_STANDARDS §1–4; skeleton-similarity, option-set, cloze-fit, lexicon, grammar lints).
3. `src/policy/skillStatusPolicy.js` — pure reducer: `computeUnitStates` / `computeSkillStatus` per MASTERY_SYSTEM §3 + §6, with `whyNot` blockers. Unit-tested exhaustively (this file is the product's new brain; test it like money).
4. Sitting engine: up-front composition, forms rotation, full-ledger no-repeat exclusion (21-day floor), response states (`skipped`/`not_administered`/`supported`/`media_failed`), Skip button + final-answer Undo, formal-mode neutral feedback (teaching tips → guided mode only).
5. Retention checks (form R, ≥3 days, 8 items ≥7) wired as a sitting variant `mode: "retention"`.
6. Ledger fields (`bank_standard_version`, `form`, `response_state`, `mode`) added append-only; Supabase migration file + `check:live-database` extension (remember: the hosted DB lags migration files — verify against live per project memory `verification_gaps.md`).
Gate: engine unit tests + SIM harness runs against the OLD bank (expected: old bank fails G2–G5 — that failing proof is the Phase 2 fixture).

### Phase 2 — Gates & simulators (1–2 sessions)
1. Implement the five simulations (MASTERY_SYSTEM §9) + SIM-SCANNER leak oracle (AUTHORING_STANDARDS §6).
2. `check:audit:assessment-rebuild` aggregator: per-skill G1–G8 matrix; **non-zero exit on any published-skill blocker** (fixes the current audit's exit-0 lie); records git commit + bank version; "not run" ≠ "pass" in output.
3. Wire into `check:release`. Add the human-review-pack generator (AUTHORING_STANDARDS §7).
Gate: aggregator correctly fails all 30 skills on the old bank; passes a hand-built 3-item fixture skill.

### Phases 3–8 — Authoring waves (the bulk)

Order = damage first. Per wave, per skill, the loop is AUTHORING_STANDARDS §5 (author in ~8-item chunks → lint → simulation → review evidence → policy gate → flip skill to v3). Old bank stays live per skill until its v3 passes every hard gate — per-skill cutover, no big bang, the app is never without a working assessment.

| Wave | Skills | New items (≈) | Sessions (≈) | Notes |
| --- | --- | --- | --- | --- |
| W1 | Long Vowels & Silent E (withdraw first), Main Idea, Inference | 80 + 64 + 64 | 3–4 | The three worst construct faults. Long Vowels' current bank release-flag OFF at wave start (the one pre-cutover removal — shipping known-wrong content beats no content only when content is right). |
| W2 | Cause & Effect, Context Clues, Theme, Sequencing, Sentence Comprehension | 5 × 64 | 5–6 | Theme at half chunk-cadence (hardest writing). Topic registry shared across family. |
| W3 | Rhyming (+ label-suppression renderer flag), Blends, Prefixes/Suffixes, Antonyms/Synonyms | 167 + 104 + 90 + 72 | 4–5 | Four rebuilds; Rhyming carries the SIM-SCANNER strategy-1 special gate. |
| W4 | HFW ×4 bands (+ key migration script, dry-run) | 564 | 4–5 | Mechanical volume; mine `hfwCuratedSentences` as raw material only. Key migration applies at W4 cutover after Ben reviews the dry-run report. |
| W5 | Nouns, Verbs, Adjectives, Prepositions, Plurals, Homophones | ~440 | 4–5 | Prune-and-rebuild; big salvage pools in Homophones cloze + Nouns L1. |
| W6 | Key Details (retag/trim), Initial Sounds, Final Sounds, CVC, SVD, Digraphs, Vowel Teams, R-Controlled | ~500 (heavy salvage) | 4–5 | The healthy banks: re-tag, prune duplicates, top up formats to blueprint, re-lint everything as if new. |

New bank ≈ **2,400–2,500 items replacing 4,990** — half the size and all real. (Counts per skill: blueprint files, "Bank" sections.)

### Phase 9 — Migration & reporting cutover (1–2 sessions)
1. Run ledger migrations (HFW merge; comprehension legacy→history; sticky flags dropped) — dry-run report → Ben approves → apply (MASTERY_SYSTEM §8).
2. Route every surface through `skillStatusPolicy`; delete or reduce `reportingSystem.js` raw-accuracy paths; one status vocabulary; provisional copy everywhere (`check:app-copy` extended: bans "Mastered", bans unqualified "diagnostic/validated").
3. Teacher comms: the one-time recalculation banner + a short "what changed" page in Resources.
Gate: same-child-same-numbers test across roster/class report/student report/export (the split-brain killer), plus full check suite.

### Phase 10 — Close (1 session)
1. Delete dead config (masterySystem.js round table, per-question HFW eligibility tables, retired generators — `generateSkillLevelGapQuestions.js` and the templateExpansion pipeline are archived under `tools/legacy/` with a README saying why they must never run again).
2. `docs/INDEX.md` updates (standards edited in place; audit-era records marked superseded). Release scorecard run. Baseline-vs-final diff report saved as a record.
3. Hand Ben the calibration on-ramp: the frozen v3 bank satisfies CALIBRATION_PROTOCOL "frozen materials" precondition — external pilot is the (separate, later) path to dropping "provisional".

**Total effort ≈ 25–32 focused sessions.** Media pass (recorded audio for phonological tiers, Rhyming replay UX, image QA) is a separate later plan; every blueprint marks its `audio-required` slots so that plan is a fill-in, not a redesign.

## 4. Standing decisions (made now, so waves don't relitigate)

1. Evidence units are construct-shaped (words/patterns/sounds/concepts/cells), never per-question. No exceptions.
2. Forms are disjoint by construction; the no-repeat property is proven by simulation every release, not assumed.
3. Mastery is never sticky; recency always wins; skips never count against accuracy; supported answers never count toward mastery.
4. Formal assessment never teaches mid-sitting. Guided practice is a separate, clearly-labelled mode.
5. Level 2 = harder thinking, provably (author note names the demand; cross-level clone lint).
6. Every threshold that is a guess is labelled provisional until the calibration pilot; no surface says "validated", "diagnosis", or "Mastered".
7. Quantity never gates: no "46 per level" quotas anywhere in code or gates; blueprints define counts from construct arithmetic (units × attempts × forms).
8. A lint is never weakened to ship an item. Standards changes go through Ben.

## 5. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Authoring fatigue → quality sag mid-wave (the failure mode that created this mess) | 8-item chunks, lint-per-chunk, sims per form, two-pass review on comprehension, waves sized ≤6 sessions |
| Statuses drop after migration and surprise teachers | Dry-run diff Ben reviews; one-time banner; history preserved visibly |
| Engine lands but waves stall → two systems alive | Per-skill cutover flag; aggregator reports v2/v3 mix honestly; roster badge "updated standard" per migrated skill |
| Sitting budgets feel long in classrooms (HFW/Initial Sounds: 5/level) | Explicit tuning knob (MASTERY_SYSTEM §11.1) — Ben decides with the tradeoff stated, not silently |
| Supabase drift (hosted DB lags migrations) | Every schema change verified via `check:live-database` against live before its wave ships (verification_gaps.md rule) |
| Device-VM git fragility during long waves | Work from session clones; sweep `*.lock` before every git op; push per repo policy (AGENTS.md) |

## 6. Session-zero checklist for Opus (read this, then start Phase 0)

1. Read the six docs in the table above, then `docs/instructional/instructional_standards.md`, `MASTERY_SYSTEM.md` §1 against the live code (re-derive at least one claim — trust nothing you didn't see).
2. Confirm baseline checks green; snapshot exposure files.
3. Announce in the session log which phase/wave this session owns and which G-gates it will turn green.
4. End every session with: gates turned green (named), gates still red (named), exact next step — and push or surface unpushed work per repo policy.
