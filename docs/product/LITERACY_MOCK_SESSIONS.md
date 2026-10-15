# Adaptive Literacy Test — teacher-controlled sessions

Literacy Guide's mock sessions prepare Kindergarten–Grade 2 learners for the range
of literacy tasks and computer interactions found in public MAP Growth K–2
examples. They use original Literacy Guide questions, pictures and recordings.
Teachers receive descriptive evidence for instruction; the product does not
estimate RIT, percentile, grade equivalence, proficiency, or a MAP score.

The [Reporting Bible](../reporting/REPORTING_BIBLE.md),
[Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md),
[authoring standards](../skills-assessment-rebuild/AUTHORING_STANDARDS.md), and
[assessment media contract](../design/ASSESSMENT_MEDIA_EVIDENCE.md) govern this
surface. [The former literacy practice guide](MAP_PREPARATION.md) retains the
source and evidence contracts for historical learning and rehearsal records.

## Current area-adaptive route — 15 October 2026

New full tests use **v5** and `teacher_prepare_literacy_mock_session_v5`.
This section supersedes the earlier v3/v4 routing and current-level descriptions
below; those remain historical implementation and release evidence.

Every area begins at **Starter**, with a genuine **First steps** route below it.
The 43-question schedule visits areas in pairs, so the second observation can
respond immediately to the first answer in that area. Quotas are 5 sounds,
6 phonics, 5 print, 5 vocabulary, 6 listening, 5 language, 6 reading and 5 writing.
A fresh independent correct answer raises the next unseen observation in that
area by one authored demand band; an incorrect answer lowers it by one, bounded
by First steps and the area's maximum. Other areas retain their own state.
Supported, familiar, invalid and unscored observations do not change demand.
Shown questions and the answered prefix stay frozen. Future placeholders are
routed when they become that area's next observation, avoiding stale promotions.

The production-browser follow-up tightens phonics selection within the immutable
publication: Starter uses CVC targets and CVC choices; Early uses CVC construction.
Later phonics follows blends/digraphs, long vowels/r-controlled vowels, vowel
teams and transfer tasks. Frequency-list position does not establish increasing
difficulty, so those HFW lists no longer supply the higher route. Simple HFW
recognition remains at First steps, using an isolated spoken word and printed
choices; sentence blanks and contextual grammar are excluded from this fallback.
This selection rule changes no published
item, key, band or saved answer; reports still distinguish unsampled skills.

The policy in `src/policy/literacyMockAdaptivePolicy.js` defines the curriculum
route and schedule. Bands describe different task demands, rather than treating
all source Level 1 items as beginner work. Entry vocabulary uses familiar
pictured nouns, listening uses a short phrase, reading checks a first pictured
CVC word, and language uses pictured actions. Lower tasks use broad-category
picture discrimination, an isolated spoken word, distinct printed word initials,
and action-versus-object recognition. Print, sounds, phonics and writing have
separate authored entry and lower tasks. Higher routes retain the original range
of phonics, comprehension, language and writing constructs. These are curriculum
bands, not a calibrated item-response scale, mastery, RIT, age or grade estimates.
[NWEA's public adaptation explanation](https://www.nwea.org/the-map-suite/common-questions-families/)
informs the up/down behavior; it does not validate local difficulty calibration.

The v5 publication has **9,094** exact records: the 8,819 v4 sources plus 275
original entry/foundation items and three additional explicit skills (50 total).
Original items reuse exact existing recordings and reviewed images. Literal
semantic foils are authored; printed reading choices receive no target audio.
Quarantine stays a live selection/reporting overlay and cannot rewrite published
snapshots. Historical v1–v4 questions, keys, receipts and results stay immutable.

Five ambiguous new picture items are withdrawn through the shared quality
overlay; their original records and keys remain unchanged. Action words are
reserved for the language entry pool so other areas cannot consume its stock.

Offline packs reserve independent item, passage, family and stimulus identities
across areas and bands, within the existing 512-asset/48-MiB budget. A media repair
must retain the same task, access, source level and authored band; exhaustion
stops safely without a score. V5 device delivery sends at most twelve queued
requests per verified batch, retains later work locally, drains successive
receipts automatically, and acknowledges teacher collection only in the final
batch. Existing uncertain receipts retain their exact identity. The server
recomputes demand from canonical scored
responses and checks both plan changes and first-presentation receipts. Child
claims cannot raise difficulty or replace answered/shown questions.

Teacher v5 reports show eight separate areas, exact independent accuracy,
last sampled demand, band-specific observations, sampled skills and a next step.
They do not pool task demands into an overall working level. Helped, repeated,
unanswered, withdrawn and unsampled evidence retain their existing distinctions.
Legacy reports retain the original four-area/47-skill interpretation.

Generate/check the forward schema and immutable publication with
`node tools/generateLiteracyMockV5.mjs [--check]`. Apply
`20261015052954_literacy_mock_areas_v5.sql` before
`20261015053013_literacy_mock_catalogue_v5.sql`, followed by
`20261015054235_literacy_mock_delivery_projection.sql`,
`20261015054802_literacy_mock_incremental_validation.sql` and
`20261015060558_literacy_mock_picture_quarantine.sql`. Projection optimization
suppresses repeated report construction inside a batch; incremental validation
retains current quarantine/media checks and validates every changed identity
and next demand against immutable canonical records. Behavioral regressions are in
`literacyMockAreasV5.test.js`, `literacyMockAreasV5Sql.test.js` and
`literacy-mock-areas-v5.spec.js`; SQL tests can additionally replay a read-only
hosted function snapshot in the isolated fixture. Complete correct, incorrect,
reversal, alternating and uneven profiles are required; browser proof includes
reload, local retention, one-time delivery and individual/class teacher results.

## Product name — 14 October 2026

The user-facing name is **Adaptive Literacy Test**. MAP-style preparation is
explained in supporting copy; the product uses original Literacy Guide questions
and is not affiliated with or endorsed by NWEA. This name change preserves
existing routes, stored session identities and historical evidence. It does not
represent trademark clearance or official score equivalence.

## Single MAP route — 13 October 2026

The only new MAP assessment is the teacher-launched full 43-question mixed mock.
Prepare it for the whole class or selected children, then explicitly start it.
The teacher may pause/resume or finish; the break window pauses rather than
ending the test. The short/timed form and targeted follow-up preparation are no
longer offered. Historical sessions, receipts and retry recovery remain readable.

The standalone literacy practice/rehearsal launch and the generic student-session
literacy option are retired. An unassigned or legacy practice route explains that
the teacher starts the mock; it cannot create a new self-launched assessment.
Past practice records and exposure identities remain intact for historical reporting.
The learner sees one large labelled Next question / Finish test control, including
on phones, and no I don’t know action. Every accepted first response is saved by
the existing token-scoped service. The latest session opens on return; completed
learner runs show report received. Reports includes a direct Adaptive Literacy Test results link.

Each sitting excludes the child's recorded prior item, passage and family
exposures. The planner jointly reserves entry and harder examples across the
full form. If shared finite families prevent the preferred skill from fitting,
it selects another unused eligible skill in the same literacy area; it never
drops an area or treats a repeated question as new independent evidence.


## Research basis and limits

The official 2025 content chart identifies four Reading K–2 areas:
Foundational Skills; Language and Writing; Literature and Informational Text;
and Vocabulary Use and Functions. Language/writing therefore belongs in a
broad K–2 reading mock. The separate Language Usage test starts in Grade 2;
MAP Reading Fluency is a different product involving oral reading.
[Content chart, page 5](https://www.nwea.org/uploads/CCSS_2025.pdf),
[test types](https://teach.mapnwea.org/impl/maphelp/Content/AboutMAP/Summary_TestTypes.htm).

Public K–2 examples show picture selection, multiple selection, selecting a
word in text, matching/sorting, arranging words or sentences, and letter
construction. Their simple illustrated objects, uncluttered canvas and clear
response areas inform the mock's presentation. Public sample artwork,
passages, keys, recordings and branding are not copied into the bank.
[Public reference charts, pages 19–22](https://www.nwea.org/resource-center/brochure/46853/map-growth-rit-reference-charts-common-core-1.pdf),
[K–2 concept reference](https://teach.mapnwea.org/assist/help_map/Content/Data/RIT2ConceptK2.htm).

MAP Growth is untimed. Its published K–2 duration is commonly 25–40 minutes,
and the early-learner guidance recommends a break after about 20 minutes and
practice with the computer controls. The mock's timer is explicitly a
**classroom practice window** selected by the teacher. New v3/v4 sessions default
to `pause_at_window_end`: the selected window triggers a break, not a terminal result.
The teacher can resume or finish. New full mocks default to 40 minutes before a
break; the teacher can choose 10, 20 or 30 minutes. Historical `timed_sample`
sessions retain their original administration and results. All sessions
remain bounded by the parent focus-session expiry. A 43-question form is
a local preparation choice; public sources differ on whether their approximate
question count includes field-test items. Historical 24-question sessions remain
readable, but new preparation offers only the full form. Neither form reproduces
NWEA's calibrated adaptive algorithm.
[2025 technical report](https://www.nwea.org/uploads/MAP-Growth-Technical-Report-2025.pdf),
[early-learner guidance](https://teach.mapnwea.org/assist/help_map/Content/Testing/EarlyLearning.htm).

No authoritative public specification was found for exact current domain
weights, format frequencies, universal passage word counts, or every current
test-screen detail. Official practice tests demonstrate interactions; they
are brief, fixed and unscored. These limits prevent claims of operational
equivalence. [Practice-test guidance](https://connection.nwea.org/articles/Knowledge/Practice-tests-for-MAP-Growth).

## Coverage and question contracts

The canonical loader is `src/data/literacyMockBank.js`. New sessions use v4,
with 8,819 authored records, including 11 tutorial-only examples, across six
response formats and 47 skills in eight local areas. All required media must
resolve before a record enters the ready bank. Tutorial stimulus aliases are
also excluded from scoring. The v4 builder applies source-authored corrections
to the prior content and adds 1,270 original paired examples; it does not rewrite
published history. V1 (3,958 records), v2 (3,976), and v3 (7,549) load their exact
immutable published snapshots. Existing sessions and their saved responses
retain those versions.

Five of the tutorial-only items teach the response mechanics. Six additional
letter-layout examples remain excluded from scored plans; scored letter-case
items instead use explicit individual letter targets.

| Broad research area | Local areas | Examples of measured skills |
|---|---|---|
| Foundational skills | Sound awareness, phonics, print/books | Rhyme, blending/manipulation, phoneme position, decoding, spelling construction, letter forms, print navigation |
| Language and writing | Grammar/language, writing/conventions | Word classes, agreement, tense, capitalization, punctuation, sentence order, organization, purpose and revision |
| Literature and informational text | Listening, independent reading | Details, sequence, inference, main idea/evidence, text features, author purpose, literary craft |
| Vocabulary | Vocabulary/word structure | Meaning, categories, synonyms/antonyms, context, morphology and reference use |

The normalizer preserves each source's actual response contract. In particular,
the 315 native HFW and sound-order constructions become tile tasks rather than
single-choice questions. The complete target remains audit/audio data; it is
never printed as a model during a scored spelling task. HFW sentence spelling
uses the sentence containing the blank, never the completed `sentenceText`.

Choice keys are stable IDs. Multiple-selection answers use exact set equality;
word/sentence ordering and matching use an exact sequence of choice IDs.
Spelling construction submits the composed word so repeated identical letter
tiles remain interchangeable. Selectable text retains token order, case and
punctuation. Hosted scoring derives correctness from the private canonical
item, not a learner-supplied key or item snapshot.

Audio is authored by role: instruction, spoken target, phoneme sequence,
passage and choice. Spoken sound/rhyme comparisons hide written word labels.
Printed recognition choices are not narrated where reading is the construct.
Independent-reading passages and choices stay silent; directions remain
replayable. Entry writing-purpose, organization and meaning-focused revision
use explicit oral-language access: printed context and alternatives are also
read aloud. Their `oralLanguageAccess` / `evidenceModality` metadata records
this condition. Spelling, punctuation, capitalization and independent reading
do not gain answer-revealing narration. Literal sentence retrieval may use the
actual words in the sentence; inference and paraphrase tasks keep their own
lexical-demand rules. Listening-only passages stay hidden. Build tiles remain visible
because selecting letters is the required response.

Exact canonical Leda files and existing approved source pictures are reused.
The original rhyme and spelling tasks use 23 object illustrations in one
consistent flat style on white, delivered as whole cells from a
1536-by-1024 atlas. Delivery encoding uses WebP at the original dimensions,
without cropping or changing the composition. The original PNG hash, delivery
WebP hash, grid and object-to-cell mapping accompany their canonical snapshots.
The [original generation prompt and provenance](../../source-art/assessment/literacy-mock/provenance.json)
retain the exact art request, original source location and delivery-only transform.
The current expansion also uses 28 standalone spatial scenes and 164 active
standalone foundation illustrations, with saved independent model visual
reviews at full and 240-pixel sizes. The foundation registry
`src/data/literacyMockFoundationMedia.js` binds approval to exact delivered
bytes; the active artwork manifest is derived from normalized item references.
The retired hem illustration remains recoverable in review provenance and is
not an active asset. Its replacement reuses the existing bell picture.
Missing required audio keeps an item out of the ready bank. Every required cue must
complete before a scored response is accepted. A failed required image or
recording is recorded separately as a media failure. It does not record an
answer or attempt, consume a question, or advance progress.

`replaceFailedLiteracyMockMedia(bank, plan, responses, mediaFailures)` repairs
the entire unanswered suffix and returns `{ plan, unavailable }`. Failure
records contain the failed `questionId` and `failedMediaPaths`. Both that item
and every item sharing a failed audio/image base URL remain excluded for the
run; atlas cell fragments are removed when comparing source URLs. Answered
and presented items remain frozen unless that presentation has failed media.
Replacements keep the same skill, domain, exact construct, access modality and planned
level, preserve the 24/43-question count and seed, and retain the distinct-item,
distinct-stimulus and tutorial exclusions. A failure is never evidence for
changing difficulty.

The planner publishes a repair only when every affected slot has a safe
replacement. If it cannot fill the whole form, `unavailable: true` preserves
the original plan and the learner receives an availability message. The
assessment cannot skip that question or turn it into a text-only guess.
`adaptLiteracyMockPlan` accepts the same failures as its fourth argument so
later difficulty changes cannot reintroduce a failed item or source. Failure
exclusions reset with a new session.

## Teacher and learner flow

The teacher selects the full class or named learners for the full 43-question
mock, with an optional 10-, 20-, 30- or 40-minute break window. Session controls start, pause,
resume or finish the session. Readiness, connection information and saved
progress remain visible. Existing sessions can be reopened from class history
and filtered to a learner. Identity and roster access follow the existing
teacher-controlled Student Sessions boundary.

Before dispatch, the teacher panel durably retains the exact preparation,
control or evidence-action request, scoped to the teacher and class. Reloading
recovers its original retry; it does not automatically perform the action.
Competing mutations stay blocked until that request receives a verified result
or rejection. If retry details cannot be persisted, no new action is sent.

Preparing any mock creates an inactive assignment. It preserves every current
classroom session and learner membership. The teacher explicitly starts it
before learners connect; if another teacher-owned assignment is still active,
Start reports that conflict and keeps both assignments unchanged. Finishing or
expiry releases only that assignment's memberships.

Learners confirm sound access and complete the five unscored response-format
examples before a new mixed sitting. A 1–6-question follow-up checks sound again,
but practices only mechanics required by that check that the same learner has
not successfully used in an unscored tutorial within the last 24 hours on that
browser session. The record is learner-scoped, expires, and clears with learner
drafts. A fresh browser or expired record requires the relevant practice again. The examples demonstrate multiple selection,
matching, ordering, selectable text and spelling tiles. A modeled answer and
a child's practice attempt teach the interaction; neither becomes assessment
evidence. Tutorial IDs are exported as `LITERACY_MOCK_TUTORIAL_IDS` and carry
`tutorialOnly` in canonical metadata. An optional “Practice the buttons”
reminder returns to a separate unscored example of the current mechanic. It
never demonstrates the scored answer. Multiple selection displays the required
count and selected count. Construction displays one space per authored tile
(including multi-letter tiles), requires all spaces before Next and allows
placed tiles to be removed.

Scored items provide neutral continuation. Teachers receive the explanations
and evidence; the assessment does not teach a missed answer or change a saved
first response. Replaying prescribed audio is access. A child’s help request
alerts the teacher and can be cancelled while unresolved; it does not claim
assistance was delivered. The teacher records no assistance, access assistance
only, or answer assistance. Pending requests are excluded from independent
progression until resolved. Answer assistance remains supported even if a later
entry records access-only help. Late resolution changes the effective evidence
classification, never the saved first answer. Teachers can record or correct
assistance directly from any saved response or presentation, including
unsolicited assistance and corrections after the sitting ends. A previous child
help request is not required. Questions shown without answers
and questions not reached remain distinct and unscored.

`src/utils/literacyMockPlanner.js` creates deterministic learner plans. A class
starts with a shared domain and skill-selection seed, while learner seeds vary
the actual examples and choice order. When earlier exposure exhausts an exact
task or skill, the learner receives another available skill within that area;
reports show the actual sampled skills. Prior known items, passages and families
are excluded from new mixed plans, adaptive substitutions and media repair.
Server-returned exposure stays in memory even if browser storage is unavailable.
New v3/v4 assignments enforce the same freshness rules on the server; existing
assignments retain their original selection contract. `src/policy/literacyMockBlueprint.js` declares local content
allocations, not NWEA weights. The opening order is sound awareness, phonics,
print, vocabulary, listening, language, reading and writing; sound/phonics
open with entry-friendly skills. The first fresh follow-up occurs at question
9, then new skills alternate with earlier follow-ups. A third same-task sample
can confirm performance or return to entry after a harder error. The historical
24-question form sampled eight skills with three opportunities each; the 43-question form
samples 15 skills with three opportunities for the first 14 and one final sample.
Both retain all eight local areas. This trades within-sitting skill breadth for
an actual entry–follow-up–confirmation sequence; all 47 skills remain available
across full sittings. Historical targeted checks retain their original contracts.
Format variety is a tie-break within a valid content choice, not a skill quota.
Canonical items, passages, families and stimulus keys do not repeat within a
plan. Allocation handles crossing identity constraints; media repair has a
bounded search and preserves the original form if no complete safe allocation
can be established.

Plans begin at the entry difficulty. After independent success, a future item
in that same skill, exact construct and access modality may move to the harder
local level; independent difficulty returns compatible future samples to entry
level. The planner never substitutes a different task merely because it shares
a broad skill label. If late assistance removes the supporting success, v3/v4
returns an unoffered harder slot to entry level; presented items remain frozen. Supported or invalid
or known-familiar responses do not raise difficulty. Routing and reporting
use the same independent-response eligibility predicate. Only unoffered slots
may adapt, and the server checks skill/domain/construct/access continuity,
difficulty, presentation receipts and the committed prefix.
Local levels are ordinal task bands, not calibrated MAP difficulty. A fixed
operation without a defensible higher demand carries an explicit ceiling and
next-task guidance. A different font, longer noun or additional distractor does
not create a higher level. Such tasks collect comparable fresh observations;
they do not silently switch construct to imply adaptive progress.

## V4 adaptive demand and capacity

### Content withdrawal and recovery — 13 October 2026

`src/policy/literacyItemEligibility.js` is the shared selection and evidence
policy for known defective items. Twenty exact sound-only spelling questions
are withdrawn because their alternatives permit another conventional spelling
of the same recording without meaning-bearing context. Their immutable source
snapshots and saved raw responses remain intact. The SQL counterpart has an
exact-ID parity regression; new plans, fresh capacity, presentations and answers
exclude those items across all published versions.

A saved unanswered withdrawn slot receives a fresh compatible question at the
same task, access and level. The server's `contentQuarantineRepair` capability
permits this narrow exception to the presented-slot freeze. A client connected
to an older server pauses safely with saved answers retained. An already
submitted response appears as `content_invalid`, with no correct/incorrect
score, distractor diagnosis, adaptive success, strength or teaching-group claim.
Report receipts and retry identity stay unchanged; this is a content correction,
not evidence that the child made a mistake or that media failed.

All 47 skills and 155 task/access ladders remain selectable, with 4,006 eligible
adaptive items after withdrawal. The 8,819-record v4 publication is unchanged.
The forward migration `20261013053259_literacy_mock_content_quarantine.sql`
is applied to Literacy Guide. Hosted readback verified unchanged catalogue and
raw-response fingerprints, private helper permissions, token rejection and the
content-repair capability. Isolated PostgreSQL and browser fixtures exercise
complete recovery; they do not certify a new real-child hosted sitting.

### Adaptive selection

V4 mixed plans select only canonical `adaptiveMixedEligible` items. Each exact
skill, construct and access group must have a joint allocation of three entry
and three harder examples with independent item, passage, family and stimulus
identities. All 47 skills have a selectable ladder; fixed predecessor tasks
remain available only in historical publications. A Level 2 label by itself
does not grant eligibility. Targeted entry/fresh checks and media replacements
use the same canonical eligibility rule. The server rejects ineligible v4
mixed-plan items even if a browser sends a forged flag.

The three-sample blueprint jointly reserves entry examples and possible harder
follow-ups. Adaptation allocates the entire editable suffix together and
reserves opposite-level witnesses for future answer outcomes, including a
shown probe whose response is still pending. This prevents an early task from
consuming another task's only harder families. Answered, shown and failed
questions retain their identities; media repair preserves the failed slot's
planned level and protects future capacity.

The authored increase must change the literacy operation's demand while
retaining its construct and access. Examples include three- to four-phoneme
construction; close whole-word sound contrasts; silent-e and vowel-pattern
contrasts; one-edit or reversal high-frequency-word foils; a repeated word with
two true contextual senses; competing actors or time relations in inference;
partial summaries, two-episode themes and competing relevant passage details;
and separating two complete sentences when internal clause punctuation is
plausible. Source `taskDemand`, keys, distractor rationales and focused tests
record the actual distinction. Longer text, a font change, an extra choice, or
a renamed family cannot establish it. Authored ordinal levels still require
learner-response studies for empirical difficulty calibration.

New preparation retries persist the content version with their exact arguments.
Unversioned pending requests from the v3 client retry the original v3 RPC.
A malformed or absent receipt is uncertain and preserves the durable retry;
only an explicit server rejection clears it. Learner receipts must match the
assignment, learner, content version, revision and committed answer prefix and
contain the requested answer, media failure or event before the retry is cleared.

## Reporting and persistence

Teacher reports retain the exact question, response, expected response,
modality, local level, assistance and delivery evidence. Teachers see the
authored explanation and selected-alternative rationale as an item-level
hypothesis to verify, not a diagnosis. They show independent
correct observations, independent difficulty, supported responses, familiar
items, unscored cases and unsampled skills. Evidence sufficiency follows the
shared reporting policy. There is no overall cross-domain accuracy score or
student ranking.

A single recent error may create an unselected **review candidate**, not a
teaching group. Teaching-group eligibility uses the shared learning policy
(sample count, diversity, recency and confidence); groups require explicit
teacher selection and retain links to the actual independent evidence. Sparse
samples call for another fresh check, never a deficit or mastery claim. Reports
separate not offered from offered without an independent response and disclose
construct, access modality and administration. Durable presentation receipts
separate never-reached from seen-but-unanswered items. Historical sessions
without complete presentation tracking say “not recorded” rather than infer
that an unanswered question was unseen.
Question completion and skill coverage are separate in the teacher report:
all planned questions can be answered while other catalogue skills have no
recorded question in that sitting. The summary shows the actual count of skills
shown, and optional coverage details explain that the full 47-skill catalogue
is not a completion target. Unshown skills have no result, not a weakness;
shown skills without an independent answer remain a separate evidence category.
Listening and independent reading stay separate even when displayed beneath
one broad comprehension heading.

A teacher can prepare a 1–6-item fresh check from an actual response or
presentation. The server derives the same skill, domain, construct, level and
access conditions and excludes known items, passages and families from synced
practice and earlier mock exposure. The learner uses only the server-approved
candidates. Fresh checks do not adapt to a different level. If no valid fresh
example remains, no session is created and the teacher receives an explanation.
An untouched skill also offers a direct first-sample action: the server selects
fresh entry examples under one exact task and access condition. Selected review
candidates open their actual evidence and a usable follow-up action.

Visible follow-up actions obtain a count through the teacher-owned, read-only
`teacher_get_literacy_mock_fresh_capacity` RPC. It verifies the source session
and learner assignment, then applies the same exact-condition and exposure
rules as preparation. It creates no draft, reserves no items and returns no
candidate IDs or answer keys. The result includes its check time and the
available 1–6-question check size. A first-sample preview selects one entry task;
it never combines unlike constructs to inflate the count.

Capacity counts mutually independent candidates, including item, passage,
family and stimulus conflicts. Small pools are solved exhaustively. A larger
pool reports `exact` only when its selected set reaches a proved upper bound;
otherwise `lower_bound` is displayed as “At least N”. Counts describe recorded
exposure, not proof of all a learner's prior experience. Exact zero disables
preparation and directs the teacher to comparable evidence outside the bank.
A failed count request is shown as unavailable, never as zero. Teachers can
refresh the count, and preparation always recomputes availability because
new exposure can reduce it after the preview.

Reports combine the current sitting with up to 20 completed sittings from the
last 90 days in the same content version. They display the included date range
and coverage limits. Each observation retains its source session and exact
construct, level, access and assistance conditions. Late assistance corrections
are reflected when the history is reloaded. Compatible observations can satisfy
the existing shared evidence threshold across sittings; a single short check
does not lower it. Current-sitting counts remain separate from accumulated
patterns. Missing or truncated history is disclosed, and incompatible versions
or conditions are not pooled. Current teaching-review suggestions use the latest
comparable independent sample reaching the existing shared minimum; responses
tied at its boundary timestamp remain together. All dated totals remain visible
separately. Comparison preserves each source run's window mode, initial duration
and recorded time extensions. Missing administration details remain unknown and
never inherit the currently open session's settings.

Access descriptions disclose spoken choices separately from passage access.
A printed passage does not imply silent choices. Saved cue roles identify
required or optional narration; only exact completed playback receipts establish
that narration finished. Missing, partial and failed playback remain explicit.
These labels do not change the task, scoring or comparison conditions.

Current scored authoring has 532 exact task/access combinations, producing
801 task/level/access pools. Independent item, passage, family and stimulus
checks establish at least ten fresh targets in 596 pools. The other 205 pools
declare explicit finite inventories with fewer than ten independent targets,
such as a single supplied high-frequency word, the seven weekday names or a
reviewed sparse spelling contrast. A new wrapper or option order does not make
a target fresh. Inventory metadata records the controlled targets, limit,
reason and follow-up guidance. Teacher actions disclose remaining capacity
and exhaustion; the reporting threshold is never lowered to fit a short pool.
When the bank is exhausted, collect comparable evidence outside it. Authored
task ceilings describe the operation, never a learner's ability ceiling; a
different harder operation remains a separately named task.

Mock runs have a separate RPC/store boundary. They do not update practice or
formal Skills mastery. Server-authoritative session state, revisions and
idempotent request IDs protect pause/resume, duplicate requests and uncertain
network retries. Item snapshots come from `literacy_mock_items`, whose table
is private. Client access to the public practice bank is not represented as
secure test-content protection.

## Authoring, generation and verification

`tools/generateLiteracyMockManifest.mjs` validates complete coverage and every
required local media file, then emits the private canonical JSON/SQL manifest.
SQL generation refuses unavailable authored media. The manifest is delivered
after the mock-session schema/evidence migrations; applying it to hosted data
is a separate authorized release action.

The complete published `literacy-mock-v1` contract stays bound to all 3,958
items in `20261006092000_literacy_mock_items.sql`. The generator
`tools/generateLiteracyMockPublishedSnapshot.mjs` derives the lazy immutable
runtime shard from that migration; `--check` verifies it. This replaces the
partial comprehension-only freeze, because future editorial changes can affect
any skill. Historical keys, labels, media and snapshots remain exact.

Version 2 carries the repaired literal details/sequence wording plus the current
editorial and oral-task revisions. `20261010120000_literacy_mock_evidence_v2.sql`
introduces the composite `(content_version,id)` key, private publication metadata,
version-aware RPCs and server-derived exposure. The generated manifest
`20261010121000_literacy_mock_items_v2.sql` inserts the complete v2 catalogue and
refuses mutation of an already published item or count. It preserves every v1
row and all learner responses. Run:

```sh
node tools/generateLiteracyMockPublishedSnapshot.mjs --check
node tools/generateLiteracyMockManifest.mjs --content-version literacy-mock-v2 --sql supabase/migrations/20261010121000_literacy_mock_items_v2.sql
```

Legacy session preparation chooses v2 only when its complete publication and all
eight areas are available; otherwise it keeps v1. The frontend accepts both and
loads the session-owned version. Existing v1 sessions continue on v1 even after
publication. The private publication `available_for_new_sessions` flag can
suspend new v2 assignments without deleting existing v2 evidence or changing
in-progress runs. Applying either migration is a separate hosted-data release,
not implied by a Git push.

### Verified v2 deployment history

With explicit user approval, both v2 migrations were applied to the Literacy Guide
production project on 10 October 2026. The schema is recorded as
`20261010080446_literacy_mock_evidence_v2`; the full manifest is recorded as
`20261010121000_literacy_mock_items_v2`. V2 is available for new sessions with
3,976 items across all eight areas. Full catalogue fingerprints match the
tested manifests, and all 3,958 v1 rows are unchanged. All 11 changed function
bodies, their grants and fixed search paths, seven private-table RLS boundaries,
and immutable triggers were verified on production. Null/invalid child tokens
and a teacher call without an approved identity were rejected. Verification
created no learner records; there were no stored mock sittings at application.
The exact application and read-only verification receipts are retained in the
owner worktree's ignored `.artifacts/map-audit-fixes-2026-10-10/` directory.

### Version 3 publication contract

`20261010140000_literacy_mock_evidence_v3.sql` adds private, immutable
presentation/support events and the v3 preparation, event, support-resolution
and fresh-check RPCs. Presentation events have their own monotone event revision
and do not consume answer revisions. Learner requests use the same durable,
exact-payload retry mechanism as answers. The public data boundary validates
these new envelopes. Legacy v1/v2 APIs and immutable item snapshots remain.
`20261010150000_literacy_mock_followup_evidence.sql` supplies the follow-up
history, fresh-capacity and preparation behavior. The complete catalogue is
generated as `20261010141000_literacy_mock_items_v3.sql`; the ordered release
applies 140000, 141000 and 150000 after their required baseline dependencies.

V3 SQL uses a lossless primitive dictionary and tagged JSON transport to reduce
the complete catalogue while preserving one atomic publication. When all nine outer
fields exactly mirror the item snapshot, they are reconstructed from it;
distinct or absent fields retain their original JSON shape. A private temporary
decoder validates references, tags and object keys, reconstructs canonical
JSONB, then is dropped. The complete insert and publication metadata share one
transaction with immutable item and count guards. Exact replay is permitted;
changed published content is rejected. Transport compression neither splits
publication nor changes stored keys, answers or snapshots. V1/v2 retain their
existing literal transport and frozen content.

Historical v4 frontend preparation uses `teacher_prepare_literacy_mock_session_v4` and
fails clearly if the complete v4 publication is unavailable. It never silently
creates a legacy sitting with different help or clock semantics. Runtime
capabilities gate the new controls on existing sessions. The current-version manifest must
be generated only after every required recording is available, then verified
with the schema in an isolated database before an authorized hosted application.
These rules describe the release contract; hosted and client verification are
recorded separately.

The v4 forward schema is generated by `tools/generateLiteracyMockV4Schema.mjs`
as `20261012083202_literacy_mock_adaptive_v4.sql`; its atomic catalogue is
`20261012083219_literacy_mock_items_v4.sql`. Apply the schema before the catalogue.
Both must pass the actual SQL scoring, receipt, freshness, authorization and
teacher-report checks with the complete ready bank before hosted application.
V3 remains a lazy frozen generated snapshot rather than a re-authored history.

The v4 backend was applied to `ajweixqzejjfvjehofnq` on 12 October 2026 using
exactly those two migrations in an isolated linked CLI workspace. All 8,819
published records match the tested SQL catalogue by ordered PostgreSQL JSONB
digest. V1, v2 and v3 catalogue digests and the earlier completed QA sitting
remain unchanged. Eight private helpers deny PUBLIC, anonymous and authenticated
execution; five teacher RPCs require authentication, and two learner RPCs keep
token-scoped access. Actual isolated SQL tests saved and reported all 263 answers
across seven sittings, including 57 authorization/source-version denials.
The routing audit covers all 47 skills and 155 selectable task/access ladders,
1,240 targeted scenarios, 208 full sittings and 512 classroom blueprints.
There are 702 new active Leda recordings; automated transcription and signal
checks also cover one reused Sam recording. Detailed release, browser and media
evidence lives in ignored `.artifacts/mock-map-adaptive-fixes-2026-10-12/`.
The client release `53afad8bf3f2e70bd7dbc07c192497b5558658dc` reached READY
in automatic deployment `dpl_2YR2q9R9Wd76Cjs9yv7dY5TN2xe6` at
`literacy.guide`. Its public release stamp, learner/teacher bundles and all
703 audited recording hashes were verified. Ten public anonymous/invalid-token
denial probes also passed.

An authenticated production teacher launched a complete 43-question v4 test
for a synthetic learner. All 43 unique independent answers matched the teacher's
question-by-question report after a full refresh and reopening the saved session.
The student also resumed at question 11 after refreshing and signing back in,
with all ten prior answers preserved. All 14 repeated task/access groups followed
levels 1 → 2 → 1 on correct → incorrect → correct answers; the remaining skill
was sampled once. Native audio completed for all 129 required cue occurrences.
The completed report was retained, the synthetic learner was archived, its
sessions revoked, and the original active class roster restored. The full routing
audit establishes all 47 skills; this live sitting independently sampled 15.
These checks establish authored demand, routing and persistence under the tested
conditions; empirical child difficulty and physical-device evidence are separate.

The approved v3 backend was applied to project `ajweixqzejjfvjehofnq` on
11 October 2026: schema `20261011011140`, complete publication
`20261011021249`, then follow-up behavior `20261011021816`. The publication
contains 7,549 items (11 tutorial-only), 47 skills, eight areas and six formats,
with zero unavailable items. Its canonical content SHA-256 is
`e5101697a9358f692bd5ffb2e22683c76718cc110c91db84657bb966eb07a90c`.
The original v1/v2 fingerprints were preserved. Verification matched all 25
required function bodies and access contracts, checked private tables and
sequence access, confirmed both immutable triggers enabled, and passed 17
actual PostgREST anonymous/invalid-token denial checks without successful
learner writes. The plugin's request-size rejection made no catalogue write;
an isolated CLI workspace applied the same verified SQL as one transaction.
Hosted migration timestamps differ from the source filenames, so preserve this
mapping rather than replaying or repairing history. Detailed backend and client
release receipts are retained under the owner worktree's ignored
`.artifacts/mock-map-capacity-2026-10-10/`. These checks do not certify an
authenticated classroom flow, human listening or a physical device.

Practice and mock share canonical item/passages and declared families. The
local exposure ledger records these at presentation. V2 server scoring derives
known familiarity from synced practice snapshots and earlier mock evidence;
a false client freshness claim cannot override it. Item, passage and family
reasons are retained separately. Known exposure excludes a response from
independent progression and reporting while preserving the actual first answer.
Missing history remains unknown, not proof of an unseen item. Public practice
uses local/shared exposure and its synced practice history; it does not claim to
have fetched every remote mock record. Full learner deletion clears the local
ledger and suppresses late writes; a practice reset preserves exposure history.

The shared audio generator accepts `--literacy-mock-only --dry-run` to print
the exact isolated worklist. Mock synthesis requires an explicit
`--max-billable-characters` cap covering retries and cannot be combined with
another content scope. Paid work requires existing applicable user approval.
Submission ledgers and asset hashes belong in ignored task artifacts. The
generator's decode/signal checks do not claim direct listening or device proof.

Focused bank/planner tests cover native construction, hidden spelling targets,
silent reading, literal keys, set/sequence scoring, media availability, full
coverage, shared blueprints, fresh stimuli, tutorial exclusions and adaptation.
Media-repair tests cover the unchanged response count and prefix, fixed form
length, shared image/audio exclusions, safe same-level replacements, overlapping
candidate stimuli and exhaustion without a partial form.
Complete release verification also exercises teacher/learner rendering, all
six interactions, genuine media failures, keyboard/touch access, audio replay,
save/resume, session control, ownership and server-derived scoring. Follow the
[task gates](../verification/TASK_GATES.md). Keep automated, visual, listening,
physical-device and hosted evidence distinct; this document does not certify
a deployment or classroom pilot.

## Device collection and simple working profiles

New teacher-prepared v4 full tests use `untimed` administration and default to
quiet device collection. Before scored work, the server confirms the plan and
a device lease, and the browser verifies retained assessment code, public
question media and learner-owned local storage. Next records the exact response
and local projection durably before advancing. The server still derives the
score and validates the published question, access/audio conditions, freshness
and immutable answered prefix when the batch arrives. Local correctness only
drives the reserved adaptive path; it is not a teacher receipt or practice score.

The teacher may enable live data updates. Either mode preserves a durable,
byte-for-byte batch retry after uncertain delivery and accepts only a complete,
owned receipt before removing its sent prefix. New answers added during upload
remain queued. Finished pupils upload automatically. `Collect all data and
finish` asks each started device to stop and drain its captured work; the session
closes only after every leased unfinished device acknowledges that collection.
An offline iPad must reconnect with the app open. The teacher cannot remotely
read its storage while it is disconnected. The receiving window is bounded to
12 hours after session start; ordinary activities retain their existing limit.
Ended/expired tests are not reopened. Privacy cleanup includes durable device
queues and their ownership index; cached public media contains no learner data.
Earlier timed and pause-at-window-end sittings retain their recorded contracts.

Teacher results begin with the current working profile, percentage correct on
fresh independent scored answers, its exact numerator/denominator, and a next
teaching step. A class table and four-area table show the same definitions.
Foundation and Challenge describe the authored local question demands, not a
reading age, grade, RIT or calibrated scale. The existing shared learning policy
sets the evidence minimum, skill diversity, recency and accuracy bands, evaluated
separately at each question demand. Without sufficient demand-specific evidence,
the report says “More evidence needed” or “Mixed — confirm level.” A harder error
does not erase supported Foundation evidence. Helped/familiar/unscored counts and
all original question, coverage and historical evidence remain available behind
secondary controls. Raw percentages across adaptive sittings are descriptive
results and must not be interpreted as growth or used to rank children.
