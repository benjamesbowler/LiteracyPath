# World Discovery

Status: both fifty-book cohorts are registered, for 100 books. Current text and
media fingerprints are enforced by the release checks below. The original
fifty-book source and media remain immutable. Registration and publication are
separate: full app, release and live-deployment verification remain required. The
[cohort registration contract](WORLD_DISCOVERY_COHORT_REGISTRATION.md) owns
expansion paths, immutable-original checks and activation mechanics.

The collection has 100 original books: twenty each at public App levels
A, B, C, D and E. Each ten-book cohort contains identity, relationships, community, fantasy,
geography, space, animals, life cycles, classification and caring for our world.
Fantasy is explicitly fiction. Information books use connected inquiries and
checked factual sources. These are predictable/levelled readers, not cumulative
decodables; interest ages 4–8 are separate from text complexity.

The Story Bible Parts I and II, illustration style standard, exact Leda narration
contract, reading-level authority and continuous pass-by-exception policy apply.
There is no change to existing books, placement, scores or quarantine behavior.

## Manuscript and production authority

`src/content/world-discovery/level-a.json` through `level-e.json` hold complete
ordered manuscripts, scene/state ledgers, factual evidence, discussion support
and editorial level rationales. `src/data/guidedReadingWorldDiscoveryBooks.js`
adapts the reviewed sources; `reviews.json` binds independent public-level and
complete-book editorial reviews to exact manuscript and media fingerprints.
Each book has its own
cover and a distinct illustration for every page. Full sequences require visual
review against their text before publication. Generated media is not approval.

Original IDs are `world-discovery-a-01` through `world-discovery-e-10`.
Expansion IDs run from 11 through 20 in each public band, forming one additional
ten-strand cohort. The final digit cycle refers to the ten strands above;
every book still needs a distinct original story or connected inquiry. Image paths are
`/guided-reading/world-discovery/a-01/cover.webp` and `page-01.webp`, etc.

Use 8 pages for A–C and 10 pages for D–E unless an editorial need requires a
different count within the governing band. A uses internal A (maximum 6 words
per page), B internal B (maximum 14), and C–E internal C standard (maximum 22).
Higher public bands come from actual syntax, concept relationships, sustained
meaning and inference, not inflated word counts or a copied requested letter.
Full-text independent calibration must confirm each requested band.

## Original cast and world lock

World: World Discovery, ordinary contemporary homes, school, park and community.
No cultural costumes, flags, religious or political settings. Factual animals
have natural anatomy and behavior. Facts never depend on the fantasy rules.

- **WD-KIT / Kit**: human boy, about six, warm light-medium golden skin, short
  straight black hair with a side part, teal short-sleeved shirt, mustard shorts,
  navy sneakers. Compact child proportions. Likes building and testing; tends
  to try the obvious fix first. No glasses, hat, logos or clothing changes.
- **WD-ZOE / Zoe**: human girl, about six, deep brown skin, black hair in two
  round puffs, yellow short-sleeved shirt beneath plum overalls, white sneakers.
  Same standing height as Kit. Notices small differences and likes drawing;
  can be impatient about sharing her tools. No changing hairstyles or clothes.

The locked model sheet must be generated and inspected before page production.
It includes orthographic/three-quarter views, ordinary poses and expressions,
palette and equal-height lineup. Use its actual file as an image reference in
every recurring-cast generation. Adults may remain unnamed and appear only
where needed, with their exact appearance and relative scale locked per book.
No other named recurring cast is introduced without extending this authority.

Fantasy books may establish one concrete magical object/rule near their opening.
The protagonist must act within that rule; unexplained magic cannot solve a
problem. Name the rule and persistent prop state in the manuscript metadata.

## Required per-book source fields

Each JSON array entry contains `id`, `number` (1–10 for the original set;
11–20 for the declared expansion cohort), `title`, `topic`, `type`
(`fiction` or `nonfiction`), `appLevel`, `level`, `readingBandProfile`,
`readingMode`, `interestAge`, `storyBibleReview`, `setting`, `props`,
`coverBrief`, `pages`, `discussion`, `levelRationale`, and `languagePrep`.
Use `standard`, `predictable-levelled`, and `4–8` for the three corresponding
fields. Fiction review includes `kind`, `canonIds`, `storySpine`,
`failedAttempt`, `resolution`; nonfiction includes `kind`, `canonIds` (possibly
empty), `topicQuestion`, `progression`, `synthesis`, `scienceSources` with exact
URLs and supported claims. Any science in fiction also needs checked sources.

Each page has `pageNumber`, exact final `text`, `imageBrief`, `imageAlt`,
`pageDescription`, `state`, `embeddedImageText` (normally empty). Briefs describe
one specific moment, exact subjects/counts/relationships and changing state;
they must not simply repeat prose. Optional `imageLayout` is `scene` (the default),
`integrated-diagram` or `comparison-diagram`. A diagram declaration permits only
the explanatory cutaway, inset, views or stages explicitly specified in its
brief; it never permits a contact sheet or unrequested panels. Only the exact
nonempty `embeddedImageText` may appear as lettering; otherwise art contains no
text. References and covers always contain no text. The production pipeline adds common style
and cast references. Discussion has `oral: {prompt, listenFor}` and
`visual: {page, prompt, lookFor}`. No scored quizzes. `languagePrep` contains a
few `{word, meaning}` entries for oral support, never a decoding claim.

## Acceptance

Complete all fifty manuscripts in each declared cohort, independently check factual claims and levels,
inspect every final cover/page in sequence, generate exact page/title/missing
word Leda audio and verify its integrity, register current fingerprints and
reviews, exercise the collection in the app, pass applicable checks, and publish
the requested library addition. Report browser/automated/direct visual evidence
accurately; do not claim human listening, classroom or physical-device checks.

## Current implementation and evidence

The 100 books contain 880 reading pages and 100 covers, with 100 separate
library-card renditions. World Discovery is a named child-library collection;
public App levels A–E each contain twenty of its books. Teacher browsing, preview,
class reading, word help and oral/visual discussion use the existing reader.

`source-art/world-discovery` retains the locked cast, per-book reference boards,
individual generation/inspection receipts, card review and narration review.
Every cover and page received direct image/sequence inspection; reported anatomy,
prop and scene-continuity defects were repaired and independently rechecked.
The original cohort has 490 new page/title clips and 136 new word clips, using Google Leda;
existing approved word audio is reused. Full decode, signal and independent
recognition checks are documented separately from browser playback. Six
explicit-phoneme clips retain documented recognition ambiguities in
`narration-review.json`; this is not a claim of human listening.

The second cohort uses the canonical sources and complete-book reviews in
`src/content/world-discovery/cohorts/11-20/`. Its 490 final illustrations received
independent full-sequence review after repairs to physical geometry, anatomy,
scene state and framing; all fifty final card renditions were inspected separately.
Its narration inventory contains 1,017 screened clips (490 page/title and 527 word)
and 705 exact prior-cohort reuses. Contextual pronunciations retain exact book/page
bindings. The isolated word `lends` retains a documented recognition ambiguity;
the report preserves the failed negative acoustic control and makes no certified
auditory-identity or human-listening claim. Reported defects remain blocking.

Run `npm run check:world-discovery` for the exact currently registered release contract
and `npm run test:world-discovery` for all pages, narration, word help,
completion, library order, public-level filters, classroom controls and the
current device profiles. Canonical story, level, narration and app-visual
checks remain required. Task-specific rendered, regression and live-deployment
evidence is retained under ignored `.artifacts/world-discovery/`.
Expansion production and verification evidence belongs under
`.artifacts/world-discovery-expansion/`; original evidence is retained unchanged.
