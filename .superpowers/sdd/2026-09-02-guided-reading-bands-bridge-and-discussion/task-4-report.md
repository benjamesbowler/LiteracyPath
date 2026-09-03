# Task 4 report — Willow Street Readers authoring

## Commit

- Feature commit: `c67a2a59d` — `feat: author Willow Street Readers`
- Base checked before work: `7b0dab7f4a0cb5c706682620b4722519f2a916fb`
- Push: intentionally not performed.

## RED evidence

The collection-contract test was written first and run with:

```text
node --test tests/unit/guidedReadingBridgeBooks.test.js
```

It failed with `ERR_MODULE_NOT_FOUND` for `src/data/guidedReadingBridgeBooks.js`, the expected missing-production-module failure. After the manuscript source existed, the same test exposed missing repeated language in `Make a Paper Kite` and `How a Book Is Made`; both manuscript lines were corrected before GREEN.

The integration tests were then updated to require 226 books/metadata/discussion rows and Willow free-tier participation. They failed against the still-206-book runtime until bridge aggregation, metadata, static prompts, registry, and sampling integration were installed.

## Exact collection evidence

| Contract | Result |
| --- | ---: |
| Books | 20 |
| Reading pages | 160 |
| Pages per book | exactly 8 |
| Visible words per page | minimum 6; maximum 10 |
| Pages with final punctuation | 160/160 |
| Pages with exact `text === pageAudioText` | 160/160 |
| Unique cover/page image paths | 180/180 |
| Unique page audio paths | 160/160 |
| Story Bible review records | 20/20 |
| Ordered procedure steps | 32/32 |
| Runtime books after composition | 226 |
| Metadata rows | 226 |
| Static teacher discussion rows | 226 |

Genre counts are exact: 6 everyday fiction, 4 culture/community, 4 procedures, and 6 photorealistic nonfiction. Legacy type counts are 10 fiction and 10 nonfiction. Visual treatment counts are 14 `willow-street-illustrated` and 6 `willow-street-photorealistic`. Every book is Level C with `readingBandProfile: "standard"`, `readingMode: "predictable-levelled"`, and `readingPageProfile: "compact-stable"`.

## Meaningful repeated language

The named repeated stem occurs on the following reading pages:

| Title | Stem | Pages |
| --- | --- | --- |
| The Lunchbox Mix-Up | checks the labels | 2, 3 |
| The Lost Library Book | They look | 2, 3, 4 |
| The Windy Picnic | The wind lifts | 1, 3 |
| The Puddle Plan | Their plan | 2, 4, 7 |
| The Squeaky Wheel | The wheel squeaks | 1, 3 |
| The Garden Gate | The gate | 1, 2, 4, 6, 7 |
| Nani's Chapati Lunch | Nani folds | 4, 5 |
| Dumplings for New Year | Zoe pinches | 5, 6 |
| Drums for Carnival | Leo plays | 3, 5, 6 |
| Eid Morning with Samir | Samir's family | 1, 2 |
| Grow a Bean in a Jar | the bean | 4, 7 |
| Make a Paper Kite | the kite | 6, 8 |
| Build a Cardboard Ramp | the ramp | 4, 7 |
| Make Fruit and Yoghurt Cups | each cup | 3, 4, 6, 7 |
| From Wheat to Bread | The grain | 2, 3, 4 |
| Where Rainwater Goes | Some rainwater | 2, 3 |
| Inside a Fire Station | Firefighters | 1, 3, 5, 8 |
| How Paper Is Recycled | The paper | 2, 3 |
| A Snail Comes Out at Night | The snail | 1, 2, 3, 5, 7, 8 |
| How a Book Is Made | The book | 1, 7 |

These repetitions track story evidence, changing plans, procedure objects, or factual subjects. They do not form eight interchangeable template sentences.

## Editorial and factual review

All 160 manuscript lines and all 180 visual briefs were read in order. Fiction was checked for an initial goal/problem, an attempt with consequences, evidence-driven development, and earned resolution. Procedure pages were checked as steps 1–8 with adult supervision for heat, glass, scissors, knives, axles, and moving equipment. Factual sequences were checked against the source notes in `WILLOW_STREET_CONTENT_BIBLE.md`; visual identity, wardrobe, landmarks, props, camera treatment, mechanical plausibility, and safety framing are frozen in `WILLOW_STREET_VISUAL_CONTINUITY.md`.

Automated exclusion checks found no quiz/answer/score fields, quiz pages, external reading-programme or crosswalk product copy, or excluded topic/political copy. The 20 teacher records are static in the dedicated Willow module and preserve the approved 206 existing records unchanged.

## GREEN evidence

```text
node --test tests/unit/guidedReadingBridgeBooks.test.js tests/unit/guidedReadingBookMetadata.test.js tests/unit/guidedReadingDiscussionPrompts.test.js tests/unit/freeTierContent.test.js
44 tests passed; 0 failed.

npm run check:guided-reading-discussion-prompts
226 static book records passed.

npm run check:validate:guided-reading
226 active approved books; passed.

npm run check:guided-reading-story-bible
226 books reviewed; 2,021 pages; 0 failures.
1,861 existing exact-audio pages verified; 160 Willow pages reported as scheduled.

npm run check:story-content-policy
Policy registration, evidence shape, profile contracts, and source fingerprints passed.
Release approval remains blocked for the Willow media-pending content group.

npx eslint <all changed JS/MJS test and production files>
Passed with no findings.

git diff --check
Passed.
```

## Expected residual Task 5–7 failures

No image or audio binaries were created in Task 4. The following are intentionally not claimed:

- Tasks 5–6 must create 20 covers and 160 page images, bind final-text fingerprints, inspect every image directly, and change the scheduled media state only after visual approval.
- Task 7 must create exact-current-text narration for all 160 pages, refresh provenance/corpus fingerprints and generated indexes through their generators, perform waveform/decoder checks, and complete direct human listening.
- Strict visual-alignment, image-existence, narration-provenance, narration-corpus, human-listening, and release-mode gates are therefore expected to remain red until those tasks finish.
- No physical-iPad or hosted release verification was part of this manuscript task.
