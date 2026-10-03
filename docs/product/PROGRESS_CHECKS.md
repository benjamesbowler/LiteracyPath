# Adaptive progress checks

The Progress check is a separate, descriptive literacy instrument. A teacher
opens it from Assessments for one learner or assigns it through Student Sessions.
It is not a MAP, RIT, percentile, calibrated growth or placement score. The
existing Skills phase rule and EL placement remain unchanged.

## Current questions and routing

The authoring sources are `tools/assessmentRebuild/authoring/progress/`.
`node tools/assessmentRebuild/buildProgressBank.mjs --write` publishes the bank at
`src/content/assessments/v3/progressBank.generated.js`; edit the authoring files,
never the generated bank. The generator validates keys, real-word spelling
competitors, exact recordings, source eligibility, family uniqueness and stock.

There are six separate tracks: initial-sound comparison, heard regular words
matched to print, heard common words matched to print, spoken synonym recognition,
heard literal details, and printed literal details. Each has three authored
ordinal tiers and 32 independent families per tier. These sample specific
recognition/detail constructs; they do not cover every aspect of their broader
literacy strand. Spoken words and listening passages require exact approved
recordings. Instructions, practice-button prompts, response acknowledgements and permitted
spoken choices use exact Leda recordings. Access clips resolve through
`progressCheckAudio.js` and the generated `progressCheckAudio.generated.js` map;
the frozen bank and archived item snapshots stay identical to the hosted bank.
Listening passages play before their question. Independent reading passages and
printed recognition options remain silent because speaking them would change
what the check measures.

After an independent correct response, that track moves up one tier; after an
independent incorrect response, it moves down one tier, bounded at tiers 0 and 2.
Supported, skipped, unanswered and media-failed presentations do not move the
tier or become wrong answers. First responses and their exact item snapshots are
frozen. Feedback during the check acknowledges receipt without teaching the key.
Failed required media removes all remaining items using that source in the run.

A broad profile requires at least four independent answers per track, up to eight
per track and 36 total, with at most 48 presentations. A focused check requires
10–16 independent answers from one track, with at most 24 presentations. Repeated
floor/ceiling or adjacent-boundary observations can end a track after its minimum;
contradictory lower failures and higher successes continue to the bounded cap.
Shortage, an early stop or insufficient independent evidence produces a partial
result. Two unscored shape tasks introduce the response buttons. Breaks and
backgrounding save the exact position without counting inactive time. One main
replay control restarts the sequence; small answer replays remain separate from
answer selection. The currently spoken choice is highlighted. Replay stays
usable during speech, and once required recordings have finished, repeating
them does not lock answers again.
Progress access generation trims provider pre-roll using sustained speech
signal while retaining 200 ms before that onset. The production speech guard rejects browser fallback,
including the former optional-access and unscored-warmup exception.

The automatic start uses a recent completed check with matching bank/difficulty
versions (within 90 days), otherwise the middle tier. A teacher can select a
different initial tier and records a reason. The frozen start, exposure exclusions,
seed, policy, routing decisions, warmups, pause events and response media delivery
are retained with the result.

All known learner item/family exposure is excluded before starting. Reused public
listening passages also exclude their known source families and recording paths;
ordinary isolated word recordings remain reusable across original contrasts.
Unknown familiarity is disclosed. Public passage reuse must never be described
as an unseen or secret stimulus. A frozen pool requires enough distinct families
in each tier for the entire plan before administration starts. Readiness tests
exercise two administrations and finite routing demand, not just item counts.

## Storage and assignment boundary

`20261002165900_progress_bank_manifest_part_one.sql` and
`20261002165910_progress_bank_manifest_part_two.sql` assemble the first two thirds
of the private authoritative bank. `20261002170000_adaptive_progress_checks.sql`
adds the final third, checks completeness and installs five scoped RPCs. This
split keeps each reviewed migration below the hosted request-size limit; no
administration RPC is exposed until the entire bank exists.

The bank and runtime migrations were applied to production project
`ajweixqzejjfvjehofnq` on 2 October 2026 with explicit authorization. All five
RPC signatures are visible to PostgREST and grants preserve the teacher/token
boundary. The hosted manifest matches the isolated PostgreSQL bank exactly
(`md5(manifest::text) = b72c8575baff3cfa8f6d6792bda6dfab`, 576 items).

- `teacher_start_progress_check_session(uuid, uuid[], jsonb, integer, text, boolean)`
  uses the existing active-roster, ownership, busy-device and expiry rules.
- `teacher_get_progress_run(uuid, uuid)` / `teacher_save_progress_run(jsonb, jsonb)`
  require the current teacher to own the active learner.
- `student_get_progress_run(text, uuid)` /
  `student_save_progress_run(text, uuid, jsonb, jsonb)` use the opaque child token
  and an active, unexpired assignment for that learner.

Assignment configs contain only `plan_kind`, `track_id`, and `bank_version`.
Drafts use `student_progress` area `progress_check`, key `run:<attemptId>`, so the
existing learner reset, export, deletion and retention boundary applies.
The server expands compact frozen pool IDs from the published manifest and
checks exact snapshots, authoritative keys, required recording delivery,
one-step adaptive routing, fresh families, immutable metadata and append-only
response history. Progress checkpoints bypass cumulative max/OR merging because
their tier may legitimately decrease. Conflicting device prefixes cannot
silently replace saved answers. Every answer and audio checkpoint is saved on
the device before the UI advances. A learner-scoped background queue coalesces
pending uploads without changing their immutable answer prefixes; temporary
network/statement timeouts retry automatically and never disable a locally
saved answer. The UI distinguishes a device draft from a positive cloud receipt.
Terminal attempts are uploaded before preparing another check; retry keeps the
terminal snapshot byte-for-byte identical. Device revisions preserve later
local audio/pause checkpoints on resume when their histories extend the server
copy. Conflicting pause histories still fail closed.
An existing learner-scoped device draft can resume if loading the service copy
temporarily fails. A new check still requires service history/exposure checks;
authorization denials are never treated as an offline fallback. If device
storage is unavailable, advancing requires a positive server receipt instead.
A validated service draft can still open when device caching is full; the
learner-reset guard remains enforced. Storage fallback and immediate retries
use the same scoped queue so the notice reflects its actual server receipt.

`20261003023000_progress_check_save_performance.sql` indexes the authoritative
bank and pool once per validation/save call and indexes history exposure keys
before checking the pool. All existing snapshot, required-audio, ownership,
append-only history, freshness and immutable-terminal checks remain. It changes
no grants or timeout limits. This forward migration is tested locally; hosted
application is pending explicit authorization.

Completed and partial attempts enter the existing immutable `assessment_attempts`
archive with `accuracy: null`, `passed: false`, level/phase zero, and no item-mastery
awards. Ordinary assessment accuracy remains required. Terminal attempts and raw
replay envelopes are immutable and an identical retry is idempotent. Reports and
Excel show each sampled track and its tier evidence, supported/unscored counts
and limits, separate from ordinary assessment accuracy and placement reporting.

The manifest is generated by `node tools/generateProgressSqlManifest.mjs` and
checked with `--check`. Regenerate this forward migration only while it is
unapplied; later bank changes need a new forward migration. A web deployment
does not apply SQL. Apply the reviewed migration only with explicit authorization
for the hosted project, then verify RPC grants and schema state.

## Verification

`progressBank.test.js` covers stock, provenance, exact required recordings,
reserved/source exclusions and repeated-administration readiness.
`progressTest.test.js` covers routing, media states, report isolation and durable
device storage. `progressRunSync.test.js` covers slow uploads, coalescing, timeout
retry, exact local resume, learner disposal and complete Leda cue resolution. `progressTestSql.test.js` executes the real forward migration and
existing immutable-archive/forward-merge behavior in an isolated PostgreSQL
fixture: ownership, ACLs, token/assignment expiry, tampering, completed/partial
archives, null accuracy, replay, repeated exposure and deletion of drafts.
`tests/release/progress-check.spec.js` exercises rendered teacher, child and
assignment flows. Browser emulation and signal checks do not establish physical
iPad operation, human listening, classroom outcomes or calibrated growth.

The [design proposal](../design/ADAPTIVE_PROGRESS_TEST_PLAN.md) retains future
calibration and pilot work; this document owns the current implemented behavior.

Generate missing access clips with `node tools/generateAssessmentLedaGaps.mjs
--progress-check-only --concurrency=4`. This writes the dedicated access map and
retains the current frozen bank version. `check:assessment-audio-audibility`
includes progress cues; `--progress-check-only` isolates that family.
