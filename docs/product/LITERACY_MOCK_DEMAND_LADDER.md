# Adaptive Literacy Test: actual task demand

New sittings use **v10 / areas-v5**. This standard supplements the
[session contract](LITERACY_MOCK_SESSIONS.md) and
[Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md).
`src/policy/literacyMockDemandV10.js` owns current classification. It retains valid earlier operations while requiring actual oral sound comparison, construction at upper phonics demands, explicit scope evidence and balanced punctuation alternatives. New publication snapshots preserve every V1–V9 question and saved answer.

Every area starts at **First steps (0)** and adapts independently. A correct
independent response explores the next demand; an incorrect one lowers it.
Neither one establishes a level. The bounded route collects repeated evidence
before finishing an area, as specified below. Historical 43-question routes
retain their original rules and publications.
The table specifies what changes in the task, rather than the source's numeric
level. A new topic, a longer direction, an extra example of the same operation,
or a later word-list position is insufficient to promote an item.

| Area | First steps → Starter | Subsequent demands, in order |
| --- | --- | --- |
| Sounds in words | Compare familiar spoken initial sounds → compare final phonemes of recorded words, without letters | Compare spoken rimes → isolate the internal vowel across spoken words → blend three separately recorded phonemes → add, delete or substitute a phoneme |
| Phonics | Recognize a short familiar spoken word in print → discriminate complete CVC words | Construct a three-phoneme CVC word → construct a regular four-phoneme consonant blend → construct a five-letter split-vowel word retaining four phonemes and rejecting spare letters → construct five phonemes including a vowel team with spare graphemes → construct at least six phonemes across compound parts or a morpheme extension, retaining vowel teams and rejecting spare graphemes |
| Print | Match a recorded letter name → match capital and lowercase forms | Locate a letter within a word → locate a word within a sentence → navigate a line/sentence boundary or distinguish multiple complete sentences |
| Vocabulary | Distinguish pictures across broad categories → distinguish closely related objects | Relate word meanings → interpret one contextual occurrence → apply an affix against same-root alternatives → resolve competing true senses or correctly/incorrectly used occurrences of the same spelling |
| Listening | Identify one recorded word → identify a referent in a recorded sentence | Retrieve one explicit detail → resolve two before/after links when mention order conflicts → integrate two functions/stages against true partial accounts → infer a lesson from one mistake and repair → integrate two episodes, rejecting lessons true of only one |
| Language | Identify a pictured action against an object → distinguish it from other actions | Classify an individual word/form → interpret one clause → resolve a relationship across two clauses → retain quantification, negation or temporal scope when comparing restatements |
| Reading | Match a picture to a word with a distinct initial → decode a complete CVC word against close alternatives | Read and retrieve one detail → resolve two before/after links when mention order conflicts → integrate two functions/stages against true partial accounts → infer a lesson from one mistake and repair → integrate two episodes, rejecting lessons true of only one |
| Writing | Recognize a capitalised name → apply sentence-initial capitalisation | Construct/recognize one complete simple thought → separate two complete thoughts → organize three complete events → retain a dependent clause with its main clause or edit paragraph relevance |

These are authored curricular demands. Operations within an area have explicit
additional requirements; they are not interchangeable evidence of mastery.
The route is not an empirically calibrated item-response scale, and it cannot
guarantee that every child finds every task in a higher band harder. Reports
therefore retain area-specific accuracy, the actual sampled tasks and demand,
without RIT, percentile, grade-equivalence or an overall literacy level.

## V10 sound-demand safeguards

The current publication retains the boundary algorithm below and supplies 40
literal sound transformations. Each has three transformed options with the same
changed edge and phoneme count, plus the unchanged source word. Neither the new
edge, a matching source rime, nor a longest/shortest choice identifies the key.
The reviewed operation and retained source sounds must be combined. Operand
phonemes, exact recordings and semantic exposure identities are source data.

Four one-position blending comparisons and one middle-vowel comparison solvable
from its initial sound are excluded. The remaining blend contrasts require more
than one recorded position. Exact contextual withdrawals preserve historical
publications and original answers; V9's reduced ceiling stock no longer supports
its former five-retake expectation. V10 must pass that contract with actual
media and valid selected answers, without eligibility overrides.

Generate the current forward schema/catalogue with `tools/generateLiteracyMockV10.mjs`.
Apply `20261016184804_literacy_mock_boundary_v10.sql` before
`20261016184807_literacy_mock_catalogue_v10.sql`.
`teacher_prepare_literacy_mock_session_v10` prepares current sittings.
Previous preparation RPCs and every original publication remain available for
versioned retries; rejected source material is never readmitted for capacity.

## V9 repeated observations and bounded length

`src/policy/literacyMockBoundaryV9.js` is the shared policy authority. An area
finishes after two independent correct ceiling observations, two independent
incorrect floor observations, or at least two correct at one demand and two
incorrect at the immediately higher demand. These are repeated observations of
the named operations, not calibrated ability, mastery or evidence about every
unsampled skill. Reports retain exact tasks, outcomes and the stopping reason.

Two consecutive supported, familiar or otherwise non-independent answer slots
at the same demand finish that area **unconfirmed**, for an independent teacher
follow-up. They do not count as errors or confirmations. Media failures spend
no answer slot; repair retains the failed task and demand.

Maximum question budgets are sounds 8, phonics 9, print 8, vocabulary 8,
listening 9, language 8, reading 9 and writing 8: **67 at most**. Evidence can
finish areas earlier. The deterministic all-correct path has 58 answers and
the all-incorrect path 16, both complete across all eight areas. An early floor
slip can recover to two ceiling observations within the budget. Unresolved
patterns reaching a budget stay explicitly unconfirmed.

Print encounters at most five distinct letter-name/case targets per sitting;
if another lower-letter task would exceed that bound, stop unconfirmed. This
preserves five fresh retakes within the finite alphabet. Upper print work can
continue within its eight-question budget. Offline packs reserve six letters'
alternative name/case tasks, while every actual selection remains distinct.

Only unseen future slots can change. The response prefix and shown current
question stay frozen. Late answer assistance can remove a confirmation and
restore unused bounded slots while the run is active; it cannot reopen a
completed run. The server derives schedule, bands and stops from canonical
items and effective server-scored responses, not a child's confirmation claim.

V9 excludes the printed-vowel sounds substitution, capitalization-cued boundary
versions, unreviewed scope paraphrases, two accent-sensitive medial comparisons,
and the blocked table illustration. New oral, scope, boundary, construction,
action, first-word and paired comprehension sources supply actual replacements
and fresh retake stock. Starter listening passages are hidden in V9 snapshots.

Generate the forward schema/catalogue with `tools/generateLiteracyMockV9.mjs`.
Apply `20261016141521_literacy_mock_boundary_v9.sql` before
`20261016141524_literacy_mock_catalogue_v9.sql`. `teacher_prepare_literacy_mock_session_v9`
prepares new sittings; previous version RPCs and immutable publications remain.
The V9 regressions cover stopping, late help, same-task repair, receipt
replay, access denial and teacher reporting. The reduced valid V9 ceiling pool
now fails closed on further correct-path retakes; V10 owns the current
five-retake contract. The general
question-policy gate now audits the current adaptive bank explicitly.

## Admission rules and evidence

- The current route ignores the source `level` when classifying demand. Its published
  `adaptiveDemand` records the operation and required additional work.
- Simple initial-sound comparisons cannot enter the top sounds band. The
  highest rung requires an actual speech-sound transformation. Basic vowel
  letter identification and four-sound blending do not qualify for it.
- Letter matching stays letter matching; simple plurals stay single-word
  classification; concrete synonyms stay word relationships; sentence capitals
  stay sentence capitals. Source Level 2 cannot move any of these to the top.
- A four-letter short-vowel construction belongs before split vowels, not
  above vowel teams. New original dictated items use explicitly authored
  phoneme/grapheme tiles and two spare tiles. Existing exact recordings supply
  the target word; target pictures and spoken tile labels are excluded.
- Upper reading/listening require the reviewed paired comprehension task
  features. Fixed-only predecessor pools and long literal-recall items are not
  admitted as harder merely because of text length.
- Ambiguous book-role predecessors and numeric next-page tasks do not supply
  the print ceiling. Single-word spacing and letter-case tasks cannot be
  promoted there by their source level.
- Unclassified items remain available to their original published assessment;
  they are not forced into a current band. Unsampled skills remain unsampled.

## Publication and historical results

`src/data/literacyMockV6.js` combines the immutable V5 sources with 44 original
vowel-team construction items. It changes neither existing V1–V5 records nor
their keys, media, demand or saved answers. New V6 snapshots carry `areas-v2`.
The initial generator `tools/generateLiteracyMockV6.mjs` produces two forward migrations:
`20261015105406_literacy_mock_demand_v6.sql` and
`20261015105421_literacy_mock_catalogue_v6.sql`. Apply schema, then catalogue.
`teacher_prepare_literacy_mock_session_v6` retains the V6 preparation contract; historical
preparation retries retain their original version. Canonical hosted validation
uses the session's publication for item identity and next-demand checks.

## Required verification

Run the V6 demand unit tests, SQL publication/ownership/scoring tests and full
browser cases. Inspect literal prompts, all choices and the exact recorded
stimuli across every rung, including the new construction tiles. Verify fresh
offline reserves and media budgets, complete correct, incorrect, reversal,
alternating and uneven paths, reload/collection and teacher reports. Save
production-browser evidence separately from mocked browser regressions. A
passing band transition alone does not establish a valid demand increase.

V7 adds no question identities or recordings. It publishes separate `areas-v3` snapshots with temporal-link reasoning at comprehension band 3 and main-idea integration against two true partial accounts at band 4. This prevents simple first-mentioned-event retrieval or an obvious topic from supplying those middle rungs. `tools/generateLiteracyMockV7.mjs` owns its two forward migrations and `teacher_prepare_literacy_mock_session_v7` prepares new sittings. V1–V6 records remain immutable.

The applied V7 forward migrations are `20261015111510_literacy_mock_comprehension_demand_v7.sql` and `20261015111525_literacy_mock_catalogue_v7.sql`; their filenames match the hosted migration history.

## V8 material and retake inventory

`src/data/literacyMockV8.js` appends the three reviewed retake sources and a
neutral shape-matching tutorial. It preserves every older source record and
publishes separate demand snapshots. New paired reading/listening passages
and one-/two-episode extensions share exposure families. New contextual senses
and pictured/printed/spoken word targets also share explicit lexical identities;
additional versions do not inflate the independent target count.

The offline print reserve couples First steps and Starter variants of six true
letters for five actual questions. It retains every eligible exact-task repair
variant while actual selections, including supported answers, remain distinct.
The finite alphabet still limits additional sittings and repeated media failures.
Capacity exhaustion must preserve saved work and stop without inventing a score.

Run `literacyMockRetakesV8.test.js` for five sequential same-child sittings across
ten outcome paths and three seeds, including media bytes and tutorial assets.
Run `literacyMockRetakesV8Sql.test.js` for canonical offline delivery, five
same-child retakes per independent outcome pattern, collection and teacher
reports. Identity parity and legacy-plan compatibility have separate SQL
regressions. Exercise the finished media and same-child retakes in production;
local planning with unresolved cues is diagnostic evidence only.

`tools/generateLiteracyMockV8.mjs` owns the V8 forward schema/catalogue. Apply
schema before catalogue; `teacher_prepare_literacy_mock_session_v8` is the
teacher-owned preparation RPC. Historical retries continue to select their
original version. Never rewrite V1–V7 to update current material.
