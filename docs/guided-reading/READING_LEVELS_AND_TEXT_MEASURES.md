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

The 29 October 2026 audit read every ordered page of all 247 books in the
current working catalogue, compared neighboring levels across collections, and
reconciled 37 assignments. The release branch contains 227 of those books; the
other 20 are an independently prepared Small Steps addition, reviewed at B and
not published as a side effect of this audit. The ten small shipped/working
manuscript variants were read separately; each version has the same reviewed
letter, with its own exact-text fingerprint.

The checked-in release catalogue has 227 books: **A13, B49, C53, D52, E12,
F33, G14 and H1**. The working catalogue with Small Steps has **A13, B69, C53,
D52, E12, F33, G14 and H1**. Current counts must be derived from the runtime
catalogue and generated analysis; these figures describe this audit only.

This was a Codex full-manuscript editorial review, using actual prose and
available description metadata. It is not a human classroom validation or a new
visual inspection. Some picture descriptions repeat the prose and supply no
independent evidence. Picture support is contextual, not proof of decodability
or image accuracy.

**One public system:** A–H is the only book-complexity letter used in shelves,
reader headings/details, shared reading, assignment/review pickers, daily book
missions, reports and exports. `getPublicBookMetadata()` resolves the current
review by book ID, or validates the full manuscript fingerprint when provided.
Unknown or changed texts show **App level pending**. Saved observation letters,
filename prefixes, source-pack names and local A/B/C placement overrides cannot
supply a public book level. The compact generated discovery index exposes the
same letter, system ID, fingerprint, review date, page/word counts and reading
mode without loading the full manuscripts into the home/report bundle.

The old A/B/C fields remain internal compatibility inputs for existing practice
layout, phonics eligibility and historical progress. They are not another
public book-level scale. A book's App level is not the reader's achievement;
completing a book records completion, not comprehension or proficiency.

## Leveling method

[Learning A–Z's published text complexity model](https://www.readinga-z.com/evaluating-text-complexity/)
informs the review dimensions: predictability, organization, visual support,
language clarity, knowledge load and reader/task considerations, alongside literal
text statistics. Its proprietary official leveling process was not run. We do not
copy an old level or convert a word count into a letter.

These local descriptors make the estimates usable; they are not publisher
cutoffs. Length can raise sustained-reading demands, while difficult concepts or
specialist words can raise a short text's level. Each assignment uses the combined
evidence, so word-count ranges intentionally overlap. An unfamiliar word, elapsed-time
marker, longer page or series name cannot raise a level on its own. Repeated
frames, explicit causal links and the amount of inference are considered together.

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

Existing internal `book.level`, phonics eligibility, reading mode, completion
pools and local placement overrides stay separate from the sole public A–H scale. In particular,
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
npm run check:book-levels
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
