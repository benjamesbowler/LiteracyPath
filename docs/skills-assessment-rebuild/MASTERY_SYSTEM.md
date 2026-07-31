# Skills Assessment Mastery System v3 — full specification

**Standard.** Written 2026-07-29 from a first-hand code and bank inspection (see PLAN.md §1 for what was verified). This document defines the replacement evidence, mastery, selection, and reporting system for the 30 Skills assessments. It is the single source of truth for Phase 1–2 of the rebuild. When a blueprint file and this document disagree, this document wins on mechanics; the blueprint wins on content.

Design goals, in order: **honest → tough → fair → simple to report**. Every rule below exists to serve one of those and is annotated with which.

> **Progression decision, 2026-07-30.** Every skill has Level 1 Phase 1,
> Level 1 Phase 2, Level 2 Phase 1, and Level 2 Phase 2. A phase passes at
> **70%**; a lower result repeats that phase. Passing L1P2 unlocks the next
> skill and offers optional Level 2 for greater challenge/reward. Level 1 is
> kindergarten/entry-ESL; Level 2 is a clear Grade 1 extension. This decision
> supersedes the older 85% level-progression wording below. Unit evidence and
> retention still support reporting, review flags, and the optional `Secure`
> status, but may not trap a low-ESL learner in one skill.

---

## 1. What is wrong with the current system (verified, condensed)

Observed directly in code and data on 2026-07-29:

- `nextItemMasteryRow` (assessmentRoundController.js ~1051): `mastered = previous?.mastered || (attempts>=4 && correct>=3 && isCorrect && sessionsSeen>=2 && eligibility.eligible)`. Mastery is **sticky forever** — a failed retake can never remove it.
- `isMasteryEligible` (questionFormatFramework.js:223) demands ≥2 formats plus phonics-specific format exposure — but the published bank cannot supply those formats for most units. Re-derived against the real published bank: 0/45 rhyming units, 0/147..149 HFW keys, 0/20 long-vowel keys, 0 for all eight comprehension skills can ever satisfy it. Mastery is structurally unreachable while simultaneously being sticky when legacy rows exist.
- HFW item keys are per-question (`the_HFWQ-0001` … 147 keys for 147 questions), so the 25-word coverage contract matches 0 published keys.
- Stage advancement (`getNextAssessmentPathStep` + `isConfiguredLevelCoverageComplete`) requires **every** configured item key to be `mastered` — combining an unreachable per-unit rule with an all-units gate.
- Repeat control: in-round dedupe is strong (assessmentRoundSelector.js diversity budgets), but cross-sitting memory (`getRecentStageRepeatMemory`) only spans `ROUND_LENGTH * 3` answers, and the reuse ladder falls back to previously-seen items long before the bank is exhausted — because the bank is full of same-content clones under different ids (222 duplicate prompt+answer groups in Rhyming alone), "different question" often means "same question, new id".
- Round pass thresholds (masterySystem.js: 7/8, 8/10, 9/10, 10/12, 12/14) are design guesses, uncalibrated (docs/research/CALIBRATION_PROTOCOL.md is explicit about this), and a passed round is computed from a flat slice of the answer history, not from a designed sitting.
- Reporting: two parallel systems (roster/legacy `answers+mastery` vs student-report concept spine) with different numbers for the same child; "Mastered" label from one tap with no evidence floor (see project memory `teacher_reporting.md`).

The system below replaces all of that with one evidence model, one status function, and one vocabulary.

---

## 2. Core concepts and vocabulary

| Term | Definition |
| --- | --- |
| **Skill** | One of the 30 assessment skills (`skillTree` ids). Unchanged. |
| **Level** | 1 or 2 within a skill. Unchanged in shape; redefined in content by the blueprints (L2 must change *cognitive demand*, never just surface). |
| **Evidence unit** | The thing mastery is claimed about. Per-skill, defined in the blueprint: a sound, a rime family, a spelling pattern, a sight word, a grammar concept, a comprehension cell. NEVER an individual question. |
| **Item** | One authored question. Belongs to exactly one skill+level, tagged with the unit(s) it evidences, a form, a format, and distractor rationales. |
| **Form** | A disjoint subset of a level's items. Forms A/B/C are sitting forms; form R is the retention reserve. No item appears in two forms. |
| **Sitting** | One completed take of a level: a fixed-length, blueprint-driven set of items answered in one session. Replaces "round" as the scoring unit (the UI can keep calling it a round). |
| **Attempt ledger** | The append-only record of scored responses (existing `answers` + `assessment_attempts`, extended per §8). The only input to status computation. |
| **Session day** | A calendar day (learner timezone) with ≥1 scored response for the skill. "Two sessions" always means two distinct days. |

### 2.1 Response states (fair)

Every presented item resolves to exactly one of:

| State | Counts in accuracy denominator? | Counts as unit evidence? |
| --- | --- | --- |
| `correct` | yes | yes (positive) |
| `incorrect` | yes | yes (negative) |
| `skipped` (child or teacher taps Skip / no response) | **no** | no — unit stays uncovered |
| `not_administered` (teacher ends early / discontinue rule) | no | no |
| `media_failed` (existing fail-closed behavior) | no | no; item auto-replaced |
| `supported` (teacher marked "answered with help") | no | logged, shown in reports, never mastery evidence |

This is the fix for "forced guessing turns no-response into incorrect". The assessment screen must add Skip and a final-response Undo (one step back, before the sitting is submitted) — see PLAN.md Phase 1. Skips are visible in reports ("3 skipped") so they can't silently inflate accuracy.

### 2.2 Status vocabulary (simple to report — ONE ladder everywhere)

Per skill, exactly one of:

```
Not started → In progress → Level 1 passed → Level 2 passed → Secure
                     ↘ Needs review (regression flag, attaches to any passed/secure state)
```

- These six strings are the ONLY skill-status words on any surface: roster, Today, class report, student report, exports. The existing `learningPolicy` Secure/Developing/Intensive-support tiers remain for *accuracy banding inside a status card*, not as a competing skill status.
- Everything is labelled **provisional** until the CALIBRATION_PROTOCOL pilot signs off: report copy says "Current evidence suggests…", never "diagnosed", never "validated". This is a hard copy rule enforced by `check:app-copy`.

---

## 3. Unit mastery rules (honest + tough)

Two rule families, chosen per skill in its blueprint. Both share the invariants:

- Only `correct`/`incorrect` responses from formal (unsupported) assessment count.
- Evidence is evaluated over the trailing **90 days** (aligns with the student-report spine window). Older evidence decays to "history", visible but not status-bearing.
- **Recency wins — mastery is never sticky.** The reducer is pure: `unitState = f(all attempts in window)`, recomputed on every read. There is no stored `mastered` boolean that survives contradicting evidence.

### 3.1 Family D — discrete units (phonological, phonics, HFW, grammar, vocabulary)

A unit is **Passed** when, within the window:

| Parameter | Large-inventory skill (>10 units/level) | Small-inventory skill (≤10 units/level) |
| --- | --- | --- |
| Correct responses on the unit | ≥ 2 | ≥ 3 |
| Distinct items among them | ≥ 2 | ≥ 2 |
| Distinct session days | ≥ 2 | ≥ 2 |
| Distinct formats | ≥ 1 in the shipped tier; ≥ 2 once the skill's tier-2 formats exist (§7) | same |
| Most recent response on the unit | correct | correct |

A unit is in **Review** when its most recent response is incorrect (regardless of history). Otherwise it is **Working** (some evidence) or **Not seen**.

Rationale: 3-correct/2-items/2-days is the toughest rule the bank can honestly support at small inventories (a form covers each unit once, so three sittings = three distinct items — reachability proven in §9). The old rule's "≥4 attempts" rewarded being shown a unit often, not knowing it; attempts-as-exposure is gone.

### 3.2 Family C — distributed cells (the 8 comprehension skills; Antonyms/Synonyms L2 contexts)

Units are **blueprint cells** (e.g., `fiction × explicit-detail`, `informational × main-idea`). A cell is **Passed** when: ≥2 correct on ≥2 distinct passages across ≥2 session days, most recent correct. One passage can never evidence more than one response per cell (and passages are single-use per child — §5 guarantees this).

### 3.3 Phase and level progression

- Each phase is a fixed 10-question sitting and passes at **7/10 (70%)**.
- Below 70% repeats the same phase with fresh items from its bank.
- Passing Phase 1 opens Phase 2.
- Passing L1P2 records `Level 1 passed`, unlocks the next skill, and offers
  optional L2P1. The learner chooses; Level 2 never blocks access to later
  skills.
- Passing L2P2 records `Level 2 passed` and earns the higher challenge reward.
- Unit/cell evidence remains visible to teachers and still drives
  `Needs review`; it does not override a completed phase to create an access
  wall.

Because two 70% phases can be attempted more than once, blind-guess progression
has a tiny non-zero probability. SIM-GUESS therefore measures a rate instead of
requiring an impossible absolute zero: the full 10,000-trial release run must
stay below **0.1%**.

### 3.4 Skill Secure (tough + honest)

**Secure** = Level 1 Passed AND Level 2 Passed AND a **retention check** passed:

- Scheduled no sooner than **3 days** after Level 2 pass.
- 8 items from form R (never seen in sittings), sampled to cover the child's historically weakest units first, mixed L1/L2 weighted 3:5.
- Pass ≥ 7/8. Fail → skill drops to `Level 2 passed · Needs review`, and the next retention check needs a fresh 8 R-form items (form R is sized for 2 full retention attempts).

### 3.5 Regression and retakes (honest)

- Any later sitting on a passed level scoring < 80%, or any 2+ units falling into Review, attaches **Needs review** to the skill and lists the review units. Status recomputation is automatic because the reducer is pure — this is the structural fix for "previous mastery remains set after a failed retake".
- A retake is just another sitting: same selection rules, form rotation continues (§5). There is no special retake scoring path to get wrong.

---

## 4. Sitting design (replaces free-running rounds)

| Skill family | Sitting length | Sittings to Level-pass (perfect responder) |
| --- | --- | --- |
| All 30 skills | 10 | 2 (Phase 1 + Phase 2) |

- A sitting is **composed before it starts** (whole set selected up-front, then shuffled) — composition can therefore guarantee unit coverage and zero internal repeats, instead of the current per-question greedy pick with relaxation ladders.
- Mid-sitting media failure swaps in a same-unit, same-form spare without scoring (existing fail-closed behavior preserved).
- A sitting abandoned before ≥ 80% of items are answered records its responses as `not_administered` beyond the answered prefix and does NOT count as a "most recent sitting" for §3.3(3).
- **Formal mode shows no correct answers, no explanations, no teaching tips mid-sitting** (neutral "Saved. Next one!" acknowledgement). The current AppPages behavior (correct answer + Teaching Tip after a wrong answer) moves to a separate Guided practice mode whose responses are stored with `mode: "guided"` and never feed unit mastery. This is the formal/teaching split the audit demanded.

---

## 5. Selection, forms, and the no-repeat guarantee

### 5.1 Form rotation

Each level's bank is authored as **forms A, B, C (each a complete blueprint coverage of every unit/cell, disjoint by item, by passage, and by option-set) plus form R (retention reserve, 2×8 items, also disjoint)**.

- Sitting N draws from form (N-1) mod 3 — first take A, first retake B, then C.
- Large-inventory levels (units > sitting length): a form is larger than one sitting; the form is consumed across consecutive sittings with unit-coverage-first ordering (least-evidenced units first), so "form A" = sittings 1..k, "form B" = sittings k+1..2k, etc.
- After A, B, C are exhausted (≥3 full coverage passes — more takes than any real assessment cycle needs), selection re-opens the least-recently-seen form with a hard floor of **21 days** since that item was last shown. This floor is a constant in the policy module, not scattered.

### 5.2 No-repeat guarantee (the property, not the mechanism)

For any child and any level: **within any 3 consecutive sittings plus one retention check, no item id, no prompt+answer signature, and no option-set signature appears twice.** This must hold by construction (disjoint forms) and is enforced twice:

1. Author-time: lint `L-FORM` proves forms are disjoint on id, prompt+answer signature, option-set signature, and (comprehension) passage skeleton.
2. Runtime: keep `questionRepeatGuards` signatures as a belt-and-braces filter, but replace the short `ROUND_LENGTH * 3` memory with the **full per-student ledger** (already persisted in `answers`/`assessment_attempts`; the exclusion set is ids+signatures seen in the last 21 days, which is small).
3. Release-time: simulation `SIM-NOREPEAT` (§9) runs 4 sittings + retention against the real published bank and fails the gate on any repeat.

The current relaxation ladder (`selectAssessmentRoundCandidate`'s ranked duplicate concessions) survives only as a final emergency fallback and must emit a telemetry warning when used — under correctly sized banks it should never fire; a fired fallback is a bank bug.

### 5.3 Within-sitting composition rules

- Unit coverage first: fill each not-yet-passed unit before repeating any unit (Family D) / one item per cell then rotate (Family C).
- Existing diversity caps stay (≤35% one format, ≤35% one option-set) and become trivially satisfiable because the blueprints mandate format mixes.
- Correct-answer positions are balanced per sitting (each position key ≥1, ≤2 more than any other — the existing shuffle plus a post-check).

---

## 6. Reporting contract (simple to report — one function, one table)

New module `src/policy/skillStatusPolicy.js` (Phase 1) exporting:

```js
computeUnitStates(ledger, blueprint)   // Map<unitKey, {state, correct, attempts, items, days, lastResult, lastSeen}>
computeSkillStatus(ledger, blueprint)  // {status, level1, level2, secure, needsReview: [...unitKeys],
                                       //  evidence: {sittings, scored, skipped, supported, accuracy, days, lastSitting}}
```

Rules:

- **Every surface** — roster, Today, class dashboard, class report, student report, printed/CSV exports — calls these and only these. The legacy pair (`reportingSystem.js` raw all-time accuracy vs `reportingEvidenceModel` spine) both route through this module or are deleted. Same child, same numbers, every door. (Closes the two systemic faults recorded in project memory `teacher_reporting.md` — no-evidence "Mastered" and roster≠report.)
- The status line always shows its evidence: `Level 1 passed · 3 sittings · 21/21 families · last 29 Jul`. A status with hidden evidence is banned by copy check.
- `whyNot(status)` must return a concrete blocker list for every non-Secure state (reuses the §3 blocker reasons verbatim) — teachers see *why* a child hasn't advanced, not just that they haven't.
- Supported answers and skips render as their own counts, never folded into accuracy.
- The word **Mastered is retired** from all surfaces (grep-gated). "Secure (provisional)" is the ceiling until calibration closes.

### 6.1 Database / ledger changes (§8 has migration)

- `item_mastery` stops storing a load-bearing `mastered` boolean. It becomes a derived cache table (or is dropped in favor of computing from `answers`): if kept for performance, rows carry `unit_state`, `computed_at`, `policy_version` and are rebuilt by the reducer, never incremented ad hoc.
- Attempt records gain: `bank_standard_version` (3), `form`, `item_ids` (already largely present), `response_state` (§2.1 enum), `mode` (`formal` | `guided` | `retention`).
- All writes remain append-only per the immutable-evidence standard (`check:immutable-assessment-evidence` still green).

---

## 7. Media tiers (bare-bones now, audio later — honest labelling in between)

Every item carries `mediaTier`:

- `text` — fully valid with no media (this rebuild ships every skill's text tier complete).
- `image-optional` — image enriches but never carries the answer (lint: prompt+choices must be answerable with images stripped).
- `audio-required` / `image-required` — the construct needs the media (e.g., true phonological rhyming, listen-and-spell). These items are **specified in the blueprints now, authored as text stubs with media slots, and excluded from runtime until the media phase**.

Per-skill honesty rule: while a phonological skill (Rhyming, Initial/Final Sounds, SVD, CVC listening formats) is running on text/image tier only, its status card carries the qualifier **"print-pattern evidence"** and the format-count requirement in §3.1 stays at the shipped-tier value. When the audio tier ships, the requirement steps up to 2 formats including one auditory — statuses recompute and may drop; that is correct and is communicated as a standards upgrade, not a bug. No mastery language ever claims listening evidence that was never collected. (This resolves the audit's Rhyming construct-validity blocker within the bare-bones scope: the L1 bank is rebuilt now to be audio-first-ready — no printed rime giveaway in choices — and simply runs with images+text until recording lands.)

---

## 8. Migration from the current data (fair to children's history)

1. **HFW keys**: map `the_HFWQ-0001 … ` → `sight_word::the` by splitting on the final `_HFWQ-` token (mechanical, verified possible for all 588 published HFW items). Merge legacy `item_mastery` rows by summed attempts/correct; recompute unit states under §3 (most will land Working — correct, since the old evidence was single-format cloze).
2. **Phonics/phonological/grammar keys** already use unit-shaped keys (`at`, `sh`, `short_a`…) — ledger rows survive as-is; unit states recompute under the new reducer.
3. **Comprehension + per-question keys** (92 story keys per skill): no honest mapping to the new cells exists. Legacy attempts remain in the ledger as history (visible in the student report timeline) but do not seed cell states. Every child starts comprehension cells at Not seen under the new standard.
4. **Sticky mastered flags**: dropped everywhere; statuses recompute from the ledger. Teacher-facing one-time banner: "Skill statuses were recalculated under the stricter 2026-08 evidence standard — some children show earlier stages than before; their answer history is unchanged."
5. Migration is a one-shot script with a dry-run report (counts per skill: statuses before/after) that Ben reviews before apply; the raw tables are never mutated, only derived caches.

---

## 9. Simulation gates (the proof, run per skill before publish)

All five run in CI against the **actual published bank + actual policy module** (no fixtures), as `check:mastery-simulation`:

| Sim | Actor | Must hold |
| --- | --- | --- |
| SIM-PASS | Perfect responder, 1 sitting/day | Reaches Level 1 passed and Level 2 passed within the blueprint's declared sitting budget (Family D large: ≤5/level; small: ≤3; HFW: ≤5; comprehension: ≤3), and Secure after retention. Fails if any unit is starved (bank gap). |
| SIM-GUESS | Uniform random over 4 choices | P(level pass) < 1e-6 across 10,000 trials; zero trials reach Secure. |
| SIM-SCANNER | Answers correctly only when a leak oracle finds the key without the construct (option shares printed rime/pattern chunk with target; prompt names the pattern; only one option is grammatical in the cloze; longest-option heuristic) | Level pass rate < 5%. This is the automated check that distractors don't leak — the oracle's heuristics are listed in AUTHORING_STANDARDS §6. |
| SIM-NOREPEAT | Perfect responder, 4 sittings + retention | Zero repeated item ids, prompt+answer signatures, option-set signatures, or (comprehension) passage skeletons. |
| SIM-REGRESS | Passes level, then fails a retake sitting (30% accuracy) | Status becomes `… · Needs review` immediately; a subsequent clean sitting restores it. Retention fail drops Secure. |

Reachability arithmetic (derived 2026-07-29, to be re-verified by SIM-PASS against real banks): 25-unit levels at 2 attempts/unit, sitting 10 → 5 sittings; 8-unit levels at 3 attempts → 3; 6-unit at 3 (2 formats) → 2; HFW 25 words × 2 at sitting 12 → 5; comprehension 16 scored at sitting 8 → 2. Guess probabilities: P(≥9/10)=3.0e-05, P(≥7/8)=3.8e-04, P(≥14/16)=2.6e-07.

---

## 10. What deliberately does NOT change

- The 30-skill list, the two-level shape, and the child-facing flow (pick skill → answer → checkpoint) — teachers' mental model survives.
- Fail-closed media evidence, answer-before-progress, choice shuffling, immutable attempt records — all verified good and kept.
- `learningPolicy` 85/70/50 accuracy bands — reused as the accuracy floor numbers in §3.3 so the app keeps one threshold source (`check:learning-policy` stays authoritative).
- Round thresholds in `masterySystem.js` become dead config once sittings land and are deleted in Phase 10 cleanup, not silently left as a second brain.

---

## 11. Open questions Ben must decide (each has a default; none blocks Phases 0–2)

1. **Sitting budget for HFW/Initial Sounds (5 per level)** — accept, or relax large-inventory unit rule to "2 correct, may be same day" (drops to 3 sittings, weakens the two-day guarantee)? Default: keep 5; they're 4-minute sittings designed for daily use.
2. **Retention window** — 3 days default; 7 days is more rigorous but slows Secure badly at classroom pace. Default: 3.
3. **Legacy comprehension history** shown in the new report timeline as "previous standard" rows — show or hide? Default: show, labelled.
