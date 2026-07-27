# Immutable assessment evidence

Plan item: **A7.8**

An assessment result is a historical record, not a live view of the current
question bank. Completed evidence must remain explainable after an assessment
form, item, curriculum, or scoring policy changes.

## Stored provenance

Every normalized assessment result carries five independent versions:

| Field | Meaning |
|---|---|
| Attempt schema | Shape of the normalized assessment result. |
| Evidence schema | Shape of the immutable replay envelope. |
| Assessment version | Assessment/form definition used for the administration. |
| Content version | Authored content release, or a deterministic fingerprint of the exact administered item definitions when no release was declared. Learner responses never alter this identity. |
| Policy version | Scoring, routing, or mastery policy used for the recorded decision. |

Adaptive checkpoints also save the exact round length, pass score, stage,
level, and phase used at administration time. EL benchmark results retain
their plan/form, content release, scoring rule, framework, administration
range, expected anchor, and scoring-suppression state.

## Raw evidence and replay

The database stores the normal queryable result payload and a separate replay
envelope containing:

- evidence schema and capture time;
- attempt ID;
- assessment, content, and policy versions;
- the complete stored result, including item prompts, targets, responses,
  response states, scoring evidence, observations, and policy snapshot.

The envelope must exactly match the relational attempt, versions, completion
time, and stored payload. A malformed or detached envelope is rejected.
Reports replay the archived result directly; they do not look up a prompt,
answer, threshold, or route from the current deployment.

Completed, discontinued, not-administered, and not-scorable evidence is
append-only by attempt ID. A later administration must use a new attempt ID.
Partial/in-progress evidence may become terminal, at which point its full
result and provenance are frozen. Deletion remains available through the
owned privacy/erasure path.

## Compatibility and migration

The migration backfills existing attempts without claiming a version that was
never recorded:

- declared payload versions are promoted into queryable columns;
- missing content releases receive a fingerprint of the stored item evidence;
- missing policy releases are explicitly labelled legacy-unspecified;
- the existing payload becomes the immutable replay result.

Older clients and the deterministic audit seed remain accepted. When they omit
the new columns, the database derives the same bounded envelope before
validation. It never substitutes current content or policy.

## Automated evidence

- `tests/unit/assessmentEvidenceReplay.test.js` renders an old learner report,
  changes current assessment content and policy, replays the archive, and
  proves the report model is identical.
- `tests/unit/assessmentHistoryRichPersistence.test.js` proves cloud writes
  carry queryable versions and a replay envelope identical to the payload.
- `tools/verifyAssessmentEvidenceArchive.mjs` proves the live migration,
  completed-result immutability, capture-time and provenance matching,
  cross-teacher isolation, and cleanup.
- `check:immutable-assessment-evidence` runs the replay, persistence, and live
  database contracts as one release gate.
