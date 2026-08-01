# Skills assessment system v3

**Current standard.** This file describes the assessment system that is wired
into the app now. It is not a migration plan or a record of older designs.

## Authority

The executable sources are authoritative:

1. `src/content/blueprints/skillBlueprints.js` — the 30 skills, their units,
   formats, sitting lengths, phase membership, and the shared pass/retention
   constants.
2. `src/policy/skillStatusPolicy.js` — the only assessment skill-status
   reducer.
3. `src/data/v3/authoring/*.mjs` — the only assessment question authoring
   sources.
4. `tools/assessmentRebuild/gate.mjs` — the only assessment publication gate.
5. `src/content/assessments/v3/assessmentRebuildStatus.generated.js` and
   `src/data/v3/banks/*.v3.generated.js` — generated outputs; never hand-edit.

If prose and executable behavior disagree, fix the prose or the executable
source together. Do not create another rules table.

## One progression rule

Every level has Phase 1 and Phase 2. Each phase is one complete sitting using
the length in that skill's blueprint.

- A completed phase passes at **70%** (`PHASE_PASS_RULE.accuracyMin`).
- A lower score repeats that phase with fresh eligible questions.
- Passing Phase 1 opens Phase 2.
- Passing Level 1 Phase 2 records `Level 1 passed`, unlocks the next skill, and
  offers the optional Level 2 extension.
- Passing Level 2 Phase 2 records `Level 2 passed`.
- Level 2 never blocks access to later skills.

There is no per-skill pass-score table, no separate 80%, 85%, 88%, or 90%
progression rule, and no sampled blind-guess pass-rate gate. Runtime,
reporting, tests, and publication all import the shared rule.

## Status vocabulary

Assessment skill status is derived from the immutable attempt ledger:

`Not started → In progress → Level 1 passed → Level 2 passed → Secure`

`Needs review` is a regression flag attached to a passed status; it is not a
second status ladder. The reducer recomputes status from evidence, so an old
stored `mastered` flag cannot override newer results.

App progression, class reporting, and student reporting must consume
`computeSkillStatus`. Accuracy bands used for other product summaries are not
allowed to replace assessment skill status.

## Evidence units

Questions are evidence about a blueprint unit, never mastery records in their
own right. The current unit rules live in each blueprint:

- Discrete small inventory: 3 correct responses, at least 2 different items,
  2 days, required format coverage, and latest response correct.
- Discrete large inventory: 2 correct responses, at least 2 different items,
  2 days, required format coverage, and latest response correct.
- Comprehension cell: 2 correct responses on 2 different passages across 2
  days, with the latest response correct.

Unit evidence supports teacher detail and regression review. It does not add a
second progression threshold or trap a learner after they pass a phase.

Only unsupported formal assessment responses count. `skipped`,
`not_administered`, `media_failed`, and teacher-supported responses are saved
for reporting but do not count as correct or incorrect mastery evidence.

Evidence inside the current 90-day window can affect status. Older attempts
remain history without silently becoming current evidence.

## Secure and retention

`Secure` requires Level 1 passed, Level 2 passed, and the current retention
rule from `RETENTION_RULE`:

- wait at least 3 days after the Level 2 pass;
- administer 8 retention items;
- pass with at least 7 correct.

A failed eligible retention check returns the skill to `Level 2 passed` with a
review flag. These constants have one source in `skillBlueprints.js`.

## Selection and repeat safety

- The complete sitting is composed before it begins.
- Selection uses the published v3 bank for that skill and level only.
- Items, prompt/answer signatures, and option-set signatures are kept distinct
  across the protected selection window.
- A media failure is unscored and replaced; it cannot become an incorrect
  literacy answer.
- Answer positions are shuffled deterministically at the render boundary.
- Formal assessment does not reveal the answer or teach between scored items.

## Publication gates

A skill is published only when the single v3 gate records all six automated,
reproducible gates as passing:

| Gate | Meaning |
| --- | --- |
| G1 | Valid structure, blueprint coverage, and honest media requirements |
| G2 | Original questions without duplicate prompt/answer or option-set inflation |
| G3 | One valid key, plausible distractors, balanced key positions, and no answer leakage |
| G4 | Perfect-path reachability, deterministic scanner resistance, and correct regression behavior under the shared policy |
| G5 | Enough distinct content to complete the pass and retention path without repeats or short sittings |
| G6 | Runtime progression and reports use the same status reducer |

The gate does not contain an owner name, a personal approval flag, a human
sign-off requirement, or a random-trial success threshold. Quality is enforced
by reproducible rules and tests.

## Media rule

Media is attached only when the current authoring source explicitly requests
it or an exact current registry resolves it. The system must never guess an
image from a prompt word or silently attach a legacy mapping. Text-valid items
remain text items. Required media fails closed.

## Rules that are permanently retired

Do not restore any of the following:

- v1/v2 assessment banks, fallback loaders, candidate pools, runtime shards,
  exposure manifests, or parallel release boards;
- personal or owner-specific approval/sign-off fields;
- per-skill pass-score tables or separate roster/report mastery vocabularies;
- sampled blind-guess pass-rate gates;
- sticky stored mastery as a source of truth;
- per-question HFW evidence keys or migration logic;
- guessed image mappings, placeholder media, or legacy audio-path rewrites;
- generated status files edited by hand;
- dated plans or audits used as executable policy.
