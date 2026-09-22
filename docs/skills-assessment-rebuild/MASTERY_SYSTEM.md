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
3. `tools/assessmentRebuild/authoring/*.mjs` — the only assessment question authoring
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
  across the last administered sitting in the same learner, skill, level, phase
  and mode. This includes an abandoned plan, persisted separately from scored
  evidence. Older questions may rotate back after a fresh sitting; the 90-day
  grading window is not a ban on all question reuse for 90 days.
- Each level and phase must contain enough genuinely distinct eligible content
  for two full sittings at its existing blueprint length: an initial sitting
  and a fresh retry. Retention-only reserves do not count toward either sitting.
  New IDs or token-swapped copies do not increase this stock. The gate composes
  both sittings and checks their full lengths and distinct evidence; a perfect
  first-pass simulation alone cannot establish retry readiness.
- Retention also has a fresh retry: sixteen independent reserved questions
  support two full eight-item checks. Ordinary forms do not borrow this stock.
- A media failure is unscored and replaced; it cannot become an incorrect
  literacy answer.
- Answer positions are shuffled deterministically at the render boundary.
- Lock and score the response before any feedback. Ordinary assessment feedback follows Question Design Bible §11: Correct/Not yet with one brief construct-linked reason and automatic progression. No extra coaching or answer changes may enter the scored response; explicitly supported responses remain excluded evidence.

## Publication gates

A skill is published only when the single v3 gate records all ten automated,
reproducible gates as passing:

| Gate | Meaning |
| --- | --- |
| G1 | Valid structure, blueprint coverage, and honest media requirements |
| G2 | Original questions without duplicate prompt/answer or option-set inflation |
| G3 | One valid key, plausible distractors, balanced key positions, and no answer leakage |
| G4 | Perfect-path reachability, deterministic scanner resistance, and correct regression behavior under the shared policy |
| G5 | Enough distinct content for the pass and retention path, including full initial and fresh retry sittings in every level/phase and retention, without repeated scoring evidence or short sittings |
| G6 | Runtime progression and reports use the same status reducer |
| G7 | Construct validity and clear prompts, without ambiguous keys or copying shortcuts |
| G8 | Required media proves the intended construct without revealing the key through duplicated art |
| G9 | Required instruction, target, passage and choice audio is available in the correct roles |
| G10 | Images and item media decisions satisfy the current visual policy |

The gate does not contain an owner name, a personal approval flag, a human
sign-off requirement, or a random-trial success threshold. Quality is enforced
by reproducible rules and tests.

## Media rule

Media is attached only when the current authoring source explicitly requests
it or an exact current registry resolves it. The system must never guess an
image from a prompt word or silently attach a legacy mapping. Required media
fails closed.

The evidence contract determines the modality. Printed grammar, affix and
spelling contrasts may remain text when pictures would replace the required
word analysis or reveal the answer. Reading/comprehension items may use their
supplied passage as evidence. Heard phonics contrasts, including spoken rhyme,
may use audio when print or a substitute picture would change the measured
skill. These cases require an explicit item media decision and a readable or
audible stimulus that fully supports the task; they are not a general exemption
from art quality or missing-media checks. The exact conditions are in
[Question Design Bible §9](../content/QUESTION_DESIGN_BIBLE.md#9-media-and-accessibility-rules).
Picture matching, visual detail, pictured sequence and spatial-relation items
still require their exact image evidence. Decorative art never satisfies that
requirement, and rejected art cannot be bypassed by changing a modality label.

Instruction, target, passage and choice audio remain separate. Only explicitly
authored `audioText` or `targetWord` may supply a target replay; the scoring
answer is never a fallback stimulus. Image-only scenes without a spoken target
suppress target replay while keeping the task instruction replayable.

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
