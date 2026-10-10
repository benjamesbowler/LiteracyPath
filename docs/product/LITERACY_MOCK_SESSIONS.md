# Teacher-controlled literacy mock sessions

Literacy Guide's mock sessions prepare Kindergarten–Grade 2 learners for the range
of literacy tasks and computer interactions found in public MAP Growth K–2
examples. They use original Literacy Guide questions, pictures and recordings.
Teachers receive descriptive evidence for instruction; the product does not
estimate RIT, percentile, grade equivalence, proficiency, or a MAP score.

The [Reporting Bible](../reporting/REPORTING_BIBLE.md),
[Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md),
[authoring standards](../skills-assessment-rebuild/AUTHORING_STANDARDS.md), and
[assessment media contract](../design/ASSESSMENT_MEDIA_EVIDENCE.md) govern this
surface. [Literacy practice](MAP_PREPARATION.md) offers learning and rehearsal
profiles over its separate practice sessions and per-area routing.

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
**classroom practice window** selected by the teacher. A 43-question form is
a local preparation choice; public sources differ on whether their approximate
question count includes field-test items. The 24-question form is a shorter
balanced sample. Neither form reproduces NWEA's calibrated adaptive algorithm.
[2025 technical report](https://www.nwea.org/uploads/MAP-Growth-Technical-Report-2025.pdf),
[early-learner guidance](https://teach.mapnwea.org/assist/help_map/Content/Testing/EarlyLearning.htm).

No authoritative public specification was found for exact current domain
weights, format frequencies, universal passage word counts, or every current
test-screen detail. Official practice tests demonstrate interactions; they
are brief, fixed and unscored. These limits prevent claims of operational
equivalence. [Practice-test guidance](https://connection.nwea.org/articles/Knowledge/Practice-tests-for-MAP-Growth).

## Coverage and question contracts

The canonical loader is `src/data/literacyMockBank.js`. It normalizes the
revised 3,916 base literacy-practice items and 60 original additions into
3,976 v2 records across six response formats, covering 47 skills in eight local
areas. Version 1 retains all 3,958 original published records. Five additions
are reserved worked examples and cannot enter scored plans.

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
replayable. Listening-only passages stay hidden. Build tiles remain visible
because selecting letters is the required response.

Exact canonical Leda files and existing approved source pictures are reused.
The new rhyme and spelling tasks use 23 original object illustrations in one
consistent flat style on white, delivered as whole cells from a
1536-by-1024 atlas. Delivery encoding uses WebP at the original dimensions,
without cropping or changing the composition. The original PNG hash, delivery
WebP hash, grid and object-to-cell mapping accompany their canonical snapshots.
The [original generation prompt and provenance](../../source-art/assessment/literacy-mock/provenance.json)
retain the exact art request, original source location and delivery-only transform.
Missing
required audio keeps an item out of the ready bank. Every required cue must
complete before a scored response is accepted. A failed required image or
recording is recorded separately as a media failure. It does not record an
answer or attempt, consume a question, or advance progress.

`replaceFailedLiteracyMockMedia(bank, plan, responses, mediaFailures)` repairs
the entire unanswered suffix and returns `{ plan, unavailable }`. Failure
records contain the failed `questionId` and `failedMediaPaths`. Both that item
and every item sharing a failed audio/image base URL remain excluded for the
run; atlas cell fragments are removed when comparing source URLs. Answered
items remain frozen. Replacements keep the same skill, domain and planned
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

The teacher selects the full class or named learners, 24 or 43 questions, and
a 10-, 20-, 30- or 40-minute classroom window. Session controls start, pause,
resume or finish the session. Readiness, connection information and saved
progress remain visible. Existing sessions can be reopened from class history
and filtered to a learner. Identity and roster access follow the existing
teacher-controlled Student Sessions boundary.

Learners confirm sound access and complete the five unscored response-format
examples before readiness. The examples demonstrate multiple selection,
matching, ordering, selectable text and spelling tiles. A modeled answer and
a child's practice attempt teach the interaction; neither becomes assessment
evidence. Tutorial IDs are exported as `LITERACY_MOCK_TUTORIAL_IDS` and carry
`tutorialOnly` in canonical metadata.

Scored items provide neutral continuation. Teachers receive the explanations
and evidence; the assessment does not teach a missed answer or change a saved
first response. Replaying prescribed audio is access. Explicit adult help
marks a response as supported. Questions not reached before the window ends
remain unsampled.

`src/utils/literacyMockPlanner.js` creates deterministic learner plans. A class
shares a skill blueprint, while learner seeds vary the actual examples and
choice order. The first eight questions cover the eight local areas. Planned
skills are sampled twice where the form permits; 43 questions leaves one
unpaired sample. IDs and stimulus keys do not repeat within a plan.

Plans begin at the entry difficulty. After independent success, a future item
in that same skill may move to the harder local level; independent difficulty
returns future samples in that skill to entry level. Supported or invalid
or known-familiar responses do not raise difficulty. Routing and reporting
use the same independent-response eligibility predicate. Only unanswered slots may change, and the
server checks skill/domain continuity, difficulty and the committed prefix.
Local levels are ordinal task bands, not calibrated MAP difficulty.

## Reporting and persistence

Teacher reports retain the exact question, response, expected response,
modality, local level, assistance and delivery evidence. They show independent
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
construct, access modality and administration.
Listening and independent reading stay separate even when displayed beneath
one broad comprehension heading.

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

New session preparation chooses v2 only when its complete publication and all
eight areas are available; otherwise it keeps v1. The frontend accepts both and
loads the session-owned version. Existing v1 sessions continue on v1 even after
publication. The private publication `available_for_new_sessions` flag can
suspend new v2 assignments without deleting existing v2 evidence or changing
in-progress runs. Applying either migration is a separate hosted-data release,
not implied by a Git push.

With explicit user approval, both migrations were applied to the Literacy Guide
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
