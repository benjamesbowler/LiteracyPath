# App reading levels and text measures

**Authority:** `src/data/guidedReadingLevelReviews.js` is the authored per-book
level review. `getRuntimeGuidedReadingBooks()` remains the catalogue authority.
`tools/generateGuidedReadingTextAnalysis.mjs` derives the displayed analysis.

The teacher and child libraries can group books by **App level A–H**. These are
Literacy Guide's editorial estimates of the printed text demands. They are not
official RAZ, Learning A–Z, Fountas & Pinnell or Lexile measures, grade equivalents,
or assessments of a child's ability. A teacher still selects a book for the
reader's knowledge, decoding, language, interests and task. Narrated books remain
available for listening irrespective of independent reading demands.

The 2026-10-01 review read every page of every runtime book in sequence. It was
performed by Codex, using the full manuscript and available editorial image
descriptions; it is not a second human review, new visual inspection or classroom
validation. Every book has its own rationale identifying actual sentence patterns,
vocabulary and causal, informational or inference demands. Picture descriptions
support interpretation of concrete actions, but pictures do not establish a word's
decodability and the review does not certify image accuracy. Some descriptions are
generated directly from the reading text and provide no independent visual
evidence. Each generated row records whether separate descriptions cover all,
some or none of the pages. The estimate assumes contextual picture support; it
does not lower a level on an unverified image claim.

The reviewed manuscripts contain **227 books, 2,031 reading pages and 23,368 word
tokens** under the conventions below. A full-text consistency review on 2026-10-06
moved **Our Five Senses** (`gr-e-50`) from B to C: its sensory contrasts, lists,
varied action verbs and final connection match the other senses books in C.
The reviewed Tools, Five Senses, Baby Animals, Animals on the Farm and Day and
Night manuscripts retained their existing bands. This follow-up uses the rubric
below; analyzer estimates are supporting evidence, not a letter-conversion rule.
The current app-level distribution is A: 18, B: 48, C: 49, D: 53, E: 10,
F: 13, G: 35 and H: 1. The 35 extended Moonwood
stories need G; the digestion investigation needs H. Keeping all of these under
four letters would hide large differences in syntax, sustained reading and
specialist vocabulary. Ninety-seven books have separate image descriptions for
every page, 19 have partial coverage and 111 have only prose-derived descriptions.

## Leveling method

[Learning A–Z's published text complexity model](https://www.readinga-z.com/evaluating-text-complexity/)
informs the review dimensions: predictability, organization, visual support,
language clarity, knowledge load and reader/task considerations, alongside literal
text statistics. Its proprietary official leveling process was not run. We do not
copy an old level or convert a word count into a letter.

These local descriptors make the estimates usable; they are not publisher
cutoffs. Length can raise sustained-reading demands, while difficult concepts or
specialist words can raise a short text's level. Each assignment uses the combined
evidence, so word-count ranges intentionally overlap.

| App level | Typical reading demands in this catalogue |
| --- | --- |
| A | Very short concrete clauses or predictable noun/action patterns; repeated familiar words and direct outcomes. |
| B | Short sentences with small pattern changes, broader concrete vocabulary and a simple action/consequence link. |
| C | Varied short sentence shapes, occasional paired sentences or dialogue, broader topic vocabulary and explicitly linked actions or comparisons. |
| D | Longer dialogue/action sequences, several linked steps, introductory topic relationships or a fair clue/perspective change. |
| E | Sustained realistic narrative or connected explanation with varied clauses, temporal shifts and supported motive or causal inference. |
| F | Richer narrative or specialist scientific explanation; multiple relationships, broader knowledge and substantial vocabulary demands. |
| G | Extended paragraphs with compound/subordinate sentences, several characters, clues or magical rules and sustained inference across a full story. |
| H | The most sustained picture-book text in this catalogue, with a longer investigation and scientific/social explanations embedded in dialogue. |

Existing instructional `book.level`, phonics eligibility, reading mode, completion
milestones and local teacher placement overrides stay separate. In particular,
`READ_ALOUD` remains a supported read-together book even when its text has an app
level. The Story Bible's existing A/B/C language contracts still govern manuscripts;
these additional shelf bands do not rewrite those contracts or change learner placement.

## Literal metrics and stale reviews

Metrics count the current approved, active runtime pages. Titles, navigation and
teacher prompts are excluded from word and sentence counts. Words include numbers;
apostrophe forms and hyphenated compounds count as one token. Em dashes separate
words. A punctuated sound effect and a final unpunctuated fragment each count as a
sentence unit. Common honorific and decimal periods do not split sentence units.
These conventions make counts reproducible; sentence-unit averages are not a
linguistic parse, syllable model, word-frequency norm or difficulty score.

The dataset includes word/unique-word counts, lexical diversity, word length,
words per page, sentence-unit lengths, literal repetition, dialogue/question pages
and image-path/independent-description coverage. Neither coverage count proves
visual support quality.

Each authored review is pinned to the exact title and ordered page numbers/text
using a browser-compatible FNV-1a fingerprint. An external SHA-256 hash records the
same serialization. Neither generated metrics nor a copied old rationale can
silently approve changed text: the generator fails on a missing/stale review, and
the browser accessor returns a pending level with no stale metrics or Lexile value.
Changing the title, page order, wording or runtime page subset requires review.

Generate/check with:

```sh
node tools/generateGuidedReadingTextAnalysis.mjs
node tools/generateGuidedReadingTextAnalysis.mjs --check
node tools/generateGuidedReadingTextAnalysis.mjs --report
node --test tests/unit/guidedReadingTextAnalysis.test.js
```

The optional CSV report is written to ignored
`.artifacts/book-level-analysis/guided-reading-level-analysis.csv`.

## Official Lexile measures

The user chose to leave official Lexile scores pending until authorized measuring
access exists. No value is estimated from app bands, age, sentence length,
readability formulas or RAZ correlation charts.

[MetaMetrics' Text Analyzer guide](https://hub.lexile.com/text-analyzer-user-guide/)
requires its Content Creator service for commercial specific text measures.
[Its preparation and authorization guide](https://hub.lexile.com/tool-user-guide/)
says classroom analyzer estimates may not be publicly distributed or entered into
a catalogue. It also distinguishes text complexity from a child's reading ability.
Consequently the public classroom analyzer is not an acceptable source for app scores.

The exact blocker is an authorized MetaMetrics commercial measurement receipt for
each exact manuscript and permission to publish that result. The app shows
**Lexile pending** until a receipt is imported into
`src/data/guidedReadingLexileMeasures.js`. A receipt must contain:

```js
{
  measure: "250L", // or BR100L; a specific provider measure, not a range
  provider: "MetaMetrics",
  measurementType: "authorized-commercial", // or "certified" when certified
  measuredAt: "2026-10-01",
  receiptReference: "Publisher measurement receipt identifier or safe document path",
  textHash: "sha256:<exact current generated hash>",
  authorizedForPublication: true
}
```

Generator validation checks the receipt's structure, exact text hash and declared
publication authorization. It cannot authenticate a receipt or independently
certify a measure; the importing editor must retain and verify the actual provider
receipt. Certification must never be inferred from the fact that validation passed.
Do not include credentials or account tokens in a reference. Changed text makes
both the editorial band and the measurement unavailable until their respective
review and measurement requirements are satisfied again.
