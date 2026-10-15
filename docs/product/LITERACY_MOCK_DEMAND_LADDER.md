# Adaptive Literacy Test: actual task demand

New sittings use **v7 / areas-v3**. This standard supplements the
[session contract](LITERACY_MOCK_SESSIONS.md) and
[Question Design Bible](../content/QUESTION_DESIGN_BIBLE.md).
`src/policy/literacyMockDemandV7.js` owns the current classification and inherits the unchanged non-comprehension rules from V6.

Every area starts at Starter (1), can fall to First steps (0), and adapts
independently. The existing 43-question schedule and evidence rules remain.
The table specifies what changes in the task, rather than the source's numeric
level. A new topic, a longer direction, an extra example of the same operation,
or a later word-list position is insufficient to promote an item.

| Area | First steps → Starter | Subsequent demands, in order |
| --- | --- | --- |
| Sounds in words | Compare familiar spoken initial sounds → isolate an initial sound and map it to a letter | Compare spoken rimes → isolate the internal vowel across spoken words → blend three separately recorded phonemes → add, delete or substitute a phoneme |
| Phonics | Recognize a short familiar spoken word in print → discriminate complete CVC words | Construct a three-phoneme CVC word → construct a consonant blend with at least four phonemes → decode a split vowel against a real short-vowel twin → construct a three-phoneme vowel-team word using spare tiles → construct a consonant blend and vowel team with at least four phonemes and spare tiles |
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
